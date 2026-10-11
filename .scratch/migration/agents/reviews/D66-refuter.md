# D66 refuter report

D66 review report (refute rules). The reviewer changed no file in either tree; every probe and replica ran under $TMPDIR (`$TMPDIR/d66-review`, `$TMPDIR/d66-probe`).

## 1. Verification lines, verbatim

All runs are from the worktree's `tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

`npm run test:quick -- --base 8c3c52cb6` (rc=0):
```
test:quick: 18 changed file(s), from git since 8c3c52cb6
test:quick: 12 test file(s), 10 essential
        tests/data/sources/agents-catalog.test.ts: imports at depth 2
        tests/data/sources/config/settings.test.ts: imports at depth 2
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.3 s)
ok      svelte-kit sync (1.8 s)
ok      svelte-check (5.8 s): 1791717759230 COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (11.5 s): Duration  7.24s (transform 7.04s, setup 0ms, import 13.68s, tests 7.85s, environment 3ms)
test:quick: 11.9 s (limit 45.0 s); every command passed
```

`npx vitest run tests/checks/config/config-folder.test.ts` in the worktree (rc=1):
```
     × reads the roots of sources.yml without a finding 2ms
     × names a group of its own and a path under the hub for every document 147ms
AssertionError: expected 0 to be greater than 0
Error: expected any number of assertion, but got none
      Tests  2 failed | 23 passed (25)
```

The same file on three scratch hubs. Each hub links the worktree's top-level folders, without `.git`; the oculus folder holds a copy of `src tests utils config assets`, and `.oculus` is linked from the main checkout only where the line says yes:
```
== base-sparse: .oculus/config/sources.yml exists: no
rc=1
     × reads the roots of sources.yml without a finding 2ms
     × names a group of its own and a path under the hub for every document 151ms
      Tests  2 failed | 23 passed (25)
== base-full: .oculus/config/sources.yml exists: yes
rc=0
      Tests  25 passed (25)
== work-full: .oculus/config/sources.yml exists: yes
rc=0
      Tests  25 passed (25)
```
`ls .agents/worktrees/D66` lists no `.oculus`. The two failures therefore come from the worktree's sparse checkout, which has no `.oculus/config/sources.yml`. They are not the step's: the base fails the same way in the same layout, and both base and step pass with the hub layer present.

Case 6, `grep -rn --exclude=local.yml "arch_color\|archColors" src tests config utils docs`: no output, `case6 rc=1`.

Unused exports, `sh utils/unused-exports.sh > $TMPDIR/d66-ue.txt; diff <base>/unused-exports.txt $TMPDIR/d66-ue.txt`: no output, `diff rc=0`.

`wc -l`:
```
     250 config/catalogs/vocab.yml
     399 src/lib/data/shapes/catalog-files.ts
     463 src/lib/state/boards/structure/graph.ts
      23 src/lib/views/structure/map/node-view.ts
     191 src/lib/views/structure/map/Map.svelte
     466 src/lib/views/structure/map/Graph.svelte
     162 src/lib/views/structure/map/Controls.svelte
     107 src/lib/views/structure/map/Nodes.svelte
     364 src/lib/views/system/machine/usage/Usage.svelte
     502 src/lib/ui/tabs/Tabs.svelte
     640 tests/checks/config/config-folder.test.ts
```

ASCII gate of `spec.md:100`: no output, `ascii rc=0`. `ls bin` prints "No such file or directory". `LC_ALL=C grep -n '[^ -~]'` over the three changed `.dot` files: no output.

`sh utils/folder-check.sh`: no output, rc=0. `sh utils/size-check.sh`: no output, rc=0. `ls src/lib/views/structure/map | wc -l`: `9`.

Case 5, from a probe in `$TMPDIR/d66-probe/probe.mts` run with `npx tsx`:
```
WORKTREE catalogs/vocab []
WORKTREE catalogs/vocab.yml [{"kind":"unknown","key":"arch_color"}]
BASE-REPLICA catalogs/vocab []
BASE-REPLICA catalogs/vocab.yml []
replica-src-identical
```
`replica-src-identical` is printed by `diff -rq` of the base copy's `src` against the replica's `src`. Importing straight from the base copy fails on module resolution (`Error: Cannot find module 'lodash-es'`), since no `node_modules` lies above that path. So the base run was made on the byte-identical copy.

