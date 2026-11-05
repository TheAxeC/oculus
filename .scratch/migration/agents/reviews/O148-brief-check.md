# Step O148 brief check

All reads ran on main at 57649a80d (`git log -1 --oneline`). `.scratch/migration/plan.md` has no `## Goal` section: `grep -n '^#' .scratch/migration/plan.md` lists only `# Plan`, `## Steps`, `## Could run in parallel`, `## Rulings`, `## Agents` and `## Blocked`. I took the goal this step delivers to be its step line (plan.md:1686) plus rulings 680, 682 and 684 (plan.md:3561, 3563, 3569).

Most of these findings widen the write list for code the step already builds, with nothing new for the user to see; under the standing demand "A brief check never widens a step" those can be taken in automode. The case corrections (C1, C2, C3, C15) only fix wrong expected words. Implied inputs 1 to 3 would add cases; whether that widens the step is for the orchestrator to judge.

## Names

1. **`DeckProject` is also built by the snapshot build (`src/lib/data/index.ts`), which the brief never names.** `git grep -ln DeckProject` hits `src/lib/data/index.ts`. Its `deckProjects` (index.ts:302-326) builds `DeckProject` from raw manifests. `decks()` (index.ts:331-356) runs `createReader` over every project deck and the portfolio deck. Its findings join the snapshot's findings at index.ts:472 (`...deck.findings`), which is what the Findings view lists (HELP.md:331, "listed under Findings for the portfolio deck and the projects' decks").
   - If item 4's fill lives in `fileSlides` and the facts reach it only through the deck route, this read has no facts. Every `{{project.venue}}` in a project deck would then raise the "holds no value" finding in the Findings view, while the slide on screen shows the venue.
   - Fix: add `src/lib/data/index.ts` to the paths (862 lines, `wc -l`, so 18 lines of room under 880) and say what that read is given: the same facts, or no fill findings where it has none.
2. **`DeckSource` and the reader's context are built as literals in two tests outside the paths.**
   - `tests/routes/docs/deck.test.ts:35-40` and `:184-189` build `DeckSource` literals; a required new field breaks the type check.
   - `tests/checks/config/integrity.test.ts:88-99` (its own `deckProjects`), `:107-114` and `:335-342` build `createReader` contexts and `DeckProject`s.
   - `src/lib/server/content/deck/endpoint.ts:68, 90` and `groups.ts:33` only pass the types through and are not made false.
   - Add both tests to the paths, or say the new fields are optional.
3. **The deck writes cannot give the needed entities through `deckSourceOf` without two files outside the paths.** `WriteTarget.entities` (`src/lib/server/edit/writes.ts:136-141`) and `entities()` (`src/lib/server/sessions/stores/hooks.ts:142-147`) take only `kind: 'domains' | 'resources' | 'people'`. Venues, pillars, datasets and funding are unreachable, so item 1's "through the `DeckSource` both its builders give" needs `writes.ts` (the field and its builder at :322) and `hooks.ts` widened. Their doc comments (writes.ts:136-140, hooks.ts:137-141, "the domains, the resources, the people") become false. Add both files.
4. **New model types need the model facade.** `src/lib/data/model/index.ts:458-476` re-exports the deck types by name (`export type { Deck, DeckCard, ... } from './model-deck.ts'`). A new type on the deck answer needs a line there. Add the file.
5. **The card's label rules would end up written twice.** The brief allows a server-side copy of rules that stay on the client:
   - `codeLabel` (`src/lib/views/shared/card/card.ts:189-194`)
   - `personNames` (`src/lib/state/boards/person.ts:45-51`)
   - `chipLabel` and `domainLabel` (`src/lib/state/shared/words/tones.ts:343-345, 296-300`)
   - the venue's short-else-name rule (`src/lib/state/boards/board/items.ts:156-159`)

   Item 1 lets "one written for this step" sit in the data layer while the card keeps its own copy. That breaks `spec.md:89` ("a parser, a fold or a rule exists once and is reused"). The brief should say that each rule written in the data layer is the one the card reads too, and add `card.ts`, `items.ts`, `person.ts` and `tones.ts` to the paths for the rules moved.
6. **Shapes the brief leaves unnamed.** It does not name the toggle's field of `PresentState`, the slide's project field, the deck's facts field or the `keep` message's new field. Verify item 6 only calls them "the slide's project field", "the deck's facts field" and so on. A key of saved instance state and a wire format are user-visible shapes under `spec.md:18`. The brief should name them, or say the builder reports each name as a decision.
7. **Comments outside item 6's list that the change makes false.** Item 6 says "every file the step changes", but its parenthesised list leaves these out:
   - `present.ts:672-688`, the `messageShape` doc ("The answer is a `keep`, the kept list or null")
   - `export.ts:108-112`, `answerPrint`'s doc
   - `present.svelte.ts:262-266` (`exportKeep`) and `:614-617` (`sendKeep`)
   - `presentation.svelte.ts:1-7`
   - `model-deck.ts:139-140` ("Words are Markdown, with the group counts in them already replaced")
   - `kinds.ts:24`, the `DeckProject` doc
   - server `read.ts:31-36, 45`
   - `deck-files.ts:90`
   - `data/index.ts:301`

   Name them, or drop the parenthesised list.
