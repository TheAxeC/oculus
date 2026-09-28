# Q80 report: line counts on the Status view

Everything in the brief is done.

## Open items of the state file, verbatim

Read from `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` lines 106-110 (`sed -n 106,111p`):

> ## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
>
> None.

## The cases' first run, on the unchanged tree

Every case of the brief was written as a test before any code changed and run with `npx vitest run tests/server/machine/lines.test.ts tests/routes/machine/lines.test.ts tests/state/system/lines.test.ts tests/views/system/status.test.ts tests/server/core/git.test.ts`. Result: `Test Files 5 failed (5)`, `Tests 6 failed | 36 passed (42)`. Each new case failed:

- Folder rule, TODO rule and counter cases (`tests/server/machine/lines.test.ts`): `Error: Cannot find module '../../../src/lib/server/machine/lines.ts'`.
- Route cases (`tests/routes/machine/lines.test.ts`): the same missing module.
- Store cases (`tests/state/system/lines.test.ts`): `Error: Cannot find module '../../../src/lib/state/system/lines.svelte.ts'`.
- View cases (`tests/views/system/status.test.ts`): `Error: Cannot find module '/src/lib/views/system/status/LineCounts.svelte'`.
- The git form (`tests/server/core/git.test.ts`): `TypeError: trackedFiles is not a function` on the two new tracked-files cases and in `everyRead`, and the source gate `expected [ 'blame', 'check-ignore', ...(15) ] to deeply equal [ ..., (16) ]` (no `ls-files` call site).

No case gave a result the brief's own rules get wrong, so no stop. One unrelated case of `git.test.ts` in that run, "cuts every list it publishes at the cap", timed out at 5000 ms; it passed in every later run (it is a file this step touches, but the case is not one of its cases, and it passed in the final verify).

cloc's numbers for the two counter files, recorded by running cloc 2.06 on them in a scratch folder (`printf 'a.ts\nsrc/lib/x/b.svelte\n' | perl <cloc> --list-file=- --by-file --json --quiet`): `a.ts` TypeScript blank 1, comment 2, code 1; `src/lib/x/b.svelte` Svelte blank 1, comment 0, code 4. The test asserts these.

## What to build, item by item

| Item | State | Where | Proof |
| --- | --- | --- | --- |
| 1. The dependency | DONE | `package.json:42` `"cloc": "2.6.0-cloc"`, `package-lock.json` `node_modules/cloc` | `npm ls cloc` prints `cloc@2.6.0-cloc` |
| 2. The git read | DONE | `src/lib/server/core/git.ts:25,36-38,48,214-223` (`trackedFiles`, `run(root, ['ls-files', '-z'], ...)`); `DESIGN.md:128` | `tests/server/core/git.test.ts` (ALLOWED, PINNED, PINNED_SOURCE take `ls-files`; `everyRead` runs it; "the tracked files" describe, two cases) passes |
| 3. The counter | DONE | `src/lib/server/machine/lines.ts` (`counted`, `folderOf`, `todoLine`, `countLines`, `handleLines`) | `tests/server/machine/lines.test.ts`, 13 cases, pass |
| 4. The route | DONE | `src/routes/api/(machine)/lines/+server.ts` | `tests/routes/machine/lines.test.ts`, 3 cases, pass; `npm run build` in the verify list |
| 5. The store | DONE | `src/lib/state/system/lines.svelte.ts`, registered at `src/lib/state/client/context.ts` (import, type, `createLines()`, returned) | `tests/state/system/lines.test.ts`, 8 cases, and `tests/state/client/client-state.test.ts` pass |
| 6. The view | DONE | `src/lib/views/system/status/LineCounts.svelte`, drawn at `Status.svelte:87` between the git line and `<Hooks>`; words in `config/text/views/system/status.yml` | `tests/views/system/status.test.ts`, 6 new cases, pass; `tests/views/whole/type-scale.test.ts` lists the new file |
| 7. The docs | DONE | `HELP.md:128`, `README.md:5`, `README.md:13`, `DESIGN.md:128` | quoted under "User-visible changes" below |

