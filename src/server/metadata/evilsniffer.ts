import * as ts from 'typescript';

import { Writer } from '../../cli/writer';
import { Project } from '../project';
import { TypeScriptWalker } from './ast';
import { DeclarationError, ErrorCode } from './error';

function isCallToGlobal(node: ts.Node, fn: string): ts.NodeArray<ts.Expression> | undefined {
  if (!ts.isCallExpression(node) && !ts.isNewExpression(node)) {
    return undefined;
  }
  const expr = node.expression;

  // Check fn() calls
  if (ts.isIdentifier(expr)) {
    return expr.text === fn ? node.arguments : undefined;
  }

  // Check window.fn() calls
  if (ts.isPropertyAccessExpression(expr)) {
    if (
      ts.isIdentifier(expr.expression) &&
      expr.expression.text === 'window' &&
      ts.isIdentifier(expr.name) &&
      expr.name.text === fn
    ) {
      return node.arguments;
    }
  }

  return undefined;
}

/**
 * Identifiers is a list of functions that finds eval methods. If one of these
 * returns true for a TypeScript node, the function is an eval.
 */
const identifiers: ((node: ts.Node) => boolean)[] = [
  /**
   * Simple eval() calls.
   */
  node => Boolean(isCallToGlobal(node, 'eval')),
  /**
   * new Function(...) calls
   */
  node => Boolean(isCallToGlobal(node, 'Function')),

  /**
   * setInterval/setTimeout with a string literal
   */
  node => {
    const call = isCallToGlobal(node, 'setInterval') || isCallToGlobal(node, 'setTimeout');
    if (!call || call.length === 0) {
      return false;
    }

    return ts.isLiteralExpression(call[0]) || ts.isTemplateLiteral(call[0]);
  },
];

/**
 * EvilSniffer walks the TypeScript project and errors if it sees dangerous
 * method like `eval`, `new Function`, `setTimeout(str)`, and so on.
 */
export class EvilSniffer extends TypeScriptWalker {
  protected visit(node: ts.Node): any {
    if (identifiers.some(id => id(node))) {
      throw new DeclarationError(
        ErrorCode.DangerousEval,
        node,
        'Executing arbitrary code is dangerous, particularly if the game client ' +
          'is compromised consider using an alternative strategy here.',
      );
    }

    return ts.forEachChild(node, child => this.visit(child));
  }
}

/**
 * WriterReporter prompts the user whether to continue if dangerous
 * eval functions are found.
 */
export class WriterReporter {
  constructor(private readonly project: Project) {}

  /**
   * Checks that eval functions are not used, or asks the user to confirm
   * they they understand the risks using the writer. Returns whether
   * publishing should be continued.
   */
  public async checkEvil(writer: Writer): Promise<boolean> {
    try {
      await new EvilSniffer().compile(this.project.baseDir());
    } catch (e) {
      if (!(e instanceof DeclarationError)) {
        throw e;
      }

      writer.write(`${e.getHumanMessage()}\n\n`);
      return await writer.confirm(
        'Using these unsafe functions is strongly discouraged, and may cause your ' +
          'controls to be banned from Mixer. Read more about why this is at ' +
          'https://aka.ms/dont-be-eval.',
        false,
      );
    }

    return true;
  }
}
