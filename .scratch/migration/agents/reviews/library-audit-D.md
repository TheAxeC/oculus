Library audit, auditor D: `src/lib/state/` (every subfolder)

Read only. I edited no file, ran no git command and installed nothing. Every library fact below comes from `npm view <pkg> --json` (version, license, the release date of that version from `time[version]`, maintainers, peerDependencies, dependency count), from a page fetched in this run, or from reading `node_modules` / unpkg type files. Anything I did not check is marked "not checked". Every removal figure is an estimate and is marked as one.

## Enumeration

Commands, run from `tools/oculus` on main and from `.agents/worktrees/X3b/tools/oculus`:

```
find src/lib/state -type f | sort   # main: 120 files; X3b worktree: 121 files
sort -u main.txt x3b.txt            # union: 128 files
```

How main and X3b differ:
- **In X3b only (8 files, all audited):** `sources/repositories/{diff-patch,diff-rows,diff-words,file-git,graph-lanes,merge-regions,repositories.svelte,repositories}.ts`.
- **On main only:** `life/accounts.svelte.ts`, `life/accounts.ts`, `sessions/agents.svelte.ts`, `sessions/composer.ts`, `shared/stores/post.ts`. These were added to main after X3b branched, so I audited main's copy.
- **Two files named in the X3b list do not exist in X3b:** `sources/repositories.svelte.ts` and `sources/repositories.ts`. X3b moved them to `sources/repositories/repositories.svelte.ts` and `sources/repositories/repositories.ts`, and I audited them there. Their main copies are still listed in the table.

The table has 128 rows. I checked it against the enumeration with `diff mapped.txt all.txt`, which printed `ALL-MAPPED`.

---

## A. Workbench layout model (pages, panes, tabs, splits, persistence, migration)

**What oculus has:** 3,699 lines. That is `workbench/layout.svelte.ts` plus `layout/**` (3,128 lines together), `navigation/arrangement.ts` (80), `navigation/pages.ts` (94) and `workbench/ui.svelte.ts` (397).
- A typed tree `Split | Pane | PageLeaf` with pure rewrites in `tree.ts`: open, close, move, insert, split, resize, fold, expand, normaliseSizes.
- `folded` children that keep their share of the split.
- Maximise/focus (`workbench.ts`).
- Preview tabs (`open/preview.ts`).
- Several named pages, and page leaves that show one page inside another, with loop and "drawn once" refusals (`nested.ts`).
- Rail-bound pages, open-away, and attention (which pane or instance the reader last acted in).
- A versioned localStorage envelope, currently v4, that still reads v3 (two trees plus a dock) and v2 (one workbench), plus a legacy `PREVIOUS_KEY` import (`saved/saved.ts`, `saved/storage.ts`).
- Invariant checks (`checkLayout`/`checkPages`, about 230 lines).
- The per-instance state blob in `ui.svelte.ts`.

**Candidates:**
- **dockview** 8.3.1: MIT, released 2026-09-10, maintainer mathuo, no peers, 1 dependency (dockview-core).
  - Covers: vanilla TypeScript use; the README lists "Serialization / deserialization with full layout management", split, grid and dockable views, tab and group drag and drop, popout windows, floating groups, edge groups and themeability.
  - Svelte: no official Svelte binding. The only one is `dockview-svelte` 1.0.2 (MIT, released 2026-09-11, a single maintainer "eeddow", 4 versions, peer `svelte ^5.0.0`). Vanilla `DockviewComponent` with `createComponent` could mount views through Svelte 5 `mount()`.
  - Does not cover: page leaves (one page embedded in another, the same page shown in several places, loop refusal), multiple saved pages bound to rail keys, oculus's v2/v3/v4 envelope migration, or the per-instance state in the ui store. Preview tabs and fold-to-edge with a remembered share: not checked.
  - Layer rules: dockview owns the DOM, so it also replaces `shell/panes/*`, which is not my part.
  - Theming: through its own theme object and CSS; whether its variables can be mapped to `tokens.css` is not checked.
  - Estimate: removes about 1,200 of the 3,699 lines (tree ops, maximise, most of the drag drop sink, part of the checks). It adds glue for pages, page leaves, envelope migration and state.
- **golden-layout** 2.6.0: MIT, released 2022-09-26, nothing released since. Stale.
- **flexlayout-react** 0.11.0: MIT, released 2026-09-11, peer `react ^18 || ^19`. Unusable without React.
- **@lumino/widgets** 2.9.0: BSD-3-Clause, released 2026-07-03, JupyterLab maintainers, 11 dependencies. It is a whole widget system with its own DOM ownership. Page leaves are not covered.
- **paneforge** 1.0.2 (MIT, 2025-08-02, huntabyte, peer `svelte ^5.29.0`) and **svelte-splitpanes** 8.0.12 (MIT, 2025-11-25, peer `svelte ^5.43.0`): resizable splits only, no tabs or model. They would cover only `resize`/sash sizing, which is shell work.

