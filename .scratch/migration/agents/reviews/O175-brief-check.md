# Brief check of O175, on main at 30e1d996b (`git rev-parse HEAD`)

I changed nothing in the tree. Every `git grep` over `config/` ran on tracked files only, and `git ls-files config/local.yml | wc -l` prints 0, so that file was not searched. No page was opened, so nothing below about run time is measured.

The three findings that bear most on the goal:
- Names F1: the only way to build "one queue" inside the write list breaks spec.md's No globals rule.
- The question Q1: a single layout may be longer than the frame.
- Implied I1: a waiting tile writes false Too tall findings.

## Names

The brief names no prop. The only new name is the file `layout-turns.ts`.

`git grep -n -E 'onlaid|layOutSlide|layout-turns' -- src tests config docs README.md`:
- `layout-turns`: no hits.
- `layOutSlide`: only in `Slide.svelte` (161, 318, 330, 365, 369, 372), on the write list.
- `onlaid`: `Slide.svelte:84,87,313`, and outside the list `src/routes/present/print/+page.svelte:195`. Item 2 keeps it, so it stays true.

`git grep -n -E 'tooTall|present: \{ measured|measured\(deck|function measured\(deck' -- src tests`: `present.svelte.ts:187,495,558`, `Tile.svelte:74,78`, `Framed.svelte:34,49`. All are on the write list. `tests` has no hit.

`git grep -n -E "Slide\.svelte|Framed\.svelte|Tile\.svelte" -- src tests config docs README.md` lists these hits outside the write list. None is made false:
- `src/lib/themes/slide.css:16`
- `parts/Equation.svelte:8`
- `parts/Plain.svelte:8,18`
- `parts/Words.svelte:46`
- `parts/project/Facts.svelte:3`
- `parts/project/Project.svelte:9`
- `presenter/Presenter.svelte:21,38`
- `screen/Stage.svelte:8`
- `screen/drawn-slide.ts:1`
- `screen/formula.ts:4`
- `screen/slide-layout.ts:2,94`
- `Present.svelte:21,101`
- `Group.svelte:25` and the import of `Tile` there
- `print/+page.svelte:30,37` (a slide outside a tile lays out as it does now)
- `show/+page.svelte:37`

`Present.svelte:21` says "The overview draws every slide the same way, at the size of its tile". This stays true as a statement of how a tile is framed. Only the timing of its layout changes, and the file is not on the write list.

`git grep -n -i overview -- docs README.md config ':!config/local.yml'` hits `docs/decks.md:103,133,349` and `docs/HELP.md:466,469,636,639`, plus catalog lines. None states when a tile is drawn, and none is made false. `git grep -n -i 'too tall' -- docs config/text` hits only the two catalog lines.

**F1 (rule clash).** Item 1 asks for "One queue", in a module under `screen/`, and C1 to C6 need a fake frame source and clock, so the module takes them as inputs and somebody must make the instance. The write list allows no owner:
- `Overview.svelte` is "its head comment only".
- `Group.svelte`, `state/life/arrange.ts` (`TileView`, lines 52-59) and `state/client/context.ts` are not listed.
- `Tile.svelte` is one per tile.

So the only way to get one queue is module-level mutable state in `layout-turns.ts`, or a `<script module>`. `spec.md:88` says: "No globals. No `globalThis`, no module-level mutable state shared across module graphs; a dependency is passed in ... A package that adds one is not landed." The check would not catch it: `tests/checks/tree/boundaries.test.ts:69-78` (`holdsModuleState`) scans `lib/server`, `routes`, `lib/state`, `lib/shell` and `lib/ui`, not `lib/views`. Lines 101-105 of that file state the rule for the client ("the stores are built per client ... and reached through Svelte's context"). The brief does not say where the queue lives, and that choice changes the write list. It also decides whether two Overviews in two panes share one budget per frame.

## The step line

