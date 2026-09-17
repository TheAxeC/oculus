# Q49, refuted

## Verification

Run from `tools/oculus` in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q49`, with `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin` first on PATH.

```
npx vitest run --reporter=dot
 Test Files  251 passed (251)
      Tests  4248 passed (4248)
   Duration  69.54s
```
One run, no timeout, so no test was rerun alone.

```
npm run check
1789685693487 COMPLETED 1222 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

```
npm run lint
(no output)
```

```
npm run format:check
All matched files use Prettier code style!
```

```
LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name glyphs.yml)
(no output)
```

```
npm run build
  done
```

```
npx playwright test tests/browser/focus-buttons.spec.ts tests/browser/focus-look.spec.ts tests/browser/cards.spec.ts tests/browser/focus-drag.spec.ts
  25 passed (54.8s)
```

`git status --short` in the worktree lists the three files of the step and nothing else. Nothing in the worktree or the main checkout was changed by this review; every probe, clone, revert and screenshot is under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q49-review/`.

## Spec

**1. `src/lib/ui/Ticker.svelte:89-106`. Brief item 1's "The `kept` button keeps its place as it does today" is not met, and the report's table marks item 1 DONE.**

```svelte
{@const held = row.actions.find((action) => action.id === keep)}
{@const hidden = row.actions.filter((action) => action.id !== keep)}
```

The kept button is rendered after the group, so it is last in every row, at every width. Measured in my own clone by building the base component (`git show 2ac73578:tools/oculus/src/lib/ui/Ticker.svelte`) and the delivered one and reading the drawn order off the served board at 1600:

| | drawn order of a task row's buttons | index of `kept` |
| --- | --- | --- |
| base | `["doing","done","dropped","1w","1mo","hide"]` | 1 |
| delivered | `["doing","dropped","1w","1mo","hide","done"]` | 5 |

The report's judgment call 1 says the kept button "moves to the row's end in a row with spare width" and that in the narrow case "it is the same place". Neither half holds: it moves from second to last in the markup, in every row that keeps a button, at every width.

**2. `src/lib/ui/Ticker.svelte:231-241`. Brief item 2 asks for the buttons "over the right end of the row". They are drawn across the whole row and out of its left edge, well above the one width the report measured.**

```css
        .reveal .rest {
            width: 0;
            margin-left: calc(var(--act-gap) * -1);
            justify-content: flex-end;
        }
```

Distance the leftmost revealed button starts left of the row's left edge, seven-button row, measured on my own served build:

| window | past the row's left edge |
| --- | --- |
| 1600 | 0 px |
| 900 | 67.20 px |
| 760 light | 0 px |
| 760 mocha | button left at 49.53 px against a rail about 96 px wide |
| 480 | 104.20 px |

The report names only "a 480px window (row 320px, group 424px)".

**3. `src/lib/ui/Ticker.svelte:231-241`. Brief item 2's "a name too long for the row is cut by the row's own rule, not by the buttons" holds at rest and fails under the pointer, which is the state the item describes.** How much of the name the revealed buttons cover, same build:

| window | name width | name clipped at rest | covered | fraction |
| --- | --- | --- | --- | --- |
| 1600 | 301.09 px | no | 38.09 px | 12.7% |
| 900 | 301.09 px | no | 301.09 px | 100% |
| 760 | 301.09 px | no | 145.09 px | 48.2% |
| 480 | 294.50 px | yes | 294.50 px | 100% |

Base, same rows, same widths: covered 0 px on every row.

## Proof

**1. `tests/browser/focus-buttons.spec.ts:186-193`, the case the report quotes as the proof of item 2, is pinned to the one viewport where its assertion is true.**

```ts
        expect(ends.right, 'a button is past the end of the row').toBeLessThanOrEqual(0.5);
        expect(ends.left, 'the buttons are drawn from the start of the row').toBeGreaterThan(0);
```

The describe above it is `test.use({ viewport: { width: 760, height: 900 } })`. `ends.left > 0` is the assertion that the buttons stay inside the row. At 900 it is -67.20 and at 480 it is -104.20, both measured above, and the case never runs at either. A check that would not go red if the risk it names is real.

**2. `tests/browser/focus-buttons.spec.ts:134-206` proves the name's width and the buttons' position at 760 only, and the report's DONE rows for items 1 and 2 cite no other width.** Every number in the report's measurement table is a 760 number.

## Standards

**1. `src/lib/ui/Ticker.svelte:227` states something the change does not do.**

```
       so the buttons appear where the row ends and never over a name with room to spare.
```

At a 1600 px window the row is 707 px, the name is 301.09 px and is not clipped, and the revealed buttons cover 38.09 px of it. The tail reads "event 55d ago" at rest and "event 5" under the pointer (`shots/light-1600-hover.png`).

**2. `src/lib/ui/Ticker.svelte:13-14` states something the change does not do.**

```
    // nothing: the hidden ones sit in a box of no width at the row's end and are drawn over that
    // end.
