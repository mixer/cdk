import { Injectable, OnDestroy } from '@angular/core';
import { RPC } from '@mcph/miix-std/dist/internal';
import { Store } from '@ngrx/store';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { merge as mergeObs } from 'rxjs/observable/merge';
import { delay, distinctUntilChanged, map, take, takeUntil } from 'rxjs/operators';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import * as fromRoot from '../../bedrock.reducers';
import { ControlsSource } from '../../schema/sources/controls';
import { GroupSource } from '../../schema/sources/group';
import { ParticipantSource } from '../../schema/sources/participant';
import { Source } from '../../schema/sources/source';
import { selectIsReady } from '../controls.reducer';
import { BaseStateSyncService } from './base-state-sync.service';

/**
 * The LocalStateSyncService manages synchronizing state between what's in the
 * editor state and what the local controls know about. It uses RPC over
 * postMessage to handle this.
 */
@Injectable()
export class LocalStateSyncService implements OnDestroy {
  /**
   * A list of world state sources.
   */
  public static sources: Source<any>[] = [
    new ControlsSource(),
    new GroupSource(),
    new ParticipantSource(),
  ];

  private closed = new ReplaySubject<void>(1);

  /**
   * A list of effects to run while connected to the frame.
   */
  private fx: (() => Observable<{ method: string; params: any }>)[] = [
    () =>
      this.store.select(selectIsReady).pipe(
        delay(1),
        distinctUntilChanged(),
        map(isReady => ({
          method: 'recieveInteractivePacket',
          params: {
            method: 'onReady',
            params: { isReady },
          },
        })),
      ),

    () =>
      mergeObs(
        ...LocalStateSyncService.sources.map(source =>
          source.getEvents(this.store.select(source.getSelector())),
        ),
      ).pipe(map(packet => ({ method: 'recieveInteractivePacket', params: packet }))),
  ];

  constructor(
    private readonly store: Store<fromRoot.IState>,
    public readonly base: BaseStateSyncService,
  ) {}

  /**
   * Attaches listeners to the iframe.
   */
  public bind(frame: HTMLIFrameElement): this {
    const rpc = new RPC(frame.contentWindow, '1.0');
    this.base.attachInternalMethods(rpc, this.fx);

    mergeObs(this.base.refresh, fromEvent(frame, 'loaded'))
      .pipe(takeUntil(this.closed), take(1))
      .subscribe(
        () => {
          rpc.destroy();
          frame.src = `${frame.src}.`;
          this.bind(frame);
        },
        undefined,
        () => rpc.destroy(),
      );

    return this;
  }

  /**
   * Tears down resources associated with the service.
   */
  public unbind() {
    this.closed.next(undefined);
  }

  public ngOnDestroy() {
    this.unbind();
  }
}
