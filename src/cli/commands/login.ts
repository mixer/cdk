import chalk from 'chalk';

import { api } from '../../server/util';
import { IGlobalOptions } from '../options';
import writer from '../writer';

export default async function(options: IGlobalOptions): Promise<void> {
  await options.project.profile.grant({
    prompt: code => {
      writer.write(
        `Go to ${chalk.blue(`${api()}/go`)} and enter the code ` + `${chalk.blue(code)} to log in!`,
      );
    },
    isCancelled: () => false,
  });

  writer.write('Logged in successfully!');
}
