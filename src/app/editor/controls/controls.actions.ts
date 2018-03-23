import { Action } from '@ngrx/store';

export enum WebpackState {
  // Not doing anything.
  Stopped,
  // Currently booting up.
  Starting,
  // Booted up and built successfully.
  Running,
  // Had an error on the last build.
  HadError,
  // Could not boot up.
  Failed,
}

export const enum ControlsActionTypes {
  START_WEBPACK = '[Controls] Start webpack',
  UPDATE_WEBPACK_STATE = '[Controls] Update webpack state',
  UPDATE_WEBPACK_CONSOLE = '[Controls] Update webpack console',
  RESTART_WEBPACK = '[Controls] Restart webpack',
  STOP_WEBPACK = '[Controls] Stop webpack',
}

export const enum ControlsMethods {
  StartWebpack = '[Project] Start webpack',
  StopWebpack = '[Project] Stop webpack',
  RestartWebpack = '[Project] Restart webpack',
}

/**
 * Starts the webpack dev server in the given (usually project!) directory.
 */
export class StartWebpack implements Action {
  public readonly type = ControlsActionTypes.START_WEBPACK;

  constructor(public readonly directory: string) {}
}

/**
 * Updates the state of the webpack dev server.
 */
export class UpdateWebpackState implements Action {
  public readonly type = ControlsActionTypes.UPDATE_WEBPACK_STATE;

  constructor(public readonly state: WebpackState) {}
}

/**
 * Fired by the server to update the contents displayed in the dev
 * server console.
 */
export class UpdateWebpackConsole implements Action {
  public readonly type = ControlsActionTypes.UPDATE_WEBPACK_CONSOLE;

  constructor(public readonly data: string) {}
}

/**
 * Fired to restart the webpack server.
 */
export class RestartWebpack implements Action {
  public readonly type = ControlsActionTypes.RESTART_WEBPACK;
}

/**
 * Fired to stop the webpack server.
 */
export class StopWebpack implements Action {
  public readonly type = ControlsActionTypes.STOP_WEBPACK;
}

export type ControlActions =
  | StartWebpack
  | UpdateWebpackState
  | UpdateWebpackConsole
  | RestartWebpack
  | StopWebpack;
