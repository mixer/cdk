import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MomentModule } from 'angular2-moment';

import { MatButtonModule, MatDialogModule } from '@angular/material';
import { AboutModalComponent } from './about-modal/about-modal.component';
import { ChangelogComponent } from './changelog/changelog.component';

/**
 * Module that displays the "about" menu, with changelog.
 */
@NgModule({
  imports: [MomentModule, CommonModule, MatButtonModule, MatDialogModule],
  declarations: [AboutModalComponent, ChangelogComponent],
  entryComponents: [AboutModalComponent],
})
export class AboutModule {}
