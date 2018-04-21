import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';

import { AboutModalComponent } from '../../about/about-modal/about-modal.component';
import { RequireAuth } from '../../account/account.actions';
import { ReportGenericError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import { LocateWebpackConfig, RestartWebpack } from '../../controls/controls.actions';
import { NewProjectDialogComponent } from '../../new-project/new-project-dialog/new-project-dialog.component';
import { CloseProject, RequireLink, StartOpenProject } from '../../project/project.actions';
import { RemoteConnectionDialogComponent } from '../../remote-connect/dialog/dialog.component';
import { RemoteState, SetRemoteState } from '../../remote-connect/remote-connect.actions';
import { isRemoteConnected } from '../../remote-connect/remote-connect.reducer';
import { OpenSnapshotDialogComponent } from '../../schema/open-snapshot-dialog/open-snapshot-dialog.component';
import { SaveSnapshotDialogComponent } from '../../schema/save-snapshot-dialog/save-snapshot-dialog.component';
import { CopyWorldSchema, QuickUploadWorldSchema } from '../../schema/schema.actions';
import { OpenUploader } from '../../uploader/uploader.actions';
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

  /**
   * Selects whether the editor screen is open.
   */
  public readonly hasRemoteConnection = this.store.select(isRemoteConnected);

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
   * Closes the currently open project.
   */
  public closeProject() {
    this.store.dispatch(new CloseProject());
  }

  /**
   * Pops a window to submit an issue to the project.
   */
  public openIssue() {
    this.store.dispatch(new ReportGenericError('My Error Report', 'Enter your details here'));
  }

  /**
   * Returns an observable that emits whether the given panel is open.
   */
  public panelOpen(panel: GoldenPanel) {
    return this.store.select(panelIsOpen(panel));
  }

  /**
   * Stops and start webpack.
   */
  public restartWebpack() {
    this.store.dispatch(new RestartWebpack());
  }

  /**
   * Asks the user to point to the webpack config.
   */
  public setWebpackConfig() {
    this.store.dispatch(new LocateWebpackConfig());
  }

  /**
   * Asks for a link, then uploads the controls to the user's channel.
   */
  public linkAndUpload() {
    this.store.dispatch(new RequireAuth(new RequireLink(OpenUploader)));
  }

  /**
   * Opens a dialog to connect the controls to a Mixer channel.
   */
  public startRemoteConnection() {
    this.dialog.open(RemoteConnectionDialogComponent);
  }

  /**
   * Disconnects any ongoing link.
   */
  public stopRemoteConnection() {
    this.store.dispatch(new SetRemoteState(RemoteState.Disconnected));
  }

  /**
   * Opens the about modal.
   */
  public openAbout() {
    this.dialog.open(AboutModalComponent);
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
