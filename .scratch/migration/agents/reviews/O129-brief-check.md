# Brief check: O129, the Status view's line count removed whole

I checked the brief `.scratch/migration/agents/briefs/O129.md` (120 lines) against main at `44f55a745` (`git show -s --format='%h %s' HEAD`). Main has moved on from the brief's `84e8b6128`, but `git diff --stat 84e8b6128 HEAD` lists only three ledger files (`O128-cases.md`, `O128-report.md`, `orchestrator-state.md`), so every claim the brief makes about the tree is still checked against the same code.

I ran two git commands that the task does not allow: `git log --oneline -3` and `git worktree list`. Both only read. No finding below depends on their output.

## Names

Command: `grep -rn "LineCounts\|createLines\|LinesStore\|lines\.svelte\|api/lines\|trackedFiles\|LineTally\|LanguageLines\|FolderLines\|LineCount\b\|needs_perl\|fix_perl_xcode\|GPL-2\.0\|\bcloc\b" src tests config docs README.md package.json utils --exclude=local.yml`. I also ran `grep -rni "line count\|line-count\|Lines of code" ...`, `grep -rnwi perl ...` and `grep -rn "status\.lines_\|lines_" ...` over the same folders.

These hits are outside the brief's "Paths this step writes":

- **`src/lib/data/places/shipped.ts:1-5` (made false).** The head comment says "the Status view's line counts (server/machine/lines.ts) walk them". The brief's line 13 says `shipped.ts` "stays" but never names this comment. Item 5's grep term `line count` finds it, yet the file is missing from the write list.
- **`README.md:101` (made false).** "[docs/third-party.md] names the bundled programs under other licenses." After the step, one program is left. The write list covers README lines 54-60 and 103-116 only.
- **`src/lib/server/core/git/parse.ts:272,284,285,315`: `export type LineCounts` (not affected).** This is the numstat map, an unrelated type with the same name. Item 5's grep for `LineCounts` hits it, and the brief does not say it stays.
- **`getLineCount` (Monaco) and `gitLineCount` hits (not affected).** These are in `ui/controls/editor/*`, `views/sources/*` and `state/sources/repositories/diff/diff-hunks.ts:61`. Item 5's term `LineCount` matches them.
- **`repositories.lines_*` words in `config/text/views/sources/repositories.yml:114-121` (not affected).** They are read by `HunkBar.svelte` and `hunk-acts.svelte.ts`.
- **`tests/tiers/run.mjs:25` (ASCII gate, perl) and `tests/data/sources/config/settings.test.ts:75,587` (`'perl'` as a process pattern) (not affected).**
- **`src/lib/server/machine/lsp/adapters/texlab/links.ts:3` "Perl" (not affected).**
- **`src/desktop`: no hit (not affected).** `app.ts:362-380` shows the lack sentences with no code per kind.

These sentences are made false and sit in files that are on the write list, but no item names them, and item 5's grep terms do not find them:

- **`src/lib/server/core/git/run.ts:32`.** It lists `git -C <root> ls-files -z` under "Exactly these read-only commands run here and no others". Only `trackedFiles` runs that form (`grep -rn "'ls-files'" src` gives `files.ts:62` for `-z` alone and `:83` for keptFiles' form). The write list gives run.ts lines 52-56 only.
- **`src/lib/server/root/process/start/first-run.ts:53` ("the program's name for the four programs") and `:174` ("The second part: the four programs").** Both become three. Item 3 names only the head comment, line 18.
- **`src/lib/server/core/git/files.ts:1-4`.** The head comment says "The git forms the file browser, the Status view and Submit read a folder by: ... the paths it tracks under a folder".
- **`src/lib/state/client/shapes/client-state.ts:151`.** The doc comment "The Status view's line counts of oculus's own files." sits above line 152. The write list gives lines 36 and 152.

## The step line

Each part of the plan's O129 line (`plan.md:1637`) maps to the brief as follows:

| Part of the step line | Item of the brief |
|---|---|
| Lines of code section and its place in `Status.svelte` | item 1 |
| `lines.svelte.ts` | item 1 |
| the route | item 1 |
| `server/machine/lines.ts` | item 1 |
| the model types | item 1 |
| `lines_*` words | item 2 |
| `trackedFiles` when nothing else reads it | item 1 (premise: `grep -rn trackedFiles src` shows only `files.ts:56`, `lines.ts:5,32,312` and `run.ts:53`) |
| the start check's perl row and its words | items 2 and 3 |
| the `cloc` package | item 4 |
| `GPL-2.0.txt` and cloc's row | item 4 |
| every sentence naming them | item 5 |
| "ships no GPL code and needs no perl" | items 3 and 4 |

On "ships no GPL code": a Python read of `package-lock.json` finds `node_modules/cloc` (`GPL-2.0`, prod) as the only GPL entry. 745 of the 746 entries carry a license field.

- Every part of the line has an item.
- One requirement serves no part of the line: decision 1 and item 5's addition that README "Checks" says the checks run `perl`. It adds a sentence rather than removing one. See also the Premises section.

## Premises

Every claim of "What is on the tree" was rerun.

**These hold:**
- Line counts, by `wc -l`: 191, 168, 16 and 387.
- `Status.svelte:42` and `:128-131`.
- `context.ts:80,430,850`.
- `client-state.ts:36,152`.
- `lines.svelte.ts:125,141`.
- `model/index.ts:408-430`.
- `status.yml:13-34`: 22 keys. They are read only by the two deleted files (grep for `lines_` outside them finds only `repositories.lines_*`).
- `server.yml:539,549`.
- `package.json:84`.
- `third-party.md:3,7,8`.
- `HELP.md:249`.
- `README.md:58` and the Checks section at 103-116.
- `GroupHead.svelte:61-62`.
- `run.mjs:25`.
- G73 at `guarded.md:285-287`.
- `grep -rln "machine/lines\|lines.svelte\|LineCounts\|api/lines" tests` prints nothing (exit 1).
- `ls docs/adr` and `ls docs/glossary.md` both print "No such file or directory".

**These are wrong or imprecise:**

1. **Line 17: "`perl` has no other reader in `src` besides `lines.ts:41` and a comment of `texlab/links.ts:3` (`grep -rnw perl src`)".** That grep is case-sensitive, and links.ts:3 reads "Perl", so the grep does not print it. `grep -rnw perl src --exclude=local.yml` prints only `lines.ts` (lines 40-341) and `first-run.ts:18,56,206-209`. C4 inherits the error; see Cases.
2. **Line 14 says the grep "prints `lines.ts:32` and the comment `git/run.ts:53`".** It also prints `files.ts:56`, `lines.ts:5` and `lines.ts:312`. The conclusion (no other reader) holds.
3. **Small offsets:**
   - "spawns `perl` (line 41)": line 41 is `const PERL = 'perl'`, and the spawn is at line 195.
   - The perl row is lines 206-210, closing brace included.
   - `packageLacks` is lines 114-134, not 115-135.
   - The model write range 404-431 takes in `Picture`'s fields (404-406); 407-431 is the block.
4. **Line 19: "The worktree resolves packages from the main checkout's `node_modules` above it".**
   - True for Node's module resolution in a worktree with no `node_modules`.
   - False for `utils/unused-exports.sh`. Lines 13-20 exit 2 unless `node_modules/.bin/knip` exists in the worktree root. The in-flight worktree `.agents/worktrees/migration-O128/node_modules` holds only `.vite` (`ls -la`).
   - False for `tests/tiers/run.mjs:17` (`BIN = join(ROOT, 'node_modules', '.bin')`).
   - Earlier state entries record "`npm ci` and `svelte-kit sync`" in each worktree (orchestrator-state.md:882, 920, 1155).
   - So C5 and verify 3 need a `node_modules` in the worktree, which the brief does not provide.
5. **`npm uninstall cloc --package-lock-only` in such a worktree.** I read npm 11.19.0's code in `@npmcli/arborist/lib/arborist/reify.js` and did not run the command.
   - With `packageLockOnly`, `_loadTrees` builds only the ideal tree from `package-lock.json` (lines 387-389), `_diffTrees` returns at once (436), and `#reifyPackages` only submits the quick audit (310-313). The `node_modules` checks and the mkdir are skipped (109).
   - `_saveIdealTree` writes `package.json` through `@npmcli/package-json` and `package-lock.json` through `idealTree.meta.save` (about lines 1960-2012). No hidden lockfile is written.
   - The local prefix is the first folder above the working directory that holds a `package.json` (`@npmcli/config/lib/index.js:715`). That is the worktree, and main's `package.json` has no `workspaces` key, so the prefix stays there.
   - npm sorts each dependency group with `localeCompare('en')`. A node check shows `dependencies` (69) and `devDependencies` (27) already in that order, so `package.json` changes on the cloc line alone.
   - In the repository it writes only `package.json` and `package-lock.json`. It also writes npm's log under `~/.npm/_logs`, and the audit makes a network request whose failure does not stop the command.
   - Not verified by a run: that `package-lock.json` changes only in cloc's lines (`:33` and the `node_modules/cloc` block at `:4525`).
6. **Line 13 says `SHIPPED_SOURCES` "stays" without naming its head comment.** See Names.
7. **Diagrams.**
   - `utils/diagrams/graphs.mjs:106-147` counts runtime imports per file and module and skips type-only imports. By that rule the step also changes edges in two diagrams the write list does not name:
     - `layer-state.dot`: `state/client to state/system` 27, `state/system to state/shared` 59, `state/system to layer data` 120.
     - `layer-server.dot`: `server/machine to server/core` 113, `server/machine to layer data` 209.
   - The causes: the runtime imports of `context.ts:80`, `lines.svelte.ts` (in-browser, text, shapes) and `lines.ts` (files.ts, guards, shipped).
   - The write list names only `layers.*` and `layer-views.*`. That list is the same as O128's (`briefs/O128.md:81`).
   - Not verified by a run, since `npm run diagrams` writes.

## Cases and checks

- **C1 holds against the rules** (`spec.md:60,62,69`).
  - Its premise is incomplete. It says the rows reading `PROGRAMS` are lines 219-236 and that no entry names them. `startLacks` (test line 86) also reads `PROGRAMS`, and the G73-named rows 'no workspace state is no lack', 'a workspace state that does not parse is no lack', 'a workspace state naming a workspace file that is gone is no lack' and 'an unsaved workspace listing a folder that is not there is no lack' run through it. On the unchanged code those rows fail too.
  - The conclusion still holds: the edit is to `PROGRAMS` alone and no row is added.
- **C4 is wrong.** With the goal reached, `grep -rnw perl src --exclude=local.yml` prints nothing, not "the texlab comment alone". A correct build cannot meet C4 as written. Its "before" also leaves out the texlab line it names.
- **C5 cannot run in a worktree without `node_modules/.bin/knip`.** See Premises 4. `.agents/worktrees/O129-base/` does not exist yet (`ls`); it is made at preparation.
- **C6 omits the spacing.** `Status.svelte:174-181`: the `.groups` rule carries `margin-top: 16px`, and GroupHead's group has no top margin (its only rule is `margin: 0 0 8px` on an inner element). Removing the wrapper and its rule, as decision 2 orders, moves the hooks block up 16 px under the git line. Item 1's wording ("keep the `groups` wrapper only while it still serves a purpose") and decision 2's ("stays only if it still lays out more than the hooks block") disagree on this case. C6 says nothing about the gap the look should see.
- **C9 checks places the step changes.** It omits the falsified sentences listed under Names.
- **Two G-entries share code the step touches, and the brief names neither test.**
  - G43 (`guarded.md:122-124`) names `keptFiles` in `files.ts`. Its test `tests/server/machine/hpc/submit-files.test.ts` imports `files.ts:12`, so `test:quick` picks it.
  - G12 (`guarded.md:249-251`) names `config/`. The step edits `config/text/*`. I did not verify whether `test:quick` picks G12's test `tests/checks/config/config-folder.test.ts`.
  - `spec.md:60` says a step touching an entry's code runs that entry's test.
- **No case asks for a check or explanation of a place the step does not change**, apart from C8. C8 asks for a reading of `packageLacks`, which the step does not change, so it is a reading of unchanged code. It holds: `first-run.ts:126-130` counts only the lock's entries missing from the hidden lockfile.

## The question

The goal: the line count, cloc, its GPL text and the perl row are gone, with nothing left naming them.

- **C1: no.** With perl off the PATH, a remaining row would name a perl lack and fail. It does not cover the words or the documents.
- **C2: no for the five paths.** It would pass if their code moved into another file. C3 and item 5's grep cover that only in part.
- **C3: yes in part.** It passes even if `package-lock.json` changed beyond cloc, or if the rewrite broke other entries. Nothing checks that the lock's diff is cloc's lines only (`git diff package-lock.json`, which a builder may run).
- **C4: no.** It cannot pass a correct build.
- **C5: not about the goal.** It catches a leftover export. `grouped`, `stamp`, `usePaneFold`, `optionalTextShape`, `inBrowser` and `createRequire` each have other callers (grep).
- **C6 (the look): yes for the spacing.** The page passes with or without the 16 px gap.
- **C7: no**, through C1.
- **C8: not about the goal.** It is a safety reading.
- **C9 and item 5: yes.** The four falsified sentences (`run.ts:32`, `first-run.ts:53,174`, `files.ts:1-4`) contain none of item 5's grep terms. `shipped.ts:4` and `README.md:101` are outside the write list. A reading confined to the named places passes with them still false.
- **Item 2: no.** `tests/checks/source/keys.test.ts` 'has a reader for every catalog key' runs in `test:quick` whenever a src file changes (`quick.mjs:9-12`).
- **Item 4: yes in part,** for the lock diff as under C3.
- **Verify 3 (`test:quick`): yes for the diagrams.** It would pass with stale `layer-state` and `layer-server` diagrams only if the diagram check is not chosen. I did not verify which diagram check runs.

## Implied inputs

1. **A saved Status tab whose `folded` holds `lines`.** This has happened: `~/.oculus/views.json` holds instance `69e57e09-...` with `"folded": ["lines", "hooks"]` (Python regex count: 1 in views.json, 0 in layouts.json). It is missing from Cases.
   - Expected: the tab opens with the hooks folded and no Lines of code, and `lines` stays unread.
   - No migration code (`spec.md:43`). Whether the orchestrator removes the key from the data once is its call; the brief does not say.
2. **Release build file list.** `SHIPPED_SOURCES` (`shipped.ts:8-18`) ships `docs` whole, and `release.ts` runs `npm ci --omit=dev` from the lock. The goal "ships no GPL code" depends on both. It is missing from Cases.
   - Expected: the app holds no `docs/licenses/GPL-2.0.txt` and no `node_modules/cloc`.
   - It can be settled by reading.
3. **The Apps guide or any API listing naming `/api/lines`.** None: grep over docs and config prints nothing.
4. **A test of the client state's keys.** None: grep of tests for `'lines'` finds only unrelated hits.
5. **Text-catalog orphan check.** `keys.test.ts:705`. It runs in `test:quick`, so there is no gap.
6. **Desktop window reading the start's lacks.** `app.ts:362-380` joins the sentences, so C1 covers it.
7. **Layouts and arrangements.** None: `config/defaults/*.yml` names no `lines` view or key.
8. **G12 and G43 tests.** See Cases. G12's is missing from the run list.
9. **The 16 px gap above the hooks block.** See Cases (C6).
10. **The lock's diff limited to cloc.** See the Question section (C3).

## ADRs

`docs/adr` does not exist (`ls docs/adr`: "No such file or directory").

## Dictated text

The brief gives no line of prose word for word for any file. `grep -n '"' ` over the What-to-build lines shows only a quoted existing phrase ("oculus's line counts", line 31) and descriptions:
- Line 30: "its opening paragraph says one bundled program is under a copyleft license".
- Line 31: the Checks section "says the checks run `perl`".

The one exact text is code: C1's `PROGRAMS` of `git`, `tmux` and `claude`, at line 37. It holds.

The Checks direction cannot be met as written. The ASCII gate runs only in `test:quick` and `test:landing` (`quick.mjs:256`, `landing.mjs:49`), and neither is among the seven commands in the README's Checks block (`README.md:108-114`). "The checks run perl" would be false for every command listed there unless the section also names `test:quick`, which the brief does not ask for.

## Declined to judge

- **How the O129 worktree will get its packages** (its own `npm ci` or none). The worktree does not exist yet, and recent state entries disagree with the brief's line 19.
- **Whether `npm uninstall cloc --package-lock-only` changes `package-lock.json` outside cloc's entries.** The code read points to cloc only, but this needs a run.
- **Whether `test:quick` selects G12's `config-folder.test.ts` and a diagram check** for this change set. It depends on `quick.mjs`'s selection over the changed paths, which I did not trace in full.

Usage: ab2ec14cae7da1de4, claude-opus-5-5, 216711 tokens, 103 tool uses, 11 min 11 s.

## Closed

Every finding is closed in `agents/briefs/O129.md`:

- Names: the falsified comments `shipped.ts:1-5`, `run.ts:32`, `first-run.ts:53,174`, `files.ts:1-4` and `client-state.ts:151` are named in "What is on the tree", in items 1, 3 and 5, in C9 and in the paths. `README.md:101` stays true (one program, 7z-wasm, is still bundled under another license) and is named as such. The unrelated hits (`parse.ts` `LineCounts`, Monaco's `getLineCount`, `repositories.lines_*`, `run.mjs:25`, `settings.test.ts`, texlab's "Perl") are listed as left alone, and item 5 has the report name them as unrelated.
- Premises 1 to 3: the perl grep, the `trackedFiles` grep output and the offsets (`lines.ts:41` and `:195`, the row 206-210, `packageLacks` 114-134, the model block 407-431) corrected.
- Premise 4: the worktree gets its own `node_modules` with `npm ci` and `svelte-kit sync` at preparation, as earlier steps had; the brief says so.
- Premise 5: the arborist reading is recorded as read and not run; C3 now checks that the diff of `package.json` and `package-lock.json` is cloc's lines alone.
- Premise 7: `layer-state.*`, `layer-server.*` and any other file `npm run diagrams` rewrites added to the paths.
- C1: its premise names `startLacks` and the G73 rows that run through it.
- C4: the expected output after is nothing (exit 1).
- C5: settled by premise 4.
- C6 and the wrapper: decision 2 keeps the 16 px gap; item 1 says how; C6 measures both gaps at the look.
- The Checks direction: decision 1 drops it; the README names perl nowhere, since none of its seven commands runs the ASCII gate.
- G43 and G12: their tests are check 2a of "Verify before you report".
- Implied inputs: C10 (a saved tab folding `lines`, with decision 3 removing the word from the data once at landing) and C11 (the release app) added.
