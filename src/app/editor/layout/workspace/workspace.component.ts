import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { LayoutScreen } from '../layout.actions';
import { selectScreen } from '../layout.reducer';

/**
 * The WorkspaceComponent is the primary component hosting the editor layout..
 */
@Component({
  selector: 'layout-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent {
  /**
   * Whether to show the project screen, or welcome screen.
   */
  public readonly showProjectScreen = this.store
    .select(selectScreen)
    .pipe(map(screen => screen === LayoutScreen.Editor));

  constructor(private readonly store: Store<fromRoot.IState>) {}
}
