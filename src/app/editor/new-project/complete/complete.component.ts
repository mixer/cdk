import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, take } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { ElectronService } from '../../electron.service';
import { DirectoryOpener } from '../../shared/directory-opener';
import * as fromNewProject from '../new-project.reducer';
import { NewProjectService } from '../new-project.service';

/**
 * The CreatingComponent is the screen shown while we're busy cloning
 * repos and such in the background.
 */
@Component({
  selector: 'new-project-complete',
  templateUrl: './complete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompleteComponent {
  /**
   * Observable of the creation error, if any.
   */
  public creationError = this.store.select(fromNewProject.creationError);

  /**
   * Directory opener helper.
   */
  public readonly opener = new DirectoryOpener(this.electron);

  /**
   * Program to use for opening the directory.
   */
  public openAction = this.opener.findProgram();

  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly newProject: NewProjectService,
    private readonly electron: ElectronService,
  ) {}

  public close() {
    this.newProject.cancel();
  }

  public openLauncher() {
    this.store
      .select(fromNewProject.targetDirectory)
      .pipe(take(1), combineLatest(this.openAction))
      .subscribe(([dir, action]) => {
        this.opener.open(dir, action!);
        this.close();
      });
  }
}
