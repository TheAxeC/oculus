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

## Repair round 1, refuted

```
# Verify 1, 2 and 4, from ~/workspace/research-hub
$ python3 -c "import yaml; yaml.safe_load(open('deck/present.yml'))"; echo "exit $?"
exit 0
$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' deck/present.yml deck/title.md; echo "exit $?"
exit 0
$ git status --short deck; echo "exit $?"
 M deck/present.yml
 M deck/title.md
 D deck/transition.md
exit 0

# Verify 3, from /Users/axelfaes/workspace/oculus, Node v24.21.0 on PATH, output to my own file
$ OCULUS_TEST_HUB=~/workspace/research-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose > <scratchpad>/O150-round1-refute/integrity.txt 2>&1; echo "exit $?"
exit 0
$ LC_ALL=C grep -a -E 'real hub|Test Files|Tests ' .../integrity.txt   (the check mark glyph written as <check mark>)
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings 1238ms
stdout | tests/checks/config/integrity.test.ts > the real hub > holds exactly what a second count of the tree finds
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > holds exactly what a second count of the tree finds 373ms
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > survives JSON.stringify and JSON.parse unchanged 20ms
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > reads a deck out of every project that has a present/ folder, with no finding 189ms
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > reads an equation out of every slide that writes one, as LaTeX that typesets 326ms
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found 81ms
 <check mark> |unit| tests/checks/config/integrity.test.ts > the real hub > reads every project of the personal folder with no finding, each with the tier personal 1244ms
 Test Files  1 passed (1)
      Tests  14 passed (14)

# The whole hub status (C4 and the report's Verify 4 row)
$ git status --short
 M .oculus/data/academic/funding.yml
 M deck/present.yml
 M deck/title.md
 D deck/transition.md
 M funding/2026-fwo-senior-transplant/RESEARCHQUESTIONS.md
 M funding/2026-fwo-senior-transplant/proposal/proposal/figs/fig-concept.tex
 M funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md
 M funding/2026-fwo-senior-transplant/proposal/proposal/main.pdf
 M funding/2026-fwo-senior-transplant/proposal/proposal/main.tex
 M funding/2026-fwo-senior-transplant/proposal/proposal/main.tex.block-manifest.json
?? funding/2026-fwo-senior-transplant/proposal/proposal/figs/fig-concept.tex.block-manifest.json
?? funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md.block-manifest.json
?? funding/2026-fwo-senior-transplant/proposal/proposal/reviews/
exit 0
$ cat <scratchpad>/O150-status-before.txt
 M .oculus/data/academic/funding.yml
 M funding/2026-fwo-senior-transplant/RESEARCHQUESTIONS.md
?? funding/2026-fwo-senior-transplant/proposal/proposal/figs/fig-concept.tex.block-manifest.json
?? funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md.block-manifest.json
?? funding/2026-fwo-senior-transplant/proposal/proposal/reviews/
$ stat -f '%Sm %N' -t '%Y-%m-%d %H:%M:%S' <the five extra funding paths> .../agents/reviews/O150-report.md
2026-11-06 00:45:27 funding/2026-fwo-senior-transplant/proposal/proposal/figs/fig-concept.tex
2026-11-06 00:46:05 funding/2026-fwo-senior-transplant/proposal/proposal/form-fields.md
2026-11-06 00:58:15 funding/2026-fwo-senior-transplant/proposal/proposal/main.pdf
2026-11-06 00:58:13 funding/2026-fwo-senior-transplant/proposal/proposal/main.tex
2026-11-06 00:58:15 funding/2026-fwo-senior-transplant/proposal/proposal/main.tex.block-manifest.json
2026-11-06 00:58:59 /Users/axelfaes/workspace/oculus/.scratch/migration/agents/reviews/O150-report.md
(O150-round-1.md mtime 00:54; O150-status-after.txt 00:39:57 holds the five lines plus the three deck lines)

# The round's delta
$ diff -u <snapshot>/hub/deck/present.yml ~/workspace/research-hub/deck/present.yml; echo "exit $?"
exit 0
$ diff -u <snapshot>/hub/deck/title.md ~/workspace/research-hub/deck/title.md; echo "exit $?"
exit 0
$ diff -u <snapshot>/ledger/O150-report.md .scratch/migration/agents/reviews/O150-report.md
(exit 1; the hunks read in full: open item 690 added, the first-run paragraph, the Files changed table, the C1 lists with their two commands, the look table, the quoted diff, the measured decision 2, the reworded visible changes)
$ git diff 81bda1d59 -- .scratch/migration/choices.md   (in oculus)
@@ -6046,5 +6046,5 @@ one line changed, 6049: "... one slide with a row per project (25 today, about 95 after O151), far past the frame, and the filter bar ..." to "... one slide with a row or card per project (25 today, about 95 after O151), and both were measured Too tall at 25 (a summary and a grid of `research` placed in the look's copy, O146's measure, 1280 by 720); filtered to the 11 submitted decks the summary fits and the grid stays Too tall, so a summary would draw only under a narrowing; ..."

# The report's quoted commands
$ git diff --stat e0d231cb0 -- deck   (hub)
 deck/present.yml   | 45 +++------------------------------------------
 deck/title.md      |  4 ++--
 deck/transition.md |  6 ------
 3 files changed, 5 insertions(+), 50 deletions(-)
$ wc -l deck/present.yml deck/title.md; git show e0d231cb0:deck/{present.yml,title.md,transition.md} | wc -l each
15 / 8 ; 54 / 8 / 6
$ (added and removed lines of present.yml, title.md from git diff e0d231cb0)
3 42 2 2
$ awk the report's ```diff block > report-diff.txt; git diff e0d231cb0 -- deck | grep -v -E '^(diff --git|index |deleted file mode)' > real-diff.txt; diff report-diff.txt real-diff.txt; echo "diff exit $?"
diff exit 0
$ <the report's find | python3 manifest command, written to my own folder>; echo "exit $?"
exit 0
$ <the report's node fs.globSync command, written to my own folder>; echo "exit $?"
exit 0
$ diff O150-glob.txt O150-manifests.txt; echo "diff exit $?"   (my two files)
diff exit 0
$ wc -l   -> 25 and 25
$ diff <mine>/O150-manifests.txt <scratchpad>/O150-manifests.txt; echo "vs builder exit $?"
vs builder exit 0
$ git grep -n -E '...'   not run (Declined); the plain form:
$ grep -rn -E --exclude=local.yml --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.venv --exclude-dir=venv '\{\{ *(pillars|more)\.count *\}\}|transition\.md|slides: *(pillars|more|ideas)|legend: *(pillars|more|ideas)' --include='*.md' --include='*.yml' --include='*.yaml' --include='*.txt' . ; echo "exit $?"
exit 1
$ sed -n 12p deck/engine.md
Each of the next slides leads with the governing equation, then specs, method, and results.
$ git log --oneline 57649a80d..81bda1d59 -- src config   not run (Declined); in its place:
$ git diff --stat 81bda1d59 57649a80d -- src config; echo "exit $?"   (oculus)
exit 0
$ diff -r <scratchpad>/O150-deck-backup <copy>/deck; echo "diff backup-copy exit $?"
diff backup-copy exit 0
$ git show e0d231cb0:deck/<f> | cmp -s - <scratchpad>/O150r1/base-<f>   (each of the five)
base-present.yml equals base / base-title.md equals base / base-transition.md equals base / base-engine.md equals base / base-closing.md equals base
$ git show e0d231cb0:deck/title.md | diff - <copy>/deck/title.md
3c3
< kicker: Research portfolio | technical briefing | June 2026
---
> kicker: Research portfolio | technical briefing
$ find <copy>/projects -name present.yml -path '*/present/*' | wc -l
      25

