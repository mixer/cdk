import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { tap } from 'rxjs/operators';

import {
  BedrockActions,
  CommonMethods,
  ReportGenericError,
  ReportRpcError,
  ToggleDevTools,
} from './bedrock.actions';
import { ElectronService } from './electron.service';
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
  /**
   * Fired when we want to report a generic error.
   */
  @Effect({ dispatch: false })
  public readonly toggleDevtools = this.actions
    .ofType<ToggleDevTools>(BedrockActions.ToggleDevTools)
    .pipe(tap(action => this.electron.call(CommonMethods.ToggleDevTools, action.inspectCoords)));

  constructor(
    private readonly actions: Actions,
    private readonly issues: IssueService,
    private readonly electron: ElectronService,
  ) {}
}
