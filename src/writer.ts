import * as readline from 'readline';

/**
 * Writer is a super simple wrapper around the console/standard output for
 * use/replacement in testing.
 */
export class Writer {
  private fn = console.log.bind(console);

  /**
   * Swaps the function used for writing.
   */
  public use(fn: (...args: any[]) => void) {
    this.fn = fn;
  }

  /**
   * Writes a message out to the console.
   */
  public write(...message: any[]) {
    this.fn(...message);
  }

  /**
   * writeWrapped prints the message and wraps it at a certain character width.
   */
  public writeWrapped(message: string, width: number = 79) {
    while (message.length > 0) {
      let end = width;
      if (message.length > end) {
        end = message.slice(0, width).lastIndexOf(' ');
      }
      if (end === -1) {
        end = width;
      }

      this.fn(message.slice(0, end));
      message = message.slice(end).trim();
    }
  }

  /**
   * Prompts the user whether they'd like to continue the current operation.
   * Returns whether they've given consent to continue.
   */
  public async confirm(question: string, defaultValue: boolean = true): Promise<boolean> {
    const rl = readline.createInterface(process.stdin, process.stdout);
    this.writeWrapped(question);

    const answer = await new Promise<string>(resolve => {
      rl.question(`\nContinue? ${defaultValue ? '[y]/n' : 'y/[n]'}: `, resolve);
    });

    if (defaultValue) {
      return answer[0] !== 'n';
    }

    return answer[0] === 'y';
  }
}

export default new Writer();
