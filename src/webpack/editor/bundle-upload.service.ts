import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { MdSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';

import { IProject } from './redux/project';
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
  ) {}

  /**
   * Upload stars a bundle upload.
   */
  public upload() {
    const snack = this.snackRef.open('Bundling and uploading controls...');

    this.http
      .get(apiUrl('ensure-no-eval'))
      .switchMap(res => {
        if (res.json().hasEval) {
          throw new HasEvalError();
        }

        return this.store.take(1);
      })
      .switchMap(s =>
        this.http.post(apiUrl(`start-version-upload/${s.sync.interactiveVersionId}`), {}),
      )
      .subscribe(
        () => {
          this.snackRef.open('Bundle uploaded successfully', undefined, { duration: 3000 });
        },
        (err: Response | HasEvalError) => {
          if (err instanceof HasEvalError) {
            const errSnack = this.snackRef.open(
              'You cannot use eval() in control bundles. Run "miix upload" ' +
                'from the command line for details.',
              'Read Why',
              { duration: 10000 },
            );
            errSnack.onAction().subscribe(() => window.open('https://aka.ms/dont-be-eval'));
          } else {
            const errSnack = this.snackRef.open('Error uploading bundle', 'View Error', {
              duration: 10000,
            });
            errSnack.onAction().subscribe(() => {
              window.open('about:blank').document.body.innerHTML += err.text();
            });
          }
        },
        () => {
          snack.dismiss();
        },
      );
  }
}
