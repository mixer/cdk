import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import * as screenfull from 'screenfull';

import 'rxjs/add/observable/fromEvent';
import '../util/takeUntilDestroyed';

import { ConnectState } from '../redux/connect';
import { IProject, ProjectService } from '../redux/project';
import { ControlStateSyncService } from './control-state-sync.service';
import { FrameComponent } from './frame.component';

/**
 * The FrameControls allow the user to refresh and full-screen the controls.
 */
@Component({
  selector: 'editor-frame-controls',
  templateUrl: './frame-controls.component.html',
  styleUrls: ['./frame-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameControlsComponent implements OnDestroy {
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
    private readonly store: Store<IProject>,
    private readonly project: ProjectService,
    private readonly controls: ControlStateSyncService,
    frame: FrameComponent,
  ) {
    this.frameEl = <HTMLElement>frame.el.nativeElement;

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
      screenfull.request(this.frameEl);
    }
  }
}
