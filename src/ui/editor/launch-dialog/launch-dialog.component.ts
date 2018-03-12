import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Http, Response } from '@angular/http';
import { MatDialogRef, MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { IProject } from '../redux/project';
import { IInteractiveVersion } from '../redux/sync';

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/takeUntil';

import { HttpErrorService } from '../http-error.service';
import { IInteractiveJoin } from '../redux/connect';
import { apiUrl } from '../util/env';
import { reportHttpError } from '../util/report-issue';

export enum State {
  LoggingIn,
  Connecting,
  AwaitingGameClient,
  NotifyMismatched,
}

/**
 * The Launch Dialog prompts the user to log in, and connect to Interactive
 * for them. It calls back with connection details, or undefined if the dialog
 * was dismissed beforehand.
 */
@Component({
  selector: 'launch-dialog',
  templateUrl: './launch-dialog.component.html',
  styleUrls: ['../dialog.scss', './launch-dialog.component.scss'],
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
   * Mismatched version data, used to display a message if the user is
   * connecting to a version different than what's linked to their project.
   */
  public versionMismatch: {
    intendedVersion: IInteractiveVersion;
    actualVersion: IInteractiveVersion;
  };

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

  /**
   * Data loaded from a successful join response.
   */
  private loadedData: IInteractiveJoin;

  constructor(
    private readonly http: Http,
    private readonly dialogRef: MatDialogRef<IInteractiveJoin>,
    private readonly snackRef: MatSnackBar,
    private readonly store: Store<IProject>,
    private readonly httpErr: HttpErrorService,
  ) {}

  public onLoggedIn() {
    this.state.next(State.Connecting);
    this.connect();
  }

  /**
   * Closes the dialog with the data to connect to Interactive.
   */
  public acceptConnect() {
    this.dialogRef.close(this.loadedData);
  }

  /**
   * Cancels connecting and closes the dialog.
   */
  public cancelConnect() {
    this.dialogRef.close();
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
      .retryWhen(this.httpErr.retryOnLoginError)
      .combineLatest(this.store.map(s => s.sync.interactiveVersion))
      .subscribe(
        ([res, version]) => {
          const data: IInteractiveJoin = res.json();
          this.loadedData = data;

          // If the game client is not connected, wait for it to do so.
          if (!data.address) {
            this.waitForConnect();
            return;
          }

          // Prompt the user is the game version the client is connecting
          // with is different than the one they have linked.
          if (version && version.id !== data.version.id) {
            this.versionMismatch = {
              intendedVersion: version,
              actualVersion: data.version,
            };
            this.state.next(State.NotifyMismatched);
            return;
          }

          this.acceptConnect();
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
              this.cancelConnect();
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
