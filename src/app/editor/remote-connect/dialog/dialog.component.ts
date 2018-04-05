import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { filter, take, takeUntil } from 'rxjs/operators';

import { ReportRpcError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import { toLatestFrom } from '../../shared/operators';
import { RemoteState, SetRemoteState } from '../remote-connect.actions';
import { selectRemoteError, selectRemoteState } from '../remote-connect.reducer';

/**
 * The RemoteConnectionDialog walks the user through plugging their local
 * controls into a remote connection.
 */
@Component({
  selector: 'remote-connection-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteConnectionDialogComponent {
  /**
   * Template hoist.
   */
  // tslint:disable-next-line
  public State = RemoteState;

  /**
   * State of the remote connection.
   */
  public state = this.store.select(selectRemoteState);

  constructor(
    private readonly store: Store<fromRoot.IState>,
    public readonly dialog: MatDialogRef<undefined>,
  ) {
    // Clear out any state or errors once the dialog closes if we
    // weren't able to successfully connect.
    dialog
      .beforeClose()
      .pipe(toLatestFrom(this.state))
      .subscribe(state => {
        if (state !== RemoteState.Active) {
          this.store.dispatch(new SetRemoteState(RemoteState.Disconnected));
        }
      });

    // Once we're active, close the dialog.
    store
      .select(selectRemoteState)
      .pipe(takeUntil(dialog.beforeClose()), filter(s => s === RemoteState.Active))
      .subscribe(() => dialog.close());
  }

  /**
   * Opens an issue regarding the current connection error.
   */
  public openIssue() {
    this.store
      .select(selectRemoteError)
      .pipe(take(1))
      .subscribe(error => {
        if (error) {
          this.store.dispatch(new ReportRpcError('Error connecting to channel controls', error));
        }

        this.dialog.close();
      });
  }
}
