import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { map } from 'rxjs/operators';

import { UpdateWebpackConsole, UploaderActionTypes } from '../uploader.actions';

/**
 * Simple loading page used while uploading controls.
 */
@Component({
  selector: 'uploader-uploading-controls',
  templateUrl: './uploader-uploading-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderUploadingControls {
  /**
   * Observable of data to print into the console.
   */
  public consoleData = this.actions
    .ofType<UpdateWebpackConsole>(UploaderActionTypes.UPDATE_WEBPACK_CONSOLE)
    .pipe(map(({ data }) => data));

  constructor(private readonly actions: Actions) {}
}