Step line, `plan.md:1716`, mapped to the brief:
- "the portfolio Overview stays usable at 110 tiles": C7.
- "draws every tile in one pass and froze ... more than five minutes": premises at brief lines 11-12, 17.
- "a reload froze it again because the Overview state is saved": premise at line 16, C7's last clause. No item needs to change it. The reload is cured only if the queue cures the first open.
- "draws its tiles a few at a time so the page answers while they arrive": item 1 and C7. **Partial.** The brief queues layouts only, so all 110 `Tile` components (each with `Slide`, `Stage`, `Card`, `Menu`) are still mounted in one pass. C7 exempts "the first draw". The ruling's words (`plan.md:3686`) are "draws its tiles a few at a time". Tile drawing itself has no requirement.
- "the cost read from `Slide.svelte`'s synchronous layout": premises at lines 12-13.
- "the result measured at the look": C7, by `PerformanceObserver`.
- "every tile is still drawn and measured, so the Too tall marks stay": item 6, C8.
- The file list: all on the write list, `Overview.svelte` as comment only.
- "Built by a builder agent": size full step.

No other part of the step line lacks a requirement. Items 3, 4, 5 and 7 and the comments of item 8 serve the parts above.

## Premises

Rechecked by `sed -n`, `Read` and `git grep` of the named lines. Each holds except as stated.
- Overview and Tile: `Overview.svelte:203-211`, `Group.svelte:193` (tile per slide), `Tile.svelte:110-112` and `aspect-ratio` on the element: hold.
- Framed: `git grep -n 'Framed' -- src` gives `Present.svelte:429` and `Presenter.svelte:119,131`: holds.
- `Slide.svelte:321-335`, `layOutSlide` :161-314, `fits` at two ends plus `HALVINGS` 6 (:296-305), `UNDER_PASSES` 3 (:93, :259), `flushSync` in `draw`: hold. "All the microtasks of one Overview run in one task" holds by reading `queueMicrotask` at :329; it was not run.
- `:368-369`, `:357-366`, `:316-319`: hold. "Arrive for every tile at once" holds for the font event and the observer. An image load is one event per image, so it does not. No consequence.
- `onlaid` :83-84, :313: holds. `src/routes/present/print/+page.svelte:195` is its one user.
- **Off by one.** `screen/Stage.svelte:60-82`: `grep -n 'effect(\|^    });'` shows the effect at 61-83.
- `present.svelte.ts:495` `measured`, and `tall` as a `SvelteMap` read by `tooTall` (:558, `Tile.svelte:78`): hold.
- `Present.svelte:185` (`held.overview`, where `held` is `parsePresentState(instanceState(instance.id))`, :143) and `:350-351`: hold.
- `agents/reviews/O151-landing.md:15` says the Overview froze for more than five minutes. **The citation covers half the sentence.** `grep -c -i reload .../O151-landing.md` prints 0. The reload freeze is on record only in `plan.md:1716`.
- `git grep -n 'Overview' -- tests`: exactly the three files, none draws a tile: holds.
- `ls docs/adr`: no such folder: holds.
- `plan.md:1716` now reads as the brief says it was corrected. The earlier wording is not recoverable from `git diff .scratch/migration/plan.md`, where the whole line is new.
- Libraries: `grep -n tanstack package.json` shows `@tanstack/virtual-core` at line 69: holds.
- Folder rule: `git ls-files src/lib/views/academic/present/screen | wc -l` is 8. The new file makes 9, under the 10 of `spec.md:49`.
- Size: `wc -l` gives `Slide.svelte` 493 lines against the 520 bar of `spec.md:48`. That is 27 lines of room for the prop, the queue wiring and a rewrapped head comment.

## Cases and checks

