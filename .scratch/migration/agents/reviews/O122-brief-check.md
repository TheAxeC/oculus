# Brief check of O122

The brief cannot go to a builder as written. Five findings must close first:
- L59 asks the builder to run pages (4.1).
- The one new test has no guarded entry (4.2).
- Spacer heights inside the zoomed box are unspecified (6.1).
- Item 2 does not say which of three correctors owns `scrollTop` (6.6).
- Nothing drops the height cache when a session changes (6.8).

Everything was read at main d0d076e6a (`git log --oneline -5`). No page was run, so behaviour in Chromium is judgment, marked as such. "Inside" means the fix corrects the brief within the step's line. "Widens" means the ruling Brief check scope applies (`orchestrator-state.md:39`).

`plan.md` has no Goal section. `grep -n "^## \|^# " plan.md` gives Plan, Steps, Could run in parallel, Rulings, Agents, Blocked. I used the step line, `plan.md:1620`. Rulings read:
- 633, `plan.md:3438`
- Q82, `plan.md:426`
- Z1104, `plan.md:3427`

## 1. Names

Commands:
- `git grep -n "TurnList\|TranscriptBody\|reader-place\|readerPlace\|turn-rows\|TurnRun" -- src tests config docs README.md ':!config/local.yml' ':!docs/diagrams/*.svg'`
- the same form for `toFoot`, `\.turns\b`, `list\.children\|children\.item\|\.children\[`, and `data-scroll`

Hits outside "Paths this step writes":

**Not made false:**
- `src/lib/views/shared/prose/Markdown.svelte:7`, and the head comment's `plain` and Copy control sentences.
- `src/lib/views/shared/prose/prose-menu.ts:2-3`, `:110-113` (`proseRead`, `box.contains(anchor)`). True while rows and spacers sit inside `list`.
- `src/lib/views/sessions/terminal/Terminal.svelte:27,82,149,318,378`. `body: { toFoot: () => void }` holds while `toFoot` keeps its signature.
- `tab-session.svelte.ts`: no hit for `list` or `.turns`; its head comment on `chosen` stays true.
- `tests/state/sessions/transcript-tab.svelte.ts:2,29`. `held.turns` is the store's field, and the comment on how the body reads stays true. This file is a test helper, not a test.
- `TimelineTurns.svelte:132,160` is a `.turns` class of another component, scoped. `tests/server/...` `.turns` hits are a route answer's field. `ticker/reveal.svelte.ts:142,158` is another list. `README.md:16,25,37` are unaffected.

**Made false:**
- `src/lib/ui/tree/list/virtual.ts:1` says "The window of a long explorer list". Brief line 100 lets the builder import it into a view, and that sentence is then false by `spec.md:72`. The path is not listed. Add it, comment only. Widens, internal, automode.

**A reader of the column the brief does not name:**
- `src/lib/shell/keys/key-dom.ts:80-88` (`scrollContainer`, whose comment names Transcript) and `:97-103` (`scrollRegion`). The latter does `scrollTo({ top: scrollHeight, behavior: 'smooth' })`, reached by `G` and `gg` (`resolve.ts:390,395`, `workbench-keys.svelte.ts:241-242`).
- No sentence goes false. The behaviour changes: `scrollHeight` is now an estimate. See 6.14.
- `src/lib/views/shared/prose/jump.ts:73-79` finds a heading only if it is in the page. See 6.16.

Inside the paths and false after the change, so owned by the step: `TurnList.svelte:2-3,18-23,48`, `reader-place.ts:12-13,43`, `TranscriptBody.svelte:136,139`, `turn-rows.ts:25-26` ("its Copy controls stand").

`docs/diagrams/layer-views.dot` and `layers.dot` have no transcript or turn hit (`grep -n -i "transcript\|turn"` printed nothing).

## 2. The step line

- A session of any size at its head keeps only turns near the view: item 1, cases 1 and 2. A run has no such limit, see 5.
- Reading place: item 2, items 3 and 4 in part, cases 3, 5, 6, 8, 15, 17.
- Older-turns load: item 4, cases 4, 5, 21.
- The Transcript's menu: item 6, case 13.
- Selection: item 5, cases 11, 12.
- Pressed runs: item 6, cases 9, 10.
- Keyboard: item 6, with case 22 for End only.

