# Step O148 refuter report (on .agents/worktrees/migration-O148, base 2a8e5f6db)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

Every command was run from the worktree root, with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH`. One exception: the base-tree test run used a scratch tree in the reviewer's scratchpad, described below.

```
# Brief verify 1. Before the run, docs/diagrams/* and docs/palette.md were copied to the scratchpad and shasummed, together with `git status --short`.
npm run diagrams ; npm run docs:palette
  (last lines) docs/diagrams/writes.dot / docs/diagrams/writes.svg / > node utils/diagrams/palette.mjs / docs/palette.md
  shasum diff before/after: "diagrams and palette byte-identical"; git status --short diff: "git status unchanged"

npm run test:quick -- --base 2a8e5f6db        (exit 0)
  test:quick: 61 changed file(s), from git since 2a8e5f6db
  test:quick: 340 test file(s)
  tests/checks/config/integrity.test.ts: changed / tests/data/hubs/deck-facts.test.ts: changed / tests/data/sources/present.test.ts: changed / tests/routes/docs/deck.test.ts: changed
  tests/routes/edit/deck-slides.test.ts: imports at depth 1 / tests/server/edit/deck/deck-acts.test.ts: imports at depth 1
  ok      prettier (0.9 s): All matched files use Prettier code style!
  ok      ASCII gate (0.9 s)
  ok      svelte-kit sync (2.3 s)
  ok      eslint (2.6 s)
  ok      svelte-check (9.2 s): 1793926789802 COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (140.4 s): Duration  127.46s (transform 66.44s, setup 0ms, import 136.93s, tests 265.26s, environment 5ms)
  ok      vitest (170.7 s): Duration  159.60s (transform 77.52s, setup 0ms, import 224.25s, tests 388.28s, environment 9.83s)
  ok      vitest slow (264.8 s): Duration  253.63s (transform 20.62s, setup 0ms, import 145.51s, tests 856.69s, environment 19ms)
  test:quick: 267.2 s; every command passed

# Brief verify 2
npx vitest run tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts tests/data/hubs/deck-facts.test.ts --reporter=verbose
  <check mark> |unit| tests/data/sources/present.test.ts > the deck reader > gives each slide the project of the deck whose file holds it, and fills {{project.<field>}} from that project's facts 254ms
  <check mark> |unit| tests/data/hubs/deck-facts.test.ts > the snapshot build's read of the decks > raises for each {{project.<field>}} the finding the deck route raises, and none for a field with a value 1733ms
  <check mark> |unit| tests/routes/docs/deck.test.ts > the deck route > answers each project's facts in the words of the hub its deck is read under, and each slide's domain 1361ms
   Test Files  3 passed (3)
        Tests  12 passed (12)

# First failing run on the unchanged tree. Scratch tree in the scratchpad: src, config and utils of .agents/worktrees/O148-base, tests, package.json, vite.config.ts, tsconfig.json, .npmrc and .svelte-kit of the worktree, node_modules symlinked. The tree was removed after the run.
npx vitest run tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts tests/data/hubs/deck-facts.test.ts
  AssertionError: a project whose venue holds a value: expected 'At {{project.venue}}' to be 'At A*B_<x>' // Object.is equality
  AssertionError: a deck that is no project's, placing a project deck and a summary of it: expected [ { key: 'title.md#0', <ellipsis>(3) }, <ellipsis>(4) ] to deeply equal [ { key: 'title.md#0', <ellipsis>(3) }, <ellipsis>(4) ]
  AssertionError: a portfolio deck placing a deck with every field and a repository project: expected undefined to deeply equal { hccnet: [ { <ellipsis>(3) }, <ellipsis>(11) ], <ellipsis>(1) }
   Test Files  3 failed (3)
        Tests  3 failed | 9 passed (12)
  (the three lines match the report's three lines verbatim; the report's count line "3 failed | 1 passed | 8 skipped (12)" came from another form of the command)

# Brief verify 3
LC_ALL=C perl -ne '<the rules file's ASCII gate>' $(find src tests bin config -type f ! -name local.yml)
  stdout: nothing; stderr: find: bin: No such file or directory; exit 0
the same perl check (no config exemption) over the 58 changed and new files (git diff 2a8e5f6db --name-only --diff-filter=AM plus the six untracked files)
  nothing; exit 0

