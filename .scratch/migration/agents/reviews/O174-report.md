Everything in the brief is done. C15 needs a page, which a builder does not run (`spec.md`), so its proof is the look on landing named in its row below.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, section `## Open items`, read with `awk` before any change:

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## The cases' first run, on the unchanged tree

Command: `node .agents/scratch/cases.ts`, run before any change; `diff -q` of `card-layout.ts` and `Clamp.svelte` against `.agents/worktrees/O174-base` printed no difference.

```
C1 Plain lines: no function clampCutHeight in card-layout.ts (want 76)
C2 A display formula crossing: no function clampCutHeight in card-layout.ts (want 57)
C3 A table: no function clampCutHeight in card-layout.ts (want 38)
C4 A whole block inside: no function clampCutHeight in card-layout.ts (want 70)
C5 The first box taller than the clamp: no function clampCutHeight in card-layout.ts (want 76)
C6 A tall inline line: no function clampCutHeight in card-layout.ts (want 64)
C7 A box ending exactly at the clamp: no function clampCutHeight in card-layout.ts (want 76)
C8 Boxes out of order and overlapping: no function clampCutHeight in card-layout.ts (want 57)
C9 A line whose rounding drifts: no function clampCutHeight in card-layout.ts (want 75.4)
C10 A first block opening below its margin: no function clampCutHeight in card-layout.ts (want 76)
C11 Space before a crossing box: no function clampCutHeight in card-layout.ts (want 57)
C12 The clamp in a gap: no function clampCutHeight in card-layout.ts (want 70)
C13 A line bottom inside a taller formula on its line: no function clampCutHeight in card-layout.ts (want 40)
C14 No boxes: no function clampCutHeight in card-layout.ts (want 76)
```

C1 to C14 have no function to call on the unchanged tree, as printed. C15 needs a page, which a builder does not run; it was not run. Each of C1 to C14 was then worked by hand against item 1's rule before any code was written, and the rule gives the answer the brief names in every one, so no case went back to the orchestrator.

The case-run program, `.agents/scratch/cases.ts`, removed before this report, run from the worktree's root with `node .agents/scratch/cases.ts`:

```ts
import * as layout from '../../src/lib/views/shared/card/card-layout.ts';

type Box = { top: number; bottom: number };
type Case = { name: string; boxes: Box[]; clamp: number; want: number };

const stack = (...edges: Array<[number, number]>): Box[] =>
    edges.map(([top, bottom]) => ({ top, bottom }));

const eight: Box[] = Array.from({ length: 8 }, (_, i) => ({ top: i * 19, bottom: (i + 1) * 19 }));

const cases: Case[] = [
    { name: 'C1 Plain lines', boxes: eight, clamp: 76, want: 76 },
    { name: 'C2 A display formula crossing', boxes: stack([0, 19], [19, 38], [38, 57], [57, 110]), clamp: 76, want: 57 },
    { name: 'C3 A table', boxes: stack([0, 19], [19, 38], [38, 90], [90, 140]), clamp: 76, want: 38 },
    { name: 'C4 A whole block inside', boxes: stack([0, 19], [19, 70], [70, 89]), clamp: 76, want: 70 },
    { name: 'C5 The first box taller than the clamp', boxes: stack([0, 200]), clamp: 76, want: 76 },
    { name: 'C6 A tall inline line', boxes: stack([0, 19], [19, 45], [45, 64], [64, 83]), clamp: 76, want: 64 },
    { name: 'C7 A box ending exactly at the clamp', boxes: stack([0, 38], [38, 76], [76, 95]), clamp: 76, want: 76 },
    { name: 'C8 Boxes out of order and overlapping', boxes: stack([19, 38], [0, 19], [21, 36], [38, 57], [57, 90]), clamp: 76, want: 57 },
    { name: 'C9 A line whose rounding drifts', boxes: stack([0, 18.85], [18.85, 37.7], [37.7, 56.55], [56.55, 75.41], [75.41, 94.26]), clamp: 75.4, want: 75.4 },
    { name: 'C10 A first block opening below its margin', boxes: stack([13, 200]), clamp: 76, want: 76 },
    { name: 'C11 Space before a crossing box', boxes: stack([0, 19], [19, 38], [38, 57], [70, 110]), clamp: 76, want: 57 },
    { name: 'C12 The clamp in a gap', boxes: stack([0, 19], [19, 38], [38, 57], [57, 70], [80, 100]), clamp: 76, want: 70 },
    { name: 'C13 A line bottom inside a taller formula on its line', boxes: stack([0, 19], [21, 40], [40, 100], [45, 64]), clamp: 76, want: 40 },
    { name: 'C14 No boxes', boxes: [], clamp: 76, want: 76 }
];

const answer = (layout as unknown as Record<string, unknown>).clampCutHeight;

for (const one of cases) {
    if (typeof answer !== 'function') {
        console.log(`${one.name}: no function clampCutHeight in card-layout.ts (want ${one.want})`);
        continue;
    }
    const got = answer(one.boxes, one.clamp) as number;
    console.log(`${one.name}: ${got} (want ${one.want}) ${got === one.want ? 'ok' : 'DIFFERS'}`);
}
```

