import { app, BrowserWindow, Menu, MenuItem } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fixPath from 'fix-path';
import * as path from 'path';
import * as url from 'url';

import { ElectronServer } from './server/electron-server';

autoUpdater.checkForUpdatesAndNotify();

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
    // tslint:disable-next-line
    require('devtron').install();
    window.webContents.openDevTools();

    let rightClickPosition = { x: 0, y: 0 };

    const menu = new Menu();
    const menuItem = new MenuItem({
      label: 'Inspect Element',
      click: () => {
        if (window) {
          window.webContents.inspectElement(rightClickPosition.x, rightClickPosition.y);
        }
      },
    });
    menu.append(menuItem);

    // tslint:disable-next-line
    window.loadURL(`http://localhost:4200`);

    window.webContents.on('context-menu', (event, input) => {
      event.preventDefault();
      rightClickPosition = { x: input.x, y: input.y };
      menu.popup(window || undefined);
    });
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
