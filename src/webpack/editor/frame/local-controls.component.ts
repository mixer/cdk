import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import { LocalStateSyncService } from './local-state-sync.service';

/**
 * The LocalControlsComponent hosts the frame containing
 * the developer's local controls.
 */
@Component({
  selector: 'editor-local-controls',
  template: '<iframe frameborder="0" src="/?" #iframe></iframe>',
  styleUrls: ['./controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LocalStateSyncService],
})
export class LocalControlsComponent implements AfterContentInit {
  /**
   * The nested iframe containing the control.
   */
  @ViewChild('iframe') public iframe: ElementRef;

  constructor(public sync: LocalStateSyncService) {}

  public ngAfterContentInit() {
    this.sync.bind(<HTMLIFrameElement>this.iframe.nativeElement);
  }
}
