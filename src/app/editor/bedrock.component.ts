import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

const availableIcons = [
  'check-mark',
  'clear',
  'close',
  'editor',
  'filter',
  'fullscreen',
  'history',
  'redo',
  'refresh',
  'rocket',
  'screen-rotation',
  'tab-console',
  'tab-group',
  'tab-participant',
  'tab-scenes',
  'undo',
  'upload',
  'warning',
];

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-host',
  templateUrl: './bedrock.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedrockComponent {
  constructor(icons: MatIconRegistry, sanitizer: DomSanitizer) {
    availableIcons.forEach(icon => {
      icons.addSvgIcon(
        icon,
        sanitizer.bypassSecurityTrustResourceUrl(`/assets/images/${icon}.svg`),
      );
    });
  }
}
