import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { NewProjectScreen } from '../new-project.actions';
import * as fromNewProject from '../new-project.reducer';
import { NewProjectService } from '../new-project.service';

/**
 * The NewProjectDialog is the host component for the new project wizard.
 */
@Component({
  selector: 'new-project-dialog',
  templateUrl: './new-project-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectDialogComponent {
  /**
   * Current screen we're on.
   */
  public readonly screen = this.store.select(fromNewProject.selectScreen);

  /**
   * Template hoise.
   */
  // tslint:disable-next-line
  public readonly Screens = NewProjectScreen;

  constructor(
    dialog: MatDialogRef<undefined>,
    project: NewProjectService,
    private readonly store: Store<fromRoot.IState>,
  ) {
    project.setDialog(dialog);
  }
}
