Everything in the brief is done. No height was measured on a page: a builder runs no page, so every row whose proof is a height names the look on landing, as the brief says.

## Open items of the state file, verbatim

From `orchestrator-state.md`, section "Open items":

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The section holds no entry.

## The ruling carried

`.scratch/migration/agents/briefs/O121-cases.md` rules three cases the first run handed back, and this build follows it.

1. **Clipped card with chips.** Item 2 and decision 5 stand. The case reads: the controls lie at the top, at the visible right edge; when they fit beside the chips in the visible part, they stay in the flow after the chips. Building the case's old words was the lazy option.
2. **Focus across the place the class changes.** Option (a): `measure` hands `leastStrip` the whole strip's width, `more` given as `Number.POSITIVE_INFINITY`, so beside the chips means every action fits and `fit` is the same on both sides. `leastStrip` is unchanged. A row with room for More and "..." but not for every action goes to the corner, and decision 2 reads with that. Narrowing the case was the lazy option.
3. **A card narrower than More and "..." together.** Option (a): `justify-content: flex-end` in `Card.svelte`'s rule, and `.actions.start` uses `margin-right: auto`. Narrowing the case to rows with chips was the lazy option.

The five decisions of the handback stand and are built: the class starts true and the first `measure` clears it; at rest with a width not known, `measure` sets the class from whether the row holds chips and goes no further; the row holds chips when `line.children.length > 1`; a line with `seen <= 0` leaves the class, `fit` and the clipped width as they stand; `margin-block` stays on the span.

## The cases' first run

Run before any change, by reading the code. "Unchanged tree" is what the base gives. "Built" is what the code in this diff gives, by reading and, where named, by the case-run program below. No page was run.

| Case | Reading | Unchanged tree | Built |
|---|---|---|---|
| One chip and room | `measure`, `.actions` | `alone` false, controls at the line's end, `margin-block` keeps the height | Same place, one span; program: over false, fit 2. Look on landing: Career, wide pane, one chip |
| Too narrow for chips and controls | `measure`, `.actions.over` | `alone`, `start`, strip wraps to its own line, card grows | `over`, corner, chips in the flow. Look on landing: heights in the five states |
| Chips that wrap | `others` sums past the line | `alone`, grows | As above |
| First hover after load and after narrowing | `measure` at rest, `over` starts true | Strip wraps until measured; `measure` returns at rest (base line 91) | At rest the class is right from remembered widths; before any draw it stands. A hover cannot wrap the span. Look on landing: frames sampled |
| Pane widened under the pointer | ResizeObserver on the line, `measure` | Strip returns beside the chips | `over` clears, span in the flow beside the chips. Look on landing: height equals rest at the new width |
| Clipped card with chips, as ruled | `clipped`, `right: calc(12px + var(--clipped))`, `start` | `start`, strip at the line's start, can grow | Top, visible right edge; fits in the visible part: after the chips in the flow. Look on landing |
| No chip | `Card.svelte` rule, one span | Over the corner, two spans, `gap: 0` | Over the corner, 6px gap solid between the last action and "..." |
| No chip, narrower than its controls | `over = place.alone && chips` | Card's rule, wraps inside the row | Card's rule alone, no class, no second offset. `start` is false, so the span holds the row's right end |
| "..." with no strip action | `taken`, `leastStrip` returns 0 | Opener at the end | Opener alone at the line's end, no gap counted; program: over false |
| Visible line under about 27 px | Guard `room > 0` | `fitActions` room 0 keeps every action | Every action in More, opener last; program: line 27 room 0 fit 0, line 28 room 1 fit 0 |
| Narrower than More and "..." | `.actions.over`, `flex-end`, `margin-right: auto` | Two children wrap | Passes the left edge on both rows; right end stays reachable |
| Focus across the class change | `class:over`, `fit` on both sides | `fit` jumps from 0 to 2 at the place, removing More or an action | Program: line 319 over false fit 2, line 318 over true fit 2. Nothing is redrawn at that place. Look on landing |
| Three actions that do not fit | `room`, `fitActions` | Opener counted through `others` | Program: line 90 room 63 fit 1, line 60 room 33 fit 0; span within the line, opener last |
| Menu on a covered card | `Menu.svelte` portal on the body | Not cut off | Same: `DropdownMenu.Portal`, no stacking change. Look on landing |
| Right-click and context menu key | `ContextMenu.Trigger` wraps the face, `controlOf` | The card's menu | Same: the opener stays inside the trigger |
| Tab order | DOM order in the span | Strip, then "..." | Same: the opener is the span's last child |
| No hover | The class's and Usage's rules are under `@media (hover: hover)` | Row in flow | Row in flow, nothing covered |
| Wallpaper and rice | `background: var(--card)` under the class | Solid on a no-chip row | Solid box, only under `over`, and on Card's rule. Look on landing |
| Usage at a narrow width | `.act` rule, `.act.held` | `.act` wraps, card grows | Absolute in `.face`, tags untouched, `.act.held` stays `inline-flex` and turns. Look on landing |

