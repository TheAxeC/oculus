# Step D73 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D73, base 233a2e2d0)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, unless a scratch copy is named. My scratch folder is `$TMPDIR/d73-review/`. It holds `hubA` (the worktree's hub data with the base copy `D73-base` as `tools/oculus`), `hubB` (the same hub data with the worktree's `tools/oculus` and the Doc text applied: `.oculus/config.yml` plus four registries), and `probes/`.

```
npm run lint
  > eslint .            (no error lines; exit 0)

npm run format:check
  All matched files use Prettier code style!   (exit 0)

npm run check
  COMPLETED 4031 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS   (exit 0)

npm run test:checks   (worktree; it has no .oculus/ folder)
  FAIL |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
  Error: expected any number of assertion, but got none
  FAIL |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings
  AssertionError: expected [ Array(218) ] to deeply equal []
  Test Files  2 failed | 17 passed (19)
  Tests  2 failed | 292 passed (294)
  The 218 findings by kind (grep of "message" in the output):
    160 "entries[N].themes[N] is W, which is not a key of vocab.venue_themes"
     55 "datasets[N].themes[N] is W, which is not a key of vocab.data_themes"
      1 "the field themes takes its keys from vocab.venue_themes, which is no registry, projects or vocab list"
      1 "the field themes takes its keys from vocab.data_themes, which is no registry, projects or vocab list"
      1 "collection file does not exist"   (registries/literature.yml)

Same two files on the BASE copy, also without .oculus/ ($TMPDIR/d73-review/hubA):
  npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts --testTimeout 0 --hookTimeout 0
  config-folder: Error: expected any number of assertion, but got none
  integrity: AssertionError: expected [ Array(240) ] to deeply equal []
  Test Files  2 failed (2)
  Tests  2 failed | 30 passed (32)

npm run test:checks on $TMPDIR/d73-review/hubB (Doc text applied)
  Test Files  19 passed (19)
  Tests  294 passed (294)
  The same two files again, with the builder's byte-exact venues.yml and data.yml from $TMPDIR/d73/doctext:
  Test Files  2 passed (2)
  Tests  32 passed (32)

ASCII gate:
  LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)
  (no output, exit 0; bin/ does not exist: "ls: bin: No such file or directory")
  LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md docs/apps.md docs/templates.md docs/palette.md .prettierignore utils/migrations/convert-decks.mjs ../../docs/DATA-MAP.md
  (no output)

sh utils/folder-check.sh   -> no output, exit 0
sh utils/size-check.sh     -> no output, exit 0

sh utils/unused-exports.sh > $TMPDIR/d73-review/unused.txt; diff D73-base/unused-exports.txt $TMPDIR/d73-review/unused.txt
  50c50
  < src/lib/server/edit/feeds.ts: feedFile, linkedinFrontMatter
  ---
  > src/lib/server/edit/feeds/feeds.ts: feedFile, linkedinFrontMatter

npm run diagrams; npm run docs:palette   (in $TMPDIR/d73-review/hubB/tools/oculus, a copy of the worktree)
  diff -r docs/diagrams <worktree>/docs/diagrams   -> exit 0
  diff docs/palette.md <worktree>/docs/palette.md  -> exit 0
  docs/palette.md opens: "# The palette" / first paragraph / "## Contents" / "[TOC]" / "---"

Verify 4:
  grep -rnw "data_domains\|venue_themes\|data_themes\|leads_file\|radar_file" src config docs HELP.md DESIGN.md --exclude=local.yml
  src/lib/state/shared/words/themes.ts:2, :50, :53
  src/lib/data/index.ts:643, :669, :670
  src/lib/data/model/index.ts:289, :294, :295
  src/lib/views/sources/venues/Venues.svelte:64
  src/lib/views/sources/data/Data.svelte:61
  docs/apps.md:395
  (12 lines; every hit is the hubs.lists payload key that item 12 / Z881 keeps)
  grep -rn "vocab\.domains\|config\.domains\|FEED_FILES\|readHubVocab\|theme_labels_retired\|defineVocab" src config tests docs HELP.md DESIGN.md utils --exclude=local.yml
  tones.ts:98-99 (HubVocab.domains of the payload), data/index.ts:698,717 (local function),
  validate.ts:379 + findings.yml:242 (theme_labels_retired kept, text rewritten), scan.ts:231,280 (vocab lists),
  tests/checks/config/config.test.ts:362 (see Proof 3). No domains: map is read from a config file.

Item-24 rows after the change (worktree):
  npx vitest run tests/routes/hubs/hub-writes.test.ts tests/server/edit/literature.test.ts tests/server/core/changes.test.ts tests/data/sources/manifests.test.ts tests/data/snapshot/schema-rules.test.ts tests/data/snapshot/references.test.ts tests/data/snapshot/rename.test.ts tests/checks/config/templates.test.ts tests/ui/html.dom.test.ts tests/data/hubs/hub-portfolio.test.ts tests/server/edit/feeds.test.ts tests/server/edit/config-value.test.ts
  Test Files  12 passed (12)
  Tests  209 passed (209)
  The verbose run lists each new row as passed, among them:
    hub-writes 'writes a new entry into the file of the hub its root names, and no byte of the other (G8)'
    hub-writes 'refuses a new entry for a hub whose collections list names no such collection, or no hub, and writes nothing (G8)'
    changes 'records a paper saved to Literature, and its undo leaves the file as it was'
    manifests 'reads a feed from the collections entry that names it, as no collection, and finds a named file that is not there'
    schema-rules 'a value outside its options written a...' and 'an option row that holds no key'
    references "a theme word of a dataset, defined by..."; rename "a domain key, the domains registry en..."
    templates: the 5 rows; html.dom 'keeps the words of an abstract that held markup, and its card line holds no element of it'
    literature.test: the 8 key rows (one of them 'J<u with diaeresis>rgen M<u with diaeresis>ller' as 'muller2025uber') and the 6 save and refusal rows

Item-24 rows on the unchanged tree ($TMPDIR/d73-review/hubA with the new and changed test files copied in):
  Test Files  9 failed (9)
  Tests  7 failed | 150 passed (157)
  templates.test 'shows every field of the manifest schema...': expected { missing: [ 'subtasks' ], extra: [] }
  changes.test G9 row: expected 400 to be 200
  hub-writes root row: expected [ 'tasks/tasks.yml' ] to deeply equal []
  hub-writes refusal row: expected 200 to be 404
  manifests, references, rename rows: failed
  html.dom.test.ts and literature.test.ts: cannot resolve ../../src/lib/server/edit/feeds/literature.ts
  schema-rules.test.ts: "the catalog holds findings.schema.option_no_key: expected undefined to be defined"

Builder probes rerun (copied into $TMPDIR/d73-review/probes, write paths moved into that folder):
  node probeA.mjs  -> TypeError: lit.literatureFile is not a function   (see Proof 4)
  after two calls were adapted to the exports in the final tree:
  case 7: entry {"key":"lee2025streaming",...,"source":"lit-watch","added":"2026-10-14"} radar unchanged true
  case 9: tensornotes / example / paper / jneucom2024127654 (with doi and https://doi.org/... url)
  case 17: findings on literature.yml ["entries[3].title:47 key entries[3].title is required", ... entries[6] ...]
  case 14/17: "schema[11].filter:16 the field added is of the type date, which no filter is drawn for; ..." and "schema[12].filter:17 schema[12].filter must be true or false, not a string"; note.filter read as undefined
  case 22: heart expects_datasets: true -> ["missing `datasets`"]; absent -> []
  case 23: method {"color":"#ea580c","label":"Methods (domain-agnostic)"}; color: red -> "...has the color red, which is not a colour written #rrggbb, so it is drawn in the neutral tone", vocab {"label":...} (no color)
  case 24: six findings "key <k> is not one the hub's settings file takes; it is not applied"; feeds the engine paths
  case 25: venue facets include {"theme":"quantum","label":"quantum"}; finding "entries[0].themes[1]:13 ... is quantum, which is not one of core-ml, graphs, systems"
  case 26: data facets with labels "Graphs", "Time series"
  case 27: lists keys ["domains","venue_themes","data_themes"]; heart p1 #e2374d Cardiology; p2 #111111 Heart lab
  case 28: radar and leads not in collections; radar listed elsewhere -> feeds/other-radar.yml; missing -> [": registry file does not exist"]; neither listed -> engine paths
  node doctext.mjs -> settings findings [] / registry findings []; literature filters ["authors","venue","year","keywords","projects","source"]; expects ["brain","brainbci","heart","immune","liver","liverfl","liversurv"]
  node flag.mjs -> ["schema[5].required:10 schema[5].required does not fit the schema of this file"] doi.required undefined
  npx vitest run tests/zz (cases.test.ts, copy-code.client.test.ts; in hubB) -> Test Files 2 passed (2), Tests 2 passed (2)
    cases-seen: 8 failed {"failed":["openalex","crossref"]}; 10 empty answer "plain"; 13 kept ["b","e"]; 15 ["y2021"];
    16 collection view literature/incoming/6, search view literature-search; incoming pane ends ...literature-search, literature;
    20 {"hidden":true,"ignored":true}; 21 hidden:false,ignored:false -> both true; showHidden:false -> hidden false;
    33 committed {"missing":[],"extra":[]}, new_key -> missing ["new_key"];
    34 two hubs fields key + Hub (main, lab), sent {"c":"literature","body":{"key":"k1"},"root":"lab"}; one hub -> ["title"], no root
    copy-seen: WRITTEN ["let a = 1;\nconst b = 2;\n"], AFTER "Copied", LEFT "Copy", REFUSED "The clipboard refused the text", BLOCKS 1

Doc text against the hub's current files (read only):
  diff <hub>/.oculus/config.yml doctext/config.yml -> head comment and line-29 comment rewritten; literature, leads, radar entries added;
    leads_file, radar_file, data_domains, domains, venue_themes, data_themes and their comments removed
  domains.yml: schema gains color and expects_datasets; colors from the config; expects_datasets on heart, liver, liverfl, liversurv, brain, brainbci, immune
  venues.yml and data.yml (builder's byte-exact files): 2 diff lines each, the themes schema line; <hub>/registries/literature.yml does not exist yet

rg -n "demo/|'demo'" . -g '!node_modules' -g '!.scratch'   -> only tests/data/hubs/hubs-fixture.ts:4,19 and hub-portfolio.test.ts:6, all the new path
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds for the engine line (`config/sources.yml`) and the Doc text `registries/literature.yml` (schema order, `filter: true` on the six fields, one help line per field). Violated for the demo hub's copy, Spec 3.
- 2: holds. `Literature.svelte:7` id `literature-search`; `config/layout.yml:101`; words `views.literature_search` and `views.literature_search_glyph: search`; collection view `literature`, incoming, order 6, `book` (cases-seen 16).
- 3: holds. The literature.test key rows pass (the four name forms plus the Europe PMC forms, the diaeresis case and `anonndtensor`).
- 4: holds. literature.test refusal rows, the G9 row, probeA case 7, write-files.ts `literature-save` mapping (G28), and the `found: false` refusal when no file exists (`server/edit/feeds/literature.ts:62-71,125`).
- 5: holds as the brief words it. cases-seen 8/9/10 and probeA case 9. See Spec 2 on the required title.
- 6: holds. `fieldOf` reads `filter` (`schema/field.ts:134`), the date finding (probeA), chips and ranges (cases-seen 13/15), and the payload line in `docs/apps.md:382`. See Standards 4.
- 7: holds at unit level (`venueNamed`, cases-seen 11; `EntryCard.svelte:248-252,373-382`). The link itself is the look.
- 8: holds. cases-seen 12/13: the DOI fetch and the citation-js entry, both under the entry's own key.
- 9: holds in code (`files-view.ts:203-204,244-245`, cases-seen 20/21, and the card's `CARD_SHOWN`). The comment and the report's claim are false, Standards 2.
- 10: holds. probeA cases 22/23 and doctext.mjs. See Standards 4 on the third registry reader.
- 11: holds. probeA case 25 and the schema-rules rows. See Behaviour 2.
- 12: holds. probeA case 27; `docs/apps.md:395`.
- 13: holds. probeA case 28, the manifests row, and no `FEED_FILES` in the tree.
- 14: violated, Standards 3.
- 15: holds. The Doc text was compared against the hub's current files (Verification), and the whole test:checks run passes with it applied.
- 16: holds. copy-code.client.test.ts output. The control is the look.
- 17: holds. cases-seen 31.
- 18: holds. Palette diff exit 0; the page opens with the Contents block.
- 19: holds. templates.test passes after the change; the base run fails on `subtasks`.
- 20: holds. `docs/templates.md:65-81,406,415,417,440,481,540,546,825`.
- 21: violated, Behaviour 1. See also Spec 1.
- 22: holds. The fixture is moved, its config and registries have the new shapes, and the rg prints only the new path. The `records/` reshuffle is disclosed in the report's judgment calls. Item 1's file is short, Spec 3.
- 23: violated, Standards 3: catalog strings a reader sees and `DESIGN.md:738` are left false.
- 24: holds. Every row fails on the unchanged tree and passes after the change (Verification). See Proof 1 and Proof 2.

Cases of the brief's "Cases":

- 1: met. literature.test 'adds the entry under entries and leaves every byte before it as it was' and the key row. "In Literature" is the look.
- 2: met. The three DOI refusal rows.
- 3: met. The title refusal row.
- 4: met. 'adds b and then c to a key the file holds'.
- 5: met. The key rows.
- 6: met. `anonndtensor` row.
- 7: met. probeA case 7.
- 8: met at unit level (cases-seen 8, the failed list). The page opening is the look.
- 9: met. probeA case 9. See Spec 2.
- 10: met. cases-seen "10 empty answer" falls to the collection's Add.
- 11: met at unit level (`venueNamed`). The link is the look.
- 12: met. cases-seen 12.
- 13: met. cases-seen 13 (b, e in the view's order).
- 14: met for the date finding (probeA). The chips are the look.
- 15: met. cases-seen 15 `["y2021"]`.
- 16: met by reading and cases-seen 16. No code reads the old id as the search view.
- 17: met. No finding on the given file; `filter: yes` is a finding and reads as absent. See Spec 2 for address-only entries.
- 18: met. G9 row passed when run alone in the item-24 run. See Proof 1.
- 19: met. html.dom row: saved text `Tested in vivo on mice.`. See Proof 2.
- 20: met at unit level (cases-seen 20). The listing is the look.
- 21: met. cases-seen 21; the card's `CARD_SHOWN` (`ProjectTree.svelte:48,72,77-87`).
- 22: met. probeA case 22.
- 23: met at unit level (probeA case 23). The colour on the card is the look.
- 24: met. probeA case 24.
- 25: met. probeA case 25 and the schema-rules rows.
- 26: met. probeA case 26.
- 27: met. probeA case 27.
- 28: met. probeA case 28.
- 29: met. rename row 'a domain key, the domains registry entry and the domain of each manifest' (engine config files planted with old keys stay unedited).
- 30: met. copy-code.client.test. The control is the look.
- 31: met. cases-seen 31.
- 32: met. Palette regenerated with no diff; palette.test passes inside the green hubB test:checks run.
- 33: met. cases-seen 33.
- 34: partial. Literature's own Add, with a typed value, never asks the hub when two hubs name `literature`, Spec 1. With a single hub naming the collection that is not the primary, Add is refused, Behaviour 1.
- 35: met. hub-portfolio.test passes and the rg prints only the new path.

## 1. Spec

1. `src/lib/views/shared/forms/entry/entry-add.ts:144-163`: `if (text === '') return plain(); ... const answer = await client.writes.saveLiterature('hand', paper);`
   - What is wrong: case 34 ("A workspace of two scratch hubs, both naming `literature`: Add asks the hub, the primary chosen first; the second chosen: the entry lands in the second hub's file") contradicts item 21 ("The Literature view's Add and Save to Literature write to the primary"). The builder settled the conflict itself: a typed Literature Add goes to the primary, and an empty answer falls to the collection Add, which asks the hub.
   - The brief's Cases section says that when the brief's own rules get a case wrong, the builder stops and hands it back for a ruling. The report's first-run section says "No case was found that the brief's rules get wrong" (report line 48), while its "What in the brief was wrong or impossible" section names this exact conflict.
   - Failure scenario: Axel has two hubs naming `literature` and types a DOI into the Literature view's Add. The paper always lands in the primary hub, with no choice offered. The orchestrator reading the first-run line believes no conflict was found.
   - Verdict: case 34 partial. Needs a ruling.
2. `src/lib/server/edit/feeds/literature.ts:149-168` (an address-only save writes no `title`) against the Doc text `registries/literature.yml` (`title` is `required: true`).
   - What is wrong: item 1 makes `title` required, and item 5 / case 9 save an address entry with no title. Every address-only Add therefore creates a schema finding. probeA: "entries[3].title:47 key entries[3].title is required" for each such entry.
   - The report lists this as a judgment call. It is a second conflict between the brief's own rules, handed back as a choice rather than as a stop.
   - Failure scenario: each Add of an unknown address shows a red finding on the Literature file until the reader types a title.
   - Verdict: none (needs a ruling: title not required, or Add asks a title).
3. `tests/fixtures/hubs/demo/registries/literature.yml:5-17`: `- { field: key,      type: text,     required: true }` ... `- { field: note,     type: textarea }`
   - What is wrong: item 1 says "Each field has its `help:` sentence ... The demo hub gets the same file (Part E)". The demo's schema has no `help:` and no `label:` on any field, and it differs from the Doc text file on every schema line.
   - Failure scenario: the demo, which the tests copy as a sample hub, shows a Literature editor with no help lines and no "Citation key" / "DOI" / "Address" labels.
   - Verdict: item 1 violated (the demo copy only).

## 2. Proof

1. `tests/server/core/changes.test.ts:178` and `:357`: `describe('what each writer records', { tags: ['slow'] }, ...)` holds 'records a paper saved to Literature, and its undo leaves the file as it was'.
   - What is wrong: the G9 row is a slow-tagged test, so `npm test` does not run it. The spec section "What every package obeys" asks for a case the step adds to go in a file `npm test` runs, or, if it can only be slow, to be named as slow in the report. The report quotes the row's run (report lines 70 and 366) but never says it is slow.
   - Failure scenario: the orchestrator counts G9 as covered by the unit suite; a regression in the literature undo passes `npm test` and `test:quick`, and is caught only by `test:slow` at landing.
   - Verdict: none (item 24 holds; the report omits the fact).
2. `tests/ui/html.dom.test.ts:57-59`: `const line = inlineMarkdown(saved); expect(line).toContain('Tested in vivo on mice.'); expect(line).not.toMatch(/<i>|<img|onerror/);`
   - What is wrong: `saved` is already plain text (asserted at :56), so the `inlineMarkdown` assertions hold whatever the sanitiser does. The G5 weight of the row rests on the server's `plainText` alone.
   - Failure scenario: a change that let markup through `inlineMarkdown` would not turn this row red.
   - Verdict: none.
3. `tests/checks/config/config.test.ts:354` and `:362`: `['holds a key twice', 'domains: {}\ndomains: {}\n']` ... `expect(config.domains).toEqual(loadConfig(engine).config.domains);`
   - What is wrong: after the change neither the engine nor a hub has `config.domains`, so the assertion compares `undefined` with `undefined` and checks nothing. The fixture also still uses a removed key. The report's list of edited assertions (report line 373) covers the two rows it rewrote to `career_file`, not this one.
   - Failure scenario: a reader takes the row as proof that the engine's values are kept for `domains`; only the `slurm.resource` assertion of the row still checks anything.
   - Verdict: none.
4. `$TMPDIR/d73/after/probeA.mjs:25` and `:84`: `lit.literatureFile(hub, r.p, undefined)`, `idx.readHubVocab(O, ...)`
   - What is wrong: the probe the report quotes for cases 7, 9, 14, 17 and 22-28 fails on the final tree with "TypeError: lit.literatureFile is not a function"; `literatureFile` and `readHubVocab` are not exported in the final tree.
   - With the two calls changed to `join(hub, 'registries/literature.yml')` and `idx.hubVocabOf(...)`, every case line matches the report. The quoted runs were made on an earlier state of the code, not the code as handed back.
   - Failure scenario: the orchestrator reruns the probe at landing and gets a TypeError instead of the quoted results.
   - Verdict: none (results reproduce after adaptation).
5. Brief "Verify before you report", item 4: the grep must print nothing; it prints 12 lines (Verification).
   - What is wrong: every hit is the `hubs.lists` payload key that item 12 and Z881 keep, so the brief's Verify 4 cannot hold as written. The report names the 12 lines.
   - Failure scenario: a landing check that runs Verify 4 literally reports red.
   - Verdict: none (a conflict inside the brief for the orchestrator to rule on).

## 3. Standards

1. `src/lib/data/prose/literature.ts:7`: `// decides what a DOI or a title is. The`
   - What is wrong: the head comment was edited by the step and not rewrapped. The line ends at 41 columns inside a sentence, and the next line's words fit on it. This breaks the spec section "What every package obeys": a comment edited by the step is rewrapped at 100 columns, with no short line inside a sentence.
   - Failure scenario: the file keeps a visibly broken paragraph that the rule exists to prevent.
   - Verdict: none.
