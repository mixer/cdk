import { BrowserWindow, dialog, OpenDialogOptions } from 'electron';
import { FileDataStore, IDataStore } from './datastore';

interface ISettings {
  previousFolders: { [context: string]: string };
}

/**
 * Fluent builder for opening files.
 */
export class OpenBuilder<R = string | null> {
  private options: OpenDialogOptions = {};

  constructor(private readonly window: BrowserWindow) {}

  /**
   * Opens a directory.
   */
  public directory(): this {
    return this.addProperty('openDirectory');
  }

  /**
   * Opens a single file.
   */
  public file(): this {
    return this.addProperty('openFile');
  }

  /**
   * Allows multi selection.
   */
  public multi(): OpenBuilder<string[]> {
    return <any>this.addProperty('multiSelections');
  }

  /**
   * Allows js files to be selected.
   */
  public allowJs(): this {
    return this.type('JavaScript Files', 'js');
  }

  /**
   * Allows all files to be selected.
   */
  public allowAll(): this {
    return this.type('All Files', '*');
  }

  /**
   * Add an accepted file type.
   */
  public type(name: string, extensions: string | string[]): this {
    if (!this.options.filters) {
      this.options.filters = [];
    }
    if (typeof extensions === 'string') {
      extensions = [extensions];
    }

    this.options.filters.push({ name, extensions });

    return this;
  }

  /**
   * Set the title of this dialog.
   */
  public title(title: string): this {
    this.options.title = title;
    return this;
  }

  /**
   * Opens a file or directory from a saved context.
   */
  public async openInContext(
    context: string,
    datastore: IDataStore = new FileDataStore(),
  ): Promise<R> {
    const settings = await datastore.loadGlobal<ISettings>('fileSelector', {
      previousFolders: {},
    });
    const previous = settings.previousFolders[context];
    const chosen = await (previous ? this.openFromFolder(previous) : this.open());

    const savedValue = chosen instanceof Array ? chosen[0] : chosen;
    if (savedValue) {
      settings.previousFolders[context] = savedValue;
      await datastore.saveGlobal('fileSelector', settings);
    }

    return chosen;
  }

  /**
   * Opens starting at the given folder.
   */
  public async openFromFolder(folder: string): Promise<R> {
    this.options.defaultPath = folder;
    return this.open();
  }

  /**
   * Opens starting at the default folder.
   */
  public async open(): Promise<R> {
    return await new Promise<R>(resolve =>
      dialog.showOpenDialog(this.window, this.options, (selection: any) => {
        if (this.options.properties && this.options.properties.includes('multiSelections')) {
          resolve(selection);
          return;
        }

        resolve(selection ? selection[0] : undefined);
      }),
    );
  }

  private addProperty(name: string) {
    if (!this.options.properties) {
      this.options.properties = [];
    }
    this.options.properties.push(<any>name);
    return this;
  }
}
