# Step O58 brief check (on main at cee3e8f4)

The brief checked is `/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O58.md`. `git log --oneline -1` printed `cee3e8f4 Launch O59's builder`, which is the brief's base. Outside `.scratch`, `git status --short` shows nothing changed. Inside `.scratch`, `plan.md` and `orchestrator-state.md` are modified and the briefs O50, O58 and O62 are untracked.

The plan has no "Goal" heading at its top: `grep -n -i goal plan.md` finds none. The goal used below is the one the prompt gives: the unread, false catalog file is gone, with its shape and every line naming it.

## 1. Names

- `config/catalogs/meta.yml`, `metaFileShape`, `catalog-files/meta.ts`, the `catalogs/meta` row, `desc_meta` and the test rows:
  - Command: `git grep -n 'meta\.yml\|metaFileShape\|catalogs/meta\|catalog-files/meta\|desc_meta' -- ':!config/local.yml' ':!.scratch'`.
  - Output: 17 hits, at `.prettierignore:12`, `config/text/views/system/workbench.yml:26`, `docs/diagrams/writes.dot:579,586,651,656,657,659,660`, `docs/diagrams/writes.svg:2215`, `src/lib/data/shapes/catalog-files.ts:19,64`, `src/lib/data/shapes/catalog-files/meta.ts:1,8,9` and `tests/checks/config/config-folder.test.ts:194,324`.
  - Every hit is inside "Paths this step writes".
- The premise grep, which adds `meta\.ts`, also finds `docs/diagrams/writes.svg:2207-2479`. That file is in the paths through `docs/diagrams/`.
- The bare word `meta` in Markdown: `git grep -nw "meta" -- '*.md' ':!.scratch' ':!docs/templates.md' ':!docs/apps.md'` prints nothing. `docs/templates.md` and `docs/apps.md` were already read with the docs grep (`git grep -nwi 'meta' -- docs README.md DESIGN.md CLAUDE.md ':!docs/diagrams'`); all their hits are collection, feed and HTML `meta`.
- The bare word `meta` in code and config: `git grep -nwi "meta" -- config src utils bin tests` (filtered) finds only unrelated `meta` (the Meta key, collection meta, deck meta, feeds `meta_not_a_map` read at `src/lib/server/edit/feeds/feeds.ts:107`). Besides those, its only hits are `catalog-files.ts:19,64` and `meta.ts:1,8`, which are already in the paths.
- The hub: `grep -rn --exclude=local.yml 'catalogs/meta\|desc_meta\|meta\.yml' ~/workspace/research-hub/.oculus` prints nothing.
- Machine-local state: `grep -rl --exclude=local.yml 'catalogs/meta' ~/.oculus` prints nothing.
- `.scratch` hits, from `grep -rn ... --exclude=local.yml .scratch`: `choices.md:3654`, `orchestrator-history.md:1438,1619`, `queue.md:5`, `orchestrator-state.md:393`, `plan.md:678,2418`, and old briefs and reviews (M4, O10c, O46, O5, H3, Q58, S4, S3a, M8, D49, D65, Q125, S3). These are ledger records of past states and the step's own booking. The change does not make them false as records, and they are the orchestrator's files.

Findings: none.

## 2. The step line

The line is `plan.md:678`, and it matches the brief's quote word for word.

- "`config/catalogs/meta.yml` is removed": item 1.
- "with its shape (`data/shapes/catalog-files/meta.ts`": item 2, with Decision 1 moving `nestingFileShape` to `file-nesting.ts`. That new path follows from removing `meta.ts`, because the nesting shape has to live somewhere. It does not widen the line.
- "its row in `data/shapes/catalog-files.ts`": item 3.
- "every line naming it": items 5 (`desc_meta`) and 6 (`.prettierignore`).
- "(the config-folder test rows": item 4.
- "the diagrams)": item 7.
- "no code reads its title or its subtitle", "the window title is the text catalog's `app.title`" and "its subtitle ... is false": these are the reasons for the step, with no requirement needed. They are served by the premises and by C4.
- The tags (defect, ruling O49 to O63 by agents, ruling Parallel order): authority and order only, with no requirement needed.

