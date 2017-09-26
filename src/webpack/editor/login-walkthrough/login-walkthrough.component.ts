import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, Output } from '@angular/core';
import { Http } from '@angular/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/takeUntil';
import '../util/takeUntilDestroyed';

import { apiUrl, mixerUrl } from '../util/env';
import { MemorizingSubject } from '../util/memorizingSubject';

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
  @Output() public loggedIn = new MemorizingSubject<void>();

  /**
   * code is the shortcode to display to the user that they need to enter
   * on mixer.com/go in order to start login.
   */
  public code = new MemorizingSubject<string>();

  /**
   * codeUrl is the full Mixer URL the user should go to
   */
  public codeUrl: Observable<SafeUrl> = this.code.map(code =>
    this.sanitizer.bypassSecurityTrustUrl(`${mixerUrl()}/go?code=${code}`),
  );

  constructor(private readonly http: Http, private readonly sanitizer: DomSanitizer) {}

  public ngOnInit() {
    const sub = Observable.interval(1000)
      .startWith(null)
      .switchMap(() => this.http.get(apiUrl('login')))
      .takeUntilDestroyed(this)
      .map(res => res.json())
      .subscribe(res => {
        if (res.code) {
          this.code.next(res.code);
          return;
        }

        this.loggedIn.next(undefined);
        sub.unsubscribe();
      });
  }

  public ngOnDestroy() {
    // noop
  }
}
