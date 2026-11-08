# Brief check of O171 (the slide frame a 16:9 shape with no pixel size)

I read the whole brief `.scratch/migration/agents/briefs/O171.md` (164 lines) and the whole rules file `.scratch/migration/agents/spec.md`. In `plan.md` I read the Goal, step line 1732, and the rulings "Facts strip smaller" (:3636), "O171 frame shape" (:3665) and "Open item 730" (:3666). The tree is main at 8fe210f79. The only uncommitted changes are `plan.md` and `orchestrator-state.md` (`git diff --stat`), plus the untracked brief. I changed nothing.

There are four blocking findings:
1. **Panel.svelte is drawn inside a slide.** The brief calls it chrome outside the slide, so its 17 px and its px figure boxes are left unconverted.
2. **The deck reader has no unknown-key finding.** Item 1, C2 and C3 expect one, but no such finding exists.
3. **C7 cannot catch the leftover px.** Its grep misses px written through template expressions, px in Tag, Table and Panel, and px tokens such as `--radius`.
4. **The brief's browser instruction breaks the rules file.** Line 66 tells the builder to run cases on a scratch server, and `spec.md:65` forbids that "whatever a brief says".

## Names

Command: `git grep -n "defaults\.frame\|deck\.frame\|frameSetting\|deckFrame\|DeckFrame\|FrameSetting" -- . ':!config/local.yml' ':!.scratch'`, then the same for `audienceFeatures\|featuresFrame\|wholeFrame\|printPdf\|TEXT_LEAST\|TEXT_GAP\|too_tall\|frame_not_a_map\|frame_key_unknown\|frame_side\|AUDIENCE_SIZE`, for `section: Slides` and `Slides`, and for the slide.css variables (`slide-frame\|slide-design\|slide-reading\|slide-ui-\|--slide-fit`).

Hits outside "Paths this step writes":

- **`src/lib/state/shared/stores/desktop.ts:11` and `:91`.** Line 91 is `printPdf: (address: string, frame: DeckFrame) => Promise<PrintAnswer>;`. Item 7 makes it false (`printPdf` takes the address alone) and verify 5 greps `DeckFrame`. The file must be added to the paths.
- **`.scratch/migration/agents/guarded.md:257`.** It names `describe 'frameSetting', 'reads the frame a workspace sets' and 'answers the default for a wrong defaults.frame.%s and names the key' in settings.test.ts`. Item 1 deletes those tests, so this line becomes false. `spec.md:60` says a step deletes the entries its change makes obsolete, but a builder may not edit `.scratch/` (`spec.md:36`). The brief does not say that the orchestrator rewrites this entry at landing.
- **`config/text/views/academic/present.yml:148-149`.** `too_tall: Too tall` is the tile chip's label. It stays true.
- **`src/lib/themes/themes.css:55`** ("The slide scale is lowered in `slide.css`") **and `src/lib/themes/tokens.css:159`** ("the slide scale in `slide.css`. No rule carries its own px value"). Both stay true as long as the rice block stays in slide.css.
- **`src/routes/+layout.svelte:3`** ("the frame a slide is laid out in (themes/slide.css)"). It stays true.
- **`tests/data/hubs/website-files.test.ts:458`** (`'Slides'`). This is a website link label, unrelated.
- **The O151 worktree.** `git diff HEAD -- src/lib/themes/slide.css` in `.agents/worktrees/migration-O151` adds `--slide-design-facts: 12px` and `--slide-design-facts-label: 10px`. That is not on main. `plan.md:3666` (Open item 730) gives it to O151 round 2.
- **Px drawn inside a slide in files missing from the paths:**
  - `src/lib/ui/controls/Tag.svelte:87,90` (`gap: 4px`, `padding: 1px 0`). Tags are drawn on slides through `parts/Legend.svelte:7` and `parts/project/Project.svelte:19`.
  - `src/lib/ui/display/table/Table.svelte:161,175,179` (`padding: 3px 8px 2px`). The table is drawn on slides through `parts/Summary.svelte:11`.
  - Neither can be reached through a slide variable without editing the file.
