# Step O157 brief check (on main at 2fb7177ad)

## 1. Names

The commands are run in `~/workspace/oculus`, each grep over `src tests config docs utils README.md .scratch/migration/agents/guarded.md` with `--exclude=local.yml`.

- `Slide.svelte`: the hits outside the write list are `Facts.svelte:3` ("from the project's deck (Slide.svelte)") and `Framed.svelte:14` / `print:29` / `show:34` (imports). The change leaves them true.
- `Panel.svelte`: there are two hits outside the write list. `tests/checks/source/html-sites.test.ts:37` is the allow-list key `'views/academic/present/Panel.svelte:diagram'`, and its text says the markup "is put through sanitiseDiagram() where it is derived, one line above the site". The key goes false if the builder renames `diagram`, moves the `{@html}` site, or moves the derivation away from the line above the site. The brief does not name this key. The other hit, `AppFrame.svelte:72`, is `ApprovalPanel` and has nothing to do with this step.
- `Stage.svelte`: the hits are comments at `Present.svelte:84`, `Equation.svelte:64`, `Project.svelte:257`, `Section.svelte:100`, `Grid.svelte:122`, `Panel.svelte:166` and `slide.css:3`, and they are about the wallpaper surface. All of them stay true.
- `Framed.svelte`: the hits are `Present.svelte:22` ("The overview draws every slide the same way, scaled to its tile"), `Presenter.svelte:13` ("the next slide's room takes the frame's proportions") and `Tile.svelte:3` ("measured (screen/Framed.svelte, scaled to the tile)"). All of them stay true.
- `Project.svelte`: the hits are `GroupHead.svelte:75`, `CardDocs.svelte:20` and `Projects.svelte:97`, and all three are about the board's `views/boards/project/Project.svelte`. They are unrelated.
- `Plain.svelte`: the only hit is `Slide.svelte:18`, an import.
- `slide.css`: the hits outside the write list are `Facts.svelte:14`, `tokens.css:159`, `themes.css:55`, `+layout.svelte:3` and `:15`, `Stage.svelte:7` and `:127`, `Slide.svelte:5` and `print:42`.
  - `Facts.svelte:14` reads "drawn at one size, the slide's small type (`--slide-fs-small`, themes/slide.css), so the strip scales with the slide, the text size and the theme". If item 2's factor is put on the `.slide-frame` type scale, the strip also scales with the fit factor. The comment then leaves out what now sets its size. `parts/project/Facts.svelte` is not matched by the write list's `parts/*.svelte`.
  - `tokens.css:159` ("the slide scale in `slide.css`. No rule carries its own px value") stays true.
  - `themes.css:55` ("The slide scale is lowered in `slide.css`") stays true.
- `present/print` and `present/show`: the hits are `src/desktop/decide/sender.ts:5,26,29`, `links.ts:8`, `windows/show.ts:2`, `present.ts:625,633`, `acts/export.ts:2` and `Present.svelte:56`, plus `tests/server/desktop/window-guard.test.ts:88-156` and `tests/server/root/hooks-server.test.ts:351-355`. They name the route paths, and the step does not change those paths. They stay true.
- `--slide-fs-*`: there are 25 uses in `parts/Words.svelte:51,56`, `Summary.svelte:81,101`, `Facts.svelte:155-169`, `Title.svelte:52-73`, `Section.svelte:57-96`, `Grid.svelte:61-115` and `Slide.svelte:127`.
  - None of them is made false by name.
  - Each one becomes a size moved by item 2's factor, and that includes the facts strip (`Facts.svelte`) and the key hint (`Slide.svelte:127`). Item 2's list of "the slide's text" names neither of them.
