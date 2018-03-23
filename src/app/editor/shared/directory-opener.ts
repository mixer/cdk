import { CommonMethods } from '../bedrock.actions';
import { ElectronService } from '../electron.service';

export const enum LauncherKind {
  IDE,
  Browser,
}

/**
 * ILauncher is a platform program that opens a folder.
 */
export interface ILauncher {
  bin: string;
  text: string;
  kind: LauncherKind;
}

// List of launcher programs to try.
const launchers = [
  // IDEs:
  { bin: 'code', text: 'Open in VS Code', kind: LauncherKind.IDE },
  { bin: 'subl', text: 'Open in Sublime Text', kind: LauncherKind.IDE },
  // Platform openers:
  { bin: 'explorer.exe', text: 'Open Folder', kind: LauncherKind.Browser }, // windows
  { bin: 'open', text: 'Open Folder', kind: LauncherKind.Browser }, // os x
  { bin: 'xdg-open', text: 'Open Folder', kind: LauncherKind.Browser }, // linux
];

/**
 * Provides helpers to open
 */
export class DirectoryOpener {
  constructor(private readonly electron: ElectronService) {}

  /**
   * Attempts to find an appropriate program to open a folder.
   */
  public findProgram(): Promise<ILauncher | null> {
    return this.electron
      .call<{ [bin: string]: boolean }>(CommonMethods.CheckIfExePresent, {
        exes: launchers.map(l => l.bin),
      })
      .then(results => launchers.find(l => results[l.bin]) || null);
  }

  /**
   * Opens the directory in the requested program.
   */
  public open(directory: string, program: ILauncher) {
    return this.electron.call(CommonMethods.LaunchProgram, {
      name: program.bin,
      args: [directory],
    });
  }
}
