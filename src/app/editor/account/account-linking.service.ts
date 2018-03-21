import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { IUser } from '../../../server/profile';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import { AccountMethods, CancelLinking, SetLoggedInAccount } from './account.actions';

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
