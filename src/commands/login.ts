import writer from '../writer';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions): Promise<void> {
  await options.project.profile.grant();
  writer.write('Logged in successfully!');
}
