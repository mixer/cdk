import chalk from 'chalk';
import * as path from 'path';
import * as ts from 'typescript';

import { IHumanError } from '../errors';

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

  // ts can report the store of the node from the end of the last node, which
  // may contain whitespace and throw things off. Fix that.
  while (/\s/.test(source.text[node.pos])) {
    node.pos++;
  }

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

export enum ErrorCode {
  InvalidArgumentCount,
  InvalidArgumentType,
  InvalidPropertyAssignment,
  InvalidEnumAccess,
  InvalidComplexExpression,
  RedeclaredControl,
  RequiredSceneID,
  MissingResourceDecorator,
  InvalidDecoratorTarget,
  CouldNotInferKind,
  DangerousEval,
}

/**
 * DeclarationError is an Error type thrown when some invalid code is
 * encountered. It creates a pretty annotated error.
 */
export class DeclarationError extends Error implements IHumanError {
  private static readonly annotationConfig = {
    surroundingLines: 1,
    relativePath: '',
  };

  public readonly dontColor = true;

  constructor(
    public readonly code: ErrorCode,
    public readonly node: ts.Node,
    public readonly originalMessage: string,
    config?: IAnnotationConfig,
  ) {
    super(annotateError(node, originalMessage, config || DeclarationError.annotationConfig));
  }

  /**
   * Converts the error to a JSON representation.
   */
  public toJSON() {
    return {
      code: this.code,
      codeName: ErrorCode[this.code],
      file: this.node.getSourceFile().fileName,
      charStart: this.node.pos,
      chatEnd: this.node.end,
      message: this.originalMessage,
    };
  }

  /**
   * @override
   */
  public getHumanMessage() {
    return this.message;
  }

  /**
   * Creates a new DeclarationError using a relative path for the source file.
   */
  public makeRelative(relativePath: string): DeclarationError {
    return new DeclarationError(this.code, this.node, this.originalMessage, {
      ...DeclarationError.annotationConfig,
      relativePath,
    });
  }
}
