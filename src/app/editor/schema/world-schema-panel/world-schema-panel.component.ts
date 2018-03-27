import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../../bedrock.reducers';
import { IWorld, UpdateWorldSchema } from '../schema.actions';
import { selectWorld } from '../schema.reducer';

/**
 * The ControlsBoostrapComponent displays server state while it's initializing.
 */
@Component({
  selector: 'world-schema-panel',
  templateUrl: './world-schema-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldSchemaPanelComponent {
  /**
   * Selects whether the editor screen is open.
   */
  public readonly schema = this.store.select(selectWorld);

  constructor(private readonly store: Store<fromRoot.IState>) {}

  /**
   * Updates the stored world schema.
   */
  public update(data: IWorld) {
    this.store.dispatch(new UpdateWorldSchema(data));
  }
}
