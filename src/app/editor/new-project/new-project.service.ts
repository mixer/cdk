import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { map, takeUntil } from 'rxjs/operators';

import { CommonMethods, UnhandledError } from '../bedrock.actions';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import * as forNewProject from './new-project.actions';
import { selectScreen } from './new-project.reducer';

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

    this.store
      .select(selectScreen)
      .pipe(
        takeUntil(ref.afterClosed()),
        map(screen => screen === forNewProject.NewProjectScreen.Creating),
      )
      .subscribe(disableClose => (ref.disableClose = disableClose));

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
      .call<string>(CommonMethods.ChooseDirectory, {
        title: 'Choose a folder where your project will be created.',
        context: 'newProject',
      })
      .then(dir => {
        if (!dir) {
          return;
        }

        this.store.dispatch(new forNewProject.SetTargetDirectory(dir));
        this.store.dispatch(new forNewProject.ChangeScreen());
      })
      .catch(err => this.store.dispatch(new UnhandledError(err)));
  }
}
