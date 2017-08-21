export function mapSet<T, R>(set: Set<T>, fn: (value: T) => R): R[] {
  const output: R[] = [];
  set.forEach(key => output.push(fn(key)));
  return output;
}

export function mapMap<K, V, R>(map: Map<K, V>, fn: (value: V, key: K) => R): R[] {
  const output: R[] = [];
  map.forEach((value, key) => output.push(fn(value, key)));
  return output;
}

export function forKeys<T>(obj: T, fn: (key: keyof T) => void) {
  Object.keys(obj).forEach(fn);
}

export function omit<T>(obj: T, values: (keyof T)[]): T {
  const output = <T>{};
  Object.keys(obj).forEach((key: keyof T) => {
    if (values.indexOf(key) === -1) {
      output[key] = obj[key];
    }
  });

  return output;
}
