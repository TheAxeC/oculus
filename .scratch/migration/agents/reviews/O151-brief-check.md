# Step O151 brief check (on main at 3fe97e21a)

Command for the head: `git rev-parse --short HEAD` in /Users/axelfaes/workspace/oculus printed `3fe97e21a`. The brief is /Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O151.md (225 lines). plan.md has no section headed Goal: `grep -n '^## ' plan.md` lists only Steps, Could run in parallel, Rulings, Agents and Blocked. Its opening paragraph ("Execution ledger for `tools/oculus/DESIGN.md`") stands in for a goal, so this check uses the goal given in the task.

## 1. Names

The step changes these names: the facts strip's size source in `Facts.svelte` (`--fact-label`, and `font-size: var(--slide-fs-small)` on `.facts`); two new design sizes and two new computed sizes in `slide.css` (the brief leaves their names to the builder); the rice rule's sizes; and the term "small type" for the strip.

- `grep -rn -E 'slide-design|slide-fs-small|fact-label' src tests config docs README.md --exclude=local.yml`, with slide.css left out of the output:
  - `--fact-label` is found only at Facts.svelte:158 and :222. Both lines are inside the write list.
  - `--slide-fs-small` is used outside Facts.svelte at Words.svelte:59,64, Section.svelte:79,97, Panel.svelte:121,135,147,165,178,188, Plain.svelte:119, Title.svelte:53,74, Grid.svelte:81,93,106,116, Summary.svelte:101 and Project.svelte:246,254,290,303,330,338. The variable is kept, so none of these lines becomes false.
  - Facts.svelte:24 (script head comment): "set in the slide's small type (`--slide-fs-small`, themes/slide.css) at the frame's factor 1". The file is in the write list, but "What to build" only asks for the style block's head comment (:150-156) to be rewritten. **This line becomes false and the brief does not name it.**
  - Facts.svelte:152-156 (style head comment): "set in the slide's small type ... 9 px at the design size". This becomes false, and the brief does require it rewritten.
- `grep -rn 'slide-' src/lib/themes --include='*.css'`, with slide.css left out: no hit. No other theme sets the slide sizes.
- slide.css:59-62 (rice comment) lists "56 gives 52 ... 18 gives 17". It stays true but becomes incomplete once two sizes are added. The brief says only "as the rule's comment there says" and does not ask for the list to be extended (in the write list).
- slide.css:10-15 (head comment): "the slide's foot under the content (the strip of a project's facts) keep the factor 1". This stays true and is in the write list.
- Comments outside the write list:
  - Slide.svelte:33 ("holds the strip of a project's facts at the frame's own type scale"): still true.
  - Dot.svelte:5-6 ("The dot is 9 px across unless an element around it sets `--dot-size`, which the strip sets to follow its own type"): still true.
  - tokens.css:159 ("the slide scale in `slide.css`") and themes.css:55 ("The slide scale is lowered in `slide.css`"): still true.
- Docs: `grep -rn -i -E 'facts strip|strip of (a|the) project|project facts|small type|18 ?px|12\.96' docs README.md config src/lib/views/academic/present tests --exclude=local.yml` found no sentence outside the write list that gives the strip's size. docs/decks.md:355-364 states no size. config/text/views/academic/present.yml:95-96 (`facts: Project facts`, `facts_tip`) holds no size and stays true. `grep -n -i 'facts' docs/HELP.md docs/data-map.md` printed nothing.
- Tests: `grep -rln -E 'parts/project/Facts|themes/slide' tests` printed nothing, and `grep -n -i -E 'facts|slide\.css|Facts.svelte' .scratch/migration/agents/guarded.md` finds only line 277. That line names `src/lib/data/shapes/project-facts.ts`, which the step does not change.

Findings:
- F1.1: Facts.svelte:24 becomes false ("set in the slide's small type (`--slide-fs-small` ...)"). "What to build" names only the style head comment at :150-156, so the brief should also name the script head comment at :23-25.
- F1.2: the rice comment at slide.css:59-62 should be required to list the two new cases (12 gives 11, 10 gives 9). As written, the brief relies on that comment while leaving it as an incomplete list.

## 2. The step line

