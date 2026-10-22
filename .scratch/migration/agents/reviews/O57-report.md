# O57 report

Everything in the brief is done. One judgment call departs from the brief's text: `chatContext` reads the hub's collection keys through the entry's `from: collections` source rather than through `collectionFiles`. The brief's way would pull a server-only module into the page's bundle. The reasons are in "Judgment calls", item 1, and the orchestrator may reverse it.

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md` lines 207-211)

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.
```

## The cases' first run (unchanged `src` and `config`, new and changed tests in place)

Commands:

- `npx vitest run tests/routes/sessions/terminal-actions.test.ts -t "chat action" --reporter=verbose`: `Tests  13 failed | 20 skipped (33)`.
- `npx vitest run tests/data/sources/config/settings.test.ts -t chatContext`: `Tests  12 failed | 74 skipped (86)`.

The paths below shorten the scratch folders: `<W>` is the row's `oculus-chat-world-*` folder and `<T>` is `oculus-task-route-*`.

- C1 (G120 row 1, three hubs, portfolio chat): failed. The index read, without its empty lines: `# .oculus/data/research/venues.yml (venue catalogue)`, `planted: hub/.oculus/data/research/venues.yml`, `# PROJECT MANIFESTS (status/venue source of truth)`, `## projects/active/alpha`, `planted: hub/projects/active/alpha/project.yml`, `# .oculus/data/academic/funding.yml`, `planted: hub/...funding.yml`, `# .oculus/data/academic/events.yml`, `planted: hub/...events.yml`. That is alpha alone, with no file of `other` or `third`, as the brief says.
- C2 (row 3, each hub's own `chat_context`): failed. Received `# PROJECT MANIFESTS ...`, `# .oculus/data/academic/funding.yml`, `planted: hub/...funding.yml`, `# .oculus/data/academic/events.yml`, `planted: hub/...events.yml`. The hub's `chat_context` was not applied, since the key was outside the hub list, and `other` was absent.
- C3 (row 4, the feed `leads`): failed. Received `[ "# PROJECT MANIFESTS (status/venue source of truth)" ]`.
- C4 (`chatContext` row `[funding, nosuch]`): failed with `"threw": "(0 , __vite_ssr_import_2__.chatContext) is not a function"`. All 11 table rows and the loadConfig case failed this way, since the import is missing.
- C5 (the case 'reads a hub whose collections list leaves out tasks, and finds a number written there', first half): failed, same import failure.
- C6 (the same case's second half, and the table row `3`): failed, same import failure.
- C7 (row 2, project chat of beta in C1's workspace): failed. Received `# .oculus/data/research/venues.yml (venue catalogue)`, `planted: other/.oculus/data/research/venues.yml`, `# PROJECT MANIFESTS ...`, `## projects/active/beta`, `planted: other/...`, `# .oculus/data/academic/events.yml`, `planted: other/...events.yml`. The venue catalogue was read from `other`'s folder under the primary's paths, as the brief says.
- C8: `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/templates.test.ts tests/routes/sessions/terminal-actions.test.ts --reporter=dot` passed before any change: `Test Files  3 passed (3)`, `Tests  55 passed | 2 skipped (57)`.
- C9: the same run passed before any change. By reading, `tests/checks/config/templates.test.ts:62-65` compares the template's keys with `hubKeys()`: `const shown = templateKeys(templateBlock(PAGE, '## config.yml')); expect(keyDifference(hubKeys(), shown)).toEqual({ missing: [], extra: [] });`.
- C10 (G35 chat case): failed at its first changed assertion. `AssertionError: expected '# .oculus/data/research/venues.yml (v...' to contain '# HUB hub: <T>/hub'`, and the index it received held `# PROJECT MANIFESTS (status/venue source of truth)` and `## projects/active/alpha`. The changed instruction assertions come after that line, so the run did not reach them. Their words were absent from the unchanged catalog: `grep -c "This chat runs in the hub whose folder is\|whose section lists it\|unless it is absolute" config/text/server.yml` printed `0`.
- C11 (row 5, a non-hub folder's project): failed only on the format. Received `# PROJECT MANIFESTS ...`, `## projects/active/alpha`, `planted: hub/...`, `## <W>/tool`, `planted: tool/project.yml`. The project was already under its absolute folder.
- C12 (row 6, the empty hub): failed. Received alpha only, with no `# HUB third` heading.
- C13 (row 7, the primary not first): failed. Received alpha only, with nothing of `other`.
- C14 (table row `[funding, funding]`: import failure; row 8 of the index table): failed. Received `# PROJECT MANIFESTS ...`, `# .oculus/data/academic/funding.yml`, `planted: hub/...funding.yml`.
- C15 (table row `[]`: import failure; row 9 of the index table): failed. Received the manifests heading plus hub's `funding.yml` and `events.yml`.
- C16 (row 10, `other`'s settings file does not read): failed on the index. Received `[ "# PROJECT MANIFESTS (status/venue source of truth)" ]`. The run did not reach the row's finding assertion.
- C17 (row 11, no primary, project chat of beta): failed. Received `# .oculus/data/research/venues.yml (venue catalogue)`, `planted: other/.oculus/data/research/venues.yml`, `# PROJECT MANIFESTS ...`, `## projects/active/beta`, `planted: other/...`, `## <W>/tool`, `planted: tool/project.yml`. That is `other`'s venue file under the engine's paths, nothing of `hub`, and the folder's project mixed in with no section of its own.
- C18 (reading): `src/lib/data/sources/config/catalog/schemas/engine.ts:83-90`. `optionSource` answers a source from `configItems(source, config.merged)`, which is the primary's merged map, since `engineSchemas(raw, config)` (`engine.ts:179-182`) is given the primary's config. The schema `hub-config` (`engine.ts:211-214`) carries `rule: { hub: [HUB_FILE] }`, so every hub's `.oculus/config.yml` gets the primary's collection keys for `from: collections`, as it gets the primary's lists for `slurm.resource`. No change was made there.
- C19 (row 12, `chat_context: [venues]`): failed. Received the venue catalogue at the head, then `# PROJECT MANIFESTS ...` and nothing else.

No case was one the brief's rules get wrong.

## DONE / NOT DONE

| Item | State | Proof (command, last line of the final run) |
|---|---|---|
| 1 `chat_context` in `HUB_LIST` after `collections`, doc names it | DONE | `src/lib/data/helpers/hub-names.ts:333`; `grep -c "^    { key:" src/lib/data/helpers/hub-names.ts` printed `25` |
| 1 defaults key with comment | DONE | `config/defaults/sources.yml:48-49` |
| 1 option entry (sources, Collections, multi, from: collections, help) | DONE | `config/options/sources.yml:59-64` |
| 1 `EXPECTED` row | DONE | `tests/checks/config/config-folder.test.ts:198`; C8 run below |
| 1 template key | DONE | `docs/templates.md:86-87`; C9 run below |
| 2 `chatContext` reader, by kind, no throw over any list, problem on wrong kind, default read | DONE | `src/lib/data/sources/config/settings/files.ts:164`; `npx vitest run tests/data/sources/config/settings.test.ts -t chatContext --reporter=verbose`: `Tests  12 passed \| 74 skipped (86)` |
| 2 listed in `PROBLEM_READERS`, exported from `config.ts` | DONE | `problems.ts:15,47`, `config.ts:75`; C6's `settingProblems(wrongMap)` assertion in the same run |
| 2 head comment of `files.ts` names it | DONE | `files.ts:1-7` |
| 3 `portfolioContext` over `allHubs`, primary first, sections, no-primary closing section, `COLLECTION_ORDER` gone | DONE | `src/lib/server/machine/pty/start/context.ts:80`; the G120 run below |
| 4 `startChat` writes the index from `open`, the merged config and `hubSettings`; `primaryConfig` import gone; `hubSettings` doc | DONE | `chat.ts:123`, `chat.ts:41-44`; the G120 row C7 |
| 5 `chat_instruction` two sentences reworded, rest word for word | DONE | `config/text/server.yml:57`; `python3 -c "import yaml; ..."` printed `parses`; G35 run below |
| 6 HELP.md:103 | DONE | `docs/HELP.md:103` |
| 6 data-map block lists every `hubKeys()` key with count | DONE | `grep -c "^[a-z_.]*: *#" docs/data-map.md` printed `25`; the sentence reads "may set these 25 keys" |
| 7 G120 table case, 12 rows (C1-C3, C7, C11-C17, C19) | DONE | `npx vitest run tests/routes/sessions/terminal-actions.test.ts -t "chat action" --reporter=verbose`: `Tests  13 passed \| 20 skipped (33)` |
| 7 G35 chat case changed assertions | DONE | same run, `starts a focused interactive Claude terminal and writes its private index first 49ms` |
| 7 G13 row of `chatContext` | DONE | settings run above |
| Verify 1, the brief's test files | DONE | `npx vitest run tests/routes/sessions/terminal-actions.test.ts ... tests/checks/config/templates.test.ts --reporter=dot`: `Test Files  16 passed (16)`, `Tests  214 passed \| 2 skipped (216)` |
| Verify 2, `npm run format`, `npm run diagrams && npm run test:quick` once | DONE, over its time limit | `test:quick: 125.7 s (limit 45.0 s); every command passed`, `test:quick: over the time limit` (load average 13.54 by `uptime`) |
| Verify 3, ASCII gate over every changed file | DONE | the perl gate printed nothing, `ascii-gate-exit 0` |
| Verify 4, unused exports | DONE | `diff <base>/unused-exports.txt <after>` printed nothing, `unused-diff-exit 0` |
| Verify 5, edits to existing assertions | DONE | table below |
| Verify 6, each new or changed assertion red first, then green | DONE | first-run section above; runs above |
| Verify 7, `wc -l` of changed source files | DONE | file table below, every source file at or under 880 |

The verify list (`npm run test:quick`) ran once. No whole-suite command ran.

The lines of the verify-list run, from its log:

```
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (22.1 s)
ok      svelte-check (67.0 s): 1792686659756 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (122.3 s): Duration  100.22s (transform 161.92s, setup 0ms, import 258.26s, tests 126.19s, environment 3.86s)
test:quick: 125.7 s (limit 45.0 s); every command passed
test:quick: over the time limit
```

The test:quick selection does not cover `tests/checks`; its log says `tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks`. That file and `templates.test.ts` passed in the verify-1 run above.

### Edits to existing assertions (`diff <base copy> <worktree>` of each changed test file)

| File | Before | After |
|---|---|---|
| terminal-actions.test.ts:531 | `expect(readFileSync(index, 'utf8')).toContain('## projects/active/alpha');` | `const written = readFileSync(index, 'utf8');` `expect(written).toContain(`# HUB hub: ${task.chatHub}\n`);` `expect(written).toContain('\n### projects/active/alpha\n');` |
| terminal-actions.test.ts:544 | ``expect(system).toContain(`The hub root is \`${task.chatHub}\``);`` | ``expect(system).toContain(`This chat runs in the hub whose folder is \`${task.chatHub}\`.`);`` plus `toContain("every folder in a section is relative to that hub's folder unless it is absolute")` and `toContain('against the folder of the hub whose section lists it')` |
| config-folder.test.ts:197 | (none) | `'chat_context',` added after `'collections',` in `EXPECTED` |
| settings.test.ts:11 | `import { describe, expect, it } from 'vitest';` | `import { describe, expect } from 'vitest';` `import { it, plantScratch } from '../../../fixtures/scratch.ts';` |
| settings.test.ts:48-50 | `const SCAN_DEPTH = (loadConfig(engineDir()).config.options as ...)['sources.yml'].repository_scan_depth;` | `const SOURCES = (...)['sources.yml'];` `const SCAN_DEPTH = SOURCES.repository_scan_depth;` (the same value) |

Every other line in these files is added. No threshold, tolerance or allow list changed.

## Files (`diff -rq` of src tests utils config docs against `migration-O57-base`, `wc -l` before and after)

| File | Before | After |
|---|---|---|
| src/lib/data/helpers/hub-names.ts | 434 | 435 |
| src/lib/data/sources/config/settings/files.ts | 135 | 197 |
| src/lib/data/sources/config/settings/problems.ts | 67 | 69 |
| src/lib/data/sources/config.ts | 90 | 91 |
| src/lib/server/machine/pty/start/chat.ts | 142 | 140 |
| src/lib/server/machine/pty/start/context.ts | 44 | 103 |
| tests/checks/config/config-folder.test.ts | 807 | 808 |
| tests/data/sources/config/settings.test.ts | 778 | 852 |
| tests/routes/sessions/terminal-actions.test.ts | 578 | 812 |
| tests/routes/sessions/terminal-fixture.ts | 276 | 342 |
| config/defaults/sources.yml | 107 | 110 |
| config/options/sources.yml | 112 | 118 |
| config/text/server.yml | 538 | 538 |
| docs/HELP.md | 546 | 546 |
| docs/data-map.md | 209 | 219 |
| docs/templates.md | 1311 | 1314 |
| docs/diagrams/layers.dot, .svg; layer-data.dot, .svg; layer-server.dot, .svg | same | same (edge counts by `npm run diagrams`: server to data 500 to 503, data/sources to data/helpers 60 to 61, server/machine to server/files 28 to 27, server/machine to layer data 182 to 185) |

Every path is on the write list. The shared files changed only inside their ranges (`diff` hunks: chat.ts `16d15`, `44c43`, `124,125c123`; hub-names.ts `322,327c322,327`, `332a333`; config.ts `74a75`; defaults/sources.yml `47a48,49`, `48a51`; options/sources.yml `58a59,64`; server.yml `57c57`; config-folder.test.ts `197a198`; templates.md `85a86,88`; data-map.md within 80-103; HELP.md `103c103`).

The history-word grep over every added line (`diff <base> <file> | grep "^>"`, then `grep -iE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O57|20[0-9][0-9]-"`) has two hits. `files.ts` "before the config channel's first message" is the head comment's existing phrase about timing, carried by the rewrap. `server.yml` "before reading its README.md" is the instruction's unchanged order of steps. Neither compares with an earlier state.

The grep for the name before adding it (`grep -rn "chat_context\|chatContext" src config docs tests`) printed nothing on the unchanged tree. After the change it hits only the paths above.

## The index of C1's workspace as the changed code writes it

The non-empty lines are those the passing row 1 asserts (`terminal-actions.test.ts`, `threeHubLines`). The empty lines come from `parts.join('\n')` in `context.ts:102`, where every part ends in a newline. The scratch folder is written `<W>`:

```
# .oculus/data/research/venues.yml (venue catalogue)
planted: hub/.oculus/data/research/venues.yml

# HUB hub: <W>/hub

## PROJECT MANIFESTS (status/venue source of truth)

### projects/active/alpha
planted: hub/projects/active/alpha/project.yml

## .oculus/data/academic/funding.yml
planted: hub/.oculus/data/academic/funding.yml

## .oculus/data/academic/events.yml
planted: hub/.oculus/data/academic/events.yml

# HUB other: <W>/other

## PROJECT MANIFESTS (status/venue source of truth)

### projects/active/beta
planted: other/projects/active/beta/project.yml

## .oculus/data/academic/events.yml
planted: other/.oculus/data/academic/events.yml

# HUB third: <W>/third

## PROJECT MANIFESTS (status/venue source of truth)

### projects/active/gamma
planted: third/projects/active/gamma/project.yml
```

`hub`'s `people.yml` and `other`'s `venues.yml` are planted, and neither is in the index.

## Comments and documents that describe the changed behaviour

- `context.ts` head comment (lines 1-6): rewritten.
- `chat.ts` head comment (lines 1-3): still true.
- `chat.ts` `ChatOptions.hubSettings` doc (lines 41-44): rewritten.
- `chat.ts` comment at lines 100-102 on the chat's working folder: still true.
- `files.ts` head comment (lines 1-7): rewritten.
- `problems.ts` head comment (lines 1-3): still true.
- `config/defaults/sources.yml` head comment (lines 1-6): still true. "The keys from scan to apps_dir are the hub list" still holds, since `chat_context` sits between `collections` and `career_file`.
- `HUB_LIST` doc (`hub-names.ts:316-327`): rewritten to add "which of its records a chat's index holds".
- `portfolioContext` doc (`context.ts:72-79`): rewritten.
- `chat_instruction` (`server.yml:57`): rewritten in its two sentences, the rest word for word.
- `docs/HELP.md:103`: rewritten.
- `docs/data-map.md` "The hub's settings": rewritten.
- `docs/templates.md` config.yml block: `chat_context` added.
- `roots.ts:147` `primaryConfig` doc, "a chat's context": still true, since the index reads it through `allHubs` and, with no primary, for the workspace folders.
- `terminal-fixture.ts` head comment and `terminal-actions.test.ts` head comment: rewritten.
- `settings.test.ts` head comment: rewritten.

## Judgment calls (each reversible)

1. `chatContext` keeps a word when the entry's `from` source holds it, through `sourcedItems(entry, config)`. For `from: collections` that source is `keysOfRows(config.collections)`, the keys of every map row of the list, feeds included. The brief names `collectionFiles` instead, but `files.ts` is imported by the page (`src/lib/state/client/selectors.svelte.ts:39` imports `paintLimit, programApps` from it). `src/lib/data/sources/collections.ts:2` says "Server side only: it reads the filesystem and no client module may import it", and it imports `yaml-file.ts`, which imports `node:fs`. So the brief's way would bring `node:fs` into the client bundle. The two differ only for a `collections:` row that has a key and no string `file`. `chatContext` keeps that key, and the index then adds nothing for it, because `context.ts` looks the file up through `collectionFiles`, which leaves that row out.
2. A hub with no project gets no `## PROJECT MANIFESTS` subheading, so C12's section is its heading alone ("its heading and nothing under it"). A hub with projects gets the subheading, as in the brief's outline.
3. The heading words are `# HUB <name>: <folder>`, `## PROJECT MANIFESTS (status/venue source of truth)`, `### <project folder>` and `## <collection path>`. The no-primary closing section is `# WORKSPACE FOLDERS (no hub)`, and it is written only when it holds at least one project.
4. With no primary, the closing section reads the projects the way the build does with no primary: `primaryConfig(merged, open, settings).repositories` read by `readHubManifests('', [], repositories, text)`, as in `buildFolderProjects` (`src/lib/data/index.ts:547-551`) and `server/root/watch/portfolio.ts:624`.
5. `chatContext` throws `noRule` when the catalog holds no `chat_context` entry, or when the entry's default is of another kind. That matches `settingReader`. `settingProblems` catches it. `startChat` would fail on a merged map with no catalog, and every map the server and `loadConfig` produce holds one.
6. The hubs are deduplicated by key in `orderedHubs` (`context.ts:54`). The workspace reader already makes names unique, so this check only guarantees "each hub once".
7. `docs/data-map.md` lists the keys in `HUB_LIST` order. That moved `portfolio_deck` ahead of `collections` and `new_project_dir` after `chat_context`, against the block's earlier order. The block's existing comments are kept word for word, except for `bookmarks`, `schedules` and `apps_dir`, which are new rows worded as `defaults/sources.yml:64` words them.
8. The test fixture `chatWorld` (`terminal-fixture.ts:239`) parses each hub's settings once per workspace, as the server keeps one parse per hub. Without that, each row parsed a hub's config up to three times (`allHubs`, `readElsewhere`).
9. `settings.test.ts` takes its `it` from `tests/fixtures/scratch.ts`, so that the scratch hubs of the loadConfig case are swept.

## Host- and user-visible changes, before and after

- **Portfolio chat index** (C1's workspace). Before: the primary's venue catalogue, `# PROJECT MANIFESTS` with the primary's projects under `## <folder>`, then the primary's six collection files under `# <path>`, and nothing of any other hub. After: the primary's venue catalogue and pillars, then one `# HUB <name>: <folder>` section per hub with the primary first. Each section holds that hub's projects under `### <folder>` and the files its own `chat_context` names under `## <path>`. The full text is quoted above.
- **Project chat of a project in another hub** (C7). Before: the index read the primary's paths under that other hub's folder, so the venue catalogue came from `other` and only `other`'s projects were listed. After: the same index as the portfolio chat.
- **Settings view**. Open the Settings view on TEST, heading sources, section Collections. A new row `chat_context` should show with the six words `funding, events, education, applications, joint-work, tasks` picked, and its choices are the hub's collection keys, feeds included. Not seen by the builder: no page was run.
- **Chat instruction**. "The hub root is `{0}`; every folder in the portfolio index is relative to this absolute path." became "This chat runs in the hub whose folder is `{0}`. The portfolio index holds one section per hub of the workspace, each headed by the hub's name and its absolute folder; every folder in a section is relative to that hub's folder unless it is absolute." Also, "Resolve its index folder against the absolute hub root before reading ..." became "Resolve its index folder against the folder of the hub whose section lists it before reading ...".
- A hub's `.oculus/config.yml` may set `chat_context`. Before, that key was outside the hub list, so it was a finding and was not applied.

## Doc text

None. G120's Test line names the title the case carries: `it.each(INDEX_ROWS)('writes one section per hub of the workspace into the index', ...)` at `terminal-actions.test.ts:784`.

## Limitations and sharp edges

- `npm run test:quick` took 125.7 s against its 45 s limit, at a load average of 13.54 (`uptime`). Every command passed.
- The G120 rows took 186 ms to 575 ms each in the last verbose run, and the loadConfig case of `chatContext` took 465 ms. Most of that time is `loadConfig` parses: one per hub of a row. The first run on the unchanged tree took 183 ms to 1169 ms per row.
- The index grows with every hub's projects and collection files, with no cap. A workspace of many hubs hands the chat a large file.
- A hub folder path holding a newline would break its heading line. Folder paths are the user's own, and hub names are limited to `[A-Za-z0-9._-]` (`folders.ts` `NAME`).
- `chat_context` is a key of every hub's file, but the editor schema offers the primary's collection keys for it in every hub's file (C18). A non-primary hub whose list differs is offered the primary's words. This is the same behaviour `slurm.resource` has. A word the hub's own list lacks adds nothing to the index.
- A wrong kind of `chat_context` in a non-primary hub is not reported as a finding. The default is read for that hub, as for every other setting of such a hub.

## Wrong or impossible in the brief

- Item 2 says `chatContext` in `files.ts` reads the list "with `collectionFiles`". Doing so would import a server-only module (`collections.ts:2`) into a file the page imports (`selectors.svelte.ts:39`). What was built instead is judgment call 1.
- Nothing else. The premises checked on the tree held: the `context.ts` and `chat.ts` line numbers, `allHubs`' folders already expanded (`open.ts:239-241`, built from `WorkspaceFolder.dir`, documented as "The path with a leading `~` expanded" at `folders.ts:56`), and `READER_FINDINGS` being read only by the primary's config (`grep -rn "sections/findings" src`: `config-checks.ts:33` and `process/context/findings.ts:9`).

## Repair round 1

Every ruling of `agents/briefs/O57-round1.md` is carried out. Files written this round: `src/lib/server/machine/pty/start/context.ts` (101 lines), `tests/routes/sessions/terminal-actions.test.ts` (810), `tests/data/sources/config/settings.test.ts` (863), and this report. `diff -rq` against `migration-O57-base` still lists the same 22 files.

### S1, `chatContext` reads the entry's `from: collections` source

No change. The departure stays as stated in judgment call 1 above.

### P1, the C16 row's own finding assertion

- **Before** (`sed -n 640,650p;745,752p;800,812p` on the round-0 tree): the row type held `unread?: string;` (line 646), the C16 row ended `unread: 'other'` (line 749), and the test ran this block (lines 805-809):

  ```
  if (row.unread !== undefined) {
      const hub = world.at(row.unread);
      const { findings } = world.options.hubSettings(hub);
      expect(findings.map((one) => one.file)).toContain(join(hub, HUB_FILE));
  }
  ```

- **After:**
  - The field, its value and the block are gone. The `HUB_FILE` import that only the block used is gone too.
  - The row table's doc comment (`terminal-actions.test.ts:643-645`) no longer names the unreadable hub.
  - The C16 row keeps its index assertion. `grep -n "HUB_FILE\|unread" tests/routes/sessions/terminal-actions.test.ts` prints nothing.
- **The build's report of the unreadable settings, checked by reading:** `readOtherHub` (`src/lib/data/index.ts:601-622`) returns `findings: [...findings, ...sourcesFindings(...)]`, where `findings` is that of `loaded`, the hub's `loadConfig` parse. So the settings finding of a hub other than the primary reaches the build.

### St1, the dead de-duplication

- **Before** (`sed -n 50,70p context.ts`): `orderedHubs` built `ordered` and returned `ordered.filter(...)` over a `seen` set.
- **After:** `orderedHubs` (`context.ts:53-67`, doc comment included) returns the two disjoint filters of `allHubs` directly. The doc comment keeps "each once".

### St2, one test for `chatContext`

- **Before** (`npx vitest run tests/data/sources/config/settings.test.ts -t chatContext --reporter=verbose`): the describe had 11 table rows of 'answers for %s the keys of the collections list it names, or its default and a problem', plus the separate case 'reads a hub whose collections list leaves out tasks, and finds a number written there' (378ms). The run printed `Tests  12 passed | 74 skipped (86)`.
- **After:** one `it.each` table (`settings.test.ts`, describe 'chatContext').
  - Each row gives the input, a function answering the map, the value, the problems, and whether `settingProblems` of the map holds `chat_context`.
  - The two inputs of the removed case are rows on a map `loadConfig` reads from a planted hub:
    - 'a hub whose list leaves out tasks': the five keys, no problem, `false`.
    - 'a hub whose list leaves out tasks, writing 3': the five keys, `chat_context: words`, `true`.
  - The removed case checked `not.toContain` on the first map and `toContain` on the second; both are now the flag column.
  - The same run printed 13 rows, ending:

    ```
    answers for a hub whose list leaves out tasks the keys of the collections list it names, or its default and a problem 180ms
    answers for a hub whose list leaves out tasks, writing 3 the keys of the collections list it names, or its default and a problem 179ms
          Tests  13 passed | 74 skipped (87)
    ```

### B1, the head files named by their absolute path

- **`context.ts`:**
  - `addFile` takes the file's absolute path and its heading line.
  - `portfolioContext` heads the opening files by `join(primary.hub, registries.venues)` with ` (venue catalogue)`, and by `join(primary.hub, registries.pillars)`.
  - A section's collection files keep `## <hub-relative path>`.
  - The head comment (lines 1-8) says the opening files are headed by their absolute path, so a chat that runs in another hub finds the primary's file.
- **Test:** `venueLines` takes `at` and expects `` `# ${join(at('hub'), VENUES)} (venue catalogue)` ``. The three-hub workspace's `hub` also plants the pillars registry, and `threeHubLines` expects `` `# ${join(at('hub'), PILLARS)}` `` after the venue lines. That gives the pillars heading a row: C1 and C7. C19's row expects the absolute venue heading.
- **Before** (round-0 code, new expectations; `npx vitest run tests/routes/sessions/terminal-actions.test.ts -t "chat action"`): `Tests  3 failed | 10 passed | 20 skipped (33)`. The failing rows were C1, C7 and C19, each on the heading alone. The C7 diff (`<W>` is the row's scratch folder):

  ```
  -   "# <W>/hub/.oculus/data/research/venues.yml (venue catalogue)",
  +   "# .oculus/data/research/venues.yml (venue catalogue)",
  -   "# <W>/hub/.oculus/data/pillars/pillars.yml",
  +   "# .oculus/data/pillars/pillars.yml",
  ```

  C19 differed on the venue line alone.
- **After** (same run, verbose): `Tests  13 passed | 20 skipped (33)`. The 12 G120 rows took 194 ms to 745 ms. C7's row, a project chat of beta in `other`, passes with `# <W>/hub/.oculus/data/research/venues.yml (venue catalogue)`, the primary's folder.
- **The head of C1's index as the code now writes it** (it replaces the first two lines of the index quoted above; the rest is unchanged):

  ```
  # <W>/hub/.oculus/data/research/venues.yml (venue catalogue)
  planted: hub/.oculus/data/research/venues.yml

  # <W>/hub/.oculus/data/pillars/pillars.yml
  planted: hub/.oculus/data/pillars/pillars.yml

  # HUB hub: <W>/hub
  ```

### Verify, after the last change

`npm run format`, then `npm run diagrams && npm run test:quick`:

```
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (13.7 s)
ok      svelte-check (41.4 s): 1792688148180 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (84.0 s): Duration  69.37s (transform 61.34s, setup 0ms, import 129.36s, tests 132.64s, environment 1.56s)
test:quick: 86.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
```

- The run ended at a load average of 9.81 (`uptime`).
- The ASCII gate of `spec.md` over the three changed files printed nothing (`ascii-gate-exit 0`).
- `sh utils/unused-exports.sh` compared with the base list printed nothing (`unused-diff-exit 0`).
- Full-list runs this round: 1. No whole-suite command ran.
