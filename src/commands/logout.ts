import writer from '../writer';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions): Promise<void> {
  await options.project.profile.logout();
  writer.write('Logged out successfully.');
}
