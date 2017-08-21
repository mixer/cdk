import * as glob from 'glob';
import * as parse5 from 'parse5';
import * as path from 'path';

import { MixerPluginError } from '../errors';
import { createPackage } from '../metadata/metadata';
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
 * IDevEnvironment is the environment structure stored as JSON in the
 * devEnvironmentVar.
 */
export interface IDevEnvironment {
  address: string;
}

/**
 * HomepageRenderer is responsible for modifying and injecting Mixer stdlib
 * scripts into the developer's index.html.
 */
class HomepageRenderer {
  constructor(private readonly filepath: string) {}

  public async render(compiler: any): Promise<string> {
    const projectPath = getProjectPath(compiler.options.output.path);
    if (!projectPath) {
      throw new Error('Could not find your project path, are you missing a package.json?');
    }

    const packaged = await createPackage(projectPath);
    const parsed = await this.getDocument(compiler);
    const head = <parse5.AST.HtmlParser2.ParentNode>this.findNode(parsed, ['html', 'head']);
    if (!head) {
      throw new MixerPluginError('Your homepage is missing a <head> section!');
    }

    if (process.env[devEnvironmentVar]) {
      this.append(
        head,
        `<script>window.self!=window.top||(window.location='/editor.html')</script>`,
      );
    }

    this.append(
      head,
      `<script src="./mixer.js"></script>`,
      `<script>mixer.packageConfig=${JSON.stringify(packaged)}</script>`,
    );

    return parse5.serialize(parsed);
  }

  private async getDocument(compiler: any) {
    let { filepath } = this;
    if (path.resolve(filepath) === path.normalize(filepath)) {
      filepath = path.relative(compiler.options.output.path, filepath);
    }

    const og = await readFile(filepath);

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
  private readonly homeRenderer = new HomepageRenderer(this.options.homepage);

  constructor(private readonly options: IPluginOptions) {}

  public apply(compiler: any) {
    compiler.plugin('emit', async (compilation: any, callback: any) => {
      try {
        await Promise.all([
          this.homeRenderer.render(compiler).then(result => {
            compilation.assets['index.html'] = contentsToAsset(result);
          }),
          this.addFiles(compilation, {
            'mixer.js': path.resolve(__dirname, '../stdlib/mixer.min.js'),
            'editor.html': path.resolve(staticPath, 'editor/index.html'),
            'editor.main.js': path.resolve(__dirname, 'editor/main.bundle.js'),
            'editor.polyfills.js': path.resolve(__dirname, 'editor/polyfills.bundle.js'),
          }),
          this.addStaticAssets(compilation),
        ]);
      } catch (e) {
        callback(e);
        return;
      }

      callback();
    });
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
