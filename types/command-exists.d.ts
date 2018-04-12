declare module 'command-exists' {
  namespace exists {

  }

  function exists(path: string, callback: (err: Error | null, exists: boolean) => void): void;

  export = exists;
}
