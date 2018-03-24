import { createFeatureSelector, createSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import {
  ControlActions,
  ControlsActionTypes,
  isRunning,
  IWebpackInstance,
  WebpackState,
} from './controls.actions';

export interface IControlState {
  webpackState: WebpackState;
  consoleOutput: string;
  instance?: IWebpackInstance;
}

export interface IState extends fromRoot.IState {
  layout: IControlState;
}

export function controlReducer(
  state: IControlState = { webpackState: WebpackState.Stopped, consoleOutput: '' },
  action: ControlActions,
): IControlState {
  switch (action.type) {
    case ControlsActionTypes.UPDATE_WEBPACK_STATE:
      const next = { ...state, webpackState: action.state };
      if (!isRunning(action.state)) {
        next.instance = undefined;
        next.consoleOutput = '';
      }

      return next;
    case ControlsActionTypes.SET_WEBPACK_INSTANCE:
      return { ...state, instance: action.instance };
    case ControlsActionTypes.UPDATE_WEBPACK_CONSOLE:
      if (isRunning(state.webpackState)) {
        return { ...state, consoleOutput: state.consoleOutput + action.data };
      }
      return state;
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

/**
 * Selector for the webpack console output.
 */
export const webpackConsole = createSelector(controlState, s => s.consoleOutput);
