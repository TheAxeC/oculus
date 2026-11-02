# Step O120 brief check (on main at 9abe534c0)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O120.md`. Nothing in the repository was changed: `git status --short` prints only the two entries that stood before the check, ` M .scratch/migration/orchestrator-state.md` and `?? .scratch/migration/agents/briefs/O120.md`. One read-only compile ran from a program in the session scratchpad (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/compile.mjs`). No page was opened. `config/local.yml` was not read: `git ls-files config/local.yml | wc -l` prints 0, so `git grep` does not reach it.

Summary: the CSS rule of item 1 can work, and no fix below widens the step's paths. The findings that matter:
- `rose` is not defined in every theme (3.1).
- The brief does not say what the row is placed against (5.3).
- Item 1 and case 12 disagree on a wallpaper (4.1).
- Case 6 hides title words for good on a no-hover screen (4.2).
- The clipped card is missing from "Cases" and contradicts item 1 (6.1).

3.1, 4.1 and 4.2 each make a choice the user would see, so the session judges whether each is a stop.

## 1. Names

- `data-card-actions`: `git grep -n "data-card-actions\|data-card-control\|STRATEGY_TONE" -- . ':(exclude).scratch'` prints one hit, `src/lib/views/shared/card/record/CardActions.svelte:149:<span class="actions" class:start bind:this={strip} data-card-actions>`, which is inside the paths. `git grep -ln "data-card-actions" -- .scratch` prints nothing. No hit outside the paths.
- `data-card-control`, `STRATEGY_TONE`: the same grep prints no hit, so the names are free. `[data-card]` (`src/lib/shell/keys/workbench-keys.svelte.ts:394`, `key-dom.ts:50`) is an exact attribute selector and does not match `data-card-control`. The two names beside it, `data-card-toggle` and `data-card-focus`, are distinct.
- `GROUPS`, `CareerGroup`, `groupOf` in `career-view.ts`: `git grep -n "careerShown\|\.groups\b" -- src tests` has hits outside the paths only in `tests/data/sources/career.test.ts:298,304,308,309,378,379`. Those at 298 and 304 use `toEqual({ state: ... })` on the states that hold no groups. Those at 308, 309, 378 and 379 read `group.field` and `group.cards`. A `tone` on a group makes none of them false.
- `--card-at-rest`: `git grep -n "card-at-rest" -- src tests docs` has one hit family outside the paths, `src/lib/views/system/machine/usage/Usage.svelte:372,378`. Its comment stays true, since the step leaves the property as it is.
- "meta row" in docs: `git grep -n "meta row\|data-card" -- docs README.md config` prints nothing.

Findings: none.

## 2. The step line

Line `plan.md:1616`, ruling 632 at `plan.md:3433`.

- "a card whose meta row is empty at rest draws its strip and menu opener over its top right corner": item 1.
- "in the shared card": item 1 ("In the shared card").
- "so hovering it moves nothing": item 3.
- "each list of the Career view and its strategy card take a card bar from oculus's palette": item 4.
- "chosen in `career-view.ts`": item 4.
- "no key in the career file's schema and no edit of the hub's `career.yml`": item 4 and verify check 4.

plan.md has no Goal heading (`grep -n "^Goal\|Goal:\|## Goal" plan.md` prints nothing). I read its opening paragraph as the goal, and the part this step delivers is the step line.

Findings: none.

## 3. Premises

