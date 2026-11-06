# Step O150 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O150, base d46fcfa2e)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

The three hub texts were cut from the report's fenced blocks (report lines 89-101, 107-114, 120-131) into a scratchpad folder. The folder, the case-run program and its outputs were removed before this report (`ls $S | grep -E '^(o150|r150|out-|rep-)'`, exit 1).

```
-- Verify 1, the rules file's perl gate over the three hub texts and over the report
gate exit 0
report gate exit 0
-- each text ends with one newline (tail -c1 | od -c): \n for present.yml, title.md, engine.md

-- Verify 2, the builder's three node -e parses, typed as the report quotes them
{"deck":{"title":"Methods for clinical and scientific data"},"groups":{"projects":{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}},"order":["title.md","engine.md",{"slides":"projects"},"closing.md"]}
{"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
{"kind":"section"}
-- the same parse over the extracted files (yaml parseDocument)
present errors 0 warnings 0 (same JSON as above)
title.md errors 0 {"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
engine.md errors 0 {"kind":"section"}

-- Verify 3, git status --short in the worktree
 M .scratch/migration/agents/briefs/O150.md
?? .scratch/migration/agents/briefs/O150-cases.md
?? .scratch/migration/agents/reviews/O150-report.md
-- the modified brief and the cases file equal main's copies under cmp (worktree-brief-equals-main-brief, cases-equal-main)
-- diff -rq of the base copy against the worktree: src same, tests same, config same, utils same

-- Verify 4, npm run test:quick (once)
test:quick: 3 changed file(s), from git since HEAD
test:quick: 0 test file(s)
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (3.1 s)
ok      svelte-check (10.6 s): 1793984703898 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 14.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth, ... the build, the lint of unchanged files

-- diff of each extracted text against the hub's file: only title.md lines 3, 4, 6, 8; engine.md lines 4, 6, 12; present.yml as the report's diff gives it

-- the case-run program, its source cut from report lines 251-332, run from the scratchpad
base exit 0 / new exit 0 / sub exit 0 / prep exit 0
diff of each output against the report's quoted output: new none, new submitted, new in-prep identical; base identical but for the fence line of my cut

-- C9 and C10 over the extracted texts and the hub's closing.md
C9 grep exit 1
C10 grep exit 1
grep -n '{{' title.md engine.md: exit 1

-- Item 7, the grep over oculus
grep -rn --exclude=local.yml -e 'more\.count' -e 'transition\.md' -e 'public artifact' src tests config docs README.md
tests/fixtures/hubs/demo/deck/present.yml:1:# Rules for what goes on a slide (a public artifact): ...
grep -rln --exclude=local.yml 'pillars' src tests config docs README.md | wc -l
     109
the deck-group form of the grep: hits only in LineCard.svelte (t('pillars.counts_tip')) and the seven synthetic deck test files the report lists
grep for 'everywhere they hide\|Structured models': nothing

-- unused exports, as the report quotes it, from the worktree's root
diff: .agents/worktrees/O150-base/unused-exports.txt: No such file or directory
as quoted, from the worktree: diff exit 2
with the base copy's real path (../O150-base/unused-exports.txt): diff exit 0
(no decision rests on it: the step changes no code)

-- brief premises in the hub
find projects -path '*/present/present.yml' | wc -l: 25 (13 manuscripts, 9 ideas, 2 archive/published, 1 archive/failed)
.oculus/config.yml:27: portfolio_deck: deck
README.md:52: "Every scan folder is walked to any depth ..."
git -C ~/workspace/research-hub status --short -- deck:  M deck/present.yml
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The extracted `present.yml` holds `deck.title` as item 3 drafts it, one group `projects` with `find: { folders: [projects/**/present], tiers: [research] }` and `discover: true`, no `slides`, `stages`, `forms`, `status` or `sort`, no comment line, four-space indent and single-quoted title as the hub file has; the rerun prints `order entries file:title.md, file:engine.md, group:projects, file:closing.md` and `group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0`.
- 2: holds. "Hub files" names the removal of `deck/transition.md`; no order entry names it (C10 grep exit 1).
- 3: violated, Spec 1 and Spec 2. The legend names `projects`, the lede carries no count, the kicker drops the date, and the front matter's other keys stay; but two claims of the drafts are not shown for every one of the 25 decks.
- 4: violated, Spec 3. The sentence is one sentence, names no count and is worded on the cases ruling's point 1, but under its plain reading it is false for `ecg-readable-substrate`.
- 5: holds. `closing.md` is not in "Hub files"; the rerun reads the hub's closing slide unchanged (slide 28, heading "Questions &amp;<br>collaborations welcome").
- 6: holds. Three fenced blocks, each parsing and ending with one newline, and the removal of `deck/transition.md`; the diff against the hub touches only the lines the items ask for.
- 7: holds. The rerun greps give the same hits; none names the research hub's deck groups or files, and no oculus file changed (diff -rq, git status).

Cases of the brief's "Cases":

- C1: partial. The reader side is met (`state ok, deck findings 0`, `snapshot findings 0` in all three new runs); the per-deck count of "slide too tall" findings that the cases ruling (point 2) asks for is not in the report, Spec 4.
- C2: met. `members 25, kept 25`, `research decks the groups do not hold: []`, `held decks of no research project with a deck: []`, `fed-faithful-ecg` and both `archive/published/2026` decks among the members; `research projects 95, with a deck 25`.
- C3: met. `slides 28`, title, engine, slides 3 to 27 one per deck, closing; `slide kinds {"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}`, no summary, grid or transition; the nine idea decks are slides 16 and 19 to 26.
- C4: met, under the cases ruling's point 3. The rerun's order is publications (hccnet-fl, dongho-ecg-clustering, by title as the row's `sort: [stage, year, title]` gives at one stage and year), in-review (the 11, by title), in-flight (ecg-af-fair exploring, then bt-operator-theory, btfno revision), idea (six nascent by title, then two scoping), dead-ends (fed-faithful-ecg), matching `deck_order` in `config/catalogs/vocab.yml:280`.
- C5: met on the reader. `kept 11, count 11`, 14 slides, the 11 in-review decks in C4's order; the drawn bar's "11 of 25 shown" is the look's.
- C6: met on the reader. `kept 0, count 0`, 3 slides, title legend `[]`, `deck findings 0`.
- C7: met. No count token or `legend: pillars` (grep exit 1); the legend `[hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]`, the seven domains each once.
- C8: partial, Spec 3. The first and third claims (the slides that follow are the research projects' decks; no count) hold; the second fails for `ecg-readable-substrate` under its plain reading.
- C9: met. `grep -n '^\s*#'` over the extracted `present.yml`: exit 1.
- C10: met. The grep over the three texts and the hub's `closing.md`: exit 1.

## 1. Spec

- Report "Hub files", `deck/present.yml` line 2 and `deck/title.md` line 6 and 8: "title: 'Methods for clinical and scientific data'", "# Methods for clinical<br>and scientific data", "The research projects, each from its own deck: what it sets out to do, and the model or method it brings."; what is wrong: item 3 (ruling 698 (a)) asks that every claim of the redraft hold for all 25 decks. `quantum-tensor-fl`'s whole deck is one card, "desc: 'Exploratory: quantum-inspired tensor networks or quantum federated learning, after a novelty check'" (`projects/ideas/quantum-tensor-fl/present/main.md`), which names no data, so the title's "for clinical and scientific data" is not shown by it (my per-deck grep for clinical or scientific-data words gives `quantum-tensor-fl clin=0`, the one deck with none besides the PDE deck `bt-operator-theory`), and it states no aim, so the lede's "what it sets out to do" is not shown either. The report's "Proposed framing" table admits the first ("the weakest fit: its card ... names a method and no data") under the column "Why it holds for the 25 decks", and asserts the second for every deck ("Every deck's slide states an aim and a model or method"); failure scenario: Axel, reading the table at landing, takes the title and lede as holding for all 25 as the ruling asked and keeps them, and the title slide claims of the quantum deck a data domain and an aim its own slide does not give; verdict: item 3 violated.
- Report "Hub files", `deck/title.md` line 8: "The research projects, each from its own deck"; what is wrong: the definite "The research projects" with "each from its own deck" tells the audience the deck shows the portfolio's research projects, each with its deck, while at this step's landing 70 of the 95 research projects have no deck (rerun: `research projects 95, with a deck 25`). Brief item 4 sets the standard for the deck's framing words as true at this step's landing and names "the decks of the research projects that have one (25 of the 95 research projects)". The engine line's "the research projects' own decks" uses the wording the cases ruling's point 1 gives and is not judged here; the lede's wording is the builder's; failure scenario: an audience shown the title slide takes the deck for the whole research portfolio and never learns of the 70 projects it leaves out; verdict: item 3 violated (with the finding above).
- Report "Hub files", `deck/engine.md` line 12: "Next come the research projects' own decks: a project's slides give its governing equation, its specs, its method and its results where the project has them."; what is wrong: under the plain reading ("where the project has them" = where the project has results), the claim is false for `ecg-readable-substrate`. Its project is at `stage: submitted`, `venue: cbm` (`project.yml:3,23`), its manuscript reports results (`manuscript/main.tex:21,37`, AUROC comparisons of the named model against ECG foundation models), and its one slide reads "## Key results" / "- In progress." (`present/main.md:14-15`) and carries no specs. The report's C8 reasoning reads "has them" as "the slide carries the `equation:`/`specs:`/`method:`/`results:` keys" ("the 9 idea cards and the 2 text slides have none of the four keys, so the claim says nothing of them"), a reading under which the clause says nothing of 11 decks. The ruling's point 1 gave the meaning; the words were the builder's ("You word it"), and a wording tied to the deck (where its slides give them) would hold for every deck; failure scenario: a viewer of the engine slide reads that each project's slides give its results where the project has some, sees "Key results: In progress." on `ecg-readable-substrate`, and concludes that a submitted project has no results; verdict: item 4 violated, C8 partial.
- Report first line and DONE row "C1 per-deck count of 'slide too tall' | NOT DONE": "I have not counted the 'slide too tall' findings per deck, which the cases ruling (point 2) asks for for the look"; what is wrong: the cases ruling's point 2 asks that those findings be "counted and named per deck in the report"; the report gives no count. The rules file's "What every package obeys" bars a builder from running a page, the deck reader measures no height, and none of the ledger reports I grepped (O157 landing, report, refuter, brief check; O150 brief check) names the decks, so the ruling's demand and the rules file collide and the builder stated it on its first line; failure scenario: the look on landing opens the deck with no per-deck list to check the Findings view against, and a too-tall slide on one of the nine idea or two text slides now placed goes uncounted; verdict: C1 partial.

## 2. Proof

- Report "Proposed framing", the paragraph after the table, and "Judgment calls": "The engine slide's lines 8 to 10 stay, as item 4 says. They describe the block-term model itself, and each of their claims is drawn by at least one of the 8 decks."; what is wrong: the claim does not reproduce for line 10, "The same factorization carries through irregular time, federation, differential privacy, and unaligned geometry." Over the 8 block-term decks the report names, a grep for `irregular|time-aware|uneven` hits only `btfno/present/main.md:42`, a speculation ("could give HCCNet ... a learned progression operator predicting the next scan's state from irregular longitudinal history"); a grep for `unaligned|non-corresponding|registration|geometr` hits only `dries-bttr-ecg/present/main.md:31,35`, which draws the opposite ("an unaligned window collapses to chance", "aligned 0.715 vs unaligned 0.434 (chance)"). The decks that draw irregular time (`hccnet-revision`) and unaligned geometry (`raw-pls`) carry no block-term word (`bt=0`); the decision resting on it: whether line 10 is kept unchanged when Axel corrects the framing under ruling 698 (a), which asks that the deck's claims hold for its decks; failure scenario: Axel, told each claim of lines 8 to 10 is drawn by a deck, keeps line 10, and the engine slide claims the factorization carries through unaligned geometry where the one block-term deck that tests alignment shows it falls to chance; verdict: none (item 4 keeps these lines; the finding is the report's claim).
- Report "Open items of the state file, verbatim": "- 697 (2026-11-06, O150's brief check) ..." and "- 698 ... O150 keeps these words as they stand, and its builder drafts versions ..."; what is wrong: both are quoted as open, and 698's text says the words are kept, while the brief's item 3 builds on "Ruling 698 (a)", main's `plan.md:3598` holds "Open item 698 (2026-11-06): (a), O150's builder drafts the deck's framing ...", and main's `orchestrator-state.md:201` now reads "Open items 697, 698 and 699 (2026-11-06), closed by Axel the same day". The worktree's copy of the state file, the one the builder may read, still lists them open; the decision resting on it: what the landing tells Axel still awaits his ruling; failure scenario: the landing report copies the section and puts two ruled items back in front of Axel as open, one of them saying the framing words were kept when the hub files replace them; verdict: none.

## 3. Standards

- none.

## 4. Behaviour

- Report "Before and after, for the look", C2 and C5: "After: one heading, `projects`, with 25 decks, `fed-faithful-ecg` among them" and "Line 2 reads '11 of 25 shown'"; what is wrong: the filter bar is drawn over the projects the groups hold (`docs/decks.md`, "The filter"), and those go from 24 (base run: the three groups leave out `projects/archive/failed/fed-faithful-ecg`) to 25, the new one in category `dead-ends`. So line 2 gains a dead-ends slice and its unfiltered count reads "25 projects" where it read "24 projects", and the portfolio deck now draws a slide whose facts strip carries the stage `failed`. The report states neither the bar's slices and count before and after nor the `failed` chip on the portfolio deck; failure scenario: the look on landing checks the bar against the report, does not know a dead-ends slice and a count of 25 should appear, and a missing slice or a wrong count passes; verdict: none.

## Declined to judge

- What only a drawn page shows: the per-deck "slide too tall" count (C1), the drawn Overview tiles, legends and headings (C3, C7, C8), the bar's "11 of 25 shown" text (C5), and whether the bar offers the stage `in-prep` to pick when no project holds it (C6). The reviewer runs no page; these are the orchestrator's look on landing.
- The 1.3 s cost of `projects/**/present` was not timed again: ruled by Axel as step O159 (main's state file line 201), so nothing here rests on it.
- Whether a failed project's slide on the portfolio deck may stand: ruled by Axel (rulings 684 and 685), and so his call.
- The drafts' voice and whether Axel prefers the builder's alternative title "Models and methods for clinical data": a matter of taste for his corrections at landing.
- The real hub's portfolio-deck case of `tests/checks/config/integrity.test.ts`: not run, since the hub files are not written; the rerun's `state ok`, `deck findings 0`, one group and `missing []` are what that case asserts, and the orchestrator runs it at landing.
- When 697 and 698 were closed in main's state file relative to when the report was written: not judged; the finding above rests only on what main's ledger holds now.

Reviewer usage: a6f3e70c7f1e62756, claude-opus-5-5, 210433 tokens, 47 tool uses, 9.7 min.

## Repair round 1, refuted

```
-- Hub texts cut from the report's fenced blocks (report lines 92-104, 110-117, 123-134) into a scratchpad folder; diff of each against the hub's file on disk
present.yml: line 1 (comment) removed, title 'Research projects', groups pillars/more/ideas replaced by projects { find: { folders: [projects/**/present], tiers: [research] }, discover: true }, order title.md, engine.md, { slides: projects }, closing.md
title.md: only lines 3, 4, 6, 8 differ
engine.md: only lines 4, 6, 10, 12 differ
tail -c1 | od -An -c: \n for each of the three

-- Verify 1, the rules file's perl gate over the three texts and over the report
(over present.yml title.md engine.md) printed nothing, gate exit 0
(over O150-report.md) printed nothing, report gate exit 0

-- Verify 2, the three node -e parses, typed as the report quotes them, from the worktree
{"deck":{"title":"Research projects"},"groups":{"projects":{"find":{"folders":["projects/**/present"],"tiers":["research"]},"discover":true}},"order":["title.md","engine.md",{"slides":"projects"},"closing.md"]}
{"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
{"kind":"section"}
-- the same over the cut files (yaml parseDocument)
present.yml errors 0 warnings 0 (same JSON)
title.md errors 0 warnings 0 {"kind":"title","kicker":"Research portfolio | technical briefing","legend":"projects"}
engine.md errors 0 warnings 0 {"kind":"section"}

-- Verify 3, git status --short in the worktree
 M .scratch/migration/agents/briefs/O150.md
?? .scratch/migration/agents/briefs/O150-cases.md
?? .scratch/migration/agents/briefs/O150-round-1.md
?? .scratch/migration/agents/reviews/O150-report.md
-- git diff d46fcfa2e --stat: .scratch/migration/agents/briefs/O150.md | 6 +++--- (the orchestrator's brief edit); the three briefs equal main's under cmp; the report equals main's copy under cmp
-- diff -rq ../O150-base/<d> <d>: config diff exit 0, src diff exit 0, tests diff exit 0, utils diff exit 0

-- Verify 4, npm run test:quick -- --base d46fcfa2e (once)
test:quick: 4 changed file(s), from git since d46fcfa2e
test:quick: 0 test file(s)
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.3 s)
ok      svelte-check (7.1 s): 1793985900460 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 9.6 s; every command passed

-- Unused exports, as the report quotes it, from the worktree's root
sh utils/unused-exports.sh 2>&1 | diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O150-base/unused-exports.txt -: printed nothing, unused diff exit 0

-- The case-run program, its source cut from report lines 300-381, run from the scratchpad over the cut texts
base exit 0 / new exit 0 / sub exit 0 / prep exit 0
diff of each output against the report's quoted output (lines 387-451, 457-525, 531-571, 577-595): base none, new none, submitted none, in-prep none
categories of the members: base 8 idea, 3 in-flight, 11 in-review, 2 publications; new 1 dead-ends, 8 idea, 3 in-flight, 11 in-review, 2 publications

-- C9, C10 and the count-token grep over the cut texts and the hub's closing.md
C9 grep exit 1
C10 grep exit 1
count grep exit 1

-- Item 7, the grep over oculus
grep -rn --exclude=local.yml -e 'more\.count' -e 'transition\.md' -e 'public artifact' src tests config docs README.md
tests/fixtures/hubs/demo/deck/present.yml:1:# Rules for what goes on a slide (a public artifact): ...
grep -rln --exclude=local.yml 'pillars' ... | wc -l: 109
deck-group form of the grep: LineCard.svelte 1, present.test.ts 4, deck-slides.test.ts 9, undo.test.ts 3, write-fixture.ts 2, hub-writes.test.ts 1, changes.test.ts 3, deck-edit.test.ts 1
grep for 'Research projects that have', 'Structured models', 'everywhere they hide', 'A recurring engine': exit 1

-- Hub premises and quoted deck lines (read only)
find projects -path '*/present/present.yml' | wc -l: 25
.oculus/config.yml:27: portfolio_deck: deck
ls deck: closing.md engine.md present.yml title.md transition.md
per-deck slide kinds and keys: 13 project slides with equation/specs/method/results, 1 project slide (ward-bttr-crosssubject) with specs/method/results and no equation, 9 idea, 2 text
ecg-readable-substrate/present/main.md:14-15: "## Key results" / "- In progress."
quantum-tensor-fl/present/main.md: one idea card, desc "Exploratory: quantum-inspired tensor networks or quantum federated learning, after a novelty check"
block-term words per deck (grep -c -i 'block-term|BTD|BTTR|BTTN|rank-(L|(R,L)|blocks'): btfno 16, bttn-incident-af 9, bt-operator-theory 5, dries-bttr-ecg 5, bttd-source-eeg 4, covert-applied 4, fed-faithful-ecg 1, florank-personalization 1, ward-bttr-crosssubject 1 (mechanism: line 38), every other deck 0
each line the report cites under "Proposed framing" (dries 30, 35; bttn 30, 32, 39; covert-applied 25, 26, 37-39, 45; btfno 8, 11, 17, 36, 42; bt-operator-theory 8; bttd-source-eeg 7; fed-faithful-ecg 12; florank 3) reads as quoted

-- Main's state file, section "Open items", now
None.
(stat: orchestrator-state.md modified Nov 6 18:23:31, O150-report.md Nov 6 18:22:18)

-- Scratch removed: ls <scratchpad> | grep -E '^r150': exit 1
```

### Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The cut `present.yml` holds `deck.title` as item 3 drafts it ("Research projects"), one group `projects` with `find: { folders: [projects/**/present], tiers: [research] }` and `discover: true`, no `slides`, `stages`, `forms`, `status` or `sort`, no comment line, four-space indent and single-quoted title; the rerun prints `order entries file:title.md, file:engine.md, group:projects, file:closing.md` and `group projects: members 25, kept 25, count 25, missing [], conflicts 0, candidates 0`.
- 2: holds. "Hub files" names the removal of `deck/transition.md`; C10 grep exit 1.
- 3: holds; Spec 1 and Spec 2 of the first review are closed. The re-check on the hub, claim by claim, against every deck the portfolio deck shows:
  - Title and heading "Research projects": all 25 members print tier `research` in the rerun, `quantum-tensor-fl` among them (`idea | nascent | quantum-tensor-fl | research`); every one of the 25 bears it out, and it stays true when every research project has a deck, since `tiers: [research]` keeps no other tier.
  - Lede "Research projects that have a deck of their own, each in its own slides.": every member path ends in the project's own `/present`, and slides 3 to 27 each carry one project; all 25 bear it out, `quantum-tensor-fl`'s one card (slide 23) included. It names the projects as those with a deck and makes no claim about the 70 without one, which is what round 1 item 1 asks.
  - Kicker "Research portfolio | technical briefing": the date is gone; the rest is the hub's words.
  - Engine line 4 "A recurring engine" and line 6 "recurs across several of the portfolio's projects": a claim about several decks, not every deck. Six decks bear it out on their own slides (bt-operator-theory, btfno, bttd-source-eeg, bttn-incident-af, covert-applied, dries-bttr-ecg); the 17 decks with no block-term word are not claimed. Of the 8 the report counts, `florank-personalization`'s card names a block-term adapter only as an option ("extended to HCCNet imaging or a block-term adapter"), the same kind of plan the report drops "irregular time" for, and `fed-faithful-ecg` is a failed project's text slide; the claim holds on the six without them, so no decision rests on the count.
  - Engine line 8 (kept): "per-block (time x lead)" by dries-bttr-ecg main.md:30 ("Every block <b>is</b> a (time x lead) weight map"), "(freq x lead)" by bttn-incident-af main.md:39, sparse cores by covert-applied main.md:45 ("87% zero entries"); every claim is borne out by a named deck.
  - Engine line 9 (kept): the (R,L) knob between CP and Tucker at matched budget by btfno main.md:17, 36 and bt-operator-theory main.md:8; scales by btfno main.md:11; modalities by covert-applied (per-party rank-(L,L,1) block factors, main.md:38, over the caption at 25); leads by bttn-incident-af main.md:32 (blocks on low-rank (freq, lead) subspaces), the weakest of the four but borne out.
  - Engine line 10 (redrafted, Proof 1 of the first review closed): lead-field constraint by bttd-source-eeg main.md:7; federation by covert-applied main.md:37-39 (a coupled block-term model across parties); differential privacy by covert-applied main.md:26 and 45; spectral operators for PDEs by btfno main.md:8 and bt-operator-theory main.md:8. Each setting is shown by a block-term deck. The dropped settings are as the report says: btfno main.md:42 is a plan ("could give HCCNet ... from irregular longitudinal history") and dries-bttr-ecg main.md:35 shows unaligned at chance.
  - Engine line 12: see item 4.
- 4: violated, Spec 1 below. The second clause holds for every deck; the first clause is false in the filter state of C6.
- 5: holds. `closing.md` is not in "Hub files"; the rerun reads slide 28 "Questions &amp;<br>collaborations welcome" unchanged.
- 6: holds. Three fenced blocks, each parsing and ending with one newline, and the removal of `deck/transition.md`; the diff against the hub touches only the lines the items ask for.
- 7: holds. The rerun greps give the report's hits; none names the research hub's deck groups or files; no oculus file changed (diff -rq, git status).

Cases of the brief's "Cases", with the cases ruling applied:

- C1: met for what the step owes under the cases ruling's point 2 and round 1 item 6: `state ok, deck findings 0` in all three new runs, `snapshot findings 0`. The per-deck "slide too tall" count is not verifiable without a page and is the orchestrator's at the look (the report's NOT DONE row says so); Spec 4 of the first review is closed as ruled.
- C2: met. `members 25, kept 25`, `research decks the groups do not hold: []`, `held decks of no research project with a deck: []`, `fed-faithful-ecg` (`dead-ends | failed`) and both `archive/published/2026` decks among the members; `research projects 95, with a deck 25`.
- C3: met. `slides 28`, title, engine, slides 3 to 27 one per deck, closing; `slide kinds {"title":1,"section":1,"project":14,"text":2,"idea":9,"closing":1}`; the nine idea decks are slides 16 and 19 to 26.
- C4: met, under the cases ruling's point 3: publications (hccnet-fl, dongho-ecg-clustering), in-review (11 by title), in-flight (ecg-af-fair exploring, then bt-operator-theory, btfno revision), idea (six nascent, then two scoping), dead-ends (fed-faithful-ecg), no deck of no category.
- C5: met on the reader. `kept 11, count 11`, 14 slides, legend `[hub:heart,hub:brain,hub:liver,hub:method]`; the drawn "11 of 25 shown" is the look's.
- C6: met on the reader. `kept 0, count 0`, 3 slides, legend `[]`, `deck findings 0`.
- C7: met. No count token or `legend: pillars` (count grep exit 1, C10 grep exit 1); legend `[hub:liver,hub:heart,hub:brain,hub:method,hub:meta,hub:privacy,hub:liverfl]`, the seven domains each once.
- C8: partial, Spec 1. The second clause and the no-count rule hold for all 25 decks, `ecg-readable-substrate` included (Spec 3 of the first review closed); the first clause fails when the filter keeps no deck.
- C9: met. `grep -n '^\s*#'` over the cut `present.yml`: exit 1.
- C10: met. The grep over the three texts and the hub's `closing.md`: exit 1.

## 1. Spec

- Report "Hub files", `deck/engine.md` line 12, and "Proposed framing", `engine.md:12`: "Next come research projects' own decks, one after another: ..." and "The first clause holds for slides 3 to 27 (C3), under any filter, and once every research project has a deck."; what is wrong: the cases ruling's point 1 asks that the sentence "stay true ... when the filter bar keeps any number of decks", and C6 is a state of the brief in which the filter keeps none. In that state the reader places title, engine, closing (the report's own in-prep run, reproduced: `slides 3`, slide 3 the closing), so the engine slide says decks come next and the closing slide comes next. The report's "under any filter" does not reproduce for that run. A wording that names the slides between the engine slide and the closing slide as coming from research projects' own decks would hold at zero as well; failure scenario: a presenter narrows the filter bar to a stage no deck project holds (C6's `in-prep`), and the engine slide promises the projects' decks while the next slide is the closing slide; verdict: item 4 violated, C8 partial.

## 2. Proof

- Report "Open items of the state file, verbatim": "- 700 (2026-11-06, the Lit-Watch measurement owed to Axel, ...) ... Recommended (a); (b) is the lazy option."; what is wrong: main's `orchestrator-state.md`, section "Open items", now reads "None.", and its "Closed items" opens with "Open item 700 (2026-11-06), closed by Axel the same day: (a), ... step O161"; `plan.md` Rulings holds "Open item 700 (2026-11-06): (a), ...". The state file was modified at 18:23:31 and the report at 18:22:18 (`stat`), so the copy was taken as round 1 item 4 asks and the item was closed after it; 697, 698 and 699 are correctly given as closed (Proof 2 of the first review closed). The decision resting on it: what the landing tells Axel still awaits his ruling; failure scenario: the landing report copies this section and puts the ruled item 700 back in front of Axel as open; verdict: none.

## 3. Standards

- none.

## 4. Behaviour

- Report "Before and after, for the look", C2: "Before, line 2 reads "24 projects", with slices for 4 categories: publications 2, in-review 11, in-flight 3, idea 8, and no dead-ends slice. After, line 2 reads "25 projects", with a fifth slice, dead-ends 1 (`fed-faithful-ecg`)."; what is wrong: the counts and the `failed` facts chip are now stated (Behaviour 1 of the first review closed: `shownWords` at `src/lib/state/boards/board/filter-menu.ts:354-356` gives "25 projects" when all are shown, `docs/decks.md` "The project facts strip" draws the stage as it is, `fed-faithful-ecg/project.yml:2` is `stage: failed`). The wording of the slices is loose: line 2 draws one label per category with one chip per stage, or per form under a row with `forms:` (`sliceGroups`, `src/lib/state/boards/board/facets.ts:217-249`), so after the step it gains a "dead-ends" label holding one chip, the stage `failed` with count 1, and the four category counts quoted are sums of several chips (in-flight's exploring 1 and revision 2, idea's nascent 6 and scoping 2); failure scenario: the look counts chips on line 2, finds more than five and takes the report as contradicted, or looks for a chip reading "dead-ends 1" where the line draws the label "dead-ends" and a chip "failed 1"; verdict: none.

## Declined to judge

- What only a drawn page shows: the per-deck "slide too tall" count (C1, the orchestrator's at the look under round 1 item 6), the drawn tiles, legends and headings (C3, C7, C8), line 2 of the filter bar as drawn (C2, C5), and whether the bar offers `in-prep` to pick (C6). The reviewer runs no page.
- `npm run diagrams`, quoted by the report: not rerun, since it writes into the worktree; `git status --short` shows no change under `docs/diagrams`.
- The report's "The list ran once after this report was written. No whole-suite command ran.": not verifiable without the builder's transcript.
- Whether engine lines 4 and 6 changed between round 0 and round 1: the round-0 report was rewritten whole and the round snapshot's `files.txt` is empty; both lines are inside ruling 698 (a)'s scope either way.
- Taste, for Axel's corrections at landing: the lede repeating the title's words and having no verb; the second clause of line 12 ("shows ... each where the slide states it") holding by being tied to what the slide states, as round 1 item 2 asked; the heading "Composable with constraints" over a list in which spectral operators for PDEs is no constraint (the report names this); line 9's "leads" resting on per-block (freq, lead) subspaces, a reading a careful reader might dispute.
- `npx vitest run tests/checks/config/integrity.test.ts` on the real hub's portfolio deck: not run, since the hub files are not written; the orchestrator runs it at landing.
- The 1.3 s cost of `projects/**/present`: ruled by Axel as step O159.

Reviewer usage: aeed84f6aa7d43a48, claude-opus-5-5, 193071 tokens, 44 tool uses, 7.0 min.

### Closed, over round 1

- Spec 1 (engine line 12 at zero decks): small and inside the brief (the cases ruling's point 1), fixed at landing: line 12 reads "Each slide from here to the closing slide comes from a research project's own deck: a project slide shows its project's governing equation, specs, method and results, each where the slide states it.", which holds for any number of decks the filter keeps, none included.
- Proof 1 (the report's open-items copy): no change; the landing report copies the open items from the state file as they stand at landing.
- Behaviour 1 (the slices' wording): closed at the look, which reads line 2 as one label per category with its stage chips, the new label "dead-ends" holding one chip "failed 1".
- Declined to judge, the heading "Composable with constraints": raised as open item 703.
