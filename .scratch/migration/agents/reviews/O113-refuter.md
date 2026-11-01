# Step O113 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O113, base 0c02442c5)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

Result in short: every check is green. There are four findings: one new behaviour defect (Behaviour 1, the Session tab's saved state wiped by a repeat press), one scroll-rule regression (Behaviour 2, the `count === 0` guard), one stale sentence (Standards 1) and one list run beyond the allowance (Standards 2). All items hold except 11, which is violated by Standards 1. No case is unmet.

## Verification (rerun by the reviewer)

```
npm run test:quick -- src/lib/views/sessions/session-detail/TimelineTurns.svelte src/lib/views/sessions/session-detail/SessionDetail.svelte src/lib/views/sessions/session-detail/session-sections.ts src/lib/views/sessions/session-list/SessionList.svelte src/lib/views/shared/card/card.ts src/lib/state/workbench/selection.svelte.ts src/lib/views/sessions/timeline/Timeline.svelte config/text/views/sessions/timeline.yml config/defaults/layout.yml docs/HELP.md docs/palette.md
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (2.5 s)
ok      svelte-check (9.0 s): 1793565298074 COMPLETED 577 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (27.4 s): Duration  16.73s (transform 30.19s, setup 0ms, import 52.08s, tests 2.06s, environment 268ms)
ok      vitest slow (33.4 s): Duration  22.57s (transform 11.87s, setup 0ms, import 15.56s, tests 6.86s, environment 0ms)
ok      vitest checks (52.4 s): Duration  41.52s (transform 13.15s, setup 0ms, import 27.69s, tests 100.63s, environment 2ms)
test:quick: 54.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files

The 11 paths are my reading of "the 11 changed paths"; the report does not list them.

perl gate of agents/spec.md's last section, over the 14 changed text files, the deleted file left out, plus the report: prints nothing, perl exit 0

grep -rnE "pin\('timeline'\)|openView\('timeline'|id: 'timeline'|view: timeline" src config/defaults --exclude=local.yml
(prints nothing, exit 1)

git status --short: the same 16 lines before and after the rerun (14 M or D, the report, TimelineTurns.svelte untracked)

Commands the report quotes:
sed -n 165,171p .scratch/migration/orchestrator-state.md: heading and the one sentence, no entry
grep -rn -E '(^|[ ,{])h4\b' src --include='*.css': nothing, exit 1
ls src/lib/views/sessions: customization session-detail session-list terminal transcript
ls src/lib/views/sessions/session-detail | wc -l: 10
grep -rnE "view_timeline|timeline_bar|timeline_glyph" src tests config docs README.md --exclude=local.yml: nothing, exit 1
grep -rnE "view_timeline|timeline_bar|timeline_glyph|sessions/timeline/|Timeline\.svelte" src tests config docs README.md --exclude=local.yml | grep -v 'sources/files': nothing
grep -rnE "['\"]timeline['\"]" src tests config --exclude=local.yml: the two new section lines (session-sections.ts:12, SessionDetail.svelte:158), the Files view's uses, tab-menu.ts:63, row-menu.ts:102, Venues.svelte:139, a test data body
grep -n -i filter .scratch/migration/agents/spec.md: nothing, exit 1
grep -n 'section_' config/text/views/sessions/*.yml: agents, changes, details, timeline
grep -rIl -i timeline docs README.md: docs/HELP.md, README.md (the report says HELP, palette, README; no decision rests on it, the report's row states no break)
grep -rn 'data-turn' src tests: nothing, exit 1
grep -n -E 'O[0-9]{2,}|Q[0-9]{2,}|20[0-9]{2}-' TimelineTurns.svelte: nothing, exit 1
history words over added comment lines, by git diff 0c02442c5 in place of the report's diff -ru: SessionDetail.svelte "a session the pane still holds"; over the new file: :57 "no longer at the foot", :64 "still count", :144 tl_before. Each means the present state or is a key. The report does not list :57; it compares no earlier state of the code.
grep -rn 'timelineTurns' src tests: folds.ts:205, SessionDetail.svelte:36,67, TimelineTurns.svelte:18,47
sh utils/unused-exports.sh | grep on the changed files: card.ts: SESSION_VIEWS, SHOWN; folds.ts lines, none for a name this step added
wc -l: TimelineTurns 208, SessionDetail 214, session-sections 55, SessionList 453, card.ts 244, selection 114, timeline.yml 14, layout.yml 346, HELP 605, palette 205
grep -c '"sections"' ~/.oculus/layouts.json ~/.oculus/views.json: 0 and 0 (settles the report's "not verified" on a saved list of three sections)
grep -n timing: VenueCard.svelte:225 (at src/lib/views/shared/card/record/registry/), Ribbon.svelte:53
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, `session-sections.ts:12`.
- 2: holds, markup, `kindLabel`, `text`, `tip` and `TONES` match the deleted file; no Pane, bar, picker, registration or record-less state. The prop `place` goes beyond "taking the session record"; the report declares it as judgment call 1, and it is justified (see Standards, read and cleared). `events.length === 0` became `turns.length === 0`, the same answer by `folds.ts:205`.
- 3: holds, `TimelineTurns.svelte:163,199`; no font size on rows; rice rule gone. No font-size in TreeView.svelte or TreeSection.svelte, and `TreeItem.svelte`'s sizes sit on its own rows, so the words inherit `.session`.
- 4: holds, `SessionDetail.svelte:158-173`, the explicit Agents branch at :174, toolbar :94-103, head comments.
- 5: holds, `git status --short` shows the one file deleted; the folder is gone from `ls`.
- 6: holds, the grep of the three keys is empty and `catalog-file-keys.test.ts` was chosen and passed.
- 7: holds, `glyphs.yml` absent from the diff; VenueCard.svelte:225 and Ribbon.svelte:53 use it.
- 8: holds, one line gone; the pane left at `layout.yml:61-63` holds Transcript alone and is well formed; `config/defaults` names no other `timeline`.
- 9: holds, `card.ts:59`; the doc comment above it and `sessionTab`'s stay true.
- 10: holds, `SessionList.svelte:241`, head comment :32. See Behaviour 1 for what the new line does on a second press.
- 11: violated, Standards 1 (`selectors.svelte.ts:100`). The named comments, HELP rows and palette are done.
- "No code handles a saved timeline tab": holds, no such code in the diff.

Cases of the brief's "Cases":

- Sections read Details, Changes, Timeline, Agents; head counts turns: met, by reading `SECTIONS`, `{#each order}` and `count={turns.length}`.
- Same turns, tags, tones, clocks, tooltips: met, by reading against the deleted file; clock size aside, which case "Rows" takes.
- Past the 200-event cap: met, `record.ts:373` keeps the newest 200, `folds.ts:212` opens a group with `prompt: null`, `:144` reads `tl_before`, and the head counts that group. A push at the cap leaves `count` at 200, but the effect re-runs because it reads `record`, which `readAs` builds anew on each message (`entities.svelte.ts:56`).
- No events: met, `TreeItem.svelte:245` draws 0, `:133-134` draws `tl_empty`.
- Close and reopen: not verifiable for the box. The closed state in the tab is met by reading; the box is a new component with `stuck` true. Look at landing: close and reopen with the box scrolled up.
- Another session picked: not verifiable. Reading gives the foot, with the exception of Behaviour 2. Look: pick with the Session tab on top and with Files on top, and pick a session with no events then the first one again.
- Drag, Alt+Up, Alt+Down, order survives a reload: not verifiable. By reading `place` changes on every move that carries Timeline's DOM block: a walk of `each.js` reconcile shows a move that leaves `place` unchanged moves another block. Look: Alt+Down with the box at the foot and scrolled up, twice, as the report's focus note asks, then a push, then a reload.
- Push scrolled up and at the foot: not verifiable. Reading gives the rule, and `stuck` closes the several-rows miss of the deleted file's measure. Look: append several lines under the scratch HOME.
- More events than the box: not verifiable. `Pane.svelte` `.body` has `overflow: auto`; look: reach the Agents head.
- Rows at `--fs-sm`, clocks at `--fs-xs`: not verifiable, `getComputedStyle` at the look. Reading finds nothing that overrides them.
- Pinned toolbar holds Transcript alone: met, `SessionDetail.svelte:94-103`.
- Folder-limited pick: met for a first press, by reading `openInto` to `openOpened`: `landingFor`'s workbench branch lands both tabs in the pane marked `documents`, and no `timeline`. A repeat press is Behaviour 1.
- No Timeline view on offer and the grep: met, the grep is empty and `docs/palette.md` lost the row.
- Fresh layout: met, `layout.yml:61-63`.
- Saved `timeline` tab: not verifiable for the drawing, which needs a saved tab at the look. That nothing converts it is met: the diff adds no such code, and `registry.ts:243-245` states an unregistered tab draws as unknown.

## 1. Spec

none

Premises reproduced: `SECTIONS` at base, `record.ts:29` MAX_TIMELINE, the `sections` count of 0, the Files view's Timeline untouched, no `docs/adr`. Z1096's four points are in the diff. The report gives a first run for all 15 cases. `agents/guarded.md` names none of these files, so no test is owed.

## 2. Proof

none

The step adds and changes no test. Every case that needs a page rests on the look, and the report says so. `each.js:722` and the two Alt moves reproduce from my reading of `reconcile`.

## 3. Standards

1. `src/lib/state/client/selectors.svelte.ts:99-100`: "the session types the\n// six views name reach them from here"; what is wrong: `agents/spec.md` (What every package obeys, the grep after changing a name) and refute's Standards heading ask that a sentence the change touches on be carried. Report judgment call 8 calls the same count false in `selection.svelte.ts` and rewrites it there, but this twin stays. `grep -rln "group: 'sessions'" src/lib` prints four views now, five at base with Timeline; the sentence was off before and this diff moves it further; failure scenario: a reader taking the file's word looks for six session views, or counts Timeline as a view after this step removed it; verdict: item 11 violated. A one-word fix at landing (drop "six"), and the brief's write list allows a file holding such a sentence when the report names it.

2. Rules file, Token discipline, and report section "Number of full-list runs": "Runs 1 and 2 went red on one line, `tests/checks/source/comment-width.test.ts`"; what is wrong: the rule is that a red line in a changed file is fixed, that file rerun alone, then the list runs once more. A check rerun alone goes green or stays red before the list runs, so a second red on the same check means the third run is one beyond the allowance, or the rerun alone did not happen; the report's "No test was run on purpose beyond the list and comment-width" does not say which; failure scenario: about a minute of list run and no effect on the result, recorded because the rule calls it a finding; verdict: none.

Read and cleared, each a point the brief for this review named:

- `place`: justified. The rule "the box does not move for a reader" fails without it: Alt+Down moves Timeline's block by `dest.before(node)`, and the case's own text only needs `stuck`, but the box would stand at the oldest event until the next push, and a scrolled-up reader would lose the place. The input is a shipped key and the wrong answer costs the reader's place. It costs one prop and three lines. The sentence at `:27-29` states a browser fact the report calls not measured; the look at case 7 settles it.
- `useShown`: justified. `TabView.svelte` hides by `display: none`, `sessionFor` is not frozen for a hidden tab (`tab-scope.ts` wraps only query stores; it reads selection and the payload), and the default layout stacks Session with Files, so a pick while Files is on top is the ordinary path. It reuses the existing helper.
- `timelineTurns` folded twice: no finding. It is pure, over at most 200 events, per sessions message; the two reads cannot disagree; item 2 and item 4 together give this shape. The report's reason ("would break item 2's shape") sits oddly beside `place`, which departs from the same sentence, but `place` has a case behind it and the fold has only a small cost.
- `{:else if id === 'agents'}`: no finding. The brief allows it, `SectionId` is closed at four, and svelte-check is clean.
- `SESSION_VIEWS`'s comment: true.
- Effect order: on a flush that both picks a session and shows the tab, the first effect sets `stuck` before the second reads it, since they run in creation order.
- `offset` stale after a session change: harmless in every path but Behaviour 2. `offset` is read only when `stuck` is false, and `stuck` becomes false only in `scrolled`, which sets `offset` in the same call.
- `stuck` with a reader scrolled up in session A and session B arriving: `:80` sets it true before the foot is written, so B starts at the foot, in a shown or a hidden tab. The exception is a B with no events, Behaviour 2.
- Mount and closing: a close unmounts (`SessionSection.svelte:6-7`), a reopen is a fresh `stuck = true, shown = ''`. A mount in a hidden tab does nothing, then the second effect takes the box to the foot on show.

## 4. Behaviour

1. `src/lib/views/sessions/session-list/SessionList.svelte:241`: "openView('session-detail', pinned, page, { document: true });"; what is wrong: a press on a row whose pinned Session tab is already open goes through `openOpened` (`opening.ts:355-363`), which calls `restate(tree, existing.id, state)`. `restate` (`tree.ts:293`) writes `{ ...tab, state }`, replacing the tab's state with `{ session, label }`. A Session tab keeps `closed` and `sections` in that same state (`session-sections.ts:1-7`, `instances.ts:124`). The Timeline tab this line replaces held no such fields, so the repeat press cost nothing on the base. `instances.ts` `pinInstance`'s doc states the opposite rule ("the rest of the state (a view's closed sections and their order) stays"), and `SessionDetail.svelte:23-24` promises they are kept. The report does not state this change; failure scenario: on a folder page, press session X, close Timeline and move Agents up in its Session tab, press another session, press X again: the tab comes forward with every section open and in the default order. `SessionList.svelte:338` and `context.ts:703` already reset this way on the base, but those are not the plain press on a row, which a reader repeats to get back to a tab. The fix lies in the reopen path of `opening.ts`, which keeps the fields of the held state, outside the write list, and that widening is the orchestrator's to weigh; verdict: none, case 12 met for a first press.

2. `src/lib/views/sessions/session-detail/TimelineTurns.svelte:79-81`: "if (held === undefined || count === 0) return;\n        if (id !== shown) stuck = true;\n        shown = id;"; what is wrong: the deleted view updated `shown` before any return, and this guard, taken from `Transcript.svelte`'s shape, skips both lines for a session with no events. So a pick of such a session leaves `shown` and `stuck` at the old session's values. The report's judgment call 2 names the change of mechanism and not this; failure scenario: reader scrolled up in A (`stuck` false), picks B with no events, picks A again: `id === shown`, `stuck` stays false unless the box's shrink fired a scroll event that set it true, and the box stands away from the newest event, against item 2's "starts at the newest event ... when the session changes". With the tab hidden during those picks, no layout runs, so no such event can come. Whether a clamp fires a scroll event in Chromium is not verified here. `count` is needed only as a read; moving the zero test off the guard (`if (held === undefined) return;` then `if (stuck && count > 0)`) ends it in one line at landing; verdict: none, case "Another session picked" stays not verifiable and the look should take this path.

Stated in the report and for the look: the Timeline box may become a tab stop of its own, which would make `SessionSection.svelte`'s "one stop of the focus order" false for this section; `list-drag.svelte.ts` holds no focus handling, which agrees with the report's note on Alt+Down.

## Declined to judge

- `npm run diagrams` and `npm run docs:palette` of the brief's verify item 1: not run, since both write into the worktree and this review changes nothing. The diffs of the diagrams are the two counts the deleted imports give (`views to ui` minus 2, `views/sessions to views/shared` minus 2), and the palette loses one row.
- Everything a page shows, per the cases marked not verifiable above: the review runs no page.
- Whether Chromium keeps a moved scroller's offset and whether a clamp fires a scroll event: browser behaviour, settled at the look.
- The report's `diff -rq` against the base copy and its `diff -ru` grep: no base copy is named; the second was run through `git diff 0c02442c5` and the new file. The report's `ps` count: a state at its hand-back, which cannot be rerun.
- The report's quoted base-side greps ("before the change printed"): they need the unchanged tree, and nothing rests on them.
- `sh utils/unused-exports.sh` against the base's lines: no base list exists; I compared only the lines for the changed files.
- Git commands other than the three allowed: none is quoted in the report.

Usage: a1af2b7a974561620, claude-opus-5-5, 218381 tokens, 32 tool uses, 606.0 s
