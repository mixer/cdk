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
  didAutoOpenConsole: boolean;
  isReady: boolean;
  instance?: IWebpackInstance;
}

export interface IState extends fromRoot.IState {
  layout: IControlState;
}

const initialState: IControlState = {
  webpackState: WebpackState.Stopped,
  consoleOutput: '',
  didAutoOpenConsole: false,
  isReady: true,
};

export function controlReducer(
  state: IControlState = initialState,
  action: ControlActions,
): IControlState {
  switch (action.type) {
    case ControlsActionTypes.RESTART_WEBPACK:
      return { ...state, webpackState: WebpackState.Stopping };
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
    case ControlsActionTypes.AUTO_CLOSE_CONSOLE:
      return { ...state, didAutoOpenConsole: false };
    case ControlsActionTypes.AUTO_OPEN_CONSOLE:
      return { ...state, didAutoOpenConsole: true };
    case ControlsActionTypes.SET_IS_READY:
      return { ...state, isReady: action.isReady === undefined ? !state.isReady : action.isReady };
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

/**
 * Selector for the webpack server instancel.
 */
export const webpackInstance = createSelector(controlState, s => s.instance);

/**
 * Selector for wheher the webpack console was automatically opened.
 */
export const didAutoOpenWebpackConsole = createSelector(controlState, s => s.didAutoOpenConsole);

/**
 * Selector for whether the controls are currently ready.
 */
export const selectIsReady = createSelector(controlState, s => s.isReady);
