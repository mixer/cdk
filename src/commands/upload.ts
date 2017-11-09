import * as ora from 'ora';

import { Bundler } from '../publish/bundler';
import { Uploader } from '../publish/uploader';
import { Fetcher } from '../util';
import writer from '../writer';
import { failSpiner, IGlobalOptions } from './options';

export interface IUploadOptions extends IGlobalOptions {
  tarball: string;
}

export default async function(options: IUploadOptions): Promise<void> {
  const fetcher = new Fetcher().with(await options.project.profile.tokens());
  const bundler = new Bundler(options.project);

  if (!await bundler.checkEvil(writer)) {
    return;
  }

  const spinner = ora('Starting...').start();
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

  const config = await options.project.packageConfig();
  spinner.succeed(`${config.name}@${config.version} uploaded successfully!`);
}
