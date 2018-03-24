import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { map, switchMap, tap } from 'rxjs/operators';

import { ElectronService } from '../electron.service';
import { ProjectActionTypes, SetOpenProject } from '../project/project.actions';
import { ControlsConsoleService } from './controls-console.service';
import {
  ControlsActionTypes,
  ControlsMethods,
  IWebpackInstance,
  SetWebpackInstance,
  StartWebpack,
  UpdateWebpackConsole,
} from './controls.actions';

/**
 * Effects module for account actions.
 */
@Injectable()
export class ControlEffects {
  /**
   * Boots the server when we get an action to start it up.
   */
  @Effect()
  public readonly bootServer = this.actions
    .ofType<StartWebpack>(ControlsActionTypes.START_WEBPACK)
    .pipe(
      switchMap(action =>
        this.electron.call<IWebpackInstance>(ControlsMethods.StartWebpack, action),
      ),
      map(instance => new SetWebpackInstance(instance)),
    );

  /**
   * Boots the webpack server when the project is opened.
   */
  @Effect()
  public readonly bootServerOnOpen = this.actions
    .ofType<SetOpenProject>(ProjectActionTypes.SET_OPEN_PROJECT)
    .pipe(map(({ project }) => new StartWebpack(project.directory)));

  /**
   * Halts webpack when the relevant action is dispatched.
   */
  @Effect({ dispatch: false })
  public readonly stopWebpack = this.actions
    .ofType(ControlsActionTypes.STOP_WEBPACK)
    .pipe(switchMap(() => this.electron.call(ControlsMethods.StopWebpack)));

  /**
   * Adds data to the webpack console.
   */
  @Effect({ dispatch: false })
  public readonly addConsoleData = this.actions
    .ofType<UpdateWebpackConsole>(ControlsActionTypes.UPDATE_WEBPACK_CONSOLE)
    .pipe(tap(({ data }) => this.console.write(data)));

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly console: ControlsConsoleService,
  ) {}
}
