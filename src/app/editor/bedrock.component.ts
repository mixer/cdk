import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

const availableIcons = [
  'check-mark',
  'checkbox-checked',
  'checkbox-empty',
  'clear',
  'close',
  'console',
  'editor',
  'filter',
  'fullscreen',
  'history',
  'link',
  'reboot',
  'redo',
  'refresh',
  'rocket',
  'save',
  'screen-rotation',
  'tab-console',
  'tab-group',
  'tab-participant',
  'tab-scenes',
  'tools',
  'trash-can',
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
      icons.addSvgIcon(icon, sanitizer.bypassSecurityTrustResourceUrl(`assets/images/${icon}.svg`));
    });
  }
}
