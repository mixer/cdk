import { pick } from 'lodash';
import { inspect } from 'util';

import { UnexpectedHttpError } from '../errors';
import { Profile } from '../profile';
import { Fetcher } from '../util';
import writer from '../writer';

export interface IInfoOptions {
  bundle: string;
  verbose: boolean;
  json: boolean;
}

export default async function(options: IInfoOptions): Promise<void> {
  const profile = new Profile();

  let fetcher = new Fetcher();
  let loggedIn = false;
  if (await profile.hasAuthenticated()) {
    loggedIn = true;
    fetcher = fetcher.with(await profile.tokens());
  }

  const res = await fetcher.json('get', `/interactive/bundles/${options.bundle}`);
  if (res.status === 404) {
    if (loggedIn) {
      writer.write('Bundle not found.');
    } else {
      writer.write(
        'Bundle not found. If this is your package, you should log in with `miix login` to see it.',
      );
    }

    process.exit(1);
    return;
  }

  if (res.status !== 200) {
    throw new UnexpectedHttpError(res, await res.text());
  }

  const data = await res.json();
  if (!options.verbose) {
    delete data.readme;
    delete data.hasPublicVersion;
    data.versions = data.versions.map((v: any) => pick(v, ['version', 'publishedAt']));
  }

  if (options.json) {
    writer.write(JSON.stringify(data, null, 2));
    return;
  }

  writer.write(inspect(data, false, null, true));
}
