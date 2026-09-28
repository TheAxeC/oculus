# Q79d report: the library audit's shared helpers, each duplicated helper written once

Everything in the brief and in repair round 1 is done, and the verify list passes (`verify: 6 commands passed`). Two lines of round 1 are carried out in a corrected form, with the reason in section 8: the head-comment line in the three newly aliased files, and the audit's yaml pattern. One rule of the dispatch was broken in round 0: I ran one `git init` in a new folder under my scratchpad. It touched no checkout, and the folder is deleted.

## 1. Open items of the main checkout's state file, verbatim

Read with `sed -n '/^## Open items/,/^## /p' /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` at the end of round 1:

```
## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.
```

## 2. The rulings carried

Round 0, in `briefs/Q79d-cases.md`:

- **The grep case.** `grep -rn "isRecord\|function inside\|insideRepo\|function real(\|function localDay\|function basename" src` prints exactly four lines: `server/core/paths.ts`'s `export function inside(path: string, dir: string)`, `insideHub`, `ics.ts`'s `inside` and `MergeSide.svelte`'s `inside`. The audit case in `tests/server/core/paths.test.ts` asserts that list.
- **The builder's widenings are accepted:** `boundaries.test.ts` and the `DESIGN.md:169` row; views reaching the helpers through state re-exports; `isYamlMap`; `inFolder`, and `within` in `sessions/group.ts`.
- **Two behaviour changes each get a case and a before-and-after (section 7):** an empty folder holds nothing in `pathUnder`; `statusRecords` reads a `from` when either column is R or C.

Round 1, in `briefs/Q79d-round1-sent.md`: the `data/helpers/files/` folder is accepted as it is; items 1 to 9 are done as section 4 lists.

## 3. The cases' first run (unchanged tree, round 0)

Command:

```
npx vitest run tests/server/core/paths.test.ts tests/data/helpers/paths.test.ts tests/data/helpers/dates.test.ts tests/server/core/git-parse.test.ts tests/server/git/deposit.test.ts
```

Result: `Test Files  5 failed (5)`, `Tests  8 failed | 28 passed (36)`. The client paths test has since moved to `tests/data/helpers/files/`.

- **`inside`, `below`, `realPath` and the grep audit** did not run: `Error: Cannot find module '../../../src/lib/server/core/paths.ts'`.
- **`nameOf`, `pathUnder` and `deepestHolding`** did not run: `Error: Cannot find module '../../../src/lib/data/helpers/paths.ts'`.
- **`ago`:** four cases failed with `TypeError: ago is not a function`.
- **`localDate`:** passed at runtime, because `new Date(date)` copies a Date; on main it fails only in the type check (section 4, row 6).
- **`statusRecords`:** three cases failed with `TypeError: statusRecords is not a function`.
- **The deposit case** failed with `expected [ Array(1) ] to deeply equal [ { letters: 'A ', path: 'a b.txt' } ]`; the received path was `"\"a b.txt\""`.

The round-1 cases are each shown red against the change they guard in section 4's revert table.

## 4. DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. isRecord | DONE | brief grep; `npm run check` 0 errors |
| 2. Server paths | DONE | `tests/server/core/paths.test.ts` green; reverts below |
| 3. Porcelain | DONE | `git-parse.test.ts`, `deposit.test.ts` green |
| 4. Client paths | DONE | `tests/data/helpers/files/paths.test.ts`, `status.test.ts`, `file-git.test.ts` green |
| 5. ago | DONE | `tests/data/helpers/dates.test.ts` green |
| 6. Local date | DONE | `dates.test.ts`; type revert below |
| 7. Head comments, DESIGN.md | DONE | round 0 grep of DESIGN/HELP/README for removed names printed nothing |
| Allow-list lines | DONE | `duplication.test.ts` green in the verify run |
| R1.1 `/` containment | DONE | `paths.test.ts`, `group.test.ts`; reverts below |
| R1.2 `joinPath` | DONE | `paths.test.ts`, `file-git.test.ts`, `status.test.ts`; reverts below |
| R1.3 `isMap` is the guard | DONE | yaml-import grep prints nothing; `grep -rn isFieldMap src tests` prints nothing |
| R1.4 kept-behaviour tests | DONE | reverts below |
| R1.5 deposit comment | DONE | `sed -n 16p src/lib/state/system/deposit.svelte.ts` |
| R1.6 to R1.8 report | DONE | sections 1 and 7 |
| Verify list | DONE | `verify: 6 commands passed` |
| `npm run diagrams` | DONE | regenerated after the round-1 import change |

