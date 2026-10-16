# Brief check: O37

Brief check, O37 (tools/oculus/.scratch/migration/agents/briefs/O37.md), on main c3cb498e2

The brief has rules that cannot be met as written. The serious ones:
- Item 8's check passes on the unchanged tree.
- Case 40's check of career.yml passes on the unchanged tree.
- Verify item 2 already fails on main.
- Five places conflict with spec.md: line 109 (size limit), line 214 (git commands), line 188 (browser console), cases 17 and 24 (test-run limits), and case 35 (a test with no guarded entry).
- The step line's looks part has no requirement in the brief.

Details follow.

## Names

Command: `git grep -n -F -e <name> -- ':!*local.yml' ':!tools/oculus/.scratch'` for each name, plus `grep -rlw <name> src tests` for the fixture names. Hits outside "Paths this step writes":

- `--card-reveal` (item 39): `src/lib/views/system/machine/usage/Usage.svelte:348-354` uses `opacity: var(--card-reveal)`, so its control keeps its room the way the card controls do now. `src/lib/views/system/` is not on the write list (only `RailEditor.svelte` is). The change makes no sentence false. After item 39 this card control is the only one still keeping its room, so the builder has to decide whether it is in scope. `History.svelte:317` and `Jobs.svelte:133` ("They stay in the layout and in the tab order while clear") are not card controls and stay true.
- `no_schedule` (item 28): `src/lib/state/system/machine/schedules/schedule.svelte.ts:358-371` (`nextOfTask`) returns the tray's task text. It is outside the write list (`src/lib/state/system/` is not listed). It is not made false, but item 28 may lead there.
- The pdf.js stylesheet (item 13, "pdf.js's stylesheet is scoped to the PDF viewer"): it is imported at `src/lib/views/sources/file/pdf/viewer.svelte.ts:51`, with `viewer.css:2` beside it. `src/lib/views/sources/file/` is not on the write list, which names only `views/sources/files/`, `data/`, `venues/` and `source/`. Item 13 cannot be built without a change there.
- Files follow mode (item 15): `src/lib/state/sources/explorer/follow.ts` and `sections/followed-tab.ts` (from `grep -rln -i follow src/lib/state/sources/explorer`). They are outside the write list, and item 15 may lead there.
- `career_panel_html`: `tools/cockpit/src/cockpit/render/focus.py:18,267`. Outside the step; O38 deletes it. Nothing is made false.
- The status words (item 2): `tests/checks/source/keys.test.ts:8,292-295` and `ChangeRow.svelte:34,156`, both on the write list. A new `status_*` key needs its reader under G24.
- `DEFAULT_BOUNDS` (item 7): `forces.ts:24,68,114,129,147`, `layout.ts:18,166`, `pointer.ts:11,25-28`. All on the write list.
- Other hits, all on the write list:
  - `syncTypesOnce`: `tests/tiers/quick.mjs:250`
  - `paintCode`: `Editor.svelte:268`, `DiffEditor.svelte:264`
  - `read_again`: `Failed.svelte:40`
  - `SEGMENTS` and `READ_CAP`: `memories.ts:69`
- Names with no hit outside their own file: `placementKey`, `markPanel`, `armKept`, `SESSION_VIEWS`, `class="dialog"`, `merge_left`, `merge_complete_confirm`, `rail_empty`, `WRITES_PREFIX`, `seedConfig`, "Lit Watch radar" in `catalog.yaml:63`.
- The twenty fixture names: each is in one file only (`grep -rlw`), all in the start patch's files.
- Sentences the change makes false, all on the write list: `DESIGN.md:718` ("the controls stay in the layout, transparent until the card is hovered"), the `Modal.svelte:185-186` comment on the scrim, `WorkspacePicker.svelte:2-5` ("by the last segment of its folder"), the `terminal-list.ts:187-191` comment ("Focus leaving the list disarms it as well"), and the `look.ts:35` comment ("a second pick of the same theme changes neither").

Start patch against the write list. `grep '^diff --git' O37-start.patch` lists 171 files. Every file is inside the write list except `tools/data/README.md` and `tools/deposit/deposit.py`, which decision 2 leaves out.

## The step line

Mapping of plan.md:512 and its Step 0 bullets (plan.md:513-557) to "What to build":

- "the start": item 42, plus "Where you work" bullet 3.
- "no diagnosis": the "No diagnosis" section.
- Defects 1-21: items 1-21.
- Defect 22: item 22.
- Defect 23: given to the orchestrator in "What is on the tree" line 49 and case 22. It has no item, which is correct.
- Defects 24-42: items 23-41.

