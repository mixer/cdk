import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

import { InstallReason, PromptInstallNode } from '../preflight.actions';

/**
 * The InstallNodeModalComponent is shown instructing the user to install
 * Node.js. It appears if Node isn't found in the user's path.
 */
@Component({
  selector: 'install-node-modal',
  templateUrl: './install-node-modal.component.html',
  styleUrls: ['./install-node-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallNodeModalComponent {
  /**
   * Template hoise.
   */
  // tslint:disable-next-line
  public readonly Reason = InstallReason;

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: PromptInstallNode) {}
}
