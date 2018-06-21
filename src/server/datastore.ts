import { isPlainObject, merge } from 'lodash';
import * as os from 'os';
import * as path from 'path';
import { appendFile, exists, mkdir, readFile, unlink, writeFile } from './util';

/**
 * IDataStore is a system-aware store for project files and settings.
 */
export interface IDataStore {
  /**
   * Attempts to load the file from the system. Returns null if the file
   * does not exist.
   */
  loadGlobal<T>(file: string): Promise<T | null>;
  loadGlobal<T>(file: string, defaultValue: T): Promise<T>;

  /**
   * Attempts to load the file from the system, attempting to merge in
   * any local overrides if available.
   */
  loadProject<T>(file: string, projectPath: string): Promise<T | null>;
  loadProject<T>(file: string, projectPath: string, defaultValue: T): Promise<T>;

  /**
   * Saves the file in the user's global profile path.
   */
  saveGlobal<T>(file: string, value: T): Promise<void>;

  /**
   * Saves the file in the project path.
   */
  saveProject<T>(file: string, projectPath: string, value: T): Promise<void>;
}

/**
 * FileDataStore is an IDataStore backed by the filesystem.
 */
export class FileDataStore implements IDataStore {
  /**
   * Folders to save data to, in order of preference. If one of them is
   * present, we will use that for reading and saving preferences, otherwise
   * we'll create the most-preferred folder as necessary. This functionality
   * is for backwards compatibility.
   */
  public static readonly folderNames = ['.cdk', '.miix'];

  constructor(private readonly homedir = os.homedir()) {}

  public async loadGlobal<T>(file: string): Promise<T | null>;
  public async loadGlobal<T>(file: string, defaultValue: T): Promise<T>;
  public async loadGlobal<T>(file: string, defaultValue?: T): Promise<T | null> {
    const contents = await this.readFileIfExists(await this.filePath(this.homedir, file));
    if (contents === null) {
      return defaultValue !== undefined ? defaultValue : null;
    }

    return JSON.parse(contents);
  }

  public async loadProject<T>(file: string, projectPath: string): Promise<T | null>;
  public async loadProject<T>(file: string, projectPath: string, defaultValue: T): Promise<T>;
  public async loadProject<T>(
    file: string,
    projectPath: string,
    defaultValue?: T,
  ): Promise<T | null> {
    const globalContents = await this.loadGlobal(file);
    const localData = await this.readFileIfExists(await this.filePath(projectPath, file));
    const localContents = localData ? JSON.parse(localData) : null;

    if (!isPlainObject(globalContents) || !isPlainObject(localContents)) {
      return localContents || globalContents || defaultValue || null;
    }

    return globalContents || localContents
      ? merge(globalContents, localContents)
      : defaultValue !== undefined
        ? defaultValue
        : null;
  }

  public async saveGlobal<T>(file: string, value: T): Promise<void> {
    const filePath = await this.filePath(this.homedir, file);
    await this.ensurePreferenceFolderInDir(this.homedir, false);

    if (value === undefined) {
      await unlink(filePath);
    } else {
      await writeFile(filePath, JSON.stringify(value, null, 2));
    }
  }

  public async saveProject<T>(file: string, projectPath: string, value: T): Promise<void> {
    const filePath = await this.filePath(projectPath, file);
    await this.ensurePreferenceFolderInDir(projectPath, true);

    if (value === undefined) {
      await unlink(filePath);
    } else {
      await writeFile(filePath, JSON.stringify(value, null, 2));
    }
  }

  /**
   * Returns the folder in the base directory in which preferences should
   * be stored. See FileDataStore.folderNames for more information.
   */
  private async getStoreFolder(base: string): Promise<string> {
    for (const folder of FileDataStore.folderNames) {
      if (await exists(path.join(base, folder))) {
        return folder;
      }
    }

    return FileDataStore.folderNames[0];
  }

  /**
   * Returns the file path for preferences stored in the target directory.
   */
  private async filePath(base: string, file: string) {
    return path.join(base, await this.getStoreFolder(base), `${file}.json`);
  }

  /**
   * Reads the file contents if it exists, returns null otherwise.
   */
  private async readFileIfExists(file: string): Promise<string | null> {
    return (await exists(file)) ? readFile(file) : null;
  }

  /**
   * Ensures that a folder to store the user preferences exists in the target
   * directory, creating it if it does not exist. Optionally, add it to
   * a gitignore file too.
   */
  private async ensurePreferenceFolderInDir(dir: string, addToGitignore: boolean) {
    const folder = await this.getStoreFolder(dir);
    const target = path.join(dir, folder);
    if (await exists(target)) {
      return;
    }

    await mkdir(target);

    if (addToGitignore && (await exists(path.join(dir, '.git')))) {
      await appendFile(path.join(dir, '.gitignore'), `\n/${folder}\n`);
    }
  }
}
