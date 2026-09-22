#!/usr/bin/env node

import { spawn, execFileSync, execSync } from 'child_process';
import { Command } from 'commander';
import {
  chmodSync,
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { randomBytes } from 'crypto';
import { join, resolve } from 'path';
import { homedir } from 'os';

const OS20_DIR = join(homedir(), '.os20');
const APP_DIR = join(OS20_DIR, 'app');
const REPO_URL = process.env.OS20_REPO_URL || 'https://github.com/omyvnss/os20.git';
const DEFAULT_PORT = 3010;
const ENV_FILE = join(OS20_DIR, '.env');

// Secrets shared with install.sh. Generated once: APP_SECRET encrypts stored
// API keys, so it must never change after the first start. An existing .env
// only gets the required keys it is missing (older installs had no
// OS20_LEADGEN_TOKEN); values that are already set are never touched.
// PGDB_ENCRYPTION_KEY is only created for a brand-new .env: on an existing
// install an empty value means older saved keys used the built-in legacy key,
// and a new value would make them unreadable.
function ensureEnvFile(): void {
  const isNew = !existsSync(ENV_FILE);
  const required = isNew
    ? ['APP_SECRET', 'PGDB_ENCRYPTION_KEY', 'OS20_LEADGEN_TOKEN']
    : ['APP_SECRET', 'OS20_LEADGEN_TOKEN'];
  const original = isNew ? '' : readFileSync(ENV_FILE, 'utf8');
  let content = original;

  for (const key of required) {
    if (new RegExp(`^[ \\t]*${key}=\\S`, 'm').test(content)) {
      continue;
    }

    // Drop an empty "KEY=" line so the new value is the only one.
    content = content.replace(new RegExp(`^[ \\t]*${key}=.*(\\r?\\n|$)`, 'gm'), '');

    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n';
    }

    content += `${key}=${randomBytes(32).toString('hex')}\n`;
  }

  if (isNew || content !== original) {
    writeFileSync(ENV_FILE, content, { mode: 0o600 });
  }

  chmodSync(ENV_FILE, 0o600);

  const appEnv = join(APP_DIR, '.env');
  copyFileSync(ENV_FILE, appEnv);
  chmodSync(appEnv, 0o600);
}

// Runs `first | second` without a shell, so file names and other arguments are
// never parsed as shell syntax. With `outputFile`, the output of `second` is
// written there (mode 0600). Resolves true only when both commands exit 0.
function runPipeline(
  first: { cmd: string; args: string[] },
  second: { cmd: string; args: string[] },
  options: { cwd?: string; outputFile?: string } = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    let pending = options.outputFile ? 3 : 2;
    let ok = true;
    const done = (success: boolean) => {
      ok = ok && success;
      pending -= 1;

      if (pending === 0) {
        resolve(ok);
      }
    };

    const a = spawn(first.cmd, first.args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
    const b = spawn(second.cmd, second.args, {
      cwd: options.cwd,
      stdio: ['pipe', options.outputFile ? 'pipe' : 'ignore', 'inherit'],
    });

    // Report each process once, whether it fails to start or exits.
    const watch = (child: ReturnType<typeof spawn>) => {
      let reported = false;
      const report = (success: boolean) => {
        if (!reported) {
          reported = true;
          done(success);
        }
      };

      child.on('error', () => report(false));
      child.on('close', (code) => report(code === 0));
    };

    watch(a);
    watch(b);

    // If the second command exits early the pipe breaks; its exit code decides.
    b.stdin?.on('error', () => undefined);
    a.stdout?.on('error', () => undefined);
    a.stdout?.pipe(b.stdin!);
    a.on('error', () => b.stdin?.end());

    if (options.outputFile) {
      const out = createWriteStream(options.outputFile, { mode: 0o600 });
      let reported = false;
      const report = (success: boolean) => {
        if (!reported) {
          reported = true;
          done(success);
        }
      };

      out.on('error', () => report(false));
      out.on('close', () => report(true));
      b.stdout?.pipe(out);
      b.on('error', () => out.end());
    }
  });
}

