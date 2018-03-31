import chalk from 'chalk';

import { WriterReporter } from '../../server/metadata/evilsniffer';
import { Publisher } from '../../server/publish/publisher';
import { WebpackBundleTask } from '../../server/webpack-bundler-task';
import { IGlobalOptions } from '../options';
import { ensureWebpackDependencies } from '../prereqs';
import writer from '../writer';

export interface IPublishOptions extends IGlobalOptions {
  force: boolean;
  tarball: string;
}

export default async function(options: IPublishOptions): Promise<void> {
  const confirmation =
    `You about to publish your interactive ` +
    `controls. This will make them accessible to everyone on Mixer.`;
  if (!options.force && !await writer.confirm(confirmation)) {
    writer.write('Aborted.');
    return;
  }

  await ensureWebpackDependencies(options.project);

  if (!await new WriterReporter(options.project).checkEvil(writer)) {
    return;
  }

  const bundler = new WebpackBundleTask(options.project);
  bundler.data.subscribe(data => process.stdout.write(data));
  const { metadata, readme } = await bundler.start();
  await new Publisher(await options.project.profile.getRequester()).publish(metadata, readme);
  writer.write(chalk.green(`Published ${metadata.name}@${metadata.version}`));
}
