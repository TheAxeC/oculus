# Step O151 brief check (on main at 195d655fa)

This is the brief check of `agents/briefs/O151.md`. The brief says it was read on oculus 884db6915. `git diff --stat 884db6915 HEAD -- src config docs` prints nothing, so no oculus source changed between that commit and the current head. The hub is a different case. The brief says hub fbb2c1b71, but the hub's head is 145e31a28, six commits on, and other sessions are still committing to it (see Premises).

**Headline.** Eight findings would let the step pass without its goal, or would fail as written:
- Verify item 2's ASCII glob misses 32 decks, catches the PNG figures, and aborts under zsh.
- Verify item 4's `outside-paths.mjs` call passes a folder where it needs a commit, so it exits 2.
- Verify item 4's hub `diff -rq` cannot print only `present/` paths.
- The stub premise is wrong for 16 of the 25 decks. Those decks hold figures that exist nowhere else in their project, and the brief does not say what happens to them.
- The number rule does not cover the PDF or the manifest's `results:`.
- Item 2 leaves out `equation`, which every existing project deck carries. The project's own gate, `integrity.test.ts`, has an equation floor of 13 that the new decks could break.
- The read ranges for `Facts.svelte` and `slide.css` leave out lines the step must change.
- Nothing checks that a front-matter key is read in its shape: a key of the wrong shape is "read as absent" with no finding.

## 1. Names

- `--slide-design-facts`, `--slide-design-facts-label`: `grep -rn -- '--slide-design-facts' .` (with `.scratch` filtered out) has one hit, `.scratch/migration/agents/briefs/O151.md:43`. Neither name is used anywhere else, so neither collides with an existing name.
- `--slide-fs-small`: `grep -rn -- 'slide-fs-small'` finds it outside the write list at:
  - `Panel.svelte:121,135,147,165,178,188`
  - `parts/Summary.svelte:101`, `parts/Section.svelte:79,97`
  - `parts/project/Project.svelte:246,254,290,303,330,338`
  - `parts/Plain.svelte:119`, `parts/Words.svelte:59,64`, `parts/Title.svelte:53,74`
  - `parts/Grid.svelte:81,93,106,116`
  - `themes/slide.css:40`

  The step leaves the token itself unchanged, so none of these becomes false. Inside the write list: `Facts.svelte:24` (comment) and `:165`.
- `0.72em` / `--fact-label`: `grep -rn -E '0\.72em|fact-label' src tests docs config` finds `Facts.svelte:158` and `Facts.svelte:222`, both inside the write list. No test, doc or config line names either.
- Sentences about the strip's size outside the write list:
  - `src/lib/views/academic/present/Slide.svelte:33-34`: "holds the strip of a project's facts at the frame's own type scale". Once the strip has its own sizes it is no longer on the frame's type scale (title, h, sub, body, small), so this becomes partly false. Rewording a comment changes nothing a user sees, so this is an internal widening under the standing demand "A brief check never widens a step".
  - `parts/Dot.svelte:5-6`: "9 px across unless an element around it sets `--dot-size`, which the strip sets to follow its own type". Still true.
  - `docs/decks.md:355-362`, the project facts strip section, gives no size. Still true.
  - `config/text/views/academic/present.yml:95-96` gives no size. Still true.
- Inside the write list but outside what item 3 asks to be "made true": the style comment `Facts.svelte:152-156`, "The strip is set in the slide's small type ... the label's size. The dot ... 9 px at the design size". Once `.facts` is 12 px, the dot (`--dot-size: 0.5em`) is 6 px and the label is no longer an em of the strip's type. Item 3 names only "its head comment and `slide.css`'s comment".
- The hub decks: `grep -rn -E "projects/(ideas|manuscripts|archive|coauthor|active)/[a-z0-9-]+/present"` over src, tests, docs, config and README finds only synthetic fixture paths (`tests/checks/config/integrity.test.ts:327-337`, `tests/server/root/watch/*`, `tests/data/snapshot/reference-hub.ts:208`). No real deck is named.