**Options:**
1. Keep. Pros: page leaves, fold semantics and preview tabs are exactly what oculus defines; the model is pure and tested; no DOM ownership conflict. Con: about 3,700 lines to maintain.
2. dockview. Pros: drag, split and serialisation maintained elsewhere; floating and popout come free. Cons: no Svelte binding from the maintainer; the page-leaf feature must be rebuilt on top; saved-layout migration must be rewritten; the shell is replaced too.

**Recommendation: keep.** No candidate models nested pages (a page shown inside another page, never twice on a screen), which DESIGN.md "Layout as data" makes a rule. Dockview is the only live option, and it would still need about 2,500 lines (estimate) of oculus glue around it.

## B. Drag and drop (`workbench/drag.svelte.ts`, 340 lines)

**What oculus has:** pointer-driven drag of tabs, pages and views with a 6 px arming threshold, document listeners installed only while a drag is live, `edgeAt` (which edge of a rect a point is near), index adjustment, and a sink so tests can watch drops.

**Candidates:**
- **@atlaskit/pragmatic-drag-and-drop** 4.0.0: Apache-2.0, released 2026-09-24, Atlassian, 3 dependencies. Native HTML5 drag and drop; its hitbox add-on for closest-edge detection is not checked.
- **svelte-dnd-action** 0.9.79: MIT, released 2026-08-21, single maintainer, peer `svelte >=3.23.0 || ^5.0.0-next.0`. It is list reordering, not cross-pane edge drops.

**Options:**
1. Keep. Pros: fits the layout sink; one drag at a time.
2. Pragmatic dnd. Pros: native drag and drop is what VS Code's tab drag uses (not checked here). Cons: the ghost, threshold and sink must be rebuilt as adapters.

Estimate for pragmatic dnd: removes about 120 lines of listener code.

**Recommendation: keep.** The saving is small, and the edge and index rules stay either way.

## C. WebSocket client (`client/socket.svelte.ts` 271, `client/entities.svelte.ts` 103)

**What oculus has:**
- Reconnect with doubling backoff from 250 ms to 5 s.
- The subscription replayed on reconnect, carrying the write token.
- A deliberate choice not to queue sends while down, so keystrokes never land in the wrong pane.
- Per-channel listeners for `pty:`.
- Config catalog install, with a push dropped when it is at or below the seeded version.
- Per-channel version dedupe that resets after a reconnect.

**Candidates:**
- **partysocket** 1.3.0: MIT, released 2026-06-23, Cloudflare, 1 dependency, optional peer `react >=17`.
- **reconnecting-websocket** 4.4.0: MIT, released 2020-02-07. Stale.
- **sockette** 2.0.6: last modified 2022-06-26. Stale.

These cover only open, close and backoff, about 40 lines (estimate). Whether partysocket can switch off queueing is not checked. The subscription, version and config rules are oculus's protocol.

**Recommendation: keep.** The reconnect is about 40 lines; the rest is the wire protocol DESIGN.md defines.

## D. Fetch-and-hold stores (the query-cache capability)

**What oculus has:** about 2,700 lines across 11 on-demand caches: `sources/files.svelte.ts`, `system/docs.svelte.ts`, `system/deposit.svelte.ts`, `sessions/latex.svelte.ts`, `sessions/changes.svelte.ts`, `life/memories.svelte.ts`, `sessions/transcript.svelte.ts`, `sources/fs.svelte.ts` (881), `sources/fs-transport.ts`, `sessions/agents.svelte.ts`, `sources/search.svelte.ts`. Command stores sit beside them: `life/accounts.svelte.ts`, `life/calendar.svelte.ts`, `feeds/inbox.svelte.ts`, `system/hpc.svelte.ts`, `system/usage-refresh.svelte.ts`. Nearly every one repeats the same pattern (`files.svelte.ts:52-150` is the clearest):
- keyed cache
- an in-flight set to dedupe requests
- a fetch deferred to a microtask so it never writes inside a `$derived`
- stale when a channel version or "round" moves
- keep showing the old answer while refetching (`otherForm` in `fs.svelte.ts`)
- loading and error state
- a guard for server-side rendering

`client/writes.svelte.ts` (465) and `shared/stores/post.ts` (38) are two POST clients side by side: `writes` has timeout, stale-token retry and notification; `postCommand` has none of these.

