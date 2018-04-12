import { NotInteractiveError, UnexpectedHttpError } from './errors';
import { Profile } from './profile';

/**
 * Joins the user as a participant to the target channel.
 */
export class ParticipantConnector {
  constructor(private readonly channelId: number, private readonly profile = new Profile()) {}

  public async join() {
    const requester = await this.profile.getRequester();
    const res = await requester.json('get', `/interactive/${this.channelId}`);

    if (res.status === 404 || res.status === 400) {
      throw new NotInteractiveError(); // remap
    }

    if (res.status !== 200) {
      throw new UnexpectedHttpError(res, await res.text());
    }

    return await res.json();
  }
}
