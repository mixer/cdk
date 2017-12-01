import { fork } from 'child_process';
import { createServer } from 'http';

import { getPackageExecutable } from '../../server/npm';
import { createApp } from '../../server/server';
import { never } from '../../server/util';
import { IDevEnvironment } from '../../ui/typings';
import { devEnvironmentVar } from '../../webpack-plugin';
import { IGlobalOptions } from '../options';
import { ensureWebpackDependencies } from '../prereqs';

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
  await ensureWebpackDependencies(options.project);

  const argDelimiter = process.argv.indexOf('--');
  const port = await portfinder.getPortPromise();
  const server = createServer(createApp(options.project)).listen(port);
  let args = argDelimiter > -1 ? process.argv.slice(argDelimiter + 1) : [];

  args = defaultArgs(args, {
    'content-base': 'src/',
    open: true,
  });

  server.on('listening', () => {
    const wds = getPackageExecutable(options.project.baseDir('node_modules', 'webpack-dev-server'));

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