**Candidates:**
- **@tanstack/svelte-query** 6.3.0: MIT, released 2026-09-26, TanStack, peer `svelte ^5.25.0`, which oculus's `^5.56.1` satisfies.
  - The docs page read in this run confirms Svelte 5 runes (options passed as a function) and an SSR and SvelteKit section.
  - Query keys, `invalidateQueries`, `staleTime`, dedupe, keep-previous-data and `setQueryData` belong to TanStack Query core; the Svelte page read did not confirm them.
  - Fit: a `QueryClient` built in `createClientState` and passed through context satisfies the no-globals rule. A socket message on channel X becomes `invalidateQueries([X])`. `createMutation` covers the command stores.
  - Estimate: removes about 1,000 of the 2,700 lines. The URL builders, answer readers and the root/round bookkeeping of `fs.svelte.ts` stay.
- **sswr** 2.2.0: MIT, released 2025-03-04, no peers listed. Smaller, and its runes support is not checked.

**Options:**
1. Keep. Pro: no new model. Con: the same cache logic eleven times over.
2. TanStack svelte-query. Pros: one cache, dedupe and invalidation implementation, maintained. Cons: tests that hand stores fakes need a QueryClient; new dependency.

**Recommendation: adopt @tanstack/svelte-query for the D caches and command stores.** The pattern it replaces is repeated eleven times, and its invalidation maps directly onto the channel-version rule. Separately from any library, `post.ts` should be folded into `writes.svelte.ts`'s `exchange` so there is one POST client.

## E. Form state, drafts, validation (`forms/*`, 1,025 lines)

**What oculus has:** drafts kept per view instance in the ui store under `<id>#forms`, keyed by collection and entry. Dirtiness is decided through the save's own rule (`sameSaved`). There is a raw JSON field parser, a manifest draft, and a schema read from `config/catalogs/manifest-schema.yml`.

**Candidates:**
- **sveltekit-superforms** 2.30.2: MIT, released 2026-07-04, single maintainer, peers include `@sveltejs/kit 1.x || 2.x` and many optional validators. Built around SvelteKit form actions.
- **felte** 1.3.0: MIT, released 2024-10-29, single maintainer.

Neither stores drafts in per-instance workbench state, and neither reads a form schema from YAML config.

**Recommendation: keep.** The drafts-per-tab persistence and the save-equivalence rule are the feature, and both candidates lack them.

## F. Runtime shape checks of saved and wire data (cross-cutting)

**What oculus has:** hand `typeof` guards in about 40 files (`grep -c` counts, highest: `boards/collection.ts` 13, `sources/fs.ts` 11, `forms/form-values.ts` 9). `saved.ts`'s layout invariants are about 230 lines. `isRecord` is redefined 5 times (`form-drafts.svelte.ts:84`, `form-values.ts:63`, `appearance.ts:55`, `tones.ts:34`, `layout/model.ts:98`), although `data/helpers/guards.ts:16` `isMap` is the same function.

**Candidates:**
- **valibot** 1.5.0: MIT, released 2026-09-09, peer `typescript >=5`.
- **zod** 4.6.5: MIT, released 2026-09-13, no peers.

Both would replace field-by-field guards. They would not replace semantic invariants such as sizes summing to 1 or page loops.

**Recommendation: no library in the state layer alone.** It pays off only if `data/model` types are derived from schemas, which is the data-layer auditor's decision. The 5 copies of `isRecord` should be replaced by `isMap` now, whatever is decided.

## G. Command palette and filter matching

**What oculus has:**
- `workbench/palette.ts` (196): `match()` is a case-insensitive substring AND-match with title hits ranked first, about 15 lines. There is no fuzzy match and no highlight ranges.
- Substring filters in: `sources/files.svelte.ts:22`, `sources/datasets.ts:51`, `sources/venues.ts:142`, `boards/collection.ts:387`, `sessions/folds.ts:129`, `system/audit.ts:35`, `sources/fs.ts:591`, and X3b `status.ts` `languageChoices`.
- VS Code's Quick Open, Go to File and language picker are fuzzy with the matched characters highlighted, so the palette does not match VS Code today.

**Candidates:**
- **fuzzysort** 4.0.2: MIT, released 2026-08-13, single maintainer, 0 dependencies. From its GitHub page: multiple keys, `highlight()`, threshold, limit, space-separated multi-word queries, TypeScript types, ESM.
- **@leeoniya/ufuzzy** 1.0.19: MIT, released 2025-08-22. Out-of-order multi-term matching, `highlight()`, optional typo tolerance, types.
- **fuse.js** 7.5.0: Apache-2.0, released 2026-07-13. Features not fetched in this run.
- **match-sorter** 8.3.0: MIT, released 2026-04-15, 2 dependencies. Features not fetched.
- **fzf** 0.5.2: BSD-3-Clause, released 2023-04-25. Stale.

**Options:**
1. Keep substring matching. Pro: no dependency. Con: short of VS Code's behaviour.
2. fuzzysort for the palette, the file finder and the language picker. Pros: fuzzy matching with highlights, as VS Code does. Cons: new dependency; ranking will not equal VS Code's own scorer.

