# O163 report: the hub's portfolio deck written again

NOT done: item 8's proof (and with it C12) is red for one file. `tests/data/hubs/hub-portfolio.test.ts`, one of the 14 test files that read the demo hub, did not pass in any of four runs alone; every failure in every run is `Error: Test timed out in 5000ms.`, on different tests each run, with the machine's load average between 12 and 16. The other 13 files pass. The edit of item 8 itself is made, and every other item and case is done.

## Open items of the state file, verbatim

`orchestrator-state.md:216-220`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## The premises, checked on the tree before any change

- `test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`.
- Read in the hub's folder: `git status --short --untracked-files=all -- deck projects` run in `~/workspace/research-hub` printed nothing, `git log -1 --format=%h -- deck` printed `8cae4a30b`, `ls deck` printed `closing.md engine.md present.yml title.md transition.md`, `grep -n portfolio_deck .oculus/config.yml` printed `27:portfolio_deck: deck`.
- `git grep -n "engine.md\|transition.md" -- src tests docs config README.md ':!config/local.yml'` printed 21 lines, all in `tests/server/edit/deck/deck-acts.test.ts`.
- The item 7 grep printed 33 lines before the change: 21 in `deck-acts.test.ts`, 4 in `tests/data/sources/present.test.ts`, 3 in `tests/routes/edit/deck-slides.test.ts`, 2 in `tests/routes/edit/write-fixture.ts`, 2 in `tests/server/edit/deck/deck-edit.test.ts`, and `tests/fixtures/hubs/demo/deck/present.yml:1`.
- `find projects -path '*/present/present.yml' | wc -l` in the hub printed 25.
- Every premise reproduced. No case showed a rule of the brief to be wrong.

## The cases' first run, on the hub as it stands

Read with the case-run program (source under "The case-run program") in mode `base`, the hub's own deck files, under the filters `none`, `mine`, `submitted` and `nomatch`; each run exited 0.

