import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { AboutModalComponent } from '../../about/about-modal/about-modal.component';
import { NewProjectDialogComponent } from '../../new-project/new-project-dialog/new-project-dialog.component';
import { StartOpenProject, TryOpenProject } from '../../project/project.actions';
import { links } from '../../shared/links';
import { truthy } from '../../shared/operators';
import { IState } from '../layout.reducer';
import { getRecentProjects } from '../layout.reducer';
import { IRecentProject } from './../../../../server/recent-projects';

/**
 * Hosts the golden layout, which is the framework used for editor panels
 * within miix.
 */
@Component({
  selector: 'layout-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {
  public readonly projects: Observable<IRecentProject[]> = this.store
    .select(getRecentProjects)
    .pipe(truthy());

  /**
   * Template hoist.
   */
  public readonly links = links;

  constructor(private readonly dialog: MatDialog, private readonly store: Store<IState>) {}

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
   * Opens a project from the given directory.
   */
  public openRecentProject(directory: string) {
    this.store.dispatch(new TryOpenProject(directory));
  }

  /**
   * Opens the about modal.
   */
  public openAbout() {
    this.dialog.open(AboutModalComponent);
  }
}
