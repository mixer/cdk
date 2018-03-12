import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { HttpErrorService } from '../http-error.service';
import { apiUrl } from '../util/env';

/**
 * The rename bundle dialog is opened when the user tries to upload a bundle,
 * but we get a 403 saying they don't have access to it (someone else owns it).
 * We prompt them to rename it, the dialog will return whether they have
 * successfully done so (true) or cancelled it (false).
 */
@Component({
  selector: 'rename-bundle-dialog',
  templateUrl: './rename-bundle-dialog.component.html',
  styleUrls: ['../dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameBundleDialogComponent implements OnInit {
  /**
   * Whether the dialog is submitting.
   */
  public isLoading = new BehaviorSubject(true);

  /**
   * Currently chosen bundle name.
   */
  public name = new BehaviorSubject('');

  constructor(
    private readonly http: HttpClient,
    private readonly dialogRef: MatDialogRef<boolean>,
    private readonly snackRef: MatSnackBar,
    private readonly httpErr: HttpErrorService,
  ) {}

  public submit() {
    const name = this.name.getValue().trim();
    if (!/^[a-z0-9-]+$/.test(name)) {
      this.snackRef.open(
        'Your name may only contain alphanumeric characters and dashes.',
        undefined,
        { duration: 5000 },
      );
      return;
    }

    this.isLoading.next(true);
    this.http
      .post(apiUrl('modify-package'), { name })
      .toPromise()
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch(
        this.httpErr.catch('BundleNameTakenErrorBundleNameTakenError', () => {
          this.snackRef.open('That bundle name is taken! Please choose a new one.', undefined, {
            duration: 5000,
          });
        }),
      )
      .catch(this.httpErr.toast);
  }

  public ngOnInit() {
    this.http
      .get<IPackageConfig>(apiUrl('metadata'))
      .toPromise()
      .then(config => {
        this.name.next(config.name);
        this.isLoading.next(false);
      })
      .catch(this.httpErr.toast);
  }

  public alertTaken() {
    this.snackRef.open('That bundle name is taken! Please choose a new one.', undefined, {
      duration: 5000,
    });
  }
}