Read against `spec.md`. Inconsistencies:
- **Verify item 5** tells the builder to read each list item and sentence against "the standards pages' rules on list items and sentence length". `grep -n -i -E 'sentence length|list item|sentence' .scratch/migration/agents/spec.md` hits only :13, :45, :72, none of which is such a rule, and spec.md is the only standards page. The check has nothing to read against. O174's verify list has no such line (`grep -n 'standards pages' .scratch/migration/agents/briefs/O174.md` hits only its line 7).
- **Verify item 2** uses `LC_ALL=C grep -n '[^ -~]'`. `spec.md:103` says the perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it".
- **Verify item 4** runs `sh utils/unused-exports.sh | diff - .agents/worktrees/O175-base/unused-exports.txt`, while line 92 says to run from the worktree root. That relative path does not resolve there; the base is in the main checkout (the same line says so). `diff` also prints removed lines, so "prints nothing new" is not what the command as written shows.
- **C1** uses "a budget of 4 ms", while Decisions item 1 makes the budget "the builder's constant, about 8 ms". The case needs a budget parameter, which item 1 never states. Not a contradiction, but the module's shape is implied rather than stated.
- **Read list and item 7.** Item 7 requires reading what `measured` and `tooTall` cause. The read list gives `present.svelte.ts:410-430` and `:490-525`, and `spec.md:8` limits the builder to the ranges given. `tooTall` is at `:558` and the store's findings at `:559` (consumer `state/workbench/navigation/status.ts:497`), all outside. `node_modules/svelte/src/reactivity/map.js`, which decides the cost, is not on the list either.

Places the step does not change:
- C8's Findings row reads `status.ts:497`, but C8 is the orchestrator's look, so no builder is sent there.
- No builder case checks an unchanged place.
- C1 to C6 are consistent with `spec.md:66`, and "No test is kept" is consistent with `spec.md:60`.

## The question

Could each pass without the goal, the Overview at 110 tiles keeping the page answering while every tile is still drawn and measured?

- **Q1, item 1 and C2: yes.** "At least one layout runs per frame" bounds nothing about one layout. More than five minutes over 110 tiles is about 2.7 s per layout on average (brief line 17; `Slide.svelte` :296-310 runs up to eight `fits`, each several `flushSync` and layout reads). If a single `layOutSlide` costs anything near that, every frame is one long task, the queue works as specified, C1 to C6 pass, and the page answers only every few seconds. The brief has no figure for one layout. Only C7 can show this, after the build.
- **C1 to C6: yes.** They run the module alone. All pass with the module wired to nothing, and with `Slide.svelte` unchanged.
- **C7: yes, in part.** "Apart from the first draw" leaves the mount of 110 tiles unbounded. A long first draw passes and the page does not answer through it, on open and on reload. "About 100 ms" has no stated bound.
- **C8: yes.** It looks after the queue has emptied, so it cannot see false marks while tiles wait (I1 below). It says nothing about a tile with no mark.
- **C9, C10: not as written.** Each looks at the page in the state the goal concerns.
- **Item 2: yes,** for the same reason as item 1. Items 3, 4 and 5 do not reach the goal by themselves. Item 3 says "drawn as it is now before layout", which by its wording also holds a tile measured unlaid.
- **Item 6: yes.** "No tile is skipped" plus "once the queue has emptied" holds at the end state while the waiting phase is wrong (I1).
- **Item 7: yes.** It can end at "read and found nothing". Reading `map.js` lines 131-153 and 180-235: `SvelteMap.get` of an absent key subscribes to the version, and `set` of a new key and `delete` of a present key increment it. So every tile with no mark re-derives when any tile gains or loses a mark, which is proportional to tiles per marked tile, and `delete` of an absent key costs nothing. The result depends on what the builder finds.
- **Item 8: yes.** It does not bear on the goal.
- **Step line's "measured at the look": yes,** if the look's C7 is what proves it. The landing cannot prove it otherwise, since no test is kept.
- **Verify 1 and 4: yes.** They do not exercise the behaviour.

## Implied inputs

