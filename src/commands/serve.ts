import { fork } from 'child_process';
import { createServer } from 'http';
import { join } from 'path';

import { getPackageExecutable } from '../npm';
import { Profile } from '../profile';
import { never } from '../util';
import { createApp } from '../webpack/dev-server';
import { devEnvironmentVar } from '../webpack/plugin';
import { IDevEnvironment } from '../webpack/typings';
import { IGlobalOptions } from './options';

const portfinder = require('portfinder');
portfinder.basePort = 13370;

function defaultArgs(original: string[], defaults: { [key: string]: string | boolean }): string[] {
  Object.keys(defaults).forEach(key => {
    if (original.some(arg => arg.startsWith(`--${key}`))) {
      return;
    }

    original = original.concat(`--${key}=${defaults[key]}`);
  });

  return original;
}

export default async function(options: IGlobalOptions): Promise<void> {
  const argDelimiter = process.argv.indexOf('--');
  const profile = new Profile(options.profile);
  const port = await portfinder.getPortPromise();
  const server = createServer(createApp(profile)).listen(port);
  let args = argDelimiter > -1 ? process.argv.slice(argDelimiter + 1) : [];

  args = defaultArgs(args, {
    'content-base': 'src/',
    open: true,
  });

  server.on('listening', () => {
    const wds = getPackageExecutable(join(options.project, 'node_modules', 'webpack-dev-server'));

    const child = fork(wds, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        [devEnvironmentVar]: JSON.stringify(<IDevEnvironment>{
          mixerAddress: options.api,
          devServerAddress: `127.0.0.1:${server.address().port}`,
        }),
      },
    });

    child.on('close', code => {
      process.exit(code);
    });
  });

  return never();
}
