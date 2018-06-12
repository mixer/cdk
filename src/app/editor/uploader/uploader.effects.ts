import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { merge } from 'rxjs/observable/merge';
import { of } from 'rxjs/observable/of';
import { delay, filter, map, mapTo, switchMap, take, tap } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { ElectronService, RpcError } from '../electron.service';
import { ProjectMethods, RequireLink } from '../project/project.actions';
import { selectLinkedGame, withLatestDirectory } from '../project/project.reducer';
import { SchemaActionTypes, UploadWorldFailed, UploadWorldSchema } from '../schema/schema.actions';
import { catchErrorType } from '../shared/catchErrorType';
import { toLatestFrom } from '../shared/operators';
import { UploaderConsoleService } from './uploader-console.service';
import { UploaderDialogComponent } from './uploader-dialog/uploader-dialog.component';
import {
  SetError,
  SetScreen,
  UpdateWebpackConsole,
  UploaderActionTypes,
  UploaderClosed,
  UploaderMethods,
  UploaderScreen,
} from './uploader.actions';
import { selectConsole, selectUploadControls, selectUploadSchema } from './uploader.reducer';

/**
 * Effects module for account actions.
 */
@Injectable()
export class UploaderEffects {
  /**
   * Starts a controls upload when we go to the "upload" screen.
   */
  @Effect()
  public readonly startControlsUpload = this.actions
    .ofType<SetScreen>(UploaderActionTypes.SET_SCREEN)
    .pipe(
      filter(({ screen }) => screen === UploaderScreen.UploadingControls),
      withLatestDirectory(this.store),
      switchMap(([, directory]) =>
        fromPromise(this.electron.call(UploaderMethods.StartUpload, { directory })).pipe(
          toLatestFrom(this.store.select(selectUploadSchema)),
          map(
            uploadSchema =>
              new SetScreen(
                uploadSchema ? UploaderScreen.UploadingSchema : UploaderScreen.LinkingGame,
              ),
          ),
          catchErrorType(RpcError, () => new SetScreen(UploaderScreen.CompilationError)),
        ),
      ),
    );

  /**
   * Starts a schema upload when we go to the "upload" screen.
   */
  @Effect()
  public readonly startSchemaUpload = this.actions
    .ofType<SetScreen>(UploaderActionTypes.SET_SCREEN)
    .pipe(
      filter(({ screen }) => screen === UploaderScreen.UploadingSchema),
      tap(() => this.store.dispatch(new RequireLink(UploadWorldSchema))),
      switchMap(() =>
        merge(
          this.actions
            .ofType<UploadWorldFailed>(SchemaActionTypes.UPLOAD_WORLD_FAILED)
            .pipe(map(({ error }) => new SetError(error))),
          this.actions
            .ofType(SchemaActionTypes.UPLOAD_WORLD_COMPLETE)
            .pipe(mapTo(new SetScreen(UploaderScreen.LinkingGame))),
        ).pipe(take(1)),
      ),
    );

  /**
   * If they have a linked game, try to link it once more. If they made the
   * link previously before their first upload, we would not have been able
   * to link it to their bundle then.
   */
  @Effect()
  public readonly ensureGameLink = this.actions
    .ofType<SetScreen>(UploaderActionTypes.SET_SCREEN)
    .pipe(
      filter(({ screen }) => screen === UploaderScreen.LinkingGame),
      toLatestFrom(this.store.select(selectLinkedGame)),
      withLatestDirectory(this.store),
      switchMap(([game, directory]) => {
        if (!game) {
          return of(new SetScreen(UploaderScreen.Completed));
        }

        return this.electron
          .call(ProjectMethods.LinkGameToControls, { game, directory })
          .return(new SetScreen(UploaderScreen.Completed))
          .catch(RpcError, err => new SetError(err));
      }),
    );

  /**
   * Writes data to the console as it's received.
   */
  @Effect({ dispatch: false })
  public readonly writeConsole = this.actions
    .ofType<UpdateWebpackConsole>(UploaderActionTypes.UPDATE_WEBPACK_CONSOLE)
    .pipe(tap(({ data }) => this.console.write(data)));

  /**
   * Runs an action that requires auth, see the RequireAuth action for details.
   */
  @Effect()
  public readonly openUploadDialog = this.actions.ofType(UploaderActionTypes.OPEN_UPLOADER).pipe(
    switchMap(() =>
      this.dialog
        .open(UploaderDialogComponent)
        .afterClosed()
        .pipe(mapTo(new UploaderClosed())),
    ),
  );

  /**
   * Starts the upload process, directing to the appropriate screen.
   */
  @Effect()
  public readonly startUploading = this.actions
    .ofType(UploaderActionTypes.START_UPLOADING)
    .pipe(
      toLatestFrom(this.store.select(selectUploadControls)),
      map(
        uploadControls =>
          new SetScreen(
            uploadControls ? UploaderScreen.UploadingControls : UploaderScreen.UploadingSchema,
          ),
      ),
    );

  /**
   * Resets state when the console is closed.
   */
  @Effect({ dispatch: false })
  public readonly resetOnClose = this.actions
    .ofType(UploaderActionTypes.UPLOADER_CLOSED)
    .pipe(tap(() => this.console.clear()));

  /**
   * Resets state when the console is closed.
   */
  @Effect({ dispatch: false })
  public readonly saveConsoleOutput = this.actions.ofType(UploaderActionTypes.SAVE_CONSOLE).pipe(
    toLatestFrom(this.store.select(selectConsole)),
    map(output => {
      const link = document.createElement('a');
      const url = URL.createObjectURL(new Blob([output], { type: 'text' }));
      link.href = url;
      link.download = `webpack-output-${new Date().toISOString()}.txt`;
      document.body.appendChild(link);
      link.click();
      return link;
    }),
    delay(1),
    tap(link => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }),
  );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly dialog: MatDialog,
    private readonly store: Store<fromRoot.IState>,
    private readonly console: UploaderConsoleService,
  ) {}
}
