import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { isRemoteConnected } from '../../remote-connect/remote-connect.reducer';

/**
 * The ControlsPanelComponent is the primary host of the control panel
 * in the golden layout.
 */
@Component({
  selector: 'controls-panel',
  templateUrl: './controls-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsPanelComponent {
  /**
   * Emits whether the controls have a remote connection running.
   */
  public readonly isRemoteConnected = this.store.select(isRemoteConnected);

  constructor(private readonly store: Store<fromRoot.IState>) {}
}
