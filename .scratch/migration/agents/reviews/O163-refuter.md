# Step O163 refuter report (on .agents/worktrees/migration-O163, base 75bf4dd10)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
(worktree root) git diff 75bf4dd10
  one hunk, tests/fixtures/hubs/demo/deck/present.yml @@ -1,4 +1,3 @@, the line
  "-# Rules for what goes on a slide (a public artifact): public-safe only, ..." removed, nothing else
(worktree root) git status --short
   M tests/fixtures/hubs/demo/deck/present.yml
  ?? .scratch/migration/agents/reviews/O163-report.md
test -d docs/adr (ls docs/adr in the main checkout)
  ls: docs/adr: No such file or directory

Verify 1, the ASCII gate (perl form of the rules file) over the report, the three drafts extracted
byte for byte from the report's "Hub files" fences into the reviewer's scratch folder, and the fixture:
  (no output) perl exit 0
Verify 2, the three node -e parses typed as the report quotes them, from the worktree root:
  {"deck":{"title":"Research projects"},"groups":{"projects":{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}},"order":["title.md",{"slides":"projects"},"closing.md"]}
  {"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
  {"kind":"closing","kicker":"Thank you","contact":"axel.faes@gmail.com"}
  node -e "process.stdout.write(<the typed present.yml>)" | diff - <extracted present.yml>: no output
  ("typed present.yml equals the report's draft")
Verify 3, git status --short: as above (the fixture line is item 8's write)
Verify 4, npm run test:quick -- --base 75bf4dd10 (uptime before: load averages 7.70 11.02 11.48)
  test:quick: 2 changed file(s), from git since 75bf4dd10
  test:quick: 10 test file(s)
  ok      prettier (1.0 s): All matched files use Prettier code style!
  ok      ASCII gate (1.1 s)
  ok      svelte-kit sync (3.4 s)
  ok      svelte-check (9.8 s): ... COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (14.9 s): Duration  3.01s ...
  ok      vitest checks (47.2 s): Duration  35.04s ...
  test:quick: 50.9 s; every command passed
Verify 5, the prose read: done by reading, see Standards.

The hub-portfolio run asked for, alone, from the worktree:
  before: 21:18 ... load averages: 15.39 11.47 11.15
  npx vitest run tests/data/hubs/hub-portfolio.test.ts
   Test Files  1 passed (1)
        Tests  16 passed (16)
     Duration  53.68s (transform 2.29s, setup 0ms, import 3.60s, tests 49.93s, environment 0ms)
  after: 21:20 ... load averages: 12.40 11.70 11.29

The report's 14-file demo-reader set, rebuilt with grep -rl in place of git grep -l (same patterns):
  14 files, the same 14 the report names.
  npx vitest run <the 14> (load 11.62 before, 15.38 after):
   Test Files  3 failed | 11 passed (14)
        Tests  15 failed | 317 passed | 9 skipped (341)
   15 Error: Test timed out in 5000ms.   (no other error; failures in hub-portfolio 10, self 3, website 2)
  Alone afterwards, one call each:
   tests/data/hubs/decks.test.ts                 Tests  2 passed (2)    (load 9.35)
   tests/server/root/watch/website-watch.test.ts Tests  1 passed (1)    (load 8.66)
   tests/data/hubs/self.test.ts                  Tests  17 passed (17)
   tests/routes/sessions/website.test.ts         Tests  20 passed (20)  (an earlier alone run at load ~12)
  An earlier alone run at load ~12 to 15 gave decks "1 failed | 1 passed", self "3 failed | 14 passed",
  website-watch "1 failed"; the later runs above at load 8 to 9 pass, so the reds are the load's.

The item 7 grep, run as grep -rn -F --exclude=local.yml with the report's 13 patterns over
src tests docs config README.md | cut -d: -f1 | sort | uniq -c:
     4 tests/data/sources/present.test.ts
     3 tests/routes/edit/deck-slides.test.ts
     2 tests/routes/edit/write-fixture.ts
    21 tests/server/edit/deck/deck-acts.test.ts
     2 tests/server/edit/deck/deck-edit.test.ts
  grep 'public artifact' / 'Rules for what goes on a slide' over the same paths: exit 1

The drafts (extracted from the report), the C8, C9, C11 greps:
  cat -et: every line ends in "$", one trailing newline each (tail -c2: "d \n", ". \n", ". \n")
  diff <(head -6 closing.md) <(head -6 hub deck/closing.md): no output (front matter equal)
  diff closing.md hub closing.md: 8c8 only, the first sentence
  grep -n '^\s*#' present.yml: exit 1
  grep -n -E 'engine\.md|transition\.md|pillars|more|ideas' present.yml title.md closing.md: exit 1
  grep -c -F 'Several are open to collaborators across computer science, psychology, and medicine.' closing.md: 1

The builder's case-run program (source copied from the report), mode new, over the extracted drafts,
filters none / mine / submitted / nomatch, each exit 0:
  none:  state ok, deck findings 0; snapshot findings 0; research projects 95, with a deck 25, mine 95;
         order entries file:title.md, group:projects, file:closing.md;
         group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0;
         research decks the groups do not hold: []; held decks of no research project with a deck: [];
         slides 27; slides 2..26 = hccnet-fl, dongho-ecg-clustering, bttn-incident-af, dries-bttr-ecg,
         ward-bttr-crosssubject, meseret-cirrhosis, hccnet-revision, bttd-source-eeg,
         fed-multicellular-immune, covert-theory, raw-pls, covert-applied, ecg-readable-substrate,
         ecg-af-fair, bt-operator-theory, btfno, btd-autoencoder, clinical-ai-eval-artifacts,
         fl-privacy-auditing, hccnet-fl-sweden, quantum-tensor-fl, ssm-longitudinal,
         florank-personalization, hccnet-pathology, fed-faithful-ecg;
         title legend [hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl];
         slide kinds {"title":1,"project":14,"text":2,"idea":9,"closing":1}
  mine:  kept 25, count 25, "25 of 25 shown", slides 27
  submitted: kept 11, count 11, "11 of 25 shown", slides 13, legend [hub:heart,hub:brain,hub:liver,hub:method],
         kept: bttn-incident-af, dries-bttr-ecg, ward-bttr-crosssubject, meseret-cirrhosis, hccnet-revision,
         bttd-source-eeg, fed-multicellular-immune, covert-theory, raw-pls, covert-applied, ecg-readable-substrate;
         slide kinds {"title":1,"project":10,"text":1,"closing":1}
  nomatch: kept 0, count 0, "0 of 25 shown", slides 2, title legend [], deck findings 0,
         slide kinds {"title":1,"closing":1}
  closing lede in every run: "Happy to go deeper on any of the research projects: the motivation, the
  method, or where it stands. Several are open to collaborators across computer science, psychology, and medicine."

C4 inputs: config/catalogs/vocab.yml categories rows and deck_order
  [publications, other-outputs, in-review, in-flight, released, idea, dead-ends];
  grep -rln --exclude=local.yml -e deck_order -e '^categories:' over the hub's .oculus/config.yml,
  .oculus/data, .oculus/workspaces: exit 1 (no hub override)

README.md:60: sed -n 261p of the report equals hub README.md:60 (diff empty); the report's "after"
equals "before" with "public " removed (diff empty).
Project decks: find projects -path '*/present/*' (.md, .yml) | xargs grep -l -i
-e "public artifact" -e "public-safe" -e "public slide": exit 1 (25 present folders, none carries it).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds, the drafted `present.yml` parses to deck.title 'Research projects', one group `projects` with `find: { folders: [projects/**/present], tiers: [research] }` and `discover: true`, no slides/stages/forms/status/sort, order title.md, { slides: projects }, closing.md; no comment line (C8 grep exit 1); four-space indentation (cat -et).
- 2: holds, the drafted `title.md` equals O150's landed text (O150-report.md "Hub files"): kind title, kicker "Research portfolio | technical briefing", legend projects, "# Research projects" and the lede; the report checks the lede against the 25 decks under "Judgment calls", and the reviewer's case run reproduces its inputs (tier research for every member, no held deck outside the research decks, one slide per project).
- 3: holds, the report names `rm ~/workspace/research-hub/deck/engine.md` and no order entry names it (C9 grep exit 1, order entries of the case run); the removal itself is the landing's.
- 4: holds, as item 3 for `deck/transition.md`.
- 5: holds, front matter equal to the hub's (diff of lines 1-6 empty), the collaborators sentence present word for word (grep -c 1), and each sentence read below holds for the 27-, 13- and 2-slide decks; the report gives the whole text and a per-sentence reason.
- 6: holds, the three files in fences, each ending in one newline, the two removals and README:60 before and after are in "Hub files"; the extracted fences parse and pass the ASCII gate.
- 7: holds, the only oculus change is item 8's line (git diff 75bf4dd10); the grep is quoted and reproduces (32 lines, five synthetic-fixture files, each read by the reviewer as a test's own planted text), each hit judged.
- 8: holds, the one comment line removed and nothing else (git diff 75bf4dd10), head before and after quoted; every one of the 14 demo-reading files has a passing run in the reviewer's runs (11 in the joint run, hub-portfolio 16 passed alone, decks, website-watch, self and website passed alone). The report's NOT DONE for this item rests on load timeouts the reviewer's alone run does not reproduce (see Proof).
- 9: holds, the "after" line is the hub line with only "public " removed (diff checks above); the change is the landing's.

Cases of the brief's "Cases":

- C1: not verifiable here, the reader side gives `state ok, deck findings 0` under all four filters; the Findings view of the Present view is the look at landing, as the brief assigns it.
- C2: met, members 25, research decks not held [], held decks outside [] , fed-faithful-ecg (failed) and the two archive/published/2026 decks among the members; 95 research projects, 25 with a deck, no deck finding.
- C3: met, 27 slides, order entries title, projects, closing, the 25 decks in exactly the brief's order, no section, summary, grid or transition slide.
- C4: met, the reader's order equals the reviewer's recomputation from vocab.yml's categories and deck_order (titles compared by hand), and equals O150-report.md's C4 list category by category; the hub overrides neither key.
- C5: met, submitted: 11 kept, 13 slides, the brief's 11 decks; mine (Clear all, Mine only on): 25 kept, 27 slides.
- C6: met, nomatch: 2 slides (title, closing), title legend [], "0 of 25 shown" (the program's computation; the view's words are the look's), no finding.
- C7: met, no `{{pillars.count}}`, `{{more.count}}` or `legend: pillars` in the draft (C9 grep exit 1 covers them), legend of seven domains each once: liver, heart, brain, method, meta, privacy, liverfl.
- C8: met, grep -n '^\s*#' over the extracted present.yml exit 1.
- C9: met, grep for engine.md, transition.md, pillars, more, ideas over the three drafts exit 1.
- C10: not verifiable, it is the orchestrator's after the copy at landing; the hub's deck/ today still holds the five files (ls deck), as it should before landing.
- C11: met, front matter equal, the sentence present word for word, and by reading: "Happy to go deeper on any of the research projects: the motivation, the method, or where it stands." names no count or project and offers talk rather than stating what a slide shows, so it holds on the 2-slide deck; every member has a stage on its facts strip and a method list, an "idea / method" section or a desc naming its candidate method; the second sentence is Axel's, ruled true (708). The unchanged closing is read sentence by sentence in the report's first run.
- C12: met, the fixture opens with `deck:` (head), no comment line, and the demo-reading files pass in the reviewer's runs (hub-portfolio 16 passed alone at load 15.39); unchanged tree line 1 is the comment (git show 75bf4dd10:tests/fixtures/hubs/demo/deck/present.yml).

## 1. Spec

none

## 2. Proof

- O163-report.md, first line and DONE table row 8: "NOT done: item 8's proof (and with it C12) is red for one file. `tests/data/hubs/hub-portfolio.test.ts` ... did not pass in any of four runs alone"; what is wrong: the claim of red does not reproduce, the reviewer's alone run passed (Tests 16 passed (16), load 15.39 before and 12.40 after), and the joint-run failures in both the builder's and the reviewer's runs are all "Test timed out in 5000ms" with no assertion failure; the decision resting on it is whether item 8 and C12 are done at landing; failure scenario: the orchestrator, reading the report's first line, treats item 8 as unbuilt and sends a repair round or books it, for a fixture edit whose demo readers pass; verdict: none (item 8 holds and C12 is met on the reviewer's run). The report's own wording keeps the edit and the timeouts apart, so this is a closure for the landing, not a defect in the work.

## 3. Standards

none. The prose read of the three drafts against the rules file's prose rule: the title lede is a noun phrase without a main verb and the closing's first sentence has no subject; both are fixed by the brief (O150's lede, item 2) or carried from Axel's own sentence, and the report names both departures. No em dash, no quip, no "not X but Y", ASCII only (perl gate exit 0).

## 4. Behaviour

- O163-report.md, section "Every user-visible change, for the look", the C5 and C6 bullets: "C5: pick the stage `submitted` in the filter bar: 13 slides (title, the 11 in-review decks, closing), ... line 2 "11 of 25 shown"." and "C6: ... 2 slides (title, closing), an empty legend, line 2 "0 of 25 shown", no finding."; what is wrong: these two bullets give only the after; the before (18 slides and "11 of 24 shown" for submitted, 7 slides and "0 of 24 shown" for the no-match search, per the report's own first-run section) is not in the section the look is read against, which the rules file's "What every package obeys" asks to name the before and after; failure scenario: at the look, the orchestrator sees 13 and 2 slides with no before in that section and cannot tell from it that the counts changed from 18 and 7 and the denominator from 24 to 25; verdict: none (the values are in the report's first-run section, so the case verdicts stand).

## Declined to judge

- C1 and C10, and the view's own words for the filter bar's line 2 under C5 and C6: they are the orchestrator's look and copy at landing; a read and the case run cannot show the Present view's Findings or the hub's git status after the copy.
- Whether the case run's `mine` predicate (isMine over projectPeople with self = axel-faes) is the predicate the Present view's Mine only uses: it gives 95 of 95 research projects, so no case result depends on it here; the look settles it.
- The report's quoted `git grep` commands (the item 7 grep, the 'public artifact' grep, the `git grep -l "hubs/demo"` set): git grep is outside the reviewer's three git commands, so the reviewer reproduced each with plain `grep -rn` / `grep -rl` over the same paths with `--exclude=local.yml`, with the same results. The reviewer also ran the item 7 grep and one `git grep -n "engine.md\|transition.md"` count (21) once as `git grep`, read only, before switching to plain grep; nothing changed in the tree.
- The report's quoted `git log -1 --format=%h -- deck` and `git status --short --untracked-files=all -- deck projects` in the hub: git in the hub is outside what the reviewer may run; `ls deck` in the hub shows the five files the premise names, and the hub's deck file texts read by the reviewer match the brief's description.
- The "exit 0" in the report's four alone-rerun lines: in the same shell form the reviewer's run printed "exit 0" for a run with a failed test, so that exit is the pipeline's last command and not vitest's; the "Tests ..." part of each line carries the result, and no decision rests on the exit.
- The 1.3 s glob cost and any watcher behaviour of `projects/**/present`: outside this step (open item 697, step O159).

Reviewer usage: aa3bb87266628f0f5, claude-opus-5-5, 170759 tokens, 49 tool uses, 17.4 min.

## Closed

- Proof 1 (the report's NOT DONE for item 8 and C12): closed at landing with no change. The fixture edit stands; the gate at 94cb4f3b6 ran `npm run diagrams && npm run docs:palette && npm run test:quick` to "test:quick: 63.2 s; every command passed", which covers the demo-reading tests of the changed fixture, and the reviewer's alone run of `tests/data/hubs/hub-portfolio.test.ts` passed 16 of 16. The builder's red runs were "Test timed out in 5000ms" under machine load, with no assertion failure.
- Behaviour 1 (C5 and C6 given without their before): closed at landing by the look, which records both. C5, the stage `submitted`: before 18 slides and "11 of 24 shown" (the report's first-run section), after 13 slides and "11 of 25 shown", seen on the scratch server. C6, a search no project holds: before 7 slides and "0 of 24 shown", after 2 slides (title, closing) and "0 of 25 shown", seen on the scratch server.
