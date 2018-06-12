import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { MatDialogRef } from '@angular/material';
import * as fromRoot from '../../bedrock.reducers';
import * as forUploader from '../uploader.actions';

/**
 * Presented after uploading has compelted.
 */
@Component({
  selector: 'uploader-compilation-error',
  templateUrl: './uploader-compilation-error.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { max-width: 500px; display: block }'],
})
export class UploaderCompilationErrorComponent {
  constructor(
    private readonly store: Store<fromRoot.IState>,
    public readonly dialogRef: MatDialogRef<any>,
  ) {}

  /**
   * Saves the data the webpack console emitted.
   */
  public saveConsole() {
    this.store.dispatch(new forUploader.SaveConsoleOutput());
  }
}
