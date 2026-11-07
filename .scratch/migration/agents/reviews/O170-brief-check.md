# Step O170 brief check (on main at 195d655fa)

The fresh agent's report on `agents/briefs/O170.md` for the `spec` skill's "Steps / The brief check". Pages are cited by section. Code lines and grep hits are cited as `file:line`. Every command ran from `/Users/axelfaes/workspace/oculus`. Main's head is 195d655fa (`git log --oneline -5`). `git diff --stat 56a1fff1e 195d655fa -- src config docs` prints nothing, so O167's line numbers apply to this tree as well.

The weightiest findings:

- **The Present toolbar has no `more` button.** The toolbar wraps onto further lines, so the `more` clause of item 5 and of C7 refers to nothing (3.13).
- **Line ranges on two shared files are wrong.**
  - The builder of O167 already writes `Bar.svelte` well inside the range O170 claims.
  - O167's path list takes the whole of `Presenter.svelte`, while this brief says O167 writes line 85 only.
  - `agents/briefs/O168.md` does not exist (3.17, 3.18).
- **Item 7 breaks the rules file.** It has the builder rewrite `docs/HELP.md` and `docs/decks.md` (4.1).
- **Verify items 4 and 6 cannot run as written** (4.2, 4.3).
- **Item 3 needs lines outside the path list.** `Literature.svelte:227` is outside it, a new text key would land outside it, and the Enter key in the Search box bypasses the disabled Search button (1.5, 5, 9).

## 1. Names

1.1 `copied_citation_js`, `citation_js`, `citation-js` and `copiedWords`.
- Command: `git grep -n "copied_citation_js\|copiedWords\|citation-js\|citation_js" -- ':!config/local.yml' ':!.scratch'`.
- Hits outside the paths:
  - `src/lib/views/feeds/literature/LiteratureCard.svelte:23` and `:147`, `import { copiedWords, ... }` and `onsaid(copiedWords(entry))`. These stay true, because the function keeps its name.
  - `src/lib/views/shared/card/feed/literature-card.ts:16,29,35`, a separate local `copiedWords` of the Literature collection. It reads `bibtex_copied*`, not the renamed key, so it stays true.
  - `src/lib/state/feeds/literature/bibtex.ts:6,10,15,25,33,75,78,79,96,156`. These are code comments and the `from` value `citation_js`, which item 1 keeps. They stay true.
  - `package.json:63-64` and `package-lock.json`: the dependency, which is unchanged.
- No test or doc names the key.
- `git grep -n "copied_" -- config src tests docs` also shows `literature.yml:18-19`, `copied_doi` and `copied_from`. Renamed in place at line 17, `copied_fields` would sort before `copied_doi`. The file is otherwise in key order, and line 18 is outside the path list. No order check was found (`git grep -n -i "sorted\|alphabet\|in order" -- tests/checks` gives no catalog hit), so this is cosmetic.

1.2 The export keys: `export_opened`, `export_blocked`, `export_busy`, `export_done`, `export_running`, `export_tip` and `export_too_large`.
- Command: `git grep -n "export_opened\|export_blocked\|export_busy\|export_done\|export_running\|export_tip\|export_too_large\|present\.export\b" -- ':!config/local.yml' ':!.scratch'`.
- Hits outside the paths:
  - `src/lib/views/academic/present/acts/acts.svelte.ts:119` and `utils/diagrams/palette.mjs:144`, which read `present.export`, the label. Unchanged, so they stay true.
  - `config/text/views/sessions/session-list.yml:20` and `session-list.ts:116`, `sessions.export_tip`, a different group. Not affected.
- The second grep, `git grep -n -i "print dialog\|new tab\|pop-up\|already in progress" -- docs src tests README.md config`, gives:
  - `docs/HELP.md:470`, "In a browser, Export to PDF opens the print dialog." It stays true.
  - `src/routes/present/print/+page.svelte:32`, which stays true.

