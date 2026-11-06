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


## Repair round 1, refuted

```
# Brief verify 1, from the worktree root, PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH.
# docs/diagrams and docs/palette.md were copied to the scratchpad first, and git status --short was saved.
npm run diagrams ; npm run docs:palette
  diagrams exit 0 / palette exit 0
  (last lines) docs/diagrams/channels.svg / docs/diagrams/writes.dot / docs/diagrams/writes.svg / > node utils/diagrams/palette.mjs / docs/palette.md
  diff -r and cmp against the copies: "diagrams and palette byte-identical"; git status --short: "git status unchanged"

npm run test:quick -- --base 2a8e5f6db        (exit 1)
  test:quick: 70 changed file(s), from git since 2a8e5f6db
  test:quick: 340 test file(s)
  ok      prettier (1.1 s): All matched files use Prettier code style!
  ok      ASCII gate (1.1 s)
  ok      svelte-kit sync (2.4 s)
  ok      eslint (2.6 s)
  ok      svelte-check (9.9 s): 1793932579205 COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (126.8 s): Duration  113.88s (transform 44.86s, setup 0ms, import 117.20s, tests 313.07s, environment 4ms)
  FAILED  vitest (175.1 s)
  ok      vitest slow (270.1 s): Duration  257.97s (transform 21.85s, setup 0ms, import 147.74s, tests 871.13s, environment 18ms)
  test:quick: 272.5 s; failed: vitest
  the one failure:
   FAIL  |unit| tests/state/sessions/source/source.test.ts > a source tab over a file that changes on disk > 'takes the new text into a clean tab, <ellipsis>'
  AssertionError: expected { Object (readIn, text, ...) } to match object { text: 'one\ntwo\n', <ellipsis>(3) }
   Test Files  1 failed | 248 passed | 75 skipped (324)
        Tests  1 failed | 3517 passed | 858 skipped (4376)
  (source.test.ts is not changed by the step and is reached at import depth 2. By the rules file, section "Verify before you report", it is not the step's and was not rerun.)

# Brief verify 2
npx vitest run tests/data/sources/present.test.ts tests/routes/docs/deck.test.ts tests/data/hubs/deck-facts.test.ts --reporter=verbose    (exit 0)
   <check mark> |unit| tests/data/sources/present.test.ts > the deck reader > gives each slide the project of the deck whose file holds it, and fills {{project.<field>}} from that project's facts 234ms
   <check mark> |unit| tests/data/hubs/deck-facts.test.ts > the snapshot build's read of the decks > raises for each {{project.<field>}} the finding the deck route raises, and none for a field with a value 1569ms
   <check mark> |unit| tests/routes/docs/deck.test.ts > the deck route > answers each project's facts in the words of the hub its deck is read under, and each slide's domain 1382ms
   Test Files  3 passed (3)
        Tests  12 passed (12)

# Brief verify 3
LC_ALL=C perl -ne '<the rules file's ASCII gate>' $(find src tests bin config -type f ! -name local.yml)
  stdout: nothing; stderr: find: bin: No such file or directory; gate exit 0
the same perl check, with no config allowance, over the 69 changed and new files of git status --short (directories expanded, .svg included)
  nothing printed

# Brief verify 4
wc -l over changed src/tests/config files: largest src/lib/data/sources/deck/read.ts 847, src/lib/data/model/index.ts 838, src/lib/data/index.ts 828, src/lib/state/life/present.ts 812; largest component Present.svelte 461, show/+page.svelte 314, Chip.svelte 286
sh utils/folder-check.sh        folder-check exit 0
ls -A counts: data/sources/documents 5, data/snapshot/hubs 5, data/shapes 10, present/parts 10, present/parts/project 2, present/screen 5, tests/data/hubs 9, tests/fixtures/hubs 8

# Brief verify 5
sh utils/unused-exports.sh > scratch (exit 0); diff .agents/worktrees/O148-base/unused-exports.txt scratch    diff exit 0, no line

# Brief verify 6 (grep -rnE over src tests config docs README.md --exclude=local.yml)
  registryWords: no hit / parts/Project\.svelte: no hit / data/index.ts `decks: no hit / index.ts `deckProjects: no hit / fact-line: no hit / keys \+ \.strip: no hit
  readHub: only local functions (schedules.ts:132,154,213; integrity.test.ts:65,276,280; present.test.ts:174,190)
  zoom: only src/desktop/decide/window-*.ts (window zoom, another name)
  readHubBeforeDecks / withDecks: build.ts:18-19,127,146,152,163, deck-facts.ts:2, hub-build.ts:3,10-11,34, reference-hub.ts:12-13,337 (integrity.test.ts:231-251 is a local array of that name)

# Brief verify 7 (history words over every added line of src tests config docs/HELP.md and every line of the new files, restricted to comments and test titles)
  633:+// and prints nothing. In a browser tab the print tab opens inside the press, before the lock is
  642:+ * channel, once, with `at` the moment of the press, after `grant`; an ask heard before it is
  (both order two events of one press in time; no history)

# Report evidence rerun
grep -n ofHub src/lib/server/content/deck/read.ts        33 (import), 60 (doc), 128: projects: ofHub(source.projects, hub.key).map((project) => deckProject(project, words)),
grep -n project_field_unknown config/text/findings.yml   133: project_field_unknown: "{0} names no field of a project's facts ({1}); it stays as written"
grep -n "FACT_FIELDS.join" deck/read.ts                  495 (the report says 493; no decision rests on it)
grep -n codeLabel tones.ts                               26 (head comment), 351 (definition)
grep -n plantFile tests/fixtures/hubs/deck-hub.ts        13, 24, 131, 138
grep -n module-tag (three test files)                    deck.test.ts:10 and deck-facts.test.ts:6 slow; present.test.ts untagged
sed -n 55,62p stats.ts                                   const short = venueWords(venue?.short, name);
grep -rn zoom src/lib/views/academic/present             exit 1, nothing
awk length HELP.md 340-348                               175 256 157 203 202 223 191 215 151 (the report: 151 to 256)
open items 689, 690, 691 of the report vs grep of the main checkout's orchestrator-state.md   "689 same", "690 same", "691 same"
diff <the report's quoted cases.ts> scratchpad/o148-cases/cases.ts       "quoted program equals cases.ts"
node cases.ts <worktree> (from scratchpad/o148-cases)    exit 0, 65 lines; diff with the report's changed-tree run, leading spaces stripped: no difference; the folder holds cases.ts alone after the run
transcript sample (python3 -I, print only, over agent-ad2be83c04b20cac7.jsonl): rows 458, 496, 515, 533, 568, 622, 684, 687, 715, 780, 829, 849, 1496: each row holds one Bash tool_use whose length equals the table's (668, 229, 1453, 4038, 3564, 4386, 508, 600, 3311, 842, 4402, 603, 319) and whose write targets equal the table's files
transcript scan for write-capable commands between the cases ruling (row 409) and repair round 1 (row 1529): every unnamed match (665, 669, 676, 871, 1131, 1139, 1167, 1174, 1208, 1450, 1464, 1479, 1483, 1500, 1504, 1508, 1512) is a read (sed -n, awk, 2>/dev/null, a print-only program); none changed a file
```