Every part has a requirement. The keyboard part has no case for Tab, PageUp, PageDown, Home, `G` or `gg`. Item 6's "links in answers" has no case either.

Item 6 says "Tab through drawn rows" while the line says "as they do now". Those differ, see 6.15.

## 3. Premises

Lines 11, 12, 13, 14, 15 (TurnRun holds no state of its own, only `$derived` `words`), 17, 19, 21 and 22 hold, by reading the files. For line 22, `grep -n` gives `docs/HELP.md:458,459`. `git grep -ln` for line 18 prints the one path. `TURN_CHARS` is at `src/lib/server/sessions/stores/turns.ts:36`.

Differences:
- Line 20: `wc -lc` now gives `719587 4409141265`, against the brief's 719439 and 4408273428. The file is `be0ac0d7-a551-4911-a072-9f76e1bbe399.jsonl`, a live transcript that grows. Nothing rests on the exact number.
- Line 16 lists part of `virtual.ts`'s exports. It also exports `sameWindow`, `offsetIn`, `DrawnRow`, `RowWindow`. `offsetIn` is what a scroll margin needs.
- Line 16 and decision 3 say VirtualRows is bound to "a tree's keys". `nav?: TreeNav` is optional (`VirtualRows.svelte:53`), and `tests/ui/tree/list/ShrinkingRows.svelte` calls it with no `nav`. What binds it is the `li` elements and the `--tree-row` probe. Decision 3 needs that reason, and `spec.md:89` (a rule exists once) will be read against a second driver of the core.
- Line 26 states as fact that the gaps and a person's margin "are part of the measured height of a row's box". On the tree they are not: `gap: 10px` is the flex gap of `.turns` (`TurnList:128`) and `margin-top` is outside the border box (`:139`). `getBoundingClientRect` includes neither. Word it as a change: each row's box holds them and `.turns` loses its gap. Or name the core's `gap` option (`index.js:289,701`), with the zoom question of 6.1.
- Line 11 omits that the same rule drops `padding-top` and the border. `.user:first-child` (`TurnList:144`) breaks either way. With a spacer as first child, the first row never matches. With spacers outside `.turns`, whichever row is drawn first matches and its height depends on the window. The brief must say the first row's look comes from data. Inside.
- Line 93: versions hold. `package.json:69` has ^3.17.11, installed 3.17.11. `npm view` gives 3.13.51 MIT and 0.54.1 MIT. "What the core already gives" leaves out `anchorTo`, `followOnAppend`, `scrollToEnd`, `scrollEndThreshold` (`index.js:293-295,1110`), which cover the same ground as reader-place and `toFoot`. `spec.md:58` requires a named library to be used for what it names, so the brief must say why the place keeping and the foot stay hand-written. Inside.

## 4. Cases and checks

**4.1 Inconsistent, must close.** L59 has the builder make a first run of every case and quote runs "on a scratch server with the fixtures". `spec.md:65` says a builder runs no page, "whatever a brief says", and `spec.md:3` says nothing in a brief overrides the file. O115's brief line 60 and O120's line 53 have the right form: cases are read, page cases are the look. L59 and L61 need rewriting so the first run is by reading, the look is the proof, and each report row names the view and state.

**4.2 Inconsistent, goes to Axel.** L59 adds a test. `spec.md:60` says a test exists only under a `guarded.md` entry, and a step needing one stops and asks. `guarded.md:3` says "A new entry needs Axel's yes. Views have no entry". `grep -n "turn-window\|O122" .scratch/migration/choices.md` prints nothing, and ruling 633 names no entry. Either a ruled entry for the pure function, or no test and the function is read. The path `tests/views/...` falls with the second.