2. `src/lib/views/shared/explorer/control/tab-actions.ts:83-84`: "It is the one writer of `showHidden` and `showIgnored`."
   - What is wrong: `src/lib/views/shared/explorer/ProjectTree.svelte:77-87` also writes both keys (`...(view.showHidden || view.showIgnored ? CARD_SHOWN : {})` into the card record), as item 9 asks.
   - The doc comment is false, and so is the report's claim that "the menu's flip is the one writer of `showHidden` and `showIgnored`" (report, files outside the paths list, and case 20). This breaks the spec section "What every package obeys": a sentence the change makes false is a defect.
   - Failure scenario: a later step trusts the comment, adds a third writer or removes the card's write, and a card tree starts listing dotfiles.
   - Verdict: none.
3. Sentences the change makes false, the first two of them read by users:
   - `config/text/findings.yml:92` `domain_unknown`: "...which is not in the domains of .oculus/config.yml in the hub (of config/catalogs/vocab.yml when the hub sets none)...". Its reader is `src/lib/data/sources/deck/read.ts:138`, which now checks the domains registry.
   - `config/text/views/system/workbench.yml:16` `desc_config`: "...the domains and theme words..." of `.oculus/config.yml`.
   - `config/text/views/system/workbench.yml:31` `desc_vocab`: "...the research domains, ... the venue and dataset theme words...". vocab.yml holds neither now.
   - `config/catalogs/vocab.yml:3`: "...the research domains...".
   - `DESIGN.md:738`: "One rule is not in a schema and is stated once, in `specs.ts` and in `docs/DATA-MAP.md`: the keys of the `domains:` map of `catalogs/vocab.yml` are references to the `domains` registry entry of the same key." That rule and its G66 rows were removed by this step.
   - What is wrong: item 14 asks for the comments and help that name the old places to say the new ones. The spec section "What every package obeys" makes a sentence the change makes false a defect.
   - Failure scenario: a deck with an unknown domain shows a finding telling the reader to add the domain to `.oculus/config.yml`, which then gives the finding "key domains is not one the hub's settings file takes". The Settings view describes `config.yml` and `vocab.yml` as holding the domains and theme words.
   - Verdict: item 14 violated, item 23 violated.
