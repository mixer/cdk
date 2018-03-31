import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { RequireAuth } from '../../account/account.actions';
import * as fromRoot from '../../bedrock.reducers';
import { NewProjectDialogComponent } from '../../new-project/new-project-dialog/new-project-dialog.component';
import { RequireLink, StartOpenProject } from '../../project/project.actions';
import { OpenSnapshotDialogComponent } from '../../schema/open-snapshot-dialog/open-snapshot-dialog.component';
import { SaveSnapshotDialogComponent } from '../../schema/save-snapshot-dialog/save-snapshot-dialog.component';
import { CopyWorldSchema, QuickUploadWorldSchema } from '../../schema/schema.actions';
import { ClosePanel, GoldenPanel, OpenPanel, panelTitles } from '../layout.actions';
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
   * Map of panel kinds to display text.
   */
  public readonly goldenPanels = panelTitles;

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
   * Opens the dialog to load control schema.
   */
  public loadControlSchema() {
    this.dialog.open(OpenSnapshotDialogComponent);
  }

  /**
   * Opens the dialog to save the current control schema.
   */
  public saveControlSchema() {
    this.dialog.open(SaveSnapshotDialogComponent);
  }

  /**
   * Uploads the control schema.
   */
  public uploadControlSchema() {
    this.store.dispatch(new RequireAuth(new RequireLink(QuickUploadWorldSchema)));
  }

  /**
   * Copies the control schema from the linked project.
   */
  public copyControlSchema() {
    this.store.dispatch(new RequireAuth(new RequireLink(CopyWorldSchema)));
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
