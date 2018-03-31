import { ChangeDetectionStrategy, Component } from '@angular/core';

import { BaseStateSyncService } from '../sync/base-state-sync.service';

/**
 * Yo dawg I heard you liked controls. This contains the "meta-controls" that
 * allow refreshing and otherwise manipulating the displayed content.
 */
@Component({
  selector: 'controls-controls',
  templateUrl: './controls-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsBootstrapComponent {
  constructor(public readonly sync: BaseStateSyncService) {}
}