Diagrams, `staleFiles()` of `utils/diagrams/diagrams.mjs`. The base docs were rebuilt in the scratch copy by `git diff 8c3c52cb6 -- docs/diagrams | patch -R`:
```
WORKTREE-source-vs-WORKTREE-docs []
BASE-source-vs-BASE-docs []
BASE-source-vs-WORKTREE-docs ["docs/diagrams/layers.dot","docs/diagrams/layers.svg","docs/diagrams/layer-state.dot","docs/diagrams/layer-state.svg","docs/diagrams/layer-views.dot","docs/diagrams/layer-views.svg"]
```

`arch_color` anywhere in the worktree (`grep -rln --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.svelte-kit arch_color .`) is found only in:
- `tools/cockpit/` (5 files), which brief decision 3 keeps;
- ledger records under `tools/oculus/.scratch/`.

There are no hits in oculus's `src`, `tests`, `config`, `utils`, `docs`, `demo`, `DESIGN.md`, `HELP.md` or `README.md`, or in the hub's `docs/`. `grep -rn arch_color` over the main checkout's `.oculus/` returns rc=1, and the worktree has no `.oculus`.

`git status --short` in the worktree after all runs is unchanged from before them: 16 modified paths, plus the untracked `Nodes.svelte` and `.scratch/.../D66-report.md`.

## 2. Verdicts

What to build:
1. **Map colours from `type_color` alone: holds.**
   - The `arch_color` key and its nine entries are removed from `vocab.yml`. Lines 222-226 read the end of `lifecycle`, two blank lines, then `# Dataset access` (`sed -n 215,232p`).
   - The key is removed from `vocabFileShape`.
   - The comment is at `vocab.yml:54` (`grep -n`) and names the board card, the Map and the Present chip. `Present/parts/Project.svelte:42` reads `typeTone(type)`, so the comment is true.
   - `nodeTone(node)` returns `typeTone(node.type ?? '')`. `z`, `mapShape`, `readAs`, `colorShape` and `toneOf` are gone from `node-view.ts`.
   - `archiveStatuses(snapshot)` returns `{ status, tone: typeTone(status) }[]`.
   - In `Controls.svelte`, `Status` is `{ status: string; tone: string }` and the dot reads `var(--c-${item.tone})` (`:116`).
   - `Map.svelte:67` and `Nodes.svelte:65` use the new signatures, and no `configMap().arch_color` is left.
   - `config-folder.test.ts` loses `'arch_color'`.
   - Imports the change left unused are removed: eslint and svelte-check are ok, and the unused-exports diff is empty.
   - `Graph.svelte` is 466 lines and the new `Nodes.svelte` 107. `Nodes.svelte` has a head comment, and the compiler emits `$.from_svg` for it (a `svelte/compiler` run of the file printed `$.from_svg $.from_svg $.from_svg`). The folder holds 9 items.
2. **Live-session rows: holds.** `.live-row` is `--fs-sm` (`Usage.svelte:337`), and `.session` has no `font-size`, keeping its colour and number font. The heading `.live h3` stays `--fs-xs`. The comment above `.live-row` is still true, since the height rule is unchanged.
3. **The float's tab strip: holds.**
   - The effect at `Tabs.svelte:175-182` is the diagnosis's probe diff, token for token.
   - `untrack` is imported from `svelte`, and the comment above the effect is present.
   - `tab-scroll.svelte.ts` and `tab-strip.ts` are not in the diff.
   - The doc comment of `press` (`:203-207` region) still holds.
   - See Standards S1 for one sentence of the new comment.

Cases:
1. **Met (reading).** `node-view.ts:21-23` makes the node's tone the board card's `typeTone(project.type ?? '')` (`board/items.ts:107`). `type_color` gives `paused` `#9ca3af`, which `palette` maps to `c-grey` (`vocab.yml:46`), and `phd` `#6366f1`, which maps to `c-indigo` (`vocab.yml:37`).
2. **Met (reading).**
3. **Met (reading).** `graph.ts:310-318` and `Controls.svelte:22,116`.
4. **Met (reading).** `typeTone('manuscript')` is `UNKNOWN_TONE` (`tones.ts:139-143`).
5. **Met** under the file name `catalogs/vocab.yml`. The brief's command names `catalogs/vocab` and answers `[]` on both trees (Spec P1).
6. **Met.** rc=1, no output.
7. **Met (reading).**
8. **Met (reading).**
   - `dropped` is `#9ca3af`, so it draws grey.
   - `typeTone` lower-cases its input (`tones.ts:141`), and `archiveStatuses` keeps the status as written.
   - A project with no `type` gets no entry from `archived()` and is skipped by `archiveStatuses` (`project.type` must be truthy). Its node tone is `typeTone('')`, the unknown tone.
   - `.node.archived { opacity: 0.6 }` moved to `Nodes.svelte:99-101`.
