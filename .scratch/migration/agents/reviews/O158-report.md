# O158 report, after repair round 1, under ruling 699 (a)

Everything in the brief is done, under the brief, its cases ruling `briefs/O158-cases.md` (ruling 699 (a): every fact drawn, the strip wrapping to as many lines as its facts need, no line limit) and the repair brief `briefs/O158-round-1.md`. The line count of the strip on each deck is an estimate from a case-run program at a face factor of 1.0; the look on landing measures it.

## Open items of the state file, verbatim

From the main checkout's `.scratch/migration/orchestrator-state.md`, section "Open items", read at the time of writing:

None.

## The cases' first run, on the unchanged tree, and the case the brief got wrong

Read on the base before any change, each by the code, the fit cases by the case-run program at the end. Its base mode, run as `FACE=1.0 TODAY=1 WIDTH=1040 GAP=0.35 node strip-fit.mjs <worktree>`, reproduces the brief's own measurement of the base: btfno 9, covert-applied 10, fed-multicellular-immune 10, covert-theory 8, hccnet-fl 7, hccnet-revision 5 hidden (`hccnet-revision: facts 12, lines 3 (1002 + 1031 + 858 px), hidden 5 [venue, funding, compute, code, tier]`), each with the fields the brief names; 16 of the 24 decks other than `hccnet-revision` losing facts, the 8 small decks none; the venue hidden on 8 of those 24; the tier on 16 of them against the loop's 15. At the program's default face factor of 1.05 the base mode gives other counts (hccnet-revision 7 hidden), so 1.0 is the factor every count in this report assumes.

- C1 `hccnet-revision`. Base: the stage a filled `Chip`, the domain a toned `Tag`, the rest plain `Tag`s, each `'{0}: {1}'` with the list joined by ", "; no rule above the strip; 5 facts hidden (venue, funding, compute, code, tier).
- C2 `btfno`: base 9 hidden. C3 `covert-applied` and `fed-multicellular-immune`: base 10 and 10 hidden.
- C4: base, 16 of 24 decks hide facts.
- C5 `ssm-longitudinal`: base one line, none hidden.
- C6 `fed-faithful-ecg`: the stage words "failed (no-go or disproved)" (`config/catalogs/vocab.yml:76`), hue from `stageTone` (`tones.ts:256-258`), drawn on the base as a filled chip.
- C7: the base joins a list with ", ".
- C8: the base tooltip is `t('present.fact', label, words.join(', '))`.
- C9: the base hides with `visibility: hidden` and `aria-hidden`; the foot's room is measured either way.
- C10: the base clamps to 2 lines.
- C11: the tokens `--line`, `--muted-txt`, `--c-<tone>`, `--c-grey` (`tokens.css:56`) exist; the rice theme draws the monospace face at 17 px.
- C12: every surface draws `Slide.svelte` (`screen/Framed.svelte:51`, `routes/present/show/+page.svelte:276`, `routes/present/print/+page.svelte:190`).
- C13: the base's `isBlocked({ chips: keys }, words)` over every chip gives `'red'` (`focus.ts:216-221`).
- C14: `statusMarkTone` and `stageTone` give `UNKNOWN_TONE`, `'grey'` (`tones.ts:40`, `:258`, `:338`).
- C15: the base cut a whole chip at the column's edge.
- C16: `wc -l Slide.svelte` printed 539; `screen/` held 7 entries.

The case the brief got wrong, handed back before any change: under item 6's two-line limit at the brief's sizes, C1 to C4 could not hold (13 decks hiding 34 facts by the estimate). The ruling in `briefs/O158-cases.md`: Axel's ruling 699 (a), the strip shows every fact at the brief's sizes and wraps to as many lines as it needs; C1 to C4 expect 0 hidden; C10 reports line counts; the report names how the strip's height reaches the layout and which decks lose room; the docs and every "two lines" about the strip are changed.

## The repair round's items

