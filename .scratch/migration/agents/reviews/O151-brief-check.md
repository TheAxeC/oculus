# O151 brief check

## Names

1. Place: hub `deck/engine.md:12`, outside "Paths this step writes". Command: `cat -n deck/engine.md`. Output: `12 Each of the next slides leads with the governing equation, then specs, method, and results.` What is wrong: O151 adds about 38 `kind: idea` slides and project slides that may carry no `equation` (item 1's field list leaves `equation` out), so the step makes this sentence much more false than it is now. This is open item 689 (`orchestrator-state.md:184`), which is still unruled, and the brief does not mention it. Lines 6-10 of the same slide say the block-term "middle ground recurs across the portfolio". That is a judgment I give no verdict on, but once the HTTP/2, CHI and type-theory decks join the portfolio deck, the claim covers them too. Change: the brief names open item 689 as a hub text that O151 makes false, and says the step lands only with Axel's ruling on 689 applied, or that 689 is carried in the step's report.
2. Place: hub `README.md:60` ("`project.yml` + an optional `present/` deck") and `.agents/skills/project-cleanup/SKILL.md:21` ("Optional, kept as-is when present: **`present/`**"). Command: `grep -rn "present/\|present\.yml" --include='*.md' --include='*.yml' .` in the hub, with `projects/**/present` excluded. Both stay true, because personal and software projects have no deck. The step makes nothing false here.
3. Place: oculus `tests/checks/config/integrity.test.ts:45-49` (`REAL_FLOORS: Floors = { decks: 14, equations: 13 }`, a floor). Command: `grep -n "deck\|present" tests/checks/config/integrity.test.ts`. The floor stays true with 95 decks. The step makes nothing false here.
4. Slide keys. Command: a yaml read of the 14 project front matters. Output: `btfno missing [] extra ['eli5', 'extra']`, `covert-applied missing [] extra ['eli5', 'extra']`. What is wrong: `extra:` is a key no reader reads (`grep -rn "meta.extra\|'extra'" src/lib/data/sources/deck/ src/lib/views/academic/present` prints nothing). The brief's premise list of project keys (line 19) leaves out both `eli5` (9 slides carry it, and it is read) and `extra` (2 slides, read by nothing). Change: the premise lists the keys as they are, and item 2 or a new item removes or moves `extra:` on those two slides, since item 4 demands "no unknown key".

## The step line

Each part of the line maps to a requirement, with one exception.
- "a deck under `present/` for each of the 70": item 1 and C1.
- "the failed and stopped ones written like every other": item 1, bullet 2, and C2.
- "each slide titled": item 1, bullet 4, and item 2.
- "drawn from the project's `README.md`, manifest and manuscript": item 1, bullet 3, and C3.
- "every existing project slide that O146's finding marks too tall split ... or cut": item 3. Item 3 widens it to all 95 decks, which is fine.
- "every slide without a title titled": item 2.
- "written by the orchestrator in the hub": the executor paragraph (brief line 7).
- "each project's deck read in the Present view with no finding left": item 4, C4 and C5.
- "after O146 and O148": both are ticked (`grep -n '^- ' plan.md` shows `- <white heavy check mark> O146` at line 1682 and `- <white heavy check mark> O148` at line 1686).

1. The exception is "committed on the user's word". It is stated only in the preamble (line 7: "The hub's change is committed only on Axel's word.") and no item of "What to build" or of the report carries it. Change: the report's first line or a DONE / NOT DONE row states that the hub commit waits on Axel and names the paths it will stage. That also guards C7.

## Premises

Every premise below was rerun. Unless noted, the command is `python3 .../scratchpad/o151check/enum.py .../O151-projects.txt`, a yaml read of every `projects/**/project.yml` with `code/` pruned.

Premises that hold:
- The hub's `git status --short` matches the brief exactly: funding.yml, `deck/present.yml`, `deck/title.md`, ` D deck/transition.md`, the fwo-senior-transplant files. `git status --short projects` prints nothing.
- `manifests 99`, `tiers Counter({'research': 95, 'software': 4})`, `with 25 without 70`.
- Stages of the 70: `{'published': 30, 'nascent': 12, 'scoping': 7, 'exploring': 6, 'de-risking': 5, 'stopped': 4, 'failed': 3, 'in-prep': 1, 'accepted': 1, 'submitted': 1}`.
- Folders of the 70: `{'ideas': 26, 'archive': 24, 'coauthor': 14, 'active': 5, 'manuscripts': 1}`.
- `README 39`, `tex 9`.
- `list == without True 70`: the scratchpad list is exactly the 70.
- `basename dups research []`, `basename dups all tiers []`.
- The 25 decks: each holds `main.md` with `grep -c '^---$'` = 2, and `present.yml` holds `deck.title` and `order: [main.md]`. Kinds: 14 project, 9 idea, 2 text.
- The line numbers: `kinds.ts:234` is `function ideaCard` (233 is its doc comment) through `:247 return card;`; `:375-377` is the project title rule; `:379-388` is the idea case; `project.ts:1-8` is the head comment naming the keys.

Premises that are wrong:
1. The figure rule is false. Commands: `sed -n 45,69p src/lib/data/sources/deck/files.ts`; `sed -n 461,466p` and `sed -n 514-516p src/lib/data/sources/deck/read.ts`. Output: `const folder = 'path' in from ? dirname(from.path) : doc.dir;` and `const at = resolveIn(doc.root, folder, name);`. `resolveIn` returns `outside` only when the path leaves `root.dir`, which is the served hub root, not the deck's folder. So `../manuscript/figs/x.png` resolves and is drawn. Brief lines 20 and 23 ("a `figure` that must lie in the deck's folder, else a finding"; "a figure outside the deck's folder is refused") are therefore wrong. Change: the premise states the rule as the code has it. Decision 3 (copy into `present/`) is kept or dropped on its own reasons: a self-contained deck, matching how `docs/HELP.md:331` handles a dropped image ("A dropped image is copied into the deck"), against binary duplicates added to the hub's git. Each reason is stated.
2. Front-matter counts are off. Command: the key count above. Output: `'equation': 13, 'panels': 13, 'eli5': 9, ... 'extra': 2`. `bt-operator-theory` has no `panels` and `ward-bttr-crosssubject` has no `equation`. Change: correct line 19 (see Names 4).
3. "The Project facts strip ... keeps 28 px" (line 22) is not a constant in the code. Command: `grep -rn "28\b" .../Facts.svelte .../Slide.svelte .../Stage.svelte` prints nothing. The 28 px comes from one look in `agents/reviews/O148-landing.md:25`. The code clamps the strip to two lines, and the type scales with `--text-scale` (`src/lib/themes/slide.css:9-12`, `calc(24px * var(--text-scale, 1))`). Change: say the strip is up to two lines and scales with the text size, and name the text scale and theme at which the fit is measured (see The question, 3).
4. The list's `figs` column is not a count of figures. Commands: `ls projects/coauthor/published/2016/chi-household-survival` gives `manuscript project.yml`, and `find ...` gives only `manuscript/main.pdf`, yet the list says `figs 1`. Also `linfoot-estimator` shows `figs 19`, while its only raster images are under `code/results` and `code/vendor/venv/...`. Change: drop the column or say what it counts.
5. "9 a `manuscript/main.tex`" holds, but 33 of the 70 have `manuscript/main.pdf` (`[ -f $r/manuscript/main.pdf ]` over the list, giving `33`). Of the 25 with neither README nor main.tex, 23 have only `main.pdf` and 2 have only the manifest (`projects/archive/stopped/algebraic-subtyping`, `projects/coauthor/stopped/individual-reference-intervals`). The brief does not say whether the PDF is "the manuscript" in item 1 and C3. Change: say so, and say how a place in it is quoted (by page).
6. Open item 690 is missing from "The step's line and its rulings". Command: `grep -n "690\|689\|691\|fed-faithful\|negative\|public" briefs/O151.md` matches only line 13, which holds none of them. Open item 690 (`orchestrator-state.md:186`) is unruled. Its option (b) says "the fed-faithful-ecg slide is rewritten to its failed state (by O151 ...)". Whether the 8 failed and stopped decks sit in the portfolio deck at all depends on it, and so does C5 (see Cases and checks, 4). Change: the brief quotes open items 689, 690 and 691 and says which parts of the step wait on 690.

## Cases and checks

1. C8 passes without checking anything under zsh. The tool shell is zsh, and the command uses `projects/*/present`, which matches nothing. Commands and output: in zsh, `(eval):1: no matches found: projects/*/present`, so the command aborts with empty stdout. `bash -c 'ls -d projects/*/present'` gives `No such file or directory`. Run under bash on the unchanged hub, C8 prints `projects/ideas/hccnet-fl-sweden/present/main.md:3:desc: Real cross-country federated HCC (Twente and Link<LATIN SMALL LETTER O WITH DIAERESIS>ping) with modality-incomplete federation`. C8 is also inconsistent with the rules in two ways:
   - `agents/spec.md:103` says its perl form (accented Latin letters allowed) "replaces the `grep '[^ -~]'` form wherever a brief or a check names it".
   - The hub's "Writing docs" says "Real-text symbols `<euro sign> <pound sign> <degree sign>` and accented letters in names always stay" and "Preserve every number, citation, and name byte-for-byte".

   As written, C8 forces "Link<o-diaeresis>ping" into "Linkoping" in a deck that items 2 and 3 would not otherwise touch, and forces "St<e-acute>phanie" or "M<o-diaeresis>ller" (present in `linfoot-estimator/project.yml:29` and `hcc-modality-poster/project.yml:19`) into ASCII on new slides. Change: C8 and item 1, bullet 5, allow accented letters in names. Use `find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -not -path '*/code/*'` piped to the perl form with the `\xC3[\x80-\xBF]` allowance, run under bash, and record its first run (the hccnet-fl-sweden line).
2. C2 says "every project at an idea stage ..., every other a `kind: project` slide" without saying it covers only the 70. Over all 95 it fails on two decks that no item changes: `projects/manuscripts/ecg-readable-substrate` (`submitted`, `kind: text`) and `projects/archive/failed/fed-faithful-ecg` (`failed`, `kind: text`). It also meets the stage `revision` (`bt-operator-theory`, `btfno`), which is in neither of the brief's lists. Command: the stage and kind map over the 25. Change: scope C2 to the 70, or add an item that rewrites the two text decks (fed-faithful-ecg waits on open item 690).
3. C4's second half and item 4 ("the portfolio deck ... shows none of its own") check `deck/present.yml`, `deck/title.md` and `deck/engine.md`, which O151 does not write (they belong to O150 and to open items 689 to 691). A finding there cannot be closed inside O151's paths. Change: say that a portfolio-deck finding is reported against O150 or its open item, never fixed by O151.
4. C5 depends on open item 690. If 690 is ruled (a), the portfolio group's `find:` gains `stages:` without `failed` and `stopped`. The 8 failed and stopped decks then leave the portfolio Overview, so C5 never draws them, and their Too tall state goes unmeasured. Change: C5 also opens each deck that the portfolio deck does not hold in its own Present view, Overview included.
5. C7 compares the whole hub's `git status`, including Axel's uncommitted funding files, which he may change during the step. Change: compare `git status --short` restricted to `projects/` and `deck/`, and list Axel's files separately as left alone.
6. Item 3's cut ("never a number, a claim or a citation that is the slide's point") lets a cut drop a confidence interval or qualifier that is "not the point" while keeping its number. That is inconsistent with the hub's "honest CIs on what IS claimed; never overclaim a positive", and with the hub's length-cut rule ("every claim, number, definition, citation and qualifier kept"). Change: "a cut removes only repeated words; every number keeps its interval and qualifier, or the number goes with them".

## The question

1. The step line's check ("read in the Present view with no finding left"): yes, it could pass without the goal. Several defects raise no finding:
   - An unknown front-matter key: no `findings.deck.*` key exists for one (`sed -n 108,144p config/text/findings.yml`), and `project.ts:4-5` says a wrong-shaped key "is read as absent".
   - A PDF figure: `Panel.svelte:31` draws `<img class="fig" {src} .../>`. A PDF exists, so there is no `figure_missing`, and Chrome draws no PDF in an `<img>`. 7 of the 70 have only PDF figures (glassbox-decision-pipelines 14, plus faithful-block-term-layer, jacobian-coupled-blockterm-dp, abstract-bci-meeting-2021, connectivity-iris, brecht-fl-partitioning, linfoot-estimator).
   - A false sentence on a slide.

   Change: add a DONE row per deck that reads its front matter against the key list of `project.ts:4-5`, plus `kind`, `desc` and `notes`. Add a rule that a panel figure is a PNG, JPG, SVG or WebP.
2. Item 1: yes. A project slide whose sources fill only the manifest (flkit's manifest says "No results in this folder: the paper is led by Ashkan Pirmani ..."; algebraic-subtyping; individual-reference-intervals) passes with a title and a sub, and is it presentable is not settled. Change: name what such a slide holds (title, sub and hook from `eli5`/`outcome`, `results` only from the manifest's `results`) and say that this is the expected result.
3. Item 3 and C5: yes. The fit is measured at one text scale and theme (`slide.css:9-12` scales every slide size by `--text-scale`), and a slide that fits at 1.0 is Too tall at Axel's larger setting. Change: measure at Axel's own text scale and theme, read from his workspace settings without reading `config/local.yml`, or state the scale used.
4. Item 4: yes, for the unknown key, as in 1. The two `extra:` keys pass today.
5. C3: yes. Ten sampled decks of 70 leave 60 with every number unchecked against its source, while the goal is every deck "true to its sources". Change: C3 covers every one of the 70, each number with its quoted place. The report already lists each deck's sources, so this is the same reading, recorded.
6. C1, C2 and C6: yes, alone, since each counts a shape. C6 passes for a copied author photo: `block-term-tensor-regression/manuscript/figs/` holds `axel.png`, `marc.png` and `flavio.png` beside its figures (`ls`). Change: a figure is one the manuscript draws (named by an `\includegraphics` or a figure caption) or one from the project's `results/`.
7. The 25 existing decks: the goal reaches them, but no item checks their truth. `fed-faithful-ecg/present/main.md` reads "- In progress: real-hospital replication on PTB-XL and MIMIC-IV-ECG." and "Open to clinical and federated-learning collaborators", which is false of a `failed` project (`cat` of the file). Change: this waits on open item 690. The brief says so, and the report repeats it.

## Implied inputs

1. A project with neither README nor manuscript: 25 have neither README nor `main.tex`. 23 of them have `main.pdf`, and 2 have only the manifest (algebraic-subtyping, individual-reference-intervals). The brief is missing the expected result: the PDF counts as the manuscript, and a manifest-only project gets a slide from `title`, `eli5`, `outcome` and `results` alone.
2. A manifest lacking `eli5`: none (`no eli5 []`). `next` is missing on 37 of the 70 (`no next [...]`), none of them at an idea stage, so idea slides are not affected. Nothing is missing here.
3. A coauthor project: 14 in `coauthor/`, plus `projects/active/linfoot-estimator` (`lead: [van-den-berg]`, "Stephanie's pretrained estimator"). The brief is missing the expected result: `sub` names the manifest's `lead`, and the slide states Axel's role as the manifest's `outcome` gives it ("Co-author (middle)"), never presenting the lead's work as Axel's. This is the hub rule "Don't build on / generalize / baseline others' *specific* work". Content from another person's unpublished work (flkit's manuscript, which the hub does not hold; `ideas/cirrhosis-digital-twin/README.md`, which sets out Maureen Guichelaar's 2025 PIHC proposal) meets the deck's own "public-safe only" (`deck/present.yml:1`). The expected result is not stated.
4. Figures that are PDFs only: 7 projects (listed in The question, 1). The expected result is missing: no panel, or a raster the manuscript itself holds. The brief must say that a PDF is never named in `figure:`.
5. A deck that a group of the portfolio deck finds twice: none. The basenames are unique across all 99 manifests (`basename dups all tiers []`), and a split adds a file, not a deck. Nothing is missing here.
6. A stage outside the brief's two lists: none among the 70. Among the 25, `revision` (2 decks). The vocabulary (`config/catalogs/vocab.yml:64-77`) also has `building`, `submit-ready` and `released`. The vocabulary marks only `nascent` and `scoping` with `idea: true`, and `de-risking` and `exploring` with `live: true`. Decision 2's reason ("those projects have no method and results to show yet") is false for `linfoot-estimator` (exploring; README `## Phase 1 result`, a table of rmse) and `ideas/engram` (exploring; README `## Results`). Missing: the full stage map, and the reason for decision 2 restated or the vocabulary's `idea:` flag used.
7. The `tag` and `equation` of a new project slide: all 14 existing slides carry `tag`, and 13 carry `equation`. The portfolio deck's rule line says "the slide's `tag` chip carries the status". Item 1's field list leaves both out while asking for "the shape of the 25 decks". Missing: whether each is written, the tag class for a failed or stopped project (the classes are `measured`, `design`, `proof` and `mixed`, from `config/defaults/present.yml:8-12`), and that an equation comes only from the manuscript's own display (integrity test line 241 checks that it typesets).

## ADRs

1. `test -d /Users/axelfaes/workspace/oculus/docs/adr || echo "no docs/adr"` prints `no docs/adr`. Brief line 5 holds.

## Dictated text

1. Line 11, the step line quoted whole: a python comparison of the quote with the body of `plan.md:1690` prints `quote==plan body: True`. Holds.
2. Line 7, the quote "the decks written by the orchestrator, as a step of this plan", against `plan.md:3561` ("part (2) (b), the decks written by the orchestrator, as a step of this plan"). Holds.
3. Line 13, the paraphrases of rulings 679, 685 and 684, against `plan.md:3561`, `:3569` and `:3570`. They hold as summaries, but the omission of 689, 690 and 691 is a defect (Premises, 6).
4. Line 29 (`grep -n "deck.title" briefs/O151.md`): "`deck.title` the project's title and `order: [main.md]`". Holds against the rules. It departs from the 25, whose `deck.title` is a hook (for example dongho: "Which ECG representation actually lets clustering find rhythms?"), so it is a decision to list.
5. Line 31: "A failed or stopped project's slide states what was built and what was measured, as the sources say, like every other (ruling 685)". It holds against ruling 685. It clashes with the hub texts quoted in Other checks, 2, while the portfolio deck holds these decks and open item 690 is unruled.
6. Line 32: "a field the sources do not fill is left out, never filled by guess". Holds (see Other checks, 1, for the manuscript-canonical gap).
7. Line 34: "ASCII only". It breaks the hub's "accented letters in names always stay" and `agents/spec.md:103` (Cases and checks, 1).
8. Line 36: "a cut removes words, never a number, a claim or a citation that is the slide's point". It breaks "honest CIs on what IS claimed" (Cases and checks, 6).
9. `LC_ALL=C grep -n '[^ -~]' briefs/O151.md` prints nothing. The brief itself holds the character set.

## Other checks

1. The kind-by-stage rule and the "left out" rule. "Left out, never filled by guess" is consistent with the hub's "no fabrication" and "never overclaim a positive", and with rulings 679 (a deck for every project), 684 (the stage shown as it is) and 685 (written like every other). One gap: the hub's CLAUDE.md says "The manuscript is the canonical method/results/related-work" and "`README.md` is PRIVATE prep (dead-ends live there, never in a manuscript)". The portfolio deck's rule line says "every number real and matching the manuscript". The brief accepts a README number for a project that has a manuscript. Change: where a manuscript exists, a slide's number matches it, and the README is used only where no manuscript holds the fact. The kind-by-stage rule is consistent with every ruling. Its reason clashes only with the vocabulary's own `idea:` flag (Implied inputs, 6).
2. A rule clash with writing the failed and stopped decks "like every other". The texts, quoted:
   - The user's global rule (`~/.claude/CLAUDE.md`): "NEVER write up, suggest writing up, frame a paper around, or otherwise allow a manuscript to present a **negative or null result**." Its scope is a manuscript.
   - The hub's `CLAUDE.md:7`, under "Hard rules (Axel's, non-negotiable, every project)": "**NEVER write up / frame a paper around a negative or null result.** Failed experiments are PRIVATE guidance only."
   - The hub's `deck/present.yml:1`, introduced in hub commit 548004bcc "Present decks from any folder" (`git log -L1,1:deck/present.yml`; the git author is TheAxeC, so git does not show whether Axel or an agent wrote the words): "# Rules for what goes on a slide (a public artifact): public-safe only, every number real and matching the manuscript, never a null or negative result, no hedging (the slide's `tag` chip carries the status)."
   - The hub's `.agents/skills/project-cleanup/SKILL.md:36`: "**Never write a null/negative result** into the manifest, the manuscript, `code/README.md`, or any public artifact. Dead-ends stay in `README.md` (private)".
   - Against them, ruling 685: "(a), the decks of the failed and stopped projects are written like every other project's deck"; ruling 684: "no conflict; the Project facts strip shows the stage as it is, `failed` and `stopped` included, since a deck in the workbench is not a publication"; and ruling 678 (a), which puts every research project's deck in the portfolio deck.

   By its text, the global rule does not reach a workbench deck, and ruling 684 settles that for a deck in the workbench. The open conflict is narrower. The portfolio deck calls itself "a public artifact", and the hub's Hard rule says "Failed experiments are PRIVATE guidance only". Rulings 678 (a) and 685 (a) together put the three failed and four stopped decks O151 writes (`ms-lipid-handshake`, whose memory says "disproven"; `faithful-block-term-layer`; `jacobian-coupled-blockterm-dp`; and the four stopped ones) into that public deck. The clash is between Axel's hub Hard rule (and the deck's own rule line, whose author git does not settle) on one side and Axel's rulings 678 and 685 on the other. The session already raised it as open item 690 for fed-faithful-ecg alone. O151 widens it from one deck to eight. Change: the brief names open item 690, says it now covers the seven decks O151 writes, and says which work waits on the ruling (the seven decks' content, if they go to the portfolio deck, and the fed-faithful-ecg rewrite). The rest of the step does not wait.
3. Whether `tests/checks/config/integrity.test.ts` reads the projects' decks: yes. Command: `sed -n 229-239p`. Output: `it('reads a deck out of every project that has a present/ folder, with no finding', ...)`, with `expect(deck.findings, project.id).toEqual([]);`. It also checks every written equation (`:241`) and the portfolio deck (`:265-272`). It does not see Too tall, which is raised only in the Present view (`src/lib/state/life/present.svelte.ts:489-509`). It does not see an unknown key or a PDF figure, since neither is a finding.
4. Verify 4 says "put back from its backup after" without naming the backup's path. `ls .../scratchpad/O138look/` shows `home` and server logs, and no backup. Change: name the backup folder and the command that makes it.

## Declined to judge

- Whether open item 690 should go (a) or (b). That is Axel's ruling.
- Whether a deck's `deck.title` should be the project's title or a hook as on the 25 decks.
- The prose quality of slides that do not exist yet.
- Whether the block-term framing of `deck/engine.md:6-10` and `deck/title.md` fits a portfolio holding the HTTP/2, CHI and type-theory decks. That is a framing judgment for open item 689 and for Axel.

Usage: a191224a80b27cdf3, claude-opus-5-5, 210464 tokens, 76 tool uses, 12 min 20 s

## Closed

- Names 1: open item 689 is named in the brief's open items, as the portfolio deck's and not O151's; the report repeats it.
- Names 2 and 3: no change needed.
- Names 4 and Premises 2: the premise lists the 14 project slides' keys as they are; item 2 moves the `extra:` block of `btfno` and `covert-applied` into `notes:`.
- The step line 1: the report's first line states that the hub commit waits on Axel's word, with its paths.
- Premises 1: the figure premise states `resolveIn` as the code has it; decision 3 references figures in place, with its reason.
- Premises 3: the strip is "up to two lines, scaling with the text size"; decision 5 names the scale measured.
- Premises 4: the list is `O151-projects-list.txt` without the figure column.
- Premises 5: the 33 PDFs and the two manifest-only projects are premises; item 1 counts a PDF as the manuscript, quoted by page.
- Premises 6: open items 689, 690 and 691 are quoted in the brief; the fed-faithful-ecg rewrite waits on 690; open item 690 is widened in the state file to the seven decks O151 writes.
- Cases and checks 1: C9 is the perl gate with the accented-letter allowance, under bash, its first run quoted; item 1 keeps an accented letter in a name.
- Cases and checks 2: C2 covers the 70.
- Cases and checks 3: item 4 says a finding of `deck/` is O150's or its open item's.
- Cases and checks 4: C5 opens each deck the portfolio deck does not hold in its own view.
- Cases and checks 5: C8 compares `git status --short projects deck`.
- Cases and checks 6: item 3's cut removes only repeated words; a number keeps its interval and qualifier or goes with them.
- The question 1 and 4: C7 reads every deck's keys against its kind's; item 1 names the figure types.
- The question 2 and Implied inputs 1: item 1 names what a manifest-only slide holds.
- The question 3: decision 5 and C5 name text scale 1; Axel's own scale lives in `config/local.yml`, which is never read.
- The question 5: C3 covers all 70.
- The question 6: item 1 and C6 take a figure the manuscript draws or `results/` holds.
- The question 7: the fed-faithful-ecg rewrite waits on open item 690.
- Implied inputs 3: item 1 names the lead and Axel's role on a coauthor slide, and keeps confidential or another person's unpublished material off every slide.
- Implied inputs 4: no PDF in `figure:`.
- Implied inputs 6: the kind follows the vocabulary's `idea:` flag, with exploring and de-risking projects that hold results given a project slide.
- Implied inputs 7: item 1 writes `tag` with a class from the four and `equation` only from the manuscript's display.
- Dictated text 4: decision 6 makes `deck.title` a headline, as on the 25.
- Dictated text 7 and 8: closed with Cases and checks 1 and 6.
- Other checks 1: item 1 prefers the manuscript's number.
- Other checks 2: the clash is open item 690's, widened; the decks O151 writes stay in their projects' folders, the private workbench of ruling 684.
- Other checks 4: the backup is `<scratchpad>/O151-look-backup`, made with `cp -R`.
