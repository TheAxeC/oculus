Everything in the brief, the cases ruling (`agents/briefs/Q79b-cases.md`) and repair round 1 (`agents/briefs/Q79b-round1-sent.md`) is done. Nothing is left undone. The round-1 rulings are carried in the section "Rulings of round 1". `tests/ui/wall.test.ts` and `tests/ui/colours.test.ts` are changed at their paths in this tree and overlap Q96; the orchestrator merges them at the second landing, as ruled.

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
| 19 | Throws, and leaves `oculus-escape-LV53nx` in the parent of `$TMPDIR` (removed by literal path) |

The first run found the history rule's gap (trailing comments); the orchestrator ruled option A in `agents/briefs/Q79b-cases.md`, with the helper made to check before it makes (ruling 2), the count 102 (ruling 3) and `.html`/`.svg` read as markup (ruling 4). All are built.

## DONE / NOT DONE

| Deliverable | State | Proof |
|---|---|---|
| The fixture in `tests/fixtures/scratch.ts`, exported as `test` and `it` | DONE | `TMPDIR=<scratch>/q79b-builder/T3/ npx vitest run` of scratch, code, duplication, comment-width, audits and walk tests: `Tests  59 passed (59)`, the directory left with `node-compile-cache` only; scratch.test.ts holds 17 cases; case 1 runs two planted files through a child vitest, one with a red `test.beforeAll`, and all 4 directories are swept |
| 101 suites off `afterAll(sweepScratch)` onto the fixture (scratch.test.ts the 102nd) | DONE | `grep -rl "afterAll(sweepScratch)" tests \| wc -l` prints 0 |
| Round 1 item 1: every comment stripper on `withoutComments`/`fileCode` | DONE | section "Round 1 item 1" |
| Round 1 item 2: no scratch directory made while a file loads | DONE | section "Round 1 item 2" |
| Round 1 item 3: no scratch directory made in vitest's own hooks | DONE | section "Round 1 item 3" |
| Round 1 item 4: walkers read dot entries | DONE | section "Walker by walker": `every list equal` on a planted dot tree and on the worktree |
| Round 1 item 5: case 8 pins the mid-line `//` | DONE | `tests/checks/source/code.test.ts:30-33`; revert "code: style // pattern" red |
| Round 1 item 6: the four comments | DONE | section "Round 1 item 6" |
| The scratch check on the rule, on the code reader, with the refusals | DONE | cases in `scratch.test.ts`; revert runs below |
| Redundant tmpdir assertions deleted, others kept | DONE | `grep -rn "startsWith(resolve(tmpdir())" tests \| wc -l` prints 13 (section "The tmpdir assertions") |
| `code.ts` on TypeScript's parse and svelte/compiler, `withoutComments` and `commentText` | DONE | `npx vitest run tests/checks/source/code.test.ts`: `Tests  10 passed (10)` |
| keys, negatives, history, boundaries, html-sites on the reader | DONE | each file passes in the final run; revert runs below |
| Verify 1: the checks script | DONE | quoted below |
| Verify 2 | DONE | `grep -rl "afterAll(sweepScratch)" tests` prints nothing |
| Verify 3 | DONE | prints 13 |
| Verify 4 | DONE | section "Verify 4" |
| Verify 5 | DONE | `grep -rn "readdirSync" tests` lists one-folder reads only (section "Walker by walker") |
| Verify 6 | DONE | `npm run diagrams` exit 0 now; `diff -rq docs/diagrams <main>/tools/oculus/docs/diagrams` lists only `layer-ui.dot/.svg` and `layers.dot/.svg`, the four the main checkout's in-flight Q96 changes (its `routes to ui` count 2 against this tree's 1); `diff -rq bin <main>/tools/oculus/bin` prints nothing, and `find src bin -newer logs/reverts.txt` lists only `bin/cited-lines.mjs`, restored by the revert runner and equal to the main checkout's |
| Verify 7: reverts | DONE | 30 of 30 red, below |

### Verify 1, the checks script

Command, from the worktree's `tools/oculus`: `sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, log `<scratch>/q79b-builder/logs/final.txt`. `uptime` before it printed load average 10.49, after it 13.15. The lines it printed:

```
 Test Files  358 passed (358)
      Tests  5725 passed | 1 skipped (5726)
1790687344560 COMPLETED 2043 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
checks exit 0
```

