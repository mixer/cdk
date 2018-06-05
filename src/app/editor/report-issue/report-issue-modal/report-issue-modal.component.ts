import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { ReportGenericError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';

/**
 * The ReportIssueModalComponent lets the user know that Microsoft will
 * send diagnostic data from their local dev environment to assist with
 * troubleshooting.
 */
@Component({
  selector: 'report-issue-modal',
  templateUrl: './report-issue-modal.component.html',
  styleUrls: ['./report-issue-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportIssueModalComponent {
  constructor(private readonly dialog: MatDialogRef<void>, private readonly store: Store<fromRoot.IState>) {}

  public reportIssue() {
    this.store.dispatch(new ReportGenericError('My Error Report', 'Enter your details here'));
    this.dialog.close();
  }
}
