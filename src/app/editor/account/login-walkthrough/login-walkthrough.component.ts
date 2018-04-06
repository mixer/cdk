import { ChangeDetectionStrategy, Component, OnDestroy, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { filter, map } from 'rxjs/operators';

import { IUser } from '../../../../server/profile';
import * as fromRoot from '../../bedrock.reducers';
import { truthy, untilDestroyed } from '../../shared/operators';
import { AccountLinkingService } from '../account-linking.service';
import * as fromAccount from '../account.reducer';

/**
 * The Launch Dialog prompts the user to log in, and connect to Interactive
 * for them. It calls back with connection details, or undefined if the dialog
 * was dismissed beforehand.
 */
@Component({
  selector: 'account-login-walkthrough',
  templateUrl: './login-walkthrough.component.html',
  styleUrls: ['../../shared/dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginWalkthroughComponent implements OnDestroy {
  /**
   * Emits once the user logs in.
   */
  @Output()
  public loggedIn: Observable<IUser> = this.store
    .select(fromAccount.currentUser)
    .pipe(filter<IUser>(user => !!user));

  /**
   * code is the shortcode to display to the user that they need to enter
   * on mixer.com/go in order to start login.
   */
  public code = this.store.select(fromAccount.linkCode);

  /**
   * codeUrl is the full Mixer URL the user should go to
   */
  public codeUrl = this.code.pipe(truthy(), map(code => `https://mixer.com/go?code=${code!.code}`));

  constructor(private readonly store: Store<fromRoot.IState>, linking: AccountLinkingService) {
    linking
      .requestLinkCodes()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  public ngOnDestroy(): void {
    // noop
  }
}
