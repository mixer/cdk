import { UnexpectedHttpError } from '../errors';
import { IRequester } from '../util';

/**
 * The publisher handle changing visility (public/private) of interactive controls.
 */
export class Publisher {
  constructor(private readonly requester: IRequester) {}

  /**
   * Unpublishes an interactive control version.
   */
  public async unpublish(name: string, version: string): Promise<void> {
    const path = `/interactive/bundles/${name}/versions/${version}`;
    return this.requester.run(path, { method: 'DELETE' }).then(async res => {
      if (res.status < 300) {
        return;
      }

      throw new UnexpectedHttpError(res, await res.text());
    });
  }
}
