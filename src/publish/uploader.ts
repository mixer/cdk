import { createHash } from 'crypto';
import * as FormData from 'form-data';
import { createReadStream } from 'fs';

import { UnexpectedHttpError } from '../errors';
import { createPackage } from '../metadata/metadata';
import { IPackageConfig } from '../metadata/package';
import { IRequester } from '../util';

/**
 * Uploader tosses a packaged bundle to the Mixer servers.
 */
export class Uploader {
  constructor(
    private readonly requester: IRequester,
    private readonly projectDir: string = process.env.MIIX_PROJECT,
  ) {}

  /**
   * Uploads the bundle output to
   */
  public async upload(filename: string, config?: IPackageConfig): Promise<IPackageConfig> {
    if (!config) {
      config = await createPackage(this.projectDir);
    }

    const checksum = await this.makeChecksum(filename);
    const form = new FormData();
    form.append('checksum', checksum);
    form.append('metadata', JSON.stringify(config));
    form.append('tarball', createReadStream(filename));
    const path = `/interactive/bundles/${config.name}/versions/${config.version}/tarball`;

    return this.requester
      .run(path, {
        method: 'PUT',
        headers: form.getHeaders(),
        body: form,
      })
      .then(async res => {
        if (res.status < 300) {
          return config!;
        }

        throw new UnexpectedHttpError(res, await res.text());
      });
  }

  private async makeChecksum(filename: string): Promise<string> {
    const hash = createHash('sha512');
    const input = createReadStream(filename);

    return new Promise<string>((resolve, reject) => {
      input.on('error', reject).on('readable', () => {
        const data = input.read();
        if (data) {
          hash.update(data);
        } else {
          resolve(hash.digest('hex').slice(0, 64));
        }
      });
    });
  }
}
