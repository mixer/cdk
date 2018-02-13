import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/take';
import '../util/takeUntilDestroyed';

import { ILogEntry, RPC } from '@mcph/miix-std/dist/internal';
import { IVideoPositionOptions } from '@mcph/miix-std/dist/internal';
import { ConsoleService } from '../console/console.service';
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

  constructor(
    private readonly controlsState: ControlStateSyncService,
    private readonly console: ConsoleService,
    private readonly store: Store<IProject>,
  ) {
    this.sources.forEach(source => {
      source
        .getEvents(store.select('code'))
        .takeUntil(this.closed)
        .subscribe(calls => {
          if (this.state === State.AwaitingValid) {
            // this.sendInitialState();
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
    this.rpc = new RPC(frame.contentWindow, '1.0');
    this.console.bindToRPC(this.rpc);
    this.rpc.expose('controlsReady', () => {
      this.sendInitialState();
    });
    this.rpc.expose<IVideoPositionOptions>('moveVideo', data => {
      this.controlsState.setVideoSize(data);
    });
    this.rpc.expose<ILogEntry>('log', data => {
      this.console.addLog(data);
    });

    const refresh = this.controlsState.getRefresh();

    Observable.fromEvent(frame, 'loaded')
      .takeUntil(this.closed)
      .takeUntil(refresh)
      .subscribe(() => {
        this.state = State.Loading;
      });

    refresh
      .takeUntil(this.closed)
      .take(1)
      .subscribe(() => {
        this.rpc.destroy();
        frame.src = frame.src;
        this.bind(frame);
      });

    this.controlsState
      .getFittedVideoSize()
      .takeUntil(this.closed)
      .takeUntil(refresh)
      .subscribe(rect => {
        this.rpc.call(
          'updateVideoPosition',
          {
            connectedPlayer: { ...rect, channelId: 1 },
            costreamPlayers: [],
          },
          false,
        );
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
    const create = this.sources
      .map(src => src.getCreatePacket())
      .reduce((prev, next) => prev.concat(next), []);

    if (create.some(packet => packet === undefined)) {
      this.state = State.AwaitingValid;
      return;
    }

    this.controlsState
      .getSettings()
      .takeUntil(this.closed)
      .takeUntil(this.controlsState.getRefresh())
      .subscribe(settings => {
        this.rpc.call('updateSettings', settings, false);
      });

    this.store
      .map(s => s.frame.controlsReady)
      .takeUntil(this.controlsState.getRefresh())
      .takeUntil(this.closed)
      .distinctUntilChanged()
      .subscribe(isReady => {
        this.sendInteractive({
          method: 'onReady',
          params: { isReady },
        });
      });

    this.sendInteractive(...create.map(call => call!));

    this.state = State.Ready;
  }

  private sendInteractive(...packets: { method: string; params: object }[]): void {
    packets.forEach(packet => {
      this.rpc.call('recieveInteractivePacket', packet, false);
    });
  }
}
