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

## Repair round 1, refuted

# Step Q88b refuter report over repair round 1 (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q88b, base 5ef2a351)

Open first: the verify list is green and every number in the builder's round report reproduces. Eight of the nine rulings are closed as claimed (each fix fails when I take it out, and its test passes with it). Ruling 1 (`protected`) closes the finding that was reported: every letter-case spelling, symbolic-link route, parent folder, hard link, name that does not exist yet, rename target, upload with Replace and paste with Replace is refused. Two defects remain in it:
1. The protection is computed before the request waits in the write chain, so a queued delete can remove a `local.yml` that was saved (given a new inode) while it waited. I reproduced it on a fixture. It is a Behaviour finding.
2. The tests the round added branch on `INSENSITIVE`. Their other branch contradicts the code and fails on a case-sensitive volume. I reproduced that too. It is a Proof finding.

Method notes:
- I changed nothing in the worktree. I confirmed `git status --short` there still prints 85 lines, as before my run.
- `npm run diagrams` and `checks.sh` write build outputs and `docs/diagrams`, as the verify list does.
- For mutation runs and probes I used a scratch copy of `tools/oculus` under the session scratchpad. `config/` was copied with `--exclude=local.yml`, and `node_modules` was linked.
- For one run I made a case-sensitive APFS disk image, pointed `TMPDIR` at it, and ejected and deleted it afterwards.
- Beyond the two allowed git commands, I ran read-only `git log --oneline` and `git rev-parse HEAD` (worktree and main checkout) to read HEAD, and `git init` in a scratch folder for the ripgrep experiment. No repository state changed.
- I did not open, print, grep, hash or copy any `config/local.yml`. Every probe used a fixture file in a scratch folder.
- I started no server, touched no port, read no `.vscode`, and used no browser.

## Verification (rerun by the reviewer)

