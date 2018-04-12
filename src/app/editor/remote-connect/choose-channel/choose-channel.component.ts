import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { currentUser } from '../../account/account.reducer';
import * as fromRoot from '../../bedrock.reducers';
import { RemoteState, SetRemoteChannel, SetRemoteState } from '../remote-connect.actions';
import { selectRemoteChannel } from '../remote-connect.reducer';

/**
 * Provides dialog UI for the user to select which channel they want to
 * connect to.
 */
@Component({
  selector: 'remote-connection-choose-channel',
  templateUrl: './choose-channel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteConnectionChooseChannelComponent {
  /**
   * Channel we want to connect.
   */
  public targetChannel = this.store.select(selectRemoteChannel);

  constructor(
    public readonly dialog: MatDialogRef<undefined>,
    private readonly store: Store<fromRoot.IState>,
  ) {
    store
      .select(currentUser)
      .pipe(take(1))
      .subscribe(user => {
        if (user) {
          this.setTargetChannel(user.channel);
        }
      });
  }

  /**
   * Sets the channel we want to connect to.
   */
  public setTargetChannel(channelId: number) {
    this.store.dispatch(new SetRemoteChannel(channelId));
  }

  /**
   * Starts making a connection to the channel.
   */
  public connect() {
    this.store.dispatch(new SetRemoteState(RemoteState.AwaitingGameClient));
  }
}
