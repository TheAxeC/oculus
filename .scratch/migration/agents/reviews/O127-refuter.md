# Step O127 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O127, base 0e374c303)

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (PATH with /Users/axelfaes/.nvm/versions/node/v24.21.0/bin)
... docs/diagrams/layer-views.svg / channels.dot / channels.svg / writes.dot / writes.svg
$ git status --short           (after it: no file under docs/diagrams)
 M config/catalogs/vocab.yml
 M config/text/views/boards/project.yml
 M docs/HELP.md
 M src/lib/data/shapes/catalog-files/vocab.ts
 M src/lib/state/boards/focus.ts
 M src/lib/views/boards/focus/lanes/LaneCard.svelte
 M src/lib/views/shared/card/project/CardFacts.svelte
 M src/lib/views/shared/card/project/ProjectCard.svelte
?? .scratch/migration/agents/reviews/O127-report.md

$ npm run test:quick           (once)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.5 s)
ok      svelte-check (8.9 s): 1793703903954 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (21.2 s): Duration  10.84s (transform 7.21s, setup 0ms, import 19.69s, tests 6.63s, environment 1ms)
ok      vitest checks (44.7 s): Duration  34.11s (transform 14.38s, setup 0ms, import 29.24s, tests 47.05s, environment 2ms)
test:quick: 47.4 s; every command passed
(the same 13 test files the report lists, by name)

$ node --import 'data:text/javascript,globalThis.$state=(v)=>v' o127-cases.mjs <worktree>
  output identical, line for line, to the report's "Second run", e.g.
C1: stage=accepted year=2026 | rule -> 2026 | tag "2026" glyph=calendar tip "Year: 2026" | laneFacts -> [{"kind":"year","label":"2026","whole":"2026"}]
C7 published without public: stage=published year=2023 | rule -> undefined | no tag | laneFacts -> []
C9: stage=published year=2025 | rule -> 2025 | tag "2025" glyph=calendar tip "Year: 2025" | laneFacts -> [{"kind":"year","label":"2025","whole":"2025"},{"kind":"tier","label":"paper","whole":"paper"}]
C9 oculus lanes: accepted -> lane undefined, rule 2025
C9 oculus lanes: published -> lane undefined, rule 2025
exit 0
$ same program on .agents/worktrees/O127-base
  output identical, line for line, to the report's "First run" (every rule "(no function cardYear)", C9 laneFacts only the tier); exit 0

$ sh utils/unused-exports.sh > <scratchpad>/o127-unused-after.txt; diff ../O127-base/unused-exports.txt <that>
338 lines each; diff exit 0 (no line added)

$ LC_ALL=C grep -n '[^ -~]' <the eight changed files and the report> | wc -l
0
$ spec.md ASCII gate (perl) over $(find src tests config -type f ! -name local.yml) | wc -l
0

