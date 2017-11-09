import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { MdSnackBar } from '@angular/material';

import 'rxjs/add/operator/toPromise';

import { reportHttpError } from './util/report-issue';

/**
 * IResponseError is the formed Error returned in responses from the dev server.
 */
export interface IResponseError<T> {
  name: string;
  message: string;
  stack: string;
  metadata: T;
}

/**
 * The HttpError services wraps handling of common errors into an easily
 * reusable pattern.
 */
@Injectable()
export class HttpErrorService {
  constructor(private readonly snackRef: MdSnackBar) {}

  /**
   * Handled a named error from the API.
   */
  public catch<T, E>(
    errName: string,
    handler: (err: IResponseError<E>, res: Response) => T | Promise<T>,
  ): (res: Response) => Promise<T> {
    return res => {
      let json: IResponseError<E>;
      try {
        json = res.json();
      } catch (err) {
        throw res;
      }
      if (json.name !== errName) {
        throw errName;
      }

      return Promise.resolve(handler(json, res));
    };
  }

  /**
   * Toasts about a response error, and resolves void.
   */
  public toast = (res: Response): void => {
    this.snackRef
      .open('An unknown error occurred', 'Report', { duration: 5000 })
      .onAction()
      .subscribe(() => {
        reportHttpError(`Unknown calling ${res.url}`, res);
      });
  };
}
