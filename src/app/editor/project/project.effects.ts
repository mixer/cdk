import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';

import { of } from 'rxjs/observable/of';
import { catchError, filter, map, switchMap } from 'rxjs/operators';

import { CommonMethods, UnhandledError } from '../bedrock.actions';
import { ElectronService } from '../electron.service';
import {
  IProject,
  ProjectActionTypes,
  ProjectMethods,
  SetOpenProject,
  TryOpenProject,
} from './project.actions';

/**
 * Effects module for account actions.
 */
@Injectable()
export class ProjectEffects {
  /**
   * Fired when we want to pick a project directory to open.
   */
  @Effect()
  public readonly startOpen = this.actions
    .ofType(ProjectActionTypes.START_OPEN_PROJECT)
    .pipe(
      switchMap(() =>
        this.electron.call<string>(CommonMethods.ChooseDirectory, { context: 'openProject' }),
      ),
      filter(dir => !!dir),
      map(dir => new TryOpenProject(dir)),
    );

  /**
   * Fired when we want to try to open a project directory, by name.
   */
  @Effect()
  public readonly tryOpen = this.actions.ofType(ProjectActionTypes.TRY_OPEN_PROJECT).pipe(
    switchMap(action =>
      this.electron.call<IProject>(ProjectMethods.OpenDirectory, {
        directory: (<TryOpenProject>action).directory,
      }),
    ),
    map(results => new SetOpenProject(results)),
    catchError(err => of(new UnhandledError(err))),
  );

  constructor(private readonly actions: Actions, private readonly electron: ElectronService) {}
}