- **Px tokens drawn inside a slide.** `--radius` (10px) and `--radius-sm` (6px) come from `tokens.css:122-123`, with rice forms 3px and 2px at `themes.css:72-73`. They are used 16 times in slide.css, `parts/` and `Panel.svelte` (`git grep -ho "var(--[a-z0-9-]*"` count), and the frame's own `border-radius: var(--radius)` is at `slide.css:29`. The brief names none of them.

Hits inside the paths that the brief does not name:

- **`src/lib/views/academic/present/Panel.svelte`.** It is a slide part (head comment: "One visual of a project slide"), drawn by `Project.svelte:21, :151, :190`. It has 17 hits of `[0-9]px`, among them `margin-bottom: 14px` (the gap between figures that the layout reads), `padding: 6px` and `border: 2px solid` at :162. At :60-62 and :69 it places boxes with `${box.x}px`. The brief, line 20, wrongly puts it among the chrome.
- **`screen/drawn-slide.ts`.** It reads the px of an image's padding and border (:2, :27-41) and feeds the layout. Item 4 does not name it.
- **`Project.svelte:182`.** `${TEXT_GAP}px`.
- **`Slide.svelte:285`.** `$state.snapshot([row, deck.frame, held])` is the trigger for a new layout. Nothing says what replaces `deck.frame` there.
- **`present.svelte.ts:100`.** `TOO_TALL_PX = 1`. Item 5 means it but does not cite it.
- **`present.svelte.ts:560-587`.** `savedFrame` and `createPresenting(frameOf)` are callers that item 8 implies but does not name.
- **`spec.ts:1`.** Its head comment says "the title, the frame". Neither item 9's grep nor verify 5's grep finds it.

## The step line

Each part of `plan.md:1732`, and the item of "What to build" that serves it:

- **`defaults.frame` removed, with its two config files and the Settings section "Slides" with its Width and Height controls.** Item 1.
- **`deck.frame` removed: the deck schema, the frame reader `config/settings/present.ts`, both deck readers.** Item 1. The server reader is `read.ts`/`spec.ts`; the page's reader is `present.ts:602-605`.
- **"replaced by the shape 16:9 alone".** Item 2.
- **The type sizes in slide.css as fractions.** Item 3.
- **"every other px a slide is drawn in (its parts' measures, its chips' and table's type steps, its padding, the layout arithmetic of `slide-layout.ts`)".** Items 3 and 4, but only in part:
  - Item 3 limits the conversion to "the slide parts listed under 'What is on the tree'". That list leaves out Panel.svelte, Tag.svelte, Table.svelte, the chip's literal `gap: 4px` and `padding: 3px 5px` (`Chip.svelte:146,151`), the radius tokens and the print route's `PAGE_PADDING`.
  - The line's "every other px" is therefore not fully served.
- **"drawn at the size of its room with no scale transform".** Item 3.
- **The facts strip's two sizes go to O151 round 2.** O171 has no requirement for them, which is correct. C12 still says "the facts strip included", which on main means the strip's `--slide-fs-small`.
- **"every place that draws or measures a slide (the Stage, the Overview tiles, the presenter screen, the audience window, the PDF export) reading the shape".** Items 2, 7 and 8.
- **"the 'Slide too tall' finding naming no pixel size".** Items 5 and 6.
- **"`docs/decks.md` saying so".** Item 9.
- **"built by a builder agent".** The brief is a builder brief.

Every requirement serves a part of the line. Item 9's `docs/templates.md:1929` follows from removing the key. Every part of the line has a requirement; the one served only in part is the "every other px" part above.

## Premises

Reran or checked:

- **`git grep -n "slide-design-facts" -- src`.** Prints nothing (exit 1), and the O151 worktree diff shows the two px sizes. Holds.
- **`config/defaults/present.yml:3-6`, `config/options/present.yml:7-18, :9, :17, :36-37`, `git grep -n "section: Slides" -- config`.** Only :9 and :17. Holds.
- **`src/lib/data/sources/config/settings/present.ts` "(whole file, 91 lines)".** `wc -l` prints 87. Wrong count.
- **`config.ts:108`, `decks.ts:94`, `settings.test.ts:566`, `present.test.ts:188,300,525,803`, `deck-globs.test.ts:92`.** Hold.
- **"problems.ts names the frame twice (`git grep -n -w frame -- .../problems.ts`)".** That command prints nothing. The two mentions are `frameSetting` at :30 and :68. The cited command is wrong.
- **`deck-schema.yml:18`; `spec.ts:73-74, 207`; `read.ts:23-27, 70, 92-93, 230, 249-269, 336, 763, 819`; `findings.yml:137-140, 142`; `present.ts:602-605, 38, 51`; `model-deck.ts:312, 317-318, 334`; `index.ts:462`.** Hold.
- **`grep -rn "^\s*frame:" ~/workspace/research-hub --include=present.yml`.** Prints nothing (exit 1). Holds.
- **`docs/templates.md:1929` and `docs/decks.md:13, 74, 92, 105`.** Hold.
- **`slide.css` (69 lines) :17-21, :22-24, :25, :27, :63-69, :1-15; `tokens.css:166-168`.** Hold.
- **Stage.svelte, 147 lines.** Holds. But:
  - "draws it with `transform: scale(fit(...))` (`:96-110`)": the markup is :80-101 and the transform is at :95.
  - "measure (`:52-75`)": it runs :52-77.
  - `fit` at `present.ts:282-289`: the doc comment starts at :281 and the function is :286-289. Close enough.
- **`Present.svelte:20-21`, `Presenter.svelte:121`, `Tile.svelte:113`, `show/+page.svelte:277`, `Framed.svelte:49`.** Hold.
- **Px counts per file (`git grep -c "[0-9]px" --` over the present folder and Chip.svelte).** Project 27, Grid 9, Plain 7, Section 6, Words 4, Facts 3, Equation 3, Summary 2, Legend 2, Dot 2, Chip 12. Hold.
- **"The chrome around a slide (`Panel.svelte`, ...) is not drawn inside a slide".** False. See Names: `Project.svelte:151, 190` draw `<Panel ...>` inside the slide.
- **`Slide.svelte:9-35, :92-93, :132-140`.** Hold. SLACK is at :93.
- **`slide-layout.ts` (252 lines) "`TEXT_LEAST = 360` (`:22`), `TEXT_GAP = 26` (`:25`), `FIT_LEAST`, `FIT_MOST` (`:28, :31`)".** `grep -n` gives :23, :26, :29, :32, each off by one.
  - "It has no import": true, the file has no import line.
  - It is imported by `Slide.svelte` and `Project.svelte:23`.
  - `git grep -ln "slide-layout" -- tests` prints nothing. Holds.
- **`export.ts:2, 30, 47-48, 231`; `acts.svelte.ts:22, 96`; print route `:2-15, 51, 67-74, 114-120`.** Hold.
  - Line 51 is the doc comment of `PAGE_PADDING = 128` (:52), "The frame's padding above and below the slide, in px". The brief cites it but no item acts on it.
