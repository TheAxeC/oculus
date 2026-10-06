# Q53 review, read-only

The worktree is untouched. `git status --short` in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q53` prints the same twelve ` M ` rows it printed before I started, and `git diff --stat 8c336e6f` still ends `12 files changed, 453 insertions(+), 33 deletions(-)`. Everything below that needed a file changed was done on a copy in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/536c7cbc-bb5a-4968-922a-974ba41d1544/scratchpad/q53-review/tree` (and a second copy `tree2` for the boundaries plant).

## The verification lines, verbatim

From `/Users/axelfaes/workspace/research-hub/.agents/worktrees/q53/tools/oculus`:

`npx vitest run --reporter=dot`
```
 Test Files  252 passed (252)
      Tests  4293 passed (4293)
   Duration  99.72s (transform 31.53s, setup 0ms, import 149.56s, tests 178.62s, environment 124ms)
```

`npm run check`
```
1789721340253 COMPLETED 1229 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

`npm run build` completed (rolldown plugin-timing tail only, no error). `npm run format:check`
```
Checking formatting...
All matched files use Prettier code style!
```

`npm run lint` printed nothing but its two npm header lines.

The ASCII gate, `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests bin config -type f ! -name glyphs.yml)` printed nothing, exit 0.

`npx playwright test` (whole browser suite)
```
  263 passed (11.7m)
```

`npx playwright test tests/browser/tabs.spec.ts tests/browser/pages.spec.ts tests/browser/layout.spec.ts tests/browser/shell-defects.spec.ts tests/browser/appearance.spec.ts tests/browser/cards.spec.ts tests/browser/rail.spec.ts tests/browser/nested.spec.ts tests/browser/focus-buttons.spec.ts`
```
  ✓  84 [chrome] › tests/browser/tabs.spec.ts:649:5 › the one accent line › one shown tab carries it, and it follows the reader into a page drawn inside another (1.1s)
  ✓  85 [chrome] › tests/browser/tabs.spec.ts:696:5 › the one accent line › a folded pane the rail opens into carries it on its strip, and no shown tab does (1.0s)
  ✓  86 [chrome] › tests/browser/tabs.spec.ts:760:5 › a menu list over what is beside it › every opener draws a list that answers a press, in a pane, in the page strip, in the rail and on a card (2.2s)

  86 passed (2.6m)
```

Every number the brief and the report name reproduces. The suite's wall time is 11.7m against the report's 5.3m; three other steps were running.

### The fourteen reverts, each rerun

Node, in the copy, `npx vitest run tests/<file> --reporter=dot`:

| revert | test | printed |
| --- | --- | --- |
| `layout.svelte.ts:417 => return instances.activeInstance();` | workbench.test.ts "draws the strip of the one pane the rail opens into" | `AssertionError: expected [ 'strip', 'strip unfocused' ] to deeply equal [ 'strip unfocused', 'strip' ]`, 1 failed / 55 passed |
| `Ticker.svelte:270 => class:kept={false}` | primitives.test.ts "marking the one it keeps" | `AssertionError: expected [ [ '1w', false ], [ 'hide', false ] ] to deeply equal [ [ '1w', true ], [ 'hide', false ] ]`, 1 failed / 75 passed |

Browser, each a fresh `npm run build` then `npx playwright test <spec> -g "<title>"` in the copy. All twelve red, each only on the test its comment names:

| revert | test | printed |
| --- | --- | --- |
| `layout.svelte.ts:417` | tabs.spec.ts:649 one accent line | `Error: expect(received).toEqual(expected) // deep equality`, 1 failed |
| `layout.svelte.ts:203 => const where: Touched = { page: null };` | tabs.spec.ts:649 | `Error: expect(received).toEqual(expected) // deep equality`, 1 failed |
| `FoldedPane.svelte:51 => const marked = $derived(false);` | tabs.spec.ts:696 folded pane | `expect(received).toEqual(expected)` at line 730, 1 failed |
| `Tabs.svelte:396 => z-index: auto;` | tabs.spec.ts:760 menu list | `Error: the pane menu under gruvbox, wallpaper on`, 1 failed |
| `Ticker.svelte:224 => onpointerdown={reveal ? tap : undefined}` | focus-buttons.spec.ts:395 press at the end of a name | `expect(received).not.toContain(expected)` at line 458, 1 failed |
| `Ticker.svelte:128 => return;` | focus-buttons.spec.ts:580 first tap | `expect(locator).toBeVisible() failed / element(s) not found` at line 604, 1 failed |
| `Ticker.svelte:398 => display: inline-block;` | focus-buttons.spec.ts:257 | `Error: the waiting buttons hold width, light at 1600`, 1 failed |
| `Ticker.svelte:352 => align-self: baseline;` | focus-buttons.spec.ts:257 | `Error: the row's height changed under the pointer, light at 1600`, 1 failed |
| `Ticker.svelte:414 => display: inline-block;` | focus-buttons.spec.ts:305 | `Error: the focus is outside the row at 900`, 1 failed |
| `Ticker.svelte:402 => display: none;` | focus-buttons.spec.ts:357 | `Error: the keyboard never reached 1w`, 1 failed |
| `Ticker.svelte:394 => margin-left: 0;` | focus-buttons.spec.ts:476 | `Error: the kept button is at the row's end at 1600`, 1 failed |
| `Ticker.svelte:388 => @media (hover: none) {` | focus-buttons.spec.ts:537 no pointer | `Error: the buttons hold no room on a device that always draws them`, 1 failed |

