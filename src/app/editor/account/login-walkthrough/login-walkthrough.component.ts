import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';

import { filter } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import * as fromAccount from '../account.reducer';
import { RefreshLinkCode, CancelLinking } from '../account.actions';
import { IUser } from '../../../../server/profile';

/**
 * The Launch Dialog prompts the user to log in, and connect to Interactive
 * for them. It calls back with connection details, or undefined if the dialog
 * was dismissed beforehand.
 */
@Component({
  selector: 'editor-login-walkthrough',
  templateUrl: './login-walkthrough.component.html',
  styleUrls: ['../dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginWalkthroughComponent implements OnInit, OnDestroy {
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
  public code = this.store.select(fromAccount.linkCode)
    .pipe(filter(code => !!code && code.expiresAt.getTime() < Date.now()));

  /**
   * codeUrl is the full Mixer URL the user should go to
   */
  public codeUrl: Observable<SafeUrl> = this.code.map(code =>
    this.sanitizer.bypassSecurityTrustUrl(`https://mixer.com/go?code=${code}`),
  );

  constructor(
    private readonly store: Store<fromRoot.State>,
    private readonly sanitizer: DomSanitizer,
  ) {}

  public ngOnInit() {
    this.store.dispatch(new RefreshLinkCode());
  }

  public ngOnDestroy() {
    this.store.dispatch(new CancelLinking());
  }
}
