import { ErrorHandler } from '@angular/core';
import { rg4js } from './raygun-client';

/**
 * RaygunErrorHandler is an ErrorHandler that proprogate data to Raygun.
 */
export class RaygunErrorHandler extends ErrorHandler {
  public handleError(error: any) {
    super.handleError(error);
    rg4js('send', { error });
  }
}
