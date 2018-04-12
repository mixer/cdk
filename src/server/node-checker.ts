import { execSync } from 'child_process';
import { platform } from 'os';

import { INodeData } from '../app/editor/preflight/preflight.actions';

/**
 * Checks the presence and version of Node.js.
 */
export class NodeChecker {
  public async check(): Promise<INodeData> {
    let version: string;
    try {
      version = execSync('node --version').toString();
    } catch (e) {
      return { isPresent: false, platform: platform() };
    }

    // trim the output as well as the 'v' in the normal 'v1.2.3' output

    return {
      version: version.trim().slice(1),
      isPresent: true,
      platform: platform(),
    };
  }
}
