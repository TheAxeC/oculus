# Step O121 refuter report (on .agents/worktrees/migration-O121, base 2526279ce)

Verification lines:

```
test:quick: 8 changed file(s), from git since 2526279ce
test:quick: 9 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (1.8 s)
ok      svelte-check (6.7 s): 1793648107775 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (35.9 s): Duration  27.33s (transform 11.62s, setup 0ms, import 23.89s, tests 34.58s, environment 2ms)
test:quick: 38.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

- `LC_ALL=C grep -n '[^ -~]'` over the six changed files: prints nothing, `grep exit 1`.
- `git diff 2526279ce --stat -- config tests`: prints nothing.
- `diff -rq ../O121-base/tests tests`, the same over `utils`, and over `config` with `--exclude=local.yml`: each prints nothing, exit 0. No test is added or changed.
- `git diff 2526279ce --stat -- docs/diagrams`: prints nothing.
- `git diff 2526279ce --numstat`: HELP.md 1/1, Card.svelte 13/10, card-layout.ts 7/6, CardActions.svelte 108/34, RecordCard.svelte 23/31, Usage.svelte 19/2. Each row equals the report's table.
- `sh utils/unused-exports.sh` against `../O121-base/unused-exports.txt`: `diff` prints only `<` lines, the base list's two `ERROR:` lines and `knip stopped with status 2`. The step adds no line.
- History grep over added lines: one hit, `card-layout.ts` "could still wrap off the line it shares with the chips". It compares with no earlier state.
- Report's greps rerun: `--clipped` prints `CardActions.svelte:203`, `:279`, `:287`. `data-action-opener` prints `:114`, `:250` (a grep over src, tests, docs/HELP.md, docs/apps.md and README.md). `class="menu"` prints only `SessionWorkspace.svelte:191`. A reuse grep for `function remember` finds no helper that reads widths.
- Case-run program, rebuilt from the report's fragment with opener 20, gap 6, line gap 6, widths 20, `more` 20 (0 for the opener-alone row), chips 240 for lines 319 and 318: all nine output lines equal the report's.
- `orchestrator-state.md:168-172`: the Open items section holds its lead sentence and no entry, as the report says.
- `git status --short` after the checks: the same 8 lines as before them.
- No page was run. Every statement below about what is painted is a judgment from the code and the rendering order, not verified by a run.

## Verdicts on "What to build"

1. One element: holds. `CardActions.svelte:199-251` draws the strip, More and `<span class="act" data-action-opener>{@render opener()}</span>` inside one `data-card-control` span, and `RecordCard.svelte:288-301` hands in the `Menu`. `.menu` is gone. `taken` (line 151) goes into `least` (153) and out of the room (154), with no gap when `actions.length === 0`. `room > 0 ? ... : 0` (155) is the guard.
2. Controls that do not fit lie over the card: holds. `class:over`, no `{#if}`. `over = place.alone && chips` (157), `over` starts true (70), `right: calc(12px + var(--clipped))` (287), `measure` runs at rest (132-137), chips stay in the flow.
3. Controls that fit stay: holds. Under ruling 2 a row with room for More and "..." but not every action goes to the corner, as ruled (program lines 319 and 318).
4. Hovering moves nothing: violated in one rare path, finding B1, by reading. Every other path holds by reading. The height figures are the look's.
5. The Usage card: holds. `Usage.svelte:398-405`; no `data-card-control`; `.act.held` keeps its `display`. `.accounts` is `minmax(min(280px, 100%), 1fr)` (line 326), so this card is not clipped by its pane and needs no measured offset.
6. Comments and pages: holds. Each named comment is rewritten and true, `gap: 0` is gone, and the `card-layout.ts` diff touches comments only. Comments outside the diff that I read (`card.ts:24`, `Gallery.svelte:24`, `record-menu.ts:2`, `CareerCard.svelte:7-8`, `ProjectCard.svelte:18`, `HELP.md:344`) stay true.

## Verdicts on "Cases"

- One chip and room: not verifiable. Placement is met by read and by the program. The height rests on `margin-block` against the chips' height, which only a page shows.
- Too narrow for chips and controls: met. The span is `position: absolute` in all five states, so it adds no height; the chips are untouched.
- Chips that wrap: met. `others` sums past the line, so `alone`, so `over`.
- First hover after load and after narrowing: not verifiable. The ordinary paths are clean by reading: `over` stands until measured, `fit` is infinite on a first draw so every width is real, and a known card is already placed at rest. B1 is the exception.
- Pane widened on a covered card: not verifiable for the height. By read the span returns to the flow and `fit` does not change.
- Clipped card with chips, as ruled: met. `over` with `clipped` puts the right end at the visible edge, and in the flow after the chips when they fit (`start`, `margin-right: auto`).
- Card with no chip: met. `.actions` gap 6px, `over` false.
- No chip, narrower than its controls: met. `place.alone && chips` is false, so no class and no second offset; `flex-end` holds the right end.
- "..." with no strip action: met. Program line `{"over":false,"room":193,"fit":0}`; `taken` has no gap.
- Visible line under about 27 px: met. Program lines 27 and 28 both give fit 0; the opener is the span's last child.
- Narrower than More and "...": met. Over a chip row the span runs left from `right`; on a no-chip row `flex-end` does it, since an auto margin is 0 on an overflowing item. B2 covers a clipped card, which this case does not name.
- Focus across the class change: met by read. `fit` is 2 on both sides at 319 and 318, so nothing is redrawn, and `class:over` keeps the element. The focus itself is the look's.
- Three actions that do not fit: met. Program lines 60 and 90.
- Menu on a covered card: met by read. `Menu.svelte` draws its list through `DropdownMenu.Portal`, placed against the button, and `.card:has([aria-haspopup][aria-expanded='true'])` keeps the span drawn.
- Right-click and context menu key: met by read. The opener stays inside the card's `ContextMenu` wrapper (`RecordCard.svelte:328`), and nothing outside `Card.svelte` reads `data-card-control` (grep above).
- Tab order: met. DOM order is strip, More, opener.
- No hover: met. `.actions.over`, Usage's `.act` rule and `Card.svelte`'s rule all stand only under `@media (hover: hover)`.
- Wallpaper and rice: met by read. `background: var(--card)` on the span and on Usage's `.act`; what is painted is the look's.
- Usage at a narrow width: met. Absolute, so the Tags and the height do not change; `.act.held` keeps `inline-flex` and the rule sets no `display`.

## Findings

Spec: none.

Proof:

- P1. `.scratch/migration/agents/reviews/O121-report.md:47-58`. The quoted program is the `place` function alone: "function place(seen, chips, sizes, more) {". Spec line 66 asks for the source quoted so the reviewer can run it again. The driver lines, the constants and the inputs of the two first output lines (chips 240) are not quoted. I reproduced all nine lines by solving for the inputs, so no number is wrong. Failure scenario: a repair round changes `measure` and the next reader cannot rerun the same cases without working the inputs out again. Fix in the report text.

Standards:

- T1. `CardActions.svelte:152`, "const everyAction = leastStrip(sizes, Number.POSITIVE_INFINITY, gap);", with `card-layout.ts:58-63`. `leastStrip` has one caller, so `more` is always infinite there. `Math.min(all, more)` always returns `all`, and the function's doc ("else More alone") names a branch production never reaches. This is code larger than its job, measured against the spec's KISS and YAGNI lines. Ruling 2 orders exactly this form ("`leastStrip` itself does not change") and the brief limits `card-layout.ts` to comments, so the builder followed its ruling and the report names it (line 160). The ruling governs here, so this is no defect of the build. Failure scenario: a reader changes the "More alone" rule in `leastStrip` to change a card's placement and nothing happens. Replacing it with a plain width sum, shareable with `fitActions`'s `span`, needs the orchestrator's word, since it reverses the ruling's wording.

Behaviour:

- B1. `CardActions.svelte:149`, "const sizes = actions.map((action) => (action.id in widths ? widths[action.id] : 0));". This violates item 4 in one path, by reading. The at-rest branch (134-136) refuses an unknown width, but the drawn branch goes on and counts it as 0.
  - Scenario: a card with chips has `fit` below its action count. An action past `fit` changes id at rest, so `measure` takes the early return and `fit` stays. The hover draws only the first `fit` actions, and the new one has no width.
  - With its width counted as 0 the row can read as fitting: `over` goes false and `fit` goes to every action. The new action is drawn in the flow, and its real width wraps the span.
  - The second size change is at the depth already delivered, so the ResizeObserver does not deliver it in that frame. One painted frame shows the card grown, and the next frame sets `over` and corrects it.
  - With a same-width pane this needs that action wider than the chips (`others < c`), or the pane widened at rest in between. The same holds for an action in More whose width grew under the same id.
  - It is rare and lasts one frame, but the brief says no frame. The report's case row (line 30), "A hover cannot wrap the span", is too strong for this path, and its limitation at line 164 does not name it.
  - A small fix: in the drawn branch, an action with no remembered width sets `fit` to infinity and `over` to `chips` and returns, so every action is drawn and measured before the flow is tried.
- B2. `CardActions.svelte:156`, "start = (place.alone && chips) || seen < content.width - 0.5;", with `.actions.start` at 272-275. This is the one case where `start` puts controls out of reach: a clipped row with no chip whose visible part is narrower than the span. The span is at least More, 6px and the opener, 46 px with 20 px controls, and `margin-right: auto` holds it at the row's start because it is narrower than the row, which `flex-end` does not reach. At 30 px visible, 4 px of "..." can be pointed at; at 26 px or less none can. The base places this row the same way, and ruling 3 says this row "still starts at the left", so the build follows the ruling and no case of the brief names this width. Failure scenario: a board card showing a 25 px sliver at the pane's edge has its "..." out of reach until the pane is scrolled; right-click on the card still opens the menu.

On the points you named, with no finding beyond those above:

- `over` starting true on a row with no chip: it does no harm by reading. The first `measure` is a microtask after mount and sets `over = chips` at rest, or `place.alone && chips` when drawn, before a paint. The only path that leaves it standing is a drawn span with `seen <= 0`, where nothing can be seen, and the observer clears it in the frame the line comes into view.
- `measure` at rest with stale widths: a width drawn at hover is read fresh by `remember` in the observer step, so a stale drawn width corrects before paint. Only an undrawn action reaches a painted frame, which is B1.
- `over` on a clipped card: it does not move the controls out of reach. `margin-right: auto` is 0 on an absolute box with `left: auto`, and `right` holds the right end at the visible edge.
- The `.act` wrapper: the opener's look does not change by reading. `.menu` and `.act` are both flex boxes around the same `MenuOpener`, `.actions` carries the same `margin-block` and `align-items: center`, and the strip's own menus already sit in `.act`. The CardActions `.act` is scoped, so it does not reach Usage, whose `.act` and `.act.held` are its own.
- Head comments: none the diff makes false.

## Declined to judge

- Whether a card's in-flow height is unchanged beside a chip shorter than `1lh - 2px`, which is the look's measurement.
- Whether Chromium paints exactly as B1 reads. It is judged from the rendering order, and from the Svelte flush at `node_modules/svelte/src/internal/client/reactivity/batch.js:915-927`.
- Whether a "ResizeObserver loop completed" line shows in the console at the look when a pane narrows under the pointer.
- Whether bits-ui follows an opener that moves under an open list; the report also marks this not verified.
- Whether ruling 2's wider cover of the title, or decisions 1 to 6, are the right design calls.
- The overlap of these paths with O122's: not asked, not read.

Usage: a271a9088ecbd9671, claude-opus-5-5, 198891 tokens, 25 tool uses, 9 min 24 s


## Repair round 1, refuted

# Step O121 refuter report over repair round 1 (worktree .agents/worktrees/migration-O121, base 2526279ce)

No item of the round is left open against the ruling. Three new low findings stand: B3 (a focus drop that round item 1 creates), B4 (the "any sliver" claim is false on a no-hover screen) and B5 (the part of B1 the ruling did not name). No page was run, so every statement below about what is painted is a judgment from the code and the rendering order, not verified by a run.

Verification lines:

```
test:quick: 9 changed file(s), from git since 2526279ce
test:quick: 9 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (1.7 s)
ok      svelte-check (6.7 s): 1793649029408 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (34.4 s): Duration  26.12s (transform 11.36s, setup 0ms, import 23.06s, tests 33.87s, environment 2ms)
test:quick: 36.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

- `LC_ALL=C grep -n '[^ -~]'` over the six changed files: prints nothing, exit 1.
- `git diff 2526279ce --stat -- config tests`: prints nothing. `git diff 2526279ce --stat -- docs/diagrams`: prints nothing.
- `diff -rq ../O121-base/tests tests`, the same over `utils`, and over `config` with `--exclude=local.yml`: each prints nothing, exit 0. No test is added or changed.
- Case-run program: copied from the report into my scratch folder and run with `node`. Its 14 output lines compared with report lines 102-115 by `diff`: exit 0, no difference.
- My own rows in the same program: `stripWidth` equals the base form of `span` on 28 of 28 inputs; `Math.max(0, ...[])` prints 0; `fitActions([], 173, 0, 6)` prints 0 and `stripWidth([], 6)` prints 0; a chip row with `clipped` 0.4 and `start` false ends its flow at 318.4 of 319.4.
- `git diff 2526279ce --numstat`: HELP.md 1/1, Card.svelte 13/10, card-layout.ts 11/15, CardActions.svelte 117/36, RecordCard.svelte 23/31, Usage.svelte 19/2. Each row equals the report's table. `wc -l` gives 335, 302, 356, 416, 104, 615, each equal to the report.
- `sh utils/unused-exports.sh` against `../O121-base/unused-exports.txt`: exit 0, `diff` prints only `<` lines (the two `ERROR:` lines and `knip stopped with status 2`). The step adds no line.
- History grep over added lines: one hit, `card-layout.ts` "could still wrap off the line it shares with the chips". It compares with no earlier state.
- Greps rerun: `leastStrip` over src, tests, docs, README.md and guarded.md prints nothing, svg files included. `stripWidth` has the callers `CardActions.svelte:157` and `card-layout.ts:98`. `--clipped` prints `CardActions.svelte:207, :274, :278, :286, :294`. `data-action-opener` prints `:115, :254`. `card-layout` and `CardActions` appear in no test and no entry of guarded.md.
- Round delta: `diff -u` of each path of `files.txt` against the snapshot. Only `card-layout.ts` and `CardActions.svelte` differ. HELP.md, Card.svelte, RecordCard.svelte and Usage.svelte print nothing. `git status --short` shows no changed path beyond `files.txt` other than the two briefs and the report under `.scratch`, the same 9 lines after the checks as before them.

## Closures of the round

1. B1 closed against the ruling. `CardActions.svelte:137-142` sets `fit` to infinity when drawn and `over = chips`, and returns. The walk of the refuter's scenario: at rest `over` is true on a chip row; the hover's observer step sets `fit` infinite; every action paints in one frame over the corner, absolute, with no height; the next observer step measures real widths and any flow placement then fits with the slack. The B1 sentence "The same holds for an action in More whose width grew under the same id" is outside the ruling's words and stays open as B5.
2. T1 closed. `leastStrip` is gone, `stripWidth` is one plain sum, `fitActions`'s `span` calls it with equal results, and the doc comments are true.
3. B2 closed on a screen that hovers. `start = chips && (...)` at line 160, `margin-right: var(--clipped)` at line 274, `flex-end` at `Card.svelte:292`. Arithmetic: span right end = line right - clipped = the visible edge, also when the span overflows left, since a negative free space sets the auto margin to 0 and `flex-end` then aligns the margin box. On a no-hover screen it does not close: B4.
4. P1 closed. The program is whole and reproduces.

Beyond the ruling's words, the round merges the at-rest guard so a drawn span with `openerWidth === 0` also returns. The report states this, and it is reachable only with a drawn span under a hidden ancestor, where `seen <= 0` returned anyway. No check was removed, and I do not count this as a fix reaching beyond the finding.

## The points you named

- `margin-right: var(--clipped)` on an in-flow row beside chips with `start` false: harmless. `start` false with chips means `seen >= content.width - 0.5`, so `clipped` is at most 0.5. `actionPlace` leaves a slack of 1, so the row ends 1 px inside the line (program row above). `start` and `clipped` are set together, so an early return leaves them consistent.
- A no-hover screen: `.actions.over`, `flex-end` and Usage's rule stand only under `@media (hover: hover)`, so `over` paints nothing and the row stays in the flow. With fit below the action count the row is `alone`, so the span already has its own line, and drawing every action for a frame changes no height. The defect is B4.
- Can `unknown` hold forever with `fit` infinite: no. Once `fit` is infinite every action is in the DOM, so the next `measure` remembers them all. The only gap is a span that keeps its size because the one action in More is as wide as More; no observer fires, so `fit` stays infinite until the next size change or draw. The span then has the width last measured, so nothing overflows, and the next hover's 0-to-w change fires the observer. Report line 206 names this. A card that is never drawn stays at `over = chips` with `fit` infinite, which draws nothing.
- `measure` looping from the drawn branch: no. `widths` is never deleted and `measure` creates no id, so after one drawn pass `unknown` is false for that id set. The arithmetic then gives the same `fit`, since the room does not depend on what is drawn.
- `Math.max(0, ...sizes)` with empty `sizes`: 0, then `more` is 0, `fitActions([], room, 0, gap)` is 0 and `stripWidth` is 0. `taken` has no gap. `unknown` is false on an empty list.

## Verdicts on "What to build"

1. One element: holds. `CardActions.svelte:203-255` draws strip, More and `<span class="act" data-action-opener>{@render opener()}</span>` in one `data-card-control` span. `RecordCard.svelte:288-301` hands in the `Menu`, and `.menu` is gone. `taken` goes into `least` (157) and out of the room (158), with no gap when `actions.length === 0`. The guard is at 159.
2. Controls that do not fit lie over the card: holds. `class:over`, no `{#if}`; `over = place.alone && chips` (161); starts true (71); `right: calc(12px + var(--clipped))` (294); `measure` runs at rest (139 onward); the chips stay in the flow.
3. Controls that fit stay: holds, as ruling 2 reads it (program lines 319 and 318).
4. Hovering moves nothing: violated in one remote path, finding B5, by reading. B1's path is closed. Every other path holds by reading. The height figures are the look's.
5. The Usage card: holds. `Usage.svelte:398-405`; no `data-card-control`; `.act.held` keeps its `inline-flex` and the rule sets no `display`.
6. Comments and pages: partial, finding B4 on `CardActions.svelte:24`. Every other named comment is rewritten and true, `gap: 0` is gone, and the `card-layout.ts` doc comments are true after the round.

## Verdicts on "Cases"

- One chip and room: not verifiable. Placement is met by read and program. The height rests on `margin-block` against the chips, which only a page shows.
- Too narrow for chips and controls: met. The span is absolute in all five states; the chips are untouched.
- Chips that wrap: met. `others` sums past the line, so `alone`, so `over`.
- First hover after load and after narrowing: not verifiable as frames. By read `over` stands until measured, `fit` is infinite on a first draw, a known card is placed at rest, and an unknown action is tried over the corner only.
- Pane widened on a covered card: not verifiable for the height. By read the span returns to the flow and `fit` does not change, except on B5's path.
- Clipped card with chips, as ruled: met. Absolute at the visible right edge, or in the flow after the chips when they fit (program lines clipped 200 and 300).
- Card with no chip: met. `.actions` gap 6px, `over` false after the first `measure`.
- No chip, narrower than its controls: met on a screen that hovers. `place.alone && chips` is false, so no second offset, and `flex-end` holds the right end (program line 40). No-hover: B4.
- "..." with no strip action: met. Program `{"over":false,"start":false,"room":193,"fit":0,"clipped":0}`.
- Visible line under about 27 px: met. Program lines 27 and 28 give fit 0; the opener is the span's last child.
- Narrower than More and "...": met on a screen that hovers, on both rows. Partial on a no-hover screen, finding B4.
- Focus across the class change: met by read. `fit` is 2 on both sides and `class:over` keeps the element; the focus itself is the look's. A different focus path is B3.
- Three actions that do not fit: met. Program lines 60 and 90.
- Menu on a covered card: met by read. `Menu.svelte:197` draws on the body through the Portal, and `.card:has([aria-haspopup][aria-expanded='true'])` keeps the span drawn.
- Right-click and context menu key: met by read. The opener stays inside `ContextMenu`, and nothing outside `Card.svelte` reads `data-card-control` (grep above).
- Tab order: met. DOM order is strip, More, opener.
- No hover: met. The class's rule, Usage's rule and Card's rule stand only under `@media (hover: hover)`.
- Wallpaper and rice: met by read. `background: var(--card)` on the span and on Usage's `.act`, and the margin area paints nothing; what is painted is the look's.
- Usage at a narrow width: met. Absolute, so the Tags and the height do not change, and `.act.held` stays drawn.

## Findings

Spec: none.

Proof: none of its own. Report line 186 and the limitation at line 209 are part of B4; the limitations section omits B3 and B5.

Standards: none.

Behaviour:

- B3 (low). `CardActions.svelte:138`, "if (drawn && unknown) fit = Number.POSITIVE_INFINITY;", with `:241`, "{#if rest.length > 0}".
  - What is wrong: `fit` infinite empties `rest`, so the More element is removed from the DOM for one frame, and the next `measure` mounts a new one. A focused More loses the focus. The base kept More here, counting the unknown width as 0, so round item 1 adds this and the report does not name it.
  - Scenario, by reading, not run: an Inbox card with a line under about 99 px (three 20 px controls, gaps, the opener and the slack), so Triaged is in More. `strip={['draft', note.triaged ? 'restore' : 'triaged', 'archive']}` is at `InboxCard.svelte:289`. The reader opens More by keyboard and picks Triaged; the pick gives the focus back to the More button (`Menu.svelte:14`). The answer turns the id into `restore`, which has no remembered width. `measure` removes More and the focus falls to the body; Tab restarts from the top of the document. An open More list is lost the same way when the id changes under it. `RadarCard.svelte:340` (`dismissed ? 'restore' : 'dismiss'`) and every `page ? 'editor' : 'page'` strip have the same path.
  - This follows the ruling's words, so the builder is not at fault. It needs the orchestrator's word: either More stays drawn while every action is measured (for example `rest.length > 0 || measuring`, a judgment, not built), or the drop is accepted and the report names it.
- B4 (low). `CardActions.svelte:23-24`, "the element's right margin keeps it at the visible right edge of a clipped card, so "..." stays in reach at any sliver.", with `Card.svelte:286-292`, where `justify-content: flex-end` stands only under `@media (hover: hover)`.
  - What is wrong: on a no-hover screen a span wider than `seen` makes the free space negative, the auto margin goes to 0, and `.meta` keeps `flex-start`. The span starts at the row's left and overflows right.
  - Scenario: content 300, seen 25, span 46 on a touch screen. The span lies at 0 to 46, so 21 px of it is past the visible edge and "..." cannot be pressed. A chip row on that screen does the same, since `.actions.start` holds the span at its own line's start.
  - Report line 186 says "at any sliver" with no qualifier, and line 209 names only the no-chip row and excuses it as "The hover case is the case ruled". The case "A card narrower than More and "..." together" has no hover qualifier, and round item 3 says "So "..." stays in reach at any sliver".
  - The first step is that the comment and report line 186 say "on a screen that hovers". Whether the no-hover row is also fixed is for the orchestrator: a no-chip row needs `flex-end` outside the media rule, and the chip row has no such simple rule. The base places these rows the same way, so this is no regression.
- B5 (low). `CardActions.svelte:154`, "const sizes = actions.map((action) => widths[action.id]);".
  - What is wrong: a width remembered for an action now in More can be stale under the same id. The ruling closed the absent width only, and B1's closing sentence names this one.
  - Scenario: a span drawn by focus or pointer with the action in More, whose real width has grown, and a pane widened into the window where the stale width fits. `over` goes false and `fit` goes to every action, the real width wraps the span in the flow, and the correction arrives one frame later, so one frame shows the card grown.
  - Reach: glyph controls are compact and of one width. Among the strip actions I read, the word control is `applied` (`LeadCard.svelte:186`), which has no glyph. It changes width only when the hub count crosses 1, and it is in More only at `fit` 0. A web font landing after a width was remembered is another source; I did not check the fonts. This is remote, and item 4's "no frame" is the only reason it is a finding. It needs the orchestrator's word, or a line in the report's limitations.

## Declined to judge

- Whether a card's in-flow height is unchanged beside a chip shorter than `1lh - 2px`, which is the look's measurement.
- Whether Chromium paints as the frame arguments above read. They are judged from the rendering order: observer step, then Svelte's microtask flush, with a same-depth change deferred to the next frame.
- Whether a "ResizeObserver loop completed" line shows in the console at the look.
- Whether bits-ui follows an opener that moves under an open list; the report also marks this not verified.
- Whether a touch reader can scroll the pane to reach a cut "...", which depends on the pane.
- Whether ruling 2's wider cover of the title, ruling 3, round item 1 or decisions 1 to 6 are the right design calls. The no-hover row that takes a line of its own where the base kept More beside the chips (report line 192) belongs here too.
- The overlap of these paths with O122: not asked, not read.

Usage: a76fa219da2e1d092, claude-opus-5-5, 187244 tokens, 28 tool uses, 8 min 11 s

## Closed

- Behaviour B1, Standards T1, Behaviour B2 and Proof P1: closed in repair round 1.
- B3: fixed at landing, More stays drawn while every action is measured.
- B4: fixed at landing, the comment says on a screen that hovers.
- B5: not fixed: a remote one-frame case; named in the report to the user.