1.3 The Project facts chip.
- Command: `git grep -n -i "project facts" -- docs src tests README.md config utils`.
- Made false, outside the paths: `src/lib/views/academic/present/Present.svelte:72-74`. The head comment reads "The toolbar's Project facts toggle, drawn while the slide on screen carries a project, shows or hides its words". Item 5 draws the chip on every slide, disabled when the slide has no project, so this sentence becomes false. `Present.svelte` is not in O170's paths, and O167 writes it whole.
- Stays true: `docs/decks.md:362`, "The Project facts toggle in the toolbar hides or shows the strip's words."
- The other hits (`present.svelte.ts`, `present.ts`, `export.ts`, `Slide.svelte`, `Facts.svelte`, the print and show routes) describe the toggle's value, not its presence, and stay true.

1.4 The `sources` handed to Head.
- Command: `grep -n "sources\|SourceInfo" src/lib/views/feeds/literature/LiteratureCard.svelte src/lib/views/feeds/literature/words.ts src/lib/state/feeds/literature/bibtex.ts`.
- `LiteratureCard.svelte:44-45` says "The sources the server lists". `Literature.svelte:251` passes it the same `sources`. This stays true only if `sources` keeps the `SourceInfo[]` shape: a card exists only after a search, and a search follows the answer.
- `src/lib/state/feeds/literature/lookup.ts:18-22,124-126` imports `SOURCES_URL`, `sourceList`, `parseForm` and `sourceOn` from the two state files O170 writes (`git grep -n "sourceList\|SOURCES_URL\|sourcesOn\|sourceOn\b\|parseForm" -- tests src`). A change to their signatures breaks `lookup.ts`, which is outside the paths.
- Made false, outside the paths: `src/lib/state/feeds/literature/run.svelte.ts:10-12`, "a tab drawn again runs its held query once more, which the server's cache answers within `cache_min`". Item 2 makes it false, and the file is not in the paths.

1.5 The Search control.
- Command: `git grep -n "literature\.search\b\|literature\.no_sources\|literature\.idle\|literature\.none_on" -- src tests config docs utils`.
- The hits are all in `Literature.svelte`, at `:181`, `:228`, `:230` and `:232`.
- `:228`, the no-source line, sits under the condition at `:227`, `{#if listed !== null && listed.length === 0}`. That line is outside the path range `Literature.svelte lines 1-200`.
- `:178`, `onenter={go}` on the Search box, is a second way to start a search. It is not named in the brief.

Findings:
- `Present.svelte:72-74` (1.3) and `run.svelte.ts:10-12` (1.4) become false and are outside the paths.
- `lookup.ts` depends on exports the step may change (1.4).
- `Literature.svelte:227` is needed by item 3 and is outside `lines 1-200` (1.5).

## 2. The step line

The step line is `plan.md:1728`, found with `grep -n '^- O170' plan.md`.
- "the BibTeX line names no library ("built by citation-js")": item 1.
- "a page reload sends no Literature search by itself": item 2.
- "the source buttons are drawn from the first paint": item 3.
- "the export line fits its toolbar and goes once the print tab has opened": item 4.
- "the presenter screen draws the current slide at least as large as the next": item 6.
- "the Present toolbar keeps its buttons in one order whether or not a deck is presenting": item 5.
- "(ruling Look flaws)", at `plan.md:3649`: the ruling books flaws only. It says nothing about the guides.

Item 7 (rewriting `docs/HELP.md` and `docs/decks.md`) answers no part of the step line. The plan has no `## Goal` heading (`grep -n '^## ' plan.md` prints Steps, Could run in parallel, Rulings, Agents, Blocked); its opening paragraph names `tools/oculus/DESIGN.md` as the goal.

Findings: no part of the step line lacks a requirement. Item 7 goes beyond the line and breaks a rule (4.1).

## 3. Premises

3.1 `plan.md:1728` and `plan.md:3649`: `grep -n '^- O170' plan.md` gives 1728, and `grep -n 'Look flaws' plan.md` gives 3649. Matches.

3.2 `literature.yml:17`: `sed -n 10,25p` prints `copied_citation_js: BibTeX copied, built by citation-js because no source served one`. Matches.

3.3 `words.ts:104-109`: the doc comment and `copiedWords`, with `:107` returning `t('literature.copied_citation_js')`. Matches.

