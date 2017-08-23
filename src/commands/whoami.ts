import { Profile } from '../profile';
import writer from '../writer';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions) {
  const profile = new Profile(options.profile);
  if (!await profile.hasAuthenticated()) {
    writer.write('You are not logged in! Run `miix login` to authenticated');
    return;
  }

  const data = await profile.user();
  writer.write(
    `You are logged in as ${data.username} (userID=${data.id}, channelID=${data.channel})`,
  );
}
