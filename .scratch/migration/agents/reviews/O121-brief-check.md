# Brief check of O121, repository /Users/axelfaes/workspace/oculus, main at d0d076e6a

Nothing was changed. `git rev-parse --short HEAD` prints d0d076e6a, and `git status --short -- src docs tests config` prints nothing. No page was opened, so every statement about browser timing below is a judgment from the code and the rendering order, marked as such, and not verified by a run.

The findings that should change the brief before dispatch:

- F1: `card-layout.ts` is missing from the write list (check 1).
- F2: the first-hover case and the stale flag (checks 4, 5, 6).
- F3: the pane-widened case cannot hold as worded (check 4).
- F4: the double offset on a row with no chip (check 6).
- F5: the `fitActions` guard on a room at or below zero (check 6).
- F6: `data-card-control` on Usage's `.act` has no reader (check 2).
- F7: a comment in `Card.svelte` is not named by item 6, and a declaration goes dead (check 1).
- F8: the top-left place covers the title's start (check 6).

## 1. Names

Commands, each with `--exclude`-equivalent handling of `config/local.yml`:

- `git grep -n "card-at-rest\|data-card-control\|card-control" -- src tests docs README.md config ':!config/local.yml'`
- `git grep -n "\.menu\b\|class=\"menu\"" -- src tests docs README.md`
- `git grep -n "class=\"act\"\|class:held\|^\s*\.act\b\|\.act\.held" -- src tests docs`
- `git grep -n "class:start\|class=\"start\"\|\.actions\.start" -- src tests docs`
- `git grep -n ":global(\.actions\|:global(\.menu\|:global(\.start\|:global(\.act\b" -- src`: prints nothing
- a wording grep for "line of its own / their own" and "opener" over `src`, `docs` and `config`

Hits outside "Paths this step writes":

- **`--card-at-rest` and `data-card-control`:** every hit is in `Card.svelte`, `CardActions.svelte`, `RecordCard.svelte` or `Usage.svelte`, all on the write list. Nothing is outside it. There are no hits in `tests`, `docs` or `config`.
- **`.menu`:** `src/lib/views/sessions/session-list/SessionWorkspace.svelte:191,326` is its own scoped class. `Source.svelte:404` is `appShell.menu(`, unrelated. Neither is made false.
- **`.actions`:** `PaneStrip`, `ScheduleList`, `NoticeEntry`, `GroupHead`, `TreeActions`, `TerminalRows` and `TerminalList` each have their own scoped class. None is `:global`. None is made false.
- **`.start`:** `TerminalStart.svelte:36` and `Gutter.svelte:62` are unrelated. Not made false.
- **`.act`:** `Ticker`, `TerminalRows`, `FileHeader`, `RepoMessage` and `Audit` each have their own scoped class. Not made false.
- **`data-action`:** `RailFoot.svelte:27,30` is unrelated.
- **`src/lib/views/shared/card/card-layout.ts` (F1, made false):**
  - Line 36, "could still be pushed onto a line of its own": false on a screen that hovers.
  - Line 40, "whether that is a line of their own": false on a screen that hovers.
  - Lines 44-48, "otherwise they take a line of their own, the whole visible line": false on a screen that hovers, since `alone` now also means the span lies over the face.
  - Lines 44-46, "`least` the narrowest strip of use: every action, or More alone": false once `measure` hands in the opener and its gap as well, if `least` is what it adds them to.
  - The file is not on the write list, and item 6 does not name it. Spec line 72 makes a false sentence a defect of the change. Add it to "Paths this step writes" and to item 6, comments only.
- **`src/lib/views/academic/career/CareerCard.svelte:7-8`** ("a card with none has its controls over its top right corner"): stays true.
- **`src/lib/views/shared/card/project/ProjectCard.svelte:18`** ("then the "..." opener of the menu"): stays true, the order is kept.
- **`src/lib/views/shared/card/record/record-menu.ts:2`:** stays true.
- **`src/lib/views/shared/card/card.ts:24`** ("record/CardActions.svelte draws the strip"): stays true.
- **`src/lib/views/system/gallery/Gallery.svelte:24`:** stays true.
- **`docs/HELP.md:344`** (Usage: "stays shown on its card, turning"): stays true, on a listed path anyway.
- **`docs/HELP.md:466`** ("take a line of their own"): the Kill control, unrelated.

