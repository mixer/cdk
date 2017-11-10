import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { ChannelSelectDialog } from '../launch-dialog/channel-select-dialog.component';

import { BundleUploadService } from '../bundle-upload.service';
import { devices, IDevice } from '../frame/devices';
import { LaunchDialogComponent } from '../launch-dialog/launch-dialog.component';
import { LinkDialogComponent } from '../link-dialog/link-dialog.component';
import { IFrameState } from '../redux/frame';
import { IProject, ProjectService } from '../redux/project';
import { UploadSchemaService } from '../upload-schema/upload-schema.service';

/**
 * The host component holds the arrangement of macroscopic editor components.
 */
@Component({
  selector: 'editor-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {
  public frame: Observable<IFrameState> = this.store.select('frame');
  public isMobile = this.frame.map(s => devices[s.chosenDevice].isMobile);
  public devices: ReadonlyArray<IDevice> = devices;
  public isVersionLinked = this.store.map(s => !!s.sync.interactiveVersion);

  constructor(
    private readonly project: ProjectService,
    private readonly store: Store<IProject>,
    private readonly dialog: MatDialog,
    private readonly schema: UploadSchemaService,
    private readonly bundle: BundleUploadService,
  ) {}

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
