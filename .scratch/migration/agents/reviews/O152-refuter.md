# Step O152 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O152, base 3ad2d2346)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All runs were made from the worktree's root. `git diff 3ad2d2346 | md5` printed `eaefdfc118977d0ffcd1c4a974267980` and `git status --short | md5` printed `15a9b24d7445d958b710832d9445a27c`, both before and after the diagrams and palette runs, so the tree is unchanged by them.

```
$ npm run diagrams            -> ... docs/diagrams/writes.svg / diagrams exit 0
$ npm run docs:palette        -> docs/palette.md / palette exit 0
$ npm run test:quick
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (3.3 s)
ok      svelte-check (13.1 s): 1793912813843 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (26.4 s): Duration  11.29s (transform 990ms, setup 0ms, import 2.48s, tests 8.60s, environment 0ms)
ok      vitest (46.3 s): Duration  31.31s (transform 24.07s, setup 0ms, import 40.99s, tests 41.02s, environment 4ms)
ok      vitest checks (54.7 s): Duration  39.41s (transform 28.94s, setup 0ms, import 58.04s, tests 74.59s, environment 4ms)
test:quick: 57.6 s; every command passed

$ npx vitest run tests/state/shared/hub-words.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/checks/look/contrast.test.ts
 Test Files  4 passed (4)
      Tests  131 passed | 2 skipped (133)

$ npx vitest run tests/state/shared/hub-words.test.ts --reporter=verbose
 <check mark> |unit| tests/state/shared/hub-words.test.ts > the words of each hub's records > draws a venue with the glyph, tone and label of its tier row in its own hub's words 755ms
      Tests  5 passed (5)
 (the other four cases: 542ms, 506ms, 210ms, 220ms)

$ grep -rn "venueText\|\.venue?\?\.text" src tests
src/lib/state/boards/board/items.ts:32:    venueText,
src/lib/state/boards/board/items.ts:99:        item.venue?.text ?? '',
src/lib/state/boards/board/items.ts:156:                      text: venueText(venue),
src/lib/state/boards/board/presets.ts:678:export function venueText(venue: Venue): string {
src/lib/state/boards/board/index.ts:22:    venueText
src/lib/views/shared/card/project/CardLinks.svelte:29:    // text (its name, its quartile and its JIF, presets.ts `venueText`) as one tag with no press,
src/lib/views/shared/card/project/CardLinks.svelte:138:            tags: item.venue === null ? [] : [{ id: item.venue.id, label: item.venue.text }],

$ ASCII gate of the rules file over src tests bin config
find: bin: No such file or directory
ascii gate exit 0            (no line printed; the worktree has no bin folder)
$ LC_ALL=C grep -n '[^ -~]' <every changed file but the svgs>   -> touched grep exit 1 (no line)
$ LC_ALL=C grep -c '[^ -~]' docs/diagrams/layer-state.svg docs/diagrams/layer-ui.svg docs/diagrams/layers.svg -> 0, 0, 0

$ wc -l
     261 src/lib/views/shared/card/project/CardLinks.svelte
     132 src/lib/ui/controls/Tag.svelte
     255 src/lib/state/boards/board/items.ts
     721 src/lib/state/boards/board/presets.ts
     354 src/lib/state/boards/structure/lines.ts
     547 src/lib/data/shapes/catalog-files/vocab.ts
     206 tests/state/shared/hub-words.test.ts

$ sh utils/unused-exports.sh | diff ../O152-base/unused-exports.txt -
unused diff exit 0

$ grep -rn "TierRow\b" src tests config docs README.md --exclude=local.yml
 lines.ts:40, :53, :107, :311, :326; LineCard.svelte:27, :39
$ grep -rn "TierMark\|venueTierMark" src tests config docs README.md --exclude=local.yml
 items.ts:24, :161; presets.ts:37, :139; lines.ts:52, :340; CardLinks.svelte:31; hub-words.test.ts:9, :20, :184, :195
$ grep -rn "glyphTone\|glyphTip" src tests docs README.md
 Tag.svelte:39, :41, :44, :50, :63, :64; CardLinks.svelte:86, :87, :140, :141, :192, :193
$ grep -rn "BoardItem\|venueText\|venue.text" docs README.md   -> no hit outside docs/diagrams

$ history-word grep over the added lines of src tests config docs/HELP.md docs/templates.md
 one hit: the added HELP.md:299 line, on the paragraph's existing words ("still open", "before an empty terminals pane"); no hit in an added comment or test title

Commands the builder's report quotes, rerun:
$ node probe of zod 4.6.5 (node_modules/zod/package.json: 4.6.5)
without assignable: false
optional: true
$ venueTiers over the shipped vocab.yml on the base copy (plain node)
O152-base [{"key":"unrated","label":"unrated","color":"#94a3b8","fallback":true}]
$ the same on the worktree under plain node
ReferenceError: $state is not defined   (generation.svelte.ts:23, reached through the new text.ts and tones.ts imports of lines.ts)
$ hub venues.yml read only (node, yaml parse)
{"strong":25,"(none)":8,"specialist":20,"flagship":25}
cbm volga-neuroscience icfp-src chi-ea ecnr kuleuven-thesis uhasselt-thesis xai-nl
jbi strong "Q1" "5.9" ...; bspc specialist "Q2" "5.7"; hcin specialist "" "none"; cbm undefined "Q1" "6.3"
jif none: 20
$ grep -n venue_tiers ~/workspace/research-hub/.oculus/config.yml  -> exit 1
$ venueText on the final tree over those hub venues (plain node)
jbi "Journal of Biomedical Informatics | Q1 | JIF 5.9"
bspc "Biomedical Signal Processing and Control | Q2 | JIF 5.7"
hcin "Human-Centric Intelligent Systems (HCIN)"
cbm "Computers in Biology and Medicine | Q1 | JIF 6.3"
$ npx vitest run tests/checks/config/templates.test.ts
 Test Files  1 passed (1)
      Tests  5 passed (5)
$ grep -rn "venueMark\|TierMark\|tierMark\|VenueMark" src tests (base copy) -> exit 1
$ grep -rn "glyphTone\|glyphTip" src tests (base copy) -> exit 1
$ ls src/lib/state/boards/board | wc -l (base copy) -> 10
$ diff -rq ../O152-base/{src,tests,config,utils} -> the 11 files of the write list, nothing in utils
$ ls node_modules/lucide-static/icons/ | grep -E "^(crown|target|star)\.svg" -> crown.svg star.svg target.svg
```

