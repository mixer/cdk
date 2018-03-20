import { Directive, Input, HostListener } from '@angular/core';

import { Electron } from './electron';

/**
 * Directive to open a link in a new browser window. In contrast to the
 * normal target=_blank which, in Electron, opens a new electron window
 * instead of a browser window.
 */
@Directive({ selector: '[openExternal]' })
export class OpenExternalDirective {
  /**
   * External URL to open.
   */
  @Input()
  public openExternal: string;

  /**
   * Open the link on click.
   */
  @HostListener('click', ['$event'])
  public onClick(ev: MouseEvent) {
    Electron.shell.openExternal(this.openExternal);
    ev.preventDefault();
  }
}
