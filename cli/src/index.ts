#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { Command } from 'commander';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { homedir } from 'os';

const OS20_DIR = join(homedir(), '.os20');
const APP_DIR = join(OS20_DIR, 'app');
const REPO_URL = process.env.OS20_REPO_URL || 'https://github.com/omyvnss/os20.git';
const DEFAULT_PORT = 3010;
const ENV_FILE = join(OS20_DIR, '.env');

// Secrets shared with install.sh. Generated once: APP_SECRET encrypts stored
// API keys, so it must never change after the first start.
function ensureEnvFile(): void {
  if (!existsSync(ENV_FILE)) {
    const secret = () => randomBytes(32).toString('hex');
    writeFileSync(
      ENV_FILE,
      `APP_SECRET=${secret()}\nPGDB_ENCRYPTION_KEY=${secret()}\nOS20_LEADGEN_TOKEN=${secret()}\n`,
      { mode: 0o600 },
    );
  }

  copyFileSync(ENV_FILE, join(APP_DIR, '.env'));
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
      const status = execSync(
        `curl -s -o /dev/null -w "%{http_code}" ${url}`,
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
    if (process.platform === 'darwin') execSync(`open "${url}"`);
    else if (process.platform === 'win32') execSync(`start "" "${url}"`);
    else execSync(`xdg-open "${url}"`)
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
    execSync(`git clone --depth 1 ${REPO_URL} "${APP_DIR}"`, {
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
function backupDatabase(): string | null {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = join(BACKUP_DIR, `os20-${stamp}.sql.gz`);

  try {
    execSync(
      `docker compose exec -T db pg_dump -U postgres -d os20 --clean --if-exists | gzip > "${file}"`,
      { cwd: APP_DIR, stdio: ['ignore', 'ignore', 'inherit'], shell: '/bin/sh' },
    );
  } catch {
    return null;
  }

  readdirSync(BACKUP_DIR)
    .filter((name) => name.endsWith('.sql.gz'))
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
    const port = options.port;
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
  .action(() => {
    console.log('\n  📦 Updating OS20...\n');

    if (!ensureApp()) {
      process.exit(1);
    }

    const backup = backupDatabase();

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
  .action(() => {
    const backup = backupDatabase();

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
  .action((file: string) => {
    if (!existsSync(file)) {
      console.error(`\n  ❌ File not found: ${file}\n`);
      process.exit(1);
    }

    try {
      execSync('docker compose stop os20 os20-worker', {
        cwd: APP_DIR,
        stdio: 'inherit',
      });
      execSync(
        `gunzip -c "${file}" | docker compose exec -T db psql -q -U postgres -d os20`,
        { cwd: APP_DIR, stdio: ['ignore', 'ignore', 'inherit'], shell: '/bin/sh' },
      );
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

program.parse();
