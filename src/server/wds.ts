import {
  CompilationState,
  Notification,
  notificationEnv,
  notificationPrefix,
  NotificationType,
} from '@mcph/miix-webpack-plugin/dist/src/notifier';
import { ChildProcess } from 'child_process';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { filter } from 'rxjs/operators';

import { IWebpackInstance, WebpackState } from '../app/editor/controls/controls.actions';
import { MissingWebpackConfig } from './errors';
import { spawnPackageScript } from './npm-exec';
import { Project } from './project';
import { ConsoleTask } from './tasks/console-task';
import { exists } from './util';

const portfinder = require('portfinder');
portfinder.basePort = 13370;

/**
 * Just making a note of some investigations here. *Ideally* I wanted to embed
 * webpack and the webpack-dev-server inside the app itself, but that means
 * we can't use external configs, because (even if we require() them) they'll
 * depend on modules not loaded in this application. Except if we screw around
 * with the node module resolution to append the project modules to the
 * NODE_PATH, but this is super fragile.
 *
 * So, instead, we subprocess out. Not the end of the world, the
 * webpack-dev-server doesn't give us much introspection abilities anyway,
 * we just have to keep track of an external process.
 */

/**
 * Regex for the awesome-typescript-loader error. It runs its error checking
 * asynchronously, so the compilation might "pass" but there can be errors.
 * Manually parse this case from the console output and treat it as
 * having had a compilation error.
 */
const atlErrorRegex = /\[at-loader\] Checking finished with [0-9]+ errors/;

/**
 * WebpackDevServer handles spinning up a local webpack dev server in the
 * target project directory.
 */
export class WebpackDevServer extends ConsoleTask<IWebpackInstance> {
  /**
   * State of this webpack instance.
   */
  public readonly state = new BehaviorSubject(WebpackState.Stopped);

  constructor(private readonly project: Project) {
    super();
  }

  /**
   * Updates the webpack config file name to use.
   */
  public async setConfigFilename(name: string) {
    await this.project.saveSetting('webpackConfigFile', name);
  }

  /**
   * Boots the webpack dev server. Returns
   */
  protected async spawnChildProcess(): Promise<[IWebpackInstance, ChildProcess]> {
    const config = await this.project.loadSetting('webpackConfigFile', 'webpack.config.js');
    if (!await exists(this.project.baseDir(config))) {
      throw new MissingWebpackConfig();
    }

    const port: number = await portfinder.getPortPromise();
    const process = spawnPackageScript(
      this.project.baseDir(),
      'webpack-dev-server',
      [`--port=${port}`, '--color'],
      {
        cwd: this.project.baseDir(),
        env: {
          [notificationEnv]: '1',
        },
      },
    );

    this.state.next(WebpackState.Starting);

    process.on('exit', code => {
      if (code === 0) {
        this.state.next(WebpackState.Stopped);
      } else {
        this.state.next(WebpackState.Failed);
      }
    });

    this.data
      .pipe(filter(line => atlErrorRegex.test(line)))
      .subscribe(() => this.state.next(WebpackState.HadError));

    return [
      {
        id: this.id,
        // tslint:disable-next-line
        address: `http://localhost:${port}`,
      },
      process,
    ];
  }

  /**
   * @override
   */
  protected beforeStop() {
    this.state.next(WebpackState.Stopping);
  }

  /**
   * Reads stdout/err from the process and dispatches it accordingly.
   */
  protected processLine(line: string): string | void {
    if (!line.startsWith(notificationPrefix)) {
      return line;
    }

    const parsed = JSON.parse(line.slice(notificationPrefix.length));
    this.handleNotification(parsed);
    return undefined;
  }

  private handleNotification(notification: Notification) {
    if (notification.kind !== NotificationType.Status) {
      return;
    }

    if (this.state.getValue() === WebpackState.Stopping) {
      return;
    }

    switch (notification.state) {
      case CompilationState.Started:
        this.state.next(WebpackState.Compiling);
        break;
      case CompilationState.Error:
        this.state.next(WebpackState.HadError);
        break;
      case CompilationState.Success:
        this.state.next(WebpackState.Compiled);
        break;
      default:
      // noop
    }
  }
}
