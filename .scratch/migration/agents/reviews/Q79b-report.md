Everything in the brief is done, with the rulings of `agents/briefs/Q79b-cases.md` applied. Two things fall outside it and are stated first:
- A file whose every case is filtered out or skipped (`-t`, the `slow` tag filter, `describe.skipIf`) never sets the fixture up, so a directory it makes at module level stays behind. vitest's `afterAll` behaves the same (probe below), so this is not new with this step, but it is not fixed. It matters for `npm run test:slow` over the files that make a directory at module level. The fix would move those calls into `test.beforeAll`, which is a different concern from this brief's one registration; it is named under "Every judgment call" as a proposal.
- `tests/checks/tree/allow-duplication.txt` is outside the brief's path list and was changed: the held clones the edits re-shaped were re-keyed (section 8).

## Open items of the main checkout's orchestrator-state.md, verbatim

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## The cases' first run (unchanged tree, worktree at 89a83e3b)

Commands: `npx vitest run tests/checks/source/code.test.ts --reporter=verbose`, `npx vitest run tests/checks/tree/scratch.test.ts -t "first run"`, `npx vitest run tests/checks/source/code.test.ts tests/checks/source/html-sites.test.ts tests/checks/source/history.test.ts tests/checks/tree/negatives.test.ts`.

| Case | First run |
|---|---|
| 1 | Red: the planted file ran in a child vitest and failed with `TypeError: Cannot read properties of undefined (reading 'beforeAll')`, the helper having no `test` |
| 2 | Refused by the old rule: `tests/a.test.ts takes a scratch directory and registers no sweep` |
| 3 | Not refused: the old rule gives `[]` |
| 4 | Refused by the old rule: `tests/c.test.ts ... registers no sweep` |
| 5 | The prose file refused (`tests/d.test.ts ... registers no sweep`); the spread import refused (`tests/e.test.ts ... registers no sweep`) |
| 6 | Red: line 2 of `fileCode` is `'    return /it\'                '` |
| 7 | Passes |
| 8 | Passes (the `//` is mid-line) |
| 9 | Red: `'<p>{x /* e */}</p>\n'` unchanged |
| 10 | Passes, `[1]` |
| 11 | Passes, `[2]` |
| 12 | Passes, `[2]` |
| 13 | Red: code.ts exports no `withoutComments` |
| 14 | Red: `[ 'bad', 'good(x)' ]` |
| 15 | Red: `src/url.ts:1: const url = 'http://x/Q12';` reported |
| 16 | Red: `commentAbove` gives `'    * 2,'` |
| 17 | Red: no throw |
| 18 | Recorded before any walker changed: `node <scratch>/q79b-builder/walks/before.mjs <scratch>/q79b-builder/walks/before.json`, 49 lists |
| 19 | Throws, and leaves `oculus-escape-LV53nx` in the parent of `$TMPDIR` (removed by hand) |

The first run found the history rule's gap (trailing comments); the orchestrator ruled option A in `agents/briefs/Q79b-cases.md`, with the helper made to check before it makes (ruling 2), the count 102 (ruling 3) and `.html`/`.svg` read as markup (ruling 4). All are built.

## DONE / NOT DONE

