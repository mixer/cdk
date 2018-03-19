import { ChangeDetectionStrategy, Component } from '@angular/core';


/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'layout-topnav',
  templateUrl: './topnav.component.html',
  styleUrls: ['./topnav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
}
