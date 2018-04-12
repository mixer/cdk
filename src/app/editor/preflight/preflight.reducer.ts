import { createFeatureSelector, createSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { PreflightActions, PreflightActionTypes } from './preflight.actions';

export interface IPreflightState {
  hasPassed: boolean;
}

export interface IState extends fromRoot.IState {
  preflight: IPreflightState;
}

const initialState: IPreflightState = {
  hasPassed: false,
};

export function preflightReducer(
  state: IPreflightState = initialState,
  action: PreflightActions,
): IPreflightState {
  switch (action.type) {
    case PreflightActionTypes.PASS:
      return { hasPassed: true };
    default:
      return state;
  }
}

/**
 * Selector for the preflight feature.
 */
export const preflightState = createFeatureSelector<IPreflightState>('preflight');

/**
 * Selects whether preflight checks have passed.
 */
export const preflightPassed = createSelector(preflightState, s => s.hasPassed);