4. Repeated rules and readers, against the DRY principle (spec section "The principles every package is judged on": "a parser, a fold or a rule exists once and is reused"):
   - `src/lib/data/snapshot/schema/run.ts:118` and `src/lib/state/boards/collection.ts:488` both declare `const FILTERED_TYPES = ['select', 'tags', 'text'];`. The checker and the view hold the same rule twice.
   - `src/lib/data/sources/deck/read.ts:615` `domainKeysOf` parses the domains registry with raw `parse(readFileSync(...))`, beside `hubVocabOf` (`src/lib/data/index.ts:654`), which reads the same file's entries by key, and the registry reader.
   - Failure scenario: a type added to the filter rule in one place draws a filter the checker reports as a finding, or the reverse. A change to how a domain key is read (trimming, an alias) reaches the cards and not the deck's domain check.
   - Verdict: none.
5. `src/lib/state/feeds/literature/lookup.ts:27` (`export type Lookup`) and `:74` (`export type LookupOptions`).
   - What is wrong: a grep of src and tests finds no importer outside lookup.ts. The spec principle says an export with no importer outside its own file and its tests is removed or made local. `unused-exports.sh` does not list them, so the base comparison does not catch them.
   - Failure scenario: dead public surface that the next reader treats as an interface.
   - Verdict: none.
