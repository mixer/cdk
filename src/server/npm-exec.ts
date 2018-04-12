import { spawn, SpawnOptions } from 'child_process';
import { merge } from 'lodash';
import * as path from 'path';

/**
 * Returns the key for the executable PATH for the current platform.
 * From Yarn.
 */
export function getPathKey(): string {
  let pathKey = 'PATH';

  // Windows calls its path "Path" usually, but this is not guaranteed.
  if (process.platform === 'win32') {
    pathKey = 'Path';

    Object.keys(process.env).forEach(key => {
      if (key.toLowerCase() === 'path') {
        pathKey = key;
      }
    });
  }

  return pathKey;
}

/**
 * Spawns an npm-executable script for the project path. Based in spirit on
 * Yarn's implementation at {@link https://git.io/vxBfR}.
 */
export function spawnPackageScript(
  dir: string,
  command: string,
  args: string[] = [],
  options?: SpawnOptions,
) {
  const pathVar = process.env[getPathKey()];
  const parts = pathVar ? pathVar.split(path.delimiter) : [];
  parts.unshift(path.join(dir, 'node_modules', '.bin'));

  return spawn(
    command,
    args,
    merge(
      {
        env: {
          [getPathKey()]: parts.join(path.delimiter),
        },
        shell: true,
        detached: false,
      },
      options,
    ),
  );
}
