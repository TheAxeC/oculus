# D62: the cases ruling (round 0)

The builder's first run handed back two places where the brief's rules get a case wrong, before any change. Both fixes stay inside the step's part. The builder resumes at once and builds the whole brief under these two rulings; everything else in the brief stands.

## 1. The import guard uses `module.registerHooks`

Item 5's "Only approved code runs" names `module.register` of `node:module` with a `resolve` hook. That hook runs on a separate loader thread and does not see a `require` made through `createRequire`, so the brief's own sentence "A dynamic `import()` and a `require` made through `createRequire` meet the same hook" cannot hold with it.

Checked on Node v24.21.0, the Node that Electron 44.5.1 runs (`ELECTRON_RUN_AS_NODE=1 node_modules/.bin/electron -e "console.log(process.versions.node, typeof require('node:module').registerHooks)"` prints `24.21.0 function`), with a host file that does a dynamic `import()` of an unrecorded file, a `createRequire` `require` of an unrecorded file and an import of `node:fs`:

- `module.register` with a `resolve` hook: `{"dyn":"refused...","req":"loaded","node":"loaded"}`.
- `module.registerHooks({ resolve })`: `{"dyn":"refused...","req":"refused...","node":"loaded"}`.

Ruling: the runner installs the guard with `module.registerHooks({ resolve })` of `node:module`, in the runner's own thread, before it imports the host file. The hook resolves through `next`, then refuses every `file:` URL whose real path is not one of the app's recorded files, with an error that names the refused file and the rule; `node:` built-ins pass. The set of recorded real paths is held in the hook's closure, passed to the runner by the server at start. Static `import`, dynamic `import()` and `require` through `createRequire` all meet this hook, and case tests cover each of the three. `module.register` is not used.

## 2. The runner is the tree file of item 5; decision 10 is dropped

Item 5 says the runner is `host-runner.mjs` in the apps folder's host subfolder, started from `ownFolder()` as `eslint-child.mjs` is (`src/lib/server/machine/runs/lint/eslint.ts:45`, `ownFolder()` at `src/lib/server/machine/lsp/servers.ts:401`, which walks up from the module to the folder holding `package.json`; `comment-worker.mjs` is started the same way at `src/lib/server/machine/runs/lint/writing/comments.ts:113`). Decision 10 says the runner is written at server start to a 0700 folder of the OS temporary folder and removed at close, on the premise that a build has no `src` on disk. That premise is false for this tree: the lint child and the comment worker already run from `src` through `ownFolder()` in every build oculus runs. The two texts contradict each other.

Ruling: follow item 5. The runner is `src/lib/server/machine/apps/host/host-runner.mjs`, started as `join(ownFolder(), 'src/lib/server/machine/apps/host/host-runner.mjs')`. Decision 10 is dropped: no temporary folder, no write of the runner at start, no removal at close, and no test of either.
