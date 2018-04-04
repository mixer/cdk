import * as RSA from 'node-rsa';
import { gzip } from 'zlib';
import { promiseCallback } from '../../../server/util';

const key = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAwSlQJBp1OBG2HgeXGO9J
oB8ZxS5qe4LZWJVFJGBHDjMwFEAljbdQlrD6JGA8GjktdO3LEZuMrD5lDYwCe898
HdO/VVuaJPU97lWixAu3SoqIvEzCYzcxpr5IkFtwwp8m9nxClLvGXyi9kzB/rLAv
GYRQJBZb09RG4V0oXWoVg2I8QuASKB9V1O2GljXP2LGzGmLw7bt4ucZ3ekElZU/Y
nbCv6b045ABOJtuKINFl7eAhgc4Fr2ZLtxtIwociWOZEK5FpCQgy7iir1KixHDZ6
vNQaIAOYoCeZhR53gqX3CWXQtDxJDVMi6YvPq/RvhRLf3NS9Tg5EhNY+9o7kKWZZ
sW93tGNK12gBcTDk/eheJEuykKnExmwC9kwF/+A0BvP4idTDIOkPV7C6wOrmiKKc
HXioul2xSFrBJeuFBUW3TqRQQAH1ZwwATWkBVCffkKcw0x0HbghG0ZP2o9rjIXEv
iyghqPqPslxrHXwmkofG8HjgkCY+qI0aCzKie/vlKg6rfFj+uD3oE9LAqT7C5JlZ
CzOVVHbPs1l7C1hGesscGZxEylDVbGpEfLowNcx5XwsUbdhNS9D4Ix2voYOuNX8i
D707WrndZrXJLAvutVliYUk2llVp6sTWl04NmSthSvIWWBF+/zg4CNkOLuiBIRJ4
Bl8+73LyHtbqnNTXoD3P9hcCAwEAAQ==
-----END PUBLIC KEY-----`;

/**
 * Encrypter can public key encrypt textual data.
 */
export class Encrypter {
  private key: RSA;

  constructor(publicKey: string = key) {
    this.key = new RSA(publicKey);
  }

  /**
   * Encrypts the data with the held public key.
   */
  public async encrypt(data: string): Promise<string> {
    const compressed = await promiseCallback(callback => gzip(data, { level: 9 }, callback));
    return this.key.encrypt(compressed, 'base64');
  }
}
