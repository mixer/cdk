import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';

import { of } from 'rxjs/observable/of';
import { catchError, mapTo, switchMap } from 'rxjs/operators';

import { ElectronService } from '../electron.service';
import {
  FinishCreating,
  NewProjectActionTypes,
  NewProjectMethods,
  StartCreating,
} from './new-project.actions';

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
    .ofType(NewProjectActionTypes.CREATE_START)
    .pipe(
      switchMap(action =>
        this.electron.call(NewProjectMethods.StartCreate, (<StartCreating>action).options),
      ),
      mapTo(new FinishCreating()),
      catchError(err => of(new FinishCreating(err.stack))),
    );

  constructor(private readonly actions: Actions, private readonly electron: ElectronService) {}
}