- `Card.svelte:115-117` draws `.meta` when a `meta` snippet is given: read, matches.
- `.meta` "(lines 249-255)": `grep -n "^    \.meta {" src/lib/ui/frame/Card.svelte` prints `248:    .meta {`, so the block is 248-254. Differs by one line.
- `RecordCard.svelte:282-300`: read, matches. `RootChip.svelte` has `{#if root !== ''}`: read, matches (path `src/lib/views/shared/card/RootChip.svelte`).
- `CardActions.svelte` and `.menu` draw with `display: var(--card-at-rest, flex)`, and `Card.svelte:135-160` sets the variable: read at `CardActions.svelte:199`, `RecordCard.svelte:357`, `Card.svelte:135-159`. Matches.
- The jump is in the shared card, and `CareerCard.svelte`'s `meta` draws only a Tag: `CareerCard.svelte:28-32`. Matches.
- `measure` reads the strip's parent as the line and places the strip at the end or, under `.actions.start`, at the start: `CardActions.svelte:84-109,208-213`. Matches.
- `Usage.svelte:193`: the snippet always draws `<Tag label={account.tool} />` at line 194, and `.act` is at line 209. Matches. `Gallery.svelte:256` and `Overview.svelte:56`: read, no such control. Matches.
- Hues, the brief's command: `git grep -l -- "--c-<hue>:" -- src static config | wc -l` prints 10 for blue, violet, gold, teal, indigo and rose, which matches the count the brief gives. "In every theme" does not follow from that count, since one file holds several themes. See 3.1.
- `Card.svelte` takes `tone`, `RecordCard` passes it on, `CareerCard` takes none, `career-view.ts:26-33`, `Career.svelte` draws through `CareerCard`: read, matches.
- `tests/data/sources/career.test.ts:306-322,378-381`: matches in substance, the first test opening at 307.
- `docs/HELP.md:347` is the Career paragraph: `sed -n 347p` shows it. Matches.
- The base copy `.agents/worktrees/O120-base/`: `ls` fails today. The `spec` skill creates it after this check, and `agents/briefs/O119.md:27` has the same shape. Not a finding.

Findings:

1. `rose` is not in every theme. The brief says "with a `--c-<hue>` in every theme", and decision 1 says "Six hues every theme defines". The per-block command `cat tokens.css rice/*.css | grep -oE -- "^\s+--c-[a-z]+:" | sed ... | sort | uniq -c` (in `src/lib/themes`) prints 29 for violet, teal, indigo, gold, blue and pink, and 26 for rose. An awk over the blocks prints:
   - `rice/catppuccin.css: body.mocha { has --c-blue but no --c-rose`
   - `rice/gruvbox.css: body.gruvbox { has --c-blue but no --c-rose`
   - `rice/singles.css: body.nord { has --c-blue but no --c-rose`

   On those three themes the Profiles bar falls back to `tokens.css:49`, `--c-rose: #db2777`, the default theme's colour instead of the theme's own. Closing it in the brief: profiles `pink`, defined in all 29 blocks (`--c-pink: #ec4899` at `tokens.css:48`), or `magenta`, `cyan` or `sky`, also 29. Adding `--c-rose` to the three blocks would widen the step to two more paths, `src/lib/themes/rice/catppuccin.css`, `gruvbox.css` and `singles.css`, so three in all. The hue is a choice the user would see.
2. `.meta` is at `Card.svelte:248-254`, where the brief says 249-255. `--card-at-rest` ends at 159, where the brief says 160.
3. Item 5's "`docs/HELP.md` line 305's neighbourhood, if it says the controls take a line" points at the wrong line. The sentence is `docs/HELP.md:301`: "The head is the title, ... then a row of the record's hub mark, its chips and tags, the strip of at most three actions drawn under the pointer, and "..."." Line 305 is the list of strips and says nothing of the row. `grep -n "own line\|take a line\|takes a line\|line of its own" docs/HELP.md` finds nothing about cards. Item 5 should name line 301 and say what it adds: a card whose row holds nothing at rest draws the strip and "..." over its top right corner.

## 4. Cases and checks

- A Career card with no Tag: consistent. `.meta` holds only `.actions` and `.menu`.
- A Career card kept off the CV: consistent. `.tag` is an element child, so the rule does not apply.
- A narrow card in a narrow pane: consistent for a card that fits its pane. See 6.1 for a clipped one.
- A card with `ontitle` and no chip: consistent. See 5, item 1.
- A card with no action and no chip: consistent. The rule matches a row with no element child, and the row takes no room.
- A card on a screen that does not hover: see finding 2.
- A menu opened from "...": consistent. `Menu.svelte:10,197` draws through bits-ui's Portal on the body, so no card clips it. `.card:has([aria-haspopup][aria-expanded='true'])` keeps the controls drawn.
- The keyboard cursor and Tab: consistent. The row stays in DOM order after the title, so the tab order does not change. `activateCursor` (`key-dom.ts:62-74`) queries `.title button, [data-card-toggle]` and `[data-card-focus]`, none of which the step touches. A Career card cannot hold the cursor, since `CareerCard.svelte:48` passes `cursor={false}`, so this case is read on another kind, a dataset with no access for one.
- A card of a kind that draws a chip: consistent.
- A card inside a card: see finding 3.
- The Usage view's card: consistent. It names `Usage.svelte`, outside the paths, but what it checks is the new rule in `Card.svelte`, which the step changes.
- A wallpaper theme and a rice theme: see finding 1.
- A Career view with each list in one hue, in every theme: see 5, finding 2.
- A hub's career file with no `positions`: consistent. `Career.svelte` draws `Empty` for a group with no cards.

