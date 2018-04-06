import { app, BrowserWindow } from 'electron';
import * as fixPath from 'fix-path';
import * as path from 'path';
import * as url from 'url';

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
      webSecurity: false,
    },
  });

  if (isDebug) {
    window.webContents.openDevTools();
    // tslint:disable-next-line
    window.loadURL(`http://localhost:4200`);
  } else {
    window.loadURL(
      url.format({
        pathname: path.join(__dirname, '../app/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );
  }

  window.on('closed', () => (window = null));
  window.setMenu(null);

  server = new ElectronServer(window);
  server.start();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  server
    .stop()
    .catch(() => undefined)
    .then(() => {
      app.quit();
    })
    .catch(() => undefined);
});

app.on('activate', () => {
  if (window === null) {
    createWindow();
  }
});
