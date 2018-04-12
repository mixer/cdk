import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { PublishHttpError, PublishPrivateError } from '../errors';
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
    return this.requester.run(this.getPath(name, version), { method: 'DELETE' }).then(async res => {
      if (res.status < 300) {
        return;
      }

      throw new PublishHttpError(res, await res.text());
    });
  }

  /**
   * Publishes a package, making it accessible to everyone.
   */
  public async publish(config: IPackageConfig, readme: string | null): Promise<void> {
    if (config.private) {
      throw new PublishPrivateError();
    }

    return this.requester
      .json('post', `${this.getPath(config.name, config.version)}/publish`, {
        readme,
        homepage: config.homepage || null,
        description: config.description || null,
        tags: config.keywords || [],
      })
      .then(async res => {
        if (res.status < 300) {
          return;
        }

        throw new PublishHttpError(res, await res.text());
      });
  }

  private getPath(name: string, version: string): string {
    return `/interactive/bundles/${name}/versions/${version}`;
  }
}