8. Other hits that are not made false:
   - `deckSourceOf` in `deck.ts:212`, a caller left unchanged.
   - `docs/diagrams/writes.dot` and `.svg`, which are generated by `npm run diagrams`.
   - `{{<group>.count}}` at `model-deck.ts:220` and `read.ts:27`, both still true.
   - `tests/fixtures/hubs/demo/deck/title.md:8`, which is unaffected.
   - "Project facts" does not occur in `config/text` (`git grep -n -i "project facts"` prints nothing).

## The step line

Every part of plan.md:1686 maps to a requirement:

| Part of the line | Requirement |
|---|---|
| strip at the foot of every slide from a project's deck | items 1 and 2 |
| the sixteen fields | item 1, order and words |
| each field that holds a value | items 1 and 2 |
| the stage as it is, failed and stopped | item 2, C3 |
| two lines at most | item 2, C11 |
| toolbar toggle saved with the pane | item 3 |
| drawn only when the slide on screen comes from a project's deck | item 3, C4, C5 |
| `{{project.<field>}}` filled | item 4 |
| on screen, presenter, audience, PDF the same way | items 2, 3 and 5 |

Rulings 680 (on by default, "Project facts") and 682 are carried into item 3, and 684 into item 2. No part of the line is left without a requirement.

## Premises

Reproduced as stated:
- `wc -l`: read.ts 709, kinds.ts 368, model-deck.ts 289, present.ts 771, present.svelte.ts 742, Present.svelte 518, Bar.svelte 141, Slide.svelte 97, Presenter.svelte 231, Tile.svelte 184, Overview.svelte 259, show page 309, print page 172, present.test.ts 499, present.yml 158.
- Line ranges: `COUNT` :100, `counted` :103-113, `projectOf` :188-201, `docAt` :204-247, `fileSlides` :369-426, `summary` :440-505, `slidesOf` :508 with memo :515/544, `DeckSource` :37-43, `DeckProject` kinds.ts:25-47.
- More line ranges: `PresentState` :84-93, `presentStateShape` :98-103, `parsePresentState` :134-142, `deckShape` :620-637, `keep` :709-713, `exportKeep` :268-284, `sendKeep` :618-621, `measured` :479-500, `tall` :404, Bar Overview Chip :69-74, `hubDomainsOf` :698-712, findings.yml:131 `count_unknown`, model-deck `Deck` :271-289, `DeckSlide` :142-182, `SlideBase` :122-130.
- Folder counts with the brief's command: present 10, parts 10, deck 10, state/life 10, tests/data/sources 10, screen 4.
- The five manifests' fields, read with `python3 -c 'import yaml ...'` over each `project.yml`.
- `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`.
- `grep -rn '{{ *project\.' --include='*.md' --include='*.yml'` over the hub prints nothing.

Wrong or incomplete:
1. **Server `read.ts` line numbers.** `deckProject` is at :46-62, not :47-63. `readDeck` is at :83-114, not :82-117; the file has 114 lines (`cat -n src/lib/server/content/deck/read.ts`).
2. **`Present.svelte` line.** The `Framed` line is at `Present.svelte:475`, not :479 (`grep -n "Framed" Present.svelte` gives `475: <Framed row={shown} {deck} first={at === 0} bare={full} />`).
3. **`tones.ts` line.** `installed` is at :126 (doc comment from :117), not :121-145.
4. **The command for "the server imports no module of `src/lib/state/`".** `grep -rln "state/" src/lib/server` prints ten files (`content/latex/reader.ts`, `edit/writes/manifest.ts`, ... , `files/fs/open-files.ts`), comments and `page-state` paths among them. The claim holds, but by `grep -rnE "from ['\"](\$lib/state/|(\.\./)+state/)" src/lib/server`, which prints nothing. The brief should give that command.
5. **Missing premise: the snapshot build's deck read.** See Names 1.
6. **Missing premise: `WriteTarget.entities` takes three kinds.** See Names 3.
7. **Missing premise: four more data-layer folders at ten.** Item 1 puts a new rule "in the data layer". `src/lib/data` 10, `src/lib/data/helpers` 10, `src/lib/data/sources` 10 and `src/lib/data/model` 10 are at the limit (same `git ls-files | cut | sort -u | wc -l` count), besides `data/sources/deck`. List them.
8. **Missing premise: the vocabulary's words.** `config/catalogs/vocab.yml:71` gives `submitted: { label: "submitted / under review", ... }`, :64 gives `nascent: { label: "nascent (concept)", ... }`, :76-77 give `failed (no-go or disproved)` and `stopped (dropped or abandoned)`, and :250 gives `research: { label: Research, ... }`. The hub overrides none of them (`grep -n "^stages:"` over the hub's `.oculus/config.yml` prints nothing). C1 to C3 contradict these words (see Cases).
9. **Verify item 3's `find src tests bin config`.** It names `bin`, which does not exist (`ls -d bin`: "No such file or directory"), so find prints a line on stderr. This comes from `spec.md:103`. The brief should say that stderr line is expected, so "print nothing" is read over stdout.

