import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { ChangeScreen, SetTemplate, GoBack } from '../new-project.actions';
import * as fromNewProject from '../new-project.reducer';

/**
 * The template selection chooses which initial project template is shown.
 */
@Component({
  selector: 'new-project-template-selection',
  templateUrl: './template-selection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateSelectionComponent {
  /**
   * Current selected template.
   */
  public readonly template = this.store.select(fromNewProject.template);

  constructor(private readonly store: Store<fromRoot.IState>) {}

  public setTemplate(template: string) {
    this.store.dispatch(new SetTemplate(template));
  }

  public next() {
    this.store.dispatch(new ChangeScreen());
  }

  public back() {
    this.store.dispatch(new GoBack());
  }
}
