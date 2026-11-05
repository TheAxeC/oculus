# Step O150 refuter report (on the research hub's deck/, base e0d231cb0)

## Verification (rerun by the reviewer)

Verify 1, 2 and 4, from the hub's root:

```
$ cd ~/workspace/research-hub; python3 -c "import yaml; yaml.safe_load(open('deck/present.yml'))"; echo "exit $?"
exit 0
$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' deck/present.yml deck/title.md; echo "exit $?"
exit 0
$ git status --short deck; echo "exit $?"
 M deck/present.yml
 M deck/title.md
 D deck/transition.md
exit 0
```

C4, the whole status, set against the report's `O150-status-before.txt` (5 lines: ` M .oculus/data/academic/funding.yml`, ` M funding/2026-fwo-senior-transplant/RESEARCHQUESTIONS.md`, three `??` paths under `funding/2026-fwo-senior-transplant/proposal/proposal/`):

```
$ git status --short
 M .oculus/data/academic/funding.yml
 M deck/present.yml
 M deck/title.md
 D deck/transition.md
 M funding/2026-fwo-senior-transplant/RESEARCHQUESTIONS.md
?? funding/2026-fwo-senior-transplant/proposal/proposal/figs/fig-concept.tex.block-manifest.json
?? funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md.block-manifest.json
?? funding/2026-fwo-senior-transplant/proposal/proposal/reviews/
```

The step's oculus worktree:

```
$ cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O150 && git status --short; echo "exit $?"; git diff 81bda1d59 --stat; echo "exit $?"
exit 0
exit 0
```

Verify 3, from `/Users/axelfaes/workspace/oculus`. The output went to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O150-refuter-integrity.txt`. That is a new file of the reviewer's own, the only file the review wrote. The lines below are verbatim, with the check mark glyph written as `<check mark>`:

```
$ OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose > .../O150-refuter-integrity.txt 2>&1; echo "exit $?"
exit 0
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings 1161ms
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > reads a deck out of every project that has a present/ folder, with no finding 197ms
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found 56ms
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

The report's scratchpad files:

```
$ diff O150-glob.txt O150-manifests.txt; echo "diff exit $?"
diff exit 0
```

Each file holds 25 lines, in this order: `projects/archive/failed/fed-faithful-ecg`, `projects/archive/published/2026/dongho-ecg-clustering`, `projects/archive/published/2026/hccnet-fl`, the nine `projects/ideas/*`, then the thirteen `projects/manuscripts/*`.

Independent manifest enumeration. Python over `projects/**/project.yml`, with `code/` left out, read with `yaml.safe_load`, keeping `tier: research`:

```
research manifests 95
depths Counter({2: 54, 4: 32, 3: 9})
with deck 25
stages Counter({'submitted': 11, 'nascent': 6, 'accepted': 2, 'scoping': 2, 'revision': 2, 'failed': 1, 'exploring': 1})
submitted 11
domains of 25 ['brain', 'heart', 'liver', 'liverfl', 'meta', 'method', 'privacy']
domains of old pillars ['brain', 'heart', 'liver', 'method']
basename repeats []
coauthor with deck []
$ find projects -type d -name present | wc -l
      25
(no "no present.yml" line printed)
```

The deck reader run directly. `node --input-type=module -e` from oculus imports `createReader` (`src/lib/data/sources/deck/read.ts`), `loadConfig`, `portfolioConfigFrom` and `hubDomainsOf`. Its projects are built from the hub's manifests, and it reads `deck` as `readDeck` in `integrity.test.ts:103-114` does. It prints to stdout only:

```
ms 79 state ok findings []
slides 28
groups [{"name":"research","count":25,"missing":[],"n":25}]
1 title  Structured models, everywhere they hide
2 section  The common engine: rank-(L,L,1) block-term decomposition
3 text  Keeping Federated Glass-Box ECG Models Honest
4 project  Which ECG representation actually lets clustering find rhyth
5 project  Training one liver-cancer model across hospitals, sharing on
6 idea  BTD Autoencoder
... 7 to 14 idea ...
15 project  Why block-term operators generalize: a predictive inductive-
... 16 to 27 (22 text, the rest project) ...
28 closing  Questions & collaborations welcome
title legend ["heart","liver","method","meta","privacy","liverfl","brain"] findings 0
```

The same read, with the members' paths compared against the manifest list:

```
$ node ... | diff - .../O150-manifests.txt; echo "diff exit $?"
diff exit 0
```

The same read with `keep` set to the 11 research projects at stage `submitted`:

```
filtered slides 14 count 11 kept 11 of 25 findings 0
```