### Verdicts

The rulings of round 1:

- 1, scripts: not closed. The report names each of the 61 commands by its transcript row, with length, kind and files, and does not quote them. The sample of 13 rows above matches the table in every row, both the command and its files, and the scan of rows 409 to 1529 found no file-changing command left off the list. The ruling asks for each command "quoted whole as it ran", and it allows naming instead only for "A command you can no longer quote whole". The builder can quote every one of them, since the report says the text "is whole at each row". The rows give the orchestrator a way to read each hunk under the plan's ruling "Unapproved builder scripts", but the shape the ruling asks for is not met (Spec 1). The report's NOT DONE row "Approval of the first build's script edits" names something that is not the builder's to obtain. That ruling closes the breach in automode and calls approval after the fact the lazy option.
- 2, stats.ts: closed (`stats.ts:60` reads `venueWords`). The same rule is still held a fifth time in `focus.ts` `venueLabel` (Spec 2).
- 3, cross-hub references in the snapshot build: partial. For the facts and `{{project.<field>}}` it is closed. `hubFacts` (`snapshot/hubs/deck-facts.ts:53-122`) builds holders over its own hub and the others, resolves every reference with `resolvedId` (`hub-names.ts:544`, the `resolveKey` merge.ts uses), drops what resolves to none (as `idsOf` does), runs `linked` for order and repeats, and names each id by the record of the hub that holds it. Since `factRecords` shares `hubRecords` with `normalise`, the record sets equal the hub snapshots' entities that merge.ts builds its holders from. The new row is red without cross-hub resolution, by reading. The deck read's domain check is still done against the raw manifest key in its own hub alone, so the two readers' `domain_unknown` findings differ (Behaviour 1). The restructuring: the deck read leaves `data/index.ts` because that file would pass 880 lines and the snapshot layer may not import sources (the report's reason), and `readHub` gives way to `readHubBeforeDecks` plus `withDecks`. Read against the base, these change nothing else. Findings order is unchanged: the deck findings come last in `raw.findings` on both, and `builtHub` sorts. A single-hub build (`hub-build.ts`, `reference-hub.ts`) gets `others = []`, the base's own-hub reading. A folder workspace with no primary reads no decks for its folder projects (`readFolders` holds `decks: {}` on both) and reads its other hubs' decks with each other's records. The YAML server's inputs are unchanged: `buildReferences` takes `raw.decks`, which is set before `builtHub` on both, and `hubLists` runs after `withDecks`. The `one === hubs[0]` checks hold, since `hubs` is the array `withDecks` returns. The layer rules hold: "vitest checks" passed, boundaries.test.ts among them. Sizes hold (index.ts 828, read.ts 847, normalise.ts 718). `build.ts`'s rewrapped doc leaves a short line (Standards 1).
- 4, the type scale: closed by reading. With the hooks unset, `--chip-px` is `calc(11px * var(--text-scale, 1)) / 11`, which is 1px times the scale. That gives `min-height` 18px*s, `line-height` 11px*s, label line height 15px*s, and margins -3px*s and -2px*s, the base's literals in every case, and `font-size` falls back to `--fs-xs`. A theme whose `--fs-xs` is 10px (`themes.css:59`) also gets the base's values, because the fallback is the base's literal 11px and not `--fs-xs`. `Tag` falls back to `--fs-sm`. No other file sets `--chip-text` or `--tag-text` (grep). `--glyph-size` is a real hook: `Glyph.svelte:64,72,73` read it, and Chip and Tag draw their glyphs through `Glyph`. On the clamp, my judgment is that Chromium's `-webkit-line-clamp` on a `-webkit-box` counts the line boxes of block descendants in the same formatting context, so a plain block `ul` of inline-flex `li` boxes is clamped after its second line box, and atomic boxes are never cut. The drawing goes to the look (Behaviour 2).
- 5, the space above the strip: closed by reading. `.keys` has `margin: 0`, and its `padding-top: 1.2em` sits inside its box. `Stage.svelte:73-75` subtracts the hint's bounding rect. `.strip` has `padding-top: 1.2em` whatever comes before it. So on every surface the measure is the content plus the strip box, both when it fits (the `min-height: 100%` column) and when it overflows. Stage's comment is true. One clause of Slide's CSS comment is false (Standards 2).
- 6, `{{project.count}}`: closed. `words` returns null for `count` (`deck/read.ts:481-484`). The count's fill runs first and writes every count it can, so a placeholder that reaches the project fill is one it left. The two new rows expect one finding each, which fails with a second finding, by reading.
- 7, plain-text keys: closed by reading. I read every component that draws a slide: Title, Section, Grid (idea card name and desc), Summary, `parts/project/Project.svelte`, Panel, Equation and the presenter's notes. `kicker`, `contact`, `foot`, `desc`, `title`, `sub`, `hook`, `eli5.*`, `specs.*`, `method`, `results`, `caption` and `explain` are drawn through `Words` as Markdown, and `mechanism` and `headline` go through Summary's `Words`. The keys drawn as plain text are `notes` (`Presenter.svelte`), `tag.text` (`Project.svelte:49`) and `panels.figure` (`Panel.svelte:34`, and as the lookup name), so the list is complete. `equation` goes to KaTeX (`Equation.svelte:48`) unescaped, which matches how a formula inside Markdown is treated (`LITERAL`); a Markdown escape there would put `\*` and `\<` into TeX. The round sent no change for TeX's own special characters. `panels.diagram_html` goes through `escapeAttribute` (`& < > "`) before `sanitiseDiagram`, so the words draw as text. The alpha row checks all four values.
- 8: closed (`Present.svelte:68-72`; the Facts head and CSS comments state the sizes).
- 9: closed (`put` and `edit` call `plantFile`, `deck-hub.ts:131,138`). Its head comment overclaims (Standards 3).
- 10: closed. `ofHub` (`hub-names.ts:98-101`) maps each record to `id: bareId(record)`, so `id: project.id` gives the same bare key the base's `bareId(project)` gave, and the slide's `project` and the `deck.projects` keys are unchanged.
- 11: closed (`({1})` filled from `FACT_FIELDS.join(', ')`).
- 12: closed (`tones.ts:26`; `deck.test.ts:6-9`). One construction in the new tones sentence is noted under Standards 4.
- 13: closed (nine bullets, 151 to 256 characters, every fact kept by reading the diff).
- 14: closed. The domain before and after is stated. The open items equal the main checkout's state file. The before/after table is given. The slow tags are stated (`package.json` `"test"` is `--tagsFilter '!slow'`).

