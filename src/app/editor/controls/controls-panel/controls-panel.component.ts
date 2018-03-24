import { ChangeDetectionStrategy, Component } from '@angular/core';
/**
 * The ControlsPanelComponent is the primary host of the control panel
 * in the golden layout.
 */
@Component({
  selector: 'controls-panel',
  templateUrl: './controls-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsPanelComponent {}