- **`print.ts:3-4, 43-55`; `bridge.ts:42-50, 228-234`; `place.ts:86-95, 7, 72-79, 98-119, 150`; `preload.cjs:33`; `app.ts:151`; `show.ts:17, 55`; `windows.ts:151`.** Hold.
- **`present.ts:292-297` (`audienceFeatures`); `present.svelte.ts:496-501`; `options/present.yml:18`.** Hold.
- **`npm ls electron`.** Prints `electron@44.5.1`. Holds.
- **`ls docs/adr`.** Prints "No such file or directory". Holds.
- **Verify list.** `.agents/plan.yaml:4` gives `verification: .scratch/migration/orchestrator-state.md`. Holds.
- **Item 1: "a deck file that still holds `frame:` gets the finding every unknown deck key gets".** No such finding exists.
  - `readSpec` (`spec.ts:201-212`) reads only `title` and `frame` from `deck:` and raises nothing for any other key.
  - The deck group of `findings.yml` (:116-142) has no unknown-key text.
  - The deck schema "serve[s] the editor" (`src/lib/data/snapshot/schema/static.ts:7-8`), whose records set `additionalProperties: false` (`record.ts:163`). So at most an editor diagnostic shows; I did not run it to see. A Present finding does not.
- **C8, "the rules file's standing demand on focus".** That demand is `orchestrator-state.md:60`, not `spec.md`.

## Cases and checks

Cases inconsistent with the rules file:

- **Brief line 66, and line 57's first run of every case on the unchanged tree.** The builder is told to run browser cases on its own scratch server. `spec.md:65`: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says." Those cases go to the look on landing (`spec.md:65, 67`). This affects C1, C4, C5, C7 (computed font size), C10, C11, C12, C13 and C14.
- **C8.** The builder starts the desktop print window. That is a page under `spec.md:65`. The demand C8 cites lives in the state file, not the rules file.
- **C2 and C3.** They expect "the unknown-key finding", which the tree does not have (see Premises). To build one is a new user-visible finding text that the brief does not dictate (`spec.md:18`).
- **Verify 4.** `grep -nP '[^\x00-\x7F]'` is the grep form that `spec.md:103` says is replaced by the perl gate. It also lets control characters through.
- **Verify 6.** `npm run diagrams` "no diff after a second run" runs the tool a second time. `spec.md:26`: diagrams run "right before each run of the list and at no other time".
- **The unused-exports check is missing.** `spec.md:89` asks for `sh utils/unused-exports.sh` compared with the base's lines "which the brief names". The brief names no base file. O168 and O169 named `.agents/worktrees/<step>-base/unused-exports.txt`.
- **Verify 2 and 3** (`npm run check`, `npm run lint`, `npx prettier --check`). They repeat what `npm run test:quick` holds (`spec.md:26`). Not forbidden, but a second whole-project svelte-check per run.
- **Item 9.** It asks `docs/decks.md` to say the deck "has no `deck.frame` key". The same item and verify 5 require `deck.frame` to appear nowhere in docs. The two contradict each other.
- **"Paths this step writes".** The line `src/lib/views/academic/present/ (every file that draws ...)` is a folder with a list. The brief's own rule is "One path per line: a whole file, or a range of lines".

Cases that ask the builder to check or quote a place the step does not change:

- **C9 "read in `audienceFeatures` and its test".** No test exists (`git grep -ln "audienceFeatures" -- tests` prints nothing). The fallback "by reading the code" holds.
- **C5.** It reads the research hub's decks. That is read-only, so it is allowed, but it needs a page.

## The question

Could each pass without the goal being reached?

- **The step line's check.** The line names no command. Its acceptance "every other px a slide is drawn in" could be ticked against the brief's closed list while Panel, Tag, Table, the chip's padding and gap, the radius tokens and `PAGE_PADDING` remain in px. Yes, it could.
- **Item 1.** No for the removals. The tolerance clause can be met by nothing at all, since no unknown-key finding exists.
- **Item 2.** It could pass while CSS writes `16 / 9` or `13.333in` as literals beside the constant. Item 7 itself dictates a literal.
- **Item 3.** Yes. The px it covers are "the slide parts listed under 'What is on the tree'", a closed list that leaves out:
  - `Panel.svelte`: 17 px, plus box styles at :60-69;
  - `Tag.svelte` :87, :90;
  - `Table.svelte` :161, :175, :179;
  - `Chip.svelte` `gap: 4px` (:146) and `padding: 3px 5px` (:151), which do not follow `--chip-px`, so no slide variable reaches them;
  - `--radius` and `--radius-sm` on the frame and the cards.
