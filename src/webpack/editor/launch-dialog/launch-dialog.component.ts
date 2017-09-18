import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Http, Response } from '@angular/http';
import { MdDialogRef, MdSnackBar } from '@angular/material';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { IProject } from '../redux/project';

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/takeUntil';

import { IInteractiveJoin } from '../redux/connect';
import { apiUrl, mixerUrl } from '../util/env';
import { MemorizingSubject } from '../util/memorizingSubject';
import { reportHttpError } from '../util/report-issue';

export enum State {
  Connecting,
  AwaitingLogin,
  AwaitingGameClient,
}

/**
 * The Launch Dialog prompts the user to log in, and connect to Interactive
 * for them. It calls back with connection details, or undefined if the dialog
 * was dismissed beforehand.
 */
@Component({
  selector: 'launch-dialog',
  templateUrl: './launch-dialog.component.html',
  styleUrls: ['./launch-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaunchDialogComponent implements OnInit {
  /**
   * Exposed State enum for the template to consume.
   */
  public State = State; // tslint:disable-line

  /**
   * Curre state of the component.
   */
  public state = new BehaviorSubject(State.Connecting);

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

  /**
   * Dots used to subtly indicate progress.
   */
  public dots = Observable.interval(250)
    .map(x => {
      let n = '.';
      while (n.length < x % 3 + 1) {
        n += '.';
      }
      return n;
    })
    .publishReplay(1)
    .refCount();

  constructor(
    private readonly http: Http,
    private readonly dialogRef: MdDialogRef<IInteractiveJoin>,
    private readonly snackRef: MdSnackBar,
    private readonly sanitizer: DomSanitizer,
    private readonly store: Store<IProject>,
  ) {}

  public ngOnInit() {
    setTimeout(() => {
      this.connect();
    }, 250);
  }

  /**
   * Attempts to create a connection to Interactive. Closes the dialog
   * when it successfully does so.
   */
  public connect() {
    this.store
      .select(s => s.connect.channelOverride)
      .take(1)
      .switchMap(channelID =>
        this.http.get(apiUrl('connect-participant'), { params: { channelID } }),
      )
      .subscribe(
        res => {
          const data: IInteractiveJoin = res.json();
          if (!data.address) {
            this.waitForConnect();
          } else {
            this.dialogRef.close(data);
          }
        },
        (err: Response) => {
          switch (err.status) {
            case 401:
              this.login();
              break;
            case 409:
              this.waitForConnect();
              break;
            default:
              this.snackRef
                .open('An unknown error occurred', 'Report', { duration: 5000 })
                .onAction()
                .subscribe(() => {
                  reportHttpError('Unknown error in launch dialog', err);
                });
              this.dialogRef.close();
              break;
          }
        },
      );
  }

  /**
   * Waits for the user to log in (or the dialog to close) and then tries
   * to connect() to Interactive.
   */
  private login() {
    this.state.next(State.AwaitingLogin);

    const sub = Observable.interval(1000)
      .switchMap(() => this.http.get(apiUrl('login')))
      .takeUntil(this.dialogRef.afterClosed())
      .map(res => res.json())
      .subscribe(res => {
        if (res.code) {
          this.code.next(res.code);
          return;
        }

        this.state.next(State.Connecting);
        this.connect();
        sub.unsubscribe();
      });
  }

  /**
   * Waits for the game client connect, polling occasionally.
   */
  private waitForConnect() {
    this.state.next(State.AwaitingGameClient);
    Observable.interval(5000)
      .take(1)
      .takeUntil(this.dialogRef.afterClosed())
      .subscribe(() => {
        this.connect();
      });
  }
}
