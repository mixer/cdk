import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { LocateWebpackConfig } from '../controls.actions';

/**
 * The WebpackConfigLocatorModalComponent prompts the user to choose a
 * different webpack configuration file, show in the event that the one
 * they have configured is not found.
 */
@Component({
  selector: 'webpack-config-locator-modal',
  templateUrl: './webpack-config-locator-modal.component.html',
  styleUrls: ['./webpack-config-locator-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebpackConfigLocatorModalComponent {
  constructor(
    private readonly store: Store<fromRoot.IState>,
    public readonly dialog: MatDialogRef<void>,
  ) {}

  public open() {
    this.store.dispatch(new LocateWebpackConfig());
    this.dialog.close();
  }
}
