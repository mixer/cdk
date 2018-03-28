import { createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { filter, withLatestFrom } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { IProject, ProjectActions, ProjectActionTypes } from './project.actions';

export type ProjectState = { isOpen: false } | (IProject & { isOpen: true });

export interface IState extends fromRoot.IState {
  layout: ProjectState;
}

export function projectReducer(
  state: ProjectState = { isOpen: false },
  action: ProjectActions,
): ProjectState {
  if (state.isOpen === false) {
    if (action.type === ProjectActionTypes.SET_OPEN_PROJECT) {
      return { isOpen: true, ...action.project };
    }

    return state;
  }

  switch (action.type) {
    case ProjectActionTypes.CLOSE_PROJECT:
      return { isOpen: false };
    case ProjectActionTypes.SET_VERSION_LINK:
      return { ...state, interactiveVersion: action.version };
    case ProjectActionTypes.SET_CONFIRM_SCHEMA:
      return { ...state, confirmSchemaUpload: action.confirm };
    default:
      return state;
  }
}

/**
 * Selector for the project feature.
 */
export const projectState = createFeatureSelector<ProjectState>('project');

/**
 * Selects whether any project is open.
 */
export const isOpen = createSelector(projectState, s => s.isOpen);

/**
 * Selects the project directory.
 */
export const directory = createSelector(projectState, s => (s.isOpen ? s.directory : null));

/**
 * Returns an unary operator to add the latest directory to the observable.
 */
export function withLatestDirectory<T>(store: Store<fromRoot.IState>) {
  return withLatestFrom<T, string>(store.select(directory).pipe(filter<string>(d => !!d)));
}
