import * as glob from 'glob';
import * as parse5 from 'parse5';
import * as path from 'path';

import { MixerPluginError } from '../errors';
import { createPackage } from '../metadata/metadata';
import { IPackageConfig } from '../metadata/package';
import { getProjectPath } from '../npm';
import { readFile, wrapErr } from '../util';

// webpack typings are pretty much useless here :(

export interface IPluginOptions {
  /**
   * Path to the HTML page to serve content from.
   */
  homepage: string;
}

/**
 * Environment variable set when the webpack process is spawned from `miix serve`.
 */
export const devEnvironmentVar = '__MIIX_DEV_SERVER';

/**
 * The path to the "static" folder relative to this module.
 */
const staticPath = path.resolve(__dirname, '../../../static');

/**
 * Path prefix for miix dev server assets.
 */
const devAssetPrefix = '__miix_static';

/**
 * The HTMLInjector is a helper that is able to inject HTML fragments into
 * an HTML document.
 */
abstract class HTMLInjector {
  constructor(private readonly filepath: string) {}

  public async render(compiler: any): Promise<string> {
    const parsed = await this.getDocument();
    const head = <parse5.AST.HtmlParser2.ParentNode>this.findNode(parsed, ['html', 'head']);
    if (!head) {
      throw new MixerPluginError('Your homepage is missing a <head> section!');
    }

    this.append(head, ...(await this.injectHead(compiler)));
    return parse5.serialize(parsed);
  }

  /**
   * injectHead returns a list of HTML fragments to insert into the page <head>.
   */
  protected async injectHead(_compiler: any): Promise<string[]> {
    return [];
  }

  private async getDocument() {
    const og = await readFile(this.filepath);

    try {
      return <parse5.AST.HtmlParser2.Document>parse5.parse(og);
    } catch (e) {
      throw wrapErr(e, 'Could not parse HTML from your homeage');
    }
  }

  private append(parent: parse5.AST.HtmlParser2.Node, ...elements: string[]) {
    if (!(<any>parent).childNodes) {
      throw new Error('Attempted to append to non-parent node');
    }

    const casted = <parse5.AST.HtmlParser2.ParentNode>parent;
    elements.forEach(element => casted.childNodes.push(this.stringToNode(element)));
  }

  private stringToNode(src: string): parse5.AST.HtmlParser2.Node {
    const fragment = <parse5.AST.HtmlParser2.DocumentFragment>parse5.parseFragment(src);
    return fragment.childNodes[0];
  }

  private findNode(
    parent: parse5.AST.HtmlParser2.Node,
    nodePath: string[],
  ): parse5.AST.HtmlParser2.Node | undefined {
    for (let i = 0; i < nodePath.length; i++) {
      if (!(<any>parent).childNodes) {
        return undefined;
      }

      const child = (<parse5.AST.HtmlParser2.ParentNode>parent).childNodes.find(
        n => (<parse5.AST.HtmlParser2.Element>n).tagName === nodePath[i],
      );

      if (!child) {
        return undefined;
      }

      parent = child;
    }

    return parent;
  }
}

/**
 * HomepageRenderer is responsible for modifying and injecting Mixer stdlib
 * scripts into the developer's index.html.
 */
class HomepageRenderer extends HTMLInjector {
  constructor(filepath: string, private readonly packaged: IPackageConfig) {
    super(filepath);
  }

  protected async injectHead(): Promise<string[]> {
    const output: string[] = [];

    if (process.env[devEnvironmentVar]) {
      output.push(`<script>window.self!=window.top||(window.location='/editor.html')</script>`);
    }

    output.push(
      `<script src="./mixer.js"></script>`,
      `<script>mixer.packageConfig=${JSON.stringify(this.packaged)}</script>`,
    );

    return output;
  }
}

/**
 * EdtiroRenderer is responsible for injecting the address of the dev server
 * into the editor's HTML.
 */
class EditorRenderer extends HTMLInjector {
  protected async injectHead(): Promise<string[]> {
    return [`<script>window.miixDev=${process.env[devEnvironmentVar]}</script>`];
  }
}

interface IWebpackFile {
  source(): string | Buffer;
  size(): number;
}

function contentsToAsset(contents: string | Buffer): IWebpackFile {
  return {
    source: () => contents,
    size: () => contents.length,
  };
}

async function fileToAsset(...segments: string[]): Promise<IWebpackFile> {
  return readFile(path.resolve(...segments)).then(contentsToAsset);
}

/**
 * MixerPlugin is the webpack plugin to handle packaging Interactive output
 * to ship and develop with. Primarily, it modifies the user-provided
 * HTML page to insert the Mixer standard library and additional controls
 * in development mode.
 */
export class MixerPlugin {
  private package: IPackageConfig;
  constructor(private readonly options: IPluginOptions) {}

  public apply(compiler: any) {
    const projectPath = getProjectPath(compiler.options.output.path);
    if (!projectPath) {
      throw new Error('Could not find your project path, are you missing a package.json?');
    }

    compiler.plugin('emit', async (compilation: any, callback: any) => {
      try {
        this.package = await createPackage(projectPath);

        const todo: Promise<void>[] = [this.addProductionFiles(compiler, compilation)];
        if (process.env[devEnvironmentVar]) {
          todo.push(this.addEditorFiles(compiler, compilation));
        }
        await Promise.all(todo);
      } catch (e) {
        callback(e);
        return;
      }

      callback();
    });
  }

  private async addEditorFiles(compiler: any, compilation: any): Promise<void> {
    await Promise.all([
      new EditorRenderer(path.resolve(staticPath, 'editor/index.html'))
        .render(compiler)
        .then(result => {
          compilation.assets['editor.html'] = contentsToAsset(result);
        }),
      this.addFiles(compilation, {
        'editor.main.js': path.resolve(__dirname, 'editor/main.bundle.js'),
        'editor.polyfills.js': path.resolve(__dirname, 'editor/polyfills.bundle.js'),
      }),
      this.addStaticAssets(compilation),
    ]);
  }

  private async addProductionFiles(compiler: any, compilation: any): Promise<void> {
    compilation.assets['miix-package.json'] = contentsToAsset(JSON.stringify(this.package));

    await Promise.all([
      new HomepageRenderer(this.options.homepage, this.package).render(compiler).then(result => {
        compilation.assets['index.html'] = contentsToAsset(result);
      }),
      this.addFiles(compilation, {
        'mixer.js': path.resolve(__dirname, '../stdlib/mixer.min.js'),
      }),
    ]);
  }

  private async addStaticAssets(compilation: any): Promise<void> {
    const mapping: { [assetName: string]: string } = {};
    const editorAssets = path.resolve(staticPath, 'editor/assets');
    glob.sync(path.resolve(staticPath, 'editor/assets/**/*')).forEach(file => {
      compilation.fileDependencies.push(file);
      const relative = path.relative(editorAssets, file);
      mapping[`${devAssetPrefix}/${relative}`] = file;
    });

    return this.addFiles(compilation, mapping);
  }

  private async addFiles(compilation: any, files: { [assetName: string]: string }): Promise<void> {
    return Promise.all(
      Object.keys(files).map(async assetName =>
        fileToAsset(files[assetName]).then(asset => {
          compilation.assets[assetName] = asset;
          compilation.fileDependencies.push(files[assetName]);
        }),
      ),
    ).then(() => undefined);
  }
}
