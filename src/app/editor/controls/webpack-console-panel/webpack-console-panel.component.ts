import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import { ReportGenericError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import { ControlsWebpackConsoleService } from '../controls-webpack-console.service';
import { RestartWebpack, WebpackState } from '../controls.actions';
import { webpackState } from '../controls.reducer';

/**
 * The ControlsBoostrapComponent displays server state while it's initializing.
 */
@Component({
  selector: 'webpack-console-panel',
  templateUrl: './webpack-console-panel.component.html',
  styleUrls: ['./webpack-console-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebpackConsolePanelComponent implements OnDestroy {
  /**
   * Template hoist
   */
  // tslint:disable-next-line
  public readonly State = WebpackState;

  /**
   * Selects whether the editor screen is open.
   */
  public readonly state = this.store.select(webpackState);

  /**
   * Observable of webpack console data.
   */
  public readonly consoleData = this.controlsConsole.observe();

  constructor(
    private readonly store: Store<fromRoot.IState>,
    private readonly controlsConsole: ControlsWebpackConsoleService,
  ) {}

  public openIssue(title: string) {
    this.store.dispatch(new ReportGenericError(title, this.controlsConsole.contents));
  }

  public restart() {
    this.store.dispatch(new RestartWebpack());
  }

  public ngOnDestroy(): void {
    // noop
  }
}
