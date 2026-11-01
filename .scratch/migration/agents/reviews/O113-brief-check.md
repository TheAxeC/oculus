# Step O113 brief check (on main at 4f76fdcce)

Base: `git rev-parse HEAD` printed 4f76fdcce0ed03a0623688d1e85bb9c1e3f74447, the commit the brief says it read. Goal used: `plan.md` has no Goal section (`grep -n "^#" plan.md` printed Steps, Could run in parallel, Rulings, Agents, Blocked). I read the goal as the step line at plan.md:1599 with the ruling at plan.md:3390, "Timeline a section with its tab removed".

Findings that must be closed before the builder starts: 3.1, 4.1, 4.2, 1.1, 1.2, 1.3.

## 1. Names

Command for every view-name row: `grep -rnIi "timeline" src tests config docs README.md CLAUDE.md`, plus `grep -rnE "['\"\`]timeline['\"\`]"` over the same folders with `--exclude=local.yml`. Also `grep -n -i timeline .scratch/ROADMAP.md .scratch/migration/parity.md`. `.agents` and `AGENTS.md` have no hit outside the worktrees.

- View id and `timeline/Timeline.svelte`. Hits outside the paths:
  - `src/routes/views.ts:69`: `import.meta.glob('$lib/views/**/*.svelte', { eager: true })`. No name, so deleting the folder deregisters the view. Not false.
  - `tests/checks/config/config-folder.test.ts:328`: `'views/sessions/timeline.yml'`. The file stays. Not false.
  - `README.md:25,37`: "with its terminal, transcript, timeline and changes". The page still shows a timeline. Not false.
  - `src/lib/state/sessions/folds.ts:4,194,195,202,205`, `src/lib/state/shared/words/format.ts:94`, `src/lib/server/sessions/record.ts:29,31`, `src/lib/server/sessions/fold.ts:335`, `src/lib/server/sessions/stores/turns.ts:4`, `src/lib/data/model/model-sessions.ts:49,169`: all name the record's field or a timeline in general. Not false.
  - `.scratch/ROADMAP.md:51`: "- [x] Timeline view: prompts, tools, edits, turn durations and cache busts...". False once the view goes. A builder may not edit `.scratch`, so this is the orchestrator's.
  - The Files view hits (`tab-menu.ts`, `row-menu.ts`, `show.ts`, `reveal.ts`, `files-view.ts`, `section-state.ts`, `Sections.svelte`, `Timeline.svelte` there, `files.yml`, `HELP.md:148,224,384`) and Venues hits are other things. Not false.
- Keys `view_timeline`, `timeline_bar`, `timeline_glyph`: `grep -rnE "view_timeline|timeline_bar|timeline_glyph" src tests config docs --exclude=local.yml`. All hits are in `Timeline.svelte`, `SessionDetail.svelte:102-103` and `timeline.yml`. No hit outside the paths.
- `section_timeline`, `TimelineTurns`: 0 hits now. Empty, no collision.
- Glyph `timing`: `grep -rnE "\btiming\b" config src/lib/ui src/lib/views tests docs --exclude=local.yml`:
  - `src/lib/views/shared/card/record/registry/VenueCard.svelte:225: venue.timing ? { label: venue.timing, glyph: 'timing' } : null`
  - `src/lib/views/sources/venues/Ribbon.svelte:53: <Glyph name="timing" />`
  - The change does not touch these two, and they keep the glyph in use.
- `SECTIONS`, `SectionId`: only `session-sections.ts`, `SessionSection.svelte`, `SessionDetail.svelte`. No hit outside the paths.
- A sentence about the sections that holds no name of the view: `grep -rnE -i "three sections|details.*changes.*agents" src tests docs config README.md --exclude=local.yml`:
  - `docs/HELP.md:343: - **Session.** Details, Changes (the git state of the session's folder) and Agents (its subagents).`
  - The file is in the paths, but the line is neither named by the brief nor found by a grep for "timeline".