The plan's O151 line (plan.md:1710), part by part:
- "after O162, O158 and O163 land": `grep -n -E '^- (... )?O(158|162|163) ' plan.md` shows all three ticked (plan.md:1702, :1704, :1706). This is a precondition, not a requirement.
- "every slide internal and nothing on it hidden": Part 1, bullet 3; C4.
- "every research project's deck under its `present/`": the Part 1 intro; C1.
- "written from the project's own manuscript, `README.md`, manifest and `CLAUDE.md`": Part 1, bullet 1.
- "the 70 projects without a deck get one, and the 25 existing decks are reworked the same way": the Part 1 intro.
- "every number on a slide is the project's current number and every framing the project's current one": Part 1, bullet 2; Decision 2; C6.
- "the failed and stopped projects written like every other (ruling 685)": Part 1, bullet 3; C4.
- "one slide, or two where that reads better, never more": Part 1, bullet 4; Decision 3; C2.
- "every slide fitting its frame": Part 1, bullet 6. No case covers it; Decision 4 leaves it to the look.
- "every slide titled": Part 1, bullet 5; C3.
- "each deck read in the Present view with no finding left": **no requirement in "What to build" and no case.** Only Decision 4 serves it, and that is the orchestrator's look.
- "built from the start by a new builder, nothing of the deleted run used (ruling O151 deleted)": Part 1, bullet 8.
- "built by a builder agent": the brief as a whole is addressed to a builder.
- "the hub commit on the user's word": Part 1, bullet 9.
- "the project facts strip drawn at a size below the slide's text (ruling Facts strip smaller)": Part 2 (slide.css, Facts.svelte); C8.
- Ruling 679's "titles every slide without a title" and "splits or cuts every slide ... too tall": Part 1, bullets 5 and 6.

Findings:
- F2.1: "each deck read in the Present view with no finding left" has no requirement and no case for the builder. Most findings of the deck reader can be found without a browser: a slide with no title, an unknown kind or key, a missing image or figure, and an empty `{{project.<field>}}` (docs/decks.md, "The project facts strip": "A field with no value is filled with the empty text, and is a finding"). `src/lib/data/sources/deck/read.ts:221` exports `createReader`, so a case-run program (spec.md, "What every package obeys") could print each deck's findings. Only "slide too tall" needs the browser.

## 3. Premises

Each command of "What is on the tree" rerun:
1. 99 manifests; 95 research and 4 software; of the 95, 25 with a deck and 70 without. The loop over `projects/*/*/project.yml`, `projects/*/*/*/project.yml` and `projects/*/*/*/*/project.yml` printed `70 research no`, `25 research yes`, `4 software no`, and the file count was `99`. **Holds.** The 95 research folders, written as `<folder>/present/`, match the brief's 95 hub paths exactly: `diff` of the sorted lists printed `SAME`.
2. 64 with a README, 24 with a `manuscript/main.tex`, 18 with a CLAUDE.md. The same loop printed `64 README:yes`, `24 TEX:yes`, `18 CLAUDE:yes`. **Holds.**
3. `git status --short -- projects deck README.md` in the hub printed nothing (rc=0). **Holds.**
4. `ls` and `cat` of `projects/ideas/btd-autoencoder/present/`: `main.md` and `present.yml` (`deck: title: BTD Autoencoder`, `order: - main.md`). main.md is one `kind: idea` slide with only a `desc:` line. **Holds.** Note that "the existing decks are short" holds for the ten idea decks of 4 lines. The manuscript decks are longer: raw-pls has 54 lines of Markdown and 8 PNGs, covert-applied 51 lines, hccnet-fl 48 lines (`cat $d/*.md | wc -l` per deck).
5. config/defaults/present.yml:4-6 is `frame:`, `width: 1280`, `height: 720`. **Holds.**
6. The docs/decks.md headings (`grep -n '^#' docs/decks.md`) are at :11 A deck's files, :67 present.yml, :137 Slides, :146 Front-matter keys, :172-:331 the slide kinds, and :355 The project facts strip, which runs to :364 with the `{{project.<field>}}` sentence. **Holds.**
7. Facts.svelte:
   - `.facts` at :157-167 holds `--fact-label: 0.72em` (:158) and `font-size: var(--slide-fs-small)` (:165). Holds.
   - `.label` is at **:219-225**, not :217-224 (:213-217 is `.mark`).
   - The style head comment is at **:152-156**, not :150-156 (:151 is `<style>`).
   - slide.css:21 `--slide-design-small: 18px` and :40 the calc hold, so the values are 18 px and the labels 18 x 0.72 = 12.96 px. Holds.
   - The rice rule at slide.css:59-69 with `--slide-design-small: 17px` (:68) holds.
   - Facts.svelte is 249 lines (`wc -l`).
