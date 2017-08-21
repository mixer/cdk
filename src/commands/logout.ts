import * as chalk from 'chalk';
import { unlinkSync } from 'fs';

import writer from '../writer';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions): Promise<void> {
  try {
    unlinkSync(options.profile);
  } catch (e) {
    /* ignored */
  }

  writer.write(chalk.green('Logged out successfully.'));
}