function checkDocker(): boolean {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    execSync('docker compose version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkGit(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function waitForReady(
  url: string,
  timeoutMs: number,
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const status = execFileSync(
        'curl',
        ['-s', '-o', '/dev/null', '-w', '%{http_code}', url],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();

      if (status === '200') {
        return true;
      }
    } catch {
      // not up yet, keep polling
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return false;
}

function openBrowser(url: string): void {
  try {
    if (process.platform === 'darwin') execFileSync('open', [url]);
    else if (process.platform === 'win32')
      execFileSync('cmd', ['/c', 'start', '', url]);
    else execFileSync('xdg-open', [url]);
  } catch {
    console.log(`\n  Open ${url} in your browser`);
  }
}

function ensureApp(): boolean {
  if (existsSync(APP_DIR)) {
    return true;
  }

  console.log('  📦 Cloning OS20...');

  if (!checkGit()) {
    console.error('  ❌ Git not found. Please install Git: https://git-scm.com');
    return false;
  }

  try {
    execFileSync('git', ['clone', '--depth', '1', REPO_URL, APP_DIR], {
      stdio: 'inherit',
    });
  } catch {
    console.error(`  ❌ Failed to clone ${REPO_URL}`);
    return false;
  }

  return true;
}

const BACKUP_DIR = join(OS20_DIR, 'backups');
const BACKUPS_TO_KEEP = 5;

// The database lives in a Docker volume that survives updates. A dump before
// every update is the safety net if a new version ever breaks something.
// Backups hold the whole CRM, so the folder is 0700 and each file 0600.
async function backupDatabase(): Promise<string | null> {
  mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
  chmodSync(BACKUP_DIR, 0o700);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = join(BACKUP_DIR, `os20-${stamp}.sql.gz`);

  const ok = await runPipeline(
    {
      cmd: 'docker',
      args: [
        'compose', 'exec', '-T', 'db',
        'pg_dump', '-U', 'postgres', '-d', 'os20', '--clean', '--if-exists',
      ],
    },
    { cmd: 'gzip', args: [] },
    { cwd: APP_DIR, outputFile: file },
  );

  if (!ok) {
    if (existsSync(file)) {
      unlinkSync(file);
    }

    return null;
  }

  chmodSync(file, 0o600);

  const backups = readdirSync(BACKUP_DIR).filter((name) =>
    name.endsWith('.sql.gz'),
  );

  // Older versions wrote backups with the default umask; tighten them too.
  backups.forEach((name) => chmodSync(join(BACKUP_DIR, name), 0o600));

  backups
    .sort()
    .slice(0, -BACKUPS_TO_KEEP)
    .forEach((name) => unlinkSync(join(BACKUP_DIR, name)));

  return file;
}

const program = new Command();

program
  .name('os20')
  .description('OS20 — Open Source CRM. One command to install.')
  .version('1.0.0');

program
  .command('start', { isDefault: true })
  .description('Start OS20 CRM')
  .option('-p, --port <port>', 'Port for the CRM', String(DEFAULT_PORT))
  .action(async (options) => {
    const port = String(options.port);

    if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
      console.error(`\n  ❌ Invalid port: ${port}. Use a number from 1 to 65535.\n`);
      process.exit(1);
    }

    const url = `http://localhost:${port}`;

    console.log('\n  🚀 Starting OS20...\n');

    if (!checkDocker()) {
      console.error('  ❌ Docker not found. Please install Docker Desktop:');
      console.error('     https://docs.docker.com/get-docker/\n');
      process.exit(1);
    }

    if (!existsSync(OS20_DIR)) {
      mkdirSync(OS20_DIR, { recursive: true });
    }

    if (!ensureApp()) {
      process.exit(1);
    }

    ensureEnvFile();

    console.log('  🐳 Starting services...');
    try {
      execSync('docker compose up -d', { cwd: APP_DIR, stdio: 'inherit' });
    } catch {
      console.error('  ❌ Failed to start Docker services.');
      process.exit(1);
    }

    console.log('\n  ⏳ Waiting for OS20 to be ready...');
    const ready = await waitForReady(url, 120000);

    if (ready) {
      console.log(`\n  ✅ OS20 is running at ${url}\n`);
      openBrowser(url);
    } else {
      console.log(`\n  ⚠️  OS20 is starting but not ready yet.`);
      console.log(`     Open ${url} in your browser.\n`);
    }
  });

program
  .command('stop')
  .description('Stop OS20 CRM')
  .action(() => {
    console.log('\n  🛑 Stopping OS20...\n');
    try {
      execSync('docker compose stop', { cwd: APP_DIR, stdio: 'inherit' });
      console.log('  ✅ OS20 stopped.\n');
    } catch {
      console.error(`  ❌ Failed to stop OS20. Is it in ${APP_DIR}?\n`);
    }
  });

program
  .command('status')
  .description('Check OS20 status')
  .action(() => {
    try {
      execSync('docker compose ps', { cwd: APP_DIR, stdio: 'inherit' });
    } catch {
      console.log('\n  OS20 is not running. Start it with: os20 start\n');
    }
  });

program
  .command('logs')
  .description('View OS20 logs')
  .option('-f, --follow', 'Follow logs')
  .action((options) => {
    const args = options.follow
      ? ['compose', 'logs', '-f']
      : ['compose', 'logs'];
    const child = spawn('docker', args, { cwd: APP_DIR, stdio: 'inherit' });

    child.on('error', () => {
      console.log('\n  OS20 is not set up. Run: os20 start\n');
    });
  });

program
  .command('update')
  .description('Update OS20 to latest version')
  .action(async () => {
    console.log('\n  📦 Updating OS20...\n');

    if (!ensureApp()) {
      process.exit(1);
    }

    const backup = await backupDatabase();

    if (backup) {
      console.log(`  💾 Backup saved: ${backup}\n`);
    } else {
      console.log('  ⚠️  No backup made (OS20 is not running). Continuing.\n');
    }

    try {
      execSync('git pull --ff-only', { cwd: APP_DIR, stdio: 'inherit' });
      ensureEnvFile();
      execSync('docker compose pull', {
        cwd: APP_DIR,
        stdio: 'inherit',
      });
      execSync('docker compose up -d', {
        cwd: APP_DIR,
        stdio: 'inherit',
      });
      console.log('\n  ✅ OS20 updated!\n');
    } catch {
      console.error('\n  ❌ Failed to update OS20.\n');
    }
  });

program
  .command('backup')
  .description('Save a backup of your OS20 data')
  .action(async () => {
    const backup = await backupDatabase();

    if (backup) {
      console.log(`\n  💾 Backup saved: ${backup}\n`);
    } else {
      console.error('\n  ❌ Backup failed. Is OS20 running? Try: os20 start\n');
      process.exit(1);
    }
  });

program
  .command('restore <file>')
  .description('Restore OS20 data from a backup file')
  .action(async (file: string) => {
    if (!existsSync(file)) {
      console.error(`\n  ❌ File not found: ${file}\n`);
      process.exit(1);
    }

    // The commands run inside APP_DIR, so resolve the path the user gave first.
    const backupFile = resolve(file);

    try {
      execSync('docker compose stop os20 os20-worker', {
        cwd: APP_DIR,
        stdio: 'inherit',
      });
      // gunzip -c <file> | docker compose exec -T db psql, with no shell.
      const restored = await runPipeline(
        { cmd: 'gunzip', args: ['-c', '--', backupFile] },
        {
          cmd: 'docker',
          args: ['compose', 'exec', '-T', 'db', 'psql', '-q', '-U', 'postgres', '-d', 'os20'],
        },
        { cwd: APP_DIR },
      );

      if (!restored) {
        throw new Error('restore pipeline failed');
      }

      execSync('docker compose up -d', { cwd: APP_DIR, stdio: 'inherit' });
      console.log('\n  ✅ Restored. OS20 is starting again.\n');
    } catch {
      console.error('\n  ❌ Restore failed.\n');
      process.exit(1);
    }
  });

program
  .command('reset')
  .description('Reset OS20 (delete all data)')
  .action(() => {
    console.log('\n  ⚠️  This will delete ALL OS20 data.\n');
    try {
      execSync('docker compose down -v', { cwd: APP_DIR, stdio: 'inherit' });
      console.log('  ✅ OS20 reset. Run "os20 start" to begin fresh.\n');
    } catch {
      console.error('  ❌ Failed to reset OS20.\n');
    }
  });

program.parseAsync().catch((error) => {
  console.error(error);
  process.exit(1);
});
