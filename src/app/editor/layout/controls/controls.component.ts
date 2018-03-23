import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'layout-controls',
  templateUrl: './controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsComponent {}
