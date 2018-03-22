import { CONF_DEV } from '../environments/environment.dev';
import { CONF_PROD } from '../environments/environment.prod';

// tslint:disable

const ENV: string = 'potato';

let conf: any;

console.log('environment:', ENV);

if (ENV === 'production') {
  conf = CONF_PROD;
} else {
  conf = CONF_DEV;
}

export const AppConfig: {
  production: boolean;
  environment: string;
} = conf;