**I1 (happens, costs a wrong finding).** A tile waiting its turn and the `ResizeObserver` of `Stage.svelte:79-81`.
- The tile is at `fit = 1`, `room = 0`, `--slide-room-height` unset (`Slide.svelte:121,137,382`), its figures unplaced, and `.waiting` is `visibility: hidden`, which still takes room.
- Today the microtask lays it out before the observer's first callback. With the queue, rendering step one runs one frame's layouts and then every tile's first observer callback, so an unlaid slide that needs a factor under 1, or an unconstrained Markdown image, reports `over` above `TOO_TALL` (1/720, `present.svelte.ts:103`).
- The tile then shows Too tall and the Findings list gains a row until its turn. If the Overview closes first, the entry stays: nothing clears `tall` on teardown (`Stage.svelte:82` only disconnects, `prune` keeps a slide some deck holds). A false finding persists until that slide is drawn and laid out again.
- Expected: a tile not yet laid out writes no mark and no row, and a tile destroyed while waiting leaves none.

**I2 (real).** A second Overview in another pane while the first is arriving. Expected: one budget per frame across both, which is what "one queue" says. Unstated, and tied to F1.

**I3 (real).** A deck push from the server while tiles wait. `Slide.svelte:321-335` re-runs on every new `row` object, so all laid tiles queue again. Expected: the page keeps answering and the queue empties once. Item 4 covers repeats. A re-queued tile's position relative to place order is unstated.

**I4.** Place order. Item 1 and Decisions item 2 say "place order". `view.placeOf` (`Overview.svelte:89-91`) returns a text and `Tile` holds no number, so the queue can only run in the order slides asked, which matches place order only at first mount. C1's "in order" cannot tell the two apart.

**I5.** The browser tab hidden while tiles wait: `requestAnimationFrame` stops. Expected: the queue resumes when the tab is shown, and no layout is lost. Low cost, since a hidden slide is left undrawn today (`Slide.svelte:166-167`).

**I6.** A job that throws (C6): whether the error still reaches the console is unstated. Expected: the error is reported and the rest run.

## ADRs

`ls docs/adr` prints "ls: docs/adr: No such file or directory". There is no ADR folder and no ADR touches the step, as the brief says.

## Dictated text

The brief dictates no line of text for any file. Item 8 and the Conventions section set what comments must say without giving words. `grep -n '"' .scratch/migration/agents/briefs/O175.md` hits only lines 92 and 104, both prose quoting a spec section and a report line, and the one dictated name is the file name `layout-turns.ts`.

## Declined to judge

- How long one layout, or the first draw, actually takes: not measured, and a page is outside this check.
- Whether `spec.md:88` was meant to reach a per-page client queue in `lib/views`. `src/lib/views/shared/latex/math.ts:51` is a module-level `let` in that layer, which the check does not cover. Whether that precedent stands is for the session.

Usage: aecd7b11c26c70e4a, claude-opus-5-5, 155635 tokens, 19 tool uses, 370 s

## Closed

- Names F1: item 1 now places one queue per Overview, made in `Overview.svelte` and reached through Svelte context, with no module-level mutable state; `Overview.svelte` is widened on the write list.
- The step line, "draws its tiles a few at a time": new item 3 mounts a tile's slide at its turn, and C7's exemption is narrowed to the empty tiles' first draw.
- Premises: `Stage.svelte` range corrected to 61-83; the reload freeze now cites `plan.md:1716`.
- Cases and checks: verify item 2 uses the ASCII gate of `spec.md`; verify item 4 names the absolute base path and passes when no line starts with `<`; verify item 5 removed; item 1 states the module's inputs, budget included; the read list adds `present.svelte.ts:555-560`, `state/workbench/navigation/status.ts:490-505` and `node_modules/svelte/src/reactivity/map.js`.
- The question Q1: new item 4 contains each tile's layout; the look treats a layout over about 100 ms as a finding.
- The question, item 7: now states the finding on `SvelteMap` and requires the change.
- The question, C8: states no mark on a waiting tile.
- Implied I1: item 6 reports a tile's measure only once it is laid out, and a tile destroyed while waiting leaves no finding.
- Implied I2: Decisions item 4 states one queue per Overview.
- Implied I3, I4: item 1 and Decisions item 2 state the order tiles ask in.
- Implied I5, I6: item 1 states the resume, and C6 the error reaching the console.