Findings:
- `Slide.svelte:33-34` becomes partly false and is not in the write list.
- `Facts.svelte:152-156` becomes false (the dot size, and "the label's size" in the strip's type), and item 3 does not ask for it to be fixed.

## 2. The step line

The step line is `plan.md:1710`. Each part, with the brief text that serves it:
- "after O162, O158 and O163 land": a precondition, met. `grep -n -E '^- (<check mark> )?O(162|158|163) ' plan.md` shows all three ticked (lines 1702, 1704, 1706). The <check mark> is the plan's own status mark.
- "every slide internal and nothing on it hidden" (Decks are internal): item 2, "Nothing is hidden".
- "every research project's deck under its `present/`, written from the project's own manuscript, `README.md`, manifest and `CLAUDE.md`": item 1.
- "the 70 projects without a deck get one, and the 25 existing decks are reworked the same way": item 1.
- "every number ... the project's current number and every framing the project's current one": item 2, fourth bullet.
- "failed and stopped projects written like every other" (685): item 1.
- "one slide, or two ..., never more, every slide fitting its frame": item 2, bullets 1 and 7, plus "The measured fit".
- "every slide titled": item 2, sixth bullet.
- "each deck read in the Present view with no finding left": item 2's last bullet (deck-reader findings) plus "The measured fit" (the orchestrator's drawn pass).
- "built from the start by a new builder, nothing of the deleted run used": named under "What is on the tree", with no item of its own. Nothing of the deleted runs remains:
  - `ls .agents/worktrees | grep -i 151` prints nothing.
  - `ls agents/briefs | grep 151` prints only `O151.md`.
  - `ls agents/reviews | grep 151` prints nothing.
  - The hub decks date from a29014904 and 548004bcc (2026-10-06/07), according to `git log -- <present>`.
- "built by a builder agent": the brief itself.
- "the hub commit on the user's word": no requirement. This is the orchestrator's job at landing, and the builder runs no git that changes state.
- "the project facts strip drawn at a size below the slide's text" (Facts strip smaller): item 3.
- Ruling 679 part (2)(b), "the decks written by the orchestrator": superseded by "O150 and O151 undone" (each by a builder agent) and the standing demand "No inline builds". The brief follows the later rulings.
- Ruling "Decks are internal", "MUST contain proper information": only "each filled where the project's files give it". There is no floor saying which keys a project with a manuscript must carry (for example, both `method` and `results`).
- Ruling "One slide per project preferred", "no open item is raised about the decks": the brief does not repeat it. The stop-and-hand-back rule for a case the brief gets wrong may produce exactly such an item.

Findings:
- "Proper information" has no requirement beyond "where the files give it".
- The "no open item about the decks" part of the ruling is not carried into the brief.

## 3. Premises

- 95 research manifests: `find projects -name project.yml | xargs grep -l '^tier: research' | wc -l` prints 95. Per folder: active 5, archive 27, coauthor 14, ideas 35, manuscripts 14. Matches.
- 4 software projects: `... | xargs grep -h '^tier:' | sort | uniq -c` prints `95 tier: research`, `4 tier: software`. Matches.
- 25 with `present/`, 70 without: a loop over the 95 prints `present=25 none=70`. Matches.
- The 95 path entries: the brief's `projects/.../present/` bullets, stripped and sorted (95 lines, 95 unique), compared by `diff` with the sorted 95 manifest folders prints IDENTICAL. None is missing and none is extra.
- Source counts. The same loop at hub head prints `main.tex=23 README=64 CLAUDE=18 eli5=95 neither=25`. The brief says 24 `main.tex`; that was true at fbb2c1b71 but is now 23. At fbb2c1b71, `git show fbb2c1b71:projects/active/linfoot-estimator/manuscript/main.tex | head -2` prints `\documentclass[11pt]{article}`. Since then, `git log --oneline fbb2c1b71..HEAD` shows 6bf3e0c04, "Archive the article-class draft before the IEEEtran draft", which moved it to `manuscript/archive/2026-11-article/main.tex`. The hub head moved again during this check (d23ad3310, then 9cfb1317b, then 145e31a28), all linfoot commits. The hub worktree is made "at the hub's head", so the builder sees 23, not 24.
- Stages: `grep -m1 '^stage:'` over the 95, counted, prints published 30, nascent 18, submitted 12, scoping 9, exploring 7, de-risking 5, stopped 4, failed 4, accepted 3, revision 2, in-prep 1. The brief says failed (5) and stopped (3). The real split is failed 4 (faithful-block-term-layer, fed-faithful-ecg, jacobian-coupled-blockterm-dp, ms-lipid-handshake) and stopped 4 (algebraic-subtyping, connectivity-motor-imagery, individual-reference-intervals, `projects/ideas/fedbtd`). Manifests are unchanged since fbb2c1b71, so the brief's figure was wrong at its own base.
- The 25 with neither text: all 25 carry `outcome:`. 14 carry an `abstract:` line. 11 carry a `results:` list (loop, "neither with results: 11"). For example `projects/coauthor/published/2025/pfl-ms-npj/project.yml:14-15`: "mean ROC-AUC 0.84 ... centralized model (0.809) and local models (0.798)".
- Stub shape: listing each `present/` with its `kind:` lines shows 9 decks of one `kind: idea` slide, 2 of `kind: text` (fed-faithful-ecg, ecg-readable-substrate), and 14 of `kind: project` with figures. Those 14 are dongho-ecg-clustering, hccnet-fl, bt-operator-theory, btfno, bttd-source-eeg, bttn-incident-af, covert-applied, covert-theory, dries-bttr-ecg, fed-multicellular-immune, hccnet-revision, meseret-cirrhosis, raw-pls and ward-bttr-crosssubject. Each carries an `equation`, six `specs` and up to five `panels` (raw-pls `present/main.md`), and up to seven PNGs. The brief says all 25 are `kind: idea` stubs, which is wrong for 16.
- Figures that exist only in the deck: a loop over four of the decks (raw-pls, btfno, ward-bttr-crosssubject, dongho-ecg-clustering), counting copies of each PNG outside `present/`:
  - raw-pls: `eq_rawpls.png`, `rawpls_method.png`, `rawpls.png`, `saliency_ortho.png`, `saliency_patients.png` have 0 copies elsewhere.
  - btfno: `btfno_blocks.png`, `btfno.png`, `eq_btfno.png` have 0.
  - dongho-ecg-clustering: all three have 0.

  Writing "each folder whole" can delete the only copy of a figure.
