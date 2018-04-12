import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { defer } from 'rxjs/observable/defer';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { merge } from 'rxjs/observable/merge';
import { of } from 'rxjs/observable/of';
import { concat, filter, map, switchMap, takeWhile, tap } from 'rxjs/operators';

import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { ElectronService } from '../electron.service';
import { compareSemver } from '../shared/semver-compare';
import { InstallNodeModalComponent } from './install-node-modal/install-node-modal.component';
import {
  INodeData,
  InstallReason,
  MarkPassed,
  minNodeVersion,
  PreflightActionTypes,
  PreflightMethods,
  PromptInstallNode,
  RunChecks,
} from './preflight.actions';

/**
 * Effects for preflight checks.
 */
@Injectable()
export class PreflightEffects {
  /**
   * Pops a modal if we're told this machine doesn't have Node.js installed.
   */
  @Effect({ dispatch: false })
  public readonly promptInstallNode = this.actions
    .ofType<PromptInstallNode>(PreflightActionTypes.PROMPT_NODE)
    .pipe(
      tap(action =>
        this.dialog.open(InstallNodeModalComponent, {
          data: action,
        }),
      ),
    );

  /**
   * Runs preflight checks on demand.
   */
  @Effect()
  public readonly runPreflightChecks = this.actions.ofType(PreflightActionTypes.RUN).pipe(
    switchMap(() => {
      // take actions from each check, and stop taking them once it emits
      // a PASS action. Discard the PASS actions until there
      // are no more pending checks.

      let pending = this.preflightChecks.length;
      return merge(
        ...this.preflightChecks.map(check =>
          check().pipe(
            takeWhile(action => action.type !== PreflightActionTypes.PASS),
            concat(of(new MarkPassed())),
          ),
        ),
      ).pipe(
        filter(action => (action.type === PreflightActionTypes.PASS ? --pending === 0 : true)),
      );
    }),
  );

  /**
   * Runs preflight checks when the page opens.
   */
  @Effect() public readonly runInitialChecks = defer(() => of(new RunChecks()));

  /**
   * A map of preflight checks to run. Each check can omit actions, once it
   * emits a PASSED action, the check will be marked as succeeded. After all
   * checks succeed, a global PASSED is bubbled up.
   */
  private readonly preflightChecks: (() => Observable<Action>)[] = [
    () =>
      fromPromise<INodeData>(this.electron.call(PreflightMethods.GetNodeData)).pipe(
        map(result => {
          if (!result.isPresent) {
            return new PromptInstallNode(InstallReason.NotPresent, result.platform);
          }
          if (compareSemver(minNodeVersion, result.version!) > 0) {
            return new PromptInstallNode(InstallReason.OldVersion, result.platform);
          }

          return new MarkPassed();
        }),
      ),
  ];

  constructor(
    private readonly actions: Actions,
    private readonly dialog: MatDialog,
    private readonly electron: ElectronService,
  ) {}
}
