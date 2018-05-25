import { Injectable } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { of } from 'rxjs/observable/of';
import { filter, map, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { ProjectNotFoundError } from '../../../server/errors';
import { CommonMethods } from '../bedrock.actions';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService, RpcError } from '../electron.service';
import * as forLayout from '../layout/layout.actions';
import { DirectoryOpener } from '../shared/directory-opener';
import { ErrorToastComponent } from '../toasts/error-toast/error-toast.component';
import * as forToast from '../toasts/toasts.actions';
import { LinkProjectDialogComponent } from './link-dialog/link-dialog.component';
import {
  CloseProject,
  IInteractiveGame,
  IProject,
  LoadOwnedGames,
  ProjectActionTypes,
  ProjectMethods,
  RenameProject,
  RequireLink,
  SetInteractiveGame,
  SetOpenProject,
  SetOwnedGames,
  TryOpenProject,
} from './project.actions';
import { selectLinkedGame, withLatestDirectory } from './project.reducer';

/**
 * Effects module for account actions.
 */
@Injectable()
export class ProjectEffects {
  /**
   * Fired when we want to pick a project directory to open.
   */
  @Effect()
  public readonly startOpen = this.actions.ofType(ProjectActionTypes.START_OPEN_PROJECT).pipe(
    switchMap(() =>
      this.electron.call<string>(CommonMethods.ChooseDirectory, {
        context: 'openProject',
        title: `Choose your project's folder.`,
      }),
    ),
    filter(dir => !!dir),
    switchMap(dir => of<Action>(new CloseProject(), new TryOpenProject(dir))),
  );

  /**
   * Fired when we want to try to open a project directory, by name.
   */
  @Effect()
  public readonly tryOpen = this.actions
    .ofType<TryOpenProject>(ProjectActionTypes.TRY_OPEN_PROJECT)
    .pipe(
      switchMap(action =>
        this.electron
          .call<IProject>(ProjectMethods.OpenDirectory, {
            directory: action.directory,
          })
          .then(results => new SetOpenProject(results))
          .catch(RpcError, err => {
            if (err.originalName === ProjectNotFoundError.name) {
              this.snack.open(err.message, undefined, { duration: 5000 });
              return new forLayout.RemoveRecentProject(action.directory);
            } else {
              return new forToast.OpenToast(ErrorToastComponent, err);
            }
          }),
      ),
    );

  /**
   * Fired when we want to try to open a project directory, by name.
   */
  @Effect({ dispatch: false })
  public readonly openProjectDirectory = this.actions
    .ofType(ProjectActionTypes.OPEN_DIRECTORY)
    .pipe(
      withLatestDirectory(this.store),
      switchMap(([, directory]) => {
        const opener = new DirectoryOpener(this.electron);
        return opener
          .findProgram()
          .then(program => (program ? opener.open(directory, program) : null));
      }),
    );

  /**
   * Persists a link to an interactive project to the server.
   */
  @Effect({ dispatch: false })
  public readonly setLinkedVersion = this.actions
    .ofType<SetInteractiveGame>(ProjectActionTypes.SET_GAME_LINK)
    .pipe(
      withLatestDirectory(this.store),
      switchMap(([{ game }, directory]) =>
        this.electron
          .call(ProjectMethods.LinkGameToControls, { game, directory })
          .catch(RpcError, () => undefined),
      ),
    );

  /**
   * Updates the name of the project package.json.
   */
  @Effect()
  public readonly renameProejct = this.actions
    .ofType<RenameProject>(ProjectActionTypes.RENAME_PROJECT)
    .pipe(
      withLatestDirectory(this.store),
      switchMap(([{ newName }, directory]) =>
        this.electron
          .call(ProjectMethods.RenameProject, { directory, name: newName })
          .return()
          .catch(RpcError, err => new forToast.OpenToast(ErrorToastComponent, err)),
      ),
      filter(action => !!action),
    );

  /**
   * Opens the dialog to change what project we're linked to.
   */
  @Effect()
  public readonly openLinkingDialog = this.actions
    .ofType(ProjectActionTypes.START_CHANGE_LINK)
    .pipe(tap(() => this.dialog.open(LinkProjectDialogComponent)), map(() => new LoadOwnedGames()));

  /**
   * Gets games the user owns from the server as requested.
   */
  @Effect()
  public readonly loadOwnedGames = this.actions
    .ofType(ProjectActionTypes.LOAD_OWNED_GAMES)
    .pipe(
      withLatestDirectory(this.store),
      switchMap(([, directory]) =>
        this.electron.call<IInteractiveGame[]>(ProjectMethods.GetOwnedGames, { directory }),
      ),
      map(games => new SetOwnedGames(games)),
    );

  /**
   * Runs an action that requires a project to be linked,
   * see the RequireLink action for details.
   */
  @Effect()
  public readonly requireLink = this.actions
    .ofType<RequireLink>(ProjectActionTypes.REQUIRE_LINK)
    .pipe(
      withLatestFrom(this.store.select(selectLinkedGame)),
      switchMap(([action, linked]) => {
        const createSuccess = (g: IInteractiveGame) =>
          of(
            typeof action.successAction === 'function'
              ? new action.successAction(g)
              : action.successAction,
          );

        if (linked) {
          return createSuccess(linked);
        }

        return this.dialog
          .open(LinkProjectDialogComponent)
          .afterClosed()
          .pipe(
            switchMap(game => (game ? createSuccess(game) : of(action.failedAction))),
            filter(a => !!a),
            startWith(new LoadOwnedGames()),
          );
      }),
    );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly store: Store<fromRoot.IState>,
    private readonly dialog: MatDialog,
    private readonly snack: MatSnackBar,
  ) {}
}
