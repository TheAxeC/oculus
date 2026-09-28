# Q80 report: line counts on the Status view (after repair round 1)

Everything in the brief and in repair round 1 is done. As round 1 asked, the full verify list was not rerun in this round: the orchestrator runs it on main at landing.

## Open items of the state file, verbatim

Read from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`, from its `## Open items` heading to the next heading, at the end of the round:

> ## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
>
> None.

## Checks run at the end of round 1

From the worktree's `tools/oculus`:

- `npx vitest run tests/server/machine/lines.test.ts tests/routes/machine/lines.test.ts tests/state/system/lines.test.ts tests/views/system/status.test.ts tests/state/shared/words/format.test.ts tests/checks/tree/duplication.test.ts tests/checks/source tests/checks/diagrams` printed `Test Files 16 passed (16)` and `Tests 178 passed (178)`.
- `npm run check` printed `COMPLETED 1437 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run format:check` printed `All matched files use Prettier code style!`.
- `npm run lint` exited 0.
- `LC_ALL=C grep -n '[^ -~]'` over every file this round touched printed nothing.

These results come from the step's first round, before round 1:
- **Full verify list:** exit 0, `verify: 6 commands passed`, 5344 of 5344 tests passing.
- **`npm ls cloc`:** prints `cloc@2.6.0-cloc`.

## The cases' first run, on the unchanged tree (before any code changed)

`npx vitest run` over the five test files printed `Test Files 5 failed (5)` and `Tests 6 failed | 36 passed (42)`. Each new case failed because the code did not exist yet:
- **Four new test files:** each failed with "Cannot find module" for the counter, the store or the view.
- **`git.test.ts`:** failed with `trackedFiles is not a function`, and the source check failed with `expected [ 'blame', 'check-ignore', ...(15) ] to deeply equal [ ..., (16) ]`.

No case gave a result the brief's own rules get wrong. The unrelated case "cuts every list it publishes at the cap" timed out in that run and passed in every later run.

## Round 1, item by item

| Item | State | Where | Proof |
| --- | --- | --- | --- |
| 1. The perl-missing failure | DONE | `lines.ts`: `LinesOptions` gains `perl`; `runCloc` spawns `run.perl` | case "answers an error naming perl and cloc when perl cannot be started" passes |
| 2. The store's missing cases | DONE | `tests/state/system/lines.test.ts` | five new cases pass (listed in the table below) |
| 3. A body that is not JSON | DONE | `lines.svelte.ts` `bodyOf()` parses in its own `try`; a failure holds `t('status.lines_bad_status', status)` | case "says the status, and no parser message, when the answer is not JSON" passes |
| 4. A failed Count again keeps the table | DONE | `lines.svelte.ts` `failed()` keeps `held.lines?.count` | store case "keeps the last table when a later count fails" and view case "keeps the last table under the sentence" pass |
| 5. An aborted request | DONE | `handleLines` hands `count` the `request.signal`; the route passes it to `countLines`; `runCloc` gives it to `spawn` (`signal` option), and an abort answers "The request was closed, so cloc was stopped."; `countLines` checks `closed(signal)` before cloc and before each file read | case "kills cloc and answers no count when the request is closed while it runs" passes, with the recorded child's `killed` true and `signalCode` `SIGTERM`; case "starts no cloc for a request already closed"; route case asserts `count` was called with the request's signal |
| 6. Tests that stayed green with their change reverted | DONE | `lines.test.ts`: the three sentences asserted exactly; `lines.test.ts` (store): `asked` is `[]` before `settle()`; `status.test.ts`: `location` stubbed and the lines title asserted before `status.hooks_title` | failures quoted below |
| 7. `grouped()` | DONE | `format.ts`: the finite-number branch removed, with its test; the head comment says the line store refuses a non-integer first | `tests/state/shared/words/format.test.ts` passes |
| 8-11. Report corrections | DONE | this report | sections below |

## Each new or tightened case, failing with its change undone

I undid each change in its file, ran the named case with `npx vitest run <file> -t <pattern>`, and wrote the file back from a copy held in memory. The script is `q80-undo.py` in the session scratchpad. Afterwards all 16 files passed again. Output, as printed:

| Change undone | Case | Failure |
| --- | --- | --- |
| spawn ignores `options.perl` | perl cannot be started | `AssertionError: expected false to be true // Object.is equality` |
| `signal` not given to `spawn` | kills cloc ... while it runs | `Error: Test timed out in 5000ms.` (the count waits the whole `sleep 5`) |
| no closed-request check before cloc | starts no cloc for a request already closed | `AssertionError: expected { Object (error) } to deeply equal { error: 'The request was closed.' }` |
| the `code !== 0` branch removed | cloc exits non-zero | `AssertionError: expected { Object (error) } to deeply equal { error: 'cloc exited with code 1.' }` |
| the signal branch skipped | cloc runs past its time | `AssertionError: expected { Object (error) } to deeply equal { Object (error) }` |
| git's refusal not answered | a folder that is no repository | `AssertionError: expected false to be true // Object.is equality` (the sentence no longer starts "git could not list the tracked files") |
| the route hands a fresh signal | answers a same-origin request with the count | `AssertionError: expected "vi.fn()" to be called with arguments: [ AbortSignal { aborted: false } ]` |
| the fetch sent at once, not on a microtask | starts one fetch on the first read | `AssertionError: expected [ '/api/lines' ] to deeply equal []` |
| no `lines_bad_status` for a failure with no sentence | carries no sentence | `AssertionError: expected { count: null, error: '', ...(1) } to deeply equal { count: null, ...(2) }` |
| the body parsed without its own `try` | the answer is not JSON | `AssertionError: expected { count: null, ...(2) } to deeply equal { count: null, ...(2) }` (the error held the parser's message) |
| no total check in `readCount` | no total, or no time | `AssertionError: expected '' to be 'the answer holds no total'` |
| no time check in `readCount` | no total, or no time | `AssertionError: expected '' to be 'the answer does not say when it count...'` |
| a rejected fetch holds no sentence | failed before any answer | `AssertionError: expected { count: null, error: '', ...(1) } to deeply equal { count: null, ...(2) }` |
| a failed count clears the table | keeps the last table when a later count fails | `AssertionError: expected { count: null, ...(2) } to deeply equal { ...(3) }` |
| the view hides the table on a failure | keeps the last table under the sentence | `AssertionError: expected [] to have a length of 6 but got +0` |
| `<LineCounts />` after `<Hooks>` | after the git line and before the hooks block | `AssertionError: expected 509 to be greater than 1829` |

From the step's first round, each of these reverts turns a case red:
- **Folder rule:** changing a `folderOf` branch.
- **Left-out paths:** removing an entry of `LEFT_OUT_FOLDERS` or `LEFT_OUT_FILES`.
- **TODO rule:** dropping the colon rule, `(?!\w)` or a comment marker, or adding the `i` flag.
- **Counter:** dropping `counted()` from the path filter, or listing files by a directory walk.
- **Duplicate files:** removing `--skip-uniqueness`.
- **Route:** removing the `sameOrigin` check.
- **Store:** removing the `inflight` guard.
- **View:** drawing the total first, dropping the language or total classes, or wiring Count again to anything but `recount`.

## Report corrections

- **The same-origin check (item 8).** The brief asks for "the same-origin check the other machine GETs make", but the tree has no machine GET. The two machine routes (`hpc`, `usage/refresh`) are POSTs behind the write token (`gatedBody`). There are two `sameOrigin` functions:
  - `server/core/auth.ts:38` refuses a request with neither `Sec-Fetch-Site` nor `Origin`.
  - `server/content/images.ts:298` admits such a request as the command line's.

  I used `auth.ts`'s, the stricter of the two. A `curl` without an `Origin` header gets 403.
- **The `ls-files` output cap (item 9).** `trackedFiles` runs through `git.ts`'s `spawnSync` call site, which caps output at 1 MiB, its default `maxBuffer`. oculus's own tree lists about 80 KB (1700 paths). A tree whose NUL-separated path list passes 1 MiB would fail with a sentence naming git, not a count.
- **Before and after (items 10 and 11):** in the last section.

## Rulings carried out as given

- `--skip-uniqueness` stays.
- `grouped()` and `app.thousands_separator` stay.
- The paths beyond the brief's list stay.
- `trackedFiles` stays on `git.ts`'s one call site.
- One count per page store stays, with no module state on the server.

## Files, line counts (before is worktree commit 56f1749d as I left it; after is now)

| File | Before | After |
| --- | --- | --- |
| `src/lib/server/machine/lines.ts` | 275 | 306 |
| `src/lib/state/system/lines.svelte.ts` | 151 | 161 |
| `src/routes/api/(machine)/lines/+server.ts` | 9 | 10 |
| `src/lib/state/shared/words/format.ts` | 137 | 137 |
| `tests/server/machine/lines.test.ts` | 185 | 244 |
| `tests/routes/machine/lines.test.ts` | 37 | 43 |
| `tests/state/system/lines.test.ts` | 121 | 183 |
| `tests/views/system/status.test.ts` | 185 | 203 |
| `tests/state/shared/words/format.test.ts` | 164 | 159 |

Round 1 changed no other file. The step as a whole also writes these files, all unchanged in this round:
- **Dependency:** `package.json` and `package-lock.json` (cloc 2.6.0-cloc).
- **Code:** `src/lib/server/core/git.ts` (`trackedFiles`), `src/lib/state/client/context.ts`, `src/lib/views/system/status/LineCounts.svelte` and `Status.svelte`, `src/lib/data/model/index.ts`.
- **Words:** `config/text/views/system/status.yml` and `config/text/app.yml`.
- **Tests:** `tests/server/core/git.test.ts`, `tests/server/machine/line-counts.ts`, `tests/state/client/client-state.test.ts` and `tests/views/whole/type-scale.test.ts`.
- **Docs:** `HELP.md:128`, `README.md:5,13` and `DESIGN.md:128`.
- **Diagrams:** `docs/diagrams/`, regenerated with `npm run diagrams`.

## Judgment calls in this round (each reversible)

1. An abort answers `{ error: 'The request was closed, so cloc was stopped.' }` from `runCloc`, and `{ error: 'The request was closed.' }` when the request was already closed before cloc or during the file reads. The route sends the response into a closed connection, and nobody reads it.
2. The abort check is a function, `closed(signal)`, rather than an inline `signal?.aborted`. The type checker narrows an inline second read to `false` after the first, and the second read is the one that catches an abort during the file reads.
3. A 200 answer whose body is not JSON is held as `lines_bad_status` with the status, which reads "the server answered 200 and said nothing more". Round 1 named the sentence for the non-JSON case without naming a status.
4. A rejected fetch holds the browser's own message (for example "Failed to fetch"), as round 1 says ("says its sentence").
5. The kill test wraps `node:child_process`'s `spawn` with `vi.mock`, so the real spawn still runs. It records each child, and the case waits for the killed child's `close` before asserting `signalCode` is `SIGTERM`.

## Limitations and sharp edges

- `ls-files` runs synchronously through `git.ts`'s call site (5 s timeout, 1 MiB output cap), so the server is blocked for that call. Only cloc runs asynchronously.
- A tracked path holding a line break is left out, since cloc reads one path per line.
- Files cloc does not recognise are in no row. So is a tracked file deleted from disk, which cloc reports on its standard error and leaves out.
- The case for an abort during the file reads, after cloc has answered, is not exercised by a test. Its check is the same `closed(signal)` read as the case that is tested before cloc.
- The count was timed on a scratch git copy of the worktree in the first round, not on the worktree itself, since I may not run git there: 1700 paths, 1152 files counted, 2900 ms, TODO 0.

## User-visible changes, before and after

**The Status view, normal case.** Put the view on the TEST page.
- **Before:** the socket line, the snapshot counts, the sessions and git lines, then the Claude Code hooks block.
- **After:** between the git line and the hooks block, a "Lines of code" section with a line saying what is counted. It shows "Counting lines..." for about three seconds, then "Counted at HH:MM" with a Count again button.
- **The table:** columns Folder, Files, Blank, Comment, Code, TODO and Lines. Each folder row is followed by its languages, indented and muted, and a bold Total row comes last. Numbers are right-aligned in tabular figures with commas. A narrow pane scrolls the table sideways inside the view.

**The Status view over a folder that is not a git checkout.** Before, there was no section. After, the section shows the red line "The line count failed: git could not list the tracked files: not a git repository (or any of the parent directories): .git." with Count again beside it, and no table. The sentence after the prefix is what `countLines` answered over an empty temporary folder (`node --experimental-strip-types` running `countLines` on a `mktemp -d` folder printed `{"error":"git could not list the tracked files: not a git repository (or any of the parent directories): .git."}`).

**The Status view on a machine without perl.** After, the section shows the red line "The line count failed: perl could not be started to run cloc (ENOENT)." with Count again beside it, and no table. The perl case asserts the sentence's start and `ENOENT`; the whole sentence is the code's template (`lines.ts`, the `error` handler of `runCloc`).

**A failed Count again after a good count.** After, the red failure sentence appears above the table, the last table stays on screen under it, and Count again sits beside the sentence. Before this round, the store cleared the table and only the sentence stayed.

**HELP.md:128.**
- **Before:** "Whether the socket is up, which snapshot the page holds and how much is in it."
- **After:** "Whether the socket is up, which snapshot the page holds and how much is in it, and the line counts of oculus's own files by folder and language, with a TODO count."

**README.md:5** adds: "The Status view's line counts also need Perl on the PATH to run cloc; macOS and most Linux systems carry it."

**README.md:13** now ends: "`lucide-static` (ISC) ships the line icons ... and `cloc` (GPL-2.0) is run as a separate Perl program, never imported, to count the Status view's lines."

**DESIGN.md:128** changes in three places:
- "twelve subcommands" is now "thirteen subcommands".
- New sentence: "For the Status view's line counts, GET /api/lines asks it for the paths tracked under the engine folder (`ls-files -z`, `trackedFiles`), which `server/machine/lines.ts` hands to cloc."
- `ls-files` joins the commands held to their exact form.