The first run, reproduced with the same reader on the look's hub copy (`<scratchpad>/O138look/home/workspace/research-hub`). Its `deck/present.yml`, `transition.md`, `engine.md` and `closing.md` each equal `git show e0d231cb0:deck/<file>`:

```
portfolioDeck deck state ok slides 22 findings 0
[["pillars",7,7],["more",8,8],["ideas",9,9]]
distinct members 24 fed-faithful-ecg member false
title legend ["liver","method","heart","brain"]
filtered slides 18 [["pillars",5,5],["more",6,6],["ideas",0,0]]
```

The look copy against the backup and the hub's base:

```
$ diff -r $S/O150-deck-backup $C/deck; echo "diff backup-copy exit $?"
diff backup-copy exit 0
present.yml equals base / title.md differs from base / transition.md equals base / closing.md equals base / engine.md equals base
$ git show e0d231cb0:deck/title.md | diff - $C/deck/title.md
3c3
< kicker: Research portfolio | technical briefing | June 2026
---
> kicker: Research portfolio | technical briefing
$ find $C/projects -name present.yml -path '*/present/*' | wc -l
      25
```

Decision 4's read cost, timed with Node `fs.globSync` in the hub, two runs:

```
starstar 25 1316ms three 25 26ms same true
starstar 25 1094ms three 25 30ms same true
```

Name greps. The report's `git grep` is not run (see Declined). The plain-grep form over the hub's text files:

```
$ grep -rn -E --exclude=local.yml --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=code --exclude-dir=.venv --exclude-dir=venv '\{\{ *(pillars|more)\.count *\}\}|transition\.md|slides: *(pillars|more|ideas)|legend: *(pillars|more|ideas)|of: *(pillars|more|ideas)\b' --include='*.md' --include='*.yml' --include='*.yaml' --include='*.txt' . ; echo "exit $?"
exit 1
$ grep -rn -i -E ... 'portfolio deck|deck/present|deck/title|pillar projects|wider portfolio|idea pipeline|same backbone' ... . | grep -v '^./projects/'
./.oculus/config.yml:26:# The portfolio deck: the folder, relative to the hub, whose present.yml and Markdown slides the Present view opens when a pane names no deck. ...
./README.md:60:- **What to edit when a project changes or is added.** ... and the portfolio deck is the hub's `deck/` folder, drawn by oculus's Present view.
```

The oculus grep over `src config docs README.md tests` (`--exclude=local.yml`), for the old group names, `transition.md`, `{{pillars.count}}`, `{{more.count}}` and "portfolio deck". Its hits are generic statements about the portfolio deck (`config/defaults/sources.yml:24`, `config/options/sources.yml:10`, `docs/HELP.md:331`, state and data head comments) and synthetic fixtures (`tests/server/core/changes.test.ts:439-454`, `tests/server/edit/deck/deck-edit.test.ts:31-32`, `tests/data/sources/present.test.ts:156-166`, `tests/routes/edit/write-fixture.ts:264-266`), plus the template example at `docs/templates.md:1926`. The change makes none of them false.

## Verdicts

Items of "What to build":
- 1, `deck/present.yml`: holds. `deck/present.yml:5-15` has one group, `research`, with the three globs, `tiers: [research]`, `discover: true`, `sort: folder` and no `slides:`. The order is `title.md`, `engine.md`, `{ slides: research }`, `closing.md`. `deck:` and the comment line are unchanged.
- 2, `deck/title.md`: holds. The diff changes only `:4` (`legend: research`) and `:8` (the two counts removed, the sentence from "A shared thesis:" on unchanged).
- 3, `deck/transition.md` deleted: holds.
- 4, the deck read with no finding: holds for the reader (Verify 3 green, and the direct read prints `state ok findings []`). The Present view half is under Declined.

Cases:
- C1: met. The reader's 25 members equal the manifest enumeration by path (`diff exit 0`), in folder order, with `archive/failed/fed-faithful-ecg` first (slide 3). The group count is 25 and the deck holds 28 slides. The Overview half is under Declined. See P1 for the report's own evidence of this case.
- C2: met, as the brief's checks define it: the integrity run is green, and the reader gives no finding of the deck or of any member. See P2.
- C3: met by count. With the 11 submitted projects kept, 11 of 25 members are kept and the deck holds 14 slides, the 11 between engine and closing. The toolbar text is under Declined.
- C4: met. The status equals `O150-status-before.txt` plus the three deck lines.
- C5: met by reading. `projects/coauthor/published/<year>/<p>/present` matches `projects/*/*/*/*/present`. `under` globs under the deck's root (`read.ts:259-286`). `name_twice` is at `groups.ts:93-106`. The 95 research basenames hold no repeat, and no coauthor project has a deck today.

