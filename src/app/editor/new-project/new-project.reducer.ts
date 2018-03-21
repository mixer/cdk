import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import { NewProjectActions, NewProjectActionTypes, NewProjectScreen } from './new-project.actions';

export interface NewProjectState {
  screen: NewProjectScreen;
  directory?: string;
  layout: string;
}

export interface State extends fromRoot.State {
  layout: NewProjectState;
}

const initialState: NewProjectState = {
  screen: NewProjectScreen.Welcome,
  layout: 'fullscreen',
};

export function newProjectReducer(
  state: NewProjectState = initialState,
  action: NewProjectActions,
): NewProjectState {
  switch (action.type) {
    case NewProjectActionTypes.SET_TARGET_DIRECTORY:
      return { ...state, directory: action.directory };
    case NewProjectActionTypes.CHANGE_SCREEN:
      return { ...state, screen: action.screen };
    case NewProjectActionTypes.SET_LAYOUT:
      return { ...state, layout: action.layout };
    case NewProjectActionTypes.CANCEL:
      return initialState;
    default:
      return state;
  }
}

/**
 * Selector for the layout feature.
 */
export const projectSelector: MemoizedSelector<State, NewProjectState> = createFeatureSelector<
  NewProjectState
>('newProject');

/**
 * Selector for the current screen.
 */
export const screen = createSelector(projectSelector, s => s.screen);

/**
 * Selector for the chosen layout.
 */
export const layout = createSelector(projectSelector, s => s.layout);