- `--slide-reading`: the hits are `Slide.svelte:5` and `:106` (`max-width: var(--slide-reading)`) and `slide.css:14`, all in the write list. This name matters for section 4: the reading column caps the room at 1040 px wide, and the brief's room of 1150 px leaves that out.
- `--text-scale`: there are about 80 uses under `src/lib/ui`, `src/lib/shell` and `src/lib/views`, none in the write list. The step keeps its meaning, so none goes false. A related fact matters for item 4: the only writer of the variable is `src/lib/shell/window/appearance.svelte.ts:109` (`grep -rn "'--text-scale'\|text-scale:" src` prints that line and `tokens.css:154 --text-scale: 1`). The print and show routes do not mount the shell, so they draw at text scale 1.
- `.fig`, `.figure` and `.cols`: a grep for the class rules and attributes finds them only in `Panel.svelte`, `Plain.svelte` and `Project.svelte`, all in the write list. The other hits are pty `cols` and the data field `panels.figure`, which are unrelated.
- `findings.deck.too_tall` / `too_tall`: the hits are `present.svelte.ts:100,492,497`, `Tile.svelte:131-132`, `config/text/findings.yml:143` and `config/text/views/academic/present.yml:154-155`.
  - The message "slide too tall: {0} runs {1} px past its frame of {2} by {3} px" stays true.
- "Too tall" / "too tall": the hits outside the write list are listed here. Each is judged against the new behaviour.
  - `config/options/present.yml:18` reads "A slide whose words run past it is a Slide too tall finding". It is true after the step and false on today's tree.
  - `docs/HELP.md:345` reads "The strip keeps its room while hidden, so the slide's layout and its Too tall finding do not change with the toggle". It stays true.
  - `docs/decks.md:389` says the same thing and stays true.
  - `rail-badges.svelte.ts:219` and `navigation/status.ts:490` stay true.
  - `docs/decks.md:432` reads "when the Present view draws a slide more than 1 px taller than its frame". The change makes it false, and it is in the write list ("Slide findings").
- `.scratch/migration/agents/guarded.md`: no hit for any of the names. `grep -n "box.ts\|present/screen\|views/academic/present\|too_tall\|Too tall\|present.svelte.ts\|state/life/present" .scratch/migration/agents/guarded.md` prints nothing.

Findings:
1. `tests/checks/source/html-sites.test.ts:37` keys the allow list on `Panel.svelte:diagram` and says the sanitise is "one line above the site". A rewrite of Panel can make that key or its sentence false. The brief does not name the file.
2. `Facts.svelte:14` says the strip "scales with the slide, the text size and the theme". Item 2's factor adds a fourth cause and the file is outside the write list. The brief does not say whether the facts strip and the key hint take the factor.

## 2. The step line

The step line is `plan.md:1699`. Each part is mapped to the item of "What to build" that serves it.

- "a slide keeps its deck's frame shape, scaled to the screen it is drawn on": this is already built (`fit`, `present.ts:286-289`, `Stage.svelte:51,100`). Item 4 keeps it and item 6 documents it.
- "lays out its title, text and figures in it from what it holds": items 1, 2 and 5.
- "each figure placed by its own width-to-height ratio": item 1, and decision 4 for where the ratio comes from.
- "a tall figure a column the full height of the room under the title, as wide as its ratio asks": item 1, second bullet. The brief then adds the 360 px text minimum (decision 2, case C2). With it, a figure whose ratio lies between (room width - 360 - gap) / room height and the room's ratio is drawn narrower and shorter than the full room height. That departs from the line's "as wide as its ratio asks". The brief records it as a reversible decision.
- "a wide figure the full width under the text": item 1, third bullet.
- "two or more figures side by side or stacked, whichever draws them larger": item 1, first bullet.
- "the text filling the room left between a least and a greatest size": item 2.
- "no figure drawn past the frame": item 1, last bullet, and item 3's second sentence.
- "'Slide too tall' raised only for text that does not fit at its least size": item 3.
- "the Stage, the Overview tiles, the presenter screen, the audience window and the PDF the same way": item 4.
- "`docs/decks.md` says so": item 6.
- "built by a builder agent (ruling Slide layout from content)": the worktree and base copy lines. The ruling is checked under section 3.

Findings: none. Every part has a requirement; the only departure, the 360 px minimum, is stated as decision 2.