Items that do not name where they come from (Axel's words, a ruling or the step's line):
- What to build, item 2: "with a head comment that names only `config/catalogs/file-nesting.yml`". It comes from the head-comment rule of `spec.md`, "What every package obeys", which is not named.
- What to build, item 4: "Nothing else in the file changes".
- What to build, the sentence "No key is introduced, so no empty, duplicated or colliding case arises" (from `spec.md`, not named).
- Cases C1 to C5: none names a source.
- Verify 1, 2, 5, 6 and 7: each comes from `spec.md` ("Token discipline", "The principles every package is judged on", "What every package obeys"), and none names its section. Verify 3 names "The ASCII gate of spec.md". Verify 4 refers to C1 and C5.
- Decision 1 names the step line.

Findings, inside the step's line: the unsourced items listed above. Each can cite its `spec.md` section or the step line.

## 3. Premises

- The step's line: `grep -n '^- O58 ' plan.md` prints line 678 with the text the brief quotes. Matches.
- `meta.yml` is five lines: `cat -n config/catalogs/meta.yml` prints the comment, a blank line, `meta:`, `title: 'Oculus'` and the subtitle. Matches.
- The name grep: the brief's `git grep -n 'meta\.yml\|metaFileShape\|catalogs/meta\|meta\.ts' -- ':!config/local.yml' ':!.scratch'` prints exactly the brief's list: `.prettierignore:12`, `writes.dot` lines 579, 586, 651, 656, 657, 659 and 660, `writes.svg` lines 2207 to 2479, `catalog-files.ts:19,64`, `meta.ts:1,8,9`, and `config-folder.test.ts:194,324`. Matches.
- `desc_meta`: `git grep -n 'desc_meta'` prints only `config/text/views/system/workbench.yml:26` with the quoted value. Matches.
- The description key: `grep -n` shows `descriptionKey` at `config-files.ts:114` with its `settings.desc_` return at `:116`. Matches.
- The description test: the brief places 'writes one description for every config file and none for a file that is not there' at `config-folder.test.ts:380-396`. `grep -n "writes one description"` prints line 381, and the test ends at 398. Small mismatch.
- The shapes in `meta.ts`: `cat -n` shows `metaFileShape` at 8-17 (doc comment at 8) and `nestingFileShape` at 19-34. `grep -n nestingFileShape catalog-files.ts` prints `:19` and `:50`. The head comment at lines 1-3 names both files. `git grep -n "catalog-files/meta" -- src tests utils` prints only `catalog-files.ts:19`. Matches.
- No reader: the brief's reader grep prints the file, its shape, `desc_meta`, the test row `config-folder.test.ts:194`, CSS `meta` classes, comments, `Catalogue.svelte:251-253` (a local `subtitle` const) and `tests/server/edit/writes-collection.test.ts:136` (`['meta']` of a collection). None reads the config key `meta`, so the conclusion matches. The brief's summary of the hits leaves out the test row and the Catalogue code, which is a small imprecision.
- The tab title: `sed -n '95,104p' src/hooks.server.ts` shows `html.replace('%oculus.title%', t('app.title'))` at line 102. Matches.
- No hub sets the key: `grep -rln --exclude=local.yml -E '^meta:'` in the hub's `.oculus` prints `data/literature/radar.yml` and `data/academic/leads.yml`. Matches.
- "no line of `README.md`, `DESIGN.md` or `CLAUDE.md`": `ls *.md` in the oculus root prints `AGENTS.md CLAUDE.md README.md`, and `git ls-files | grep -i '^design'` prints nothing. `DESIGN.md` does not exist. The conclusion holds; the file named does not.
- `guarded.md` does not name the file: `grep -n 'meta\.yml\|catalogs/meta\|metaFileShape' guarded.md` gives no hit. Matches.
- `guarded.md` G12 and G13: line 356 names `config-folder.test.ts` under G12 and G13, and line 188 names "the whole-file shapes: `tests/checks/config/config-folder.test.ts`, 'words a part of %s its shape refuses'". The `text/views/system/status.yml` row is at `config-folder.test.ts:340-345`. Matches.
- The base copy is said to be made at preparation: `ls .agents/worktrees/` prints `migration-O59 migration-O59-base`. Nothing for O58 exists yet. This is consistent with "made at preparation", so it cannot be checked yet.
- No ADR folder and no glossary: `ls docs/adr` and `ls docs/glossary.md` both print "No such file or directory". `grep -n standards orchestrator-state.md` prints `standards: [.scratch/migration/agents/spec.md]` at lines 6 and 11. Matches.

