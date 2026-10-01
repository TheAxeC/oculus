# Step Q88b refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q88b, base 5ef2a351)

Overall: the verify list is green and every number in the builder's report reproduces. Four defects stand, in this order: (1) `protected` (config/local.yml) is bypassed by spelling the name in another letter case on this machine's case-insensitive volume (reproduced, deletes the file); (2) the name input refuses `lib/new.ts` whenever `lib` exists, which VS Code and the server both allow; (3) the delete question says "and its contents" for a link to a folder, which brief item 11 rules out and the report does not mention; (4) two documents are wrong or incomplete (HELP.md:164 overclaims what Find in Folder searches; README.md:13 omits `trash`). Z156 (the `refused` field beside `error` in the 400 body of GET /api/search) is judged as ruled and raises nothing.

Method notes. I changed nothing in the worktree except what the verify list itself writes (build outputs; `docs/diagrams` regenerated to the same bytes as before my run: `git diff 5ef2a351 --stat -- tools/oculus/docs` is identical before and after). I did not run `npm run test:slow` (spec.md "Token discipline" forbids a step to run it, and the refute skill lists a suite the brief does not name as an anti-pattern). For two reproductions I used throwaway copies of the worktree under the session scratchpad (never the worktree itself). I used no browser, no server, no port 8787/8790, nothing under config/local.yml (no file named local.yml in the real tree was opened; the probe used a scratch fixture file).

## Verification (rerun by the reviewer)

From `.agents/worktrees/Q88b/tools/oculus`, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`:

```
$ npm run diagrams
docs/diagrams/channels.dot
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
diagrams exit 0

$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  378 passed | 20 skipped (398)
      Tests  6201 passed | 614 skipped (6815)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
checks exit 0
```

Commands the builder's report quotes, rerun, same results:

```
npx vitest run tests/data/file-ops.test.ts tests/server/files/ops.test.ts tests/server/files/ops-paste.test.ts
  Test Files  3 passed (3) / Tests  65 passed (65)
npx vitest run tests/routes/files tests/data/helpers/search.test.ts tests/server/files/search.test.ts tests/state/sources/search.test.ts
  Test Files  10 passed (10) / Tests  211 passed (211)
npx vitest run tests/state/sources
  Test Files  21 passed (21) / Tests  409 passed (409)
npx vitest run tests/views/sources/files tests/views/sources/search tests/views/personal tests/ui/menu tests/ui/theme tests/views/whole/type-scale.test.ts
  Test Files  21 passed (21) / Tests  499 passed (499)
npx vitest run tests/state/client tests/state/life
  Test Files  17 passed (17) / Tests  274 passed (274)