`git-ops.test.ts` did not time out in that run. Run alone as well, under a temporary directory of its own (`TMPDIR=<scratch>/q79b-builder/T3/ npx vitest run tests/server/git/git-ops.test.ts`): `Tests  37 passed (37)`.

### Verify 4

The final checks run, with `ls -A "$TMPDIR" | sort` before and after (`logs/final-t-before.txt`, `logs/final-t-after.txt`) and the same for its parent (`logs/final-p-*`):
- `$TMPDIR`: 1520 entries before, 1531 after.
- `comm -13` of the parent: prints nothing.
- `comm -13` of `$TMPDIR`: `oculus-dev-WmjENG`, `oculus-git-fOrTYu`, `oculus-git-NJ4qoH`, `oculus-git-ops-template-VFmjdo`, `oculus-git-QQDYfG`, `oculus-watch-git-8L42Qc`, `oculus-watch-git-Hd2hKu`, `oculus-watch-git-pw3uxU`, `oculus-watch-git-RvlKPh`, `oculus-watch-git-ZjjyI6`, `RUNF-_KO-OtN9EG85zdn0`. All but `oculus-dev-WmjENG` were still there at the next `ls`.

A vitest run of the main checkout ran at the same time (`ps aux | grep "[v]itest run"` printed `node /Users/axelfaes/workspace/research-hub/tools/oculus/node_modules/.bin/vitest run --tagsFilter !slow`), writing to the same `$TMPDIR`. To tell the two apart, the whole suite of this tree ran again with a temporary directory of its own: `TMPDIR=<scratch>/q79b-builder/T3/ npx vitest run` (log `logs/iso-run.txt`):
- The directory held nothing before, and `ls -A` after printed `node-compile-cache` only. `comm -13` of its parent printed nothing.
- So this tree's full run leaves no directory behind, the git and watch suites included. The eleven names above are therefore attributed to the main checkout's run; that attribution is an inference from the isolated run, not observed directly.
- The same run failed 10 cases, all from the temporary directory's own path length: 9 tmpdir-based tmux sockets in `pty/channel`, `pty/compose` and `pty/sessions` refused with `error connecting to <scratch>/q79b-builder/T3/oculus-tmux-a7A2F2/server.sock (File name too long)` (a Unix socket path is limited to 104 bytes on macOS), and `git-ops.test.ts` "routes each action to its own operation with its own fields" with `Test timed out in 5000ms`. The sweep ran for them as well: nothing was left.
- Those files under the system `$TMPDIR`: `npx vitest run tests/server/machine/pty/channel.test.ts tests/server/machine/pty/compose.test.ts tests/server/machine/pty/sessions.test.ts` printed `Tests  56 passed (56)`, and `comm -13` of `$TMPDIR` around it printed nothing. `git-ops.test.ts` alone passes, as quoted above.

Filtered runs, each under a temporary directory of its own:
- `TMPDIR=<scratch>/q79b-builder/tmp-filter/T/ npx vitest run -t "no case has this name"`: `Test Files  358 skipped (358)`; the directory holds `node-compile-cache` only.
- `TMPDIR=<scratch>/q79b-builder/T3/ npm run test:slow`: `Test Files  1 passed | 357 skipped (358)`, `Tests  1 passed | 5725 skipped (5726)`; the directory holds `node-compile-cache` only.

### Revert runs (each file put back after its run)