- Frame and inner box: `config/defaults/present.yml` gives `frame: width 1280, height 720`. `slide.css:1-8` says "1150 by 590 px in a 1280 by 720 frame" and a 1040 px column. `slide.css:10-15` states the factor of 0.75 to 1.25. Matches.
- `slide.css:17-21` holds the design sizes, `--slide-design-small: 18px` at :21. `slide.css:63-69` holds the `body.rice` set, small 17 px. Matches. The rice comment is at :59-62, outside the cited range.
- `Facts.svelte:155-170`: `.facts` at :157-167, `font-size: var(--slide-fs-small)` at :165, `--fact-label: 0.72em` at :158. Matches, but the label's own rule is at :219-225 and the head comment at :1-27, both outside the range.
- `decks.ts:117`: `grep -n 'export function readDecks'` prints 117. Matches.
- `index.ts:309`: `grep -n 'readDecks' src/lib/data/index.ts` prints `58:` (the import) and `319: const deck = readDecks(read, own, others, globs);`. The brief's 309 is wrong; the call is at 319.
- `deck/present.yml` (hub): group `projects`, `find: { folders: [projects/**/present], tiers: [research] }`, `discover: true`, order `title.md`, `{ slides: projects }`, `closing.md`. Matches. The order has no `summary` entry, so Decision 1's reason ("so the portfolio deck's summary reads each project's `mechanism` and `headline`") is false. No portfolio summary reads them today.
- Files shared with steps in flight: `grep -n '^- step:' orchestrator-state.md` lists O167, O169, O151 and O170. The brief names O167, O169 and O168. O168 is not in flight; O170 is and is not named. `grep -c -E 'slide\.css|Facts\.svelte|present/'` over O170's brief finds only `views/academic/present/` paths (`export.ts`, `Bar.svelte`, `Presenter.svelte`, `Framed.svelte`), none of O151's files. O167's only hit on O151's files is its own note at :33 that O151 writes them. So nothing overlaps, but the premise's list is wrong.
- ADRs: `ls docs/adr` prints "No such file or directory". Matches.

Findings:
- 24 `main.tex` at fbb2c1b71 is 23 at the hub head the worktree is made from. linfoot-estimator is being committed by another session during the step.
- failed (5) and stopped (3) are failed 4 and stopped 4.
- "The 25 decks there today are stubs ... `kind: idea`" is true for 9. Two are `text` and 14 are full `project` decks with figures, some of which exist nowhere else in the project.
- `index.ts:309` is `:319`.
- The in-flight list names O168 (not in flight) and leaves out O170 (in flight, no shared file).
- Decision 1's reason names a portfolio summary that does not exist.

## 4. Cases and checks

- C1, C2, C3: checked by reading. Consistent with the rules file. C2's root `thesis.tex` exists, 149 non-empty lines, and the 18 `.tex` files under `manuscript/` total 2971 lines.
- C4: consistent with the rules file, but it contradicts item 1's general rule. Item 1 allows a deck to name "work of another project that its own files ... name". The covert files name each other:
  - `covert-theory/project.yml:10` has `related: [covert-applied]`.
  - `covert-theory/README.md:3,13,39,45,57` names the applied paper.
  - `covert-applied/project.yml:10` and `README.md:3` name `covert-theory`.

  C4 requires that each deck names only its own work. The brief needs one rule for both.
