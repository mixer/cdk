import {
  CompilationState,
  Notification,
  notificationEnv,
  notificationPrefix,
  NotificationType,
} from '@mcph/miix-webpack-plugin/dist/src/notifier';
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Observable } from 'rxjs/Observable';
import { map, merge, partition, take, filter } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import * as treekill from 'tree-kill';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { IWebpackInstance, WebpackState, isRunning } from '../app/editor/controls/controls.actions';
import { MissingWebpackConfig } from './errors';
import { spawnPackageScript } from './npm-exec';
import { Project } from './project';
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
 * Simple colleciton of WebpackDevServer instances.
 */
export class WebpackServers {
  private runningServers = new Map<number, WebpackDevServer>();

  constructor() {
    process.on('exit', () => this.stopAll());
  }

  /**
   * Stops all running webpack dev servers.
   */
  public stopAll() {
    for (const server of this.runningServers.values()) {
      server.stop();
    }
  }

  /**
   * Returns a list of all running webpack dev servers.
   */
  public getAll(): WebpackDevServer[] {
    return [...this.runningServers.values()];
  }

  /**
   * Creates a new webpack dev server, adds it to the registry, and returns it.
   */
  public create(project: Project): WebpackDevServer {
    const server = new WebpackDevServer(project);
    this.runningServers.set(server.id, server);
    server.state
      .pipe(filter(state => !isRunning(state)), take(1))
      .subscribe(() => this.runningServers.delete(server.id));

    return server;
  }
}

/**
 * WebpackDevServer handles spinning up a local webpack dev server in the
 * target project directory.
 */
export class WebpackDevServer extends EventEmitter {
  private static idIncrement = 0;

  /**
   * Public ID that can be used to reference this bootstrap instance.
   */
  public readonly id = WebpackDevServer.idIncrement++;

  /**
   * State of this webpack instance.
   */
  public readonly state = new BehaviorSubject(WebpackState.Stopped);

  /**
   * Emits when new data is readon
   */
  public readonly data = new Subject<string>();

  /**
   * The currently executing child process, if any.
   */
  private process: ChildProcess | undefined;

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
  public async start(): Promise<IWebpackInstance> {
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
    this.process = process;
    this.readProcessData(process);

    process.on('exit', code => {
      if (code === 0) {
        this.state.next(WebpackState.Stopped);
      } else {
        this.state.next(WebpackState.Failed);
      }
    });

    return {
      id: this.id,
      // tslint:disable-next-line
      address: `http://localhost:${port}`,
    };
  }

  /**
   * Gracefully closes the webpack dev server.
   */
  public stop() {
    if (this.process) {
      this.state.next(WebpackState.Stopping);
      // process.kill() is not sufficient on windows,
      // see https://stackoverflow.com/a/32814686/1125956
      treekill(this.process.pid);
      this.process = undefined;
    }
  }

  /**
   * Reads stdout/err from the process and dispatches it accordingly.
   */
  private readProcessData(process: ChildProcess) {
    // Our webpack plugin writes metadata to stderr, partition out our
    // notification strings and pass everything else along.
    const [notifications, data] = partition(isNotification)(fromInputSlices(process.stderr, '\n'));

    data
      .pipe(merge(fromInputSlices(process.stdout, '\n')), map(line => `${line}\n`))
      .subscribe(d => this.data.next(d));

    notifications
      .pipe(map(line => JSON.parse(line.slice(notificationPrefix.length))))
      .subscribe(notification => this.handleNotification(notification));
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

/**
 * Predicate for whether the line of data is a notification from the
 * webpack plugin.
 */
function isNotification(data: string): boolean {
  return data.startsWith(notificationPrefix);
}

/**
 * Returns an observable of the input data sliced into happy little
 * delimiter-delimited chunks.
 */
function fromInputSlices(stream: NodeJS.ReadableStream, delimiter: string): Observable<string> {
  const subj = new Subject<string>();
  let buffer = Buffer.from([]);

  stream.on('data', data => {
    buffer = Buffer.concat([buffer, data]);

    // tslint:disable-next-line
    while (true) {
      const index = buffer.indexOf(delimiter);
      if (index === -1) {
        return;
      }

      subj.next(buffer.slice(0, index).toString());
      buffer = buffer.slice(index + delimiter.length);
    }
  });

  return subj;
}
