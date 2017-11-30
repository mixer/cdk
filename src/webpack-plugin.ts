import * as glob from 'glob';
import * as json5 from 'json5';
import * as parse5 from 'parse5';
import * as path from 'path';

import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { MixerPluginError } from './server/errors';
import { createPackage } from './server/metadata/metadata';
import { getProjectPath, mustLoadPackageJson } from './server/npm';
import { readFile, wrapErr } from './server/util';

// webpack typings are pretty much useless here :(

export interface IPluginOptions {
  /**
   * Path to the HTML page to serve content from.
   */
  homepage: string;

  /**
   * glob for the locale json files.
   */
  locales: string;
}

/**
 * Environment variable set when the webpack process is spawned from `miix serve`.
 */
export const devEnvironmentVar = '__MIIX_DEV_SERVER';

/**
 * The path to the "static" folder relative to this module.
 */
const staticPath = path.resolve(__dirname, '../../static');

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

    this.prepend(head, ...(await this.injectHead(compiler)));
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

  private prepend(parent: parse5.AST.HtmlParser2.Node, ...elements: string[]) {
    if (!(<any>parent).childNodes) {
      throw new Error('Attempted to append to non-parent node');
    }

    const casted = <parse5.AST.HtmlParser2.ParentNode>parent;
    elements.forEach(element => casted.childNodes.unshift(this.stringToNode(element)));
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
  constructor(
    filepath: string,
    private readonly packaged: IPackageConfig,
    private readonly locales: string[],
  ) {
    super(filepath);
  }

  protected async injectHead(): Promise<string[]> {
    const output: string[] = [];

    if (process.env[devEnvironmentVar]) {
      output.push(`<script>window.self!=window.top||(window.location='/editor.html')</script>`);
    }

    output.push(
      `<script>window.mixerPackageConfig=${JSON.stringify(this.packaged)};` +
        `window.mixerLocales=${JSON.stringify(this.locales)}</script>`,
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
 * The LocalePackager takes a glob on the filesystem and returns a map of
 * locale names to their parsed data.
 */
class LocalePackager {
  constructor(private readonly compilation: any) {}

  /**
   * compile loads locales matching the glob pattern to a map of locales
   * (from the file basenames) to their contents.
   */
  public async compile(pattern: string): Promise<{ [locale: string]: object }> {
    const files = glob.sync(pattern);
    const output: { [locale: string]: object } = {};

    await Promise.all(
      files.map(async file => {
        const contents = await readFile(file);

        let parsed: object;
        try {
          parsed = json5.parse(contents);
        } catch (err) {
          throw new MixerPluginError(`Could not parse ${file}: ${err.message || err}`);
        }

        this.compilation.fileDependencies.push(file);
        output[path.basename(file, path.extname(file))] = parsed;
      }),
    );

    return output;
  }

  /**
   * Adds the compile()'d locale data to the webpack compilation,
   * in the locales folder.
   */
  public addToCompilation(data: { [locale: string]: object }) {
    Object.keys(data).forEach(key => {
      this.compilation.assets[`locales/${key}.json`] = contentsToAsset(JSON.stringify(data[key]));
    });
  }
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
    const projectPath = getProjectPath(compiler.options.context);
    if (!projectPath) {
      throw new Error('Could not find your project path, are you missing a package.json?');
    }

    compiler.plugin('emit', async (compilation: any, callback: any) => {
      try {
        const packageJson = mustLoadPackageJson(projectPath);
        this.package = await createPackage(packageJson, projectPath);

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
        'editor.main.js': path.resolve(__dirname, 'ui/editor/main.bundle.js'),
        'editor.polyfills.js': path.resolve(__dirname, 'ui/editor/polyfills.bundle.js'),
      }),
      this.addStaticAssets(compilation),
    ]);
  }

  private async addProductionFiles(compiler: any, compilation: any): Promise<void> {
    const packager = new LocalePackager(compilation);
    const locales = await packager.compile(this.options.locales);
    packager.addToCompilation(locales);

    await Promise.all([
      new HomepageRenderer(this.options.homepage, this.package, Object.keys(locales))
        .render(compiler)
        .then(result => {
          compilation.assets['index.html'] = contentsToAsset(result);
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
