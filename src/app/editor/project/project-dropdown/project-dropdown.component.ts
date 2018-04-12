import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { RequireAuth } from '../../account/account.actions';
import * as fromRoot from '../../bedrock.reducers';
import { OpenUploader } from '../../uploader/uploader.actions';
import { OpenDirectory, StartChangeLink } from '../project.actions';
import * as fromProject from '../project.reducer';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'project-dropdown',
  templateUrl: './project-dropdown.component.html',
  styleUrls: ['./project-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDropdownComponent {
  /**
   * Selects whether any project is currently open.
   */
  public isOpen = this.store.select(fromProject.isOpen);

  /**
   * Selects the linked interactive project.
   */
  public linkedProject = this.store.select(fromProject.selectLinkedGame);

  /**
   * Observable of the currently open project.
   */
  public project = fromProject.readOpen(this.store);

  constructor(private readonly store: Store<fromRoot.IState>) {}

  /**
   * Opens the project directory.
   */
  public openDir() {
    this.store.dispatch(new OpenDirectory());
  }

  /**
   * Changes the project we're linked to.
   */
  public changeLink() {
    this.store.dispatch(new RequireAuth(new StartChangeLink()));
  }

  /**
   * Starts the controls uploading.
   */
  public upload() {
    this.store.dispatch(new RequireAuth(new OpenUploader()));
  }
}
