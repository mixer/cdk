import { ValidatorFn } from '@angular/forms';

/**
 * Angular form validation function for project name formats.
 */
export const projectNameValidator: ValidatorFn = ({ value }) => {
  if (value.length < 2 || value.length > 60) {
    return { length: { value } };
  }
  const forbidden = !/^[a-z0-9\-]{2,60}$/i.test(value);
  return forbidden ? { projectName: { value } } : null;
};
