import { Action } from '@ngrx/store';

export const enum CommonMethods {
  ChooseDirectory = '[Bedrock] Choose Directory',
  CheckBundleNameTaken = '[Bedrock] Check if a Bundle Name is Taken',
  CheckIfExePresent = '[Bedrock] Check if an Executable is in the Path',
  LaunchProgram = '[Bedrock] Launch a program',
}

export const enum BedrockActions {
  UnexpectedError = '[Bedrock] An unexpected error occurred',
}

/**
 * Fired when an error occurs which we didn't expect and couldn't
 * handle locally.
 */
export class UnhandledError implements Action {
  public readonly type = BedrockActions.UnexpectedError;

  constructor(public readonly error: string) {
    // add the calling stack explicitly
    this.error += `\n\nFrom: ${new Error('UnhandledError').stack}`;
  }
}