Findings:

1. Case 12 and item 1 disagree on a wallpaper. Item 1 says "so the words under it do not run through it". Case 12 says "the controls' background follows the card's". `Card.svelte:166-174` paints the card `color-mix(in srgb, var(--card) var(--wall-panel), transparent)` on a wallpaper (`config/defaults/appearance.yml:98`, `panel_opacity: 0.8`) and `transparent` inside a surface. Followed exactly, the words show through the control at 20 percent, and fully on a transparent card. `tokens.css` (the wallpaper comment before `--wall-panel`) already rules this: "the small controls stay solid, being what text is read off". Closing it in the brief: the controls paint solid `var(--card)` in every theme, and case 12 reads "the patch is the control's own box". This is a choice the user would see.

   A second defect sits in the same rule. Item 1 paints two boxes, `.actions` and `.menu`, and `.meta`'s `gap: 6px` between them stays unpainted, so a slit of the title's letters shows between the strip and the opener. The brief should say how the slit closes. `gap: 0` in this row works, since `measure` reads `columnGap` from the page (`CardActions.svelte:96`).

2. Case 6 keeps the row over the title for good on a screen with no hover. There `--card-at-rest` is `initial` always (`Card.svelte:155-159`), so the controls are drawn at rest, the row is not "empty at rest" as the step line says, and in the flow it never jumps. The rule as briefed moves it over the title anyway and hides the end of a long title's first line with no way to uncover it, and decision 3 reasons only about "under the pointer". Closing it in the brief, my judgment of the better form: the rule stands under `@media (hover: hover)`, and case 6 reads "the row stays in the flow, nothing is covered". This is a choice the user would see, and the paths do not change.

3. Case 10's "(a nested card in a form)" names something that is not this card. `src/lib/views/system/workbench/editors/Cards.svelte:253` is its own `div.card`: it has no `.meta`, no `--card-at-rest` and no `CardActions` (`git grep -n "data-card=\|card-at-rest\|\.meta\b" -- src/lib/views/system/workbench/editors` prints only `data-card` lines). The case therefore asks for a read of a place the step does not change. Drop the parenthesis. For a real `Card` inside a `Card`, the child combinator and `.card`'s `position: relative` hold it.

## 5. The question

- Item 1, the rule. Can it work? Yes. The compile of `.meta:not(:has(> :not(:global([data-card-control]))))` under svelte 5.57.1 prints, with `warnings: none`:
  `.meta.svelte-1lj1c2o:not(:has(> :not([data-card-control]))) { position: absolute; }`
  The child rule `... > :global([data-card-control])` compiles to `... > [data-card-control]`, also with no warning.
  - `:has(> ...)` matches element children only, so Svelte's comment anchors and whitespace text nodes do not count.
  - `:has` reads whether a child exists and ignores `display: none`, so the row at rest and under the pointer gives one answer. That is why hovering cannot flip the rule.
  - `.actions` and `.menu` are direct children of `.meta`, because the snippet renders inside `<div class="meta">` and `display: contents` is only on `.context`, outside the card.
  - "One rule" is two blocks, the row's and the child's, because `pointer-events: auto` and the background sit on the controls.
