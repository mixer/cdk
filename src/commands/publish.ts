import * as ora from 'ora';

import { createPackage } from '../metadata/metadata';
import { Profile } from '../profile';
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
  const fetcher = new Fetcher().with(await new Profile().tokens());
  const config = await createPackage(options.project);

  if (!options.skipBundle) {
    let filename = options.tarball;
    if (!filename) {
      const output = await new Bundler()
        .bundle(progress => {
          spinner.text = progress;
        })
        .catch(failSpiner(spinner));
      filename = output.filename;
    }

    spinner.text = 'Uploading to Mixer...';
    await new Uploader(fetcher).upload(filename, config).catch(failSpiner(spinner));
  }

  spinner.text = 'Publishing...';
  await new Publisher(fetcher).publish(options.project, config).catch(failSpiner(spinner));
  spinner.succeed(`Published ${config.name}@${config.version}`);
}
