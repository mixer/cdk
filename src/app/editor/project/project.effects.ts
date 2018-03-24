import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';

import { filter, map, switchMap } from 'rxjs/operators';

import { CommonMethods } from '../bedrock.actions';
import { ElectronService, RpcError } from '../electron.service';
import { ErrorToastComponent } from '../toasts/error-toast/error-toast.component';
import * as forToast from '../toasts/toasts.actions';
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
  public readonly tryOpen = this.actions
    .ofType<TryOpenProject>(ProjectActionTypes.TRY_OPEN_PROJECT)
    .pipe(
      switchMap(action =>
        this.electron
          .call<IProject>(ProjectMethods.OpenDirectory, {
            directory: action.directory,
          })
          .then(results => new SetOpenProject(results))
          .catch(RpcError, (err: RpcError) => new forToast.OpenToast(ErrorToastComponent, err)),
      ),
    );

  constructor(private readonly actions: Actions, private readonly electron: ElectronService) {}
}
