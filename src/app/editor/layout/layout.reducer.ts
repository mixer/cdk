import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { LayoutActions, LayoutActionTypes, LayoutScreen } from './layout.actions';

export interface ILayoutState {
  screen: LayoutScreen;
}

export interface IState extends fromRoot.IState {
  layout: ILayoutState;
}

const initialState: ILayoutState = {
  screen: LayoutScreen.Welcome,
};

export function layoutReducer(
  state: ILayoutState = initialState,
  action: LayoutActions,
): ILayoutState {
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
export const layoutState: MemoizedSelector<IState, ILayoutState> = createFeatureSelector<
  ILayoutState
>('fullscreen');

/**
 * Selects the chosen layout screen.
 */
export const selectScreen = createSelector(layoutState, s => s.screen);
