import { Action } from '@ngrx/store';
/**
 * Partial typings for an InteractiveVersion resource on Mixer.
 * {@see https://dev.mixer.com/rest.html#InteractiveVersion}
 */
export interface IInteractiveVersion {
  id: number;
  version: string;
  state: string;
  changelog: string;
  versionOrder: number;
  installation: string;
  createdAt: string;
  updatedAt: string;
  game: IInteractiveGame;
}

/**
 * Partial typings for an InteractiveGame resource on Mixer.
 * {@see https://dev.mixer.com/rest.html#InteractiveGame}
 */
export interface IInteractiveGame {
  id: number;
  name: string;
}

/**
 * Describes an InteractiveVersion with a nested parent game.
 */
export interface IInteractiveVersionWithGame extends IInteractiveVersion {
  game: IInteractiveGame;
}

export interface IProject {
  /**
   * Directory the project is open in.
   */
  directory: string;

  /**
   * Interactive version the controls are linked to, if any.
   */
  interactiveVersion: null | IInteractiveVersionWithGame;

  /**
   * Whether to prompt each time the user wants to upload a control schema.
   */
  confirmSchemaUpload: boolean;
}

export const enum ProjectActionTypes {
  CLOSE_PROJECT = '[Project] Close',
  START_OPEN_PROJECT = '[Project] Start opening a project',
  TRY_OPEN_PROJECT = '[Project] Attempt to open a directory',
  SET_OPEN_PROJECT = '[Project] Set the currently open project',
  SET_VERSION_LINK = '[Project] Set the linked Interactive version',
  SET_CONFIRM_SCHEMA = '[Project] Set whether to confirm schema upload',
}

export const enum ProjectMethods {
  OpenDirectory = '[Project] Open directory',
}

/**
 * Closes an open project.
 */
export class CloseProject implements Action {
  public readonly type = ProjectActionTypes.CLOSE_PROJECT;
}

/**
 * Starts the process to open an existing project.
 */
export class StartOpenProject implements Action {
  public readonly type = ProjectActionTypes.START_OPEN_PROJECT;
}

/**
 * Fired by the effect when a project is successfully opened.
 */
export class TryOpenProject implements Action {
  public readonly type = ProjectActionTypes.TRY_OPEN_PROJECT;

  constructor(public readonly directory: string) {}
}

/**
 * Fired by the effect when a project is successfully opened.
 */
export class SetOpenProject implements Action {
  public readonly type = ProjectActionTypes.SET_OPEN_PROJECT;

  constructor(public readonly project: IProject) {}
}

/**
 * Updates the linked interactive version.
 */
export class SetInteractiveVersion implements Action {
  public readonly type = ProjectActionTypes.SET_VERSION_LINK;

  constructor(public readonly version: IInteractiveVersionWithGame | null) {}
}

/**
 * Sets whether we should prompt for confirmation on schema upload each time,
 * or not.
 */
export class SetConfirmSchema implements Action {
  public readonly type = ProjectActionTypes.SET_CONFIRM_SCHEMA;

  constructor(public readonly confirm: boolean) {}
}

export type ProjectActions =
  | CloseProject
  | StartOpenProject
  | SetOpenProject
  | SetInteractiveVersion
  | SetConfirmSchema;
