import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { UploaderScreen } from '../uploader.actions';
import * as fromUploader from '../uploader.reducer';

/**
 * The UploaderDialogComponent is the host component for the upload wizard.
 */
@Component({
  selector: 'uploader-dialog',
  templateUrl: './uploader-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderDialogComponent {
  /**
   * Current screen we're on.
   */
  public readonly screen = this.store.select(fromUploader.selectScreen);

  /**
   * Template hoist.
   */
  // tslint:disable-next-line
  public readonly Screens = UploaderScreen;

  constructor(private readonly store: Store<fromRoot.IState>) {}
}
