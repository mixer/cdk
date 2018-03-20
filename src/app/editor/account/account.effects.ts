import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';

import { filter, map, switchMap, mapTo } from 'rxjs/operators';
import { defer } from 'rxjs/observable/defer';

import { SetLoggedInAccount, AccountMethods, AccountActionTypes, FinishLogout } from './account.actions';
import { ElectronService } from '../electron.service';

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
  public readonly getInitialAccount = defer(async () => this.electron.call(AccountMethods.GetLinkedAccount)).pipe(filter(Boolean), map(account => new SetLoggedInAccount(account)));

  /**
   * Runs a logout action.
   */
  @Effect()
  public readonly logout = this.actions
    .ofType(AccountActionTypes.START_LOGOUT)
    .pipe(
      switchMap(() => this.electron.call(AccountMethods.Logout)),
      mapTo(new FinishLogout()),
    );

  constructor(private readonly actions: Actions, private readonly electron: ElectronService) {}
}
