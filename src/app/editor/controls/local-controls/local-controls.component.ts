import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';

import { LocalStateSyncService } from '../sync/local-state-sync.service';

/**
 * The LocalControlsComponent hosts the frame containing
 * the developer's local controls.
 */
@Component({
  selector: 'local-controls',
  templateUrl: './local-controls.component.html',
  styleUrls: ['../controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LocalStateSyncService],
})
export class LocalControlsComponent {
  /**
   * The nested iframe containing the control.
   */
  @ViewChild('iframe') public iframe: ElementRef;

  /**
   * Currently attached webpack instance.
   */
  public readonly instance = this.sync.base.controlsAddress;

  constructor(private readonly sync: LocalStateSyncService) {}

  public ngAfterContentInit() {
    this.sync.bind(<HTMLIFrameElement>this.iframe.nativeElement);
  }
}
