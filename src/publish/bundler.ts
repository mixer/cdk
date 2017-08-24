import { fork } from 'child_process';
import * as path from 'path';

import { PackageIntegrityError, WebpackBundlerError } from '../errors';
import { createPackage } from '../metadata/metadata';
import { getPackageExecutable } from '../npm';
import { exists, readDir } from '../util';

const tar = require('tar'); // typings are pretty bad for this module.

/**
 * Bundler packages up controls from a project directory into a tarball
 * that can be uploaded to Mixer.
 */
export class Bundler {
  constructor(private readonly projectDir: string = process.env.MIIX_PROJECT) {}

  public async bundle(
    progressReporter: (message: string) => void = () => undefined,
  ): Promise<string> {
    progressReporter('Reading control metadata');
    const packaged = await createPackage(this.projectDir);

    progressReporter('Running webpack bundler');
    const filename = path.join(process.cwd(), `${packaged.name}.tar.gz`);
    await this.runWebpack();

    progressReporter('Verifying basic integrity');
    const outputDir = this.getOutputPath();
    await this.verifyIntegrity(outputDir);

    progressReporter('Compressing files');
    await this.createTarball(outputDir, filename);

    return filename;
  }

  /**
   * Throws an PackageIntegrityError if there are any obvious problems with
   * the bundler output.
   */
  private async verifyIntegrity(output: string): Promise<void> {
    const home = path.join(output, 'index.html');
    if (!await exists(home)) {
      throw new PackageIntegrityError(
        `An index.html is missing in your project output (${home} should exist)`,
      );
    }
  }

  /**
   * Compresses the output dir into the target tarball.
   */
  private async createTarball(output: string, target: string): Promise<void> {
    const files = await readDir(output);
    await tar.create(
      {
        file: target,
        gzip: { level: 9 },
        cwd: output,
      },
      files,
    );
  }

  /**
   * Returns the webpack output path.
   */
  private getOutputPath(): string {
    // tslint:disable-next-line
    return require(path.join(this.projectDir, 'webpack.config.js')).output.path;
  }

  /**
   * Runs webpack to create a production bundle.
   */
  private async runWebpack(): Promise<void> {
    const wds = await getPackageExecutable(path.join(this.projectDir, 'node_modules', 'webpack'));

    const child = fork(wds, ['--display=minimal'], {
      cwd: process.cwd(),
      env: { ...process.env, ENV: 'production' },
      silent: true,
    });

    const stdAll: (string | Buffer)[] = [];
    child.stdout.on('data', data => {
      stdAll.push(data);
    });
    child.stderr.on('data', data => {
      stdAll.push(data);
    });

    await new Promise(resolve => {
      child.on('close', code => {
        if (code === 0) {
          resolve();
          return;
        }

        const output = Buffer.concat(stdAll.map(s => (typeof s === 'string' ? Buffer.from(s) : s)));
        throw new WebpackBundlerError(output.toString('utf8'));
      });
    });
  }
}
