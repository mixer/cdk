import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { MdDialog, MdSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import * as JSON5 from 'json5';
import { Observable } from 'rxjs/Observable';
import { apiUrl } from '../util/env';

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';

import { IProject, ProjectService } from '../redux/project';
import { reportHttpError } from '../util/report-issue';
import { IUploadSchemaResult, UploadSchemaDialogComponent } from './upload-schema-dialog.component';

/**
 * The UploadSchemaService saves the control schema from the editor to Mixer.
 */
@Injectable()
export class UploadSchemaService {
  constructor(
    private readonly project: ProjectService,
    private readonly store: Store<IProject>,
    private readonly dialog: MdDialog,
    private readonly http: Http,
    private readonly snackRef: MdSnackBar,
  ) {}

  /**
   * After confirmation, uploads the control schema from the studio to
   * Mixer.
   */
  public upload() {
    this.confirmCanUpload()
      .filter(Boolean)
      .switchMap(() => this.uploadCurrentControls())
      .subscribe(
        () => this.snackRef.open('Schema uploaded', undefined, { duration: 2000 }),
        err => {
          // Catch JSON5 parsing exceptions
          if (err instanceof SyntaxError) {
            this.snackRef.open(`Your control schema contains errors: ${err.message}`);
            return;
          }

          this.snackRef
            .open('An unknown error occurred', 'Report', { duration: 5000 })
            .onAction()
            .subscribe(() => {
              reportHttpError('Unknown error in controls upload', err);
            });
        },
      );
  }

  /**
   * Uploads the user's current control schema to their linked Interactive
   * version on Mixer. Can emit a SyntaxError if their current controls are bad.
   */
  private uploadCurrentControls(): Observable<void> {
    return this.store
      .take(1)
      .switchMap(s =>
        this.http.post(apiUrl(`update-interactive-version/${s.sync.interactiveVersionId}`), {
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