# Brief verify 4
wc -l (changed files): largest src/lib/data/index.ts 874, src/lib/data/model/index.ts 838, src/lib/data/sources/deck/read.ts 822, src/lib/state/life/present.ts 812; largest component Present.svelte 460 (base 518), parts/project/Project.svelte 264, Presenter.svelte 246
sh utils/folder-check.sh        exit 0
ls -A counts: src/lib/data/shapes 10, present/parts 10, present/parts/project 2, present/screen 5, tests/data/hubs 9, tests/fixtures/hubs 8

# Brief verify 5
sh utils/unused-exports.sh > scratch; diff .agents/worktrees/O148-base/unused-exports.txt scratch
  exit=0, diff=0 (no line)

# Brief verify 6 (grep -rnE over src tests config docs README.md --exclude=local.yml)
  parts/Project\.svelte: no hit
  codeLabel: tones.ts:347 (definition), filter-menu.ts:18,113, CardFacts.svelte:39,112,113
  manifestProject: normalise.ts:266,639, data/index.ts:72,323
  exportKeep: present.svelte.ts:40,277, print/+page.svelte:16,31,100
  screen/box: Present.svelte:40,97
  codeWordKey: 0 hits

# Brief verify 7 (history-word grep over the added lines of src tests config docs/HELP.md and the whole new files)
  514:+// and prints nothing. In a browser tab the print tab opens inside the press, before the lock is
  523:+ * channel, once, with `at` the moment of the press, after `grant`; an ask heard before it is
  (both "before" order two events in time; no history)

