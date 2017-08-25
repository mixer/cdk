import * as ora from 'ora';
import { Profile } from '../profile';
import { Fetcher } from '../util';

import { IPackageConfig } from '../metadata/package';
import { Bundler } from '../publish/bundler';
import { Uploader } from '../publish/uploader';

export default async function(options: { tarball: string }): Promise<void> {
  const fetcher = new Fetcher().with(await new Profile().tokens());
  const spinner = ora('Starting...').start();

  let config: IPackageConfig | undefined;
  let filename = options.tarball;
  if (!filename) {
    const output = await new Bundler().bundle(progress => {
      spinner.text = progress;
    });
    config = output.config;
    filename = output.filename;
  }

  spinner.text = 'Uploading to Mixer...';
  config = await new Uploader(fetcher).upload(filename, config);

  spinner.succeed(`${config.name}@${config.version} uploaded successfully!`);
}
