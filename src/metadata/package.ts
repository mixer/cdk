import { IControlOptions, ISceneOptions } from './decoration';

/**
 * IPackageConfig describes the configuration you write in the "interactive"
 * section of your package.json. It's injected automatically when your
 * controls boot.
 */
export interface IPackageConfig {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  private?: boolean;
  homepage?: string;

  display: {
    mode: 'fixed-grid' | 'flex';
  };
  controls: {
    [id: string]: IControlOptions;
  };
  scenes: {
    [id: string]: ISceneOptions;
  };
}
