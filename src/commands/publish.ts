import * as ora from 'ora';

import { Bundler } from '../publish/bundler';
import { Publisher } from '../publish/publisher';
import { Uploader } from '../publish/uploader';
import { Fetcher } from '../util';
import writer from '../writer';
import { failSpiner, IGlobalOptions } from './options';

export interface IPublishOptions extends IGlobalOptions {
  force: boolean;
  tarball: string;
  skipBundle: boolean;
}

export default async function(options: IPublishOptions): Promise<void> {
  const confirmation =
    `You about to publish your interactive ` +
    `controls. This will make them accessible to everyone on Mixer.`;
  if (!options.force && !await writer.confirm(confirmation)) {
    writer.write('Aborted.');
    return;
  }

  const spinner = ora('Starting...').start();
  const bundler = new Bundler(options.project);
  const fetcher = new Fetcher().with(await options.project.profile.tokens());

  if (!await bundler.checkEvil(writer)) {
    return;
  }

  if (!options.skipBundle) {
    let filename = options.tarball;
    if (!filename) {
      const output = await bundler
        .bundle(progress => {
          spinner.text = progress;
        })
        .catch(failSpiner(spinner));
      filename = output.filename;
    }

    spinner.text = 'Uploading to Mixer...';
    await new Uploader(fetcher, options.project).upload(filename).catch(failSpiner(spinner));
  }

  spinner.text = 'Publishing...';
  await new Publisher(fetcher).publish(options.project).catch(failSpiner(spinner));

  const config = await options.project.packageConfig();
  spinner.succeed(`Published ${config.name}@${config.version}`);
}
