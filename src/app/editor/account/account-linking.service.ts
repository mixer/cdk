import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import * as fromRoot from '../bedrock.reducers';
import { IUser } from '../../../server/profile';
import { SetLoggedInAccount, CancelLinking, AccountMethods } from './account.actions';
import { ElectronService } from '../electron.service';

/**
 * The AccountLinkingService handles
 */
@Injectable()
export class AccountLinkingService {
  constructor(
    private readonly store: Store<fromRoot.State>,
    private readonly electron: ElectronService,
  ) {}

  /**
   * Returns an observable that resolves to the currently logged in user.
   * Updates the state with link codes as needed until the user logs in,
   */
  public requestLinkCodes(): Observable<IUser> {
    return new Observable<IUser>(subscriber => {
      const getLink = (): Promise<void> => {
        return this.electron.call<IUser>(AccountMethods.LinkAccount).then(user => {
          if (!user && !subscriber.closed) {
            return getLink();
          }

          this.store.dispatch(new SetLoggedInAccount(user));
          subscriber.next(user);
          subscriber.complete();
          return;
        });
      };

      getLink();

      return () => {
        this.store.dispatch(new CancelLinking());
      };
    });
  }
}