Not rerun: the builder's first failing run of the new case on the unchanged code (`TypeError: venueTierMark is not a function`). Rerunning it would mean placing the new test file over base code, which writes a file. By reading, `git show 3ad2d2346:src/lib/state/boards/structure/lines.ts | grep -c venueTierMark` prints `0`, so the import is undefined on the base. Also not rerun: the builder's after-tree case program `cases.case.ts`, because it needs a file and a scratch vitest config. Its venueText half was reproduced above. Its tier half was checked by reading against the shipped rows and the palette (`vocab.yml:32` `#0d9488: c-teal`, `:33` `#0891b2: c-cyan`, `:40` `#7c3aed: c-purple`, `:47` `#94a3b8: muted`).

## Verdicts

Items of the brief's "What to build":

- 1: holds. The `venue_tiers` rows carry crown, star and target, and unrated carries none (`vocab.yml:302-305`). `glyphs.yml` holds `crown: "[^]"` and `target: "(+)"`, and `icons.yml` holds `crown: crown` and `target: target`, both in the "tab / section icons" group after `venue`. The `vocab.ts:536` description names the glyph, and the comment above `venue_tiers` says what a row holds. config-folder passes in the four-file run.
- 2: holds. `config/options/catalogs/vocab.yml` has a `glyph` field with `control: glyph`, its help as the brief words it, and the entry's help names the glyph.
- 3: holds. `TierRow.glyph` exists (`lines.ts:40-46`). `venueTierMark` (`lines.ts:340-349`) reads `rootOf(venue)`, takes the row the tier names or the fallback row, gives null with no fallback, and gives null for an empty glyph or one `hasGlyph` refuses. The tone comes from `paletteTone(row.color, hub)`. `items.ts:161` calls it. The `assignable: z.unknown().optional()` fix (`lines.ts:308`) is inside this item: without it `venueTiers` hands `venueTierMark` only the unrated row (zod probe and base run above), so no shipped tier could ever give a glyph. The base doc comment of `tierRowShape` already treated `assignable` as optional. Its effect on the Pillars view is stated with its before and after in the report's "Before and after" section.
- 4: holds. `venueText` drops `free` (`presets.ts:678-684`, and the run above), and its doc comment says so. `haystack` reads `venue?.free` beside the text (`items.ts:99-100`).
- 5: holds. The tier glyph is `Tag`'s own glyph, coloured by `--mark-txt: var(--c-<tone>-txt)`, with the label kept muted (`.tag` colour; `.mark` inherits when there is no tone). The tip goes through `Tooltip`, and `Tag` gains `glyphTone` and `glyphTip`. A Tag given neither draws `<Glyph>` as on the base (`Tag.svelte:73-74`). See finding Behaviour B1 on the stop's accessible name; it does not break the item's text.
- 6: holds. `HELP.md:299` says the icon, the tier as its tip, the name, quartile and JIF, and that the cost is on the Venues view. `templates.md:541-548` names the glyph and carries it in the example's first row. The templates test passes (5 of 5).
- 7: holds. There is one case in describe "the words of each hub's records", with `setGlyphs`. It covers two hubs with different glyphs and colours for `strong`, a third hub with no glyph, an empty glyph and an unknown glyph, and a cross-hub project through `buildHubs`. Its failing run is quoted in the report. See finding Proof P1 on its time.