The verify list, run once at the end from the worktree's `tools/oculus` with `sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` (exit 0). The lines it prints that carry a result, verbatim:

```
 Test Files  341 passed (341)
      Tests  5344 passed (5344)
Checking formatting...
All matched files use Prettier code style!
verify: 6 commands passed
```

The ASCII gate of the rules file over `src tests bin config` plus `HELP.md README.md DESIGN.md` printed nothing. `bin/folder-check.sh` runs inside the unit suite (`tests/checks/tree/size.test.ts`) and passed.

## Which undoing turns each new test red

- Folder cases: changing the `src/lib/<x>` branch of `folderOf` from `parts.length >= 4` to `>= 3` counts `src/lib/highlight-languages.d.ts` under a folder of its own name and turns the `src` case red; dropping the `src/routes` branch turns the routes case red; returning `parts[0]` for a bare name turns the top-level case red.
- Left-out case: removing an entry of `LEFT_OUT_FOLDERS` or `LEFT_OUT_FILES` turns it red, and the counter's "appear nowhere" assertion too.
- TODO cases: making the colon after an opening tag optional counts `TODO the thing`; dropping `(?!\w)` counts `TODOs are fine` and `TODO_PATTERN = 1`; adding the `i` flag counts `todo: add(c)`; dropping a marker (`<!--`, `#`) turns its counted case red.
- Counter, main case: dropping `counted(path)` from the path filter puts the Markdown, SVG and JSON files in the answer; summing languages into the folder wrongly or sorting rows out of path order turns the `rows` equality red.
- Untracked case: listing files with anything other than `git ls-files` (for example a directory walk) counts `loose.ts` and `c.svelte`.
- Duplicate-bytes case: removing `--skip-uniqueness` from the cloc arguments drops one of the two identical `b.svelte` files (verified in scratch: cloc without the flag reported one of two identical files).
- Not-a-repository case: throwing instead of answering when `trackedFiles` refuses turns it red.
- cloc exit 1, timeout and not-JSON cases: treating a non-zero exit, a signal or unparsable output as success turns the matching case red; dropping the `timeout` spawn option makes the timeout case run past its 4 s bound.
- git tracked-files cases: removing `trackedFiles` or running `ls-files` without `-z` (quoted names, different split) turns them red; the source gate goes red if the call is written other than `['ls-files', '-z']`.
- Route cases: removing the `sameOrigin` check turns the 403 case red; answering 200 for `{ error }` turns the 500 case red.
- Store cases: sending the fetch synchronously or twice turns the one-fetch cases red; dropping the `inflight` guard in `request()` turns "asks once for a recount pressed while a count is on its way" red; holding a body without `rows` as an empty table turns the malformed case red; dropping the window check turns the server-render case red.
- View cases: drawing the total before the folders, leaving out language rows or not grouping thousands turns the row case red; dropping the `language`/`total` classes turns the marking case red; drawing the table or no "Counting lines..." while loading, or no Count again on failure, turns those red; wiring Count again to anything but `recount` turns the press case red; removing `<LineCounts />` from `Status.svelte` turns the placement case red.
- `grouped` cases (`tests/state/shared/words/format.test.ts`): a formatter without the separator, or one that writes `NaN`, turns them red.

## Files, line counts (before is the main checkout's copy now, read with `wc -l`; after is the worktree)