8. config/text/findings.yml:141 is `untitled: 'slide {1} of {0} has no title of its own; give it a level-1 heading, or a title: in its front matter for a project or an idea slide'`, and :142 is `too_tall`. kinds.ts:284 is `const untitled = plain(heading) === '';`. **Holds.** Slide.svelte:27-29 says "a measuring Stage reports as too tall". Holds.
9. `ls docs/adr` printed "No such file or directory". **Holds.**

Two premises sit in "What to build" rather than in "What is on the tree", and neither holds:
- Part 1, bullet 6 cites "`docs/decks.md`, the slide kinds and their fit" and "the kinds and limits `docs/decks.md` gives". Reading docs/decks.md whole, it has no section on fit, no text factor and no limits. `grep -n -i -E 'too tall|text factor|least factor|fit' docs/decks.md docs/HELP.md` printed only `docs/decks.md:289:model.fit(data, epochs=10)`. The fit rule lives in Slide.svelte:9-31 and slide-layout.ts:29 (`FIT_LEAST = 0.75`), and the brief gives the builder neither.
- C3 and Part 1, bullet 5 state the title rule as "a level-1 heading, or `title:` in its front matter for a project or an idea slide". docs/decks.md, "Slides", says "a title from its front matter or its project". In the code:
  - kinds.ts:382 counts a project slide as titled when it has a `title:` or its project has a short name.
  - kinds.ts:390 titles an idea slide of a project's deck by the project's short name or title, so its `title:` is never read (docs/decks.md, "Front-matter keys": "An idea slide of a project's deck takes the project's short name, else its title, instead").

Findings:
- F3.1: the line ranges for `.label` (:219-225) and for the style head comment (:152-156) are off by two and by two.
- F3.2: Part 1, bullet 6 points the builder at a fit section and limits that docs/decks.md does not have. The brief should cite Slide.svelte's fit rule and `FIT_LEAST`, or state the limits it means.
- F3.3: the title rule in Part 1, bullet 5 and C3 differs from docs/decks.md and kinds.ts:382-393. A `title:` on an idea slide of a project's deck is ignored.

## 4. Cases and checks

C1 to C10, read against spec.md:
- C1 (`95 research yes`): consistent with spec.md. The loop as written prints one line per manifest. The expected output `95 research yes` assumes a `sort | uniq -c` the brief does not write; the rerun above needed it.
- C2: consistent.
- C3: consistent, but it rests on the misstated rule (F3.3).
- C4: consistent. The project exists and holds `code`, `project.yml` and a 73-line `README.md` (`ls`, `grep -c .`).
- C5 (manifest fields "title, eli5, results, next"): there are 25 manifest-only research projects. Of them, `eli5` is in 25, `results` in 11, `next` in 0 and `outcome` in 25 (`grep -c '^next:'` and the others per manifest, summed). The case names a field that no manifest-only project has and leaves out `outcome`, which every one has.
- C6: consistent. It does not cover a README that disagrees with the manifest: Decision 2 ranks those two together and never against each other.
- C7: consistent.
- C8: consistent. Dark Modern exists (vscode.css:377).
- C9 ("at `--slide-fit: 0.75` and at `1.25` the strip's sizes scale with the slide's other sizes") contradicts the tree:
  - The strip is drawn in `.foot`, outside `.content.slide-fit`, which alone carries `style:--slide-fit={fit}` (Slide.svelte:323-326 and :378-380).
  - slide.css:13-14 says "the slide's foot under the content (the strip of a project's facts) keep the factor 1".
  - Facts.svelte:24-25 says "at the frame's factor 1 ... outside the content's factor".
  - A strip that scaled with the fit would change the foot's height while the fit search runs, which Slide.svelte:39-42 measures each time.
- C10: asks the builder to check the `.hidden` rule (Facts.svelte:246-248), a place the step does not change.