**Recommendation: adopt fuzzysort** for the palette, `matchingFiles` and `languageChoices`, because the VS Code surfaces require fuzzy matching with highlights. The data-view search boxes can stay substring matches but should share one helper instead of seven copies. Estimate: removes about 20 lines and adds about 30 lines of highlight glue in the views.

## H. Diff, word diff, patch building, merge regions (X3b, 735 lines)

**What oculus has:**
- `diff-words.ts` (132): a hand Myers diff (`common`) with a 2,000-edit cap, plus word tokenising and word diff.
- `diff-rows.ts` (295): a unified-diff parser that keeps the raw head lines, hunk cutting with 3 context lines, folds, side-by-side rows, partners, and next/previous change.
- `diff-patch.ts` (76): builds a patch for one hunk or for the selected lines of a hunk, for stage, unstage and revert.
- `merge-regions.ts` (232): three-way regions using `common` against the base, choices, and pieces the reader can type into.

**Candidates:**
- **diff (jsdiff)** 9.0.0: BSD-3-Clause, released 2026-04-13, maintainers kpdecker and explodingcabbage, 0 dependencies, no peers. From its GitHub page:
  - Offers `diffArrays`, `diffWords`, `diffWordsWithSpace`, `diffLines`, `structuredPatch`, `parsePatch` (reads git extended headers into flags), `formatPatch`, `applyPatch`, `reversePatch`, and the `maxEditLength` and `timeout` options.
  - Has no three-way merge.
  - Replaces `common()` and `wordDiff`, and most of `parseDiff`.
  - Does not cover partial-hunk selection, the recount start lines, folds or side-by-side rows.
- **node-diff3** 3.2.1: MIT, released 2026-06-03, single maintainer (bhousel), 0 dependencies, ships `src/diff3.d.ts`. Its types (unpkg) show:
  - `diff3MergeRegions(a, o, b)`, returning stable and unstable regions with starts and lengths per buffer;
  - `diff3Merge`, returning `ok`/`conflict` blocks with `aIndex`/`oIndex`/`bIndex`.
  - Replaces `regionsOf`, about 90 lines. `chosenLines`, the pieces and `typedPieces` stay.
- **@codemirror/merge** 6.12.2: MIT, released 2026-06-09, maintainer marijn, 5 dependencies. The unpkg `index.d.ts` exports `diff`, `presentableDiff`, `Chunk`, `MergeView`, `unifiedMergeView`, `goToNextChunk`/`goToPreviousChunk`, `acceptChunk`/`rejectChunk` and `uncollapseUnchanged`. It is two-way only; no three-way export exists. It is useful only if the editor becomes CodeMirror, which is a views decision.
- **diff-match-patch** 1.0.5: last release 2020-05-20. **@sanity/diff-match-patch** 3.2.1: released 2026-09-21. Both are character-level diffs, a poorer fit for line and word arrays.
- **parse-diff** 0.12.0 (MIT, 2026-04-17) and **gitdiff-parser** 0.3.1 (MIT, 2023-03-14): not read further. jsdiff's `parsePatch` covers the same ground.
- **monaco-editor** 0.57.0: MIT, released 2026-09-24, Microsoft. It would give VS Code's own diff editor. Whether it exposes VS Code's three-way merge editor is not checked. Adopting it is a views and editor decision.

**Options:**
1. Keep. Pro: already written and tested. Con: a hand Myers diff and diff3 to maintain.
2. jsdiff for Myers, word diff and diff parsing, plus node-diff3 for merge regions. Pros: both are maintained, typed and dependency-free. Con: two new dependencies, and alignment on ambiguous diffs may differ from today's.
3. Monaco for the diff and merge surfaces. Pro: closest to VS Code. Con: replaces the editor in views; outside this part.

**Recommendation: option 2.** Estimate: removes about 280 of the 735 lines (Myers about 70, word diff about 30, `parseDiff` about 90, `regionsOf` about 90). What stays is `hunksOf`/`foldsOf`/`sideRows`/`partnersOf`, the partial patch builder and the typed-pieces model, which no candidate has.

## I. Git graph lanes (X3b `graph-lanes.ts`, 75 lines)

**Candidates:**
- **@gitgraph/js** 1.4.0: released 2021-03-06. Its GitHub page says it is archived ("This project has been unmaintained since 2019 ... the project is now archived", archived Jul 13, 2024), and it builds graphs from API calls rather than from a `git log` commit list.
- An `npm search` for "git graph lanes" and "commit graph layout" found only general graph layout packages (dagre, elkjs), which do not lay out commits in lanes.

**Recommendation: keep.** It is 75 lines and no maintained library exists.

## J. Editor text model (`navigation/editor-text.ts` 113, X3b `editor-status.svelte.ts` 109, X3b `sessions/source.svelte.ts` 366)

**What oculus has:** indent detection, line-ending detection and conversion, indent conversion, the caret, the textarea draft, and the status bar bridge.

