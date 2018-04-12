import chalk from 'chalk';
import * as ora from 'ora';

import { WebpackBundleTask } from '../../server/webpack-bundler-task';
import { IGlobalOptions } from '../options';
import { ensureWebpackDependencies } from '../prereqs';

export default async function(options: IGlobalOptions): Promise<void> {
  await ensureWebpackDependencies(options.project);
  const spinner = ora('Starting...').start();
  const bundler = new WebpackBundleTask(options.project);
  bundler.data.subscribe(data => process.stdout.write(data));

  const output = await bundler.start();
  spinner.succeed(`Bundle created in ${chalk.green(output.tarball)}`);
}
