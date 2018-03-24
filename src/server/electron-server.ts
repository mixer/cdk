import { Action } from '@ngrx/store';
import { BrowserWindow, Event, ipcMain } from 'electron';
import * as path from 'path';

import * as forAccount from '../app/editor/account/account.actions';
import { CommonMethods } from '../app/editor/bedrock.actions';
import * as forControls from '../app/editor/controls/controls.actions';
import * as forLayout from '../app/editor/layout/layout.actions';
import * as forNewProject from '../app/editor/new-project/new-project.actions';
import * as forProject from '../app/editor/project/project.actions';

import { spawn } from 'child_process';
import { IRemoteError } from '../app/editor/electron.service';
import { FileDataStore } from './datastore';
import { hasMetadata, NoAuthenticationError } from './errors';
import { OpenBuilder } from './file-selector';
import { GrantCancelledError, Profile } from './profile';
import { Project } from './project';
import { Quickstarter } from './quickstart';
import { Fetcher } from './util';
import { WebpackDevServer } from './wds';

const commandExists: (
  path: string,
  callback: (err: Error | null, exists: boolean) => void,
) => void = require('command-exists');

/**
 * bind attaches listeners for Electron's IPC.
 */
// tslint:disable-next-line
export function bind(window: BrowserWindow) {
  function action(a: Action) {
    window.webContents.send('dispatch', a);
  }

  function method(name: string, fn: (data: any) => Promise<any>) {
    ipcMain.addListener(name, (ev: Event, { id, params }: { id: number; params: any }) => {
      fn(params)
        .then(result => ev.sender.send(name, { id, result }))
        .catch((error: Error) =>
          ev.sender.send(name, {
            id,
            error: <IRemoteError>{
              message: error.message,
              stack: error.stack,
              originalName: error.constructor.name,
              metadata: hasMetadata(error) ? error.metadata() : undefined,
            },
          }),
        );
    });
  }

  /**
   * Starts an account linking. Returns the user once linked, or null if
   * they do not link by the time the current code expires. Updates the
   * linked code when it's received.
   */
  method(forAccount.AccountMethods.LinkAccount, async () => {
    const profile = new Profile();

    let grantCount = 0;
    try {
      await profile.grant({
        prompt: (code, expiresAt) => action(new forAccount.SetLinkCode(code, expiresAt)),
        isCancelled: () => Boolean(grantCount++), // false initially, then true afterwards
      });
      return await profile.user();
    } catch (err) {
      if (!(err instanceof GrantCancelledError)) {
        throw err;
      }

      return null;
    }
  });

  /**
   * Returns the currently linked account, if any.
   */
  method(forAccount.AccountMethods.GetLinkedAccount, async () => {
    try {
      return await new Profile().user();
    } catch (e) {
      if (e instanceof NoAuthenticationError) {
        return null;
      }

      throw e;
    }
  });

  /**
   * Logs the user out of their account.
   */
  method(forAccount.AccountMethods.Logout, async () => new Profile().logout());

  /**
   * Called when we want to create a new project, triggers the quickstart.
   * Emits AppendCreateUpdate actions back down when data is displayed on
   * the console.
   */
  method(forNewProject.NewProjectMethods.StartCreate, async details => {
    const quickstart = new Quickstarter(details);
    quickstart.on('data', data => action(new forNewProject.AppendCreateUpdate(data)));
    await quickstart.start();
  });

  /**
   * Opens a prompt to choose a directory, and returns the chosen one.
   */
  method(CommonMethods.ChooseDirectory, async (options: { context: string }) => {
    return new OpenBuilder(window).directory().openInContext(options.context);
  });

  /**
   * Checks if a bundle name is taken; returns true if so.
   */
  method(CommonMethods.CheckBundleNameTaken, async ({ name }: { name: string }) => {
    const res = await new Fetcher().json('get', `/interactive/bundles/${name}`);
    return res.status === 200 || res.status === 403;
  });

  /**
   * Opens a prompt to choose a directory, and returns the chosen one.
   */
  method(CommonMethods.LaunchProgram, async (options: { name: string; args: string[] }) => {
    spawn(options.name, options.args, {
      detached: true,
      stdio: 'ignore',
    });
  });

  /**
   * Opens a prompt to choose a directory, and returns the chosen one.
   */
  method(CommonMethods.CheckIfExePresent, async (options: { exes: string[] }) => {
    const results: { [bin: string]: boolean } = {};
    await Promise.all(
      options.exes.map(
        async exe =>
          new Promise(resolve =>
            commandExists(exe, (_err, ok) => {
              results[exe] = ok;
              resolve();
            }),
          ),
      ),
    );

    return results;
  });

  /**
   * Saves the current panel layouts.
   */
  method(
    forLayout.LayoutMethod.SavePanels,
    async (options: { panels: object[]; project: string }) => {
      await new FileDataStore().saveProject('layout', options.project, options.panels);
    },
  );

  /**
   * Loads the panel layouts for the selected project.
   */
  method(forLayout.LayoutMethod.LoadPanels, async (options: { project: string }) => {
    return new FileDataStore().loadProject('layout', options.project);
  });

  /**
   * Loads metadata from the project in the given directory.
   */
  method(forProject.ProjectMethods.OpenDirectory, async (options: { directory: string }) => {
    const store = new FileDataStore();
    const project = new Project(options.directory);

    await project.packageJson(); // validate the package is there, throws if not

    return <forProject.IProject>{
      directory: options.directory,
      interactiveVersion: await store.loadProject('linkedVersion', options.directory, null),
      confirmSchemaUpload: await store.loadProject('confirmSchemaUpload', options.directory, false),
    };
  });

  /**
   * Boots a webpack server, which asynchronously sends updates down to the
   * renderer. It'll run until it crashes or StopWebpack is called.
   */
  method(forControls.ControlsMethods.StartWebpack, async (options: { directory: string }) => {
    const server = new WebpackDevServer(new Project(options.directory));
    server.data.subscribe(data => action(new forControls.UpdateWebpackConsole(data)));
    server.state.subscribe(state => action(new forControls.UpdateWebpackState(state)));

    return server.start();
  });

  /**
   * Loads metadata from the project in the given directory.
   */
  method(forControls.ControlsMethods.SetWebpackConfig, async (options: { directory: string }) => {
    const file = await new OpenBuilder(window)
      .file()
      .allowJs()
      .allowAll()
      .openFromFolder(options.directory);

    if (!file) {
      return null;
    }

    const relative = path.relative(options.directory, file);
    await new WebpackDevServer(new Project(options.directory)).setConfigFilename(relative);
    return relative;
  });
}
