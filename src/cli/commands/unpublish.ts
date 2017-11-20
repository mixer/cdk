import * as ora from 'ora';

import { Publisher } from '../../server/publish/publisher';
import { Fetcher } from '../../server/util';
import { failSpiner, IGlobalOptions } from '../options';
import writer from '../writer';

export interface IUnpublishOptions extends IGlobalOptions {
  package: string;
  force: boolean;
}

export default async function(options: IUnpublishOptions): Promise<void> {
  const [name, version] = options.package.split('@');
  if (!version) {
    throw new Error(`--package must be given in the form "name@version"`);
  }

  const confirmation =
    `You about to unpublish version ${version} of your interactive` +
    `controls. This WILL BREAK the experience of anyone who is using this version.`;
  if (!options.force && !await writer.confirm(confirmation, false)) {
    writer.write('Aborted.');
    return;
  }

  const spinner = ora('Unpublishing from Mixer...').start();
  const fetcher = new Fetcher().with(await options.project.profile.tokens());
  await new Publisher(fetcher).unpublish(name, version).catch(failSpiner(spinner));
  spinner.succeed(`Successfully unpublished ${name}@${version}`);
}