Findings, inside the step's line:
- The description test's lines are 381-398, not 380-396.
- `DESIGN.md` does not exist in the repository.
- The reader-grep summary leaves out the test row and the `Catalogue.svelte` code hits.

## 4. Cases and checks

- C1 breaks `spec.md` "Where you work": "You never run a git command, read-only ones included". C1, its first run and Verify 4 all ask the builder to run `git grep`.
  - A replacement the builder may run is `grep -rn 'meta\.yml\|metaFileShape\|catalogs/meta\|catalog-files/meta\|catalog&#45;files/meta\|desc_meta' --exclude=local.yml src tests utils bin config docs README.md CLAUDE.md .prettierignore`. It names folders so that `node_modules`, `.svelte-kit` and build output are not searched.
  - C1's sentence "before it, it printed the lines above" is also wrong. Run on the unchanged tree, C1's own pattern prints 17 lines. Of `writes.svg` it prints only line 2215, whose title holds `metaFileShape`. The other `writes.svg` lines 2207-2479 that the brief lists come only from the premise grep's `meta\.ts`.
- C2 is consistent with `spec.md`.
- C3 is consistent with `spec.md`.
- C4 asks the builder to check places the step does not change: `src/hooks.server.ts:102` and the text catalog's `app.title`. Its expected value is also wrong. It says the tab title "stays "Oculus"", but `config/text/app.yml:303` reads `title: oculus`, under `text: app:` (lines 2-3). The tab title is `oculus`, in lower case.
- C5 is consistent with `spec.md` (its vacuity is under check 5).
- Verify 7, "This step adds no test, and the report says so in one line", is inconsistent with `spec.md` "What every package obeys": "The report quotes, for each test the step adds or changes, its failing line on the unchanged tree. A step that adds or changes no test says so in one line."
  - The step changes two tests: 'holds exactly the expected top-level keys, and no more' (its `EXPECTED` loses line 194) and 'words a part of %s its shape refuses' (loses line 324).
  - On the unchanged tree, the first fails with the extra key `meta`. The second has no failing line, and the report should say so.
- Verify 1 runs only `config-folder.test.ts`. That is inconsistent with the `spec.md` test rule "A step whose change touches an entry's code runs that entry's test".
  - `catalog-files.ts` is on G13's Code line (`guarded.md:187`). G13's whole-file-shape test also includes `tests/data/sources/config/catalog/options.test.ts`, 'names a key an entry does not take, and leaves a control to optionFindings' (`guarded.md:188`). That test reaches the `options` row of `CATALOG_FILES` through `fileShapeOf`.
  - `tests/tiers/quick.mjs:37` has `RELATED_DEPTH = 2`, and `grep -n "options.test" tests/tiers/essential.txt` prints nothing. So `npm run test:quick` probably does not run it; that is not verified by a run.
  - The brief should name `npx vitest run tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts`.

Findings, inside the step's line:
- C1 uses `git grep`, which the builder may not run.
- C1's "printed the lines above" does not match its own pattern.
- C4 checks unchanged places and expects "Oculus" where the value is `oculus`.
- Verify 7 omits the failing-line quote for the two changed tests.
- Verify 1 omits G13's `options.test.ts`.

## 5. The question

- C1: yes, it could pass without the goal being reached, in two ways.
  - No line of `config/catalogs/meta.yml` matches its pattern (its unchanged-tree run lists no line of that file), so C1 does not see whether the file exists.
  - It does not match the `writes.svg` nodes written `catalog&#45;files/meta.ts` (lines 2207-2213 and 2453-2479). Only line 2215, through `metaFileShape`, would be caught.
  - Fix: add `test ! -e config/catalogs/meta.yml && test ! -e src/lib/data/shapes/catalog-files/meta.ts` and the pattern `catalog&#45;files/meta`.
