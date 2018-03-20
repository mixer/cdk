import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { AccountActionTypes, SetLoggedInAccount, SetLinkCode } from './account.actions';
import { MatDialog } from '@angular/material';
import { Observable } from 'rxjs/Observable';

import { switchMap, filter, map, takeUntil} from 'rxjs/operators';
import { defer } from 'rxjs/observable/defer';

import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { Profile } from '../../../server/profile';
import { NoAuthenticationError } from '../../../server/errors';

/**
 * Effects module for account actions.
 */
@Injectable()
export class AccountEffects {
  /**
   * Triggers a login pop on request, and effects the login if successful.
   */
  @Effect()
  public readonly openLoginFlow: Observable<Action> = this.actions
    .ofType(AccountActionTypes.OPEN_LOGIN_FLOW)
    .pipe(
      switchMap(() => this.dialog.open(LoginDialogComponent).afterClosed()),
      filter(Boolean),
      map(account => new SetLoggedInAccount(account)),
    );

  /**
   * Triggers the link code to refresh.
   */
  @Effect()
  public readonly refreshLinkCode: Observable<Action> = this.actions
    .ofType(AccountActionTypes.LINK_REFRESH_CODE)
    .pipe(
      switchMap(() =>
        new Observable<Action>(subscriber => {
          const profile = new Profile();

          profile
            .grant({
              prompt: (code, expiresAt) => subscriber.next(new SetLinkCode(code, expiresAt)),
              isCancelled: () => subscriber.closed,
            })
            .then(() => profile.user())
            .then(user => {
              subscriber.next(new SetLoggedInAccount(user));
              subscriber.complete();
            });
        }),
      ),
      takeUntil(this.actions.ofType(AccountActionTypes.LINK_CANCEL)),
    );

  /**
   * Fired when the service is created; sets the currently logged in account
   * from the profile, if any.
   */
  @Effect()
  public readonly getInitialAccount: Observable<Action> = defer(async () => {
    try {
      return new Profile().user();
    } catch (e) {
      if (e instanceof NoAuthenticationError) {
        return null;
      }

      throw e;
    }
  }).pipe(filter(Boolean), map(account => new SetLoggedInAccount(account)));

  constructor(private readonly actions: Actions, private readonly dialog: MatDialog) {}
}
