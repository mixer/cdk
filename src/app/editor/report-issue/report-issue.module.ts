import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MomentModule } from 'angular2-moment';

import { MatButtonModule, MatDialogModule } from '@angular/material';
import { ReportIssueModalComponent } from './report-issue-modal/report-issue-modal.component';

/**
 * Module that displays the "Report Issue" dialog.
 */
@NgModule({
  imports: [MomentModule, CommonModule, MatButtonModule, MatDialogModule],
  declarations: [ReportIssueModalComponent],
  entryComponents: [ReportIssueModalComponent],
})
export class ReportIssueModule {}
