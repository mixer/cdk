import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';

import { CommonMethods, UnhandledError } from '../bedrock.actions';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import * as forNewProject from './new-project.actions';

/**
 * The NewProjectService holds common state while the project wizard is open.
 */
@Injectable()
export class NewProjectService {
  private dialog: MatDialogRef<any>;

  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly electron: ElectronService,
  ) {}

  /**
   * Sets the dialog reference the project is in.
   */
  public setDialog(ref: MatDialogRef<any>) {
    this.dialog = ref;

    ref.afterClosed().subscribe(() => this.store.dispatch(new forNewProject.Cancel()));
  }

  /**
   * Closes the dialog and clears on existing state.
   */
  public cancel() {
    this.dialog.close();
  }

  /**
   * Chooses the directory
   */
  public chooseDirectory() {
    this.electron
      .call<string>(CommonMethods.ChooseDirectory, { context: 'newProject' })
      .then(dir => {
        if (!dir) {
          return;
        }

        this.store.dispatch(new forNewProject.SetTargetDirectory(dir));
        this.store.dispatch(new forNewProject.ChangeScreen(forNewProject.NewProjectScreen.Layout));
      })
      .catch(err => this.store.dispatch(new UnhandledError(err)));
  }
}