- **Item 4.** Yes, in part:
  - `drawn-slide.ts` (the padding and border px it measures) is not named.
  - Slide.svelte's state (`room` written as `${room}px` at :327, `depth`, `boxes`) is drawn as `${box.x}px` in `Plain.svelte:50-61`, `Project.svelte:176-182` and `Panel.svelte:60-69`. A layout that "divides once at its entry" can hand back fractions that are then written in px at the current size.
  - Then the boxes go stale on a resize unless the search runs again. Today a resize changes only the scale, so the search does not rerun on one.
- **Item 5.** No. But the slack fraction is not given. One px of 720 becomes 0.16 px on a 112 px tall tile, inside measuring noise, so a tile can disagree with the pane.
- **Item 6.** No, but see Dictated text: the dictated message names the wrong height.
- **Item 7.**
  - `PAGE_PADDING = 128` (`print/+page.svelte:52`) stays a px copy of slide.css's padding, used at :117. Nothing in item 7 removes it.
  - `size: 13.333in` is 959.976 pt, not 960. C8's expected `Page size: 960 x 540 pts` would then not print, or the page changes size, against decision 3. This is a judgment; I did not run it.
  - The print window's px size "derived from the shape" is not given (the shape has no size). The builder picks it silently.
- **Item 8.** It covers only the desktop host. In a browser, `window.open(..., 'popup')` with no width or height opens at the browser's default size, which is not 16:9. Today it opens at 1280 by 720 (`present.ts:296`).
- **Item 9.**
  - The end grep `git grep -n "deck.frame\|defaults.frame\|frame's own px\|1280" -- src config docs` cannot print nothing. It hits `src/desktop/decide/place.ts:18` (`DEFAULT_SIZE = { w: 1280, h: 800 }`, the main window, unrelated) and coordinates in `docs/diagrams/channels.svg:784`, `layer-views.svg:571-572`, `writes.dot:417,437` and `writes.svg:313,2263,2275,2287`.
  - It also misses `spec.ts:1` ("the frame") and every "1040 px"/"1150 px" comment, such as `slide.css:5` and `Slide.svelte:6,35`.
- **C1.** No.
- **C2.** Yes. 1600 by 900 is itself 16:9, so "the deck drawn 16:9" is true on the unchanged tree too. Only the finding tells the two apart, and that finding does not exist. A non-16:9 input such as `{ width: 1000, height: 1000 }` would show the key is ignored.
- **C3.** It rests on the missing finding.
- **C4.** Yes. "any difference is named with its slide" lets the case pass with a tile's too-tall verdict differing from the pane's. Text at 3.75 px is subject to glyph rounding and possibly the browser's minimum font size. The tile mark would then contradict the pane.
- **C5.** It guards against regressions, not the goal. Verdicts can match with px left everywhere.
- **C6.** No, but the text is wrong (see Dictated text).
- **C7.** Yes:
  - `[0-9]px` does not match `` `${TEXT_GAP}px` ``, `` `${box.x}px` `` or `` `${room}px` ``.
  - Slide.svelte has 0 such hits, so its part of the check checks nothing.
  - `Panel.svelte` sits outside `parts/`, and Tag and Table are outside the grep.
  - The chip check reads only the chip's font size, not its padding or gap.
- **C8.** See item 7.
- **C9.** It passes for the desktop app and does not cover the browser.
- **C10.** It passes within 0.5 px (51.69 for 52), but it checks only the design sizes. Under rice the chip and table steps are 10, 11 and 12 px today (`themes.css:59-61`), and item 3 converts them to 11, 12 and 13 of 1280 with no rice form.
- **C11.** Yes. The next-slide room is 16:9 on the unchanged tree too (`aspect-ratio` from 1280/720).
- **C12.** No.
- **C13.** Yes, it is a regression guard: `fit` already letterboxes.
- **C14.** Yes, a regression guard.