- Generated files: `docs/diagrams/layer-views.dot:33-36` holds `"folder views/sessions to folder views/shared" [label="24"...]`, `to layer state` `122` and `to layer ui` `90`. These are runtime import counts (`utils/diagrams/graphs.mjs:80-95`). Dropping `Timeline.svelte` for a body with no Pane, Toolbar, PickSession or SessionPicker lowers them (a judgment from the imports; a run decides the exact numbers). `tests/checks/diagrams/diagrams.test.ts:84-85` fails on a stale file. `git log -1 --stat -- docs/diagrams/layer-views.dot` shows Land O111 changed that file.

Findings:
- 1.1 Item 7 and the two paths `config/catalogs/glyphs.yml`, `config/catalogs/icons.yml`: the condition is already answerable and false, because `VenueCard.svelte:225` and `Ribbon.svelte:53` keep `timing`. Item 7 builds nothing. It and the two paths can leave the brief.
- 1.2 `docs/HELP.md:343` becomes false (it lists three sections) and item 11's "found by grep" does not reach it. Item 11 should name it. No widening: the file is in the paths.
- 1.3 `docs/diagrams/layer-views.dot` and `.svg`, and possibly `layers.dot` and `.svg`, are rewritten by Verify 1's `npm run diagrams` and are not in "Paths this step writes", which says "nothing else". The fix widens the paths with generated files only, and is named as such under the ruling Brief check scope.
- 1.4 `.scratch/ROADMAP.md:51` becomes false. It is outside any builder's reach, so it needs an orchestrator line at landing.

## 2. The step line

- "a fourth section after Changes in `session-sections.ts`": items 1, 4.
- "shows the picked session's turns as the Timeline view does": items 2, 3, 4.
- "the Timeline view and its tab go": items 4 (button), 5, 8, 9, 10.
- "with every mention of them": items 6, 7, 11 and the head comments of 4 and 10.
- "every layout that names it is changed once on the data": no item of "What to build". `config/defaults/layout.yml` is item 8. The saved layout is a line of "What is on the tree", given to the orchestrator at landing.
- "with no code that reads the old form": the line "No code handles a saved `timeline` tab." and the last case.

Findings: 2.1 The saved-layout part has no requirement in "What to build". By the spec's No migration code rule it is the orchestrator's, so this is correct in kind, but the brief's account of that data is short (3.1). No part of the line is otherwise unserved.

## 3. Premises

- `session-sections.ts:12` SECTIONS: `grep -n SECTIONS` printed `12:const SECTIONS = ['details', 'changes', 'agents'] as const;`. Matches. `sectionOrder` lines 28-31 match.
- No saved `sections` key: a python count of `"sections"` printed 0 in `layouts.json` and 0 in `views.json`. Matches. The 28 bare `sections` substrings in `views.json` are in document text (four contexts printed). The one saved `session-detail` tab holds keys `shown`, `closed` with `closed: []`.
- `SessionDetail.svelte` `{#if}` chain, `{:else}` Agents, button lines 100-105, comments lines 2-3 and 26-27: read. Matches.
- `Timeline.svelte` only file, order 3, `timelineTurns`, self-scrolling column, foot rule: read, `ls` printed one file. Matches.
- `SessionSection.svelte` unmounts on close, `li` role none: read its head comment and `TreeSection.svelte:89-90`. Matches. `AgentRows.svelte:128` and `DetailsBody.svelte:194` show the pattern.
- `record.ts:29` cap: `export const MAX_TIMELINE = 200;`. Matches.
- Places naming the view: `layout.yml:64`, `card.ts:59`, `SessionList.svelte:32,241`, `selection.svelte.ts:6,11`, `HELP.md:246,249`, `palette.md:44`: each printed as stated. `HELP.md:343` is missing from the list (1.2).
- `timeline.yml` and its siblings: `section_changes` at `changes.yml:116`, `section_agents` at `agents.yml:17`, `config-folder.test.ts:328`. Matches.
- Files view names: all present and separate. Matches.
- `docs/adr`: `ls docs/adr` printed No such file or directory. Matches.
- Stored data: a python walk of `~/.oculus/layouts.json` printed two hits for `timeline` under `<workspace file>/envelope/pages/8`:
  - `.../workbench/root/children/0/children/1/children/1/tabs/1/view = "timeline"`
  - `.../views/3 = timeline`
  - The tab id `4724165d-127e-4464-a4a5-8ec7e4dc72aa` occurs twice in the file, in `tabs` and in the pane's `recent` list. The pane reads `active: b169604f...` (the Transcript), so the active tab is not the one going.
  - `views.json`: 0 hits for that id and 0 for `"timeline"`.
  - The hub: no hit from `grep -rIln -E 'view: *timeline|"timeline"' .oculus` in the hub. Matches "No hub file does".
  - `layout-writes.json` has 500 `timeline` substrings, in entries such as `<id>:timeline`. It is the record of writes, "no page reads it" (`page-state/files.ts:97`). Not a layout.