Missing:
- **The looks.** The step line's "every look of `agents/reviews/owed-looks.md` 'To take' taken and recorded at its landing" and Step 0's "the looks" ("every defect above is looked at once fixed; the desktop app looks included") have no item or sentence anywhere in the body. `grep -n owed O37.md` hits only the title (line 1). The brief does not say these are the orchestrator's at landing, as it does for defect 23. It also does not ask the report for a look per defect: only cases marked "the look" get one. Defects 5, 12, 14, 16, 17, 25, 33, 35, 38 and 39 have no look row, yet Step 0 asks for every defect to be looked at.

Parts with no requirement behind them:
- Item 13's "pdf.js's stylesheet is scoped to the PDF viewer" and the `--scrim` token. Defect 13 asks only that the collision end and the page show.
- The hub `registries/{venues,pillars,domains}.yml` "head comments" on the write list (line 183). Defect 31 speaks of oculus's catalogue intros. The start patch rewrites `venues.yml`'s head comment (lines 1-4).
- Item 6's "no node sits on the box's walls" is in the defect, so it is covered.

## Premises

Each rerun on main c3cb498e2:

- `git diff --stat bda7b0346 c3cb498e2 -- tools/oculus`: prints nothing. Holds. The five hub files changed are `education.yml`, `funding.yml`, `eeg-saad-challenge/project.yml`, `registries/career.yml` and `side-projects/research-hub/project.yml`.
- `git apply --check --cached .../O37-start.patch`: rc=0. `grep -c '^diff --git'`: 171. Holds.
- Defect 1: `repositories.yml:120,135`, `Merge.svelte:183`. Holds.
- Defect 2: `STATUS_WORDS` is at 660 and the fallback at 692. The `typechange` grep has rc=1. Holds.
- Defect 3: `MergeSide.svelte:139` `.bar {` (display flex, gap 4px). Holds.
- Defect 4: `choices.ts:25`, `GlyphList.svelte:38`. Holds.
- Defect 5: `layout.ts:223-229`, edges at 227. Holds.
- Defect 6: `labels.ts:1-10`. Holds.
- Defect 7: `Graph.svelte:311`, `graph.ts:69`. Holds.
- Defect 8: the nine names each give 1. Triage item 8 is at `O37-start-lanes.md:38`. Holds.
- Defects 9-15: `Toolbar.svelte:89`, `TerminalList.svelte:394`, `TreeActions.svelte:28`, `builds.ts:821`, `Modal.svelte:187-191`, `ScheduleDialog.svelte:54`, `pdf_viewer.css:418 .dialog {`, `look.ts` comment at 35, `selection.svelte.ts:41`. All hold.
- Defect 16: `storage.ts:43-47` holds `WRITES_PREFIX` at 47. Holds.
- Defect 17: `vite.config.ts:84` `if ('__vitest__' in server.environments && existsSync(synced)) return;`. Holds.
- Defect 18: `images.ts:83`, `:270`, `memories.ts:69`. Holds.
- Defect 19: `files.yml:188 read_again: read again`. Holds.
- Defect 20: partly off. `WorkspacePicker.svelte:2-5` holds. But `armKept` is at `terminal-list.ts:192`, and its comment is at 187-191, not 184-190. `composer.ts:10-12,52-57` holds `split` and `worktree`.
- Defect 21: holds, by a mechanism the brief does not name. The render is `@viz-js/viz` (WASM), per `utils/diagrams/diagrams.mjs:25`. A label measured with it gives the same box width for `Helvetica,Arial,sans-serif` as for `Times-Roman` (166.55) and a different one for `Helvetica` or `Arial` (167.63). The command was `node --input-type=module -e "...viz.renderString(...)"`. The system `dot` resolves the same name to "Helvetica 14" through Pango, so the defect lives only in the WASM path.
- Defect 22: `socket.svelte.ts:397-403`, `+page.svelte:120`; `grep -n socket.svelte agents/guarded.md` rc=1. Holds. The claim "a bad seed shows as a view that does not draw until the next push or a reload" is not verified. The function's own comment (`:389-395`) says the subscribe push carries the page's configuration instead.
- Defect 23: `awk 'length > 400' plan.md | wc -l` gives 694, both on the working copy and on HEAD. Holds.
- Defect 25: the three files carry `@module-tag slow` (git-ops:7, config-key:7, detached:6). `quick.mjs:1-2` holds. Holds.
- Defects 26 and 29: `workbench.yml:81`, `RailEditor.svelte:126`, `app.yml:279`. Hold.
- Defect 31: `venues.yml:15`, `pillars.yml:7,18`, `domains.yml:5`, `normalise.ts:549`, `Collection.svelte:370-371`. Holds. `grep -ln '^intro:'` lists 7 files: boilerplate, data, literature, funding, education, events, joint-work.
- Defect 32: `CommandCenterView.svelte:188-205`. Holds.
- Defect 34: `SessionWorkspace.svelte:227`. Holds.
- Defect 37: `pillars.yml:55`. Holds.
- Defect 38: `card.ts:21`. Holds.
- Defect 40: `CardActions.svelte:209`, `DESIGN.md:718`. Holds.
- Defect 41: does not hold as worded. `catalog.yaml:63` holds. But `career.yml:1` reads `# Career strategy - rendered as the Focus "Career strategy" panel (build.py career_panel_html).` It names the cockpit's `build.py`, not the word "cockpit": `grep -n -i cockpit ../skills/catalog.yaml ../../registries/career.yml` hits only `catalog.yaml:63`.
- Defect 42: `Q89-landing.md:29-31` and `O33-report.md` exist. Holds.
- Line 5, `ls docs/adr tools/oculus/docs/adr`: both "No such file or directory". Holds.
- Line 15 points to a section "The patch as applied" below. No such section exists (`grep -n '^## ' O37.md` lists none), so it is a dangling reference.