**4.3 Wording.** L118, "fails on the unchanged tree": a new pure function in a new file cannot run there, so the only failure is at the import. Better wording: "The test imports a function the unchanged tree does not have, so its run at the base fails at that import; the report quotes that line. Nothing is removed from the changed tree to make it red." `spec.md:69` and the no-breakage rule both hold under this wording. Nothing in the brief asks to break code.

**4.4 Case 2.** "From the list itself" cannot be measured: a long task entry names no owner. Reword as no long task over 100 ms while scrolling turns already held.

**4.5 Fixtures.** "The test fixture" of 960 turns and 500 calls has no file. `git grep -l 960 -- tests` hits only a PubMed body. They appear at looks only (`plan.md:1612`, `O119-landing.md:23`). No 20000-turn fixture is named anywhere I searched, and L81 bars an unapproved script, so the brief must say where it comes from.

**4.6 Case 1 against item 1.** An estimate "from the rows measured so far" moves as rows are measured, which moves the height of every unmeasured row. The case says the column's height changes "only by the measured difference of rows". Fix when a row's estimate is taken, for example once per row. Also, `virtualizer.measure()` empties all heights (`index.js:1178-1183`), so it cannot be how a new estimate reaches the core.

**4.7 Item 1 against item 5.** "A spacer above and below" is short: a kept row far from the window needs a spacer between (`VirtualRows.svelte:238-240`).

**4.8 Item 4.** The core gives no rows at no height (`index.js:788-790,827`), so "draws what it drew" needs the last window held. `rowWindow` alone would give an empty list.

**4.9 Line 33 of the rules.** `spec.md:33` and `:89` need a base copy, and the brief names none. O120 had it at line 23. It can only be added once the worktree exists, so this is a reminder.

No case asks the builder to check a place the step does not change. L27 reads "not by child index" against `spec.md:21`'s construction; that is the brief's own prose and is not dictated.

## 5. Could this pass without the goal being reached?

Step line check: yes. "Work as they do now" has no baseline a builder can take, and row counts ignore size inside a row. The store's turns and `turnDocs`' map keep growing (decision 4), which the line's "in the page" allows.

Cases:
1. Yes. It counts rows, so one huge row passes.
2. Yes. "From the list itself" leaves out `groupTurns`, `carryChoices` and `take`, all O(n) per draw or scroll today.
3. Yes, on rows of equal height, where the estimate has no error. It needs mixed heights.
4. Yes. It asks only that rows draw and older turns load; a blank view and a lost foot flag pass.
5. Yes. "In the middle" misses the hard path: reader near the head, top row losing its head, run extended.
6. Yes, with short rows near the estimate. The appended row must be much taller.
7. Yes, and it proves nothing new. `merged` and `prepended` (`transcript.svelte.ts:199-223`) append turns and patch outcomes. In those lines no said row grows in place, so this equals case 6.
8. Yes, when the run is far above and undrawn. It needs one inside the overscan and one outside.
9. No.
10. Yes. "Draws whole" is the exception to the goal, see below. "Does not jump" has no tolerance.
11. Yes, when made by a drag alone. Shift-click over rows never drawn is the hard input, and the text must be compared with the turns.
12. No.
13. Yes in part. It should name a right-click on a spacer with a selection standing.
14. No.
15. Yes, with no append while hidden. It needs a turn arriving meanwhile.
16. Yes. Coming back to the same session hides another session's heights, see 6.8. It needs the other session's foot checked too.
17. Yes. Drawn rows measure again and undrawn ones keep heights of the old width.
18. Yes, the same way, and at zoom 1 the spacer defect does not show.
19. No, a guard.
20. No, a guard.
21. No, a guard.
22. Yes, with heights near the estimate. It needs rows far from it, and `G`.

Items:
1. Yes, at zoom 1 (6.1).
2. Yes. `hold` runs on `draw` (`TranscriptBody:182-204`). A measured height is no `draw`, so the core's own correction could pass the case alone.
3. Yes, with close estimates.
4. No.
5. Yes. The pure function passes with nothing wired to `selectionchange`; only the look shows it.
6. Yes. Most of it has no case.
7. No.

