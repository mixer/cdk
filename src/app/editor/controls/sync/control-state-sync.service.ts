import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';

import { ISettings, IVideoPositionOptions } from '@mcph/miix-std/dist/internal';
import { ReplaySubject } from 'rxjs/ReplaySubject';

/**
 * The ControlStateSyncService handles synchronizing the device state and
 * video position between local and remote controls and the editor.
 */
@Injectable()
export class ControlStateSyncService {
  private videoSizeSubj = new ReplaySubject<IVideoPositionOptions>(1);
  private fittedSizeSubj = new ReplaySubject<ClientRect>(1);
  private refreshSubj = new Subject<void>();

  /**
   * Updates the store video size settings.
   */
  public setVideoSize(options: IVideoPositionOptions) {
    this.videoSizeSubj.next(options);
  }

  /**
   * Updates the fitted size of the video sent to controls.
   */
  public updateFittedVideoSize(rect: ClientRect) {
    this.fittedSizeSubj.next(rect);
  }

  /**
   * Observable that emits when the video size/position changes.
   */
  public getVideoSize(): Observable<IVideoPositionOptions> {
    return this.videoSizeSubj;
  }

  /**
   * Observable of the fitted, actual position/size of the video relative to the frame.
   */
  public getFittedVideoSize(): Observable<ClientRect> {
    return this.fittedSizeSubj;
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
    return of(<ISettings>{
      // todo(connor4312)
      language: navigator.language,
      placesVideo: false,
      platform: 'desktop',
    });
  }
}