The new tests (the failing lines the report quotes before each fix were not rerun, since that needs the fix taken out; each test is judged by reading). Without its fix, the ruling 3 row would get two `project_field_empty` findings and the title "At " where it expects [] and "At Lab J". The two ruling 6 rows would each get one finding more than the one they expect. The alpha row of ruling 7 would get backslash-escaped `tag`, `equation`, `figure` and `diagram` values where it expects the exact unescaped and HTML-escaped strings. So each would fail with its behaviour taken out.

Items of the brief's "What to build", over the whole diff since the base:

- 1: violated, Spec 2 (a fifth copy of the venue's short-else-name rule) and Behaviour 1 (the two readers' domain findings differ). The rest holds: `project?` and `Deck.projects`, one `projectFacts` used by both readers, the cross-hub fill, the widened `entities`, `deckShape` and the facade.
- 2: holds by reading, Facts, Slide and the Chip and Tag hooks. Drawing goes to the look.
- 3: holds (`Bar.svelte`, `Present.svelte` passing `null` while `shown?.project === undefined`, `facts: z.boolean().catch(true)`, `leftDeck` spreading `...held`).
- 4: holds (rulings 6 and 7 closed; reader test rows).
- 5: holds by reading (`sendKeep`, `exportKeep`, `answerPrint`, both routes).
- 6: violated, Standards 1, 2 and 3: a comment left unwrapped, a false clause in Slide's CSS comment, and a false sentence in the fixture's head comment. `docs/HELP.md:340-348` holds.
- 7: holds (Present.svelte 518 to 461 lines; `parts/project/` holds the moved file and Facts; `parts` stays at 10).

