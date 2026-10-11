# D63, repair round 1

The review is `agents/reviews/D63-refuter.md` (in the main checkout's ledger, `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/D63-refuter.md`). Every rule of the brief `agents/briefs/D63.md` and of `agents/spec.md` still holds. This is the step's one repair round: every ruling below is done in it, and none is handed back as a later item. Run no git command of any kind, read-only ones included.

## Rulings, one per finding

1. **`oculus.file-icons` answers `closed`** (the review's open item (b); ruling Z818, which replaces Z808's listing of `file-icons` among the page commands). `oculus.file-icons` writes `file_icons` of `config/appearance.yml`, and every command that writes configuration is closed to apps. Move the id from the page commands to the closed ones in `data/helpers/files/apps/commands.ts`, remove its branch from `state/system/apps/shell/page-commands.ts`, change the two rows of `tests/state/system/apps/page-commands.test.ts` to one row where `executeCommand('oculus.file-icons', ...)` answers `closed` and `file_icons` is not written, and correct the sentences of `docs/apps.md` that list it (the review's Standards D2: the list of page commands, and "What an app cannot do"). The reader keeps `:file-icons` in Cmd-K.
2. **Spec S1, the rail's chord letters.** An app's keybinding whose first key is a letter that starts one of the workbench's chords (the keys of `order.chords`, built from `nav_groups` and `direct_chord` of `config/layout.yml`) is a key oculus takes, and gets the same finding as every other taken key. The letters come from the configuration the page holds, so the check reads them from there, never from a copy. Correct the false comment at `data/helpers/files/apps/keys/oculus-keys.ts:9-11`. Add a row to the bound-key test (`tests/state/system/apps/app-keys.test.ts`) with real chords (for example `f` from a `nav_groups` entry) where the binding gets the finding, and stop the existing audit rows passing `NO_RAIL` where a chord letter is what the row is about.
3. **Standards D3, the hand-copied table of taken keys** (`oculus-keys.ts:21-110`). The keys oculus takes are read from the code that takes them: `resolveKey` in `shell/keys/keys.ts`, the palette's keys and the desktop menu's accelerators (`desktop/windows/menu.ts`), each exporting what it binds so the check imports it, and the hand-copied table goes. The audit rows of `app-keys.test.ts` then check a key from each source.
4. **Spec S2, closing a panel's tab fires `onDidDispose`.** The page sends the panel under `panel` (`state/system/apps/apps.svelte.ts:485-491`) and the registry reads `view` or `id` (`server/machine/apps/shell/registry.ts:343`). One name for the field in every sender and in the registry, so closing the tab fires `onDidDispose` in the host and takes the panel out of the `app-shell` payload and the host's map. A test row in the shell handler or registry tests drives the page's own message, the shape `apps.svelte.ts` sends, and shows `onDidDispose` fired and the panel gone.
5. **Spec S3, a frame's registrations last until the app's last tab closes**, as item 7 and `DESIGN.md` say. `drop` in `state/system/apps/shell/frames.svelte.ts` removes the items when the last tab of that app closes, not when any one of its tabs does; the head comment follows. A row: an app with two tabs, the status item registered by the first, the first closed: the item stays; the second closed: the item goes.
6. **Proof P1, `tests/shell/panes/strip/app-editor-close.test.ts` fails in the full quick run** because its `vi.mock('penpal', ...)` does not always apply. The test hands `connectFrame` a double through a dependency of `apps.mount` (the spec's "No globals": a dependency is passed in), the module mock goes, and the file passes in the full `npm run test:quick`, run three times after the last change.
7. **Proof P2.** The row "are refused `rate` from the 601st in a minute, and allowed again after the window" (`tests/server/machine/apps/shell/shell-handlers.test.ts:179-180`) asserts the call after `advance(60_001)` is allowed.
8. **Proof P3.** The row in `tests/state/system/apps/page-commands.test.ts:47` either runs the command with both pages present, so "and no other page" is checked by the code that picks the page, or its title drops that half and the report lists it among the audits. Take the first.
9. **Proof P4, the file-scope mutables.** The cache `parsed` in `data/helpers/files/apps/when.ts:24` goes: a clause is parsed where it is evaluated, or held by the store that evaluates clauses. The four new `let` of `state/shared/words/appearance.ts:137-140` (`appThemes`, `appIconThemes`, `fileIcons`, `languages`) are not added to the file's module state: they are held by the store that installs them and passed to the readers, and their four entries in `FROZEN` (`tests/checks/tree/boundaries.test.ts:438-441`) are removed. The spec says a package that adds module state is not landed.
10. **Standards D1, `docs/apps.md:538`.** Rewrite the sentence so it says what is now true: a custom editor's page reads the bytes of the file the reader opened in it through `document.read`, whatever its `files:` names; every other read goes through `fs` within `files`. The section "What an app cannot do" follows.
11. **Behaviour B1, the options of `showXMessage`** (`server/machine/apps/host/runner-shell.mjs:107-108`). As VS Code: the first argument after the message that is an object (not a string, not an item with a `title`) is the options (`modal`, `detail`), so `showInformationMessage('Saved', {}, 'Open')` and one with `{ detail: 'x' }` post one notice whose one action is `Open`. A row in the host's tests for both.
12. **Behaviour B2, the TreeView object reads back** (`runner-shell.mjs:367-368, 386-396`). `selection` and `visible` hold the values the page last sent, set when their events fire, and `title`, `description`, `message` and `badge` read back what was set. A row for each.
13. **Behaviour B3, `affectsConfiguration`** (`runner-shell.mjs:487`). It matches whole dotted segments as VS Code does: `affectsConfiguration('notes')` and `('notes.width')` hold when `notes.width` changed, `('notes.w')` does not. A row.

## Not sent

- Spec S4 (case 10's key `ctrl+alt+j`, taken by the editor): the orchestrator corrects the brief's case 10 to `ctrl+alt+u ctrl+alt+c`, the key the tests use. No change for the builder.
- Standards D4 (read-only git commands run by mistake): noted; this round runs none.
- The three red tests under `tests/checks`: they come from the sparse checkout (the review's Verification), and are run on main at landing.

## Tests

Each ruling that changes behaviour gets its row as named above, inside the test file that already covers that code. Each new row is run on the tree as the first build left it and its failure quoted, then run after the fix and its pass quoted. Every test of a guarded entry the change reaches (`agents/guarded.md`, G28 and G77 among them) is run after the fix and passes.

## Paths this round adds to the brief's list

- `tools/oculus/src/lib/shell/keys/keys.ts`
- `tools/oculus/src/desktop/windows/menu.ts`
- the palette's key module the taken keys are read from
- `tools/oculus/tests/checks/tree/boundaries.test.ts`
- `tools/oculus/tests/server/machine/apps/shell/shell-handlers.test.ts` and the host runner's tests

## Verify before you report

The brief's checks again, after the last change: `npm run test:quick` three full runs, each quoted; `wc -l` and `sh utils/folder-check.sh`; `sh utils/unused-exports.sh` against the base's list; `node utils/migrations/convert-vscode-themes.ts --check`; the slow files the report quotes; and `npx vitest run tests/state/system/apps tests/server/machine/apps tests/shell/panes/strip/app-editor-close.test.ts`.

## Report

Append a section "Repair round 1" to `tools/oculus/.scratch/migration/agents/reviews/D63-report.md` in the worktree: the first line anything NOT done or "Everything in the round is done"; one row per ruling 1 to 13 with the change and its evidence; each new test row's failing run before the fix and passing run after, quoted; the checks' output as printed; the edits to existing test files as a `diff` against the base copy; every visible change with its before and after; limitations and sharp edges.