## Implied inputs

Inputs the step implies but never states:

1. **Rice theme's chip and table steps.** Missing. It costs a 10% size change of every chip and table on a slide under rice. Expected: `--slide-ui-xs/sm/md` take rice forms of 10, 11 and 12 of 1280 of the width, times `--text-scale` and `--slide-fit`.
2. **A pane resized after the slide was laid out** (a split dragged, the window resized, the audience window's fullscreen toggle). Missing. Expected: the same boxes, as fractions of the frame, with nothing drawn at stale px. Either the boxes are in container units, or the search runs again and gives the same factor.
3. **The audience window opened from a browser rather than the desktop app.** Missing, and it changes from today. Expected: a 16:9 window. If not that, this is a decision to put to the orchestrator.
4. **A slide at the fit boundary drawn on an Overview tile and in the pane.** Missing as a hard expectation. Expected: the tile's too-tall chip agrees with the pane's finding, since one count must agree everywhere.
5. **The print route's container.** Missing. `.page` is itself `.slide-frame`. Its own padding in container units would resolve against an ancestor container, of which there is none. Expected: page padding 64/1280 of the page width, and the slide's sizes as on screen.
6. **The PDF page size as printed.** Expected: `pdfinfo` prints `Page size: 960 x 540 pts`. That needs `960pt 540pt` or an exact inch value, not `13.333in`.
7. **A workspace file whose `settings:` sets `defaults.frame.width`.** Not in Cases. Low cost: no hub file sets it (`grep -rn "frame" .oculus --include='*.yml' --exclude=local.yml` in the research hub shows no setting). Expected: `findings.config.settings_unknown`, "defaults.frame.width is not an option; it is not applied".
8. **The presenter screen's current slide** (as against the next-slide room) at a narrow presenter window. Not in Cases. Expected: the largest 16:9 box its room holds.

## ADRs

None. oculus has no `docs/adr` folder (`ls docs/adr`: "No such file or directory").

## Dictated text

- **`grep -n "too_tall: 'slide" O171.md` gives line 35:** `too_tall: 'slide too tall: {0} runs {1}% of its height past its frame'`.
  - It breaks `spec.md:21` ("name the actual"). "its height" refers grammatically to the slide (`{0}`), but item 6 defines `{1}` as a percentage of the frame's height. The sentence states the wrong measure.
  - The rest holds: ASCII, the catalog's lower-case style, no px.
- **`grep -n "runs <n>%" O171.md` gives line 47 (C6).** Same text, same break.
- **`grep -n "size: 13.333in" O171.md` gives line 36:** `size: 13.333in 7.5in; margin: 0`.
  - The value is not "the page today's 1280 by 720 frame prints at": 1280 px is 13.3333... in. As text, the line is false by 0.024 pt in width.
  - It also gives C8's expected `pdfinfo` line up. This is a judgment; not run.
- **`grep -n "has no \`deck.frame\` key" O171.md` gives line 38 (item 9's content for `docs/decks.md`).**
  - It contradicts the same item ("nothing names ... `deck.frame`") and verify 5.
  - A sentence naming a removed key describes an earlier state, which is the kind of comparison `spec.md:44` bans in comments and test titles.
  - The rest holds. `docs/decks.md` may be edited because the step line names it under ruling O171 frame shape (`spec.md:72`).
- **Line 33 (item 4's head comment): "the same slide gives the same boxes at every size of the frame".** It holds as a rule, but it becomes false if the C4 differences the brief allows occur. The builder should state it only as far as C4 measures it.

## Declined to judge

- **Whether Chromium in Electron 44 applies its minimum logical font size to font sizes in container units on small tiles.** It would need a page run, which this check does not make.
- **The exact `pdfinfo` output for `@page { size: 13.333in 7.5in }`.** Not run, since it needs the desktop print window.
- **The editor's schema diagnostic for a deck holding `frame:` once the schema field is gone.** Not run, since it needs the editor in a page.
- **Whether running `npm run check` and `npm run lint` beside `npm run test:quick` counts as a finding under `spec.md:26`.** The text neither bans nor allows it.

Usage: a8c7afd700e04bb47, claude-opus-5-5, 221013 tokens, 66 tool uses, 10.5 min

## Closed

Each finding closed by a change to the brief:

- Panel.svelte drawn inside a slide: moved out of the chrome list into "The px inside a slide", named in item 3 and the paths.
- No unknown-key finding for a deck: item 1 and C2 now say the deck reader does not read `frame`, the editor's schema marks it and the Present view ignores it; C2 uses a square frame (1000 by 1000) so it tells the two trees apart; C3 replaced by a workspace `settings:` key, which gets the existing `settings_unknown` finding.
- C7 grep too narrow: widened to px written through template expressions and to Panel, `screen/` and the print route; Tag, Table and the chip's padding and gap named in item 3 with a slide-scoped rule; `--radius` and `--radius-sm` set on the frame as fractions.
- The builder runs no page (`spec.md:65`): the scratch-server instruction removed; every case that only a page shows names the look on landing as its proof, and the orchestrator measures there.
- `desktop.ts:91` added to the paths and to item 1 and item 7; `guarded.md:257` rewritten by the orchestrator at landing (item 10, report's "Doc text").
- `spec.ts:1` and the px-box comments (`1150 px`, `1040 px`) named in items 1 and 9 and in verify 4; item 9's end grep replaced by verify 3 and 4, which do not hit `place.ts:18` or the diagrams.
- `Slide.svelte:285`, `present.svelte.ts:100` (`TOO_TALL_PX`), `present.svelte.ts:560-587` (`savedFrame`, `createPresenting(frameOf)`), `drawn-slide.ts` and `Project.svelte:182` named in items 3, 4, 5 and 8.
- Boxes drawn at stale px after a resize: item 3 writes the layout's boxes and the room height in container units; C15 added.
- Slack fraction not given: item 5 gives `TOO_TALL_PX` 1/720 and `SLACK` 0.5/720 of the frame's height, and makes a verdict that differs by size a defect of the step, not a note (C4).
- `PAGE_PADDING` and the print container: item 3 makes each `.page` the size container and removes `PAGE_PADDING`.
- `13.333in` is not 960 pt: the page is `960pt 540pt` (item 7, decision 3, C8); the print window's size is derived from the page constant (item 7).
- The browser's audience window: item 8 gives a 16:9 size from the screen (decision 6); C9 rewritten without the missing test.
- Rice chip and table steps: item 3 and C10 give 10, 11, 12 of 1280 under rice (decision 5).
- The dictated too_tall line named the slide's height: rewritten to "runs past its frame by {1}% of the frame's height" (the "Dictated text" section, C6).
- Item 9's sentence naming the removed key: removed; decks.md names no deck key for the frame.
- Literals beside the constant: item 2 forbids `16 / 9`, `1280`, `720`, `960pt`, `540pt` literals outside the constant.
- Verify list: the ASCII check is the rules file's perl gate; diagrams run once before `test:quick`; `npm run check`, `npm run lint` and prettier removed (held by `test:quick`); the unused-exports check against `.agents/worktrees/O171-base/unused-exports.txt` added.
- Paths: the folder entry replaced by one path per line.
- Premise counts: `present.ts` 87 lines; problems.ts cited by its `frameSetting` lines; Stage, slide-layout and `fit` line numbers corrected; C8's demand no longer cited.
- C11, C13, C14 kept as regression guards with their proof named; C4's hard expectation made item 5's rule.