Cases:

- C1: met, deck.test.ts row "a portfolio deck placing a deck with every field and a repository project" and the present.test.ts rows. The case program's rerun matches the report. Drawing goes to the look.
- C2: met, row "a project deck with a few fields". The look.
- C3: met, rows "a failed project" and "a stopped project".
- C4: met, by reading and the case rerun (`deck.projects: {}`, `project=(none)`). The look.
- C5: met by reading. The look.
- C6: met by reading (`show/+page.svelte` sets `facts = message.facts` before the unchanged-keep return). The look.
- C7: met by reading.
- C8: met, reader test.
- C9: met, reader test, plus the two `{{project.count}}` rows.
- C10: met, reader test (`title`, `specs` value, `notes`, now with `tag.text`, `equation` and `panels`).
- C11: not verifiable here. Ruling 4 removes the fixed line box. The look at 1280 by 720 and 1024 by 768, at text sizes 0.7, 1.0 and 1.6, settles it. The report's look line for it is partly wrong (Proof 1).
- C12: met by reading (ruling 5). The look.
- C13: met by reading.
- C14: met, row "a deck in a second hub's root, in that hub's words".
- C15 (as ruled): met, the route row and the deck-facts row.
- C16: met. `tests/routes/edit/deck-slides.test.ts` ran green in my quick run, at import depth 1. `deck-files.ts` only adds `entities`.
- C17: met, deck-facts.test.ts with its cross-hub row.
- C18: met, reader test.
- C19: met, route and reader rows.
- C20: met by reading.
- C21: met for a domain the deck's own hub holds (route row: `hub:graphs`, no finding). A domain held only by another hub is Behaviour 1.

