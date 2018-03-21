import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { ChangeScreen, NewProjectScreen, SetLayout } from '../new-project.actions';
import * as fromNewProject from '../new-project.reducer';

/**
 * The layout selection chooses which schema is initially seeded.
 */
@Component({
  selector: 'new-project-layout-selection',
  templateUrl: './layout-selection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSelectionComponent {
  /**
   * Current selected layout.
   */
  public readonly layout = this.store.select(fromNewProject.layout);

  constructor(private readonly store: Store<fromRoot.State>) {}

  public setLayout(layout: string) {
    this.store.dispatch(new SetLayout(layout));
  }

  public next() {
    this.store.dispatch(new ChangeScreen(NewProjectScreen.PackageDetails));
  }
}
