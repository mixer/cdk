import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import * as JSON5 from 'json5';
import { Observable } from 'rxjs/Observable';
import { apiUrl } from '../util/env';

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';

import { HttpErrorService } from '../http-error.service';
import { IProject, ProjectService } from '../redux/project';
import { IUploadSchemaResult, UploadSchemaDialogComponent } from './upload-schema-dialog.component';

/**
 * The UploadSchemaService saves the control schema from the editor to Mixer.
 */
@Injectable()
export class UploadSchemaService {
  constructor(
    private readonly project: ProjectService,
    private readonly store: Store<IProject>,
    private readonly dialog: MatDialog,
    private readonly http: HttpClient,
    private readonly httpErr: HttpErrorService,
    private readonly snackRef: MatSnackBar,
  ) {}

  /**
   * After confirmation, uploads the control schema from the studio to
   * Mixer.
   */
  public upload() {
    this.confirmCanUpload()
      .filter(Boolean)
      .switchMap(() => this.uploadCurrentControls())
      .take(1)
      .toPromise()
      .then(() => this.snackRef.open('Schema uploaded', undefined, { duration: 2000 }))
      .catch(
        this.httpErr.joi(err => {
          // todo(connor4312): I would like to show these errors inline and
          // highlighted in the code editor, but doing so involves a notable
          // amount of work to parse into the right place. Toast for now.
          const { message, path } = err.details[0];
          this.snackRef.open(
            `Error uploading control: ${message} in "${path.join('.')}".`,
            undefined,
            { duration: 7000 },
          );
        }),
      )
      .catch(SyntaxError, err => {
        this.snackRef.open(`Your control schema contains errors: ${err.message}`);
      });
  }

  /**
   * Uploads the user's current control schema to their linked Interactive
   * version on Mixer. Can emit a SyntaxError if their current controls are bad.
   */
  private uploadCurrentControls(): Observable<void> {
    return this.store
      .take(1)
      .switchMap(s =>
        this.http.post(apiUrl(`update-interactive-version/${s.sync.interactiveVersion!.id}`), {
          controls: {
            scenes: JSON5.parse(s.code.scenes.join('\n')),
          },
        }),
      )
      .map(() => undefined);
  }

  /**
   * Returns whether the user wants to upload their control scehma.
   */
  private confirmCanUpload(): Observable<boolean> {
    return this.store
      .map(s => s.sync.confirmSchemaUpload)
      .take(1)
      .switchMap(needsConfirm => {
        if (!needsConfirm) {
          return Observable.of(true);
        }

        return this.dialog
          .open(UploadSchemaDialogComponent)
          .afterClosed()
          .map((result: IUploadSchemaResult) => {
            if (result.approved && result.dontShowAgain) {
              this.project.syncDontConfirmSchema();
            }

            return result.approved;
          });
      });
  }
}
