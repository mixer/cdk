import * as path from 'path';

import { exists } from '../util';

/**
 * MixerPluginError is thrown when there's an error in the MixerPlugin.
 */
export class MixerPluginError extends Error {}

export async function findPackageJson(dir: string): Promise<any> {
  const parts = path.normalize(dir).split(path.sep);
  while (parts.length > 0) {
    const packagePath = path.join(...parts, 'package.json');
    const ok = await exists(packagePath);
    if (ok) {
      return require(packagePath); // tslint:disable-line
    }

    parts.pop();
  }

  throw new MixerPluginError(
    'Could not find package.json in your current folder, make sure to `cd`' +
      'into your project directory!',
  );
}