## The cases after the last change

Command: `node .agents/scratch/cases.ts`, run after the last edit.

```
C1 Plain lines: 76 (want 76) ok
C2 A display formula crossing: 57 (want 57) ok
C3 A table: 38 (want 38) ok
C4 A whole block inside: 70 (want 70) ok
C5 The first box taller than the clamp: 76 (want 76) ok
C6 A tall inline line: 64 (want 64) ok
C7 A box ending exactly at the clamp: 76 (want 76) ok
C8 Boxes out of order and overlapping: 57 (want 57) ok
C9 A line whose rounding drifts: 75.4 (want 75.4) ok
C10 A first block opening below its margin: 76 (want 76) ok
C11 Space before a crossing box: 57 (want 57) ok
C12 The clamp in a gap: 70 (want 70) ok
C13 A line bottom inside a taller formula on its line: 40 (want 40) ok
C14 No boxes: 76 (want 76) ok
```

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 The rule, `clampCutHeight` in `card-layout.ts:43` | DONE | The case run above: every line ends `ok`, the last `C14 No boxes: 76 (want 76) ok` |
| 2 The measurement, `drawnBoxes` at `Clamp.svelte:61`, called at `:112` with `--field-gap` at 0, kept in `$state` `cutHeight` at `:94` and written at `:136` | DONE by reading; on a page at the look | `svelte-check` line below; what the page does is the look on landing, as `spec.md` says for a behaviour that needs a DOM |
| 3 `.text.cut` uses `max-height: var(--clamp-cut)` at `Clamp.svelte:172`; `--clamp-lines` gone | DONE | `grep -rn "clamp-lines" src tests docs` prints nothing |
| 4 A plain wrapping `div` at `Clamp.svelte:139`, the `ResizeObserver` on it at `:121`, the `MutationObserver` kept on the box at `:123` | DONE by reading; on a page at the look | Read in the diff; the look on landing |
| 5 Show more, Show less, the open state and the callers are unchanged | DONE | `overflowsClamp` and `clampControl` compute what they did (the literal 1 is the constant `ROUNDING`, value 1); `diff -rq` against the base copy lists only the two files |
| 6 Comments: head comment and `.text.cut` comment of `Clamp.svelte`, head comment of `card-layout.ts` | DONE | Read against `spec.md`, listed below; `comment-width.test.ts` and `history.test.ts` ran in the list |
| C1 to C14 | DONE | The case run above |
| C15 on a page | The look on landing | View: Tasks cards in light and dark, and a project card's ELI5. See "Host- or user-visible changes" for the state to put each in and what should be seen |
| Verify 1 `npm run test:quick -- <the two paths>`, `TMPDIR` unset | DONE | `test:quick: 43.4 s; every command passed` |
| Verify 3 `sh utils/unused-exports.sh` against the base's list | DONE | `diff ../O174-base/unused-exports.txt .agents/scratch/unused.txt` printed nothing, exit 0; both 334 lines |
| Verify 4 grep of `clamp-lines` and the new names | DONE | Quoted below |
| Verify 5 comments read against the standards page | DONE | Listed below; no departure |
| The ASCII check over the two files | DONE | `LC_ALL=C grep -n '[^ -~]'` over both files printed nothing, exit 1 |

Lines the final run of the list printed:

