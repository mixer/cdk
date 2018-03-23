import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { ItemConfigType } from 'golden-layout';

import { of } from 'rxjs/observable/of';
import { filter, switchMap, take } from 'rxjs/operators';

import { combineLatest } from 'rxjs/operators/combineLatest';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import { ProjectActionTypes, SetOpenProject } from '../project/project.actions';
import * as fromProject from '../project/project.reducer';
import {
  LayoutActionTypes,
  LayoutMethod,
  LayoutScreen,
  OpenScreen,
  SavePanels,
} from './layout.actions';

/**
 * Effects module for account actions.
 */
@Injectable()
export class LayoutEffects {
  /**
   * Fired when we're loading up a new project. Gets the saved panels
   * from the server and moves to the next screen.
   */
  @Effect()
  public readonly startOpen = this.actions
    .ofType<SetOpenProject>(ProjectActionTypes.SET_OPEN_PROJECT)
    .pipe(
      switchMap(action =>
        this.electron.call<ItemConfigType[] | null>(LayoutMethod.LoadPanels, {
          project: action.project.directory,
        }),
      ),
      switchMap(panels => {
        const open = new OpenScreen(LayoutScreen.Editor);
        if (!panels) {
          return of(open);
        }

        return of<Action>(new SavePanels(panels, false), open);
      }),
    );

  /**
   * Persists panel configuration to the server when it chamges.
   */
  @Effect({ dispatch: false })
  public readonly savePanels = this.actions
    .ofType<SavePanels>(LayoutActionTypes.PANELS_SAVE)
    .pipe(
      filter(action => action.propogateToServer),
      combineLatest(this.store.select(fromProject.directory).pipe(filter(Boolean), take(1))),
      switchMap(([action, project]) =>
        this.electron.call(LayoutMethod.SavePanels, { panels: action.panels, project }),
      ),
    );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly store: Store<fromRoot.IState>,
  ) {}
}
