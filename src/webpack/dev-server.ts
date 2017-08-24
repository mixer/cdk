import * as chalk from 'chalk';
import * as express from 'express';
import { Fetcher } from '../util';
import writer from '../writer';

import { GrantCancelledError, Profile } from '../profile';

function route(handler: (req: express.Request, res: express.Response) => Promise<object | void>) {
  return (req: express.Request, res: express.Response) => {
    Promise.resolve(handler(req, res))
      .then(data => {
        if (res.headersSent) {
          return;
        }

        if (!data) {
          res.status(204);
          return;
        }

        res.json(data);
      })
      .catch(err => {
        const contents = err.stack || err.message || String(err);
        writer.write(chalk.red(`Error in ${req.method} ${req.path}:\n${contents}`));
        res.status(500).send(contents);
      });
  };
}

/**
 * This file contains the parent dev server run using `miix serve`. This has
 * endpoints for saving environment/profile settings as well as making calls
 * out to the Mixer API on behalf of the logged in user.
 */
export function createApp(profile: Profile): express.Express {
  const app = express();

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
  });

  app.get(
    '/connect-participant',
    route(async (req, res) => {
      if (!await profile.hasAuthenticated()) {
        res.status(401).send();
        return;
      }

      const udata = await profile.user();
      const joinRes = await new Fetcher()
        .with(await profile.tokens())
        .json('get', `/interactive/${Number(req.query.channelID) || udata.channel}`);

      if (joinRes.status === 400) {
        res.status(409).send(); // remap
        return;
      }

      if (joinRes.status !== 200) {
        throw new Error(
          `Unexpected status code ${joinRes.status} from ${joinRes.url}: ${await joinRes.text()}`,
        );
      }

      return await joinRes.json();
    }),
  );

  let grantingCode: string | undefined;
  app.get(
    '/login',
    route(async () => {
      if (await profile.hasAuthenticated()) {
        return await profile.user();
      }
      if (grantingCode) {
        return { code: grantingCode };
      }

      return new Promise(resolve => {
        profile
          .grant({
            prompt: code => {
              grantingCode = code;
              resolve(code);
            },
            isCancelled: () => grantingCode !== undefined, // don't retry forever
          })
          .catch(err => {
            if (err instanceof GrantCancelledError) {
              grantingCode = undefined;
            } else {
              throw err;
            }
          });
      }).then(code => ({ code }));
    }),
  );

  return app;
}