Inside the write list, but not named by item 6 (F7):

- `Card.svelte:273-282`, the comment over the `@media (hover: hover)` rule, says "No gap, so no slit of the title shows between two controls". With one span the row has one child, so that sentence is false.
- `gap: 0` at line 290 acts on nothing after the change.
- The comment at line 220 ("a meta row laid over the card") stops being the whole reason `.face` is positioned.
- Item 6 names only the head comment and the `--card-at-rest` comment of `Card.svelte`. Its second sentence covers only "a line of their own". It should name lines 220 and 273-282, and `gap: 0` should go.
- Inline comments also caught by that second sentence: `CardActions.svelte:203-205` and `Usage.svelte:379-381`, the latter beside the named comment.

## 2. The step line

`plan.md` has no Goal heading (`grep -n "^## " .scratch/migration/plan.md` prints Steps, Could run in parallel, Rulings, Agents, Blocked). Its preamble, lines 1-3, stands as the goal. The line of O121 is line 1619.

| Requirement of the line | Part of "What to build" |
| --- | --- |
| A card whose chips leave no room for its strip and menu opener | Item 1 (one element, opener counted in the need), item 2 (`place.alone`) |
| Keeps its height when they are drawn | Items 2 and 4 |
| Under the pointer, the keyboard cursor, focus or an open menu | Item 4, which also names "at rest" |
| At every card width | Item 4; the clipped placement of item 2 |
| In the shared card | Items 1 and 2 in `CardActions` and `RecordCard`; item 5 for `Usage`, the other reader of `--card-at-rest`, which ruling 633's "a card's chip row that grows under the pointer" reaches though the line's "strip and menu opener" does not |

Every requirement is present.

Parts with no requirement:

- **`data-card-control` on Usage's `.act` (F6).** Its row always holds `<Tag label={account.tool} />` (`Usage.svelte:194`), and Tag draws a `<span class="tag">`. So `.meta:not(:has(> :not([data-card-control])))` never matches that row, and `Card.svelte:284,294` is the only reader of the attribute. The attribute does nothing unless a new rule reads it, and the brief names none. Either drop it, or name the rule that reads it. As written a builder must also write the corner rule in `Usage.svelte`'s own style, which is what decides the behaviour.
- **Item 3 (controls that fit stay).** It is no requirement of the line. It is the brief's Decision 2, kept.
- **Item 6** comes from spec line 72, not from the line, and is rightly there.

## 3. Premises

- **Base:** `git log --oneline -3` shows d0d076e6a at head. Holds.
- **`Card.svelte`:** `.meta` at 259-265, the hover rule at 283-298, `.face` at 222-227. Holds.
- **`RecordCard.svelte:282-303`:** the meta snippet is at 284-302, and 282-283 are the slot and the Card. The range is two lines wide on each side; the content holds. `.menu` at 358-363 holds. It reads `--card-at-rest` at 359.
- **`CardActions` drawn in one place, line 288:** `git grep -n "CardActions\b" -- src tests` confirms. The other hits are as the brief says, plus `card.ts:24` and `Card.svelte:274` comments. Holds.
- **`CardActions.svelte` `measure`:** lines 87-112, and `start` at line 111, as quoted. `actionPlace` at `card-layout.ts:50`. Holds. One wording: `.actions.start` drops the margin, but the strip wraps because it does not fit (`flex: 0 0 auto` in a wrapping row, line 207). `.start` is not the cause of the wrap. A reader is not misled about the outcome.
- **A wrapped row sums past the line:** `others` sums every child (lines 101-105). Holds.
- **`actionPlace`, `leastStrip`, `fitActions` used only by `CardActions.svelte`:** `grep -rn` over `src`, `tests`, `docs` and `README.md` shows only `CardActions.svelte:41,109,110` and the definitions. Holds.
- **`Usage.svelte:193-205`:** the snippet runs 193-219, the Tags 194-207, the control 208-218. `.act` is at 377-384, not 378-384. Off by small amounts; content holds. Only other reader of `--card-at-rest`: `git grep -n "card-at-rest\|data-card-control" -- src tests docs` shows `CardActions`, `RecordCard`, `Usage`, `Card`. Holds. Held drawn: lines 209 and 386-388. Holds.
- **`docs/HELP.md:301`:** `grep -n` prints 301. Holds.
- **No test reads `data-card-control` or the strip's class:** `git grep -n "card-control\|\.actions\b" -- tests` prints two lines, not nothing: `tests/state/system/apps/shell.test.ts:120` (`options?.actions`) and `tests/views/sources/source/latex-keys.client.test.ts:86` (`made.value.actions()`). Neither reads the strip. The premise holds in substance, but the brief's command does not print empty, and it should say so.
- **`docs/adr` absent:** see check 7.
- **`docs/glossary.md`:** the report part "The terms" names it, and `ls docs/glossary.md` prints "No such file". The same line stands in the O120 brief. Repoint it or say none exists.

