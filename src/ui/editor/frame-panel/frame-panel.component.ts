import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import * as screenfull from 'screenfull';

import { BundleUploadService } from '../bundle-upload.service';
import { ControlStateSyncService } from '../frame/control-state-sync.service';
import { devices, IDevice } from '../frame/devices';
import { FrameComponent } from '../frame/frame.component';
import { ChannelSelectDialog } from '../launch-dialog/channel-select-dialog.component';
import { LaunchDialogComponent } from '../launch-dialog/launch-dialog.component';
import { LinkDialogComponent } from '../link-dialog/link-dialog.component';
import { ConnectState } from '../redux/connect';
import { IFrameState } from '../redux/frame';
import { IProject, ProjectService } from '../redux/project';
import { UploadSchemaService } from '../upload-schema/upload-schema.service';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-frame-panel',
  templateUrl: './frame-panel.component.html',
  styleUrls: ['./frame-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FramePanelComponent implements OnDestroy {
  public frame: Observable<IFrameState> = this.store.select('frame');
  public isMobile = this.frame.map(s => devices[s.chosenDevice].isMobile);
  public devices: ReadonlyArray<IDevice> = devices;
  public isVersionLinked = this.store.map(s => !!s.sync.interactiveVersion);

  /**
   * Whether the controls are currently connect to a remote server.
   */
  public areControlsConnected = this.store.select(s => s.connect.state === ConnectState.Active);

  /**
   * Whether the current device supports fullscreen.
   */
  public canFullscreen = screenfull.enabled;

  /**
   * Parent frame.
   */
  private readonly frameEl: HTMLElement;

  constructor(
    private readonly project: ProjectService,
    private readonly store: Store<IProject>,
    private readonly dialog: MatDialog,
    private readonly schema: UploadSchemaService,
    private readonly bundle: BundleUploadService,
    private readonly controls: ControlStateSyncService,
    frame: FrameComponent,
  ) {
    this.frameEl = frame.el.nativeElement;

    Observable.fromEvent(screenfull, 'change')
      .takeUntilDestroyed(this)
      .subscribe(() => {
        if (screenfull.isFullscreen) {
          this.frameEl.classList.add('fullscreen');
        } else {
          this.frameEl.classList.remove('fullscreen');
        }
      });
  }

  public ngOnDestroy() {
    /* noop */
  }

  public chooseDevice(index: number) {
    this.project.chooseDevice(index);
  }

  public rotateDevice() {
    this.project.rotateDevice();
  }

  public setWidth(width: number) {
    this.project.resizeDevice(width);
  }

  public setHeight(height: number) {
    this.project.resizeDevice(undefined, height);
  }

  public unlink() {
    this.project.syncUnlink();
  }

  public openLinkDialog() {
    this.dialog
      .open(LinkDialogComponent)
      .afterClosed()
      .subscribe(version => {
        this.project.syncLink(version);
      });
  }

  public connect(ev: MouseEvent) {
    if (!ev.shiftKey) {
      this.launch();
      return;
    }

    this.dialog
      .open(ChannelSelectDialog)
      .afterClosed()
      .subscribe(launch => {
        if (launch) {
          this.launch();
        }
      });
  }

  public uploadSchema() {
    this.schema.upload();
  }

  public uploadBundle() {
    this.bundle.upload().catch(() => undefined);
  }

  /**
   * Disconnects controls from Interactive.
   */
  public exitRemote() {
    this.project.disconnectControls();
  }

  /**
   * Forces the control iframe to refresh.
   */
  public refresh() {
    this.controls.requestRefresh();
  }

  /**
   * Toggles fullscreen on the control frame.
   */
  public fullscreen() {
    if (screenfull.isFullscreen) {
      screenfull.exit();
    } else {
      screenfull.request(document.querySelector('editor-frame')!);
    }
  }

  private launch() {
    this.dialog
      .open(LaunchDialogComponent)
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.project.connectControls(result);
        }
      });
  }
}