What each row covers:

1. **isRecord.** Every copy is gone and every use is `isMap` from `data/helpers/guards.ts`.
2. **Server paths.** `server/core/paths.ts` exports `inside`, `below` and `realPath`:
   - `pathInside`, `permitted`, `underMirrors` and `customizations.ts` go through `inside`;
   - `compose.ts`, `writes/entries.ts`, `writes/subtasks.ts`, `writes/manifest.ts`, `fs/notes.ts`, `deposit.ts` `dropGone` and `audit/projects.ts` go through `below`;
   - the five `real` copies call `realPath`; `insideRepo` is gone.
3. **Porcelain.** `statusRecords` is in `core/git-parse.ts`, and `core/git.ts`, `git-write.ts`, `git-refs.ts`, `git-index.ts` and `deposit.ts` read through it. `deposit-git.ts` runs `status --porcelain=v1 -z`.
4. **Client paths.** `nameOf`, `trimSlash`, `joinPath`, `pathUnder` and `deepestHolding` are in `data/helpers/files/paths.ts`. `rootHolding`, `repoOfFile`, `tabOfFile` and `repoStatus` build on them; `repoOfFile` and `tabOfFile` leave out a repository or served root whose folder is the file itself.
5. **ago.** `dates.ts` has `ago(iso, now, largest)`; `folds.ts` re-exports it and `file-git.ts` words it.
6. **Local date.** `localDate(number | Date)`; both `localDay` copies are gone. With the signature put back to `number`, `npm run check` reported `COMPLETED 1487 FILES 14 ERRORS`, among them `"src/lib/server/machine/usage/transcripts.ts" 43:58 "Argument of type 'Date' is not assignable to parameter of type 'number'.`
7. **Head comments.** Each changed module's head comment names what it imports and from where.

Round 1:

- **R1.1.** `inside` and `below` in `server/core/paths.ts` test `full.startsWith(root + sep)`, so a folder of `/` holds only itself; the head comment says so. `group.ts`:
  ```ts
  function within(path: string, base: string): boolean {
      if (!path || !base) return false;
      return base === sep ? path.startsWith(sep) : inside(path, base);
  }
  ```
- **R1.2.** `data/helpers/files/paths.ts`:
  ```ts
  export function joinPath(dir: string, path: string): string {
      const base = trimSlash(dir);
      if (path === '') return base;
      return base === '/' ? `/${path}` : `${base}/${path}`;
  }
  ```
  `file-git.ts` `wholePath` and `tabOfFile`'s target, and `status.ts` `repoStatus`'s target, call it.
- **R1.3.** `server/edit/list-edit.ts`, `server/edit/entry-edit/host-status.ts` and `data/sources/config/agents.ts` import `isMap as isYamlMap` from `yaml`, every call renamed. `state/boards/collection.ts` imports `isMap` from `data/helpers/guards.ts`; `isFieldMap` is gone. The audit in `tests/server/core/paths.test.ts` gains "leave `isMap` to the guard: no file imports the yaml library's test under that name".
- **R1.5.** `deposit.svelte.ts:16` reads `/** One path \`git status --porcelain=v1 -z\` reported, with git's own two letters. */`.

### The verify list

