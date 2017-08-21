import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { devices, IDevice } from './devices';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/take';
import '../util/takeUntilDestroyed';

import { IVideoPositionOptions } from '../../../stdlib/mixer';
import { RPC } from '../../../stdlib/rpc';
import { MemorizingSubject } from '../util/memorizingSubject';
import { IProject } from './../redux/project';
import { ControlsSource } from './sources/controls';
import { GroupSource } from './sources/group';
import { ParticipantSource } from './sources/participant';

const enum State {
  Loading,
  AwaitingValid,
  Ready,
}

/**
 * The StateSyncService manages synchronizing state between what's in the
 * editor state and what the controls know about. It uses RPC over postMessage
 * to handle this.
 */
@Injectable()
export class StateSyncService implements OnDestroy {
  private rpc: RPC;
  private state = State.Loading;
  private sources = [new ControlsSource(), new GroupSource(), new ParticipantSource()];
  private lastDevice: IDevice;
  private videoSizeSubj = new MemorizingSubject<IVideoPositionOptions>();

  constructor(store: Store<IProject>) {
    this.sources.forEach(source => {
      source.getEvents(store.select('code')).takeUntilDestroyed(this).subscribe(calls => {
        if (this.state === State.AwaitingValid) {
          this.sendInitialState();
        } else if (this.state === State.Ready) {
          this.sendInteractive(...calls);
        }
      });
    });

    store.select('frame').takeUntilDestroyed(this).subscribe(state => {
      this.lastDevice = devices[state.chosenDevice];
      if (this.state === State.Ready) {
        this.updateSettings();
      }
    });
  }

  public bind(frame: Window): this {
    this.rpc = new RPC(frame);
    this.rpc.expose('controlsReady', () => {
      this.sendInitialState();
    });
    this.rpc.expose<IVideoPositionOptions>('moveVideo', data => {
      this.videoSizeSubj.next(data);
    });
    Observable.fromEvent(frame, 'loaded').takeUntilDestroyed(this).subscribe(() => {
      this.state = State.Loading;
    });
    return this;
  }

  public ngOnDestroy() {
    if (this.rpc) {
      this.rpc.destroy();
    }
  }

  /**
   * Observable that emits when the video size/position changes.
   */
  public videoSize(): Observable<IVideoPositionOptions> {
    return this.videoSizeSubj;
  }

  /**
   * Sends down the initial/current controls state, fired when the controls
   * first call `controlsReady`.
   */
  private sendInitialState() {
    const create = this.sources.map(src => src.getCreatePacket());
    if (create.some(packet => packet === undefined)) {
      this.state = State.AwaitingValid;
      return;
    }

    this.updateSettings();
    this.sendInteractive(...create.map(call => call!), {
      method: 'onReady',
      params: { isReady: true },
    });

    this.state = State.Ready;
  }

  /**
   * Pushes an settings update to the frame.
   */
  private updateSettings() {
    this.rpc.call(
      'updateSettings',
      {
        language: navigator.language,
        placesVideo: !this.lastDevice.isMobile,
      },
      false,
    );
  }

  private sendInteractive(...packets: { method: string; params: object }[]): void {
    packets.forEach(packet => {
      this.rpc.call('recieveInteractivePacket', packet, false);
    });
  }
}
