import * as chalk from 'chalk';
import { unlinkSync } from 'fs';

import { Profile } from '../profile';
import writer from '../writer';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions): Promise<void> {
  try {
    unlinkSync(options.profile);
  } catch (e) {
    /* ignored */
  }
  await new Profile(options.profile).tokens();
  writer.write(chalk.green('Logged in successfully!'));
}