# The deck reader, run directly: <scratchpad>/O150-round1-refute/deck-read.ts, run with node from oculus. It builds the hub with tests/fixtures/hubs/hub-build.ts buildOneHub, maps the projects as src/lib/server/content/deck/read.ts:59-60 does (domain = domainIds[0]), and reads the deck with createReader as integrity.test.ts readDeck does; argument 3 keeps the research projects at one stage.
$ node deck-read.ts ~/workspace/research-hub deck
ms 62 state ok findings []
slides 28 keep none
group research count 25 members 25 kept 25 missing [] candidates 0 conflicts 0
member research kept projects/archive/failed/fed-faithful-ecg/present | Keeping Federated Glass-Box ECG Models Honest
... (25 member lines, in folder order: the 3 archive, the 9 ideas, the 13 manuscripts) ...
3 text projects/archive/failed/fed-faithful-ecg/present/main.md | Keeping Federated Glass-Box ECG Models Honest
4 project .../archive/published/2026/dongho-ecg-clustering/present/main.md
5 project .../archive/published/2026/hccnet-fl/present/main.md
6 to 14 idea, titles: BTD Autoencoder, Eval Artifacts, ECG-AF (FAIR), FL Privacy Audit, FLoRank Personalization, HCCNet FL Sweden, HCCNet Pathology, Quantum Tensor/FL, SSM Longitudinal
15 to 27: bt-operator-theory, btfno, bttd-source-eeg, bttn-incident-af, covert-applied, covert-theory, dries-bttr-ecg, ecg-readable-substrate (text), fed-multicellular-immune, hccnet-revision, meseret-cirrhosis, raw-pls, ward-bttr-crosssubject
28 closing deck/closing.md
title legend ["heart","liver","method","meta","privacy","liverfl","brain"] lede "A shared thesis: clinical data is intrinsically <b>multi-way"
$ node deck-read.ts ~/workspace/research-hub deck submitted
ms 61 state ok findings []
slides 14 keep 12
group research count 11 members 25 kept 11 missing [] candidates 0 conflicts 0
(3 to 13: the 11 submitted manuscripts' slides; 1 title, 2 engine, 14 closing)
# The base deck, read from a scratch hub in my own folder (projects copied with the brief's rsync filter, 25 present.yml; deck/ from git show e0d231cb0)
$ node deck-read.ts <mine>/basehub deck
ms 34 state ok findings []
slides 22 keep none
group pillars count 7 members 7 kept 7 missing [] candidates 15 conflicts 0
group more count 8 members 8 kept 8 missing [] candidates 8 conflicts 0
group ideas count 9 members 9 kept 9 missing [] candidates 0 conflicts 0
3 to 9 project (pillars), 10 summary deck/present.yml rows=7, 11 section deck/transition.md, 12 to 19 (more), 20 summary deck/present.yml rows=8, 21 grid deck/present.yml cards=9, 22 closing
title legend ["liver","method","heart","brain"] lede "7 pillar projects and 8 more. A shared thesis: clinical data"
$ node deck-read.ts <mine>/basehub deck submitted
slides 18 keep 12; pillars count 5, more count 6, ideas count 0
# Decision 2 at reader level: the step's deck plus `{ kind: summary, of: research }` and `{ kind: grid, of: research }`, in my own scratch hub
$ node deck-read.ts <mine>/basehub deck-measure
slides 30; 28 summary rows=25; 29 grid cards=25; findings []
$ node deck-read.ts <mine>/basehub deck-measure submitted
slides 16; 14 summary rows=11; 15 grid cards=11; findings []

# C5
$ python3 (os.walk over projects/, code/ skipped, tier research)
research manifests 95
depths Counter({2: 54, 4: 32, 3: 9})
basename repeats []
coauthor with deck []
stages with deck {'submitted': 11, 'revision': 2, 'failed': 1, 'accepted': 2, 'nascent': 6, 'scoping': 2, 'exploring': 1}
$ grep -n 'name_twice' src/lib/data/sources/deck/groups.ts
101:            'findings.deck.name_twice',
```

### Verdicts

The first report's findings, each against its ruling in `O150-round-1.md`:
- P1: partly closed. Both commands are quoted (`O150-report.md`, C1's two lists). My rerun reproduces them: `diff exit 0`, 25 lines each, equal to the builder's file. The ruling also asks that C1 compare the manifest list "with the members the Overview draws, by name". The report names slides 3 to 14 and gives slides 15 to 27 only as "the thirteen manuscripts' decks in folder order". See P-r1-2. My reader run lists the 13 by path and title in folder order, so the membership holds.
- P2 and B2: closed in the text. The report has a before and after table (16 and 16 marks, 164 and 164 findings, 148 at rest) and says the rows are the member decks', O151's to fix. The slide numbers in that table match my reader's numbering of both decks: base 3 to 9 and 12 to 19 are the 15 pillar and more slides and 21 is the grid; the step's 3 to 5 and 15 to 27 are 3 plus 13. The counts themselves need the browser (Declined). The sentence "no finding is on a file under `deck/`" is false of the base row; see P-r1-3.
- P3: closed. The base reader has no idea slide, and slide 21 is `grid ... cards=9`.
- P4: closed as ruled. `choices.md:6049` now states the measure in place of "far past the frame", and the reader gives 25 rows and cards unfiltered and 11 under `submitted`. The Too tall marks are Declined. The measured result raises Sp-r1-1.
- P5: closed. The report says the copy was refreshed from the hub before the first run and that the backup is the copy's earlier state. That fits the backup's `title.md`, which lacks "| June 2026", and the round's base files `O150r1/base-*`, which each equal `git show e0d231cb0:deck/<f>`. The `diff -r` the first run quotes cannot be rerun, since the copy has been restored (Declined).
- S1: closed. The quoted diff equals `git diff e0d231cb0 -- deck` once the header lines are taken out (`diff exit 0`).
- S2: closed. The file table reproduces: 54 to 15, 8 to 8, 6 deleted, 3 added and 42 removed, and the stat line verbatim.
- B1: closed as ruled. It is open item 690 at `orchestrator-state.md:192` and is in the report's Open items. The hub text is unchanged: `fed-faithful-ecg/present/main.md` still reads "In progress: real-hospital replication", and its stage is `failed`.

No finding was closed by removing a check. The round did not change the hub: both snapshot diffs exit 0, and the hub's deck files date from 00:39, before the round was sent at 00:54. The round's change to the ledger stays within its seven items.

Items of "What to build", over the whole diff since e0d231cb0:
- 1, `deck/present.yml`: holds. `deck/present.yml:5-15` has one group, `research`, with the three globs, `tiers: [research]`, `discover: true`, `sort: folder` and no `slides:`. The order is `title.md`, `engine.md`, `{ slides: research }`, `closing.md`. Line 1 and `deck.title` are unchanged.
- 2, `deck/title.md`: holds. Only `:4` (`legend: research`) and `:8` change, the counts dropped and the thesis sentence kept verbatim.
- 3, `deck/transition.md` deleted: holds.
- 4, the deck read with no finding: holds at reader level. Verify 3 is green, and the reader prints `state ok findings []`. The Present-view half is Declined.

Cases:
- C1: met. The reader holds 25 members, which equal the manifest enumeration by path, in folder order. Slide 3 is `archive/failed/fed-faithful-ecg`, the group count is 25 and the deck has 28 slides. The report's evidence for this case is P-r1-2.
- C2: met. The integrity run is green, and the reader gives no finding of the deck or of any member. The Findings view is Declined.
- C3: met at reader level. Under `submitted`, 11 of the 25 members are kept and the deck has 14 slides, the 11 sitting between engine and closing. The toolbar text is Declined.
- C4: met. `git status --short deck` lists the three paths. The five lines the whole status gained since its first run are all under `funding/2026-fwo-senior-transplant/proposal/proposal/`, Axel's work outside `deck/`. The report's row on this is P-r1-1.
- C5: met by reading and by the count. `projects/*/*/*/*/present` reaches `projects/coauthor/published/<year>/<p>/present`, `name_twice` is at `groups.ts:101`, the basenames repeat none, and no coauthor project has a deck.

### Findings

#### 1. Spec

- Sp-r1-1. Place: `O150-report.md`, "Limitations and judgment calls", with `choices.md:6049`.
  - Hunk: "Decision 2, measured: a summary and a grid of `research` ... are both Too tall unfiltered ...; with Stage `submitted` (11 decks) the summary fits and the grid stays Too tall. The deck drops both, so a summary would draw only under a narrowing".
  - What is wrong: round item 4 says the deck stays as built "unless the measure contradicts decision 2, which then goes to Axel as an open item". The brief gives decision 2's ground as the overflow of "one summary or grid of every research project". The measure confirms that overflow only for the unfiltered deck. Ruling 678 hands every narrowing to the filter bar, and ruling 676 has the summary and grid slides "counting only what it keeps". In that filtered use the measure shows the summary fits, so it contradicts decision 2 there. The round kept the decision and booked no open item. My reader run reproduces the row counts behind this (25 unfiltered, 11 under `submitted`). Whether this counts as "contradicts" is a judgment, and Axel's ruling settles it.
  - Failure scenario: Axel presents the submitted papers through the filter bar. The deck has no at-a-glance summary, although the base deck had two (slides 10 and 20) and an 11-row summary fits. Nobody asked him whether to drop it.

#### 2. Proof

- P-r1-1. Place: `O150-report.md`, the DONE / NOT DONE row "Verify 4", reworded in the round (C4's row cites it).
  - Hunk: "the whole status is the first run's five lines plus those three".
  - What is wrong: the rerun prints 13 lines. Five more paths under `funding/2026-fwo-senior-transplant/proposal/proposal/` are modified: `figs/fig-concept.tex` (mtime 00:45:27), `form-fields.md` (00:46:05), `main.tex`, `main.pdf` and `main.tex.block-manifest.json` (00:58:13 to 00:58:15). The report was written at 00:58:59 and the round sent at 00:54. The sentence was reworded in the round without the status being taken after the last change, which `spec.md`'s Report rule requires. The extra paths are outside `deck/`, so the step's own paths are still the three.
  - Failure scenario: at the hub commit, the orchestrator expects the eight lines this row gives and finds 13. It must either rework out which change set is the step's, or take the row as proof that nothing else in the hub moved while Axel's funding files did.
- P-r1-2. Place: `O150-report.md`, C1's lists, after the two commands.
  - Hunk: "15 to 27 the thirteen manuscripts' decks in folder order".
  - What is wrong: round item 1 asks for C1 "by name", and the report names only slides 3 to 14. The 13 manuscript members are counted, not named, so a reader cannot check the Overview against the manifest list for 13 of the 25.
  - Failure scenario: a manuscript deck dropped by the reader and replaced by a second deck of another project still reads as "thirteen". My reader run shows that this has not happened today.
- P-r1-3. Place: `O150-report.md`, the sentence under the Too tall table.
  - Hunk: "The 16 findings over 148 are the "slide too tall" rows, each on its member deck's `present/main.md`; no finding is on a file under `deck/`."
  - What is wrong: the table has two rows, and the sentence is true only of the step's deck. In the base row, one of the 16 marks is slide 21, the idea grid, whose `source.path` the reader gives as `deck/present.yml`. A too-tall finding is filed at `joinPath(dir, one.source.path)` (`src/lib/state/life/present.svelte.ts:505-507`), so that row of the base's 16 sits on `deck/present.yml`.
  - Failure scenario: the look on landing opens the base deck for comparison, sees a "slide too tall" row on `deck/present.yml`, and finds it against the report's before figure.
- P-r1-4. Place: `O150-report.md`, the look paragraph.
  - Hunk: "the gate at 57649a80d, whose `src` and `config` equal the base's: `git log --oneline 57649a80d..81bda1d59 -- src config` prints nothing".
  - What is wrong: that range lists the commits reachable from 81bda1d59 and not from 57649a80d. If 57649a80d descends from the base, the range prints nothing whatever the gate's `src` holds, so the quoted command does not test the claim. The claim itself holds: `git diff --stat 81bda1d59 57649a80d -- src config` prints nothing.
  - Failure scenario: a later look on a gate that changed the deck reader quotes the same command, gets empty output, and records "equal to the base" falsely.

#### 3. Standards

none

#### 4. Behaviour

none new. B1 is booked as open item 690 and the `engine.md:12` sentence as open item 689. Both are Axel's to rule on and are repeated in the report's Open items.

### Declined to judge

- Everything seen on the scratch server on 8797: the 16 and 16 Too tall marks with their slide numbers, the findings counts of 148, 164 and 164, the Too tall marks of the measured summary and grid (unfiltered and under `submitted`), the nine idea slides drawing as not too tall, "Filtered: 11 of 25 decks" with "1 / 14", the Stage menu's "failed 1", the filter bar drawing, and the Overview reading "research 25" and "1 / 28". These need a server and a browser, which this review may not start. The reader-level counts behind them are reproduced above. The copy's `deck/` ctime of 00:57:57 is consistent with a restore at the end of a look inside the round's window, but it does not prove the look ran.
- `git grep -n -E '\{\{ *(pillars|more)\.count *\}\}|transition\.md|slides: *(pillars|more|ideas)|legend: *(pillars|more|ideas)'` in the hub was not run, because `git grep` is outside the git commands this review may run. The plain `grep -rn` form exits 1. That `git grep` in `~/workspace/research-hub` would settle it.
- `git log --oneline 57649a80d..81bda1d59 -- src config` was not run. Whether 57649a80d descends from 81bda1d59 is settled by `git merge-base --is-ancestor 81bda1d59 57649a80d` in oculus.
- The first run's `diff -r ~/workspace/research-hub/deck <copy>/deck` "printed nothing" cannot be rerun, since the copy now holds the restored backup. The session's transcript at the first run would settle it.
- Whether any of the five extra `funding/` paths in the status was written by the step. Their content is Axel's grant work outside the step's write list, and the session's transcript of the round would settle who wrote them.
- Whether Sp-r1-1 counts as "contradicts decision 2" under round item 4 is a ruling for Axel.

Reviewer usage: ad04d60608866efd6, claude-opus-5-5, 190711 tokens, 57 tool uses, 9 min 6 s.