- `registry.ts:245` unknown view: the text is at that line. By reading, `strip-tab.ts:45` gives the tab the words `Unknown view: timeline` (`ui.yml:142`) and `PaneBody.svelte:328-331` draws nothing in the body. Matches.

Findings:
- 3.1 "one saved tab names the view" is short. `layouts.json` names it in three places on the Sessions page: the tab, the page's `views` list at index 3, and the tab's id in the pane's `recent`. The step line says every layout that names it changes once. The data change must clear all three, so the premise should say so. `saved/views.ts:41-48` shows a stale `views` entry is harmless to a page, but it stays a record naming the view.
- 3.2 The Report section asks for "the terms of `docs/glossary.md`". `ls docs/glossary.md` printed No such file, and `.agents/plan.yaml` has no glossary key. The line has nothing to report on and can say so or go. The template carries the same line.
- 3.3 `spec.md` "Where you work" and "The principles" say the brief names a base copy, and the base's `unused-exports` lines. `grep -n -iE "worktree|base copy|unused-exports"` finds no such naming in O113, O112 or O111, and neither `spec/SKILL.md` nor `plan-orchestration/SKILL.md` holds the words "base copy". Whether the builder prompt carries it is not visible from here.

## 4. Cases and checks

Rules file: `agents/spec.md`.

- Session with events, section order and count: consistent in intent. Its "A run the report quotes" meets 4.1.
- Same turns, tags, clocks as the view on the unchanged tree: same.
- No events, head 0: consistent. `TreeItem.svelte:245` draws a count of 0 (`{#if count !== undefined}`).
- No session picked: consistent. The branch at `SessionDetail.svelte:123-124` is not changed.
- Close and reopen: consistent with `sectionToggled` and the unmount.
- Drag and Alt keys: consistent.
- Reading upward, at the foot: consistent; page only.
- More events than the box holds: consistent. `Pane.svelte:222,237` scrolls.
- Folder-limited pick: consistent.
- Palette, grep, Files section: broken, see 4.2 and 4.3.
- Fresh layout: consistent.
- Saved `timeline` tab: consistent with the spec's No migration code rule and the ruling at plan.md:1645.

