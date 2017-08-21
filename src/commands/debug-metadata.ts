import { MetadataExtractor } from '../metadata/extractor';

import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions): Promise<void> {
  const result = await new MetadataExtractor().compile(options.project);
  process.stdout.write(JSON.stringify(result, null, 2));
  process.stdout.write('\n');
}
