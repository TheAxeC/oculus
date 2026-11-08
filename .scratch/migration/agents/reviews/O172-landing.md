# O172 landing

Position: the oculus migration, step O172 (a long field drawn with its newlines and paragraphs) landed. Next: O170's repair round 1, then O151's repair round 2 once O170 has landed.

Open items: none.

## Check of Steps 1

The builder ae73ffc61cc4532d3 and the reviewers afc0139febb1e70da and aa55cdabd485bca66 had ended before the landing; the runner's agent listing showed one subagent running, O170's reviewer, which is not of this step.

## Not done

Nothing inside the brief.

## What landed

The whole range from base bf279a486 (the builder's work and repair round 1, one wip commit e6d3a412d) with the fixes at landing, 29 paths counted without renames, 849 insertions and 453 deletions.

- A field of the schema type `textarea` and the other long note fields are drawn as block Markdown with single newlines kept, on a card and on the record page, through `FieldMarkdown.svelte`.
- `Clamp.svelte` moved to `views/shared/card/text/`; a text longer than the clamp is cut at whole lines, and a text that fits keeps its gaps.
- Each tag of an HTML block is judged on its own, and `start` is kept on an ordered list. That attribute reaches every text drawn through the same profile: a document, a slide and a session transcript now keep a list's first number where they drew 1.
- A press on a link in a field goes no further than the link, and a link with no tab of its own (a relative address, a fragment) is not followed.

Fixes at landing: a piece of an HTML block with no closing `>` is drawn as its own text whatever its name, so `<div>if a<b then c</div>` keeps its words, with an assertion in the G5 field test (Behaviour 1 of the run over round 1); a text that fits its clamp is not cut and keeps its paragraph gaps, in `Clamp.svelte` (the look); three comments rewrapped (Standards 3); G5's `Test:` line in `agents/guarded.md`.

Findings of the run over round 1: Proof 1, Standards 1 and Standards 2 are closed with notes under the Closed heading of `agents/reviews/O172-refuter.md`; Behaviour 2 is closed by the look below and the sentence above.

## The look

On a scratch server from the gate (8797), on a scratch copy of the hub, dark theme over a wallpaper.

- C1 on the Tasks card and on the task's page: two paragraphs with a 6 px gap, a two-item list.
- C2: Funding cards, 2 of the fields hold `<br>` inside a paragraph.
- C3: a one-line note, one paragraph, 19 px.
- C4: cut at 75 px, four whole lines with Show more; open 162 px with its gaps; Show less cuts it again.
- C5: a ten-item list cut at four whole lines.
- C6: two short paragraphs, no control, 6 px gap.
- C7: no script and no handler on the card; `<source>` and `<target>` read as written.
- C8: formulas typeset in a paragraph and a list item; `From $5 to $10 a month.` stays words; the display formula scrolls at 479 of 856 px and the card stays 503 px.
- C10: a project card and its page: the address a link with a tab of its own, the word in the code look.
- C11: a press on a link with a tab of its own and on a relative link: neither reached the window; the relative one was not followed.
- C14: a one-line threat on one line with its glyph; a two-paragraph threat in its own column (label ends at 164, words start at 170).
- C15: `focus` and `fit` joined with ` - `; `fit` as a paragraph after a list; an empty `focus` draws `fit` alone.
- C16: a heading at the text's size in bold; the code block scrolls (479 of 2906 px), the table scrolls (479 of 522 px), the 300-character word breaks, the card stays 503 px, the checkbox is disabled.
- C17: CRLF as LF; a text of blank lines draws nothing.
- Career's `order_note`: two paragraphs and a list.
- An ordered list past 1: `start="3"` in a Markdown preview, on a slide and in a session transcript.
- An HTML block `<div>if a<b then c</div>` keeps its words.
- Light theme: the C1, C4, C8, C11 and C16 notes on Tasks cards, C1 on the task's page and the Funding cards (5 `<br>` inside paragraphs): gaps, lists, the link (orange, a tab of its own), the code word in the monospace face, formulas and the table all legible.
- C8 before KaTeX loads, read per animation frame on a first load in a same-origin frame: the card shows `$x^2$`, `$y^2$` and the `$$...$$` line as their source at 1614 ms, and three typeset formulas at 1646 ms, the card going from 322 to 327 px.
- Flaw, step O174 in `plan.md`: a cut text whose fourth line falls inside a display formula or a table row shows a sliced strip of it above Show more (C8 and C16 notes, both themes); the cut is a height of whole text lines, and C4 and C5, which hold plain lines and lists, are cut whole.

## Verification

In the gate worktree at main's head, `npm run diagrams && npm run docs:palette && npm run test:quick`: "test:quick: 53.9 s; every command passed", 28 changed files, 22 test files. The landing list ran 5 times in the gate; the last run came after the last fix. `git diff --cached --binary` of main and the gate equal under `cmp`. `inlineMarkdown` compared with the code before the Behaviour 1 fix on 40000 random strings: "fuzz: 40000 inputs, 0 differ". Not covered by the list: tests that reach no changed file within the import depth, the build, the lint of unchanged files. No bench.

## What is next

O170's repair round 1, then its review over the round and its landing.

## Usage

brief check a7b3f00ada05c428a 221472 tokens, 27 tool uses, 10.2 min; builder ae73ffc61cc4532d3 325511 tokens, 132 tool uses, 18.7 min, repair round 1 190697 tokens, 70 tool uses, 16.7 min; reviewer afc0139febb1e70da 241873 tokens, 28 tool uses, 12.4 min; reviewer over round 1 aa55cdabd485bca66 245759 tokens, 29 tool uses, 12.2 min.

The builder's first report did not pass its bar: one red floor in `html-sites.test.ts` and eight review findings, all sent in repair round 1. The builder made 4 runs of the list. Fixes at landing as above.
