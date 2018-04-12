import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { MatDialogRef } from '@angular/material';
import * as fromAccount from '../../account/account.reducer';
import * as fromRoot from '../../bedrock.reducers';

/**
 * Presented after uploading has compelted.
 */
@Component({
  selector: 'uploader-completed',
  templateUrl: './uploader-completed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderCompletedComponent {
  /**
   * Currently auth user's username.
   */
  public readonly username = this.store
    .select(fromAccount.currentUser)
    .pipe(map(user => (user ? user.username : null)));

  constructor(
    private readonly store: Store<fromRoot.IState>,
    public readonly dialogRef: MatDialogRef<any>,
  ) {}
}