6. Report line 5 ("one read-only `git ls-files` command was run in the worktree") and report line 117 (`npx vitest run tests/checks` once, two `npm run test:checks` runs and one earlier `final.sh` run stopped, then `final.sh` with `npm run test:checks`).
   - What is wrong: the spec section "Where you work" says a builder runs no git command, read-only ones included. The spec section "Token discipline" makes a whole-suite command, or a run of the list beyond what it allows, a finding of the review. Both are disclosed in the report.
   - Failure scenario: none in the code. It is process cost and a rule breach.
   - Verdict: none.

## 4. Behaviour

1. `src/lib/views/shared/forms/entry/entry-add.ts:68-82` (`hubs.length > 1 ? [...] : []`; `const root = hubField.length === 0 ? undefined : values[asked.length];`), with `src/lib/state/client/writes.svelte.ts:432-437` and `src/lib/server/edit/writes.ts:519-553`.
   - What is wrong: when exactly one hub names a collection and that hub is not the primary, Add asks nothing and sends no `root`. The server then writes to the primary, which does not list the collection, and refuses with `server.write_route.no_collection`.
   - Item 21 says a hub whose list does not name the collection is not offered; with one such hub, Add asks nothing. It should therefore write to that one hub. The report does not mention this case.
   - Failure scenario: a workspace where only a second hub has `education`. The Education view shows that hub's entries, and its Add answers that the collection does not exist.
   - Verdict: item 21 violated; case 34 partial.
