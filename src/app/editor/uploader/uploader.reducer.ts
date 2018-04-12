import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { WebpackState } from '../controls/controls.actions';
import { UploaderActions, UploaderActionTypes, UploaderScreen } from './uploader.actions';

export interface IUploaderState {
  webpackState: WebpackState;
  screen: UploaderScreen;
  uploadSchema: boolean;
  uploadControls: boolean;
}

export interface IState extends fromRoot.IState {
  uploader: IUploaderState;
}

const initialState: IUploaderState = {
  webpackState: WebpackState.Stopped,
  screen: UploaderScreen.Confirming,
  uploadSchema: true,
  uploadControls: true,
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
    case UploaderActionTypes.UPLOADER_CLOSED:
      return { ...state, screen: UploaderScreen.Confirming };
    default:
      return state;
  }
}

/**
 * Selector for the uploader feature.
 */
export const contentMaskState: MemoizedSelector<IState, IUploaderState> = createFeatureSelector<
  IUploaderState
>('uploader');

/**
 * Selects the current screen.
 */
export const selectScreen = createSelector(contentMaskState, s => s.screen);

/**
 * Selects the current webpack state.
 */
export const selectWebpack = createSelector(contentMaskState, s => s.webpackState);

/**
 * Selects whether to upload controls.
 */
export const selectUploadControls = createSelector(contentMaskState, s => s.uploadControls);

/**
 * Selects whether to upload schema.
 */
export const selectUploadSchema = createSelector(contentMaskState, s => s.uploadSchema);
