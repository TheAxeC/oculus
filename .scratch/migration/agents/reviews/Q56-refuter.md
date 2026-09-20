# Q56 review, read-only

NOT DONE: Q56 has five findings. The browser and revert gates were not independently reproduced because the read-only reviewer could not unlink `test-results/.last-run.json` or build the revert checker's temporary trees.

## Verification

- `git diff 521c938c`: read in full, including every new file.
- `npx vitest run tests/state/fs.test.ts tests/views/files.test.ts tests/server/watch/bookmarks.test.ts tests/server/context.test.ts --reporter=dot`: 4 files, 107 tests passed.
- `npx vitest run tests/server/watch/bookmarks.test.ts --reporter=dot`: 1 file, 4 tests passed.
- `npx vitest run tests/size.test.ts tests/duplication.test.ts --reporter=dot`: 2 files, 15 tests passed; finding 1 explains why this is not sufficient evidence for the size change.
- `npx vitest run --reporter=dot`: 4 files failed and 256 passed; 4 tests failed and 4,369 passed. Three failures came from the incorrectly narrow sparse worktree; `tests/scratch.test.ts` timed out and was not rerun alone.
- `npm run check`: 0 errors and 0 warnings.
- `npm run build`: client and SSR builds and adapter-node completed.
- `npm run format:check`: clean.
- `npm run lint`: clean.
- `bash bin/size-check.sh`: clean; finding 1 applies.
- The brief's ASCII gate: no output.
- `python3 -c "import yaml; yaml.safe_load(open('config/text/views/files.yml')); print('yaml ok')"`: `yaml ok`.
- Both requested Playwright commands: not checked because the read-only runner could not unlink `test-results/.last-run.json`.
- Node reverts: 31 unproven because every selected case did not run in the temporary tree.
- Browser reverts: seven unproven because the temporary reverted build was refused.
- `wc -l src/lib/server/watch/bookmarks.ts`: 101.

## Spec

1. `bin/size-allow.txt:4` adds exemptions for `tests/state/fs.test.ts`, `tests/views/files.test.ts`, `src/lib/state/fs.svelte.ts` and `tests/browser/files.spec.ts`. The brief does not include this path and the standing spec forbids loosening a threshold or predicate to obtain a green check. Split the store and tests so the gate stays green without the four new exemptions.

## Proof

2. `tests/state/fs.test.ts:773` delivers the bookmark message, calls `client.fs.bookmarks()`, and only then delivers the later root message. It does not leave a sink send unresolved, publish the bookmark event, publish a root event, and prove that the bookmark event survives. Add that exact backpressure ordering.

3. Q56-report states that `src/lib/server/watch/bookmarks.ts` has 100 lines; `wc -l` reports 101. Correct the report's changed-file evidence.

## Standards

4. `tests/server/watch/bookmarks.test.ts:1` opens with `// watchBookmarks against a bookmarks file in a temporary directory.` The standing spec requires the added test module to open with its layer. Add the `Layer 4, test` head comment.

## Behaviour

5. `server/channels.ts:114` replaces a pending message for a channel when no merge function is registered. `server/watch/bookmarks.ts:69` publishes `{ root: '', bookmarks: true }` on the latest-only `files` channel, and no merge is registered for `files`. A later root event can replace the pending bookmark event before `state/fs.svelte.ts:451` observes it, so the page never rereads the bookmark file. Preserve the bookmark-change marker when pending `files` messages merge, and prove the exact ordering from finding 2.

## Unchecked

- The two requested Playwright checks.
- The node and browser revert checks.
- A live TEST-page look.

## Usage

Unavailable in this runtime.
