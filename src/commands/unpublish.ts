import * as ora from 'ora';

import { Profile } from '../profile';
import { Publisher } from '../publish/publisher';
import { Fetcher } from '../util';
import writer from '../writer';
import { failSpiner } from './options';

export default async function(options: { package: string; force: boolean }): Promise<void> {
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
  const fetcher = new Fetcher().with(await new Profile().tokens());
  await new Publisher(fetcher).unpublish(name, version).catch(failSpiner(spinner));
  spinner.succeed(`Successfully unpublished ${name}@${version}`);
}
