import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { LayoutActions, LayoutActionTypes, LayoutScreen } from './layout.actions';

export interface LayoutState {
  screen: LayoutScreen;
}

export interface State extends fromRoot.State {
  layout: LayoutState;
}

const initialState: LayoutState = {
  screen: LayoutScreen.Welcome,
};

export function layoutReducer(
  state: LayoutState = initialState,
  action: LayoutActions,
): LayoutState {
  switch (action.type) {
    case LayoutActionTypes.OPEN_SCREEN:
      return { ...state, screen: action.screen };
    default:
      return state;
  }
}

/**
 * Selector for the layout feature.
 */
export const layoutState: MemoizedSelector<State, LayoutState> = createFeatureSelector<LayoutState>(
  'fullscreen',
);

/**
 * Selects the chosen layout screen.
 */
export const selectScreen = createSelector(layoutState, s => s.screen);
