import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { StartLogout } from '../account.actions';
import * as fromAccount from '../account.reducer';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'account-switcher',
  templateUrl: './account-switcher.component.html',
  styleUrls: ['./account-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSwitcherComponent {
  /**
   * Observable of the currently logged in user, if any.
   */
  public currentUser = this.store.select(fromAccount.currentUser);

  constructor(private readonly store: Store<fromRoot.IState>, private readonly dialog: MatDialog) {}

  public openLogin() {
    this.dialog.open(LoginDialogComponent);
  }

  public logout() {
    this.store.dispatch(new StartLogout());
  }
}
