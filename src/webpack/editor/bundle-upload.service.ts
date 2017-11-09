import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { MdDialog, MdSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';

import { HttpErrorService } from './http-error.service';
import { IProject } from './redux/project';
import { RenameBundleDialogComponent } from './rename-bundle-dialog/rename-bundle-dialog.component';
import { apiUrl } from './util/env';

/**
 * Thrown internally if the eval check fails.
 */
class HasEvalError extends Error {
  constructor() {
    super('eval is not allowed');

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, HasEvalError.prototype);
      return;
    }
    (<any>this).__proto__ = HasEvalError.prototype;
  }
}

/**
 * The BundleUploadService triggers the dev server to bundle and save the
 * custom control set to the Interactive studio.
 */
@Injectable()
export class BundleUploadService {
  constructor(
    private readonly store: Store<IProject>,
    private readonly http: Http,
    private readonly snackRef: MdSnackBar,
    private readonly dialog: MdDialog,
    private readonly httpErr: HttpErrorService,
  ) {}

  /**
   * Upload starts a bundle upload. The promise resolve when the process
   * completes, or the user is shown an error.
   */
  public upload(): Promise<void> {
    const snack = this.snackRef.open('Bundling and uploading controls...');

    return this.http
      .get(apiUrl('ensure-no-eval'))
      .switchMap(res => {
        if (res.json().hasEval) {
          throw new HasEvalError();
        }

        return this.store;
      })
      .take(1)
      .toPromise()
      .then(s =>
        this.http
          .post(apiUrl(`start-version-upload/${s.sync.interactiveVersionId}`), {})
          .toPromise(),
      )
      .then(() => {
        this.snackRef.open('Bundle uploaded successfully', undefined, { duration: 3000 });
      })
      .finally(() => {
        snack.dismiss();
      })
      .catch(this.httpErr.catch('BundleNameTakenError', () => this.renameBundle()))
      .catch(HasEvalError, () => {
        this.notifyNoEval();
      })
      .catch(err => {
        this.showGenericError(err);
      });
  }

  /**
   * Displays a generic unknown error in a toast.
   */
  private showGenericError(err: any): void {
    const errSnack = this.snackRef.open('Error uploading bundle', 'View Error', {
      duration: 10000,
    });
    errSnack.onAction().subscribe(() => {
      window.open('about:blank').document.body.innerHTML += err.text ? err.text() : err.stack;
    });
  }

  /**
   * Prompts the user to rename their bundle, rerunning the upload on success.
   */
  private renameBundle(): Promise<void> {
    return this.dialog
      .open(RenameBundleDialogComponent)
      .afterClosed()
      .toPromise()
      .then(ok => {
        if (ok) {
          return this.upload();
        }

        return undefined;
      });
  }

  /**
   * Notifies the user that they cannot use eval functions in their bundle.
   */
  private notifyNoEval(): void {
    const errSnack = this.snackRef.open(
      'You cannot use eval() in control bundles. Run "miix upload" ' +
        'from the command line for details.',
      'Read Why',
      { duration: 10000 },
    );
    errSnack.onAction().subscribe(() => window.open('https://aka.ms/dont-be-eval'));
  }
}