## Cases and checks

1. **C1 and C2 expect words item 1's rule does not give.** "Stage Submitted", "Stage Nascent" and "Tier research" do not follow item 1's rule (a word's `label`, else the word). By vocab.yml:71, :64 and :250 they read "submitted / under review", "nascent (concept)" and "Research". C1 also checks the reader test against the real hub's names, but tests use synthetic fixtures (`spec.md:38`); say "a fixture of the same shape", as C2 does.
2. **C3 should name its expected words**: "failed (no-go or disproved)" and "stopped (dropped or abandoned)" (vocab.yml:76-77).
3. **C15's compute half tests the normaliser, not this step.** A compute key the resources registry lacks is already dropped by the snapshot (`resourceIds`, model-entities.ts:466-470, "A key the registry lacks is a finding and is left out"). Use a venue id the registry lacks instead, which the card leaves out (items.ts:122-123, 151-153).
4. **C14 cannot be seen in the reader test.** The reader holds one hub's context (`DeckContext`, read.ts:60-82), so "in its hub's words" is decided by the server's mapping. Check it through `readDeck` over a `DeckSource`, in G32's deck read test `tests/routes/docs/deck.test.ts`.
5. **C7's sentence is garbled.** "at the look in the desktop app path only by reading" should say plainly that C7 is checked by reading alone (`answerPrint`, `exportKeep`, the print page), since the browser path opens the print dialog and the desktop path is not driven at the look.
6. **C13's framing.** "any pane open on the base" frames the default as tolerating older data, which `spec.md:43` forbids. Phrase it as "a pane state with no toggle field (a new pane): read as on", which is the parse rule every field of `presentStateShape` already has.
7. **Decision 8 and the one-test-per-unit rule.** `spec.md:60` keeps one test per unit. The reader (`read.ts`) already has two G32 tests ('places the member decks of a group ...' and 'narrows every group of project decks ...'), and decision 8 adds a third table to the same unit. The facts' mapping from snapshot ids to words lives on the server (`deckProject`), whose G32 test is `tests/routes/docs/deck.test.ts`. The brief should say which unit each table covers.

No case asks the builder to check a place the step leaves unchanged, apart from C16's reading of `deck.ts`. That is a read of an unchanged caller and is consistent with the rules.

## The question

The step line carries no check of its own; its gate is the cases and the look.

| Case | Could it pass without the goal? |
|---|---|
| C1, C2 | Yes. The reader test hands `createReader` a `DeckProject` fixture, so it passes with the words already written in the fixture and never runs the server's people, venue, domain and resource lookups. The look over the real hub is the only check that reaches the goal. |
| C3 | Yes, for the same reason: a fixture stage word passes without the vocabulary's label rule. |
| C4 | No. The reader test sees a null project, and the look sees no control. |
| C5, C6, C11 | No. The look shows each. |
| C7 | Yes. Reading alone shows no print page hiding the words. |
| C8 | Partly. The fill is tested, but not the server's words and not the snapshot build's read (Names 1). |
| C9 | Yes. It passes in the reader test while the snapshot build raises a false "no value" finding in the Findings view. |
| C10 | No. |
| C12 | No. Reading plus the look. |
| C13 | No. |
| C14, C15 | Yes. The reader test cannot reach the mapping (Cases 3 and 4). |
| C16 | No. The G8 tests and the reading. |

| Item | Could it pass without the goal? |
|---|---|
| 1 | Yes, through the reader test alone (as C1). |
| 2, 3 | No. The look. |
| 4 | Yes, without the snapshot build's read. |
| 5 | The audience window half: no, the look shows it. The print half: yes, by reading alone. |
| 6 | No. |
| 7 | No. `folder-check.sh` and the size check. |

Verify 2 (`npx vitest run tests/data/sources/present.test.ts`) could pass without the facts being right, for the C1 reason. Each of these is closed by naming the unit that turns a `Project` and its entities into words, and testing through it.

## Implied inputs

Missing, with a cost:
1. **A deck in a second hub's root.** `source.hubs` owner, server read.ts:94-99. Expected: that hub's vocabulary labels and its registries' names. Item 1 requires it and no case covers it; a wrong answer draws the primary hub's words.
2. **The snapshot build's read of a deck holding `{{project.venue}}`.** data/index.ts:339-356, :472. Expected: the same fill as the route, and no "no value" finding in the Findings view. Not covered.
3. **Opening another deck with the toggle off.** `leftDeck`, present.ts:454-463, spreads `...held` and resets `slide`, `overview` and `filters`. Expected: unstated. My recommendation (a judgment) is that the toggle stays, as a setting of the pane. Not covered.
4. **A filled value holding Markdown or HTML characters,** such as a venue short with `*` or a name with `<`. `spec.md:73` treats it as untrusted; it reaches HTML through the sanitiser (G5), but Markdown would format it. Expected: drawn as its words. Not covered.

Lower cost, not covered:

5. A `reproduced` record with no date (normalise.ts:230-233 gives `{ note }`): expected the yes word "reproduced" (`board.repro_yes`, projects.yml:73).
6. Empty values (`venue: ""`, `year: ""`, `lead: []`): expected no chip, and the placeholder filled with nothing and a finding.
7. `{{project.Venue}}`, with a capital, and a placeholder inside a code block: the count's pattern `[\w-]+` matches both, and its replace runs over the whole text, code blocks included.
8. A toggle change while the kept list is still unknown: `sendKeep` sends nothing while `keep` is undefined.
9. Two projects with one key in the per-project facts map: `spec.md:73` asks for the collision check.

## ADRs

`test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`, so there is no record. The brief says so at its line 5, and nothing contradicts it.

## Dictated text

- "Project facts" (`grep -n '"Project facts"' .scratch/migration/agents/briefs/O148.md`: lines 15, 52): holds.
- ", " as the list join (`grep -n '", "' ...O148.md`: lines 53, 73): holds.
- The sixteen field names `form` ... `tier` (`grep -n 'named `form`' ...O148.md`: line 53): holds.

`LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing. No other words are given for a file.

## Declined to judge

- The plan's goal: plan.md has no `## Goal` section, and I did not read `tools/oculus/DESIGN.md`.
- Overlap with O150, in flight per orchestrator-state.md:27-32: path comparison is the /spec step's job.
- Runtime behaviour (the measure, the wrap, the channel): no tests or servers may run.
- `.agents/worktrees/O148-base/unused-exports.txt`: not yet created (`ls .agents/worktrees | grep 148` prints nothing). It is made after the brief check.

Brief-check usage: a809274987868e1e5, claude-opus-5-5, 235349 tokens, 90 tool uses, 13 min 35 s.

## Closed

Each finding is closed by a change to `briefs/O148.md`:

- Names: the paths the facts and the word rules reach are added to "Paths this step writes": `src/lib/data/index.ts`, `src/lib/data/model/index.ts`, `src/lib/server/edit/writes.ts`, `src/lib/server/sessions/stores/hooks.ts`, `tests/routes/docs/deck.test.ts`, `tests/checks/config/integrity.test.ts`, `card.ts`, `board/items.ts`, `person.ts`, `tones.ts`, and the data-layer file for the facts' function. Every comment the change makes false is listed under item 6.
- Premises: DeckProject's two builders (the server's `deckProject` and the snapshot build's `deckProjects`), the test literals, the model facade, the line numbers, the vocabulary words and the folder counts are corrected under "What is on the tree".
- Item 1: one data-layer function used by both readers, each word rule once, the named shapes, unique keys.
- Item 3: the toggle kept across decks by `leftDeck` (decision 9, case C20).
- Item 4: case-sensitive names, placeholders filled in code blocks, values escaped for Markdown and HTML (decision 10, case C18).
- Item 5: the toggle sent while keep is unknown (case C20).
- C1 to C3: the stage and tier words are the vocabulary labels; C1 is a fixture of the hub's shape, checked by the reader test and the deck route's test.
- C7: checked by reading alone.
- C13: reworded to a pane state with no toggle field, read as on.
- C14: checked through `readDeck` in `tests/routes/docs/deck.test.ts`, with a second hub.
- C15: a venue id the registry lacks.
- Implied inputs: C17 (the snapshot build's read gives no false finding for `{{project.venue}}`), C18 (escaping), C19 (reproduced with no date, empty values, `{{project.Venue}}`), C20 (another deck keeps the toggle; a toggle while keep is unknown).
- Decision 8: one test per unit under G32, the reader's, the deck route's and the snapshot build's; the orchestrator adds the titles to G32 at landing.
- Verify 2 names both test files; verify 3 notes the expected stderr line about `bin`.
