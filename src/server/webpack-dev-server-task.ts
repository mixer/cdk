import { notificationEnv } from '@mixer/cdk-webpack-plugin/dist/src/notifier';
import { ChildProcess } from 'child_process';
import * as portfinder from 'portfinder';
import { filter } from 'rxjs/operators';
import { quote } from 'shell-quote';

import { IWebpackInstance, WebpackState } from '../app/editor/controls/controls.actions';
import { spawnPackageScript } from './npm-exec';
import { WebpackTask } from './webpack-task';

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
export class WebpackDevServer extends WebpackTask<IWebpackInstance> {
  /**
   * @override
   */
  protected async startWebpack(config: string): Promise<[IWebpackInstance, ChildProcess]> {
    const port: number = await portfinder.getPortPromise({ port: 13370 });
    const parsedConfig: string = quote([config]);
    const process = spawnPackageScript(
      this.project.baseDir(),
      'webpack-dev-server',
      [`--port`, String(port), '--config', `"${parsedConfig.slice(1, -1)}"`, '--color'],
      {
        cwd: this.project.baseDir(),
        env: {
          [notificationEnv]: '1',
        },
      },
    );

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
}
