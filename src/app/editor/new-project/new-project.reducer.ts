import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';

import * as fromRoot from '../bedrock.reducers';
import {
  IPackageDetails,
  NewProjectActions,
  NewProjectActionTypes,
  NewProjectScreen,
} from './new-project.actions';

export interface INewProjectState {
  screen: NewProjectScreen;
  history: NewProjectScreen[];
  details?: Readonly<IPackageDetails>;
  directory?: string;
  template: string;
  layout: string;
  creationError?: string;
  isCreating: boolean;
}

export interface IState extends fromRoot.IState {
  layout: INewProjectState;
}

const initialState: INewProjectState = {
  screen: NewProjectScreen.Welcome,
  history: [],
  template: 'html',
  layout: 'fullscreen',
  isCreating: false,
};

export function newProjectReducer(
  state: INewProjectState = initialState,
  action: NewProjectActions,
): INewProjectState {
  switch (action.type) {
    case NewProjectActionTypes.SET_TARGET_DIRECTORY:
      return { ...state, directory: action.directory };
    case NewProjectActionTypes.CHANGE_SCREEN:
      state.history.push(state.screen);
      let nextScreen = NewProjectScreen.Welcome;
      if (state.screen === NewProjectScreen.Welcome) {
        nextScreen = NewProjectScreen.Template;
      } else if (state.screen === NewProjectScreen.Layout) {
        nextScreen = NewProjectScreen.PackageDetails;
      } else if (state.screen === NewProjectScreen.Template) {
        if (state.template === 'html') {
          nextScreen = NewProjectScreen.PackageDetails;
        } else {
          nextScreen = NewProjectScreen.Layout;
        }
      }
      return { ...state, screen: nextScreen };
    case NewProjectActionTypes.GO_BACK:
      const previousScreen = state.history.pop() || NewProjectScreen.Welcome;
      return { ...state, screen: previousScreen };
    case NewProjectActionTypes.SET_LAYOUT:
      return { ...state, layout: action.layout };
    case NewProjectActionTypes.SET_PACKAGE_DETAILS:
      return { ...state, details: action.details };
    case NewProjectActionTypes.SET_TEMPLATE:
      return { ...state, template: action.template };
    case NewProjectActionTypes.CREATE_START:
      return {
        ...state,
        isCreating: true,
        creationError: undefined,
        screen: NewProjectScreen.Creating,
      };
    case NewProjectActionTypes.CREATE_COMPLETE:
      return {
        ...state,
        isCreating: false,
        screen: NewProjectScreen.Complete,
      };
    case NewProjectActionTypes.CREATE_ERROR:
      return {
        ...state,
        isCreating: false,
        creationError: action.error,
      };
    case NewProjectActionTypes.CANCEL:
      return initialState;
    default:
      return state;
  }
}

/**
 * Selector for the layout feature.
 */
export const projectSelector: MemoizedSelector<IState, INewProjectState> = createFeatureSelector<
  INewProjectState
>('newProject');

/**
 * Selector for the current screen.
 */
export const selectScreen = createSelector(projectSelector, s => s.screen);

/**
 * Selector for the chosen layout.
 */
export const layout = createSelector(projectSelector, s => s.layout);

/**
 * Selector for the package details.
 */
export const details = createSelector(projectSelector, s => s.details);

/**
 * Selector for the package template.
 */
export const template = createSelector(projectSelector, s => s.template);

/**
 * Selector for project target directory.
 */
export const targetDirectory = createSelector(
  projectSelector,
  s => (s.details ? `${s.directory}/${s.details!.projectName}` : null),
);

/**
 * Selector for whether we're busying running the project creation.
 */
export const isCreating = createSelector(projectSelector, s => s.isCreating);

/**
 * Selector for any error that happened during creation.
 */
export const creationError = createSelector(projectSelector, s => s.creationError);
