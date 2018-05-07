import { ChildProcess, spawn } from 'child_process';

import { ConsoleTask } from './console-task';

/**
 * NpmInstallTask run an npm installation on the target directory.
 */
export class NpmInstallTask extends ConsoleTask<void> {
  constructor(private readonly directory: string) {
    super();
  }

  /**
   * Boots the webpack dev server. Returns
   */
  protected async spawnChildProcess(): Promise<[void, ChildProcess]> {
    process.env.NODE_ENV = 'development';
    const childProcess = spawn('npm', ['install', '-d', '--color=always'], {
      cwd: this.directory,
      env: process.env,
      shell: true,
    });

    return [undefined, childProcess];
  }
}
