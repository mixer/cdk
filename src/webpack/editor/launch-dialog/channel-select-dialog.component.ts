import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { IProject, ProjectService } from '../redux/project';

export enum State {
  Connecting,
  AwaitingLogin,
  AwaitingGameClient,
}

/**
 * The Channel Select Dialog prompts the user to enter a channel ID to connect
 * to, rather than their own. It's "hidden" behind a shift-click of the launch
 * button. If you're reading this, congratz, you found a secret :) We just
 * don't want to make this too accessible for people to muddle around
 * in others' controls.
 *
 * Resolves to true/false whether the user wants to connect immediately.
 */
@Component({
  selector: 'editor-channel-select-dialog',
  templateUrl: './channel-select-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChannelSelectDialog {
  /**
   * Channel ID the user will be connected to.
   */
  public connectionChannel = this.store.select(s => s.connect.channelOverride);

  constructor(private readonly store: Store<IProject>, private readonly project: ProjectService) {}

  public setConnectionChannel(channelID: number) {
    this.project.setConnectionChannel(channelID);
  }
}