### Findings

Spec

- 1. Report, "Scripts that changed files, every command": "Their text is not quoted in this report; it is whole at each row". What is wrong: ruling 1 asks for each command "quoted whole as it ran ... A command you can no longer quote whole is named as such". The builder can still quote every command, so naming by row is the exception used where it does not apply. The rows and files are accurate in all 13 sampled rows. Failure scenario: the orchestrator reading the hunks under "Unapproved builder scripts" must open a 3009-line transcript and find each row by its index, where the ruling meant the report alone to carry the text. Verdict: ruling 1 not closed. The breach itself is closed in automode by the plan's ruling, so this is a report fix for landing.
- 2. `src/lib/state/boards/focus.ts:574-578`: "export function venueLabel(venue: Venue | undefined): string { ... const short = venue.short ?? ''; return short === '' ? venue.name : short;". What is wrong: brief item 1 says "Each word rule exists once: ... the venue's short else name". After ruling 2, `items.ts` and `stats.ts` read `venueWords` (`project-facts.ts:70-72`), and `venueLabel` keeps its own copy, read by `focus.ts:640,703` and `ticker.ts:273,391,399,607`. `views/sources/venues/Ribbon.svelte:32` holds a variant (`venue.short ?? venue.name`, which draws an empty short as empty). Failure scenario: a change to the rule in `venueWords` (say, a short of only spaces counts as none) changes the card, the strip and the board's Venue mark, while the Focus lanes and the ticker draw the same venue the old way. Verdict: item 1 violated.

Proof

- 1. Report, "The look, before and after", C11: "On the deck's first slide, where the key hint is drawn, the gap between the slide's content and the strip is the same as on the other slides." What is wrong: on the first slide in the pane the key hint (`Slide.svelte:89-91`) sits between the content and the strip, so the gap from content to strip is larger there by the hint's box. What ruling 5 made equal is the strip's own space above it (`.strip { padding-top: 1.2em }`) and hence the measure. Failure scenario: the look compares the content-to-strip gap on the first slide with the gap on the second, finds them different, and records a defect that is not one. Or it accepts a different layout as if it were the one described. Verdict: none (C11 goes to the look).

Standards

