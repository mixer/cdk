import * as readline from 'readline';

/**
 * Writer is a super simple wrapper around the console/standard output for
 * use/replacement in testing.
 */
export class Writer {
  private fn = console.log.bind(console);
  private readline = readline.createInterface(process.stdin, process.stdout);

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
    this.writeWrapped(question);

    let answer = await new Promise<string>(resolve => {
      this.readline.question(`\nContinue? ${defaultValue ? '[y]/n' : 'y/[n]'}: `, resolve);
    });

    answer = answer.toLowerCase();

    if (defaultValue) {
      return answer[0] !== 'n';
    }

    return answer[0] === 'y';
  }

  /**
   * Prompts the user with a question, and records their answer as a string.
   * Optionally takes a `validate` function. If the validator returns a string,
   * it will be printed and the user will be prompted to
   * answer the question again.
   */
  public async ask(
    question: string,
    defaultValue?: string,
    validate?: (answer: string) => string | void,
  ): Promise<string> {
    // tslint:disable-next-line
    while (true) {
      let answer = await new Promise<string>(resolve => {
        this.readline.question(`${question} ${defaultValue ? `[${defaultValue}] ` : ''}`, resolve);
      });

      answer = answer.trim();

      if (!answer && defaultValue) {
        answer = defaultValue;
      }

      if (!validate) {
        return answer;
      }

      const errorMessage = validate(answer);
      if (!errorMessage) {
        return answer;
      }

      this.writeWrapped(errorMessage);
    }
  }
}

export default new Writer();
