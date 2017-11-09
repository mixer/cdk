import { isHumanError } from '../errors';
import { Project } from '../project';

export interface IGlobalOptions {
  /**
   * Base directory of the interactive project.
   */
  project: Project;

  /**
   * Address of the Mixer API.
   */
  api: string;
}

export function failSpiner(spinner: { fail(message: string): void }) {
  return (err: Error): never => {
    if (isHumanError(err)) {
      spinner.fail(err.getHumanMessage());
      process.exit(1);
      throw new Error(''); // cannot be reached
    }

    spinner.fail(err.message);
    throw err;
  };
}
