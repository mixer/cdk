import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { interval } from 'rxjs/observable/interval';
import { of } from 'rxjs/observable/of';
import {
  catchError,
  filter,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { ElectronService, RpcError } from '../electron.service';
import { selectLinkedGame } from '../project/project.reducer';
import { toLatestFrom } from '../shared/operators';
import {
  IInteractiveJoin,
  RemoteConnectActionTypes,
  RemoteConnectMethods,
  RemoteState,
  SetRemoteCredentials,
  SetRemoteError,
  SetRemoteState,
} from './remote-connect.actions';
import { selectRemoteChannel } from './remote-connect.reducer';

/**
 * Effects module for remote sync actions.
 */
@Injectable()
export class RemoteConnectEffects {
  /**
   * Trigged to try to start joining the participant to the channel. Runs
   * requests until we succeed to connect, an error occurrs, or the user
   * cancels the joining.
   */
  @Effect()
  public readonly joinParticipantToChannel = this.actions
    .ofType<SetRemoteState>(RemoteConnectActionTypes.SET_REMOTE_STATE)
    .pipe(
      filter(r => r.state === RemoteState.AwaitingGameClient),
      toLatestFrom(this.store.select(selectRemoteChannel)),
      switchMap(channelId =>
        interval(5000).pipe(
          startWith(0),
          switchMap(() =>
            this.electron
              .call<IInteractiveJoin>(RemoteConnectMethods.ConnectParticipant, { channelId })
              .then(res => new SetRemoteCredentials(res))
              .catch(
                err => err instanceof RpcError && err.originalName === 'NotInteractiveError',
                () => undefined,
              ),
          ),
          take(1),
          takeUntil(this.actions.ofType(RemoteConnectActionTypes.SET_REMOTE_STATE)),
          catchError(err => of(new SetRemoteError(err))),
        ),
      ),
    );

  /**
   * Triggered after we get a join response, sends the user to the version
   * conflict notification screen, or sets the state to active.
   */
  @Effect()
  public readonly displayMismatchOrSetActive = this.actions
    .ofType<SetRemoteCredentials>(RemoteConnectActionTypes.SET_REMOTE_CREDENTIALS)
    .pipe(
      withLatestFrom(this.store.select(selectLinkedGame)),
      map(
        ([action, linkedGame]) =>
          new SetRemoteState(
            linkedGame && linkedGame.id === action.join.version.gameId
              ? RemoteState.Active
              : RemoteState.VersionConflict,
          ),
      ),
    );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly store: Store<fromRoot.IState>,
  ) {}
}
