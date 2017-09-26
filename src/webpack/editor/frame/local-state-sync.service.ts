import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/take';
import '../util/takeUntilDestroyed';

import { RPC } from '@mcph/miix-std/dist/internal';
import { IVideoPositionOptions } from '@mcph/miix-std/dist/internal';
import { MemorizingSubject } from '../util/memorizingSubject';
import { IProject } from './../redux/project';
import { ControlStateSyncService } from './control-state-sync.service';
import { ControlsSource } from './sources/controls';
import { GroupSource } from './sources/group';
import { ParticipantSource } from './sources/participant';

const enum State {
  Loading,
  AwaitingValid,
  Ready,
}

/**
 * The LocalStateSyncService manages synchronizing state between what's in the
 * editor state and what the local controls know about. It uses RPC over
 * postMessage to handle this.
 */
@Injectable()
export class LocalStateSyncService implements OnDestroy {
  private rpc: RPC;
  private state = State.Loading;
  private sources = [new ControlsSource(), new GroupSource(), new ParticipantSource()];
  private closed = new MemorizingSubject<void>();

  constructor(private readonly controlsState: ControlStateSyncService, store: Store<IProject>) {
    this.sources.forEach(source => {
      source
        .getEvents(store.select('code'))
        .takeUntil(this.closed)
        .subscribe(calls => {
          if (this.state === State.AwaitingValid) {
            this.sendInitialState();
          } else if (this.state === State.Ready) {
            this.sendInteractive(...calls);
          }
        });
    });
  }

  /**
   * Attaches listeners to the iframe.
   */
  public bind(frame: HTMLIFrameElement): this {
    this.rpc = new RPC(frame.contentWindow);
    this.rpc.expose('controlsReady', () => {
      this.sendInitialState();
    });
    this.rpc.expose<IVideoPositionOptions>('moveVideo', data => {
      this.controlsState.setVideoSize(data);
    });
    this.rpc.expose('sendInteractivePacket', _input => {
      // todo(connor4312): log
    });
    Observable.fromEvent(frame, 'loaded')
      .takeUntil(this.closed)
      .subscribe(() => {
        this.state = State.Loading;
      });

    this.controlsState
      .getRefresh()
      .takeUntil(this.closed)
      .subscribe(() => {
        this.rpc.destroy();
        frame.src = frame.src;
        this.bind(frame);
      });

    return this;
  }

  /**
   * Tears down resources associated with the service.
   */
  public unbind() {
    if (this.rpc) {
      this.rpc.destroy();
    }

    this.closed.next(undefined);
  }

  public ngOnDestroy() {
    this.unbind();
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

    this.controlsState
      .getSettings()
      .takeUntil(this.closed)
      .subscribe(settings => {
        this.rpc.call('updateSettings', settings, false);
      });

    this.sendInteractive(...create.map(call => call!), {
      method: 'onReady',
      params: { isReady: true },
    });

    this.state = State.Ready;
  }

  private sendInteractive(...packets: { method: string; params: object }[]): void {
    packets.forEach(packet => {
      this.rpc.call('recieveInteractivePacket', packet, false);
    });
  }
}