From `.agents/worktrees/Q88b/tools/oculus`, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`:

```
$ npm run diagrams
docs/diagrams/layer-shell.dot ... docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (output to a file; exit 0)
$ npm test
 Test Files  378 passed | 20 skipped (398)
      Tests  6207 passed | 614 skipped (6821)
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
```

Both counts equal the builder's (`6207 passed | 614 skipped (6821)`, `442 passed | 9 skipped (451)`).

Commands the round's report quotes, rerun:
- `LC_ALL=C grep -nE '[^ -~]' DESIGN.md HELP.md README.md config/text/views/sources/files.yml config/text/views/sources/search.yml` prints nothing.
- ripgrep (the shipped `node_modules/@vscode/ripgrep-darwin-arm64/bin/rg`, called with the argument form of `searchArgs`: `--glob '!node_modules' --glob '!.git' --glob '!.svelte-kit' --regexp needle ./.hid`) on a scratch tree prints `./.hid/a.txt` only. That reproduces ruling 6's claim that the chosen hidden folder is searched while its hidden files and `node_modules` stay skipped. From `./ign`: `ign/b.txt` and `ign/sub/s.txt`. From `.`: `src/c.txt` only.
- The files of the delta are `HELP.md`, `README.md`, `DESIGN.md`, `docs/diagrams/*`, `tests/server/files/fs.test.ts`, `ops-paste.test.ts`, `files-naming.test.ts`, `files-ops.test.ts`, `tests/state/sources/explorer/ops.test.ts`, and the sources `server/files/fs.ts`, `server/files/fs/ops.ts`, `state/sources/fs.ts`, `state/sources/explorer/ops.svelte.ts`, `views/sources/files/tree/row-ops.ts` and `Tree.svelte` (found with `find ... -newermt '2026-10-01 15:14'`).

"Fails before the fix" claims, each reproduced on the scratch copy by putting the old behaviour back:

| Ruling | Mutation | Result |
|---|---|---|
| 1 | `identityOf` returns the spelled path instead of device:inode (a compare by spelling) | `tests/server/files/ops-paste.test.ts`: 2 failed (`refuses every spelling ... (case 24)`, `refuses a paste with Replace onto another spelling ... (case 24)`), 51 passed |
| 2 | `nameMessage` asks `taken` for the first segment again | `files-naming.test.ts`: 2 failed, `expected [ 'a', 'dir' ] to deeply equal [ 'a/b.md', 'dir' ]` and `expected { ...(2) } to be null` |
| 3 | `holdsContents` returns `row.kind === 'dir'` | `files-ops.test.ts`: `audits that asks the file question for a link to a folder` fails |
| 3 | `described` never sets `link` | `tests/server/files/fs.test.ts`: `marks a link as a link ...` fails |
| 4 | `held.clip = null` before the `network` return | `explorer/ops.test.ts`: `keeps a cut clipboard ...` fails, `expected null to deeply equal { mode: 'cut', ... }` |

Ruling 8 holds. `git status --short` lists `src/lib/data/file-ops.ts`, `server/files/fs/ops.ts`, `state/sources/explorer/`, `Questions.svelte`, `ops-fixture.ts` and the other new modules as `??`, so they are absent at the base. The four test files and `ops-fixture.ts` cannot load there.

## Verdicts

Items of the brief's "What to build", for the whole diff since the base. Items the round did not touch keep the first review's verdicts, with the suite green.
- 1: holds (`data/file-ops.ts`; `tests/data/file-ops.test.ts` and the state tests pass).
- 2: partial. A request queued behind a long operation checks a stale protection (Behaviour 1). Route, zod shape, `opsWrites`, all operations and the refusal order hold (`ops.test.ts`, `ops-paste.test.ts`, 67 tests). The case-variant bypass of the first review is closed.
- 3: holds (`handleCompare`, `ops.ts` near line 600).
- 4: holds.
- 5: holds.
- 6: holds. The rerun above agrees with `HELP.md:164` and `DESIGN.md:384`.
- 7: holds under Z159. A paste whose request never reached the server keeps a Cut, which departs from the brief's "when it fails" clause by the orchestrator's ruling. A test and the DESIGN.md sentence are in.
- 8: holds.
- 9: holds. `nameMessage` asks for the whole name, `row-ops.ts:231`.
- 10: holds.
- 11: holds. A link to a folder takes the file message (`holdsContents`, `row-ops.ts:127`, used at `:149` and `Tree.svelte:225`).
- 12: holds.
- 13: holds.
- 14: holds.
- 15: holds, with Standards 1.

Cases of the brief's "Cases":
- 1 to 23, 25 to 28: met (tests carry their case number; all pass).
- 24: partial. It is met for every spelling listed (the added case-variant cases pass and fail under the mutation). The rule does not hold when the request is queued behind a long operation (Behaviour 1), and no case covers that.
- 29 to 42: met (unchanged by the round, suites pass). Case 7 and the case 24 variants do not pass on a case-sensitive volume (Proof 1).

## 1. Spec

- Ruling 3 (round file `Q88b-round1.md`, item 3): "added to the entry's shape and its zod schema". On this tree no zod schema reads the listing's entry, and the report says so. On main, `state/sources/fs-transport.ts:211` has `fsEntryShape` built by `unchanged(z.object({ name, kind, size, mtime }))`. `unchanged` keeps unknown keys, so `link: true` passes through at landing. The shape does not declare it, and `FsEntry` here has `link?: true`. What is wrong: the clause is not built on this tree and has to be applied at landing. Failure scenario: a later change that makes this reader strip unknown keys turns every link to a folder back into a "and its contents" Delete question. No verdict. Low.

## 2. Proof

- `tests/server/files/ops-paste.test.ts:426,431` (`other: made`) and `:492-493` (`} else { expect(over.body.ok).toBe(true);`); also `tests/server/files/ops.test.ts:219-221` (case 7).
  - What is wrong: the round's report says "On a volume that tells the spellings apart the same cases expect `missing`, or a made file, and are not run here." They are not what the code does. `holdsProtected` (`ops.ts:268-276`) refuses, for a path with nothing at it, any name that equals a protected file's name in any case, in the folder that holds one.
  - I ran `ops.test.ts` and `ops-paste.test.ts` on a case-sensitive APFS volume with `TMPDIR` set to it: 3 failed, 50 passed.
    - `rename other.yml to Local.yml` answers `protected` where the test expects `{ ok: true }`.
    - `upload LOCAL.YML with replace` answers `protected` where the test expects `{ ok: true }`.
    - The Replace paste of `spare/Local.yml` answers not ok.
    - Case 7 (`ops.test.ts`, from the first round, not in the delta) fails at its second assertion, `expected { ok: false, error: 'missing' } to deeply equal { ok: false, error: 'exists' }`.
  - Failure scenario: someone runs the suite on a case-sensitive volume or on Linux and gets three red tests that no change of theirs caused, and the report's "same cases expect" sentence misleads them. Fix: write the other branch to what the code answers, `protected`, or drop the branch.
  - Verdict: case 24 and item 2, only in the clause "tests pass on both volume kinds".
- Ruling 8 quotes "the unchanged source" as a copy of the main checkout's `tools/oculus` with this worktree's `tests/`. Main now holds Q85b's landing, so that source is not the base 5ef2a351. The conclusion (the four files fail to load) is settled by the `??` list above, so no decision rests on which copy it was. Low.

## 3. Standards

- `DESIGN.md:384`: "`trash` (to the macOS Trash through the `trash` package, which is the one dependency the step adds)". What is wrong: a sentence in a design page that refers to the step that built it (history in a document, `agents/spec.md` prose rule). After landing, "the step" names nothing a reader can find. Failure scenario: a reader of DESIGN.md looks for the step and for which other dependencies it did not add. Fix: say that `trash` is the package that moves to the Trash. Low.
- Otherwise none. `README.md:13` names `trash` (MIT), `HELP.md:111` and `:164` match the code (rerun above), non-ASCII is clean, and sizes pass `test:checks`.

## 4. Behaviour

- `src/lib/server/files/fs/ops.ts:549` and `:552`: "`locals: protectedFiles(into),` ... `const answer = await chained(into.writes, async () => { await deps.slow?.(); return run(scope, body.data); });`".
  - What is wrong: item 2 and Decision 9 say `protected` is refused "so every route to it is refused". The device and inode set is computed when the request arrives, before the request waits in the chain. A save of `local.yml` through the source tab or the Config view goes through `writeTextAtomic`, which renames a temporary file over it, so the file gets a new inode. A request that waited behind another operation then checks the old inode.
  - Reproduced on a fixture (scratch copy, `engineWorld` layout): a `create` held in the chain by `deps.slow`; a `delete { root: 'engine', paths: ['local.yml'] }` posted behind it; then `local.yml` replaced by a write to a temporary file and a rename over it; then the first operation released. The delete answered `{"ok":true}` and `local.yml` was gone. Without the replacement, the same delete answers `protected`.
  - Failure scenario: Delete on `local.yml` is confirmed while a long copy is running, and Config is saved meanwhile. The file that holds this machine's accounts and settings is moved to the Trash, or removed for good after `trash_failed`.
  - Fix: call `protectedFiles(into)` inside the chained callback, immediately before `run`.
  - Verdict: item 2 partial, case 24 partial.
- `ops.ts:268-276` (`holdsProtected`, second branch) and `:241-262` (`protectedFiles`, `homes`):
  - What is wrong: for a path with nothing at it, a name equal to a protected file's name in any case is refused in the folder that holds it. This goes beyond the finding (spellings the volume accepts). Item 2 lists rename, move, trash, delete, overwrite and copy, not the making of a file that is not there.
  - I ran it: with no `local.yml` in the engine folder, `create` `local.yml` answers `{"ok":false,"error":"protected"}` and so does `upload` `local.yml`. On a case-sensitive volume, `upload LOCAL.YML` into the folder that holds `local.yml` is refused though it is another file.
  - The report names the rule but not these two effects. Failure scenario: on a checkout with no `local.yml`, New File named `local.yml` in the config folder says "This machine's settings file cannot be changed here." and the reader cannot make it from the Files view. No verdict. Low. This is a choice for the orchestrator (keep the over-refusal, or refuse only when something is at the path).

Attempts to defeat ruling 1, by reading and by run on a fixture whose `local.yml` is a scratch file (case-insensitive APFS here, so the letter-case rows depend on that):

| Attempt | Refused? |
|---|---|
| Another letter case: `LOCAL.YML`, `Local.yml`, `LOCAL.yml` (delete, trash, rename) | yes, `protected` (`ops-paste.test.ts` case 24, and the mutation above) |
| A path through a link to the folder, `lnk/local.yml` (delete, rename) | yes. `resolveItem` resolves the parent by real path and keeps the name; the compare is by lstat identity |
| The link itself, or a link that points at the file | acted on as a link, not refused (`rename ll mm` passes), as the brief asks |
| A parent folder: `hub:TOOLS/oculus/config`, `Tools/OCULUS`, `tools` | yes. `ids` holds every folder from the config folder up to `/` |
| A hard link to the file in another folder (`delete spare/hl.yml`, `upload spare/hl.yml` with Replace) | yes, same inode. This over-refuses a harmless hard link |
| A name that does not exist yet (create, upload, rename target `Local.yml`) | yes, through `homes` (see Behaviour 2) |
| A rename target by several segments, `tools/oculus/foo.yml` to `CONFIG/LOCAL.YML` | yes, `protected` |
| An upload with Replace over `LOCAL.YML` | yes |
| A paste with Replace onto `Local.yml` (move) | yes |
| A copy of `config`, of `tools`, of `local.yml` | yes, all `protected`; `spare/` stayed empty |
| A request queued behind another operation | no (Behaviour 1) |

## Declined to judge

- The look on TEST: name box, questions drawn, faded Cut row, the real Trash, Reveal in Finder. No browser or DOM suite is allowed. The report lists them as not verified.
- `npm run test:slow`. It is the builder's earlier run; the round did not rerun it (ruling 9) and I did not run it.
- Whether other copies of `local.yml` count, such as the ones inside git worktrees under `.agents/worktrees/`. `protectedFiles` guards the engine root's file and the route's `local` file by identity. A copy elsewhere can be copied or deleted from the Files view. Decision 9 names `config/local.yml` in the singular, so the diff meets the brief. Whether copies count is Axel's call.
- A cross-volume move (`EXDEV`): no second volume here. Unchanged by the round.
- Whether `fsEntryShape` on main should declare `link` (Spec 1). That is a landing edit.

Reviewer usage: tokens not measured by me (the runner's completion notice has them), about 55 tool uses, about 30 minutes.

## Closed

Every finding of the first run was sent in repair round 1 (`agents/briefs/Q88b-round1.md`) and is judged closed or open by the run over that round above. The findings of the run over round 1 are closed at landing on main:

- Spec 1 (`link` not declared): `state/sources/fs-transport.ts`'s `fsEntryShape` declares `link: z.literal(true).optional().catch(undefined)`, so a link to a folder keeps its flag through the reader and an entry with a wrong `link` keeps its other fields.
- Proof 1 (the case-sensitive branches and case 7): the branches are written to what the code answers after Z162, and case 7's second assertion runs on a fresh fixture. On a case-sensitive APFS image with `TMPDIR` on it, `ops.test.ts` and `ops-paste.test.ts` give 54 passed.
- Proof 2 (the source ruling 8 quoted): no decision rests on it, as the finding says; nothing to change.
- Standards 1 (`DESIGN.md:384`): "which is the one dependency the step adds" removed.
- Behaviour 1 (the guard computed before the request waits): `server/files/fs/ops.ts` builds the scope, with `protectedFiles(into)`, inside the `chained(...)` callback after `deps.slow`. The new case "refuses a delete that waited in the chain while local.yml was saved over (case 24)" in `tests/server/files/ops-paste.test.ts` fails with the step's `ops.ts` (1 failed) and passes with the fix.
- Behaviour 2 (the name-only refusal of a path with nothing at it): ruled Z162 (a), the orchestrator, automode: `protected` is decided by identity only and the `homes` branch is removed, so New File or Upload of a missing `local.yml` is not refused.
- Declined to judge, the copies of `local.yml`: the file is gitignored (`git check-ignore` exits 0) and neither worktree holds one (`test -e` on both), so the Files view reaches no copy of it.

Found at landing, outside the review, and fixed on main:

- `tests/checks/tree/size.test.ts` failed on main: `src/lib/ui/forms holds 11 items`, since main gained a form file after the step's base. `FileChooser.svelte` and the step's `file-data.ts` move to `src/lib/ui/forms/file/`, their importers and test keys follow.
- The look on TEST: Cut did not fade the row and left Paste disabled, because `state/sources/explorer/ops.svelte.ts` held the clipboard and the compare file as properties of one `$state.raw` object, whose property writes Svelte does not track. Both are now `$state.raw` signals replaced whole. `tests/state/sources/explorer/clipboard.client.test.ts` (client runtime) fails on the step's store (2 failed) and passes with the fix; on TEST after the fix the cut row draws at opacity 0.5 and Paste is offered.
- The look on TEST: the delete, permanent-delete and replace questions labelled their cancel button "cancel" in lower case beside "Move to Trash"; `Questions.svelte` uses `ui.confirm_cancel` ("Cancel"), as the page's other confirm questions do. `tests/views/sources/files/files-naming.test.ts` asserts it and fails with the old key.
- `npm run check` on main could not resolve `trash` until `npm install` added it to main's `node_modules` from the step's lockfile.