## 1. Spec

none

## 2. Proof

- P1. Place: `O150-report.md:30` (C1).
  - Hunk: "25 members, equal by path to the manifest enumeration (`diff O150-glob.txt O150-manifests.txt` prints nothing, 25 lines)".
  - What is wrong: the report quotes neither of the commands that produced `O150-glob.txt` and `O150-manifests.txt`. By its name, the first is a glob listing, which is the circular comparison the brief check rejected (`O150-brief-check.md:166`). The brief's C1 compares the manifests "by name with the Overview's members". The report gives the Overview only as a count ("research 25") and positions by category, with one slide named.
  - Failure scenario: a reader who reruns the case cannot rebuild either file. If the glob file came from `fs.globSync` over the group's own globs, a deck the reader drops (a tier or projectOf mismatch) would still pass the diff.
  - The membership itself holds: the reviewer's reader run equals the manifest list (`diff exit 0`, Verification).
- P2. Place: `O150-report.md:31` against `O150-report.md:53`.
  - Hunks: "the Findings view of the scratch oculus (164 findings) lists none on a deck file or a `present.yml`", and "Member decks' slides show "Too tall" marks in the Overview (fed-faithful-ecg, dongho-ecg-clustering among them)".
  - What is wrong: a slide the Present view measures too tall becomes a finding at the slide's source file and line (`src/lib/state/life/present.svelte.ts:502-509`, `file = joinPath(dir, one.source.path)`). The Findings view lists it ("listed under Findings as "slide too tall"", `docs/HELP.md:331`). The marks the report saw therefore put rows on member deck files (`projects/.../present/main.md`) into the Findings view while the deck is drawn. Line 31's "none on a deck file" contradicts line 53, unless the Findings view was read before the Overview measured. The report does not say which.
  - Failure scenario: the orchestrator reads C2 as "no finding anywhere in the drawn deck" and books it. The Findings view on landing then shows too-tall rows on member decks, and the step's evidence has no explanation for them.
- P3. Place: `O150-report.md:59`.
  - Hunk: "The nine idea decks: cards of the grid (and slides of `ideas` members), to slides of their own in the run."
  - What is wrong: the base order (`git show e0d231cb0:deck/present.yml:41-54`) has no `{ slides: ideas }` entry. The base deck drew the `ideas` members only as cards of the grid. The reader on the base deck gives 22 slides: title, engine, 7, summary, transition, 8, summary, grid, closing.
  - Failure scenario: the look on landing compares against a "before" in which idea slides already existed, and so misses that the nine `kind: idea` full slides are new to the deck.