## Cases and checks

Inconsistent with spec.md:

1. Line 109 says "under 1000 lines". spec.md:46 says 880 lines, and 520 for a component (G20, `size.test.ts:28-29`).
2. Line 214 ("`git status`, `git diff` and `git show` are fine") and case 40 (`git diff -- registries/career.yml`) clash with spec.md:32: a builder runs no git command, read-only ones included.
3. Verify item 2's `LC_ALL=C grep -rna --exclude=glyphs.yml '[^ -~]' src tests bin config utils docs` breaks two rules.
   - It is not the gate spec.md:100 names. The spec's perl gate allows accented letters under `config/` and holds `glyphs.yml` to it, and the spec says that form replaces the grep form in any brief.
   - It already fails on main. `/usr/bin/grep` prints `config/catalogs/unimath.yml` (bytes `c3 bc`, an u-umlaut on line 1, allowed by the spec). The spec's perl gate prints nothing on main.
   - `bin` does not exist.
4. Line 7 ("every line is written to the standards pages") and verify item 7 ("read against the standards pages' rules on list items and sentence length") point at pages that do not exist. `.agents/plan.yaml:8` has `standards: []`, and the brief's own line 5 says so.
5. Line 188 lets a run be "a command in ... the browser console". spec.md:63 says a builder runs no page.
6. Case 17 asks for two whole-suite `npx vitest run`, and case 24 for two concurrent `npm run test:quick` (on the base copy and again after). spec.md:25 counts a whole-suite command, or a run of the list beyond the one it allows, as a finding.
7. Case 35 is a kept test of a test-only view. `guarded.md:3` says views have no entry, and no entry names `TabView.svelte` (grep count 0). spec.md:58 requires a stop before such a test. Svelte 5.57.1 does have a server-side boundary (`node_modules/svelte/src/internal/server/renderer.js:329-399`). Whether the unit suite's render shows the failed snippet is not verified.
8. Cases that need a DOM but are not marked "the look": 9 ("a run"), 14 (the editor repaints), 16 (the record of writes lives in browser storage), 20 (the Kill part), 25 ("records every text the RailEditor draws during the read"), 34 (press to menu, timed) and 38 (a press inside a PDF iframe). spec.md:63-64 sends these to the look.
9. Verify item 1, "A failed command is rerun alone, then the full list once more", drops spec.md:25's clause that a red line in a file the step does not change gets no rerun of the list.
10. The report path `tools/oculus/.scratch/migration/agents/reviews/O37-report.md` clashes with spec.md:35 ("You never edit anything under `tools/oculus/.scratch/`"). This is the established practice (`O33-report.md` exists), but it is a literal clash with the rules file.

