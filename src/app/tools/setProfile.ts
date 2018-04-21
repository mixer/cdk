import { readFileSync, writeFileSync } from 'fs';

const profile = process.env.ENV ? process.env.ENV : 'dev';
const packageJson = require('../../../package.json');

let contents = readFileSync(`${__dirname}/../editor/editor.config.ts`, 'utf-8')
  .replace(/^const ENV.+/m, `const ENV: string = '${profile}';`)
  .replace(/^const VERSION.+/m, `const VERSION: string = '${packageJson.version}';`);

if (profile === 'production') {
  contents = contents.replace(/^ {2}builtAt: new.+/m, `  builtAt: new Date(${Date.now()}),`);
}

writeFileSync(`${__dirname}/../editor/editor.config.ts`, contents);
