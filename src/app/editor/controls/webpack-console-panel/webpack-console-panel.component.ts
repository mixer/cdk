import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import { ReportGenericError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import { ControlsConsoleService } from '../controls-console.service';
import { RestartWebpack, WebpackState } from '../controls.actions';
import { webpackState } from '../controls.reducer';

/**
 * The ControlsBoostrapComponent displays server state while it's initializing.
 */
@Component({
  selector: 'webpack-console-panel',
  templateUrl: './webpack-console-panel.component.html',
  styleUrls: ['./webpack-console-panel.scss'],
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
    private readonly controlsConsole: ControlsConsoleService,
  ) {}

  public openIssue(title: string) {
    this.store.dispatch(
      new ReportGenericError(
        title,
        `
      ### Steps to Reproduce

      <!-- Add your reproduction steps here! -->

      ### Console Data

      \`\`\`
      ${this.controlsConsole.contents}
      \`\`\`
    `,
      ),
    );
  }

  public restart() {
    this.store.dispatch(new RestartWebpack());
  }

  public ngOnDestroy(): void {
    // noop
  }
}
