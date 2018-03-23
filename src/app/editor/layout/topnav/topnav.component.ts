import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { NewProjectDialogComponent } from '../../new-project/new-project-dialog/new-project-dialog.component';
import { StartOpenProject } from '../../project/project.actions';
import { ClosePanel, GoldenPanel, OpenPanel } from '../layout.actions';
import { isOnEditor, panelIsOpen } from '../layout.reducer';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'layout-topnav',
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
  /**
   * Template hoist
   */
  // tslint:disable-next-line
  public readonly Panel = GoldenPanel;

  /**
   * Selects whether the editor screen is open.
   */
  public readonly isOnEditor = this.store.select(isOnEditor);

  constructor(private readonly dialog: MatDialog, private readonly store: Store<fromRoot.IState>) {}

  /**
   * Opens the wizard to start creating a new project.
   */
  public createNewProject() {
    this.dialog.open(NewProjectDialogComponent);
  }

  /**
   * Opens an existing project.
   */
  public openProject() {
    this.store.dispatch(new StartOpenProject());
  }

  /**
   * Returns an observable that emits whether the given panel is open.
   */
  public panelOpen(panel: GoldenPanel) {
    return this.store.select(panelIsOpen(panel));
  }

  /**
   * Toggles the visibility of a panel.
   */
  public togglePanel(panel: GoldenPanel) {
    this.store
      .select(panelIsOpen(panel))
      .pipe(take(1), map(isOpen => (isOpen ? new ClosePanel(panel) : new OpenPanel(panel))))
      .subscribe(action => this.store.dispatch(action));
  }
}
