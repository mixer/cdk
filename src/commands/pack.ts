import * as chalk from 'chalk';
import * as ora from 'ora';

import { Bundler } from '../publish/bundler';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions): Promise<void> {
  const spinner = ora('Starting...').start();
  const file = await new Bundler(options.project).bundle(progress => {
    spinner.text = progress;
  });

  spinner.succeed(`Bundle created in ${chalk.green(file)}`);
}
