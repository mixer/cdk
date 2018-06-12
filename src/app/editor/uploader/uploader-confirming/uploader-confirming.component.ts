import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { MatDialogRef } from '@angular/material';
import * as fromRoot from '../../bedrock.reducers';
import { SetUploadControls, SetUploadSchema, StartUploading } from '../uploader.actions';
import { selectUploadControls, selectUploadSchema } from '../uploader.reducer';

/**
 * Presents a brief into to uploading and allows users to select what
 * things they want to upload.
 */
@Component({
  selector: 'uploader-confirming',
  templateUrl: './uploader-confirming.component.html',
  styles: [':host { max-width: 500px; display: block }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderConfirmingComponent {
  /**
   * Whether to upload schema.
   */
  public uploadSchema = this.store.select(selectUploadSchema);

  /**
   * Whether to upload controls.
   */
  public uploadControls = this.store.select(selectUploadControls);

  constructor(
    private readonly store: Store<fromRoot.IState>,
    public readonly dialogRef: MatDialogRef<any>,
  ) {}

  public setUploadControls(shouldUpload: boolean) {
    this.store.dispatch(new SetUploadControls(shouldUpload));
  }

  public setUploadSchema(shouldUpload: boolean) {
    this.store.dispatch(new SetUploadSchema(shouldUpload));
  }

  public next() {
    this.store.dispatch(new StartUploading());
  }
}