**Candidates:**
- **detect-indent** 7.0.2: MIT, released 2025-09-16, sindresorhus, 0 dependencies. Replaces about 35 lines of `detectIndent`.
- **monaco-editor** 0.57.0 (facts in H) or **@codemirror/view** 6.43.13 (MIT, released 2026-09-22) would own caret, EOL and indentation, and remove most of `editor-text.ts`. That choice belongs to the views auditor (the editor is `views/sources/source/Editor.svelte`). Monaco's theming against CSS tokens is not checked.

**Recommendation: keep the state half.** Adding detect-indent saves about 35 lines (estimate) and does not follow VS Code's indent guessing either. The real decision is the editor component, which sits in the views part.

## K. highlight.js used only in part (a finding: a library already in `package.json`)

`shared/words/languages.ts` registers 19 languages. `sources/fs.ts:86-104` keeps its own extension-to-language table of 35 extensions. A check run in this audit (`node -e` over `hljs.getLanguage(ext)` with the same 18 languages registered) printed: `resolved by hljs aliases 24 not 11`. The 11 that highlight.js does not resolve are `.ipynb .slurm .bib .sty .cls .svelte .el .scm .mli .m .jl`.

**Recommendation:** have `languageOf` ask `hljs.getLanguage(ext)` first and keep an override table of the 11. Estimate: removes about 15 lines. Language display names stay in the catalog, since VS Code's wording (for example "Shell Script") differs from highlight.js's `name` ("Bash").

## L. Path handling

**What oculus has:**
- `fs.ts`: `normalisePath`, `extensionOf`, `nameOf`, `childPath`, `absoluteOf`, `rootHolding`.
- `format.ts`: `basename`, `relativeTo`, `elide`.
- X3b `file-git.ts`: `bare`, `under`, `wholePath`, `repoOfFile`, `tabOfFile`.
- X3b `status.ts`: `repoStatus`, which repeats the "deepest repository folder holding the path" rule.
- `selectors.svelte.ts`: `inside`.

`nameOf` and `basename` are the same function, and the "deepest holding root" rule is written three times.

**Candidate:** **pathe** 2.0.3: MIT, released 2025-02-11, maintainers pi0 and danielroe (UnJS), 0 dependencies. It is already in `node_modules` at 2.0.3 as a dependency of vitest and rolldown, but it is not a direct dependency. It covers normalize, join, basename, extname and relative. It does not cover the deepest-holding-root rule or the served-root keys.

**Recommendation:** first gather the duplicates into one client-safe helper under `data/helpers`. pathe is optional after that; it saves about 30 lines (estimate).

## M. Date handling and relative time

**Duplicates found:**
- Local `YYYY-MM-DD` formatting is written 4 times: `data/helpers/dates.ts:5` `localDate`, `life/calendar.ts:22` `localDay`, `life/notes.ts:47` `stamp`, and in `format.ts` `stamp`.
- "Ago" is written twice: `sessions/folds.ts:196` and X3b `file-git.ts:79`.
- UTC-day arithmetic appears in `boards/board/presets.ts:241-262` and `feeds/linkedin.ts:52-89`.
- English month abbreviations are hard-coded in `boards/ticker.ts:441-458`.

**Candidates:**
- **date-fns** 4.4.0: MIT, released 2026-05-29, 0 dependencies.
- **dayjs** 1.11.23: MIT, released 2026-08-17, 0 dependencies.
- **@js-temporal/polyfill** 0.5.1: ISC, released 2025-03-31.

Their English words would bypass the text catalog, so only the arithmetic (for example `differenceInCalendarDays`) and `format` would be used.

**Recommendation: keep; consolidate the duplicates onto `data/helpers/dates.ts`,** and make one `ago` that returns a count and unit, with words taken from the catalog. A library removes about 40 lines (estimate), and the catalog rule stops it from supplying the words.

## N. Text catalogs / i18n (`shared/words/*`, `text.ts` 115)

**What oculus has:** a single-locale catalog pushed live from `config/text/` over the socket, `t()` that throws on a missing key, positional `{0}` filled by `data/helpers/finding-text.ts`, and a redraw driven by the generation rune.

**Candidates:**
- **i18next** 26.4.2: MIT, released 2026-09-03, peer `typescript ^5 || ^6 || ^7`.
- **@inlang/paraglide-js** 2.25.4: MIT, released 2026-09-17, peers `vite >=5`, `typescript >=5.6`. It compiles messages at build time, which conflicts with catalogs reloaded live from config.
- **svelte-i18n** 4.0.1: MIT, released 2024-10-21, 7 dependencies.
- **intl-messageformat** 12.1.2: BSD-3-Clause, released 2026-09-19, 2 dependencies. ICU plural and select.

**Recommendation: keep `t()`.** The catalog lookup is about 20 lines and is live-pushed by design.

