import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { defer } from 'rxjs/observable/defer';
import { of } from 'rxjs/observable/of';
import { filter, map, mapTo, switchMap, withLatestFrom } from 'rxjs/operators';

import { MatDialog } from '@angular/material';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import {
  AccountActionTypes,
  AccountMethods,
  FinishLogout,
  RequireAuth,
  SetLoggedInAccount,
} from './account.actions';
import { currentUser } from './account.reducer';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';

/**
 * Effects module for account actions.
 */
@Injectable()
export class AccountEffects {
  /**
   * Fired when the service is created; sets the currently logged in account
   * from the profile, if any.
   */
  @Effect()
  public readonly getInitialAccount = defer(async () =>
    this.electron.call(AccountMethods.GetLinkedAccount),
  ).pipe(filter(Boolean), map(account => new SetLoggedInAccount(account)));

  /**
   * Runs a logout action.
   */
  @Effect()
  public readonly logout = this.actions
    .ofType(AccountActionTypes.START_LOGOUT)
    .pipe(switchMap(() => this.electron.call(AccountMethods.Logout)), mapTo(new FinishLogout()));

  /**
   * Runs an action that requires auth, see the RequireAuth action for details.
   */
  @Effect()
  public readonly requireAuth = this.actions
    .ofType<RequireAuth>(AccountActionTypes.REQUIRE_AUTH)
    .pipe(
      withLatestFrom(this.store.select(currentUser)),
      switchMap(([action, user]) => {
        if (user) {
          return of(action.successAction);
        }

        return this.dialog
          .open(LoginDialogComponent)
          .afterClosed()
          .pipe(map(u => (u ? action.successAction : action.failedAction)), filter(a => !!a));
      }),
    );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly dialog: MatDialog,
    private readonly store: Store<fromRoot.IState>,
  ) {}
}
