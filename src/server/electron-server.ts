import { BrowserWindow, Event, ipcMain } from 'electron';
import { Action } from '@ngrx/store';

import * as forAccount from '../app/editor/account/account.actions';

import { Profile, GrantCancelledError } from './profile';
import { NoAuthenticationError } from './errors';

/**
 * bind attaches listeners for Electron's IPC.
 */
export function bind(window: BrowserWindow) {
  function action(action: Action) {
    window.webContents.send('dispatch', action);
  }

  function method(name: string, fn: (data: any) => Promise<any>) {
    ipcMain.addListener(name, (ev: Event, { id, params }: { id: number, params: any }) => {
      fn(params)
        .then(result => ev.sender.send(name, { id, result }))
        .catch(error => ev.sender.send(name, { id, error }));
    });
  }

  method(forAccount.AccountMethods.LinkAccount, async () => {
    const profile = new Profile();

    let grantCount = 0;
    try {
      await profile.grant({
        prompt: (code, expiresAt) => action(new forAccount.SetLinkCode(code, expiresAt)),
        isCancelled: () => Boolean(grantCount++), // false initially, then true afterwards
      });
      return await profile.user();
    } catch (err) {
      if (!(err instanceof GrantCancelledError)) {
        throw err;
      }

      return null;
    }
  });

  method(forAccount.AccountMethods.GetLinkedAccount, async () => {
    try {
      return await new Profile().user();
    } catch (e) {
      if (e instanceof NoAuthenticationError) {
        return null;
      }

      throw e;
    }
  });

  method(forAccount.AccountMethods.Logout, async () => new Profile().logout());
}
