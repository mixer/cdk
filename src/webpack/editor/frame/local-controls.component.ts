import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { LocalStateSyncService } from './local-state-sync.service';

/**
 * The FrameComponent hosts the frame containing the developer's controls.
 */
@Component({
  selector: 'editor-local-controls',
  template: '<iframe frameborder="0" src="/"></iframe>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LocalStateSyncService],
})
export class FrameComponent implements AfterContentInit {
  /**
   * The nested iframe containing the control.
   */
  @ViewChild('iframe') public iframe: ElementRef;

  constructor(public sync: LocalStateSyncService) {}

  public ngAfterContentInit() {
    this.sync.bind(<HTMLIFrameElement>this.iframe.nativeElement);
  }
}
