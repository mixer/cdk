/**
 * extractor.ts contains tools that run static analysis on the codebase to pull
 * out data from decorators.
 */

import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';

import {
  IControlOptions,
  IInputDescriptor,
  InputKind,
  ISceneOptions,
} from '@mcph/miix-std/dist/internal';
import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { readFile } from '../util';
import { DeclarationError } from './error';

type JsonType = string | number | object | boolean;

function isAccessFor(name: string, node: ts.Node): boolean {
  return new RegExp(`(^|\\.)${name}$`).test(node.getText());
}

/**
 * The DecoratorExtract is a class that gathers metadata from decorators in
 * the controls. They're called by the walker as it transverses the source
 * trees.
 */
abstract class DecoratorExtractor<T extends object> {
  /**
   * Returns the decorator's name, like `Control`
   */
  public abstract name(): string;

  /**
   * Called whenever the walker encounters a decorator.
   */
  public guardedParse(decorator: ts.Decorator): void {
    if (decorator.expression.kind !== ts.SyntaxKind.CallExpression) {
      return;
    }

    const call = <ts.CallExpression>decorator.expression;
    if (!isAccessFor(this.name(), call.expression)) {
      return;
    }

    if (call.arguments.length === 0) {
      this.parse(<T>{}, decorator);
      return;
    }

    this.assert(
      call.arguments.length === 1,
      call,
      'Expected to be called with at most one argument',
    );

    const [arg] = call.arguments;
    this.assert(
      arg.kind === ts.SyntaxKind.ObjectLiteralExpression,
      call,
      'Expected to be called with an object literal',
    );

    this.parse(<T>this.parseObjectLiteral(<ts.ObjectLiteralExpression>arg), decorator);
    return;
  }

  /**
   * Attaches this extractor's metadat to the IPackageData.
   */
  public abstract augment(metadata: Partial<IPackageConfig>): void;

  /**
   * Called with the first decorator argument when the parser encounters
   * a decorator.
   */
  protected abstract parse(argument: T, decorator: ts.Decorator): void;

  /**
   * Parses a simple JSON-serializable expression into a JavaScript type.
   * Throws if it's a bad type.
   */
  protected parseSimpleNode(node: ts.Node): JsonType | JsonType[] {
    switch (node.kind) {
      case ts.SyntaxKind.TrueKeyword:
        return true;
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.NumericLiteral:
        return Number((<ts.LiteralExpression>node).text);
      case ts.SyntaxKind.Identifier:
        return (<ts.Identifier>node).text;
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.parseObjectLiteral(<ts.ObjectLiteralExpression>node);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return (<ts.ArrayLiteralExpression>node).elements.map(n => this.parseSimpleNode(n));
      default:
      // fall through
    }

    if (
      node.kind >= ts.SyntaxKind.FirstLiteralToken &&
      node.kind <= ts.SyntaxKind.LastLiteralToken
    ) {
      return (<ts.LiteralExpression>node).text;
    }

    this.assert(false, node, 'Only simple, JSON-compatible expressions are allowed here');
    return ''; // never
  }

  /**
   * parseEnumAccess checks that the node is an enum access or string literal
   * and tries to parse it to the corresponding numeric type.
   */
  protected parseEnumAccess(node: ts.Node, name: string, actualEnum: any): number {
    const keys = Object.keys(actualEnum)
      .filter(k => typeof actualEnum[k] === 'number')
      .join(', ');
    if (node.kind === ts.SyntaxKind.StringLiteral) {
      const text = (<ts.StringLiteral>node).text;
      this.assert(
        typeof actualEnum[text] === 'number',
        node,
        `Invalid ${name} value, expected one of ${keys}`,
      );
      return actualEnum[text];
    }

    const matches = <string[]>new RegExp(`(^|\\.)${name}\\.(.+)$`).exec(node.getText());
    this.assert(!!matches, node, `Expected to be a lookup on ${name}, or one of ${keys}`);

    const value = actualEnum[matches[2]];
    this.assert(value, node, `Invalid ${name} value, should be one of ${keys}`);

    return value;
  }

  /**
   * Parses an object literal key.
   */
  protected parseLiteralKey(key: ts.Node): string {
    return String(this.parseSimpleNode(key));
  }

  /**
   * Parses an object literal value.
   */
  protected parseLiteralValue(value: ts.Node, _key: string): JsonType | JsonType[] {
    return this.parseSimpleNode(value);
  }

  /**
   * Parses an object literal into a plain JavaScript object. Requires that
   * all properties of the object ltieral be simple, JSON-stringify-able
   * types, or throws an error.
   */
  protected parseObjectLiteral(node: ts.ObjectLiteralExpression): object {
    const output: { [key: string]: any } = {};

    ts.forEachChild(node, (child: ts.PropertyAssignment) => {
      // disallow `{ shorthand }`
      this.assert(
        child.kind === ts.SyntaxKind.PropertyAssignment,
        node,
        `Only "key": "value" assignments are allowed`,
      );

      const key = this.parseLiteralKey(child.name);
      output[key] = this.parseLiteralValue(child.initializer, key);
    });

    return output;
  }

  protected assert(value: boolean, node: ts.Node, message: string): void {
    if (value) {
      return; // all good
    }

    throw new DeclarationError(node, `${message} in @${this.name()}()`);
  }
}

/**
 * IInputable is an Extractor interested in the last inputable classes.
 */
interface IInputable {
  setLastInput(map: IInputDescriptor[]): void;
}

/**
 * ControlExtractor extracts data from @Control decorators.
 */
class ControlExtractor extends DecoratorExtractor<IControlOptions> {
  private controls: { [kind: string]: IControlOptions } = Object.create(null);

