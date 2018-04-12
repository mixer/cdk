import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { ReportRpcError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import { selectRemoteError } from '../remote-connect.reducer';

/**
 * Shown when an error occurs booting up the remote controls.
 */
@Component({
  selector: 'remote-connection-error',
  templateUrl: './connection-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteConnectionErrorComponent {
  /**
   * Emits any error that occurred during connection.
   */
  public error = this.store.select(selectRemoteError);

  constructor(
    private readonly store: Store<fromRoot.IState>,
    public readonly dialog: MatDialogRef<undefined>,
  ) {}

  /**
   * Opens an issue regarding the current connection error.
   */
  public openIssue() {
    this.error.pipe(take(1)).subscribe(error => {
      if (error) {
        this.store.dispatch(new ReportRpcError('Error connecting to channel controls', error));
      }

      this.dialog.close();
    });
  }
}
