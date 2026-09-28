# Q79d report: the library audit's shared helpers, each duplicated helper written once

Everything in the brief is done, with the grep case as ruled in `briefs/Q79d-cases.md` (option (a)). One rule of the dispatch was broken: I ran one `git init` in a new folder under my scratchpad. It touched no checkout, and the folder is deleted.

## 1. Open items of the main checkout's state file, verbatim

Read with `grep -n -A6 "^## Open items" /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` at the end of the step:

```
## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.
```

## 2. The ruling carried

The orchestrator ruled in `briefs/Q79d-cases.md` (round 0) as follows:

- **The grep case.** `grep -rn "isRecord\|function inside\|insideRepo\|function real(\|function localDay\|function basename" src` prints exactly four lines: `server/core/paths.ts`'s `export function inside(path: string, dir: string)`, `insideHub`, `ics.ts`'s `inside` and `MergeSide.svelte`'s `inside`. The audit case in `tests/server/core/paths.test.ts` asserts that list. `ics.ts` and `MergeSide.svelte` are not renamed.
- **The builder's widenings are accepted:**
  - `boundaries.test.ts` and the `DESIGN.md:169` row;
  - views reaching the helpers through state re-exports;
  - `isYamlMap` in five files;
  - `inFolder`, and `within` in `sessions/group.ts`.
- **Two behaviour changes each get a case and a before-and-after (section 7):**
  - an empty folder holds nothing in `pathUnder`;
  - `statusRecords` reads a `from` when either column is R or C.

## 3. The cases' first run (unchanged tree)

Command:

```
npx vitest run tests/server/core/paths.test.ts tests/data/helpers/paths.test.ts tests/data/helpers/dates.test.ts tests/server/core/git-parse.test.ts tests/server/git/deposit.test.ts
```

Result: `Test Files  5 failed (5)`, `Tests  8 failed | 28 passed (36)`. The files were at those paths then; `paths.test.ts` has since moved to `tests/data/helpers/files/`, see section 6.

- **`inside`, `below`, `realPath` and the grep audit** did not run. The file failed to load with `Error: Cannot find module '../../../src/lib/server/core/paths.ts'`.
- **`nameOf`, `pathUnder` and `deepestHolding`** did not run. The file failed to load with `Error: Cannot find module '../../../src/lib/data/helpers/paths.ts'`.
- **`ago`:** four cases failed with `TypeError: ago is not a function`.
- **`localDate`:** passed at runtime, because `new Date(date)` copies a Date. On main it fails only in the type check, since `localDate(now: number)` does not accept a Date. Section 4, row 6 has the type errors.
- **`statusRecords`:** three cases failed with `TypeError: statusRecords is not a function`.
- **The deposit case** failed with `expected [ Array(1) ] to deeply equal [ { letters: 'A ', path: 'a b.txt' } ]`; the received path was `"\"a b.txt\""`. This is the brief's "On main, `changesIn` lists it quoted".
- **The grep** printed the `isRecord`, `insideRepo`, `real(`, `localDay` and `basename` copies. It also printed `function inside` lines that the brief's own names make permanent, which was the case handed back and ruled on.

## 4. DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. isRecord | DONE | brief grep; `npm run check` 0 errors |
| 2. Server paths | DONE | `tests/server/core/paths.test.ts` green; reverts below |
| 3. Porcelain | DONE | `git-parse.test.ts`, `deposit.test.ts` green |
| 4. Client paths | DONE | `tests/data/helpers/files/paths.test.ts`, `status.test.ts`, `follow.test.ts`, `file-git.test.ts` green |
| 5. ago | DONE | `tests/data/helpers/dates.test.ts` green |
| 6. Local date | DONE | `dates.test.ts`; type revert below |
| 7. Head comments, DESIGN.md | DONE | grep of DESIGN/HELP/README for removed names prints nothing |
| Allow-list lines | DONE | `duplication.test.ts` green |
| Verify list | DONE | `verify: 6 commands passed` |
| Brief grep | DONE | prints the four ruled lines |
| `npm run diagrams` | DONE | `diagrams exit=0` |
| Revert proofs | DONE | each quoted below |

