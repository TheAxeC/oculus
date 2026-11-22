# Review of O188 (base 35520d42d, worktree migration-O188)

## 1. The verification lines as printed

`npm run diagrams`: not run (it writes files).

`npm run test:quick` (TMPDIR unset, load averages about 12 to 14):
- `test:quick: 70 changed file(s), from git since HEAD` / `test:quick: 358 test file(s)`
- `ok prettier (1.1 s): All matched files use Prettier code style!`
- `ok ASCII gate (1.2 s)`
- `ok svelte-kit sync (3.8 s)`
- `ok eslint (3.1 s)`
- `ok svelte-check (20.8 s): 1795382666220 COMPLETED 593 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `ok vitest checks (286.3 s): Duration 259.64s`
- `FAILED vitest (361.8 s)`: `Test Files 7 failed | 250 passed | 81 skipped (338)`, `Tests 11 failed | 3690 passed | 891 skipped (4592)`
- `FAILED vitest slow (466.4 s)`: `Test Files 4 failed | 96 passed (100)`, `Tests 11 failed | 880 passed | 386 skipped (1277)`
- `test:quick: 470.4 s; failed: vitest, vitest slow`, `exit 1`

I did not reproduce the green run the report quotes.
- The 11 failures of `vitest` are each `Error: Test timed out in 5000ms.`, in `routes/hubs/hub-secrets`, `server/edit/writes-collection` (4), `data/sources/config/boards` (2), `server/machine/hpc/submit`, `data/sources/config/catalog/options`, `data/sources/config/layers/hub-vocab`, `state/workbench/layout/saved/layout-workspaces`. Those seven files run alone: `Test Files 7 passed (7)`, `Tests 185 passed (185)`.
- The 11 failures of `vitest slow` are in `data/hubs/hub-portfolio` (4), `data/hubs/self` (3), `routes/git/credentials` (2), `routes/sessions/website` (2). Ten are `Test timed out in 20000ms`. One is `AssertionError: expected [ '-C', ...(2) ] to deeply equal [ '-c', ...(3) ]` (credentials, "carry the pairs for a clone of a repository ...", G135), and it follows the timeout of the test before it.
- With `--testTimeout 20000`, each slow file alone: hub-portfolio 16 passed, self 17 passed, credentials 8 passed, website 25 passed. The four files in one run timed out at first: 7 failed at the 5000 ms default, then 3 failed at 20000 ms while my own programs were running.
- The step changes none of the eleven files.

Verify 2, `npx vitest run tests/server/sessions tests/server/machine/pty tests/server/machine/runs/schedules tests/server/root tests/server/git`: `Test Files 44 passed (44)`, `Tests 378 passed (378)`.

Verify 3, the report's `measure.ts` run from my scratch folder at load 7 to 10 (after-tree only):
- scan hold, median of seven: 1.7 ms
- usage fold hold, 5 KB records: `[1.2,1.2,2.7,3.2,1.6]`, median 1.6 ms
- usage fold hold, 24 MB records: 1.3 ms
- one changed record: 53170 of 2582011 bytes
- second fold: 229 bytes, as appended
- key to echo: 0.3 ms quiet; 0.4 ms median and 33.2 ms max while scans and folds run

Verify 4, `sh utils/unused-exports.sh` against the base list: the same difference the report quotes. It adds `UsageTranscriptFold`, `createScanner` and type `ToWorker`, and `TIMEOUT_MS` leaves the list. Each added one has an importer.

Verify 5: the test diff is 5 added lines in the three named recorders (`doubles.ts` 1, `agent-pane.test.ts` 1, `channel.test.ts` 3).

Character set: the perl check over every changed and new file printed nothing. `sh utils/folder-check.sh` printed nothing, exit 0. Largest files: 874 `.ts` lines; `Slide.svelte` is under 520.

Case programs of the report's appendix, rerun (the imports made absolute): `cases-held`, `cases-sessions`, `cases-channel`, `cases-keys` (private socket in a short folder, deleted) and `cases-usage` ran. Their case lines are those described under the cases below. No case came out other than the brief states.

Further programs of mine:
- Both worker files started as plain threads answered and exited 0. Their import graph reaches `zod`, `lodash-es`, `write-file-atomic` and `@sveltejs/kit`. `@sveltejs/kit` is a devDependency, but the installed app carries it (`~/Applications/oculus.app/Contents/Resources/app/node_modules/@sveltejs/kit` imports), and its package is unpacked (`asar: false`).
- A random run of hub, `Scanned` and page `applied` (200 worlds, three pages each, worker deaths, hooks, resubscribes, terminals): `{ bad: 0, diffs: 9774, wholes: 1438, pubs: 2911 }`.
- Keys while a pane floods output: the client way answered in 0 ms (10 of 10 keys, two kinds of flood), against 6 to 19 ms for a process.

## 2. Verdicts

Items:
1. Holds.
2. Holds.
3. Holds.
4. Holds. One bound of verify 3 is not met (Proof 1).
5. Holds.
6. Holds.
7. Violated in one point: the age is drawn but is the first thing the row cuts (Behaviour 1).

Cases:
- 1 met (`cases-sessions`: equal as objects and as JSON text).
- 2 met (1 scan).
- 3 met (`[0,0]`).
- 4 met (`notification`).
- 5 met (0 publishes; worker exit also in `cases-held`).
- 6 met (one line, payload kept, one new worker, 0 publishes, 0 told, 3 of 4 objects kept after an append to one).
- 7 met, its two sub-cases included (the joined-request rule in `cases-held`).
- 8 met.
- 9 met. A 0444 cache file and a 0555 folder, both run by me: 3 records, version 2 after an append, the cache bytes untouched.
- 10 met. A record whose `lastActivity` alone moved sends no tree when no placement moved. When the order of the placements changes the tree is sent, and the report's line says so.
- 11 met.
- 12 met.
- 13 met.
- 14 met.
- 15 met.
- 16 met.
- 17 met.
- 18 met.
- 19 met.
- 20 met (0 processes attached, 1 with none).
- 21 met.
- 22 met.
- 23 met (each rejected once, none sent again).
- 24 met.
- 25 met.
- 26 met.
- 27 met.
- 28 met.
- 29 met.
- 30 met.
- 31 met.
- 32 met (`usage-sessions.test.ts` unchanged, inside verify 2).
- 33 met.
- 34 met by reading (`KeptLayouts`, `LayoutInputs` and the early put-on in `Slide.svelte`).
- 35 not verifiable here (the look at landing). By reading, the kept layout is put on with `fitFormulas` and no search.
- 36 met by reading (`layout-turns` steps, `Ahead.svelte` drops on the switch).
- 37 not verifiable here (look). By reading, the inputs hold text scale, theme classes, font count, image states and the generation.
- 38 partial. Read for the first slide, the last slide and a deck of one (`neighbours` is bounds-checked; slide keys are made unique in `sources/deck/read.ts:646`), the Overview (no `Framed`, so no preparation) and the print page (no kept layouts). The look settles the drawing.
- 39 not verifiable here (look).
- 40 met by reading: `inert`, `aria-hidden`, `visibility: hidden`, the hidden Stage has no `data-scroll`, keys per deck root and path.
- 41 met by reading.
- 42 met by reading.
- 43 met by reading.
- 44 partial: no display name, no age, `<b>` and an address are drawn as text, but the 200-character subject hides the age (Behaviour 1).
- 45 not verifiable here (look). By reading, `reveal` with `search: ''`.
- 46 met by reading (`opened` in the tab state).
- 47 met by reading.
- 48 met by reading (`fieldItemsShape`).
- 49 met by reading (`rowKeys`, `rowWords`).

## 3. Findings

### Spec

None.

### Proof

1. `.scratch/migration/agents/reviews/O188-report.md:1` and `:338` ("`| verify 3 | DONE, one figure short of its bound (the first line) | below |`"). Verify 3 says "the one after at most a tenth of the one before". The usage fold of the 5 KB store went from a median of 7 ms to 1.6 ms. My rerun of the after side also gives 1.6. The row is marked DONE and the first line begins "Everything in the brief is done", while a verification line is red.
   - Failure: a reader of the first line, or of the DONE column, takes every bound as met. No ruling accepts the miss.
   - The reason given holds as far as I can check: the rerun's idle reading was 1.2 ms, and a tenth of 7 ms is 0.7 ms, under what the monitor reads of a waiting thread. The report's other measurement, time active in the fold, falls from 416.3 to 1.2 ms.
   - Smallest fix: mark the row NOT DONE and open the first line with that figure, and have the bound ruled on, or the active time taken as the measure by a ruling.

### Standards

1. `src/lib/ui/controls/heads/FoldControl.svelte:2-5`, not changed by the step: "primitive of the headings beside it (GroupHead.svelte and FoldHead.svelte). ... written once so both headings name and draw it alike." The step makes it false: `CommandCenterView.svelte` and `Gallery.svelte` draw it too (`grep -l FoldControl`). The report names it at `:604` and leaves it because the file is outside the path list. CLAUDE.md says a step's path list is widened rather than work split out of it, and a sentence the change makes false is a defect of the change.
   - Failure: a reader who changes `FoldControl` for the two headings alone changes the command center's row control, and the head comment told them nothing else draws it.
   - Smallest fix: rewrite the head comment to name the headings beside it, the command center's line of emails and the Gallery's ticker.

### Behaviour

1. `src/lib/ui/display/ticker/Ticker.svelte:103-124`, the button with label, detail and tail inside one clipped `.name` (CSS `.name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }`, `:190-196`), with `CommandCenter.svelte:185-186` `detail: name === thread.subject ? '' : thread.subject, tail: threadAge(thread, now)`. Ruling 765 asks for "one row per email with sender, subject and age". The tail is the last text inside the clipped button, in a box of two 22em columns (`TickerGroup.svelte:135`, `columns: 2 22em`).
   - Failure: sender "Prof. Maria van den Berg", subject "Re: comments on the revised manuscript before Friday", age "2 d": the line is longer than the column, the ellipsis falls inside the subject, and the age is not on screen. Case 44's 200-character subject always loses it. It is readable only in the hover title.
   - The report states this only under Judgment calls ("A long subject cuts the age tail off with the name"), not in the host- and user-visible table. For most real subjects the ruled element does not show.
   - Smallest fix: make the button a flex row, let the label and the detail shrink with the ellipsis, and keep `.tail` as `flex: 0 0 auto` outside the cut. The same change serves the other rows of `Ticker`, so it is checked against `Tasks.svelte` and the Gallery too.

## 4. Declined to judge

- The look at landing: cases 35, 37, 39 and 45, the 36 and 38 drawing, and the emails on a page. Not checked, since no page or browser may be started.
- The report's `em/` vitest harness (`em__emails.run.ts`, `em__present.run.ts`) was not rerun: it needs a config inside the worktree that resolves the worktree's `.agents/scratch`, and nothing is written in the worktree.
- Before-side measurements of verify 3 (7 ms, 20 ms, 416.3 ms, the 989 KB scan figures) were not reproduced: they need the base tree checked out, and I run only `git show` and `git diff`.
- The app's packaged build was read for paths and package presence only. The worker was not started inside it (a worker file runs from the same `src` layout, unpacked).
- A kept layout made on a tiny frame (an Overview tile, the next preview) and put on in the pane: the brief's design, declared by the report. Whether it looks the same at other sizes is the look's to settle.
- A worker restarted after the server's sources changed on disk runs the newer code than the server does. This is a judgment of design, not a finding.
- Guarded entries: the ones a script finds over the Code lines of `guarded.md` and the diff are G28, G32, G40, G46, G51, G52, G78, G81, G82, G87, G90, G91, G109, G117, G146, G148 and G152. Each is in the report's list. G35 is in the report's list as well. G1, G8, G31, G36, G61, G84 and G135 are not reached by the diff by that check. Their tests were not run separately.
- Diagrams: `docs/diagrams/layers.dot` was sampled (edge counts only). The others were not read. A test compares them.
- Comment history words: a grep over the added comment lines for words such as "no longer" and "previously" gave three hits, each a present-tense use.

## 5. Usage

Usage: aaf390701b23dd659, claude-opus-5-5, 175101 tokens, 82 tool uses, 1344.7 s.

## Closed

- Proof 1: ruled as open item 768 (the orchestrator, automode): the bound is judged by the time the thread is active in one fold, 416.3 ms before and 1.2 ms after.
- Standards 1: fixed at landing, the head comment of `FoldControl.svelte`.
- Behaviour 1: ruled as open item 769 (the orchestrator, automode) and fixed at landing: an email's age stays on its row.
- The red lines of the reviewer's `test:quick` are timeouts under load in files the step does not change; each file passes alone (the reviewer's section 1). The landing's run on main is the check.
