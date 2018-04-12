# Contributing

The CDK is developed actively, and we welcome any contribution you can provide!

## Discuss your Changes

 - First of all, [open an issue](https://github.com/mixer/cdk/issues/new) in the repository, describing the contribution you would like to make, the bug you found, or any other ideas you have. This will help us to get you started on the right foot.

  - Note: if you're reporting a bug that you can reproduce within the CDK, please use the "Report an Issue" button under the Help menu. This will provide us with some more information about your editor state to pinpoint the issue.

 - It is recommended to wait for feedback before continuing to next step. However, if the issue or its solution is clear and the fix is simple, feel free to continue and fix it.

## Make Your Changes

1. Fork the mixer/cdk repo, clone it, and run `npm install` to grab your dependencies.
2. Make your changes in a new git branch:

     ```shell
     git checkout -b my-fix-branch master
     ```

3. Make your changes.
4. Run `npm start` to boot the editor and validate your changes locally.
5. Run `npm run fmt` to ensure the code follows our style. and ensure that all tests pass.
6. Commit your changes using a descriptive commit message that follows our [commit message convenstyletions](http://karma-runner.github.io/2.0/dev/git-commit-msg.html).

     ```shell
     git commit -a
     ```
    Note: the optional commit `-a` command line option will automatically "add" and "rm" edited files.

7. Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

8. In GitHub, send a pull request to `cdk:master`. If we suggest changes then:

   * Make the required updates.
   * Re-run `npm run fmt`
   * Commit your changes and run `git push`

## Project Architecture

The CDK, formerly codename `miix`, is an Electron application. Electron runs code in two processes, the renderer and main process. The renderer is a fairly vanilla Chromium frame, the main process is a Node.js process. UI logic is written in Angular 5 with state managed by [ngrx](http://ngrx.github.io/), essentially Redux (with more standard library) for Angular. UI elements are sourced from Angular Material, with layout primitives copied from the Mixer UI library. We make heavy use of rxjs. Resources:

 - [Learn RxJS](https://www.learnrxjs.io/)
 - [Comprehensive Introduction to @ngrx/store](https://gist.github.com/btroncone/a6e4347326749f9385100)
 - [Angular Material](https://material.angular.io/)

The renderer makes calls to the main process via the ElectronService, which enters in `src/server/electron-server.ts. The ElectronService puts a light RPC layer atop Electron's IPC. Operations are disparate but all pretty simple.
