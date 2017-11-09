import { DeclarationError } from '../metadata/error';
import { MetadataExtractor } from '../metadata/extractor';
import { IGlobalOptions } from './options';

export default async function(options: IGlobalOptions): Promise<void> {
  const extractor = new MetadataExtractor();
  try {
    await extractor.compile(options.project.baseDir());
  } catch (e) {
    if (e instanceof DeclarationError) {
      process.stdout.write(JSON.stringify(e, null, 2));
      process.exit(1);
    }

    throw e;
  }

  process.stdout.write(JSON.stringify(extractor.gatherResult(), null, 2));
  process.stdout.write('\n');
}
