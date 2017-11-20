import { IGlobalOptions } from '../options';
import writer from '../writer';

export default async function({ project }: IGlobalOptions) {
  if (!await project.profile.hasAuthenticated()) {
    writer.write('You are not logged in! Run `miix login` to authenticated');
    return;
  }

  const data = await project.profile.user();
  writer.write(
    `You are logged in as ${data.username} (userID=${data.id}, channelID=${data.channel})`,
  );
}
