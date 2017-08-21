import { Profile } from '../profile';
import { Fetcher } from '../util';
import writer from '../writer';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions) {
  const tokens = await new Profile(options.profile).tokens();
  const user = await new Fetcher().with(tokens).json('get', '/users/current?fields=id,username');
  const data = await user.json();
  writer.write(`You are logged in as ${data.username} (userID=${data.id})`);
}
