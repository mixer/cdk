import { ValidatorFn } from '@angular/forms';

/**
 * Angular form validation function for project name formats.
 */
export const projectNameValidator: ValidatorFn = control => {
  const forbidden = !/^[a-z0-9\-]{2,60}$/i.test(control.value);
  return forbidden ? { projectName: { value: control.value } } : null;
};
