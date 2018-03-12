import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

/**
 * The Login Dialog Component does what it says on the tin!
 */
@Component({
  selector: 'editor-login-dialog',
  templateUrl: './login-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginDialogComponent {
  constructor(public readonly dialog: MatDialogRef<boolean>) {}
}
