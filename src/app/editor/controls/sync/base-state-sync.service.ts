import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ILogEntry, IVideoPositionOptions, RPC } from '@mcph/miix-std/dist/internal';
import { Store } from '@ngrx/store';
import { isEqual, once } from 'lodash';
import { Observable } from 'rxjs/Observable';
import { distinctUntilChanged, merge, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

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

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly store: Store<fromRoot.IState>,
  ) {}

  public attachInternalMethods(rpc: RPC, closer: Observable<void>) {
    closer = closer.pipe(merge(this.refresh));

    rpc.expose<IVideoPositionOptions>('moveVideo', data => {
      this.store.dispatch(new MoveVideo(data));
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

    this.store
      .select(selectedFittedVideo)
      .pipe(takeUntil(closer), distinctUntilChanged<ClientRect>(isEqual))
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
