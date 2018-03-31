import { isPlainObject } from 'lodash';

const allowedCtors = [Error];

export function jsonifyPlain(obj: any) {
  return JSON.stringify(obj, (_key, value) => {
    if (!value || typeof value !== 'object') {
      return value;
    }
    if (isPlainObject(value) || allowedCtors.some(ctor => value instanceof ctor)) {
      return value;
    }
    if (value.toJSON) {
      return value;
    }

    return `[Complex: ${value.constructor ? value.constructor.name : value}]`;
  });
}
