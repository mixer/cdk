import { Action } from '@ngrx/store';

/**
 * Reason for showing the modal that prompts the user to install node.
 */
export enum InstallReason {
  NotPresent,
  OldVersion,
}

export const enum PreflightActionTypes {
  RUN = '[Preflight] Run checks',
  PROMPT_NODE = '[Preflight] Prompt to install Node',
  PASS = '[Preflight] Mark preflight checks as passing',
}

/**
 * INodeData is returned from GetNodeData.
 */
export interface INodeData {
  isPresent: boolean;
  version?: string;
  platform: string;
}

/**
 * Minimum acceptable Node.js version.
 */
export const minNodeVersion = '8.0.0';

export const enum PreflightMethods {
  GetNodeData = '[Preflight] Get Node info',
}

/**
 * Runs preflight checks.
 */
export class RunChecks implements Action {
  public readonly type = PreflightActionTypes.RUN;
}

/**
 * Marks all preflight checks as having passed.
 */
export class MarkPassed implements Action {
  public readonly type = PreflightActionTypes.PASS;
}

/**
 * Prompts the user to install Node.js.
 */
export class PromptInstallNode implements Action {
  public readonly type = PreflightActionTypes.PROMPT_NODE;

  constructor(public readonly reason: InstallReason, public readonly platform: string) {}
}

export type PreflightActions = RunChecks | MarkPassed | PromptInstallNode;