Case 10 and decision: `runOpen` opens a run with a failed call by itself (`turn-rows.ts:168`), so a long run with one failure stands whole in the page with no press. This is not listed under Decisions. If "a session of any size" is meant strictly, Axel should see it. Widens if changed; as a sentence it is inside.

## 6. Implied inputs

All are inside the line's "as they do now" unless marked. Each is missing from Cases or from the requirements unless stated.

1. **CSS zoom against offsets.** Heights are in box pixels, but a spacer inside `.turns` carries `style:zoom`, so `height: Xpx` draws X times zoom. Expected: a spacer draws its box-pixel height (divided by zoom, or standing outside the zoomed box), and `scrollHeight` equals the rows' sum within a pixel. Case 18 covers it only by name. `transcriptZoom` returns size over body font, so 1 is not the normal value. Judgment, not verified: a one-line row may fire no ResizeObserver on a pure zoom change, so `retakeZoom` must ask for a measure. Rects are fractional and the core has no threshold (`delta !== 0`, `index.js:915`).
2. **`.older` as scroll margin.** `.older` lives in `.chat` above `.turns`. ContextMenu's wrappers are `display: contents` (`ContextMenu:187`), and the `.chat` observer (`TranscriptBody:216`) does not fire, so the VirtualRows approach sees no change. Expected: the margin is read again when `held.older` or `olderError` changes, in box pixels (`offsetIn`). Low cost if missed, since overscan hides it (judgment).
3. **Key changes at the top.** `prepended` can extend the top run, so its `first` falls, the old key is orphaned and a new row starts on an estimate. `hold` then uses `below`, built on an estimated `scrollHeight`, and the row measures afterwards. Expected: reader on that run, words within 1 px after the measure. Case 5 does not reach it.
4. **Markdown height after mount.** `img` is allowed (`html.ts:91`) and Copy controls mount in an effect. The core skips a correction on re-measure in a backward scroll and for a row spanning the fold (`index.js:926-934`). Expected: an image loading in a row above the view while scrolling up moves no words. Item 1 should also say ResizeObserver stays the trigger and only the value comes from `getBoundingClientRect`, through the `measureElement` option (`index.js:246`). The default rounds `borderBoxSize` (`:134-141`).
5. **State lost on unmount.** `overflow-x: auto` on code and tables (`Markdown:321,370`) loses `scrollLeft`, and `details` is allowed (`html.ts:80`), so an opened block closes and its height changes. Item 5 covers only the Copy control. Expected: named as draws-as-new, or kept. User-visible, so a decision.
6. **Scroll anchoring.** Three writers on `scrollTop`: Chromium's anchoring, the core's `applyScrollAdjustment` (`index.js:960,1191-1215`), and reader-place. `reader-place.ts:12-13` says anchoring can stand because the correction is absolute, and the core's correction is written against its cached offset. Expected: the brief names one owner, turns the core's off through `shouldAdjustScrollPositionOnItemSizeChange` or leaves reader-place out of it, and sets or keeps anchoring on purpose. `overflow-anchor: none` has a precedent at `StatusBar.svelte:397`. Which one works: not verified, needs a page.
7. **Effect cycle.** `virtual.ts:36-40` records the endless run; it needs `rowWindow(virtualizer, held)` and a stable keep list. Also `VirtualRows:100-104`: a list that shrinks must not be read past its end. `merged` with `from` 0 replaces the list. Expected: opening a run or a selection settles after one draw, and a list replaced by a shorter one reads no row past its end.
8. **Session change.** `first` numbers repeat across sessions and the component outlives its target (`TranscriptBody:98-102`). `merged` from 0 resets `above`, so a key can name another turn even in one session. Expected: heights dropped with the target as `docs.clear()` does, and on a read from the start.
9. **Row index attribute.** The core reads `data-index` when a ResizeObserver entry arrives (`index.js:231,841`). A read of older turns shifts every index while the keyed elements stay. A stale value hands a height to another key, against item 1's "moves no measurement". Expected: `data-index` refreshed at each draw.
10. **First draw with nothing measured.** Item 1 gives no seed. An estimate of 0 puts every row in range. Expected: a seed above 0.
11. **Hidden tab.** Rows at no size must keep their heights; `measureElement` must return the held value. Covered by item 4's words, with no mechanism named. Case 15 reaches it.
12. **Selection ends with no row key.** An end in a spacer, on `.turns`, in `.older` or outside the list, and Cmd+A: `git grep selectAll` hits only the terminal grid, so it is the browser's. Today Cmd+A then Cmd+C carries every turn. After the step it carries the drawn rows, the silent partial Copy decision 5 forbids. Expected: the pure function's table covers a missing end, a backward selection, a key gone and a collapsed selection. Cmd+A is treated as head to foot, or stated as a limit. User-visible, so a decision. Option (a) draws every held row while it stands, as decision 5 already accepts. Option (b), leaving it, is the lazy option.
13. **No row at the view's top.** A fast drag leaves the view in a spacer, and `take` then finds the wrong row or none. Expected: nothing taken, and the words do not jump on release.
14. **`G` and `gg`.** Smooth scroll to an estimated `scrollHeight`. A write to `scrollTop` during it may cancel it (judgment). Expected: `G` reaches the true foot. `key-dom.ts` may need to widen if the view cannot do it alone.
15. **Tab past the last drawn focusable.** With no focusable in the margin, Tab lands in the steer box and skips the rows. Expected: stated as a change to Help, or handled. User-visible.
16. **A `#fragment` link** to a heading in an undrawn row does nothing (`jump.ts:73-79`). In the same answer it still works. Expected: stated.
17. **`held.error`** unmounts TurnList (`TranscriptBody:271`). If the virtualizer lives there, its heights go. Expected: the state lives in the body, so a transient error keeps them.