```

At 900, at 760 in the mocha theme and at 480 they are drawn from outside the row's left edge, over the activity rail.

**3. The report's proposed `DESIGN.md:336` replacement carries the same false clause**, "so a name is cut by the row's width alone and the buttons are drawn over the row's end". Landing it as written puts finding 1's sentence into the design. The `HELP.md:75` replacement carries "drawn over the end of the line", with the same problem. Both quoted source lines match the tree byte for byte (`sed -n '75p' HELP.md`, `sed -n '336p' DESIGN.md`).

**4. The report's second sharp edge rests on a mechanism the tree already has.** It says masking the gaps "would need a surface token behind it, and under a wallpaper that strip would have to be translucent and would show the name through it anyway". `tests/ui/wall.test.ts:119` already lists

```ts
    'src/lib/ui/Ticker.svelte .act': 'a control, pressed to run what it names',
```

which is that file's way of keeping a surface solid under a wallpaper with a stated reason. The dismissal is not supported by the tree's own rule.

## Behaviour

**1. The invisible buttons are live over the visible end of the name before the pointer arrives, and a touch tap there writes to a manifest.** With the pointer parked at (2,2) at 1600, `document.elementFromPoint` at the name's right edge minus 4 px returns

```
{"nameText":"Poster: robust embeddings under shift event 5","opacityOfThatButton":"0","landsOn":"BUTTON.act:planned"}
```

On a context that answers `matchMedia('(hover: hover)').matches === true`, a touch dispatched at that point through CDP `Input.dispatchTouchEvent` produced a click whose target was `BUTTON.act:upcoming`. Base, same point: `SPAN.tail:event 55d ago`. A touchscreen laptop answers `hover: hover`, so a tap on the last word of a row name sets a status on a project. The report's first sharp edge names only "while the row is under the pointer".

I also built the obvious guard in my clone (`pointer-events: none` on `.reveal .rest`, `auto` on `li:hover`/`li:focus-within`): the at-rest hit target does become `SPAN.tail` again, the touch tap still reaches `BUTTON.act` because the dispatch raises hover first, and two existing cases of `tests/browser/focus-buttons.spec.ts` go red. The report's reasoning about that guard is reproduced; the touch case it leaves open is not in the report.

**2. At 480 one revealed button cannot be pointed at at all.**

```
REACHABLE 480: [{"label":"planned","left":25.8,"pointable":false},{"label":"completed","left":89.2,"pointable":true},...]
```

`pointable` is `document.elementFromPoint` at the button's own centre returning the button. For `planned` it returns the activity rail's control. Not in the report.

**3. The keyboard's first stop inside a row lands on that unreachable button, with its focus ring behind the rail and no scroll into view.** After a real `Tab` from the row's name:

| window and theme | focused button | its left | on top at its own centre | window.scrollX |
| --- | --- | --- | --- | --- |
| 900 light | planned | 62.80 | false | 0 |
| 760 mocha | planned | 49.53 | false | 0 |
| 480 light | planned | 25.80 | false | 0 |

The ring is `outline: rgb(0, 95, 204) auto 1px` and is painted under the rail. Nothing scrolls because the box is inside the viewport. `shots/light-900-tab.png` shows the ring as a two-character stub at the rail's right edge. Not in the report.

**4. The buttons leave their pane and draw over the activity rail's headings and controls.** `shots/light-480-hover.png`, `shots/light-900-tab.png` and `shots/mocha-760-hover.png`. The report gives the 104.20 px figure and does not say what it is drawn over.

**5. Under the pointer the row's name can be entirely invisible, so the reader cannot see which row the buttons belong to.** 100% covered at 900 and at 480 light, and at 760 in mocha; in all three the name was readable at rest. The report's "What a reader sees change" table describes the rest state only.

**6. The name's own affordance is gone where the reader is pointing.** `button.name:hover { text-decoration: underline }` (Ticker.svelte:155-158) does not apply while the pointer is on the covered stretch; `getComputedStyle(name).textDecorationLine` carried no underline at 1600, 900, 760 and 480. Not in the report.

**7. The slivers between the buttons are legible letters of the name.** Each gap is 6.00 px; over the name, 4 of 4 at 900, 5 of 6 at 480, 2 of 6 at 760 light. In mocha at 760 the hovered row reads `completed D cancelled u [not-attending] 1w e 1mo i hide` (`shots/mocha-760-hover.png`). The report names the sliver without saying the fragments are readable text sitting in the row.

**8. The keyboard path to the button the row exists for went from the second Tab stop to the sixth, and a screen reader now hears it last.**

```
base  TAB WALK: ["act:todo","act:done","act:dropped","act:1w","act:1mo","act:hide","name:Stream-Anomaly dea"]
after TAB WALK: ["act:todo","act:dropped","act:1w","act:1mo","act:hide","act:done","name:Stream-Anomaly deadl"]
after READING:  ["BUTTON.name:Review 2 papers for MLShift ","BUTTON.act:todo","BUTTON.act:dropped","BUTTON.act:1w","BUTTON.act:1mo","BUTTON.act:hide","BUTTON.act:done"]
```

The report gives the DOM reorder as judgment call 3 and states neither cost.

**Did the step trade one defect for another: yes.** The rest state is fixed and reproduces exactly (name 158.30 px before, 301.09 px after at 760). The hovered and keyboard states acquire, at every width I measured, a cover of the name that reaches 100%, a press at the name's end that goes to a button, a group that leaves the pane over the rail, one button that cannot be pointed at, and a focus ring drawn behind the rail. On the base, `cover` and `spill` are 0 on every row of the board at 1600, and the point at the end of a name resolves to the name or its tail.

## Reverts and report claims I reproduced

All four in my own clone, not in the worktree.

| claim | result |
| --- | --- |
| node case against "one `{#each}` over `row.actions`, no `.rest` group" | red: `expected '' to contain '>1w<'` at `tests/ui/primitives.test.ts:513` |
| "take no room" against dropping `width: 0` and the negative margin | red: `the name is 158.296875px wide and 301.09375px with the hidden buttons taken out`, the report's 158.30 / 301.09 |
| "no pointer" against taking the rules out of `@media (hover: hover)` | red at `focus-buttons.spec.ts:228`, `expect(await width(row.locator('.rest'))).toBeGreaterThan(0)` |
| "keyboard reaches" against `display: none` restored on `li:hover` | red: first `.act` "inactive" instead of focused at `focus-buttons.spec.ts:261`; two other cases go red as well, which the report does not say |
| the two `eslint-disable-next-line @typescript-eslint/no-confusing-void-expression` comments are load-bearing | removing them: `2 problems (2 errors, 0 warnings)`; the same comment and reason already appear in `Menu.svelte`, `TreeItem.svelte`, `Audit.svelte`, `Focus.svelte` |
| suite counts, check, lint, format, ASCII, build, the browser specs | all as quoted above |

## Screenshots

Under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q49-review/shots/`, light theme and the mocha rice theme, at 1600, 900, 760 and 480 wide:

- at rest: `light-1600-rest.png`, `light-900-rest.png`, `light-760-rest.png`, `light-480-rest.png`, `mocha-1600-rest.png`, `mocha-900-rest.png`, `mocha-760-rest.png`, `mocha-480-rest.png`
- hovered: `light-1600-hover.png`, `light-900-hover.png`, `light-760-hover.png`, `light-480-hover.png`, `mocha-1600-hover.png`, `mocha-900-hover.png`, `mocha-760-hover.png`, `mocha-480-hover.png`
- keyboard on a button, reached by a real Tab press: `light-1600-tab.png`, `light-900-tab.png`, `light-760-tab.png`, `light-480-tab.png`, `mocha-1600-tab.png`, `mocha-900-tab.png`, `mocha-760-tab.png`, `mocha-480-tab.png`

(`*-key.png` in the same folder are the same three widths with focus set programmatically, so they carry no `:focus-visible` ring; the `-tab` files are the keyboard shots.)

## What was not checked

- A real device with both a pointer and a touch screen. Chrome's emulation ties the `hover` media feature to `isMobile`: with `hasTouch: true, isMobile: false` the page still answered `{"hoverHover":false,"hoverNone":true,"anyPointerCoarse":true,"touchPoints":1}`. The measurement in Behaviour 1 substitutes a CDP touch dispatch on a context that answers `hover: hover`, which is the hybrid's CSS state but not the hybrid's full input stack.
- The report's claim that `Emulation.setEmulatedMedia` with a `hover` feature "does nothing": not retried.
- A ticker row in a right-hand column spilling over a left-hand column's text. The demo fixture's only seven-button row sits in the left column, so only the spill over the activity rail was measured.
- The browser suite beyond the four specs named in the brief and this dispatch.
- `tests/ui/wall.test.ts` ran inside the full `npx vitest run`; I did not run it alone.
- A second build for any A/B of bundle size; none was claimed.

## Usage

Not instrumented; this session has no token counter. What it cost: 1 full node suite run, 1 `check`, 1 `lint`, 1 `format:check`, 1 ASCII gate, 6 `npm run build` (one in the worktree, five in the clone across the reverts), 1 four-spec Playwright run in the worktree, 4 Playwright probe runs and 4 Playwright revert runs in the clone, 32 screenshots. One clone of `tools/oculus` (297 MB) under the scratchpad. Waited on `lsof -iTCP:8792 -sTCP:LISTEN` before every browser run; the lock and its pid were never touched.
