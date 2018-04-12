import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { SetScreen, SetUploadControls, SetUploadSchema, UploaderScreen } from '../uploader.actions';
import { selectUploadSchema } from '../uploader.reducer';

/**
 * Presents a brief into to uploading and allows users to select what
 * things they want to upload.
 */
@Component({
  selector: 'uploader-confirming',
  templateUrl: './uploader-confirming.component.html',
  styleUrls: ['./uploader-confirming.component.scss'],
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
  public uploadControls = this.store.select(selectUploadSchema);

  constructor(private readonly store: Store<fromRoot.IState>) {}

  public setUploadControls(shouldUpload: boolean) {
    this.store.dispatch(new SetUploadControls(shouldUpload));
  }

  public setUploadSchema(shouldUpload: boolean) {
    this.store.dispatch(new SetUploadSchema(shouldUpload));
  }

  public next() {
    this.uploadSchema.pipe(take(1)).subscribe(uploadSchema => {
      this.store.dispatch(
        new SetScreen(
          uploadSchema ? UploaderScreen.UploadingSchema : UploaderScreen.UploadingControls,
        ),
      );
    });
  }
}