| Deliverable | State | Proof |
|---|---|---|
| The fixture in `tests/fixtures/scratch.ts`, exported as `test` and `it` | DONE | `npx vitest run tests/checks/tree/scratch.test.ts`: `Tests  14 passed (14)`; the case running a planted file through a child vitest passes |
| 101 suites off `afterAll(sweepScratch)` onto the fixture's `it`/`test` (scratch.test.ts being the 102nd) | DONE | `grep -rl "afterAll(sweepScratch)" tests` prints nothing |
| The scratch check on the new rule, on the code reader, with the refusals | DONE | cases 2 to 5 as tests; revert runs below |
| Redundant tmpdir assertions deleted, others kept | DONE | `grep -rn "startsWith(resolve(tmpdir())" tests \| wc -l` prints 13 (section 6) |
| `code.ts` on TypeScript's parse and svelte/compiler, `withoutComments` and (ruling 1) `commentText` added | DONE | `npx vitest run tests/checks/source/code.test.ts`: `Tests  10 passed (10)` |
| keys, negatives, history, boundaries, html-sites on the reader | DONE | each file passes; revert runs below |
| Every folder walk on `fs.globSync`, compared | DONE | section 7: `every list equal` |
| Verify 1: the checks script | DONE | `checks: 6 commands passed`, `Test Files  357 passed (357)`, `Tests  5720 passed \| 1 skipped (5721)` (fourth run; see below) |
| Verify 2 | DONE | `grep -rl "afterAll(sweepScratch)" tests` prints nothing |
| Verify 3 | DONE | prints 13, listed in section 6 |
| Verify 4 | DONE, with a caveat | `ls "$TMPDIR" \| wc -l` 1519 before and 1521 after `npm test`; the two new names, `mohsVBcL2y3P1jGmFIBdY` (holding a vite `ssr` folder) and `pin-test.pBXnVZ` (already gone at the next `ls`), match nothing this tree makes (`grep -rn "pin-test" tests src bin` prints nothing). Other suites and a dev server write to the same `$TMPDIR` while this runs (`uptime` load 13 to 14). A run of `npx vitest run tests/checks/tree/scratch.test.ts` (`Tests  14 passed (14)`) with `ls` of `$TMPDIR` and of its parent sorted and compared by `comm -13` before and after adds no `oculus-` entry to either; its one new entry, `9nnjE61LjXjswm-wvQvr8`, was gone at the next `ls` |
| Verify 5 | DONE | `grep -rn "readdirSync" tests` lists one-folder reads only (section 7) |
| Verify 6 | DONE | `npm run diagrams` exit 0; `diff -rq docs/diagrams <main>/tools/oculus/docs/diagrams` prints nothing |
| Verify 7: reverts | DONE | section below |

The checks script ran four times. Runs 1 to 3 each failed `npm test` on timeouts only, under load average 13 to 14 (`uptime`): `git-ops.test.ts`, `git.test.ts`, `git-reads.test.ts`, `cycles.test.ts`, `docs.test.ts` and history's planted case (`Test timed out in 5000ms`), plus `comment-width` on one of my comment lines, since fixed. Each passes alone:
- `tests/server/core/git-reads.test.ts: Tests  17 passed (17)`
- `tests/server/core/git.test.ts: Tests  42 passed (42)`
- `tests/server/git/git-ops.test.ts: Tests  37 passed (37)`
- `npx vitest run tests/checks/imports/cycles.test.ts tests/checks/source/history.test.ts tests/routes/docs/docs.test.ts`: `Tests  48 passed (48)`, history's planted case in 60ms.

The fourth run, at load 7.8, printed `checks: 6 commands passed` and exited 0. In the verify-4 run `git-ops.test.ts` "routes each action to its own operation with its own fields" timed out again; it passes alone as above. `order.test.ts` "holds the data folders" and `size.test.ts` "is on the list with a count it has not passed" did not fail in any run.

### Revert runs (each file put back after its run)

Command: `python3 <scratch>/q79b-builder/reverts.py`, which applies the revert, runs `npx vitest run <file> -t <case>` and restores the file. Its output:

```
code: regex strings: Tests  1 failed | 9 skipped (10)
code: style as module: Tests  1 failed | 9 skipped (10)
code: markup comments: Tests  1 failed | 9 skipped (10)
code: html comments: Tests  1 failed | 9 skipped (10)
code: css as module: Tests  1 failed | 9 skipped (10)
code: shell any #: Tests  1 failed | 9 skipped (10)
code: withoutComments: Tests  1 failed | 9 skipped (10)
code: commentText: Tests  1 failed | 9 skipped (10)
code: syntax errors: Tests  1 failed | 9 skipped (10)
scratch: make before check: Tests  1 failed | 13 skipped (14)
scratch: fixture sweeps none: Tests  1 failed | 13 skipped (14)
rule: no vitest names: Tests  1 failed | 13 skipped (14)
rule: no HOOKED: Tests  1 failed | 13 skipped (14)
rule: HOOKED on raw text: Tests  1 failed | 13 skipped (14)
rule: suites only: Tests  1 failed | 13 skipped (14)
rule: name not propertyName: Tests  1 failed | 13 skipped (14)
history: comment lines only: Tests  1 failed | 2 skipped (3)
history: code line whole: Tests  1 failed | 2 skipped (3)
negatives: star line: Tests  1 failed | 10 skipped (11)
boundaries: span only: Tests  1 failed | 10 skipped (11)
html-sites: text match: Tests  1 failed | 9 skipped (10)
cited-lines: every path passes: Tests  1 failed | 9 skipped (10)
```

The shell line above is from `python3 <scratch>/q79b-builder/reverts.py 'code: shell any #'`, run again after the case gained its assertion `fileCode('a.sh', "echo '#'\n")`; the full run's log (`logs/reverts.txt`) holds the line from before, `Tests  1 passed`. Two cases are marked as audits in their comments: the division case in `code.test.ts` and the clean-file case in `scratch.test.ts`. The spread-import half of the prose case is also marked as an audit of `vitestNames`. The reverts of "make before check" and "fixture sweeps none" leave what they revert to leaving: `oculus-escape-jBBeOf` in the parent of `$TMPDIR` and four `oculus-sweep-*` directories in it. Those five were removed by hand by literal path; `ls -d` of both patterns now finds none. The other `oculus-*` directories in `$TMPDIR`, dated Sep 27 and Sep 28, predate this step's runs and were left alone.

## Files, line counts before (main checkout at 89a83e3b) and after

