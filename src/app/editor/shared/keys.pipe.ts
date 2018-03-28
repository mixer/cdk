import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe that gets the keys from a passed object.
 */
@Pipe({ name: 'keys' })
export class KeysPipe implements PipeTransform {
  public transform(value: object) {
    return Object.keys(value);
  }
}
