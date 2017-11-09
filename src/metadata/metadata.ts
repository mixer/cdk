import * as Joi from 'joi';

import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { MetadataExtractor } from './extractor';

const inputSchema = Joi.object({
  propertyName: Joi.string().required(),
  alias: Joi.string().required(),
  displayName: Joi.string(),
  kind: Joi.number().required(),
  defaultValue: Joi.any(),
});

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
        inputs: Joi.array()
          .items(inputSchema)
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
        inputs: Joi.array()
          .items(inputSchema)
          .required(),
      }).unknown(),
    )
    .required(),
}).required();

/**
 * createPackage is the top-level function to read source and package files
 * from the directory and combine them into a single config.
 */
export async function createPackage(packageJson: any, baseDir: string): Promise<IPackageConfig> {
  const extractor = new MetadataExtractor();
  await extractor.compile(baseDir);

  const packaged = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    keywords: packageJson.keywords,
    private: packageJson.private,
    homepage: packageJson.homepage,

    ...packageJson.interactive,
    ...extractor.gatherResult(),
  };

  Joi.assert(packaged, packageSchema);

  return packaged; // liftoff!
}