- 1. `src/lib/server/root/watch/build.ts:131`: " * in the others. The project folders of a workspace" (52 columns), followed by " * with no primary are built together ...". What is wrong: the rules file, "What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short." The report names the short line in Verify 8 and leaves it. Failure scenario: a reader sees a broken paragraph and the next edit of the doc keeps the break. Verdict: item 6 violated.
- 2. `src/lib/views/academic/present/Slide.svelte:111-114`: "Each of its parts holds its own space above it, the same space whether the other is drawn or not, so the measure that leaves the key hint out leaves its space out with it, and the strip stands as far below the content on a deck's first slide in the pane as on every other surface." What is wrong: the last clause is false. On the first slide in the pane the strip stands below the key hint, so it is farther below the content by the hint's box. What holds is that its own space above it, and the measure, are the same. The rules file says a comment sentence the change makes false is a defect of the change. Failure scenario: a maintainer reads the comment, sees the strip lower on the first slide, and "fixes" the layout or the measure to match it. Verdict: item 6 violated.
- 3. `tests/fixtures/hubs/deck-hub.ts:13`: "Every file is planted in a temporary directory through `plantFile`." What is wrong: the two demo hub copies are made with `cpSync(DEMO, hub, { recursive: true })` and `cpSync(DEMO, lab, ...)` (`:160-161`), not through `plantFile`. Their destinations are joins of `scratchDir`, so no write leaves the scratch directory, but the sentence is false. Failure scenario: a reader trusts the comment and adds another `cpSync` to a computed path, believing every write is checked. Verdict: item 6 violated (minor).
- 4. `src/lib/state/shared/words/tones.ts:26`: "One word here is the catalog's rather than a hub's". What is wrong: the rules file's prose rule bans the "not X but Y" contrast and asks for the thing to be stated directly ("One word here is the catalog's: `codeLabel` ..."). Failure scenario: none of substance; it is a prose tell. Verdict: none.
- 5. Report, "Verify 1": "In round 1 `test:quick` ran three times to completion ... The third, above, ran with nothing beside it, on the same tree as the second, and passed." What is wrong: the rules file, "Token discipline": "A red line in a file the step does not change is rerun alone and named with that run in the report, and the list is not run again for it" and "a run of the list beyond what this paragraph allows, is a finding of the review". The second run's only red was `editor-saved.test.ts`, which the step does not change, so the third run was not allowed. The second run itself was allowed, since the first run's comment-width reds were in the step's files. Failure scenario: three full lists of about 270 to 385 s each, where two were allowed. Verdict: none.

Behaviour

- 1. `src/lib/data/sources/documents/decks.ts:61-62` and `:83`: "const domain = str(manifest.domain); if (domain !== undefined && domain !== '') project.domain = domain;" with "domains: read.raw.registries.domains.entries.map((entry) => entry.key)". Against these, `src/lib/server/content/deck/read.ts:77-78` ("const domain = project.domainIds.at(0); if (domain !== undefined) one.domain = domain;") with `:129` (`Object.keys(hubDomainsOf(hub.dir, config))`), and the shared check at `src/lib/data/sources/deck/read.ts:283`. What is wrong: brief item 1 asks that "the findings the Findings view lists from the snapshot build are the ones the deck route's read raises", and ruling 3 asks for that "for every project, a cross-hub reference included". The snapshot build checks the raw manifest key against its own hub's registry. The route checks the merge-resolved id, whose key it also compares with its own hub's registry. Two scenarios follow, by reading (not run):
  - A project names a domain no hub holds. The merge drops it, so the route sets no domain and raises nothing, while the snapshot build raises `domain_unknown`, which the Findings view lists. The findings differ.
  - A project names a domain only a second hub holds. The merge resolves it to `lab:x`, and the strip's Domain fact names it by that hub's title through `hubFacts` and the route's `projectFacts`. Both readers still raise `domain_unknown` and drop the slide's `domain`, so the project slide draws no Domain tag and no coloured edge while its strip shows a Domain chip, and the Findings view lists a false finding.

  The report's "Changes outside the strip that a user sees" and C21 do not name either case. Failure scenario: a workspace whose hubs share the domains registry of one of them (a lab hub naming the primary's domains) shows a project slide with a Domain chip in its strip, no Domain tag at its top, and a "names the domain ..., which is no key of the domains registry" finding. Verdict: item 1 violated, ruling 3 partial.
