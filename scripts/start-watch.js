const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.join(__dirname, '..');
const versionFile = path.join(rootDir, 'tmp', 'watch-version.txt');
const watchTargets = [
    path.join(rootDir, 'app.js'),
    path.join(rootDir, 'app'),
    path.join(rootDir, 'data')
];

const env = {
    ...process.env,
    DOTENV_CONFIG_PATH: '.env',
    NODE_ENV: 'development',
    USE_MOCK_DB: 'false',
    WATCH_RELOAD: 'true'
};

fs.mkdirSync(path.dirname(versionFile), { recursive: true });

let child = null;
let restartPending = false;
let restartTimer = null;

const writeVersion = () => {
    fs.writeFileSync(versionFile, String(Date.now()), 'utf8');
};

const startServer = () => {
    child = spawn(process.execPath, ['app.js'], {
        cwd: rootDir,
        env,
        stdio: 'inherit'
    });

    child.on('exit', (code, signal) => {
        if (restartPending) {
            return;
        }

        if (signal || code !== 0) {
            process.exitCode = code || 1;
        }
    });
};

const stopServer = () => {
    if (child && !child.killed) {
        child.kill();
    }
};

const restartServer = () => {
    restartPending = true;
    writeVersion();
    stopServer();

    setTimeout(() => {
        restartPending = false;
        startServer();
    }, 250);
};

const scheduleRestart = () => {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(restartServer, 150);
};

const shouldIgnore = (changedPath) => {
    const normalized = changedPath.split(path.sep).join('/');
    return normalized.includes('/node_modules/')
        || normalized.includes('/coverage/')
        || normalized.includes('/test-results/')
        || normalized.includes('/tmp/')
        || normalized.includes('/.git/');
};

const watchTarget = (target) => {
    const stats = fs.statSync(target);

    if (stats.isFile()) {
        fs.watchFile(target, { interval: 250 }, () => {
            scheduleRestart();
        });
        return;
    }

    fs.watch(target, { recursive: true }, (eventType, filename) => {
        if (!filename) {
            scheduleRestart();
            return;
        }

        const absolutePath = path.join(target, filename);
        if (shouldIgnore(absolutePath)) {
            return;
        }

        scheduleRestart();
    });
};

writeVersion();
startServer();

watchTargets.forEach(watchTarget);

const shutdown = () => {
    stopServer();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
