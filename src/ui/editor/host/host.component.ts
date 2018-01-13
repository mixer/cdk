import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
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
  'tab-scenes',
  'tab-participant',
  'tab-group',
  'tab-console',
  'clear',
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
   * The current state of the code editor.
   */
  public editorState = this.store.map(({ code }) => code.state);

  /**
   * Width of the left-hand editor pane.
   */
  public editorWidth: Observable<number> = this.store
    .select('code')
    .map(s => (s.state === CodeState.Closed ? 0 : s.width));

  /**
   * Template hoist for the CodeState enum.
   */
  public CodeState = CodeState;

  constructor(
    icons: MatIconRegistry,
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
