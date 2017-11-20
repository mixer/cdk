import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';

import { readFile } from '../util';
import { DeclarationError } from './error';

/**
 * TypeScriptWalker is a class which can parse and walk the syntax tree of a
 * TypeScript profile or folder.
 */
export abstract class TypeScriptWalker {
  /**
   * Walks all files in the source directory.
   */
  public async compile(sourceDir: string): Promise<this> {
    return Promise.all(
      glob.sync(path.join(sourceDir, 'src/**/*.{ts,tsx,jsx,js}')).map(async file => {
        return this.parseFile(sourceDir, file);
      }),
    ).then(() => this);
  }

  /**
   * Walks a single TypeScript file.
   */
  public async parseFile(sourceDir: string, file: string): Promise<this> {
    return readFile(file).then(contents => {
      const sourceFile = ts.createSourceFile(
        file,
        contents.toString(),
        ts.ScriptTarget.ES2015,
        true,
      );

      try {
        this.visit(sourceFile);
      } catch (e) {
        if (e instanceof DeclarationError) {
          throw e.makeRelative(sourceDir);
        }

        throw e;
      }

      return this;
    });
  }

  /**
   * Parses the string as a TypeScript source file.
   */
  public parseString(str: string): this {
    this.visit(ts.createSourceFile('string', str, ts.ScriptTarget.ES2015, true));
    return this;
  }

  /**
   * visit is called whenever the walker sees a TypeScript node.
   */
  protected abstract visit(node: ts.Node): any;
}
