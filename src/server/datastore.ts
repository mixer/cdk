import { isPlainObject, merge } from 'lodash';
import * as os from 'os';
import * as path from 'path';
import { appendFile, exists, mkdir, readFile, writeFile } from './util';

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
  public static readonly folderName = '.miix';

  constructor(private readonly homedir = os.homedir()) {}

  public async loadGlobal<T>(file: string): Promise<T | null>;
  public async loadGlobal<T>(file: string, defaultValue: T): Promise<T>;
  public async loadGlobal<T>(file: string, defaultValue?: T): Promise<T | null> {
    const contents = await this.readFileIfExists(this.filePath(this.homedir, file));
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
    const localData = await this.readFileIfExists(this.filePath(projectPath, file));
    const localContents = localData ? JSON.parse(localData) : null;

    if (!isPlainObject(globalContents) || !isPlainObject(localContents)) {
      return localContents || globalContents || defaultValue || null;
    }

    return globalContents || localContents
      ? merge(globalContents, localContents)
      : defaultValue !== undefined ? defaultValue : null;
  }

  public async saveGlobal<T>(file: string, value: T): Promise<void> {
    await this.ensureMiixFolderInDir(this.homedir, false);
    await writeFile(this.filePath(this.homedir, file), JSON.stringify(value, null, 2));
  }

  public async saveProject<T>(file: string, projectPath: string, value: T): Promise<void> {
    await this.ensureMiixFolderInDir(projectPath, true);
    await writeFile(this.filePath(projectPath, file), JSON.stringify(value, null, 2));
  }

  private filePath(base: string, file: string) {
    return path.join(base, FileDataStore.folderName, `${file}.json`);
  }

  private async readFileIfExists(file: string): Promise<string | null> {
    return (await exists(file)) ? readFile(file) : null;
  }

  private async ensureMiixFolderInDir(dir: string, addToGitignore: boolean) {
    const target = path.join(dir, FileDataStore.folderName);
    if (await exists(target)) {
      return;
    }

    await mkdir(target);

    if (addToGitignore && (await exists(path.join(dir, '.git')))) {
      await appendFile(path.join(dir, '.gitignore'), `\n/${FileDataStore.folderName}\n`);
    }
  }
}
