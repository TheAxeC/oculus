# O149 report: the Decks guide

Everything in the brief is done. Five lines outside the write list were changed, each named in the file table with its reason; the look for C5 (the tab opening `docs/decks.md` with its contents list) and C13 (the hover in the YAML editor) is the orchestrator's, since a builder runs no page.

## Open items of the state file, verbatim

Copied from `.scratch/migration/orchestrator-state.md`, section "## Open items", as printed by `awk '/^## Open items/{f=1} f&&/^## /&&!/^## Open items/{exit} f' .scratch/migration/orchestrator-state.md`:

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Open item 689 (2026-11-06, O150's brief check): `deck/engine.md:12` in the research hub reads "Each of the next slides leads with the governing equation, then specs, method, and results." With O150's one group, the next slides are all 25 research decks, of which nine are `kind: idea` and two `kind: text`, with no equation, so the sentence becomes false; O150's line rewrites `deck/present.yml` only, and a change to the hub's own words outside it is yours. (a) Reword it in the same hub commit to "The slides that follow are every research project's deck, in folder order; a project slide leads with its governing equation, then specs, method, and results.": the slide stays true of the whole run. (b) Delete the sentence: true, but the section slide loses its pointer to what follows. (c) Keep it as written: the lazy option, a false sentence on the deck's second slide. Recommendation (a). O150 is built with the sentence as it stands, and the hub commit, which waits on your word anyway, carries (a) or (b) when you rule.

- Open item 690 (2026-11-06, O150's review, a rule clash): rulings 678 (a) and 685 (a) put every research project's deck in the portfolio deck, the failed and stopped ones included, and O150 does so; the deck's own rule line, `deck/present.yml:1` in the hub, says the deck is "a public artifact" with "never a null or negative result". Today one deck is affected, `projects/archive/failed/fed-faithful-ecg` (stage `failed`), now the first project slide; its slide (`present/main.md`, `kind: text`, no status chip) reads "In progress: real-hospital replication" and "Next: ... Open to clinical and federated-learning collaborators", which is false of a failed project. (a) Leave the failed and stopped projects out of the portfolio deck: the group's `find:` gains `stages:` listing every stage of the vocabulary but `failed` and `stopped`; their decks stay whole and open on their own in the Present view, and the public deck holds no negative result; it narrows 678's "every research project's deck" to the live and finished ones. (b) Keep them, as 678 and 685 say: the rule line drops "never a null or negative result", and the fed-faithful-ecg slide is rewritten to its failed state (by O151, which writes the failed and stopped decks like every other); the public deck then shows a NO-GO project. (c) Keep both as they are: the lazy option, a deck that breaks its own rule with a false slide. Recommendation (a), since the deck is presented in public talks and your rule against a negative result in public output is absolute. O150's hub commit, which waits on your word, carries (a) or (b)'s rule line when you rule.

- Open item 691 (2026-11-06, O150's review over round 1): O150 drops the portfolio deck's two summary slides and its idea grid. Measured on the scratch server, a summary and a grid of all 25 research decks are both Too tall in the 1280 by 720 frame; with the filter bar on Stage `submitted` (11 decks) the summary fits and the grid stays Too tall. So a summary would serve the filtered talk (ruling 676 has a summary count only what the filter keeps) and overflow the unfiltered one. (a) Keep the deck as built, no summary and no grid: no slide overflows, and a filtered talk has no at-a-glance table. (b) Add one `{ kind: summary, of: research }` before `closing.md`: the filtered talk gets its table, and the unfiltered deck draws one Too tall slide with its finding each time it is opened. (c) A new step in oculus that splits a summary over as many slides as its rows need, so it fits filtered and unfiltered, then (b): the option that ends the cause, at the cost of a step. (d) The lazy option is (a) without saying anything. Recommendation (c), with (a) standing until that step lands. O150's hub commit, which waits on your word, carries (a), or (b) when you choose it.

- Open item 692 (2026-11-06, O148's review over round 1, Behaviour 1 of `agents/reviews/O148-refuter.md`): the two readers of a deck check a project slide's domain differently. The snapshot build checks the manifest's raw `domain:` key against its own hub's domains (`src/lib/data/sources/documents/decks.ts:61-62`, `:83`); the deck route checks the domain as the merge resolved it, by its key, against its own hub's domains (`src/lib/server/content/deck/read.ts:77-78`, `:129`). So a domain no hub holds raises `domain_unknown` in the Findings view but not on the deck route, and a domain only a second hub holds raises a false `domain_unknown` on both, the slide drawing no Domain tag while its strip shows a Domain chip. Neither happens today: the workspace has one hub and every project's domain is a key of `.oculus/data/pillars/domains.yml`. The fix reaches both readers, the facts module and their tests, more than a fix at landing. (a) A step O154, built by a builder: both readers take the slide's domain as the merge resolves it, checked against every hub's domains, keeping the deck's `domain_unknown` finding, with test rows for a domain only a second hub holds and one no hub holds. (b) The same step, with the deck's `domain_unknown` finding removed: a manifest's unknown domain is already a finding of validate (`src/lib/data/snapshot/validate.ts:107`), so the deck finding repeats it, and a domain that resolves is drawn on both readers. (c) Leave it as it is: the lazy option, two readers that disagree on a workspace with a second hub. Recommendation (b): one cause, one finding, and the readers agree.

This step adds no open item.

## The cases' first run, on the unchanged tree

Each case was run or read on the tree at the base before any change. The outputs quoted below as "first run" were taken then; the scratch files named keep the ones that were saved.

- C1 (every key in the guide): read on the base. The guide did not exist, so every key was missing from it. The keys the code reads are listed in the C1 section below.
- C2 (every order entry and kind with an example): read on the base. No guide; `SlideKind` (`src/lib/data/model/model-deck.ts:65-77`) holds twelve kinds, `KINDS` (`src/lib/data/sources/deck/kinds.ts:77-88`) the ten front-matter ones, and `orderOf` (`spec.ts:176-211`) four entry shapes.
- C3 (each example read with no finding): not runnable on the base, since `docs/decks.md`, the file the script reads its examples from, did not exist.
- C4 (the guide agrees with `docs/HELP.md:331-348` and the code): read on the base. `docs/HELP.md:331-348` against `present.svelte.ts`, `read.ts`, `project-facts.ts` and the catalog: no disagreement in the filter, strip, toggle, `{{project.<field>}}` or the two findings. Line 56 left out the Data map and the Keyboard Shortcuts view from what the Help page holds, which item 4 fixes.
- C5 (fresh Help page, keys): run with the case program `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-cases/help-keys.mjs` (quoted in the C5 section). First run: the tabs were help, the three hub docs, keys, Apps guide, Templates, Data map, Palette; the record held the three hub paths only; the keys were help h1, keys h2, Apps guide h3, Templates h4, Data map h5, Palette h6, Research approach h7, Agent approach h8, HPC how-to h9.
- C6 (the links resolve to the engine document): same program. First run: `decks.md` from `docs/HELP.md` and from `docs/templates.md` both gave `{"kind":"engine","path":"docs/decks.md"}`, so the resolver already opened the guide; only the file and the links were missing.
- C7 (history check with the guide in place): `npx vitest run tests/checks/source/history.test.ts` on the base: the documents case passed and the comment case timed out at the 5 s limit (about 6.8 s), a timing of the machine at the time, before any file of this step existed.
- C8 to C12 and C14 to C17: the new test file run on the unchanged source, `npx vitest run tests/state/workbench/layout/saved/layout-given.test.ts`, saved whole in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-cases/given-base.txt`: `Tests  8 failed | 3 passed (11)`. The rows for C9, C12 and C16 passed, because each asks that nothing be given, which the base already does. Each failing row fails by its result at the `toEqual` line, never by an import. The failing lines, row by row:
  - C8 ("a saved Help page with no record of the Decks guide gains it after Palette, pinned"): docs lacked `- "engine:docs/apps.md"`, `- "engine:docs/templates.md"`, `- "engine:docs/data-map.md"`, `- "engine:docs/palette.md"`, `- "engine:docs/decks.md"`, and the pane lacked `- "doc:engine:docs/decks.md"` after `"doc:engine:docs/palette.md"`.
  - C8, second pane ("the guide goes into the pane that holds the tab before it"): the same five ids missing from docs, and `- "doc:engine:docs/decks.md"` missing from the second pane after `"doc:engine:docs/palette.md"`.
  - C10 ("a page that shows the guide with no record of it gets no second tab, and records it"): the five ids missing from docs.
  - C11 ("a page with no record is given every document it lacks, once, in order"): the five ids missing from docs, and the five guide tabs missing between `"keys"` and `"doc:docs/RESEARCH.md"`.
  - C14 ("with Palette closed the guide ends the pinned tabs of the first pane"): `- "engine:docs/decks.md"` missing from docs and `- "doc:engine:docs/decks.md"` missing before `"doc:docs/NOTES.md (unpinned)"`.
  - C15 ("an engine tab with an empty id is given to no page, and a repeated one once"): `- "docs": [ "engine:docs/apps.md" ]` and `- "doc:engine:docs/apps.md"` missing.
  - C17 fresh ("a fresh Help page records its guides, so one closed is not given again") and C17 Reset ("a Help page put back by Reset records its guides, so one closed is not given again"): the five ids missing from docs.
- C13 (the schema's `find` help): read on the base. `config/schemas/deck-schema.yml:29` read "Which project folders the group finds: their folder globs, the tiers, the types and the statuses they may have.", naming "types" and "statuses", which the reader does not read (`spec.ts:129-143` reads `folders`, `tiers`, `stages`, `forms`, `status`).

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. `docs/decks.md` | DONE | 430 lines (`wc -l`); every section the brief lists; C3 below |
| 2. Decks guide tab after Palette | DONE | `config/defaults/layout.yml:145`; C5 run below |
| 3. Saved page given the engine documents, recorded in `Page.docs`; newPage and remade record the ids | DONE | the new test, 11 rows pass |
| 4. Links in HELP.md 3, 56, 57, 331, 579; templates.md; README 42, 44, 98; Help.svelte comment | DONE | `git diff --numstat` lists the files; C6 run below |
| 5. deck-schema `find` help | DONE | `config/schemas/deck-schema.yml:29` |
| 6. Examples' read script | DONE | quoted whole in C3 |
| 7. Test under G29 | DONE | `tests/state/workbench/layout/saved/layout-given.test.ts` |
| Verify 1 | DONE | `npm run diagrams && npm run docs:palette` changed no file (`git status --short docs/diagrams docs/palette.md` printed nothing); `npm run test:quick` printed `test:quick: 75.2 s; every command passed` |
| Verify 2 | DONE | `npx vitest run tests/state/workbench/layout/saved/ tests/state/workbench/navigation/pages.test.ts`: `Test Files  5 passed (5)`, `Tests  62 passed (62)`; history check see below |
| Verify 3 | DONE | the perl ASCII gate over `src tests config` printed nothing; `LC_ALL=C grep -n '[^ -~]' docs/decks.md docs/HELP.md docs/templates.md README.md` printed nothing |
| Verify 4 | DONE | largest module `src/lib/state/workbench/layout.svelte.ts` 869 (867 at base); `tests/state/workbench/layout/saved/` holds 4 items; `docs/` 9 items |
| Verify 5 | DONE | `sh utils/unused-exports.sh \| diff ../O149-base/unused-exports.txt -` printed nothing, exit 0: the step adds no line |
| Verify 6 | DONE | grep below |
| Verify 7 | DONE | history-word grep below |

`npm run test:quick` ran twice. The first run, after the code, the test and the links, printed `test:quick: 126.3 s; every command passed`. A later read of the deck title found three help texts and a comment that say the title is drawn on the first slide, which is false; they were fixed after that run, so the list ran a second time after the last change, as the rules ask, and printed:

```
test:quick: 19 changed file(s), from git since HEAD
test:quick: 37 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (12.6 s)
ok      svelte-check (12.8 s): 1793938310305 COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (53.4 s): Duration  38.12s (transform 21.47s, setup 0ms, import 27.63s, tests 10.31s, environment 0ms)
ok      vitest (62.2 s): Duration  46.96s (transform 83.13s, setup 0ms, import 154.47s, tests 8.91s, environment 921ms)
ok      vitest checks (72.5 s): Duration  56.99s (transform 40.24s, setup 0ms, import 77.98s, tests 117.07s, environment 4ms)
test:quick: 75.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The history check (C7, verify 2). Run alone, `npx vitest run tests/checks/source/history.test.ts tests/state/workbench/layout/saved/`, its comment case "names no package id, date or session in any comment" timed out at 5000 ms (7716 ms); the other 54 tests passed. It is a test of a file this step does not change; it was rerun alone, `npx vitest run tests/checks/source/history.test.ts --testTimeout=60000`, and printed `Tests  6 passed (6)`, `tests 7.61s`, so the comment case finds no hit and its only fault is the time it takes on this machine. It also passed inside both `vitest checks` runs of the list. The case timed out at 5 s on the base too (C7's first run), so the step does not cause it; it is named here and the list was not rerun for it.

## Files, from `diff -rq` against the base copy

`diff -rq` over `src`, `tests` and `config` of `.agents/worktrees/O149-base` and the worktree; the base copy holds no `docs/` and no `README.md`, so those rows come from `git diff --numstat` and `git status --short`. Line counts are `wc -l` after the change.

| File | Lines | In the write list |
| --- | --- | --- |
| `docs/decks.md` (new) | 430 | yes |
| `tests/state/workbench/layout/saved/layout-given.test.ts` (new) | 391 | yes |
| `config/defaults/layout.yml` | 334 | line 145 yes; line 33 no: the arrangements comment says how a saved page is given an arrangement's views, and item 3 extends that to engine documents, so it would be false of the change without it |
| `config/options/layout.yml` | 347 | no, line 63: the `arrangements` help Settings shows says the same as layout.yml:33, false of the change without the added clause |
| `config/schemas/deck-schema.yml` | 33 | line 29 yes; line 17 no: the `deck.title` help said "The title shown on the first slide and in the deck list"; no slide draws the deck title (`read.ts:334` sets `doc.title`, used by `deckLabel` in `src/lib/state/life/present.ts:446-448` for the tab, the menu entry and the audience window, by `Overview.svelte:143` for the heading, and by `read.ts:589` and `:613` for a summary row and a grid card of a deck that is no project's), and the guide states the true use, so the two would disagree, the reason decision 4 gives for line 29 |
| `config/text/views/academic/present.yml` | 163 | no, line 76: `present.field_title_help`, the same false sentence, shown under the Title field of the deck's Edit form (`DeckForm.svelte:84`) |
| `src/lib/views/academic/present/arrange/DeckForm.svelte` | 146 | no, lines 2-5: the head comment said `deck.title` is "the title on the first slide and in the deck list"; rewritten to what the code does |
| `docs/HELP.md` | 641 | yes (lines 3, 56, 57, 331, 579) |
| `docs/templates.md` | 1932 | yes (line 1914) |
| `README.md` | 119 | yes (lines 42, 44, 98) |
| `src/lib/shell/Workbench.svelte` | 469 | yes (comment 278-280) |
| `src/lib/state/workbench/layout.svelte.ts` | 869 | yes (comment 183-186) |
| `src/lib/state/workbench/layout/instance.ts` | 382 | yes |
| `src/lib/state/workbench/layout/model.ts` | 438 | yes |
| `src/lib/state/workbench/layout/open/float/pages.ts` | 637 | yes |
| `src/lib/state/workbench/layout/open/float/rail-pages.ts` | 122 | yes (comments only) |
| `src/lib/state/workbench/layout/saved/docs.ts` | 70 | yes (head comment only) |
| `src/lib/state/workbench/layout/saved/views.ts` | 122 | yes |
| `src/lib/views/system/help/Help.svelte` | 98 | yes (comment 2-5) |

`npm run diagrams` and `npm run docs:palette` changed no file of `docs/diagrams/` or `docs/palette.md`.

## Edits to existing assertions in tests

None. No existing test file changed (`diff -rq` over `tests` lists only the new file).

## Judgment calls

1. The place of a given document when the tab the arrangement shows before it is closed (C14). Item 3 says "in the pane holding the tab the arrangement shows before it ... at the end of the first pane's pinned tabs when no pane holds it", the immediate predecessor; C14 says "after the tab the arrangement shows before Palette that the page holds ... or at the end of the first pane's pinned tabs". I built item 3 as written: `documented` in `saved/views.ts:91-106` looks only at the immediate predecessor and falls back to the end of the first pane's pinned tabs. In a one-pane Help page whose guides are its last pinned tabs, the two readings give the same place, which is the test row's case. They differ only when the held earlier tab is in another pane or is not at the end of the pinned run; then this code puts the guide at the end of the first pane's pinned tabs, where C14's reading would put it after the held tab.
2. Views first, then documents (`giveViews` returns `documented(viewed(page, viewIds(built.root)), built.root)`, `views.ts:119`), so a document never moves the place a view is given, as item 3 asks. A `doc` tab of an empty id is dropped from the order a predecessor is looked up in, so it names no place.
3. Decision 3's consequence, built as the brief says: a saved page whose record holds no engine id records all five guides at its next restore, and a page that had closed one of the four older guides is given it once more; closed again, it stays closed.
4. `docPaths` is no longer exported: its two callers, `newPage` and `remade`, call `docRecord` now, and no other file used it.

The greps made before each helper was added, and run again on the final tree: `grep -rn --exclude=local.yml 'docPaths\|docRecord\|engineDocTabs\|withView\b\|withTab\|\bviewed\b\|documented(' src tests config docs README.md`. On the base copy, `grep -rn --exclude=local.yml 'docPaths\|withView' src tests config` found `docPaths` at `instance.ts:88` (exported), `model.ts:5`, `:426`, `pages.ts:10`, `:298`, and `withView` at `saved/views.ts:23`, `:36`, `:47`. On the final tree the hits are:

```
src/lib/state/workbench/layout/saved/views.ts:15:    engineDocTabs,
src/lib/state/workbench/layout/saved/views.ts:37:function withTab(root: Layout, tab: Instance, holds: Holds): Layout {
src/lib/state/workbench/layout/saved/views.ts:54:function viewed(page: Page, arranged: readonly string[]): Page {
src/lib/state/workbench/layout/saved/views.ts:62:        root = withTab(root, newInstance(view), (tab) => tab.view === before);
src/lib/state/workbench/layout/saved/views.ts:91:function documented(page: Page, arranged: Layout): Page {
src/lib/state/workbench/layout/saved/views.ts:93:    const fresh = engineDocTabs(arranged).filter((tab) => !given.has(docId(tab)));
src/lib/state/workbench/layout/saved/views.ts:102:        root = withTab(root, newInstance(DOC_VIEW, { ...instanceMap(tab.state) }), holds);
src/lib/state/workbench/layout/saved/views.ts:119:        return documented(viewed(page, viewIds(built.root)), built.root);
src/lib/state/workbench/layout/saved/docs.ts:35:function documented(page: Page, listed: readonly DocEntry[]): Page {
src/lib/state/workbench/layout/model.ts:5:import { docRecord, newInstance, viewIds } from './instance.ts';
src/lib/state/workbench/layout/model.ts:428:        page.docs = docRecord(workbench.root);
src/lib/state/workbench/layout/open/float/pages.ts:10:import { docRecord, findInstance, findView, tabsOf, viewIds } from '../../instance.ts';
src/lib/state/workbench/layout/open/float/pages.ts:299:        made.docs = docRecord(workbench.root);
src/lib/state/workbench/layout/instance.ts:88:function docPaths(layout: Layout): string[] {
src/lib/state/workbench/layout/instance.ts:100:export function engineDocTabs(layout: Layout): Instance[] {
src/lib/state/workbench/layout/instance.ts:116:export function docRecord(layout: Layout): string[] {
src/lib/state/workbench/layout/instance.ts:117:    const engine = engineDocTabs(layout).map((tab) => instanceText(tab.state, 'id'));
src/lib/state/workbench/layout/instance.ts:118:    return [...docPaths(layout), ...engine];
```

plus the comment lines naming them (`views.ts:51`, `:84`, `:87`, `:89`; `instance.ts:113-114`, `:123`) and unrelated module-local functions of the same names (`documented` in `src/lib/server/machine/runs/lint/readers.ts:135` and `tests/checks/source/keys.test.ts:655`, `viewed` in `src/lib/state/sources/repositories/repositories.ts:284`, `withTabPlace` in `src/lib/state/sources/explorer/pdf-place.ts:130`). No hit names `withView` any more; every caller of `docPaths` moved to `docRecord`. No existing helper did either job: `docPaths` excludes engine tabs by design, and `withView` matched by view only, so `withTab` takes its place with a match test and `viewed` keeps its old behaviour through `(tab) => tab.view === before`.

The history-word grep over the added comment lines and test titles, `(git diff -U0 -- src config; cat tests/state/workbench/layout/saved/layout-given.test.ts docs/decks.md | sed 's/^/+/') | grep '^+' | grep -nEi "\b(O[0-9]+|C[0-9]+|Q[0-9]+|before|still|no longer|anymore|now|previously|used to|was|were|old|new(ly)? added|20[0-9][0-9]-)"`: its hits are "the tab before it" and "the tab the arrangement shows before it" (a place in a tab strip), "the `---` before it" and "the words before the numbered list" (a place in a file), and the guide's example slide "# Before and after" / "The old pipeline read every file." (slide text of the `columns` example). One hit, a test comment "The Help page as a reader of the four older guides saved it", was rewritten to "A saved Help page that shows the Apps guide, the Templates, the Data map and the Palette, with the Data map on screen, and the tabs of `extra` after them." No package id, case id or date appears in a comment or a test title.

## C1: the keys of the code beside the guide's

`present.yml` (`src/lib/data/sources/deck/spec.ts`):

| Key | Code | Type and default in the code | Guide |
| --- | --- | --- | --- |
| `deck.title` | `spec.ts:219`, `read.ts:334` | text; with none or not text, the deck's name | `decks.md:100`, text, default the deck's name |
| `deck.frame` | `spec.ts:220`; ranges `config/options/present.yml:12-13`, `:20-21` | `{ width, height }` px; with none `defaults.frame` 1280 by 720 (`config/defaults/present.yml`); width 320 to 3840, height 240 to 2160 | `decks.md:101`, the same |
| `defaults.tag_tones` | `spec.ts:221`, `:112-120` | map tag class to hue; non-text or empty entry left out; laid over `measured: green, design: amber, proof: purple, mixed: cyan` | `decks.md:106`, the same |
| `groups` | `spec.ts:222`, `:146-173` | map; not a map is `groups_not_a_map`; a group not a map is `group_not_a_map` | `decks.md` groups section |
| `groups.<g>.find` | `spec.ts:129-143` | map of `folders` (glob or list; none is `find_no_folders`), `tiers`, `stages`, `forms`, `status`; not a map is `find_not_a_map` | groups section |
| `groups.<g>.sort` | `spec.ts:158-165` | `folder` or `title`; default `folder`; other is `sort_unknown` | `decks.md:119` |
| `groups.<g>.discover` | `spec.ts:164` | `true` or not; default false | groups section |
| `groups.<g>.slides` | `spec.ts:166` | list of names; default empty | groups section |
| `order` | `spec.ts:223`, `:176-211` | list of a file name, `{ slides }`, `{ kind: summary\|grid, of, title, lede, foot }`; other is `order_shape`; not a list reads as empty | `decks.md:125`, `:141-150` |

Front matter (`kinds.ts`, `project.ts`):

| Key | Code | Kinds | Guide |
| --- | --- | --- | --- |
| `kind` | `kinds.ts:262-267` | every; default `text`; unknown is `kind_unknown` | `decks.md` front-matter list |
| `notes` | `kinds.ts:269` | every | same list; "No notes for this slide." is `config/text/views/academic/present.yml:120` |
| `legend` | `kinds.ts:272` | title, section, closing | same list |
| `kicker`, `contact` | `kinds.ts:286`, `:289` | title, closing | same list |
| `foot` | `kinds.ts:303` | section; default the words after the list | same list |
| `title` | `kinds.ts:239`, `:384`; `project.ts:140` | project, idea | same list |
| `desc` | `kinds.ts:243` | idea; default the body | same list |
| `specs`, `panels`, `method`, `results` | `project.ts:128-131`; panel fields `figure`, `diagram_html`, `caption`, `explain` `project.ts:66-71` | project | same list |
| `tag` (`class`, `text`), `eli5` (`purpose`, `plain`) | `project.ts:35-46`, `:133-134` | project | same list |
| `sub`, `hook`, `mechanism`, `headline` | `project.ts:140` | project | same list |
| `equation` | `project.ts:144-148`; an image name is `equation_image` | project | same list |

`slide-text.ts` reads no front-matter key: its exports (`duplicateSlide`, `deleteSlide`, `appendToSlide`, `newSlideText`, `oneLine`, `presentText`, `closingText`) write slide text. The guide names no key the reader does not read; `defaults:` is said to hold no other key (`decks.md:107`).

Disagreements between `docs/HELP.md` and the code found while writing the guide: none in `docs/HELP.md`. The disagreement found was the `deck.title` help in `config/schemas/deck-schema.yml:17`, `config/text/views/academic/present.yml:76` and the comment of `DeckForm.svelte:2-5`, fixed as the file table says.

C2: the guide's `## Slide kinds` has one `###` section with an example for each of the twelve kinds of `SlideKind`: title, section, text, image, columns, equation, code, closing, project and idea as front matter and body, summary and grid as `order:` entries over the group `members`. `## The order` names the four entry shapes, and `### Counts` names `{{<group>.count}}`.

C3: the examples' read. Script `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-examples/read-examples.mjs`, quoted whole:

```js
// The examples' read of O149 (case C3): every slide example of the Decks guide written into a deck
// of a scratch hub under this folder, read by the deck reader as the deck route reads it, and each
// slide's kind and every finding printed. It writes only under its own scratch hub, inside this
// folder, and nothing of the worktree or the research hub.
// Usage: node read-examples.mjs <engine folder>
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const engine = resolve(process.argv[2]);
const here = dirname(fileURLToPath(import.meta.url));
const { parse } = await import(join(engine, 'node_modules/yaml/dist/index.js'));
const { engineDir, frameSetting, loadConfig, textCatalog } = await import(
    join(engine, 'src/lib/data/sources/config.ts')
);
const { createReader } = await import(join(engine, 'src/lib/data/sources/deck/read.ts'));

const guide = readFileSync(join(engine, 'docs/decks.md'), 'utf8').split('\n');

/** The fence that opens a block on a line: its backticks and its info word, or null. */
function fenceOf(line) {
    const open = /^(`{3,})(\w*)\s*$/.exec(line);
    return open === null ? null : { mark: open[1], info: open[2] };
}

/**
 * The fenced blocks of a run of lines, their info word and their text, and for each line whether
 * it lies inside a block (a fence's own lines included).
 */
function blocks(lines) {
    const found = [];
    const inside = lines.map(() => false);
    for (let at = 0; at < lines.length; at += 1) {
        const open = fenceOf(lines[at]);
        if (open === null) continue;
        const end = lines.findIndex((line, i) => i > at && line === open.mark);
        if (end < 0) throw new Error(`the block at line ${at + 1} is not closed`);
        found.push({ info: open.info, text: `${lines.slice(at + 1, end).join('\n')}\n` });
        for (let i = at; i <= end; i += 1) inside[i] = true;
        at = end;
    }
    return { found, inside };
}

/** Which lines of the guide lie inside a fenced block, so a `#` line there is no heading. */
const fenced = blocks(guide).inside;

/** The lines of a section from its heading to the next heading of its level or above. */
function section(heading) {
    const level = heading.split(' ')[0];
    const from = guide.indexOf(heading);
    if (from < 0) throw new Error(`the guide has no ${heading}`);
    let to = from + 1;
    while (
        to < guide.length &&
        !(!fenced[to] && /^#{1,6} /.test(guide[to]) && guide[to].split(' ')[0].length <= level.length)
    ) {
        to += 1;
    }
    return guide.slice(from + 1, to);
}

const scratch = mkdtempSync(join(here, 'hub-'));
/** Write a file of the scratch hub, refusing any path that leaves it. */
function put(path, text) {
    const full = resolve(scratch, path);
    if (!full.startsWith(resolve(scratch) + sep)) throw new Error(`${full} is outside the scratch hub`);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
}

// The first deck of the guide, as the portfolio deck `deck`.
const first = blocks(section('## A first deck')).found;
put('deck/present.yml', first.find((one) => one.info === 'yaml').text);
put('deck/slides.md', first.find((one) => one.info === 'markdown').text);

// Each slide kind's example, in a project's deck: a slide file per front-matter kind, and the
// summary and grid entries of present.yml over a group of one member deck.
const kinds = section('## Slide kinds');
const files = [];
const entries = [];
for (const line of kinds.filter((one) => one.startsWith('### '))) {
    const kind = line.slice(4).trim();
    const [example] = blocks(section(line)).found;
    if (example.info === 'markdown') {
        put(`projects/alpha/present/${kind}.md`, example.text);
        files.push(`${kind}.md`);
    } else entries.push(...parse(example.text).order);
}
put('projects/alpha/present/figure.png', 'png');
put(
    'projects/alpha/present/present.yml',
    `${JSON.stringify({
        deck: { title: 'Alpha' },
        groups: { members: { find: { folders: 'talks/*' }, discover: true } },
        order: [...files, ...entries]
    })}\n`
);
put('talks/one/present.yml', 'deck:\n  title: "One"\norder:\n  - one.md\n');
put(
    'talks/one/one.md',
    '---\nkind: project\ntitle: "One"\nmechanism: "A smaller model"\nheadline: "Half the time"\n---\n\n---\nkind: idea\ntitle: "One"\ndesc: "An idea."\n---\n'
);

const config = loadConfig(engineDir(join(engine, 'src/lib/data/sources/config.ts'))).config;
const project = {
    id: 'alpha',
    file: 'projects/alpha/project.yml',
    folder: 'projects/alpha',
    tier: 'research',
    chips: ['active'],
    short: 'Alpha',
    title: 'The alpha project',
    stage: 'in-prep',
    form: 'article',
    domain: 'heart',
    facts: [{ field: 'stage', words: ['in prep'], keys: ['in-prep'] }]
};
for (const path of ['deck', 'projects/alpha/present']) {
    const reader = createReader({
        hub: { key: 'hub', dir: scratch },
        projects: [project],
        domains: ['heart'],
        tagTones: config.defaults.tag_tones,
        frame: frameSetting(config),
        catalog: textCatalog(config)
    });
    const deck = reader.read({ key: 'hub', dir: scratch }, path);
    console.log(`deck ${path}: state ${deck.state}, ${deck.slides.length} slides`);
    for (const slide of deck.slides) console.log(`  ${slide.kind}  ${slide.key}  "${slide.title}"`);
    console.log(`  findings: ${deck.findings.length}`);
    for (const one of deck.findings) {
        console.log(`  ${relative(scratch, one.file)}:${one.line ?? ''} ${one.key}: ${one.message}`);
    }
}
rmSync(scratch, { recursive: true, force: true });
```

Run after the last change to the guide, `node read-examples.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O149` from its folder:

```
deck deck: state ok, 4 slides
  title  slides.md#0  "Lab update"
  section  slides.md#1  "Three results"
  text  slides.md#2  "Next steps"
  closing  slides.md#3  "Questions"
  findings: 0
deck projects/alpha/present: state ok, 12 slides
  title  title.md#0  "Lab update"
  section  section.md#0  "Three results"
  text  text.md#0  "Next steps"
  image  image.md#0  "The learning curve"
  columns  columns.md#0  "Before and after"
  equation  equation.md#0  "The loss"
  code  code.md#0  "The call"
  closing  closing.md#0  "Questions"
  project  project.md#0  "Alpha"
  idea  idea.md#0  "Alpha"
  summary  summary:members  "Where each project stands"
  grid  grid:members  "The ideas"
  findings: 0
```

Every example draws the kind its section names, with no finding; the project deck is project `alpha`'s, so the project and idea slides are read as a project's deck reads them. `ls` of the script's folder after the run shows only `read-examples.mjs`: the scratch hub was removed. The script wrote no file of the worktree or the hub.

## Host- and user-visible changes, before and after

C5, the Help page, from the case program `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-cases/help-keys.mjs`. The program loads the engine's config through jiti, with the hub's three Help documents added as the hub's config lists them, and prints; it writes nothing. Run `node help-keys.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O149`:

```
C5 fresh Help page tabs:
  help  pinned=true id=
  doc Research approach pinned=true id=docs/RESEARCH-APPROACH.md
  doc Agent approach pinned=true id=docs/AGENT-APPROACH.md
  doc HPC how-to pinned=true id=docs/HPC-UTwente-howto.md
  keys  pinned=true id=
  doc Apps guide pinned=true id=engine:docs/apps.md
  doc Templates pinned=true id=engine:docs/templates.md
  doc Data map pinned=true id=engine:docs/data-map.md
  doc Palette pinned=true id=engine:docs/palette.md
  doc Decks guide pinned=true id=engine:docs/decks.md
C5 fresh Help page docs record: ["docs/RESEARCH-APPROACH.md","docs/AGENT-APPROACH.md","docs/HPC-UTwente-howto.md","engine:docs/apps.md","engine:docs/templates.md","engine:docs/data-map.md","engine:docs/palette.md","engine:docs/decks.md"]
C5 Help entry keys:
  help: h1
  keys: h2
  Apps guide: h3
  Templates: h4
  Data map: h5
  Palette: h6
  Decks guide: h7
  Research approach: h8
  Agent approach: h9
  HPC how-to: (none)
C6 decks.md from docs/HELP.md: {"kind":"engine","path":"docs/decks.md"}
C6 decks.md from docs/templates.md: {"kind":"engine","path":"docs/decks.md"}
```

Before: the same tabs without the last row, the record of the three hub paths only, and the keys Research approach h7, Agent approach h8, HPC how-to h9. After: a pinned Decks guide tab after Palette, the guide ids in the record, Decks guide h7, Research approach h8, Agent approach h9, HPC how-to with no key. The look: press the Help rail button on a fresh layout, the last tab reads "Decks guide" and draws `docs/decks.md`, whose `## Contents` opens it as in the Apps guide; in the Views catalogue and the Keyboard Shortcuts view the Decks guide reads h7.

C6, the links. Before: no link to `decks.md` anywhere, and no such file. After: `docs/HELP.md:331` "The [Decks guide](decks.md) gives every key of `present.yml` and every slide kind, each with an example." and `docs/templates.md:1914` "The [Decks guide](decks.md) gives every key and every slide kind, each with an example."; both resolve to the engine document `docs/decks.md` (output above). The look: on the Help page, a press on "Decks guide" in the Present paragraph, and in the Templates tab a press on the link under `## present.yml`, opens the Decks guide in a doc tab.

C8, a saved Help page that shows the four guides, the Data map active, its record the hub path only. Before: restored as it was, no Decks guide tab, record unchanged. After: one pinned "Decks guide" tab right after Palette, the Data map still active, record `["docs/RESEARCH.md", "engine:docs/apps.md", "engine:docs/templates.md", "engine:docs/data-map.md", "engine:docs/palette.md", "engine:docs/decks.md"]`; a second restore changes nothing. The look: with a layout saved before this step, reload; the Help page ends with "Decks guide", and the tab that was on screen stays on screen.

C11, a saved Help page that holds only its help tab and has no `docs` and no `views` record. Before: given keys and the hub document, record the hub path only (`help, keys, doc:docs/RESEARCH.md`). After: `help, keys, Apps guide, Templates, Data map, Palette, Decks guide, doc:docs/RESEARCH.md`, each pinned, the hub path and the five guide ids recorded, help still active; a second restore gives nothing. The guides go after keys because keys is the tab the arrangement shows before the Apps guide, and keys itself is placed after help as the base places a view, so the hub document, which `giveDocuments` put after the first tab, ends after them on such a page.

C13, the hover over `find:` in a `present.yml` in the YAML editor. Before: "Which project folders the group finds: their folder globs, the tiers, the types and the statuses they may have." After: "Which decks the group finds: the folder globs it looks in (folders), and the tiers, stages, forms and status chips a deck's project may have (tiers, stages, forms, status)." The hover over `title:` under `deck:`, and the help under the Title field of the deck's Edit form in the Overview: before "The title shown on the first slide and in the deck list."; after "The deck's title: the words of its tab, of its entry in the deck menu and of the Overview's heading. No slide draws it." The look: open `deck/present.yml` in the editor and hover `find` and `title`; open the Overview (`O`), press Edit, read the Title field's help.

Also visible: README.md line 42 gains "The [Decks guide](docs/decks.md) shows how to write one.", line 44 lists "the Decks guide" among the Help page's contents, and a new line after 97 reads "- [docs/decks.md](docs/decks.md) shows how to write a deck: every key of `present.yml` and every slide kind, each with an example." `docs/HELP.md:3` names the Decks guide beside the Apps guide; `:56` lists the Help page's holdings in their order, the Keyboard Shortcuts view, the Data map and the Decks guide included; `:57` reads "A view or a document oculus adds to a page's arrangement later is given once, after the tab before it, and one you closed is not given again."; `:579` gains "The [Decks guide](decks.md) gives both beside a deck's own keys." Settings' help of `arrangements` gains "a view or a document of oculus's own folder that the arrangement shows later is given to that page once, and one the reader closed is not given again".

## Comments and docs that describe the changed behaviour

| Place | State |
| --- | --- |
| `src/lib/state/workbench/layout/saved/views.ts:1-10` head, and the doc comments of `withTab`, `viewed`, `docId`, `showing`, `documented`, `giveViews` | rewritten |
| `src/lib/state/workbench/layout/saved/docs.ts:1-6` head | rewritten (the record also holds engine ids, kept as they are) |
| `src/lib/state/workbench/layout/saved/docs.ts:28-34`, `:59-63` | true as it stands: this module still gives only the hub's `docs:` entries |
| `src/lib/state/workbench/layout/instance.ts:84-87` (`docPaths`) | true as it stands |
| `src/lib/state/workbench/layout/instance.ts:95-118` (`engineDocTabs`, `docRecord`) | new |
| `src/lib/state/workbench/layout/instance.ts:121-123` (`viewIds`) | rewritten, names `docRecord` |
| `src/lib/state/workbench/layout/model.ts:130-138` (`Page`) and `:417-418` (`newPage`) | rewritten |
| `src/lib/state/workbench/layout/open/float/pages.ts:293-294` (`remade`) | rewritten |
| `src/lib/state/workbench/layout/open/float/rail-pages.ts:4-8` and `:111-113` | rewritten |
| `src/lib/state/workbench/layout.svelte.ts:183-186` | rewritten |
| `src/lib/shell/Workbench.svelte:278-280` | rewritten |
| `src/lib/views/system/help/Help.svelte:2-5` | rewritten, names every guide in the page's order |
| `src/lib/views/system/help/Help.svelte:26-28` (the Apps guide holds no diagram) | true as it stands |
| `src/lib/views/academic/present/arrange/DeckForm.svelte:2-5` | rewritten |
| `config/defaults/layout.yml:33` | rewritten |
| `config/options/layout.yml:63` | rewritten |
| `docs/HELP.md:56`, `:57` | rewritten |
| `docs/HELP.md:147` ("h1-h9 / the Help page's tabs") | true as it stands |

## Anything in the brief that was wrong or impossible

- The write list leaves out four places whose text is false of the step or of the code it documents: `config/defaults/layout.yml:33` and `config/options/layout.yml:63` (the giving), and `config/schemas/deck-schema.yml:17`, `config/text/views/academic/present.yml:76` and `DeckForm.svelte:2-5` (the deck title on the first slide). Each was fixed in this step, with the evidence in the file table.
- C14's wording and item 3's differ as judgment call 1 says; the test row is one where they agree.
- Item 7 asks that each row fail on the unchanged tree. The rows for C9, C12 and C16 pass there, because each asks that nothing be given and the base gives nothing; they guard the new code against giving too much, and their passing on the base is in the first run above.
- C7: the history check's comment case takes longer than the 5 s limit when run alone on this machine, on the base and after the change; it passes with a longer limit and inside the verify list.