9. **Met (reading).** The effect's only reactive read is `active`; `tabs` is read inside `untrack`. Running it on a page is not verifiable here and is the landing look's job.
10. **Met (reading),** with the comment caveat in Standards S1. The four situations I was asked to consider:
    - **First draw:** `revealedFor` starts undefined, so the effect reveals. The first `resized()`, queued by the effect at `:149-153` with `measuredWidth = -1`, also reveals when the tab is not whole.
    - **A tab closed so that `active` changes:** `active` changes, the guard passes, and the index is read from the current `tabs`.
    - **A tab opened that becomes active:** the same path, provided the caller hands `active` and `tabs` in one flush. Both derive from one layout state through `PaneStrip`/`stripShape`, so they do. See "Declined to judge" for the split-flush case.
    - **The showing tab moved by drag, same id:** `active` is unchanged, so this effect does not reveal. The ResizeObserver effect at `:155-166` re-runs because it reads `faces.slice(0, tabs.length)`. Its new observer's first notification calls `resized()`, which reveals the tab only when the move took it out of sight (`tab-scroll.svelte.ts:135-138`). The strip otherwise stays.

## 3. Findings

### Spec

**P1. The brief's case 5 command does not reproduce.**
- Place: `agents/briefs/D66.md`, case 5.
- Hunk: "`npx tsx -e` calling `shapeIssues('catalogs/vocab', { arch_color: { published: '#16a34a' } })` ... one issue naming `arch_color`. Unchanged tree: `[]`."
- What is wrong: `fileShapeOf` (`catalog-files.ts:394-398`) matches `one.file === norm`, and the file is registered as `catalogs/vocab.yml`.
- Failure scenario: the command as written prints `WORKTREE catalogs/vocab []` after the change, the same as before it, so it cannot tell the trees apart. With `catalogs/vocab.yml` it prints `BASE-REPLICA ... []` and `WORKTREE ... [{"kind":"unknown","key":"arch_color"}]`.
- The builder's correction reproduces. This is a defect of the brief, not of the diff, and case 5 is met.

The step adds no change that no brief item asks for. The `docs/diagrams/` changes are required by `spec.md:25` (`npm run diagrams` before the list); see Proof P1 for how the report handles them.

### Proof

**P1. The report omits six changed paths and calls their change unverified.**
- Place: the builder's report, "Files" and the paragraph under the DONE table.
- Hunk: "`npm run diagrams` ran before the list. It rewrote the files of `docs/diagrams/`; whether any content changed is not verified ... `grep -l "Nodes\|structure/map" docs/diagrams/*` lists only `channels.dot` and `channels.svg`."
- What is wrong: six files changed: `layers.dot/.svg`, `layer-state.dot/.svg` and `layer-views.dot/.svg`, as `git diff 8c3c52cb6 --stat` shows. They lie outside the brief's write list and are missing from the Files table, which `spec.md:34` requires to list every changed path and mark each one outside the write list.
- My judgment is that they belong to the step. `staleFiles` gives `[]` for worktree source against worktree docs, and the six paths exactly for base source against worktree docs. The counts follow the step's import changes:
  - `graph.ts` gains an import of `state/shared/words/tones.ts` (state/boards to state/shared, 7 to 8);
  - `node-view.ts` drops `$lib/data/shapes/shapes` (views/structure to data, 2 to 1; views to data, 17 to 16).
- Failure scenario: a landing that checks the diff against the write list and the report finds six unexplained paths. Dropping them would leave `tests/checks/diagrams/diagrams.test.ts` red at landing.
- Verdict named: none changed. Items 1 to 3 hold.

**P2. A DONE row quotes output its command does not print, and several `file:line` cites are off.**
- Place: the builder's report, DONE row "1 `vocab.yml:52` comment", and the case readings.
- Hunk: "`sed -n 52p config/catalogs/vocab.yml` | `# Project-type colours, ...`"
- What is wrong: `sed -n 52p` prints an empty line, and `grep -n "Project-type colours"` gives line 54. The same report cites `type_color` at `vocab.yml:53` (it is at 55) and `#6366f1` at `vocab.yml:38` (it is at 37).
- Failure scenario: a reader who reruns the quoted command to check the row sees a blank line. No decision rests on these numbers.
- Verdict named: none changed (item 1 holds).

No test asserts a known defect and no check was loosened. The one assertion edit is the removed `'arch_color'` in the owned-keys list, matching the removed schema key.

### Standards

