import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import process from 'node:process';

// 1. Manually define __dirname (Required for "type": "module" in package.json)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Determine if we are in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // Allows Node.js APIs in the frontend
      contextIsolation: false, // Required for your specific project setup
    }
  });

  if (isDev) {
    // 3. During development, load the Vite server
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools(); // Optional: opens developer tools for debugging
  } else {
    // 4. In production, load the built HTML file from the 'dist' folder
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// 5. Start the app when Electron is ready
app.whenReady().then(createWindow);

// 6. Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});