- C2 alone: yes, it passes on the unchanged tree. Once items 4 and 5 are made it cannot pass while the file remains. 'holds exactly the expected top-level keys' would fail on `meta`, and 'writes one description ...' would fail on a file without a description (`config-folder.test.ts:357-363` and `381-398`). It works as a goal check together with items 4 and 5.
- C3: yes. It guards the nesting shape and does not check that `meta.ts` is gone. It is a regression guard, and C1 carries the goal.
- C4: yes. It holds on the unchanged tree and is a guard, with the wrong expected value noted under check 4.
- C5: yes, for `writes.svg`. `grep -c 'catalog-files/meta' docs/diagrams/*` on the unchanged tree already prints `docs/diagrams/writes.svg:0`, because the SVG writes the hyphen as `&#45;`. Only `writes.dot:7` makes it bite. Fix: grep `'catalog-files/meta\|catalog&#45;files/meta'`.
- The check on the step's line: the line names no check of its own. C1 together with C2 serves it, with the gaps above.
- Item 1 (`meta.yml` deleted): no. C2 fails while the file exists once items 4 and 5 are made.
- Item 2 (`metaFileShape` and `meta.ts` gone): no, mostly.
  - C1 catches the import, the comment and the export.
  - A `meta.ts` left in place, rewritten and unimported, would be caught by Verify 5: its `nestingFileShape` export would have no importer, giving a new `unused-exports` line. It would also show in the `diff -rq` table.
- Item 3 (the row): no. C1 catches `catalogs/meta` and `metaFileShape`.
- Item 4 (the test rows): no. C1 catches `catalogs/meta.yml`, and C2 fails on row 324 left in, because `fileShapeOf` gives no shape once the `CATALOG_FILES` row is gone.
- Item 5 (`desc_meta`): no. C1 and C2.
- Item 6 (`.prettierignore`): no for the name, since C1 catches `meta\.yml` at line 12. The requirement that the paragraph "says the rest as it says it now" is checked only by reading.
  - Once `meta.yml` is out, that sentence names `icons.yml` alone as formatted. `catalogs/agents.yml`, `catalogs/file-nesting.yml`, `catalogs/latex.yml`, `options/*.yml` and `text/**` are formatted too: they are absent from the ignore list at `.prettierignore:15-26`.
  - The sentence is incomplete today and the change does not make it false. A requirement to complete the list goes beyond the line, so this is marked "widens the step".
- Item 7 (the diagrams): no. C1 catches `writes.svg:2215` and C5 catches `writes.dot`, so a stale SVG would still be seen.

