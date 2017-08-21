import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import * as json5 from 'json5';
import { Observable } from 'rxjs/Observable';
import { devices, IDevice } from './devices';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/take';
import '../util/takeUntilDestroyed';

import { IVideoPositionOptions } from '../../../stdlib/mixer';
import { RPC } from '../../../stdlib/rpc';
import { MemorizingSubject } from '../util/memorizingSubject';
import { IProject } from './../redux/project';

interface ICachedState {
  participant?: object;
  groups?: object;
  controls?: object;
}

/**
 * Tries to parse the data as json5, returning undefined if it fails.
 */
function tryParseJson5(data: string[]): object | undefined {
  try {
    return json5.parse(data.join('\n'));
  } catch (e) {
    return undefined;
  }
}

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
  private lastValidState: ICachedState = {};
  private lastDevice: IDevice;
  private videoSizeSubj = new MemorizingSubject<IVideoPositionOptions>();

  constructor(store: Store<IProject>) {
    store.select('code').takeUntilDestroyed(this).subscribe(state => {
      this.lastValidState = {
        participant: tryParseJson5(state.participant),
        groups: tryParseJson5(state.groups),
        controls: tryParseJson5(state.controls),
      };

      if (this.state === State.AwaitingValid) {
        this.sendInitialState();
      }
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
    this.rpc.expose<IVideoPositionOptions>('moveVideo', params => {
      this.videoSizeSubj.next(params);
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
   * Returns if all cached participant/groups/controls state is valid.
   */
  private allCachedStateValid() {
    const state = this.lastValidState;
    return !Object.keys(state).some((k: keyof typeof state) => !state[k]);
  }

  /**
   * Sends down the initial/current controls state, fired when the controls
   * first call `controlsReady`.
   */
  private sendInitialState() {
    if (!this.allCachedStateValid()) {
      this.state = State.AwaitingValid;
      return;
    }

    const state = this.lastValidState;
    this.updateSettings();
    this.sendInteractive(
      {
        method: 'onSceneCreate',
        params: { scenes: state.controls },
      },
      {
        method: 'onGroupCreate',
        params: { groups: state.groups },
      },
      {
        method: 'onParticipantJoin',
        params: { participants: [state.participant] },
      },
      {
        method: 'onReady',
        params: { isReady: true },
      },
    );

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
    packets.forEach(packet => this.rpc.call('recieveInteractivePacket', packet, false));
  }
}
