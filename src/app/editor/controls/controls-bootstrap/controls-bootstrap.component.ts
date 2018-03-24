import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { ControlsConsoleService } from '../controls-console.service';
import { WebpackState } from '../controls.actions';
import { webpackState } from '../controls.reducer';

/**
 * The ControlsBoostrapComponent displays server state while it's initializing.
 */
@Component({
  selector: 'controls-bootstrap',
  templateUrl: './controls-bootstrap.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsBootstrapComponent {
  /**
   * Template hoist
   */
  // tslint:disable-next-line
  public readonly Panel = WebpackState;

  /**
   * Selects whether the editor screen is open.
   */
  public readonly state = this.store.select(webpackState);

  /**
   * Observable of webpack console data.
   */
  public readonly consoleData = this.console.contents();

  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly console: ControlsConsoleService,
  ) {}
}
