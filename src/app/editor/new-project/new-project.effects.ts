import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { filter, map, switchMap, withLatestFrom } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import { TryOpenProject } from '../project/project.actions';
import {
  ErrorCreating,
  FinishCreating,
  NewProjectActionTypes,
  NewProjectMethods,
  StartCreating,
} from './new-project.actions';
import { targetDirectory } from './new-project.reducer';

/**
 * Effects module for account actions.
 */
@Injectable()
export class NewProjectEffects {
  /**
   * Fired when we want to start creating a project.
   */
  @Effect()
  public readonly startCreation = this.actions
    .ofType<StartCreating>(NewProjectActionTypes.CREATE_START)
    .pipe(
      switchMap(action =>
        this.electron
          .call(NewProjectMethods.StartCreate, action.options)
          .return(new FinishCreating())
          .catch(err => new ErrorCreating(err.stack)),
      ),
    );

  /**
   * Fired when when a project is successfully created.
   */
  @Effect()
  public readonly finishCreation = this.actions
    .ofType<FinishCreating>(NewProjectActionTypes.CREATE_COMPLETE)
    .pipe(
      withLatestFrom(this.store.select(targetDirectory).pipe(filter(Boolean))),
      map(([, dir]) => new TryOpenProject(dir)),
    );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly store: Store<fromRoot.IState>,
  ) {}
}
