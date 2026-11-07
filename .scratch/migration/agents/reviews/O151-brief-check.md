# Step O151 brief check (on main at f38735e37)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O151.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

`.scratch/migration/plan.md` has no `## Goal` section: `grep -n -i '^#.*goal' .scratch/migration/plan.md` printed nothing, and the section headings are `## Steps, in execution order` (5), `## Could run in parallel` (1721), `## Rulings` (1734), `## Agents` (3636), `## Blocked, and by what` (4547). So "the goal" below is the step line's own, as the brief gives it: a current, complete deck of one or two slides for every research project, fitting its frame, titled, with no finding and nothing hidden.

## 1. Names

- `src/lib/views/academic/present/parts/project/Project.svelte`: `grep -rn --exclude=local.yml -E 'parts/project/Project\.svelte|project/Project\.svelte' src tests config docs README.md utils | grep -v boards/project`. It printed two hits outside the paths. `src/lib/views/academic/present/Slide.svelte:48: import Project from './parts/project/Project.svelte';` is an import, and the change leaves it true. `src/lib/views/academic/present/Panel.svelte:92: /* A figure stands at its box in the slide's room (parts/project/Project.svelte)...` is about placed figures, which item 6 leaves alone, so it stays true. No test renders the component: `grep -rln -E "present/Slide|parts/project|data-slide-kind" tests` printed nothing.
- The `.right` column and the two-column wording: `grep -rn -i -E 'two columns|right-hand column|right column|beside the (formula|equation)|lists and the equation|\.right\b' src/lib/views/academic/present docs/decks.md docs/HELP.md docs/data-map.md README.md tests`.
  - `src/lib/views/academic/present/screen/slide-layout.ts:25: /** The gap between the text and the figures, in px, the gap of a project slide's two columns. */` stays true. `TEXT_GAP` is the gap between text and figures, and `.cols` keeps `gap: 26px` wherever two items stand.
  - `docs/decks.md:314: ... the method and results lists beside the formula and the figures.` stays true. No sentence of `docs/decks.md`, `docs/HELP.md` or `docs/data-map.md` describes the empty half, so the change makes none of them false.
  - Inside the write path: `Project.svelte:15` "A slide with no figure draws its text as it is, the lists and the equation in two columns" becomes false for a slide with no equation, and item 6 asks for it to be rewritten. `Project.svelte:272-274` "The method and the results side by side wherever the text's box holds two columns" is false already on the base, because both lists sit inside `.left` (`:110-143`). The change does not make it false, so item 6's "any comment the change makes false" does not reach it.