| File | Before | After |
|---|---|---|
| `tests/checks/bin/cited-lines.test.ts` | 148 | 150 |
| `tests/checks/bin/claude-usage.test.ts` | 94 | 92 |
| `tests/checks/bin/migrate-joint-work.test.ts` | 200 | 196 |
| `tests/checks/bin/rename-pillar.test.ts` | 114 | 112 |
| `tests/checks/config/config-folder.test.ts` | 681 | 679 |
| `tests/checks/config/config.test.ts` | 675 | 672 |
| `tests/checks/config/integrity.test.ts` | 222 | 211 |
| `tests/checks/diagrams/diagrams.test.ts` | 862 | 860 |
| `tests/checks/diagrams/tree.ts` | 52 | 50 |
| `tests/checks/imports/augments.test.ts` | 131 | 127 |
| `tests/checks/imports/cycles.test.ts` | 120 | 116 |
| `tests/checks/imports/graph.ts` | 187 | 181 |
| `tests/checks/imports/order.test.ts` | 156 | 152 |
| `tests/checks/look/contrast.test.ts` | 265 | 265 |
| `tests/checks/source/add-forms.test.ts` | 76 | 74 |
| `tests/checks/source/code.ts` | 146 | 235 |
| `tests/checks/source/comment-width.test.ts` | 79 | 83 |
| `tests/checks/source/history.test.ts` | 171 | 171 |
| `tests/checks/source/html-sites.test.ts` | 319 | 321 |
| `tests/checks/source/keys.test.ts` | 485 | 470 |
| `tests/checks/tree/allow-duplication.txt` | 203 | 197 |
| `tests/checks/tree/audits.test.ts` | 395 | 384 |
| `tests/checks/tree/boundaries.test.ts` | 593 | 590 |
| `tests/checks/tree/duplication.test.ts` | 610 | 608 |
| `tests/checks/tree/negatives.test.ts` | 334 | 342 |
| `tests/checks/tree/scratch.test.ts` | 424 | 475 |
| `tests/checks/tree/size.test.ts` | 211 | 203 |
| `tests/data/sources/calendar-config.test.ts` | 138 | 134 |
| `tests/data/sources/career.test.ts` | 191 | 187 |
| `tests/data/sources/collections.test.ts` | 264 | 260 |
| `tests/data/sources/docs.test.ts` | 247 | 243 |
| `tests/data/sources/feeds.test.ts` | 150 | 145 |
| `tests/data/sources/mail-config.test.ts` | 139 | 135 |
| `tests/data/sources/manifests.test.ts` | 315 | 311 |
| `tests/data/sources/present.test.ts` | 337 | 333 |
| `tests/data/sources/registries.test.ts` | 234 | 230 |
| `tests/fixtures/scratch.ts` | 53 | 77 |
| `tests/routes/docs/diagrams.test.ts` | 93 | 87 |
| `tests/routes/docs/docs.test.ts` | 544 | 535 |
| `tests/routes/docs/memories.test.ts` | 333 | 328 |
| `tests/routes/docs/wallpaper.test.ts` | 174 | 169 |
| `tests/routes/edit/audit-mute.test.ts` | 248 | 244 |
| `tests/routes/edit/rail.test.ts` | 144 | 142 |
| `tests/routes/edit/undo.test.ts` | 377 | 375 |
| `tests/routes/edit/write-fixture.ts` | 248 | 245 |
| `tests/routes/edit/write.test.ts` | 697 | 695 |
| `tests/routes/files/file.test.ts` | 293 | 290 |
| `tests/routes/files/fs.test.ts` | 424 | 419 |
| `tests/routes/files/open-fixture.ts` | 126 | 124 |
| `tests/routes/files/open-program.test.ts` | 375 | 373 |
| `tests/routes/files/open.test.ts` | 523 | 521 |
| `tests/routes/files/project-files.test.ts` | 90 | 86 |
| `tests/routes/files/source.test.ts` | 368 | 363 |
| `tests/routes/git/changes.test.ts` | 110 | 106 |
| `tests/routes/sessions/compose.test.ts` | 262 | 260 |
| `tests/routes/sessions/latex.test.ts` | 99 | 95 |
| `tests/routes/sessions/terminal-actions.test.ts` | 599 | 597 |
| `tests/routes/sessions/terminal.test.ts` | 301 | 299 |
| `tests/routes/sessions/transcript.test.ts` | 201 | 196 |
| `tests/routes/shape.test.ts` | 49 | 46 |
| `tests/server/accounts/calendar/poll.test.ts` | 896 | 892 |
| `tests/server/accounts/connect/accounts.test.ts` | 549 | 545 |
| `tests/server/accounts/connect/oauth.test.ts` | 360 | 356 |
| `tests/server/accounts/mail/fixture.ts` | 104 | 103 |
| `tests/server/accounts/mail/plate.test.ts` | 445 | 443 |
| `tests/server/accounts/mail/poll.test.ts` | 522 | 520 |
| `tests/server/accounts/mail/routes.test.ts` | 369 | 367 |
| `tests/server/accounts/mail/triage.test.ts` | 120 | 118 |
| `tests/server/accounts/mail/write.test.ts` | 199 | 197 |
| `tests/server/content/audit.test.ts` | 745 | 741 |
| `tests/server/content/doc-findings.test.ts` | 122 | 118 |
| `tests/server/content/images.test.ts` | 527 | 523 |
| `tests/server/content/latex.test.ts` | 222 | 218 |
| `tests/server/core/changes.test.ts` | 503 | 499 |
| `tests/server/core/git-reads.test.ts` | 299 | 297 |
| `tests/server/core/git.test.ts` | 864 | 861 |
| `tests/server/core/paths.test.ts` | 123 | 112 |
| `tests/server/edit/entry-edit.test.ts` | 869 | 865 |
| `tests/server/edit/feeds.test.ts` | 405 | 401 |
| `tests/server/edit/writes-collection.test.ts` | 352 | 350 |
| `tests/server/edit/writes-fixture.ts` | 148 | 146 |
| `tests/server/edit/writes.test.ts` | 504 | 502 |
| `tests/server/edit/yaml-edit.test.ts` | 547 | 537 |
| `tests/server/files/fs.test.ts` | 638 | 630 |
| `tests/server/files/ignored.test.ts` | 209 | 207 |
| `tests/server/files/project-files.test.ts` | 143 | 139 |
| `tests/server/files/search.test.ts` | 515 | 508 |
| `tests/server/git/deposit.test.ts` | 663 | 660 |
| `tests/server/git/git-ops.test.ts` | 792 | 788 |
| `tests/server/git/git-write.test.ts` | 600 | 597 |
| `tests/server/machine/hpc/ssh.test.ts` | 437 | 435 |
| `tests/server/machine/lines.test.ts` | 258 | 254 |
| `tests/server/machine/pty/channel.test.ts` | 669 | 665 |
| `tests/server/machine/pty/compose.test.ts` | 367 | 365 |
| `tests/server/machine/pty/context.test.ts` | 106 | 102 |
| `tests/server/machine/pty/sessions.test.ts` | 451 | 447 |
| `tests/server/machine/usage/refresh.test.ts` | 539 | 535 |
| `tests/server/machine/usage/usage.test.ts` | 898 | 896 |
| `tests/server/root/context.test.ts` | 430 | 427 |
| `tests/server/root/dev-server.test.ts` | 233 | 231 |
| `tests/server/root/hooks-server.test.ts` | 346 | 342 |
| `tests/server/root/watch/bookmarks.test.ts` | 158 | 154 |
| `tests/server/root/watch/git-events.test.ts` | 183 | 179 |
| `tests/server/root/watch/git-workspaces.test.ts` | 309 | 305 |
| `tests/server/root/watch/git.test.ts` | 624 | 620 |
| `tests/server/root/watch/local.test.ts` | 68 | 64 |
| `tests/server/root/watch/portfolio.test.ts` | 898 | 894 |
| `tests/server/root/watch/sessions.test.ts` | 501 | 497 |
| `tests/server/sessions/folders.test.ts` | 185 | 178 |
| `tests/server/sessions/group.test.ts` | 427 | 424 |
| `tests/server/sessions/overrides.test.ts` | 217 | 213 |
| `tests/server/sessions/stores/background.test.ts` | 298 | 294 |
| `tests/server/sessions/stores/codex.test.ts` | 569 | 565 |
| `tests/server/sessions/stores/customizations.test.ts` | 250 | 248 |
| `tests/server/sessions/stores/transcript-fixture.ts` | 265 | 263 |
| `tests/server/sessions/stores/transcripts.test.ts` | 716 | 714 |
| `tests/server/sessions/stores/turns.test.ts` | 226 | 222 |
| `tests/server/transcripts/stores.test.ts` | 96 | 92 |
| `tests/ui/colours.test.ts` | 619 | 609 |
| `tests/ui/wall.test.ts` | 206 | 203 |
| `tests/views/whole/chips.test.ts` | 365 | 358 |
| `tests/views/whole/sanitise.test.ts` | 103 | 100 |
| `tests/views/whole/tinted.test.ts` | 377 | 374 |
| `tests/views/whole/type-scale.test.ts` | 351 | 348 |
| `tests/checks/source/code.test.ts` | new | 82 |