Command: `python3 <scratch>/q79b-builder/reverts2.py`, which applies each revert, runs `npx vitest run <file> -t <case>` and restores the file. Output (`logs/reverts2.txt`):

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
scratch: make before check: Tests  1 failed | 16 skipped (17)
scratch: fixture sweeps none: Tests  1 failed | 16 skipped (17)
rule: no vitest names: Tests  1 failed | 16 skipped (17)
rule: no HOOKED: Tests  1 failed | 16 skipped (17)
rule: HOOKED on raw text: Tests  1 failed | 16 skipped (17)
rule: suites only: Tests  1 failed | 16 skipped (17)
rule: name not propertyName: Tests  1 failed | 16 skipped (17)
history: comment lines only: Tests  1 failed | 2 skipped (3)
history: code line whole: Tests  1 failed | 2 skipped (3)
negatives: star line: Tests  1 failed | 10 skipped (11)
boundaries: span only: Tests  1 failed | 10 skipped (11)
html-sites: text match: Tests  1 failed | 9 skipped (10)
cited-lines: every path passes: Tests  1 failed | 9 skipped (10)
code: style // pattern: Tests  1 failed | 9 skipped (10)
tinted: blocks as written: Tests  1 failed | 16 skipped (17)
tinted: pattern back: Tests  1 failed | 16 skipped (17)
rule: no HOOKS: Tests  1 failed | 16 skipped (17)
rule: no loading loop: Tests  1 failed | 16 skipped (17)
rule: describe bodies deferred: Tests  1 failed | 16 skipped (17)
rule: helper makers only: Tests  1 failed | 16 skipped (17)
walk: star alone: Tests  1 failed (1)
```

Each revert is the one named in the comment above its case. The eight new this round:
- "code: style // pattern": case 8, `code.test.ts:28-29`.
- "tinted: blocks as written" and "tinted: pattern back": the brace case, `tinted.test.ts:376-378`.
- "rule: no HOOKS": the vitest-hooks refusal, `scratch.test.ts:649-650`.
- "rule: no loading loop", "rule: describe bodies deferred" and "rule: helper makers only": the load-time refusal, `scratch.test.ts:668-671`.
- "walk: star alone": `walk.test.ts:8-9`.

Three cases are audits, marked so in their comments: the division case in `code.test.ts`, the clean-file case and the declares-only case in `scratch.test.ts`. The reverts of "make before check" and "fixture sweeps none" leave what they revert to leaving (a directory in the parent of `$TMPDIR` and `oculus-sweep-*` directories in it); those were removed by literal path, and `ls -d` of both patterns finds none.

## Round 1 item 1: one code reader for every comment stripper

Each converted check now reads the text through `withoutComments` from `tests/checks/source/code.ts`, a style block as `withoutComments('style.css', block)` and a script block as `withoutComments('script.ts', block)`:
- `tests/ui/wall.test.ts`, `tests/ui/controls/tag.test.ts` (both places), `tests/ui/display/glyph.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/views/whole/tinted.test.ts` (`css()`): `.map((match) => withoutComments('style.css', match[1])).join('\n')`.
- `tests/views/whole/tinted.test.ts` (`importsLibrary`): `LIBRARY.test(withoutComments('script.ts', match[1]))`.
- `tests/ui/colours.test.ts` (`styles()`): `found.push(withoutComments('style.css', match[1]))`.
- `tests/views/personal/calendar.test.ts`: `const style = withoutComments('style.css', styleOf(source));`, with `styleOf` slicing between `<style>` and `</style>`; both former strippers read `style`.

The grep for others: `grep -rnF '.replace(/\/\*' tests src bin` prints only `src/lib/themes/parse.ts:20`, product code outside `tests/`. `grep -rnF '.replace(/\/\/' tests` prints `ics.test.ts:42`, a URL replacement. `grep -rnF '<!--[' tests` prints five hits (`primitives`, `menu`, `code-text`, `status-bar`, `rail`), each over the HTML a render returns (Svelte's hydration markers), not over source text; they stay.

The case with a brace in a comment is in `tinted.test.ts:376-384`, named with "audits" because the audits rule requires the word in the names of cases under `tests/views`:

```ts
const source =
    '<style>\n    /* a } */\n    .a { content: "/*"; }\n    .b { top: 0; }\n    /* c */\n</style>\n';
