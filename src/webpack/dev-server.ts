import * as express from 'express';

import { Profile } from '../profile';

/**
 * This file contains the parent dev server run using `miix serve`. This has
 * endpoints for saving environment/profile settings as well as making calls
 * out to the Mixer API on behalf of the logged in user.
 */

export function createApp(_profile: Profile): express.Express {
  const app = express();

  app.get('/', (_req, res) => res.send('hello world!'));

  return app;
}
