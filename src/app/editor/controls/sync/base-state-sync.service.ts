import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ISettings, IVideoPositionOptions, RPC } from '@mcph/miix-std/dist/internal';
import { Store } from '@ngrx/store';
import { isEqual, once } from 'lodash';
import { Observable } from 'rxjs/Observable';
import { merge as mergeObs } from 'rxjs/observable/merge';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { fromEvent } from 'rxjs/observable/fromEvent';
import * as fromRoot from '../../bedrock.reducers';
import { bindToRPC } from '../../controls-console/controls-remote-console.service';
import { MoveVideo } from '../../emulation/emulation.actions';
import { selectedFittedVideo, selectISettings } from '../../emulation/emulation.reducer';
import { WebpackState } from '../controls.actions';
import * as fromControls from '../controls.reducer';

/**
 * A ControlEffect is invoked when we have an RPC connection. It should
 * return a stream of methods to call on the controls.
 */
export type ControlEffect = () => Observable<{ method: string; params: any }>;

/**
 * Foundation class that the state sync services compose for local and remote
 * synchronization.
 */
@Injectable()
export class BaseStateSyncService {
  /**
   * Subject hit when we want to refresh the displayed controls.
   */
  public readonly refresh = new Subject<void>();

  /**
   * Emits the address upon which locally-connected controls can be found.
   */
  public readonly controlsAddress = this.store.select(fromControls.controlState).pipe(
    // Wait until we get past the "starting" stage, before this point the
    // server may not exist and loading the iframe will result in an error.
    filter(
      state =>
        [WebpackState.Compiled, WebpackState.HadError].includes(state.webpackState) &&
        !!state.instance,
    ),
    map(({ instance }) => instance!.address),
    distinctUntilChanged(),
    map(address => `${address}?${Date.now()}`),
  );

  /**
   * Last seen RPC instance.
   */
  private lastRpc: RPC | undefined;

  /**
   * Default effects to attach to the controls.
   */
  private defaultEffects: ControlEffect[] = [
    () =>
      this.store
        .select(selectISettings)
        .pipe(
          distinctUntilChanged<ISettings>(isEqual),
          map(settings => ({ method: 'updateSettings', params: settings })),
        ),
  ];

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly store: Store<fromRoot.IState>,
  ) {}

  public attachInternalMethods(rpc: RPC, effects: ControlEffect[] = []) {
    this.lastRpc = rpc;
    bindToRPC(this.store, rpc);

    rpc.expose<IVideoPositionOptions>('moveVideo', data => {
      this.store.dispatch(new MoveVideo(data));
    });

    rpc.expose('controlsReady', () => {
      mergeObs(...effects.concat(this.defaultEffects).map(fn => fn()))
        .pipe(takeUntilRpcClosed(rpc))
        .subscribe(data => rpc.call(data.method, data.params, false));
    });

    rpc.expose('getTime', () => {
      return { time: Date.now() };
    });

    rpc.expose(
      'verificationChallenge',
      once(() => {
        this.snackBar.open(
          'Your controls called `getIdentityVerification`, but this is not supported' +
            ' in the CDK. A fake response will be returned.',
          undefined,
          {
            duration: 5000,
          },
        );

        return 'Fake challenge, verification not supported in the CDK';
      }),
    );

    this.store
      .select(selectedFittedVideo)
      .pipe(takeUntilRpcClosed(rpc), distinctUntilChanged<ClientRect>(isEqual))
      .subscribe(rect => {
        rpc.call(
          'updateVideoPosition',
          {
            connectedPlayer: { ...rect, channelId: 1 },
            costreamPlayers: [],
          },
          false,
        );
      });
  }

  public send(method: string, params: any) {
    if (this.lastRpc) {
      this.lastRpc.call(method, params, false);
    }
  }
}

export function takeUntilRpcClosed<T>(rpc: RPC) {
  return takeUntil<T>(fromEvent(<any>rpc, 'destroy'));
}

export function sendInteractive(rpc: RPC, ...packets: { method: string; params: object }[]): void {
  packets.forEach(packet => {
    rpc.call('recieveInteractivePacket', packet, false);
  });
}
