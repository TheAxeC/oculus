# O50 round 1: the editor's graph for the workspace file, the missing test rows, one folder lookup, the picker's labels

Rules: `agents/spec.md` and the step's brief `agents/briefs/O50.md` with `agents/briefs/O50-cases.md`, which stay in force except where this file says otherwise. The refuter report is `agents/reviews/O50-refuter.md`; the findings below are its B1, P1, P2, ST2, ST3, B3, SP1, SP2 and B2, each with the ruling to carry out. Its P3 and ST1 change nothing in the code and are not sent.

## What to build

1. **B1, the editor picks the graph the scan belongs to.** `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:91` builds `graphOf(index, scan.file.root)`. A workspace file that lies in a workspace folder other than the primary hub's carries `of` (the primary's root, `build.ts:246`), and `graphOf` holds it in the graph of `of` (`lookup.ts:92-94`). The adapter builds the graph of `scan.of ?? scan.file.root`, so Go to Definition, Find References and Rename on a key in that file resolve against the primary hub's people, domains and clusters. Read every other caller that picks a graph or a root from a scan (`grep -rn "file.root" src/lib/server/machine/lsp src/lib/data/snapshot/references`) and give each the same answer where it chooses a graph.
2. **P1, a test row for `of`.** In the reference index's tests, a row that plants the open workspace file in a workspace folder other than the primary hub's and checks that a rename of the person `settings.self` names rewrites that file, and a row for the editor adapter (item 1): Go to Definition on `self`'s value in that file lands on the primary hub's person. Each seen failing first: the adapter row on the round-0 tree, the rename row with the scan's `of` taken from where the code gives it.
3. **P2, the unsaved workspace through the production path.** The row 'the person the setting self names, and no workspace file for an unsaved workspace' (`rename.test.ts:237-243`) hands the build `null` itself. Replace it with a row that reaches `settingsFileOf` (`src/lib/server/root/watch/portfolio.ts:264`) with an open workspace whose `file` is null, and one whose file lies in a hub that is no folder of the workspace, each giving no workspace file in the index.
4. **ST2, one folder lookup.** `settingsFileOf` repeats `hubNameOf`'s real-path match (`src/lib/server/files/workspace/open.ts:104-108`). Export one function from `open.ts` that answers the workspace folder holding a hub folder (or undefined), use it in `hubNameOf` and in `settingsFileOf`, and quote the reuse grep in the report as `spec.md` asks for every helper and type the step adds (`selfKey`, `ownPeople`, `settingsNode`, `settingsFileOf`, `SelfCheck`, `SettingsFile`, `FileScan.of`).
5. **ST3.** `src/lib/views/boards/person/Person.svelte:206-224`: the two `{#if}` blocks with complementary conditions become one `{#if} ... {:else} ... {/if}`.
6. **B3, every picker item can be told apart.** `ownPeople` (`src/lib/state/system/config/editors/sources.ts:115-124`) draws a person with an empty name under its key and disambiguates only equal names, so `{ key: ada, name: '' }` and `{ key: bob, name: ada }` are both drawn "ada". Draw an item as `name (key)` (`person.named_key`) whenever its words equal the words of any other item, the key of an empty-named person included. A test row for that input, seen failing first.
7. **SP1 and B2, the report.** State what the code does for the key `self` empty, duplicated (two people with one key cannot exist in one file; say what the reader does) and colliding with a key of another hub, and for the Person page's press in flight, after the tab closes, and superseded by a second press. State the editor's before and after in the workspace file: its `settings.self` value and any setting drawn from `domains`, `clusters` or `people` become hub-key links, and a person's, domain's or cluster's Find References and the References view list the workspace file.
8. **SP2.** Quote the self grep of Verify 4 whole, line by line, with the judgment beside each hit.

## Cases (first run on the round-0 tree in the worktree, then after)

1. Item 1: the workspace file in a folder `lab` beside the primary `hub`, `settings: { self: amir }`, Go to Definition on `amir`: before, the graph of `lab` (nothing, or `lab`'s own `amir`); after, the primary's `amir`.
2. Item 2: the rename of `amir` in the primary's people rewrites `settings.self` in that file.
3. Item 3: an unsaved workspace, and a workspace file in a hub outside the folders: no workspace file in the index.
4. Item 6: `{ ada: '' }` and `{ bob: 'ada' }` give "ada (ada)" and "ada (bob)", or words that differ; two people named `Kim` give `Kim (k1)` and `Kim (k2)` as before.

## Paths this round writes

- `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts` and any other caller item 1 finds
- `src/lib/server/files/workspace/open.ts`
- `src/lib/server/root/watch/portfolio.ts`
- `src/lib/views/boards/person/Person.svelte`
- `src/lib/state/system/config/editors/sources.ts`
- the test files of the reference index, the rename, the hub-keys adapter and the settings lists under `tests/`
- `.scratch/migration/agents/reviews/O50-report.md` (the report, a section "Repair round 1" appended)

## Verify before you report

From the worktree root, after the last change, once: `npm run test:quick`. The ASCII gate over the changed files as the brief gives it. The plan's whole verify list runs once, at landing on main.

## Report

Append "Repair round 1" to the report: per item, what changed with the file and line, each case's first run on the round-0 tree before its result, the verify lines quoted, and items 7 and 8 in full.
