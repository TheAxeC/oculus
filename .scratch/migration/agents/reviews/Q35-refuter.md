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
