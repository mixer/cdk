import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Event } from 'electron';

import { State } from './bedrock.reducers';
import { AppConfig } from './editor.config';
import { Electron } from './shared/electron';

/**
 * Simple wrapper around the Electron APIs.
 */
@Injectable()
export class ElectronService {
  private callCounter = 0;

  constructor(store: Store<State>) {
    Electron.ipcRenderer.on('dispatch', (_event: Event, arg: Action) => {
      store.dispatch(arg);
    });
  }

  /**
   * Fires-and-forgets to the host process.
   */
  public emit(channel: string, data?: any): void {
    Electron.ipcRenderer.send(channel, data);

    if (!AppConfig.production) {
      console.debug('emit:', channel, data);
    }
  }

  /**
   * Runs a method call against the server.
   */
  public call<T>(method: string, data?: any): Promise<T> {
    const id = this.callCounter++;

    return new Promise<T>((resolve, reject) => {
      const listener = (_event: Event, result: { id: number; error?: Error; result: T }) => {
        if (result.id !== id) {
          return;
        }

        Electron.ipcRenderer.removeListener(method, listener);
        if (!AppConfig.production) {
          console.debug('repl:', method, result);
        }

        if (result.error) {
          reject(result.error);
        } else {
          resolve(result.result);
        }
      };

      const outgoing = { id, params: data };
      Electron.ipcRenderer.on(method, listener);
      Electron.ipcRenderer.send(method, outgoing);

      if (!AppConfig.production) {
        console.debug('call:', method, data);
      }
    });
  }
}