## The tmpdir assertions

- 117 lines on the unchanged tree. 104 deleted: 101 by `<scratch>/q79b-builder/deltmp.py` from the classification in `tmpasserts.py`, which found each path's nearest assignment, plus 3 in `scratch.test.ts`. 13 kept.
- Deleted as the unchanged return, by judgment:
  - `this.root = scratchDir(...)` class fields in `background.test.ts:58` and `folders.test.ts:43`;
  - `const ROOT = scratchDir(...)` in `pty/context.test.ts:14`, written without `resolve`;
  - the local `scratch()` wrappers that return `scratchDir`'s value unchanged: `images.test.ts:40` and `:434`, `memories.test.ts:53` and `:304`.
- Kept, with reason:
  - `tests/server/core/git.test.ts:635`: `away = join(dir, 'away')`, built by `join`.
  - `tests/server/core/git.test.ts:850`: `args[1]`, handed to a spawned command.
  - `tests/server/core/changes.test.ts:479`: `dir = join(logOf(into).file, '..', 'deeper', 'still')`, built by `join`.
  - `tests/server/content/images.test.ts:441`: `pipe = join(dir, 'pipe.jpg')`.
  - `tests/server/root/dev-server.test.ts:183`: `copy.dir`, `engineCopy`'s `join(root, 'engine')`.
  - `tests/server/root/watch/repos.ts:21`: `root`, a parameter handed to a git command.
  - `tests/server/git/git-write.test.ts:591`: `args[1]`, handed to a spawned command.
  - `tests/server/git/deposit.test.ts:656`: `args[1]`, handed to a spawned command.
  - `tests/server/git/git-ops.test.ts:68`: `root`, a parameter of the git command helper.
  - `tests/server/git/git-ops.test.ts:783`: `args[1]`, handed to a spawned command.
  - `tests/fixtures/scratch.ts:25`: the helper's own check, now made before `mkdtempSync`.
  - `tests/routes/edit/rail.test.ts:43`: `into.layoutFile`, a file path of the server set-up, not a scratch value.
  - `tests/routes/files/open-fixture.ts:74`: `dir = join(engine, 'config')`.
