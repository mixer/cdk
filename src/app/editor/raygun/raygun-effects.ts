import { Injectable } from '@angular/core';
import { Effect } from '@ngrx/effects';
import { Actions } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

import { AccountActionTypes, SetLoggedInAccount } from '../account/account.actions';
import { BedrockActions, ReportGenericError, ReportRpcError } from '../bedrock.actions';
import { rg4js } from './raygun-client';

/**
 * Effects for Raygun telemetry.
 */
@Injectable()
export class RaygunEffects {
  /**
   * Sends telemetry when someone reports a generic error.
   */
  @Effect({ dispatch: false })
  public readonly reportGenericError = this.actions
    .ofType<ReportGenericError>(BedrockActions.ReportGenericError)
    .pipe(
      tap(action =>
        rg4js('trackEvent', {
          type: 'reportError',
          message: action.message,
          title: action.title,
        }),
      ),
    );

  /**
   * Sends telemetry when someone reports an RPC error.
   */
  @Effect({ dispatch: false })
  public readonly reportRpcError = this.actions
    .ofType<ReportRpcError>(BedrockActions.ReportRpcError)
    .pipe(
      tap(action =>
        rg4js('trackEvent', {
          type: 'reportError',
          message: action.original.stack || action.original.message,
          title: action.title,
        }),
      ),
    );

  /**
   * Updates the authenticated user.
   */
  @Effect({ dispatch: false })
  public readonly setUser = this.actions
    .ofType<SetLoggedInAccount>(AccountActionTypes.SET_LOGGED_IN_ACCOUNT)
    .pipe(
      tap(action =>
        rg4js('setUser', {
          type: 'reportError',
          isAnonymous: false,
          username: action.account.username,
        }),
      ),
    );

  constructor(private readonly actions: Actions) {}
}
