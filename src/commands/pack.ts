import * as chalk from 'chalk';
import * as ora from 'ora';

import { Bundler } from '../publish/bundler';

export default async function(): Promise<void> {
  const spinner = ora('Starting...').start();
  const file = await new Bundler().bundle(progress => {
    spinner.text = progress;
  });

  spinner.succeed(`Bundle created in ${chalk.green(file)}`);
}
