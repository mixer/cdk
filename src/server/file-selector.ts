import { BrowserWindow, dialog } from 'electron';
import { FileDataStore, IDataStore } from './datastore';

interface ISettings {
  previousFolders: { [context: string]: string };
}

/**
 * Helper class for asking the user to pick save or open locations.
 */
export class FileSelector {
  constructor(private readonly datastore: IDataStore = new FileDataStore()) {}

  /**
   * Prompts the user to pick a folder to open.
   */
  public async chooseFolder(
    window: BrowserWindow,
    context: string = 'default',
  ): Promise<string | void> {
    const settings = await this.loadSettings();
    const chosen = await new Promise<string | void>(resolve =>
      dialog.showOpenDialog(
        window,
        {
          defaultPath: settings.previousFolders[context],
          properties: ['openDirectory'],
        },
        chosen => resolve(chosen ? chosen[0] : undefined),
      ),
    );

    if (chosen) {
      settings.previousFolders[context] = chosen;
      await this.saveSettings(settings);
    }

    return chosen;
  }

  private async saveSettings(settings: ISettings) {
    return this.datastore.saveGlobal('fileSelector', settings);
  }

  private async loadSettings(): Promise<ISettings> {
    return this.datastore.loadGlobal('fileSelector', {
      previousFolders: {},
    });
  }
}
