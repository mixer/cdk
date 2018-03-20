import { readFileSync, writeFileSync } from 'fs';

const profile = process.env.ENV ? process.env.ENV : 'dev';

const contents = readFileSync(`${__dirname}/../editor/editor.config.ts`, 'utf-8');
contents.replace(/^const ENV.+/, `const ENV: string = '${profile}'`);
writeFileSync(`${__dirname}/../editor/editor.config.ts`, contents);