- Imports left unused were removed; `npm run lint` exits 0.

## Walker by walker

`before.mjs` holds each walker copied from its file (types removed) and ran on the unchanged tree. `after.mjs` holds each `globSync` call copied from its converted file. Both ran on the roots the callers pass, and `node <scratch>/q79b-builder/walks/after.mjs <scratch>/q79b-builder/walks/before.json` compares the lists as sorted lists:

```
size:src: before 649, after 649, equal (walk order differs, same entries)
size:tests: before 405, after 405, equal
size:bin: before 16, after 16, equal
wall:src/lib/ui: before 42, after 42, equal
wall:src/lib/shell: before 20, after 20, equal
wall:src/lib/views: before 184, after 184, equal
type-scale:src/lib/views: before 184, after 184, equal
type-scale:src/lib/ui: before 42, after 42, equal
tinted:src/lib/views: before 184, after 184, equal
sanitise:src/lib/views: before 184, after 184, equal
colours:lib/ui: before 42, after 42, equal
colours:lib/shell: before 20, after 20, equal
colours:lib/views: before 184, after 184, equal
colours:routes: before 2, after 2, equal
audits:tests/views: before 65, after 65, equal
scratch:tests: before 401, after 401, equal
integrity:projects/ideas: before 33, after 33, equal (walk order differs, same entries)
integrity:projects/active: before 5, after 5, equal (walk order differs, same entries)
integrity:projects/manuscripts: before 15, after 15, equal (walk order differs, same entries)
integrity:projects/software: before 0, after 0, equal
integrity:projects/coauthor: before 16, after 16, equal (walk order differs, same entries)
integrity:projects/archive: before 25, after 25, equal (walk order differs, same entries)
negatives:views: before 65, after 65, equal
config-folder:src: before 653, after 653, equal (walk order differs, same entries)
config-folder:config: before 64, after 64, equal (walk order differs, same entries)
add-forms:views: before 184, after 184, equal
add-forms:shell: before 20, after 20, equal
html-sites:src/lib: before 246, after 246, equal
chips:src/lib: before 246, after 246, equal
history:src: before 653, after 653, equal (walk order differs, same entries)
history:tests: before 407, after 407, equal
history:bin: before 17, after 17, equal
history:config: before 64, after 64, equal
paths:src: before 653, after 653, equal (walk order differs, same entries)
paths:bin: before 17, after 17, equal
keys:src: before 649, after 649, equal (walk order differs, same entries)
graph:src: before 649, after 649, equal
graph:src/lib: before 612, after 612, equal
contrast:src: before 653, after 653, equal (walk order differs, same entries)
comment-width:src: before 651, after 651, equal (walk order differs, same entries)
comment-width:tests: before 405, after 405, equal
comment-width:bin: before 16, after 16, equal
yaml-edit:projects/ideas: before 33, after 33, equal (walk order differs, same entries)
yaml-edit:projects/active: before 5, after 5, equal (walk order differs, same entries)
yaml-edit:projects/manuscripts: before 15, after 15, equal (walk order differs, same entries)
yaml-edit:projects/software: before 0, after 0, equal
yaml-edit:projects/coauthor: before 16, after 16, equal (walk order differs, same entries)
yaml-edit:projects/archive: before 25, after 25, equal (walk order differs, same entries)
shape:src/routes/api: before 28, after 28, equal
every list equal
```

