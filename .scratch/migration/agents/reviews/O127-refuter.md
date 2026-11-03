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