- 2. `src/lib/views/academic/present/parts/project/Facts.svelte:164-168`: "display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2;". What is wrong: by my reading, when the strip is cut at its second line, Chromium's line clamp draws its own ellipsis mark at the end of the second line and hides any box it would overlap. The brief asks for "a third line is not drawn, and a chip's words longer than its room end in an ellipsis". A strip-level ellipsis, with the last fitting chip possibly hidden, is a visible result the report's look section does not name. Failure scenario: at text size 1.6 a strip with every field (C11) shows a lone ellipsis after the last chip of line two, or loses that chip. Not verified; it goes to the look at C11. Verdict: none (C11 not verifiable here).

### Declined to judge

- The failing lines the report quotes before each round-1 fix (rulings 3, 6 and 7). Reproducing them needs the fixed code taken out, which the rules forbid. Each test was judged by reading instead (Verdicts, "The new tests").
- The report's `git show db36b0315:.scratch/migration/orchestrator-state.md`, `git diff --name-only --diff-filter=AM` and `git ls-files --others --exclude-standard`: these are git commands outside the three allowed. The open items were compared with the main checkout's state file by grep ("689 same", "690 same", "691 same"), and the changed files were enumerated with `git status --short`. `git show db36b0315:.scratch/migration/orchestrator-state.md` would settle the first.
- Transcript rows of ruling 1 beyond the sample of 13. The scan for unnamed file-changing commands used a pattern over the command text and read each unnamed match. A row-by-row read of all 61 would settle the rest.
- `tests/state/sessions/source/source.test.ts`, red in my quick run ("takes the new text into a clean tab, <ellipsis>") and in the builder's first round-1 run with another of its tests. The step does not change it, and the rules file says nobody reruns or investigates such a failure. The orchestrator's gate run, with the file alone as the second measurement, would settle whether the step's change reaches it.
- Whether the hub has projects whose domain, venue or person is held only by another hub of the workspace (Behaviour 1's reach). A read of the workspace's registries would settle it; this review did not read the real hub.
- Every drawn result: the strip on each surface, its hues and glyphs, the one size of chips and tags at each text size, the two-line clamp and its ellipsis (C11, Behaviour 2), the toggle (C5, C6), the PDF (C7), the first slide's layout (Proof 1), and the project slide's Domain tag and edge. Not verified; these go to the look. No server, browser or desktop app was started and no focus was taken.

Reviewer usage: a5b82726f9c5c5a8f, claude-opus-5-5, 330425 tokens, 96 tool uses, 21 min 5 s.

## Closed

The first run's findings went to the builder in repair round 1 (`agents/briefs/O148-round-1.md`, rulings 1 to 14; Spec 5 and Proof 2's judgment b closed there, not sent). The findings of the run over round 1, at landing:

- Spec 1 (the commands not quoted): fixed at landing. `agents/reviews/O148-scripts.md` quotes each of the 61 commands whole from its transcript row, each the length the report's table gives; the report's first line and its two rows say so. The breach is recorded under plan.md's ruling "Unapproved builder scripts", and the hunks were read in the reviews and by the orchestrator.
- Spec 2 (a fifth copy of the venue rule): fixed at landing. `src/lib/state/boards/focus.ts` `venueLabel` reads `venueWords`, and `src/lib/views/sources/venues/Ribbon.svelte` draws a venue by `venueLabel`, so an empty short name draws the name there too.
- Proof 1 (the report's look sentence for C11): fixed at landing in the report.
- Standards 1 (`build.ts:131`): fixed at landing, the paragraph rewrapped at 100 columns.
- Standards 2 (`Slide.svelte:111-114`): fixed at landing, the false clause replaced by what holds.
- Standards 3 (`deck-hub.ts:13`): fixed at landing, the sentence says the two hubs are copies of the demo hub and the planted and edited files go through `plantFile`.
- Standards 4 (`tones.ts:26`): fixed at landing, the contrast removed.
- Standards 5 (a third run of the list): recorded; nothing to change.
- Behaviour 1 (the two readers' domain check): raised as open item 692.
- Behaviour 2 (the line clamp's ellipsis): to the look at landing.

