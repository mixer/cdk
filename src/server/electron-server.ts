import { Action } from '@ngrx/store';
import * as commandExists from 'command-exists';
import { BrowserWindow, Event, ipcMain } from 'electron';
import * as path from 'path';

import * as forAccount from '../app/editor/account/account.actions';
import { CommonMethods } from '../app/editor/bedrock.actions';
import * as forControls from '../app/editor/controls/controls.actions';
import * as forLayout from '../app/editor/layout/layout.actions';
import * as forNewProject from '../app/editor/new-project/new-project.actions';
import * as forProject from '../app/editor/project/project.actions';
import * as forSchema from '../app/editor/schema/schema.actions';
import * as forUploader from '../app/editor/uploader/uploader.actions';

import { spawn } from 'child_process';
import { IRemoteError } from '../app/editor/electron.service';
import { Encrypter } from '../app/editor/shared/encrypter';
import { FileDataStore } from './datastore';
import { hasMetadata, NoAuthenticationError } from './errors';
import { OpenBuilder } from './file-selector';
import { GrantCancelledError, Profile } from './profile';
import { Project } from './project';
import { ProjectLinker } from './project-linker';
import { Quickstarter } from './quickstart';
import { SnapshotStore } from './snapshot-store';
import { TaskList } from './tasks/task';
import { Fetcher } from './util';
import { WebpackBundleTask } from './webpack-bundler-task';
import { WebpackDevServer } from './webpack-dev-server-task';

