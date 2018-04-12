import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of } from 'rxjs/observable/of';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import { CloseProject, TryOpenProject } from '../project/project.actions';
import { toLatestFrom, truthy } from '../shared/operators';
import {
  AppendCreateUpdate,
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
        fromPromise(
          this.electron
            .call(NewProjectMethods.StartCreate, action.options)
            .return(new FinishCreating()),
        ).pipe(
          startWith(<Action>new CloseProject()),
          catchError(err =>
            of<Action>(new AppendCreateUpdate(err.stack), new ErrorCreating(err.stack)),
          ),
        ),
      ),
    );

  /**
   * Fired when when a project is successfully created.
   */
  @Effect()
  public readonly finishCreation = this.actions
    .ofType<FinishCreating>(NewProjectActionTypes.CREATE_COMPLETE)
    .pipe(
      toLatestFrom(this.store.select(targetDirectory).pipe(truthy())),
      map(dir => new TryOpenProject(dir)),
    );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly store: Store<fromRoot.IState>,
  ) {}
}
