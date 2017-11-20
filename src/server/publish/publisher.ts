import * as marked from 'marked';
import * as path from 'path';

import { PackageIntegrityError, PublishHttpError, PublishPrivateError } from '../errors';
import { findReadme } from '../npm';
import { Project } from '../project';
import { IRequester, readFile } from '../util';

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
  public async publish(project: Project): Promise<void> {
    const config = await project.packageConfig();
    if (config.private) {
      throw new PublishPrivateError();
    }

    const readme = await this.renderReadme(project.baseDir());
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

  private async renderReadme(dir: string): Promise<string> {
    const fname = await findReadme(dir);
    if (!fname) {
      throw new PackageIntegrityError(
        `A readme.md is missing in your project (${path.join(dir, 'readme.md')} should exist)`,
      );
    }

    return marked(await readFile(path.join(dir, fname)));
  }

  private getPath(name: string, version: string): string {
    return `/interactive/bundles/${name}/versions/${version}`;
  }
}