**S1. One sentence of the new comment above the reveal effect is partly false.**
- Place: `tools/oculus/src/lib/ui/tabs/Tabs.svelte:172-174`.
- Hunk: "A tab added, moved or closed with the same tab showing leaves the strip where it is, and a change of width is answered by `resized()` of tab-scroll.svelte.ts."
- What is wrong: a tab added, moved or closed re-runs the ResizeObserver effect at `:155-166`, which reads `faces.slice(0, tabs.length)`. Its new observer's first notification calls `resized()`. `resized()` reveals the showing tab when it was whole and no longer is (`tab-scroll.svelte.ts:135-138`), whether or not the width changed. Brief case 10 states this exception; the comment states the opposite.
- Failure scenario: a strip overflows, the showing tab is whole at the right edge, and a tab is inserted before it. The showing tab is pushed past the edge and `resized()` scrolls the strip to bring it back, but a reader of the comment expects the strip to stay. (This is a reading: no page was run.)
- Verdict named: item 3 still holds, since the comment does say what the effect reveals and why it does not track `tabs`. The fix is a rewording at landing.

The other Standards checks found nothing:
- No history words in added comment lines (grep over the added lines and `Nodes.svelte` for before/used to/no longer/still/always/as before/previously/the step adds/after this/D66/2026: rc=1).
- No added line over 101 columns except the one-line YAML comment, which the one-line-per-paragraph rule allows.
- ASCII clean; no file over its size limit.
- `Nodes.svelte` has its head comment.

### Behaviour

**B1. The reveal fix changes every strip on the page, and the report states only the float's case.**
- Place: `tools/oculus/src/lib/ui/tabs/Tabs.svelte:175-182`, and the report's table "Host- or user-visible changes, before and after".
- What is wrong: the report covers only the float `[hpc, usage, workbenches]` under the scroll controls and a press on a half-hidden tab. The diagnosis's cause is page-wide: "every layout write hands each strip a new `tabs` array". So before the fix, any strip on the page that the reader had scrolled snapped back to its showing tab on any layout write anywhere: a press in another pane, a focus change, or a tab opened in another group. Scrolls by wheel or trackpad, which the head comment says are "not settled anywhere", were snapped back too. After the fix, those strips stay where the reader left them.
- Failure scenario: at the look, Axel wheels the main editor group's strip away from its showing tab and then clicks in another pane. Before, the strip jumped back; after, it stays. The look is read against the report's table, which does not name this.
- Verdict named: item 3 holds. The table lacks this row.

## 4. Declined to judge

- **The page runs of part (3), the Map colours and the Usage card.** No browser or page was run, by the brief's rules. Cases 9 and 10 are verdicts by reading, with the diagnosis's runs as the evidence.
- **The split-flush case of the reveal.** If a caller ever hands a new `active` before `tabs` holds that tab, the effect sets `revealedFor` with `index` -1, and `reveal(-1)` returns early. The later `tabs` update would then not reveal, except through `resized()`. I found no caller that does this: `PaneStrip` derives both from one layout state. A page run with such a caller would settle it.
- **Whether Svelte's keyed-each `bind:this={faces[index]}` reorders `faces` on a drag.** This bears on the drag answer in case 10; it was judged by reading only.
- **Landing mechanics, not judged.** The builder's report exists both as an untracked file in the worktree (`tools/oculus/.scratch/migration/agents/reviews/D66-report.md`, in the brief's write list) and as an untracked identical copy on main (`cmp` printed SAME). A cherry-pick carrying the worktree copy will meet the untracked file already at that path on main.
- **The landing list.** `npm run test:landing`, including `tests/checks/tree/boundaries.test.ts` and `tests/checks/diagrams/diagrams.test.ts`, was not run, per the instructions. The diagrams check was replaced by the `staleFiles()` runs above.

## 5. Usage

Agent id not known to me; model claude-opus-5-5; about 62 tool uses.

## Closed (the orchestrator, 2026-10-11; no repair round, every finding small and inside the brief)

- Spec P1 (the brief's case 5 names `catalogs/vocab`): a defect of the brief's command, not of the diff; case 5 is met under `catalogs/vocab.yml`, the builder's and the reviewer's runs agreeing; the booking names it.
- Proof P1 (six `docs/diagrams/` paths missing from the report): the six paths belong to the step (the reviewer's `staleFiles()` runs); they land with it and the booking lists them.
- Proof P2 (a DONE row's `sed -n 52p` and three `vocab.yml` line cites): the booking quotes `grep -n "Project-type colours"` at line 54 and corrects the cites.
- Standards S1 (the comment above the reveal effect says a tab added, moved or closed leaves the strip where it is): rewritten at landing to say `resized()` brings the showing tab back when such a change takes it out of sight.
- Behaviour B1 (the fix holds every strip on the page, not only the float's): the look at landing covers a scrolled main strip and a click in another pane, and the booking states the before and after.
