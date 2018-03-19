import { readFileSync, writeFileSync } from 'fs';

const profile = process.env.ENV ? process.env.ENV : 'local';

const contents = readFileSync(`${__dirname}/../editor/editor.config.ts`, 'utf-8');
contents.replace(/^const ENV.+/, `const ENV = '${profile}'`);
writeFileSync(`${__dirname}/../editor/editor.config.ts`, contents);
