import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The ChangelogComponents holds the marked-rendered changelog html,
 * and applies some small styling.
 */
@Component({
  selector: 'about-changelog',
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogComponent {}
