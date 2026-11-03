# Brief check of O140 (oculus, main at ee39a6b61)

The main finding: the brief cannot reach the step's goal. The goal is that in every theme an application at interview reads apart from `planned` and from every application status. Ruling 665 and the brief change only four theme blocks, and item 3 together with case C4 forbids changing any other. On the tree, three more blocks already have `--c-pink` equal to `--c-violet`, which is the colour of `planned`: `body.everforest`, `body.everforestlight` and `body.gruvbox`. In those three themes, an interview drawn in pink would look exactly like planned after the step lands. Ruling 665 rests on the premise that only four blocks clash, and that premise is wrong. This is a stop for Axel, not a fix to make at landing.

## Names

The grep commands (run from `/Users/axelfaes/workspace/oculus`):
- `grep -rn --exclude=local.yml -i '7c3aed' . ` (build output and worktrees dropped from the reading)
- `grep -rn --exclude=local.yml -i interview src tests config docs utils assets .oculus README.md CLAUDE.md`
- `grep -rn --exclude=local.yml 'c-pink\|ec4899' ...` over the same folders
- `grep -rn --exclude=local.yml -iw pink ...` over the same folders

Hits outside "Paths this step writes", and whether the change makes them false:

- `#7c3aed`:
  - `config/catalogs/vocab.yml:40` `"#7c3aed": c-purple`. Stays true: `venue_tiers` flagship at :301 still uses it.
  - `src/lib/themes/tokens.css:46` and `:93`. Unchanged and still true.
  - Test fixtures, all independent of `interview`, so not made false:
    - `tests/state/shared/hub-words.test.ts:63` (a fixture `pending`)
    - `tests/data/snapshot/reference-hub.ts:221`
    - `tests/data/sources/config/layers/hub-vocab.test.ts:207, 284, 285`
  - `docs/templates.md:434` and `:538`: examples that do not involve interview. Not made false.
  - `.scratch/migration/plan.md:1657` and `:3504` say interview is violet. They are ledger bookings of O138, not product text.
- `interview`: `docs/templates.md:1560`, `:1577` and `docs/HELP.md:296` name no colour. They stay true, so brief item 3 holds.
- `c-pink` / `#ec4899`: the other 24 `--c-pink` lines of `rice/*.css`, `tokens.css:48`, `tokens.css:113` (`--map-related`, a separate token) and `vocab.yml:43` (the palette). None is made false.
- Readers of `--c-pink` by its tone name. The brief's grep pattern `c-pink\|#ec4899` misses both:
  - `src/lib/state/forms/career-view.ts:44` `{ field: 'profiles', title: '', tone: 'pink' }`: the bars of the Career view's profile cards.
  - `config/catalogs/vocab.yml:233` `form: pink` under `facet_tones`: the heading, dot and fill of the form filter group.
  - Neither is made false, but both change on screen in the four themes. The brief's before-and-after section does not name them.
- Head comments that name a palette's source, outside the write list:
  - `src/lib/themes/rice/rosepine.css:1` "Rose Pine (rose-pine/palette, MIT)".
  - `src/lib/themes/rice/singles.css:3` "One Dark (joshdick/onedark.vim, MIT)".
  - Neither palette has a pink of the kind item 2 asks for. Rose Pine's hues are love `#eb6f92`, rose, gold, pine, foam and iris. One Dark's red equals its pink, and its magenta equals its violet. So the new pinks come from outside those palettes.
  - `singles.css:4-6` already sets the pattern for this: it names the outside source of Oxocarbon's added hues ("so the warning hues are IBM Carbon's yellow 30 and orange 40 (@carbon/colors, Apache-2.0)").
  - Item 2 asks that "the comment stays true". Under that pattern, these two head comments need a sentence, but they lie outside the write list and outside C4's "only the four `--c-pink` lines".
  - `rosepine.css:59-60` ("pale pink") describes `--c-graph-base` and stays true.

## The step line

Each part of the step line (`plan.md:1664`), mapped to "What to build":

- `interview` takes `#ec4899` in place of `#7c3aed`: item 1.
- The Interview row of `position_stages` takes the same colour: item 1.
- The three Rose Pine blocks set a pink of their own that reads apart from orange, red and violet: item 2. Item 2 adds `--c-magenta` and equality with every status token.
- One Dark the same: item 2.
- "so in every theme an application at interview reads apart from planned and from every application status": **no requirement delivers this part.** Item 3 forbids touching any other block. The tree shows it false in at least three further themes (see Premises).
- Item 2's contrast floor ("at least that of the theme's `--c-red`") has no source in the step line. It is an addition that does no harm.
- The step line names no check of its own.

## Premises

Each claim of "What is on the tree", rerun:

- `grep -n interview config/catalogs/vocab.yml` prints :155 and :205 exactly as the brief quotes them. Holds.
- Palette lines :40 and :43, and the `c-violet` statuses: a python `yaml.safe_load` of `statuses:` mapped through `palette:` prints `c-violet ['in-prep', 'exploring', 'nascent', 'planned', 'preparing', 'draft']` and `c-pink used by status: None`. Holds.
  - Line references: `planned` is at :125, `in-prep` at :114 and `draft` at :127, which matches ":114-127". The palette line for `#7c5cff` is at :39.
- The status tokens: the same read prints amber, blue, brass, cyan, green, grey, orange, purple (interview), red, sky, slate, teal and violet. Item 2's list of twelve is these minus purple. Holds.
- 26 of 29: a python parse of every block of `tokens.css` and `rice/*.css` that holds `--c-pink` (scratch script `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/blocks.py`) prints `blocks with --c-violet or --c-pink: 29` and `purple==violet in 26 of 29`. The three that differ are `:root`, `body.gruvbox` and `body.nord`. Holds.
- `vscode-map.ts`: `grep -n 'c-violet\|c-purple\|c-pink' src/lib/themes/vscode-map.ts` prints nothing, and `vscode.css` sets no hue token (only `-bg`, `-s`, code, graph and scm tokens). Holds.
- "`--c-pink` equals an application status's token in four blocks": **true only because the brief's read left out `--c-violet`.** Its list was green, cyan, teal, blue, grey, orange, red and slate. `blocks.py`, which compares with every status token, prints:
  - `body.everforest ... pink #d699b6 violet #d699b6 ... clash ['--c-violet', ...]`
  - `body.everforestlight ... pink #df69ba violet #df69ba ... clash ['--c-violet', ...]`
  - `body.gruvbox ... pink #d3869b violet #d3869b ... clash ['--c-violet', ...]`
  - So `--c-pink` equals the token of `planned`, the status the step is named for, in three further blocks. The values given for the four named blocks hold exactly as quoted.
- Tests that read the theme files: `grep -rln 'rice/' tests` prints the three named tests plus the helper `tests/checks/look/themes.ts`. `tests/server/root/hooks-server.test.ts:64` mocks `rosepine.css?raw`. Holds.
  - Other tests reach the sheets through `themes.ts` or `tokens.css`: `tests/checks/config/config.test.ts`, `tests/data/helpers/code-theme-pairs.test.ts`, `tests/server/desktop/app-theme-start.test.ts` and `tests/state/system/settings/theme-groups.test.ts`.
  - `grep -rn -i 'ebbcba\|ea9a97\|d7827e\|e06c75\|rosepine\|onedark' tests src --exclude-dir=themes` finds no test that pins an old pink value.
- Write-list line numbers: `grep -n -- '--c-pink' src/lib/themes/rice/*.css` prints `rosepine.css:42, 102, 161` and `singles.css:218`. Holds.
- The hub: `grep -n -i 'interview\|position_stages\|ec4899\|pink\|7c3aed\|^palette\|^statuses\|facet_tones' ~/workspace/research-hub/.oculus/config.yml` prints nothing. The hub overrides none of these, so oculus's change reaches the hub's Applications view and its Focus board. `grep -rln -i ec4899 .oculus/data` in the hub prints nothing.

How far apart pink sits from the status hues. The measure is CIEDE2000, computed with culori's `differenceCiede2000`, on both the hue and the derived `-txt` colour that a chip draws in. The scripts are `de.mjs` and `all.mts` in the scratch folder; `all.mts` resolves all 49 themes of `config/defaults/appearance.yml` through `parseBlocks`, `resolveTheme` and `deriveTokens`. It prints `49 themes; 15 pairs under 10`:

| Theme | Pink vs | Hue distance | Text distance |
|---|---|---|---|
| gruvbox | violet | 0.0 | 0.0 |
| everforest | violet | 0.0 | 0.0 |
| everforestlight | violet | 0.0 | 0.0 |
| rosepine, rosepinemoon, rosepinedawn | orange | 0.0 | 0.0 |
| onedark | red | 0.0 | 0.0 |
| nord | violet | 3.3 | 2.4 |
| nord | red | 20.1 | 8.5 |
| tokyonight, tokyostorm | red | 4.7 | 4.7 |
| tokyolight | violet | 8.8 | 7.3 |
| oxocarbon | red | 9.3 | 7.8 |
| kanagawa | red | 21.3 | 8.2 |
| gruvboxlight | violet | 12.6 | 4.8 |

