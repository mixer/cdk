import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The radio icon list contains many radio icons. It holds a value and
 * emits when that value is changed.
 */
@Component({
  selector: 'advanced-toggle',
  templateUrl: './advanced-toggle.component.html',
  styleUrls: ['./advanced-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedToggleComponent {
  /**
   * Whether the toggle is expanded, or not.
   */
  public expanded = false;

  /**
   * Text to display on the toggle.
   */
  public text = 'Advanced';
}