Rules-file points that bear on the cases and on "What to build":
- spec.md, "The working rules", Read first item 3: "Do not read the hub's instruction file (`CLAUDE.md`, also reachable as `AGENTS.md`)". The brief's Read item 5 sends the builder to `~/workspace/research-hub/CLAUDE.md`, "Writing docs". This clashes with that rule; its content is already restated under Conventions. Reading each project's own `CLAUDE.md` is ruled by the step line, so it is not part of this clash.
- spec.md, "What every package obeys", third-to-last item ("No step adds to or rewrites `docs/HELP.md`, `docs/data-map.md` or `docs/decks.md`, except the step whose brief is to write them and a line Axel ruled into a step's brief"). Part 2's docs/decks.md sentence is not in ruling "Facts strip smaller", which names only slide.css and the look, and O151's brief is not a brief to write decks.md. No sentence there becomes false, since :355-364 states no size.
- spec.md, "Where you work" ("You never write under ... `projects/` ... or any other hub data folder"), and the last paragraph ("writes there, in the worktree's copy, through the script the brief names and by nothing else"; the by-hand exception covers "lines of hub text a builder rewords by hand, where a ruling of Axel's asks for the rewording"). Part 1 has the builder write 95 folders of new files by hand in the live hub at `~/workspace/research-hub`, not in a copy. The step line and rulings "O150 and O151 undone" and "O151 deleted" ask for a builder to write the decks, but the brief never cites that authority or reconciles it with these two rules.

