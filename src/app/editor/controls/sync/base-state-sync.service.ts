import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { IVideoPositionOptions, RPC } from '@mcph/miix-std/dist/internal';
import { Observable } from 'rxjs/Observable';

import { once } from 'lodash';
import { merge, takeUntil } from 'rxjs/operators';
import { ControlStateSyncService } from './control-state-sync.service';

/**
 * Foundation class that the state sync services compose for local and remote
 * synchronization.
 */
@Injectable()
export class BaseStateSyncService {
  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly controlsState: ControlStateSyncService,
  ) {}

  public attachInternalMethods(rpc: RPC, closer: Observable<void>) {
    closer = closer.pipe(merge(this.controlsState.getRefresh()));

    rpc.expose<IVideoPositionOptions>('moveVideo', data => {
      this.controlsState.setVideoSize(data);
    });

    rpc.expose(
      'verificationChallenge',
      once(() => {
        this.snackBar.open(
          'Your controls called `getIdentityVerification`, but this is not supported' +
            ' in the miix editor. A fake response will be returned.',
          undefined,
          {
            duration: 5000,
          },
        );

        return 'Fake challenge, verification not supported in the miix editor';
      }),
    );

    this.controlsState
      .getFittedVideoSize()
      .pipe(takeUntil(closer))
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
}