- The hub decks (every research project's `present/`): `grep -rn --exclude=local.yml -E 'raw-pls|rawpls|ideas/fedlink|25 (project )?decks|25 of 95|70 (projects|without)' src tests config docs README.md` and `grep -rn ... 'present/main\.md' ...`. Every hit is a synthetic fixture (`tests/state/forms/referrers.test.ts`, `tests/fixtures/hubs/deck-hub.ts:55`, `tests/data/hubs/decks.test.ts`, `tests/data/sources/present.test.ts`), and none reads the real hub. The real-hub reader is `grep -n -i -E 'present|deck' tests/data/real-hub.probe.ts tests/checks/config/integrity.test.ts`:
  - `tests/checks/config/integrity.test.ts:45: const REAL_FLOORS: Floors = { decks: 14, equations: 13 };`. At `:222-253` it reads every project deck of the real hub with the real deck reader. It asserts `deck.findings` `toEqual([])`, that at least 13 equations are drawn, that the drawn count equals the count written in the slide files, and that every equation typesets (`expect(tex(equation, true), id).not.toContain('katex-error')`). This is G14 of `agents/guarded.md` ("G14. The real hub builds with no findings, read only. ... Test: `tests/checks/config/integrity.test.ts`, held whole.").
  - The hub has exactly 13 decks with an `equation:` today: `grep -c -E '^equation:' $(find ~/workspace/research-hub/projects -path '*/present/main.md') | awk -F: '$2>0' | wc -l` printed 13. Nine of them also have figures (dongho-ecg-clustering, btfno, bttd-source-eeg, bttn-incident-af, dries-bttr-ecg, fed-multicellular-immune, hccnet-revision, meseret-cirrhosis, raw-pls, from a per-deck count of `^equation:` and `figure:`).
  - Decision 4's starting size is "one figure or one formula". A builder that follows it on those nine decks drops the real hub below the floor of 13, and G14 then fails over the real hub. The change can make this test false.
- The hub's own text, outside every path of the step:
  - `~/workspace/research-hub/README.md:60` "A project's slide is `present/main.md` (`kind: project`)" becomes partly false for every deck with two slides.
  - `~/workspace/research-hub/deck/title.md` "Research projects that have a deck of their own, each in its own slides." stays true.

Findings:
- `tests/checks/config/integrity.test.ts:45` and `:231-253` (G14): the decks can drop the real hub below 13 equations, and the brief does not name this test.
- The hub's `README.md:60` "A project's slide is `present/main.md`" is made partly false by two-slide decks, and the brief does not name it.

## 2. The step line

- "after O162, O158 and O163 land": no requirement, and none is needed. The three are ticked: `grep -n -E '^- (<check mark> )?O(158|162|163) ' plan.md` printed `1702:- <check mark> O162`, `1704:- <check mark> O158`, `1706:- <check mark> O163`.
- "every slide internal and nothing on it hidden" (ruling Decks are internal): item 2, third bullet.
- "every research project's deck under its `present/`": item 1, written to `.agents/hub/...` and copied into the hub at landing (Decision 1).
- "written from the project's own manuscript, `README.md`, manifest and `CLAUDE.md`": item 2.
- "the 70 projects without a deck get one": item 1 (95 decks).
- "the 25 existing decks are reworked the same way": item 2, fourth bullet.
- "every number on a slide is the project's current number and every framing the project's current one": item 2, first bullet.
- "the failed and stopped projects written like every other (ruling 685)": item 2, second bullet.
- "one slide, or two where that reads better, never more": item 3.
- "every slide fitting its frame": item 4.
- "every slide titled": item 4.
- "each deck read in the Present view with no finding left": item 5, with Decision 5 for the read in the Present view, which the orchestrator does.
- "built from the start by a new builder, nothing of the deleted run used (ruling O151 deleted)": no requirement of "What to build".
  - Line 11 of the brief restates the ruling as a premise only.
  - The ruling "O150 and O151 undone" says the old work is kept only as `agents/reviews/O150-O151-undone.patch`, "whose words no step uses". `ls .scratch/migration/agents/reviews | grep -i -E 'o151|o150'` shows `O150-O151-undone.patch` still in the ledger.
  - `grep -n -i -E 'undone|deleted run|patch' briefs/O151.md` finds only line 11. Nothing tells the builder not to open the patch or any other remnant.
- "built by a builder agent": the brief is a builder brief.
- "the hub commit on the user's word (ruling 679)": item 1 ("the hub commit is made on Axel's word").
- Item 6 (`Project.svelte`) serves no part of the step line, and no ruling names it: `grep -n -i -E 'right column|empty right|Project\.svelte' plan.md orchestrator-state.md` found no ruling on it. It changes product code a reader sees. It can be defended as a fix that lets text-only decks read and fit, but the brief should name it as the orchestrator's widening of the step, with its reason.

Findings:
- No requirement carries "nothing of the deleted run used". The brief should forbid reading `agents/reviews/O150-O151-undone.patch` and any other remnant of the deleted run.
- Item 6 has no part of the step line and no ruling behind it. The brief should state it as a widening and give its reason.

## 3. Premises

- Step line and rulings: `grep -n '^- O151 ' plan.md` printed line 1710, which matches. Rulings 679 (`plan.md:3586`), 685 (`:3594`), "O150 and O151 undone" (`:3596`), "Decks are internal" (`:3619`), "One slide per project preferred" (`:3620`) and "O151 deleted" (`:3621`) all match the brief's summaries. Ruling 679 says "splits or cuts" a slide that is too tall; the brief says "cut", which ruling One slide makes the only option.
- 95 research projects: `find projects -name project.yml | xargs grep -l '^tier: *research' | wc -l` printed 95, which matches. The tiers are 95 research and 4 software.
- 25 with a deck, 64 README, 18 CLAUDE, 24 `manuscript/main.tex`: a `while read` loop over the 95 paths (`test -d present`, `test -e README.md`, `test -e CLAUDE.md`, `test -e manuscript/main.tex`) gave 25, 64, 18 and 24, which matches.
- The table "The 95 projects", row by row: I built the same table with the brief's rule (main.tex; else another .tex; else main.pdf; else the newest .docx) and diffed it with the brief's rows. `diff brief.txt mine.txt` printed three differences.
  - `archive/phd/phd-thesis`: the brief has "main.pdf and chapters/", but by the brief's own rule the manuscript is "another .tex". `manuscript/` holds `thesis.tex` and `mycoverpage.tex`, and `thesis.tex` pulls its chapters in with `\includechapter{...}` (`thesis.tex:165-188`), not `\input` or `\include`. `main.pdf` (184 pages) and `thesis.pdf` differ (`cmp`: differ at char 8). The brief does not say which source wins.
  - `archive/published/2022/block-term-tensor-regression`: `bare_jrnl.tex` matches. The folder also holds `main.pdf` and `FINAL_VERSION.PDF`.
  - `archive/stopped/algebraic-subtyping`: "todo.md" is an annotation and matches `ls` (`project.yml todo.md`).
  - The other 92 rows match.
- Two projects with only a manifest: `ls archive/stopped/algebraic-subtyping coauthor/stopped/individual-reference-intervals` printed `project.yml todo.md` and `project.yml`, which matches.
- The existing decks:
  - `grep -c '^kind:'` over each `present/main.md` printed 1 for all 25.
  - `find projects -path '*/present/*' -type f | grep -vE '\.(md|yml)$' | wc -l` printed 38.
  - Every `present.yml` holds `deck.title` and `order: [main.md]` only (each one read).
  - `projects/manuscripts/raw-pls/present/main.md` is 54 lines with tag, title, sub, hook, eli5, equation, six specs and five panels, and also method, results, mechanism and headline. Its folder holds two files no slide names (`eq_rawpls.png`, `synthetic_upgrades.png`).
  - All of this matches.
- The portfolio deck: `cat ~/workspace/research-hub/deck/present.yml` printed title 'Research projects', group `projects` with `find: { folders: [projects/**/present], tiers: [research] }` and `discover: true`, and order `title.md`, `{ slides: projects }`, `closing.md`. This matches.
- `docs/decks.md`: `wc -l` printed 434. `sed -n` of lines 75, 123, 166, 168, 343, 345, 367, 383, 391, 403, 420, 429 and 434 shows `## present.yml`, the `order` bullet, the layout paragraph, `## Slide kinds`, the grid kind, `## Front-matter keys`, `headline`, `## The project facts strip`, the toggle bullet, the field table head, `tier`, `## Slide findings` and Too tall. All ranges match.
- `Project.svelte:68`, `:144`, `:275-280`: read whole. `:144` is `{#if right || !pictured}` and `:275-280` is `.cols` with `repeat(auto-fit, minmax(min(300px, 100%), 1fr))`, which match. `:68` is `const right = $derived(slide.equation !== undefined || figures.includes(false));`.
  - The brief says `right` is "true only when the slide has an equation or a figure that failed". That is incomplete.
  - `figures[at]` is false (`:57-65`) for a panel with `missing === true` (a figure the folder lacks), a panel with no `src` (a `diagram_html` panel), a failed figure, and every panel of a slide that is not `rich`.
  - The comment at `:67` says so: "the equation, a diagram or a figure's name". `docs/decks.md:314` also says "A diagram (`diagram_html`) and the words of a missing figure are drawn with the text."
- An empty grid item takes its track. The CSS Grid Level 1 specification (https://www.w3.org/TR/css-grid-1/), section 7.2.3.2, read through WebFetch, says: "any empty repeated tracks are collapsed." and "An empty track is one with no in-flow grid items placed into or spanning across it." Section 6 says: "Each in-flow child of a grid container becomes a grid item". So an empty `<div class="right">` is an in-flow grid item, its track is not empty, and it is not collapsed. With the element gone, the empty tracks collapse to 0px and `.left`'s `1fr` track takes the width. The premise holds.
- guarded.md: `grep -n 'Project.svelte' .scratch/migration/agents/guarded.md` printed nothing (rc=1), which matches.
  - The brief's later sentence under Cases, "no entry of `agents/guarded.md` covers ... the hub's deck text", is false. G14 ("The real hub builds with no findings, read only", Test `tests/checks/config/integrity.test.ts`, held whole) reads every project deck of the real hub and asserts no deck findings and that the equations typeset (`integrity.test.ts:222-253`).
- `.gitignore:12`: `sed -n '12p' .gitignore` printed `.agents/*`, which matches. Line 13 is `!.agents/plan.yaml`.
- The verify list: `orchestrator-state.md:6-7` gives `verify:` as `npm run test:quick`, which matches.
- `yaml` in `package.json`: `grep -n '"yaml"' package.json` printed `128: "yaml": "^2.9.0",`, which matches.

Findings:
- `Project.svelte:68`: `right` is also true for a diagram panel, a missing figure and the panels of a slide that is not rich, as well as for an equation or a failed figure. The brief's premise and item 6's wording name only the equation and the failed figure.
- The Cases section's "no entry of `agents/guarded.md` covers ... the hub's deck text" is false: G14's `tests/checks/config/integrity.test.ts` covers it.
- `archive/phd/phd-thesis`: the table names "main.pdf and chapters/", while the brief's rule gives `thesis.tex`. `thesis.tex` uses `\includechapter`, which the brief's "`\input` and `\include` files followed" does not cover. `main.pdf` and `thesis.pdf` differ.

## 4. Cases and checks

- C1: consistent.
- C2: consistent with the rules file's case-run program paragraph. It prints only each file's first kind, so a second slide with an unknown `kind:` goes unchecked. An unknown kind is a finding and that slide is not drawn (`docs/decks.md:164`).
- C3: consistent.
- C4: consistent in form. It checks `present.yml` keys against `docs/decks.md:345-367`, but that range lists slide front-matter keys. The keys of `present.yml` are at `:75-123`, and item 1 says "no other key" than `deck.title` and `order`.
- C5: consistent. It checks that a figure exists, not that it draws. A figure in a format the slide's `<img>` cannot show still exists in the folder.
- C6: consistent. "Parses to the LaTeX as written" is weaker than G14's `tex(equation, true)` not containing `katex-error` (`integrity.test.ts:252`), the repository's own typeset check.
- C7: consistent. It traces numbers only, not the state claims (stage, venue, next).
- C8 to C11: consistent; each is checked by reading.
- C12: consistent with the rules file's "A builder runs no page" and "A behaviour that needs a DOM" paragraphs, since the look on landing is named as its proof.
- C13: consistent.
- C14: consistent.
- The first run: consistent with "What every package obeys".
- Against the rules file's specific paragraphs:
  - Case-run program: one program in the scratchpad, printing only, its source and output quoted. Consistent. The paragraph also says a file the program needs "is gone before the report", which the brief does not repeat. A program in the session scratchpad that imports `yaml` does not resolve it from the worktree's `node_modules`, so it would have to import by absolute path; the brief does not say so.
  - Scripts needing approval: the brief's paragraph under "Paths this step writes" matches the rules file. `cp` for figures is not on that paragraph's list of scripts.
  - A builder runs no page: Decision 5 matches.
  - Writing under the hub's folders: Decision 1 writes into the worktree's ignored `.agents/hub/projects/...`, not into the hub, which agrees with "Where you work". The rules file's last paragraph applies to hub text a builder writes by hand under a ruling: "the report lists each line before and after, and the reviewer reads each one". The brief's Report asks only for "every number or claim of the old deck that the new one drops or changes" for the 25 replaced decks. It neither asks for the before and after of each line (a `diff -u` of the old and new `main.md` would give it) nor says why the rule does not apply.
  - Reading the hub's CLAUDE.md: the brief says the hub's `CLAUDE.md` is not read, which agrees with "Read first". The step line orders the 18 project `CLAUDE.md` files read as sources. These are instruction files, 10 of them reached as `AGENTS.md -> CLAUDE.md` (from `find projects -maxdepth 4 -name AGENTS.md -exec ls -la`), and they hold directives. For example `covert-applied/CLAUDE.md:11` reads "HARD BOUNDARY - never touch the HCCNet (Paper 3) deposit". The rules file says "the rules that bind you are the ones below", and the brief does not say that a project `CLAUDE.md` is read as a source of facts only and binds the builder in nothing.
- A case asking about a place the step does not change: none. C12 reads `Project.svelte:144`, which is in the paths.

Findings:
- C4 names the wrong range of `docs/decks.md` for `present.yml`. It should name `:75-123`, or item 1's "`deck.title` and `order`, no other key".
- C2 checks only the first slide's kind. It should also print the second slide's kind and check that it is one of `image`, `equation`, `columns` or `text`, as item 3 says.
- C6 is weaker than the repository's typeset check. It should check that each equation typesets (`tex(equation, true)` without `katex-error`), or name G14's run (finding 6.2).
- The Report lacks the before and after that the rules file's hand-written hub text paragraph asks for, on the 25 replaced decks at least.
- No line says that the project `CLAUDE.md` files are sources of facts and not instructions to the builder.

## 5. The question

- C1: could pass without the goal. 95 folders say nothing about their content. It is a necessary check only.
- C2: could pass without the goal. A stale or thin one-slide deck passes it.
- C3: no. It does what it says.
- C4: could pass without the goal. A key list says nothing of content, and the `present.yml` keys go unchecked (finding 4.1).
- C5: could pass with a broken figure. A figure that exists but does not draw passes it.
  - `archive/published/2026/glassbox-decision-pipelines` has 0 image files and 11 figure PDFs, from a `find` over the 70 deckless projects for png, jpg, jpeg, svg, webp and gif against `*.pdf` under `*fig*`.
  - The deck reader gives any named file that exists a `src` (`src/lib/data/sources/deck/project.ts:90-95`), and the panel is drawn through an image element. A PDF figure would be drawn as its file name (`Panel.svelte:11-12`) with no deck finding, so C5 passes.
- C6: could pass with an equation that does not typeset, since parsing is not typesetting.
- C7: yes, it could pass without the goal.
  - Every number on a slide can be traced while the deck leaves out the project's headline result or current state.
  - Only numbers are traced. A wrong stage, venue or "what comes next" (such as "under review" for an accepted paper) passes it.
  - Nothing checks that the deck holds the project's current results and state, which item 2 asks for, as opposed to merely tracing what it holds.
- C8 to C11: they check 4 of the 95 decks by reading. The other 91 are checked for content only through C7's number trace. Ruling Decks are internal ("every deck holds the full information of its project's sources") is checked for one project (C11). Item 2's "everything the sources hold that the deck needs" has no criterion that a reviewer can read a deck against.
- C12 and C13: could pass while a diagram or a missing figure's name disappears. Neither case covers a slide with a `diagram_html` panel or a missing figure and no equation, and item 6's wording would remove that column (finding 3.1).
- C14: no.
- The step line's check, "each deck read in the Present view with no finding left": yes, it could pass without the goal. A finding-free deck can be stale or incomplete. It is also the look's work (Decision 5), and no builder check runs the real reader. G14's test, `OCULUS_TEST_HUB=<a hub copy with the decks laid over> npx vitest run tests/checks/config/integrity.test.ts`, is the real reader's run and is not named.
- Item 1: could pass without the goal, as for C1.
- Item 2: yes, it could pass without the goal (see C7 to C11). No check holds a deck to "what it is, why, how, current results with numbers, current state" for each of the 95.
- Item 3: yes in part, as for C2's second slide.
- Item 4, too tall: checked only by the orchestrator's look (Decision 5). It can pass while a slide is too tall in these ways:
  - The portfolio deck opens under Mine only by default (`docs/decks.md`, The filter: "a deck one of whose projects is not yours opens narrowed to your projects and those naming no one"). A slide that is not drawn is not measured (`Framed.svelte:1-15`). Decision 5's "opens every deck" does not say whether that means each project's own deck in its Overview or the portfolio deck with the filter cleared.
  - The finding clears on reload ("stay until the slide fits, leaves the deck or the page is reloaded").
  - A PDF figure drawn as its name takes less room than the image would.
  - A slide whose text is drawn at three quarters of its size passes by the definition `docs/decks.md:166` gives.
- Item 5: yes. The case-run program models the reader but is not the reader, and the real reader (G14, or the Findings view at the look) is reached only at the look.
- Item 6: yes, as for C12 and C13.

Findings:
- No case checks that a deck's content is complete and current, beyond tracing the numbers it holds (C7) and four sampled projects (C8 to C11). A per-deck check is needed. One form: for each project, the report names the source lines of its current stage, venue and next action and of its headline results, and quotes where each stands on the slide; the reviewer reads them against the sources.
- C7 traces numbers only, so stale state claims (stage, venue, next) pass it.
- C5 passes a figure that exists but does not draw (glassbox's PDF-only figures).
- The look in Decision 5 can miss too-tall slides that the portfolio deck's default Mine only filter leaves undrawn. It should say how every deck is drawn: each project deck's Overview, or the portfolio deck with Clear all and Mine only off.
- Item 5 and C6 have no run of the real deck reader. G14's `integrity.test.ts` over a hub copy with the decks laid over is the repository's own check of both and is not named.
- Item 6's wording passes a build that drops diagrams and missing-figure names (finding 3.1).

## 6. Implied inputs

The step is a code step (`Project.svelte`) and also writes hub text.

- A figure that exists only as a PDF (glassbox-decision-pipelines, 11 figure PDFs and no image file): missing from Cases. Expected: the brief says that a figure is one of the formats a slide draws (png, jpg, jpeg, svg, webp), and that a project with only PDF figures gets no figure, since figures are never generated.
- A title with a colon: 21 of the 95 manifest titles hold ": " (`grep -c -E "^title: .*: "` over the 95 titles). Covered by Conventions (YAML quoting) and C4's parse.
- HTML in a title: none in the 95 manifest titles (`grep -n -E '<|>|&'` printed nothing). The old deck titles hold `<i>`, and they are replaced. Covered.
- A long title: the longest manifest title is 175 characters (`awk` over the 95 titles), against Decision 4's slide title of about 70. The brief makes `deck.title` the manifest title but does not say whether the slide's `title:` may differ from it. This costs little, and the look decides it.
- A manuscript folder with several `.tex` files: missing from Cases.
  - The rule picks `main.tex`, and nothing names the supplementary files. A `find manuscript -maxdepth 1 -name '*.tex'` loop listed `raw-pls` (supplementary.tex), `meseret-cirrhosis` (supplementary.tex), `btfno` (supplement.tex, ReproducibilityChecklist.tex), `ward-bttr-crosssubject` (supplementary.tex, body_2col.tex, main_2col.tex), `extended-bttr-note` and `abduction` (supp.tex), `bttd-source-eeg` (highlights.tex) and `source-localization` (main_latest.tex, appendix.tex).
  - A result or number that sits only in a supplement is outside "the manuscript the table names".
  - `phd-thesis` is ambiguous (finding 3.3).
  - Expected: the brief says whether the supplement files are read, and which file is the thesis's source.
- A manuscript whose numbers disagree with the project's `CLAUDE.md` or README: for example `covert-applied/CLAUDE.md:6` says "the manuscript still has PLACEHOLDER numbers", while `grep -c PLACEHOLDER covert-applied/manuscript/main.tex` printed 0. Covered by Decision 2 (README wins, each disagreement listed).
- The size of the read. The PDF manuscripts total 674 pages (`mdls -raw -name kMDItemNumberOfPages` over the PDFs the table names): the thesis 184 pages, the bachelor thesis 145, the master's theses 99 and 62. On top of that come 24 or more `.tex` manuscripts and 64 READMEs, all "read in full" by one builder in one session, at 20 PDF pages per Read call. This is not a case. The rules file's report section says a task too large to finish is said so before starting. The brief gives the builder no order or plan for a context compaction mid-run, and the trace of C7 depends on what the builder still holds after one.
- A deck reused by the portfolio deck's filter: under Mine only, the coauthor decks are not drawn at the look (finding 5.4). Not covered.
- A figure that fails to load: covered for the code. `Panel.svelte` draws its name in the right column, and item 6 keeps the column for a failed figure. Not covered for the content, as for the PDF figure above.
- A slide with a `diagram_html` panel, or a missing figure, and no equation: missing. Expected: the column is still drawn with the diagram or the figure's name. The change that gives this is `{#if right}` in place of `{#if right || !pictured}`, since with `right` false, `!pictured` holds only for a slide with no panel and no equation:

```svelte
{#if right}
    <div class="right">
```

- Equations below G14's floor of 13: missing (finding 1.1). Expected: either the decks keep at least 13 equations (Decision 4's "one figure or one formula" made to allow both), or the floor is reported and never loosened.
- Two figures with the same file name copied from different folders of one project (for example two `fig1.png`): `cp` overwrites the first, and C5 still passes. Missing. Expected: a renamed copy, with the report naming its source.
- A second slide with an unknown `kind:`: missing (finding 4.2).
- A `tag.class` outside `defaults.tag_tones` (`config/defaults/present.yml:8-12`: measured, design, proof, mixed): covered by Decision 3. No case checks it, and such a class draws in no hue.

Findings:
- Missing from Cases: a PDF-only figure.
- Missing from Cases: which `.tex` files a manuscript with several includes, and which source the thesis uses.
- Missing from Cases: a diagram or missing-figure panel with no equation under item 6.
- Missing from Cases: G14's equation floor of 13 under Decision 4.
- Missing from Cases: a figure name copied twice from different folders.
- Missing from Cases: a second slide's kind.
- The look under the portfolio deck's Mine only filter is not covered.
- The size of the source read, and what happens at a compaction, are unstated.

## 7. ADRs

- `test -d docs/adr || echo "no docs/adr"` printed `no docs/adr`. `grep -c -i adr .agents/plan.yaml` printed 0, so the configuration names no ADR folder. No record.

Findings: none.

## 8. Dictated text

- The brief dictates no slide text and no comment text. Item 6 asks for the head comment to be rewritten without giving its words.
- The one dictated shape is `present.yml`: "`deck.title` (the project's title from its manifest's `title:`) and `order: [main.md]`, no other key", found by `grep -n 'order: \[main.md\]' .scratch/migration/agents/briefs/O151.md` (lines 15 and 25). It holds against `docs/decks.md:99` (`deck.title`) and `:123` (`order`).
- The Conventions word "Linkoping" (line 207) is written in ASCII, which holds for the brief's own character set: `LC_ALL=C grep -n '[^ -~]' briefs/O151.md` printed nothing.

Findings: none.

## Declined to judge

- Whether "everything the sources hold that the deck needs" (item 2) is the right reading of ruling Decks are internal ("every deck holds the full information of its project's sources"). The ruling's words and the one-or-two-slide limit can only be met together by choosing what goes on a slide. That reading is the orchestrator's to state, and Axel's to rule on if it is disputed. The ruling One slide forbids raising an open item about the decks.
- Whether item 6 should be in this step at all, or in a separate step with its own line. It has no ruling (finding 2.2), and placing it is the orchestrator's call.
- Whether one builder session can read 674 PDF pages and every other source in full and keep a trace of every number. This is an estimate of cost and capacity, which no read or rerun settles.
- Whether any project's own `CLAUDE.md` or README asks that something be kept off a deck (for example a rule that two papers never mention each other). Ruling Decks are internal says nothing is hidden. I did not read the 95 projects' sources for such rules.
- I did not read `agents/reviews/O150-O151-undone.patch` or any `local.yml`, as instructed.

Agent usage: a9884b252a619f8e8, claude-opus-5-5, 208952 tokens, 72 tool uses, 13.6 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- 1.1 (G14's floor of 13 equations): "What to build" item 2 keeps the sources' equation on the first slide beside its figure, the floor never lowered; Decision 4 allows a figure and a formula together; C6 counts the decks with an equation (at least 13); "What is on the tree" names G14; "Verify before you report" names the orchestrator's G14 run over the scratch hub.
- 1.2 (hub `README.md:60`): the Report asks for a Doc text line with the sentence as the new decks make it true, applied at landing on Axel's word.
- 2.1 (nothing of the deleted run): item 2 forbids opening `O150-O151-undone.patch` and any other ledger file about O150 or O151 other than the brief.
- 2.2 (item 6 without a ruling): item 6 names the ruling it rests on, One slide per project preferred ("You fix EVERYTHING with regards to slides"), with its reason. Item 7 (the strip's size) is added under the ruling Facts strip smaller, booked in `plan.md` Rulings and tagged on O151's line.
- 3.1 (`right` holds for more): "What is on the tree" lists every case of `right`; item 6 draws `.right` exactly when `right` holds.
- 3.2 (the Cases sentence on hub deck text): rewritten; G14 covers the hub's deck text and is run by the orchestrator.
- 3.3 (phd-thesis and several manuscript files): item 2 names `thesis.tex` with its `\includechapter` chapters and every top-level `.tex` of `manuscript/`; "What is on the tree" lists the supplement files.
- 4.1 (C4's range): C4 names `docs/decks.md:75-123` for `present.yml` and adds `tag.class`.
- 4.2 (second slide's kind): C2 prints and checks every slide's kind.
- 4.3 (C6 typesetting): C6 typesets with `tex(equation, true)` and checks for `katex-error`; the case-run program's imports are named by absolute path.
- 4.4 (before and after of the 25 decks): the Report asks for `diff -u` of each old and new `main.md`.
- 4.5 (project CLAUDE.md files): item 2 says they are sources of facts and bind the builder in nothing; "What is on the tree" names them.
- 5.1 and 5.2 (completeness, state claims): C7 traces state claims; C7b asks per deck for the source lines of stage, venue, next action and headline results and where each stands on the slide; the Report carries the rows.
- 5.3 (PDF-only figures): item 1 lets a project's own PDF figure be turned into a PNG with `sips`, reported per figure; C5 checks the formats; C16 checks glassbox-decision-pipelines.
- 5.4 (the look under Mine only): Decision 7 sets Mine only off and Clear all, and reads the Findings view.
- 5.5 (G14's run unnamed): named under "Verify before you report".
- 6.x (implied inputs): two figures of one name are copied under names that tell them apart (item 1); the slide title may be a short form, listed (Decision 6); the projects are written one at a time with each deck's report rows written as it goes (item 2), so a compaction loses no trace.
- Declined, the size of the read: the orchestrator's judgment is that one builder can do it, since the decks and their report rows are written per project as the reading goes; the 674-page figure is not repeated in the brief, since it was not re-measured.
- Dictated lines added after the check: none; item 7 gives sizes and a token name, no text word for word.