1. `Facts.svelte:188-191`: `.fact > :global(*) { min-width: 0; max-width: 100%; }` holds the tooltip wrapper (`.tip`) to its fact's width, which `.fact` holds to the strip's line (`:182-186`). How a value then shrinks below the 14em cap: the wrapper is no wider than the strip; its first child `.drawn` takes `flex: 1 1 auto; min-width: 0` (Tooltip.svelte's `.tip > :global(*:first-child)`) and its own `min-width: 0`; inside it the label and the dot's `.mark` are `flex: none`, so `.value` (`min-width: 0`, flex shrink 1) takes all the shrinking; inside `.value` the entry (`min-width: 0; overflow: hidden; text-overflow: ellipsis`) gives way and `.count` (`flex: none`) stays. The value is drawn at `min(its text, 14em, the strip's width less the label, the gaps and the dot)` and ends in an ellipsis at the strip's edge.
2. `Facts.svelte:114` and `:128`: the copy a screen reader reads is `whole`, the whole fact with every entry; the `read` field and the key `fact_more` are gone (`grep -rn "fact_more" src tests config docs --exclude=local.yml` prints nothing, exit 1). Accessible text, before (the base): each fact's Chip or Tag label, "Collaborators: Maryam Amir Haeri, Maureen Guichelaar, St<e acute>phanie M. van den Berg". After: a visually hidden copy in `present.fact`'s words with every entry, "Collaborators: Maryam Amir Haeri, Maureen Guichelaar, St<e acute>phanie M. van den Berg", the drawn label, dot and value `aria-hidden`. The words a screen reader hears are the base's.
3. "The case-run program" below quotes the base command with `FACE=1.0`, names the factor, and names the decks within 5 percent of a line break.
4. `Slide.svelte:24-31`: the paragraph is rewrapped whole at 100 columns.
5. `Facts.svelte:23-25`: "so it scales with the text size and the theme, outside the content's factor".
6. `Dot.svelte:5-6`: "unless an element around it sets `--dot-size`".
7. The open items above are copied from the main checkout's state file.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 One visual language | DONE | `grep -n "Chip\|Tag\|Glyph" src/lib/views/academic/present/parts/project/Facts.svelte` prints nothing; label, dot, value as text nodes; the accessible copy from `present.fact`; the look |
| 2 Hues as dots | DONE | `toneOf` in `Facts.svelte`; `Dot.svelte` `var(--dot-size, 9px)`; head comment names the strip; the look |
| 3 Facts set apart | DONE | `.list` `gap: 0.2em var(--fact-gap)`, `--fact-gap: 1em`; `.drawn` `gap: 0.4em`, `white-space: nowrap`; `.fact > :global(*)` `max-width: 100%`; the look |
| 4 Rule above the strip | DONE | `.facts` `border-top: 1px solid var(--line)`, `padding-top: 0.6em`; `.strip` padding kept; the look |
| 5 Short values | DONE | `fact_count: '+{0}'` in `present.yml`; `.value` `max-width: var(--fact-value)` (14em) and the shrink of repair item 1; `.count` `flex: none`; the look |
| 6 Every fact seen (as ruled) | DONE | `grep -n "clamp" src/lib/views/academic/present/parts/project/Facts.svelte` prints nothing; the program gives 0 hidden on 25 decks; the look |
| 7 Kept as it is | DONE | `project-facts.ts` and `FACT_FIELDS` unchanged (`git status --short` lists neither); `.hidden { visibility: hidden }` kept; `font-size: var(--slide-fs-small)` outside `.slide-fit`; the look |
| 8 Themes | DONE | colours only from tokens; the look |
| 9 Docs and comments | DONE | the list below |
| 10 No new test; existing tests pass | DONE | `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts --reporter=dot` prints `Tests  48 passed \| 2 skipped (50)` |
| 11 Slide.svelte split | DONE | `wc -l`: `Slide.svelte` 484, `screen/drawn-slide.ts` 81 |
| Verify 1 | DONE | `npm run diagrams && npm run docs:palette` exit 0; `npm run test:quick` prints `test:quick: 58.1 s; every command passed` |
| Verify 3 ASCII gate | DONE | the perl gate over `src tests utils config` prints nothing (exit 0); the same over every touched file and this report prints nothing |
| Verify 4 sizes | DONE | `wc -l` below, each under its limit |
| Verify 5 unused exports | DONE | `diff .agents/worktrees/O158-base/unused-exports.txt <(sh utils/unused-exports.sh)` prints nothing, exit 0 |
| Verify 6 folders | DONE | `sh utils/folder-check.sh` prints nothing, exit 0; `screen/` holds 8 entries |
| Verify 7 history words | DONE | below |
| Verify 8 prose | DONE | below |

The list ran once in this round, after its last change, preceded by `npm run diagrams && npm run docs:palette`. Its final lines:

```
test:quick: 14 changed file(s), from git since HEAD
test:quick: 11 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (16.4 s)
ok      svelte-check (16.4 s): 1793985785038 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (24.0 s): Duration  5.50s (transform 4.36s, setup 0ms, import 8.66s, tests 1.07s, environment 1ms)
ok      vitest slow (28.4 s): Duration  9.91s (transform 2.74s, setup 0ms, import 4.70s, tests 5.00s, environment 0ms)
ok      vitest checks (55.6 s): Duration  36.49s (transform 15.38s, setup 0ms, import 32.13s, tests 50.47s, environment 4ms)
test:quick: 58.1 s; every command passed
```

In the first build round the list ran twice: once red on `tests/checks/tree/boundaries.test.ts:478` (`Facts.svelte` styled `.dot`, a class of other components, through `:global(.dot)`; the dot's centring is on `Facts.svelte`'s own `.mark` span), then green. No whole-suite command was run in either round. The step adds and changes no test; verify 2's grep, `grep -rln "Facts.svelte\|Slide.svelte\|Dot.svelte\|views/academic/present.yml\|present\.fact\|drawn-slide" tests`, prints `tests/checks/config/config-folder.test.ts` alone.

## Files

`diff -rq` against `.agents/worktrees/O158-base` over `src`, `config`, `tests`, `utils` (the base copy holds no `docs`; those are from `git diff --stat`):

| Path | Lines now | Note |
| --- | --- | --- |
| `src/lib/views/academic/present/Slide.svelte` | 484 | was 539 |
| `src/lib/views/academic/present/screen/drawn-slide.ts` | 81 | new, from the split |
| `src/lib/views/academic/present/parts/project/Facts.svelte` | 250 | was 198 |
| `src/lib/views/academic/present/parts/Dot.svelte` | 36 | |
| `config/text/views/academic/present.yml` | 153 | 1 line added, `fact_count` |
| `docs/decks.md` | | lines 386-389 and 395 |
| `docs/HELP.md` | | lines 342-345 and 349 |
| `docs/diagrams/layer-views.dot`, `.svg`, `layers.dot`, `.svg` | | by `npm run diagrams` |
| `.scratch/migration/agents/reviews/O158-report.md` | | this report |

Every path is on the write list.

## The split of Slide.svelte (item 11)

- Moved to `screen/drawn-slide.ts`, unchanged in code and comments: the type `Drawn` and `figuresIn`, `holderOf`, `frameOf`, `gapOf`, `capTopOf`, `fitFormulas` (base `Slide.svelte:116-187`, now `drawn-slide.ts:10-81`), with `fitFormula`'s import (base `:49`, now `drawn-slide.ts:8`). `Slide.svelte:56-63` imports them. The module opens with its own head comment.
- The search, the state it sets, the effects, the markup and the styles stay in `Slide.svelte`.
- The root element is renamed with its job: class and variable `reading` to `slide`, the local `column` in `layOutSlide` to `whole` (`Slide.svelte:136-143`). It is the same element, the frame's child, carrying `data-slide-key`, so `parentElement`, the scale and the Stage's measure read what they read on the base.

## How the strip reaches the whole inner width, and the layout

- The root `.slide` takes the frame's inner box (`width: 100%`, no max width); `.content` carries the reading column (`width: 100%; max-width: var(--slide-reading); margin-inline: auto`); `.foot` spans the root, so the strip is 1150 px in a 1280 px frame and the content stays 1040. `.keys` takes `max-width: var(--slide-reading); margin: 0 auto`, so the key hint wraps in the 1040 px it had.
- The strip's height reaches the layout through `layOutSlide`: `const kept = foot === null ? 0 : tall(foot);` and `const above = inner - kept - past;` (`Slide.svelte:154-155`); every fit and every figure box is measured against `above`. The layout runs again when the slide, the deck's frame or the strip's facts change (`$state.snapshot([row, deck.frame, held])`, `:301`), when the text size or the theme changes (the probe's ResizeObserver, `:328`), when a font loads (`:330`), and when an image loads or fails. A taller strip leaves the content less room, and the content never lies under it.
- Room against today (estimate at face 1.0: today's two chip lines about 59 px as the brief gives, about 29.5 px for one; the new strip `n x 23.4 + (n - 1) x 3.6 + 10.8 + 1` px; the `.strip` padding the same in both):
  - 3 lines, about 30 px less room: `dongho-ecg-clustering`, `hccnet-fl`, `btfno`, `bttd-source-eeg`, `bttn-incident-af`, `covert-applied`, `covert-theory`, `dries-bttr-ecg`, `fed-multicellular-immune`, `hccnet-revision`, `meseret-cirrhosis`, `raw-pls`, `ward-bttr-crosssubject` (13).
  - 2 lines, about 3 px less: `ecg-af-fair`, `florank-personalization`, `hccnet-fl-sweden`, `hccnet-pathology`, `bt-operator-theory`, `ecg-readable-substrate` (6).
  - 1 line where today took 1, about 6 px less: `clinical-ai-eval-artifacts`, `ssm-longitudinal` (2).
  - 1 line where today took 2, about 24 px more: `fed-faithful-ecg`, `btd-autoencoder`, `fl-privacy-auditing`, `quantum-tensor-fl` (4).
- Unsettled until the look: run at face factors 0.95 and 1.05 (widths 5 percent narrower and wider), two decks change their count: `fed-faithful-ecg` (1 line at 0.95 and 1.0, 2 at 1.05; its line is 1125 of 1150 px) and `hccnet-pathology` (1 line at 0.95, 2 at 1.0 and 1.05). Every other deck keeps its count across 0.95 to 1.05; `ssm-longitudinal` (1087 px), `btd-autoencoder` and `quantum-tensor-fl` (1096 px) are the nearest one-line decks to a break.

## Visible changes, for the look and Axel's screenshots

Every view below is the Present pane at text size 1, base dark theme, 1280 by 720 frame, Project facts on, unless named.

- C1 `hccnet-revision`, its project slide. Before: a filled blue pill "Stage: submitted / under review", a toned "Domain: Hepatology | imaging", run-on plain words, 7 of 12 facts on two lines, the second ending in an ellipsis, no rule. After: a 1 px rule in `--line` across 1150 px, then three lines of facts set 1em apart, each a muted capital label at 0.72em (STAGE, DOMAIN, PILLARS, DATASETS, LEAD, COLLABORATORS, YEAR, VENUE, FUNDING, COMPUTE, CODE, TIER) followed 0.4em later by its value in the text colour; a dot in the stage's hue between STAGE and "submitted / under review", a dot in the domain's hue between DOMAIN and "Hepatology | imaging"; LEAD "Axel Faes +1"; COLLABORATORS the first entry and "+2" (the brief saw "Maryam Amir Haeri" first); VENUE "Intell Med", FUNDING "ZonMw-AI-HCC", COMPUTE, CODE "deposited" and TIER "Research" all drawn. No box, fill, border or glyph on any fact. Estimate: 3 lines (1047 + 953 + 467 px).
- C2 `btfno`: 12 facts on 3 lines (1132 + 955 + 330 px).
- C3 `covert-applied`: 13 facts, 3 lines (1081 + 947 + 682). `fed-multicellular-immune`: 13 facts, 3 lines (1122 + 1034 + 473).
- C4, each deck's line count by the estimate at face 1.0, 0 facts hidden on each: `fed-faithful-ecg` 1 (unsettled, see above), `dongho-ecg-clustering` 3, `hccnet-fl` 3, `btd-autoencoder` 1, `clinical-ai-eval-artifacts` 1, `ecg-af-fair` 2, `fl-privacy-auditing` 1, `florank-personalization` 2, `hccnet-fl-sweden` 2, `hccnet-pathology` 2 (unsettled), `quantum-tensor-fl` 1, `ssm-longitudinal` 1, `bt-operator-theory` 2, `btfno` 3, `bttd-source-eeg` 3, `bttn-incident-af` 3, `covert-applied` 3, `covert-theory` 3, `dries-bttr-ecg` 3, `ecg-readable-substrate` 2, `fed-multicellular-immune` 3, `hccnet-revision` 3, `meseret-cirrhosis` 3, `raw-pls` 3, `ward-bttr-crosssubject` 3. The look counts `[data-fact]` items and the strip's lines per deck.
- C5 `ssm-longitudinal`: one line from the strip's left edge, facts 1em apart, no stretched gaps (`.list` has no `justify-content`).
- C6 `fed-faithful-ecg`: STAGE, a dot in the stage's hue (the stage's colour `#dc2626` is the value of `--c-red`, `tokens.css:27`, so a red dot is expected), "failed (no-go or disproved)".
- C7: a lead of one person draws the name alone; `hccnet-revision`'s lead of two draws "Axel Faes +1".
- C8: rest the pointer on C1's collaborators: the tooltip reads "Collaborators: " and every name joined by ", ", accented letter as the record writes it. A value cut by the 14em cap (a pillar title such as "Interpretable Structured-Tensor Methods" on `covert-applied`) ends in an ellipsis with "+1" after it, and its tooltip gives every title.
- C9: toggle Project facts off on C1: the words and the rule vanish, the room stays, the slide's content and its Too tall state do not move; the same with the presenter screen and the audience window open.
- C10: text size 1.5 (27 px type): every fact drawn; 2 lines on 7 decks, 3 on 5, 4 on 12, 5 on 1, the tallest `covert-applied` at 5 lines. In a 400 px frame (270 px inner): every fact drawn, about one fact per line, the tallest `dongho-ecg-clustering` at 13 lines; a fact wider than 270 px (such as PILLARS "Interpretable Structured-Tensor Methods +1", about 324 px at the cap) is held to the strip's width, its value cut with an ellipsis at the strip's right edge and its "+1" drawn there; no fact runs into the frame's padding. The content's room there is small and Too tall is expected.
- C11: C1's slide under base light, base dark, the rice theme and a high-contrast VS Code theme: labels in `--muted-txt`, dots in their hues, the rule in `--line`. Under rice the face is monospace at 17 px, so the line counts can be one higher than C4's; the rice theme's brackets around each fact are gone (they were `Tag`'s, `rice.brackets`).
- C12: the Overview's tile, the presenter screen, the audience window and the PDF of C1's slide draw the same strip. In a small tile the 1 px rule is scaled with the frame and may draw thinner than 1 px.
- C13 (read): `toneOf`'s `chips` case gives `'red'` when `isBlocked({ chips: fact.keys ?? [] }, words)` holds over every chip, the first chip's hue otherwise.
- C14 (read): a form, stage or chip word with no colour gets `'grey'`; the dot draws `var(--c-grey)`.
- C15 (read): at the cap, `.value` is at most 14em, the entry gives way with an ellipsis and `.count` (`flex: none`) stays. Below the cap, in a frame where the fact's line is narrower than the label, the gaps, the dot and 14em, the value takes what the line leaves it (repair item 1) and the entry is cut at the strip's edge with the count after it.
- C16: `wc -l` gives `Slide.svelte` 484 (limit 520), `drawn-slide.ts` 81 (limit 880). The content keeps 1040 px and its height above the foot; the look compares C1 and C12 with the base.
- Also visible: in a 1280 px frame the strip is wider than the content column (1150 against 1040), its left edge 55 px left of the content's; where the frame's inner width is 1040 or less the two are as wide.
- Accessible text (repair item 2): the same words as the base, the whole fact with every entry, read from a hidden copy.
- Screenshots for Axel: C1's slide under the base dark theme; `btfno`; `covert-applied`; C1 with the toggle off; C1 under the rice theme.