- The light theme, the dark theme and every VS Code theme stay above 10. In `:root`, pink is 26.1 from red and 27.5 from violet.
- The threshold of 10 is the repository's own measure of "reads apart" (`vocab.yml` `focus_lanes` comment; `derive.ts:84-89`). Applying it to chips and stack edges is a judgment.

## Cases and checks

- Inconsistent with the rules file and with the brief itself: **C4** (and the write list) against item 2's last sentence and `spec.md:72` ("A sentence in a document or a head comment that the change makes false is a defect of the change"). If a new pink from outside the palette makes a source comment incomplete, fixing it means editing `rosepine.css:1-4` or `singles.css:1-8`. That edit breaks C4 ("shows only the four `--c-pink` lines") and the write list.
- **C4** also requires the 25 other blocks to stay byte-equal. That holds `everforest`, `everforestlight` and `gruvbox` in their equality with violet, so C4 enforces the defect the goal exists to end.
- Cases that check a place the step does not change:
  - **C6** checks `:root`, whose file the step does not touch; the brief says "unchanged file".
  - **C2** checks the palette.
  - **C5** checks `offered` and `flagship`.
- The base copy is named in C4 but nowhere located. The brief names no worktree path, no base copy folder and no base for `utils/unused-exports.sh` (`spec.md:33`, `:89`). `grep -n -i 'worktree\|base copy\|unused-exports' .scratch/migration/agents/briefs/O138.md` shows O138's brief does not name them either, so these are probably given at dispatch. This finding is void if the dispatch prompt names them.
- Verify item 3's `perl` form is stricter than the form in `spec.md:103` (it lacks the allowance for accented letters under `config/`). It prints nothing on the base (run: `exit 0`), so it holds for these three files.

## The question

The question for each item: could this pass without the goal being reached? The goal is that in every theme an interview reads apart from planned and from every application status.

- **C1: yes.** Both values read `#ec4899` while everforest, everforestlight and gruvbox draw that token equal to planned's violet.
- **C2: yes.** The palette is unchanged by the step either way.
- **C3: yes.** It tests inequality only, so `#ebbcbb` against an orange of `#ebbcba` passes. "Reads apart" has no measure in any case.
- **C4: yes, and it makes the goal impossible in three themes** (see Cases and checks).
- **C5: yes.** It checks unrelated lines.
- **C6: yes.** It tests inequality only. It holds on the tree with margins above 26, but by its own predicate it would pass a near-equal value.
- **C7: yes.** `derive.ts` nudges `--c-pink-txt` and `--c-pink-lane-txt` until they clear 4.5:1 for any authored pink, so the contrast test passes whatever pink is chosen and says nothing about distinctness.
- **The step line's check: yes.** The line names none.
- **Item 1: yes.** It is a value change only.
- **Item 2: yes.**
  - "Reads apart" is unmeasured, and only equality is checked.
  - It measures the hue, while the Applications chip draws `--c-pink-txt`. Nord's hue is 20.1 from red but its derived text is 8.5. Gruvboxlight's hue is 12.6 from violet but its text is 4.8.
- **Item 3: yes.** It forbids the change in the blocks where the goal fails.

The fix that reaches the goal:
- Widen the step to every block under the threshold: everforest, everforestlight, gruvbox, nord, tokyonight, tokyostorm, tokyolight, oxocarbon, kanagawa and gruvboxlight, beside the four.
- State the bar as a CIEDE2000 of at least 10 between `--c-pink` and each status token, on the hue and on the derived `-txt`, in all 49 themes, measured with culori `differenceCiede2000` (already a dependency) by the case-run program.
- Replace C3, C4 and C6 with that sweep. C4 becomes byte-equality outside the `--c-pink` lines and the source comments.

Ruling 665 names only the four themes, so the widening is Axel's to rule: a premise of the ruling was found wrong. The narrower option is to land the four themes and book the rest, and that is the lazy option.

## Implied inputs

