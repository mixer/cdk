import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'layout-control-schema',
  templateUrl: './control-schema.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlSchemaComponent {}