const found = [...css(source).matchAll(/([^{}]+)\{/g)].map((match) => match[1].trim());
expect(found).toEqual(['.a', '.b']);
```

Its two reverts: read each block as written (the comment's `}` opens the first selector), or put back a `/* */` pattern over the text (the `"/*"` in the string swallows the rule after it). Both red above.

## Round 1 item 2: no scratch directory made while a file loads

Every call named in the brief now runs in `test.beforeAll` from the fixture, or in a function a case or such a hook calls:
- `rename-pillar`, `customizations`, `pty/context`, `pty/compose`, `pty/sessions`, `routes/sessions/latex`, `routes/sessions/compose`: `let` bindings filled in `test.beforeAll`.
- `tests/routes/sessions/terminal-fixture.ts`: `TASK_CONFIG` and the values planted with it (`ENGINE`, `TASK_ENGINE`, `TASK_DEFAULT_ENGINE`, `CHAT_HUB`, `CHAT_STATE`, `CHAT_PROJECT`, `CHAT_ENGINE`) are `export let`, set by `export function makeTaskConfig()`, which its three importers call once per file through `test.beforeAll(makeTaskConfig)`. Before it runs they hold `UNSET = '/dev/null/oculus-task-config-unset'`, and `engineWith` throws, so a use before the hook fails loudly instead of writing relative to the checkout.
- Calls inside `describe` bodies run while the file loads too, so the rule counts them, and it found five more the brief did not list (section "Wrong or impossible in the brief"). Those moved into `test.beforeAll` as well: `pty/compose` (the real-tmux describe), `pty/channel` (the real-tmux describe), `data/sources/career` (the normalising describe), `data/sources/feeds` (four describes, through a `readHub(files)` that registers the hook), and the latex describe of `terminal-actions`.
- `tests/data/real-hub.probe.ts:99` stays, as the brief says.

The rule, in `findUnswept` of `tests/checks/tree/scratch.test.ts`, read by TypeScript's parse:
- A call runs at load when no ancestor is a function or a class body, a `describe` callback counting as load.
- A function or a class makes a directory when it calls `scratchDir`, `plantScratch`, or another function or class that does, followed across files through import bindings (`makersOf`, a fixpoint). A call nested in an inner function, such as a case declared in a helper, does not count.
- It prints `tests/<file>:<line> makes a scratch directory while the file loads`.
- The planted case (`scratch.test.ts:668-703`) reaches the helper directly, through a local arrow function, through a wrapper imported from another file, and through a class field, at top level and in a `describe` body, and expects lines 4, 10, 11 and 12, with the hook and the case lines passing. An audit case (`:705-716`) keeps a function that only declares a case from being counted.

## Round 1 item 3: no scratch directory made in vitest's own hooks

- `deposit.test.ts`, `git-ops.test.ts` and `git-write.test.ts` take `test.beforeAll`/`test.afterAll` from the fixture. The rule found two more files in the same shape, converted the same way: `tests/routes/docs/memories.test.ts` and `tests/server/content/images.test.ts`. The pty and terminal files above moved in item 2.
- The rule refuses a file that reaches the helper and imports `beforeAll` or `afterAll` from vitest: `tests/<file> takes a scratch directory and runs vitest's afterAll and beforeAll` (`scratch.test.ts:649-666`). On the tree, `grep -rln "scratchDir\|plantScratch" tests | xargs grep -lE "import \{[^}]*\b(beforeAll|afterAll)\b[^}]*\} from 'vitest'"` prints only `scratch.test.ts`, whose hits are planted strings.
- Case 1 now also plants `red.test.ts` with a red `test.beforeAll`; the child run exits 1 with "a red hook", and the 4 directories recorded are all swept.
- The helper's head comment (`scratch.ts:1-15`) states what holds: the sweep runs once the file's cases and the hooks it runs through `test.beforeAll` and `test.afterAll` are done, red ones included; a file takes `it`, `test` and those hooks from the helper, registers nothing, and makes no directory while it loads. vitest 4.1.11 probes: a red `test.beforeAll` is swept; `test.afterAll` runs before the sweep; a file whose every case is skipped runs no hooks and sets up no fixture.

## Round 1 item 6: comments

- `code.ts:216`: `/** The same as fileCode for a module or a script, read as TypeScript. */`
- `scratch.test.ts` head comment and the `HOOK` comment: no "still", no "instead"; `HOOK` reads "which is the fixture's to make".
- `local.test.ts:6-7`: "Every file is inside a directory of the case's own from scratchDir, which refuses a path outside the system temporary directory before it makes one."

## Files, line counts before and after

Before is the file at base 89a83e3b, from round one's count, except the four marked "(main)": their before is the main checkout's file, not verified equal to base. Every after count was checked against `wc -l` of the tree just now, with no mismatch.

