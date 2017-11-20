import { IGlobalOptions } from '../options';
import writer from '../writer';

export default async function(options: IGlobalOptions): Promise<void> {
  await options.project.profile.logout();
  writer.write('Logged out successfully.');
}
