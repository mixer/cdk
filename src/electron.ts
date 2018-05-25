import { app, BrowserWindow, Menu, MenuItem } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fixPath from 'fix-path';
import * as path from 'path';
import * as url from 'url';

import { ElectronWindowState } from './electron-window-state';
import { ElectronServer } from './server/electron-server';

autoUpdater.checkForUpdatesAndNotify().catch(err => err);

let hasOpenWindow = false;
let server: ElectronServer;

const windowState = new ElectronWindowState();
const isDebug = process.argv.includes('--debug');

fixPath();

/**
 * Creates a new BrowserWindow, seeding config from the stored state.
 */
async function createBrowserWindow() {
  return windowState
    .restore()
    .catch(() => ({}))
    .then(
      windowOptions =>
        new BrowserWindow({
          width: 1280,
          height: 720,
          ...windowOptions,
          webPreferences: {
            webSecurity: false,
          },
        }),
    );
}

function setupWindow(window: BrowserWindow) {
  hasOpenWindow = true;
  windowState.watch(window).catch(() => undefined);

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

  window.on('closed', () => (hasOpenWindow = false));
  window.setMenu(null);

  server = new ElectronServer(window);
  server.start();
}

function boot() {
  createBrowserWindow()
    .then(setupWindow)
    .catch(() => undefined);
}

app.on('ready', boot);

app.on('window-all-closed', () => {
  if (!server) {
    return;
  }

  server
    .stop()
    .catch(() => undefined)
    .then(() => {
      app.quit();
    })
    .catch(() => undefined);
});

app.on('activate', () => {
  if (!hasOpenWindow) {
    boot();
  }
});
