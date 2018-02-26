import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import nodeFetch from 'node-fetch';
import * as ora from 'ora';
import * as path from 'path';
import * as tar from 'tar';

import { UnexpectedHttpError } from '../../server/errors';
import { awaitChildProcess, readFile, writeFile } from '../../server/util';
import writer from '../writer';

const launchpadUrl = 'https://mixercc.azureedge.net/launchpad/interactive-launchpad_1.0.tar.gz';

export interface IQuickStartOptions {
  dir: string;
  projectName: string;
  npm: string;
}

/**
 * installRepo clones and installs the Interactive launchpad.
 */
async function installRepo(dir: string, npmPath: string): Promise<void> {
  const res = await nodeFetch(launchpadUrl);
  if (res.status !== 200) {
    throw new UnexpectedHttpError(res, await res.text());
  }

  await new Promise((resolve, reject) => {
    res.body
      .pipe(tar.extract({ cwd: dir }))
      .on('error', reject)
      .on('end', resolve);
  });

  await awaitChildProcess(spawn(npmPath, ['install'], { cwd: dir }));
}

/**
 * getDetails prompts the user for and loads overrides for the package.json file.
 */
async function getDetails(bundleName: string) {
  const name = await writer.ask('Bundle name:', bundleName, n => {
    if (!/^[a-z0-9\-]{2,60}$/i.test(n)) {
      return 'The bundle name must be alphanumeric with dashes';
    }

    return undefined;
  });

  const description = await writer.ask('Bundle description:');
  const keywords = await writer.ask('Keywords (separated by commas):');
  const license = await writer.ask('License:', 'MIT');

  return {
    name,
    description: description ? description : undefined,
    version: '0.1.0',
    author: undefined,
    keywords: keywords ? keywords.split(',').map(kw => kw.toLowerCase().trim()) : [],
    license,
  };
}

async function applyDetails(dir: string, details: any): Promise<void> {
  const packageJsonPath = path.join(dir, 'package.json');
  const source = await readFile(packageJsonPath);
  const updated = JSON.stringify({ ...JSON.parse(source), ...details }, null, 2);
  await writeFile(packageJsonPath, updated);
}

export default async function(options: IQuickStartOptions): Promise<void> {
  const dir = options.dir
    ? path.resolve(options.dir)
    : path.join(process.cwd(), options.projectName);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  let installed = false;
  let spinner: any;

  const [details] = await Promise.all([
    getDetails(options.projectName).then(d => {
      if (!installed) {
        spinner = ora('Installing dependencies...').start();
      }

      return d;
    }),
    installRepo(dir, options.npm).then(() => {
      installed = true;
    }),
  ]);

  await applyDetails(dir, details);

  const message = `Project created in ${chalk.green(path.relative(process.cwd(), dir))}`;
  if (spinner) {
    spinner.succeed(message);
  } else {
    writer.write(message);
  }
}
