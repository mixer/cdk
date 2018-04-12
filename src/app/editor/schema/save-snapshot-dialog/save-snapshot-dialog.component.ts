import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { take } from 'rxjs/operators';
import { map } from 'rxjs/operators';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as fromRoot from '../../bedrock.reducers';
import { DeleteSnapshot, ISnapshot, SaveSnapshot, workingSnapshoptName } from '../schema.actions';
import * as fromSchema from '../schema.reducer';
import { selectWorld } from '../schema.reducer';

/**
 * The NewProjectDialog is the host component for the new project wizard.
 */
@Component({
  selector: 'save-snapshot-dialog',
  templateUrl: './save-snapshot-dialog.component.html',
  styleUrls: ['../snapshots.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveSnapshotDialogComponent {
  /**
   * A list of all saved snapshots.
   */
  public readonly snapshots = this.store.select(fromSchema.selectAllSnapshots);

  /**
   * Template hoist.
   */
  public readonly workingName = workingSnapshoptName;

  /**
   * Manually-entered name for the save.
   */
  public saveName = new BehaviorSubject(`Save from ${moment().format('D/MM HH:mm')}`);

  /**
   * Returns whether the given saveName would overwrite an existing save.
   */
  public isOverwriting = combineLatest(this.saveName, this.snapshots).pipe(
    map(([name, all]) => all.some(a => a.name === name)),
  );

  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly dialog: MatDialogRef<any>,
  ) {
    this.store
      .select(fromSchema.selectLoadedSnapshot)
      .pipe(take(1))
      .subscribe(loaded => {
        if (loaded && loaded !== workingSnapshoptName) {
          this.saveName.next(loaded);
        }
      });
  }

  /**
   * Deletes a snapshot from the store.
   */
  public deleteSnapshot(snap: ISnapshot) {
    this.store.dispatch(new DeleteSnapshot(snap.name));
  }

  /**
   * Saves the snapshot, and closes the dialog.
   */
  public saveSnapshot(name: string) {
    this.store
      .select(selectWorld)
      .pipe(take(1))
      .subscribe(world => {
        this.store.dispatch(new SaveSnapshot(name, world));
        this.dialog.close();
      });
  }
}
