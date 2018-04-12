import { Action } from '@ngrx/store';

import { WebpackState } from '../controls/controls.actions';
import { RpcError } from '../electron.service';

export const enum UploaderActionTypes {
  OPEN_UPLOADER = '[Uploader] Open',
  UPDATE_WEBPACK_STATE = '[Uploader] Update webpack state',
  UPDATE_WEBPACK_CONSOLE = '[Uploader] Update webpack console',
  UPLOADER_CLOSED = '[Uploader] Closed',
  START_UPLOADING = '[Uploader] Start uploading',
  SET_SCREEN = '[Uploader] Set Stage',
  SET_UPLOAD_SCHEMA = '[Uploader] Set whether to upload schema',
  SET_UPLOAD_CONTROLS = '[Uploader] Set whether to upload controls',
  SET_ERROR = '[Uploader] Set Error',
}

export const enum UploaderMethods {
  StartUpload = '[Uploader] Start Upload',
  UpdateState = '[Uploader] Update State',
}

export enum UploaderScreen {
  Confirming,
  UploadingSchema,
  UploadingControls,
  LinkingGame,
  Completed,
}

/**
 * Opens the uploader dialog.
 */
export class OpenUploader implements Action {
  public readonly type = UploaderActionTypes.OPEN_UPLOADER;
}

/**
 * Sets whether to upload world schema.
 */
export class SetUploadSchema implements Action {
  public readonly type = UploaderActionTypes.SET_UPLOAD_SCHEMA;

  constructor(public readonly shouldUpload: boolean) {}
}

/**
 * Sets whether to upload the control bundle.
 */
export class SetUploadControls implements Action {
  public readonly type = UploaderActionTypes.SET_UPLOAD_CONTROLS;

  constructor(public readonly shouldUpload: boolean) {}
}

/**
 * Triggered when the uploader is closed, clears state.
 */
export class UploaderClosed implements Action {
  public readonly type = UploaderActionTypes.UPLOADER_CLOSED;
}

/**
 * Updates the state of the webpack dev server.
 */
export class UpdateWebpackState implements Action {
  public readonly type = UploaderActionTypes.UPDATE_WEBPACK_STATE;

  constructor(public readonly state: WebpackState) {}
}

/**
 * Updates the stage to show in the modal.
 */
export class SetScreen implements Action {
  public readonly type = UploaderActionTypes.SET_SCREEN;

  constructor(public readonly screen: UploaderScreen) {}
}

/**
 * Fired by the server to update the contents displayed in the dev
 * server console.
 */
export class UpdateWebpackConsole implements Action {
  public readonly type = UploaderActionTypes.UPDATE_WEBPACK_CONSOLE;

  constructor(public readonly data: string) {}
}

/**
 * Fired when the user is ready to start uploading, with their set config.
 */
export class StartUploading implements Action {
  public readonly type = UploaderActionTypes.START_UPLOADING;
}

/**
 * Fired when an error occurs at some point in the process.
 */
export class SetError implements Action {
  public readonly type = UploaderActionTypes.SET_ERROR;

  constructor(public readonly error: RpcError) {}
}

export type UploaderActions =
  | OpenUploader
  | SetUploadControls
  | SetUploadSchema
  | UpdateWebpackConsole
  | UpdateWebpackState
  | UploaderClosed
  | SetScreen
  | SetError;
