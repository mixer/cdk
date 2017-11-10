import { Injectable } from '@angular/core';
import { ActionReducer, Store } from '@ngrx/store';

import { IStateDump } from '@mcph/miix-std/dist/internal';
import * as Code from './code';
import * as Connect from './connect';
import * as Frame from './frame';
import * as Sync from './sync';

const storedKeys: (keyof IProject)[] = ['frame', 'code', 'sync'];

/**
 * IProject is the application state for the project.
 */
export interface IProject {
  frame: Frame.IFrameState;
  code: Code.ICodeState;
  connect: Connect.IConnectState;
  sync: Sync.ISyncState;
}

/**
 * ProjectService provides notation on the IProject state.
 */
@Injectable()
export class ProjectService {
  constructor(private store: Store<IProject>) {}

  // Frame actions ------------------------------------------------------------

  /**
   * Change the selected device.
   */
  public chooseDevice(deviceIndex: number) {
    this.store.dispatch({ type: Frame.Action.Select, index: deviceIndex });
  }

  /**
   * Rotate the device.
   */
  public rotateDevice() {
    this.store.dispatch({ type: Frame.Action.Rotate });
  }

  /**
   * Manually override the device dimensions, called by the user.
   */
  public resizeDevice(width?: number, height?: number) {
    this.store.dispatch({ type: Frame.Action.SetDimensions, width, height, isManual: true });
  }

  /**
   * Sets the displayed dimensions of the device. Called automatically when
   * the device is changed or the window is resized.
   */
  public setDeviceDisplayedSize(width: number, height: number) {
    this.store.dispatch({ type: Frame.Action.SetDimensions, width, height, isManual: false });
  }

  // Code actions -------------------------------------------------------------

  /**
   * Updates the controls tab/state.
   */
  public setCodeState(state: Code.CodeState) {
    this.store.dispatch({ type: Code.Action.SetState, state });
  }

  // Connect actions ---------------------------------------------------------

  /**
   * Updates the active controls state.
   */
  public connectControls(data: Connect.IInteractiveJoin) {
    this.store.dispatch({ type: Connect.Action.Connect, data });
  }

  /**
   * Disconnects the active interactive controls.
   */
  public disconnectControls() {
    this.store.dispatch({ type: Connect.Action.Disconnect });
  }

  /**
   * Updates the connected state.
   */
  public setControlsState(controlsState: IStateDump) {
    this.store.dispatch({ type: Connect.Action.UpdateState, controlsState });
  }

  /**
   * Updates the channel the controls will connect to..
   */
  public setConnectionChannel(channelID: number) {
    this.store.dispatch({ type: Connect.Action.SetChannel, channelID });
  }

  // Sync actions -------------------------------------------------------------

  public syncUnlink() {
    this.store.dispatch({ type: Sync.Action.Unlink });
  }

  public syncLink(interactiveVersion: Sync.IInteractiveVersionWithGame) {
    this.store.dispatch({ type: Sync.Action.Link, version: interactiveVersion });
  }

  public syncDontConfirmSchema() {
    this.store.dispatch({ type: Sync.Action.DontConfirmSchema });
  }
}

/**
 * Initial state of the project.
 */
const initialState: IProject = (() => {
  let parsed: Partial<IProject> = {};
  try {
    const data = localStorage.getItem('last-control-state');
    parsed = data && JSON.parse(data);
  } catch (e) {
    // ignored
  }

  return {
    frame: Frame.initialState,
    code: Code.initialState,
    connect: Connect.initialState,
    sync: Sync.initialState,
    ...parsed,
  };
})();

/**
 * localStorageReduxer is a metareducer that saves changes to localstorage.
 */
export function localStorageReducer(
  reducer: ActionReducer<IProject, any>,
): ActionReducer<IProject, any> {
  return (project = initialState, action) => {
    const next = reducer(project, action);
    const plucked: Partial<IProject> = {};
    storedKeys.forEach(key => {
      plucked[key] = next[key];
    });

    localStorage.setItem('last-control-state', JSON.stringify(plucked));
    return next;
  };
}

/**
 * ngrx store reducers.
 */
export const reducers: { [key in keyof IProject]: Function } = {
  frame: Frame.reducer,
  code: Code.reducer,
  connect: Connect.reducer,
  sync: Sync.reducer,
};

/**
 * ngrx metareducers
 */
export const metaReducers = [localStorageReducer];
