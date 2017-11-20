import * as fs from 'fs';
import * as path from 'path';

import { readDir } from './util';

/**
 * Finds the nearest package.json relative to the given directory, returning
 * undefined if it's not found.
 */
export function findPackageJson(dir: string): string | undefined {
  const parts = path.resolve(dir).split(path.sep);
  while (parts.length > 0) {
    const packagePath = [...parts, 'package.json'].join(path.sep);
    if (fs.existsSync(packagePath)) {
      return packagePath;
    }

    parts.pop();
  }

  return undefined;
}

/**
 * Loads data from the project's package.json, throwing an error if it can't
 * be loaded.
 */
export function mustLoadPackageJson(dir: string): any {
  const jsonPath = findPackageJson(dir);
  if (jsonPath) {
    return require(jsonPath); // tslint:disable-line
  }

  throw new Error(
    'Could not find a package.json in your current folder, ' +
      'make sure to `cd` into your project directory!',
  );
}

/**
 * Returns the base path of a project nested in the given directory (the
 * folder containing the package.json).
 */
export function getProjectPath(dir: string): string | undefined {
  const json = findPackageJson(dir);
  return json ? path.dirname(json) : undefined;
}

/**
 * Finds where the given dependency is installed.
 */
export function getDependencyPath(name: string): string {
  // require.resolve resolves to the main js script of the package, back out
  // to get its directory.
  const target = require.resolve(name).split(path.sep);
  while (target[target.length - 1] !== name) {
    target.pop();
  }

  return target.join(path.sep);
}

/**
 * Gets the path to the binary script defeined by the module in the given dir.
 */
export function getPackageExecutable(
  base: string,
  commandName: string = path.basename(base),
): string {
  const parsed = mustLoadPackageJson(base);
  return path.join(base, parsed.bin[commandName]);
}

/**
 * Finds the readme for the project in the given directory. Uses a similar
 * process to npm.
 */
export async function findReadme(dir: string): Promise<string | undefined> {
  const fname = (await readDir(dir)).find(f => /^readme\.?/i.test(f));
  if (fname) {
    return fname;
  }

  try {
    const packageJson = mustLoadPackageJson(dir);
    return packageJson && path.normalize(packageJson.readmeFile);
  } catch (e) {
    return undefined;
  }
}
