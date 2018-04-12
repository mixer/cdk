import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { ReportRpcError } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import * as fromUploader from '../uploader.reducer';

/**
 * Simple loading page used while linking the bundle to an interactive game.
 */
@Component({
  selector: 'uploader-linking-game',
  templateUrl: './uploader-linking-game.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderLinkingGameComponent {
  /**
   * The error that occurred, if any.
   */
  public readonly error = this.store.select(fromUploader.selectError);

  constructor(private readonly store: Store<fromRoot.IState>) {}

  public openIssue() {
    this.error.pipe(take(1)).subscribe(err => {
      this.store.dispatch(new ReportRpcError('Error linking game', err!));
    });
  }
}
