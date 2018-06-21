import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import {
  IInteractiveGame,
  LoadOwnedGames,
  SetInteractiveGame,
  UnlinkInteractiveGame,
} from '../project.actions';
import * as fromProject from '../project.reducer';

/**
 * The NewProjectDialog is the host component for the new project wizard.
 */
@Component({
  selector: 'link-dialog',
  templateUrl: './link-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./link-dialog.component.scss'],
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
    public readonly dialog: MatDialogRef<IInteractiveGame>,
  ) {}

  /**
   * Unlink a game from the project.
   */
  public link(project: IInteractiveGame) {
    this.store.dispatch(new SetInteractiveGame(project));
    this.dialog.close(project);
  }

  /**
   * Unlinks the linked game from the control.
   */
  public unlink() {
    this.store.dispatch(new UnlinkInteractiveGame());
    this.dialog.close(undefined);
  }

  /**
   * Reloads the games the user owns.
   */
  public reload() {
    this.store.dispatch(new LoadOwnedGames());
  }
}
