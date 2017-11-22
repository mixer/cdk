import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { MatSnackBar } from '@angular/material';

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
 * IJoiError is the error result returned if Joi validation fails.
 */
export interface IJoiError {
  isJoi: true;
  name: 'ValidationError';
  details: {
    context: {
      key: string;
      label: string;
    };
    message: string;
    path: string[];
    type: string;
  }[];
}

/**
 * The HttpError services wraps handling of common errors into an easily
 * reusable pattern.
 */
@Injectable()
export class HttpErrorService {
  constructor(private readonly snackRef: MatSnackBar) {}

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
        throw res;
      }

      return Promise.resolve(handler(json, res));
    };
  }

  /**
   * Handles Joi errors from the server.
   */
  public joi<T>(
    handler: (err: IJoiError, res: Response) => T | Promise<T>,
  ): (res: Response) => Promise<T> {
    return res => {
      let json: IJoiError;
      try {
        json = res.json();
      } catch (err) {
        throw res;
      }
      if (json.isJoi !== true) {
        throw res;
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
