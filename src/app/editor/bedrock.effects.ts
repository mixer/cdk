import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

import { BedrockActions, ReportGenericError, ReportRpcError } from './bedrock.actions';
import { IssueService } from './issue.service';

/**
 * Effects module for base actions.
 */
@Injectable()
export class BedrockEffects {
  /**
   * Fired when we want to report an rpc error.
   */
  @Effect({ dispatch: false })
  public readonly reportRpcError = this.actions
    .ofType<ReportRpcError>(BedrockActions.ReportRpcError)
    .pipe(tap(err => this.issues.reportRpcError(err.title, err.original)));

  /**
   * Fired when we want to report a generic error.
   */
  @Effect({ dispatch: false })
  public readonly reportGenericError = this.actions
    .ofType<ReportGenericError>(BedrockActions.ReportGenericError)
    .pipe(tap(err => this.issues.reportIssue(err.title, err.message)));

  constructor(private readonly actions: Actions, private readonly issues: IssueService) {}
}
