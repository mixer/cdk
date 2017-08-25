import * as ora from 'ora';
import * as readline from 'readline';

import { Profile } from '../profile';
import { Publisher } from '../publish/publisher';
import { Fetcher } from '../util';
import writer from '../writer';

export default async function(options: { package: string }): Promise<void> {
  const [name, version] = options.package.split('@');
  if (!version) {
    throw new Error(`--package must be given in the form "name@version"`);
  }

  const rl = readline.createInterface(process.stdin, process.stdout);
  writer.writeWrapped(
    `You about to unpublish version ${version} of your interactive ` +
      `controls. This WILL BREAK the anyone who is using this version.`,
  );

  const answer = await new Promise<string>(resolve => {
    rl.question('\nContinue? y/[n]: ', resolve);
  });
  if (answer[0] !== 'y') {
    writer.write('Aborted.');
    return;
  }

  const spinner = ora('Unpublishing from Mixer...').start();
  const fetcher = new Fetcher().with(await new Profile().tokens());
  await new Publisher(fetcher).unpublish(name, version);
  spinner.succeed(`Successfully unpublished ${name}@${version}`);
}
