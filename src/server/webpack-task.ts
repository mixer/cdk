import {
  CompilationState,
  Notification,
  NotificationType,
  readNotification,
} from '@mixer/cdk-webpack-plugin/dist/src/notifier';
import { ChildProcess } from 'child_process';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { WebpackState } from '../app/editor/controls/controls.actions';
import { MissingWebpackConfig } from './errors';
import { Project } from './project';
import { ConsoleTask } from './tasks/console-task';
import { NpmInstallTask } from './tasks/npm-install-task';
import { exists } from './util';

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
 * The WebpackTask is a Task that runs a webpack job. Wraps a method to
 * boot the process an exposes the WebpackState.
 */
export abstract class WebpackTask<T> extends ConsoleTask<T> {
  /**
   * State of this webpack instance.
   */
  public readonly state = new BehaviorSubject(WebpackState.Stopped);

  constructor(protected readonly project: Project) {
    super();
  }

  /**
   * Updates the webpack config file name to use.
   */
  public async setConfigFilename(name: string) {
    await this.project.saveSetting('webpackConfigFile', name);
  }

  /**
   * Boots the webpack server, called with the webpack config file.
   */
  protected abstract startWebpack(config: string): Promise<[T, ChildProcess]>;

  /**
   * Boots the webpack dev server. Returns
   */
  protected async spawnChildProcess(): Promise<[T, ChildProcess]> {
    const config = await this.project.loadSetting('webpackConfigFile', 'webpack.config.js');
    if (!(await exists(this.project.baseDir(config)))) {
      throw new MissingWebpackConfig();
    }

    this.state.next(WebpackState.Starting);

    if (!(await exists(this.project.baseDir('node_modules')))) {
      this.data.next('Node modules not found, starting installation. This may take a minute.\n');
      await this.installNodeModules();
    }

    const [out, process] = await this.startWebpack(config);

    process.on('exit', code => {
      if (code === 0) {
        this.state.next(WebpackState.Stopped);
      } else {
        this.state.next(WebpackState.Failed);
      }
    });

    return [out, process];
  }

  /**
   * @override
   */
  protected beforeStop() {
    this.state.next(WebpackState.Stopping);
  }

  /**
   * Runs npm install. This is called when starting webpack if we detect
   * that the user doesn't have their modules installed.
   */
  protected async installNodeModules() {
    const task = new NpmInstallTask(this.project.baseDir());
    task.data.subscribe(data => this.data.next(data));
    await this.awaitSubtask(task);
  }

  /**
   * Reads stdout/err from the process and dispatches it accordingly.
   */
  protected processLine(line: string): string | void {
    const notification = readNotification(line);
    if (!notification) {
      return line;
    }

    this.handleNotification(notification);
    return undefined;
  }

  protected handleNotification(notification: Notification) {
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
