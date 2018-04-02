import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fixPath from 'fix-path';

import { ElectronServer } from './server/electron-server';

let window: BrowserWindow | null = null;
let server: ElectronServer;

const isDebug = process.argv.includes('--debug');
fixPath();

function createWindow() {
  window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      webSecurity: false
    }
  });

  window.webContents.openDevTools();

  if (isDebug) {
    window.loadURL(`http://localhost:4200`);
  } else {
    window.loadURL(
      url.format({
        pathname: path.join(__dirname, '../app/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  window.on('closed', () => (window = null));
  window.setMenu(null);

  server = new ElectronServer(window);
  server.start();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  server.tasks.stopAll();

  if (process.platform === 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (window === null) {
    createWindow();
  }
});
