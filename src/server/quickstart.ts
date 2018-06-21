import chalk from 'chalk';
import nodeFetch, { Response } from 'node-fetch';
import * as path from 'path';
import { extract } from 'tar';

import { UnexpectedHttpError } from './errors';
import { NpmInstallTask } from './tasks/npm-install-task';
import { Task } from './tasks/task';
import { exists, mkdir, readFile, writeFile } from './util';

const templateAliases: { [key: string]: string } = {
  preact: 'cdk-preact-starter_1.0.tar.gz',
  html: 'cdk-html-starter_1.0.tar.gz',
};

/**
 * Options for the
 */
export interface IQuickstartOptions {
  dir: string;
  projectName: string;
  template: string;
  license: string;
  keywords: string;
  author: string;
  description?: string;
}

/**
 * Quickstarter helps with creating and install projects.
 */
export class Quickstarter extends Task<void> {
  constructor(private readonly options: Readonly<IQuickstartOptions>) {
    super();
  }

  /**
   * Starts the extraction. Emits `data` events, with console info, as
   * the process runs.
   */
  public async start() {
    await this.workflow(
      async () => this.extractProject(await this.getTarball()),
      async () => this.updateProjectJson(),
      () => this.installDependences(),
    );

    this.data.next(chalk.green('\nInstallation completed successfully.\n'));
    return this.stop();
  }

  /**
   * Returns a task that installs npm dependencies.
   */
  private installDependences() {
    this.emitPrompt('npm install');
    const task = new NpmInstallTask(this.targetPath());
    task.data.subscribe(data => this.data.next(data));
    return task;
  }

  /**
   * Updates the project JSON to match the options given in the quickstart.
   */
  private async updateProjectJson() {
    this.emitPrompt('patch project.json');

    const partial = {
      name: this.options.projectName,
      description: this.options.description ? this.options.description : undefined,
      version: '0.1.0',
      author: this.options.author,
      keywords: this.options.keywords
        ? this.options.keywords.split(',').map(kw => kw.toLowerCase().trim())
        : [],
      license: this.options.license,
    };

    const packageJsonPath = path.join(this.targetPath(), 'package.json');
    const source = JSON.parse(await readFile(packageJsonPath));
    await this.updateWebpackPlugin(source);
    const updated = JSON.stringify({ ...source, ...partial }, null, 2);
    await writeFile(packageJsonPath, updated);
  }

  /**
   * Looks in the given package.json and updates from the miix-cli to the
   * dedicated webpack plugin if we find it, then also replaces usage in
   * the webpack.config.js if it exists. For backwards compat with older
   * consumers upon initial release.
   */
  private async updateWebpackPlugin(pkg: any) {
    const oldPackage = '@mixer/cdk-cli';
    const newPackage = '@mixer/cdk-webpack-plugin';
    if (!pkg.devDependencies || newPackage in pkg.devDependencies) {
      return;
    }

    delete pkg.devDependencies[oldPackage];
    pkg.devDependencies[newPackage] = '^0.1.0';

    const webpackConfig = path.join(this.targetPath(), 'webpack.config.js');
    if (!(await exists(webpackConfig))) {
      return;
    }

    const source = await readFile(webpackConfig);
    await writeFile(webpackConfig, source.replace(oldPackage, newPackage));
  }

  /**
   * Extracts the tarball in the response to the target directory.
   */
  private async extractProject(res: Response) {
    this.emitPrompt('mkdir', this.targetPath());
    if (!(await exists(this.targetPath()))) {
      await mkdir(this.targetPath());
    }

    this.emitPrompt('extract tarball');
    await new Promise((resolve, reject) => {
      res.body
        .pipe(extract({ cwd: this.targetPath() }))
        .on('error', reject)
        .on('end', resolve);
    });
  }

  /**
   * Retrieves a stream of the tarball to download.
   */
  private async getTarball(): Promise<Response> {
    const url = this.getTemplateUrl();
    this.emitPrompt('fetch', url);
    const res = await nodeFetch(url);
    if (res.status !== 200) {
      throw new UnexpectedHttpError(res, await res.text());
    }

    return res;
  }

  /**
   * Emits a prompt-style
   */
  private emitPrompt(...contents: string[]) {
    this.data.next(`> ${contents.join(' ')}\n`);
  }

  /**
   * Returns the URL of the template tarball to download.
   */
  private getTemplateUrl(): string {
    let { template } = this.options;
    if (templateAliases.hasOwnProperty(template)) {
      template = templateAliases[template];
    }
    if (!/https?:/.test(template)) {
      template = `https://mixercc.azureedge.net/launchpad/${template}`;
    }

    return template;
  }

  /**
   * Gets the path to install into.
   */
  private targetPath(): string {
    return path.join(this.options.dir, this.options.projectName);
  }
}
