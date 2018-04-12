import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { IVideoPositionOptions, RPC } from '@mcph/miix-std/dist/internal';
import { Store } from '@ngrx/store';
import { isEqual, once } from 'lodash';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { fromEvent } from 'rxjs/observable/fromEvent';
import * as fromRoot from '../../bedrock.reducers';
import { MoveVideo } from '../../emulation/emulation.actions';
import { selectedFittedVideo } from '../../emulation/emulation.reducer';

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
   * Last seen RPC instance.
   */
  private lastRpc: RPC | undefined;

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly store: Store<fromRoot.IState>,
  ) {}

  public attachInternalMethods(rpc: RPC) {
    this.lastRpc = rpc;

    rpc.expose<IVideoPositionOptions>('moveVideo', data => {
      this.store.dispatch(new MoveVideo(data));
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
