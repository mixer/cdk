import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MdIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/map';

import { CodeState } from '../redux/code';
import { IProject } from '../redux/project';

const availableIcons = [
  'rocket',
  'screen-rotation',
  'undo',
  'redo',
  'refresh',
  'close',
  'fullscreen',
  'upload',
];

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
  /**
   * Width of the left-hand editor pane.
   */
  public editorWidth: Observable<number> = this.store
    .select('code')
    .map(s => (s.state === CodeState.Closed ? 0 : s.width));

  constructor(
    icons: MdIconRegistry,
    sanitizer: DomSanitizer,
    private readonly store: Store<IProject>,
  ) {
    availableIcons.forEach(icon => {
      icons.addSvgIcon(
        icon,
        sanitizer.bypassSecurityTrustResourceUrl(`./__miix_static/${icon}.svg`),
      );
    });
  }
}