What each row covers:

1. **isRecord.** Every copy is gone and every use is `isMap` from `data/helpers/guards.ts`. `rows.ts` drops its alias, and `layout/index.ts` no longer re-exports the name. `grep -rn isRecord src tests` prints only the audit's own pattern in `tests/server/core/paths.test.ts`.
2. **Server paths.** `server/core/paths.ts` exports `inside`, `below` and `realPath`, and every listed site calls one of them:
   - `pathInside`, `permitted`, `underMirrors` and `customizations.ts` go through `inside`.
   - `compose.ts`, `writes/entries.ts`, `writes/subtasks.ts` (both sites), `writes/manifest.ts` (both sites), `fs/notes.ts` (both sites), `deposit.ts` `dropGone` and `audit/projects.ts` go through `below`.
   - The five `real` copies call `realPath`.
   - `insideRepo` is gone; `git-write.ts` and `git-index.ts` call `pathInside`. `git-routes.ts` calls `permitted`.
3. **Porcelain.** `statusRecords` is in `core/git-parse.ts`. `core/git.ts`'s `porcelain`, `git-write.ts`'s `tracked` and `untrackedIn`, `git-refs.ts`'s `holds`, `git-index.ts`'s `pairOf` and `deposit.ts`'s `changesIn` read through it. `deposit-git.ts` runs `status --porcelain=v1 -z`.
4. **Client paths.** `nameOf`, `trimSlash`, `pathUnder` and `deepestHolding` are in `data/helpers/files/paths.ts` (section 6 says why not `data/helpers/paths.ts`).
   - `file-type.ts` re-exports `nameOf`.
   - `format.ts`'s `basename` and the one in `TerminalRows.svelte` are gone. `elide`, `Usage.svelte`, `Timeline.svelte` and `TerminalRows.svelte` call `nameOf`.
   - `rootHolding`, `repoOfFile`, `tabOfFile` and `repoStatus` build on `pathUnder` and `deepestHolding`. `repoOfFile` still leaves out a repository whose folder is the file itself.
   - `selectors.svelte.ts` uses `inFolder`.
5. **ago.** `dates.ts` has `ago(iso, now, largest)`. `folds.ts`'s `ago` is gone and `folds.ts` re-exports the shared one. `SessionWorkspace.svelte` calls it with `'day'` and maps `minute`, `hour` and `day` to `ago_m`, `ago_h` and `ago_d`. `file-git.ts`'s `ago` keeps its words and reads the count with `'year'`, answering `''` for null.
6. **Local date.** `localDate(number | Date)`. `calendar.ts`'s `localDay` and `transcripts.ts`'s `localDay` are gone. `Calendar.svelte` gets `localDate` through `calendar.ts`, and `notes.ts`'s `stamp` takes its day from it.
7. **Head comments.** Each changed module's head comment names what it now imports and from where. DESIGN.md names none of the removed functions.

Revert proofs for row 6: with the signature put back to `number`, `npm run check` reports `COMPLETED 1487 FILES 14 ERRORS`. Among them:

```
"src/lib/server/machine/usage/transcripts.ts" 43:58 "Argument of type 'Date' is not assignable to parameter of type 'number'.
"src/lib/state/life/calendar.ts" 93:78 "Argument of type 'Date' is not assignable to parameter of type 'number'.
```

The file was then restored (`cmp` against the kept copy printed `restored`).

The allow-list: the seven entries that paired the copies are removed from `tests/checks/tree/allow-duplication.txt` (hashes `20b06154f5e8`, six pairs of the `real()` copy; `6df64cd3fcbc`, `appearance.ts` and `tones.ts`). `npx vitest run tests/checks/tree/duplication.test.ts tests/checks/tree/boundaries.test.ts` gives `Tests  21 passed (21)`.

### The verify list