Cases of the brief's "Cases":

- C1: met for the state. venueText gives "Journal of Biomedical Informatics | Q1 | JIF 5.9" (run above). The shipped strong row gives star and `#0d9488`, which maps to c-teal (read). The hover and focus tip is for the look on landing.
- C2: met for the state. The run gives "Biomedical Signal Processing and Control | Q2 | JIF 5.7", and the shipped specialist row gives target and cyan, flagship crown and purple (read). Seen at the look.
- C3: met by reading and the test rows. The unrated row has no glyph, so the mark is null. A venue with no tier and an unknown tier take the fallback (test rows `venue('plain')`, `venue('lab','nope')`). The card then draws `'venue'` (`CardLinks.svelte:137`). CBM is a hub venue with no tier and can be looked at.
- C4: met. `hcin` gives "Human-Centric Intelligent Systems (HCIN)" (run above).
- C5: met by reading `items.ts:99-100`, where the haystack joins `venue?.free` and lowercases the whole.
- C6: met by the new case (rows lab/home/plain and the cross-hub board item), green in the runs above.
- C7: met. The test rows `blank` and `typo` give null. By reading, `CardLinks.svelte:137` falls back to `'venue'`, and `hasGlyph` is checked before a name reaches `Glyph` (`lines.ts:346`).
- C8: met by reading. The test row `venue('home')` (no fallback row) gives null, and `venueTiers([])` gives `[]`, so both `find` calls are undefined and the mark is null.
- C9: met by reading. `crown "[^]"` and `star "[*]"` are bracketed, so `Tag` drops its own pair. `target "(+)"` is not bracketed, so it gets `[ ]`. Settled at the look on landing.
- C9b: met by reading. The unchanged `tags: item.venue === null ? [] : ...` means a kind with no tags is not drawn.
- C9c: met. The test rows with `#123456` give a mark with no tone, and `.mark` falls back to `inherit`.
- C10: met. config-folder passes, and `crown`/`target` have icon rows and are used in `vocab.yml` values.
- C11: not verifiable here. The options entry carries the field with `control: glyph`. The look on the Settings view's Vocabulary section settles it.

## 1. Spec

These are premises of the brief's "What is on the tree" that my own runs do not reproduce. Each is a defect of the brief, not of the builder, and none changes a verdict:

- Brief, "What is on the tree", the tier-rows bullet: "The tier rows are read by `venueTiers` (`src/lib/state/boards/structure/lines.ts:282-307`) into `TierRow`". What is wrong: on the base, `venueTiers` keeps only the `unrated` row. The base run above printed `[{"key":"unrated",...,"fallback":true}]`, because zod 4.6.5 treats a `z.unknown()` key as required. Failure scenario: a reader of the brief expects the Pillars line cards to have counted by tier on main. They counted every in-flight project under "unrated", and the step changes that (stated in the report). Verdict: none.
- Brief, "What is on the tree", the `NO_JIF` bullet: "the hub has 25 flagship, 25 strong and 20 specialist venues and none unrated or untiered". What is wrong: eight hub venues have no `tier` (`cbm volga-neuroscience icfp-src chi-ea ecnr kuleuven-thesis uhasselt-thesis xai-nl`, run above). Failure scenario: C3's "Checked by reading, since the hub has no such venue" leads the look to skip a case CBM can show. Verdict: none.
- Brief, "What is on the tree", the Tooltip bullet, and item 5: "as the card's facts row does, so the tip shows on hover and on keyboard focus". What is wrong: `CardFacts.svelte:16-18` says "The wrappers take no tab stop, so a card gains no stops before its controls", and its Tooltips carry no `focusable`. The facts row's tips are hover only. The builder met item 5's explicit requirement with `focusable` and declared it as D1. That is inside item 5, since keyboard focus is named there. Precedents for a focusable tip on non-control content exist at `LineCard.svelte:92`, `VenueCard.svelte:254` and `Venues.svelte:114`. Verdict: none.
- Brief, item 3: "read from the vocabulary of the project's own hub (G127)" against its own sub-bullet and decision 6 ("the venue's own hub"). The builder followed the sub-bullet. The cross-hub test row holds it. Verdict: none.

## 2. Proof

- `tests/state/shared/hub-words.test.ts:159-205`, the new case: "draws a venue with the glyph, tone and label of its tier row in its own hub's words 755ms" (my run), and 822 ms and 872 ms in the report. What is wrong: the rules file's "What every package obeys" says "A test runs in well under a second; one that cannot ... is tagged slow". This case is untagged and takes 0.75 to 0.87 s, against 0.2 to 0.54 s for the file's other cases. Its cost is three engine `loadConfig` parses and a `buildHubs` of two planted hubs. No vitest limit enforces a second (`grep -n "Timeout\|slowTest" vite.config.ts` prints nothing). Failure scenario: with several suites on the machine at once, this case is the first of the file to pass a second, and it runs in every `npm test` and every test:quick that reaches `lines.ts`, `items.ts` or `tones.ts`. Verdict: none; item 7 holds.
- Report, "Premises that did not reproduce" P1 and P2: the case-run programs `untiered.mjs` and `zod-probe.mjs` are named, but their sources are not quoted, and `case.config.mjs` is described rather than quoted. What is wrong: the rules file's "What every package obeys" says a case-run program "has its source and its output quoted in the report, so the reviewer can run it again". I reproduced both outputs with my own commands (above), so no decision is left resting on an unreproduced claim. Failure scenario: a later reviewer cannot rerun the builder's exact program and has to rebuild it. Verdict: none.

## 3. Standards

