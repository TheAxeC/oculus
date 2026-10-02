# Q35 refute report (reviewer, claude-sonnet-5-5)

Worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q35, base f9d13777. I ran only `git diff f9d13777` and `git status --short`; the `git status` line count (39) was the same before and after my runs. The one command that writes files is `npm run diagrams`, which left `git diff f9d13777 | md5` unchanged (a8aa9046...), so the committed diagrams match the source. For the "unchanged tree" check I used a scratch copy outside the repo (`.../scratchpad/unchanged`), reverse-applying `git diff f9d13777 -- src config DESIGN.md HELP.md` with `patch -R`.

## 1. Verification lines, verbatim

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` exited 0 and printed the ten `docs/diagrams/*.dot` and `*.svg` paths (layers, layer-data, layer-server, layer-state, layer-ui, layer-shell, layer-views, channels, writes).

checks.sh, run from the worktree's tools/oculus (the first run was overwritten by a parallel reviewer writing the same scratchpad file name, so this is the second run into a file named by pid):

```
$ npm test
 Test Files  3 failed | 421 passed | 22 skipped (446)
      Tests  7 failed | 11093 passed | 619 skipped (11719)
checks: failed with exit 1: npm test
exit=1
```

All 7 failures are `Error: Test timed out in 5000ms.` in `tests/routes/git/git.test.ts` (1), `tests/server/edit/config-key.test.ts` (3) and `tests/server/git/autofetch.test.ts` (3), none changed by the step. Rerun alone:
- `npx vitest run --reporter=dot tests/routes/git/git.test.ts tests/server/edit/config-key.test.ts tests/server/git/autofetch.test.ts` printed `Test Files  1 failed | 2 passed (3)`, `Tests  1 failed | 113 passed (114)`, the failure being one autofetch case.
- `npx vitest run --reporter=dot tests/server/git/autofetch.test.ts` printed `Test Files  1 passed (1)`, `Tests  44 passed (44)`.

Load timeouts, not findings. checks.sh stops at its first red, so I ran the other six commands one by one (same commands, not through checks.sh):

```
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790900429735 COMPLETED 2957 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            (finished, no error line)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint             exit=0 (rerun alone)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests     exit=0, no output
```

I did not get the line `checks: 7 commands passed` from one checks.sh run. The report's run 5 quotes it; what I reproduced is the same commands green apart from the load timeouts.

Other commands I ran:
- The report's scoped run `npx vitest run --reporter=dot tests/views/shared/prose/jump.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/audits.test.ts tests/checks/tree/negatives.test.ts` printed `Test Files  4 passed (4)`, `Tests  27 passed (27)`, as the report claims.
- `grep -n "Card" src/lib/views/system/audit/Audit.svelte` exit 1 (no output); `grep -rn "elide" src config` exit 1; `sh utils/folder-check.sh` exit 0.
- The ASCII gate from spec.md over `src tests config` printed nothing; `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` printed nothing.
- I found no added comment line over 100 columns and no added line naming a package id or a date.
- File line counts in the report match `wc -l` (Audit 304, Present 288, present.ts 460, ChangeGroups 311, jump.test 113, audit.test 311, present view test 353).

First run on the unchanged tree, reproduced. I reverse-applied the source diff in the scratch copy and ran the seven changed test files with the final tests: `Test Files  7 failed (7)`, `Tests  18 failed | 182 passed (200)`. Failing names:
- `fit` (2).
- Present frame (2): "draws the slide inside the frame..." and "draws the frame hidden until...".
- Changes 90-character path (1).
- Audit rows: "draws one list row per finding...", "draws the scope, the message, the place...", "draws a row with an empty scope...", "draws two findings carrying one signature as two rows", "the muted section > holds the parked findings...", "draws the parked rows with the un-mute control...", "keeps the rows whose scope...", "draws every row again when the search is empty".
- format.test "the path forms" (1).
- Customizations real path (3).
- jump.test "audits that the distance is divided by the scale..." (1).

## 2. Verdicts

What to build:

| Item | Verdict | Note |
| --- | --- | --- |
| 1 Changes paths cut at the end; `elide`, `PATH_MAX`, `sessions.ch_elide` removed | holds | `grep -rn "elide" src config` empty. The brief's premise that `Repo.svelte`'s `.path` "gains the three rules" does not reproduce: the base already has them (`git show f9d13777:...Repo.svelte` lines 291-299). Nothing to add. |
| 2 Aligned columns | holds | Grid plus subgrid in `ChangesTouched.svelte` and `ChangeGroups.svelte`. Look only. |
| 3 Customizations open where the file is | holds | `realPath()` in `rowOf()`, `Customizations.svelte` unchanged. |
| 4 Audit as a list | holds | `ul`/`li[data-card]`, `tinted`, no `Card`, row-reveal. |
| 5 Present filling its pane | holds | |
| 6 Slide laid out for its frame | holds | The Panel point in finding S2 is the only deviation. |
| 7 Tests | holds | See P1, P2, P3. |
| 8 Docs | holds | One extra sentence at `DESIGN.md:87`, see S3. |

Cases:

| Case | Verdict |
| --- | --- |
| 1 | met |
| 2 | met |
| 3 | met; "disabled while a write is out" is an audit over source text (`disabled={busy}`, `if (busy) return;`), not rendered |
| 4 | partial, see P2 |
| 5 | met as the brief states it (one outcome noted and kept); the client-side keyed `each` over a duplicate key is not verifiable, see P3 |
| 6 | met |
| 7 | met |
| 8 | met, `toBeCloseTo(50 / 720, 12)` per the cases ruling |
| 9 | met via stubs, named audits; fails without the division (reproduced) |
| 10 | met |
| 11 | met |

## 3. Findings

### Spec

**S1. Customization viewer tabs saved with a link path stop opening.**
- Place: `src/lib/server/sessions/stores/customizations.ts`, `customizationFile` (lines 399-403) with the new `realPath()` in `rowOf()`.
- Hunk: `items: found.items.map((item) => ({ ...item, path: realPath(item.path) }))`; `customizationFile` still tests `resolve(item.path) === wanted` against the path the client sends.
- Wrong: the listing now gives only the real path, so a viewer tab restored from the layout with the old link path is "not listed" and returns null. The viewer tab id is `agent:account:path` and instance state is saved with the layout. Only links into folders no root holds opened the viewer before, so the set is small.
- Failure scenario: a reader had a viewer tab on a link outside every root, restarts, and the restored tab shows its error.
- Verdict: low. Not in the report. The brief item 3 does not mention saved tabs. Orchestrator decides whether `customizationFile` should also accept the link form; I make no change.

**S2. `Panel.svelte` changed although it is not a listed path, and the brief says the Panel keeps the UI tokens.**
- Place: `src/lib/views/academic/present/Panel.svelte` (six `font-size: var(--fs-md|--fs-sm)` to `var(--slide-fs-small)`), plus its row in `type-scale.test.ts`.
- Wrong: brief item 6 ends "The Overview grid, the empty state and the Panel are not scaled and keep the UI tokens", and "Paths this step writes" lists `Present.svelte`, `Slide.svelte` and `parts/` only. The builder read it the other way. Panel is used only inside `parts/Project.svelte`, so inside the frame, and leaving UI tokens there would give 11-13 px text in a 1280 px frame. The change is plausible, but it contradicts the brief's sentence, and the report's "Decisions" list does not mention it.
- Verdict: unreported judgment call on an unlisted path. The orchestrator rules which reading is right.

**S3. Changes beyond the listed items, not reported.**
- `tests/ui/theme/wall.test.ts` (+2 lines, an exemption `'src/lib/views/system/audit/Audit.svelte li:hover': 'a hover response, saying which row the pointer is on'`) is not in "Paths this step writes" and not in the report. It matches the sibling exemptions for `Results.svelte .row:hover` and the tree row, so I judge it needed, but it is an exemption added to a check without a line in the report.
- `DESIGN.md:87` gains a sentence on Customizations and real paths, and `HELP.md:139` changes the Audit row wording. The brief's item 8 names `DESIGN.md:367`, `:378`, `HELP.md:120` and the Changes passage. Both extra edits are accurate.
- Verdict: low, reporting gap only.

### Proof

**P1. A "seen failing first" claim carried, not rerun, and partly inaccurate.**
- Place: report section "The cases' first run", rows 2 and 3, and the totals line `Tests 19 failed | 181 passed (200)`.
- The report says the row form of case 2 and case 3 "fails on the `li` selector". On my reconstruction, "draws a message holding markup and an unmatched backtick as text" and "carries the mute control on an open row" pass on the unchanged tree (they select by `data-card`, which the card also carried). My total is 18 failed | 182 passed, not 19 | 181.
- The failing set (section 1) shows every behaviour the change adds fails without it, so nothing is left without a failing first run. Only the report's description and count are off.
- Verdict: low. The report states the first run is the previous builder's, "carried ... not rerun by me".

**P2. Case 4's third clause is not asserted.**
- Place: `tests/views/system/audit.test.ts`, "keeps the muted section, with its count, when only a parked finding matches".
- Hunk: `expect(sections(body)).toEqual(['muted']);` and `not.toContain(catalog['audit.none_match'])`. The test name promises the count, but no assertion reads the count.
- Verdict: partial for case 4.

**P3. Duplicate-signature hazard named, not fixed or tested.**
- Place: `tests/views/system/audit.test.ts`, "draws two findings carrying one signature as two rows", and `Audit.svelte` `{#each ... (finding.signature)}`.
- The report states that the keyed `each` over a duplicate key is not verified on the client. The brief asked for this outcome to be stated and kept, so the test follows the brief. The Findings view keys its rows `file:key:index`, which avoids the hazard. With two findings sharing a signature, Svelte's dev-mode keyed-each check may throw on the client. I could not run a client DOM here, so this is not verified.
- Verdict: not verifiable. The report names it plainly.

**P4. `tests/state/shared/words/format.test.ts` "cuts no path ..." asserts only that two names are not exported.**
- It fails on the unchanged tree (reproduced), but no behaviour backs it; the rendered behaviour is case 10 in `changes.test.ts`. Kept as a guard, so low.

No widened threshold, no file-scope mutable added, no new dependency. The jump stub test fails without the division (reproduced).

### Standards

**St1. One element per line.** `ChangeGroups.svelte`: `<span class="counts"><ChangeCounts {entry} /></span>` puts two elements on one line (spec: "Svelte markup is written one element per line"). Prettier passes. Low.

**St2.** No other broken standard found: head comments present and without history, no non-ASCII, no file over the size limit, `sh utils/folder-check.sh` exit 0, folder `tests/views/shared/prose/` holds 3 items. Grep of every changed name (`elide`, `PATH_MAX`, `ch_elide`, `Card` in Audit, `--card-reveal`, `Slide` importers) finds no sentence the diff makes false. `Slide.svelte`'s head comment was corrected to "the pane" (only `Present.svelte` imports Slide).

### Behaviour

**B1. Changes: the "also open" mark moves from after the path to before it** (`ChangesTouched.svelte`: `{@render mark(also)}` now precedes `.pa`; the brief's column order names the mark first). The report's before/after for Changes omits it. Low.

**B2. Customizations: the source-tab label is now the real file's basename** (`Customizations.svelte` `open` takes `name` from `item.path`), so a link `a.md` to `b.md` opens a tab labelled `b.md`. Not in the report. Low.

**B3. The report misnames the keys in its "sharp edge".** It says PageUp and PageDown scroll the frame. In `Present.svelte` `keys()`, PageDown and PageUp step the slide and call `preventDefault`. The shell's scroll action (`gg`/`G`, `keys.ts:170-175`) is what reaches the frame's nested `data-scroll` via `scrollContainer` (`key-dom.ts:51-52`). The outcome (the frame scrolls on `gg`/`G`) matches the brief; only the report's key names are wrong. Low.

**B4. Not verifiable here, all look items:** frame fit, centring, letterbox, first paint, whether `.present.framed { height: 100% }` resolves inside `Pane`'s flex `.body` (`Pane.svelte:145-149`, a flex item with `min-height: 0`, so it should be definite, but unseen), hover reveal, `.beside:empty` and `.counts:empty` behaviour with Svelte's anchors, column alignment, and the Customizations row opening.

## 4. Declined to judge

- Everything the look on TEST is for (list above in B4): the unit suite renders to a string and I started no browser or server.
- Client-side behaviour of a keyed `each` over a duplicate key (P3): no DOM runtime in the suite.
- Token usage and tool-use counts of the builders: the report says "not measured by a command", and I have no command that measures them.

## 5. My usage

Model claude-sonnet-5-5. Tool uses: about 55, as I counted them by hand; no command measured this, so tokens and time are not verified. The two longest runs were the full list (about 400 s for `npm test` alone under load) and the unchanged-tree reconstruction.

Usage from the completion notice: claude-sonnet-5-5, 190,538 tokens, 61 tool uses, 36.9 min.

# Repair round 1, refuted

Worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q35 (tools/oculus), base f9d13777. I ran only `git diff f9d13777` and `git status --short` there. `git diff f9d13777 | md5` was `a4a68695401b7dd7455a63a0aa3c6924` before and after all my runs, and `git status --short` listed 39 entries before and after. My scratch copies and outputs are under /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/q35r1/ (`copy/`, `unchanged/`, files named by pid or command).

## Verification lines, verbatim

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` exited 0 (printed the `docs/diagrams/*.dot` and `*.svg` paths, last `docs/diagrams/writes.svg`). The diff md5 above did not change, so the committed diagrams match the source.

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` exit 1:

```
$ npm test
 Test Files  2 failed | 422 passed | 22 skipped (446)
      Tests  4 failed | 11097 passed | 619 skipped (11720)
   Duration  421.45s
checks: failed with exit 1: npm test
```

The 4 failures are all `Error: Test timed out in 5000ms.`: `tests/server/edit/config-key.test.ts` (2) and `tests/server/git/autofetch.test.ts` (2). The step changes neither file. Rerun alone: `npx vitest run --reporter=dot tests/server/edit/config-key.test.ts tests/server/git/autofetch.test.ts` printed `Test Files  2 passed (2)`, `Tests  82 passed (82)`. Load timeouts, not findings, and not counted as a pass of the list.

checks.sh stops at its first red, so I ran the other six commands one by one, each in the foreground:

```
$ npm run test:checks   exit=0   Test Files  29 passed | 2 skipped (31)   Tests  442 passed | 9 skipped (451)
$ npm run check         exit=0   1790904717826 COMPLETED 2957 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build         exit=0
$ npm run format:check  exit=0   All matched files use Prettier code style!
$ npm run lint          exit=0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests   exit=0, no output
```

I did not obtain the line `checks: 7 commands passed` from one checks.sh run. The report's run 4 quotes it; what I reproduced is the same seven commands green apart from the load timeouts.

Further commands:
- The round's scoped run `npx vitest run --reporter=dot tests/server/sessions/stores/customizations.test.ts tests/views/system/audit.test.ts tests/state/shared/words/format.test.ts tests/views/sessions/changes.test.ts tests/views/whole/type-scale.test.ts` printed `Test Files  5 passed (5)`, `Tests  376 passed (376)`, as the report claims.
- `npx vitest run --reporter=dot tests/views/shared/prose/jump.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/audits.test.ts tests/checks/tree/negatives.test.ts` printed `Test Files  4 passed (4)`, `Tests  27 passed (27)`.
- `grep -n "Card" src/lib/views/system/audit/Audit.svelte` exit 1, no output. `grep -rn "elide" src config` exit 1, no output. `sh utils/folder-check.sh` exit 0.
- The spec's ASCII gate over `src tests config` printed nothing. `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` printed nothing.
- No added src comment line is over 100 columns, and no added line names a package id or a date. `package.json` and `package-lock.json` are not in the diff. `ls docs/adr` and `ls ../../docs/adr` print "No such file or directory", so no ADR governs the diff.

## The round's claims, rerun

All "fails without the fix" runs were on the scratch copy, never in the worktree.

| Claim | My run | Reproduced |
| --- | --- | --- |
| S1: with `const wanted = realPath(resolve(path));` changed to `const wanted = resolve(path);`, "serves the file a link points at when the viewer is asked for the link path" fails | `customizations.test.ts:384`, `AssertionError: expected null to be '# out'`, `Tests  1 failed \| 30 passed (31)` | yes |
| S1: the second new test (not listed gives null) passes with and without the fix | it was not in the failing set | yes |
| P2: with `const hidden = $derived(auditSearch(parked(), search));` changed to `$derived(parked())`, the count case fails | `FAIL ... keeps the muted section, with its count, when only a parked finding matches`, `AssertionError: expected [ '2' ] to deeply equal [ '1' ]`, `Tests  1 failed \| 23 passed (24)` | yes |
| P3: keys `${signature}:${index}` at `Audit.svelte:163` and `:181`; no test fails without them | with both keys reverted to `(finding.signature)`, `Tests  24 passed (24)` | yes; the report says so (checked by reading, left to the look) |
| P1: first-run totals `Tests 18 failed \| 182 passed (200)` | see Proof P5 | not reproduced on the final test files |
| P4: "cuts no path" and its `import * as format` removed | `grep -n "cuts no path\|import \* as format" tests/state/shared/words/format.test.ts` prints nothing | yes |
| St1: `ChangeGroups.svelte:140-142` one element per line | read | yes |
| Line refs: `customizations.ts:402`, `audit.test.ts:269`, `customizations.test.ts:382` and `:389`, `Customizations.svelte:89`, `changes.test.ts:192`, `type-scale.test.ts:161` | each greps to the stated line | yes |

First run on the unchanged tree (source diff reverse-applied with `patch -R -p3` in a scratch copy, the final tests, seven changed test files): `Test Files  6 failed | 1 passed (7)`, `Tests  17 failed | 184 passed (201)`. Failing: `fit` (2), Present frame (2), Changes 90-character path (1), Audit rows (8), Customizations real path (3), jump scale (1). The cases "draws a message holding markup and an unmatched backtick as text" and "carries the mute control on an open row" pass there, as the report now says.

## Verdicts, whole diff since the base

What to build:

| Item | Verdict | Note |
| --- | --- | --- |
| 1 Changes paths cut at the end; `elide`, `PATH_MAX`, `sessions.ch_elide` removed | holds | grep of `elide` over src and config is empty. The brief's premise that `Repo.svelte`'s `.path` "gains the three rules" does not reproduce (base lines 291-299 already hold them). The report does not say so (Spec S2). |
| 2 Aligned columns | holds | grid with subgrid in `ChangesTouched.svelte` and `ChangeGroups.svelte`; look only |
| 3 Customizations open where the file is | holds | `realPath()` in `rowOf()`, `Customizations.svelte` unchanged; the viewer also accepts a link path (round 1) |
| 4 Audit as a list | holds | `ul` and `li[data-card]`, row order scope, message, place, control; `tinted`; no `Card` import; comments made true |
| 5 Present filling its pane | holds | |
| 6 Slide laid out for its frame | holds | `Panel.svelte` is on the slide scale, which the brief's sentence excluded; the report now names it and the orchestrator ruled it kept |
| 7 Tests | holds | Proof P4 and P5 below |
| 8 Docs | holds | `DESIGN.md:367`, `:378`, `HELP.md:120`, `:130`, `:139`; `DESIGN.md:87` is listed in the report |

Cases:

| Case | Verdict |
| --- | --- |
| 1 | met |
| 2 | met |
| 3 | met; "disabled while a write is out" is a named audit over source text (`disabled={busy}`, `if (busy) return;`) because `busy` is set in an async handler the string render cannot press |
| 4 | met (the third clause now asserts the count, reproduced failing without the fix) |
| 5 | met as the brief states it (one outcome noted, kept, two rows); a keyed `each` over a duplicate key in a client runtime is not verifiable |
| 6 | met |
| 7 | met; the empty-deck and grid cases pass on the unchanged tree, as invariants |
| 8 | met, `toBeCloseTo(50 / 720, 12)` per `Q35-cases.md` |
| 9 | met through stubs, named audits; fails without the division (reproduced) |
| 10 | met for the rendered behaviour; "`elide` no longer exists" is now held by `grep` and by `npm run check` on any importer, with no test asserting it (the P4 removal was ruled) |
| 11 | met |

## Findings

### Spec

**S1. `Equation.svelte` and its type-scale row overlap M4 (merge note, not a defect of the diff).**
- Place: `src/lib/views/academic/present/parts/Equation.svelte` (`.gap` font-size `var(--fs-md)` to `var(--slide-fs-small)`) and `tests/views/whole/type-scale.test.ts` row `'academic/present/parts/Equation.svelte': '.gap=slide-fs-small'`.
- Wrong: M4's brief (item 2) removes the `.gap` branch and its styles from `Equation.svelte`, and the state file gives M4 "the `Equation.svelte` row at 153 only" (`orchestrator-state.md` line 129). Q35's `shared_paths` (line 87) does not list `Equation.svelte` or that row, and the report's lists do not name it.
- Failure scenario: the second of the two landings conflicts on the row and on the file. The orchestrator merges it; I change nothing.

**S2. The report omits that the brief's premise on `Repo.svelte`'s `.path` does not reproduce.**
- Place: report "Anything wrong in the brief" names only the Panel sentence. Brief item 1 says `.path` "gains the three rules"; `git show f9d13777:tools/oculus/src/lib/views/sources/repositories/Repo.svelte` lines 291-299 already hold `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.
- Verdict: reporting gap, low. The code needs nothing.

**S3. Customizations tab id and label follow the real path (low, stated in the report).**
- Two rows whose links point at one file now share the viewer tab id `agent:account:path`, so they open one tab. The row keys in `Customizations.svelte:198` include the index and name, so no duplicate key is possible there. Low.

### Proof

**P1. Case 11's refusal test does not exercise the hazard the fix creates.**
- Place: `tests/server/sessions/stores/customizations.test.ts:389`. The fix makes `customizationFile` follow the asked path, so the named hazard is a link whose target the listing does not hold. The test asks for a plain unlisted file (`other.md`) and a dangling link. It passes with and without the fix (the report says so), and it would also pass if the link were followed to an unlisted target. A link to an unlisted target (`symlinkSync(join(outside, 'other.md'), join(account, 'agents', 'evil.md'))`, asked by the link path, expecting null) would. Low; the implementation compares the real path with the listing.

**P2. First-run totals in the report do not match the final test files.**
- Place: report "The cases' first run": `Test Files  7 failed (7)`, `Tests 18 failed | 182 passed (200)`. My run of the same seven files with the final tests on the unchanged tree: `6 failed | 1 passed (7)` and `17 failed | 184 passed (201)`. The difference is the removed "cuts no path" (it failed there) and the two added Customizations tests (both pass there). The totals were not updated after P4 and S1. No decision rests on them; the failing set is right.

**P3. "Test count" for the report's "Files changed (line counts now)" is stale for five round-1 files.**
- Report says: `customizations.ts` 469, `audit.test.ts` 311, `customizations.test.ts` 381, `format.test.ts` 131, `ChangeGroups.svelte` 311. `wc -l` now: 471, 314, 397, 123, 313.

**P4. `format.test.ts` no longer asserts that `elide` is gone, and no test names its absence.**
- By ruling 7. `grep -rn "elide" src config` and `npm run check` hold it. Noted so the case 10 verdict is read as above.

No widened threshold, no file-scope mutable, no check removed other than the ruled "cuts no path" and the brief's own `allow-audits.txt` line.

### Standards

None found. Re-checked for the delta: `ChangeGroups.svelte:140-142` one element per line; head comments present and free of history; the ASCII gate, `folder-check.sh`, `format:check`, `lint` and the comment-width test are green. The `customizationFile` doc comment ("a path saved while it was a link") describes behaviour, not history.

### Behaviour

**B1. Not stated in the report (low, look items):**
- Audit rows carry `data-card` but no `data-cursor`. The old cards passed `cursor={false}`, so the arrow keys step the rows with no visible cursor before and after. No change.
- The Present frame is a scroll container (`overflow-y: auto`, `data-scroll`), so Chrome may make it keyboard-focusable, and `gg` and `G` scroll it even when the slide fits. The report names the `gg`/`G` outcome; the focus is not named.
- The Changes (Touched) list: gaps between columns are cell margins instead of the flex `gap`; the count in `ChangeGroups` rows is right-aligned in its column instead of following the path. The report's before and after says "verb and count start at one x".

**B2. Not verifiable here (look items):** frame fit, centring, letterbox and first paint, whether `.present.framed { height: 100% }` resolves inside `Pane`'s `.body` (padding 10px 12px, flex item with `min-height: 0`; if the height were indefinite the stage would size from its own content and stay at scale 0, hidden), hover reveal, `.beside:empty` and `.counts:empty` with Svelte's anchors, column alignment, the Customizations row opening, and the client behaviour of the new row keys.

## Declined to judge

- Everything the look on TEST is for (B2): the unit suite renders strings, and I started no browser or server.
- The client-side behaviour of a keyed `each` over duplicate keys: no DOM runtime in the suite. Not checked, so the fix at `Audit.svelte:163` and `:181` stands as "checked by reading".
- The delta as such: no tree state was recorded at the send. I read every ruled item against the whole diff; I cannot say a given hunk was first made in round 1 rather than earlier, so "a fix reaching beyond its ruling" is judged by reading each hunk against the ten rulings and found none.
- Whether a root configured as a symlinked path regresses Customizations rows from a source tab to the viewer (the report's first sharp edge): on this machine `~/workspace`, `~/workspace/research-hub`, `~/.claude`, `~/.claude-work` and `~/data` are not links (`readlink -f`); I did not read the configured roots from `config/local.yml`, which I may not open.
- Tokens, time and tool counts of the builder: no command measures them.

## My usage

Model claude-sonnet-5-5. About 35 tool calls, counted by hand; tokens and wall time not measured by a command. The longest runs were the checks.sh run (421 s for `npm test` alone, under load) and the six single commands (about 10 minutes, moved to the background by the harness at its 600 s limit; I did not poll and read its output on completion).

Usage from the completion notice: claude-sonnet-5-5, 207,483 tokens, 56 tool uses, 30.7 min.

## Closed

First run (closed by repair round 1, `agents/briefs/Q35-round1.md`): S1 by the real-path comparison in `customizationFile` and its test (rerun red without the fix by the round's reviewer); S2 kept, named in the report; S3 listed in the report; P1 corrected in the report; P2 by the asserted count (rerun red); P3 by the keys `${finding.signature}:${index}` (checked by reading and at the look); P4 by the removed test; St1 one element per line; B1, B2, B3 stated in the report.

Run over round 1 (never sent to the builder; each closed at landing):
- S1, the overlap with M4 on `Equation.svelte` and its `type-scale.test.ts` row: closed by merge. Q35's and M4's `shared_paths` name it; whichever lands second resolves it, M4's removal of the `.gap` branch winning over Q35's font-size line in it.
- S2, the brief's `Repo.svelte` `.path` premise already true at the base: named in the booking; no code change.
- S3, two linked rows to one file share one viewer tab: kept, as the report states.
- P1, the refusal test misses a link to an unlisted target: fixed at landing, a case asking for a link whose target the listing does not hold by the link path and expecting null, run red against a `customizationFile` that serves any real path.
- P2 and P3, the stale first-run totals and line counts: the booking quotes the reviewer's `Tests 17 failed | 184 passed (201)` and the counts of `wc -l` on main.
- P4: as ruled in round 1 (ruling 7); held by `npm run check` and the grep of `elide`.
- B1: the three unstated changes (no row cursor, the frame as a scroll container, the Touched columns' margins and right-aligned count) are named in the booking and looked at on TEST.
- B2: the look on TEST at landing.
