import { createFeatureSelector, createSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { ControlActions, ControlsActionTypes, WebpackState } from './controls.actions';

export interface IControlState {
  webpackState: WebpackState;
}

export interface IState extends fromRoot.IState {
  layout: IControlState;
}

export function controlReducer(
  state: IControlState = { webpackState: WebpackState.Stopped },
  action: ControlActions,
): IControlState {
  switch (action.type) {
    case ControlsActionTypes.UPDATE_WEBPACK_STATE:
      return { webpackState: action.state };
    default:
      return state;
  }
}

/**
 * Selector for the controls feature.
 */
export const controlState = createFeatureSelector<IControlState>('controls');

/**
 * Selector for the state of the webpack server.
 */
export const webpackState = createSelector(controlState, s => s.webpackState);
