import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';

import { ISettings, IVideoPositionOptions } from '@mcph/miix-std/dist/internal';
import { IProject } from '../redux/project';
import { MemorizingSubject } from '../util/memorizingSubject';
import { devices } from './devices';

/**
 * The ControlStateSyncService handles synchronizing the device state and
 * video position between local and remote controls and the editor.
 */
@Injectable()
export class ControlStateSyncService {
  private videoSizeSubj = new MemorizingSubject<IVideoPositionOptions>();
  private refreshSubj = new Subject<void>();

  constructor(private readonly store: Store<IProject>) {}

  /**
   * Updates the store video size settings.
   */
  public setVideoSize(options: IVideoPositionOptions) {
    this.videoSizeSubj.next(options);
  }

  /**
   * Observable that emits when the video size/position changes.
   */
  public getVideoSize(): Observable<IVideoPositionOptions> {
    return this.videoSizeSubj;
  }

  /**
   * Returns an observable that fires when the user asks to refresh the frame.
   */
  public getRefresh(): Observable<void> {
    return this.refreshSubj;
  }

  /**
   * Asks the display iframe to refresh.
   */
  public requestRefresh() {
    this.refreshSubj.next();
  }

  /**
   * Returns an observable of ISettings to share with the controls. Fires
   * immediately when first subscribed to.
   */
  public getSettings(): Observable<ISettings> {
    return this.store
      .select('frame')
      .map(frame => devices[frame.chosenDevice].isMobile)
      .distinctUntilChanged()
      .map(isMobile => ({
        language: navigator.language,
        placesVideo: !isMobile,
      }));
  }
}
