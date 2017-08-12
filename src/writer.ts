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
}

export default new Writer();