# Report evidence rerun
diff -rq .agents/worktrees/O148-base/{src,tests,config} vs the worktree: 45 lines, the same paths as the report's file table (39 differ, 5 only in the worktree, parts/Project.svelte only in the base)
wc -l at base (git show 2a8e5f6db:<path> | wc -l) vs now: Present.svelte 518/460, data/index.ts 862/874, deck/read.ts 709/822, present.ts 771/812, present.test.ts 499/688, deck.test.ts 194/370, present.svelte.ts 742/755 (match the report)
grep -rnE "from ['\"](\$lib/state/|(\.\./)+state/)" src/lib/server src/lib/data       nothing
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Spec 2 (a fourth copy of the venue's short-else-name rule is left in `stats.ts`) and Spec 3 (the snapshot build's findings differ from the deck route's for a reference to another hub's record). Otherwise the shape holds: `project?` on `SlideBase`, `Deck.projects`, one `projectFacts` used by both readers, `DeckSource.entities`, `WriteTarget.entities` and `hooks.ts` `entities()` widened, `deckShape` and the facade carrying the new fields. The deck route test's seven rows and the changed-tree run check it.
- 2: violated, Spec 4 (the strip is sized by `zoom: 1.5` of the UI's tag and chip tokens, which are outside the slide's type scale) and Behaviour 1 (the store's one measure per deck and slide stops being true for the first slide of a project deck). The component, the order, the hues, the glyphs, the hidden-with-room toggle and the surfaces hold by reading `Facts.svelte`, `Slide.svelte` and the seven `<Slide`/`<Framed` call sites.
- 3: holds. Read in `Bar.svelte:82-89`, `Present.svelte:333-337` (`facts={shown?.project === undefined ? null : held.facts}`), `present.ts` `facts: z.boolean().catch(true)` and `held?.facts ?? true`, and `leftDeck` spreading `...held`.
- 4: violated, Behaviour 2 (`{{project.count}}` in a deck with no group `project` raises two findings) and Behaviour 3 (a filled value is drawn with backslashes in a plain-text field). Everything else is checked by the reader test and holds: the fill, front matter, spaces, the fills that leave text as written, findings with file and line, code blocks, and escaping.
- 5: holds. Read in `present.svelte.ts` `sendKeep` and its effect over `[keep, link.facts()]`, `exportKeep`, `acts/export.ts` `answerPrint(..., facts, at)`, `acts.svelte.ts` `facts: reads.facts()`, `show/+page.svelte:166` `facts = message.facts` before the unchanged-keep return, and `print/+page.svelte:100-103`.
- 6: violated, Standards 1 and Standards 2. Head and CSS comments are made false by the change: the Slide foot comment, Stage's "measures the same wherever it is drawn", Present's "carries the strip" and Facts' "18 px". `docs/HELP.md:340-342` holds in content; Standards 8 covers its length.
- 7: holds. `Present.svelte` goes from 518 to 460 lines, with the keys moved whole into `screen/box.ts`; I read it against the removed hunk and the handlers are the same. `parts/Project.svelte` moves to `parts/project/Project.svelte`, and `diff` against the base file shows only its three import paths changed. `parts` stays at 10 and `shapes` is at 10.

Cases of the brief's "Cases":

- C1: met, by `tests/routes/docs/deck.test.ts` row "a portfolio deck placing a deck with every field and a repository project" (the words, keys and the two projects) and `tests/data/sources/present.test.ts` row 1 (the project per slide, the title slide and the deck's own summary carry none). A grid slide is not in either table. The drawing is not verified and goes to the look.
- C2: met, deck route row "a project deck with a few fields". The drawing goes to the look.
- C3: met, rows "a failed project" and "a stopped project".
- C4: met, by reading and the report's changed-tree run (`deck.projects: {}`, `project=(none)`, the control null when `shown?.project === undefined`). The toolbar goes to the look.
- C5: met by reading (the pressed Chip, `write({ facts: !held.facts })`, instance state, the strip hidden with `visibility: hidden`). Not verified on screen; goes to the look.
- C6: met by reading `show/+page.svelte:163-170`. Goes to the look.
- C7: met by reading `answerPrint`, `exportKeep` and the print page.
- C8: met, reader test row 1 (`'Lead Ann Example, Bo, year 2026'`, the venue escaped, and the placed copy in the portfolio deck the same).
- C9: met, reader test rows 1 to 3 (`Venue , {{project.nope}}, {{project.Venue}}.`, the three findings at line 1, `3 and {{project.venue}}` with the project_none finding). Behaviour 2 is a case C9 does not name.
- C10: met, reader test `filled.project` (title, `specs` value, `notes`).
- C11: not verifiable here; the look at 1280 by 720 and 1024 by 768 settles it. Behaviour 4 names a risk the look should cover.
- C12: partial. The measure is the same with the toggle on and off, by reading `Facts.svelte:183-185` and `Stage.svelte:69-71`. A project deck's first slide is measured 0.6em shorter in the pane than on the other surfaces: Behaviour 1.
- C13: met, by reading `presentStateShape` `facts: z.boolean().catch(true)` and `parsePresentState` `held?.facts ?? true`.
- C14: met, deck route rows "a deck in a second hub's root, in that hub's words" (`sent out`, `Dana of Lab`) and the repository project `kit` in row 1.
- C15 (as ruled in round 0): met, row "a person and a venue no registry holds, ..." (`lead` gives `Dr. Dana Example`, `nameless`; no venue) and `deck-facts.test.ts` row "a project whose venue no registry holds".
- C16: met, by reading `deck-files.ts` (only `entities` added), and `tests/routes/edit/deck-slides.test.ts` and `tests/server/edit/deck/deck-acts.test.ts` ran green in the quick list.
- C17: met, `tests/data/hubs/deck-facts.test.ts` (four rows comparing the snapshot build's findings with the route's). Spec 3 is the case C17 does not name.
- C18: met, reader test (`A\\*B\\_\\<x\\>` in Markdown fields, `At A*B_<x>` as the title) and route row 1 (`A*B_<x>`). Behaviour 3 is the plain-text field C18 does not name.
- C19: met, route rows "a person and a venue ..." (Reproduced `reproduced`) and "empty values", and the reader test (`{{project.Venue}}` unknown-name finding).
- C20: met, by reading `leftDeck` and the effect `if (held.ended || keep === undefined || now === said) return;` with `sendKeep` sending both once keep is known.
- C21: met, route test tail (`toContain('hub:graphs')`, no finding naming the domains registry), with `read.ts:271-277` comparing and naming `keyOf(project.domain)`.

## 1. Spec

- 1. Report "Scripts that changed files", against the rules file "What every package obeys", the paragraph on the case-run program and the approval scripts need: "python3 heredoc programs ... perl -pi and perl -0pi ... sed -i '' ... A shell heredoc". What is wrong: files were changed by programs with no approval and no ruling for them. By kind:
  - inline `python3` programs: 38 files. Among them are `config/text/findings.yml`, `config/text/views/academic/present.yml`, `docs/HELP.md`, every changed `src` file except `normalise.ts`, `filter-menu.ts` and `CardFacts.svelte`, and the four test files.
  - `perl -pi` and `perl -0pi`: `src/lib/data/snapshot/normalise.ts`, `src/lib/data/shapes/project-facts.ts`, `src/lib/data/index.ts`.
  - `sed -i ''`: `src/lib/data/model/index.ts`, `src/lib/data/sources/deck/read.ts`, `parts/project/Facts.svelte`, `parts/project/Project.svelte`, `tests/checks/config/integrity.test.ts` and the report.
  - a shell heredoc: `tests/data/hubs/deck-facts.test.ts`.

  My read of what they produced: I read every hunk of the diff except the generated diagrams, all 2919 lines of `git diff 2a8e5f6db` without `docs/diagrams/*.svg` and `writes.dot`, plus every new file whole. Rerunning `npm run diagrams` and `npm run docs:palette` leaves the diagrams byte-identical, so they are the tool's output. The script-made hunks match the brief's items. I found no stray replacement, no truncation and no edit outside the item it serves. `parts/project/Project.svelte` differs from the base file only in its three import paths. None of the defects below traces to a mechanical sweep. Failure scenario: a sweep run without approval could have changed a second occurrence or another file unseen; the read above found none. Verdict: closed in automode under the plan's ruling "Unapproved builder scripts"; the breach is recorded and the builder's list is above.
- 2. `src/lib/state/boards/board/stats.ts:59`: "const short = venue?.short !== undefined && venue.short !== '' ? venue.short : name;". What is wrong: brief item 1 says "Each word rule exists once: ... the venue's short else name". The rule moved to `venueWords` (`project-facts.ts:77-79`) and `items.ts` reads it there, but the board bar's Venue count keeps its own copy. Failure scenario: a later change to the venue rule (say a short of whitespace counts as none) made in `venueWords` changes the card and the strip but not the board's Venue mark, so the same venue reads two ways on one board. Verdict: item 1 violated.
- 3. `src/lib/data/shapes/project-facts.ts:7-10`: "The merged snapshot also orders a project's collaborators and supervisors by its team and resolves a reference to a record of another hub, which the hub's own build does not, so the two give a field the same words up to that order, and raise the same findings for every project whose references its own hub's registries hold." What is wrong: brief item 1 asks that "the findings the Findings view lists from the snapshot build are the ones the deck route's read raises". `registryWords` looks a reference up only in the hub's own registries (`project-facts.ts:195-201`), so the two readers differ for a reference to another hub's record. The difference is stated as a limit, not fixed. Failure scenario: a project in hub A names a funding scheme or a person held in hub B's registry, and its slide writes `{{project.funding}}`. The deck route fills it from the merged snapshot and raises nothing. The snapshot build answers no record, fills nothing and raises "{{project.funding}} holds no value for the project <id>; it is filled with nothing", which the Findings view lists for a slide that draws the words. Whether the hub has such references now is not verified. Verdict: item 1 violated.
- 4. `src/lib/views/academic/present/parts/project/Facts.svelte:166` and `:154`: "zoom: 1.5;" and "--fact-line: 22px;". What is wrong: brief item 2 asks for the strip "in the slide's type scale (`themes/slide.css`), so it scales with the slide". The strip scales the UI tokens instead, `--fs-sm` for a Tag (12 px) and `--fs-xs` for a Chip (11 px), by a constant 1.5. Its chips come out at 16.5 px and its tags at 18 px. Under the rice theme the slide's small type is 17 px (`slide.css:39`) and the strip stays at 1.5 times the tag. The report says this and leaves it unfixed ("a theme that sets another small size still draws the strip at 1.5 times a tag. Not verified at the look"). Failure scenario: under a rice theme, the strip's words are a different size from the slide's small text beside them, and the stage, form and chips chips are smaller than the tags in the same strip. Verdict: item 2 violated.
- 5. `config/text/views/academic/present.yml` `fact_pillars: Pillars`: what is wrong: brief item 2 says "the existing ones reused where the catalog has the field's word". `board.facet_pillar` ("Pillar", `config/text/views/boards/projects.yml:35`) is the field's word, and a second key with the plural was added. The other labels reuse board words, the plural `facet_dataset` "Datasets" among them. Failure scenario: a reader renaming the pillar label in the catalog changes the boards and not the strip. This is minor. Verdict: none on its own.

## 2. Proof

- 1. Report "Open items of the state file, verbatim": "`.scratch/migration/orchestrator-state.md:168-170` holds no entry, only its heading and this paragraph". What is wrong: today the Open items heading is at `orchestrator-state.md:186`, and the section holds open items 689, 690 and 691. Lines 168-170 are in "The pause". The open items may have been booked after the report was written; `git log -p -- .scratch/migration/orchestrator-state.md` would settle it. No decision of this step rests on it. Failure scenario: an orchestrator reading the report's section as the open-items list sees none. Verdict: none.
- 2. Report "For the orchestrator to judge before landing", first bullet, against the rules file's rule that every edit to an existing assertion, allow list or predicate gets a before/after row, one row per changed line. What is wrong: the allow-list line `tests/checks/tree/layer-rows.ts:321` ('data/shapes/project-facts') is described in prose only. The changed fixture lines get no rows at all: `tests/data/sources/present.test.ts:34` `facts: []`, `tests/routes/docs/deck.test.ts:40, 192` `entities: () => null`, and `tests/checks/config/integrity.test.ts:87, 98-99`. On judgment b: the state row of `layer-rows.ts:303-345` lists the data modules the state layer may read, each with its reason above the table, as rules "one rule on both sides" (`data/shapes/boards/**`, `data/shapes/vocab-keys`, `data/shapes/config-save`, `data/helpers/hub-names`). The new entry has its reason paragraph at `:135-140` of the same form, and the design the brief rules needs it, since item 1 has `items.ts`, `person.ts` and `tones.ts` read the word rules from the data layer. It is a line the layering standard admits for a shared words module, not a widened predicate. The views row is unchanged. Failure scenario: a reader checking edits to allow lists against the rules file finds no row and must diff by hand. Verdict: none.
- 3. Report "Verify 2": "`tests/data/hubs/deck-facts.test.ts` (tagged slow, so it runs under `vitest slow`)". What is wrong: the new deck route test is also in a file tagged slow (`tests/routes/docs/deck.test.ts:7`, `// @module-tag slow`), so `npm test` runs neither of the two new data tests. The report does not say so for `deck.test.ts`, against the rules file's rule that a case which can only be a slow test is named. Both files did run in the quick list's `vitest slow`, which passed. Verdict: none.

## 3. Standards

- 1. `src/lib/views/academic/present/Slide.svelte:110-112` and `:121-123`: "Each of its parts holds its own space above it, so the measure that leaves the key hint out leaves its space out with it." with ".keys + .strip { padding-top: 0.6em; }". Also `src/lib/views/academic/present/screen/Stage.svelte:14-15`: "is left out of the measure, so the first slide measures the same wherever it is drawn". What is wrong: the strip's own space is 1.2em alone and 0.6em after the hint, so the space above it depends on the hint. Both sentences are made false by the change, against the rules file's rule that a sentence a change makes false is a defect of the change. Failure scenario: Behaviour 1. Verdict: item 6 violated.
- 2. `src/lib/views/academic/present/Present.svelte:68`: "A slide that comes from a project's deck carries the strip of the project's facts at its foot". Also `parts/project/Facts.svelte:13`: "the slide's small type (18 px, themes/slide.css) over the 12 px a tag is set in". What is wrong: the first sentence is false for a project with no field holding a value (`slideFacts` answers null; `tier` is optional, `model-entities.ts:419`). The report names this and leaves it unfixed. The second is false for chips (11 px base) and for the rice theme (17 px). Failure scenario: a maintainer reading Facts' head comment expects the chips at the slide's small size and sizes a neighbour to match. Verdict: item 6 violated.
- 3. `tests/fixtures/hubs/deck-hub.ts:118-131`: "function put(dir: string, files: Record<string, string>): void { ... writeFileSync(join(dir, path), text);". What is wrong: the rules file ("Where you work") says tests write in a temporary directory "and assert the resolved path is inside it before any write". `put` and `edit` write with no such check, and duplicate `plantFile` (`tests/fixtures/scratch.ts:68-75`), which has the check (principles: reuse what exists). Failure scenario: a later edit of a planted path to one with `../` writes outside the scratch directory unrefused. Today every path is a constant inside `root`. Verdict: none.
- 4. `src/lib/server/content/deck/read.ts:128`: ".filter((project) => rootOf(project) === hub.key)". What is wrong: it repeats the filter of `ofHub` (`hub-names.ts:98-101`), which the base called here. `deckProject` takes `bareId(project)` either way, so nothing needed the inline copy (principles: reuse what exists). Verdict: none.
- 5. `config/text/findings.yml:133`: "project_field_unknown: \"{0} names no field of a project's facts (form, stage, chips, domain, pillars, datasets, lead, supervisors, collaborators, year, venue, funding, compute, code, reproduced, tier); it stays as written\"". What is wrong: the sixteen names are a second copy of `FACT_FIELDS` (`model-deck.ts:303-320`), against the principle that a rule exists once. Failure scenario: a field added to `FACT_FIELDS` leaves the finding's list short, so a reader is told a valid field is not one. Verdict: none.
- 6. `src/lib/state/shared/words/tones.ts:346-349` with the new `import { t } from './text.ts'`. What is wrong: `codeLabel` is a catalog word, while the module's head comment (`:1-26`) says it holds "The config's colours as tones, and the words of each hub's records". The head comment does not describe the function added, against the rules file's head-comment rule. Verdict: none.
- 7. `tests/routes/docs/deck.test.ts:4-6`: "The roots are a temporary directory the case plants a deck in; a folder outside it is planted beside it". What is wrong: the new case reads over the two-hub workspace of `tests/fixtures/hubs/deck-hub.ts`, which the head comment does not mention. Verdict: none.
- 8. `docs/HELP.md:340-342`: the three new bullets are 537, 392 and 685 characters long (`awk length`), against the rules file's "A step writes what a user does into docs/HELP.md as short bullets". The Present bullets around them are 91 to 304. Failure scenario: a user scanning the Present help for the toggle reads a 392-character bullet. Verdict: none.

## 4. Behaviour

- 1. `src/lib/views/academic/present/Slide.svelte:121-123`: ".keys + .strip { padding-top: 0.6em; }", with `Stage.svelte:69-71` subtracting only the `[data-key-hint]` rect. What is wrong: on a project deck's first slide in the pane (`first={at === 0}`), the measure is the content, plus the hint, plus 0.6em, plus the strip, minus the hint. On the presenter screen and the Overview tile (`first={false}`) it is the content, plus 1.2em, plus the strip. The two differ by 0.6em of the slide's body size, about 14 px at 24 px. Brief item 2 says "the store's one measure per deck and slide stays true". The report's C12 before/after does not say this. Failure scenario: a project's own deck whose first slide overflows by 1 to 14 px. The Overview tile measures it Too tall and the Findings view lists "slide too tall"; the pane then measures 0 and the store drops the finding; opening the Overview again brings it back. Reading only, not verified on screen. Verdict: item 2 violated, C12 partial.
- 2. `src/lib/data/sources/deck/read.ts:448-454` (the count's fill returns `whole` with `count_unknown`), then `:464-472` (`if (!isFactField(field)) { raiseHere('project', 'findings.deck.project_field_unknown', whole); ...`). What is wrong: `{{project.count}}` in a deck with no group named `project` is first left as written by the count's fill, with `count_unknown`. The project fill then matches it (`PROJECT` takes `[\w-]+`, so `count` matches) and raises a second finding. Brief item 4 says "`{{project.count}}` is not a field: it stays the count of a group named `project`, as the count's fill gives it". The tests cover only a deck that has the group. Failure scenario: a project's slide writes `{{project.count}}` and its deck defines no `project` group. The Findings view lists "a count of group project, which the deck does not define, stays as written" and also "{{project.count}} names no field of a project's facts (...)", which tells the reader `count` should be a fact field. In a deck that is no project's, the second finding is instead "is in a deck that is no project's". Verdict: item 4 violated.
- 3. `src/lib/data/sources/deck/read.ts:172-176`: "return key === 'notes' ? value.replace(PROJECT, ...) : filledMarkdown(value, fill);". What is wrong: every front matter key except `notes` gets the Markdown escape, but `tag.text` is drawn as plain text (`parts/project/Project.svelte:49`, `<Tag label={slide.tag.text} ...>`). Inside a literal region (`LITERAL`, `:137`) a value is put in unescaped, so a value holding a backtick or `$` ends the code span or the formula. Brief item 4 asks that "a filled value is written so the slide draws its words as they are". Failure scenario: a project slide with `tag: { text: "{{project.venue}}" }` and the venue short `A*B_<x>` draws the tag as `A\*B\_\<x\>`. With `` `{{project.venue}}` `` in the body and a short holding a backtick, the code span closes early. Not tested. Verdict: item 4 violated.
- 4. `src/lib/views/academic/present/parts/project/Facts.svelte:154, 161, 174`: "--fact-line: 22px;", "max-height: calc(2 * var(--fact-line) + var(--fact-gap));", "height: var(--fact-line);". What is wrong: the line box is a fixed 22 px, but a Chip's minimum height is `calc(18px * var(--text-scale, 1))` (`Chip.svelte:144`) and the text-size setting goes from 0.7 to 1.6 (`config/options/appearance.yml`, `text_size`). From a text size of 1.3 a chip (23.4 px) is taller than its line box, and at 1.6 it is 28.8 px against 22. The report's C11 before/after does not name the text size. Failure scenario: with Text size 1.6, the stage, form and chips chips overflow their 22 px rows and the two-line `max-height` cuts the second row's chips at the bottom. Reading only; goes to the look at C11. Verdict: none on its own (C11 not verifiable here).
- 5. `src/lib/data/sources/deck/read.ts:271-279` (`keyOf(project.domain)`) with `src/lib/server/content/deck/read.ts:76-77` (`one.domain = domain`). What is wrong: this is the round-0 domain fix (C21), and it changes what a reader sees. On the deck route, every project slide of a project with a domain now draws its Domain tag and the domain-coloured left edge (`parts/project/Project.svelte:39-44`), and the `domain_unknown` findings are gone. The report's "Changes outside the strip that a user sees" and "The look, before and after" list neither. Failure scenario: the look is taken from the report and does not check the project slides' domain tag and edge, so a wrong hue there goes unseen. Verdict: none.
- The other visible changes, by reading: the card's code label and the filter menu's code words are the same four catalog keys, now read through `codeWords` (`project-facts.ts:91-96`). The legend's labels come from `vocabWords(row, key)`, which gives the same result as the base's `held.label ?? key` for a string, an empty string and a non-string label (`str` in `guards.ts:30-32`). Neither changes on screen. The pillar shown by its key for an empty `title` is in the report.

## Declined to judge

- How many times the builder ran `npm run test:quick` (the report says two), the order of its fixes, and the removal of `cases.ts` and the builder's scratch tree: these are only in the builder's transcript and scratchpad, which the reviewer did not read.
- The report's `git status --short docs`, `git diff --name-only --diff-filter=AM` and `git ls-files --others --exclude-standard`: `ls-files` and `diff --name-only` are git commands outside the three allowed. I used `git status --short`, `git diff 2a8e5f6db` and `diff -rq` against the base copy instead, and they agree with the report's file table.
- Whether open items 689 to 691 were booked after the report was written (Proof 1): `git log -p -- .scratch/migration/orchestrator-state.md` would settle it.
- Whether the hub has projects that reference another hub's records (Spec 3): a read of the workspace's hubs would settle it; this review did not read the real hub.
- Every drawn result: the strip's look on each surface, the hues and glyphs, the wrap and the ellipsis (C11), the toggle (C5, C6), the PDF (C7), Behaviour 1 and Behaviour 4 on screen. Not verified; they go to the look. No server, browser or desktop app was started and no focus was taken.
- The report's case program `cases.ts` was not rerun. Its base-run domain lines are backed by the new route test failing on the base tree. Its changed-tree output matches what the new tests assert.

Reviewer usage: af92be5dae006c1f1, claude-opus-5-5, 329919 tokens, 94 tool uses, 19 min 4 s.

