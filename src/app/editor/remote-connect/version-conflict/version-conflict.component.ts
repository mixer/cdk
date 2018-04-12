import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { RequireAuth } from '../../account/account.actions';
import * as fromRoot from '../../bedrock.reducers';
import { StartChangeLink } from '../../project/project.actions';
import { selectLinkedGame } from '../../project/project.reducer';
import { RemoteState, SetRemoteState } from '../remote-connect.actions';
import { selectJoin } from '../remote-connect.reducer';

/**
 * Shown while waiting for the game client to connect.
 */
@Component({
  selector: 'remote-connection-version-conflict',
  templateUrl: './version-conflict.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteConnectionVersionConflictComponent {
  public connectedGameName = this.store.select(selectJoin).pipe(map(j => j && j.version.game.name));
  public connectedVersionId = this.store.select(selectJoin).pipe(map(j => j && j.version.id));
  public linkedGameName = this.store.select(selectLinkedGame).pipe(map(j => j && j.name));
  public linkedVersionId = this.store
    .select(selectLinkedGame)
    .pipe(map(j => j && j.versions[0].id));

  constructor(
    public readonly dialog: MatDialogRef<undefined>,
    private readonly store: Store<fromRoot.IState>,
  ) {}

  /**
   * Finalizes the connect to the channel, ignoring the conflict..
   */
  public continue() {
    this.store.dispatch(new SetRemoteState(RemoteState.Active));
  }

  /**
   * Opens a dialog to change the linked game.
   */
  public link() {
    this.dialog.close();
    this.dialog.afterClosed().subscribe(() => {
      this.store.dispatch(new RequireAuth(new StartChangeLink()));
    });
  }
}