- P4. Place: `O150-report.md:52`, and `choices.md:6049` (the decision's booking).
  - Hunks: "Dropping the summaries and the grid rests on a judgment that a slide of 25 rows overflows the frame; it was not measured." and, in `choices.md:6049`, "a summary or a grid of every research project is one slide with a row per project (25 today, about 95 after O151), far past the frame".
  - What is wrong: decision 2 removes three slides Axel had. It rests on an overflow nobody measured, and the booking Axel reviews states that overflow as a fact ("far past the frame"). The look had O146's measure on hand: a summary of `research` placed in the scratch deck would have been marked Too tall, or not, on its Overview tile.
  - Failure scenario: Axel reviews the choice, reads "far past the frame" as measured, and accepts the loss of the summaries. Under a filter pick (11 submitted), a summary would hold 11 rows, and it might fit.
- P5. Place: `O150-report.md:9-13` ("The cases' first run, on the unchanged hub").
  - What is wrong: the look copy's backup, to which the copy was restored and which is its state before the step's files were set, has a `deck/title.md` that differs from the hub's at e0d231cb0. Its kicker lacks "| June 2026" (`diff` in Verification). The Present-view first run therefore read a title slide other than the hub's unchanged one.
  - Effect: no number of the first run depends on `title.md`'s kicker. The reader reproduces 22 slides, 7/8/9 and 11 of 24 from the copy's `present.yml`, which equals the base. The heading "on the unchanged hub" is still not literally true of the view the report quotes.

## 3. Standards

- S1. Place: `O150-report.md:38-40` ("The hub diff").
  - Hunk: "`git diff deck` in the hub: `present.yml`'s groups `pillars`, `more` and `ideas` replaced by `research: { ... }` ..."
  - What is wrong: the brief's Report section asks for "the hub diff", and the hub's rule is to show code, not prose about code. The section paraphrases the diff instead of quoting it. A reader cannot check the paraphrase against the file without running the diff, for example whether the comment line and `deck:` stayed, or the indentation.
  - Failure scenario: Axel approves the hub commit from the paraphrase, without seeing that `present.yml` drops from 54 lines to 15.
- S2. Place: `O150-report.md` as a whole.
  - What is wrong: `spec.md:85` requires "files changed with line counts", and the report has no file table. The counts are: `deck/present.yml` 54 to 15 lines, `deck/title.md` 8 lines (2 changed), `deck/transition.md` 6 lines deleted.
  - Failure scenario: the booking at landing has no file list to copy, and the size of the change is not visible from the report.

## 4. Behaviour

- B1. Place: `deck/present.yml:7` (the `find:` with no stage list), with `projects/archive/failed/fed-faithful-ecg/present/main.md`, now slide 3, the first project slide.
  - Hunk of the member slide: "## Key results\n- In progress: real-hospital replication on PTB-XL and MIMIC-IV-ECG." and "Next: demonstrate the faithfulness-preserving combine across real institutions ...".
  - What is wrong: the project's manifest gives `stage: failed`. The slide is `kind: text`, which carries no `tag` chip, so nothing on it shows the status. The deck's rule line, `deck/present.yml:1`, says "no hedging (the slide's `tag` chip carries the status)" for this public artifact. The step's change opens the project run with a slide that describes a stopped project as in progress, with next steps. The report's "Visible changes" (`O150-report.md:58`) names the slide but not this.
  - Coverage elsewhere: O151's line (`plan.md:1689`) writes decks for the 70 projects without one and splits too-tall slides. It does not rewrite an existing deck's state. Ruling 685 ("the failed and stopped ones written like every other") covers how such decks are written, not this existing text.
  - Failure scenario: Axel presents the portfolio deck unfiltered. Slide 3 tells the audience that the NO-GO federated-faithfulness project is live and seeking collaborators.
  - This is hub content, so it is Axel's words to change. It is raised for the orchestrator to book as an open item.
- B2. Place: `O150-report.md:53-61` ("Limitations" and "Visible changes").
  - What is wrong: the number of Too tall marks in the Overview, and of too-tall rows in the Findings view, changes with the step. O146's look counted 16 marks on the 22-tile deck (`plan.md:1683`). The step adds fed-faithful-ecg's slide, which the report says is marked, and turns the nine idea decks from grid cards into full slides. The report gives no before and after for these marks. The spec requires every visible change with its before and after (`spec.md:62`), and the brief repeats it.
  - Failure scenario: the look on landing sees, for example, 20-odd Too tall marks. It has no expected figure to read them against, and cannot tell a new overflow caused by the step from one that pre-dates it.

## Declined to judge

- Everything the report saw in the Present view on the scratch server on 8797: the Overview's "research 25" and "1 / 28", slide 3's position on screen, "Filtered: 11 of 25 decks" with "1 / 14", the Stage menu's counts and its "failed 1", the filter bar drawing, the 164 findings in the Findings view, the Too tall marks, and the first run's "1 / 22" and "Filtered: 11 of 24 decks". These need a server and a browser, which this review may not start. The reader-level counts behind them are reproduced above.
- The report's `git grep -n -E '\{\{ *(pillars|more)\.count *\}\}|transition\.md|slides: *(pillars|more|ideas)|legend: *(pillars|more|ideas)'` (`O150-report.md:44`) is not run, since `git grep` is outside the git commands this review may run. The plain `grep -rn` form over the hub's `.md`, `.yml`, `.yaml` and `.txt` files exits 1 (Verification). The command that would settle it is that `git grep` in `~/workspace/research-hub`.
- Whether "the gate at 57649a80d" (`O150-report.md:36`), the oculus checkout the look ran from, is oculus main, or holds the same deck reader as the base 81bda1d59. Settled by `git -C ~/workspace/oculus log --oneline 81bda1d59..57649a80d -- src/lib/data/sources/deck src/lib/views/academic/present src/lib/state/life`.
- Whether the deck's rule line (`deck/present.yml:1`) and ruling 685 conflict for a failed project's deck in a public portfolio deck (B1). That ruling is Axel's.
- Whether the bounded globs miss a research project placed deeper than `projects/<a>/<b>/<c>/<d>/` after O151. No such project exists today (depths 2, 3 and 4 only).

Reviewer usage: a075435932da7fd20, claude-opus-5-5, 178571 tokens, 39 tool uses, 8 min 57 s.
