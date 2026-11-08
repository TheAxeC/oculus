# O168 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/O168.md` and its round-0 rulings `agents/briefs/O168-cases.md`, which stay in force except where this file says otherwise. The findings are those of `agents/reviews/O168-refuter.md`; each is numbered here with its ruling. Every ruling stays inside the step's part.

Nothing is written outside the worktree, the session scratchpad included. Backups, logs, case-run programs and temporary folders live in `.agents/scratch/` inside `.agents/worktrees/migration-O168`, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` both set to that folder, and everything there is removed before the report (`agents/spec.md:34`, `:66`, `plan.md` Rulings "Open item 719"). Under that `TMPDIR` some rows of `npm run test:quick` fail for that reason alone (the library rule's refusal of the path, the tmux socket path's length); whether the verify list runs with `TMPDIR` at the system default is open item 725, and until Axel rules on it you run under the rule above and name each such row in the report with the line it printed.

## Rulings

1. **Fold the dirty-tab pair** (refuter, Spec S1; brief item 5). `ui.tab_close_dirty` and `ui.tabs_close_dirty` (`config/text/ui.yml:96`, `:115`) become one plural key `ui.tabs_close_dirty`, a map whose `one` form is the present singular sentence ("Do you want to save the changes to this tab before it closes?", no `{0}`) and whose `other` form is the present plural sentence. `pages.ts:133` and `close-question.svelte.ts:82` read it through the plural helper with the count (1 for the one tab). The tests that read either key (`tests/shell/panes/strip/tab-menu.test.ts`, `tests/shell/panes/strip/app-editor-close.test.ts`) read the folded key, with no expectation's sentence changed. `grep -rn "count === 1 ?" src` then prints only the two name-suffix sites (`audit.ts:73`, `deck/spec.ts:66`).
2. **The nested scrollers keep their strips whole** (refuter, Spec S2 and Behaviour B1; cases ruling C1 (a)). A scroller inside a `Pane` that does not inherit the Pane body's top padding states its own: `Settings.svelte`'s `.list` sets `--pane-pad-top: 0px`, and `Keys.svelte`'s `.view` sets `--pane-pad-top: 8px` (its own padding-top). Then the stuck group strip of Settings and of Keys stands at its scroller's top edge, as on the base. Read every other scroller under a `Pane` that holds a `GroupHead` or a `Table` and give it the same line where its padding differs from the Pane body's; name each one you read with its result in the report. The report's before/after names Settings and Keys: before (the base) the stuck strip at the scroller's top edge; after this round the same.
3. **Every tag the sanitiser does not keep is drawn as written** (refuter, Spec S3; brief item 7, case C9). In `src/lib/ui/html.ts` an inline HTML token whose element the sanitiser does not keep is shown escaped, as the text it was written as, whatever its name: `placeholderTag` and its `document.createElement` test go. Kept markup draws as today; a comment goes to the sanitiser as today. Then `rsync <source> <target>` draws both words in their brackets, `~/data/<data>` draws `<data>`, `<jobid>` draws as written, and `<script>alert(1)</script>` draws as text with no script element (C9; `tests/ui/html.dom.test.ts` asks no `<script` and no `onerror` in the output, and its KaTeX row already expects `&lt;script&gt;`). Add rows to `tests/ui/html.dom.test.ts` for `<source>`, `<data>`, `<time>` and `<title>` inside text, each expecting the escaped text; run them on the step's current tree before the change and quote their failing output.
4. **The tip key follows its label** (refuter, Standards St7; Spec S5's renames are accepted). `recover.fetch_one_title` becomes `recover.fetch_file_title` in `config/text/views/sources/data.yml:46` and `src/lib/views/sources/data/recover/RecoverPlan.svelte:91`.
5. **`repositories.ts` split by concern** (refuter, Proof P1 and Standards St4; `agents/spec.md:48`). `src/lib/state/sources/repositories/repositories.ts` is 885 lines and the step changes it, so it is split in this round to at or under 880. The folder `repositories/` holds ten items (`utils/folder-check.sh` refuses an eleventh), so the part that moves goes to `repositories/diff/` (six items): the diff pane's view state, `diffViewOf` to `sameFiles` with their private helpers (`modeAfter`, `typeWords`, `sameChanges`), lines 199-408, into one new file named for what it holds, with its own head comment; `repositories.ts`'s head comment no longer names what moved, and every importer imports from the new file. The report's sentence that the file is "under its entry in `utils/size-allow.txt`" is removed: that file has no entries (`grep -v '^#' utils/size-allow.txt` prints nothing).
6. **The report says which rows pass on the unchanged tree** (refuter, Proof P2). The rows G130 'words a form outside the six plural forms', G130 'words a plural form of a key oculus holds as a plain text' and G13 'reads a category with no label by its key, with no finding' pass on the base; the report says so with the base run's output and names the behaviour each preserves.
7. **The fallback sentence in `docs/apps.md:310` is made true** (refuter, Standards St1). A form the language does not give is drawn in oculus's English form for that count, then in English `other`: a language that gives only `other` draws English `one` for a count of 1. The sentence says that.
8. **The template and the fixture carry the map label** (refuter, Standards St2 and St3). `docs/templates.md:462` gives its example row a map label (`label: { one: early idea, other: early ideas }`), and `tests/fixtures/hubs/deck-hub.ts:361` gives `publications` a map label (`{ one: publication, other: publications }`), so neither carries a finding.
9. **`PARTS` is no longer exported** (refuter, Standards St5). Drop `export` from `PARTS` in `src/lib/state/system/machine/lsp/clangd/cpp-form.ts:26` and `src/lib/state/system/machine/debug/launch-form.ts:33`; `sh utils/unused-exports.sh` against `.agents/worktrees/O168-base/unused-exports.txt` then adds no line.
10. **One locale lookup** (refuter, Standards St6). `pluralOf` in `src/lib/state/shared/words/text.ts:108` takes the locale through the one lookup `finding-text.ts` uses (`byKey(catalog, LOCALE_ENTRY) ?? ENGLISH`, exported from `finding-text.ts` as one function), so the literal `'en'` and the second copy of the rule go.
11. **Before and after for every change a user sees** (refuter, Behaviour B1 to B4). The report's before/after section gives, each with the base and the result: the Settings and Keys strips (ruling 2); the count-1 marker and provisional findings' signature key, from `audit.msg_markers_one` / `audit.msg_provisional_one` to the folded keys `audit.msg_markers` / `audit.msg_provisional`, so a mute stored under the old signature no longer matches; the waiting count drawn without its glyph; an entry page's long body drawn whole with no clamp.

Spec S4's three paths (`tests/checks/source/catalog-reads.ts`, `src/lib/server/content/audit/rules.ts`, `tests/data/sources/config/catalog/options-schema.test.ts`) are accepted and added at landing. Proof P3 needs nothing. Whether a stored mute matches an old signature (B2) is checked by the orchestrator at landing. One run of the verify list after this round's last change.

## Paths this round writes, beyond the brief's list

- `config/text/ui.yml` lines 96 and 115
- `src/lib/state/workbench/navigation/pages.ts`
- `src/lib/shell/panes/strip/close-question.svelte.ts`
- `tests/shell/panes/strip/tab-menu.test.ts`
- `tests/shell/panes/strip/app-editor-close.test.ts`
- `src/lib/views/system/workbench/Settings.svelte`
- `src/lib/views/system/help/keys/Keys.svelte`, and any other scroller ruling 2 finds, named in the report
- `src/lib/ui/html.ts`
- `tests/ui/html.dom.test.ts`
- `config/text/views/sources/data.yml`
- `src/lib/views/sources/data/recover/RecoverPlan.svelte`
- `src/lib/state/sources/repositories/repositories.ts`, the new file under `src/lib/state/sources/repositories/diff/`, and every importer of what moved, named in the report
- `docs/apps.md`
- `docs/templates.md`
- `tests/fixtures/hubs/deck-hub.ts`
- `src/lib/state/system/machine/lsp/clangd/cpp-form.ts`
- `src/lib/state/system/machine/debug/launch-form.ts`
- `src/lib/state/shared/words/text.ts`
- `src/lib/data/helpers/finding-text.ts`
- `tests/checks/source/catalog-reads.ts`, `src/lib/server/content/audit/rules.ts`, `tests/data/sources/config/catalog/options-schema.test.ts` (S4)

The brief's own list and the round-0 rulings' paths stay. A fix that needs another file is handed back with the reason before the report.

## Cases after the round

- C1 again: by reading for Settings, Keys and every scroller ruling 2 reads, and the look at landing.
- C5 again: the plural helper with the folded dirty-tab key, counts 1 and 3.
- C9 again, with ruling 3's rows.
- Every other case keeps its result; the report says which it ran again.

## Verify

From the worktree root: `npm run diagrams` and `npm run docs:palette`, then `npm run test:quick` prints "every command passed", or each red row is named as the second paragraph above says, or run again alone and its passing output quoted; the ASCII gate over every changed file; `sh utils/unused-exports.sh` against `.agents/worktrees/O168-base/unused-exports.txt` adds no line; `sh utils/folder-check.sh` prints nothing; `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O168.md abebbb552` prints only the brief's paths, the round-0 rulings' and this round's; `grep -rn "count === 1 ?" src` prints only `audit.ts:73` and `deck/spec.ts:66`; `wc -l src/lib/state/sources/repositories/repositories.ts` prints 880 or fewer. The plan's whole verify list runs once, at landing on main.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O168-report.md` in the worktree's copy of the ledger: the first line (anything NOT done, or "Everything in the round is done"), each ruling above by number with what changed (file:line) and the check that shows it, the new rows' failing output before the change and passing output after, the verify lines as printed, every row that failed only under the `TMPDIR` of `.agents/scratch/` with its line, every command of this round that changed a file by a program with the files it changed (this round changes files with the Edit and Write tools only), and the files with line counts.
