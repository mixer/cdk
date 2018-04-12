import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

/**
 * Shown while waiting for the game client to connect.
 */
@Component({
  selector: 'remote-connection-waiting-client',
  templateUrl: './waiting-client.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteConnectionWaitingClientComponent {
  constructor(public readonly dialog: MatDialogRef<undefined>) {}
}
