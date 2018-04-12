import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { ToggleDevTools } from '../../bedrock.actions';
import { IState } from '../../bedrock.reducers';
import { ControlsRemoteConsoleService } from '../../controls-console/controls-remote-console.service';
import { GoldenPanel, OpenPanel, stackedLocator } from '../../layout/layout.actions';
import { SetReady } from '../controls.actions';
import { selectIsReady } from '../controls.reducer';
import { BaseStateSyncService } from '../sync/base-state-sync.service';

/**
 * Yo dawg I heard you liked controls. This contains the "meta-controls" that
 * allow refreshing and otherwise manipulating the displayed content.
 */
@Component({
  selector: 'controls-controls',
  templateUrl: './controls-controls.component.html',
  styleUrls: ['./controls-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsControlsComponent {
  /**
   * Emits if there's any unread error message.
   */
  public hasUnreadError = this.console.hasUnreadError();

  /**
   * Selects whether the controls are ready.
   */
  public isReady = this.store.select(selectIsReady);

  constructor(
    public readonly sync: BaseStateSyncService,
    private readonly console: ControlsRemoteConsoleService,
    private readonly store: Store<IState>,
  ) {}

  public toggleDevtools() {
    this.store.dispatch(new ToggleDevTools());
  }

  public showConsole() {
    this.store.dispatch(
      new OpenPanel(GoldenPanel.ControlsConsole, stackedLocator(GoldenPanel.Controls)),
    );
  }

  public toggleReady() {
    this.store.dispatch(new SetReady());
  }
}