## 3. Premises

Each fact of "What is on the tree" is checked against the tree.

- Step line and ruling: `grep -n "^- O157" .scratch/migration/plan.md` gives `1699:` and `grep -n "Slide layout from content"` gives `3584:`, both as the brief says. `git show 567e829d3:.scratch/migration/orchestrator-state.md | grep -n "Open item 693"` gives `186:`, and it names `Panel.svelte:52-58`, `.fig { width: 100% }`. That holds: `Panel.svelte:52-58` is `.fig { width: 100%; padding: 6px; border: 1px ...}`. The open item also says the column is "about 485 px" and the room under the title "about 418 px at text scale 1". The brief does not carry the 418.
- Line counts: `wc -l` gives `Slide.svelte` 130, `Framed.svelte` 50, `Stage.svelte` 152, `print/+page.svelte` 181, `slide.css` 40 and `Project.svelte` 267. All hold.
- `show/+page.svelte:264-266`: `grep -n "<Stage" src/routes/present/show/+page.svelte` gives `264:` with `<Slide>` at 265. This holds, and the page passes no `onmeasure`.
- `print:152`: `<Slide {row} {deck} {facts} first={false} />` is at 152, and the head comment is at `:10-11`. Both hold.
- `grep -rln "slide-frame" src` prints `Stage.svelte`, `themes/slide.css` and `print/+page.svelte`. This holds.
- Frame: `config/defaults/present.yml:4-6` holds `frame: width: 1280 height: 720`, and `fit` is at `present.ts:286-289`. Both hold.
- `slide.css`: padding 64 (`:16`), border 1 px (`:17`), the sizes 56/36/28/24/18 times `--text-scale` (`:9-13`), rice 52/33/26/22/17 (`:35-39`) and `--slide-reading: 1040px` (`:14`) all hold.
- "So in the 1280 by 720 frame the inner box is 1150 by 590 px" holds for the Stage's frame: 1280 - 128 - 2 = 1150 and 720 - 128 - 2 = 590.
  - The print page's `.page` has `border: none` (`print/+page.svelte:164`), so its inner box is 1152 by 592.
  - The audience window's Stage with `bare` drops the border too (`Stage.svelte:134-136`), giving 1152 by 592.
  - The width a slide's parts get is not the inner box. `.reading` has `max-width: var(--slide-reading)` (`Slide.svelte:106`), so it is 1040 px. A project slide also takes `padding-left: 13px` plus a 4 px border (`Project.svelte:125-126`), which leaves 1023 px.
- `grep -rn "<img" src/lib/views/academic/present/` prints three lines, against the brief's "lists two": `markup.ts:56` (the `GAP_IMAGE` regex), `Plain.svelte:29` and `Panel.svelte:32`. The brief names `markup.ts:56` in a separate sentence, so the count is off but the content is there.
- Panel: the caption `.cap` is at `:39-41`, the explanation at `:42-44`, the diagram at `:36-37` and the gap at `:34`. All hold.
- Plain: `.figure { max-width: 100%; max-height: 480px }` is at `Plain.svelte:58-62`. It holds.
- Project: `.cols` with `minmax(min(300px, 100%), 1fr)` is at `:185-190` and holds. The brief puts "right the equation and the panels" at `:113-120`. Those lines are the panels loop and the closing tags; the right column, equation included, is at `:109-116`, so the brief is off by a few lines.
- The Markdown image: the brief points at `markup.ts:56` for the gap. The style of an image inside Markdown is `Words.svelte:40-43` (`.block :global(img) { max-width: 100%; ... }`), which the brief neither names nor lists to read.
- Too tall: the measuring effect is at `Stage.svelte:55-82`, against the brief's `:56-83`. In `present.svelte.ts`, the store member is at `:168-173`, `const tall` at `:411-415`, `function measured` at `:490` and the key at `:497`, with `TOO_TALL_PX = 1` at `:100`. `findings.yml:143`, `Tile.svelte:131-132` and `.frame { overflow-y: auto }` (`Stage.svelte:130`) all hold.
- Hub figures: in `~/workspace/research-hub`, `git ls-files | grep "/present/" | grep -iE "\.(png|jpe?g|svg|webp|gif)$" | wc -l` prints 38, all `.png`. `sips -g pixelWidth -g pixelHeight` over each one confirms every ratio the brief uses:

  | File | Size | Ratio |
  |---|---|---|
  | `btfno.png` | 1069x1100 | 0.97 |
  | `dongho_silhouette.png` | 636x526 | 1.21 |
  | `hccnet.png` | 1100x847 | 1.30 |
  | `meseret_landmark.png` | 958x616 | 1.56 |
  | `dongho.png` | 839x440 | 1.91 |
  | `btfno_blocks.png` | 1100x359 | 3.06 |
  | `incidentaf.png` | 1100x293 | 3.75 |
  | `eq_coverttheory.png` | 1204x231 | 5.21 |
  | `eq_meseret.png` | 1989x195 | 10.20 |
  | `eq_hccnet.png` | 1634x158 | 10.34 |

  There is one exception to the brief's split: `dries.png` (1100x172, 6.40) is not an `eq_*` image but lies in the 5.2 to 10.3 band.