- C5, C6: case-run programs. These are allowed by the rules file's section "What every package obeys", case-run programs paragraph.
  - The project's own gate is `OCULUS_TEST_HUB=<hub worktree> npx vitest run tests/checks/config/integrity.test.ts`. Its rows include 'reads a deck out of every project that has a present/ folder, with no finding' (:224), 'reads an equation out of every slide that writes one, as LaTeX that typesets' (:236, a KaTeX check) and 'reads the portfolio deck with every named deck found' (:260).
  - The brief does not name this gate. The hub CLAUDE.md working rules say to prefer the project's own gates over an ad hoc probe.
  - The file's 'validates with no findings' row also covers non-deck hub findings. Under the rules file, "Where you work", such a finding is reported, never repaired. The run therefore needs `-t` on the deck rows, or a note that other rows are reported only.
  - `tests/data/real-hub.probe.ts` shows the snapshot-over-a-hub pattern (`buildOneHub`) that C6's program would copy, and it calls `mkdtempSync(tmpdir())`. Such a program writes a temporary folder outside the scratchpad unless `TMPDIR` points at the scratchpad. The brief bans writes "in any other folder".
- C7: reading. For a PDF source, "file and line" has no line. It should be file and page.
- C8: reading and the look. Consistent.
- C9: "no run of the builder's", which contradicts "The builder's first task ... is the first run of every case above". C7's first run on the unchanged tree also asks the builder to trace numbers on the 25 decks the step replaces. That is work on content the step deletes.
- Tests: "No test is written". This agrees with `agents/guarded.md`: no entry covers `slide.css` or `Facts.svelte` (`grep -n -E 'Facts|slide\.css' guarded.md` finds only G32's general text about present parsers). No forbidden test or breakage run is asked for.
- Server: "The builder starts no server and opens no page". This agrees with the rules file's "A builder runs no page".
- Writes outside the two worktrees: none is asked for, except the temporary folder above. The same paragraph says "You read every other file of the hub worktree", which tells the builder to read the hub's root `CLAUDE.md`. The rules file, "Read first", item 3, says "Do not read the hub's instruction file".
- Project `CLAUDE.md` as a source. Item 1 and the step line make the 18 project `CLAUDE.md` files sources, and they hold instructions. For example, `projects/manuscripts/raw-pls/CLAUDE.md` says "Manuscript work via the `academic-paper` skill" and "MGMT + survival are dead targets (private, never reported)". The second conflicts with "Nothing is hidden". The brief does not say that a project's `CLAUDE.md` is read for facts only and binds nothing.
- Hub writes by hand. The rules file's last paragraph allows a hub data path to be written only through a named script, or as named lines reworded by hand under a ruling, "the report lists each line before and after". Here 95 decks (about 190 files) are written by hand. The rulings authorise the decks, but the report shape has no before-and-after for the 25 replaced decks.
- Verify item 1 omits `npm run diagrams` before `npm run test:quick`. The rules file's "Token discipline" requires it and governs anyway.
- Verify item 2: `LC_ALL=C grep -rn '[^ -~]' projects/*/present projects/*/*/present projects/*/*/*/present`.
  - Folder depths among the 95 (`awk -F/ '{print NF}' | uniq -c`): 54 at depth 3, 9 at depth 4, 32 at depth 5. The 32 under `archive/published/<year>/` and `coauthor/published/<year>/` are not covered.
  - Under zsh, `projects/*/present` matches nothing, and the shell aborts with "no matches found: projects/*/present".
  - It greps the figures too: `LC_ALL=C grep -rn '[^ -~]' projects/manuscripts/raw-pls/present` prints "Binary file .../saliency_patients.png matches".

  It can never print nothing.
- Verify item 4, `node utils/outside-paths.mjs <brief> .agents/worktrees/O151-base`: `utils/outside-paths.mjs` checks `git rev-parse --verify "${base}^{commit}"` and refuses an unknown base with exit 2 (its lines 71-97). A base-copy folder is no revision: `git log -1 '.agents/worktrees/O169-base^{commit}'` prints "fatal: ambiguous argument ... unknown revision". It needs the oculus base commit.
- Verify item 4, hub `diff -rq` "from the hub worktree root against the hub base copy lists only files under the named present/ folders": the base copy holds only `present/` folders, so a root-level `diff -rq` lists every other hub file as "Only in". It has to run per `present/` folder.

Findings:
- C4 contradicts item 1's rule for the covert pair.
- C5 and C6 bypass the project's own gate, `integrity.test.ts` with `OCULUS_TEST_HUB`, and C6's pattern writes outside the scratchpad.
- C7's "line" does not fit PDF sources.
- C9 contradicts the "first run of every case" instruction.
- C7's first run asks the builder to trace content the step deletes.
- "You read every other file" breaks "Read first", item 3.
- Project `CLAUDE.md` instructions are not neutralised.
- The 25 replaced decks get no before-and-after.
- Verify item 2 cannot pass, for three reasons: depth, zsh, binaries.
- Verify item 4's `outside-paths` call exits 2.
- Verify item 4's hub `diff -rq` cannot pass as worded.

## 5. The question

"Could this pass without the goal being reached?"

- C1: yes. Reading a deck that traces its numbers passes even when the slide is thin, because the brief has no floor on which keys a README project must carry.
- C2: yes. The same applies. It is also unspecified whether `thesis.tex`'s inputs (17 chapter files) are read or only the root.
- C3: no for the failed and stopped decks themselves. But it is yes for "nothing hidden" across the other 87 decks. The fit limits (four items, four chips, one panel) let a builder drop a negative fact "for room". No case checks that a README's dead-ends or a `CLAUDE.md`'s dead targets appear on the slide; raw-pls MGMT/survival is one example.
- C4: no, once C4's rule is the one the brief keeps.
- C5: yes. Slide counts and titles pass for any content. Project slides take a title from the manifest's `short` whatever they hold (`docs/decks.md`, Front-matter keys, `title`), so "titled" holds trivially for every project slide.
- C6: yes. `docs/decks.md` says "A key of the wrong shape is read as absent", with no finding. A mis-shaped `eli5`, `specs`, `tag` or `panels` silently disappears, and C6 stays green. The same goes for a LaTeX backslash in a double-quoted YAML value: `"\theta"` parses to a tab followed by "heta" with no finding, and KaTeX draws "heta".
- C7: yes if the reviewer samples. The brief does not say the trace is checked for all 95 decks, or that its source column is checked against the precedence rule (manuscript, then README, then manifest).
- C8: no for the two values. Yes for the strip as a whole: the em-based measures (the rule's padding, the gaps, the dot) shrink by a third with no expected result stated.
- C9: no. The measured fit on drawn pages is real, provided the scratch server runs the oculus worktree with the new strip. The brief does not say which checkout the server runs. Measured with the old 18 px strip, the fit is wrong.
- The step line's check, "each deck read in the Present view with no finding left": no, given C9 and the look at landing.
- Item 1: yes. "Written from the project's own files" has no proof of reading. The report gives "its sources read" as a list of names, with no line count or page range.
- Item 2: yes, as C5 and C6 above. It also omits `equation`. Every one of the 14 existing project decks carries one, and `integrity.test.ts:46` has `REAL_FLOORS = { decks: 14, equations: 13 }`. New decks with fewer than 13 equations would turn the real-hub gate red after the hub commit, while every case here stays green.
- Item 3: yes. "Head comment and slide.css's comment made true" passes with `Facts.svelte:152-156` false.

Findings: C1, C2, C3 (the other 87 decks), C5, C6, C7, C8 (the em measures), item 1, item 2 and item 3 could each pass without the goal, as stated above.

## 6. Implied inputs

**Code part** (`slide.css`, `Facts.svelte`):
- Themes. `body.rice` gets "the same two values there". That declaration repeats `.slide-frame`'s and changes nothing (KISS and DRY, rules file, "The principles every package is judged on"). The rice comment (`slide.css:59-62`, "the slide sizes are the design sizes times 12/13") must say that the strip's sizes are excluded. Stated: partly. Expected: one declaration in `.slide-frame`, plus a rice comment naming the exception. Or 11 px and 9 px under rice if the 12/13 rule should hold. The brief should say which.
- Text scale 0.7 to 1.6 (`config/options/appearance.yml:50-51`). C8 covers 1.5 only. Missing: 0.7 gives 8.4 px values and 7 px labels; 1.6 gives 19.2 px and 16 px. The expected result is these values and two lines at most at 1.6 (the O148 look checked 1.6).
- The hidden strip. "Keeps ... its room while hidden" is stated, but the room itself shrinks, since a 12 px line is shorter than an 18 px one. So every project slide's measured fit changes. Expected: C9's measured fit is drawn from the step's oculus worktree. Not stated.
- The em-based measures inside `.facts`: padding 0.6em, gaps 1em, 0.2em and 0.4em, `--dot-size` 0.5em (`Facts.svelte:159-163,173`). They follow the new 12 px size (the dot becomes 6 px, not 9). Missing: the expected size of each, and `:152-156` rewritten to match.
- The space above the strip, `Slide.svelte:422-423` `.strip { padding-top: 1.2em }`, is set in body type. It stays 28.8 px over a smaller strip. Not stated, and the brief does not say whether that is intended.
- The read ranges: `Facts.svelte:155-170` and `slide.css:1-21, 63-69` leave out `Facts.svelte:1-27` and `:219-225`, and `slide.css:59-62`, all of which the step changes. The rules file, "Read first", item 2, says to read only the range.

**Deck part:**
- A project whose only text is a PDF: about 20 projects, mostly `coauthor/published/*`, one PDF each.
  - The number rule skips the PDF; it goes straight to manifest `outcome:` or `latest:`.
  - Expected: the brief says whether a PDF of the paper counts as "the manuscript" for numbers. Reading through the Read tool's `pages` parameter (20 pages per call), with the trace by page.
- Several `.tex` files, or a `.tex` in a subfolder:
  - `fermat`: `manuscript/latex/main.tex` beside `main_work.tex` and `supp.tex`.
  - `block-term-tensor-regression`: `manuscript/bare_jrnl.tex` beside `admin/old/main.tex`.
  - `fbttr-strategies`: `manuscript/latex/main.tex`.
  - `connectivity-iris`: its only `.tex` is `admin/cover_letter.tex`.
  - `faithful-block-term-layer` and `jacobian-coupled-blockterm-dp`: `notes/derivations/*.tex`.

  Missing: a named root per project, and the rule that a cover letter, an old draft, a derivation note or an archived draft is not the manuscript.
- linfoot-estimator. At the worktree's head its `main.tex` is archived, an IEEEtran draft is being written in `manuscript/work/`, and its README exists. Missing: which source is "current", and that the hub commit at landing meets a moving hub head.
- Figures:
  - 24 projects hold drawable figures outside `present/`.
  - Manuscripts hold PDF and EPS figures. 121 PDFs sit under `manuscript/` folders, and covert-applied draws `figures/*.pdf` (`main.tex:772,954,963-964`). Slides accept only png, jpg, jpeg, gif, webp and svg (`src/lib/state/life/present.ts:505`), and the brief allows no conversion.
  - Missing: "a PDF or EPS figure is not used", plus a rule for the existing `present/` figures (kept, reused as panels, or removed) when they exist nowhere else.
- A coauthor project (14 of them, for example pfl-ms-npj, whose `outcome:` reads "Co-author (middle)"). Missing: how the deck states the paper's authorship. Expected: as the manifest's `lead`/`outcome` gives it, never as Axel's lead.
- A manifest field the slide relies on:
  - `short` is in all 95, so `title` is safe.
  - Numbers sit in `results:` (49 manifests, 11 of the 25 with no text) and `publication.abstract` (14 of the 25). The rule names only `outcome:` and `latest:`.
  - `{{project.<field>}}` with an empty field is a finding (`docs/decks.md`, the strip section).
  - Missing: `results:` and the abstract in the precedence rule, and "no placeholder for a field the manifest leaves empty".
- `tag.class`. The brief gives no vocabulary. The classes with a hue are `measured`, `design`, `proof` and `mixed` (`config/defaults/present.yml`), and the hub deck sets no `tag_tones`. Missing: "one of the four".
- `equation` and LaTeX in YAML. `equation` is missing from item 2. Missing: backslashes doubled in a double-quoted value, or a single-quoted or plain scalar, and a case-run line that prints any parsed front-matter value holding a control character.
- A README that defers its results to another file. `raw-pls/CLAUDE.md` points at `RESULTS.md` and `theory/theory.tex`. Missing: whether such a file is read (it is outside the four named sources).

Findings: every item above marked "Missing".

## 7. ADRs

`ls /Users/axelfaes/workspace/oculus/docs/adr` prints "No such file or directory". There is no record.

Findings: none.

## 8. Dictated text

- "`--slide-design-facts: 12px`": `grep -n -- '--slide-design-facts: 12px' agents/briefs/O151.md` prints 43. It holds: ASCII, and the value matches the ruling "Facts strip smaller".
- "`--slide-design-facts-label: 10px`": `grep -n -- '--slide-design-facts-label: 10px'` prints 43. It holds, as above.
- "Everything in the brief is done" (the report's first line): `grep -n 'Everything in the brief is done'` prints 213. It holds; it is the rules file's own wording, from its Report section.
- The brief dictates no deck text. `LC_ALL=C grep -n '[^ -~]' agents/briefs/O151.md` prints nothing.

Findings: none.

## 9. One builder, 95 decks

My judgment, not a measured fact: one builder can do it without a shortcut only if the brief makes each deck's reading provable. The full reading load is:
- 23 manuscripts with their inputs (the thesis alone is 18 files, 2971 lines);
- 64 READMEs and 18 `CLAUDE.md` files;
- about 20 PDFs;
- 95 manifests.

That is several times one context, so the work runs across compactions. The trace has to be written deck by deck, as each deck is finished.

What in the brief lets a builder take a shortcut:
- Decision 2 makes every deck the same shape. Nothing bars boilerplate repeated across decks: the same `tag`, the same spec labels, the same hook pattern. A case-run count of slide lines that appear in more than one deck would be a fact check a script can compute.
- "Each filled where the project's files give it" lets a deck carry only `eli5` and a headline taken from the manifest, even where a manuscript exists. The trace would show `project.yml` as the source, but nothing asks the reviewer to check the source column against the precedence rule for every deck.
- "Its sources read" in the report is a list of names. Nothing asks for the lines or pages read.
- The fit limits allow a fact to be left out "for room". That makes "nothing hidden" unverifiable for negative and confidential facts.
- C5 and C6 pass for decks whose keys are silently dropped (wrong shape is read as absent).

## Declined to judge

- Whether `body.rice` should keep 12 and 10 px or apply 12/13. The ruling is silent, so this is Axel's call or the orchestrator's.
- Whether the existing figures in the 14 project decks, some showing numbers that may be stale, count as "the project's own" figures. That is a content ruling.
- Whether `equation` is a requirement of the step line. The line does not name it; the real-hub gate's floor makes it matter.
- The token cost of the build. It is an estimate and was not measured.

Agent usage: a423faa7257a10eea, claude-opus-5-5, 217403 tokens, 73 tool uses, 12.6 min.

## Closed

- Headline, verify item 2 (depth, zsh, binaries): the ASCII check is now `find projects -path '*/present/*' \( -name '*.md' -o -name '*.yml' \) -print0 | xargs -0 env LC_ALL=C grep -n '[^ -~]'` from the hub worktree root ("Verify before you report" 2).
- Headline, verify item 4 `outside-paths.mjs`: it takes the oculus base commit the launch message names ("Verify before you report" 4).
- Headline, verify item 4 hub `diff -rq`: `git status --short` from the hub worktree root lists only paths under the named folders, and `diff -rq` runs per folder against the hub base copy ("Verify before you report" 4).
- Headline and Premises, the stub premise: "What is on the tree" now gives 9 idea, 2 text and 14 project decks with their figures, and the figures that exist nowhere else; item 2 and Decision 6 keep every figure already in a `present/` folder on disk.
- Headline and Premises, the number rule (PDF, `results:`): item 2's precedence is the manuscript (a PDF read through its pages where the paper is only a PDF), then the README or the results file it names, then the manifest's `results:`, `publication.abstract`, `outcome:` or `latest:`; Decision 3.
- Headline and Question item 2, `equation` and the floor: item 2 asks for `equation` where the sources state one and the hub floor of 13 slides with an equation that typesets; C6 runs the gate.
- Headline and Implied inputs, read ranges: "Read, with sections or line ranges" 2 now reads `Facts.svelte` and `slide.css` whole, plus `Slide.svelte:1-60` and `:410-430`.
- Headline and Question C6, key shapes: item 2 requires every key in the shape `docs/decks.md` gives; C5's program prints any key whose value is not that shape and any value holding a control character.
- Names, `Slide.svelte:33-34`: added to the path list as `Slide.svelte` lines 30-40; item 3 makes it true.
- Names, `Facts.svelte:152-156`: item 3 makes the style comment true; C8 states the dot at 9 px.
- Step line, "proper information": item 2 sets the key floor (`title`, `hook`, `eli5`, `method`, `results`, `headline`, and `sub`, `specs`, `mechanism`, `equation` where the sources give them; the manifest's fields for a project with neither text).
- Step line, no open item about the decks: "Cases" now says the orchestrator rules on a case the brief gets wrong and no such case becomes an open item for the user.
- Premises, 23 `main.tex` and linfoot: "What is on the tree" gives 23 at hub head 145e31a28 and linfoot's current text (README and `manuscript/work/`); the hub worktree is made at the hub head the launch message names, whose changes since 145e31a28 under `projects/` touch only linfoot (`git diff --stat 145e31a28 HEAD -- projects`).
- Dictated lines added after the check, held: the ASCII command of "Verify before you report" 2 and the C6 command (ASCII, commands read whole, each runs from the directory it names); `--slide-design-facts: 12px` and `--slide-design-facts-label: 10px` unchanged.
- Premises, failed 4 and stopped 4: corrected, with the eight named.
- Premises, `index.ts:319`: corrected.
- Premises, the in-flight list: now O167, O169 and O170, none sharing a file.
- Premises, Decision 1's reason: rewritten (one shape for every deck, drawing its mechanism and headline); no portfolio summary is named.
- Cases, C4 vs item 1: item 1 now says a deck names no other project and the covert decks never name or describe each other; C4 checks it with `grep -n -i covert`, quoted.
- Cases, C5 and C6 and the gate: C6 is `integrity.test.ts` with `OCULUS_TEST_HUB` and `-t "deck|equation|portfolio"`, another row's finding reported only.
- Cases, C6 temporary folder: every program runs with `TMPDIR` set to the builder's scratchpad ("Where you work").
- Cases, C7 for a PDF: the trace gives file and page for a PDF.
- Cases, C9 vs the first run: the first run covers C5, C6, C8 and C10; C9 is the orchestrator's.
- Cases, C7's first run on replaced decks: C1 to C4 and C7 are first run by noting what each deck holds, without tracing the decks the step replaces.
- Cases, reading the hub's root `CLAUDE.md`: "Where you work" now bars the hub's root `CLAUDE.md`, `AGENTS.md` and `README.md`, and reads only each project's named sources.
- Cases, project `CLAUDE.md` instructions: read for facts only, binding nothing (item 1 and "Where you work"); C3 checks raw-pls's dead targets are on its slides.
- Cases, before and after for the 25 replaced decks: the report gives each one's files before (from the hub base copy) and after, and the figures kept.
- Cases, `npm run diagrams`: in "Verify before you report" 1.
- Question C1 and C2, thin slides and the thesis inputs: the key floor of item 2; item 1 reads `thesis.tex` with its chapters.
- Question C3, a fact dropped for room: item 2 says no fact is dropped for room and goes on the second slide; nothing is hidden, dead ends included.
- Question C5, trivial titles: C5's program prints each slide's kind, title and keys; item 2's key floor holds for the first slide.
- Question C7, the source column: item 2's precedence order, and the report traces every number with its place in that order.
- Question C8, the em measures: item 3 says the strip's other measures follow its own type and the dot stays 9 px; C8 states the values at each text size.
- Question C9, which checkout the server runs: "The measured fit" runs the scratch server on the oculus worktree's code.
- Question item 1, proof of reading: the report gives, per deck, the sources read with the lines or pages of each.
- Implied, `body.rice`: Decision 4, 11 px and 9 px by its 12/13 rule, and the rice comment's list names them.
- Implied, text scales 0.7 and 1.6: C8 gives 8.4 and 7 px, 19.2 and 16 px.
- Implied, the hidden strip's room: "The measured fit" draws with the new strip.
- Implied, `.strip` padding at `Slide.svelte:422-423`: read in range `:410-430`; not changed, since the ruling sets the strip's type only.
- Implied, PDF-only projects and manuscript roots: item 1 names the roots and says what is not the manuscript; "What is on the tree" names the projects with another root.
- Implied, figure formats: item 2 allows png, jpg, jpeg, gif, webp and svg only, no conversion.
- Implied, coauthor authorship: item 1, as the manifest's `lead` and `outcome` give it.
- Implied, `results:`, the abstract, empty placeholders: the precedence order; "What is on the tree" says an empty `{{project.<field>}}` is a finding.
- Implied, `tag.class`: one of `measured`, `design`, `proof`, `mixed`.
- Implied, LaTeX in YAML: item 2 and "Conventions", single-quoted or a block; C5 prints control characters.
- Implied, a results file the README names: item 1 reads it.
- One builder, boilerplate: item 2 and C10, no line repeated across decks unless a fact true of both, listed in the report.
- One builder, the trace deck by deck: the report writes each deck's part as the deck is finished.
- Declined, rice values: Decision 4. Declined, existing figures: Decision 6 and item 2 (kept on disk, drawn only where they show the current result). Declined, `equation`: item 2.