Where the order differs, the old order was the file system's own readdir order. Every converted walker now sorts. Each caller that differs only in order was read and none depends on order:
- size returns `found.sort()`;
- integrity counts;
- config-folder fills a Set;
- history compares with `''`;
- paths sorts its hits;
- contrast flattens findings compared with `[]`;
- keys' planted cases pass;
- comment-width compares with `[]`;
- yaml-edit sorts.

The one-folder reads that stay, from `grep -rn "readdirSync" tests`:
- `scratch.test.ts:257`: case 19's parent of the temporary directory;
- `claude-usage.test.ts:45` and `:49`;
- `keys.test.ts:152` and `:153`;
- `config-folder.test.ts:99` and `:369-371`, which is `config`, `config/views` and each `views/<group>`: a fixed two levels, no recursion;
- `imports/order.ts:120`;
- `dev-server.test.ts:71`: its `recursive: true` at line 65 is `cpSync`'s;
- `deposit.test.ts:552`;
- `fixtures/real-hub.ts:18`;
- `help.test.ts:193` and `:324`;
- `terminal-actions.test.ts:548` and `:556`;
- `source.test.ts:191` and `:232`.

`duplication.test.ts` names `readdirSync` only inside a planted string.

## Every judgment call (each reversible)

1. `code.ts` reuses `parsed` and `component` from `bin/diagrams/imports.mjs`, which `tests/checks/imports/graph.ts` already imports, so the checks and the diagrams parse the same way.
2. A syntax error is found through a one-file `ts.createProgram` with a host that answers for that file alone (`getSyntacticDiagnostics`), the public API, rather than the internal `parseDiagnostics`. It reads nothing from the disk and loads no library.
3. A file with no known language throws "no reader is known for its language". CSS strings and the strings of markup expressions stay code, since `parseCss` gives no string token and the old reader kept markup as code.
4. `.html` and `.svg` are read by svelte/compiler's `parse`, their comments as HTML comments (ruling 4). `src/app.html` and `src/lib/assets/favicon.svg` parse; history's tree case passes.
5. The scratch check reads imports and the vitest names by TypeScript's parse (`specifiersOf`, `vitestNames`), and registrations and `mkdtempSync` through `fileCode`. `withoutComments` plus a pattern read the planted `import { it } from 'vitest'` inside a string as an import.
6. The rule covers a helper that reaches the scratch helper as well as a suite, since cases declared in a helper with vitest's `it` never set the fixture up. It keeps the old rule that a file no suite imports registers the sweep with its own runner; `real-hub.probe.ts` does.
7. The registration's text is built (`HOOK`) so that verify 2's `grep` finds none in `scratch.test.ts`, as `CALLS` already does for `mkdtempSync`.
8. `allow-duplication.txt`: 18 entries removed and 12 added.
   - The deleted assertion lines and the swapped imports re-shaped held clones, which changed their marks.
   - Six pairs are no longer shared: html-sites/chips, wall/tinted, wall/type-scale, sanitise/type-scale, deposit/git-ops, bookmarks/git-workspaces.
   - One pair is new as a pair: `poll.test.ts` and `oauth.test.ts`, 10 lines. It is the `made`/`afterEach`/`scratch()` block both files already shared with `calendar-config.test.ts` under d994e70e0372. It is listed with the file's standard reason.
