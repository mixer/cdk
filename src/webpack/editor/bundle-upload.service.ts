import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { MdSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { apiUrl } from './util/env';

import { IProject } from './redux/project';

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
    this.store
      .take(1)
      .switchMap(s =>
        this.http.post(apiUrl(`start-version-upload/${s.sync.interactiveVersionId}`), {}),
      )
      .subscribe(
        () => {
          this.snackRef.open('Bundle uploaded successfully', undefined, { duration: 3000 });
        },
        (err: Response) => {
          const errSnack = this.snackRef.open('Error uploading bundle', 'View Error', {
            duration: 5000,
          });
          errSnack.onAction().subscribe(() => {
            window.open('about:blank').document.body.innerHTML += err.text();
          });
        },
        () => {
          snack.dismiss();
        },
      );
  }
}