Every one of the fourteen revert comments names a line whose current text is the one the comment means; I printed all fourteen with `sed -n "${n}p"`.

## SPEC

**Finding 1, the replaced revert's stated reason does not reproduce.** The report's "Reverts" section says the committed `// revert: src/lib/ui/Ticker.svelte:358 => position: absolute; right: 0;` at `tests/browser/focus-buttons.spec.ts:400` was replaced because "Applied, the test passed: the waiting buttons are `display: none` while the row is closed, so moving the group out of flow cannot put one over the name." The builder's own correction table maps old 358 to new 398, which is `.reveal .act:not(.kept) { display: none; }`. Applying that revert there and running the named test:
```
        .reveal .act:not(.kept) {
            position: absolute; right: 0;
        }

  ✘  1 [chrome] › tests/browser/focus-buttons.spec.ts:395:1 › a press at the end of a name reaches the name while the buttons are not drawn (1.3s)
    Error: a button answers over the name at 480
  1 failed
```
It is red, with exactly the failure the removed comment described. The replacement revert is also red, so the test is still guarded and no check was loosened; but a committed revert comment was taken out on a ground I cannot reproduce, and the report states the green result as a measurement. If the builder applied it to a different line than 398, the report does not say which.

**Finding 2, the accent line's reading is a live ambiguity the orchestrator must rule on.** The brief's deliverable 1 says "Exactly one shown tab in the window carries the accent line", and the brief's own "read on the tree" counts the page tab among "three shown tabs [that] read an accent top border (the page tab, the host pane's and the leaf pane's)". The builder read it as one over pane strips only. Measured on the served build (`document.elementFromPoint` / `getComputedStyle(...).borderTopColor` against `var(--accent)`):
```
P9 a fresh window: [{"where":"page strip","name":"Page 1","accent":true},{"where":"pane","name":"Status","accent":true}]
P9 a page inside a page: [{"where":"page strip","name":"Page 1","accent":true},{"where":"pane","name":"Status","accent":true},{"where":"pane","name":"Status","accent":false}]
```
Two shown tabs in the window carry the accent, not one. The narrower reading is defensible: `tests/browser/tabs.spec.ts:448` (`expect(await lookOf(shown)).toMatchObject({ height: 30, top: accent, close: '1' })`) is a committed assertion that pins the page strip's accent, so the wider reading reddens a test outside the step's brief. The report surfaces this as decision 1, which is the right handling; it is yours to rule. (The report cites `tabs.spec.ts:435` for that assertion; 435 is the revert comment, the assertion is at 448.)

The rest of the brief is met. I checked the accent rule in the browser for every case you named:

| case | measured |
| --- | --- |
| a page inside a page | one pane accent, following the reader between host and leaf (the committed case, and my own run) |
| a pane the reader has never touched | `P10 two panes, right one just split: ["line","accent"]` |
| a fresh window | `P10 one pane, never touched: ["accent"]` |
| a page with one pane | same line |
| a maximised pane | `P10 maximised: ["accent"]` |
| the reader's instance inside a folded pane | the committed case; and a folded pane the rail does NOT open into is unmarked: `P12 folds ["line"] tabs ["accent"]` |
| two panes on one page | `P11 after pressing the left pane shown tab: ["accent","line"]` / `after pressing the right pane already-shown tab: ["line","accent"]` / `after pressing the left pane empty strip end: ["line","accent"]` (unchanged, correct: that press activates nothing) |

A page inside a page inside a page I did not drive in the browser; `showsPage` in `src/lib/state/layout/nested.ts:25` walks transitively with a `seen` set, so `touched()` answers for the innermost drawn page, and the node case covers two levels.