3.4 `bibtex.ts:25, 33`: line 25 is the doc comment naming `citation_js`, and line 33 is `const FORMATTED: EntrySource = { from: 'citation_js' };`. Matches.

3.5 `Literature.svelte:156-163`: the `onMount` that awaits `routeBody(SOURCES_URL, ...)` and runs `go()` when `form.q.trim() !== '' && sources.length > 0`. The head comment at `:25-27` says "a tab drawn again with a query held asks it once more". Matches.

3.6 `answers.ts:153`: `export const SOURCES_URL = ...?sources`. Matches.

3.7 `Head.svelte:47-48` draws the group and `{#each sources as source (source.id)}`. `Literature.svelte:120-122` holds `listed`, null until the answer, and `sources = listed ?? []`. Matches.

3.8 `read.ts:47-52` (`literatureRows`) and `Literature.svelte:118` (`timeoutSeconds(config()?.config ?? {})`). Matches. The server builds its list from the same reader: `src/routes/api/(docs)/literature/+server.ts:22` passes `rows: literatureRows(config)`, and `handler.ts:216` maps `sourceInfo` over the rows.

3.9 `model-search.ts:219-233` (`SourceInfo`) and `handler.ts:67-81` (`sourceInfo`). Matches.

3.10 `export.ts:188-209` holds `exportTab`, with its doc comment at 181-188. `present.yml:52` holds `export_opened` with the words quoted in the brief. `Bar.svelte:112` is `<span class="said" role="status">`, with its style at `:126-134` (`flex: 1 1 0; ... text-overflow: ellipsis`). `present.yml:49-55` holds the seven export lines. Matches.

3.11 Presenter: `.current` is at `:176-181` (`flex: 3 1 320px`), `.side` at `:183-190`, `.next` at `:192` and `.preview` at `:198`. Matches.

3.12 "Each slide is drawn by `screen/Framed.svelte`, which scales the frame into its box". This differs from the tree:
- `Framed.svelte:49-51` only hands the slide to `Stage`.
- The scaling is in `src/lib/views/academic/present/screen/Stage.svelte:46-48`: `const scale = $derived(fit(width, height, frame))`, with the room measured at `:80` and the transform at `:83-95`.
- `Stage.svelte` is neither in the paths nor in the read list.

3.13 "in the pane header's toolbar (`Toolbar.svelte`, which in a pane header draws the controls the line has room for and puts the rest behind a `more` button, `fit.ts`)". The tree contradicts this:
- `Bar.svelte:72` is `<Toolbar label={t('present.toolbar')}>`, with no `overflow`.
- `Present.svelte:357` is `<Pane title={t('present.title')} {bar}>`. The toolbar goes in the bar slot, the pane's `.viewbar`, not in the header's `toolbar` slot.
- `Toolbar.svelte:3-4` says "Left to itself it wraps onto further lines". Its CSS `.toolbar { flex-wrap: wrap }` applies, and only `.toolbar.overflow` stops the wrap.
- The `more` button is drawn only under `{#if overflow && shown !== null}`.
- O167's brief, item 17, describes the same bar as "wrapped over several rows".
- So the Present toolbar has no `more` button. Its controls wrap onto further lines.

3.14 `Bar.svelte:71-114` and `:82-89`: the Toolbar runs from 72 to 114, and the facts `{#if}` is at 82-89. `facts` comes from `Present.svelte:335`. Matches.

3.15 "this step writes [Bar.svelte] lines 1-112 and the style block (`:115-142`)". This differs: lines 115-122 are the `{#if filter !== null}<BoardBar .../>` markup, and the style block is 124-142.

3.16 "this step writes [Presenter.svelte's] style block (`:140-246`)". This differs: lines 140-142 close the markup, and the style block is 143-246.