- Item 1, the snippets. I read all 19 `{#snippet meta()}`. None draws an empty wrapper and none draws bare text. Every child is a Tag, Chip, Glyph, Grip or a span with content, or stands under an `{#if}`. `ProjectCard.svelte:354`'s `<span title>` wraps a Tag. Grip (`Grip.svelte`) always draws its glyph and is drawn at rest.
- Item 1, `measure`. `inner(line)`, `visibleRight`, `actionPlace` and the ResizeObserver all read the row's box, which an absolute box with `left` and `right` keeps definite. `others` is the opener and a gap. Children are observed, so the first draw is measured. `.card.fill` is `overflow: visible`, so `visibleRight` skips the card as it does now. `alone` needs a line under about 47 px with one action (`actionPlace`, 26 for the opener and gap plus 21), so wrapping to two lines over the body is not a practical case.
- Item 1, pointer. `pointer-events` is inherited, so `auto` on the two controls reaches the buttons inside them. A right-click on the empty part lands on the title or face, inside `.context`, and opens the card's menu (`ContextMenu.svelte`, `pointed`). `.card:hover` holds through the row.
- Item 1, keys. No change, as under the case above.
- Item 1's checks, could they pass without the goal? Yes: see finding 1.
- Item 2: yes, as item 1.
- Item 3: yes, see finding 1.
- Item 4: yes, see findings 1 and 2.
- Item 5: no. Its check is the read of each sentence, except that it could pass while `docs/HELP.md:301` stays false (3.3).
- Check on the step's line (`npm run test:quick`, ASCII, `data-card-actions` gone, `git diff --stat -- config`): yes, all four pass on a tree with no rule at all (the attribute renamed, nothing else).
- Cases 1, 3 to 5, 7 to 9, 11 and 14: no, each is a state read in the code and seen at the look. Case 2 and case 12: see 4 and finding 1 here. Case 6: see 4.2. Case 10: see 4.3. Case 13: see finding 2.

Findings:

1. Items 1, 3 and 4 have no check of their own: every command under "Verify before you report" passes without them. The brief rests them on the look, which spec.md allows, but names no measure for item 3. A 6px jump is easy to pass by eye on a card with a tall neighbour in a grid. Closing it in the brief, under "Report": the before and after names `article.card`'s `getBoundingClientRect().height` to read at rest, under the pointer, with focus inside, with the menu open and under the cursor, on a dataset card with no access and on a Career card. This is one line for the look, with no new requirement on the builder.
2. Case 13's "in every theme" passes on the themes that are looked at, and the look reaches only a few of the 68 theme rows (`grep -c "class:" config/defaults/appearance.yml`). It would not show 3.1. The fact is a count a machine computes, so the brief should state it (29 of 29 blocks per hue) once 3.1 is closed.
3. Item 1 never names what the row is placed against, and item 1's claim that `measure` "reads the face's width" holds only for one answer. `.face` is not positioned (`Card.svelte:212-216`), so an absolute row is placed against `.card`'s padding box, which holds the 3px bar and the face's padding. After item 4 every Career card has the bar. `left: 0; right: 0` would give a line 24 to 27px wider than the face and put the controls in the corner with no padding, over the rounded corner, past which `.card.fill` does not clip. `left: 12px` against `.card` starts 3px left of the title on a toned card, which shows under `.actions.start`. Closing it in the brief: `.face { position: relative }`, and in the rule `top: 8px; left: 12px; right: 12px; margin: 0`, so the row's box is the face's content box on a toned and an untoned card alike. `git grep -n "position: *absolute" -- src/lib/views/shared/card src/lib/views/shared/forms src/lib/views/academic/career` prints nothing, so no absolute child inside those card bodies changes its containing block. `Card.svelte` is already a path.
4. Item 1's "Every control that is drawn only under the pointer or the keyboard carries one attribute" is false of `Usage.svelte:209`'s `.act`, which reads `--card-at-rest` and stays unmarked, as the brief's own premise says. It does no harm today, since its row always holds a Tag. Item 1 should say "the two controls of a record card".

## 6. Implied inputs

A code step.

- A clipped card, a pane narrower than its card: missing, see finding 1.
- A right-click on the empty part of the row: missing, see finding 2.
- A card with an empty title and no lines: missing, see finding 3.
- A kind whose `meta` draws bare text: missing, see finding 4.
- A toned and an untoned card: not listed by name, closed by 5.3.
- A chip appearing or going on a drawn card (a push): not listed. The row moves between the flow and the corner, and the line's height change fires the observer on `line`. No cost, and no case needed.
- A card with actions and an empty strip: not listed. `.actions` has zero width and its auto margin still pushes the opener to the end. No cost.
- A strip of a text control (no glyph, 22 or 26px high): not listed. It stands taller over the title. No height change, since the row is out of the flow. No cost beyond case 3.