**Defect found (a spec violation, not a library question):** `system/hpc.svelte.ts:33` passes a literal `'s'` as a plural suffix, `value.running === 1 ? '' : 's'`, which is a user-facing literal string. Fix it with a catalog key per count form. intl-messageformat is worth adding only if more plural sites appear.

## O. Force-directed graph layout (`boards/structure/graph.ts`, about 336 of 786 lines)

**What oculus has:** a seeded PRNG, ring placement, a force tick (repulsion, collision, links, centre, damping), crossing count, a layout score, best-of-N starts, and a random parameter search whose tuned result is saved per Map instance.

**Candidates:**
- **d3-force** 3.0.0: ISC, released 2021-06-05, maintainers mbostock and recifs, 3 dependencies. It replaces `physics`/`settle`, about 90 lines (estimate), with `forceManyBody`, `forceLink`, `forceCollide` and `forceCenter`. It does not cover crossings, the score or the tuning search.
- **@viz-js/viz** 3.30.0: MIT, released 2026-09-01, single maintainer (mdaines). It is already in `devDependencies` and is used only by `bin/diagrams/diagrams.mjs`. Graphviz neato/fdp could place the Map deterministically with no tuning search. That would move it to `dependencies` and run it as WebAssembly in the page; whether that works in the page is not checked.

**Options:**
1. Keep.
2. d3-force for the simulation, keeping the score and tuning.
3. viz-js neato/fdp, dropping the score and tuning (about 330 lines, estimate).

**Recommendation: option 3 is worth a trial,** because the dependency is already in the tree and it removes the whole hand-written layout search. If the trial layouts look worse, fall back to option 2.

## P and Q (not library questions here)

- **P. Keyboard chords:** the chord layer is in `shell/keys/*`, which is not my part. The state side is only the chord ordering in `navigation/catalogue.ts`.
- **Q. Undo and history:** the client only sends `{kind:'undo'}` (`writes.svelte.ts:325`) and lists the log (`sessions/changes.svelte.ts`). The undo itself is server-side, so no client undo library applies.

## Domain-logic capabilities (no library covers them)