3.17 The lines O167 writes in shared files, compared with `agents/briefs/O167.md`:
- `present.yml` lines 25 and 58-76: the brief's path list at `O167.md:96`. Matches.
- `Bar.svelte` line 113: `O167.md:137`. This matches the path list, but O167's own item 19 (the counter draws nothing while a deck loads) needs the type of the `count` prop and the disabled states.
  - O167's worktree already has hunks well inside O170's range: `diff -u src/lib/views/academic/present/Bar.svelte .agents/worktrees/migration-O167/src/lib/views/academic/present/Bar.svelte` prints hunks `@@ -3,10`, `@@ -24,8`, `@@ -67,12`, `@@ -93,7` and `@@ -101,16`. They are the head comment, `count: number | null`, `const slideless`, and `disabled={slideless}` at `:74-75` and `:96`.
  - So the "separate lines, hand merge" premise does not hold for `Bar.svelte`.
- `Presenter.svelte` "the counter at :85": `O167.md:138` lists `src/lib/views/academic/present/presenter/Presenter.svelte` whole. This differs from the brief, which describes O167 as writing only line 85. The worktree has not changed it yet (`diff -u` prints nothing).
- O167 also writes, whole:
  - `Present.svelte`. Its worktree adds `--viewbar-max="33.33%"` on the Present pane and `counted`.
  - `src/lib/ui/frame/Pane.svelte`, the `.viewbar` that holds the Present toolbar.
  - `src/lib/ui/controls/ToolButton.svelte`.

  All three bear on item 5, the toolbar's wrapping and the widths of its controls. The brief does not name them.

3.18 O168: `ls .scratch/migration/agents/briefs/` lists `O167-cases.md`, `O167.md` and `O170.md`, and `find .scratch .agents -name 'O168*'` finds only `agents/reviews/O168-brief-check.md`. The O168 brief does not exist on disk, so the lines claimed for O168 (`literature.yml` 15-16, 21-22 and 100, `present.yml` 37, `Literature.svelte` 242-243) cannot be checked against it. Two leads, not verified:
- The state file's open item 716 (`orchestrator-state.md:211`) has O168 turn every `_one` pair into a YAML map. That reshapes the lines around `literature.yml:17`.
- `present.yml:37` is `drop_one: Drop one image at a time.`, which is not a plural pair.

3.19 O169 and O151: `git show HEAD:.scratch/migration/agents/briefs/O169.md` and `O151.md`, each read for its path section. Neither names a file of O170. Matches.

3.20 `ls docs/adr` prints "No such file or directory". Matches.

3.21 `grep -n 'answers.ts\|form.ts\|words.ts\|bibtex.ts\|Literature.svelte\|Head.svelte\|export.ts\|Bar.svelte\|Presenter.svelte\|Framed.svelte\|feeds/literature\|present/' agents/guarded.md` returns only G-entries for `merge.ts`, `writes/`, deck writers and the config readers. None is a file O170 writes. Matches.

3.22 Brief line 5 reads "Then, in full: `.scratch/migration/agents/spec.md` is the one standards page the configuration lists". The sentence is garbled: "in full:" is followed by a statement, not by a list of files. `.agents/plan.yaml:6,11` give `standards: [.scratch/migration/agents/spec.md]`, which matches the fact.

Findings:
- 3.12: the scaling is in `Stage.svelte`, not `Framed.svelte`.
- 3.13: the Present toolbar wraps, and there is no `more` button.
- 3.15 and 3.16: the style blocks start at `Bar.svelte:124` and `Presenter.svelte:143`.
- 3.17:
  - O167 writes `Presenter.svelte` whole by its path list.
  - O167's item 19 and its worktree write `Bar.svelte` at 3-10, 24-28, 67-75 and 93-116, so the shared-line merge is not line-disjoint.
  - O167 also writes `Present.svelte`, `Pane.svelte` and `ToolButton.svelte`, which bear on item 5.
- 3.18: `agents/briefs/O168.md` is missing.
- 3.22: brief line 5 is garbled.

## 4. Cases and checks

4.1 Item 7 has the builder rewrite every sentence of `docs/HELP.md` and `docs/decks.md` that the step makes false, and the path list contains both files. The rules file, `agents/spec.md` "What every package obeys", in the bullet on changing a name or what code does, says: "No step adds to or rewrites `docs/HELP.md`, `docs/data-map.md` or `docs/decks.md`, except the step whose brief is to write them and a line Axel ruled into a step's brief". O170's line is not that step, and no ruling of Axel's adds those lines. This is inconsistent. The rules file's form is to name each sentence with its file and line in the report.

