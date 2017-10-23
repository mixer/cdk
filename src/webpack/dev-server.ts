import * as chalk from 'chalk';
import * as express from 'express';

import { DeclarationError } from '../metadata/error';
import { EvilSniffer } from '../metadata/evilsniffer';
import { GrantCancelledError, Profile } from '../profile';
import { Bundler } from '../publish/bundler';
import { Uploader } from '../publish/uploader';
import { Fetcher } from '../util';
import writer from '../writer';

type RouteHandler = (req: express.Request, res: express.Response) => Promise<object | void>;

function route(handler: RouteHandler) {
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

  app.use(require('body-parser').json());

  function requireAuth(fn: RouteHandler): RouteHandler {
    return async (req, res) => {
      if (await profile.hasAuthenticated()) {
        return fn(req, res);
      }

      res.status(401).send();
    };
  }

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.get(
    '/connect-participant',
    route(
      requireAuth(async (req, res) => {
        const udata = await profile.user();
        const joinRes = await new Fetcher()
          .with(await profile.tokens())
          .json('get', `/interactive/${Number(req.query.channelID) || udata.channel}`);

        if (joinRes.status === 404 || joinRes.status === 400) {
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
    ),
  );

  let grantingCode: string | undefined;
  app.get(
    '/login',
    route(async () => {
      if (await profile.hasAuthenticated()) {
        grantingCode = undefined;
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

  app.get(
    '/interactive-versions',
    route(
      requireAuth(async (_req, res) => {
        const user = await profile.user();
        const fetcher = new Fetcher().with(await profile.tokens());

        let output: object[] = [];
        for (let page = 0; true; page++) {
          // tslint:disable-line
          const next = await fetcher.json(
            'get',
            `/interactive/games/owned?user=${user.id}&page=${page}`,
          );
          const contents = await next.json();
          if (!contents.length) {
            break;
          }

          output = output.concat(contents);
        }

        res.json(output);
      }),
    ),
  );

  app.get(
    '/ensure-no-eval',
    route(async () => {
      try {
        await new EvilSniffer().compile(process.env.MIIX_PROJECT);
      } catch (e) {
        return { hasEval: e instanceof DeclarationError };
      }

      return { hasEval: false };
    }),
  );

  app.post(
    '/update-interactive-version/:versionId',
    route(
      requireAuth(async (req, res) => {
        const updateRes = await new Fetcher()
          .with(await profile.tokens())
          .json('put', `/interactive/versions/${req.params.versionId}`, req.body);

        res.status(updateRes.status).json(await updateRes.json());
      }),
    ),
  );

  app.post(
    '/start-version-upload/:versionId',
    route(
      requireAuth(async (req, res) => {
        const fetcher = new Fetcher().with(await profile.tokens());

        // The writer will write progress to the console for diagnostic purposes.
        writer.write('Starting version upload');
        try {
          const output = await new Bundler().bundle(progress => {
            writer.write(progress);
          });
          writer.write('Uploading tarball');
          const config = await new Uploader(fetcher).upload(output.filename, output.config);
          writer.write('Updating linked version');
          await fetcher.json('put', `/interactive/versions/${req.params.versionId}`, {
            bundle: `${config.name}_${config.version}`,
          });
          writer.write('Complete');
        } catch (e) {
          res.status(400).send(e.stack);
        }

        res.status(204).send();
        return;
      }),
    ),
  );

  return app;
}