## 4. Cases and checks

- **Case "A pane widened while the pointer is on a covered card ... the card's height does not change" (F3):** this cannot hold as worded. Widening a pane reflows the title, the body and a wrapped chip row, so the height changes with no fault of the controls. Item 4's form is the right one: the height equals that card's height at rest at the new width.
- **Case "The first hover ... sampled per animation frame, no frame shows a greater height" (F2):** see check 5. As a measurement it does not say what item 4 says.
- **The "first run" of every case on the unchanged tree** is consistent with spec lines 65 and 67, since the brief says the cases are read and the look measures.
- **Spec line 36 and the report path:** spec line 36 ("You never edit anything under `.scratch/`") stands against the brief's report path `.scratch/migration/agents/reviews/O121-report.md`. It is the standing practice of O120's brief too (line 66). Named only so it is not read as new.
- **Worktree and base copy:** spec lines 32-33 and 89 want a worktree, a base copy and the base's unused-exports list named in the brief. O120's brief carried a "base copy" line (line 23), and O121's has none yet. `/spec` creates the worktree after this check, so they are owed before dispatch, not a defect now.
- **Read list (F9):**
  - `docs/HELP.md` is written but is not in the "Read" list, and spec line 8 says the listed files and only those.
  - `card-layout.ts` lines 40-65 stop short of `fitActions` at lines 92-108, whose `room <= 0` guard matters (check 6, F5). Widen to 92-108.
  - `Usage.svelte` "lines 186-240" leaves out the head comment at lines 27-30, which spec line 72 asks to re-read.

Cases that check a place the step does not change: "A menu opened from ...", "A right-click and the context menu key" and "Tab through" exercise `Menu.svelte` and `ContextMenu.svelte`, which are not changed. Each is a fair regression case, because the DOM under them changes (snippet opener inside the span). I read both:

- Menu is on a Portal (`Menu.svelte:197`), placed against the button, so a span with solid paint and `position: absolute` does not cut it off.
- ContextMenu wraps `face` with `display: contents`.
- DOM order keeps Tab order.

"A `Card` inside a `Card`": a grep for "card inside" and "inside another" found no site in `src`. `Card.svelte:140` claims the property. The brief should name a place to see it or the case cannot be looked at.

## 5. The question: could it pass without the goal being reached?

Verify list:

1. `npm run test:quick`: yes, it can pass. The brief adds no test and no test reads these files' layout.
2. ASCII: yes, it says nothing about the goal.
3. `git diff --stat -- config tests`: yes.
4. No test added: yes.
5. Reading against the standards: yes.

So the only thing that can fail the goal is the look on landing, and the brief gives it no states beyond the cases. The O120 booking says "A narrow card and a chip row that wraps were not seen" (`plan.md`, O120 Booked line). The brief should list for the look: the view, the widths, the chip counts and how a frame is sampled.

The plan's line: it holds no separate check, and "at every card width" is proved only by samples. A look at one narrow width could pass while the boundary fails. The widths that matter are the two sides of the width where `alone` flips, and the width where the chips start wrapping.

Cases:

- **One chip and room:** yes, it passes on today's tree. It is a control, not a proof.
- **Too narrow:** no, if the height is read in all five states after settling. It says nothing of the transient.
- **A wrapping row:** as above.
- **First hover, per animation frame:** it could both pass without the goal and fail with the goal met. `requestAnimationFrame` callbacks run before the style, layout and ResizeObserver step of a frame. A height read there forces layout with `:hover` already applied, and reads the card before `measure` has run, though that layout is never painted. Whether the sampler sees it depends on whether the pointer event landed before or after that frame's callback. So a correct build can print a greater height, and the same build can print none. Judgment from the HTML rendering order, not verified by a run. See check 6 for the fix.
- **Pane widened:** it fails as worded (check 4).
- **Clipped card:** no, if read under the pointer at a real clip.
- **No chip:** yes, it passes without touching the chip case. It is a regression case.
- **Narrow card with three actions:** can pass at a width where the three fit. It needs a width where they do not.
- **Menu on a covered card:** passes on the portal alone. It is a regression case.
- **Right-click, Tab:** regression cases.
- **`Card` inside `Card`:** can pass by not being tried, since no site is named.
- **No hover:** cannot be reached by a pointer in desktop Chrome without media emulation. The brief should say how the look puts the page in that state, or it passes by not being seen.
- **Wallpaper and rice:** no, if the span is seen over title words.
- **Usage:** no, if read at a narrow width with a press pending.

Items of "What to build":

- **Item 1:** can pass with the opener counted in `least` and left out of the `fitActions` room. The strip then passes the edge by the opener's width. The brief's "in what the strip needs" does not name both uses. Say both.
- **Item 2:** can pass for a stale flag only after a measure (check 6).
- **Item 3:** no.
- **Item 4:** the sentence is the goal; its proof is the look.
- **Item 5:** can pass without the attribute doing anything (F6).
- **Item 6:** can pass with `card-layout.ts` and `Card.svelte:273-282` left false (F1, F7).

## 6. Implied inputs

Your three questions first.

**Can `measure` flip the span before paint on first hover?** Yes, by reading, for what is painted. Judgment, not verified by a run. The reasoning:

- At rest `measure` returns at `CardActions.svelte:91`.
- On hover the observed span goes from 0 to its size, so the ResizeObserver delivers in that frame's layout step, and `wanted` calls `measure` synchronously.
- The `$state` writes go through `Batch.ensure`, which calls `queue_micro_task` (`node_modules/svelte/src/internal/client/reactivity/batch.js:915-927`, Svelte 5.57.1). That flush runs in the microtask checkpoint after the observer callback.
- The browser lays out again before painting. Electron 44 (`package.json:46`) and Chrome both follow that order.

The flip costs two things:

- A forced read before the observer step sees the grown card (F2).
- The line's height changes back in the same frame at a depth the observer's second pass does not gather, so the browser raises "ResizeObserver loop completed with undelivered notifications" on `window`, and delivers the line next frame. `git grep` finds no window `error` handler in `src` or `bin`, so nothing reacts to it, but a console read at the look may show it.

The next frame's `measure` gives the same values.

**Stale flag (F2).** `measure` cannot run at rest, so `over` is false at load and stays as it was after a pane is narrowed at rest. Both cases in the brief's first-hover line take the transient layout. Expected result, and the fix I judge better:

