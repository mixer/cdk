import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { isEqual } from 'lodash';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { distinctUntilChanged, map } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { selectStateDump } from '../../remote-connect/remote-connect.reducer';
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
   * Emits whether there's a state dump currently installed.
   */
  public readonly hasStateDump = this.store.select(selectStateDump).pipe(map(d => !!d));

  /**
   * Selects whether the editor screen is open.
   */
  public readonly schema = combineLatest(
    this.store.select(selectWorld),
    this.store.select(selectStateDump),
    (world, dump) => dump || world,
  ).pipe(distinctUntilChanged(isEqual));

  constructor(private readonly store: Store<fromRoot.IState>) {}

  /**
   * Updates the stored world schema.
   */
  public update(data: IWorld) {
    this.store.dispatch(new UpdateWorldSchema(data));
  }
}