wc -l Files.svelte Diff.svelte      -> 539 and 535 (limit 540)
grep -rn "from 'trash'" tests       -> nothing, exit 1 (the library is only vi.mock'ed: ops.test.ts:42, ops-paste.test.ts:30)
LC_ALL=C grep -rna "[^ -~]" src tests DESIGN.md HELP.md config/text/views/sources/files.yml config/text/views/sources/search.yml  -> nothing, exit 1
sh utils/folder-check.sh            -> exit 0
grep -rhoE "\(case [0-9]+\)" tests/server/files/ops.test.ts tests/server/files/ops-paste.test.ts  -> cases 1 to 28 all present
```

The report's search-fix claim reproduces: with the two lines of `search.svelte.ts` that read `held.refused` removed (scratch copy), `tests/state/sources/search.test.ts` fails with `expected 'the folder is not there' to be 'That folder is not there.'`.

First run on the unchanged tree, redone in the final form of the tests: I copied the worktree to the scratchpad, reverse-applied `git diff 5ef2a351 -- tools/oculus/src tools/oculus/config tools/oculus/package.json`, removed the new untracked source files, kept all new and changed tests, and ran the 16 changed or new test files: 557 tests, 468 passed, 89 failed, 45 suites failed or could not load (new test files import modules that do not exist there). The only tests of the step that pass on the unchanged tree are the ones the report names as behaviour-preserving: "Reveal in Finder for a file reveals a file or a folder with -R, the path last", "... reveals a folder asked for with reveal, and refuses a missing path, a path out of its root and a root not served", and "gives every item of every row an id of its own" (twice); plus the 24 tests of `tests/state/sources/explorer/explorer.test.ts`, which is the moved existing file.

## Verdicts

Items of the brief's "What to build":

- 1: holds. `src/lib/data/file-ops.ts` has the name rule, `freeName`, the refusal union with the listed words, `TEXT_LIMIT` and `MAX_UPLOAD_BYTES` once (`memories.ts` and `state/life/memories.ts` re-export it; `tests/state/life` passes), and the boundaries row and DESIGN.md:171 name it.
- 2: violated, Behaviour finding 1 (the `protected` rule is bypassed by a different letter case). The rest of the item (route, zod shape, `opsWrites`, create, rename, trash, delete, paste, upload, refusal order, trash as a parameter, no change-log record) holds: `tests/server/files/ops.test.ts` and `ops-paste.test.ts`, 65 passed.
- 3: holds (`handleCompare`, `ops.ts:537-561`; case 28 tests).
- 4: holds (`repositories.ts` `against`, `diffUrl`, `diffActs`, `heldDiff`, pane id `compare@...`; `compare-words.ts`; `Diff.svelte` 535 lines).
- 5: holds (`OpenTarget` `reveal`, `openable`, `openArgs`, `revealPath`, file-row item; DESIGN.md:402).
- 6: holds in code (`under`, `refusalOf`, `scopeRefusal`, `searchArgs`, the scope line and clear control, root change clears `under`). The text HELP.md:164 states about it is wrong, Standards finding 2.
- 7: violated in one clause, Spec finding 3 (a cut paste whose request never reached the server keeps the clipboard; the brief says the clipboard is cleared when the paste fails). The builder reported this. Everything else holds (`explorer/ops.svelte.ts`, `relistFolder`, late answers, concurrent pastes).
- 8: holds (`row-menu.ts` groups; root without Cut, Copy, Rename..., Delete as ruled; `rowFacts` takes the three new facts).
- 9: violated, Spec finding 1 and Behaviour finding 2 (the "name taken" message tests the first segment of a typed name, not the name). The pending row as a `treeRows` row, the instance state `naming` and `NameInput`/`NameField` hold as far as a read settles them.
- 10: holds. `follow.ts` restates source, file, document and diff tabs, keeps a source draft, and follows the Files view's open folders and selected row and the bookmarks; a tab over a trashed file is left open. The `doc` view (no `root`) is not followed and the report says why (`catalogue.ts` `followDoc` would undo it).
- 11: violated, Spec finding 2 (a link to a folder gets the folder message). The other words, buttons and details hold and match VS Code's source (checked against `fileActions.ts` at e4f7a6f2 lines 90, 121, 176, 227-229, 277-281, 489).
- 12: holds (`ui/forms/file-data.ts` shared by `Memories.svelte` and `row-ops.ts`; size check before reading; replace question per file; final line).
- 13: holds (`--tree-cut-opacity: 0.5` in `tokens.css`, `data-cut` on the row).
- 14: holds (`files.yml`, `search.yml`; `keys.test.ts` inside `test:checks` passes, so every key has a reader).
- 15: partial. The listed documents are changed (DESIGN.md 148, 171, 376, 378, 379, 384, 402; HELP.md 3, 43, 111, 164; `json.ts` comment) but HELP.md:164 states something the code does not do (Standards finding 2). README.md:13 is outside the item's list and is Standards finding 1.

Cases of the brief's "Cases":

- 1 to 23, 25 to 28: met. Each is a test in `tests/server/files/ops.test.ts` or `ops-paste.test.ts` with its number in the title; all pass (65 tests); each fails to load on the unchanged tree (no `file-ops.ts`, no `fs/ops.ts`). Case 3 asserts `exists` for `README.md` over `readme.md` because this volume is case-insensitive (the test branches on `INSENSITIVE`).
- 24: met as written (each listed route, the link to the folder, the link to the file). The rule it tests does not hold for another spelling of the name, Behaviour finding 1; the case has no test for it. verdict: item 2 violated.
- 29: met (`open-program.test.ts`, `open.test.ts`; two reveal tests pass on the unchanged tree because they test kept behaviour, as the report says; the rest fail there).
- 30: met (`search.test.ts` data and server, routes; all fail on the unchanged tree except the unchanged-behaviour ones).
- 31: met under the ruling (root: no Cut, Copy, Rename..., Delete; Find in Folder... and no Find in Workspace...), `files-menu.test.ts`.
- 32: met.
- 33: met (`tests/data/file-ops.test.ts`; 128 x e-acute and a 100-character CJK name accepted, 256 characters refused, per the ruling).
- 34, 35, 36, 37, 38: met (`tests/state/sources/explorer/ops.test.ts`, 34 tests, all fail on the unchanged tree).
- 39: met (`diff-view.test.ts`).
- 40: met (`tests/state/sources/search.test.ts`).
- 41: met (`files-ops.test.ts` compare words).
- 42: met (`files-ops.test.ts` upload over a fake chooser).

## 1. Spec

1. `src/lib/views/sources/files/tree/row-ops.ts:221-223`: "`const shown = text.replace(/^\t+|\t+$/g, '').replace(/[\\/]+$/, ''); const first = shown.split(/[\\/]/).find((one) => one !== '') ?? ''; if (taken(first)) return { text: t('files.name_taken', shown), error: true };`" (pinned by `tests/views/sources/files/files-naming.test.ts:70-77`, "asks the folder about the first segment of a name with several"). What is wrong: item 9 asks for VS Code's message for "a name taken in that folder"; VS Code's `validateFileName` (`fileActions.ts` at e4f7a6f2, line 737-745, fetched with curl) asks `parent?.getChild(name)` with the whole well-formed name, so `lib/new.ts` is not "taken" because `lib` exists. Failure scenario: right-click a folder that holds `lib`, choose New File..., type `lib/new.ts`; the box shows "A file or folder 'lib/new.ts' already exists at this location" as an error, Enter keeps the box, leaving it cancels; yet the server (`createItem`, `walkTo`) would create `lib/new.ts` and VS Code does. The same blocks `New Folder...` with `lib/sub`. verdict: item 9 violated.
2. `src/lib/views/sources/files/tree/row-ops.ts:141` and `Tree.svelte:416` (`explorer.unsaved(..., row.kind === 'dir')`), via `Questions.svelte:22-25`: "`folder: row.kind === 'dir'`" chooses the "and its contents" message. What is wrong: item 11 says "a link to a folder takes the file message" (VS Code `fileActions.ts:277`: `isDirectory && !isSymbolicLink`). The listing follows links (`server/files/fs.ts` `described`, `statSync`) and carries no link flag, so a link to a folder arrives as `kind: 'dir'` and gets the folder question; the report neither builds this nor says it cannot be built. Failure scenario: a link `docs -> ../shared/docs` inside a root; Delete asks "Are you sure you want to delete 'docs' and its contents?" and the reader believes the folder behind the link is deleted, when only the link goes to the Trash. verdict: item 11 violated.
3. `src/lib/state/sources/explorer/ops.svelte.ts:350`: "`if (!answered(outcome)) return outcome;`" (before the clipboard is cleared at `:376`). What is wrong: item 7 says a cut paste "clears the clipboard when it succeeds and when it fails"; here a network failure keeps it. The builder states this in its report as a judgment call ("nothing was moved"). It is a departure from a clear rule in the brief; no test covers the network case. Failure scenario: Cut, Paste while the server is down, the page says "The server could not be reached." and the item stays faded as Cut, where the brief expects the Cut cleared. verdict: item 7 violated (one clause); the orchestrator can rule it either way.

## 2. Proof

1. The report's "cases' first run" lists eleven test files in an earlier form. `tests/state/sources/explorer/naming.test.ts`, `tests/views/sources/files/files-naming.test.ts`, `tests/server/files/ops-paste.test.ts` and `ops-fixture.ts` (split out later) and the final form of every changed test have no failing run quoted. My rerun of the final forms on the unchanged source (Verification, last paragraph) shows they fail there, so the claim is true; the report should quote it. No verdict; low.
2. `tests/server/files/ops-paste.test.ts:299-436` (case 24) uses the exact spelling `local.yml` only. What is wrong: a test fitted to the implementation's string compare; it could not have failed for Behaviour finding 1. Failure scenario: as Behaviour finding 1. verdict: case 24 met as written, item 2 violated.

## 3. Standards

1. `README.md:13`: "The runtime dependencies, with their licences: `dompurify` ... `d3-force` (ISC) ... and `cloc` (GPL-2.0) ...". What is wrong: `package.json` gains `"trash": "^10.1.1"` (MIT, `node_modules/trash/package.json:5`) and the diff does not touch README.md; the spec rule "after changing a name, a construct or a shape, grep it across ... README.md" and the sentence made false by the diff apply (the lockfile also gains 58 packages, `git diff 5ef2a351 -- package-lock.json | grep -cE '^\+ +"node_modules/'` prints 58; the report states only `+707 / -8`). Failure scenario: a reader checking licences from README.md misses the dependency that moves files to the Trash.
2. `HELP.md:164`: "A folder chosen with Find in Folder... in the Files view is the exception: it is searched whole, hidden and ignored files included, as ripgrep searches a path it is given". What is wrong: ripgrep exempts only the path it is handed. Reproduced with the shipped flags' ripgrep 15.2.0 (`/Applications/ChatGPT.app/Contents/Resources/rg`) on a scratch tree: `rg --files-with-matches needle ./top/vis` finds `b.txt` and skips `vis/.env`; `./top` skips `.hid/` and the ignored `ign/`; only a hidden or ignored folder given as the path itself is searched (`./top/.hid`, `./top/ign`). The builder's own real-binary test covers only a hidden folder chosen as the scope. Failure scenario: a reader runs Find in Folder... on `src/` expecting its `.env` and ignored build folder to be searched, gets none, and concludes there are no hits. HELP.md:111 ("a hidden or ignored one included") is right when it means the chosen folder; line 164 is not. verdict: item 15 partial.
3. `HELP.md:111`: "Pasting onto a name that is taken asks before it replaces the item, which goes to the Trash." What is wrong: a Copy paste never asks; it takes the next free name (`report copy.md`, `report copy 2.md`; `ops.ts:413-416`), and HELP.md nowhere says so. Failure scenario: a reader pastes a copy beside its original, sees no question and a new `... copy` file, with nothing in the manual explaining it. Low.
4. `agents/spec.md`, "What every package obeys": "a step never runs `npm run test:slow`". The report's table row "The slow suite" and its note say the builder ran it (found one defect in `Query.svelte`, fixed as `var(--muted-txt, var(--muted))`, the form `TabFace.svelte:168` uses). The fix is right; the run breached the rule. Low.
5. `tests/views/sources/files/files-naming.test.ts:89-102`, "audits that words every message as VS Code does": it asserts catalog strings equal literals. A test of a label alone whose failure costs nothing; the tree's convention is to title such tests "audits", which this one does. Low.

## 4. Behaviour

1. `src/lib/server/files/fs/ops.ts:224-239`: "`files.push(join(real, names[index] ?? LOCAL_NAME));` ... `return scope.locals.some((file) => file === real || below(file, real));`". What is wrong: item 2 and Decision 9 say `protected` is "compared by real path so every route to it is refused". `realPath` is `fs.realpathSync` (`server/core/paths.ts:29-35`), which keeps the letter case the caller typed on macOS (`realpathSync('.../LOCAL.YML')` prints `.../LOCAL.YML`; `.native` prints `.../local.yml`; checked with node on this machine), and the compare is a string compare, so a case variant of the name is not `protected`. Reproduced with a throwaway test over the report's own `engineWorld` fixture (scratch engine `config/` holding a fixture `local.yml`, scratch copy only; this volume is case-insensitive APFS):
   - `{ op: 'delete', root: 'engine', paths: ['LOCAL.YML'] }` answered `{"ok":true}` and `local.yml` was gone (`readdir` listed only `other.yml`);
   - `{ op: 'trash', root: 'engine', paths: ['Local.yml'] }` answered ok and the trash spy was called with `.../config/Local.yml`;
   - `{ op: 'rename', root: 'engine', path: 'LOCAL.yml', name: 'moved.yml' }` answered ok and the folder listed `moved.yml`;
   - `{ op: 'upload', root: 'engine', path: '', name: 'LOCAL.YML', data: 'AA==', replace: true }` answered ok and the spy was called with `.../LOCAL.YML`;
   - `{ op: 'delete', root: 'hub', paths: ['TOOLS/oculus/config'] }` answered ok and `local.yml` was gone;
   - the control `{ op: 'delete', root: 'engine', paths: ['local.yml'] }` answered `protected`.
   Failure scenario through the page, with no crafted request: Upload... a file named `LOCAL.YML` into the config folder (any file the reader has on disk with that name); the server answers `exists` (the volume reads it as taken), the page asks "Do you want to replace it?", the reader answers Replace, `uploadItem` (`ops.ts:458-468`) sends the real `local.yml` to the Trash and writes the upload as `LOCAL.YML`. The same holds for a Cut paste with Replace of an item named `Local.yml`. `local.yml` holds this machine's accounts and settings. The fix is to compare by identity (device and inode through `lstat`, or `realpathSync.native`) for the protected file and for every folder that holds it, and to add the case-variant cases to case 24. verdict: item 2 violated; case 24's rule unmet for another spelling.
2. `row-ops.ts:221-223` (see Spec 1): the name box refuses a legal `dir/file` typed beside an existing `dir`. verdict: item 9 violated.
3. The report's "Every user-visible change" does not state: the Delete question for a link to a folder (Spec 2); that Upload with Replace can reach the machine's settings file under another spelling (Behaviour 1); that `trash` adds 58 packages to the install (Standards 1). The 400 body of GET /api/search is stated and ruled (Z156).

## Declined to judge

- Everything the brief assigns to the look on TEST (name box focus, selection, Enter, blur, Escape, the message drawn over the rows; the questions drawn and Enter/Escape in them; the faded cut row beside selection and hover; the pending row in a long virtualised tree; right-click inside the name box; the real Trash through `macos-trash`; Reveal in Finder; the diff pane's bar over two files). No browser is allowed and no DOM suite exists; the report lists them under "Audits for the look" and says "not verified".
- `npm run test:slow` (the spec forbids a step to run it; the refute skill lists unlisted suites as an anti-pattern). Its result is the builder's, not reproduced.
- The cross-volume move (`moveItem` EXDEV copy then removal, `ops.ts:379-387`): no test and no second volume here.
- What the page does when the server rethrows an errno `attempt` does not map (ENOSPC, EBUSY): the route answers 500, `outcomeOf` reads it as `network` and skips the listing re-read although a list may have changed part way. Not exercised, so not claimed as a defect.
- Compare Selected is built and tested but unreachable until a second row can be selected (`rowFacts` gives `selection: 1`), as the brief says.
- VS Code words beyond those I fetched (`fileActions.ts` lines 90, 121, 176, 227-229, 277-281, 489, 714-789 match the catalog); `fileImportExport.ts:864-866`, `fileActions.contribution.ts` and `searchActionsFind.ts` line citations were not fetched.

Reviewer usage: tokens not measured by me (the runner's completion notice has them), about 85 tool uses, time not measured.
