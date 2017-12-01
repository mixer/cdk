import * as ora from 'ora';

import { WriterReporter } from '../../server/metadata/evilsniffer';
import { Bundler } from '../../server/publish/bundler';
import { Uploader } from '../../server/publish/uploader';
import { Fetcher } from '../../server/util';
import { failSpiner, IGlobalOptions } from '../options';
import { ensureWebpackDependencies } from '../prereqs';
import writer from '../writer';

export interface IUploadOptions extends IGlobalOptions {
  tarball: string;
}

export default async function(options: IUploadOptions): Promise<void> {
  await ensureWebpackDependencies(options.project);
  const fetcher = new Fetcher().with(await options.project.profile.tokens());
  const bundler = new Bundler(options.project);

  if (!await new WriterReporter(options.project).checkEvil(writer)) {
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
