import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { merge } from 'rxjs/observable/merge';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { FileDataStore, IDataStore } from './server/datastore';

interface IState {
  fullscreen: boolean;
  maximized: boolean;
  options: Partial<BrowserWindowConstructorOptions>;
}

/**
 * ElectronWindowState stores and restores window position information.
 */
export class ElectronWindowState {
  /**
   * Where window position preferences are stored in the IDataStore.
   */
  public static readonly storeKey = 'window-position';

  constructor(private readonly store: IDataStore = new FileDataStore()) {}

  /**
   * Loads the stored window configuration.
   */
  public async restore(): Promise<Partial<BrowserWindowConstructorOptions>> {
    return (await this.loadState()).options;
  }

  /**
   * Watches for position changes in the window, saving preferences when
   * the window is moved or closed.
   */
  public async watch(window: BrowserWindow) {
    const state = await this.loadState();
    if (state.maximized) {
      window.maximize();
    }
    if (state.fullscreen) {
      window.setFullScreen(true);
    }

    merge(fromEvent(window, 'resize'), fromEvent(window, 'move'))
      .pipe(takeUntil(fromEvent(window, 'closed')), debounceTime(500))
      .subscribe(async () => this.saveState(window));
  }

  private async saveState(window: BrowserWindow): Promise<void> {
    await this.store.saveGlobal<IState>(ElectronWindowState.storeKey, {
      fullscreen: window.isFullScreen(),
      maximized: window.isMaximized(),
      options: window.getBounds(),
    });
  }

  private async loadState(): Promise<IState> {
    return this.store.loadGlobal<IState>(ElectronWindowState.storeKey, {
      fullscreen: false,
      maximized: false,
      options: {},
    });
  }
}
