import * as ts from 'typescript';
import { DeclarationError, ErrorCode } from './error';

import { MetadataExtractor } from './extractor';

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

    return ts.isStringTextContainingNode(call[0]);
  },
];

/**
 * EvilSniffer walks the TypeScript project and errors if it sees dangerous
 * method like `eval`, `new Function`, `setTimeout(str)`, and so on.
 */
export class EvilSniffer extends MetadataExtractor {
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