```
test:quick: 2 changed file(s), from the given paths
test:quick: 9 test file(s)
        tests/checks/source/catalog-file-keys.test.ts: scans the source text of a changed file
        tests/checks/source/comment-width.test.ts: scans the source text of a changed file
        tests/checks/source/history.test.ts: scans the source text of a changed file
        tests/checks/source/html-sites.test.ts: scans the source text of a changed file
        tests/checks/source/keys.test.ts: scans the source text of a changed file
        tests/checks/source/strip-types.test.ts: scans the source text of a changed file
        tests/checks/tree/boundaries.test.ts: scans the source text of a changed file
        tests/checks/tree/duplication.test.ts: scans the source text of a changed file
        tests/checks/tree/size.test.ts: scans the source text of a changed file
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (9.5 s)
ok      svelte-check (9.6 s): 1794181689085 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (40.9 s): Duration  29.12s (transform 11.84s, setup 0ms, import 24.39s, tests 38.10s, environment 3ms)
test:quick: 43.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The list ran twice: the first run was red on an eslint line in `Clamp.svelte`, a file the step changes, so that file was fixed, linted alone (`npx eslint src/lib/views/shared/card/text/Clamp.svelte`, exit 0) and the list run once more, as `spec.md` says. `npm run diagrams` ran right before each run and changed no file (`git status --short` lists only the two source files). No whole-suite command ran.

Grep of `clamp-lines` and the new names, `grep -rn "clamp-lines\|--clamp-cut\|clampCutHeight\|ClampBox" src tests docs`:

```
src/lib/views/shared/card/card-layout.ts:33:export type ClampBox = { top: number; bottom: number };
src/lib/views/shared/card/card-layout.ts:43:export function clampCutHeight(boxes: readonly ClampBox[], clamp: number): number {
src/lib/views/shared/card/text/Clamp.svelte:12:    // clampCutHeight), so no line, formula, table row, code block or image is sliced above the
src/lib/views/shared/card/text/Clamp.svelte:25:        clampCutHeight,
src/lib/views/shared/card/text/Clamp.svelte:28:        type ClampBox
src/lib/views/shared/card/text/Clamp.svelte:61:    function drawnBoxes(node: HTMLElement): ClampBox[] {
src/lib/views/shared/card/text/Clamp.svelte:63:        const boxes: ClampBox[] = [];
src/lib/views/shared/card/text/Clamp.svelte:112:            cutHeight = clampCutHeight(drawnBoxes(node), line * CLAMP_LINES);
src/lib/views/shared/card/text/Clamp.svelte:136:        style={`--clamp-cut: ${cutHeight}px`}
src/lib/views/shared/card/text/Clamp.svelte:172:        max-height: var(--clamp-cut);
```

Each hit is true; `clamp-lines` has no hit left. `--clamp-cut` is empty of any other use, so it collides with no configured or reserved name.

Comments outside the paths, read, not edited:

- `FieldMarkdown.svelte:12-14`, "turns off while it cuts the text, so the cut falls on whole lines": true.
- `CardBrief.svelte:3`, "cut to views/shared/card/text/Clamp.svelte when the caller keeps an open state": true.
- `EntryFields.svelte:41`, "A long body field on a card is views/shared/card/text/Clamp.svelte, open or cut by the view instance's state": true.

Comments and docs of what the change touches:

- `Clamp.svelte` head comment: rewritten. It says the resize observer watches an element inside the box.
- `.text.cut` comment: rewritten.
- The comment above the observers: rewritten.
- `card-layout.ts` head comment: rewritten, it lists where the cut ends.
- `overflowsClamp` doc comment: still true.
- `clampControl` doc comment: still true.
- `grep -rn "\bClamp\b" src tests docs` has no hit under `docs` or `tests`, so no guide describes this behaviour and no sentence of `docs/HELP.md`, `docs/data-map.md` or `docs/decks.md` is made false.

Each new or changed comment was read against `spec.md`: what the code does and why, 100 columns, ASCII, no step number or date. No comment departs from it.

Grep of the added lines for the comparing words, `git diff -U0 | grep -nE "^\+.*\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b"`:

```
8:+// before the rest go behind the More menu, whether a description is longer than its clamp, at what
9:+// height its cut ends, and which measurement is still wanted once a newer one has started or the
151:+       nothing is sliced above the control, and it is set before this class first applies. Its
```

Each judged: lines 8 and 9 are the head comment's words rewrapped ("before the rest go behind", "still wanted"), describing an order of actions and a wanted measurement. Line 151 says the value is written ahead of the class in the order of one measurement. None compares with an earlier state of the code.

Helper grep, before writing `drawnBoxes`, `grep -rn "createTreeWalker\|getClientRects\|drawnBoxes" src tests`: the other hits are `getClientRects().length` tests of whether an element is drawn (`FoldRun.svelte:70`, `Toolbar.svelte:109`, `FrameLayer.svelte:95`, `keys.ts:52`), so there was nothing to reuse. `grep -rn "clampCut\|ClampBox\|cutHeight" src tests docs` printed nothing before the names were added.

Keys and asynchronous paths: the one new name is the custom property `--clamp-cut`, set only on the component's own box. A measurement after the component is gone or superseded is refused by `gate.current(token)`, as it was (`Clamp.svelte:108`). An effect teardown disconnects both observers.

No test was added or changed, as the brief says: no assertion, allow list or predicate was edited.

## The files

`diff -rq` against the base copy over `src`, `docs`, `tests`, `config` and `utils`, with `wc -l`:

| Path | Lines before | Lines after | In the write list |
| --- | --- | --- | --- |
| `src/lib/views/shared/card/text/Clamp.svelte` | 105 | 175 | yes |
| `src/lib/views/shared/card/card-layout.ts` | 104 | 130 | yes |
| `.scratch/migration/agents/reviews/O174-report.md` | none | new | yes |

## Judgment calls the brief left open

1. A line's box uses the line height of the element the words stand in (`getComputedStyle(parent).lineHeight`), which is the box's own line height for text at the field's size. The brief says "one line height tall". For a `sub`, `sup`, `small` or an inline `code` set smaller, the box's line height would overstate the line's height and could cut a line short; `.field code` is `font-size: var(--fs-sm)`.
2. The 1 px of rounding is the private constant `ROUNDING` in `card-layout.ts`, used by `overflowsClamp` and `clampCutHeight`, so the allowance is one value. The value and `overflowsClamp`'s answers are the same.
3. A box with no height is skipped, and a text rectangle with no width or no height is skipped, since neither draws anything: an image that has not loaded yet, a collapsed space.
4. `--clamp-cut` is the custom property's name, the builder's by the brief's decision 1, and the style attribute is written always, so `--clamp-cut: 0px` is in the server's HTML, which no rule reads until `.cut` applies.
5. The boxes are collected on every measurement, for a text that fits as well, so the code has no branch; `.cut` never reads the value for a text that fits.
6. A text node with no parent element reads the box itself (`?? node`), a case a walker under an element does not reach, written to satisfy the type.

## Host- or user-visible changes

The look on landing, `spec.md`'s proof for C15. In light and dark, on a Tasks card, each with Show more and Show less pressed:

| State to put it in | Before | After |
| --- | --- | --- |
| Note with `$$...$$` crossing the fourth line | A strip of the formula's top above Show more | The cut ends at the line above the formula; no strip |
| Note opening with `$$...$$` taller than the cut | Sliced at four lines | Sliced at four lines: no box fits whole, C5 and C10 |
| Note with a wide table | A sliced header row | The cut ends above the row that crosses, or above the table when the header crosses |
| Note with a code block | Cut through the block | Shown whole or not at all |
| Note with an image that loads late | Cut at four lines, whatever loads | The cut follows the image once it has loaded: the image shows whole or not at all |
| Note with a tall inline formula such as `$\sum_i^n \frac{a}{b}$` crossing the fourth line | The formula's tall parts cut | The cut ends at the bottom of the last whole line |
| Eight plain lines, a ten-item list | Cut at four whole lines | The same: four whole lines |
| A card at a narrower width, a text size change on the plain and the formula card | The cut in em | The cut re-measured and following; plain text at four lines |
| A project card's ELI5 | As the Tasks notes | As the Tasks notes |

Show more and Show less appear exactly when they did: the text's whole height decides them, read at the same `--field-gap` of 0. There is one more element in the markup, the plain `div` around the contents, with no class and no style.

## What in the brief was wrong or could not be done

- The brief's item 4 says "the wrapping `div` does not change size when the cut does". It does change, by the gaps between blocks, on a field of several blocks: `.text.cut` sets `--field-gap: 0` and `FieldMarkdown.svelte:68` spaces blocks by it, so the `div` shrinks when the cut goes on and grows when it comes off. The consequence is one more `measure` from the resize observer per toggle. It writes the same two values, because `measure` always reads at a gap of 0 and with the box's `scrollTop` added, so the value does not depend on the cut and the observer does not fire again. By reading; not verified on a page.
- Nothing else in the brief turned out wrong. `.katex-base` is KaTeX's class in the installed version (`grep -n "katex-base" node_modules/katex/dist/katex.css` prints `:177 .katex .katex-base`).

Sharp edges, by reading and not measured:

- Each measurement now walks the text nodes and calls `getComputedStyle` and `getClientRects` on them, where the unchanged code read one `scrollHeight`. Not timed; a field is usually short, and a board draws one such walk per card.
- A table's row box comes from `getBoundingClientRect` of the `tr`, so where borders collapse the cut can fall on a row's border to within a pixel. Not verified on a page.
- A block taller than the cut, opening the text, is still sliced at four lines, as the brief's C5 and C10 name.
- A collapsed `details` draws no rectangles and gives no box.
