import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { BundleNameTakenError } from '../../../server/errors';

import * as fromRoot from '../bedrock.reducers';
import { WebpackState } from '../controls/controls.actions';
import { RpcError } from '../electron.service';
import { UploaderActions, UploaderActionTypes, UploaderScreen } from './uploader.actions';

export interface IUploaderState {
  webpackState: WebpackState;
  screen: UploaderScreen;
  uploadSchema: boolean;
  uploadControls: boolean;
  consoleOutput: string;
  error?: RpcError;
}

export interface IState extends fromRoot.IState {
  uploader: IUploaderState;
}

const initialState: IUploaderState = {
  webpackState: WebpackState.Stopped,
  screen: UploaderScreen.Confirming,
  uploadSchema: true,
  uploadControls: true,
  consoleOutput: '',
};

export function uploaderReducer(
  state: IUploaderState = initialState,
  action: UploaderActions,
): IUploaderState {
  switch (action.type) {
    case UploaderActionTypes.UPDATE_WEBPACK_STATE:
      return { ...state, webpackState: action.state };
    case UploaderActionTypes.SET_UPLOAD_CONTROLS:
      return { ...state, uploadControls: action.shouldUpload };
    case UploaderActionTypes.SET_UPLOAD_SCHEMA:
      return { ...state, uploadSchema: action.shouldUpload };
    case UploaderActionTypes.SET_SCREEN:
      return { ...state, screen: action.screen };
    case UploaderActionTypes.UPDATE_WEBPACK_CONSOLE:
      return { ...state, consoleOutput: state.consoleOutput + action.data };
    case UploaderActionTypes.SET_ERROR:
      return action.error.originalName === BundleNameTakenError.name
        ? { ...state, screen: UploaderScreen.Rename }
        : { ...state, error: action.error };
    case UploaderActionTypes.UPLOADER_CLOSED:
      return { ...state, screen: UploaderScreen.Confirming, consoleOutput: '', error: undefined };
    default:
      return state;
  }
}

/**
 * Selector for the uploader feature.
 */
export const uploaderState: MemoizedSelector<IState, IUploaderState> = createFeatureSelector<
  IUploaderState
>('uploader');

/**
 * Selects the current screen.
 */
export const selectScreen = createSelector(uploaderState, s => s.screen);

/**
 * Selects the current webpack state.
 */
export const selectWebpack = createSelector(uploaderState, s => s.webpackState);

/**
 * Selects whether to upload controls.
 */
export const selectUploadControls = createSelector(uploaderState, s => s.uploadControls);

/**
 * Selects whether to upload schema.
 */
export const selectUploadSchema = createSelector(uploaderState, s => s.uploadSchema);

/**
 * Selects whether to upload schema.
 */
export const selectConsole = createSelector(uploaderState, s => s.consoleOutput);

/**
 * Selects the rpc error that occurred during the process.
 */
export const selectError = createSelector(uploaderState, s => s.error);
