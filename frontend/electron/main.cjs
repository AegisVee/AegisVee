const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
    const isDev = !app.isPackaged;
    const iconPath = isDev
        ? path.join(__dirname, '../public/aegisvee.svg')
        : path.join(process.resourcesPath, 'aegisvee.svg');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'AegisVee',
        icon: iconPath,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startBackend() {
    const isDev = !app.isPackaged;
    let backendPath;
    let cwd;

    if (isDev) {
        // In dev, run python script directly
        // Using user provided path
        backendPath = 'C:\\Users\\DJTim\\anaconda3\\envs\\aegis-vee\\python.exe';
        const args = ['../backend/main.py'];
        cwd = path.join(__dirname, '../../backend');

        console.log('Starting backend in dev mode...');
        backendProcess = spawn(backendPath, args, { cwd: cwd, shell: true });
    } else {
        // In prod, run the executable
        // The executable should be in resources/backend/backend.exe
        // process.resourcesPath points to 'resources' dir in the installed app
        backendPath = path.join(process.resourcesPath, 'backend', 'backend.exe');
        cwd = path.join(process.resourcesPath, 'backend');

        console.log('Starting backend in prod mode...', backendPath);
        backendProcess = spawn(backendPath, [], { cwd: cwd });
    }

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend stdout: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend stderr: ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });
}

function killBackend() {
    if (backendProcess) {
        console.log('Killing backend process...');
        backendProcess.kill();
        backendProcess = null;
    }
}

app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        killBackend();
        app.quit();
    }
});

app.on('before-quit', () => {
    killBackend();
});
