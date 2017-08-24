import { Profile } from '../profile';
import writer from '../writer';

export default async function(): Promise<void> {
  await new Profile().grant();
  writer.write('Logged in successfully!');
}
