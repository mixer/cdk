import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { IInteractiveGame, SetInteractiveGame } from '../project.actions';
import * as fromProject from '../project.reducer';

/**
 * The NewProjectDialog is the host component for the new project wizard.
 */
@Component({
  selector: 'link-dialog',
  templateUrl: './link-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkProjectDialogComponent {
  /**
   * Selects the linked interactive project.
   */
  public linkedGame = this.store.select(fromProject.selectLinkedGame);

  /**
   * Selects the games a user owns.
   */
  public games = this.store.select(fromProject.selectOwnedGames);

  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly dialog: MatDialogRef<IInteractiveGame>,
  ) {}

  /**
   * Deletes a snapshot from the store.
   */
  public link(project: IInteractiveGame) {
    this.store.dispatch(new SetInteractiveGame(project));
    this.dialog.close(project);
  }
}
