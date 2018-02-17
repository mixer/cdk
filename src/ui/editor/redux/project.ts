import { Injectable } from '@angular/core';
import { ActionReducer, Store } from '@ngrx/store';

import { IStateDump } from '@mcph/miix-std/dist/internal';
import { IFilter } from '../console/console.service';
import * as Code from './code';
import * as Connect from './connect';
import * as Console from './console';
import * as Frame from './frame';
import * as Sync from './sync';

const storedKeys: (keyof IProject)[] = ['frame', 'code', 'sync', 'console'];

/**
 * IProject is the application state for the project.
 */
export interface IProject {
  frame: Frame.IFrameState;
  code: Code.ICodeState;
  connect: Connect.IConnectState;
  sync: Sync.ISyncState;
  console: Console.IConsoleState;
}

export enum MetaActions {
  ReplaceState = 'META_REPLACE_STATE',
}

/**
 * ProjectService provides notation on the IProject state.
 */
@Injectable()
export class ProjectService {
  constructor(private store: Store<IProject>) {}

  /**
   * Applies a direct partial update to the state.
   */
  public replaceState(data: Partial<IProject>, omitSave: boolean = false) {
    this.store.dispatch({ type: MetaActions.ReplaceState, data, omitSave });
  }

  // Frame actions ------------------------------------------------------------

  /**
   * Change whether the controls are ready.
   */
  public setControlsReady(isReady: boolean) {
    this.store.dispatch({ type: Frame.Action.SetReady, isReady });
  }

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

  /**
   * Sets whether the frame is masked (covered by a transparent overlay).
   * Useful when dragging thing.
   */
  public setFrameMasked(isMasked: boolean) {
    this.store.dispatch({ type: Frame.Action.Mask, isMasked });
  }

  // Code actions -------------------------------------------------------------

  /**
   * Updates the controls tab/state.
   */
  public setCodeState(state: Code.CodeState) {
    this.store.dispatch({ type: Code.Action.SetState, state });
  }

  /**
   * Updates the width of the code block, in pixels.
   */
  public setCodeWidth(width: number) {
    this.store.dispatch({ type: Code.Action.Resize, width });
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

  // Console actions ----------------------------------------------------------

  public setConsoleFilter(filter: IFilter) {
    this.store.dispatch({ type: Console.Action.SetFilter, filter });
  }
}

/**
 * Initial state of the project.
 */
const initialState: IProject = {
  frame: Frame.initialState,
  code: Code.initialState,
  connect: Connect.initialState,
  sync: Sync.initialState,
  console: Console.initialState,
};

/**
 * localStorageReduxer is a metareducer that saves changes to localstorage.
 */
export function setInitialState(
  reducer: ActionReducer<IProject, any>,
): ActionReducer<IProject, any> {
  return (project, action) => reducer(project || initialState, action);
}

/**
 * localStorageReduxer is a metareducer that saves changes to localstorage.
 */
export function replaceStateReducer(
  reducer: ActionReducer<IProject, any>,
): ActionReducer<IProject, any> {
  return (project, action) => {
    const next = reducer(project, action);
    if (action.type === MetaActions.ReplaceState) {
      return {
        ...next,
        ...action.data,
        frame: {
          ...next.frame,
          ...action.data.frame,
          width: next.frame.width,
          height: next.frame.height,
        },
        code: {
          ...next.code,
          ...action.data.code,
          state: next.code.state,
        },
      };
    }

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
  console: Console.reducer,
};

/**
 * ngrx metareducers
 */
export const metaReducers = [setInitialState, replaceStateReducer];

/**
 * Returns the partial part of the project which should be saved.
 */
export function getStoredData(project: IProject): Partial<IProject> {
  const plucked: Partial<IProject> = {};
  storedKeys.forEach(key => {
    plucked[key] = { ...project[key] };
  });

  return plucked;
}