Case-run program, inline in `node --input-type=module -e`, writing nothing, importing the real `card-layout.ts`, with opener 20, gap 6, line gap 6 and action widths 20:

```js
function place(seen, chips, sizes, more) {
  const has = chips > 0;
  const others = has ? chips + lineGap : 0;
  const taken = openerWidth + (sizes.length === 0 ? 0 : gap);
  const p = actionPlace(seen, others, leastStrip(sizes, Number.POSITIVE_INFINITY, gap) + taken);
  const room = p.room - taken;
  return { over: p.alone && has, room, fit: room > 0 ? fitActions(sizes, room, more, gap) : 0 };
}
```

Output, from runs after the last change. The second block's objects also held a `start` field equal to `over`, left out here.

```
319 {"over":false,"room":46,"fit":2}
318 {"over":true,"room":291,"fit":2}
one chip, room, line 300, chips 80, 2 actions {"over":false,"room":187,"fit":2}
three actions, line 60, chips 100 {"over":true,"room":33,"fit":0}
three actions, line 90, chips 100 {"over":true,"room":63,"fit":1}
no chip, three actions, line 90 {"over":false,"room":63,"fit":1}
opener alone, line 300, chips 80 {"over":false,"room":193,"fit":0}
visible line 27, chips 80, 2 actions {"over":true,"room":0,"fit":0}
visible line 28, chips 80, 2 actions {"over":true,"room":1,"fit":0}
```

## DONE / NOT DONE

| Deliverable or check | State | Command and output |
|---|---|---|
| 1. One element for a record card's controls | DONE | `grep -rn 'data-action-opener'` prints `CardActions.svelte:114` and `:250`; `class="menu"` is gone from `RecordCard.svelte` (only `SessionWorkspace.svelte:191`, its own class, remains) |
| 2. Controls that do not fit lie over the card | DONE, look on landing for the heights | `grep -rn -- '--clipped'` prints `CardActions.svelte:203`, `:279`, `:287` |
| 3. Controls that fit stay | DONE, look on landing | Program line 319: `"over":false` |
| 4. Hovering moves nothing | DONE, look on landing for the frames | Read from `measure`; no page run |
| 5. The Usage card | DONE, look on landing | `.act` under `@media (hover: hover)` in `Usage.svelte` |
| 6. Comments and pages | DONE | Listed under "Comments and pages read" |
| `npm run test:quick` | DONE | `test:quick: 44.6 s; every command passed` |
| `LC_ALL=C grep -n '[^ -~]'` over the changed files | DONE | Prints nothing, `[exit 1]` |
| `git diff --stat -- config tests` | DONE | Prints nothing |
| No test added or changed | DONE | `diff -rq ../O121-base/tests tests` prints nothing |
| Sentences read against the prose rules | DONE | Read by me; no departure |

`test:quick` lines as printed:

```
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (9.4 s)
ok      svelte-check (26.7 s): 1793647740756 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (42.0 s): Duration  31.03s (transform 13.41s, setup 0ms, import 27.32s, tests 42.85s, environment 2ms)
test:quick: 44.6 s; every command passed
```