- `boards/**`: board presets, facets, stats, Focus lanes, ticker, career, person joins, Pillars and Domains. This is portfolio rules.
- `feeds/**`: Inbox, Leads, Lit Watch and LinkedIn grouping and cadence. Feed rules.
- `life/**`: agenda grouping, notes naming, deck model, Slides state, Memories refusals, connector account rules.
- `sessions/composer.ts`, `folds.ts`, `hooks.ts`, `terminals.svelte.ts`, `view-source.ts`: session trees, the composer record, the hooks block, the PTY protocol.
- `system/audit*`, `config-files.ts`, `hpc.ts`, `usage.ts`: audit and usage folds.
- `client/context.ts`, `use.ts`, `instance-context.ts`, `selectors.svelte.ts`, `clock.svelte.ts`, `shared/stores/shapes.ts`: store wiring, Svelte context and joins.
- `workbench/navigation/registry.ts`, `rail.ts`, `catalogue.ts`, `notices.svelte.ts`, `notice-sources.ts`, X3b `status.ts`; `rail-badges*`; `selection.svelte.ts`: view registry, rail, notifications, status words.
- X3b `sources/repositories/repositories.ts` and `repositories.svelte.ts` (and main's pre-move copies), `search.ts`: git command rules and URL builders. Git and ripgrep run server-side.

## Coverage table (128 files; paths under `src/lib/state/`; the "read" column says which tree I read)

Capability letters: A layout model, B drag and drop, C websocket, D fetch cache or command client, E forms, F shape checks, G matching, H diff, I graph lanes, J editor text, K highlight.js map, L paths, M dates, N catalogs, O force layout, Q undo.

| file | lines | read | capability |
|---|---|---|---|
| boards/board/facets.ts | 107 | main | Domain: board facets |
| boards/board/filter-menu.ts | 134 | main | Domain: board filter menu |
| boards/board/index.ts | 56 | main | Domain: board facade |
| boards/board/items.ts | 194 | main | Domain: board items (date formatting, see M) |
| boards/board/presets.ts | 374 | main | Domain: board presets (day arithmetic, see M) |
| boards/board/state.ts | 83 | main | Domain: board saved state |
| boards/board/stats.ts | 160 | main | Domain: board statistics |
| boards/career.ts | 98 | main | Domain: career panel |
| boards/collection.ts | 815 | main | Domain: collection cards (substring filter, see G) |
| boards/focus-lanes.ts | 194 | main | Domain: Focus lanes |
| boards/focus.ts | 357 | main | Domain: Focus board |
| boards/person.ts | 78 | main | Domain: person join |
| boards/project-context.ts | 39 | main | Domain: project context text |
| boards/structure/graph.ts | 786 | main | O Force layout (Map) + domain graph build |
| boards/structure/lines.ts | 175 | main | Domain: Pillars/Domains joins |
| boards/ticker.ts | 616 | main | Domain: deadline ticker (month arithmetic, see M) |
| boards/waiting.ts | 26 | main | Domain: waiting-on words |
| client/clock.svelte.ts | 45 | main | Domain: minute clock rune |
| client/context.ts | 279 | X3b | Domain: store wiring |
| client/entities.svelte.ts | 103 | main | C WebSocket client (per-channel versions) |
| client/instance-context.ts | 27 | main | Domain: Svelte context key |
| client/selectors.svelte.ts | 491 | main | Domain: joins |
| client/socket.svelte.ts | 271 | main | C WebSocket client |
| client/use.ts | 26 | main | Domain: Svelte context access |
| client/writes.svelte.ts | 465 | main | D HTTP command client |
| feeds/feeds.svelte.ts | 20 | main | Domain: feed reader |
| feeds/feeds.ts | 135 | main | Domain: attention lines |
| feeds/idents.ts | 53 | main | Domain: feed identity |
| feeds/inbox.svelte.ts | 100 | main | D fetch/command store (Inbox) |
| feeds/inbox.ts | 146 | main | Domain: Inbox grouping (filter, see G) |
| feeds/leads.ts | 181 | main | Domain: Leads (filter, see G) |
| feeds/linkedin.ts | 146 | main | Domain: LinkedIn cadence (dates, see M) |
| feeds/radar.ts | 144 | main | Domain: Lit Watch (filter, see G) |
| forms/form-drafts.svelte.ts | 551 | main | E Form drafts |
| forms/form-values.ts | 112 | main | E Form values |
| forms/manifest-draft.ts | 119 | main | E Form drafts (manifest) |
| forms/open-forms.ts | 23 | main | E Open forms state |
| forms/schema.ts | 220 | main | E Form schema from config |
| life/accounts.svelte.ts | 229 | main | D fetch/command store (accounts) |
| life/accounts.ts | 44 | main | Domain: connector account rules |
| life/calendar.svelte.ts | 71 | main | D fetch/command store (Calendar) |
| life/calendar.ts | 69 | main | Domain: agenda grouping (local day, see M) |
| life/memories.svelte.ts | 146 | main | D fetch cache (Memories) |
| life/memories.ts | 63 | main | Domain: Memories refusals |
| life/notes.ts | 122 | main | Domain: notes naming (dates, see M) |
| life/present.svelte.ts | 92 | main | Domain: deck derived |
| life/present.ts | 407 | main | Domain: deck model |
| life/slides.ts | 144 | main | Domain: Slides state |
| sessions/agents.svelte.ts | 157 | main | D fetch cache (agents) |
| sessions/changes.svelte.ts | 164 | main | D fetch cache (change log); Q undo is server-side |
| sessions/composer.ts | 259 | main | Domain: composer record |
| sessions/folds.ts | 273 | main | Domain: session folds (ago, see M; filter, see G) |
| sessions/hooks.ts | 33 | main | Domain: hooks block |
| sessions/latex.svelte.ts | 240 | main | D fetch cache (LaTeX) |
| sessions/source.svelte.ts | 366 | X3b | J Editor text model (source draft) |
| sessions/terminals.svelte.ts | 540 | main | Domain: PTY terminals (xterm is in views) |
| sessions/transcript.svelte.ts | 218 | main | D fetch cache (transcript) |
| sessions/view-source.ts | 68 | main | Domain: view to hub file |
| shared/stores/post.ts | 38 | main | D HTTP command client |
| shared/stores/shapes.ts | 192 | main | Domain: store types |
| shared/words/appearance.ts | 205 | main | N Text catalogs (appearance words) |
| shared/words/format.ts | 123 | main | L Path handling + M Dates |
| shared/words/generation.svelte.ts | 36 | main | N Text catalogs (generation rune) |
| shared/words/glyphmode.svelte.ts | 28 | main | N Text catalogs (glyph mode) |
| shared/words/languages.ts | 89 | main | K highlight.js registration |
| shared/words/text.ts | 115 | main | N Text catalogs (t()) |
| shared/words/themes.ts | 63 | main | N Text catalogs (theme words) |
| shared/words/tones.ts | 233 | main | N Text catalogs (tones) |
| sources/datasets.ts | 83 | main | Domain: datasets (filter, see G) |
| sources/files.svelte.ts | 154 | main | D fetch cache (project files) + G filter |
| sources/fs-transport.ts | 265 | main | D fetch cache (file browser transport) |
| sources/fs.svelte.ts | 881 | main | D fetch cache (file browser) |
| sources/fs.ts | 896 | main | L Path handling + K language map + domain tree rows |
| sources/repositories.svelte.ts | 162 | main | Moved by X3b to repositories/repositories.svelte.ts; audited there (Domain: git commands) |
| sources/repositories.ts | 281 | main | Moved by X3b to repositories/repositories.ts; audited there (Domain) |
| sources/repositories/diff-patch.ts | 76 | X3b | H Diff/patch/merge (patch building) |
| sources/repositories/diff-rows.ts | 295 | X3b | H Diff/patch/merge (unified diff parse, hunks, folds) |
| sources/repositories/diff-words.ts | 132 | X3b | H Diff/patch/merge (Myers, word diff) |
| sources/repositories/file-git.ts | 152 | X3b | L Path handling + M relative time + domain gutter marks |
| sources/repositories/graph-lanes.ts | 75 | X3b | I Git graph lanes |
| sources/repositories/merge-regions.ts | 232 | X3b | H Diff/patch/merge (three-way regions) |
| sources/repositories/repositories.svelte.ts | 359 | X3b | Domain: git command store |
| sources/repositories/repositories.ts | 465 | X3b | Domain: Source Control view rules |
| sources/search.svelte.ts | 117 | main | D fetch cache (Search) |
| sources/search.ts | 147 | main | Domain: search state (ripgrep is server-side) |
| sources/venues.ts | 176 | main | Domain: venues (filter, see G) |
| system/audit.svelte.ts | 60 | main | Domain: audit findings split |
| system/audit.ts | 42 | main | Domain: audit (filter, see G) |
| system/config-files.ts | 56 | main | Domain: config file list |
| system/deposit.svelte.ts | 128 | main | D fetch cache (deposit) |
| system/docs.svelte.ts | 292 | main | D fetch cache (documents) |
| system/hpc.svelte.ts | 62 | main | D command store (HPC); hand plural, see N |
| system/hpc.ts | 69 | main | Domain: HPC words |
| system/usage-refresh.svelte.ts | 70 | main | D command store (usage refresh) |
| system/usage.ts | 70 | main | Domain: usage folds (dates, see M) |
| workbench/drag.svelte.ts | 340 | main | B Drag and drop |
| workbench/layout.svelte.ts | 552 | main | A Workbench layout model (store, persistence) |
| workbench/layout/access.ts | 40 | main | A Workbench layout model |
| workbench/layout/index.ts | 100 | main | A Workbench layout model (facade) |
| workbench/layout/instance.ts | 163 | main | A Workbench layout model |
| workbench/layout/instances.ts | 349 | main | A Workbench layout model |
| workbench/layout/model.ts | 157 | main | A Workbench layout model (types, versions) |
| workbench/layout/nested.ts | 236 | main | A Workbench layout model (page leaves) |
| workbench/layout/open/attention.ts | 155 | main | A Workbench layout model |
| workbench/layout/open/away.ts | 88 | main | A Workbench layout model |
| workbench/layout/open/opening.ts | 164 | main | A Workbench layout model |
| workbench/layout/open/preview.ts | 60 | main | A Workbench layout model (preview tabs) |
| workbench/layout/open/show-in-files.ts | 50 | main | A Workbench layout model |
| workbench/layout/saved/saved.ts | 425 | main | A Workbench layout model (check, parse, migrate) + F |
| workbench/layout/saved/storage.ts | 78 | main | A Workbench layout model (localStorage) |
| workbench/layout/tree.ts | 438 | main | A Workbench layout model (tree ops) |
| workbench/layout/workbench.ts | 73 | main | A Workbench layout model (maximise) |
| workbench/navigation/arrangement.ts | 80 | main | A Workbench layout model (config arrangements) |
| workbench/navigation/catalogue.ts | 272 | main | Domain: view catalogue (chord order; chords are in shell/) |
| workbench/navigation/editor-status.svelte.ts | 109 | X3b | J Editor text model (status bridge) |
| workbench/navigation/editor-text.ts | 113 | main | J Editor text model (indent, EOL, caret) |
| workbench/navigation/notice-sources.ts | 252 | main | Domain: notification sources |
| workbench/navigation/notices.svelte.ts | 97 | main | Domain: notifications store |
| workbench/navigation/pages.ts | 94 | main | A Workbench layout model (page names, close rules) |
| workbench/navigation/rail.ts | 120 | main | Domain: rail pages |
| workbench/navigation/registry.ts | 203 | main | Domain: view registry |
| workbench/navigation/status.ts | 293 | X3b | Domain: status bar words (path rule, see L; filter, see G) |
| workbench/palette-source.svelte.ts | 45 | main | G Palette source adapter |
| workbench/palette.ts | 196 | main | G Palette index and matching |
| workbench/rail-badges.svelte.ts | 265 | main | Domain: rail badges |
| workbench/rail-badges.ts | 105 | main | Domain: rail badge counts |
| workbench/selection.svelte.ts | 63 | main | Domain: current session |
| workbench/ui.svelte.ts | 397 | main | A Layout persistence (ui store, per-instance state, versioned key) |
