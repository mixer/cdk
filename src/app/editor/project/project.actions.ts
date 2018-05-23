import { IScene } from '@mcph/miix-std/dist/internal';
import { Action } from '@ngrx/store';

import { IPackageJson } from '../../../server/project';
import { IWorld } from '../schema/schema.actions';
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
  gameId: number;
  game: IInteractiveGame;
}

/**
 * Partial typings for an InteractiveGame resource on Mixer.
 * {@see https://dev.mixer.com/rest.html#InteractiveGame}
 */
export interface IInteractiveGame {
  id: number;
  name: string;
  versions: IInteractiveVersion[];
}

/**
 * A full version model with associated controls.
 */
export interface IFullInteractiveVersion extends IInteractiveVersion {
  controls: IWorld | IScene[];
  bundle: string;
}

export interface IProject {
  /**
   * Directory the project is open in.
   */
  directory: string;

  /**
   * Interactive version the controls are linked to, if any.
   */
  interactiveGame: null | IInteractiveGame;

  /**
   * Whether to prompt each time the user wants to upload a control schema.
   */
  confirmSchemaUpload: boolean;

  /**
   * Metadata for the currently open project.
   */
  packageJson: IPackageJson;
}

export const enum ProjectActionTypes {
  CLOSE_PROJECT = '[Project] Close',
  START_OPEN_PROJECT = '[Project] Start opening a project',
  TRY_OPEN_PROJECT = '[Project] Attempt to open a directory',
  SET_OPEN_PROJECT = '[Project] Set the currently open project',
  SET_GAME_LINK = '[Project] Set the linked Interactive version',
  SET_CONFIRM_SCHEMA = '[Project] Set whether to confirm schema upload',
  OPEN_DIRECTORY = '[Project] Open directory',
  START_CHANGE_LINK = '[Project] Start changing the linked project',
  LOAD_OWNED_GAMES = '[Project] Load games the user owns',
  SET_OWNED_GAMES = '[Project] Set games the user owns',
  REQUIRE_LINK = '[Project] Require project link',
  RENAME_PROJECT = '[Project] Rename project',
}

export const enum ProjectMethods {
  OpenDirectory = '[Project] Open directory',
  LinkGameToControls = '[Project] Link game to controls',
  GetOwnedGames = '[Project] Get owned games',
  RenameProject = '[Project] Rename',
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
 * Updates the linked interactive project.
 */
export class SetInteractiveGame implements Action {
  public readonly type = ProjectActionTypes.SET_GAME_LINK;

  constructor(public readonly game: IInteractiveGame) {}
}

/**
 * Sets whether we should prompt for confirmation on schema upload each time,
 * or not.
 */
export class SetConfirmSchema implements Action {
  public readonly type = ProjectActionTypes.SET_CONFIRM_SCHEMA;

  constructor(public readonly confirm: boolean) {}
}

/**
 * Opens the directory where the project resides.
 */
export class OpenDirectory implements Action {
  public readonly type = ProjectActionTypes.OPEN_DIRECTORY;
}

/**
 * Fired to start the process of changing which project the
 * controls are linked to.
 */
export class StartChangeLink implements Action {
  public readonly type = ProjectActionTypes.START_CHANGE_LINK;
}

/**
 * Fired when the user starts the linking process, loads Interactive games
 * that they own.
 */
export class LoadOwnedGames implements Action {
  public readonly type = ProjectActionTypes.LOAD_OWNED_GAMES;
}

/**
 * Fired when the user's owned games are loaded.
 */
export class SetOwnedGames implements Action {
  public readonly type = ProjectActionTypes.SET_OWNED_GAMES;

  constructor(public readonly games: IInteractiveGame[]) {}
}

/**
 * Requires authentication before dispatching the given action. Dispatches
 * the failedAction, if provided, if authentication is cancelled.
 */
export class RequireLink implements Action {
  public readonly type = ProjectActionTypes.REQUIRE_LINK;

  constructor(
    public readonly successAction: Action | (new (game: IInteractiveGame) => Action),
    public readonly failedAction?: Action,
  ) {}
}

/**
 * Renames the currently open project.
 */
export class RenameProject implements Action {
  public readonly type = ProjectActionTypes.RENAME_PROJECT;

  constructor(public readonly newName: string) {}
}

export type ProjectActions =
  | CloseProject
  | StartOpenProject
  | SetOpenProject
  | SetInteractiveGame
  | SetConfirmSchema
  | OpenDirectory
  | LoadOwnedGames
  | SetOwnedGames
  | RequireLink
  | RenameProject;