const methods: { [methodName: string]: (data: any, server: ElectronServer) => Promise<any> } = {
  /**
   * Starts an account linking. Returns the user once linked, or null if
   * they do not link by the time the current code expires. Updates the
   * linked code when it's received.
   */
  [forAccount.AccountMethods.LinkAccount]: async (_data: void, server: ElectronServer) => {
    const profile = new Profile();

    let grantCount = 0;
    try {
      await profile.grant({
        prompt: (code, expiresAt) => server.sendAction(new forAccount.SetLinkCode(code, expiresAt)),
        isCancelled: () => Boolean(grantCount++), // false initially, then true afterwards
      });
      return await profile.user();
    } catch (err) {
      if (!(err instanceof GrantCancelledError)) {
        throw err;
      }

      return null;
    }
  },

  /**
   * Returns the currently linked account, if any.
   */
  [forAccount.AccountMethods.GetLinkedAccount]: async () => {
    try {
      return await new Profile().user();
    } catch (e) {
      if (e instanceof NoAuthenticationError) {
        return null;
      }

      throw e;
    }
  },

  /**
   * Logs the user out of their account.
   */
  [forAccount.AccountMethods.Logout]: async () => new Profile().logout(),

  /**
   * Called when we want to create a new project, triggers the quickstart.
   * Emits AppendCreateUpdate actions back down when data is displayed on
   * the console.
   */
  [forNewProject.NewProjectMethods.StartCreate]: async (details, server: ElectronServer) => {
    const quickstart = new Quickstarter(details);
    server.tasks.add(quickstart);
    quickstart.data.subscribe(data =>
      server.sendAction(new forNewProject.AppendCreateUpdate(data)),
    );
    await quickstart.start();
  },

  /**
   * Opens a prompt to choose a directory, and returns the chosen one.
   */
  [CommonMethods.ChooseDirectory]: async (options: { context: string }, server: ElectronServer) => {
    return new OpenBuilder(server.window).directory().openInContext(options.context);
  },

  /**
   * Checks if a bundle name is taken; returns true if so.
   */
  [CommonMethods.CheckBundleNameTaken]: async ({ name }: { name: string }) => {
    const res = await new Fetcher().json('get', `/interactive/bundles/${name}`);
    return res.status === 200 || res.status === 403;
  },

  /**
   * Launches the given program with the provided arguments.
   */
  [CommonMethods.LaunchProgram]: async (options: { name: string; args: string[] }) => {
    spawn(options.name, options.args, {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
  },

  /**
   * Opens a prompt to choose a directory, and returns the chosen one.
   */
  [CommonMethods.CheckIfExePresent]: async (options: { exes: string[] }) => {
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
  },

  /**
   * Encrypts a string of text.
   */
  [CommonMethods.EncryptString]: async (options: { data: string }) => {
    return new Encrypter().encrypt(options.data);
  },

  /**
   * Saves the current panel layouts.
   */
  [forLayout.LayoutMethod.SavePanels]: async (options: { panels: object[]; project: string }) => {
    await new FileDataStore().saveProject('layout', options.project, options.panels);
  },

  /**
   * Loads the panel layouts for the selected project.
   */
  [forLayout.LayoutMethod.LoadPanels]: async (options: { project: string }) => {
    return new FileDataStore().loadProject('layout', options.project);
  },

  /**
   * Loads metadata from the project in the given directory.
   */
  [forProject.ProjectMethods.OpenDirectory]: async (options: { directory: string }) => {
    const store = new FileDataStore();
    const project = new Project(options.directory);

    const json = await project.packageJson(); // validate the package is there, throws if not

    return <forProject.IProject>{
      directory: options.directory,
      interactiveGame: await new ProjectLinker(project).getLinked(),
      confirmSchemaUpload: await store.loadProject('confirmSchemaUpload', options.directory, false),
      packageJson: json,
    };
  },

  /**
   * Returns all the user's owned games.
   */
  [forProject.ProjectMethods.GetOwnedGames]: async (options: { directory: string }) => {
    return new ProjectLinker(new Project(options.directory)).getOwnedGames();
  },

  /**
   * Links the Interactive game to the set of controls.
   */
  [forProject.ProjectMethods.LinkGameToControls]: async (options: {
    directory: string;
    game: forProject.IInteractiveGame;
  }) => {
    return new ProjectLinker(new Project(options.directory)).linkGame(options.game);
  },

  /**
   * Boots a webpack server, which asynchronously sends updates down to the
   * renderer. It'll run until it crashes or StopWebpack is called.
   */
  [forControls.ControlsMethods.StartWebpack]: async (
    options: {
      directory: string;
    },
    server: ElectronServer,
  ) => {
    const wds = new WebpackDevServer(new Project(options.directory));
    server.tasks.add(wds);
    wds.data.subscribe(data => server.sendAction(new forControls.UpdateWebpackConsole(data)));
    wds.state.subscribe(state => server.sendAction(new forControls.UpdateWebpackState(state)));

    return wds.start();
  },

  /**
   * Stops all running webpack servers.
   */
  [forControls.ControlsMethods.StopWebpack]: async (_data: void, server: ElectronServer) => {
    await server.tasks.stopAll(t => t instanceof WebpackDevServer);
  },

  /**
   * Loads metadata from the project in the given directory.
   */
  [forControls.ControlsMethods.SetWebpackConfig]: async (
    options: {
      directory: string;
    },
    server: ElectronServer,
  ) => {
    const file = await new OpenBuilder(server.window)
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
  },

  /**
   * Saves changed snapshot.
   */
  [forSchema.SchemaMethod.SaveSnapshot]: async (options: {
    name: string;
    directory: string;
    world: forSchema.IWorld;
  }) => new SnapshotStore(options.directory).save(options.name, options.world),

  /**
   * Deletes a snapshot.
   */
  [forSchema.SchemaMethod.DeleteSnapshot]: async (options: { name: string; directory: string }) =>
    new SnapshotStore(options.directory).destroy(options.name),

  /**
   * Lists all snapshots.
   */
  [forSchema.SchemaMethod.ListSnapshots]: async (options: { directory: string }) =>
    new SnapshotStore(options.directory).list(),

  /**
   * Updates schema in an interactive game.
   */
  [forSchema.SchemaMethod.SetGameSchema]: async (options: {
    directory: string;
    world: forSchema.IWorld;
    game: forProject.IInteractiveGame;
  }) => {
    return new ProjectLinker(new Project(options.directory)).setSchema(options.game, options.world);
  },

  /**
   * Gets full details about an interactive project version.
   */
  [forSchema.SchemaMethod.GetGameVersionDetails]: async (options: {
    directory: string;
    game: forProject.IInteractiveGame;
  }) => {
    return new ProjectLinker(new Project(options.directory)).getFullVersion(options.game);
  },

  /**
   * Bundles and uploads controls.
   */
  [forUploader.UploaderMethods.StartUpload]: async (
    options: { directory: string },
    server: ElectronServer,
  ) => {
    const wds = new WebpackBundleTask(new Project(options.directory));
    server.tasks.add(wds);
    wds.data.subscribe(data => server.sendAction(new forUploader.UpdateWebpackConsole(data)));
    wds.state.subscribe(state => server.sendAction(new forUploader.UpdateWebpackState(state)));

    return wds.start();
  },
};

/**
 * Host for the electron server, which exposes IPC methods that the renderer
 * process will call. Relatively stateless, contains most of the nitty gritty
 * i/o and process management that the renderer needs to call.
 */
export class ElectronServer {
  /**
   * Top-level list of running tasks on the server.
   */
  public readonly tasks = new TaskList();

  /**
   * A list of callable RPC methods.
   */
  public readonly methods = methods;

  constructor(public readonly window: BrowserWindow) {}

  /**
   * Emits a Redux action to the rednerer.
   */
  public sendAction(action: Action) {
    this.window.webContents.send('dispatch', action);
  }

  /**
   * Boots the electron server.
   */
  public start() {
    this.attachMethods();
  }

  private attachMethods() {
    Object.keys(this.methods).forEach(name =>
      ipcMain.addListener(name, (ev: Event, { id, params }: { id: number; params: any }) => {
        methods[name](params, this)
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
      }),
    );
  }
}