9. Two tree-wide cases carry `{ timeout: 30000 }` with a comment saying why: history's comment audit and comment-width's tree case. They parse every file under their roots: `commentText` over the 1073 `.ts`, `.js`, `.mjs`, `.svelte`, `.sh` and `.css` files of `src`, `tests` and `bin` took 3030 ms in a timing case run once with vitest (load average 3.98), above vitest's 5 s default once the full suite loads the machine.
10. `cited-lines.test.ts`'s "climbs out" case wrote `outside.md` into `$TMPDIR` itself (`join(held.dir, '..', 'outside.md')`), which verify 4 showed. Its tree now sits one folder down in a scratch directory. The revert of `under` in `bin/cited-lines.mjs` still turns it red.
11. Comments the deletions made false were reworded: `search.test.ts`, `open-fixture.ts`, `oauth.test.ts`, `mail-config.test.ts`, `calendar-config.test.ts` and `mail/fixture.ts`. The two wrappers now reduced to `return scratchDir(...)` were simplified. The empty constructor of `folders.test.ts`'s `Home` was removed (lint).
12. `commentAbove(lines, at, comments?)` keeps its signature and takes the file's comment lines, read once per file by `bareAbsences`. `explains` refuses an empty comment and no longer checks each line by its own pattern.
13. The fixture uses vitest's object form, `extend({ sweep: [fn, { scope: 'file', auto: true }] })`, since the builder form hands the body no `use`. The body's `{}` carries one `eslint-disable-next-line no-empty-pattern` with the reason: vitest reads a fixture's needs from that pattern.
14. Proposal, not built: move the module-level `scratchDir` calls of `rename-pillar`, `customizations`, `pty/sessions`, `pty/compose`, `pty/context`, `routes/sessions/latex`, `routes/sessions/compose` and `terminal-fixture` into `test.beforeAll`. A filtered run would then make nothing it does not sweep.

## Wrong or impossible in the brief

- "103 test files register the sweep": the 103rd grep hit was the helper's own head comment; it is 102 suites (ruling 3).
- "`scratchDir` already throws when the made directory is not inside `tmpdir()`": it threw after making it, and left the directory outside (case 19's first run). It now checks before it makes (ruling 2).
- The history rule of section 4 dropped trailing comments; ruled option A.
- A filtered-out file keeps its module-level directories under both registrations. Probe: a planted file with `afterAll` and `-t "nothing matches"` left `oculus-q79b-held-NPUIFa`, and `npx vitest run tests/server/machine/pty/context.test.ts -t "no case has this name"` left `oculus-chat-context-DC0G7W`; both removed by hand. `oculus-chat-context-DCkzNz` dated Sep 28 23:50 was already in `$TMPDIR` and is not this step's.
- svelte/compiler's CSS parser refuses a comment inside a selector, `.a /* x */ :global(.b)`, so a style block holding one does not parse and `selectorAt` throws on it. Whether such a component compiles was not verified.

## Limitations

- The shell rule does not know quotes: `echo ' #'` is read as a comment. No shell parser is installed and none was added.
- The reader is slower than the old scanner: 3030 ms over 1073 files, as timed above. The old scanner was not timed.
- Under a loaded machine the git suites time out in the full run (above). They are not changed by this step beyond their imports and the deleted assertions.

## Doc text

`grep -n` of `.scratch/migration/agents/spec.md`:

> 34:- You never write under `feeds/`, `projects/`, `registries/`, `funding/` or any other hub data folder, and never a `project.yml`. Tests use synthetic fixtures in a temporary directory and assert the resolved path is inside it before any write. ...

New text for its second sentence, the rest of the line unchanged:

"Tests use synthetic fixtures in a scratch directory from `tests/fixtures/scratch.ts`, whose `scratchDir` refuses a path outside the temporary directory before it makes one, and assert that every path they build inside it resolves inside it before any write."