Command, from `tools/oculus` in the worktree: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`. Exit 0, after the last change:

```
 Test Files  350 passed (350)
      Tests  5540 passed (5540)
1790634953489 COMPLETED 1487 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
All matched files use Prettier code style!
verify: 6 commands passed
```

The `hint: ... git rebase` and `Could not apply ... Main` lines in its output come from the deposit tests' own scratch repositories.

### The brief grep and the yaml-import grep

```
src/lib/server/core/paths.ts:15:export function inside(path: string, dir: string): boolean {
src/lib/server/edit/writes/manifest.ts:130:export function insideHub(hub: string, config: PortfolioConfig, file: string): boolean {
src/lib/server/accounts/calendar/ics.ts:82:function inside(start: ICAL.Time, end: ICAL.Time, window: Window): boolean {
src/lib/views/sources/repositories/merge/MergeSide.svelte:38:    function inside(line: number): SideConflict | undefined {
```

`grep -rnE "import \{[^}]*\bisMap\b[^}]*\} from 'yaml'" src | grep -v "isMap as isYamlMap"` prints nothing (exit 1). The ASCII scan `LC_ALL=C grep -rln '[^ -~<tab>]' src tests bin` prints nothing.

### Each new or changed case, with its change undone

Each change was undone by a script (`q79d-reverts.py` for round 0, `q79d-reverts-r1.py` for round 1, in my scratchpad) that edited the lines, ran the test files, wrote the files back and asserted the restored text equals the original.

Round 0:

| Change undone | Case that turns red, and its failure |
| --- | --- |
| `inside`: prefix without the separator | "refuses a sibling that shares the prefix and a path that walks out": `expected true to be false` |
| `below`: the folder itself admitted | "admits a path strictly below the folder and not the folder itself": `expected true to be false` |
| `realPath`: the link not followed | "follows a symbolic link to its target": `expected '/var/folders/...' to be '/private/var/folders/...'` |
| audit: `inFolder` named `inside` again | "are written nowhere under src, and the four named matches are all that remain": `expected [ ...(5) ] to deeply equal [ ...(4) ]` |
| `statusRecords`: `from` for the index column only | "reads a copy and a rename in the worktree column with their old paths": 3 records where 2 are expected |
| `statusRecords`: the old path not stepped over | both record cases, e.g. 4 records where 3 are expected |
| deposit: `status --porcelain=v1` without `-z` | "lists a changed path with a space as it is, without git quoting it": `path: 'run.py\n'` |
| `nameOf`: the text after the last slash | "is the last non-empty segment": `expected '' to be 'b'` |
| `trimSlash`: the root trimmed to empty | "drops the trailing slashes and keeps the root": `expected '' to be '/'` |
| `pathUnder`: prefix without a slash | "is null outside the folder, a sibling sharing the prefix included": `expected 'x' to be null` |
| `deepestHolding`: the first holder wins | "picks the item whose folder holds the target most deeply": `expected { item: { dir: '/r' }, path: 'sub/f' } to deeply equal { item: { dir: '/r/sub' }, path: 'f' }` |
| `repoStatus`: only the first repository considered | "is the innermost repository holding the file": `expected '/work/hub' to be '/work/hub/projects/paper'` |
| `ago`: `largest` ignored | "stops at the largest unit it is asked for": `expected { unit: 'week', count: 2 } to deeply equal { unit: 'day', count: 14 }` |
| `ago`: the future read as now | "is now for a clock up to a minute ahead, and nothing further ahead": `expected { unit: 'now', count: +0 } to be null` |
| `elide`: the last name not kept | `format.test.ts` "never loses the last name, however long the last name is" |
| `localDate`: the signature back to `number` | `npm run check`: 14 errors, quoted in row 6 |

Round 1:

| Change undone | Case that turns red, and its failure |
| --- | --- |
| `inside`: `startsWith(root === sep ? root : root + sep)` | `paths.test.ts` "holds only the root itself for a folder of the root": `expected true to be false` |
| `below`: the same | `paths.test.ts` "admits a path strictly below the folder and not the folder itself" (`below('/x', '/')`): `expected true to be false` |
| `within`: `return inside(path, base);` | `group.test.ts` "groups a session under a configured root of the separator alone": `expected '/elsewhere/solo/deep' to be '/elsewhere'` |
| `within`: the empty-string guard removed | `group.test.ts` "scores no area for a session with an empty cwd": `expected '/Users/axelfaes/workspace/research-hu...' to be '(general)'` |
| `joinPath`: `` return `${base}/${path}`; `` | `paths.test.ts` "joins by one slash...": `expected '//work/a.txt' to be '/work/a.txt'`; `status.test.ts` "finds the repository of a file on a served root of the root folder": `expected undefined to be '/work/hub'`; `file-git.test.ts` "joins a file under a served root of the root folder without a doubled slash" and "leaves out a repository whose folder is the tab file itself" |
| `joinPath`: the empty-path line removed | "is the folder itself for an empty path": `expected '/r/' to be '/r'` |
| `repoOfFile`: `const holders = repositories;` | "leaves out a repository whose folder is the tab file itself": `expected { root: '/work/repo', path: '' } to deeply equal { root: '/work', path: 'repo' }` |
| `tabOfFile`: `const holders = served;` | "leaves out a served root whose folder is the repository file itself": `expected { root: 'tool', path: '' } to deeply equal { root: 'hub', path: 'tools/oculus' }` |
| `pathUnder`: the empty-folder guard removed | `paths.test.ts`: `expected 'r' to be null`; `file-git.test.ts` "holds no file in a repository whose key is empty": `expected { root: '', path: 'hub/a.txt' } to be null`; `status.test.ts` "holds no file in a repository whose key is empty": `expected { root: '', name: '', ...(8) } to be null` |
| `upward`: `inside` changed to `below` | `customizations.test.ts` "reads the instructions of the account, then the workspace and each folder up to its root" (`upward(ROOT, [ROOT])`): `expected [ ...(7) ] to deeply equal [ Array(1) ]` |
| `accountOfPath`: `below` changed to `inside` | `compose.test.ts` "names the account whose folder holds a transcript, and none for the folder's own path": `expected { tool: 'claude', ...(2) } to be null` |
| audit: `import { isMap, isScalar, isSeq } from 'yaml';` in `host-status.ts` | "leave `isMap` to the guard...": `expected [ Array(1) ] to deeply equal []` |

## 5. Files and their line counts

Counted with `wc -l`. Files touched in round 1 carry their count after round 1; the rest carry their round-0 count and were not changed in round 1.

### New files

| File | Lines |
| --- | --- |
| `src/lib/server/core/paths.ts` | 35 |
| `src/lib/data/helpers/files/paths.ts` | 70 |
| `tests/server/core/paths.test.ts` | 119 |
| `tests/server/core/git-parse.test.ts` | 30 |
| `tests/data/helpers/files/paths.test.ts` | 94 |
| `tests/data/helpers/dates.test.ts` | 49 |

### Moved files

Each is moved into `files/`, with its imports and references repointed: `src/lib/data/helpers/files/text-kind.ts` (41), `src/lib/data/helpers/files/opens-in-program.ts` (77), `tests/data/helpers/files/text-kind.test.ts` (118) and `tests/data/helpers/files/opens-in-program.test.ts` (99).

### Changed files, server and data

| File | Lines |
| --- | --- |
| `data/helpers/dates.ts` | 53 |
| `data/sources/config/agents.ts` | 313 |
| `data/sources/config/settings.ts` | 166 |
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
| `server/edit/list-edit.ts` | 197 |
| `server/edit/writes/entries.ts` | 588 |
| `server/edit/writes/subtasks.ts` | 260 |
| `server/edit/writes/manifest.ts` | 317 |
| `server/edit/yaml-edit.ts` | 720 |
| `server/edit/entry-edit/lines.ts` | 376 |
| `server/edit/entry-edit/entries.ts` | 311 |
| `server/edit/entry-edit/subtasks.ts` | 282 |
| `server/edit/entry-edit/host-status.ts` | 73 |
| `server/accounts/connect/rows.ts` | 220 |
| `server/sessions/group.ts` | 444 |
| `server/sessions/stores/customizations.ts` | 452 |
| `server/machine/pty/compose.ts` | 227 |
| `server/machine/usage/transcripts.ts` | 200 |

### Changed files, client state

| File | Lines |
| --- | --- |
| `state/boards/collection.ts` | 798 |
| `state/system/deposit.svelte.ts` | 128 |
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
| `tests/server/sessions/group.test.ts` | 427 |
| `tests/server/sessions/stores/customizations.test.ts` | 250 |
| `tests/server/machine/pty/compose.test.ts` | 367 |
| `tests/state/sources/repositories/file-git.test.ts` | 148 |
| `tests/state/workbench/navigation/status.test.ts` | 287 |
| `tests/state/shared/words/format.test.ts` | 153 |
| `tests/state/sessions/folds.test.ts` | 352 |
| `tests/state/life/calendar.test.ts` | 295 |
| `tests/routes/files/open-program.test.ts` | 375 |
| `tests/routes/files/open-fixture.ts` | 126 |
| `DESIGN.md` | 322 |
| `docs/diagrams/` | regenerated by `npm run diagrams` |

## 6. Judgment calls, each reversible

1. **The client path helpers live in `src/lib/data/helpers/files/paths.ts`** (accepted in round 1). With `paths.ts` in `data/helpers`, `size.test.ts` failed with `src/lib/data/helpers holds 11 items, over the ten a folder may hold`. `files/` holds `paths.ts`, `text-kind.ts` and `opens-in-program.ts`, and their tests moved to `tests/data/helpers/files/`.
2. **The widenings the round-0 ruling accepted:** `boundaries.test.ts` and `DESIGN.md:169`; state re-exports for the views (`file-type.ts` for `nameOf`, `folds.ts` for `ago`, `calendar.ts` for `localDate`); `isYamlMap` in `yaml-edit.ts`, `entry-edit/lines.ts`, `entries.ts`, `subtasks.ts` and `rows.ts`, and now in `list-edit.ts`, `host-status.ts` and `agents.ts`; `inFolder` in `selectors.svelte.ts`, and `within` in `sessions/group.ts`.
3. **`trimSlash('/')` stays `/`,** so the root folder holds every absolute path in `pathUnder`, and `joinPath('/', p)` is `/p`.
4. **`pathUnder` trims the target's trailing slashes too,** so `/r/x/` under `/r` is `x`.
5. **`deepestHolding` ranks folders by their trimmed length, and the first of equal depth wins.**
6. **`inside` and `below` of a folder of `/`:** `inside('/', '/')` is true, `inside('/Users/x', '/')` false, `below('/x', '/')` false, `below('/', '/')` false, as every copy on main behaved.
7. **`core/git.ts` `inside`, and the checks in `files.ts`, `fs.ts` and `open.ts`, resolve paths that are already real,** which gives the same path.
8. **`sessions/group.ts` `within` resolves before comparing,** through core `inside`, except for a base of `/`, which holds every absolute path as on main. Its paths are absolute session folders.
9. **`compose.ts` and `customizations.ts` moved from a test through `relative` to a prefix test** (section 7, item 6).
10. **Tests moved or narrowed:** the folds `ago` cases moved into `tests/data/helpers/dates.test.ts`; the `basename` cases of `format.test.ts` are covered by the `nameOf` cases, and its `basename(null)` case is gone since `nameOf` takes a string; `tests/server/core/git-parse.test.ts` is new.

## 7. User-visible changes, before and after

1. **A name with a trailing slash.** In the terminal rows, the Usage view and the Timeline: before, `basename('a/b/')` gave `''` and the row was empty; after, `nameOf('a/b/')` gives `b`.
2. **A commit dated more than a minute in the future.** In the Repositories blame gutter and the status bar's blame item: before, it showed "just now"; after, it shows no age. A commit up to a minute ahead still reads "just now".
3. **The deposit's porcelain moves to `-z`.** In the Deposit plan's list of changes: before, a path with a space or a non-ASCII byte came quoted, for example `"a b.txt"`, and a rename came as `old -> new`; after, the path comes as it is, `a b.txt`, and a rename is listed by its new path.
4. **A repository key or served root of `''`.** The Sessions list does not change, because its caller guards the empty folder: `sessionsForProject` returns `[]` for `folder === ''` (`selectors.svelte.ts:454`). What changes is in the source tab's gutter and blame and in the status bar's branch item: a repository key or served root of `''` held every absolute path before, and holds nothing after. Cases: "holds no file in a repository whose key is empty" in `file-git.test.ts` and `status.test.ts`.
5. **`statusRecords` reads a `from` when either column is R or C.** Before, a worktree rename (`' R'`) left its old path to be read as a record of its own, a row in the Changes list cut from the old path; after, the old path is read into `from` and never becomes a row. Not checked against a real repository, since that would take a git command.
6. **A folder whose name starts with two dots.** `/a/..b` is now inside `/a` for the composer's image check and account lookup (`compose.ts`) and for the Customizations walk (`customizations.ts` `upward`); before it was refused.
7. **The stash control with mode `staged`, when the only change is a worktree rename or copy.** Before, the stash went ahead; after, it is refused with "there is nothing here for that stash to take".
8. **A served root of `/`.** Repository lookups on the page (the source tab's gutter and blame, the status bar's branch item) work as on main, through `joinPath`. The server's containment of `/` is as on main: a folder of `/` holds only itself.

## 8. What in the brief and the round was wrong, with the evidence

1. **The grep case contradicted the brief's own naming** (round 0, ruled in `briefs/Q79d-cases.md`).
2. **The state row of the boundary table did not list the client path helpers** (round 0, added as ruled).
3. **Decision 1's path put an eleventh item in `data/helpers`** (round 0, judgment call 1, accepted in round 1).
4. **Items 5 and 6 had views import from `data/helpers/dates.ts`, which the views row forbids** (round 0, state re-exports as ruled).
5. **Round 1 item 3's audit pattern matches the aliased imports it asks for.** `import \{[^}]*\bisMap\b[^}]*\} from 'yaml'` matches `import { isMap as isYamlMap, ... } from 'yaml'`; run as given, the new case failed with `expected [ ...(8) ] to deeply equal []`, the eight aliased files. The pattern in the test is `/import \{[^}]*\bisMap\b(?! as )[^}]*\} from 'yaml'/`, which finds an unaliased import (red with `host-status.ts` put back to `import { isMap, isScalar, isSeq } from 'yaml';`, section 4) and passes the aliased ones.
6. **Round 1 item 3's head-comment line would be false in the three new files.** The five earlier files say "A parsed value is taken for a map by data/helpers/guards.ts's `isMap`", and they do import the guard. `list-edit.ts`, `host-status.ts` and `agents.ts` import no guard, so they carry: "`isMap` names data/helpers/guards.ts's test of a parsed value in every file, so the yaml library's own node test is imported as `isYamlMap`."
7. **One unaliased yaml `isMap` import remains outside `src`:** `bin/migrations/migrate-joint-work.mjs:29` (`import { Document, isMap, isSeq, parse, stringify } from 'yaml';`). It is a `.mjs` migration script outside the audit's `src` scope, imports no guard and is not in the round's list, so it is unchanged.