**The new reactive cell is sound.** `where` is declared at `src/lib/state/layout.svelte.ts:203`, inside `createLayout`, not at module level. I planted `const plantedWhere: Touched = $state({ page: null });` at module level in a second copy and ran `npx vitest run tests/boundaries.test.ts`:
```
 FAIL  tests/boundaries.test.ts > layer boundaries > holds no process-wide state under src
+   "lib/state/layout.svelte.ts holds module-level state in plantedWhere",
 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
```
`holdsModuleState` still catches one. The default `where = { page: null }` keeps the twelve `createAttention(access(...))` calls in `tests/state/layout-parts.test.ts` working, and they pass. No stale read found: every `attention.remembered(...)` caller in `src/lib/state/layout/instances.ts` and `opening.ts` also writes the tree through `access.change`, which is reactive, so the non-reactive `lastActive` record cannot be the only thing that moved.

## PROOF

**Finding 3, the new menu case does not pin the wallpaper it needs.** `tests/browser/tabs.spec.ts:768-770`:
```ts
const wall = await page.locator('.wallpaper').count();
const where = `${paint}, wallpaper ${wall === 1 ? 'on' : 'off'}`;
```
`wall` reaches only the failure message. The committed page-strip case two hundred lines above does it properly, `tests/browser/tabs.spec.ts:463`: `await expect(page.locator('.wallpaper')).toHaveCount(1);`. Today the case does run with the wallpaper on (the `z-index: auto` revert printed `Error: the pane menu under gruvbox, wallpaper on`), so this is not a false green now; it is a green that stops covering the defect silently if `config/appearance.yml`'s `themes: rice` or a theme's class ever changes. One line fixes it.

**What the new depths cover that they should not: not verified.** The committed case presses four openers (pane menu, page menu, rail theme menu, card More) under gruvbox, mocha and light and all four hit-test inside their list. I tried to force a menu list from inside the pane body over the pane strip and over the page strip and could not get a clean answer: under `body.wall` the card and the strip are themselves blurred, so my forced `position: fixed` resolved against them and not the viewport, and the probe measured my own mispositioning. What I can say without a command is structural and I mark it as reasoning, not measurement: under `body.wall` everything inside the pane body sits under a blurred ancestor whose box is below the strip, so nothing from the body paints over the strip's box in the first place; a `position: fixed` overlay inside a view (`ui/Confirm.svelte:89` at z-index 60, `views/Memories.svelte:349` at 40) is already confined to that blurred box before this step. The palette and the tooltip are outside a pane (`DESIGN.md:232`: "a tooltip's bubble is drawn on the document body rather than inside the surface its control sits on"), and both are above 5. The pane's own menu is `placement="down"`, so it never reaches the page strip above it. I did check the split handle: `P6 gruvbox wallpaper on: at the reach beside the strip -> BUTTON.face < SPAN.tip < DIV.tab.current < DIV.tabs < DIV.strip` and the identical answer in light with the wallpaper off, so the new depth changed nothing there.

## STANDARDS

- `src/lib/ui/Tabs.svelte` is 605 lines against the 600 guide (`wc -l`). The report flags it and the plan already carries Q54 as the split (`plan.md:205`). No action here.
- No history in any added comment: `git diff 8c336e6f | grep "^+" | grep -E "\b(Q|D|R|O|M)[0-9]+\b|20[0-9]{2}-[0-9]{2}|reverted|previously|no longer"` printed nothing.
- Non-ASCII: the gate printed nothing.
- Four-space indentation, Prettier clean, eslint silent.
- **Two document sentences the diff makes false are still in the tree**, correctly deferred by the brief's decision 2 but not yet applied:
  - `HELP.md:34`: "... and a page drawn inside another page marks its own active pane the same way."
  - `DESIGN.md:339`: "`shell/PaneView.svelte` passes `focused` to the pane holding `activeInstance(page)`, so a page shown inside another page marks its own active pane too."
  - `DESIGN.md:232` is not false but names only the rail as carrying a depth under the class; the tab strip at 1 and the page strip at 2 now belong in it.
  The report's "Doc text" section says it "writes both replacements out in full"; it names the two lines and does not carry the replacement text, so the wording still has to be written at landing.
- Every head comment the diff touches follows the code as built and carries no history.

## BEHAVIOUR

I drove every tap case with `Input.dispatchTouchEvent` through CDP on an ordinary page (`matchMedia('(hover: hover)').matches` true), as the committed case does. Four findings, none of them in the report.

**Finding 4, a tap on a row with no buttons costs two taps where a click costs one.** `src/lib/ui/Ticker.svelte:128-135`'s `tap()` opens any row `rowAt` resolves, whether or not that row has anything to reveal, and swallows the click with `preventDefault(); stopPropagation();`. The Focus board has such a row today:
```
P1 rows {"total":9,"withActs":8,"plain":1}
P1 tabs before 2, after the first tap 2
P1 tabs after the second tap 3
```
The first tap opens a row that draws nothing and presses nothing; the second opens the tab. A mouse opens it in one press. The fix is one condition in `tap()`: a row with no `.acts` has nothing to open, so let the click through.