Findings:
- 4.1 Clash with `agents/spec.md`, "What every package obeys". The brief says "Every other case is checked by a run the report quotes, on a scratch server" and gives a Conventions line for a scratch server on port 8801. The rule says: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says", and a behaviour that needs a DOM is seen at the look on landing. `spec.md` line 3 says nothing in a brief overrides it. Nearly every case is page-only, so the builder's "first run of every case" cannot be done as written. `O112-report.md` lines 3 and 9 record the same clash on the last step. Fix inside the step: each page-only case is checked by reading and by a case-run program, with its proof the look on landing, naming the view, the state and what should be seen.
- 4.2 The case's grep contradicts items 1 and 4. `grep -rn "'timeline'" src/lib/views/sessions src/lib/views/shared/card config/defaults` "finds nothing" cannot hold, because item 1 puts `'timeline'` in `SECTIONS` in `src/lib/views/sessions/session-detail/session-sections.ts` and item 4's branch adds `id === 'timeline'` in `SessionDetail.svelte`. It also misses what it is meant to catch in `config/defaults`, since `layout.yml:64` is the unquoted `{ view: timeline, pinned: true }`. Under the brief's own rule this case would stop the builder. It needs a grep for the view's uses (`pin('timeline')`, `openView('timeline'`, `id: 'timeline'`, `view: timeline`) that excludes the section id.
- 4.3 Asks about a place the step does not change: "the Files view's Timeline section still opens" (the brief itself says that section is not touched), and "No session picked: no section draws" (the branch at `SessionDetail.svelte:123-124` is unchanged, though the file changes).
- 4.4 Verify item 2 names the `grep '[^ -~]'` form. The spec's last section says the perl gate "replaces the `grep '[^ -~]'` form wherever a brief or a check names it".

## 5. The question

"The goal" is: the picked session's turns read in the Session view as the Timeline view read them, and no Timeline view or tab left.

Cases:
- Order and count: no for the order. For the count see 6.1.
- Same turns, tags, clocks: yes. It names neither tooltips, tones nor row words, so a lost `tip()` or a path drawn whole passes (5.1).
- No events: no.
- No session picked: yes, it is true on the unchanged tree. A guard, see 4.3.
- Close and reopen: no.
- Move: no.
- Reading upward: yes. "the box does not move" passes when no push arrives (5.2).
- Box overflow: no.
- Folder-limited pick: no.
- Palette, grep, Files section: the palette part no. The grep part cannot pass at all, and its `config/defaults` half passes with item 8 not done (4.2). The Files part yes, true on the unchanged tree.
- Fresh layout: no.
- Saved tab: no, a registered view would draw normally.

The check on the step's line: the plan line names no check; the cases are the only one.

Items of "What to build":
- 1: no.
- 2: yes, as the second case.
- 3: yes. No case reads the sizes, so rows left at `--fs-md` or clocks at `--fs-sm` pass (5.3).
- 4: yes. No working case covers the toolbar button going, since only the grep of 4.2 would have (5.4).
- 5: no.
- 6: no by reading; the spec says a test fails on an orphan key, not verified by a run here.
- 7: passes with nothing done (1.1).
- 8: no.
- 9: no, the grep over `src/lib/views/shared/card` works for that folder.
- 10: no.
- 11: yes, a grep for "timeline" leaves `HELP.md:343` false (1.2).

Findings:
- 5.1 The second case should name tooltips, tones and the row words of a turn, a bust and a path.
- 5.2 The reading-upward case needs a push to arrive in the run or the look: a line appended to a transcript under the scratch HOME.
- 5.3 Item 3's sizes have no case. Add to the look: computed sizes of a row and a clock.
- 5.4 Add to a case: a pinned Session tab's toolbar holds Transcript alone.

None of these widens the step: each states a check on something the items already require.

## 6. Implied inputs

- Session over the 200-event cap (`record.ts:29,373`): this happens on every long session, and it is missing from "Cases". See 6.1.
- A window or session whose first event comes before any prompt: `timelineTurns` makes a group with no prompt (`folds.ts:211`), and the head counts it. Under the cap this is the usual case. Missing. See 6.1.
- Another session picked while the section is open: missing. Item 2 states the rule and no case runs it. Expected: the box stands at the newest event of the new session.
- A section moved with the box scrolled: missing. `{#each order as id (id)}` is keyed, so a move relocates DOM nodes, and whether the box keeps its scrollTop is not verified. The Timeline view never moved. Expected: the box holds its place and a box at the foot still follows.
- A push while the section is closed: covered by the close-and-reopen case, since the body remounts.
- A session with no events, a terminal's record: covered by the no-events case.
- A tab that saved a `sections` order: 0 today. `sectionOrder` line 30 would draw Timeline after Agents on such a tab, so the count should be retaken at landing. A drag of a head between now and landing writes one.