4.2 Verify 6 is `git grep -n "copied_citation_js"`. `agents/spec.md` "Where you work" allows a builder `git status`, `git diff` and `git show` only. This is inconsistent; a plain `grep -rn` over `src tests config docs` does the same job.

4.3 Verify 4 is `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O170.md .agents/worktrees/O170-base`. The script takes a commit: `utils/outside-paths.mjs:150-172` runs `git rev-parse --verify --quiet ${base}^{commit}` and refuses with "git does not know the base". A folder path is not a commit, so the check exits 2 and never reports. The base copy `.agents/worktrees/O170-base` does not exist yet (`ls` prints no such file), which is expected before the worktree is made.

4.4 C7 asks that "the `more` button holds the same controls at each width in both states". No such button exists (3.13). The case checks a mechanism the toolbar does not have.

4.5 C9 asks that the desktop app's export say its lines as today. Item 4 asks that the busy-export line (`export_running`) be short enough for 600 px. `export.ts:227` says `export_running` on the desktop path too. The two are inconsistent if `export_running` is shortened. Item 4 also names "a refused export" line, but no export line of that name exists in the browser path (`export.ts:189-209` has only `export_blocked` and `export_running`). Which key is meant is not said.

4.6 The read list (rules file, "Read first", item 2: the builder reads only the files the brief lists) leaves out files the items need:
- `src/lib/ui/frame/Pane.svelte`, the `.viewbar` the toolbar wraps in, for item 5 and C7.
- `src/lib/ui/controls/Chip.svelte` and `ToolButton.svelte`, for "no control changes its width with its pressed state".
- `screen/Stage.svelte`, the scaling, for item 6.
- `src/lib/state/feeds/literature/run.svelte.ts`, whose head comment item 2 makes false.
- `lookup.ts`, which imports from `form.ts` and `answers.ts`.

4.7 The other cases (C1 to C3, C5, C6, C8) hold. Each is checked by a case-run program, by reading or at the look, as `agents/spec.md` "What every package obeys" allows. None asks for a test. None asks the builder to check a place the step does not change. Item 5's "name every cause with its file and line" may point at `Toolbar.svelte` or the primitives. That serves the fix and is allowed.

Findings: 4.1, 4.2, 4.3, 4.4, 4.5 and 4.6.

## 5. The question

"Could this pass without the goal being reached?" The goal is the five flaws of the step line, ended.

- **C1: no.** It prints the line for every `from`, and reading it shows whether a library is named.
- **C2: partly yes.**
  - It covers a page reload only. A "layout restored" or a "tab shown again" is in item 2 but in no case.
  - `run.svelte.ts:10-12` can stay false while C2 passes.
