import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, mapTo, switchMap, take } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { GoldenPanel, isFocused } from '../layout/layout.actions';
import { layoutState } from '../layout/layout.reducer';
import { ControlsConsoleActionTypes, MarkRead } from './controls-console.actions';

/**
 * Effects module for account actions.
 */
@Injectable()
export class ControlsConsoleEffects {
  /**
   * Boots the server when we get an action to start it up.
   */
  @Effect()
  public readonly bootServer = this.actions
    .ofType(ControlsConsoleActionTypes.AppendMessage)
    .pipe(
      switchMap(() =>
        this.store
          .select(layoutState)
          .pipe(
            map(s => s.goldenLayout),
            filter(layout => !!layout && isFocused(layout, GoldenPanel.ControlsConsole)),
            mapTo(new MarkRead()),
            take(1),
          ),
      ),
    );

  constructor(private readonly actions: Actions, private readonly store: Store<fromRoot.IState>) {}
}
