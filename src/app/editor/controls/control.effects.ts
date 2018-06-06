import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { defer } from 'rxjs/observable/defer';
import { of } from 'rxjs/observable/of';
import { filter, map, startWith, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import { mapTo } from 'rxjs/operators/mapTo';
import * as fromRoot from '../bedrock.reducers';
import { ElectronService, RpcError } from '../electron.service';
import {
  ClosePanel,
  focusGolden,
  GoldenPanel,
  OpenPanel,
  stackedLocator,
} from '../layout/layout.actions';
import * as fromLayout from '../layout/layout.reducer';
import { ProjectActionTypes, SetOpenProject } from '../project/project.actions';
import { withLatestDirectory } from '../project/project.reducer';
import { DirectoryOpener } from '../shared/directory-opener';
import { truthy } from '../shared/operators';
import { ControlsWebpackConsoleService } from './controls-webpack-console.service';
import {
  AutoCloseConsole,
  AutoOpenConsole,
  ControlsActionTypes,
  ControlsMethods,
  isRunning,
  IWebpackInstance,
  PromptLocateWebpackConfig,
  SendControlPacket,
  SetWebpackInstance,
  StartWebpack,
  StopWebpack,
  UpdateWebpackConsole,
  UpdateWebpackState,
  WebpackState,
} from './controls.actions';
import { didAutoOpenWebpackConsole, webpackState } from './controls.reducer';
import { BaseStateSyncService } from './sync/base-state-sync.service';
import { WebpackConfigLocatorModalComponent } from './webpack-config-locator-modal/webpack-config-locator-modal.component';

/**
 * Effects module for controls actions.
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
      withLatestDirectory(this.store),
      tap(() => this.console.clear.next()),
      switchMap(([, directory]) =>
        this.electron
          .call<IWebpackInstance>(ControlsMethods.StartWebpack, { directory })
          .then(instance => new SetWebpackInstance(instance))
          .catch(
            err => err instanceof RpcError && err.originalName === 'MissingWebpackConfig',
            () => new PromptLocateWebpackConfig(),
          ),
      ),
    );

  /**
   * Stops a webpack server, waits until it has stopped, then restarts it.
   */
  @Effect()
  public readonly restartWebpack = this.actions
    .ofType(ControlsActionTypes.RESTART_WEBPACK)
    .pipe(
      switchMap(() =>
        this.store
          .select(webpackState)
          .pipe(
            filter(s => !isRunning(s)),
            take(1),
            mapTo(<Action>new StartWebpack()),
            startWith(<Action>new StopWebpack()),
          ),
      ),
    );

  /**
   * Boots the webpack server when the project is opened.
   */
  @Effect()
  public readonly bootServerOnOpen = this.actions
    .ofType<SetOpenProject>(ProjectActionTypes.SET_OPEN_PROJECT)
    .pipe(map(() => new StartWebpack()));

  /**
   * Halts webpack when the relevant action is dispatched.
   */
  @Effect({ dispatch: false })
  public readonly stopWebpack = this.actions
    .ofType(ControlsActionTypes.STOP_WEBPACK)
    .pipe(switchMap(() => this.electron.call(ControlsMethods.StopWebpack)));

  /**
   * Halts webpack when the project is closed.
   */
  @Effect()
  public readonly closeProject = this.actions
    .ofType(ProjectActionTypes.CLOSE_PROJECT)
    .pipe(mapTo(new StopWebpack()));

  /**
   * Adds data to the webpack console.
   */
  @Effect({ dispatch: false })
  public readonly addConsoleData = this.actions
    .ofType<UpdateWebpackConsole>(ControlsActionTypes.UPDATE_WEBPACK_CONSOLE)
    .pipe(tap(({ data }) => this.console.write(data)));

  /**
   * Sends data to the controls
   */
  @Effect({ dispatch: false })
  public readonly sendControlPacket = this.actions
    .ofType<SendControlPacket>(ControlsActionTypes.SEND_CONTROL_PACKET)
    .pipe(tap(({ method, params }) => this.baseSync.send(method, params)));

  /**
   * Pops open the webpack console while the project is building or when
   * an error occurs, and closes it once that state has been resolved.
   */
  @Effect()
  public readonly shouldOpenWebpackConsole = this.actions
    .ofType<UpdateWebpackState>(ControlsActionTypes.UPDATE_WEBPACK_STATE)
    .pipe(
      withLatestFrom(this.store.select(fromLayout.goldenLayout)),
      switchMap(([{ state }, layout]) => {
        if (state !== WebpackState.Compiled) {
          if (!layout || !focusGolden(layout.root, GoldenPanel.WebpackConsole)) {
            return of(new AutoOpenConsole());
          }

          return of();
        }

        return this.store.select(didAutoOpenWebpackConsole).pipe(
          take(1),
          tap(() => {
            if (layout) {
              focusGolden(layout.root, GoldenPanel.Controls);
            }
          }),
          truthy(),
          mapTo(<Action>new AutoCloseConsole()),
        );
      }),
    );

  /**
   * Triggers a layout effect when we want to auto-open the dev console.
   */
  @Effect()
  public readonly autoOpenWebpackConsole = this.actions
    .ofType(ControlsActionTypes.AUTO_OPEN_CONSOLE)
    .pipe(mapTo(new OpenPanel(GoldenPanel.WebpackConsole, stackedLocator(GoldenPanel.Controls))));

  /**
   * Fired when we have run a successful compilation and should auto-close
   * the console, if we auto-opened.
   */
  @Effect()
  public readonly autoCloseWebpackConsole = this.actions
    .ofType(ControlsActionTypes.AUTO_CLOSE_CONSOLE)
    .pipe(mapTo(new ClosePanel(GoldenPanel.WebpackConsole)));

  /**
   * Fired when the service is created; cleans up any old webpack servers
   * we may have had (e.g. if the UI is refreshed)
   */
  @Effect() public readonly closeOrphanedServers = defer(() => of(new StopWebpack()));

  /**
   * Triggers a refresh of the controls when the relevant action is dispatched.
   */
  @Effect({ dispatch: false })
  public readonly refresh = this.actions
    .ofType(ControlsActionTypes.REFRESH_CONTROLS)
    .pipe(tap(() => this.baseSync.refresh.next()));

  /**
   * Opens a dialog to ask them to point to the webpack config file.
   */
  @Effect({ dispatch: false })
  public readonly promptLocateWebpackConfig = this.actions
    .ofType(ControlsActionTypes.PROMPT_LOCATE_WEBPACK_CONFIG)
    .pipe(tap(() => this.dialog.open(WebpackConfigLocatorModalComponent)));

  /**
   * Opens the current webpack config on disk.
   */
  @Effect()
  public readonly openWebpackConfig = this.actions
    .ofType(ControlsActionTypes.OPEN_WEBPACK_CONFIG)
    .pipe(
      switchMap(() => new DirectoryOpener(this.electron).findProgram()),
      filter(Boolean),
      withLatestDirectory(this.store),
      switchMap(([program, directory]) =>
        this.electron
          .call<string>(ControlsMethods.GetWebpackConfig, { directory })
          .then(location => new DirectoryOpener(this.electron).open(location, program))
          .return()
          .catch(
            err => err instanceof RpcError && err.originalName === 'MissingWebpackConfig',
            () => new PromptLocateWebpackConfig(),
          ),
      ),
      filter(Boolean),
    );

  /**
   * Triggers a refresh of the controls when the relevant action is dispatched.
   */
  @Effect()
  public readonly locateWebpackConfig = this.actions
    .ofType(ControlsActionTypes.LOCATE_WEBPACK_CONFIG)
    .pipe(
      withLatestDirectory(this.store),
      switchMap(([, directory]) =>
        this.electron
          .call(ControlsMethods.SetWebpackConfig, { directory })
          .then(path => (path ? new StartWebpack() : null)),
      ),
      truthy(),
    );

  constructor(
    private readonly actions: Actions,
    private readonly electron: ElectronService,
    private readonly console: ControlsWebpackConsoleService,
    private readonly store: Store<fromRoot.IState>,
    private readonly baseSync: BaseStateSyncService,
    private readonly dialog: MatDialog,
  ) {}
}