- **C3: yes, trivially.** It already holds on the unchanged tree: `run.svelte.ts:199-200` returns when nothing was asked. It guards against a regression and proves nothing of the change.
- **C4: yes.** Search is "off" by the button's `disabled`, but `Literature.svelte:178` `onenter={go}` still sends a search on Enter. That search would go to sources whose availability is not known, which the case says must not happen.
- **C5: yes.** It reads a hub with no rows. A hub with rows, while the config is still null, would compute `literatureRows({})` as `[]` and draw the no-source line falsely. C5 does not catch that.
- **C6: yes.** "A short line while it opens, nothing after" names no event for "opened". `deps.openTab` returns the window handle synchronously (`export.ts:191`), so a line said and cleared in the same press passes, and the reader sees no line at all. The brief should name the signal that ends the line, for example `print.answered` (the print page's `keep-asked` answered) or `EXPORT_HOLD_MS`.
- **C7: yes.**
  - The `more` clause is vacuous (3.13).
  - The case is checked at text size 1 under the default theme only.
  - The order could still change at text size 1.5, under a rice theme with brackets, or while a deck loads, when O167's counter goes away and the wrap point moves.
- **C8: yes.** Three pane sizes with the default 1280 by 720 frame. A portrait frame is allowed (`docs/decks.md:92`: width 320 to 3840, height 240 to 2160), and so is text size 1.5, where the meters at `--fs-xl` take height. Either could leave the current slide smaller while C8 passes.
- **C9: no**, apart from the `export_running` conflict (4.5).
- **The step line's check (the look on landing): yes, as far as it is built from C7.** C7's `more` clause checks nothing.
- **Item 1: no.**
- **Item 2: yes for the comment.** It makes `Literature.svelte`'s head comment true, but `run.svelte.ts:10-12`, outside the paths, stays false.
- **Item 3: yes.**
  - The Enter bypass.
  - A `?sources` request that fails leaves Search off for good, with no line saying why: `routeBody` returns undefined and `sourceList` returns null.
  - The pressed state and the pressability of a toggle before the answer are not stated, so a toggle can flip when the answer lands.
- **Item 4: yes.** The same vacuous clear as C6. "Fits without an ellipsis at 600 px" depends on the room `.said` gets (`flex: 1 1 0` in a wrapping bar, `Bar.svelte:126-134`), not on the words alone. A short sentence can still be cut unless the style changes.
- **Item 5: yes.** Its third clause is about a button that does not exist. `Present.svelte:72-74` stays false.
- **Item 6: yes.** "Current at least as wide as next" is met by shrinking the next slide (capping `.side`) while the current slide stays as small as the look saw. The goal is a large current slide. Stating that the current slide fills the height its box has, or that the next slide keeps its present size where the two stand side by side, would close this.
- **Item 7: not applicable.** It breaks a rule (4.1).

Findings: C2, C4, C5, C6, C7, C8, the step-line check, and items 2 to 6, as above.

## 6. Implied inputs

This is a code step. Each implied input below is missing from "Cases" unless it says otherwise.

- **A Literature tab opened fresh with no saved query.** Missing. Expected: the toggles drawn from the config, Search off until the answer, the idle line, and no request but `?sources`. Low cost.
- **A config that answers after the view mounts** (`config()` null at the first paint). Missing. Expected: neither toggles nor the no-source line until the config is held. A false "No literature source is configured" would cost a misleading line. The browser seeds the config at page load (`src/routes/+page.server.ts:29-31`). The desktop app and a float window are not verified.
- **A `?sources` list that fails to answer** (a network failure, a refused token, a server restart). Missing. Expected: a line saying the list could not be read, which needs a new catalog key outside `literature.yml:17`, and Search off, or a retry. Without it the view can never search and says nothing. This costs the whole view.
- **Enter in the Search box before the answer.** Missing. Expected: no search sent.
- **A toggle pressed before the answer.** Missing. Expected: a stated pressed state and pressability before the answer, and no flip when an available source's answer lands.
- **A config push that changes `literature.sources` after mount.** Missing. Expected: the new row takes the server's facts (`?sources` asked again), or is drawn as unknown, without Search going off for good. Config edits from Settings are pushed live (`+page.server.ts:19`).
- **A config row the server's list lacks, or the reverse.** Missing. Expected: a stated rule for which list wins.
- **A deck that loads while presenting, or a switch of deck.** Missing from C7. O167 makes the counter draw nothing while a deck loads, which changes a width in a wrapping bar. Expected: every control keeps its place.
- **The desktop app path.**
  - Export is covered by C9.
  - The reload of item 2 (Cmd+R in the app, `docs/HELP.md:572`) and the toolbar order run the same code. No case is needed beyond C2 and C7.
- **Themes and text size 1.5.** Missing from C6, C7 and C8.
  - Expected: the toolbar order holds at text size 1.5 and under a rice theme with brackets (`ToolButton.svelte:470-500` adds `[` `]` to every non-bare button).
  - The export line is either stated to fit or stated to wrap at 1.5.
  - The presenter's current slide is at least as large as the next at 1.5.
- **A portrait deck frame on the presenter screen.** Missing. Expected: current slide at least as wide as the next.
- **The last slide on the presenter screen** (`next === null`, "End of the deck."). Missing. Expected: the current slide keeps the room it has. Low cost.

Findings: every item above marked missing, the costly ones first: the failed `?sources`, the Enter bypass, the config null at the first paint, the config push, the deck loading, text size 1.5 and the rice theme for C7, and the portrait frame for C8.

## 7. ADRs

`ls /Users/axelfaes/workspace/oculus/docs/adr` prints "No such file or directory". No record.

Findings: none.

## 8. Dictated text

The brief quotes no words to be written into a file. It quotes existing catalog lines only as evidence, at brief lines 12 and 15. Item 1 describes the meaning of the new BibTeX line without quoting it. Item 4 asks for "one short line", and item 5 for "a tip that says why", without words.

The one dictated token is the key name `copied_fields`, at brief lines 27 and 79 (`grep -n 'copied_fields' .scratch/migration/agents/briefs/O170.md`). It holds: it is ASCII and snake_case like its sibling keys, and it names what the line says. The only point against it is the key order, which is cosmetic (1.1).

`LC_ALL=C grep -n '[^ -~]'` over the brief prints nothing.

Findings: none.

## 9. Files outside the path list

- `Literature.svelte:227`, the no-source condition. Item 3 says that line is drawn "from the config alone", and `:227` is outside `lines 1-200`. The brief also says, inconsistently, "this step writes ... Literature.svelte lines 17-163".
- `config/text/views/academic/present.yml` near lines 95-96 (`facts`, `facts_tip`). Item 5's tip on the disabled chip needs a new key, and the path list allows only lines 49-55. Those lines are free of O167 (25, 58-76) and O168 (37). A line saying the source list failed (section 6) would need a key in `literature.yml` outside line 17.
- `src/lib/views/academic/present/Present.svelte:72-74`, the head comment made false (1.3). O167 writes this file whole.
  - The chip itself needs no `Present.svelte` change: `Bar.svelte:82-89` can draw it disabled when `facts === null`.
- `src/lib/state/feeds/literature/run.svelte.ts:10-12`, the head comment made false (1.4).
- `src/lib/state/feeds/literature/lookup.ts:18-22,124-126`, if `sourceOn`, `sourceList` or `SOURCES_URL` change shape.
- `LiteratureCard.svelte:44-45`, if `sources` stops being `SourceInfo[]`.
- These files are not needed:
  - The server's literature handler: the config rows are on the page (`+server.ts:22` and the page config read the same reader).
  - The Toolbar primitive: the Present bar does not use `overflow`, and `overflow` measures against a `[data-toolbar-room]` span that only the pane header lays out (`Pane.svelte`, `<span class="room" data-toolbar-room>` inside the header's `.tools`), so it cannot be switched on in the bar.
- `Chip.svelte` and `ToolButton.svelte` show no width change with the pressed state by reading:
  - `ToolButton.svelte:434-438` and `.tool.active` change colours only.
  - `Chip.svelte:242-246` and `.chip.filled` change colours and the border colour only.

  If the builder finds a cause there, `ToolButton.svelte` is O167's file.
- `screen/Stage.svelte` is probably not needed: item 6 can be met in `Presenter.svelte`'s CSS. The read list should still include it (4.6).

Findings: `Literature.svelte:227`, a `present.yml` line near 95-96, `Present.svelte:72-74` and `run.svelte.ts:10-12` are needed and outside the paths. `lookup.ts` and `LiteratureCard.svelte` are needed if the `sources` shape or the form exports change.

## Declined to judge

- **What the look saw for the toolbar reorder and the reload.** `agents/reviews/owed-looks.md:27` says the observations are "in the session notes", which are not in the tree. The brief's account of the look could not be checked.
- **Whether O168's line claims hold.** Its brief is not on disk (3.18).
- **Whether the page holds the config at the first paint in the desktop app and in a float window.** The browser's seed was read. The other two would take a run, and a builder or a checker starts no page.
- **Whether `npm run test:quick` and the other verify commands pass on the unchanged tree.** Not run: they are the builder's, after the worktree exists.

Agent usage: a62bf71210ab6cbbf, claude-opus-5-5, 225844 tokens, 66 tool uses, 9.8 min.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- <finding>: <the change to the brief, with its section>; or a stop, <the open item as the state file holds it>.