The list ran the nine checks under `tests/checks`. It covers no behaviour of these components, which no test reaches.

This step adds and changes no test, so there is no failing line to quote and no assertion, allow list or predicate edit to list.

## The files with line counts

From `git diff --numstat` and `wc -l`. `git status --short` and `diff -rq` against the base copy agree; `config`, `tests` and `utils` show no difference.

| File | Lines now | Added | Removed | On the write list |
|---|---|---|---|---|
| `src/lib/ui/frame/Card.svelte` | 335 | 13 | 10 | yes |
| `src/lib/views/shared/card/record/CardActions.svelte` | 295 | 108 | 34 | yes |
| `src/lib/views/shared/card/record/RecordCard.svelte` | 356 | 23 | 31 | yes |
| `src/lib/views/system/machine/usage/Usage.svelte` | 416 | 19 | 2 | yes |
| `src/lib/views/shared/card/card-layout.ts` | 109 | 7 | 6 | yes, comments only |
| `docs/HELP.md` | 615 | 1 | 1 | yes, line 301 |
| `.scratch/migration/agents/reviews/O121-report.md` | new | | | yes |

`docs/diagrams/*` did not change: `npm run diagrams` ran once and `git diff --stat -- docs/diagrams` prints nothing.

## Judgment calls the brief left open

- **`start` also needs chips.** It reads `(place.alone && chips) || seen < content.width - 0.5`. Under ruling 2 a row with no chip is `alone` at widths where More and "..." leave free room, and `start` would then move its controls to the row's left. The program's "no chip, three actions, line 90" is that width. Without chips, only a clipped card starts at the left.
- **`remember(node)` is a new local function.** It holds the width reads, so `measure` keeps one reason. `grep -rn "function remember"` prints only unrelated functions in `windows.ts` and `decorations.svelte.ts`, which measure nothing.
- **The opener's wrapper is `<span class="act" data-action-opener>`,** the shape More already has.
- **`--clipped` is a custom property set by `style:` on the span,** read only under the hover rule, so a screen that does not hover ignores it.
- **`.actions.over` sets no `width`.** The controls do not wrap (`white-space: nowrap`), so the span cannot shrink below their sum.

## Every host- or user-visible change, with before and after

Views: Registries Data tab, Career, and Usage. Put a pane at the width named, hover a card, and read the height against rest.

| Where | Before | After |
|---|---|---|
| Card with chips, no room for every control | Strip and "..." wrap to a new line, card grows | Over the top right corner, solid, card keeps its height |
| Card with chips, room for More and "..." but not every action | Beside the chips, with More | Over the corner, with as many actions as the line holds (ruling 2) |
| Chips that wrap | As the first row | As the first row |
| Clipped card with chips, no room | Line's start, can grow | Top, visible right edge; title's start pressable |
| Clipped card with chips, room in the visible part | After the chips | Same |
| Card with no chip | Controls flush, `gap: 0` | 6px solid gap between the last action and "..." |
| Card with no chip and room for More and "..." but not every action | More and "..." at the right | Same place, with as many actions as fit |
| Card narrower than More and "...", no chip | More and "..." wrap inside the row | One span passes the left edge, right end reachable (ruling 3) |
| Pane resized across the class change with focus on More or an action | Control removed, focus lost | Control stays, focus stays (ruling 2) |
| Usage refresh, hovering screen | Line's end or its own line | Top right corner in every state, solid; held while a press waits |
| No-hover screen, chips with room for More and "..." but not every action | Beside the chips, with More | A line of its own, with every action that fits; drawn at rest, so it does not jump |
| `docs/HELP.md:301` | "A card whose row holds nothing at rest draws the strip and "..." over its top right corner..." | "The strip and "..." stay beside the chips when they all fit, and otherwise lie over the card's top right corner, so the card does not grow under the pointer." |

## Anything in the brief that was wrong or impossible

The three cases above, as handed back and ruled. Nothing else.