| File | Before | After |
|---|---|---|
| `tests/checks/bin/cited-lines.test.ts` | 148 | 150 |
| `tests/checks/bin/claude-usage.test.ts` | 94 | 92 |
| `tests/checks/bin/migrate-joint-work.test.ts` | 200 | 196 |
| `tests/checks/bin/rename-pillar.test.ts` | 114 | 123 |
| `tests/checks/config/config-folder.test.ts` | 681 | 678 |
| `tests/checks/config/config.test.ts` | 675 | 672 |
| `tests/checks/config/integrity.test.ts` | 222 | 211 |
| `tests/checks/diagrams/diagrams.test.ts` | 862 | 860 |
| `tests/checks/diagrams/tree.ts` | 52 | 50 |
| `tests/checks/imports/augments.test.ts` | 131 | 127 |
| `tests/checks/imports/cycles.test.ts` | 120 | 116 |
| `tests/checks/imports/graph.ts` | 187 | 182 |
| `tests/checks/imports/order.test.ts` | 156 | 152 |
| `tests/checks/look/contrast.test.ts` | 265 | 263 |
| `tests/checks/source/add-forms.test.ts` | 76 | 75 |
| `tests/checks/source/code.test.ts` | new | 83 |
| `tests/checks/source/code.ts` | 146 | 235 |
| `tests/checks/source/comment-width.test.ts` | 79 | 84 |
| `tests/checks/source/history.test.ts` | 171 | 169 |
| `tests/checks/source/html-sites.test.ts` | 319 | 322 |
| `tests/checks/source/keys.test.ts` | 485 | 471 |
| `tests/checks/tree/allow-duplication.txt` | 203 | 197 |
| `tests/checks/tree/audits.test.ts` | 395 | 385 |
| `tests/checks/tree/boundaries.test.ts` | 593 | 590 |
| `tests/checks/tree/duplication.test.ts` | 610 | 608 |
| `tests/checks/tree/negatives.test.ts` | 334 | 343 |
| `tests/checks/tree/scratch.test.ts` | 424 | 732 |
| `tests/checks/tree/size.test.ts` | 211 | 204 |
| `tests/checks/walk.test.ts` | new | 19 |
| `tests/checks/walk.ts` | new | 21 |
| `tests/data/sources/calendar-config.test.ts` | 138 | 134 |
| `tests/data/sources/career.test.ts` | 191 | 189 |
| `tests/data/sources/collections.test.ts` | 264 | 260 |
| `tests/data/sources/docs.test.ts` | 247 | 243 |
| `tests/data/sources/feeds.test.ts` | 150 | 155 |
| `tests/data/sources/mail-config.test.ts` | 139 | 135 |
| `tests/data/sources/manifests.test.ts` | 315 | 311 |
| `tests/data/sources/present.test.ts` | 337 | 333 |
| `tests/data/sources/registries.test.ts` | 234 | 230 |
| `tests/fixtures/scratch.ts` | 53 | 79 |
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
| `tests/routes/sessions/compose.test.ts` | 262 | 275 |
| `tests/routes/sessions/latex.test.ts` | 99 | 101 |
| `tests/routes/sessions/terminal-actions.test.ts` | 599 | 595 |
| `tests/routes/sessions/terminal-fixture.ts` | 201 (main) | 217 |
| `tests/routes/sessions/terminal.test.ts` | 301 | 299 |
| `tests/routes/sessions/transcript.test.ts` | 201 | 196 |
| `tests/routes/shape.test.ts` | 49 | 44 |
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
| `tests/server/core/paths.test.ts` | 123 | 110 |
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
| `tests/server/machine/pty/channel.test.ts` | 669 | 672 |
| `tests/server/machine/pty/compose.test.ts` | 367 | 380 |
| `tests/server/machine/pty/context.test.ts` | 106 | 106 |
| `tests/server/machine/pty/sessions.test.ts` | 451 | 454 |
| `tests/server/machine/usage/refresh.test.ts` | 539 | 535 |
| `tests/server/machine/usage/usage.test.ts` | 898 | 896 |
| `tests/server/root/context.test.ts` | 430 | 427 |
| `tests/server/root/dev-server.test.ts` | 233 | 231 |
| `tests/server/root/hooks-server.test.ts` | 346 | 342 |
| `tests/server/root/watch/bookmarks.test.ts` | 158 | 154 |
| `tests/server/root/watch/git-events.test.ts` | 183 | 179 |
| `tests/server/root/watch/git-workspaces.test.ts` | 309 | 305 |
| `tests/server/root/watch/git.test.ts` | 624 | 620 |
| `tests/server/root/watch/local.test.ts` | 68 | 65 |
| `tests/server/root/watch/portfolio.test.ts` | 898 | 894 |
| `tests/server/root/watch/sessions.test.ts` | 501 | 497 |
| `tests/server/sessions/folders.test.ts` | 185 | 178 |
| `tests/server/sessions/group.test.ts` | 427 | 424 |
| `tests/server/sessions/overrides.test.ts` | 217 | 213 |
| `tests/server/sessions/stores/background.test.ts` | 298 | 294 |
| `tests/server/sessions/stores/codex.test.ts` | 569 | 565 |
| `tests/server/sessions/stores/customizations.test.ts` | 250 | 271 |
| `tests/server/sessions/stores/transcript-fixture.ts` | 265 | 263 |
| `tests/server/sessions/stores/transcripts.test.ts` | 716 | 714 |
| `tests/server/sessions/stores/turns.test.ts` | 226 | 222 |
| `tests/server/transcripts/stores.test.ts` | 96 | 92 |
| `tests/ui/colours.test.ts` | 619 | 611 |
| `tests/ui/controls/tag.test.ts` | 116 (main) | 115 |
| `tests/ui/display/glyph.test.ts` | 154 (main) | 154 |
| `tests/ui/wall.test.ts` | 206 | 204 |
| `tests/views/personal/calendar.test.ts` | 451 (main) | 458 |
| `tests/views/whole/chips.test.ts` | 365 | 359 |
| `tests/views/whole/sanitise.test.ts` | 103 | 101 |
| `tests/views/whole/tinted.test.ts` | 377 | 385 |
| `tests/views/whole/type-scale.test.ts` | 351 | 349 |