  constructor(private readonly inputable: IInputable) {
    super();
  }

  public name() {
    return 'Control';
  }

  public augment(metadata: Partial<IPackageConfig>) {
    metadata.controls = this.controls;
  }

  public parse(result: IControlOptions, decorator: ts.Decorator) {
    this.assert(
      !this.controls[result.kind],
      decorator,
      `Control type "${result.kind}" declared multiple times`,
    );

    result.inputs = result.inputs || [];
    this.inputable.setLastInput(result.inputs);
    this.controls[result.kind] = result;
  }
}

/**
 * SceneExtractor extracts data from @Scene decorators.
 */
class SceneExtractor extends DecoratorExtractor<ISceneOptions> {
  private scenes: { [kind: string]: ISceneOptions } = Object.create(null);

  constructor(private readonly inputable: IInputable) {
    super();
  }

  public name() {
    return 'Scene';
  }

  public augment(metadata: Partial<IPackageConfig>) {
    metadata.scenes = this.scenes;
  }

  public parse(result: ISceneOptions, decorator: ts.Decorator) {
    this.assert(
      !!(result.default || result.id),
      decorator,
      'Non-default scenes must have a defined ID',
    );

    result.inputs = result.inputs || [];
    this.inputable.setLastInput(result.inputs);
    this.scenes[result.id || 'default'] = result;
  }
}

/**
 * SceneExtractor extracts data from @Scene decorators.
 */
class InputExtractor extends DecoratorExtractor<IInputDescriptor> implements IInputable {
  private lastMapping: IInputDescriptor[];

  public name() {
    return 'Input';
  }

  public augment() {
    /* noop */
  }

  public setLastInput(inputs: IInputDescriptor[]) {
    this.lastMapping = inputs;
  }

  public parse(result: IInputDescriptor, decorator: ts.Decorator) {
    const lastMapping = this.lastMapping;
    this.assert(
      !!lastMapping,
      decorator,
      "Input on a class that didn't have a @Control or @Scene decorator",
    );

    const prop = this.getPropertyDeclaration(decorator);
    if (!result.kind) {
      result.kind = this.inferKind(prop);
    }
    if (prop.initializer) {
      result.defaultValue = super.parseLiteralValue(prop.initializer, '');
    }

    lastMapping.push({
      ...result,
      alias: prop.name.getText(),
      propertyName: prop.name.getText(),
    });
  }

  protected parseLiteralValue(value: ts.Node, key: string): JsonType | JsonType[] {
    if (key === 'kind') {
      return this.parseEnumAccess(value, 'InputKind', InputKind);
    }

    return super.parseLiteralValue(value, key);
  }

  private getPropertyDeclaration(decorator: ts.Decorator): ts.PropertyDeclaration {
    let node: ts.Node | undefined = decorator;
    while (node && node.kind !== ts.SyntaxKind.PropertyDeclaration) {
      node = node.parent;
    }
    this.assert(!!node, decorator, 'Expected to be attached to a property declaration');
    return <ts.PropertyDeclaration>node;
  }

  private inferKind(property: ts.PropertyDeclaration): InputKind {
    this.assert(
      !!property.type,
      property,
      'You must either explicitly define a type for your property, or explcitly define ' +
        'one by passing something like { kind: Mixer.InputKind.Number }',
    );

    const type = <ts.TypeNode>property.type;
    switch (type.kind) {
      case ts.SyntaxKind.NumberKeyword:
        return InputKind.Number;
      case ts.SyntaxKind.StringKeyword:
        return InputKind.String;
      case ts.SyntaxKind.BooleanKeyword:
        return InputKind.Boolean;
      default:
      // fall through
    }

    if (isAccessFor('IDimensions', type)) {
      return InputKind.Dimensions;
    }

    this.assert(
      false,
      type,
      `Could not infer the type for ${type.getText()}, please define a kind explicitly`,
    );
    return InputKind.Boolean; // never hit
  }
}

/**
 * MetadataExtractor transverses TypeScript sources and generates an IPackageData
 * struct based off decorators in the code.
 */
export class MetadataExtractor {
  private readonly extractors: DecoratorExtractor<any>[];

  constructor() {
    const inputExtractor = new InputExtractor();

    this.extractors = [
      inputExtractor,
      new ControlExtractor(inputExtractor),
      new SceneExtractor(inputExtractor),
    ];
  }

  public async compile(sourceDir: string): Promise<Partial<IPackageConfig>> {
    return Promise.all(
      glob.sync(path.join(sourceDir, 'src/**/*.{ts,tsx,jsx,js}')).map(async file => {
        return this.parseFile(sourceDir, file);
      }),
    ).then(() => this.gatherResult());
  }

  public async parseFile(sourceDir: string, file: string): Promise<IPackageConfig> {
    return readFile(file)
      .then(contents => {
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
      })
      .then(() => this.gatherResult());
  }

  public parseString(str: string): IPackageConfig {
    this.visit(ts.createSourceFile('string', str, ts.ScriptTarget.ES2015, true));
    return this.gatherResult();
  }

  private gatherResult(): IPackageConfig {
    const metadata: Partial<IPackageConfig> = {};
    this.extractors.forEach(e => {
      e.augment(metadata);
    });
    return <IPackageConfig>metadata;
  }

  private visit(node: ts.Node): any {
    switch (node.kind) {
      case ts.SyntaxKind.Decorator:
        this.extractors.forEach(e => {
          e.guardedParse(<ts.Decorator>node);
        });
      default:
      // noop
    }

    return ts.forEachChild(node, child => this.visit(child));
  }
}
