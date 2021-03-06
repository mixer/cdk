import chalk from 'chalk';

import { WebpackBundleTask } from '../../server/webpack-bundler-task';
import { IGlobalOptions } from '../options';
import { ensureWebpackDependencies } from '../prereqs';
import writer from '../writer';

export default async function(options: IGlobalOptions): Promise<void> {
  await ensureWebpackDependencies(options.project);

  const bundler = new WebpackBundleTask(options.project);
  bundler.data.subscribe(data => process.stdout.write(data));
  const { metadata } = await bundler.start();
  writer.write(chalk.green(`${metadata.name}@${metadata.version} uploaded successfully!`));
}