2. `src/lib/data/snapshot/schema/field.ts:63` and `:77-78`: `const ROW_KEYS = new Set(['key', 'label']);` ... `if (extra !== undefined) return { word: 'extra', key: extra };`, with `config/text/findings.yml:218` `option_extra`.
   - What is wrong: an option row holding any key besides `key` and `label` (for example a `color`) is a finding, and the whole row is left out. The brief's list of malformed rows is: no key, a key that is not a word, a label that is not text, a key another row holds. The report's judgment calls do not name this extra rule.
   - Failure scenario: a hub writes `{ key: clinical, label: "Clinical", color: "#..." }`. The theme word drops out of the options, and every venue that uses `clinical` gets a "not one of" finding.
   - Verdict: none.
3. `src/lib/data/prose/literature.ts:44-47`: `return key !== '' && key === titleKey(right);`
   - What is wrong: two titles that hold no letter or digit (both empty, for example) are no longer one paper, for Lit Watch's duplicate checks as well as Literature's. Under decision 3's rule ("equal after lower casing and dropping every character that is not a letter or a digit") they are equal, and under the old Lit Watch rule two empty titles were equal. The doc comment states this; the report does not list it as a judgment call.
   - Failure scenario: two Lit Watch entries with no title and different URLs are now both accepted, where the old check refused the second.
   - Verdict: none.

## Declined to judge

- `tools/oculus/.scratch/migration/agents/briefs/D73.md` shows as modified in the worktree's `git status --short` (+5 lines, the "Where you work, and the base" section), byte-identical to the main checkout's brief, with an mtime before the builder's first probe. Who wrote it needs `git log -p -- tools/oculus/.scratch/migration/agents/briefs/D73.md` on main, which I may not run.
- The looks: case 1 (In Literature), 8 (page opens), 11 (venue link), 14 (chips), 20/21 (listing and card tree), 23 (card colour) and 30 (control). They need the TEST page, which I may not open.
- `npm run test:quick`, and the report's 97.8 s against the 45 s limit: excluded from my brief.
- The code-block Copy control mounted into the sanitised HTML by an effect (`src/lib/views/shared/prose/Markdown.svelte:172,214`) against the spec principle that a reader-visible behaviour is state, not a DOM side effect. The report gives its reason (the html-sites check reads one `{@html}` site). Which way to go is a design call for the orchestrator.
- The origin of `build-app/` and `.svelte-kit-app/` in the worktree (gitignored). The report says it is not verified, and no command available to me settles it.
- The config-folder red row of test:checks: it is red on the base copy too, without `.oculus/` (Verification), so it is not caused by the step. Whether a sparse-checkout red counts under the brief's narrow allowance (a case-24 finding on the real config.yml) is the orchestrator's reading.

Reviewer usage: ad6b64b3f5ddc2cac, claude-opus-5-5, 288,307 tokens, 179 tool uses, 39.3 min.

## Repair round 1, refuted


A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, unless a scratch copy is named. My scratch folder is `$TMPDIR/d73r1/`: `copy/` (a copy of the worktree's `tools/oculus`, `node_modules` linked), `r0/` (the round-0 tree: the worktree overlaid with every `files.txt` path from the snapshot, `hubs.ts`, `workbench.yml` and `markdown-created.test.ts` from `git show 233a2e2d0:`, the two new test files removed), `hub/` (the worktree's hub folders and `tools/oculus`, with the five Doc text files placed).

