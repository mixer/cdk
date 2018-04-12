import { AppConfig } from '../editor.config';

export const rg4js = require('raygun4js');

rg4js('apiKey', 's0KXF1Y0tqbunuRaP1r5Gg==');
rg4js('setVersion', AppConfig.version);
rg4js('enableCrashReporting', true);
rg4js('enablePulse', true);