Findings:

1. A clipped card. `start = place.alone || seen < content.width - 0.5` (`CardActions.svelte:108`) sets `.actions.start`, and `margin-left: 0` (lines 211-213) moves the strip to the line's start with the opener after it, so the controls stand over the first words of the title and at the left of the card. Item 1 says "the controls stay at the line's end", and the step line says "top right corner". Case 3 does not cover it. Expected result, for the brief to state: the controls go to the start of the visible part of the line, as `measure` decides, because a control past the pane's edge cannot be pointed at. They stand on the card's colour over the title's first words, and the card's height does not change.
2. A right-click on the empty part of the row. Expected: the card's menu, as anywhere on the card. It holds by reading (5, item 1), but its failure would cost the menu, and the case list covers only the left press.
3. A card with an empty title and no lines. `cardOf` in `career-view.ts` gives `lines[0]?.text ?? ''` for a row with no filled field, so the card is 16px of padding and its borders. A row at top 8px with a 20px control reaches 28px, about 10px past the foot, and is not clipped since `.card.fill` is `overflow: visible`; `CardGrid`'s gap is 10px. Expected: the control draws past the foot, stays reachable, and nothing moves.
4. Bare text. Decision 2 names the empty wrapper, which keeps the jump. The other direction is the misfire: `:has` does not see a text node, so a future kind drawing bare text in `meta` would be read as an empty row, and its words would be laid over the corner. No snippet on the tree does this. Decision 2 should name it, so the comment on the rule says it.

## 7. ADRs

No record: `ls docs/adr` prints `ls: docs/adr: No such file or directory`, and `grep -n "^adr\|adr:" .scratch/migration/orchestrator-state.md .agents/plan.yaml` prints nothing.

Findings: none.

## 8. Dictated text

The brief dictates no sentence, line, heading or comment for a file. It gives names and values only, each read against `agents/spec.md`:

- `data-card-control`: `grep -n "data-card-control" .scratch/migration/agents/briefs/O120.md` finds line 25. Holds. ASCII, in the family of `data-card-toggle` and `data-card-focus`.
- `STRATEGY_TONE`: found at line 28. Holds. It has an importer in `Career.svelte`, so `utils/unused-exports.sh` has no line to add.
- The hue names: found at lines 28 and 69. They hold as hue names, except `rose` under 3.1.

Findings: none.

## Declined to judge

- How the rule behaves in a browser: read and compiled, not run. A builder and this check run no page, so the look at landing settles it.
- Whether the hues read apart on a 3px bar, the user's eye. For the look: default `--c-gold: #a16207` beside `--c-amber: #b45309`, though decision 1 excludes amber as a state colour; `--c-indigo: #6366f1` beside `--c-violet: #7c5cff` and `--c-blue: #2563eb`.
- The path comparison with O119: `orchestrator-state.md:761` books O119 as building and O120 to run after it lands, and main's head does not yet hold O119. The comparison is the session's, Steps 5.

Agent usage: a8b209074e34cc262, claude-opus-5-5, 209948 tokens, 33 tool uses, 9 min 9 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- 3.1: closed, profiles pink, premise and decision 1 corrected to the count of 29 blocks.
- 3.2: closed, the line numbers corrected.
- 3.3: closed, item 5 names `docs/HELP.md:301` and what it adds.
- 4.1: closed, decision 5: the controls paint solid; `gap: 0` in the rule; case 12 reworded.
- 4.2: closed, decision 4: the rule stands under `@media (hover: hover)`; case 6 reworded.
- 4.3: closed, case 10 reworded.
- 5.1: closed, the report names the height read for the look.
- 5.2: closed, case 13 states the count.
- 5.3: closed, `.face` is positioned and the rule gives its values.
- 5.4: closed, item 1 says the two controls of a record card.
- 6.1 to 6.3: closed, three cases added.
- 6.4: closed, decision 2 names bare text.
