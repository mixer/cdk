import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material';

import { NewProjectDialogComponent } from '../../new-project/new-project-dialog/new-project-dialog.component';

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
  constructor(private readonly dialog: MatDialog) {}

  public createNewProject() {
    this.dialog.open(NewProjectDialogComponent);
  }
}
