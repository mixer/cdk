import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

import { AppConfig } from '../../editor.config';

/**
 * The InstallNodeModalComponent is shown instructing the user to install
 * Node.js. It appears if Node isn't found in the user's path.
 */
@Component({
  selector: 'about-modal',
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutModalComponent {
  /**
   * CDK version.
   */
  public readonly version = AppConfig.version;

  /**
   * Date the CDK was built.
   */
  public readonly builtAt = AppConfig.builtAt;

  constructor(public readonly dialog: MatDialogRef<void>) {}

  public openLicenses() {
    window.open(`3rdpartylicenses.txt`);
  }
}
