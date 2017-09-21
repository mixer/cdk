import * as Joi from 'joi';

import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { mustLoadPackageJson } from '../npm';
import { MetadataExtractor } from './extractor';

// Quick validation to sanity check that nothing will crash and burn.
// TypeScript will enforce most of this, but some parts come from the
// package.json and not all consumers may be using TypeScript or strict typing.
const packageSchema = Joi.object({
  name: Joi.string()
    .regex(/^[a-z0-9\-]{2,60}/i)
    .required(),
  version: Joi.string().required(),
  description: Joi.string().max(512),
  private: Joi.boolean(),
  homepage: Joi.string().uri(),
  keywords: Joi.array()
    .items(Joi.string().max(32))
    .max(32),

  display: Joi.object({
    mode: Joi.string()
      .valid('fixed-grid', 'flex')
      .required(),
  }),
  controls: Joi.object()
    .pattern(
      /./,
      Joi.object({
        kind: Joi.string().required(),
        inputs: Joi.object()
          .unknown()
          .required(),
      }).unknown(),
    )
    .required(),
  scenes: Joi.object()
    .pattern(
      /./,
      Joi.object({
        default: Joi.boolean(),
        id: Joi.string(),
        inputs: Joi.object()
          .unknown()
          .required(),
      }).unknown(),
    )
    .required(),
}).required();

/**
 * createPackage is the top-level function to read source and package files
 * from the directory and combine them into a single config.
 */
export async function createPackage(dir: string): Promise<IPackageConfig> {
  const packageJson = mustLoadPackageJson(dir);
  const staticData = await new MetadataExtractor().compile(dir);

  const packaged = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    keywords: packageJson.keywords,
    private: packageJson.private,
    homepage: packageJson.homepage,

    ...packageJson.interactive,
    ...staticData,
  };

  Joi.assert(packaged, packageSchema);

  return packaged; // liftoff!
}