Cases that ask the builder to check, quote or explain a place the step does not change:
- The Report asks for "The open items of the state file, verbatim". `orchestrator-state.md` is not on the Read list (spec.md:8 says read only listed files) and the step does not change it.
- Case 22 (`plan.md`) is assigned to the orchestrator, so it is fine.
- Verify item 2's comparison with "the base's" `registries/*.yml` and `../skills/catalog.yaml`, and case 40's one-changed-line check, need a base of hub files. The base copy holds only `tools/oculus`, and the builder runs no git.

## The question

The question asked of each check: could it pass without the goal (every defect of O33's phase A ended at its cause, nothing missed)?

Yes, it could, for these:
- **Item 8 and case 8.** `sh utils/unused-exports.sh` runs `knip --production` (`utils/unused-exports.sh:21`), which never reads `tests/`. On main it printed 355 lines, 0 starting with `tests/` and none of the twenty names, while all twenty are still unused or exported. The check passes untouched. The real check is `grep -rnw <name> src tests` per name.
- **Case 40 for career.yml.** `grep -i cockpit` already prints nothing for `career.yml`, whose line 1 names `build.py career_panel_html`.
- **Item 1.** It is limited to the merge editor. The same cause, a count with no one form, stays in `repositories.yml:148` (`merging: ... {0} files are in conflict.`), `:164` (`rebasing`) and `:266` (`cherry_picking`), plus `:87`, `:110` and `:184`.
- **Case 16.** Its ten writes (split, move, close) include no reload. The drop's trigger is unknown (Q99-look-2), so the case can pass with the cause untouched.
- **Case 17.** It covers two vitest runs only. Item 17's second half (a sync or build while a run reads) has no case.
- **Case 20.** It tests a focus move inside the list. The defect (and Q89-landing.md:30) is focus leaving the list, into the grid.
- **Case 24.** `test:quick` runs only the essential tier plus tests that import changed files. Of the named tests only `tests/server/edit/config-value.test.ts` is in `essential.txt:17`, so "each named test passes" is not measured, and the landing's load is not reproduced. Tagging a test slow also satisfies item 24 while removing it from `npm test` and `test:checks`.
- **Item 34 and case 34.** The timing has no bound, and caching the settings shortens the server answer while the menu may still wait on the round trip. Decision 6 ("through the server's existing file watcher") contradicts the start patch, which keeps the stamp-per-request cache in `config-cache.ts` and adds `hub` and `defaults`. A watcher would also break G61 ("read by the next request").
- **Case 5.** If the run reads only `placementKey`, it can pass while `Graph.svelte` restarts the simulation for another reason.
- **Case 15.** It omits the Session and Timeline tabs that item 15 names.
- **Case 4.** It checks rice against dark only, while item 4 says every theme.

No, for these, because the case states the exact outcome: items 2, 9, 12, 18, 19, 22, 37 and 40 (for `catalog.yaml`).

Items marked "the look" cannot be judged until the look: 3, 6, 7, 10, 11, 13, 15, 21, 23, 26-31, 33, 36 and 39.

The step line's check, the looks, has no check in the brief at all.

## Implied inputs

Missing from "Cases", each with its expected result:

- Map (items 5 and 7):
  - A pane resized after placement: nodes keep their places, no fresh placement.
  - A link removed, or a node removed: the other nodes stay put.
- Item 15:
  - The session or file a tab showed is gone at reload: an empty state, no error.
  - A saved record without the new key: shows none, with no migration code.
- Item 16: a reload before the terminal channel answers: the tab is kept.
- Item 20:
  - A folder whose last segment equals the hub's name: labels differ.
  - Two hubs of one name: labels differ.
  - A pointer-armed Kill, then focus to the grid: it stays armed.
- Item 12:
  - Two saves before the settings arrive: one build.
  - `autoBuild` off when they arrive: no build.
- Item 14: the second pick fails again: no repaint, no error, and a third pick tries again.
- Item 18:
  - A PNG with many chunks and no eXIf: the listing ends within a stated bound.
  - A JPEG with a zero-length or overrunning segment: it ends, no turn.
- Item 17: a run killed mid-sync: the next run proceeds and the types are whole.
- Items 30 and 36, under G5 (`guarded.md:19-21` names `src/lib/ui/html.ts`, which the step writes):
  - An intro or a blurb holding a handler: the handler is dropped.
  - Card text with two `$` prices: shown as text.
  - An invalid formula: text, and the card still draws.
- Item 35:
  - An error whose message holds markup: drawn as text.
  - A view that throws again after Reload: the message again, no loop.
- Item 37: a page with both a Transcript tab and a session-detail tab: which one the pick opens.
- Item 38: a press inside a sandboxed app frame: Kill disarmed.
- Item 2: a staged type change. Its Stage and Discard act on the whole path, a row under G33 (`guarded.md:83-85`).
- Item 4: a glyph with no words line: what the row shows.
- Item 10: the list hidden at 100 px: the terminals stay reachable.
- Item 34 under G61: a settings file written, then the menu opened at once: the entries reflect the write.
- Item 24 names `config-value.test.ts`, but two files exist: `tests/routes/edit/` and `tests/server/edit/`.
- The cases' first run on the base copy: the base copy has no `node_modules` (brief line 14), so no test or `unused-exports.sh` runs there. The brief does not say how.
- Guarded entries the step's code touches are not named: G5 (`html.ts`), G29 (`layout/saved/`), G33 (`git/parse.ts`), G35 (pty `routes.ts`, `sessions.ts`), G40 (`stores/turns.ts`), G61 (`config-cache.ts`), and G13 and G32 (`data/index.ts`, `data/model/`). Their tests must run under spec.md:58. Only the `images.ts` entry is asked about, and it does not exist (`grep -c images.ts guarded.md` gives 0).

## ADRs

`ls docs/adr tools/oculus/docs/adr`: both "No such file or directory". No `NNNN-*.md` record exists, and the step touches none.

## Dictated text

Each was found with `grep -n` in O37.md.

- Item 1 and case 1 (lines 66 and 115): "1 conflict left", "2 conflicts left", "1 conflict is still open", "2 conflicts are still open", "1 conflict is still open. Complete the merge anyway?". Hold.
- Item 2 and case 2 (lines 67 and 116): "type changed". Holds, and it matches the lower-case words at `repositories.yml:206-212`.
- Item 3 (line 68): "Accept Current | Accept Incoming | Accept Both | Ignore". Holds against the prose rules. It is ambiguous: the catalogue has two "Accept Both" lines, `accept_both_current` (repositories.yml:9) and `accept_both_incoming` (:28), and the item does not say which.
- Item 13 and decision 4 (lines 78 and 195): `--scrim`. Holds.
- Item 19 and case 19 (lines 84 and 133): "Read again". Holds, and it matches `source.yml:183` and `file.yml:51`.
- Item 25 and case 25 (lines 90 and 139): "The rail has no button". Holds (existing text).
- Item 28 (line 93): "2026-10-11 | No schedule". Holds as an example. Its " | " contradicts "drawn as two cells", so it is not literal text.
- Case 29 (line 143): "exit 1". Holds.
- Case 35 (line 149): "Reload". Holds.
- Item 37 (line 102): `SESSION_VIEWS` holds `transcript`. Holds.
- `LC_ALL=C /usr/bin/grep -n '[^ -~]' O37.md` prints nothing.

## Declined to judge

- What VS Code does: the type-change colour, the merge code lens words, the scrim value, the terminal tabs list's hiding width, the SCM row actions. VS Code's source was not read.
- Whether the default `transformError` lets the failed snippet render in the unit suite's render. Only the renderer code was read, nothing was run.
- The correctness of each start-patch hunk beyond its path and the `config-cache.ts` hunk. That is the builder's item 42.
- Whether defect 22's "costs nothing" holds on a running page. No page was run.
- Whether "the hub folders the configuration names" in the sparse worktree is right. That is not a premise of "What is on the tree".

Usage: a61a42227a685cb6c, claude-opus-5-5, 229798 tokens, 66 tool uses, 10.8 min.

## Closed

Each finding of the report, with the change to `agents/briefs/O37.md` that closes it.

- Names, `--card-reveal` in `Usage.svelte:348-354`: item 39 and case 39 cover the Usage card control; `src/lib/views/system/machine/usage/Usage.svelte` added to the paths.
- Names, `nextOfTask` in `schedule.svelte.ts`: named under defect 29; `src/lib/state/system/machine/schedules/` added to the paths.
- Names, pdf.js imported at `views/sources/file/pdf/viewer.svelte.ts:51`: named under defect 13; item 13 says the stylesheet reaches only `views/sources/file/pdf/`; that folder added to the paths.
- Names, the Files follow mode in `state/sources/explorer/`: named under defect 15; the folder added to the paths.
- Names, `career_panel_html` in `tools/cockpit`: outside the step, O38's; no change.
- Names, the status words and G24: named under defect 2 and in the guarded entries' list.
- Names, the sentences made false (`DESIGN.md:718`, `Modal.svelte:185-186`, `WorkspacePicker.svelte:2-5`, `terminal-list.ts:187-191`, `look.ts:35`): each named under its defect; all on the paths; the rule that a sentence made false is rewritten is spec.md's.
- The step line, the looks: item 43 makes the looks the orchestrator's at landing and asks the report for a look or a proving run per item 1 to 40; case lines now mark every look.
- The step line, item 13's scoping and `--scrim`: kept, sourced to defect 13 (the scoping ends the collision at its cause; the token is decision 4).
- The step line, the hub head comments: limited to `venues.yml`'s head comment, which names `build.py` (defect 41), now under defect 41 and item 40.
- Premises, defect 20's line numbers: corrected to `terminal-list.ts:192` with the comment at `:187-191`, and `composer.ts:10-12,52-57`.
- Premises, defect 21's mechanism: rewritten to the `@viz-js/viz` measurement the check found.
- Premises, defect 22's claim: rewritten from the function's own comment (`:389-395`): a seed not held is replaced by the subscribe push.
- Premises, defect 41's `career.yml:1` names `build.py`, not "cockpit": premise and item 40 and case 40 now check `cockpit\|build.py`.
- Premises, "The patch as applied" dangling: the brief now says /spec adds that section once the worktree is made (the spec skill's Steps 7).
- Cases and checks 1, the size limit: 880 and 520 (G20).
- Cases and checks 2, git commands: the Conventions say no git command, read-only ones included (spec.md:32); case 40 uses `diff` against the base copy's `hub/` copies.
- Cases and checks 3, the ASCII gate: replaced by spec.md:100's perl gate (it prints nothing on main over `src tests config utils docs`); `bin` dropped.
- Cases and checks 4, standards pages: line 7 and verify 7 now point at the rules file.
- Cases and checks 5, the browser console: removed; a run is a one-file `npx vitest run` or a quoted `node -e`, never a page.
- Cases and checks 6, cases 17 and 24: case 17 now runs one small test file per process on a scratch copy; case 24 runs each named file alone and `test:quick` once at the end; the load is the landing gate's.
- Cases and checks 7, case 35: no test (no guarded entry covers a view); checked by reading and the look.
- Cases and checks 8, DOM cases: 9, 14, 16, 20 (Kill), 25, 34 and 38 are marked the look.
- Cases and checks 9, the rerun clause: verify 1 carries spec.md:25's clause for a red line in a file the step does not change.
- Cases and checks 10, the report path: the brief says the report is the one file under `.scratch/` the builder writes.
- Cases asking for an unchanged place: `orchestrator-state.md`'s Open items added to the Read list; the base copy now holds `hub/` copies of the five hub files for verify 2 and case 40.
- The question, item 8: the check is now `grep -rnw <name> src tests` per name (case 8, verify 3); premise records that knip reads no test.
- The question, case 40: now greps `cockpit\|build.py`.
- The question, item 1: widened to the same cause at `repositories.yml:87,110,148,164,184,266`.
- The question, case 16: a reload and a reload before the channel answers added.
- The question, case 17: the sync-while-reading and killed-sync inputs added.
- The question, case 20: focus to the grid.
- The question, case 24: each named file run alone with its time; tagging slow only where spec.md's test rule allows.
- The question, item 34: the menu needs no request at the press; decision 6 rewritten to the stamp cache `config-cache.ts` already uses, G61 kept.
- The question, case 5: positions read from the drawn graph at the look.
- The question, case 15: Session and Timeline added.
- The question, case 4: every theme.
- Implied inputs: added to items and cases: the Map's resize and removals (item 5, case 5); item 15's gone session and old record; item 16's early reload; item 20's hub-name and two-hub labels and focus to the grid; item 12's two saves and auto-build off; item 14's repeat failure; item 18's bounds; item 17's killed sync; items 30 and 36 under G5 (handler dropped, prices, invalid formula); item 35's markup and repeat throw; item 37's two tabs (decision 7); item 38's app frame; item 2's staged type change under G33; item 4's glyph with no words; item 10's terminals reachable when the list hides; item 34 under G61; both `config-value.test.ts` named; the base copy gets a `node_modules` link for first runs; the guarded entries G5, G13, G20, G24, G29, G32, G33, G35, G40 and G61 named, with verify 4 running their tests.
- Dictated text, item 3's words: no longer dictated; the choices keep the catalogue's existing words.
- Dictated text, item 28's "2026-10-11 | No schedule": removed; item 28 says separate cells.