## 7. ADRs

None. `ls docs/adr` prints `No such file or directory`, as the brief says.

## 8. Dictated text

The brief dictates no line to write into the tree. L32 states what `docs/HELP.md` must say, not its words. The only quoted output is L126 ("Everything in the brief is done"), `grep -n` line 126; it holds, it is `spec.md:84`'s wording. `LC_ALL=C grep -n '[^ -~]'` over the brief printed nothing.

## Declined to judge

- Chromium's behaviour on zoom and ResizeObserver, whether the three correctors double a correction, and whether smooth scroll is cancelled: no page was run.
- Whether the new test should exist: that is Axel's ruling (4.2).
- Whether a second driver of the core is right against widening VirtualRows, beyond noting that decision 3's reason is wrong as written.
- The right overscan margin.
- Whether a fragment link to another answer happens in practice.

## Closed

Open at the stop: 4.2, 6.5, 6.12, 6.15, 6.16 and the run with a failed call (section 5) go to open item 634, with 4.5's fixture. Every other finding closes in the brief when `/spec` runs again after the ruling.

Closed in the brief after ruling 634:
- 1 (`virtual.ts`), `key-dom.ts`, `jump.ts`: added to the paths; items 2, 6, 9.
- 3: premises rewritten, gaps and first row from data (item 3); Line 20's byte count dropped; decision 3's reason corrected; item 5 says why the place and foot stay hand-written.
- 4.1: the first run is by reading and the look is the proof. 4.2: entry G149. 4.3: verify 3 reworded. 4.4: case 2 reworded. 4.5: fixtures named at the head of Cases. 4.6: estimates taken once per key (item 3). 4.7: gaps between kept rows (item 2). 4.8: item 7. 4.9: base copy line.
- 5: cases sharpened with mixed heights, hard inputs and tolerances; an open run stays in the window (item 1).
- 6.1 item 3 and decision 5. 6.2 item 7. 6.3 fifth case. 6.4 item 3 and the image case. 6.5 item 9. 6.6 item 5. 6.7 item 7. 6.8 item 4. 6.9 item 3. 6.10 item 3. 6.11 item 7. 6.12 item 8. 6.13 item 5. 6.14 item 6 and decision 6. 6.15 and 6.16 item 9. 6.17 item 2.

Usage: a8777c66a67dd93a3, claude-opus-5-5, 220297 tokens, 30 tool uses, 9 min 31 s.
