import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { fork } from 'child_process';
import * as path from 'path';

import { PackageIntegrityError } from '../errors';
import { DeclarationError } from '../metadata/error';
import { EvilSniffer } from '../metadata/evilsniffer';
import { createPackage } from '../metadata/metadata';
import { findReadme, getPackageExecutable } from '../npm';
import { awaitChildProcess, copy, exists, readDir } from '../util';
import { Writer } from '../writer';

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
  constructor(private readonly projectDir: string = process.env.MIIX_PROJECT) {}

  public async bundle(
    progressReporter: (message: string) => void = () => undefined,
  ): Promise<IBundlerOutput> {
    progressReporter('Reading control metadata');
    const config = await createPackage(this.projectDir);

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
   * Checks that eval functions are not used, or asks the user to confirm
   * they they understand the risks using the writer. Returns whether
   * publishing should be continued.
   */
  public async checkEvil(writer: Writer): Promise<boolean> {
    try {
      await new EvilSniffer().compile(this.projectDir);
    } catch (e) {
      if (!(e instanceof DeclarationError)) {
        throw e;
      }

      writer.write(`${e.getHumanMessage()}\n\n`);
      return await writer.confirm(
        'Using these unsafe functions is strongly discouraged, and may cause your ' +
          'controls to be banned from Mixer. Read more about why this is at ' +
          'https://aka.ms/dont-be-eval.',
        false,
      );
    }

    return true;
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

    const readme = findReadme(this.projectDir);
    if (!readme) {
      throw new PackageIntegrityError(
        `An readme.md is missing in your project (${path.join(
          this.projectDir,
          'readme.md',
        )} should exist)`,
      );
    }

    const packageJson = path.join(this.projectDir, 'package.json');
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
      copy(path.resolve(this.projectDir, 'readme.md'), path.resolve(output, 'readme.md')),
      copy(path.resolve(this.projectDir, 'package.json'), path.resolve(output, 'package.json')),
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
    return require(path.join(this.projectDir, 'webpack.config.js')).output.path;
  }

  /**
   * Runs webpack to create a production bundle.
   */
  private async runWebpack(): Promise<void> {
    const wds = getPackageExecutable(path.join(this.projectDir, 'node_modules', 'webpack'));

    return awaitChildProcess(
      fork(wds, ['--display=minimal'], {
        cwd: process.cwd(),
        env: { ...process.env, ENV: 'production' },
        silent: true,
      }),
    );
  }
}
