import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Http, Response } from '@angular/http';
import { MdDialogRef, MdSnackBar } from '@angular/material';
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
import { apiUrl } from '../util/env';
import { reportHttpError } from '../util/report-issue';

export enum State {
  LoggingIn,
  Connecting,
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
  styleUrls: ['../dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaunchDialogComponent {
  /**
   * Exposed State enum for the template to consume.
   */
  public State = State; // tslint:disable-line

  /**
   * Curre state of the component.
   */
  public state = new BehaviorSubject(State.LoggingIn);

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
    private readonly store: Store<IProject>,
  ) {}

  public onLoggedIn() {
    this.state.next(State.Connecting);
    this.connect();
  }

  /**
   * Attempts to create a connection to Interactive. Closes the dialog
   * when it successfully does so.
   */
  private connect() {
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
