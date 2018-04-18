import { CONF_DEV } from '../environments/environment.dev';
import { CONF_PROD } from '../environments/environment.prod';

// tslint:disable

const ENV: string = 'dev';
const VERSION: string = '0.2.8';

export let AppConfig: {
  production: boolean;
  environment: string;
  version: string;
} = <any>{
  version: VERSION,
};

console.log('environment:', ENV);

if (ENV === 'production') {
  Object.assign(AppConfig, CONF_PROD);
} else {
  Object.assign(AppConfig, CONF_DEV);
}