The longest test files are 896 lines (`find tests -name '*.test.ts' -exec wc -l {} + | sort -n | tail -3`), under the 900 limit.

## The tmpdir assertions

- 117 lines on the unchanged tree. 104 deleted: 101 by `<scratch>/q79b-builder/deltmp.py` from the classification in `tmpasserts.py`, which found each path's nearest assignment, plus 3 in `scratch.test.ts`. 13 kept.
- Deleted as the unchanged return, by judgment:
  - `this.root = scratchDir(...)` class fields in `background.test.ts` and `folders.test.ts`;
  - `const ROOT = scratchDir(...)` in `pty/context.test.ts`, written without `resolve`;
  - the local `scratch()` wrappers that return `scratchDir`'s value unchanged in `images.test.ts` and `memories.test.ts`.
- Kept, with reason (line numbers from round one's tree):
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
  - `tests/fixtures/scratch.ts`: the helper's own check, made before `mkdtempSync`.
  - `tests/routes/edit/rail.test.ts:43`: `into.layoutFile`, a file path of the server set-up.
  - `tests/routes/files/open-fixture.ts:74`: `dir = join(engine, 'config')`.
- `grep -rn "startsWith(resolve(tmpdir())" tests | wc -l` prints 13 on the current tree.

## Walker by walker

Every converted walker lists files through `treeFiles` of the new `tests/checks/walk.ts`, which holds the pattern list `['**/*', '**/.*', '**/.*/**/*']`, keeps what is not a directory and returns relative paths sorted; each caller filters by its extension as before. `integrity.test.ts`'s `countManifests` and `yaml-edit.test.ts` keep `globSync('**/project.yml', ...)`, which skips dot entries, as their walkers did before. `tests/checks/walk.test.ts` plants `.x`, `.h/y.ts`, `.h/.z/w.ts`, `a/.b.svelte` and `a/c.ts` and expects all five in name order; its revert ("keep `**/*` alone in EVERY") is red above.

`before.mjs` holds each old walker copied from its file (types removed); `after2.mjs` holds each new call. Both run on the roots the callers pass, compared as sorted lists.

On a planted tree with dot files and dot folders at every root (`<scratch>/q79b-builder/dot`, 85 dot names; command `node walks/before.mjs walks/before-dot2.json && node walks/after2.mjs walks/before-dot2.json` from `dot/hub/tools/oculus`), every list is equal with dot entries read, and 0 lines differ:

```
size:src: before 77, after 77, equal
scratch:tests: before 14, after 14, equal
integrity:projects/ideas: before 1, after 1, equal
comment-width:tests: before 24, after 24, equal
...
every list equal
```

`size:src` holds 49 dot paths in both lists; `integrity:projects/ideas` holds 0 in both, the planted `ideas/.h/project.yml` left out before and after.

On the worktree (same commands from the worktree's `tools/oculus`), 49 lists, `every list equal`, 0 lines differ. The counts, which include the three new files under `tests/checks`:

```
size:src 649 | size:tests 407 | size:bin 16 | wall:src/lib/ui 42 | wall:src/lib/shell 20
wall:src/lib/views 184 | type-scale:src/lib/views 184 | type-scale:src/lib/ui 42
tinted:src/lib/views 184 | sanitise:src/lib/views 184 | colours:lib/ui 42 | colours:lib/shell 20
colours:lib/views 184 | colours:routes 2 | audits:tests/views 65 | scratch:tests 403
integrity:projects/ideas 33 | integrity:projects/active 5 | integrity:projects/manuscripts 15
integrity:projects/software 0 | integrity:projects/coauthor 16 | integrity:projects/archive 25
negatives:views 65 | config-folder:src 653 | config-folder:config 64 | add-forms:views 184
add-forms:shell 20 | html-sites:src/lib 246 | chips:src/lib 246 | history:src 653
history:tests 409 | history:bin 17 | history:config 64 | paths:src 653 | paths:bin 17
keys:src 649 | graph:src 649 | graph:src/lib 612 | contrast:src 653 | comment-width:src 651
comment-width:tests 407 | comment-width:bin 16 | yaml-edit:projects/* as integrity
shape:src/routes/api 28
every list equal
```

Where the old order was the file system's readdir order, every converted walker now sorts; each such caller was read and none depends on order (size sorts, integrity counts, config-folder fills a Set, history and comment-width compare with `''`/`[]`, paths and yaml-edit sort, contrast flattens findings compared with `[]`, keys' planted cases pass).

The one-folder reads that stay, from `grep -rn "readdirSync" tests` (import lines left out): `scratch.test.ts:426` (the parent of the temporary directory), `claude-usage.test.ts:45,49`, `config-folder.test.ts:98,368-370` (a fixed two levels), `keys.test.ts:153-154`, `imports/order.ts:120`, `dev-server.test.ts:71`, `deposit.test.ts:552`, `fixtures/real-hub.ts:18`, `help.test.ts:193,324`, `terminal-actions.test.ts:546,554`, `source.test.ts:191,232`. `duplication.test.ts` names `readdirSync` only inside a planted string.

## Rulings of round 1

- `tests/checks/tree/allow-duplication.txt` holds re-keys and removals, ruled inside the step. This round re-keyed three held clones the edits re-shaped: `memories/images` to 505416a28794 ("12 lines at 29 and 20"), `tag/glyph` to 236bf4cb5b88 ("16 lines at 24 and 33"), `tag/wall` to d644d24e5242 ("12 lines at 29 and 56"). The duplication, comment-width and audits files pass in the 59-case run quoted in the DONE table.
- The report file stays in the worktree's `.scratch/`; the landing leaves the ledger root out of the worktree's add.
- The `{ timeout: 30000 }` on history's comment audit and comment-width's tree case stays: the work per run is a parse of every file, measured at 2771 ms and 3030 ms.
- The overlap with Q96 (`wall.test.ts`, `colours.test.ts`) is merged by the orchestrator at the second landing.

## Every judgment call (each reversible)

1. `code.ts` reuses `parsed` and `component` from `bin/diagrams/imports.mjs`, which `tests/checks/imports/graph.ts` already imports, so the checks and the diagrams parse the same way.
2. A syntax error is found through a one-file `ts.createProgram` whose host answers for that file alone (`getSyntacticDiagnostics`), the public API. It reads nothing from the disk and loads no library.
3. A file with no known language throws "no reader is known for its language". CSS strings and the strings of markup expressions stay code, since `parseCss` gives no string token.
4. `.html` and `.svg` are read by svelte/compiler's `parse`, their comments as HTML comments (ruling 4).
5. The scratch check reads imports, import bindings, vitest names and calls by TypeScript's parse, and registrations and `mkdtempSync` through `fileCode`.
6. The rule covers a helper that reaches the scratch helper as well as a suite. It keeps the rule that a file no suite imports registers the sweep with its own runner; `real-hub.probe.ts` does.
7. The registration's text is built (`HOOK`) so that verify 2's `grep` finds none in `scratch.test.ts`.
8. `describe` bodies count as load time. This widened item 2 to the five sites the brief did not list (next section), all moved into hooks.
9. The load-time rule follows wrappers and classes across files (`makersOf`) rather than looking for the helper's own names alone, so a directory made through a local function, an imported wrapper or a class field is refused.
10. `terminal-fixture.ts`'s values hold `/dev/null/oculus-task-config-unset` until `makeTaskConfig` runs, and `engineWith` throws before it has run. A path under `/dev/null` cannot be created, so a write made before the hook fails instead of landing in the checkout.
11. The `afterAll` `rmSync` calls of `pty/context`, `terminal.test.ts` and `terminal-actions.test.ts` over scratch directories were removed: the sweep takes them.
12. `treeFiles` lists a symbolic link as the file it is and does not follow it. It sits in `tests/checks/`, since `tests/fixtures` is full under the folder rule, with its own test.
13. The `rules()` clone that `tag`, `glyph` and `wall` share stays held in `allow-duplication.txt` under its new keys; merging it into one helper is outside this step's paths.
14. Two tree-wide cases carry `{ timeout: 30000 }` (ruled above).
15. `cited-lines.test.ts`'s "climbs out" case sits one folder down in a scratch directory, so it no longer writes `outside.md` into `$TMPDIR` itself.
16. `commentAbove(lines, at, comments?)` takes the file's comment lines, read once per file by `bareAbsences`.
17. The fixture uses vitest's object form, `extend({ sweep: [fn, { scope: 'file', auto: true }] })`; its `{}` carries one `eslint-disable-next-line no-empty-pattern` with the reason (vitest reads a fixture's needs from that pattern).

