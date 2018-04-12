import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Simple loading page used while uploading schema.
 */
@Component({
  selector: 'uploader-uploading-schema',
  templateUrl: './uploader-uploading-schema.component.html',
  styleUrls: ['./uploader-uploading-schema.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderUploadingSchema {}