Command: `sh ~/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, from `tools/oculus` in the worktree. Last run, after the last change, at load average 8.22:

```
 Test Files  350 passed (350)
      Tests  5527 passed (5527)
verify: 6 commands passed
```

Exit 0.

Two earlier runs of the same command, at load averages 14 to 20 and after the same code, stopped red at `npm test`:

- **First run:** `Test Files  2 failed | 348 passed (350)`. `tests/server/core/git.test.ts` "cuts every list it publishes at the cap" and three cases of `tests/server/git/git-ops.test.ts` failed with `Error: Test timed out in 5000ms`.
- **Second run:** `Test Files  3 failed | 347 passed (350)`. `order.test.ts` "holds the server folders" timed out. `git.test.ts` "cuts every list it publishes at the cap" failed with `AssertionError: expected +0 to be 200`. `deposit.test.ts` failed with a timeout, and then "answers a failed switch" with `expected 'review' to be 'main'`, which follows from the timed-out case before it still running.

Run alone three times, `npx vitest run tests/server/git/deposit.test.ts tests/checks/imports/order.test.ts tests/server/core/git.test.ts` gave `Tests  83 passed (83)` each time. `git-ops.test.ts` alone gave `Tests  37 passed (37)`. These are timeouts under load, named here and not changed.

### The brief grep

Output of the brief grep:

```
src/lib/server/core/paths.ts:14:export function inside(path: string, dir: string): boolean {
src/lib/server/edit/writes/manifest.ts:130:export function insideHub(hub: string, config: PortfolioConfig, file: string): boolean {
src/lib/server/accounts/calendar/ics.ts:82:function inside(start: ICAL.Time, end: ICAL.Time, window: Window): boolean {
src/lib/views/sources/repositories/merge/MergeSide.svelte:38:    function inside(line: number): SideConflict | undefined {
```

These are exactly the four lines of the ruling.

### Other commands

- `npm run diagrams` printed `diagrams exit=0`.
- The ASCII gate of the spec (the `perl` form over `src tests bin config`) printed nothing.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: exit 0.
- `npm run check`: `0 ERRORS 0 WARNINGS`.
- `npm run build`: exit 0.

### Each new or changed case, with its change undone

Each change was undone by a script that swapped one line, ran the test file, and wrote the file back. The script asserted the restored text equals the original. After the later head-comment edits, a count confirmed every undone line is still in the tree, once each.

| Change undone | Case that turns red, and its failure |
| --- | --- |
| `inside`: prefix without the separator (`full.startsWith(root)`) | "refuses a sibling that shares the prefix and a path that walks out": `expected true to be false` |
| `below`: the folder itself admitted (`full === root \|\|`) | "admits a path strictly below the folder and not the folder itself": `expected true to be false` |
| `below`: the `full !== root` guard dropped | same case, on `below('/', '/')`: `expected true to be false` |
| `realPath`: the link not followed | "follows a symbolic link to its target": `expected '/var/folders/...' to be '/private/var/folders/...'` |
| audit: `inFolder` named `inside` again | "are written nowhere under src, and the four named matches are all that remain": `expected [ ...(5) ] to deeply equal [ ...(4) ]` |
| `statusRecords`: `from` for the index column only | "reads a copy and a rename in the worktree column with their old paths": 3 records where 2 are expected |
| `statusRecords`: the old path not stepped over | both record cases, e.g. 4 records where 3 are expected |
| deposit: `status --porcelain=v1` without `-z` | "lists a changed path with a space as it is, without git quoting it", and "makes a second commit on the remote": `path: 'run.py\n'` |
| `nameOf`: the text after the last slash | "is the last non-empty segment": `expected '' to be 'b'` |
| `trimSlash`: the root trimmed to empty | "drops the trailing slashes and keeps the root": `expected '' to be '/'`; "holds everything absolute under the root folder": `expected null to be 'r/x'` |
| `pathUnder`: the empty-folder guard dropped | "is null for every target when the folder is empty": `expected 'r' to be null` |
| `pathUnder`: prefix without a slash | "is null outside the folder, a sibling sharing the prefix included": `expected 'x' to be null` |
| `deepestHolding`: the first holder wins | "picks the item whose folder holds the target most deeply": `expected { item: { dir: '/r' }, path: 'sub/f' } to deeply equal { item: { dir: '/r/sub' }, path: 'f' }` |
| `repoStatus`: only the first repository considered | `status.test.ts` "is the innermost repository holding the file": `expected '/work/hub' to be '/work/hub/projects/paper'` |
| `ago`: `largest` ignored | "stops at the largest unit it is asked for": `expected { unit: 'week', count: 2 } to deeply equal { unit: 'day', count: 14 }` |
| `ago`: the future read as now | "is now for a clock up to a minute ahead, and nothing further ahead": `expected { unit: 'now', count: +0 } to be null` |
| `elide`: the last name not kept (`keep = max - 3`) | `format.test.ts` "never loses the last name, however long the last name is": the elided text differs |
| `localDate`: the signature back to `number` | `npm run check`: 14 errors, quoted in row 6 |

## 5. Files and their line counts

Counted with `wc -l` after the step.

### New files

| File | Lines |
| --- | --- |
| `src/lib/server/core/paths.ts` | 34 |
| `src/lib/data/helpers/files/paths.ts` | 60 |
| `tests/server/core/paths.test.ts` | 107 |
| `tests/server/core/git-parse.test.ts` | 30 |
| `tests/data/helpers/files/paths.test.ts` | 78 |
| `tests/data/helpers/dates.test.ts` | 49 |

### Moved files

Each is moved into `files/`, with its imports and references repointed:

- `src/lib/data/helpers/files/text-kind.ts` (41) and `src/lib/data/helpers/files/opens-in-program.ts` (77).
- `tests/data/helpers/files/text-kind.test.ts` (118) and `tests/data/helpers/files/opens-in-program.test.ts` (99).

### Changed files, server

| File | Lines |
| --- | --- |
| `data/helpers/dates.ts` | 53 |
| `server/core/git-parse.ts` | 326 |
| `server/core/git.ts` | 812 |
| `server/git/git-write.ts` | 680 |
| `server/git/deposit.ts` | 808 |
| `server/git/deposit-git.ts` | 319 |
| `server/git/git-routes.ts` | 301 |
| `server/git/git-refs.ts` | 134 |
| `server/git/git-index.ts` | 252 |
| `server/content/images.ts` | 342 |
| `server/content/latex.ts` | 347 |
| `server/content/docs.ts` | 534 |
| `server/content/audit/projects.ts` | 484 |
| `server/files/project-files.ts` | 203 |
| `server/files/fs.ts` | 553 |
| `server/files/open.ts` | 364 |
| `server/files/files.ts` | 281 |
| `server/files/fs/notes.ts` | 125 |
| `server/files/source.ts` | 149 |
| `server/edit/feeds.ts` | 516 |
| `server/edit/writes/entries.ts` | 588 |
| `server/edit/writes/subtasks.ts` | 260 |
| `server/edit/writes/manifest.ts` | 317 |
| `server/edit/yaml-edit.ts` | 720 |
| `server/edit/entry-edit/lines.ts` | 376 |
| `server/edit/entry-edit/entries.ts` | 311 |
| `server/edit/entry-edit/subtasks.ts` | 282 |
| `server/accounts/connect/rows.ts` | 220 |
| `server/sessions/group.ts` | 440 |
| `server/sessions/stores/customizations.ts` | 452 |
| `server/machine/pty/compose.ts` | 227 |
| `server/machine/usage/transcripts.ts` | 200 |
| `data/sources/config/settings.ts` | 166 |

### Changed files, client state

| File | Lines |
| --- | --- |
| `state/forms/form-drafts.svelte.ts` | 550 |
| `state/forms/form-values.ts` | 112 |
| `state/shared/words/appearance.ts` | 204 |
| `state/shared/words/tones.ts` | 231 |
| `state/shared/words/format.ts` | 131 |
| `state/workbench/layout/model.ts` | 163 |
| `state/workbench/layout/index.ts` | 100 |
| `state/workbench/layout/saved/saved.ts` | 447 |
| `state/workbench/navigation/arrangement.ts` | 85 |
| `state/workbench/navigation/status.ts` | 295 |
| `state/sources/file-type.ts` | 96 |
| `state/sources/fs.ts` | 786 |
| `state/sources/fs.svelte.ts` | 881 |
| `state/sources/repositories/file-git.ts` | 153 |
| `state/client/selectors.svelte.ts` | 494 |
| `state/sessions/folds.ts` | 282 |
| `state/life/calendar.ts` | 253 |
| `state/life/notes.ts` | 124 |

`fs.svelte.ts` changed in its import path only.

### Changed files, views

| File | Lines |
| --- | --- |
| `views/sessions/session-list/SessionWorkspace.svelte` | 304 |
| `views/sessions/session-list/TerminalRows.svelte` | 192 |
| `views/sessions/timeline/Timeline.svelte` | 213 |
| `views/system/usage/Usage.svelte` | 337 |
| `views/personal/calendar/Calendar.svelte` | 406 |

### Changed tests and other files

| File | Lines |
| --- | --- |
| `tests/checks/tree/boundaries.test.ts` | 593 |
| `tests/checks/tree/allow-duplication.txt` | 655 |
| `tests/server/git/deposit.test.ts` | 663 |
| `tests/state/shared/words/format.test.ts` | 153 |
| `tests/state/sessions/folds.test.ts` | 352 |
| `tests/state/life/calendar.test.ts` | 295 |
| `tests/routes/files/open-program.test.ts` | 375 |
| `tests/routes/files/open-fixture.ts` | 126 |
| `DESIGN.md` | 322 |
| `docs/diagrams/` | regenerated by `npm run diagrams` |

## 6. Judgment calls, each reversible

1. **The client path helpers live in `src/lib/data/helpers/files/paths.ts`, not `data/helpers/paths.ts`.** With `paths.ts` added, `data/helpers` held 11 items. `tests/checks/tree/size.test.ts` failed with `src/lib/data/helpers holds 11 items, over the ten a folder may hold`. The spec says such a folder is split by what it holds.
   - `files/` holds the rules over what a file's path and name say: `paths.ts`, with `text-kind.ts` and `opens-in-program.ts` moved beside it. Their tests moved to `tests/data/helpers/files/`.
   - Every importer and the boundary table use the new module ids, and so do `DESIGN.md:169` and `DESIGN.md:305`.
   - This widens the brief's paths to `text-kind.ts`, `opens-in-program.ts`, `settings.ts`, `source.ts`, `fs.svelte.ts`, `open.ts`, the two moved tests and `tests/routes/files/open-program.test.ts` and `open-fixture.ts`.
2. **The widenings the ruling accepted:**
   - `boundaries.test.ts` and `DESIGN.md:169`;
   - state re-exports for the views (`file-type.ts` for `nameOf`, `folds.ts` for `ago`, `calendar.ts` for `localDate`);
   - `isYamlMap` in `yaml-edit.ts`, `entry-edit/lines.ts`, `entries.ts`, `subtasks.ts` and `rows.ts`;
   - `inFolder` in `selectors.svelte.ts`, and `within` over core `inside` in `sessions/group.ts`.
3. **`trimSlash('/')` stays `/`,** so the root folder holds every absolute path in `pathUnder`. There is a case for it.
4. **`pathUnder` trims the target's trailing slashes too,** so `/r/x/` under `/r` is `x`, as `rootHolding` did on main.
5. **`deepestHolding` ranks folders by their trimmed length, and the first of equal depth wins.** On main, `repoOfFile` and `tabOfFile` sorted by the untrimmed length, which differs only for two spellings of one folder.
6. **`below` treats the root:** `below('/', '/')` is false and `below('/x', '/')` is true. There is a case for each.
7. **`core/git.ts` `inside`, and the checks in `files.ts`, `fs.ts` and `open.ts`, resolve paths that are already real.** Resolving a real absolute path gives the same path, so the result is unchanged.
8. **`sessions/group.ts` now resolves before comparing.** Its paths are absolute session folders, so the result is the same. A relative path would now be resolved against the process folder, where on main it was compared as written.
9. **`compose.ts` and `customizations.ts` moved from a test through `relative` to a prefix test.** On main, a child named `..x` (a name starting with two dots) was refused; now it is admitted.
10. **Tests moved or narrowed:**
    - The folds `ago` cases moved into `tests/data/helpers/dates.test.ts` with the new units.
    - The `basename` cases of `format.test.ts` are covered by the `nameOf` cases. Its `basename(null)` case is gone, because `nameOf` takes a string.
    - `tests/server/core/git-parse.test.ts` is new, since there was no git-parse test file.
11. **Head comments.** Each changed module's head comment gained one sentence naming what it imports now and from where (item 7).

## 7. User-visible changes, before and after

1. **A name with a trailing slash** (decision 4). In the terminal rows, the Usage view and the Timeline:
   - Before, `basename('a/b/')` gave `''`, so the row was empty.
   - After, `nameOf('a/b/')` gives `b`.
   - To see it, open a terminal or a session whose folder ends in a slash. No payload read so far carries one.
2. **A commit dated more than a minute in the future** (decision 5). In the Repositories blame gutter and the status bar's blame item:
   - Before, it showed "just now".
   - After, it shows no age, and the gutter reads the author with an empty age.
   - A commit up to a minute ahead still reads "just now". The session list already followed this rule.
3. **The deposit's porcelain moves to `-z`** (decision 6). In the Deposit plan's list of changes:
   - Before, a path with a space or a non-ASCII byte came quoted as git writes it, for example `"a b.txt"`, and a rename came as `old -> new`.
   - After, the path comes as it is, `a b.txt`, and a rename is listed by its new path.
4. **An empty folder holds nothing in `pathUnder`** (ruled).
   - Before, `selectors.svelte.ts`'s `inside(path, '')` was true for every absolute path.
   - After, `inFolder(path, '')` is false.
   - `folderOf` answers `''` only for a manifest path without a slash. Manifest paths are absolute, so on a real hub the project's sessions list is unchanged. The case is "is null for every target when the folder is empty".
5. **`statusRecords` reads a `from` when either column is R or C** (ruled).
   - Before, `core/git.ts` stepped over an old path only when the index column was R or C. A worktree rename (`' R'`, which git reports for a rename of an intent-to-add file) therefore left its old path to be read as a record of its own: a row in the Changes list whose letters and path were cut from the old path.
   - After, the old path is read into `from` and never becomes a row.
   - The case is "reads a copy and a rename in the worktree column with their old paths". It is not checked against a real repository, since that would take a git command.

## 8. What in the brief was wrong, with the evidence

1. **The grep case contradicted the brief's own naming.** It could never print nothing while item 2 names the helper `inside`, and three other functions match `function inside`. The ruling in `briefs/Q79d-cases.md` is carried above.
2. **Decision 1 said `state/` may import `data/helpers/paths.ts`, but the boundary table did not list it.** `tests/checks/tree/boundaries.test.ts`'s state row had no `data/helpers/paths`. It is added, as ruled.
3. **Decision 1's path put an eleventh item in `data/helpers`.** `size.test.ts` refused it, which is judgment call 1.
4. **Items 5 and 6 have views import from `data/helpers/dates.ts`, which the views row forbids.** The views reach it through state re-exports, as ruled.
5. **The brief's sizes are off by a few lines.** `deposit.ts` `dropGone` was at `:654` and its `changesIn` at `:702`, a line or two from the brief's numbers. It made no difference to the work.
