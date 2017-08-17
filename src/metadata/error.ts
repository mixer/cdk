import * as chalk from 'chalk';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Returns the sourcefile containing the given TypeScript node.
 */
function getSourceFile(node: ts.Node): ts.SourceFile {
  while (node.parent) {
    node = node.parent;
  }

  return <ts.SourceFile>node;
}

function repeat(str: string, times: number): string {
  let output = '';
  for (let i = 0; i < times; i++) {
    output += str;
  }

  return output;
}

function leftPad(str: string, length: number): string {
  while (str.length < length) {
    str = ` ${str}`;
  }

  return str;
}

interface ILine {
  content: string;
  number: number;
}

interface ILineInfo {
  before: ILine[];
  after: ILine[];
  line: ILine;
  char: number;
}

function posToLine(src: string, position: number): ILineInfo {
  const after = src.split('\n').map((content, n) => ({ content, number: n + 1 }));
  const before: ILine[] = [];

  while (after.length > 0 && position > after[0].content.length) {
    const line = <ILine>after.shift();
    before.push(line);
    position -= line.content.length + 1;
  }

  return {
    before,
    after,
    char: position - 1,
    line: after.shift() || { content: '', number: before.length },
  };
}

function lineNo(i: number | string) {
  return chalk.gray(`${leftPad(String(i), 4)} | `);
}

export interface IAnnotationConfig {
  surroundingLines: number;
  relativePath: string;
}

function annotateError(node: ts.Node, message: string, config: IAnnotationConfig) {
  const source = getSourceFile(node);
  const { after, before, line, char } = posToLine(source.text, node.pos);
  const end = node.end - (node.pos - char) + 1;

  const printLines = (lines: ILine[]) => {
    return lines.map(l => lineNo(l.number) + chalk.gray(l.content)).join('\n');
  };

  return [
    `Error at ${path.relative(config.relativePath, source.fileName)}:${before.length + 1}`,
    '',
    printLines(before.slice(-config.surroundingLines)),
    lineNo(line.number) +
      chalk.reset(line.content.slice(0, char)) +
      chalk.red(line.content.slice(char, Math.min(line.content.length, end))) +
      chalk.reset(line.content.slice(end)),
    lineNo('') + repeat(' ', char) + chalk.yellow(`^${repeat('-', end - char - 1)}`),
    printLines(after.slice(0, config.surroundingLines)),
    `\n${chalk.bold(chalk.red('ERROR:'))} ${message}`,
  ]
    .map(l => chalk.reset(l))
    .join('\n');
}

/**
 * DeclarationError is an Error type thrown when some invalid code is
 * encountered. It creates a pretty annotated error.
 */
export class DeclarationError extends Error {
  private static readonly annotationConfig = {
    surroundingLines: 1,
    relativePath: '',
  };

  public readonly dontColor = true;

  constructor(
    public readonly node: ts.Node,
    public readonly originalMessage: string,
    config?: IAnnotationConfig,
  ) {
    super(annotateError(node, originalMessage, config || DeclarationError.annotationConfig));
  }

  /**
   * Creates a new DeclarationError using a relative path for the source file.
   */
  public makeRelative(relativePath: string): DeclarationError {
    return new DeclarationError(this.node, this.originalMessage, {
      ...DeclarationError.annotationConfig,
      relativePath,
    });
  }
}
