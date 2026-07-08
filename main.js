const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

// Check if running in development or production
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0e1a',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'TradeVault - Pro Trading Journal',
  });

  // Load appropriate URL based on environment
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Load the built React app
    mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});