```
Round delta: 225 paths of files.txt diffed snapshot against worktree (35 differ: vocab.yml, findings.yml, DESIGN.md,
4 diagram pairs, data/index.ts, model/index.ts, model-collections.ts, prose/literature.ts, schema/field.ts,
schema/run.ts, data/sources/deck/read.ts, server/content/deck/read.ts, feeds/feed-route.ts, writes/bodies.ts,
boards/collection.ts, client/writes.svelte.ts, literature/lookup.ts, literature/saved.ts, stores/shapes.ts,
SaveToLiterature.svelte, control/tab-actions.ts, entry/entry-add.ts, config.test.ts, integrity.test.ts,
schema-rules.test.ts, demo registries/literature.yml, hub-writes.test.ts, html.dom.test.ts).
Changed now and not in files.txt: config/text/views/system/workbench.yml, src/lib/server/edit/writes/hubs.ts,
tests/server/machine/lsp/adapters/markdown-created.test.ts, tests/state/feeds/literature-home.test.ts (new),
tests/views/shared/forms/entry-add.test.ts (new), and the ledger files D73.md, D73-round1.md, D73-report.md.

npm run lint
  > eslint .            (lint exit 0)
npm run format:check
  All matched files use Prettier code style!   (format exit 0)
npm run check
  1791994181790 COMPLETED 4033 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS   (check exit 0)
npm run test:checks   (worktree, no .oculus/)
  FAIL  |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document
  FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings
   Test Files  2 failed | 17 passed (19)
        Tests  2 failed | 292 passed (294)
  Error: expected any number of assertion, but got none
  AssertionError: expected [ Array(218) ] to deeply equal []
  findings by message: 160 "entries[N].themes[N] is W, which is not a key of vocab.venue_themes", 55 "datasets[N].themes[N] is W,
  which is not a key of vocab.data_themes", 1 each "the field themes takes its keys from vocab.venue_themes / vocab.data_themes,
  which is no registry, projects or vocab list", 1 "collection file does not exist"
npm run test:checks   ($TMPDIR/d73r1/hub, the Doc text files byte for byte from .../T/d73/doctext/)
   Test Files  19 passed (19)
        Tests  294 passed (294)   (exit 0)
ASCII gate (rules file form) over src tests config: no output, ascii gate exit 0; "ls: bin: No such file or directory"
LC_ALL=C grep -n '[^ -~]' over every changed path but the .svg files (none is a local.yml): no output, exit 1
sh utils/folder-check.sh: no output, folder exit 0
sh utils/size-check.sh: no output, size exit 0
sh utils/unused-exports.sh; diff D73-base/unused-exports.txt <output>
  50c50
  < src/lib/server/edit/feeds.ts: feedFile, linkedinFrontMatter
  ---
  > src/lib/server/edit/feeds/feeds.ts: feedFile, linkedinFrontMatter
npm run diagrams; npm run docs:palette   (in $TMPDIR/d73r1/copy)
  diagrams exit 0, palette exit 0; diff -r docs/diagrams <worktree>: diagrams diff exit 0; diff docs/palette.md: palette diff exit 0
  docs/palette.md opens "# The palette" / paragraph / "## Contents" / "[TOC]" / "---" / "## Views"
Verify 4 as round item 11 amends it:
  grep -rnw "data_domains\|venue_themes\|data_themes\|leads_file\|radar_file" src config docs HELP.md DESIGN.md --exclude=local.yml
  12 lines: themes.ts:2,50,53; data/index.ts:643,678,679; model/index.ts:289,294,295; Venues.svelte:64; Data.svelte:61; docs/apps.md:395
  each a field name of the hubs.lists payload (HubVocab), exit 0
npm run test:quick -- --base 233a2e2d0
  ok      ASCII gate (0.9 s)
  ok      prettier (2.0 s): All matched files use Prettier code style!
  ok      svelte-kit sync (2.3 s)
  ok      eslint (1.8 s)
  ok      svelte-check (6.1 s): 1791994777789 COMPLETED 504 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (54.1 s): Duration  48.32s (transform 48.95s, setup 0ms, import 79.58s, tests 102.07s, environment 2.04s)
  test:quick: 55.1 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  (it lists hub-writes.test.ts and markdown-created.test.ts as "changed, run by npm run test:slow")

The round's rows, worktree:
  npx vitest run tests/views/shared/forms/entry-add.test.ts tests/state/feeds/literature-home.test.ts tests/data/snapshot/schema-rules.test.ts
    tests/ui/html.dom.test.ts tests/server/edit/literature.test.ts tests/routes/hubs/hub-writes.test.ts tests/server/core/changes.test.ts
    --testTimeout 60000 --reporter verbose
   Test Files  7 passed (7)
        Tests  85 passed (85)
  (among them every row the report names for round items 1, 2, 5, 7, 8, and 'records a paper saved to Literature, and its undo
   leaves the file as it was' 347ms)
The same round rows on the round-0 copy ($TMPDIR/d73r1/r0):
   Test Files  4 failed | 1 passed (5)
        Tests  13 failed | 42 passed (55)
  failed: the schema-rules extra-key row; the 4 entry-add rows; the 5 literature-home rows; the 3 hub-writes Literature rows.
  html.dom.test.ts passed on round 0 (as the report says).
Slow files the report quotes:
  npx vitest run tests/routes/hubs/hub-writes.test.ts tests/server/core/changes.test.ts tests/server/machine/lsp/adapters/markdown-created.test.ts --testTimeout 60000
   Test Files  3 passed (3)
        Tests  49 passed (49)
Builder probes, copied to $TMPDIR/d73r1/probes and run unchanged:
  node probes/probeA.mjs  -> exit 0; output identical to $TMPDIR/d73/r1/probes/probeA.out (diff prints nothing)
    "case 17: findings on literature.yml []"; "case 15: hubDomainsOf keys [\"method\",\"graphs\",\"nlp\"]"; "case 15: graphs: state ok domain findings []"
  node probes/doctext.mjs -> identical to doctext.out ("settings findings []", "registry findings []", expects [7 domains])
  node probes/flag.mjs    -> identical to flag.out
  node probes/domain-unknown.mjs <worktree> tests/fixtures/hubs/demo -> the domain_unknown finding naming the domains registry
  node probes/probe6.mjs <worktree> tests/fixtures/hubs/demo feeds/feeds.ts
    "(?)" https://example.org/one -> saved / "(?)" https://example.org/two -> saved / "Deep nets: a survey" ... three -> saved /
    "Deep nets - a survey" ... four -> refused [{"field":"title","reason":"this paper is in Lit Watch already"}]
  (the "before" half needs a base copy with node_modules; read instead: the base sameTitle is trim and lower case, which refuses the
   second "(?)" and saves "Deep nets - a survey")
Builder client cases (tests/zz/cases.test.ts and copy-code.client.test.ts copied into $TMPDIR/d73r1/copy, output path moved to
$TMPDIR/d73r1): Test Files 2 passed (2), Tests 2 passed (2); cases-seen.json and copy-seen.json identical to the builder's.
Doc text: the five yaml blocks of the report's "Doc text" (named characters turned back) cmp identical to
  .../T/d73/doctext/{config,domains,venues,data,literature}.yml; demo literature.yml schema head equals the Doc text's (diff exit 0).
```

## Round items

- 1: closed. `hubAsk` (`entry-add.ts:65-77`) gives `literatureAsk` the Hub field when two hubs name `literature`; the save takes `root` (`bodies.ts:114,333`) and the route refuses an unknown hub or a hub without the collection (`feed-route.ts:114-133`); entry-add and hub-writes rows red on round 0 and green now (my runs). New defects the closure brought: Spec 1 (G28 mapping) and Behaviour 1.
- 2: closed. `rootOf: () => hubs.at(0)?.id` sends the one hub's root; entry-add rows 'a second hub' and 'the primary', hub-writes 'saves a paper that names no hub into the one hub ...' pass, red on round 0. The documents it makes false: Standards 1.
- 3: closed. Doc text and demo `title` lines carry no `required:`; probeA "case 17: findings on literature.yml []".
- 4: closed. `diff` of the demo's schema head against the Doc text file prints nothing.
- 5: closed. `field.ts:90,114-115` keeps the row and adds the `extra` problem; the schema-rules row expects exactly one finding and passes, red on round 0.
- 6: closed. Rule kept (`literature.ts:43-46`); report states the before and after; probe6 after-run reproduces it.
- 7: closed. Named slow with its measured run (my run: 347ms); the report says why it stays in `npm run test:slow`.
- 8: closed as far as it can hold. The row runs `inlineMarkdown` over the sent abstract and asserts no `onerror`, `<script` or `alert`; "no img" cannot hold, since `img` is an allowed tag (`src/lib/ui/html.ts:89`), and the report says so with its evidence.
- 9: closed. `config.test.ts:354,362-364` holds `career_file` twice and checks the engine's value.
- 10: closed. Every quoted probe reruns with the same output.
- 11: closed. Verify 4 prints only the 12 payload field names.
- 12: closed. `literature.ts:1-8` rewrapped (99, 100, 2, 99, 96, 100, 96, 49 columns).
- 13: closed. `tab-actions.ts:83-85` names both writers.
- 14: closed for the five sentences named and the grep of removed names (rerun above: only `server.yml:515` and `apps.md:395`, both true).
- 15: closed. `FILTERED_TYPES` once (`model-collections.ts:94`), imported by `run.ts` and `collection.ts`; `domainKeysOf` gone, `hubDomainsOf` read by `hubVocabOf`, the deck route and the integrity test.
- 16: closed. `Lookup` and `LookupOptions` are local types.
- 17: not closed. The report's boundary line: one `git -v` run in this round (Standards 2).

## Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. Engine line, Doc text file and the demo's schema (diff exit 0); `title` not required per Z885.
- 2: holds. cases-seen 16 (literature-search, literature at incoming 6, the Incoming pane).
- 3: holds. literature.test key rows pass (my run).
- 4: violated, Spec 1: a save with a `root` is checked by G28 against the primary's file. The rest holds (refusal rows, G9 row, probeA case 7).
- 5: holds. cases-seen 8/9/10, probeA case 9, entry-add rows (Z884).
- 6: holds. probeA case 14/17, cases-seen 13/15; one `FILTERED_TYPES`.
- 7: holds at unit level (`venueNamed`); the link is the look.
- 8: holds. cases-seen 12/13.
- 9: holds. cases-seen 20/21; the comment is now true.
- 10: holds. probeA 22/23, case 15 lines, doctext.mjs.
- 11: holds. probeA 25/26, schema-rules rows (the extra-key row per Z886).
- 12: holds. probeA 27; `apps.md:395`.
- 13: holds. probeA 28; the manifests row (first review).
- 14: holds. Grep of removed names.
- 15: holds. Doc text equals the byte-exact files; `test:checks` 294 passed over it.
- 16: holds. copy-seen.json reproduced; the control is the look.
- 17: holds. cases-seen 31.
- 18: holds. Palette regenerated with no diff.
- 19: holds. templates.test passes inside `test:checks`.
- 20: violated, Standards 1: `docs/templates.md:406` says a new entry is written to the primary hub's file.
- 21: holds in code (entry-add and hub-writes rows, Z884).
- 22: holds. Demo moved, its literature.yml now the Doc text's schema; rg prints only the new path (first review).
- 23: violated, Standards 1: `HELP.md:236`, `HELP.md:459` and `DESIGN.md:676` are false after Z884.
- 24: holds. The round's rows fail on the round-0 copy and pass now (my runs); the earlier rows as in the first review.

Cases of the brief's "Cases":

- 1: met. literature.test 'adds the entry under entries ...'; In Literature is the look.
- 2: met. The three DOI refusal rows.
- 3: met. The title refusal row.
- 4: met. 'adds b and then c ...'.
- 5: met. The key rows.
- 6: met. `anonndtensor` row.
- 7: met. probeA case 7.
- 8: met at unit level (cases-seen 8); the page opening is the look.
- 9: met. probeA case 9; no title finding now (case 17 line).
- 10: met. cases-seen "10 empty answer".
- 11: met at unit level; the link is the look.
- 12: met. cases-seen 12.
- 13: met. cases-seen 13.
- 14: met for the finding (probeA); the chips are the look.
- 15: met. cases-seen 15.
- 16: met. cases-seen 16.
- 17: met. probeA case 17 lines.
- 18: met. changes.test G9 row passes (347ms).
- 19: met. html.dom row passes.
- 20: met at unit level (cases-seen 20); the listing is the look.
- 21: met. cases-seen 21.
- 22: met. probeA case 22.
- 23: met at unit level (probeA case 23, doctext.mjs); the colour is the look.
- 24: met. probeA case 24.
- 25: met. probeA case 25, schema-rules rows.
- 26: met. probeA case 26.
- 27: met. probeA case 27.
- 28: met. probeA case 28.
- 29: met. rename row (first review; the delta does not touch it).
- 30: met. copy-seen.json; the control is the look.
- 31: met. cases-seen 31.
- 32: met. Palette regenerated, `test:checks` passes over the Doc text.
- 33: met. cases-seen 33.
- 34: met. cases-seen 34, entry-add rows, hub-writes Literature rows.
- 35: met. hub-portfolio tests (first review), rg as reported.

## 1. Spec

- `src/lib/state/sessions/source/write-files.ts:163-164`: `case 'literature-save':` / `return collection('literature');`
  - What is wrong: round item 1 gave the save a `root`, and the client now sends it (`writes.svelte.ts:522-527`, `SaveToLiterature.svelte:47` with `home?.root`, `entry-add.ts:183`). The G28 mapping still names the primary's Literature file whatever `root` holds: `collection('literature')` falls to `viewSourceFile('collection', merged, look.primary(), 'literature')`. The `new-entry` case beside it (`:158-162`) reads `body.root`. Brief item 4 requires the save to be refused over a source tab's unsaved text of the file it writes (G28, through `write-files.ts`). The report does not mention write-files.ts beyond its line count.
  - Failure scenario: two hubs name `literature`. The reader has `lab`'s `registries/literature.yml` open in a source tab with unsaved text, opens Add on the Literature view, chooses Hub `lab` and types a DOI. The save writes `lab`'s file under the tab without the G28 refusal, and the tab's text is now stale. In the other direction, unsaved text in the primary's Literature file refuses a save meant for `lab`. The same happens for a card's Save when the primary does not name `literature`, since the card then sends the first hub's root.
  - Verdict: item 4 violated.
- `tests/state/feeds/literature-home.test.ts:10-26` (new): a test of `literatureHome` in `saved.ts`, with the row `{ name: 'the primary, after another hub', hubs: ['lab', undefined], at: 1 }`.
  - What is wrong: round item 1 asks for a G8 row in `literature.test.ts` or `hub-writes.test.ts`, and item 2 for one in `hub-writes.test.ts` or a client case. This file is a third test of a unit (`saved.ts`) that G8's Code line does not name. Its last row is an order `collectionsOfKey` never gives: the file's own head comment says the primary is listed first. The report lists the file among the round's rows and does not say it goes beyond the round's text.
  - Failure scenario: the orchestrator books the rows under G8 at landing without noticing that a new unit joins the entry. A later change to the selectors' order is then held to a row that describes no real input.
  - Verdict: none.

## 2. Proof

- `agents/reviews/D73-report.md`, section "What in the brief was wrong or impossible", fourth bullet: "The brief's `docs/DATA-MAP.md` line numbers (229-561) do not exist in the hub's file".
  - What is wrong: neither brief names lines 229-561. `briefs/D73.md` names lines 81-95, 130 and 133 (premise "The documents" and item 23), and `grep -rn "229\|561"` over both briefs prints nothing. The base copy's `hub-docs/DATA-MAP.md` holds `leads_file:` at 81, `radar_file:` at 82, `themes: [config.yml venue_themes]` at 130 and `themes: [config.yml data_themes]` at 133. The brief's premise reproduces, and the report's claim does not.
  - Decision resting on it: the orchestrator reads this section to correct the brief and the premises, and this bullet asks for a correction of a premise that was right.
  - Failure scenario: a later brief that cites the Data map is "corrected" away from line numbers that hold.
  - Verdict: none.

