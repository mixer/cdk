import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { merge } from 'rxjs/observable/merge';
import { filter, map, mapTo, switchMap, take, tap } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { ElectronService, RpcError } from '../electron.service';
import { RequireLink } from '../project/project.actions';
import { withLatestDirectory } from '../project/project.reducer';
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
import { selectUploadControls, selectUploadSchema } from './uploader.reducer';

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
                uploadSchema ? UploaderScreen.UploadingSchema : UploaderScreen.Completed,
              ),
          ),
          catchErrorType(RpcError, err => new SetError(err)),
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
            .pipe(mapTo(new SetScreen(UploaderScreen.Completed))),
        ).pipe(take(1)),
      ),
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

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly dialog: MatDialog,
    private readonly store: Store<fromRoot.IState>,
    private readonly console: UploaderConsoleService,
  ) {}
}
