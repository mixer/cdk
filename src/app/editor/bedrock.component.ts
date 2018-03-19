import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

const availableIcons = [
  'clear',
  'close',
  'editor',
  'filter',
  'fullscreen',
  'redo',
  'history',
  'refresh',
  'rocket',
  'screen-rotation',
  'tab-console',
  'tab-group',
  'tab-participant',
  'tab-scenes',
  'undo',
  'upload',
];

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-host',
  template: '<layout-topnav></layout-topnav>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedrockComponent {
  constructor(
    icons: MatIconRegistry,
    sanitizer: DomSanitizer,
  ) {
    availableIcons.forEach(icon => {
      icons.addSvgIcon(
        icon,
        sanitizer.bypassSecurityTrustResourceUrl(`/assets/images/${icon}.svg`),
      );
    });
  }
}
