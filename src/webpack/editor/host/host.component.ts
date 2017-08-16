import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MdIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

const availableIcons = ['rocket', 'screen-rotation', 'undo', 'redo'];

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostComponent {
  constructor(icons: MdIconRegistry, sanitizer: DomSanitizer) {
    availableIcons.forEach(icon => {
      icons.addSvgIcon(
        icon,
        sanitizer.bypassSecurityTrustResourceUrl(`./__miix_static/${icon}.svg`),
      );
    });
  }
}
