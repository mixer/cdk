import chalk from 'chalk';

import { ChildProcess, spawn } from 'child_process';
import { isPackagedInstalled } from '../server/npm';
import { IPackageJson, Project } from '../server/project';
import { awaitChildProcess } from '../server/util';
import writer from './writer';

async function ensurePackagesInstalled(project: Project, ...reqs: string[]): Promise<void> {
  if (await isPackagedInstalled(project.baseDir(), ...reqs)) {
    return;
  }

  let config: IPackageJson;
  try {
    config = await project.packageJson();
  } catch (e) {
    writer.write("We couldn't read the package.json in your project directory:");
    throw e;
  }

  const doInstall = await writer.confirm(
    'To do this, we first need to install some dependencies. This may take a minute or two.',
  );

  if (!doInstall) {
    writer.write(chalk.red('Installation aborted'));
    process.exit(0);
  }

  const areAllRequired = !reqs.some(r => {
    const isRequired =
      (config.dependencies && config.dependencies[r]) ||
      (config.devDependencies && config.devDependencies[r]);
    return !isRequired;
  });

  writer.write('Installing packages:', reqs);

  let proc: ChildProcess;
  if (areAllRequired) {
    proc = spawn('npm', ['install'], { cwd: project.baseDir() });
  } else {
    proc = spawn('npm', ['install', '--save-dev'].concat(reqs), { cwd: project.baseDir() });
  }

  return awaitChildProcess(proc);
}

/**
 * Ensures that webpack and the webpack-dev-server are installed in the
 * target directory, installing them if they aren't.
 */
export async function ensureWebpackDependencies(project: Project): Promise<void> {
  return ensurePackagesInstalled(project, 'webpack', 'webpack-dev-server');
}
