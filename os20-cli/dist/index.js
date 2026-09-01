#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const OS20_DIR = (0, path_1.join)((0, os_1.homedir)(), '.os20');
const APP_DIR = (0, path_1.join)(OS20_DIR, 'app');
const REPO_URL = process.env.OS20_REPO_URL || 'https://github.com/omyvnss/os20.git';
const DEFAULT_PORT = 3010;
function checkDocker() {
    try {
        (0, child_process_1.execSync)('docker --version', { stdio: 'ignore' });
        (0, child_process_1.execSync)('docker compose version', { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
function checkGit() {
    try {
        (0, child_process_1.execSync)('git --version', { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
async function waitForReady(url, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const status = (0, child_process_1.execSync)(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
            if (status === '200') {
                return true;
            }
        }
        catch {
            // not up yet, keep polling
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    return false;
}
function openBrowser(url) {
    try {
        if (process.platform === 'darwin')
            (0, child_process_1.execSync)(`open "${url}"`);
        else if (process.platform === 'win32')
            (0, child_process_1.execSync)(`start "" "${url}"`);
        else
            (0, child_process_1.execSync)(`xdg-open "${url}"`);
    }
    catch {
        console.log(`\n  Open ${url} in your browser`);
    }
}
function ensureApp() {
    if ((0, fs_1.existsSync)(APP_DIR)) {
        return true;
    }
    console.log('  📦 Cloning OS20...');
    if (!checkGit()) {
        console.error('  ❌ Git not found. Please install Git: https://git-scm.com');
        return false;
    }
    try {
        (0, child_process_1.execSync)(`git clone --depth 1 ${REPO_URL} "${APP_DIR}"`, {
            stdio: 'inherit',
        });
    }
    catch {
        console.error(`  ❌ Failed to clone ${REPO_URL}`);
        return false;
    }
    return true;
}
const program = new commander_1.Command();
program
    .name('os20')
    .description('OS20 — Open Source CRM. One command to install.')
    .version('1.0.0');
program
    .command('start')
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
    if (!(0, fs_1.existsSync)(OS20_DIR)) {
        (0, fs_1.mkdirSync)(OS20_DIR, { recursive: true });
    }
    if (!ensureApp()) {
        process.exit(1);
    }
    console.log('  🐳 Starting services...');
    try {
        (0, child_process_1.execSync)('docker compose up -d', { cwd: APP_DIR, stdio: 'inherit' });
    }
    catch {
        console.error('  ❌ Failed to start Docker services.');
        process.exit(1);
    }
    console.log('\n  ⏳ Waiting for OS20 to be ready...');
    const ready = await waitForReady(url, 120000);
    if (ready) {
        console.log(`\n  ✅ OS20 is running at ${url}\n`);
        openBrowser(url);
    }
    else {
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
        (0, child_process_1.execSync)('docker compose stop', { cwd: APP_DIR, stdio: 'inherit' });
        console.log('  ✅ OS20 stopped.\n');
    }
    catch {
        console.error(`  ❌ Failed to stop OS20. Is it in ${APP_DIR}?\n`);
    }
});
program
    .command('status')
    .description('Check OS20 status')
    .action(() => {
    try {
        (0, child_process_1.execSync)('docker compose ps', { cwd: APP_DIR, stdio: 'inherit' });
    }
    catch {
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
    const child = (0, child_process_1.spawn)('docker', args, { cwd: APP_DIR, stdio: 'inherit' });
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
    try {
        (0, child_process_1.execSync)('git pull --ff-only', { cwd: APP_DIR, stdio: 'inherit' });
        (0, child_process_1.execSync)('docker compose up -d --build', {
            cwd: APP_DIR,
            stdio: 'inherit',
        });
        console.log('\n  ✅ OS20 updated!\n');
    }
    catch {
        console.error('\n  ❌ Failed to update OS20.\n');
    }
});
program
    .command('reset')
    .description('Reset OS20 (delete all data)')
    .action(() => {
    console.log('\n  ⚠️  This will delete ALL OS20 data.\n');
    try {
        (0, child_process_1.execSync)('docker compose down -v', { cwd: APP_DIR, stdio: 'inherit' });
        console.log('  ✅ OS20 reset. Run "os20 start" to begin fresh.\n');
    }
    catch {
        console.error('  ❌ Failed to reset OS20.\n');
    }
});
program.parse();
//# sourceMappingURL=index.js.map