import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { DeleteSnapshot, ISnapshot, LoadSnapshot, workingSnapshoptName } from '../schema.actions';
import * as fromSchema from '../schema.reducer';

/**
 * The NewProjectDialog is the host component for the new project wizard.
 */
@Component({
  selector: 'open-snapshot-dialog',
  templateUrl: './open-snapshot-dialog.component.html',
  styleUrls: ['../snapshots.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenSnapshotDialogComponent {
  /**
   * A list of all saved snapshots.
   */
  public readonly snapshots = this.store.select(fromSchema.selectAllSnapshots);

  /**
   * Template hoist.
   */
  public readonly workingName = workingSnapshoptName;

  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly dialog: MatDialogRef<any>,
  ) {}

  /**
   * Deletes a snapshot from the store.
   */
  public deleteSnapshot(snap: ISnapshot) {
    this.store.dispatch(new DeleteSnapshot(snap.name));
  }

  /**
   * Open a snapshot, and closes the dialog.
   */
  public openSnapshot(snap: ISnapshot) {
    this.store.dispatch(new LoadSnapshot(snap)); // oh snap!
    this.dialog.close();
  }
}