| File | Before | After |
| --- | --- | --- |
| `package.json` | 51 | 52 |
| `package-lock.json` | | + the `cloc` entries |
| `src/lib/server/core/git.ts` | 803 | 818 |
| `src/lib/server/machine/lines.ts` | new | 275 |
| `src/routes/api/(machine)/lines/+server.ts` | new | 9 |
| `src/lib/state/system/lines.svelte.ts` | new | 151 |
| `src/lib/state/client/context.ts` | 293 | 298 |
| `src/lib/views/system/status/LineCounts.svelte` | new | 164 |
| `src/lib/views/system/status/Status.svelte` | 107 | 110 |
| `src/lib/data/model/index.ts` | 449 | 473 |
| `src/lib/state/shared/words/format.ts` | 123 | 137 |
| `config/text/views/system/status.yml` | 12 | 32 |
| `config/text/app.yml` | 65 | 66 |
| `tests/server/machine/lines.test.ts` | new | 185 |
| `tests/server/machine/line-counts.ts` | new | 41 |
| `tests/routes/machine/lines.test.ts` | new | 37 |
| `tests/state/system/lines.test.ts` | new | 121 |
| `tests/server/core/git.test.ts` | 830 | 864 |
| `tests/views/system/status.test.ts` | 72 | 185 |
| `tests/views/whole/type-scale.test.ts` | 345 | 345 (one entry line added; the main checkout's copy has moved since the worktree was cut, so this pair is not a clean before and after) |
| `tests/state/shared/words/format.test.ts` | 147 | 164 |
| `tests/state/client/client-state.test.ts` | 101 | 102 |
| `HELP.md`, `README.md`, `DESIGN.md` | 294, 36, 320 | 294, 36, 320 (lines edited in place) |
| `docs/diagrams/*.dot`, `*.svg` | | regenerated by `npm run diagrams`; `tests/checks/diagrams` passes |

The grep the rules file asks for after a change of shape: `grep -rn "twelve subcommands\|pinned six\|six subcommands" src tests config HELP.md DESIGN.md README.md` prints nothing (exit 1). `grep -rn "ls-files" src DESIGN.md` finds the new form at `git.ts:25,36,48,221` and `DESIGN.md:128`, and `server/git/deposit-git.ts:9,79,192`, which is the deposit's own writing module running `ls-files` on its mirror through its own call site; that is outside `server/core/git.ts` and unchanged.

## Judgment calls the brief did not cover (each reversible)

1. `--skip-uniqueness` is added to cloc's arguments. Without it cloc counts only one of two tracked files with identical bytes, so a copied fixture would vanish from its folder's row. On today's tree nothing changes: `md5 -r` over `src tests bin config demo assets` found no two identical files. This is one flag beyond the argument list the brief names; the orchestrator may take it out.
2. The paths are listed in the engine folder by `trackedFiles`, which runs through `git.ts`'s one synchronous call site (5 s timeout); only the cloc run is asynchronous. The server is blocked for the `ls-files` call itself (fast on this tree, not measured separately).
3. A tracked path holding a line break is left out, since cloc reads one path per line. The tree holds none (not verified by a git command, which I may not run; the rule is in `countLines`).
4. A tracked file cloc does not recognise (`.gitignore`, `LICENSE`, `.prettierrc` and the like) is in no row, as cloc leaves it out of its answer; the Files column counts the files cloc counted.
5. The top level is the empty folder name on the wire (`TOP_LEVEL = ''`) and is drawn as "top level" from the catalog (`status.lines_top`).
6. Thousands grouping: no grouping formatter existed in `state/` or `ui/` (searched for `toLocale`, `Intl.`, `grouped`, `thousand`), so `grouped()` is added to `state/shared/words/format.ts` with the separator in the catalog as `app.thousands_separator: ','`. The time is `stamp()` from the same module (the clock alone today, the date before it otherwise).
7. The shared type `LineCount` (with `LineTally`, `FolderLines`, `LanguageLines`) lives in `data/model/index.ts`, since both the server module and the client store read it; the view reads it through the store module's re-export, since a view may not import `data/model`.
8. The store's recount keeps the previous table on screen while the new count runs, with "Counting lines..." in place of "Counted at"; Count again is hidden while a count is out, and a second press during a count sends nothing.
9. The failure line is coloured with `--c-red-txt`, the token the other views use for a refusal.
10. The route answers 403 with `{ error: 'forbidden' }`, as `gatedBody` does, and uses `Response.json`.
11. The server sentences are English strings in `lines.ts` (for example "cloc exited with code 1."), as the brief's `{ error }` with one sentence asks; the store's own malformed-answer sentences are catalog keys (`status.lines_bad_*`).
12. The request is refused before it is queued on a server render (the window check sits in `request()`, not in `load()`), which also keeps the store from sharing eight lines with `memories.svelte.ts` that `tests/checks/tree/duplication.test.ts` refuses.
13. The TODO-rule cases are written with the tag in a constant (`const TAG = 'TODO'`), so the test file itself holds no counted line. Run over every file under `src tests config bin demo` and the three docs that mention the word, the rule counts no line (`node --experimental-strip-types` over the files `grep -rl TODO` lists; it printed nothing).

## Paths written beyond the brief's list

`src/lib/data/model/index.ts` (the shared type), `src/lib/state/shared/words/format.ts` and `tests/state/shared/words/format.test.ts` (the grouping formatter and its cases), `config/text/app.yml` (the separator key), `tests/routes/machine/lines.test.ts` (the route test, beside the HPC route's), `tests/server/machine/line-counts.ts` (the fixture the four test files share, which the duplication check requires), `tests/state/client/client-state.test.ts` (the store list).

## Limitations and sharp edges

- The count over a scratch copy of this worktree (copied with rsync, `git init`, `git add -A`, 1700 paths, then `countLines`) took 2900 ms and gave 1152 files, code 171441, TODO 0; its rows match the brief's Decision 2 table plus this step's own files. That run is a scratch copy, not the worktree itself, since I may not run git in the worktree.
- `perl` missing from the PATH is not exercised by a test; the code answers "perl could not be started to run cloc (...)" for it (`runCloc`, the `error` handler).
- cloc writes "Unable to read" to its standard error for a tracked path deleted from disk and leaves it out; such a file is in no row.

## User-visible changes, before and after

**The Status view.** Put it on the TEST page. Before: socket line, snapshot counts, sessions and git lines, then the Claude Code hooks block. After: between the git line and the hooks block, a section headed "Lines of code", the line "Oculus's own tracked files, counted by cloc. The plan's ledger, the lock file and the generated diagrams are left out.", then "Counting lines..." for about three seconds, then "Counted at HH:MM" with a Count again button, and a table with columns Folder, Files, Blank, Comment, Code, TODO, Lines: one row per folder (top level, assets, bin, config, demo, src, src/lib/assets ... src/routes, tests), each followed by its languages indented and muted, and a bold Total row last. Numbers right-aligned in tabular figures with commas. Narrowing the pane scrolls the table sideways inside the view. Pressing Count again shows "Counting lines..." over the old table until the new count arrives.

**HELP.md:128.** Before: "Whether the socket is up, which snapshot the page holds and how much is in it." After: "Whether the socket is up, which snapshot the page holds and how much is in it, and the line counts of oculus's own files by folder and language, with a TODO count."

**README.md:5.** Adds: "The Status view's line counts also need Perl on the PATH to run cloc; macOS and most Linux systems carry it."

**README.md:13.** The list now ends: "`lucide-static` (ISC) ships the line icons `config/catalogs/icons.yml` names, which the server reads off disk and pushes with the configuration, and `cloc` (GPL-2.0) is run as a separate Perl program, never imported, to count the Status view's lines."

**DESIGN.md:128.** "twelve subcommands" is "thirteen subcommands"; after the check-ignore sentence: "For the Status view's line counts, GET /api/lines asks it for the paths tracked under the engine folder (`ls-files -z`, `trackedFiles`), which `server/machine/lines.ts` hands to cloc."; and `ls-files` joins the list held to exact vectors.
