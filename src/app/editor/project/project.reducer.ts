import { createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { IInteractiveGame, IProject, ProjectActions, ProjectActionTypes } from './project.actions';

export interface IProjectState {
  project?: IProject;
  ownedGames?: IInteractiveGame[];
}

export interface IState extends fromRoot.IState {
  layout: IProjectState;
}

export function projectReducer(state: IProjectState = {}, action: ProjectActions): IProjectState {
  switch (action.type) {
    case ProjectActionTypes.SET_OPEN_PROJECT:
      return { ...state, project: action.project };
    case ProjectActionTypes.CLOSE_PROJECT:
      return { ...state, project: undefined };
    case ProjectActionTypes.LOAD_OWNED_GAMES:
      return { ...state, ownedGames: undefined }; // trigger a loading state
    case ProjectActionTypes.SET_OWNED_GAMES:
      return { ...state, ownedGames: action.games };
    default:
    // fall through
  }

  if (!state.project) {
    return state; // for type-safety before continuing with the project-specific actions
  }

  switch (action.type) {
    case ProjectActionTypes.SET_GAME_LINK:
      return { ...state, project: { ...state.project, interactiveGame: action.game } };
    case ProjectActionTypes.SET_CONFIRM_SCHEMA:
      return { ...state, project: { ...state.project, confirmSchemaUpload: action.confirm } };
    default:
      return state;
  }
}

/**
 * Selector for the project feature.
 */
export const projectState = createFeatureSelector<IProjectState>('project');

/**
 * Selects whether any project is open.
 */
export const isOpen = createSelector(projectState, s => !!s.project);

/**
 * Selects the project directory.
 */
export const directory = createSelector(
  projectState,
  s => (s.project ? s.project.directory : null),
);

/**
 * Selects the linked interactive project if any.
 */
export const selectLinkedGame = createSelector(
  projectState,
  s => (s.project ? s.project.interactiveGame : null),
);

/**
 * Selects games the current user owns.
 */
export const selectOwnedGames = createSelector(projectState, s => s.ownedGames);

/**
 * Returns an unary operator to add the latest directory to the observable.
 */
export function withLatestDirectory<T>(store: Store<fromRoot.IState>) {
  return withLatestFrom<T, string>(store.select(directory).pipe(filter<string>(d => !!d)));
}

/**
 * Reads the project, when one is open.
 */
export function readOpen(store: Store<fromRoot.IState>) {
  return store.select(projectState).pipe(filter(p => !!p.project), map(p => <IProject>p.project));
}