Findings:
- F4.1: C9 asks for behaviour the tree deliberately does not have. Either drop it, or replace it with: at fit factors 0.75 and 1.25 the strip stays at 12 px and 10 px, since it sits outside the fit box.
- F4.2: C10 checks an unchanged rule (`.hidden`, Facts.svelte:246-248).
- F4.3: C5 names `next`, which none of the 25 manifest-only manifests holds, and leaves out `outcome`, which all 25 hold.
- F4.4: Read item 5 (the hub's CLAUDE.md) clashes with spec.md's ban on reading the hub's instruction file.
- F4.5: the Part 2 docs/decks.md sentence and its write-list line `docs/decks.md lines 355-364` clash with spec.md's rule on decks.md, because no ruling of Axel's dictates that line.
- F4.6: Part 1's by-hand writes in the live hub clash with spec.md, "Where you work" and its last paragraph. The brief should quote the ruling that authorizes them, or this is a rule clash for the orchestrator to bring to Axel.
- F4.7: C1's expected output `95 research yes` needs `sort | uniq -c`, which the loop as described does not include.
- F4.8: no case covers a README that disagrees with the manifest (Decision 2 does not rank the two).

## 5. The question

Could each pass without the goal being reached?
- C1: yes. It passes with one empty or stale slide per project, because it tests only that `present.yml` and a slide file exist.
- C2: yes. It counts slides and says nothing about whether they are current or complete.
- C3: yes. Every project slide whose project has a short name, and every idea slide of a project's deck, is titled by default (kinds.ts:382, :390), so the case passes with no title written.
- C4: no for the one project it reads. It says nothing about the other failed and stopped decks (fed-faithful-ecg, faithful-block-term-layer, jacobian-coupled-blockterm-dp, algebraic-subtyping, connectivity-motor-imagery, individual-reference-intervals).
- C5: yes. It reads three of 25, and its field list does not match those manifests (F4.3).
- C6: yes. It checks only the differences the report lists: an unlisted disagreement, a number stale in every file, or a README-against-manifest difference passes.
- C7: no, within what reading can show.
- C8: no for the computed value at text scale 1. The look measures the drawn value.
- C9: yes. Reading a `calc` that contains `var(--slide-fit, 1)` passes, while the drawn strip never takes the fit factor (F4.1).
- C10: yes, trivially. The rule is unchanged whatever the step does.
- The step line's check ("each deck read in the Present view with no finding left"): yes. A deck with no finding can still be stale, incomplete or a single line.
- Part 1:
  - Intro ("written again the same way ... unless still current and right"): yes. No case compares a reworked deck with its sources.
  - Bullet 1 (read each file in full): yes. Nothing shows a file was read. The report's source-file table is self-reported.
  - Bullet 2 (current numbers): yes, as for C6.
  - Bullet 3 (internal, nothing hidden): only C4 checks it, for one deck.
  - Bullet 4 (one or two slides): no, C2 counts it.
  - Bullet 5 (titled): yes, as for C3.
  - Bullet 6 (fits): yes for the builder, who cannot draw a slide and has no limits to read (F3.2). Decision 4's look is the only check.
  - Bullet 7 (follows docs/decks.md): yes. No case checks keys, kinds or empty placeholders, though the deck reader could (F2.1).
  - Bullet 8 (no interface words): no, C7 reads it.
  - Bullet 9 (nothing of the earlier run used): not checkable from the diff; it rests on the builder's word.
  - Bullet 10 (hub not committed): no, verify 5 checks it.
  - "Complete": no requirement says what a deck must carry, except for failed projects (bullet 3) and manifest-only projects (C5). Decision 3's "question, method, result and state" is used only to decide when two slides are needed, never required of every deck. A one-line deck meets every requirement except bullet 2.
- Part 2:
  - slide.css: no for the values. C8 reads the arithmetic and the look measures it.
  - Facts.svelte: no for the sizes. "The dot, the gaps and the rule keep their proportions" passes trivially, because they are all in `em` already.
  - The docs/decks.md sentence: no case, and it is a rule clash (F4.5).

Findings:
- F5.1: no requirement states what a complete deck holds (for example the project's question, method, main result with its numbers, and state). Decision 3 names these four only as the reason for a second slide.
- F5.2: C3 and Part 1, bullet 5 can pass without any title being written (F3.3).
- F5.3: C9 passes by reading while describing a behaviour the strip does not have.
- F5.4: C10 passes whatever the step does.
- F5.5: bullets 6 and 7 have no builder-side check. The deck reader's findings, other than "too tall", can be printed without a browser (F2.1).

## 6. Implied inputs

For the code part (slide.css and Facts.svelte):
- Another theme (light, other dark themes): `grep -rn 'slide-' src/lib/themes --include='*.css'` finds no theme besides rice that sets slide sizes. Expected: 12 px and 10 px. Not under Cases (C8 names Dark Modern and rice only); costs nothing to miss.
- Rice: under Cases (C8): 11 px and 9 px.
- The text size setting (`--text-scale`; tokens.css:154, and the print route sets it at print/+page.svelte:142): missing. Expected: 12 x s and 10 x s px. A label at 10 px under a small text size gets hard to read.
- The fit factor: under Cases as C9, with the wrong expected result. Expected: the strip stays at 12 px and 10 px at every fit factor (F4.1).
- The Overview tiles (Overview.svelte draws Slide inside a scaled frame): missing. Expected: the same sizes in frame px, scaled with the tile.
- The presenter screen (Presenter.svelte:14, :37): missing. Expected: the same sizes.
- The audience window: missing. Expected: the same sizes, since it uses the same Stage `.slide-frame` (Stage.svelte:87).
- The print route (print/+page.svelte:186 `class="slide-frame page"`, :192 `<Slide ...>`): missing. Expected: 12 px and 10 px at print scale 1 in the PDF.
- The Project facts toggle off: under Cases (C10), but C10 checks the unchanged rule instead of the room kept at the new size.
- The room above the strip (Slide.svelte `.strip { padding-top: 1.2em }`, at the body size, 28.8 px, outside the write list): missing. Expected: unchanged.
- The hued value's dot: missing as a case. It is 0.5em of the value size, so 6 px at the design size, where it is 9 px now (Facts.svelte:155-156, :161). Part 2 asks only that its proportion be kept.

Findings:
- F6.1: the text size setting, the Overview tiles, the presenter screen, the audience window and the print route are not listed under Cases. Each should be expected at 12 px and 10 px (times the text scale), since they all draw through `.slide-frame` and Slide.svelte.
- F6.2: the fit factor's expected result is wrong (F4.1).
- F6.3: the dot's new 6 px size at the design size is not named, though it is a visible change.

## 7. ADRs

- `ls docs/adr` printed "No such file or directory", and `git ls-files | grep -i -E '(^|/)adr'` printed nothing. No record.

Findings: none

## 8. Dictated text

- `grep -n 'Everything in the brief is done' .scratch/migration/agents/briefs/O151.md` finds `216:- The first line: anything NOT done, or "Everything in the brief is done".` This dictates the first line of `.scratch/migration/agents/reviews/O151-report.md`. It holds: it is spec.md's own wording, in ASCII, with no history and no dash.
- Part 2's docs/decks.md sentence (`grep -n 'one sentence that the strip' ...` finds line 44) says what the sentence must say without giving its words, so it is not dictated. The comment requirements at lines 42-43 ("The file's comments say what the two sizes are for", "The head comment ... is written true of the new sizes") are not dictated either. No slide text is dictated.

Findings: none

## Declined to judge

- Whether one builder session can read the sources in full and write 95 decks. Concatenating each research project's `project.yml`, `README.md` and `CLAUDE.md` gives 1147210 bytes, and the 24 `manuscript/main.tex` files give 1209111 bytes before the files they input (`wc -c` over the concatenation). My judgment is that this is well past one context at about 4 bytes per token, and the brief gives no order of work (one project read and written at a time, for example). The orchestrator should judge whether the step must say so.
- Whether ruling "Facts strip smaller" ("through a slide size of its own") means one size, with the label as a fraction of it, or two sizes as the brief requires. The brief takes two without listing this under its Decisions.
- What the deck should do with image files an earlier deck holds that no reworked slide names (for example raw-pls's 8 PNGs), and whether a figure may be named from the project's own folders through `../`. The resolver allows any path inside the hub root (src/lib/data/sources/deck/files.ts:45-70). The brief says neither.

Agent usage: a0873d85c57d2e9b4, claude-opus-5-5, 156336 tokens, 48 tool uses, 6.6 min.

## Closed

Each finding is closed by a change to the brief.

- F1.1: "What to build", Part 2, the Facts.svelte bullet names the script head comment (`:23-25`) beside the style head comment (`:152-156`); "What is on the tree" quotes both.
- F1.2: Part 2, the slide.css bullet requires the rice comment at `:59-62` to list the two new cases.
- F2.1: Part 1 requires every deck to raise no finding of the deck reader, with the report listing each deck's kinds, keys and figure paths; new case C12 checks it by reading and at the look. No program is written for it: the brief allows no script the user has not approved, and the orchestrator's look draws every deck (Decision 4).
- F3.1: the ranges read `:219-225` and `:152-156`, and `.facts` reads `:157-167`.
- F3.2: "What is on the tree" states the fit rule (`FIT_LEAST`, the factor range, the reading column, the design sizes), and Part 1's fit bullet uses those measures; Read item 4 sends the builder to `Slide.svelte:1-45` and `slide-layout.ts:29`.
- F3.3: "What is on the tree" states the title rule as `docs/decks.md:142, 158` and `kinds.ts:381-393` give it; Part 1's title bullet follows it, writes no `title:` on an idea slide of a project's deck, and asks a project slide for its own title where the short name alone would not name the slide.
- F4.1: C9 now expects the strip to stay at 12 px and 10 px at the fit factors 0.75 and 1.25, measured at the look.
- F4.2: C10 now checks the strip's sizes at the text size 1.25.
- F4.3: C5 names `title`, `eli5`, `outcome` and `results` where present, and reads five decks, two with `results`; Part 1 names the same fields.
- F4.4: Read item 5 (the hub's `CLAUDE.md`) is removed; Conventions keeps the character rules.
- F4.5: the docs/decks.md sentence and its line in "Paths this step writes" are removed; Part 2 says docs/decks.md is not changed and why, and verify 2 no longer reads it.
- F4.6: "What is on the tree" quotes the ruling "O150 and O151 undone" and the step's line as the authority for the builder's writes in the hub's 95 `present/` folders; Part 1's last bullet points to it. The ruling is the user's and names this step's writes, so it is no clash with the rules file's general ban.
- F4.7: the deck loop is written out with `sort | uniq -c` in "What is on the tree", and C1 and verify 4 use it.
- F4.8: Decision 2 ranks the README and the manifest (the manifest for stage, status and venue; the README for numbers and framing), and C6 checks both kinds of difference and reads three projects for a difference the report leaves out.
- F5.1: Part 1 requires every deck to state the project's question, method, main result with its numbers and state, as far as its files hold each.
- F5.2: as F3.3; C3 has the report give each slide's drawn title and its source.
- F5.3: as F4.1.
- F5.4: as F4.2.
- F5.5: as F2.1 and F3.2.
- F6.1: C10 covers the text size; C11 covers the pane, the Overview's tiles, the presenter screen and the print route.
- F6.2: as F4.1.
- F6.3: Part 2 and C8 name the dot at 6 px.
- Declined, the context: Part 1's first bullet sets the order of work, one project read and written at a time.
- Declined, one size or two: Decision 5 takes two sizes and says why.
- Declined, figures: Decision 6 and a Part 1 bullet let a deck name a figure from the project's own folders and remove a file in `present/` that no slide names.
