import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { fork } from 'child_process';
import * as path from 'path';

import { PackageIntegrityError } from '../errors';
import { findReadme, getPackageExecutable } from '../npm';
import { Project } from '../project';
import { awaitChildProcess, copy, exists, readDir } from '../util';

const tar = require('tar'); // typings are pretty bad for this module.

/**
 * IBundlerOutput is returned from Bundler.bundle
 */
export interface IBundlerOutput {
  filename: string;
  config: IPackageConfig;
}

/**
 * Bundler packages up controls from a project directory into a tarball
 * that can be uploaded to Mixer.
 */
export class Bundler {
  constructor(private readonly project: Project) {}

  public async bundle(
    progressReporter: (message: string) => void = () => undefined,
  ): Promise<IBundlerOutput> {
    progressReporter('Reading control metadata');
    const config = await this.project.packageConfig();

    progressReporter('Running webpack bundler');
    const filename = path.join(process.cwd(), `${config.name}.tar.gz`);
    await this.runWebpack();

    progressReporter('Verifying basic integrity');
    const outputDir = this.getOutputPath();
    await this.verifyIntegrity(outputDir);

    progressReporter('Compressing files');
    await this.createTarball(outputDir, filename);

    return { filename, config };
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

    const readme = findReadme(this.project.baseDir());
    if (!readme) {
      throw new PackageIntegrityError(
        `An readme.md is missing in your project (${this.project.baseDir(
          'readme.md',
        )} should exist)`,
      );
    }

    const packageJson = this.project.baseDir('package.json');
    if (!await exists(packageJson)) {
      throw new PackageIntegrityError(
        `An package.json is missing in your project (${packageJson} should exist)`,
      );
    }
  }

  /**
   * Compresses the output dir into the target tarball.
   */
  private async createTarball(output: string, target: string): Promise<void> {
    await Promise.all([
      copy(this.project.baseDir('readme.md'), path.resolve(output, 'readme.md')),
      copy(this.project.baseDir('package.json'), path.resolve(output, 'package.json')),
    ]);

    await tar.create(
      {
        file: target,
        gzip: { level: 9 },
        cwd: output,
      },
      await readDir(output),
    );
  }

  /**
   * Returns the webpack output path.
   */
  private getOutputPath(): string {
    // tslint:disable-next-line
    return require(this.project.baseDir('webpack.config.js')).output.path;
  }

  /**
   * Runs webpack to create a production bundle.
   */
  private async runWebpack(): Promise<void> {
    const wds = getPackageExecutable(this.project.baseDir('node_modules', 'webpack'));

    return awaitChildProcess(
      fork(wds, ['--display=minimal'], {
        cwd: process.cwd(),
        env: { ...process.env, ENV: 'production' },
        silent: true,
      }),
    );
  }
}