## Comments and docs

- `Facts.svelte` head comment and CSS comments: rewritten (this round: the second paragraph for the whole accessible fact and the value's room, the third for item 5, a comment on `.fact` and `.fact > :global(*)`).
- `Slide.svelte` head comment: first paragraph rewritten; second paragraph rewrapped whole, one sentence added naming `screen/drawn-slide.ts`; third paragraph rewritten; the comments on `.slide`, `.content`, `.foot` and `.keys` rewritten; `past`'s doc comment and the key hint comment in `layOutSlide`: "column's foot" to "slide's foot".
- `Dot.svelte` head comment: rewritten.
- `screen/drawn-slide.ts`: new head comment; the moved doc comments still true.
- `docs/decks.md` "The project facts strip" (386-389) and the placeholder paragraph (395): rewritten; 385 and 390-391 still true; 166 ("the project facts strip keeps its own size") still true.
- `docs/HELP.md` 342-345 and 349: rewritten; 341 and 346-348 still true.
- Still true, read: `screen/Stage.svelte:16-22`, `screen/Framed.svelte:13-15`, `Present.svelte:70-74`, `themes/slide.css:1-15`, `routes/present/print/+page.svelte:20-24`, `present.yml` `facts_tip`.
- The "two lines" grep, `grep -rn -i "two lines" src tests config docs README.md --exclude=local.yml`, gave four hits about the strip on the base, `Facts.svelte:11`, `Facts.svelte:158`, `docs/HELP.md:343` and `docs/decks.md:387`, all rewritten. Its hits about the strip now are the new sentences `Facts.svelte:22` and `docs/decks.md:389` (a fact is never broken across two lines) and the CSS comment on the gaps between two lines; none states a line limit.

## The history-word grep (verify 7)

Over every line the step added to `Slide.svelte`, `Facts.svelte` and `Dot.svelte` and the whole of `drawn-slide.ts`, `grep -n -i -E "\bbefore\b|used to|no longer|\bstill\b|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"` prints three hits, each "before" in the sense of place:

```
65:>     // the stage, the status chips and the domain carry their hue as a dot before the value
92:>         /** The hue of the dot before the value; none for a field that draws no dot. */
143:>        label's size and the widest a value is drawn. The dot before a hued value is as wide as
```

## Prose (verify 8)

Every new or changed sentence in the comments and the two docs was read against the rules file's prose rule: ASCII, no em dash, no quip, no "not X but Y". No departure after item 5.

## Judgment calls the brief left open

- The numbers: label 0.72em of the strip's type (12.96 px at 18 px), letter spacing 0.04em, normal weight; gap between facts 1em; gap inside a fact 0.4em; value cap 14em (252 px); 0.6em between the rule and the first line; row gap 0.2em; the count 0.3em after the entry; the dot 0.5em (9 px at 18 px). They are the brief's sizes, set as `--fact-label`, `--fact-gap`, `--fact-between`, `--fact-value` and `--dot-size` on `.facts`.
- The order inside a fact is label, dot, value. Item 2 says a dot "before their value"; the brief's decision 1 lists the dot first. Label, dot, value keeps every label at its fact's left edge and puts the hue against the word it colours.
- The capitals are kept under the rice theme too (`ui/forms/Field.svelte` drops its capitals under rice; the brief names capitals without a theme exception).
- The accessible text: a visually hidden copy of the whole fact in `present.fact`'s words, the drawn parts `aria-hidden`, chosen over a hidden separator because the spaces a browser reads between flex items are not fixed.
- One catalog key, `fact_count: '+{0}'`, the count as drawn.
- The form's and the chips' glyphs are dropped with the other glyphs, since every fact is drawn one way.
- The dot's size is the CSS custom property `--dot-size` with `9px` as the fallback in `Dot.svelte`.
- The split's file: one new file, `screen/drawn-slide.ts`.
- The probe line (`.probe`, `max-width: 100%`) measures against the slide's full width; it only signals a change of the body type's size.

## Wrong or impossible in the brief

- Item 6's two-line limit at the brief's sizes, with C1 to C4's expectations: handed back before any change and ruled by 699 (a).

## Limitations and sharp edges

- Every line count is an estimate from Helvetica's widths at face 1.0, calibrated on the brief's base measurement; `fed-faithful-ecg` and `hccnet-pathology` are unsettled within 5 percent; the look measures.
- The 13 decks of 12 to 14 facts take a third strip line and give their content about 30 px less room; a slide that just fitted can draw at a slightly smaller text factor, and one near its least factor can become Too tall. The look should compare the Findings view's Too tall list on those decks with the base.
- In a 400 px frame or at large text sizes the strip takes many lines (13 on `dongho-ecg-clustering` in a 400 px frame).
- The strip in a 1280 px frame is 110 px wider than the content column above it.
- Whether the hidden copy doubles the strip's words in a text selection, a find on the page or the PDF's text layer is not checked; it needs the look or the printed PDF.

## The case-run program

Run from the scratchpad as `node strip-fit.mjs <worktree>`; it reads the hub read only, prints only, and was deleted from the scratchpad before this report was written. The face factor is 1.0 for every count in this report (`FACE=1.0`); the program's default is 1.05. The commands: `FACE=1.0 LINES=99` for the line counts; `FACE=1.0 LINES=99 FS=27` for text size 1.5; `FACE=1.0 LINES=99 WIDTH=270` for the 400 px frame; `FACE=1.0 TODAY=1 WIDTH=1040 GAP=0.35` for the base; `FACE=0.95 LINES=99` and `FACE=1.05 LINES=99` for the sensitivity. Collaborators are taken in the manifest's order. The program does not model a value shrinking below its cap in a narrow frame, so its 400 px count is one fact per line where a fact is wider than the strip. The accent stripping ran on the combining range U+0300 to U+036F, written here as `\p{M}` to stay ASCII. Source:

```js
// Case-run program for C2-C5 and C7 of O158: reads each project deck's manifest of the research
// hub (read only), works out the strip's facts by the word rules of data/shapes/project-facts.ts,
// and estimates in px how the redesigned strip lays them out: each fact as a capital label, a dot
// for the hued fields, the value (a list as its first entry and +n) capped at a width, facts set
// apart by a gap, wrapped whole into lines of the strip's width. Widths are estimates from
// Helvetica's AFM advance widths times a factor for the system face; the look measures the truth.
// It prints only; it writes nothing.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(process.argv[2] + '/package.json');
const YAML = require('yaml');
const HUB = '/Users/axelfaes/workspace/research-hub';
const OC = process.argv[2];

const P = {
    fs: Number(process.env.FS ?? 18),
    width: Number(process.env.WIDTH ?? 1150),
    labelEm: Number(process.env.LABEL ?? 0.72),
    track: Number(process.env.TRACK ?? 0.04),
    labelGap: Number(process.env.LGAP ?? 0.4),
    factGap: Number(process.env.GAP ?? 1),
    capEm: Number(process.env.CAP ?? 14),
    face: Number(process.env.FACE ?? 1.05),
    dotEm: 0.5,
    dotGap: 0.4,
    moreGap: 0.3
};

// Helvetica advance widths per 1000 em.
const W = {
    ' ': 278, '!': 278, '"': 355, '#': 556, $: 556, '%': 889, '&': 667, "'": 191, '(': 333,
    ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278, ':': 278, ';': 278,
    '|': 260, '_': 556, '?': 556, '@': 1015
};
for (const c of '0123456789') W[c] = 556;
Object.assign(W, {
    a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500,
    l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500,
    w: 722, x: 500, y: 500, z: 500, A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778,
    H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722,
    S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611
});
const em = (text) =>
    [...text.normalize('NFD').replace(/\p{M}/gu, '')].reduce(
        (sum, c) => sum + (W[c] ?? 556),
        0
    ) / 1000 * P.face;

const load = (path) => YAML.parse(readFileSync(path, 'utf8'));
const byKey = (file) => {
    const doc = load(join(HUB, '.oculus/data', file));
    const entries = doc.entries ?? doc.datasets ?? [];
    if (Array.isArray(entries))
        return Object.fromEntries(entries.map((e) => [String(e.key ?? e.id), e]));
    return entries;
};
const vocab = load(join(OC, 'config/catalogs/vocab.yml'));
const people = byKey('people/people.yml');
const venues = byKey('research/venues.yml');
const pillars = byKey('pillars/pillars.yml');
const domains = byKey('pillars/domains.yml');
const resources = byKey('research/resources.yml');
const datasets = byKey('research/data.yml');
const funding = byKey('academic/funding.yml');
const label = (list, word) => vocab[list]?.[word]?.label ?? word;
const arr = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v.map(String) : [String(v)]);
const code = { deposited: 'deposited', 'review-anon': 'anon', none: 'pending' };

const LABELS = {
    form: 'Form', stage: 'Stage', chips: 'Status chips', domain: 'Domain', pillars: 'Pillars',
    datasets: 'Datasets', lead: 'Lead', supervisors: 'Supervisors', collaborators: 'Collaborators',
    year: 'Year', venue: 'Venue', funding: 'Funding', compute: 'Compute', code: 'Code',
    reproduced: 'Reproduced', tier: 'Tier'
};
const HUED = new Set(['form', 'stage', 'chips', 'domain']);

function factsOf(m) {
    const f = {
        form: m.form ? [label('forms', m.form)] : [],
        stage: m.stage ? [label('stages', m.stage)] : [],
        chips: arr(m.status?.chips).map((c) => label('chips', c)),
        domain: arr(m.domain).slice(0, 1).filter((k) => domains[k]).map((k) => domains[k].title ?? k),
        pillars: arr(m.pillars).filter((k) => pillars[k]).map((k) => pillars[k].title ?? k),
        datasets: arr(m.datasets).filter((k) => datasets[k]),
        lead: arr(m.lead).filter((k) => people[k]).map((k) => people[k].name ?? k),
        supervisors: arr(m.supervisors).filter((k) => people[k]).map((k) => people[k].name ?? k),
        collaborators: arr(m.collaborators).filter((k) => people[k]).map((k) => people[k].name ?? k),
        year: m.year ? [String(m.year)] : [],
        venue: m.venue && venues[m.venue] ? [venues[m.venue].short || venues[m.venue].name] : [],
        funding: arr(m.funding).filter((k) => funding[k]),
        compute: arr(m.compute).filter((k) => resources[k]).map((k) => resources[k].name ?? k),
        code: m.code_availability?.status ? [code[m.code_availability.status] ?? 'no code'] : [],
        reproduced: m.reproduced ? [m.reproduced.date ? String(m.reproduced.date) : 'reproduced'] : [],
        tier: m.tier ? [label('tiers', m.tier)] : []
    };
    if (process.env.UNMARKED && vocab.tiers?.[m.tier]?.unmarked === true) f.tier = [];
    return Object.entries(f).filter(([, w]) => w.length > 0);
}

function widthOf(field, words, firstIndex = 0) {
    const fs = P.fs;
    const lab = LABELS[field].toUpperCase();
    const labW = (em(lab) + P.track * lab.length) * P.labelEm * fs;
    const first = words[firstIndex];
    const more = words.length - 1;
    const countW = more > 0 ? (P.moreGap + em(`+${more}`)) * fs : 0;
    const value = Math.min(P.capEm * fs, em(first) * fs + countW);
    const cut = em(first) * fs + countW > P.capEm * fs;
    const dot = HUED.has(field) ? (P.dotEm + P.dotGap) * fs : 0;
    return { w: labW + P.labelGap * fs + dot + value, cut };
}

// Today's strip: one chip or tag per fact, 'Label: words, joined', at the strip's type, a chip's
// 5 px side padding and 1 px border, a 16 px-or-type glyph and 4 px gap for the glyphed fields,
// cut at the column, 0.35em to the next fact, in the 1040 px reading column.
const GLYPHED = new Set(['form', 'chips', 'year', 'code', 'reproduced', 'compute']);
const CHIPS = new Set(['form', 'chips', 'stage']);
function todayOf(field, words) {
    const text = `${LABELS[field]}: ${words.join(', ')}`;
    let w = em(text) * P.fs + (CHIPS.has(field) ? 12 : 0) + (GLYPHED.has(field) ? P.fs + 4 : 0);
    return { w: Math.min(w, P.width), cut: w > P.width };
}
function lay(facts) {
    const lines = [[]];
    let used = 0;
    for (const [field, words] of facts) {
        const { w, cut } = process.env.TODAY ? todayOf(field, words) : widthOf(field, words);
        const need = lines.at(-1).length === 0 ? w : used + P.factGap * P.fs + w;
        if (need <= P.width) {
            lines.at(-1).push({ field, w, cut });
            used = need;
        } else {
            lines.push([{ field, w, cut }]);
            used = w;
        }
    }
    return lines;
}

const decks = [];
const walk = (dir) => {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (!statSync(path).isDirectory()) continue;
        if (name === 'present') {
            try {
                statSync(join(path, 'present.yml'));
                decks.push(dirname(path));
            } catch {}
            continue;
        }
        if (['node_modules', '.git', 'code', 'manuscript', 'results', 'data'].includes(name)) continue;
        walk(path);
    }
};
walk(join(HUB, 'projects'));
console.log(JSON.stringify(P));
let hiddenAll = 0;
for (const folder of decks.sort()) {
    const m = load(join(folder, 'project.yml'));
    const facts = factsOf(m);
    const lines = lay(facts);
    const most = Number(process.env.LINES ?? 2);
    const shown = lines.slice(0, most).flat().length;
    const hidden = facts.length - shown;
    hiddenAll += hidden;
    const fill = lines.map((l) => Math.round(l.reduce((s, f) => s + f.w, 0) + P.factGap * P.fs * (l.length - 1)));
    const cuts = lines.flat().filter((f) => f.cut).map((f) => f.field);
    console.log(
        `${m.id}: facts ${facts.length}, lines ${lines.length} (${fill.join(' + ')} px), hidden ${hidden}` +
            (hidden > 0 ? ` [${lines.slice(most).flat().map((f) => f.field).join(', ')}]` : '') +
            (cuts.length > 0 ? `, cut ${cuts.join(', ')}` : '')
    );
    if (process.env.SHOW === m.id) {
        for (const [field, words] of facts) console.log(`  ${field}: ${words.join(', ')} -> ${Math.round(widthOf(field, words).w)} px`);
    }
}
console.log(`decks ${decks.length}, facts hidden in all ${hiddenAll}`);
```

Output of `FACE=1.0 LINES=99 node strip-fit.mjs <worktree>` (each line's `, cut ...` tail left off):

```
{"fs":18,"width":1150,"labelEm":0.72,"track":0.04,"labelGap":0.4,"factGap":1,"capEm":14,"face":1,"dotEm":0.5,"dotGap":0.4,"moreGap":0.3}
fed-faithful-ecg: facts 5, lines 1 (1125 px), hidden 0
dongho-ecg-clustering: facts 14, lines 3 (993 + 1046 + 473 px), hidden 0
hccnet-fl: facts 13, lines 3 (1055 + 1075 + 453 px), hidden 0
btd-autoencoder: facts 5, lines 1 (1096 px), hidden 0
clinical-ai-eval-artifacts: facts 5, lines 1 (1025 px), hidden 0
ecg-af-fair: facts 8, lines 2 (996 + 542 px), hidden 0
fl-privacy-auditing: facts 5, lines 1 (1075 px), hidden 0
florank-personalization: facts 6, lines 2 (1109 + 257 px), hidden 0
hccnet-fl-sweden: facts 6, lines 2 (966 + 386 px), hidden 0
hccnet-pathology: facts 5, lines 2 (1055 + 116 px), hidden 0
quantum-tensor-fl: facts 5, lines 1 (1096 px), hidden 0
ssm-longitudinal: facts 5, lines 1 (1087 px), hidden 0
bt-operator-theory: facts 10, lines 2 (1118 + 836 px), hidden 0
btfno: facts 12, lines 3 (1132 + 955 + 330 px), hidden 0
bttd-source-eeg: facts 13, lines 3 (1082 + 1064 + 473 px), hidden 0
bttn-incident-af: facts 13, lines 3 (1026 + 1113 + 330 px), hidden 0
covert-applied: facts 13, lines 3 (1081 + 947 + 682 px), hidden 0
covert-theory: facts 12, lines 3 (1015 + 1018 + 330 px), hidden 0
dries-bttr-ecg: facts 13, lines 3 (978 + 1055 + 330 px), hidden 0
ecg-readable-substrate: facts 10, lines 2 (1061 + 829 px), hidden 0
fed-multicellular-immune: facts 13, lines 3 (1122 + 1034 + 473 px), hidden 0
hccnet-revision: facts 12, lines 3 (1047 + 953 + 467 px), hidden 0
meseret-cirrhosis: facts 12, lines 3 (1091 + 950 + 330 px), hidden 0
raw-pls: facts 13, lines 3 (1063 + 1049 + 473 px), hidden 0
ward-bttr-crosssubject: facts 12, lines 3 (1131 + 1005 + 330 px), hidden 0
decks 25, facts hidden in all 0
```

The sensitivity, the line count of each deck at `FACE=0.95`, `1.0` and `1.05` (`LINES=99`): every deck the same at the three factors except `fed-faithful-ecg: 0.95=1 1.0=1 1.05=2` and `hccnet-pathology: 0.95=1 1.0=2 1.05=2`. At `FACE=1.05` the counts are 5 decks of 1 line, 7 of 2 and 13 of 3.

`FACE=1.0 FS=27`: 2 lines on 7 decks, 3 on 5, 4 on 12, 5 on 1 (`covert-applied: facts 13, lines 5 (809 + 997 + 887 + 1144 + 174 px), hidden 0`), `decks 25, facts hidden in all 0`. `FACE=1.0 WIDTH=270`: `dongho-ecg-clustering: facts 14, lines 13`, `decks 25, facts hidden in all 0`.