- Report, "npm run test:quick, the last run": "The list ran three times. ... The third followed one more change to the test file ... it is one run more than the rules file allows". What is wrong: the rules file's "Token discipline" allows one run after the last change, plus one more after a red line in a changed file is fixed. The third run is beyond that. The builder reported it. Failure scenario: about 50 s of machine time and one turn of context per extra run. Verdict: none.
- Report, "Limitations and sharp edges", last bullet: "this report, where `sed -i ''` replaced one citation". What is wrong: the rules file's "What every package obeys" says every edit is made with Edit and Write, and a `sed -i` is a script that needs approval. The builder named it, and the file is the report only. This falls under the plan's ruling "Unapproved builder scripts". Failure scenario: none to the diff. Verdict: none.
- `src/lib/state/boards/structure/lines.ts:1`: "Layer 2, client state. Pure joins for the Pillars and Domains views: ... the tier a project card draws a venue with". What is wrong: the rules file's "What every package obeys" says a head comment the change makes false is a defect. `venueTierMark` is not pure: it reads the installed glyph vocabulary (`hasGlyph`, `text.ts:95`) and the installed palette (`paletteTone`, `tones.ts:215`). It also serves the board card, not only the Pillars and Domains views. The module can no longer be loaded under plain Node (the `$state is not defined` run above). That matters only to a case-run program, since `grep -rn "structure/lines" src tests` lists client and test importers only. The join also reads its rows from the `wordsOf` it is given but its palette from the installed vocabulary, so a caller passing a reader that differs from the installed one gets rows and tone from two sources. Failure scenario: a later builder reads "Pure joins" and imports `lines.ts` from a Node-run module or a plain-node probe, and it throws at load. Verdict: none.

## 4. Behaviour

- `src/lib/ui/controls/Tag.svelte:63-68`: "`<Tooltip text={glyphTip} focusable>` / `<span class="mark" style={markStyle}>` / `<Glyph name={glyph} />`". What is wrong: the new tab stop is the Tooltip's `span` with `tabindex=0` and no role. Its only content is the `aria-hidden` Glyph and the `hidden` words span (`Tooltip.svelte` markup), so the focused element has no accessible name. A screen reader user who tabs to it hears an unnamed stop, with "strong" at most as a description. Tooltip's own comment says `focusable` is meant to wrap "non-control content such as a Chip", whose content is readable text. The standard is WCAG 2.2 SC 4.1.2 (Name, Role, Value). It applies because item 5 makes the screen reader one of the tip's readers. The report's D1 states the tab stop, but not that the stop is nameless. Failure scenario: Tab through a board card whose venue is `jbi`. The stop lands on the star and announces nothing, or a blank group, before "strong". This repeats once per card for every tiered venue: 70 of the hub's 78 venues. Verdict: none on item 5's text (the description is there). It is a defect of the delivered stop; the fix is the orchestrator's (a name such as the tier label on the stop, or an `img` role with that label on the mark).
- `docs/HELP.md:299`: "Venue, which reads the icon of the venue's tier in the tier's colour, the tier its tip". What is wrong: the paragraph does not say that the tier icon takes a tab stop and shows its tip on keyboard focus. The rules file's "What every package obeys" counts focus and tab stops as visible, and asks that what a user does be written into HELP.md. Failure scenario: a keyboard user reading the help is not told about the extra stop on each card. Verdict: none.

## Declined to judge

- D1, keeping the tier tip focusable (one more tab stop per card with a tiered venue) against leaving it hover only as the facts row is. This is a user-visible shape the orchestrator may reverse. The brief's item 5 asks for keyboard focus; whether that requirement stands, given the facts row's "no stops before its controls" design, is the orchestrator's or the user's call.
- The other zod `z.unknown()` keys the report lists in request-body shapes (`bodies.ts:470` and the rest). They were not read here. They are a different concern than this step, and whether each key is meant to be required needs a read of each route.
- The builder's failing run of the new case on the unchanged code. Not rerun, because placing the new test over base code would write a file. The base's lack of `venueTierMark` was confirmed with `git show 3ad2d2346:src/lib/state/boards/structure/lines.ts | grep -c venueTierMark` (prints `0`).
- Everything C1, C2, C9, C9b, C11 and the Pillars change leave to the look: the colours drawn, the bubble on hover and on Tab, the bracket pairs in the terminal theme, the Settings glyph field, and the Pillars line cards' four tier counts. These need a page, which a reviewer does not run.
- The generated `docs/diagrams/*` import counts. The files were regenerated by `npm run diagrams` with no change to the diff, but the counts were not read line by line.

Reviewer usage: a8593b71051db912f, claude-opus-5-5, 204111 tokens, 49 tool uses, 12 min 2 s.