$ git diff 0e374c303 --numstat
2 2 config/catalogs/vocab.yml | 2 0 config/text/views/boards/project.yml | 2 2 docs/HELP.md | 2 2 src/lib/data/shapes/catalog-files/vocab.ts | 30 3 src/lib/state/boards/focus.ts | 7 4 .../LaneCard.svelte | 17 5 .../CardFacts.svelte | 5 4 .../ProjectCard.svelte   (matches the report's table)
$ wc -l: focus.ts 791, CardFacts.svelte 150, ProjectCard.svelte 430, LaneCard.svelte 319, vocab.ts 533 (all under 880 / 520)
$ git diff 0e374c303 -U0 docs/HELP.md | grep '^@@'
@@ -296 +296 @@ ...   @@ -298 +298 @@ ...
$ git diff 0e374c303 -U0 | grep '^+' | grep -n -i -E "before|used to|...|20[0-9][0-9]-[0-9][0-9]"
8:+- **Focus.** One page ...   9:+- **A project card.** ...   (only the two whole HELP lines, as the report says; the same grep over src and config prints nothing, exit 1)
$ awk read of every edited comment paragraph for a next word that fits the line above, and for lines over 100
  hits only on code lines (focus.ts:594-602, CardFacts.svelte:57); no comment line short-wrapped or over 100
$ grep -n "CardFacts\|card/card.ts\|LaneCard\|boards/project.yml\|laneFacts\|focus.ts" .scratch/migration/agents/guarded.md
(nothing, exit 1)
$ diff -rq ../O127-base/tests tests ; diff -rq ../O127-base/utils utils
(nothing, exit 0 each)
$ ls docs/glossary.md docs/adr
No such file or directory (both)
$ report's C11 base greps: grep -rn -i year over the base copy's focus.ts, CardFacts, ProjectCard, LaneCard: nothing; grep -c year base vocab.ts: 0; git show 0e374c303:docs/HELP.md lines 296,298 grep -c "Year:": 0; git show 0e374c303:config/catalogs/vocab.yml lines 55,59 grep -c year: 0
$ grep -rln "compute resource" docs README.md src config --exclude=local.yml
docs/HELP.md  src/lib/views/shared/card/card.ts  src/lib/views/shared/card/project/CardFacts.svelte
$ CardFacts.svelte lines 52, 58, 72: hub = rootOf(item.project); words = vocabOf(hub); year = cardYear(item.project, words)
$ grep -n CardFacts ProjectCard.svelte: 43 import, 367 <CardFacts {item} onfolder={showFolder} />
$ Lanes.svelte:234 facts={laneFacts(project, wordsAt(project), known.self, known.venues)}
$ premises at the base (git show 0e374c303:<path>): CardFacts 138 lines, LaneCard 316, card.ts 244, focus.ts 764; focus.ts:320-327 holds() and :334 comment as quoted; LaneFact at :582; vocab.ts:89-98 laneRows refuses a stage two rows hold; normalise.ts numberShape = z.number(), year: num(manifest.year); vocab.yml:73-77 flags as the brief states; glyphs.yml:106 calendar, icons.yml:105 calendar
$ hub manifests, read only (node + yaml over every project.yml): {"accepted":3,"published":30}; with a year: published:int 30, accepted:int 3, submitted:int 12, revision:int 2, in-prep:int 1, exploring:int 1, stopped:int 1
$ the three manifests C1-C3 name: hccnet-fl stage accepted year 2026; bachelor-network-ids stage published year 2016; raw-pls stage submitted year 2026
$ node -e (zod 4.6.5 z.number().safeParse): Infinity false, -Infinity false, NaN false, 2025.5 true, 0 true, -3 true
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `cardYear` at focus.ts:586-602 beside `laneFacts`, reads both flags with `hasWord` in `words`, gives `project.year` or undefined; doc comment gives what and why; head comment focus.ts:1-4 names it; case run C1, C3, C5, C7, C8.
- 2: holds. CardFacts.svelte:105-109, after the chips' `{#each}` and before `{#if item.code !== ''}`, `Tag` with `project.card.year_glyph` in `Tooltip` with `year_tip`; head comments of CardFacts.svelte:2-9 and ProjectCard.svelte:2-8 name the year in order, rewrapped (comment-width check green, awk read clean).
- 3: holds. `LaneFact` kinds gain `year` (focus.ts:584); `laneFacts` pushes it first (focus.ts:620-624); `FACT_GLYPHS` and `factTip` (LaneCard.svelte:114,122); doc comment of `laneFacts` and head comment of LaneCard name it; case run C9.
- 4: holds. project.yml:146-147, after `workbench_glyph`, in the file's key order.
- 5: holds for the four places the item names (vocab.yml:55,59; vocab.ts:154,169). A third description of the two flags exists outside the item; see Spec 1.
- 6: holds. HELP.md:296 names the year before the role at such a stage, on no lane with oculus's lanes; HELP.md:298 names it after the chips and before the code status, with "Year: 2025" and accepted and published.

Cases of the brief's "Cases":

- C1: met, case run `rule -> 2026 | tag "2026" glyph=calendar tip "Year: 2026"`, markup place by reading CardFacts.svelte:105-109; the drawn tag is left to the look on landing.
- C2: met, case run `rule -> 2016`, tip "Year: 2016".
- C3: met, `rule -> undefined | no tag`.
- C4: met, revision and in-prep `rule -> undefined`.
- C5: met, released, failed and stopped, with and without a year, `rule -> undefined`.
- C6: met, `rule -> undefined`, `laneFacts -> []`; the only markup added is the guarded block at CardFacts.svelte:105-109.
- C7: met, own stage `appeared` gives 2023, `published` without `public` gives nothing; CardFacts passes `vocabOf(rootOf(item.project))`, Lanes.svelte:234 passes `wordsAt(project)`.
- C8: met, `rule -> undefined` (`hasWord` false for an undefined word, vocab-keys.ts:128).
- C9: met, `laneFacts` gives the year fact first, label "2025", on the hub with a `published` lane; with oculus's lanes accepted and published are on no lane. The drawn lane tag is left to the look.
- C10: not verifiable by a read or a rerun; by reading, ProjectCard.svelte:367 draws `CardFacts` and ProjectCards, Person, Listing and Project all reach `ProjectCard`, and the Archival listing groups failed and stopped, where the rule gives nothing. Settled at the look on landing.
- C11: met by reading: HELP.md:296,298, vocab.yml:55,59, vocab.ts:154,169 and the head comments of CardFacts, ProjectCard, LaneCard and focus.ts name the year in the order drawn. Standards 1 is about how one of those head comments is phrased, and it does not change this verdict.

## 1. Spec

- config/options/catalogs/vocab.yml:34-35 and :48-49: "terminal: help: the done group, a done or closed outcome" and "public: help: a public outcome, which the audit of the website's publications asks for on the site"; what is wrong: the brief's premise "What each flag decides is described in two places" (vocab.yml comment, vocab.ts descriptions) does not reproduce. The Settings form's help for each stage flag is a third description of what the flag decides, and `public`'s help names its readers (the website audit) and now leaves out the new one. The report's spec.md:72 re-read list ("Comments and documents re-read after the change") does not list this file as still true or rewritten. Under the rule that a path list widens rather than books, the step should have carried the sentence here or listed it with a reason. Failure scenario: a hub owner in Settings who unticks `public` on `accepted`, to keep accepted papers off the website, reads a help line that names only the website audit, and the year tags then disappear from every accepted card without the form telling them why. Verdict: none (item 5 holds for the places it names; this is a premise miss in the brief and an omission in the report's re-read list).

## 2. Proof

- none. Every command the report quotes reproduces: both case-run outputs line for line, the numstat, the HELP hunks, the history grep, the guarded grep, the C11 base greps, the "compute resource" grep, the unused-exports diff and the ASCII gates. The report says "Whether `z.number()` takes `Infinity` is not verified". The rerun settles it: zod 4.6.5 rejects Infinity and NaN, so only a fraction, a zero or a negative year can reach the tag, which the report already states.

## 3. Standards

- src/lib/views/boards/focus/lanes/LaneCard.svelte:14-16: "then the facts (the year the paper appeared at a stage that carries both `terminal` and `public`, "Year: 2025", the user's role, the tier, the venue by its short name with its whole name in the tip)"; what is wrong: spec.md "The working rules" (plain prose). The tip example "Year: 2025" stands in the comma list as if it were an item of the list. The venue item next to it says explicitly what its tip holds, so a reader reads this list as five items, or reads the tag's words as "Year: 2025". Failure scenario: a maintainer reading the head comment takes "Year: 2025" as the tag's label and changes `laneFacts` to put "Year: " into `label`, which doubles the word in the tip ("Year: Year: 2025"). Verdict: none (C11 is met).
- .scratch/migration/agents/reviews/O127-report.md, C10: "`ProjectCard.svelte:366` draws `CardFacts` for every card"; what is wrong: spec.md "The working rules" (every `file:line` is taken after the last change). The line is 367 after the change (`grep -n CardFacts ProjectCard.svelte` prints `367:        <CardFacts {item} onfolder={showFolder} />`); 366 is the base's line. Failure scenario: a reader who opens line 366 to check C10 lands one line off. No decision rests on it. Verdict: none.

## 4. Behaviour

- none. The report gives a before and after for the board card (every view `ProjectCard` draws) and for the lane card under oculus's lanes and under a hub lane that lists `published`. The flag descriptions are text changes and the diff shows them.

## Declined to judge

- The drawn tags (C1, C2, C9 on screen, C10): the brief and spec.md "What every package obeys" leave them to the look on landing, and a reviewer runs no page.
- src/lib/views/shared/card/card.ts:1-3 says "the glyph each fact of the card's top row is drawn with" lives there. The year's glyph, like the code status's and Reproduced's, which the base already drew from the catalog in CardFacts.svelte, does not come from card.ts. The sentence was already loose before this diff, so I did not count it against the step.
- Whether the HELP.md:296 and :298 paragraphs merge cleanly with O126's paragraph 295: that is the landing's merge, and settling it would take the other worktree's diff.

Reviewer usage: a8e6e45d7bcf15b6b, claude-opus-5-5, 165569 tokens, 33 tool uses, 6 min 16 s.

## Repair round 1, refuted

```
$ npm run diagrams            (from the worktree root, PATH with /Users/axelfaes/.nvm/versions/node/v24.21.0/bin)
docs/diagrams/layer-views.svg
docs/diagrams/channels.dot
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
$ git status --short docs/diagrams
(nothing)
$ npm run test:quick          (once)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.1 s)
ok      eslint (3.5 s)
ok      svelte-check (12.5 s): 1793704994537 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (134.8 s): Duration  116.93s (transform 74.72s, setup 0ms, import 183.20s, tests 229.08s, environment 6ms)
ok      vitest (190.3 s): Duration  174.99s (transform 96.16s, setup 0ms, import 304.64s, tests 351.49s, environment 12.49s)
ok      vitest slow (244.1 s): Duration  228.78s (transform 36.22s, setup 0ms, import 125.77s, tests 781.57s, environment 9ms)
test:quick: 247.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files

$ npx vitest run tests/data/snapshot/normalise.test.ts --reporter=verbose | grep -E "year|Test Files|Tests |FAIL"
 <check> |unit| ... > normalise, the field mapping > reads a manifest's year given as the number 2025 as 2025 1ms
 <check> |unit| ... > reads a manifest's year given as the text '2025' as 2025 1ms
 <check> |unit| ... > reads a manifest's year given as the fraction 2025.5 as none 0ms
 <check> |unit| ... > reads a manifest's year given as the negative number -3 as none 0ms
 <check> |unit| ... > reads a manifest's year given as an empty text as none 0ms
 <check> |unit| ... > reads a manifest's year given as the text 'circa 2020' as none 0ms
 <check> |unit| ... > reads a manifest's year given as the text ' 2025' as none 0ms
 Test Files  1 passed (1)
      Tests  12 passed (12)
(the "..." stands for "tests/data/snapshot/normalise.test.ts > normalise, the field mapping", cut here only for width)

$ node --import 'data:text/javascript,globalThis.$state=(v)=>v' o127-cases.mjs <worktree>     (exit 0)
output identical, line for line, to the report's "Second run" with the two round lines between "C9 lane with oculus's lanes" and the "C9 oculus lanes" loop:
R1 year '2025' at published (normalise gives year=2025): stage=published year=2025 | rule -> 2025 | tag "2025" glyph=calendar tip "Year: 2025" | laneFacts -> [{"kind":"year","label":"2025","whole":"2025"}]
R1 year 2025.5 at published (normalise gives year=undefined): stage=published year=undefined | rule -> undefined | no tag | laneFacts -> []

$ sh utils/unused-exports.sh > <scratchpad>/o127-r1-rev-unused.txt; diff ../O127-base/unused-exports.txt <that>
exit 0; 338 lines each; diff exit 0 (no line added)

$ spec.md ASCII gate (perl) over $(find src tests config -type f ! -name local.yml) | wc -l
0
$ LC_ALL=C grep -n '[^ -~]' normalise.ts normalise.test.ts config/options/catalogs/vocab.yml LaneCard.svelte O127-report.md | wc -l
0
$ git diff 0e374c303 -U0 -- src tests config | grep '^+' | grep -v '^+++' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-[0-9][0-9]"
grep exit 1 (nothing)

$ the round's delta: diff -u <snapshot migration-O127-round-1>/<path> <worktree>/<path> for each path of files.txt
config/catalogs/vocab.yml, config/text/views/boards/project.yml, docs/HELP.md, catalog-files/vocab.ts, focus.ts, CardFacts.svelte, ProjectCard.svelte: exit 0 each
LaneCard.svelte: exit 1, one hunk, lines 14-17 (round item 3)
plus normalise.ts, normalise.test.ts and config/options/catalogs/vocab.yml, read in git diff 0e374c303

$ git diff 0e374c303 --numstat
2 2 config/catalogs/vocab.yml | 2 2 config/options/catalogs/vocab.yml | 2 0 config/text/views/boards/project.yml | 2 2 docs/HELP.md | 2 2 catalog-files/vocab.ts | 17 8 normalise.ts | 30 3 focus.ts | 9 6 LaneCard.svelte | 17 5 CardFacts.svelte | 5 4 ProjectCard.svelte | 15 0 normalise.test.ts
$ wc -l: normalise.ts 696, normalise.test.ts 396, LaneCard.svelte 319, config/options/catalogs/vocab.yml 413   (matches the round's table)

$ readers of num / numberShape: git show 0e374c303:src/lib/data/snapshot/normalise.ts | grep -n "num(\|numberShape"
161:const numberShape = z.number();   164:function num(value: unknown): number | undefined {   165: return numberShape.safeParse(value).data;   278: year: num(manifest.year),
$ grep -rn "numberShape\|function num\b" ../O127-base/src ../O127-base/tests
only normalise.ts:161,164,165 and the unrelated local src/lib/state/boards/structure/layout.ts:101 function num(value: number): string
$ grep -rn "numberShape\|\bnum(" src tests (worktree)
only layout.ts:101,117,120 (its own local num); normalise.ts holds neither

$ every hub manifest's year through normalise of the base copy and of the worktree (<scratchpad>/o127-hub-years.mjs, read only: every project.yml under ~/workspace/research-hub, and .oculus/project.yml of the workspace folders cathedra, game-engine, ordo, oculus, scotoma, officium, youtube-downloader where present)
manifests read: 127; with a year key: 50; kinds: {"number:int":50}; differing: 0

$ edge inputs through the worktree's normalise (<scratchpad>/o127-edge.mjs, prints only), stage published
400 nines: Infinity json {"y":null}
20 nines: 100000000000000000000 json {"y":100000000000000000000}
02025: 2025 json {"y":2025}
0: 0 json {"y":0}
Infinity number: undefined json {}
2025\n: undefined json {}
1e3 text: undefined json {}
$ node -e zod z.number().int().min(0).safeParse: 1e20 false, 2**53 false, 2**53-1 true, Infinity false

$ comment widths: normalise.ts:161-163 = 100, 95, 83; :283-286 = 97, 93, 91, 89 (each next first word would pass 100); LaneCard.svelte:9-17 = 82, 91, 92, 99, 99, 100, 100, 96, 94   (matches the report)
$ node -e yaml parse of config/options/catalogs/vocab.yml, options.stages.fields
{"help":"the done group, a done or closed outcome; with public too, a card draws the project's year at the stage","control":"toggle"}
{"help":"a public outcome, which the audit of the website's publications asks for on the site; with terminal too, a card draws the project's year at the stage","control":"toggle"}
$ the builder's flag grep (grep -rn --exclude=local.yml -E "`terminal`|`public`|'terminal'|'public'|\bterminal: (flag|true)|\bpublic: (flag|true)" config docs src): the same hits the report lists; a wider grep for "carries/flags terminal|public" adds only layout.yml:221,264, templates.md:298, vocab.ts:75, all true
$ the report's file:line spot checks after the round: focus.ts:584,586,602,620,624; CardFacts.svelte:52,58,72,104,105,109,110; LaneCard.svelte:114,120,122,154; ProjectCard.svelte:367 <CardFacts {item} onfolder={showFolder} />; project.yml:146-147: each holds what the report says
$ grep -rn -E "\.year\b" src (other readers of a project's year)
src/lib/server/content/audit/website/papers.ts:99 put('pub_date', project.year); src/lib/state/forms/schema.ts:464 year: project.year; src/lib/state/boards/board/items.ts:166; src/lib/state/boards/board/state.ts:51; src/lib/data/shapes/boards/takes.ts:94
```

### Verdicts

Items of the brief's "What to build":

- 1: holds. `cardYear` at focus.ts:586-603 reads both flags with `hasWord` in `words`; case run C1, C3, C5, C7, C8.
- 2: holds. CardFacts.svelte:105-109 sits between the chips' `{#each}` (104) and the code status (110). Both head comments name the year.
- 3: holds. focus.ts:584 and :620-624 add the year fact. LaneCard.svelte:114 and :122 draw it. Case run C9.
- 4: holds. project.yml:146-147.
- 5: holds. vocab.yml:55,59 and vocab.ts:154,169 carry the sentence. After the round, config/options/catalogs/vocab.yml:35,49 carry it too.
- 6: holds. HELP.md:296,298 are unchanged since the first build (snapshot diff exit 0) and are still true.

Cases of the brief's "Cases":

- C1: met, case run `rule -> 2026 | tag "2026" glyph=calendar tip "Year: 2026"`. The drawn tag is left to the look on landing.
- C2: met, `rule -> 2016`.
- C3: met, `rule -> undefined | no tag`.
- C4: met, revision and in-prep `rule -> undefined`.
- C5: met, released, failed and stopped, with and without a year, `rule -> undefined`.
- C6: met, `rule -> undefined`, `laneFacts -> []`.
- C7: met, own stage `appeared` gives 2023, and `published` without `public` gives nothing.
- C8: met, `rule -> undefined`.
- C9: met, `laneFacts` gives the year fact first with label "2025". With oculus's lanes, accepted and published sit on no lane.
- C10: not verifiable by a read or a rerun. ProjectCard.svelte:367 draws CardFacts for every card. Settled at the look on landing.
- C11: met by reading.

Round items:

- 1: violated, Behaviour 1. The read of a number and of a text of digits holds the ruling for every year a manifest plausibly gives, and the 50 hub years read the same before and after. A text of more than 15 digits does not give "the number it spells", and the doc comment's claim that Infinity gives none is false for a text.
- 2: holds. config/options/catalogs/vocab.yml:35 and :49 are true, lower case, and use the semicolon form of the `negative` and `new_idea` lines. The file parses. The builder's grep and a wider one find no other false sentence about either flag.
- 3: holds. LaneCard.svelte:14-16 now reads `with "Year: 2025" in its tip`, and the paragraph is rewrapped whole.
- 4: holds for every file:line. ProjectCard.svelte:367 is correct, and the spot checks above all hold. A count and a DONE row of the first build remain stale (Standards 1).

### Findings

#### 1. Spec

- .scratch/migration/agents/guarded.md:278 (G32, Test line): "snapshot: `tests/data/snapshot/normalise.test.ts`, 'fills a project from the manifest keys of the same meaning'"
  - What is wrong: the round adds the table "reads a manifest's year given as %s" to the describe of that test. Under spec.md "What every package obeys" (a test exists only as the test of one entry, which names it by file and title), G32 must name the new title. It does not. The builder may not edit the ledger and says so in "For the orchestrator".
  - Failure scenario: a later step reads G32 to see which test covers the year read. It finds no row for the table, treats the table as an orphan test and deletes it, and the whole-number read loses its proof.
  - Verdict: none. This is a ledger booking for the orchestrator at landing: G32's Test line gains "reads a manifest's year given as %s, every row".

#### 2. Proof

- O127-report.md, "For the orchestrator": "No other reader of `year` changes."
  - What is wrong: `grep -rn -E "\.year\b" src` shows four more readers of `project.year` beside the boards' filter (`takes.ts:94`):
    - the website entry's `pub_date` (`src/lib/server/content/audit/website/papers.ts:99`)
    - the manifest form's value (`src/lib/state/forms/schema.ts:464`)
    - the board item's year (`src/lib/state/boards/board/items.ts:166`, read by `state.ts:51`)

    Each now takes a text year and drops a fraction or a negative one. The rerun over the 127 hub manifests prints `differing: 0`, so nothing changes in the hub today. The look on landing and the landing report rest on the report's list of what changes.
  - Failure scenario: a hub manifest at `published` with `year: '2025'` now gets `pub_date: 2025` in the website's publications on Write the website. A manifest with `year: 2025.5` loses its `pub_date`. Neither change is in the report's before-and-after, so the landing does not look at the website output or the form.
  - Verdict: none (the ruling covers the read; the report misstates its reach).
- O127-report.md, "For the orchestrator": "A text of many digits (`'99999999999999999999'`) reads as the number it spells, beyond a safe integer; the ruling sets no cap, and no manifest holds one. Not run."
  - What is wrong: the builder names a risk and does not run it (spec.md "The working rules": a risk you name is a task you own). The rerun shows the claim is false: `20 nines: 100000000000000000000` (not the number spelled) and `400 nines: Infinity`.
  - Failure scenario: the orchestrator accepts the edge as stated and does not see that the read can put Infinity on the wire.
  - Verdict: round item 1, with Behaviour 1.

#### 3. Standards

- O127-report.md, "Files changed" table and the DONE / NOT DONE row "Verify 1": "`src/lib/views/boards/focus/lanes/LaneCard.svelte` | 7 / 4 | 319" and "last line: `test:quick: 56.5 s; every command passed`"
  - What is wrong: spec.md "The working rules" requires every count to be taken after the last change, and spec.md "Report" requires each DONE row to quote the last line of the final run. After the round, `git diff 0e374c303 --numstat` gives LaneCard 9 / 6, and the final run of the list is the round's (`test:quick: 203.0 s`). The round's section has the right figures, but the first table and the DONE row still present the first build's figures as current.
  - Failure scenario: a reader who takes the DONE table as the proof of the landed tree quotes a run that predates normalise.ts's change.
  - Verdict: none.

#### 4. Behaviour

- src/lib/data/snapshot/normalise.ts:160-171:
  ```
  * A whole number: an integer of 0 or more, or a text of the digits 0 to 9 alone, read as the number
  * it spells. A fraction, a negative number, an empty text and a text with any other character,
  * spaces included, give none, and so do NaN and Infinity, which are not JSON-safe.
  */
  const wholeShape = z.union([
      z.number().int().min(0),
      z
          .string()
          .regex(/^[0-9]+$/)
          .transform(Number)
  ]);
  ```
  - What is wrong: the text branch's output is never checked.
    - A text of 309 or more digits gives `Infinity` (rerun: `400 nines: Infinity json {"y":null}`). That contradicts this doc comment and the file's head comment (normalise.ts:1-2, "the findings, all JSON-safe").
    - A text of more than 15 digits gives a rounded number, not "the number it spells" as round item 1's ruling says (rerun: `20 nines: 100000000000000000000`).
    - The two branches disagree: the number 1e20 gives none (`z.number().int()` refuses an unsafe integer: `1e20 false`), while the text of the same digits gives 1e20.

    The fix within the item is to pipe the transform through the number branch's shape, `.transform(Number).pipe(z.number().int().min(0))`. A text then reads exactly as the number written there does. The doc comment would then say a whole number up to the largest safe integer.
  - Failure scenario: a manifest at `published` with a long run of digits in `year` (a pasted identifier, say) draws a tag reading "Infinity" with tip "Year: Infinity". The JSON snapshot carries `year: null` for that project, so the server's model and the wire model differ.
  - Verdict: round item 1 violated.

### Declined to judge

- The drawn tags (C1, C2, C9 on screen, C10). The brief and spec.md "What every package obeys" leave them to the look on landing, and a reviewer runs no page.
- The header lines of my `npm run test:quick` run, the changed-file and test-file counts, were cut by `tail -25`, so I did not compare the report's "164 test file(s)". No decision rests on that count, and the list may not be run again.
- Whether a hub outside the workspace list, `~/.claude` and `~/.oculus` among them, holds a manifest `year` that reads differently. I did not read `~/.oculus` (the `connect/` rule), and `~/.claude` holds no project manifest the walk was asked to cover. The 127 manifests read give `differing: 0`.
- Whether the HELP.md:296 and :298 paragraphs merge cleanly with O126's line 295. That is the landing's merge, and it would take the other worktree's diff.

Reviewer usage: a86efa7addc7ea610, claude-opus-5-5, 193537 tokens, 44 tool uses, 9 min 40 s.

## Closed

- The first run's findings (Spec 1, Standards 1-2): closed in repair round 1, as the run over round 1 gives (round items 2-4 hold).
- Round 1, Behaviour 1 and Proof 2 (a text of digits past the largest safe integer read as a rounded number or Infinity): fixed at landing. `normalise.ts` pipes the text through the same `wholeNumber` shape as a number (`z.number().int().min(0)`), so a text reads exactly as the number written there does and a value past the largest safe integer gives none; the doc comment says so. A row 'a text of 20 digits, past the largest safe integer, as none' joins the table; it failed on the round's code (`expected 100000000000000000000 to be undefined`, 1 failed of 13) and passes after the fix (13 passed).
- Round 1, Spec 1 (G32's Test line): fixed at landing; `agents/guarded.md` G32 names "reads a manifest's year given as %s", every row.
- Round 1, Proof 1 (the report's reach of the year read): fixed at landing; the report names every reader of `project.year` (the boards' filter, the board item, the manifest form, the website entry's `pub_date`), with the hub's 127 manifests reading the same before and after.
- Round 1, Standards 1 (stale count and DONE row): fixed at landing in the report (LaneCard 9 / 6; the DONE row quotes the round's final run).