- `.agents/worktrees/O121-base/` carries `unused-exports.txt` with knip's error lines from a tree with no `.svelte-kit`. The comparison still holds: `diff ../O121-base/unused-exports.txt <the run>` prints only `<` lines (the two `ERROR:` lines and `knip stopped with status 2`), so the step added no unused export.

## Limitations and sharp edges

- **No page was run.** The claim that no painted frame grows rests on ResizeObserver running before paint and Svelte flushing in a microtask, a judgment from the rendering order, not verified. The look is its proof.
- **A menu open while a pane is resized across the class change** moves the opener under the open list. bits-ui's tracking of its anchor is not verified.
- **Focus can drop on a pure width change.** A resize that sends a focused action into More by `fitActions`, with no class change, removes it, as item 1 requires.
- **`leastStrip`'s `more` argument is now always infinite** at its one caller, so its `Math.min` branch is unreachable. The ruling keeps the function unchanged. Its comment is true of the function.
- **The corner covers more titles under the pointer than a row with More beside chips did,** as ruling 2 accepts.
- **On a no-hover screen a no-chip row narrower than its controls overflows right,** since `flex-end` stands under `@media (hover: hover)` with the row it serves. The hover case is the case ruled.
- **`8px` and `12px` are written in three places** (`Card.svelte`, `CardActions.svelte`, `Usage.svelte`), mirroring `.face`'s padding, as the brief names them.
- **An action added while the widths are remembered** leaves its width unknown, so at rest `measure` sets the class from chips and goes no further until the element is drawn.
- **A chip added at rest beside no size change of the line** reaches `measure` at the next draw, in the frame's observer step.
- **The `class` starts true on a row with no chip** for the microtask before the first `measure`, on a hidden or just-drawn span, as ruled.

## Checks the spec asks for

- **History grep** over added lines, `git diff -U0 -- src docs/HELP.md | grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b"`, prints one line: `card-layout.ts`, "could still wrap off the line it shares with the chips". Judged: it says what a fractional width can do and compares with no earlier state.
- **Name grep:** `grep -n "line of its own\|line of their own\|takes a line\|take a line"` over the changed source files, after the last change, prints `CardActions.svelte:35` and `card-layout.ts:49`, each saying what a screen that does not hover does. `Usage.svelte`'s margin comment says the same across a line break, so the grep does not print it. Over the whole tree the other hits are about other things. `docs/*.md` mention this card's head only at `HELP.md:301`.
- **Reuse grep:** `grep -rn "function remember\|\bremember("` over `src tests`: no helper that reads widths.
- **Unused exports:** `sh utils/unused-exports.sh` against the base's list adds no line.
- **Identifiers:** `data-action-opener` and `--clipped` are new. `grep -rn` finds no other reader. `data-action-opener` is a presence attribute with no value; `--clipped` is at least `0px`.
- **Asynchronous paths:** `measure` runs only through `gate.current(token)`, so a run after close or a superseded one is dropped, as it was.
- **Rules unaffected:** no global, no new dependency, no catalog string, no raw colour; `--card` is a token; no library covers this.

## Comments and pages read

| Place | State |
|---|---|
| `Card.svelte` head | rewritten |
| `--card-at-rest` comment | rewritten |
| `Card.svelte` `.face` comment | rewritten |
| `Card.svelte` row-of-controls comment | rewritten, `gap: 0` gone, `flex-end` explained |
| `CardActions.svelte` head | rewritten |
| `CardActions.svelte` `.actions` lead comment | still true |
| `CardActions.svelte` margin comment | rewritten |
| `measure` | doc comment written |
| `visibleRight`, `inner` | still true |
| `RecordCard.svelte` head | rewritten |
| `Usage.svelte` head | rewritten |
| `Usage.svelte` `.act` comments | margin comment rewritten; first comment still true; a comment added on the hover rule |
| `card-layout.ts:35-49` | rewritten |
| `leastStrip`, `fitActions` doc comments | still true |
| `docs/HELP.md:301` | rewritten |

## The number of full-list runs

One run of `npm run test:quick`. `npm run diagrams` ran once, right before it. No whole-suite command ran. One red-free run; no rerun.
