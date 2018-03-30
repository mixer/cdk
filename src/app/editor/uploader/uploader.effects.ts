import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, mapTo, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import { RequireLink } from '../project/project.actions';
import { withLatestDirectory } from '../project/project.reducer';
import { SchemaActionTypes, UploadWorldSchema } from '../schema/schema.actions';
import { UploaderConsoleService } from './uploader-console.service';
import { UploaderDialogComponent } from './uploader-dialog/uploader-dialog.component';
import {
  SetScreen,
  UpdateWebpackConsole,
  UploaderActionTypes,
  UploaderClosed,
  UploaderMethods,
  UploaderScreen,
} from './uploader.actions';
import { selectUploadControls } from './uploader.reducer';

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
      switchMap(([, directory]) => this.electron.call(UploaderMethods.StartUpload, { directory })),
      mapTo(new SetScreen(UploaderScreen.Completed)),
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
      switchMap(() => this.actions.ofType(SchemaActionTypes.UPLOAD_WORLD_COMPLETE).pipe(take(1))),
      withLatestFrom(this.store.select(selectUploadControls)),
      map(
        ([, uploadControls]) =>
          new SetScreen(
            uploadControls ? UploaderScreen.UploadingControls : UploaderScreen.Completed,
          ),
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
    tap(() => {
      return this.dialog
        .open(UploaderDialogComponent)
        .afterClosed()
        .pipe(mapTo(new UploaderClosed()));
    }),
  );

  /**
   * Resets state when the console is closed.
   */
  @Effect()
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
