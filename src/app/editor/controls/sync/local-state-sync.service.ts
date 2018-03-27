import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { distinctUntilChanged, map, take, takeUntil } from 'rxjs/operators';

import '../util/takeUntilDestroyed';

import * as fromRoot from '../../bedrock.reducers';

import { RPC } from '@mcph/miix-std/dist/internal';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { ControlsSource } from '../../schema/sources/controls';
import { GroupSource } from '../../schema/sources/group';
import { ParticipantSource } from '../../schema/sources/participant';
import { Source } from '../../schema/sources/source';
import { untilDestroyed } from '../../shared/untilDestroyed';
import { BaseStateSyncService } from './base-state-sync.service';
import { ControlStateSyncService } from './control-state-sync.service';

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
  private sources: Source<any>[] = [
    new ControlsSource(),
    new GroupSource(),
    new ParticipantSource(),
  ];
  private closed = new ReplaySubject<void>(1);

  constructor(
    private readonly controlsState: ControlStateSyncService,
    private readonly store: Store<fromRoot.IState>,
    private readonly base: BaseStateSyncService,
  ) {
    this.sources.forEach(source =>
      source
        .getEvents(this.store.select(source.getSelector()))
        .pipe(untilDestroyed(this))
        .subscribe(calls => {
          if (this.state === State.AwaitingValid) {
            this.sendInitialState();
          } else if (this.state === State.Ready) {
            this.sendInteractive(...calls);
          }
        }),
    );
  }

  /**
   * Attaches listeners to the iframe.
   */
  public bind(frame: HTMLIFrameElement): this {
    this.rpc = new RPC(frame.contentWindow, '1.0');
    this.rpc.expose('controlsReady', () => {
      this.sendInitialState();
    });

    const refresh = this.controlsState.getRefresh();
    this.base.attachInternalMethods(this.rpc, this.closed);

    fromEvent(frame, 'loaded')
      .pipe(takeUntil(this.closed), takeUntil(refresh))
      .subscribe(() => (this.state = State.Loading));

    refresh.pipe(takeUntil(this.closed), take(1)).subscribe(() => {
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
    const create = this.sources
      .map(src => src.getCreatePacket())
      .reduce((prev, next) => prev.concat(next), []);

    if (create.some(packet => packet === undefined)) {
      this.state = State.AwaitingValid;
      return;
    }

    this.controlsState
      .getSettings()
      .pipe(takeUntil(this.closed), takeUntil(this.controlsState.getRefresh()))
      .subscribe(settings => {
        this.rpc.call('updateSettings', settings, false);
      });

    this.store
      .pipe(
        map(() => true), // todo(connor4312): select ready state
        takeUntil(this.controlsState.getRefresh()),
        takeUntil(this.closed),
        distinctUntilChanged(),
      )
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