- Folders:
  - `src/lib/state/life`: `git ls-files src/lib/state/life | sed 's#src/lib/state/life/##' | cut -d/ -f1 | sort -u | wc -l` prints 10. This holds.
  - `screen`: `ls -A src/lib/views/academic/present/screen | wc -l` prints 5. This holds.
  - `parts`: `ls -A .../parts | wc -l` prints 10, and `git ls-files .../parts | wc -l` prints 11. `utils/folder-check.sh` counts the direct items (its head comment: "An item is a file or a folder directly inside it"), so `parts` holds 10 items, at the limit. The brief's "11 entries" is the recursive file count. No new file can go in `parts`. The present folder itself also holds 10 (`ls -A src/lib/views/academic/present | wc -l` prints 10).
- Libraries: `package.json:94` holds `"image-size": "^2.0.4"` and `images.ts:303` holds `export function sizeOf`. Both hold.
- No `docs/adr`: `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. This holds.
- Test location: item 7 and the write list say the new test goes "beside the tests of the Present view's helpers". None exist. `git ls-files tests | grep -i "present\|deck\|slide"` lists only `tests/data/...`, `tests/routes/...`, `tests/server/edit/deck/...` and fixtures. `git ls-files tests/views` shows only `sessions`, `shared`, `sources` and `system`, and `grep -rln "life/present" tests` prints nothing.
- Verify 2's grep, `grep -rln "Slide.svelte\|Stage.svelte\|Panel.svelte\|present/print\|present/show" tests`, prints `tests/checks/source/html-sites.test.ts`, `tests/server/desktop/window-guard.test.ts` and `tests/server/root/hooks-server.test.ts`. No test names `Framed`, `Project.svelte`, `Plain.svelte`, `slide.css` or `life/present`: a grep for those prints nothing.

Findings:
1. The room's width is 1040 px, or 1023 on a project slide, never 1150, because of `Slide.svelte:106` `max-width: var(--slide-reading)`. The brief derives every number from the inner box and leaves the reading column out.
2. The print page and the bare audience Stage have an inner box of 1152 by 592, against the bordered Stage's 1150 by 590. Item 4's "each lays it out at the frame's own px" therefore does not give one size for every surface.
3. "parts 11 entries" is wrong. The folder holds 10 items, at the limit.
4. "`<img` lists two" is wrong. It lists three, `markup.ts:56` included.
5. `Project.svelte:113-120` should be `:109-116`, and `Stage.svelte:56-83` should be `:55-82`.
6. The Markdown image's style is at `Words.svelte:40-43`. The brief names neither the place nor the file to read, and `parts/Words.svelte` is in the write list only "where item 2's size needs a change", which does not cover item 5's image rule.
7. "beside the tests of the Present view's helpers" names a place that does not exist.
8. The open item's measured room of about 418 px under a project slide's title is not reconciled with the brief's 470.

## 4. Cases and checks

The cases are read against the rules file (`.scratch/migration/agents/spec.md`) and `guarded.md`.

- The test rule. Under spec.md "What every package obeys", a test exists only as the test of one entry of `agents/guarded.md`, and a step that needs a new entry stops and asks for it. The head of `guarded.md` says "A new entry needs Axel's yes. Views have no entry: the look on TEST covers them."
  - Item 7 and C1-C9 ask for a test table over a new view helper.
  - The grep above shows no guarded entry covers `views/academic/present` or the Present store.
  - The brief's justification, "(the rules file's test rule: a wrong layout draws a figure past the frame or a slide Too tall on every talk)", is the cost-of-failure rule. The rules file's test rule is the guarded-entry rule, which this brief does not satisfy. Under the standing demand "Every open item a skill says to raise to the user goes through automode first ... a guarded entry's wording", the orchestrator can close it. Until then the brief names no entry or test title and is inconsistent with the rules file.
- The look. spec.md "What every package obeys" says "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says". The brief contradicts it in several places:
  - Verify item 9 asks the builder for "The look cases C10-C17 on a scratch server of your own worktree ... screenshots saved".
  - C17 asks for the hub's decks "on the scratch server".
  - C10 to C16 are "Read at the look". This is consistent only if the look is the orchestrator's at landing; the brief never says whose look it is.
- The Cases preamble says "each case is run or read on the base". For C10 to C17 the base can only be read, since a builder runs no page. C10's claim "runs past the frame on the base" cannot be seen by the builder.
- C6 and C7 state no expected result: "the row states which" and "the arrangement of the larger area". The builder chooses the expected value its own code gives.
- C17 asks the builder to name "each one left ... with why its text does not fit at the least size". That is a judgment on the hub's deck text, which the step does not change, and only a page shows it.
- The report's "Doc text" section asks the builder to quote and replace lines of `docs/HELP.md`, which the step does not change. The brief says this is by design: O155 holds the file and the orchestrator applies it.
- Verify 2 runs `window-guard.test.ts` and `hooks-server.test.ts`, which only name the route paths. They are harmless and consistent with the rule that a step runs the tests of the files it changes.
- The arithmetic, on the brief's own room of 1150 by 470 (ratio 2.447):
  - C1: 0.97 x 470 = 456, which holds.
  - C2: 1.91 x 470 = 898. That leaves 1150 - 898 = 252 < 360, so the column is narrowed to 1150 - 360 - gap. The brief never states the gap; decision 1 implies 26, which gives a column of 764 and a figure 764 by 400. The description holds.
  - C3: 1150 / 3.75 = 307, which holds.
  - C4: 1150 / 10.2 = 113, which holds.
  - C5: 0.97 + 3.06 = 4.03, and 1 / (1/0.97 + 1/3.06) = 0.74. Both hold, and side by side is the larger area in the room (1150 x 285 against 346 x 470).
  - C6: stacked 0.35 and side by side 1.4. Side by side has the larger area: 658 x 470 = 309k against 165 x 470 = 77k. The brief leaves this unstated.
  - Decision 1: hccnet 611, meseret_landmark 733 with text 1150 - 733 - 26 = 391, and incidentaf 1150 by 307 all hold arithmetically.
- The room as I read the CSS. The width is 1040 (the reading column), or 1023 on a project slide (13 px padding and a 4 px border).
  - The height under a one-line heading on a plain slide (text, image, columns, equation, code) is 590 - (36 x 1.15 + 0.4 x 36) = 590 - 55.8 = about 534 (`Plain.svelte:47-51`).
  - On a project slide it is 590 less the chips row (`.top`, plus 5 px), the headline (0.1em + 41.4 + 0.3em, about 56 px) and, on a project's deck, the facts strip (`.strip` padding 1.2em = 28.8 px plus one or two lines of chips). That comes to about 410 to 450. Open item 693 measured about 418. Under no reading of the CSS is it 470.
  - The room is therefore about 1040 by 534 (ratio 1.95) on an image slide and about 1023 by 418 (ratio 2.45) on a project slide.
- The numbers recomputed on that room:
  - C1: 518 on an image slide, 405 on a project slide.
  - C2 on an image slide: 1.91 < 1.95, so tall. The column is narrowed to 1040 - 360 - 26 = 654 and the figure is 654 by 342.
  - C3: 1040 by 277, or 1023 by 273.
  - C4: about 102 px tall, against the brief's 113.
  - Decision 1: meseret_landmark gets a column of 652 on a project slide, leaving 1023 - 652 - 26 = 345 < 360. It is narrowed to 637, against the brief's "column 733 (text 391)".
- The room under a "one-line title" also depends on the factor of item 2 when the headline is sized by it. Item 2 says "the title, the headings and the body sizes move together". The room the module is given then changes with the factor it helps decide.

Findings:
1. Item 7 and C1-C9 add a test with no guarded entry. The rules file says to stop and ask for one, `guarded.md` says views have no entry, and the brief misnames the rule.
2. Verify item 9, C17 and the look rows ask the builder to run a scratch server and take screenshots, against "A builder runs no page".
3. C6 and C7 have no expected result.
4. The room of 1150 by 470 is not what the CSS gives. It is 1040 (1023) by about 534 on a plain slide and about 418 on a project slide. C4's 113 becomes about 102, and decision 1's meseret_landmark row is wrong under both readings.
5. The gap between the text and the column is used, 26 px by decision 1's arithmetic, but never stated.
6. C17 asks the builder for a judgment on hub deck text, which needs a page.

## 5. The question

The question asked of each case and check: could it pass without the goal being reached? The goal is that every slide is laid out from its content, no figure runs past the frame, and only text that does not fit at its least size is Too tall, the same on every surface.

- C1 to C5, C8 and C9 (module rows): yes. The module's inputs (room, ratios, whether there is text) leave out the reading column's width, the figure's padding and border (`.fig` / `.figure` padding 6 px plus a 1 px border, which changes the drawn box's ratio), the caption and explanation heights, and the text's height at least size. Rows can pass on the module while the drawn figure still runs past the frame or under the caption.
- C6 and C7: yes. With no expected result, the row is fitted to the code.
- C9: yes, weakly. "Every box inside the room" holds for any clamp. The rule uses ratios only, so "a room smaller than any figure's natural size" tests no input the rule reads.
- C10: yes. A tall project figure fitting does not show that an image slide (`Plain.svelte`, `max-height: 480px` replaced) or a Markdown image (`Words.svelte:40`) stays in the frame. No case covers either.
- C11: yes. It passes on the pane alone while the audience window and the PDF, which measure nothing today, draw another size.
- C12: yes. Taken at text scale 1, it passes while a raised text scale differs between the pane and the audience window or PDF. Only `appearance.svelte.ts:109` in the shell sets `--text-scale`, and the print and show routes do not mount the shell, so they always draw at 1.
- C13: no. Reading the code for the relayout on load and for `data-ready` after the layout reaches the requirement.
- C14 and C15: no for what they check (text sized by item 2). They do not cover title, section, idea, columns, code or equation slides, which item 2 names ("every slide kind").
- C16: yes. It is read in the pane only.
- C17: yes. A drop in the count of Too tall findings can come from a measure that stops counting overflow, for instance a figure box with `overflow: hidden` that crops rather than fits. A count does not show that the figures are inside the frame.
- The step line's own check: the line `plan.md:1699` names no check of its own, so it is judged through items 1 to 7.
- Item 1, by C1-C9: yes, for the reasons above.
- Item 2, by the look: yes. It can pass on one surface only, and nothing names oscillation.
- Item 3, by C11 and C17: yes. See C17.
- Item 4, by C12 and C13: yes, through the text-scale gap and the 2 px inner-box difference.
- Item 5: yes. No case reads the image slide or the Markdown image.
- Item 6, by verify 8: no. Reading `docs/decks.md` against the change reaches it.
- Item 7: yes. The row values follow the brief's room, which is not the drawn room.

Findings:
1. Every module row can pass without the drawn slide fitting, because item 1's inputs leave out what the drawn box depends on: the reading column, the figure's padding and border, the caption and explanation heights, and the text's height at least size.
2. C12 and C16 can pass while the PDF and the audience window draw at another text scale.
3. No case covers the image slide, the Markdown image, or the plain kinds other than text.
4. C17's count can drop without figures fitting.

## 6. Implied inputs

Inputs the step implies but never states. None of them is a case.

- A deck whose `deck.frame` has another shape. In portrait (720 by 1280) the room's ratio falls below 1, and in 4:3 (1024 by 768) the reading column is 894 px, so the 360 px minimum and the tall/wide split behave differently. C9 uses 1024 by 576, the same 16:9 shape. Expected: every box inside the room, the text at least 360 px beside a column or the figure placed wide, and C1's figure placed by the new room's ratio.
- The rice theme (`body.rice`, `slide.css:34-39`): the least and greatest factors on the 52/33/26/22/17 scale. Expected: the same layout boxes and the text factor found between 0.75 and 1.25 of the rice sizes.
- A raised text scale on the audience window and the PDF. `--text-scale` is set only by the shell (`appearance.svelte.ts:109`). Expected under item 4: the same size as the pane. Today's tree gives 1 on those routes, so the step must carry the scale there or say why not.
- A figure that fails to load (no `naturalWidth`): the print page settles on `error` (`print:76`). Expected: the panel drawn as text or a gap with no ratio, and the layout not waiting for a ratio that never comes.
- A project slide whose panels hold a figure and a diagram. Decision 5 makes the diagram text, and the brief does not say where its caption goes. Expected: the figure in the block, the diagram and its caption in the text box, both inside the frame.
- A KaTeX equation beside a figure. `Equation.svelte:21-40` already runs its own width-fit loop (`equationScale`, `LEAST_EQUATION_SCALE = 0.5`), which is nested with item 2's factor. Expected: one stable result, and the equation in the text box.
- The deck's first slide with the key hint. The Stage leaves the hint out of the measure (`Stage.svelte:73-75`), and the fit loop must do the same or the first slide's text size differs between the pane and other surfaces. Expected: the same factor with and without the hint.
- The facts strip's kept room. It takes room under the content on every project-deck slide and is sized at `--slide-fs-small`. The brief does not say whether it takes the factor, or whether the room given to item 1 is measured above it. Expected: the room under the title less the strip, and the same with the toggle on and off.
- The presenter screen's small "next" slide (`Presenter.svelte:13`). It is drawn and measured through `Framed` at frame px. Expected: the same layout. C12 says "the presenter screen" without naming the next slide.
- The PDF page's scale-down (`fitSlides`, `print:83-90`) for a slide still Too tall, and its 1152 by 592 inner box. Expected: the laid-out slide at the same factor as the pane, scaled down only when Too tall.
- The measure loop. A factor that changes the content's size retriggers the ResizeObserver (`Stage.svelte:78-80`). A slide at the edge (fits at 1.00, not at 1.01) must settle and never flicker. Expected: one factor per slide per frame and text scale, stable across measures.
- Upscaling: a small bitmap (`dongho_silhouette.png`, 636 by 526) drawn larger than its pixels in a big frame. Expected: stated either way.
- The figure's padding and border (6 px plus 1 px), which change the drawn box's ratio. Expected: the image's ratio kept inside its box.
- The text height at least size and the caption height, which the wide rule ("no taller than the room leaves under the text at its least size") and the caption rule need. Neither is an input of item 1's module.

Findings: all fourteen inputs above are missing from "Cases". The ones whose wrong answer costs the most are:
1. The text scale on the print and show routes.
2. The first slide's key hint.
3. The facts strip's room.
4. The measure loop.
5. A figure that fails to load.
6. Another frame shape.

## 7. ADRs

- The configuration block (`orchestrator-state.md`, the first yaml block) names no `adr` key, so the folder is `docs/adr`.
- `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`, and `ls docs` lists `apps.md data-map.md decks.md diagrams HELP.md licenses palette.md templates.md third-party.md`.

Findings: none. The folder does not exist, as the brief says.

## 8. Dictated text

- `grep -n '"' .scratch/migration/agents/briefs/O157.md` finds no quoted words given for a source, doc or catalog file.
- Item 6 lists what `docs/decks.md` must say, but as content, not wording.
- The one dictated line is the report's first line, "Everything in the brief is done" (`O157.md:125`). It holds: it is the rules file's own phrase (spec.md "Report").
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O157.md` prints nothing, so the brief is ASCII.

