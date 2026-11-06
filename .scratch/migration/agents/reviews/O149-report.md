# O149 report: the Decks guide

Everything in the brief and in repair round 1 is done. The look for C5 (the Decks guide tab opening `docs/decks.md` with its contents list) and C13 (the hover in the YAML editor) is the orchestrator's, since a builder runs no page.

## Open items of the state file, verbatim

Copied from `.scratch/migration/orchestrator-state.md`, section "## Open items", as printed by `awk '/^## Open items/{f=1} f&&/^## /&&!/^## Open items/{exit} f' .scratch/migration/orchestrator-state.md` (its `md5` at the end of the round equals that of the block below):

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- Open item 689 (2026-11-06, O150's brief check): `deck/engine.md:12` in the research hub reads "Each of the next slides leads with the governing equation, then specs, method, and results." With O150's one group, the next slides are all 25 research decks, of which nine are `kind: idea` and two `kind: text`, with no equation, so the sentence becomes false; O150's line rewrites `deck/present.yml` only, and a change to the hub's own words outside it is yours. (a) Reword it in the same hub commit to "The slides that follow are every research project's deck, in folder order; a project slide leads with its governing equation, then specs, method, and results.": the slide stays true of the whole run. (b) Delete the sentence: true, but the section slide loses its pointer to what follows. (c) Keep it as written: the lazy option, a false sentence on the deck's second slide. Recommendation (a). O150 is built with the sentence as it stands, and the hub commit, which waits on your word anyway, carries (a) or (b) when you rule.

- Open item 690 (2026-11-06, O150's review, a rule clash): rulings 678 (a) and 685 (a) put every research project's deck in the portfolio deck, the failed and stopped ones included, and O150 does so; the deck's own rule line, `deck/present.yml:1` in the hub, says the deck is "a public artifact" with "never a null or negative result". Today one deck is affected, `projects/archive/failed/fed-faithful-ecg` (stage `failed`), now the first project slide; its slide (`present/main.md`, `kind: text`, no status chip) reads "In progress: real-hospital replication" and "Next: ... Open to clinical and federated-learning collaborators", which is false of a failed project. (a) Leave the failed and stopped projects out of the portfolio deck: the group's `find:` gains `stages:` listing every stage of the vocabulary but `failed` and `stopped`; their decks stay whole and open on their own in the Present view, and the public deck holds no negative result; it narrows 678's "every research project's deck" to the live and finished ones. (b) Keep them, as 678 and 685 say: the rule line drops "never a null or negative result", and the fed-faithful-ecg slide is rewritten to its failed state (by O151, which writes the failed and stopped decks like every other); the public deck then shows a NO-GO project. (c) Keep both as they are: the lazy option, a deck that breaks its own rule with a false slide. Recommendation (a), since the deck is presented in public talks and your rule against a negative result in public output is absolute. O150's hub commit, which waits on your word, carries (a) or (b)'s rule line when you rule.

- Open item 691 (2026-11-06, O150's review over round 1): O150 drops the portfolio deck's two summary slides and its idea grid. Measured on the scratch server, a summary and a grid of all 25 research decks are both Too tall in the 1280 by 720 frame; with the filter bar on Stage `submitted` (11 decks) the summary fits and the grid stays Too tall. So a summary would serve the filtered talk (ruling 676 has a summary count only what the filter keeps) and overflow the unfiltered one. (a) Keep the deck as built, no summary and no grid: no slide overflows, and a filtered talk has no at-a-glance table. (b) Add one `{ kind: summary, of: research }` before `closing.md`: the filtered talk gets its table, and the unfiltered deck draws one Too tall slide with its finding each time it is opened. (c) A new step in oculus that splits a summary over as many slides as its rows need, so it fits filtered and unfiltered, then (b): the option that ends the cause, at the cost of a step. (d) The lazy option is (a) without saying anything. Recommendation (c), with (a) standing until that step lands. O150's hub commit, which waits on your word, carries (a), or (b) when you choose it.

- Open item 692 (2026-11-06, O148's review over round 1, Behaviour 1 of `agents/reviews/O148-refuter.md`): the two readers of a deck check a project slide's domain differently. The snapshot build checks the manifest's raw `domain:` key against its own hub's domains (`src/lib/data/sources/documents/decks.ts:61-62`, `:83`); the deck route checks the domain as the merge resolved it, by its key, against its own hub's domains (`src/lib/server/content/deck/read.ts:77-78`, `:129`). So a domain no hub holds raises `domain_unknown` in the Findings view but not on the deck route, and a domain only a second hub holds raises a false `domain_unknown` on both, the slide drawing no Domain tag while its strip shows a Domain chip. Neither happens today: the workspace has one hub and every project's domain is a key of `.oculus/data/pillars/domains.yml`. The fix reaches both readers, the facts module and their tests, more than a fix at landing. (a) A step O154, built by a builder: both readers take the slide's domain as the merge resolves it, checked against every hub's domains, keeping the deck's `domain_unknown` finding, with test rows for a domain only a second hub holds and one no hub holds. (b) The same step, with the deck's `domain_unknown` finding removed: a manifest's unknown domain is already a finding of validate (`src/lib/data/snapshot/validate.ts:107`), so the deck finding repeats it, and a domain that resolves is drawn on both readers. (c) Leave it as it is: the lazy option, two readers that disagree on a workspace with a second hub. Recommendation (b): one cause, one finding, and the readers agree.

This step adds no open item.

## Repair round 1: the nine rulings

| Ruling | State | The check that shows it |
| --- | --- | --- |
| 1. Spec 1, C14: a guide goes after the nearest earlier tab of the arrangement the page holds, in its pane; else at the end of the first pane's pinned tabs | DONE | `documented` (`src/lib/state/workbench/layout/saved/views.ts:93-109`) walks back through `order` (`const earlier = order.slice(0, order.indexOf(tab)).reverse(); const before = earlier.find((one) => held.some(showing(one)));`), its doc comment at `:83-92` says the rule; the two-pane row "with Palette closed the guide goes after the nearest earlier tab the page holds" failed before the change (lines below) and passes after; a row for the fallback, "a page holding no tab before the guide gets it after the first pane's pinned tabs", passes |
| 2. Proof 1: no module-level `minted` | DONE | `grep -n "minted" tests/state/workbench/layout/saved/layout-given.test.ts` prints only `:126 let minted = 0;`, `:128`, `:138`, all inside `paneMaker()` (`:125`), which each row's `held` receives fresh (`give(held(paneMaker()), sources)`, `:461`) |
| 3. Proof 2: `help-keys.mjs` quoted whole in C5 with what it sets up | DONE | C5 section below |
| 4. Proof 3, C3: every fenced example read, the count and project-field ones with the facts they are written for | DONE | the script's output `fenced blocks in the guide: 17; written into a deck: 17` and `findings: 0` for each of the three decks; C3 section below |
| 5. Proof 4: history check run with no time limit | DONE | `npx vitest run tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0`: `Test Files  1 passed (1)`, `Tests  6 passed (6)`; Verify 2 row |
| 6. Standards 1: the deck title's text | DONE | `docs/decks.md:100`, `config/schemas/deck-schema.yml:17`, `config/text/views/academic/present.yml:76`, quoted in C13 below |
| 7. Standards 2: the step's comment paragraphs filled at 100 columns | DONE | the print-only program below lists no short line in the step's paragraphs; `awk 'length > 100'` over the changed source and test files prints nothing; `npx prettier --check` passes |
| 8. Standards 3: the colliding id | DONE | judgment call 4 below, with the run of `collide.mjs` |
| 9. Behaviour 1: the older guides given once more | DONE | "Host- and user-visible changes" below, with the test rows that show it |

The two-pane row of ruling 1, run on the worktree before the change to `views.ts` (`npx vitest run tests/state/workbench/layout/saved/layout-given.test.ts`; `Tests  1 failed | 12 passed (13)`):

```
 FAIL  |unit| tests/state/workbench/layout/saved/layout-given.test.ts > the tabs a saved rail page is given > 'with Palette closed the guide goes af...'
AssertionError: expected { help: { panes: [ ...(2) ], ...(2) } } to deeply equal { help: { panes: [ ...(2) ], ...(2) } }

- Expected
+ Received

@@ -19,15 +19,15 @@
          "help",
          "doc:docs/RESEARCH.md",
          "doc:docs/AGENT.md",
          "doc:docs/HPC.md",
          "keys",
+         "doc:engine:docs/decks.md",
        ],
        [
          "doc:engine:docs/apps.md",
          "doc:engine:docs/templates.md",
          "doc:engine:docs/data-map.md",
-         "doc:engine:docs/decks.md",
        ],
      ],
    },
  }
```

(The vitest ellipsis characters are written `...` here, the report's character set.) After the change the same file prints `Tests  13 passed (13)`.

Ruling 7, the program `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-cases/short-lines.mjs`, which reads only and prints each comment line that ends short inside a paragraph (the next comment line's first word would have fit within 100 columns):

```js
// Prints each comment line of the given files that ends short inside a paragraph: the next line
// is a comment line of the same paragraph and its first word would have fit within 100 columns.
// It reads only and writes nothing. Usage: node short-lines.mjs <file>...
import { readFileSync } from 'node:fs';

const prefix = /^(\s*)(\/\/ ?|\* ?|\/\*\* ?|# ?)(.*)$/;
for (const file of process.argv.slice(2)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let at = 0; at + 1 < lines.length; at += 1) {
        const one = prefix.exec(lines[at]);
        const next = prefix.exec(lines[at + 1]);
        if (one === null || next === null) continue;
        if (one[1] !== next[1]) continue;
        if (one[3].trim() === '' || next[3].trim() === '') continue;
        if (one[3].trim() === '/' || next[3].trim() === '/') continue;
        if (one[2].trim() === '/**' || next[2].trim() === '/**') continue;
        if (/^[-*0-9]|^@/.test(next[3].trim())) continue;
        const word = next[3].trim().split(/\s+/)[0];
        if (lines[at].length + 1 + word.length <= 100) {
            console.log(`${file}:${at + 1}: ${lines[at].length} cols, next word "${word}"`);
        }
    }
}
```

Run over `$(git diff --name-only -- src)` and the new test, filtered to the step's paragraphs. Before the round it printed `model.ts:132`, `model.ts:417`, `views.ts:5`, `:6`, `:9`, `:87`, `:88`, `:89`, `:112`, `Help.svelte:3` and `layout-given.test.ts:121`, `:122`; each paragraph was refilled with Edit, and the same run now prints nothing. Its other hits are in paragraphs the step did not write (for example `DeckForm.svelte:9`, `model.ts:8`, `pages.ts:3`) and were left as they are. A second print-only program, `wrap.mjs` in the same folder, printed each paragraph filled greedily at 100 columns, and that text was pasted with Edit.

## The cases' first run, on the unchanged tree

Each case was run or read on the tree at the base before any change.

- C1: read on the base. The guide did not exist; the keys the code reads are in the C1 section below.
- C2: read on the base. No guide; `SlideKind` (`src/lib/data/model/model-deck.ts:65-77`) holds twelve kinds, `KINDS` (`src/lib/data/sources/deck/kinds.ts:77-88`) the ten front-matter ones, `orderOf` (`spec.ts:176-211`) four entry shapes.
- C3: not runnable on the base, since `docs/decks.md`, which the script reads its examples from, did not exist.
- C4: read on the base. `docs/HELP.md:331-348` against `present.svelte.ts`, `read.ts`, `project-facts.ts` and the catalog: no disagreement in the filter, strip, toggle, `{{project.<field>}}` or the two findings. Line 56 left out the Data map and the Keyboard Shortcuts view, which item 4 fixes.
- C5: the program `help-keys.mjs` (C5 section). First run: the tabs help, the three hub docs, keys, Apps guide, Templates, Data map, Palette; the record the three hub paths only; the keys help h1, keys h2, Apps guide h3, Templates h4, Data map h5, Palette h6, Research approach h7, Agent approach h8, HPC how-to h9.
- C6: same program. First run: `decks.md` from `docs/HELP.md` and from `docs/templates.md` both gave `{"kind":"engine","path":"docs/decks.md"}`; only the file and the links were missing.
- C7: `npx vitest run tests/checks/source/history.test.ts` on the base, with vitest's default limit: the documents case passed and the comment case timed out at 5 s.
- C8 to C12 and C14 to C17: the test file of the first build run on the unchanged source, saved whole in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-cases/given-base.txt`: `Tests  8 failed | 3 passed (11)`. The rows for C9, C12 and C16 passed, because each asks that nothing be given, which the base already does. Each failing row fails by its result at the `toEqual` line, never by an import:
  - C8 ("a saved Help page with no record of the Decks guide gains it after Palette, pinned"): docs lacked `"engine:docs/apps.md"`, `"engine:docs/templates.md"`, `"engine:docs/data-map.md"`, `"engine:docs/palette.md"`, `"engine:docs/decks.md"`, and the pane lacked `"doc:engine:docs/decks.md"` after `"doc:engine:docs/palette.md"`.
  - C8 in two panes ("the guide goes into the pane that holds the tab before it"): the same five ids missing, and `"doc:engine:docs/decks.md"` missing from the second pane.
  - C10 ("a page that shows the guide with no record of it gets no second tab, and records it"): the five ids missing from docs.
  - C11 ("a page with no record is given every document it lacks, once, in order"): the five ids missing, and the five guide tabs missing between `"keys"` and `"doc:docs/RESEARCH.md"`.
  - C14 in one pane (now "with Palette closed in one pane the guide goes after the Data map, pinned"): `"engine:docs/decks.md"` missing from docs and `"doc:engine:docs/decks.md"` missing before `"doc:docs/NOTES.md (unpinned)"`.
  - C15 ("an engine tab with an empty id is given to no page, and a repeated one once"): `"docs": [ "engine:docs/apps.md" ]` and `"doc:engine:docs/apps.md"` missing.
  - C17 fresh and C17 Reset: the five ids missing from docs.
  - C14 in two panes, added in round 1: its failing lines are quoted under ruling 1 above.
- C13: read on the base. `config/schemas/deck-schema.yml:29` read "Which project folders the group finds: their folder globs, the tiers, the types and the statuses they may have."; `spec.ts:129-143` reads `folders`, `tiers`, `stages`, `forms`, `status`.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. `docs/decks.md` | DONE | 430 lines (`wc -l`); C3 below |
| 2. Decks guide tab after Palette | DONE | `config/defaults/layout.yml:145`; C5 below |
| 3. Saved page given the engine documents, recorded in `Page.docs`; `newPage` and `remade` record the ids | DONE | the new test, 13 rows pass |
| 4. Links in HELP.md 3, 56, 57, 331, 579; templates.md 1914; README 42, 44, 98; Help.svelte comment | DONE | C6 below; `git diff --stat` lists each file |
| 5. deck-schema `find` help | DONE | `config/schemas/deck-schema.yml:29` |
| 6. Examples' read script | DONE | quoted whole in C3 |
| 7. Test under G29 | DONE | `tests/state/workbench/layout/saved/layout-given.test.ts` |
| Verify 1 | DONE | `npm run diagrams` and `npm run docs:palette` exit 0 and change no file (`git status --short docs/diagrams docs/palette.md` prints nothing); `npm run test:quick` lines below |
| Verify 2 | DONE | `npx vitest run tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0`: `Test Files  1 passed (1)`, `Tests  6 passed (6)`; `npx vitest run tests/state/workbench/layout/saved/`: `Test Files  4 passed (4)`, `Tests  51 passed (51)` |
| Verify 3 | DONE | the perl ASCII gate over `src tests config` prints nothing; `LC_ALL=C grep -n '[^ -~]' docs/decks.md docs/HELP.md docs/templates.md README.md` prints nothing |
| Verify 4 | DONE | the largest module is `src/lib/state/workbench/layout.svelte.ts` at 869 (867 at the base); `ls tests/state/workbench/layout/saved/ \| wc -l` prints 4; `ls docs \| wc -l` prints 9 |
| Verify 5 | DONE | `sh utils/unused-exports.sh \| diff ../O149-base/unused-exports.txt -` prints nothing, exit 0 |
| Verify 6 | DONE | the name grep in the judgment calls |
| Verify 7 | DONE | the history-word grep in the judgment calls |

The full verify list ran twice in round 1: once after the rulings, and once more after the test helper `panes` was renamed `paneMaker` (it shared its name with the `panes` export of `instance.ts`), which was the last change. Both printed `every command passed`. The last run:

```
test:quick: 21 changed file(s), from git since HEAD
test:quick: 37 test file(s)
ok      prettier (1.8 s): All matched files use Prettier code style!
ok      ASCII gate (1.9 s)
ok      svelte-kit sync (4.0 s)
ok      eslint (24.1 s)
ok      svelte-check (24.3 s): 1793940543925 COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (72.1 s): Duration  43.15s (transform 22.48s, setup 0ms, import 29.41s, tests 13.43s, environment 0ms)
ok      vitest (77.1 s): Duration  48.77s (transform 76.57s, setup 0ms, import 157.82s, tests 8.31s, environment 2.08s)
ok      vitest checks (98.3 s): Duration  69.41s (transform 38.94s, setup 0ms, import 75.12s, tests 154.50s, environment 3ms)
test:quick: 102.5 s; every command passed
```

The first build ran `npm run test:quick` twice too, so the step's total is four runs, each ending in `every command passed`.

One formatting run changed a file: in round 1, `npx prettier --write tests/state/workbench/layout/saved/layout-given.test.ts` reformatted the new test file after it was written with Write. Every other edit was made with Edit or Write, and `npx prettier --check` was used from then on.

## Files, from `diff -rq` against the base copy

`diff -rq` over `src`, `tests` and `config` of `.agents/worktrees/O149-base` and the worktree; the base copy holds no `docs/` and no `README.md`, so those rows come from `git status --short`. Line counts are `wc -l` at the end of the round.

| File | Lines | In the write list |
| --- | --- | --- |
| `docs/decks.md` (new) | 430 | yes |
| `tests/state/workbench/layout/saved/layout-given.test.ts` (new) | 466 | yes |
| `config/defaults/layout.yml` | 334 | line 145 yes; line 33 no: the arrangements comment says how a saved page is given an arrangement's views, and item 3 extends that to engine documents |
| `config/options/layout.yml` | 347 | no, line 63: the `arrangements` help Settings shows, the same sentence |
| `config/schemas/deck-schema.yml` | 33 | line 29 yes; line 17 no: the `deck.title` help said "The title shown on the first slide and in the deck list", which the reader does not do (C13 below) |
| `config/text/views/academic/present.yml` | 163 | no, line 76: `present.field_title_help`, the same sentence, under the Title field of the deck's Edit form (`DeckForm.svelte:84`) |
| `src/lib/views/academic/present/arrange/DeckForm.svelte` | 146 | no, lines 2-5: the head comment said the same of `deck.title` |
| `docs/HELP.md` | 641 | yes (lines 3, 56, 57, 331, 579) |
| `docs/templates.md` | 1932 | yes (line 1914) |
| `README.md` | 119 | yes (lines 42, 44, 98) |
| `src/lib/shell/Workbench.svelte` | 469 | yes (comment 278-280) |
| `src/lib/state/workbench/layout.svelte.ts` | 869 | yes (comment 183-186) |
| `src/lib/state/workbench/layout/instance.ts` | 382 | yes |
| `src/lib/state/workbench/layout/model.ts` | 438 | yes |
| `src/lib/state/workbench/layout/open/float/pages.ts` | 637 | yes |
| `src/lib/state/workbench/layout/open/float/rail-pages.ts` | 122 | yes (comments) |
| `src/lib/state/workbench/layout/saved/docs.ts` | 70 | yes (head comment) |
| `src/lib/state/workbench/layout/saved/views.ts` | 125 | yes |
| `src/lib/views/system/help/Help.svelte` | 98 | yes (comment 2-5) |

The reviewer judged the five lines outside the write list needed, and the round's brief closes that finding.

## Edits to existing assertions in tests

None. No existing test file changed (`diff -rq` over `tests` lists only the new file).

## Judgment calls

1. The place of a given document. Built as ruling 1 says: after the nearest tab before it in the arrangement that the page holds, matched by id for a `doc` tab and by view for any other, in the pane that holds that tab, no later than its pinned tabs; at the end of the first pane's pinned tabs when the page holds none. The rows "the guide goes into the pane that holds the tab before it", "with Palette closed the guide goes after the nearest earlier tab the page holds", "with Palette closed in one pane the guide goes after the Data map, pinned" and "a page holding no tab before the guide gets it after the first pane's pinned tabs" pin it.
2. Views first, then documents (`giveViews` returns `documented(viewed(page, viewIds(built.root)), built.root)`, `views.ts:122`), so a document never moves the place a view is given. Views keep the base's rule, the view right before in `viewIds`.
3. `docPaths` is no longer exported: its two callers, `newPage` and `remade`, call `docRecord`, and no other file used it.
4. `Page.docs` holds the hub's paths and the engine ids in one list, so the code's answer for each odd id is:
   - An engine tab with an empty id: `engineDocTabs` (`instance.ts:100-111`) leaves it out, so it is given to no page and recorded nowhere, and it names no place for the tab after it (row "an engine tab with an empty id is given to no page, and a repeated one once").
   - An id the arrangement lists twice: `engineDocTabs` keeps the first, so it is given once and recorded once (same row).
   - A hub `docs:` entry whose path is written `engine:<path>`, the id of a guide tab. Run with the print-only program `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-cases/collide.mjs` (a Help arrangement of help, keys and the Decks guide, and a hub entry `{ label: 'Clash', path: 'engine:docs/decks.md', group: 'help' }`, through `withDocs`, `newPage`, `giveDocuments` and `giveViews`; it writes nothing):

```
fresh Help page
  tabs: help, keys, doc(id=engine:docs/decks.md, path=docs/decks.md, engine=true)
  docs: ["engine:docs/decks.md"]
fresh Help page after a restore
  tabs: help, keys, doc(id=engine:docs/decks.md, path=docs/decks.md, engine=true)
  docs: ["engine:docs/decks.md"]
saved Help page with an empty record, after a restore
  tabs: help, doc(id=engine:docs/decks.md, path=engine:docs/decks.md, engine=false)
  docs: ["engine:docs/decks.md"]
```

   So the two share one record entry and whichever is placed first wins. On a fresh page the arrangement's guide tab is made and the hub entry gets no tab; on a saved page with an empty record `giveDocuments` gives the hub entry first, records `engine:docs/decks.md`, and the Decks guide is then neither given nor ever given later, since its id is recorded and a tab of that id is shown. A hub path of that form is a folder named `engine:docs` at the hub's root, which no hub writes today; nothing checks for it.

The name grep, `grep -rn --exclude=local.yml 'docPaths\|docRecord\|engineDocTabs\|withView\b\|withTab\|THREE_\|function panes\|earlier' src/lib/state/workbench/layout tests/state/workbench/layout/saved` (comment lines left out), and the round-0 grep over `src tests config docs README.md`: `docPaths` is defined at `instance.ts:88` and used only by `docRecord` (`:118`); `docRecord` at `instance.ts:116`, used at `model.ts:5`, `:428` and `pages.ts:10`, `:299`; `engineDocTabs` at `instance.ts:100`, used at `views.ts:15`, `:95` and in `docRecord`; `withTab` at `views.ts:37`, used at `:62` and `:105`; `earlier` at `views.ts:102-103` (the other `earlier` hits are parameters of `saved/saved.ts:614`, `:643` and `saved/kept.ts:39`, `:82`, unrelated); `THREE_DOCS`, `THREE_PATHS`, `THREE_SOURCES` and `paneMaker` only in the new test. No hit names `withView` or a module-level `minted`. On the base copy `docPaths` was exported (`instance.ts:88`) and used at `model.ts:5`, `:426` and `pages.ts:10`, `:298`; `withView` was at `saved/views.ts:23`, `:36`, `:47`.

The history-word grep with the rules file's words (`agents/spec.md:44`), over the added lines with the landing fixes, from the gate worktree: `(git diff -U0 HEAD -- src config tests; cat docs/decks.md | sed 's/^/+/') | grep '^+' | grep -v '^+++' | grep -nEi "\b(O[0-9]+|Q[0-9]+|D[0-9]+[a-z]?|20[0-9][0-9]-[0-9]|before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)\b"` gives 17 lines. Each is "before" naming a place, the tab or line ahead of another (the placement rule in `layout.yml`, `layout.svelte.ts`, `views.ts` and two test titles of `layout-given.test.ts`; the front-matter, numbered-list and two-column rules of `docs/decks.md`), or the "Before and after" layout's heading in `docs/decks.md`. None is history, and no package id, case id or date appears in a comment or a test title.

## C1: the keys of the code beside the guide's

`present.yml` (`src/lib/data/sources/deck/spec.ts`):

| Key | Code | Type and default in the code | Guide |
| --- | --- | --- | --- |
| `deck.title` | `spec.ts:219`, `read.ts:334` | text; with none or not text, the deck's name | `decks.md:100`, the same |
| `deck.frame` | `spec.ts:220`; ranges `config/options/present.yml:12-13`, `:20-21` | `{ width, height }` px; with none `defaults.frame`, 1280 by 720; width 320 to 3840, height 240 to 2160 | `decks.md:101`, the same |
| `defaults.tag_tones` | `spec.ts:221`, `:112-120` | map tag class to hue; a non-text or empty entry left out; laid over `measured: green, design: amber, proof: purple, mixed: cyan` | `decks.md:106`, the same |
| `groups` | `spec.ts:222`, `:146-173` | map; not a map is `groups_not_a_map`; a group not a map is `group_not_a_map` | groups section |
| `groups.<g>.find` | `spec.ts:129-143` | map of `folders` (glob or list; none is `find_no_folders`), `tiers`, `stages`, `forms`, `status`; not a map is `find_not_a_map` | groups section |
| `groups.<g>.sort` | `spec.ts:158-165` | `folder` or `title`; default `folder`; other is `sort_unknown` | `decks.md:119` |
| `groups.<g>.discover` | `spec.ts:164` | `true` or not; default false | groups section |
| `groups.<g>.slides` | `spec.ts:166` | list of names; default empty | groups section |
| `order` | `spec.ts:223`, `:176-211` | list of a file name, `{ slides }`, `{ kind: summary\|grid, of, title, lede, foot }`; other is `order_shape`; not a list reads as empty | `decks.md:125`, `:141-150` |

Front matter (`kinds.ts`, `project.ts`):

| Key | Code | Kinds | Guide |
| --- | --- | --- | --- |
| `kind` | `kinds.ts:262-267` | every; default `text`; unknown is `kind_unknown` | front-matter list |
| `notes` | `kinds.ts:269` | every | same; "No notes for this slide." is `config/text/views/academic/present.yml:120` |
| `legend` | `kinds.ts:272` | title, section, closing | same |
| `kicker`, `contact` | `kinds.ts:286`, `:289` | title, closing | same |
| `foot` | `kinds.ts:303` | section; default the words after the list | same |
| `title` | `kinds.ts:239`, `:384`; `project.ts:140` | project, idea | same |
| `desc` | `kinds.ts:243` | idea; default the body | same |
| `specs`, `panels`, `method`, `results` | `project.ts:128-131`; panel fields `project.ts:66-71` | project | same |
| `tag` (`class`, `text`), `eli5` (`purpose`, `plain`) | `project.ts:35-46`, `:133-134` | project | same |
| `sub`, `hook`, `mechanism`, `headline` | `project.ts:140` | project | same |
| `equation` | `project.ts:144-148`; an image name is `equation_image` | project | same |

`slide-text.ts` reads no front-matter key: its exports (`duplicateSlide`, `deleteSlide`, `appendToSlide`, `newSlideText`, `oneLine`, `presentText`, `closingText`) write slide text. The guide names no key the reader does not read.

Disagreements between `docs/HELP.md` and the code: none found in `docs/HELP.md`. The one found was the `deck.title` text of the schema, the catalog and the `DeckForm.svelte` comment, fixed as the file table says.

C2: `## Slide kinds` has one `###` section with an example for each of the twelve kinds of `SlideKind`; `## The order` names the four entry shapes and `### Counts` names `{{<group>.count}}`.

## C3: the examples' read

Script `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-examples/read-examples.mjs`, quoted whole:

```js
// The examples' read of O149 (case C3): every fenced example of the Decks guide written into a deck
// of a scratch hub under this folder, read by the deck reader as the deck route reads it, and each
// slide's kind, title and every finding printed. It writes only under its own scratch hub, inside
// this folder, and nothing of the worktree or the research hub.
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

/** How many of the guide's fenced blocks the run has written into a deck. */
let read = 0;
/** The fenced blocks of a section, counted as read. */
function examples(heading) {
    const { found } = blocks(section(heading));
    read += found.length;
    return found;
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
const first = examples('## A first deck');
const firstSlides = first.find((one) => one.info === 'markdown').text;
put('deck/present.yml', first.find((one) => one.info === 'yaml').text);
put('deck/slides.md', firstSlides);

// The present.yml example, as the deck `talk`, with the first deck's slides.md it names. Its group
// `members` finds the decks of projects alpha and beta, which pass its tiers, stages, forms and
// status, and names both.
const [presentExample] = examples('## present.yml');
put('talk/present.yml', presentExample.text);
put('talk/slides.md', firstSlides);

// Each slide kind's example, in project alpha's deck: a slide file per front-matter kind, and the
// summary and grid entries of present.yml over its group `members`; then the count example and the
// project-field example as slide files of the same deck, whose project holds a stage, a lead and a
// venue.
const files = [];
const entries = [];
for (const line of section('## Slide kinds').filter((one) => one.startsWith('### '))) {
    const kind = line.slice(4).trim();
    const [example] = examples(line);
    if (example.info === 'markdown') {
        put(`projects/active/alpha/present/${kind}.md`, example.text);
        files.push(`${kind}.md`);
    } else entries.push(...parse(example.text).order);
}
const [countExample] = examples('### Counts');
put('projects/active/alpha/present/counts.md', countExample.text);
const [fieldExample] = examples('## Project fields in a slide');
put('projects/active/alpha/present/fields.md', fieldExample.text);
put('projects/active/alpha/present/figure.png', 'png');
put(
    'projects/active/alpha/present/present.yml',
    `${JSON.stringify({
        deck: { title: 'Alpha' },
        groups: { members: { find: { folders: 'talks/*' }, discover: true } },
        order: [...files, 'counts.md', 'fields.md', ...entries]
    })}\n`
);
put('projects/active/beta/present/present.yml', 'deck:\n  title: "Beta"\norder:\n  - main.md\n');
put('projects/active/beta/present/main.md', '# Beta\n\nThe second project.\n');
put('talks/one/present.yml', 'deck:\n  title: "One"\norder:\n  - one.md\n');
put(
    'talks/one/one.md',
    '---\nkind: project\ntitle: "One"\nmechanism: "A smaller model"\nheadline: "Half the time"\n---\n\n---\nkind: idea\ntitle: "One"\ndesc: "An idea."\n---\n'
);

const total = blocks(guide).found.length;
console.log(`fenced blocks in the guide: ${total}; written into a deck: ${read}`);

const config = loadConfig(engineDir(join(engine, 'src/lib/data/sources/config.ts'))).config;
/** A project of the scratch hub that every filter of the present.yml example keeps. */
function projectNamed(id, short, facts) {
    return {
        id,
        file: `projects/active/${id}/project.yml`,
        folder: `projects/active/${id}`,
        tier: 'research',
        chips: ['active'],
        short,
        title: `The ${id} project`,
        stage: 'in-prep',
        form: 'article',
        domain: 'heart',
        facts
    };
}
const projects = [
    projectNamed('alpha', 'Alpha', [
        { field: 'stage', words: ['in prep'], keys: ['in-prep'] },
        { field: 'lead', words: ['Ada Lovelace'], keys: ['ada'] },
        { field: 'venue', words: ['JNM'], keys: ['jnm'] }
    ]),
    projectNamed('beta', 'Beta', [{ field: 'stage', words: ['in prep'], keys: ['in-prep'] }])
];
for (const path of ['deck', 'talk', 'projects/active/alpha/present']) {
    const reader = createReader({
        hub: { key: 'hub', dir: scratch },
        projects,
        domains: ['heart'],
        tagTones: config.defaults.tag_tones,
        frame: frameSetting(config),
        catalog: textCatalog(config)
    });
    const deck = reader.read({ key: 'hub', dir: scratch }, path);
    console.log(`deck ${path}: state ${deck.state}, ${deck.slides.length} slides`);
    for (const slide of deck.slides) {
        const body = slide.kind === 'text' ? `  | ${slide.body.split('\n').slice(2).join(' ')}` : '';
        console.log(`  ${slide.kind}  ${slide.key}  "${slide.title}"${body}`);
    }
    console.log(`  findings: ${deck.findings.length}`);
    for (const one of deck.findings) {
        console.log(`  ${relative(scratch, one.file)}:${one.line ?? ''} ${one.key}: ${one.message}`);
    }
}
rmSync(scratch, { recursive: true, force: true });
```

Run after the last change to the guide, `node read-examples.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O149` from its folder:

```
fenced blocks in the guide: 17; written into a deck: 17
deck deck: state ok, 4 slides
  title  slides.md#0  "Lab update"
  section  slides.md#1  "Three results"
  text  slides.md#2  "Next steps"  | - Write the methods section. - Run the second cohort.
  closing  slides.md#3  "Questions"
  findings: 0
deck talk: state ok, 21 slides
  title  slides.md#0  "Lab update"
  section  slides.md#1  "Three results"
  text  slides.md#2  "Next steps"  | - Write the methods section. - Run the second cohort.
  closing  slides.md#3  "Questions"
  title  alpha/title.md#0  "Lab update"
  section  alpha/section.md#0  "Three results"
  text  alpha/text.md#0  "Next steps"  | - Write the methods section. - Run the second cohort.
  image  alpha/image.md#0  "The learning curve"
  columns  alpha/columns.md#0  "Before and after"
  equation  alpha/equation.md#0  "The loss"
  code  alpha/code.md#0  "The call"
  closing  alpha/closing.md#0  "Questions"
  project  alpha/project.md#0  "Alpha"
  idea  alpha/idea.md#0  "Alpha"
  text  alpha/counts.md#0  "2 slides from the members"  | 
  text  alpha/fields.md#0  "Alpha at in prep"  | Led by Ada Lovelace, for JNM.
  summary  alpha/summary:members  "Where each project stands"
  grid  alpha/grid:members  "The ideas"
  text  beta/main.md#0  "Beta"  | The second project.
  summary  summary:members  "Where each project stands"
  grid  grid:members  "The ideas"
  findings: 0
deck projects/active/alpha/present: state ok, 14 slides
  title  title.md#0  "Lab update"
  section  section.md#0  "Three results"
  text  text.md#0  "Next steps"  | - Write the methods section. - Run the second cohort.
  image  image.md#0  "The learning curve"
  columns  columns.md#0  "Before and after"
  equation  equation.md#0  "The loss"
  code  code.md#0  "The call"
  closing  closing.md#0  "Questions"
  project  project.md#0  "Alpha"
  idea  idea.md#0  "Alpha"
  text  counts.md#0  "2 slides from the members"  | 
  text  fields.md#0  "Alpha at in prep"  | Led by Ada Lovelace, for JNM.
  summary  summary:members  "Where each project stands"
  grid  grid:members  "The ideas"
  findings: 0
```

All 17 fenced blocks of the guide are read: the two of `## A first deck` (deck `deck`), the `present.yml` example of `## present.yml` (deck `talk`, whose group `members` finds and names the decks of projects alpha and beta through the example's own `find:` filters), the twelve of `## Slide kinds`, the `{{members.count}}` example of `### Counts` (filled as "2 slides from the members", the two slides of `talks/one` that alpha's group `members` holds) and the `{{project.<field>}}` example of `## Project fields in a slide` (filled as "Alpha at in prep" and "Led by Ada Lovelace, for JNM.", from project alpha's stage, lead and venue). Every slide draws the kind its section names, and each of the three decks has 0 findings. `ls` of the script's folder after the run shows only `read-examples.mjs`; the script wrote no file of the worktree or the hub.

## Host- and user-visible changes, before and after

C5, the Help page, from the program `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O149-cases/help-keys.mjs`. It loads the engine's modules through the worktree's own jiti, imported by its absolute path `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O149/node_modules/jiti/lib/jiti.mjs`, with the `$lib` alias pointed at the engine's `src/lib`. Before loading, it sets `globalThis.$state`, `globalThis.$derived` and `globalThis.$effect` to plain stand-ins (`$state(value)` and `$state.raw(value)` return the value, `$derived(value)` returns it and `$derived.by(make)` returns `make()`, `$effect` and its `root` and `pre` do nothing), since the catalog modules on the import path hold Svelte runes that only the Svelte compiler defines. It reads the engine's config with `loadConfig`, replaces its `docs:` with the hub's three Help documents, and prints; it writes nothing. Quoted whole:

```js
// Case-run program for C5 and C6 of O149: prints the tabs a fresh Help page is made with, the
// record it keeps, the key of each Help entry, and where the two new links open. It reads the
// engine's config only, adds the hub's three Help documents as the hub's config lists them, and
// writes nothing. Usage: node help-keys.mjs <engine folder>
import { createJiti } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O149/node_modules/jiti/lib/jiti.mjs';

// The modules on the import path hold a rune or two (the catalog's generation counter); outside
// Svelte's compiler each is read as the plain value it wraps, which is all a pure call needs.
globalThis.$state = Object.assign((value) => value, { raw: (value) => value });
globalThis.$derived = Object.assign((value) => value, { by: (make) => make() });
globalThis.$effect = Object.assign(() => {}, { root: () => () => {}, pre: () => {} });

const engine = process.argv[2];
const jiti = createJiti(import.meta.url, { alias: { $lib: `${engine}/src/lib` } });
const load = (path) => jiti.import(`${engine}/src/lib/${path}`);

const { loadConfig } = await load('data/sources/config.ts');
const { railPages, chordDocs } = await load('state/workbench/navigation/rail.ts');
const { railOrder, keyOf, readGroups, readChord, docPick } = await load(
    'state/workbench/navigation/catalogue.ts'
);
const { parseArrangement } = await load('state/workbench/navigation/arrangement.ts');
const { newPage } = await load('state/workbench/layout/model.ts');
const { tabsOf } = await load('state/workbench/layout/instance.ts');
const { docLinkOf, openingOf } = await load('views/shared/prose/doc-link.ts');

const config = { ...loadConfig(engine).config };
config.docs = [
    { label: 'Research approach', path: 'docs/RESEARCH-APPROACH.md', group: 'help' },
    { label: 'Agent approach', path: 'docs/AGENT-APPROACH.md', group: 'help' },
    { label: 'HPC how-to', path: 'docs/HPC-UTwente-howto.md', group: 'help' }
];

const help = railPages(config).find((one) => one.page === 'help');
const page = newPage('Help', parseArrangement(help.node), 'help');
console.log('C5 fresh Help page tabs:');
for (const tab of tabsOf(page.workbench.root)) {
    const label = tab.state?.label ?? '';
    console.log(`  ${tab.view} ${label} pinned=${tab.pinned === true} id=${tab.state?.id ?? ''}`);
}
console.log(`C5 fresh Help page docs record: ${JSON.stringify(page.docs)}`);

const registrations = [
    { id: 'help', label: '', glyph: '', group: 'help', order: 0 },
    { id: 'keys', label: '', glyph: '', group: 'help', order: 1 }
];
const docs = chordDocs(config);
const order = railOrder(registrations, readGroups(config), readChord(config.direct_chord), docs);
console.log('C5 Help entry keys:');
for (const id of ['help', 'keys']) console.log(`  ${id}: ${keyOf(order, id) || '(none)'}`);
for (const entry of docs.filter((one) => one.group === 'help')) {
    console.log(`  ${entry.label}: ${keyOf(order, docPick(entry)) || '(none)'}`);
}

const space = { engine: true, engineAt: '', engineHub: '', hub: '', manual: 'docs/HELP.md' };
for (const from of ['docs/HELP.md', 'docs/templates.md']) {
    const link = docLinkOf('decks.md', from);
    console.log(`C6 decks.md from ${from}: ${JSON.stringify(openingOf(link, space))}`);
}
```

Its output after the change, `node help-keys.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O149`:

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

Before: the same tabs without the Decks guide, the record of the three hub paths only, and Research approach h7, Agent approach h8, HPC how-to h9. After: a pinned Decks guide tab after Palette, the guide ids in the record, Decks guide h7, Research approach h8, Agent approach h9, HPC how-to with no key. The look: on a fresh layout, press the Help rail button; the last tab reads "Decks guide" and draws `docs/decks.md` with its `## Contents`, as the Apps guide does; the Views catalogue and the Keyboard Shortcuts view show the Decks guide on h7.

C6, the links. Before: no link to `decks.md` and no such file. After: `docs/HELP.md:331` "The [Decks guide](decks.md) gives every key of `present.yml` and every slide kind, each with an example." and `docs/templates.md:1914` "The [Decks guide](decks.md) gives every key and every slide kind, each with an example."; both resolve to the engine document `docs/decks.md` (output above). The look: a press on either link opens the Decks guide in a doc tab.

C8, a saved Help page that shows the four guides, the Data map active, its record the hub path only. Before: restored as it was. After: one pinned "Decks guide" tab right after Palette, the Data map still active, the record `["docs/RESEARCH.md", "engine:docs/apps.md", "engine:docs/templates.md", "engine:docs/data-map.md", "engine:docs/palette.md", "engine:docs/decks.md"]`; a second restore changes nothing. The look: with a layout saved before this step, reload; the Help page ends with "Decks guide", and the tab that was on screen stays on screen.

C8 when the reader had closed one of the four older guides (ruling 9). A saved page whose record holds no engine id, which is every page saved before this step, gets each of the Apps guide, the Templates, the Data map and the Palette that it does not show given once more, pinned, after the nearest tab before it in the arrangement that the page holds: so a guide the reader had closed comes back once, in its place. Each id is then recorded, so a second close of it holds over a reload. The rows "a page with no record is given every document it lacks, once, in order" (the giving) and "a saved Help page whose record holds the closed Decks guide is given nothing" (the second close, the same rule for any recorded id) show it. The look: in a layout saved before this step with the Palette closed, reload; the Palette tab is back after the Data map; close it and reload; it stays closed.

C11, a saved Help page that holds only its help tab and has no `docs` and no `views` record. Before: given keys and the hub document (`help, keys, doc:docs/RESEARCH.md`), the record the hub path only. After: `help, keys, Apps guide, Templates, Data map, Palette, Decks guide, doc:docs/RESEARCH.md`, each pinned, the hub path and the five ids recorded, help still active; a second restore gives nothing. The guides go after keys because keys is the nearest tab before the Apps guide that the page holds, and keys is placed after help as a view is placed; the hub document, which `giveDocuments` put after the first tab, ends after them on such a page.

C13, the hover over `find:` in a `present.yml` in the YAML editor. Before: "Which project folders the group finds: their folder globs, the tiers, the types and the statuses they may have." After: "Which decks the group finds: the folder globs it looks in (folders), and the tiers, stages, forms and status chips a deck's project may have (tiers, stages, forms, status)." The hover over `title:` under `deck:`, and the help under the Title field of the deck's Edit form in the Overview: before "The title shown on the first slide and in the deck list."; after "The deck's title: the words of its tab, of its entry in the deck menu and of the Overview's heading. No slide of its own deck draws it; the summary and grid slides of a deck whose group holds it draw it for a member deck that is no project's." The guide's `deck.title` line (`docs/decks.md:100`) says the same, with the grid card drawing it when the member deck has no idea slide (`read.ts:584-590`, `:609-613`). The look: open a `present.yml` in the editor and hover `find` and `title`; open the Overview (`O`), press Edit, read the Title field's help.

Also visible: `README.md:42` gains "The [Decks guide](docs/decks.md) shows how to write one."; `:44` lists "the Decks guide" among the Help page's contents; a new line after `:97` reads "- [docs/decks.md](docs/decks.md) shows how to write a deck: every key of `present.yml` and every slide kind, each with an example." `docs/HELP.md:3` names the Decks guide beside the Apps guide; `:56` lists what the Help page holds, in its order, the Keyboard Shortcuts view, the Data map and the Decks guide included; `:57` reads "A view or a document oculus adds to a page's arrangement later is given once, after the tab before it, and one you closed is not given again."; `:579` gains "The [Decks guide](decks.md) gives both beside a deck's own keys." The Settings help of `arrangements` gains "a view or a document of oculus's own folder that the arrangement shows later is given to that page once, and one the reader closed is not given again".

## Comments and docs that describe the changed behaviour

| Place | State |
| --- | --- |
| `src/lib/state/workbench/layout/saved/views.ts:1-10` head, and the doc comments of `withTab`, `viewed`, `docId`, `showing`, `documented` (`:83-92`), `giveViews` (`:111-116`) | rewritten |
| `src/lib/state/workbench/layout/saved/docs.ts:1-6` head | rewritten |
| `src/lib/state/workbench/layout/saved/docs.ts:28-34`, `:59-63` | true as it stands: this module gives only the hub's `docs:` entries |
| `src/lib/state/workbench/layout/instance.ts:84-87` (`docPaths`) | true as it stands |
| `src/lib/state/workbench/layout/instance.ts:95-118` (`engineDocTabs`, `docRecord`) | new |
| `src/lib/state/workbench/layout/instance.ts:121-123` (`viewIds`) | rewritten |
| `src/lib/state/workbench/layout/model.ts:130-137` (`Page`) and `:415-418` (`newPage`) | rewritten |
| `src/lib/state/workbench/layout/open/float/pages.ts:293-294` (`remade`) | rewritten |
| `src/lib/state/workbench/layout/open/float/rail-pages.ts:4-8` and `:111-113` | rewritten |
| `src/lib/state/workbench/layout.svelte.ts:183-186` | rewritten |
| `src/lib/shell/Workbench.svelte:278-280` | rewritten |
| `src/lib/views/system/help/Help.svelte:2-5` | rewritten |
| `src/lib/views/system/help/Help.svelte:26-28` (the Apps guide holds no diagram) | true as it stands |
| `src/lib/views/academic/present/arrange/DeckForm.svelte:2-5` | rewritten |
| `config/defaults/layout.yml:33`, `config/options/layout.yml:63` | rewritten |
| `docs/HELP.md:56`, `:57` | rewritten |
| `docs/HELP.md:147` ("h1-h9 / the Help page's tabs") | true as it stands |

## Anything in the brief that was wrong or impossible

- The write list left out five places whose text was false of the step or of the code it documents; each was fixed, and the round's brief closes that finding.
- Item 7 asks that each row fail on the unchanged tree. The rows for C9, C12 and C16 pass there, because each asks that nothing be given and the base gives nothing; they guard the new code against giving too much.
- A hub `docs:` path written `engine:<path>` shares the record with a guide's id (judgment call 4). The code gives the first of the two placed and never the other; no ruling or brief covers it, and nothing in the step makes it reachable from a hub today.