1. **Other blocks where the new pink equals planned's token.** This has happened: everforest, everforestlight and gruvbox (`blocks.py`). The expected result is that each gets a pink of its own, or that ruling 665 is revised by Axel.
2. **Blocks near the threshold.** Nord, tokyonight, tokyostorm, tokyolight, oxocarbon, kanagawa and gruvboxlight are under 10 on the hue or on the derived text (`all.mts`). The expected result is that each clears the bar the brief names. The brief names no bar.
3. **The derived text colour.** The chip draws `--c-pink-txt`, made by `readable()` in `derive.ts:181`, and nudging can close a gap the hue has. The expected result is that the distance holds on `-txt` as well as on the hue.
4. **The light, dark and VS Code themes.** All three take `:root`'s pink, and all clear 10 against every status on both the hue and the text (`all.mts`). The expected result is no change. C6 checks equality only.
5. **The lane colours the contrast test derives.** `--c-pink-lane` and `--c-pink-lane-txt` are minted for every hue, and the test measures one on the other. The expected result is a pass, since `derive.ts` nudges them. The Focus stack does not use a lane: `src/lib/views/boards/focus/Band.svelte:147` draws `--stage: var(--c-${toneOf(stage.color)})` as a 3px left border (:254). So the hue itself, not `-lane`, is what must stand apart from Planned's violet.
6. **Other users of `--c-pink`.** These are the Career view's profile bars (`career-view.ts:44`) and the form filter group (`vocab.yml:233`). The expected result is that both change in the four themes and that the report's before-and-after section and the look at landing name them.
7. **The source head comments** (`rosepine.css:1`, `singles.css:3`). The expected result is a source clause for the outside pink, as Oxocarbon's has, with the write list and C4 widened to allow it.
8. **Whether the four pinks are feasible.** A probe (`cand.mjs`) shows candidates that clear 10 against red, orange, violet and the status hues while meeting the contrast floor:
   - `#f0a6d8` for Rose Pine and Moon: 11.7 from violet; contrast 8.76 and 7.64 on the panel.
   - `#b45d9e` for Dawn: 11.0 from red; contrast 4.04, equal to red's 4.04.
   - `#f0a0d0` for One Dark: 15.4 from violet.
   - Dawn is tight: its contrast floor pushes the pink darker, toward red and violet. The expected result is that the step can be done; the values are the builder's to choose.

## ADRs

None. `ls docs/adr` prints "No such file or directory".

## Dictated text

- `grep -n '"#ec4899"' .scratch/migration/agents/briefs/O140.md` locates line 23, which dictates `color: "#ec4899"` for `vocab.yml:155` and `:205`. Holds: it is ASCII, and the new string has the same length as `"#7c3aed"`, so the column alignment is kept.
- Line 77 dictates the report's first line, "Everything in the brief is done". Holds: it is the form in `spec.md:84`.
- No comment or other file text is dictated.

## Declined to judge

- Whether a CIEDE2000 of 10, the repository's measure for lanes, is the right bar for chips and stack edges. It is Axel's or the orchestrator's choice; a look at landing in the near themes, such as nord and tokyonight, would settle it.
- Whether a chosen pink is "in the theme's own tone". That is for the look at landing.
- Whether a pink from outside the palette makes the head comments false or only incomplete. The Oxocarbon pattern points to false.
- In Rose Pine, `active` (green) and `offered` (teal) share `#9ccfd8`. That is a clash between application statuses that does not involve interview, so it is outside this step's goal, and I did not judge it.

Usage: ad6e98d66c1edb3ea, claude-opus-5-5, 180152 tokens, 47 tool uses, 9 min 14 s.

## Closed

- The main finding (the goal cannot be reached in everforest, everforestlight and gruvbox) and The question, Item 2 and Item 3: raised as open item 666 and ruled 1 (a); the brief now covers every block under a CIEDE2000 of 10, and item 3's ban on other blocks is gone.
- Implied input 2 and the near-threshold table: the brief's sweep on main (pink and teal against every status token, on the hue and on `-txt`) lists the 14 pink blocks and, by ruling 666 2 (a), the 17 teal blocks, each with its file and line.
- Implied input 3 (the derived text colour): item 2 measures every pair on the hue and on `-txt`; decision 2 says why.
- Implied inputs 5 and the lane colours: item 2 holds every `-lane` pair of teal or pink at 10 or above where it was on the base, so the `focus_lanes` comment stays true, and C3 checks it.
- Names, other users of `--c-pink`, and implied input 6: "What is on the tree" names the users of pink and teal, and the report's before-and-after section names the Career view's bars, the Build lane and the Teaching column.
- Names, the source head comments, and implied input 7: item 3 adds a clause to each touched file's head comment, and the paths and C4 include the head-comment lines.
- Cases and checks, C4 enforcing the defect: C4 now allows only the listed `--c-pink` and `--c-teal` lines and the head comments.
- Cases and checks, C2, C5 and C6 checking places the step does not change: removed.
- The question, C3 and C6 testing inequality only: replaced by C2, the measured sweep over all 49 themes.
- The question, C7: kept as C5, with the brief stating that distinctness is C2's measure, not the contrast test's.
- Cases and checks, the base copy not located: the worktree and its base copy are given at dispatch, as for every step.
- Cases and checks, Verify 3's form: it now runs over every `rice/*.css` file the step may change.
- The step line's contrast floor against `--c-red`: dropped. The derived text's contrast is held by the contrast check, and the hue is held by item 2's bar.
- Declined to judge, Rose Pine's active and offered sharing `#9ccfd8`: raised as open item 666 part 2 and ruled 2 (a).