Findings: none.

## Declined to judge

- The exact height of the chips row and the facts strip on a project slide. They need a drawn page, so the room of about 410 to 450 px is a reading of the CSS plus open item 693's measured 418, not a measurement.
- Whether the rice class reaches the print and show routes through `drawConfiguredTheme`. `grep -n "rice" src/lib/ui/theme/app-theme.ts` shows only `rice.brackets` and `rice.monospace` options. Not verified.
- Whether the orchestrator closes the missing guarded entry in automode or puts it to Axel. Both are open to it under the standing demands, and I make no choice.

Agent usage: ab20efa6321dbf728, claude-opus-5-5, 190352 tokens, 47 tool uses, 9.2 min.

## Closed

Each finding with the change to the brief that closes it (the orchestrator, automode, booked in `choices.md`).

- 1. Names: `tests/checks/source/html-sites.test.ts:37` is in item 5 and the path list, changed only if the `{@html}` site of `Panel.svelte` moves; the facts strip and the key hint keep their own sizes (item 2, decision 8), so `Facts.svelte:14` stays true and the file is not changed.
- 3. Premises: the room is stated from the reading column (1040, 1023 on a project slide) and about 534 and 418 px high; item 4 requires the same content box on the print page and the bare Stage; `parts` is 10 entries, at the limit; `<img` lists three, `markup.ts:56` being a pattern; `Project.svelte:109-116` and `Stage.svelte:55-82` corrected; `Words.svelte:40-43` named in item 5 and the path list; the new test file is gone (item 7); the 418 px of open item 693 is the project room of C1-C9.
- 4. Cases and checks: no test is added, since views have no guarded entry and a slide's layout costs no lost work, broken installation or wrong configuration (item 7); C1-C9 are checked by one quoted `node --input-type=module -e` run over the pure module; verify item 9 removed, the builder runs no page, C10-C21 are the orchestrator's look at landing; C6 and C7 have expected results; every case recomputed on the 1023 by 418 room (C4 and C8 on the 1040 by 534 image room); the 26 px gap stated in item 1; C21 asks the builder for no judgment.
- 5. The question: item 1's inputs are the measured room, the text height at the least size, the caption and explanation heights, and the figure's padding and border; item 4 carries the app's text scale to the print and show routes (decision 7) and C12 checks it at a raised scale; C14 and C18 cover every kind, the image slide and the Markdown image; C21 counts the findings with every figure inside its frame.
- 6. Implied inputs: other frame shapes (C9, 4:3 and portrait), the rice theme (C17), the text scale on the routes (item 4, C12, C16), a figure that fails to load (item 1, C13), a figure beside a diagram (C15, decision 5), the equation's own fit (item 2), the first slide's key hint (item 2, C19), the facts strip's room (item 2), the presenter's next slide (C12), the PDF's scale-down (item 4), the measure loop (item 2, C20), upscaling (item 1, decision 9), the padding and border and the text and caption heights (item 1).
- Declined to judge: the room's height is the reading of the CSS plus open item 693's 418, and the landing look measures the drawn slide; the rice class on the print and show routes is C17 at the look; no guarded entry is added (item 7).