- The flag starts over-the-card until measured, so an unmeasured span cannot wrap.
- `measure` runs at rest from the remembered widths (`widths`, `moreWidth`, the opener's width) in place of returning at line 91, once they are known.
- The line then never changes height in any layout, the frame sampling becomes exact, and the observer error goes.
- Moving back to the flow beside chips cannot grow the card.

If the brief keeps the flip, it should reword the case to what is painted and name a sampler that reads after paint.

**Is the flag stable once the span leaves the flow?** Yes. Nothing `measure` reads depends on it: `line` is still `node.parentElement`; `inner(line)` and `visibleRight` read the row and its clips; `others` holds chips only; `sizes` are button widths and do not shrink (`white-space: nowrap`, `ToolButton.svelte:151`, `MenuOpener.svelte:137`). There is one single step and no loop: `more` is `max(sizes)` until More is first drawn (line 108), then the real width, which can move `least` once. No scrollbar loop either, since neither state grows the card.

**Does the O120 rule for a row holding only controls work with one span?** Yes. The row's only element child is the span, so `Card.svelte:284` matches and line 294 paints it, `:has` seeing it whatever its display. One visible change for the before and after: O120's row drew strip and opener flush (`gap: 0`); the span's own `gap: 6px` now stands between the last action and "...", painted solid.

Other inputs missing from Cases, each with its expected result:

- **A row with no chip and `place.alone` (F4).** A card or a clip narrower than the strip and opener sets the flag on a span whose containing block is the absolute `.meta`, not `.face`. `top: 8px; right: 12px` then adds to the row's own offsets, 16px and 24px from the face. Expected: the O120 rule alone places it, and the flag does not apply when `others` is 0. A cheap condition, and a case the brief's "A card with no chip" does not reach.
- **A room at or below zero (F5).** `fitActions` reads `room <= 0` as "not measured" and keeps every action (`card-layout.ts:99`). Once `measure` takes the opener and gap from the room, a visible line under about 27px (opener 20 plus gap 6 plus slack 1, from the 20px controls of the `CardActions.svelte:203` comment and `gap: 6px`) gives that, and all three actions draw. Expected: every action into More, and the unmeasured case kept apart. "`fitActions` keep their behaviour" means `measure` must guard it.
- **A card with an opener and no strip action (`strip` empty, `every` not empty).** `sizes` is empty and `leastStrip` returns 0. Expected: the need is the opener alone, no gap counted, and the opener stays last at the line's end. Today the empty strip span takes the `margin-left: auto`, and that stays true of one span.
- **A clipped card's title (F8).** At `left: 12px` the span covers the start of the title, where a short title lies, so under the pointer the title's press is taken whatever its length. Decision 4 covers only a long title's corner. Expected: this is stated as a decision. Enter on the keyboard cursor still opens it (`key-dom.ts:70`), and the page action is in the menu. Alternative: the span lies at the visible right edge, by a measured offset, which keeps the title's start pressable.
- **A pane scrolled sideways.** `visibleRight` reads only the right edge (lines 75-85), so a card scrolled partly left reads as clipped and goes to `left: 12px`, which is then out of view. Expected: the controls stay where they can be pointed at. The flow form has the same fault, but the brief's sentence says "stays where it can be pointed at".
- **A card narrower than opener plus More.** The span cannot fit, and with `right: 12px` it passes the left edge. Expected: stated. It is a width "at every card width" reaches.
- **A menu open while the pane is resized across the flip.** The opener moves under an open list. Expected: the list follows its opener, or the case is said. Judgment: Floating UI's tracking in bits-ui covers it, not verified.
- **Focus on a control across the flip.** `class:` keeps the element, so focus stays. Expected: stays. Holds only if the builder does not redraw the span by `{#if}`. Say "a class".

## 7. ADRs

None exists. `ls docs/adr` prints "No such file or directory", exit 1.

## 8. Dictated text

The brief dictates no sentence, comment or catalog line for the builder to copy. It dictates values and names:

- `top: 8px; right: 12px`: `grep -n "top: 8px\|right: 12px" src/lib/ui/frame/Card.svelte` prints 286 and 288. Holds, and it equals `.face`'s padding at line 226.
- `left: 12px`: line 287. Holds.
- `var(--card)`: lines 146 and 295. Holds; a token, under spec line 51.
- `data-card-control`: `Card.svelte:284,294`. Holds as a name. See F6 for its use on Usage's `.act`.
- `place.alone`: `card-layout.ts:41`, `CardActions.svelte:111`. Holds.

## Declined to judge

- Whether Decisions 1 to 4 are the right design calls. I named only the input Decision 4 does not reach (F8).
- Whether the corner should hold every card's controls (Decision 2): the fixed-corner design would have no flag and no transient, but choosing it is a user-visible ruling and not this check's.
- Exact Chromium behaviour of the rAF sampler and the observer error: judged from the rendering order and read from the code, not run.
- Whether the bits-ui tracking follows a moved opener, not read in its source.
- The overlap of O121's paths with O122's brief, which runs in flight beside it (`orchestrator-state.md` dispatch block): not asked and not read.

## Closed

- F1: `card-layout.ts` added to the paths and item 6, comments only.
- F2: the class stands until a measurement says otherwise and `measure` runs at rest from remembered widths (item 2), so the line never changes height.
- F3: the pane-widened case reworded.
- F4: a row with no chip never takes the class (item 2); a case added.
- F5: `measure` guards a room at or below zero (item 1); a case added.
- F6: Usage's `.act` takes no attribute; the rule is in its own style (item 5).
- F7: item 6 names the comments, and `gap: 0` goes.
- F8: a clipped card keeps the controls at the visible right edge (item 2, decision 5).
- F9: the read list widened; the premise on the test grep corrected; the glossary line dropped, since the file does not exist; the look's views and widths named; the card-in-card case dropped, since no site draws it; the no-hover case read from the rules.

Usage: abcec94ed2b1de5b4, claude-opus-5-5, 192629 tokens, 20 tool uses, 8 min 23 s.