- C1. `state ok, deck findings 0`, `snapshot findings 0` under all four filters. Holds on the unchanged hub as well.
- C2. Not met on the unchanged hub: three groups, `pillars: members 7`, `more: members 8`, `ideas: members 9`, 24 in all, and `research decks the groups do not hold: [projects/archive/failed/fed-faithful-ecg]`. The two `projects/archive/published/2026/` decks are members of `more`. `research projects 95, with a deck 25`.
- C3. Not met on the unchanged hub: `slides 22`, `order entries file:title.md, file:engine.md, group:pillars, summary:pillars, file:transition.md, group:more, summary:more, grid:ideas, file:closing.md`, `slide kinds {"title":1,"section":2,"project":14,"summary":2,"text":1,"grid":1,"closing":1}`: an engine slide (2), two summaries (10, 20), a transition slide (11) and a grid (21).
- C4. Not met on the unchanged hub: every member of `pillars` and `more` is named in `slides:`, so they stand in the `slides:` lists' order (`hccnet-revision, covert-applied, covert-theory, bttn-incident-af, raw-pls, btfno, bt-operator-theory`, then `bttd-source-eeg, dries-bttr-ecg, dongho-ecg-clustering, ...`), not in `deck_order`'s.
- C5. Not met on the unchanged hub: with `submitted`, `pillars kept 5`, `more kept 6`, `ideas kept 0`, `slides 18`, `filter bar line 2: 11 of 24 shown`.
- C6. Not met on the unchanged hub: with `nomatch`, `slides 7` (title, engine, two summaries, transition, grid, closing), `slide kinds {"title":1,"section":2,"summary":2,"grid":1,"closing":1}`, `filter bar line 2: 0 of 24 shown`, `deck findings 0`.
- C7. Not met on the unchanged hub: `title.md:4` is `legend: pillars` and `title.md:8` opens `{{pillars.count}} pillar projects and {{more.count}} more.`; the title slide's legend is `[hub:liver,hub:method,hub:heart,hub:brain]`, four domains.
- C8. Not met on the unchanged hub: `present.yml:1` is the comment `# Rules for what goes on a slide (a public artifact): ...`.
- C9. Not met on the unchanged hub: `present.yml:43` `- engine.md`, `:46` `- transition.md`, and the groups `pillars`, `more`, `ideas`.
- C10. The orchestrator's case at landing; on the unchanged hub `ls deck` prints the five files and `README.md:60` reads "A project's public slide is `present/main.md`".
- C11. The closing as it is today, `deck/closing.md:8`, sentence by sentence:
  - "Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline." Not true for every deck: "any one" has no referent on the 2-slide deck of C6, where no project is drawn; "the clinical motivation" does not hold for `btfno` and `bt-operator-theory` (PDE operator learning) or `quantum-tensor-fl`; "the data pipeline" does not hold for `quantum-tensor-fl`, whose card names a method and no data; "the optimization and theory" does not hold for `clinical-ai-eval-artifacts` (an evaluation protocol) or `fl-privacy-auditing` (an audit battery).
  - "Several are open to collaborators across computer science, psychology, and medicine." True (Axel's word, open item 708); kept.
- C12. On the unchanged tree `tests/fixtures/hubs/demo/deck/present.yml:1` is the "public artifact" comment (Read of the file).

## The cases on the built files

Read with the case-run program in mode `new` (the three drafted files of "Hub files" handed to the reader as drafts over the hub's own deck paths), each run after the last change to the drafts, each exited 0. Every state with Mine only on except the `none` run: `research projects 95, with a deck 25, mine 95`, and every member line prints `mine true`, so Mine only keeps all 25.

| Case | Result | Reading |
| --- | --- | --- |
| C1 | met on the reader side; the look at landing for the view | `state ok, deck findings 0` under `none`, `mine`, `submitted` and `nomatch` |
| C2 | met | `group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0`; `research decks the groups do not hold: []`; `held decks of no research project with a deck: []`; member lines include `dead-ends | failed | fed-faithful-ecg`, `projects/archive/published/2026/hccnet-fl/present` and `projects/archive/published/2026/dongho-ecg-clustering/present`; `research projects 95, with a deck 25`, so 70 have none, and the reader raises no finding for them (`deck findings 0`) |
| C3 | met | `order entries file:title.md, group:projects, file:closing.md`; `slides 27`; `slide kinds {"title":1,"project":14,"text":2,"idea":9,"closing":1}` (no section, summary or grid); the decks by slide, below |
| C4 | met | the order inside each category, below, equals O150's C4 list |
| C5 | met | `submitted`: `kept 11, count 11`, `slides 13`, `slide kinds {"title":1,"project":10,"text":1,"closing":1}`, the 11 decks below, legend `[hub:heart,hub:brain,hub:liver,hub:method]`, `filter bar line 2: 11 of 25 shown`; with Clear all (`mine`): `kept 25`, `slides 27`, `25 of 25 shown` |
| C6 | met | `nomatch`: `kept 0, count 0`, `slides 2`, `slide kinds {"title":1,"closing":1}`, title legend `[]`, `filter bar line 2: 0 of 25 shown`, `deck findings 0` |
| C7 | met | grep of `{{pillars.count}}`, `{{more.count}}` and `legend: pillars` over the drafted `title.md`: exit 1; the title slide's legend `[hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]`, seven domains each once; `deck findings 0` |
| C8 | met | `grep -n '^\s*#' present.yml` over the drafted file: no output, exit 1 |
| C9 | met | `grep -n -E 'engine\.md|transition\.md|pillars|more|ideas' present.yml title.md closing.md` over the drafts: no output, exit 1; the order entries above |
| C10 | the orchestrator's, at landing | after the copy and the two `rm`: `ls ~/workspace/research-hub/deck` prints `closing.md present.yml title.md`; `git -C ~/workspace/research-hub status --short -- deck` prints ` D deck/engine.md`, ` M deck/closing.md`, ` M deck/present.yml`, ` M deck/title.md`, ` D deck/transition.md`; `README.md:60` reads "A project's slide is `present/main.md`" |
| C11 | met | the closing slide's lede in every run reads `"Happy to go deeper on any of the research projects: the motivation, the method, or where it stands. Several are open to collaborators across computer science, psychology, and medicine."`, kicker `"Thank you"`, contact `"axel.faes@gmail.com"`; front matter equal to the hub's (`diff` of lines 1-6 printed nothing); each sentence read under "The closing, sentence by sentence" |
| C12 | partial | `head -2` of the fixture prints `deck:` and `    title: 'The demo hub, at a glance'`, no comment line; 13 of the 14 demo-reading test files pass, `hub-portfolio.test.ts` timed out in four runs alone (below) |

C3, the decks by slide (`none` run): 2 hccnet-fl, 3 dongho-ecg-clustering, 4 bttn-incident-af, 5 dries-bttr-ecg, 6 ward-bttr-crosssubject, 7 meseret-cirrhosis, 8 hccnet-revision, 9 bttd-source-eeg, 10 fed-multicellular-immune, 11 covert-theory, 12 raw-pls, 13 covert-applied, 14 ecg-readable-substrate, 15 ecg-af-fair, 16 bt-operator-theory, 17 btfno, 18 btd-autoencoder, 19 clinical-ai-eval-artifacts, 20 fl-privacy-auditing, 21 hccnet-fl-sweden, 22 quantum-tensor-fl, 23 ssm-longitudinal, 24 florank-personalization, 25 hccnet-pathology, 26 fed-faithful-ecg. Slide 1 is the title and 27 the closing. This is the brief's list, O150's with each slide number lowered by one.

C4, recomputed from `deck_order: [publications, other-outputs, in-review, in-flight, released, idea, dead-ends]` (`config/catalogs/vocab.yml:280`), the rows of `categories:` (`:271-277`; `publications` sorts by `[stage, year, title]`, the others by the board's stage then title), the stage order of `stages:` (`nascent, scoping, de-risking, exploring, ..., submitted, revision, accepted, ...`) and the manifests; the hub replaces none of them (see "Limitations"):

- publications, both `accepted`, both `year: 2026`, so by title: "Federate What Transfers ..." (`hccnet-fl`), "Which representation clusters? ..." (`dongho-ecg-clustering`).
- in-review, all `submitted`, by title: "An Interpretable Block-Term Tensor Network ..." (`bttn-incident-af`), "An interpretable tensor model ..." (`dries-bttr-ecg`), "Behavior-Supervised Alignment ..." (`ward-bttr-crosssubject`), "Competing-Risks Modelling ..." (`meseret-cirrhosis`), "HCCNet: ..." (`hccnet-revision`), "Jointly localized ..." (`bttd-source-eeg`), "Privacy-preserving federated tensor decomposition ..." (`fed-multicellular-immune`), "Private Coupled Descent ..." (`covert-theory`), "Registration-Free ..." (`raw-pls`), "When Masking Meets Sparsity ..." (`covert-applied`), "You Don't Need the Black Box ..." (`ecg-readable-substrate`).
- in-flight: `exploring` "ECG-AF (FAIR / Vandervoort)" (`ecg-af-fair`), then `revision` by title "A Generalization Separation ..." (`bt-operator-theory`), "MoBTE ..." (`btfno`).
- idea: `nascent` by title "BTD Autoencoder", "Clinical-AI Eval Artifacts", "FL Privacy Auditing", "HCCNet FL Network (Sweden)", "Quantum Tensor / Quantum FL", "SSM Longitudinal Imaging"; then `scoping` "FLoRank x HCCNet / Block-Term ...", "HCCNet Pathology Networks".
- dead-ends: "Faithfulness-Preserving Federated Learning for Interpretable ECG" (`fed-faithful-ecg`).
- No deck in no category. The reader's order (the member lines of the `none` run) is this order, and it equals O150's C4 list category by category.

C5, the 11 decks in order (`submitted` run): bttn-incident-af, dries-bttr-ecg, ward-bttr-crosssubject, meseret-cirrhosis, hccnet-revision, bttd-source-eeg, fed-multicellular-immune, covert-theory, raw-pls, covert-applied, ecg-readable-substrate; the brief's 11, in C4's in-review order.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. `deck/present.yml` | DONE | "Hub files"; the `yaml` parse below prints `{"deck":{"title":"Research projects"},"groups":{"projects":{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}},"order":["title.md",{"slides":"projects"},"closing.md"]}`; C8 grep exit 1 |
| 2. `deck/title.md` | DONE | parse prints `{"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}`; the lede checked under "Judgment calls" |
| 3. `deck/engine.md` removed | DONE (at landing) | "Hub files" names the removal; C9 grep over the three drafts exit 1; `order entries file:title.md, group:projects, file:closing.md` |
| 4. `deck/transition.md` removed | DONE (at landing) | same as item 3 |
| 5. `deck/closing.md` drafted again | DONE | "Hub files" and C11; `grep -c -F 'Several are open to collaborators across computer science, psychology, and medicine.' closing.md` printed `1`; `diff` of lines 1-6 against the hub's printed nothing |
| 6. The report carries the hub files | DONE | section "Hub files"; `tail -c1` of each draft gave `\n`, `tail -c2` gave `d \n` / `. \n` / `. \n` (one newline each) |
| 7. No other oculus file changes; the grep quoted | DONE | `git status --short` prints ` M tests/fixtures/hubs/demo/deck/present.yml` and `?? .scratch/migration/agents/reviews/O163-report.md`, nothing else; the grep under "The item 7 grep" |
| 8. The demo fixture's comment removed | NOT DONE (the edit is made; its proof is red for one file) | `git diff --numstat` prints `0`, `1`, `tests/fixtures/hubs/demo/deck/present.yml`; head before and after under "The demo fixture"; 13 of the 14 demo-reading files pass, `hub-portfolio.test.ts` timed out in four runs alone (below) |
| 9. Hub README line 60 | DONE (at landing) | "Hub files" gives the line before and after |
| Verify 1, ASCII gate over the report and the hub texts | DONE | the perl gate over the three drafts printed nothing, `perl exit 0`; over this report, the same perl form: no output, `perl exit 0` |
| Verify 2, the parses | DONE | the three `node -e` runs quoted under "The parses" |
| Verify 3, `git status --short` | DONE | prints ` M tests/fixtures/hubs/demo/deck/present.yml` and this report's path; the fixture line is item 8's write (see "Wrong in the brief") |
| Verify 4, `npm run test:quick` once | DONE | last line `test:quick: 51.8 s; every command passed` |
| Verify 5, the prose read | DONE | "The prose read" below |

The verify list (`npm run test:quick`) ran once, after the last change to an oculus file; `npm run diagrams` ran right before it and changed no tracked file (`git status --short` after it printed only the fixture line). No whole-suite command was run. Its lines:

```
test:quick: 1 changed file(s), from git since HEAD
test:quick: 10 test file(s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      ASCII gate (1.9 s)
ok      svelte-kit sync (3.6 s)
ok      vitest (21.3 s): Duration  7.92s (transform 2.63s, setup 0ms, import 5.25s, tests 2.44s, environment 0ms)
ok      svelte-check (36.3 s): 1793995400512 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (48.0 s): Duration  34.55s (transform 23.03s, setup 0ms, import 42.64s, tests 58.35s, environment 2ms)
test:quick: 51.8 s; every command passed
```

What the green run does not cover: it selected `tests/data/sources/present.test.ts` and nine source checks, none of which reads the demo deck; the demo deck's readers ran by name (below). It covers none of the hub texts, which the case-run program and the parses read.

### The demo fixture

`tests/fixtures/hubs/demo/deck/present.yml`, lines 1-3 before (Read of the file before the edit):

```
# Rules for what goes on a slide (a public artifact): public-safe only, every number real and matching the manuscript, never a null or negative result, no hedging (the slide's `tag` chip carries the status).
deck:
    title: 'The demo hub, at a glance'
```

After (`head -2`):

```
deck:
    title: 'The demo hub, at a glance'
```

`git diff` shows the one removed line and nothing else; the comment had no continuation line. `LC_ALL=C grep -n '[^ -~]'` over the file: exit 1.

### The test files that read the demo deck

`git grep -l "hubs/demo" -- tests` finds 8 files, of which 6 are test files; the demo hub is also reached through `DEMO_HUB` (`tests/fixtures/hubs/real-hub.ts:21`), `join(engineDir(), 'tests', 'fixtures', 'hubs', 'demo')` and `tests/fixtures/hubs/deck-hub.ts:49`, so the set was taken wider: `{ git grep -l -e "hubs/demo" -e "DEMO_HUB" -e "fixtures', 'hubs', 'demo'" -- tests; git grep -l -e "deck-hub" -e "hubs-fixture" -e "real-hub" -- tests; } | sort -u | grep "\.test\.ts$"`, 14 files. One `npx vitest run` of the 14 together, after the change:

```
 Test Files  5 failed | 9 passed (14)
      Tests  13 failed | 319 passed | 9 skipped (341)
```

All 13 failures were `Error: Test timed out in 5000ms.` (`grep -E "FAIL|Error:|..." | sort | uniq -c` printed `13 Error: Test timed out in 5000ms.` and no other error). Each of the five files was rerun alone:

```
tests/data/hubs/decks.test.ts exit 0 ::       Tests  2 passed (2)
tests/data/hubs/self.test.ts exit 0 ::       Tests  17 passed (17)
tests/routes/sessions/website.test.ts exit 0 ::       Tests  20 passed (20)
tests/server/root/watch/website-watch.test.ts exit 0 ::       Tests  1 passed (1)
```

`tests/data/hubs/hub-portfolio.test.ts`, a file the step does not change, timed out in every run alone, on different tests each time, each failure `Error: Test timed out in 5000ms.` and no assertion failure:

```
first rerun:   Tests  1 failed | 15 passed (16)   (the failure: "finds the page of an entry of the one hub that holds it and writes that hub's file (C6)")
second rerun:  Failed Tests 7, each "Error: Test timed out in 5000ms."
third rerun:   Tests  13 failed | 3 passed (16)   Duration  129.28s (... tests 125.53s ...)
fourth rerun:  Failed Tests 9, each "Error: Test timed out in 5000ms."   (uptime before: load averages: 12.27 12.70 10.64; after: 15.82 14.38 11.66)
```

It reads the demo hub, whose deck file the step changes by one comment line the YAML reader drops; no line of the change is read at run time as data. The ledger records the same file timing out under load at steps that did not reach it (`agents/briefs/O82-round1.md:28`, `agents/briefs/O132-round-1.md:8`, `agents/reviews/O105-report.md:1`, `agents/reviews/O124-report.md:269`, the last "with load near 15"). Its pass is not shown by any run of this step, so item 8's proof is red for this one file; `npm run test:quick` does not select it (its list above), so it needs a run of its own, `npx vitest run tests/data/hubs/hub-portfolio.test.ts`, at a quieter moment.

`uptime` during these runs printed `load averages: 14.19 12.21 9.22` on 11 cores, and `ps -Ao pid,pcpu,... -r` showed a `vitest run` of the `migration-O162` worktree, a `vite dev` at 105% and Microsoft Defender at 154% beside them.

### The parses

Typed on the command line in the worktree; each typed text was checked equal to the scratch file before the copy was removed (`node -e "process.stdout.write(...)" | diff - present.yml` printed `present.yml typed text equals the scratch file`; the front-matter lines of `title.md` and `closing.md` likewise printed `title.md front matter equal` and `closing.md front matter equal`).

```
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse(\"deck:\n    title: 'Research projects'\n\ngroups:\n    projects:\n        find: { folders: [projects/**/present], tiers: [research] }\n        discover: true\n\norder:\n    - title.md\n    - { slides: projects }\n    - closing.md\n\")))"
{"deck":{"title":"Research projects"},"groups":{"projects":{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}},"order":["title.md",{"slides":"projects"},"closing.md"]}
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse('kind: title\nkicker: Research portfolio | technical briefing\nlegend: projects\n')))"
{"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
$ node -e "const Y=require('yaml'); console.log(JSON.stringify(Y.parse('kind: closing\nkicker: Thank you\ncontact: axel.faes@gmail.com\n')))"
{"kind":"closing","kicker":"Thank you","contact":"axel.faes@gmail.com"}
```

### The item 7 grep

After the change, `git grep -n -F -e 'engine.md' -e 'transition.md' -e '{{pillars.count}}' -e '{{more.count}}' -e 'legend: pillars' -e 'legend: more' -e 'slides: pillars' -e 'slides: more' -e 'slides: ideas' -e 'of: pillars' -e 'of: more' -e 'of: ideas' -e 'public artifact' -- src tests docs config README.md ':!config/local.yml' | cut -d: -f1 | sort | uniq -c`:

```
   4 tests/data/sources/present.test.ts
   3 tests/routes/edit/deck-slides.test.ts
   2 tests/routes/edit/write-fixture.ts
  21 tests/server/edit/deck/deck-acts.test.ts
   2 tests/server/edit/deck/deck-edit.test.ts
```

32 lines: the 33 before the change less the demo comment. Each hit, and whether the change makes it false:

- `tests/server/edit/deck/deck-acts.test.ts:29-341`, 21 lines: a synthetic deck `talk` the test writes into a temporary target (`:29` `PRESENT`, `:37-39` `writeFileSync`), with its own `engine.md`. It reads no hub deck. Not made false.
- `tests/data/sources/present.test.ts:164,165,170,174`: a synthetic hub whose `deck/present.yml` and `deck/title.md` the test plants (`:154-175`). Not made false.
- `tests/routes/edit/deck-slides.test.ts:199,235,236`: expected texts of a write over the synthetic deck of `write-fixture.ts`. Not made false.
- `tests/routes/edit/write-fixture.ts:264,266`: the fixture's own YAML text with groups `pillars` and `more`. Not made false.
- `tests/server/edit/deck/deck-edit.test.ts:31,32`: the test's own YAML text. Not made false.
- `tests/fixtures/hubs/demo/deck/present.yml:1`: removed by item 8.

`git grep -n -F -e 'public artifact' -e 'Rules for what goes on a slide' -- src tests docs config README.md ':!config/local.yml'` after the change: no output, `grep exit 1`.

## Hub files

The orchestrator writes these into `~/workspace/research-hub/` at landing; each file ends in one newline after its last line.

`deck/present.yml`:

```yaml
deck:
    title: 'Research projects'

groups:
    projects:
        find: { folders: [projects/**/present], tiers: [research] }
        discover: true

order:
    - title.md
    - { slides: projects }
    - closing.md
```

`deck/title.md`:

```markdown
---
kind: title
kicker: Research portfolio | technical briefing
legend: projects
---
# Research projects

Research projects that have a deck of their own, each in its own slides.
```

`deck/closing.md`:

```markdown
---
kind: closing
kicker: Thank you
contact: axel.faes@gmail.com
---
# Questions &amp;<br>collaborations welcome

Happy to go deeper on any of the research projects: the motivation, the method, or where it stands. Several are open to collaborators across computer science, psychology, and medicine.
```

`deck/engine.md`: removed (`rm ~/workspace/research-hub/deck/engine.md`).

`deck/transition.md`: removed (`rm ~/workspace/research-hub/deck/transition.md`).

`diff` of the drafted `closing.md` against the hub's:

```
8c8
< Happy to go deeper on any one: the clinical motivation, the optimization and theory, or the data pipeline. Several are open to collaborators across computer science, psychology, and medicine.
---
> Happy to go deeper on any of the research projects: the motivation, the method, or where it stands. Several are open to collaborators across computer science, psychology, and medicine.
```

The hub `README.md:60`, before:

```
- **What to edit when a project changes or is added.** Per-project content lives in `projects/<project>/` (`project.yml` + an optional `present/` deck), and oculus reads the rest from the manifests. A project's public slide is `present/main.md` (`kind: project`), its equation the `equation:` LaTeX of that slide, and the portfolio deck is the hub's `deck/` folder, drawn by oculus's Present view.
```

After:

```
- **What to edit when a project changes or is added.** Per-project content lives in `projects/<project>/` (`project.yml` + an optional `present/` deck), and oculus reads the rest from the manifests. A project's slide is `present/main.md` (`kind: project`), its equation the `equation:` LaTeX of that slide, and the portfolio deck is the hub's `deck/` folder, drawn by oculus's Present view.
```

### The closing, sentence by sentence (C11)

- The heading, "Questions &amp;<br>collaborations welcome" (the hub's, unchanged): an invitation; it names no count, no project and no claim about a deck, so it holds on the 27-slide deck, the 13-slide deck of C5 and the 2-slide deck of C6.
- "Happy to go deeper on any of the research projects: the motivation, the method, or where it stands."
  - "the research projects" names the research projects the deck is titled after (`deck.title: 'Research projects'`), not the slides on screen, so it holds while a filter shows none (C6) and once more research projects have decks. It names no count.
  - "the motivation": each of the 25 is a research project with a reason to be done. On the decks: all 14 project slides carry `hook:` and 9 of them `eli5: { purpose }` (the field scan of the 25 `main.md` files); both text slides (`fed-faithful-ecg`, `ecg-readable-substrate`) carry "## Why it matters / what's next" (`main.md:17` of each); each idea card's `desc:` names what the project builds or tests (for example `btd-autoencoder`: "for sparse scRNA-seq denoising", `fl-privacy-auditing`: "for deployed federated and DP clinical models"). Some cards state no motivation, `quantum-tensor-fl`'s most plainly ("Exploratory: quantum-inspired tensor networks or quantum federated learning, after a novelty check"); the sentence offers to talk about a project's motivation, which the project has, and does not say the slide states it, so it holds there too.
  - "the method": the 14 project slides each carry a Method list (`method 3` on each project line of the case run); both text slides carry "## The idea / method" (`main.md:11` of each); each idea card's `desc:` names its method or candidate methods.
  - "where it stands": each member has a stage (the member lines print `accepted`, `submitted`, `exploring`, `revision`, `nascent`, `scoping`, `failed`), drawn on the slide's facts strip, `failed` included (`docs/decks.md:387`).
  - Its words are Axel's ("Happy to go deeper on any", "the motivation", "or") with "one" made "of the research projects", "clinical" dropped, and the two items that not every project backs ("the optimization and theory", "the data pipeline") replaced by "the method" and "where it stands".
- "Several are open to collaborators across computer science, psychology, and medicine." Kept word for word (`grep -c -F` printed `1`); "Several" now reads as several of the research projects the sentence before names, which is Axel's statement, ruled true (open item 708).

## Every user-visible change, for the look

All in the Present view with no deck named (the portfolio deck), Mine only on, after the copy at landing.

- C1: Findings shows no deck finding and no finding on `deck/present.yml`, `deck/title.md` or `deck/closing.md`. Before: none either.
- C3: the Overview shows 27 slides: the title, the 25 decks one slide each in the order of C3, the closing. Before: 22 slides with an engine slide (2), two summaries (10, 20), a transition slide (11) and an idea grid (21).
- The title slide: kicker "Research portfolio | technical briefing" (before: "... | June 2026"), heading "Research projects" (before: "Structured models, everywhere they hide" on two lines), lede "Research projects that have a deck of their own, each in its own slides." (before: the "7 pillar projects and 8 more. A shared thesis: ..." lede), legend of seven domains in the order liver, heart, brain, method, meta, privacy, liverfl (before: liver, method, heart, brain).
- The closing slide: the lede reads the new first sentence; heading, kicker, contact unchanged.
- The tab and the Overview heading read "Research projects" (before: "Structured models, everywhere they hide").
- C5: pick the stage `submitted` in the filter bar: 13 slides (title, the 11 in-review decks, closing), the legend heart, brain, liver, method, line 2 "11 of 25 shown". Clear all: 27 slides again.
- C6: type in the search a word no project holds: 2 slides (title, closing), an empty legend, line 2 "0 of 25 shown", no finding.
- The `fed-faithful-ecg` deck (stage `failed`) is drawn as slide 26, its text slide, with `failed` on its facts strip. Before: not in the deck.
- The demo fixture change shows nowhere: it removes a YAML comment, which the reader does not read.

The "line 2" strings above are what the case-run program computes from the group's held and kept members (`${kept} of ${held.size} shown`); the view's own words are the look's to confirm.

## Judgment calls the brief left open

- The closing's first sentence is the draft above; the alternative closest to Axel's words that holds for every deck. The orchestrator or Axel may reword it.
- The title's lede, checked on the hub as it stands: "Research projects": every member line prints tier `research`, and `held decks of no research project with a deck: []`; "that have a deck of their own": every member path ends in `/present` and `research decks the groups do not hold: []`; "each in its own slides": slides 2 to 26 each carry one project key, `quantum-tensor-fl` being slide 22, its own idea card. Holds for all 25 and under any filter.
- The case-run program reads the drafts over the hub's own paths in place of a scratch copy of the whole `deck/` folder, as O150's did: the reader takes a draft's text in place of a file's, so the glob runs over the real `projects/` and nothing is written in the hub. `engine.md` and `transition.md` stay on disk during the run; no order entry names them, so the reader does not read them.
- The demo readers were taken as every test that reaches the demo hub by any route, 14 files, wider than the brief's `git grep -l "hubs/demo"` (6 test files).

## Wrong in the brief

- "The report's files changed ... (the report only, since no oculus file changes)" (Report section) and verify 3 ("prints nothing outside the ledger") contradict item 8, which changes `tests/fixtures/hubs/demo/deck/present.yml`. `git status --short` prints that file; the files table below lists it.
- `git grep -l "hubs/demo" -- tests` does not find every test that reads the demo deck: `tests/fixtures/hubs/deck-hub.ts:49` reaches it as `join(import.meta.dirname, 'demo')`, and `DEMO_HUB` users reach it through `real-hub.ts:21`. The wider set was run.

## The prose read of the hub files (verify 5)

- `present.yml`: `deck.title: 'Research projects'`, a name; no sentence.
- `title.md`: the kicker "Research portfolio | technical briefing" uses ` | ` as a separator, as the rules file's character set allows. The heading is a name. The lede "Research projects that have a deck of their own, each in its own slides." is a noun phrase with no main verb; it is O150's text, which item 2 fixes, so it is kept; a departure from full sentences, named here.
- `closing.md`: the heading "Questions &amp;<br>collaborations welcome" is a headline phrase and the hub's own; kept. "Happy to go deeper ..." has no subject, as Axel's sentence had; it is no flourish or fragment for emphasis, so it is kept. The second sentence is Axel's, word for word. No em dash, no quip, no "not X but Y", ASCII only (the perl gate printed nothing).

## The case-run program

Run as `node cases.ts <base|new> <scratch deck folder|-> <none|mine|submitted|nomatch>` from the session scratchpad folder `o163`. It only prints; it reads the hub read only and writes nothing. The program, its outputs and the scratch drafts are removed before this report: `rm -rf` of the folder `o163` and `rmdir` of an empty `o163-deck`, then `ls <scratchpad> | grep -E '^o163'` printed nothing (exit 1). The `mode new, filter ...` lines below shorten the run's first line after the filter word.

```ts
// Case-run program of O163. It only prints. It reads the research hub read only, builds its
// projects as the integrity test does, and reads the portfolio deck through oculus's deck reader,
// either as the hub's files stand (mode base) or with the text of the three files in the scratch
// folder handed in as an editor's drafts over the hub's own deck paths (mode new). The third
// argument narrows the read as the filter bar does: none (no keep set), mine (Mine only), submitted
// (Mine only and the stage submitted) or nomatch (Mine only and a search no project holds, an empty
// keep set).
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O163';
const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
const { buildOneHub } = await import(`${W}/tests/fixtures/hubs/hub-build.ts`);
const { mergeHubs } = await import(`${W}/src/lib/data/snapshot/hubs/merge.ts`);
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { deckReader } = await import(`${W}/src/lib/data/sources/documents/decks.ts`);
const { deckOrderOf } = await import(`${W}/src/lib/data/shapes/boards/order.ts`);
const { categoryOf } = await import(`${W}/src/lib/data/shapes/boards/categories.ts`);
const { ofHub, keyOf } = await import(`${W}/src/lib/data/helpers/hub-names.ts`);
const { isMine, rolesOf } = await import(`${W}/src/lib/data/shapes/boards/roles.ts`);
const { projectPeople } = await import(`${W}/src/lib/data/shapes/boards/takes.ts`);

const [mode, scratch, filter] = process.argv.slice(2);
const HUB = '/Users/axelfaes/workspace/research-hub';
const merged = loadConfig(engineDir(), { hub: HUB }).config;
const config = portfolioConfigFrom(merged);
const snapshot = buildOneHub(HUB, config).snapshot;
const projects = Object.values(
    mergeHubs([{ key: 'hub', snapshot, files: config.registries }], textCatalog(merged), 0).entities
        .projects
) as any[];
const order = deckOrderOf(merged);
const byFolder = new Map(projects.map((p) => [p.folder, p]));
const roles = rolesOf(merged);
const mine = (p: any) => isMine(projectPeople(p), roles, (id: string) => keyOf(id) === 'axel-faes');

const drafts = new Map<string, string>();
if (mode === 'new') {
    for (const file of ['present.yml', 'title.md', 'closing.md']) {
        const at = realpathSync(join(HUB, config.portfolioDeck, file));
        drafts.set(at, readFileSync(join(scratch, file), 'utf8'));
    }
}
const own = ofHub(projects, 'hub') as any[];
let keep: Set<string> | undefined;
if (filter === 'mine') keep = new Set(own.filter(mine).map((p) => p.id));
if (filter === 'submitted') keep = new Set(own.filter((p) => mine(p) && p.stage === 'submitted').map((p) => p.id));
if (filter === 'nomatch') keep = new Set();
const words = { record: () => undefined, vocab: merged, catalog: textCatalog(merged) };
const hub = { key: 'hub', dir: HUB, config };
const deck = deckReader({ hub, projects, words, drafts, ...(keep ? { keep } : {}) }).read(
    { key: 'hub', dir: HUB },
    config.portfolioDeck
);

const research = projects.filter((p) => p.tier === 'research');
console.log(`mode ${mode}, filter ${filter}, portfolio_deck ${config.portfolioDeck}, title ${JSON.stringify(deck.title)}`);
console.log(`snapshot findings ${snapshot.findings.length}`);
console.log(`research projects ${research.length}, with a deck ${research.filter((p) => p.deck !== undefined).length}, mine ${research.filter(mine).length}`);
console.log(`state ${deck.state}, deck findings ${deck.findings.length}`);
for (const f of deck.findings) console.log(`  deck finding ${JSON.stringify(f)}`);
console.log(`order entries ${deck.order.map((e: any) => `${e.kind}:${e.name}`).join(', ')}`);
const held = new Set<string>();
let kept = 0;
for (const group of deck.groups) {
    console.log(`group ${group.name}: members ${group.members.length}, kept ${group.members.filter((m: any) => m.kept).length}, count ${group.count}, missing [${group.missing}], conflicts ${group.conflicts.length}, candidates ${group.candidates.length}`);
    for (const m of group.members) {
        held.add(m.path);
        if (!m.kept) continue;
        kept += 1;
        const p = byFolder.get(dirname(m.path));
        const cat = p === undefined ? '-' : (categoryOf(p, order.categories, order.vocab)?.key ?? 'none');
        console.log(`  ${cat} | ${p?.stage} | ${m.name} | ${p?.tier} | mine ${p === undefined ? '-' : mine(p)} | ${m.path} | ${p?.title}`);
    }
}
console.log(`filter bar line 2: ${keep === undefined ? `${held.size} projects` : `${kept} of ${held.size} shown`}`);
const withDeck = research.filter((p) => p.deck !== undefined).map((p) => p.folder);
const found = new Set(deck.groups.flatMap((g: any) => g.members.map((m: any) => dirname(m.path))));
console.log(`research decks the groups do not hold: [${withDeck.filter((f) => !found.has(f))}]`);
console.log(`held decks of no research project with a deck: [${[...found].filter((f) => !withDeck.includes(f))}]`);
console.log(`slides ${deck.slides.length}`);
for (const [i, s] of deck.slides.entries()) {
    const who = s.project === undefined ? '(deck)' : s.project;
    if (s.kind === 'title' || s.kind === 'section' || s.kind === 'closing') {
        console.log(`  slide ${i + 1} ${who} ${s.kind} heading ${JSON.stringify(s.heading)} legend [${s.legend}]`);
        console.log(`    lede ${JSON.stringify(s.lede)}`);
        if ('kicker' in s) console.log(`    kicker ${JSON.stringify(s.kicker)}`);
        if ('contact' in s) console.log(`    contact ${JSON.stringify(s.contact)}`);
    } else {
        const one = s.slide ?? {};
        const method = Array.isArray(one.method) ? one.method.length : 0;
        const desc = typeof one.desc === 'string' && one.desc !== '' ? 'desc' : '-';
        console.log(`  slide ${i + 1} ${who} ${s.kind} method ${method} ${desc}`);
    }
}
console.log(`slide kinds ${JSON.stringify(deck.slides.reduce((a: any, s: any) => ({ ...a, [s.kind]: (a[s.kind] ?? 0) + 1 }), {}))}`);
```

The `new` runs' lines the cases cite, from the four runs after the last change to the drafts:

```
mode new, filter none, portfolio_deck deck, title "Research projects"
state ok, deck findings 0
group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0
filter bar line 2: 25 projects
research decks the groups do not hold: []
held decks of no research project with a deck: []
slides 27
  slide 1 (deck) title heading "Research projects" legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]
    lede "Research projects that have a deck of their own, each in its own slides."
    lede "Happy to go deeper on any of the research projects: the motivation, the method, or where it stands. Several are open to collaborators across computer science, psychology, and medicine."
slide kinds {"title":1,"project":14,"text":2,"idea":9,"closing":1}
mode new, filter mine, ...
group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0
filter bar line 2: 25 of 25 shown
slides 27
mode new, filter submitted, ...
state ok, deck findings 0
group projects: members 25, kept 11, count 11, missing [], conflicts 0, candidates 0
filter bar line 2: 11 of 25 shown
slides 13
  slide 1 (deck) title heading "Research projects" legend [hub:heart,hub:brain,hub:liver,hub:method]
slide kinds {"title":1,"project":10,"text":1,"closing":1}
mode new, filter nomatch, ...
state ok, deck findings 0
group projects: members 25, kept 0, count 0, missing [], conflicts 0, candidates 0
filter bar line 2: 0 of 25 shown
slides 2
  slide 1 (deck) title heading "Research projects" legend []
slide kinds {"title":1,"closing":1}
```

Every run printed `snapshot findings 0` and `research projects 95, with a deck 25, mine 95`.

## Files changed

From `git status --short` and `git diff --numstat` in the worktree (no base copy is named by the brief):

| Path | Lines | In the write list |
| --- | --- | --- |
| `tests/fixtures/hubs/demo/deck/present.yml` | 0 added, 1 removed (14 to 13 lines, `wc -l` prints 13) | yes (item 8) |
| `.scratch/migration/agents/reviews/O163-report.md` | this report | yes |

The step adds or changes no test.

The step adds and changes no comment line of code and no test title, so the history-word grep of `agents/spec.md:44` has no line to read. The verify list ran once; the whole list was not run again, since its one run was green.

`sh utils/unused-exports.sh` was not run: the step changes no source file and adds no export.

## Limitations and sharp edges

- The case-run program's `snapshot findings 0` is the snapshot of the hub as it stands on disk: `buildOneHub` reads the files, not the drafts. The deck's own findings (`deck findings 0`) are of the drafts. Whether the copied files raise a snapshot finding is the landing's `npx vitest run tests/checks/config/integrity.test.ts` and C1's look.
- The filter-bar line 2 strings are the program's computation, not the view's text.
- `tests/data/hubs/hub-portfolio.test.ts` timed out under the machine's load, on different tests in different runs (see above); no assertion of it failed in any run.
- The order of the 25 decks rests on `deck_order` and the categories of `config/catalogs/vocab.yml:271-280`; `grep -rln -e "deck_order" -e "^categories:" .oculus/config.yml .oculus/data .oculus/workspaces` in the hub printed nothing (exit 1), so the hub replaces neither. A hub that later sets either changes the order of C3.

Usage: builder a298e389ab9f210ac (claude-opus-5-5), 255823 tokens, 100 tool uses, 25.4 min.
