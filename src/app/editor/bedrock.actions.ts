import { Action } from '@ngrx/store';
import { RpcError } from './electron.service';

export const enum CommonMethods {
  ChooseDirectory = '[Bedrock] Choose Directory',
  CheckBundleNameTaken = '[Bedrock] Check if a Bundle Name is Taken',
  CheckIfExePresent = '[Bedrock] Check if an Executable is in the Path',
  LaunchProgram = '[Bedrock] Launch a program',
  EncryptString = '[Bedrock] Encrypt a string',
}

export const enum BedrockActions {
  UnexpectedError = '[Bedrock] An unexpected error occurred',
  ReportRpcError = '[Bedrock] Report a RPC error',
  ReportGenericError = '[Bedrock] Report a generic error',
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

/**
 * Fired when an RPC error occurs which we didn't expect and couldn't
 * handle locally.
 */
export class ReportRpcError implements Action {
  public readonly type = BedrockActions.ReportRpcError;

  constructor(public readonly title: string, public readonly original: RpcError) {}
}

/**
 * Fired when an RPC error occurs which we didn't expect and couldn't
 * handle locally.
 */
export class ReportGenericError implements Action {
  public readonly type = BedrockActions.ReportGenericError;

  constructor(public readonly title: string, public readonly message: string) {}
}
