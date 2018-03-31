import { CONF_DEV } from '../environments/environment.dev';
import { CONF_PROD } from '../environments/environment.prod';

// tslint:disable

const ENV: string = 'dev';
const VERSION: string = '0.2.7';

let conf: any;

console.log('environment:', ENV);

if (ENV === 'production') {
  conf = CONF_PROD;
} else {
  conf = CONF_DEV;
}

conf.version = VERSION;

export const AppConfig: {
  production: boolean;
  environment: string;
  version: string;
} = conf;
