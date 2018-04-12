import { userInfo } from 'os';
import * as path from 'path';

import { Quickstarter } from '../../server/quickstart';
import writer from '../writer';

export interface IQuickStartOptions {
  dir: string;
  kind: string;
  projectName: string;
  npm: string;
}

/**
 * getDetails prompts the user for and loads overrides for the package.json file.
 */
async function getDetails(bundleName: string) {
  const name = await writer.ask('Bundle name:', bundleName, n => {
    if (!/^[a-z0-9\-]{2,60}$/i.test(n)) {
      return 'The bundle name must be alphanumeric with dashes';
    }

    return undefined;
  });

  const description = await writer.ask('Bundle description:');
  const keywords = await writer.ask('Keywords (separated by commas):');
  const license = await writer.ask('License:', 'MIT');

  return {
    projectName: name,
    description: description ? description : undefined,
    author: userInfo().username,
    keywords,
    license,
  };
}

export default async function(options: IQuickStartOptions): Promise<void> {
  const dir = options.dir ? path.resolve(options.dir) : process.cwd();

  const details = await getDetails(options.projectName);
  const quickstarter = new Quickstarter({
    ...details,
    template: options.kind,
    dir,
  });

  quickstarter.data.subscribe(data => process.stdout.write(data));
  await quickstarter.start();
}