**Finding 5, the second tap presses a button that arrived under a stationary finger, and the name becomes unreachable there.** `elementFromPoint` at the same point, before and after the first tap:
```
R1 the name centre, row closed: BUTTON.name < LI. < UL.ticker.reveal < DIV.grp
R1 the same point, row open:  BUTTON.act < SPAN.acts < LI.open < UL.ticker.reveal
```
Opening the row cuts the name and draws the buttons at the row's end, so the point the finger aimed at is now an action button. Axel's ruling is "the second presses the button it lands on", which this satisfies literally; what it costs is that a reader aiming at the project's name cannot reach it by finger wherever the buttons land on the point tapped. Worth a line in the report at minimum, and a decision if the row's name is meant to stay reachable.

**Finding 6, `tapped` is not cleared when the pointer takes over, so two rows draw open at once.** `opened()` at `src/lib/ui/Ticker.svelte:155-160` returns `keyed`, then `pointed`, then `tapped`, and nothing clears `tapped` on `pointerover` or `pointerleave` (`:224-226`):
```
P2 open after the tap: 1
P2 open after the pointer moved to another row: 2
P2 buttons drawn across every open row: 13
```
This contradicts the file's own head comment at `src/lib/ui/Ticker.svelte:10-11`: "A list that `reveal`s draws a row's buttons only while the pointer is in the row or the keyboard is inside it".

**Finding 7, `tapped` survives the rows changing under it and marks a row nothing touched.** `tapped.at` is an index into `list.children`. After a tap opened one row and a second tap snoozed it out of the group:
```
P4 open before the write: ["Review 2 papers for MLShift Workshop task 50d ago"]
P4 open after the write: ["Stream-Anomaly deadline 34d ago"]
P4 open rows after the write: 1
```
A different row is drawn open, with its buttons in the page, after a write the reader made. `pointed` and `keyed` are cleared by a leave or a focusout; `tapped` has no such event, so the index goes stale. The builder's own new case writes through the ticker and does not read this.

What holds: the listener does not interfere with anything else. The only other document click listener in `src` is this one (`grep -rn "addEventListener('click'" src` returns `src/lib/ui/Ticker.svelte:198` alone), and `ui/Menu.svelte:145` closes on `pointerdown` in capture, which the click-phase `stopPropagation` cannot reach. A keyboard Enter raises a click whose `pointerType` is `''`, so `tap()` returns at `:128`; `P5 what Tab reached: "1w"` and one open row with the keyboard inside. A tap that misses closes only the right row: `rowAt` resolves through `[...list.children].indexOf(li)`, so an `li` of another ticker answers `-1` and closes this one. A double tap gives `tabs 2 -> 2, open rows 1` and a tap held for 1.1s the same, so neither opens two rows nor presses twice. `tapped` dies with the component and the document listener is removed by the effect's teardown at `:199-201`.

## What I did not check, named

- A page drawn inside a page drawn inside a page, on screen. Reasoned from `showsPage`, not measured.
- Whether the new depths cover anything they should not, beyond the four openers the committed case presses and the split handle. My forcing probe was invalidated by the blurred containing block, as above.
- The palette and a tooltip over a strip under a wallpaper: the probe did not open either (`R5 light: the palette did not open on Control+p`, `no tooltip bubble drawn`), so both are unmeasured; `DESIGN.md:232` says the tooltip is drawn on the document body.
- A confirm raised inside a card under gruvbox with the wallpaper: measured in light with the wallpaper off only (`the confirm's button -> BUTTON.yes < DIV.row < DIV.box < DIV.ground`, ground at the viewport origin, 900 px tall); the gruvbox pass failed on my own probe's boot.
- The look on screen in Axel's Chrome on the TEST page. That is the landing step's, not mine.
- `npm run build` was run in the worktree (it writes only gitignored output; `git status --short` is unchanged).

## Usage

Read-only throughout; no file inside the worktree was written. 74 tool calls. The run spans 10:45 to the last command; the machine carried three other steps, so the browser suite took 11.7m against the report's 5.3m and the port and the layer lock were contended for most of it. Scratch folder `scratchpad/q53-review` holds `diff.txt`, `pw-full.txt`, `out/reverts.txt`, `out/old-revert.txt`, `out/probe.txt`, `out/probe2.txt`, the two tree copies and the pristine originals used for the reverts.

