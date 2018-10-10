import { CONF_DEV } from '../environments/environment.dev';
import { CONF_PROD } from '../environments/environment.prod';

// tslint:disable

const ENV: string = 'dev';
const VERSION: string = '1.0.2';

export let AppConfig: {
  production: boolean;
  environment: string;
  version: string;
  builtAt: Date;
} = <any>{
  version: VERSION,
  builtAt: new Date(1524270905074),
};

console.log('environment:', ENV);

if (ENV === 'production') {
  Object.assign(AppConfig, CONF_PROD);
} else {
  Object.assign(AppConfig, CONF_DEV);
}
