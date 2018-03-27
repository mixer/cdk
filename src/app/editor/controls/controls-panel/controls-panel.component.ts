import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { webpackInstance } from '../controls.reducer';

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
  public readonly instance = this.store.select(webpackInstance);

  constructor(private readonly store: Store<fromRoot.IState>) {}
}
