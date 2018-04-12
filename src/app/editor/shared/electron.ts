import { AllElectron } from 'electron';

// Declared in index.html, used as hoisting to avoid webpack/systemjs mangling.
declare const electron: AllElectron;

// tslint:disable-next-line
export const Electron = electron;