Findings:
- 6.1 Decision 3 and the first case say the head counts the turns, but `record.timeline` holds the last 200 events only, so a long session's head shows the turns of that window, plus one for a group with no prompt. The session list prints the whole count from `record.prompts` (`SessionWorkspace.svelte:185-187`), so the two can disagree on screen. The brief should state which number the head draws and add the case. Adding a case is within the step. Using `record.prompts` for the count would change Decision 3, which is a choice to name.
- 6.2 The session-change case and 6.3 the section-move case above. Each adds a case inside the step's scroll rule, and neither adds a path. 6.3 may need a requirement if a run shows the offset is lost, and is then a widening to name.

## 7. ADRs

`ls docs/adr` printed `ls: docs/adr: No such file or directory`, and `.agents/plan.yaml` has no `adr` key (`grep -n "^adr"` printed nothing). No record.

Findings: none.

## 8. Dictated text

- `SECTIONS` becomes `details, changes, timeline, agents`: `grep -n "SECTIONS. becomes"` line 24. Holds.
- `max-height: 40vh`: `grep -n "max-height: 40vh"` line 26. Holds.
- `label={t('sessions.section_timeline')}`, `rows={[]}`: grep line 27. Holds. Key has 0 hits now, group `sessions`.
- `section_timeline: Timeline`: grep line 29. Holds, in the file that already declares group `sessions`.
- `openView('session-detail', pinned, page, { document: true })`: grep line 33. Holds. It has the same shape as `SessionList.svelte:240-241`.
- "One session: Details, Changes, Timeline, Agents.": grep line 34. Holds.
- `<li role="none">`: grep line 27. Holds.
- "No code handles a saved `timeline` tab.": grep line 36. Holds. This is a rule of the step, not file text.

`LC_ALL=C grep -n '[^ -~]'` over the brief printed nothing.

Findings: none.

## Declined to judge

- The exact numbers `npm run diagrams` would give, and whether `layers.dot` changes as well as `layer-views.dot`. I wrote nothing, so no run was made here.
- Whether a moved section keeps its scroll offset: only a page shows it.
- Whether the saved layout written at landing survives a page left open on the running server, which saves its own layout. Not read in full; the orchestrator's landing step.
- Whether the head should draw the turns of the window or `record.prompts` (6.1): a user-visible number for the orchestrator or Axel.
- Whether a Session tab that lost its Timeline button keeps a useful toolbar with one button, which is a design call under the ruling.
- Whether the cases that are guards should stay (4.3): the template asks for them to be named, and removing them is the session's call.

Usage: a68ed6e397026f14a, claude-opus-5-5, 200781 tokens, 22 tool uses, 475.6 s

## Closed

- 1.1: item 7 now says the glyph stays; the two catalog paths left the brief.
- 1.2: item 11 names `docs/HELP.md:343`.
- 1.3: `docs/diagrams/` added to the paths, generated files only (internal widening, no user-visible change, taken as ruling Brief check scope allows).
- 1.4 and 2.1: `.scratch/ROADMAP.md:51` and the saved layout are the orchestrator's, at landing.
- 3.1: the premise names the three places.
- 3.2: the glossary line left the report shape.
- 3.3: the builder prompt names the base copy.
- 4.1: the page cases go to the look; the Conventions no longer name a server.
- 4.2: the grep names the view's uses, not the section id.
- 4.3: the two guard cases left the list.
- 4.4: Verify 2 names the perl gate.
- 5.1 to 5.4, 6.2, 6.3: cases added, all taken at the look.
- 6.1: decision 3 says which number the head draws; a case added. Booked with the brief's decisions.
