# Step O151 brief check (on main at 54384d7e5)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O151.md` (109 lines, untracked on main: `git status --short` printed `?? .scratch/migration/agents/briefs/O151.md`). The research hub was read only. `config/local.yml`, the hub's `.oculus/local.yml`, `~/.oculus/connect/` and `agents/reviews/O150-O151-undone.patch` were not read. No confidential text is quoted below; only the marker words that say a passage is confidential are.

`plan.md` has no Goal section: `grep -n -E '^#+ .*[Gg]oal|^Goal' .scratch/migration/plan.md .scratch/migration/orchestrator-state.md` printed nothing, and the file's preamble says only "Execution ledger for `tools/oculus/DESIGN.md`". Below, "the goal" is the part the step line delivers: every research project's deck states the project's current numbers and framing, so a reader in front of the slide understands the project, with every deck read in the Present view and no finding left.

## 1. Names

The step changes the hub's project deck files (`<project>/present/present.yml`, the slide files and the figures), changes the `kind:` of 11 slides (9 `idea`, 2 `text`) to `project`, and drops the old figure files that are not carried over.

- `deck/engine.md:12` and `deck/title.md` in the hub, which O150 writes. `sed -n 23,24p .scratch/migration/agents/briefs/O150.md` shows that O150's item 4 makes the engine sentence say "(25 of the 95 research projects)". Its item 3, under ruling 698 (a), redrafts the deck's framing "so that every claim holds for all 25 decks". Its C8 checks the sentence against the 25 decks. Once O151's 95 decks are copied into the hub, the count is false, and the framing has been checked against 25 decks only. The 70 new decks include `coauthor/published/2017/http2-best-practices` and `coauthor/published/2016/chi-household-survival`, which the 25-deck check never covered. Neither file is in O151's "Paths this step writes". **Made false.**
- The hub's `deck/present.yml` `ideas` group (lines 26-38, `sed -n 26,40p deck/present.yml`) names the 9 idea decks in its `slides:` list, and a `kind: grid` entry draws it (line 48). `docs/decks.md:343` says a grid card is "the card of its first idea slide, or else a card of the project's name, domain and stage". If the new decks are copied into the hub while this group is still there, the 9 cards lose their descriptions. O150 removes the grid (ruling 678). **False only if O151's hub copy lands before O150's hub change.**
- `kind: idea` and the deck file names in oculus: `grep -rn --exclude=local.yml -E 'fl-privacy-auditing|ecg-readable-substrate|fed-faithful-ecg|eq_rawpls|present/main\.md' src tests config utils docs README.md` matched only synthetic fixtures (`tests/fixtures/hubs/deck-hub.ts:55`, `tests/data/hubs/decks.test.ts:177`, `tests/data/sources/present.test.ts:140` and others). Not made false.
- Links into the old deck files from elsewhere in the hub: `grep -rln -E 'present/(main\.md|present\.yml|[A-Za-z0-9_-]+\.png)' projects deck docs | grep -v '/present/'` printed nothing. Not made false.
- Duplicate deck names (a deck is named by its project's folder, `docs/decks.md:73`, and two decks of one name in one group are both left unplaced, `docs/decks.md:135`): `awk -F/ '{print $NF}' research.txt | sort | uniq -d` printed nothing. No collision.

Findings:
- N1. When the decks are copied into the hub, the count in O150's `deck/engine.md:12` becomes false. O150's framing (ruling 698) has been checked against 25 decks, and after the copy it has to hold for 95. The fix: widen O151's paths to `deck/engine.md` so the count sentence is rewritten to hold at O151's landing. The framing sentences of `deck/title.md` and `deck.title` are words Axel corrects under ruling 698, so the builder drafts versions that hold for all 95 decks, and those drafts go to Axel as an open item. They are not written into the hub. Dropping this from the brief is the lazy option.
- N2. The brief should say that the orchestrator copies the decks into the hub only after O150's hub change has landed. The look must also run with O150's portfolio deck in the scratch hub.

## 2. The step line

`grep -n '^- O151' .scratch/migration/plan.md` gives line 1704.

- "after O156 and O157": both are ticked (`grep -n -E '^- <white heavy check mark> O15[0-9]|^- O15[0-9]' plan.md`: lines 1698 and 1700 carry the check mark). No requirement is needed.
- "every research project's deck under its `present/`": item 1 and C1.
- "written from the project's own manuscript, README.md, manifest and CLAUDE.md": item 3 and "Read" 2.
- "the 70 projects without a deck get one, and the 25 existing decks are reworked the same way": item 1 and C9.
- "every number on a slide is the project's current number": item 3, with C4 for 10 decks only (see Q4).
- "every framing the project's current one": item 2 (`title:` "in the project's current framing") and item 3 (`CLAUDE.md` for framing).
- "the failed and stopped projects written like every other (ruling 685)": item 2 and C5.
- "every slide titled": item 3 and C3.
- "each deck read in the Present view with no finding left": items 5 and C10. Only part of this is met. The reader raises no finding for an unknown front-matter key (`docs/decks.md:347`), and item 5 does not deliver "no finding left" for Too tall (see C-4 and Q10).
- "built by a builder agent": the brief is a builder brief.
- "the hub commit on the user's word": the premise "Writes to the hub".

Findings: none with no requirement at all. The parts that are only partly served are findings Q4, Q10 and C-4.

## 3. Premises

- 95 research projects. `find projects -name project.yml` with a `grep -q '^tier: research'` filter gave 95 (99 manifests in all; `grep -h '^tier:'` printed 95 research and 4 software). The depth split by `awk -F/ '{print NF}'` was 54, 9 and 32. The groups were archive/failed 4, archive/phd 1, archive/stopped 2, coauthor/active 1, coauthor/stopped 1, 20 archive/published and 12 coauthor/published. Matches.
- 25 decks and 70 without (`test -f $p/present/present.yml` gave `decks 25`). The stage counts (`grep -h '^stage:'`): published 30, submitted 12, nascent 18, scoping 9, exploring 7, de-risking 5, accepted 3, failed 4, stopped 4, revision 2, in-prep 1. Matches.
- Sources, by the brief's three commands: tex+pdf+readme 18, tex+pdf 10, pdf 19, readme 45, pdf+readme 1, nothing 2. `CLAUDE.md` in 18. The two manifest-only projects are `archive/stopped/algebraic-subtyping` (which also holds `todo.md`) and `coauthor/stopped/individual-reference-intervals`. Fermat's sources are under `manuscript/latex/`. Matches.
- The 25 decks' kinds (`grep -h '^kind:'` per deck): 14 project, 9 idea, and 2 text (`ecg-readable-substrate`, `fed-faithful-ecg`). Matches. The brief cites O150's builder for this count; a grep of the brief's own would do.
- The raw-pls folder: `ls` printed `main.md`, `present.yml` and seven `.png` files, `eq_rawpls.png` among them. Matches.
- The tag classes (`grep -h -A1 '^tag:'`): measured 8, design 2, mixed 2, proof 2. Matches.
- "A figure is a file of the deck's folder ending in `.png` ... (`src/lib/data/sources/deck/project.ts:23`)". **Differs.** `project.ts:23` is `IMAGE_SUFFIXES`, used only by `equationIsImage`, the check that an `equation:` does not name an image. Panels' figures are resolved on disk by `resolveIn` (`files.ts:45-61`, called from `read.ts:505-508`), with no suffix check. The five-suffix rule is a sound rule for the brief to set, but the cited line does not say it.
- The case-run route "with the scratch files handed in as the reader's drafts (`read.ts:260-264`)". **Does not work for this step.** `read.ts:304` returns `no_file` when `present.yml` does not exist on disk, whatever `drafts` holds. `projectDirs` (`read.ts:266-275`) maps only folders `realOf` finds on disk (`files.ts:21-27`, `realpathSync`). Figures are resolved on disk (`files.ts:52-53`). So the draft route cannot read the 70 new decks, and for the 25 old ones it checks figures against the old folders. A case run has to give the reader a hub root where the scratch decks exist on disk, with the projects taken from the hub's manifests.
- Confidential sources. `grep -n -o -i -E 'confidential[a-z]*|in confidence|...'` over every research project's `README.md`, `CLAUDE.md` and `project.yml` gave `ecg-af-fair/README.md:32` (Confidential, data-transfer agreement, DTA), `ecg-af-fair/README.md:40` (DTA), `ecg-af-fair/project.yml:18` (DTA) and `cirrhosis-digital-twin/README.md:3` ("in confidence"). Reading the context of the other hits (loewner:78, engram:118 and 166, hccnet-fl-sweden:16, fedlink:9, bttd-source-eeg:42) showed they are ordinary uses of the words. The brief's two lines match. The brief does not say how far each marker reaches (see C-6).
- `.agents/worktrees/` is git-ignored: `.gitignore:12` is `.agents/*`. Neither `.agents/worktrees/O151-hub` nor `.agents/worktrees/migration-O151` exists yet (`test -d`).
- No ADR folder: `test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`, and `grep -n adr .agents/plan.yaml` printed nothing. Matches.

Findings:
- P1. The `project.ts:23` citation is wrong. It should cite the brief's own rule, or `docs/decks.md:372` for the drawable kinds.
- P2. The drafts route for the case run fails for 70 of 95 decks and for every figure. The brief should name a reader context whose hub root is the scratch deck tree, with the projects taken from the hub's manifests.
- P3. The brief names no base copy and no `unused-exports.txt`. The state file's standing demand at `orchestrator-state.md:157` asks every brief for both, and for the doc paragraphs that describe the changed behaviour, each marked still true or rewritten. `spec.md` "Where you work" builds the report's file table from `diff -rq` against the base copy. The brief should name the base copy, or say that no oculus file changes and the file table is `find <scratch tree> -type f` plus the report.

## 4. Cases and checks

- C1 to C3, C6, C8 and C9: consistent with `spec.md` and `docs/decks.md`.
- C4: consistent, but narrow (see Q4).
- C5: consistent with ruling 685. It does not name the four stopped projects. `grep '^stage: stopped'` over the research list gives `archive/stopped/algebraic-subtyping`, `archive/stopped/connectivity-motor-imagery`, `ideas/fedbtd` and `coauthor/stopped/individual-reference-intervals`.
- C7: consistent. The scope of each marker is undefined (C-6).
- C10: consistent with `spec.md` "A builder runs no page".

Findings:
- C-1. The brief tells the builder to read each project's `CLAUDE.md`. `spec.md` "Read first" 3 says "Do not read the hub's instruction file (`CLAUDE.md`...)". The step line names `CLAUDE.md`, and the rule targets the hub's root file, so the two do not clash. But a project's `CLAUDE.md` is written as instructions to an agent: `raw-pls/CLAUDE.md:8` and `btfno/CLAUDE.md:8` are headed "Framing discipline (do NOT regress)", and `raw-pls/CLAUDE.md:11` marks some results "private, never reported". The brief should say a project's `CLAUDE.md` is read as a source of the project's framing and facts, and that nothing in it binds the builder.
- C-2. `spec.md` "What every package obeys", last paragraph: "A brief may also name lines of hub text a builder rewords by hand ... the report lists each line before and after". For the 25 rewritten decks the brief asks for no before and after. Whole-file before and after for 25 decks would be large. The minimum is a per-deck list of the old folder's files and what became of each (kept figure, left out). The brief should say which form it wants.
- C-3. The brief's report list leaves out what `spec.md` "Report" and the state file's standing demand (`orchestrator-state.md:77`) ask for: the files changed with line counts, and the number of runs of the verify list.
- C-4. Item 5 has repair round 1 split or cut the slides marked Too tall. The configuration block has `repair_rounds: 1  # one round and never a second`, and `refute_after_repair: yes`, whose findings "are fixed at landing or booked, never sent back" (`sed -n 1,30p orchestrator-state.md`). The plan does not meet ruling 679, for these reasons:
  - A slide split in round 1 is never measured again before the review. A split slide can still be too tall, and the review over the round cannot send it back.
  - What is left would then either be rewritten by the orchestrator at landing, which goes against the ruling "No inline builds" beyond a small fix, or be booked, which ruling 679 forbids ("the same step splits or cuts").
  - Round 1 also has to carry the review's findings.
  - The measurement depends on the facts strip's height (`docs/decks.md:389`: "The strip keeps its room ... so the slide's layout and its Too tall finding do not change"). O158 is not ticked (`plan.md:1702`) and its review is running (state file dispatch `reviewer_report: "running: a7c36a3b237a4d3c2"`). Ruling 699 makes O158's strip wrap "to as many lines as its facts need (three on today's decks)". A measurement taken before O158 lands goes stale when it does.
  - It also depends on the app's text scale (ruling "O157 brief check": the surfaces take the app's text scale).

  What should meet 679: the Too tall pass runs inside the build, before the review. The orchestrator measures on a scratch server holding O158's strip, at a named text scale (the default). It sends the list to the builder as part of the build, in the same pattern as the dispatch entries' "build after the cases ruling" (O150, O158). Measuring and splitting repeat until the portfolio deck's Overview marks no tile Too tall. Only then does the review run, and repair round 1 stays free for the review. Add "after O158" to the step line, or have the measurement wait for O158. Separately, "cut" must be defined. The ruling "Slide layout from content" rejected "removing figures" and "shrinking a figure", so a cut may remove words only, never a figure or a number the slide's claim rests on, and a split is preferred.
- C-5. The scratch tree's place. `spec.md` "Where you work" says every path in the brief is relative to the worktree, and "never in the main checkout". `.agents/worktrees/O151-hub/` therefore reads as `<worktree>/.agents/worktrees/O151-hub/`. The brief's text ("a scratch copy ... which the orchestrator copies into the hub") reads as the main checkout's `.agents/worktrees/O151-hub/`, which is outside the builder's worktree. The brief should give the one path, inside the worktree (ignored there by the same `.agents/*` line), and say the builder creates it. It should also say the landing copy replaces each project's `present/` folder whole. Item 1 says "every other file of the old folder is left out", which an additive copy would not do.
- C-6. The confidential rule's scope. In `cirrhosis-digital-twin/README.md`, line 3 marks a proposal "shared in confidence", and the README has a whole section, "## The 2025 PIHC proposal", drawn from that proposal (`sed -n 1,12p`). The marker covers that section, and every number or method taken from the proposal, as well as the marked sentence. For `ecg-af-fair`, README:32 marks the cohort data confidential under the DTA, and the manifest's `next:` (project.yml:18) carries cohort counts. The brief should say whether descriptive counts of the DTA cohort may appear. My judgment is that they should not, unless a public source carries them. Whether the cirrhosis-digital-twin deck can state its idea at all, given that the idea comes from that proposal, may be Axel's call; see "Declined to judge".
- C-7. Characters. The brief's Conventions hold every deck file to the rules file's ASCII set, with only `<b>`, `<i>`, `<br>` and `&amp;` as exceptions. The existing decks also use `&gt;`, `&nbsp;`, `<sub>` and `<sup>`; `grep -ho -E '&[a-z]+;|<(b|i|br|sub|sup|em|strong)>'` gave `&gt;` 2, `&nbsp;` 4, `<sub>` 1 and `<sup>` 3. `hccnet-fl-sweden/present/main.md:3` holds a real name with `<o with diaeresis>`. The hub's rule keeps accented letters in real names, and the rules file's gate allows them only under `config/`. The brief should say how a name with an accented letter is written. The HTML entity (`&ouml;`) keeps the file ASCII and the name right.
- C-8. Dead-ends of a live project. READMEs carry dead-ends and retracted numbers: `dries-bttr-ecg/README.md:38` "The single-seed AF-in-SR pilot is RETRACTED", and `raw-pls/CLAUDE.md:11` marks targets "private, never reported". Ruling 684 and the withdrawal of 690 and 695 (`plan.md:3590`) say a deck is no publication, but the brief does not say whether a live project's dead-ends go on its deck. It also does not say that a number the sources mark retracted, superseded or not surviving is never presented as a result. Without that, 95 decks each make their own choice.

## 5. The question

- C1: yes, it could pass without the goal. It counts files, and 95 one-slide decks with thin lists pass it.
- C2: yes. A front-matter value of the wrong shape "is read as absent" with no finding (`docs/decks.md:347`), and an unknown key changes nothing with no finding.
  - Every manifest's `eli5` is a text. A survey of the line after `eli5:` in each `project.yml` found 95 one-line texts and no map. The slide's `eli5` is a map `{ purpose, plain }` (`docs/decks.md:360`). An `eli5:` copied as a text draws no callout and raises no finding.
  - LaTeX in a double-quoted YAML scalar is silently corrupted. `node -e 'require("yaml").parse(...)'` read `e: "\beta + \frac{a}{b} + \nabla + \theta"` as `"\beta + \frac{a}{b} + \nabla + \theta"` in JSON form, where each `\b`, `\f`, `\n` and `\t` is now a control character, with no error. `"\sum_i"` was an error ("Invalid escape sequence \s"). The single-quoted form kept the backslashes.
  - The existing decks write `equation:` as plain scalars (`grep -h -E '^equation:'`), which keep the backslashes.
- C3: yes. A project slide is titled by its `title:` or else by its project's short name (`docs/decks.md:431`), so a project slide always passes.
- C4: yes. It traces the numbers of 10 decks. The other 85 can carry untraced or wrong numbers and pass.
- C5: partly. It is a reading against "their numbers and what was found", with no list of which numbers.
- C6, C7 and C8: no, each checks its own item. C8 checks that a figure exists, not that its caption matches what the figure shows.
- C9: no for the kind. Its content falls under C4's narrow sample.
- C10: yes. It lists the slides marked Too tall and requires none of them fixed.
- Item 2 ("A project whose sources hold more than one slide can carry adds further slides"): the sentence is garbled, and further slides are optional. A deck of one slide per project, a manuscript with several main results included, meets the brief's text.
- Item 5: yes, for the reasons under C2 and C10.
- Verify 6: a self-reading. Reasonable as it stands.

Findings:
- Q2. Add a requirement and a case-run check that every front-matter key has the shape `docs/decks.md` "Front-matter keys" gives: `eli5` a map of `purpose` and `plain`, `tag` a map, `specs` and `panels` lists of maps, `method` and `results` lists of text, and no key outside the guide's list. Require LaTeX in plain or single-quoted scalars, and have the case run report any parsed value holding a control character.
- Q3. C3 should name the slides it really tests: the non-project slides, each titled by a level-1 heading.
- Q4. Trace every number of every deck, with a table per deck in the report. The 10-deck sample is not enough.
- Q-thin. Set a content floor that keeps the decks from being thinned. For a project with results: each headline result with its number, the comparison it is measured against, the data size, and the uncertainty where the source gives one. For a manuscript with more than one main result or figure, a further slide for each, of the kinds the guide names. For an idea: the question, the planned method and what is known. Rewrite the garbled sentence in item 2 as a requirement.
- Q10. Item 5 and C10 need "no slide marked Too tall at landing", met by the in-build measuring of C-4.

## 6. Implied inputs

This is not a code step in the sense of the check. The decks are data that one parser reads, so the inputs it implies are listed here. Each is missing from "Cases", with the result expected:

- A manifest `eli5` that is a text (all 95): written as `eli5: { purpose, plain }`, with `plain` from the manifest.
- LaTeX holding `\b`, `\f`, `\n`, `\t`, `\r`, `\v`, `\e` or `\0` in a double-quoted scalar: written plain or single-quoted, and no control character in the parsed value.
- A manuscript with several root files or superseded files. `find .../manuscript -maxdepth 2 -name '*.pdf'` gave btfno 6 PDFs (main, supplement, `btfno-axel-faes.pdf`, `ReproducibilityChecklist.pdf`) and phd-thesis 8. Fermat has `main.tex`, `main_work.tex`, `supp.tex` and `cover_letter.tex`, all with `\documentclass`, plus `manuscript/main.pdf`, `latex/main_work.pdf` and `latex/fermat.pdf`. hccnet-revision has 19 tables, among them `results_*_original.tex`. Expected: the source is the root `.tex` the manuscript's PDF is built from, followed through its `\input`s, with the supplement for its own results. It is never an `*_original*` table, a `main_work`, a cover letter or a response letter. For a published project, the brief should say whether the published PDF or the `.tex` wins where they differ.
- A manuscript result where the README records a newer run (stage `revision` or `in-prep`): item 3 takes the manuscript's number. The brief should say whether that holds when the README records a re-run the manuscript has not taken yet. My judgment: the manuscript's number for a submitted or published claim, and the README's newer run for a manuscript in revision, with the disagreement named in the report either way.
- A number the sources mark retracted or not surviving (`dries-bttr-ecg/README.md:38`): never a result on a slide.
- A project with no figure file. `find` over `manuscript/`, `results/`, `figures/` and `present/` for the five suffixes: 24 projects hold one and 71 hold none. `ecg-readable-substrate` has only PDF figures. Since no figure is converted, these decks carry no `panels:`. The brief should say so, so that no figure is extracted from a PDF.
- A figure outside the four folders. `hccnet-pathology`'s only images are in `notes/figures/` (5 files). The brief should either add that folder or say it is out.
- PDF-only manuscripts. `mdls -raw -name kMDItemNumberOfPages` gave 20 PDFs totalling about 455 pages, among them a 145-page bachelor thesis, a 99-page and a 62-page master's thesis, and a 34-page paper. The read tool takes 20 pages per request. The brief should say which parts of a long document are read: the abstract, the method summary, the results with their tables and figure captions, and the conclusion.
- A name with an accented letter (C-7).
- A failed project whose derivations are under `notes/derivations/` (`faithful-block-term-layer`, `jacobian-coupled-blockterm-dp`): outside the step line's sources. This needs a sentence only if the brief wants them.

Findings: each item above is missing from "Cases".

## 7. ADRs

- No record: `test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`, `.agents/plan.yaml` names no `adr`, and `find . -name '[0-9][0-9][0-9][0-9]-*.md'` outside `node_modules` printed nothing.

Findings: none.

## 8. Dictated text

- "Everything in the brief is done" (`grep -n 'Everything in the brief is done' .scratch/migration/agents/briefs/O151.md` gives line 101): holds. It is the rules file's own words ("Report").
- `deck: { title: ... }`, `order:` and the `tag.class` words `measured`, `proof`, `design`, `mixed` (lines 15 and 32): code shapes from `docs/decks.md`. They hold.
- The brief dictates no slide text.

Findings: none.

## Declined to judge

- Whether the `cirrhosis-digital-twin` deck may state its idea at all. The idea comes from a proposal shared in confidence (README:3), and the README's own summary of it is in its first paragraph. That is Axel's call if the session cannot settle it from the files. If it cannot, it is a stop.
- Whether the facts used in the cohort descriptions under the DTA are confidential beyond what README:32 says: a judgment on the agreement, outside what a read settles.
- Whether one builder can do the work to the standard. This is a judgment, not a measured fact. The sources are large: `wc -c` totals were README 875,024 bytes, `.tex` 2,760,198 bytes (every `.tex` under `manuscript/`), `CLAUDE.md` 60,145 bytes and manifests 210,206 bytes, plus about 455 PDF pages. That is far more than one context holds, so the builder's context will be compacted during the work. My judgment is that one builder can do it only if the brief says:
  - work project by project: read one project's sources, write its deck, and write its report rows and traces into the report, before reading the next project;
  - read the parts of a document that the deck states, and read them whole;
  - trace every number of every deck (Q4);
  - meet the content floor of Q-thin.

  Without these, the decks written after a compaction will be thin and their numbers untraced. Splitting the step is not proposed.
- What the look at landing must check. This is the session's call; these are the points the brief's C10 and its "before and after" should name:
  - a scratch server on 8797 over a scratch hub, with each project's `present/` replaced whole by its new deck, O150's portfolio deck in place, and O158's strip landed, at the default text scale;
  - the portfolio deck's Overview with Clear all and Mine only off, since `docs/decks.md:378` says Mine only is on by default and hides decks whose projects are not yours, including the coauthor ones. Every tile is drawn with none marked Too tall, and every tile sits in the deck order (O155);
  - the Findings view with no finding on any of the 95 decks;
  - each deck opened from the deck menu, with every figure drawn (no gap) and every equation drawn as a formula;
  - on each deck: the eli5 callout present, the tag chip in its class's hue, the spec chips, and the Method and Results lists;
  - the facts strip showing `failed` and `stopped` as they are (ruling 684);
  - the 9 former idea decks and the 2 former text decks drawn as project slides;
  - the accented name drawn correctly;
  - `ecg-af-fair` and `cirrhosis-digital-twin` read against their sources for anything confidential.
- Usage line: left for the session.

Agent usage: af22dc2fbdb77b4ae, claude-opus-5-5, 211381 tokens, 60 tool uses, 16.4 min.

## Closed

Each finding closed by the orchestrator in the brief `agents/briefs/O151.md` as rewritten after this check (held here, no second brief check):

- N1: C15 has the builder read each sentence of O150's portfolio texts against the 95 decks and draft a version for Axel of each one the new decks make false; no hub file is written. O150's round-1 texts carry no count (its line 12 has none), so the count the check names is gone from the texts that land.
- N2: "Writes to the hub" and Decision 4 say the copy into the hub comes after O150's hub change, each `present/` replaced whole; C10's look runs with O158 and O150 landed.
- P1: the figure rule now cites `docs/decks.md:361` and `:363` and is the brief's own rule.
- P2: "The deck reader" premise and the Cases preamble give the reader context whose `hub.dir` is the scratch tree, the projects from the hub's manifests; the drafts route is removed.
- P3: "No base copy" says no oculus file changes, the file table is `find .agents/O151-hub -type f` with line counts, and no doc paragraph or head comment describes a changed behaviour.
- C-1: item 3 says a project's `CLAUDE.md` is a source of framing and facts and binds nothing.
- C-2: C9 and the Report ask, per old deck, each file of its old folder and what became of it.
- C-3: the Report asks the file table with line counts and the number of runs of the verify list.
- C-4: item 5 and C10: the Too tall pass runs after O158 and O150 land, at the default text scale, until none is marked; a cut removes words only, a split is preferred; the step line says the pass waits for O158 and O150. How the measured list reaches the builder (inside the build before the review, or in repair round 1) is settled by ruling 679: inside the build, before the review, repeated until none is marked.
- C-5: the scratch tree is `.agents/O151-hub/` inside the worktree, made by the builder, ignored by `.gitignore:12`.
- C-6: item 4 gives the scope of each marker: no `ecg-af-fair` cohort count unless a public source carries it (Decision 3); for `cirrhosis-digital-twin` nothing from the proposal, the deck holding only name, stage and manifest facts not taken from it, until open item 702 is ruled.
- C-7: Decision 7 and C14: accented letters as HTML entities; the tags and entities the decks use are listed.
- C-8: item 3 and Decision 6: a number marked retracted, superseded, private or never reported is never on a slide; a live project's dead-ends only where the README makes them part of the current result; C13.
- Q2: item 5, Verify 2, C11 and C12: the front-matter shapes, no key outside the guide's list, LaTeX plain or single-quoted, no control character, each printed by the case run.
- Q3: C3 names the non-project slides and their level-1 heading.
- Q4: C4 traces every number of every deck, one table per deck.
- Q-thin: item 2's content floor, and the garbled sentence rewritten as a requirement.
- Q10: C10 requires no slide marked Too tall.
- Section 6, implied inputs: item 3 gives the manuscript root, the PDF over the `.tex` for a published project, the README's newer run for a manuscript in revision or preparation, the parts of a long PDF read, no figure from a PDF, figures from any folder of the project (`notes/figures/` included); `notes/derivations/` stays outside the sources the step line names.
- Declined to judge, the size of the work: the paragraph after item 6 has the builder work project by project, writing each deck's report line and traces before reading the next; the parts of a document read whole; every number traced; the content floor.
- Declined to judge, the look: C10 and the landing's look carry the points listed (Mine only and Clear all off on the portfolio Overview, the Findings view, every figure and equation drawn, the strip's `failed` and `stopped`, the accented name, the two confidential decks read against their sources).