## Wrong or impossible in the brief

- "103 test files register the sweep": the 103rd grep hit was the helper's own head comment; it is 102 suites (ruling 3).
- "`scratchDir` already throws when the made directory is not inside `tmpdir()`": it threw after making it. It now checks before it makes (ruling 2).
- The history rule of section 4 dropped trailing comments; ruled option A.
- Round 1 item 2's list missed the calls made in `describe` bodies, which run while the file loads (main checkout lines): `pty/compose.test.ts:270`, `pty/channel.test.ts:537`, `data/sources/career.test.ts:91`, `data/sources/feeds.test.ts:73,107,125,144`, and the latex describe's writes in `terminal-actions.test.ts`, which wrote relative to the checkout when `CHAT_HUB` was not yet set. All moved into `test.beforeAll`.
- Round 1 item 3's list missed `memories.test.ts` and `images.test.ts`, which the new refusal found; both converted.
- svelte/compiler's CSS parser refuses a comment inside a selector, `.a /* x */ :global(.b)`, so a style block holding one does not parse and `selectorAt` throws on it. Whether such a component compiles was not verified.

## Limitations

- The shell rule does not know quotes: `echo ' #'` is read as a comment. No shell parser is installed and none was added.
- The reader is slower than the old scanner: 3030 ms over 1073 files. The old scanner was not timed.
- A temporary directory whose path is long (as a scratch folder under `/private/tmp/claude-502/...`) makes the three tmux suites fail on the 104-byte socket path limit; under the system `$TMPDIR` they pass (above). This is the suites' own path choice and is not changed by this step.
- Under load, the git suites can hit their 5000 ms timeouts in a full run; `git-ops.test.ts` did in the isolated run and passes alone.

## Doc text

`sed -n 34p .scratch/migration/agents/spec.md` begins:

> - You never write under `feeds/`, `projects/`, `registries/`, `funding/` or any other hub data folder, and never a `project.yml`. Tests use synthetic fixtures in a temporary directory and assert the resolved path is inside it before any write. ...

New text for its second sentence, the rest of the line unchanged:

"Tests use synthetic fixtures in a scratch directory from `tests/fixtures/scratch.ts`, whose `scratchDir` refuses a path outside the temporary directory before it makes one, made in a case or in `test.beforeAll` and never while the file loads, and assert that every path they build inside it resolves inside it before any write."