## 3. Standards

- `HELP.md:236`, `HELP.md:459`, `docs/templates.md:406`, `DESIGN.md:676`:
  - The quoted text: "Add asks for the fields that name the new entry, writes it to the primary hub's file and opens its page." / "A change goes to its own hub's file; a new record goes to the primary hub." / "A new entry is written into the primary hub's file of its collection." / "`literature-save` ..., which writes to the primary hub's file, else the first hub's".
  - What is wrong: after round items 1 and 2 (Z884), an Add on a collection that only a second hub names writes into that hub's file. The Literature Add writes to the hub chosen, and the save takes a `root`. Each sentence is now false or incomplete. The report's "Host- and user-visible changes" states the new behaviour, but none of these sentences was rewritten. This breaks the rules file, "What every package obeys": a sentence in a document that the change makes false is a defect, and the grep across HELP.md, DESIGN.md and `docs/` is owed.
  - Failure scenario: a reader with an Education collection only in a second hub reads Help, expects the entry in the primary hub's file, and looks for it there.
  - Verdict: item 20 violated (templates.md), item 23 violated (HELP.md, DESIGN.md).
- `agents/reviews/D73-report.md`, the "Boundary" paragraph: "in this round one `git -v` ... was run from the worktree's `tools/oculus`".
  - What is wrong: round item 17 forbids every git command in this round. The rules file, "Where you work", names `--version` among the git commands a builder never runs. The same paragraph of the report says `npm run lint` and `npm run check` also ran whole between the two list runs. "Token discipline" allows only the red file rerun alone before the list runs once more.
  - Failure scenario: none in the code. It is a breach of the round's own item, disclosed.
  - Verdict: none (round item 17 not closed).

## 4. Behaviour

- `src/lib/views/shared/card/feed/SaveToLiterature.svelte:49` with `src/lib/state/client/writes.svelte.ts:529`: `onsaid(refused === '' ? t('literature.saved', answer.id ?? '') : refused);` and `const id = own ? answer.id : \`${root}:${answer.id}\`;`
  - What is wrong: the line `literature.saved` is 'Saved to Literature as {0}', and `{0}` is meant to be the citation key. A card save now goes to a hub other than the primary when the primary does not name `literature`. In that case the answer's id is `<hub>:<key>`, so the line reads "Saved to Literature as lab:faes2024blockterm". The report's host-visible changes do not state this line before and after.
  - Failure scenario: a reader whose Literature lives only in hub `lab` saves a paper from Lit Watch, takes `lab:faes2024blockterm` from the line as the citation key, and cites a key that BibTeX and the entry do not hold.
  - Verdict: none.

## Declined to judge

- The looks (cases 1, 7, 8, 10, 11, 14, 20, 21, 23, 30, 31, 34, and the Hub field in the Literature Add box), since they need the TEST page, which I may not open.
- The first run of the changed fixture in `tests/server/machine/lsp/adapters/markdown-created.test.ts` on the round-0 tree. The report says the copy cannot run the Markdown server. I ran it only in the worktree (passed), and the fixture value `new_project_dir: {}` is a key the hub file takes (`hub-names.ts:230`, `sources.yml:21`).
- The before half of `probe6.mjs` (needs a base copy with `node_modules`). Judged by reading the base `sameTitle` (`git show 233a2e2d0:tools/oculus/src/lib/data/prose/literature.ts`, trim and lower case), which agrees with the report.
- Whether the `git -v` run changed anything, since only a git command would settle it.
- The report's measured times (test:quick 80.4 s, my run 55.1 s), since no decision rests on them.

Reviewer usage: a2a35873b46a38dbf, claude-opus-5-5, 332,678 tokens, 89 tool uses, 32.0 min.


## Closed (at landing)

The findings of the run over repair round 1, each fixed on main at landing, none sent to the builder.

- Spec 1 (`write-files.ts:163-164`, the G28 mapping of `literature-save`): the save that names a `root` other than the primary is checked against that hub's Literature file (`look.collectionFile('<root>:literature')`), as `new-entry` is. A G28 row in `tests/state/client/held-unsaved.test.ts`, "checks a Literature save that names a hub against that hub's Literature file", fails on the round-1 tree (`expected [ { kind: 'literature-save', ...(3) } ] to deeply equal []`) and passes with the fix.
- Spec 2 (`tests/state/feeds/literature-home.test.ts`): the row 'the primary, after another hub', an order the selectors never give, is removed; the file's rows are booked under G8 with `saved.ts` and `entry-add.ts` in G8's Code line.
- Proof 1 (the report's claim that the brief's Data map lines do not exist): the claim is wrong and the brief's premise holds (lines 81, 82, 130 and 133 of the base's `docs/DATA-MAP.md`); no change, named in the booking.
- Standards 1 (`HELP.md:236`, `HELP.md:459`, `docs/templates.md:406`, `DESIGN.md:676`): each sentence rewritten to the hub that lists the collection, the Add asking when more than one hub does, and the Literature save's `root`.
- Standards 2 (one `git -v` in round 1): a breach of round item 17, named in the booking; nothing to change in the tree.
- Behaviour 1 (`SaveToLiterature.svelte:49`): the saved line names the citation key alone, the hub's name taken off an entry id of a hub other than the primary.

Two defects the look found, fixed on main at landing:

- The Contents block of a page drawn from a `[TOC]` paragraph listed the page's title and the Contents heading itself, so every generated Contents block (Templates, Palette) opened with two lines that are not sections. `renderDocumentParts` (`src/lib/data/prose/markdown/markdown.ts`) now lists only the headings after the first `[TOC]` paragraph. No guarded test covers the Contents block; the look shows Templates opening at "Where each file goes" and Palette at "Views".
- The Literature view's Add, answered empty with a second hub chosen, opened the collection's Add with the primary chosen again, so the entry went to the primary unless the hub was chosen a second time. `literatureAsk` now hands the hub chosen to the collection's Add (`collectionAsk`'s `chosen`). A G8 row in `tests/views/shared/forms/entry-add.test.ts`, "turns an empty Literature Add into the collection's Add with the hub chosen in it, and writes there", fails on the round-1 tree (the Hub field holds `"main"` where `"lab"` was chosen) and passes with the fix; the look shows the second box on look-hub2.