Findings:
- C1 does not see the file's existence or the `&#45;` SVG nodes (inside the step's line).
- C5 is vacuous for `writes.svg` (inside the step's line).
- C3 and C4 are guards that pass without the goal. That is acceptable as long as C1 is repaired.
- The `.prettierignore` sentence's incompleteness ("widens the step").

## 6. Implied inputs

This is a code step. The implied inputs are:

- A hub's `.oculus/config.yml`, or a workspace's `settings:`, that sets `meta`. `meta` is not in `HUB_LIST` (`src/lib/data/helpers/hub-names.ts:329-354`). The hub grep for `^meta:` finds only collection files, and `grep -rn ... 'meta(\.title|\.subtitle|:)' workspaces config.yml` prints nothing. This has not happened, and the outcome is the same before and after. Not needed.
- A saved layout or a local-history copy naming `config/catalogs/meta.yml`. `grep -rl --exclude=local.yml 'catalogs/meta' ~/.oculus` prints nothing. Not happened.
- The editor's schema for the file. It is built in memory from `CATALOG_FILES` (`src/lib/data/sources/config/catalog/schemas/engine.ts:193-194`) and leaves with the row. Nothing is written to disk. Not needed.
- The Settings view listing. It is built from the folder listing (`src/lib/state/system/config/groups.ts:177-193`, `describedAs`). It is covered by "What it must do" and by the report's before-and-after.
- A stale untracked `config/catalogs/meta.yml` in an engine folder. It would merge with no shape and no finding. Git removes the tracked file on update and nothing reads `meta`, so it has not happened and a wrong answer costs nothing.

Findings: none.

## 7. ADRs

- The configuration names no `adr` key. `ls docs/adr` prints "No such file or directory", so there is no record.

Findings: none.

## 8. Dictated text

- The brief dictates no text for a file.
- Item 2 ("a head comment that names only `config/catalogs/file-nesting.yml`") and item 6 ("no longer names `meta.yml` and says the rest as it says it now") say what text must say without giving its words, so they are not dictated.
- The one passage of given words is in the Report section: "the Settings view listed `catalogs/meta.yml` with the description "The tool identity: the title and the subtitle the window carries." and lists it no more."
  - `grep -n 'lists it no more' .scratch/migration/agents/briefs/O58.md` prints line 124.
  - It holds against `spec.md` "The working rules that bind every package" (Prose): it is ASCII (`LC_ALL=C grep -n '[^ -~]'` over the brief exits 1), with no em dash and no 'not X but Y'. The history-word ban of "What every package obeys" covers comments and test titles, and this line is neither.

Findings: none.

## Declined to judge

- Whether `npm run test:quick` would select `options.test.ts`. Only `RELATED_DEPTH = 2` and the essential list were read, and no run was made, since this check changes nothing and runs no suite.
- The brief's report location `.scratch/migration/agents/reviews/O58-report.md` against `spec.md` "Where you work" ("You never edit anything under `.scratch/`"). The location comes from the spec skill's brief template (`templates/brief.md:44,95`) and is shared by every brief, so it is the skill's convention and not this brief's defect.
- Whether O58 and O62, which both write `tests/checks/config/config-folder.test.ts` (O58 lines 194 and 324, O62 line 220), merge simply. The ruling "Parallel order" gives that judgment to the orchestrator under `shared_paths`.
- Whether the ruling "Brief check scope" would let the `.prettierignore` sentence be completed inside the brief. That is Axel's call, and it is marked "widens the step" above.

Agent usage: a27ff5fa5d0557791, claude-opus-5-5, 177807 tokens, 59 tool uses, 8 min 26 s.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

Each finding is closed by a change to `agents/briefs/O58.md`, inside the step's line (ruling Brief check scope).

1. The step line, items, cases and Verify items with no source: item 2's head comment, item 4's "Nothing else", the no-key sentence, C1 to C4 and Verify 1 to 7 now each name their source, the step's line, Decision 1 or the section of `spec.md`.
2. Premises, the description test's lines: 381-398.
3. Premises, `DESIGN.md`: the premise names `README.md` and `CLAUDE.md` and says `DESIGN.md` does not exist, with the `ls` that shows it.
4. Premises, the reader grep's summary: it now names the test row `config-folder.test.ts:194`, the `Catalogue.svelte:251-253` constant and the collection `['meta']` of `writes-collection.test.ts:136`.
5. Cases and checks, C1's `git grep`: C1 is now a `grep -rn --exclude=local.yml` over the named folders and files, with `catalog&#45;files/meta` in the pattern, and a `test ! -e` of the two files; its "before" sentence says what the unchanged tree prints.
6. Cases and checks, C4 checking unchanged places and expecting "Oculus": C4 is removed; "What it must do" names the tab title as `t('app.title')`, `oculus`; the former C5 is C4.
7. Cases and checks, Verify 7 against `spec.md`'s rule on a changed test: "Cases" has the builder remove row 194 alone first, run the test and quote its failing line, and say that row 324 has none; Verify 7 asks for both.
8. Cases and checks, Verify 1 without G13's `options.test.ts`: Verify 1 runs `config-folder.test.ts` and `tests/data/sources/config/catalog/options.test.ts`.
9. The question, C1 blind to the file's existence and the SVG nodes: closed with finding 5.
10. The question, C5 (now C4) vacuous for `writes.svg`: its grep has `catalog&#45;files/meta`.
11. The question, the `.prettierignore` sentence incomplete (marked "widens the step"): judged inside the step's line, since item 6 already rewrites that one sentence because it names `meta.yml`, and `spec.md` asks a comment the step edits to be true; the sentence is written as the rule that the files the list does not name are formatted, in the same lines 10-14, with no path added. Told to Axel as such.
12. Cases and checks, C3 and C4 as guards: C3 stays as the guard of Decision 1; C4 removed with finding 6.
13. Dictated text: none added after the check; item 6 quotes the sentence it rewrites and dictates no new words.
