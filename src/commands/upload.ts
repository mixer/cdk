import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import * as ora from 'ora';

import { Profile } from '../profile';
import { Bundler } from '../publish/bundler';
import { Uploader } from '../publish/uploader';
import { Fetcher } from '../util';
import writer from '../writer';
import { failSpiner } from './options';

export default async function(options: { tarball: string }): Promise<void> {
  const fetcher = new Fetcher().with(await new Profile().tokens());
  const bundler = new Bundler();

  if (!await bundler.checkEvil(writer)) {
    return;
  }

  const spinner = ora('Starting...').start();
  let config: IPackageConfig | undefined;
  let filename = options.tarball;
  if (!filename) {
    const output = await new Bundler()
      .bundle(progress => {
        spinner.text = progress;
      })
      .catch(failSpiner(spinner));

    config = output.config;
    filename = output.filename;
  }

  spinner.text = 'Uploading to Mixer...';
  config = await new Uploader(fetcher).upload(filename, config).catch(failSpiner(spinner));

  spinner.succeed(`${config.name}@${config.version} uploaded successfully!`);
}
