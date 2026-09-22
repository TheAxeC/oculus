# Q58 report: the files over the size line split, at most ten items per folder, and the history wording out

Everything in the brief is done; where the ten views opened for something sit is an open item for Axel (judgment call 1). The step was built inline by the orchestrating session in `.agents/worktrees/Q58` from base `572e12ae`.

## Open items of the state file, verbatim

See `orchestrator-state.md`, section Open items: the one entry is the placement of the ten views opened for something (judgment call 1).

## DONE / NOT DONE

| Item | State | Proof (from `tools/oculus` in the worktree) |
|---|---|---|
| The eleven files split by concern | DONE | `sh bin/size-check.sh` exit 0; `bin/size-allow.txt` holds its header and no entry |
| At most ten tracked items per folder under `src`, `tests`, `bin`, `config` | DONE | `sh bin/folder-check.sh` exit 0; the same script over a checkout of the base prints 23 folders and exits 1 |
| The folder check and its cases | DONE | `bin/folder-check.sh`; four cases in `tests/checks/tree/size.test.ts`; `node bin/revert-check.mjs tests/checks/tree/size.test.ts`: 10 reverts, 0 unproven, 0 unchecked |
| Route groups, URLs unchanged | DONE | `src/routes/api/(files)/`, `(docs)/`, `(git)/`, `(sessions)/`, `(accounts)/`, `(machine)/`, `write/`; the browser suite reaches every endpoint at its old URL |
| Views as `views/<group>/<name>/`, `ownPartials` at the new depth | DONE | `tests/checks/tree/boundaries.test.ts` 10 passed; its synthetic sibling case is red with `ownPartials` widened to the group folder (`catches a violation of every row`, the diff line `views/boards/focus/CommandCenter.svelte imports views/boards/projects/Projects.svelte`) |
| `config/catalogs/` for the five vocabularies, the loader, the Config view and every reader | DONE | `tests/checks/config/config-folder.test.ts` 22 passed; `tests/browser/workbench/system.spec.ts` 5 passed |
| `config/text/views/<group>/` | DONE | `tests/checks/config/config-folder.test.ts` reads 48 catalog files |
| History wording out, and the audit widened | DONE | `tests/checks/source/history.test.ts` reads the comments of `src`, `tests`, `bin` and `config` (a `.yml`'s and a `.sh`'s `#` among them), every line of a `.txt` file and of the three documents, for a step id, a date or a session; a planted case holds the `.txt` and `.sh` reading and is red with it reverted. Prose history ("before the split", "moved out") is outside its vocabulary and was read by hand |
| Documents follow the tree | DONE | `DESIGN.md`, `HELP.md`, `README.md` rewritten where a path, a folder or a history sentence changed |
| Case count | DONE | base 4,395 tests in 263 files; on main at the landing 4,404 in 271 files, 0 failed (`npx vitest run --reporter=dot`). 174 case names changed, each because the name carries a path the move changed, listed under "The case names" |
| `npm run check` | DONE | `COMPLETED 1300 FILES 0 ERRORS 0 WARNINGS` |
| `npm run build`, `npm run format:check`, `npm run lint` | DONE | exit 0 each |
| ASCII gate (the perl form of `agents/spec.md`) | DONE | prints nothing |
| `npm run test:browser` | DONE | 269 passed and 2 failed on the first run; the two, `system.spec.ts` cards named by their old path, fixed and `system.spec.ts` rerun: 5 passed. The whole suite runs again on main at the landing |
| Every revert line proven | see the section Revert lines | `node bin/revert-check.mjs` over the test files that carry one |

## The case names

The base names and today's were compared as multisets (`q58-base-names.txt` against the JSON run). 172 names changed only because a path inside them moved, and pair one to one through the move map; two more changed for the same reason by hand (the two lane files moved into `lanes/` after the map was made). Nine are new: the audit's import-following case, the four folder-check cases, two type-scale rows (`LaneCard.svelte`, `MenuOpener.svelte`), the history audit's planted case, and `names no package id, date or session in any document` beside the unchanged `... in any comment`, the audit's reading of HELP.md, DESIGN.md and README.md. One more is added at the landing, in `tests/browser/workbench/system.spec.ts` (the Config cards). No case was lost.

## The splits, line counts before and after

| Before | After, and what each holds |
|---|---|
| `tests/state/board.test.ts` 980 | `board.test.ts` 237 (presets and items), `board-filters.test.ts` 255 (facets, filters, buckets, saved state), `board-words.test.ts` 269 (the small readers), `board-fixture.ts` 272 (the snapshot, config and builders) |
| `tests/views/collection.test.ts` 973 | `collection.test.ts` 358 (the tab and its cards), `collection-views.test.ts` 151 (funding, code, joint work), `collection-form.test.ts` 222 (the entry form), `collection-fixture.ts` 315 (the fixture and the render helper, `freshClient`) |
| `tests/state/layout.test.ts` 970 | `layout.test.ts` 510 (the pure tree), `layout-store.test.ts` 488 (the store); `foldedOf` joined `layout-fixture.ts` |
| `tests/routes/terminal.test.ts` 970 | `terminal.test.ts` 255 (read, resume, recover), `terminal-actions.test.ts` 620 (task, LaTeX, chat), `terminal-fixture.ts` 195 |
| `src/lib/server/audit.ts` 940 | `audit.ts` 67 (`auditFindings` and the re-exports), `audit/rules.ts` 194, `audit/projects.ts` 473, `audit/publications.ts` 257 |
| `tests/server/writes.test.ts` 930 | `writes.test.ts` 482 (manifest, subtask, career, idea), `writes-collection.test.ts` 354 (collection entries), `writes-fixture.ts` 148 |
| `src/lib/data/sources/config.ts` 908 | `config.ts` 74 (`engineDir` and the re-exports), `config/local.ts` 327, `config/merge.ts` 228, `config/catalogs.ts` 190, `config/settings.ts` 166 |
| `tests/shell/rail.test.ts` 906 | `rail.test.ts` 488, `rail-config.test.ts` 403 (the rail over the real config), `rail-fixture.ts` 57 |
| `src/lib/views/Files.svelte` 566 | `Files.svelte` 515, `files/opening.ts` 62 (which view a file opens in) |
| `src/lib/ui/Menu.svelte` 557 | `Menu.svelte` 473, `MenuOpener.svelte` 150 (the opener in its five looks) |
| `src/lib/views/focus/Lanes.svelte` 547 | `lanes/Lanes.svelte` 393, `lanes/LaneCard.svelte` 205 (one card, drawn from what the lanes hand it), `lanes/LaneHead.svelte` 57 |

A source split keeps every export's name and shape: `audit.ts` and `config.ts` re-export what they exported, so no caller changed beyond an import path.

## The folder map

- `src/lib/state/`: `client/`, `words/`, `workbench/` (with `layout/`, `layout/open/`, `layout/saved/`), `forms/`, `boards/`, `sources/`, `system/`, `sessions/`, `feeds/`, `life/`.
- `src/lib/data/`: `model.ts`, `model/`, `index.ts`, `sources/` (with `config/`), `snapshot/`, `helpers/`, `accounts/`.
- `src/lib/server/`: `core/`, `files/`, `edit/`, `git/`, `content/` (with `audit/`), `accounts/`, `machine/`, `sessions/` (with `stores/`), `transcripts/`, `watch/`.
- `src/lib/ui/`: `forms/`, `controls/`, `menu/`, `tabs/`, `tree/`, `frame/`, `display/`, `html.ts`, `theme.ts`.
- `src/lib/shell/`: `rail/`, `panes/`, `keys/`, `Workbench.svelte`, `workbench-title.ts`, `closing.ts`.
- `src/lib/views/`: `registry.ts`, `shared/` (`card/`, `forms/`, `changes/`, `links/`, `prose/`), and `boards/`, `structure/`, `academic/`, `sources/`, `feeds/`, `personal/`, `system/`, `sessions/`, one folder per view inside each.
- `src/routes/api/`: `(files)`, `(docs)`, `(git)`, `(sessions)`, `(accounts)`, `(machine)`, `write`.
- `config/`: `catalogs/`, `text/` (with `views/<group>/`).
- `tests/`: `fixtures/`, `checks/` (`tree/`, `source/`, `config/`, `look/`, `bin/`), and `data/`, `server/`, `state/`, `ui/`, `shell/`, `views/`, `routes/`, `browser/` mirroring `src/lib`.

## Judgment calls (each reversible)

1. The views opened for something rather than listed sit in the group they are opened from (`project`, `editor`, `deposit`, `person` under boards; `source`, `file`, `document`, `doc`, `note` under sources; `slides` under academic), in `src/lib/views/` and in `config/text/views/` alike; an `opened` group would put `src/lib/views/` at eleven items. The brief's decision 2 says so. Ruling (3) does not place views with no rail group, so the placement is booked as an open item for Axel with the other option.
2. `bin/folder-check.sh` counts what git tracks or would track, and a copy that is no git checkout by its files on disk, so the rule also holds over `revert-check`'s copies and a release tarball.
3. The audit check (`tests/checks/tree/audits.test.ts`) follows a file's relative imports into a test helper and credits the render names declared there, since a split suite keeps its render helper in a fixture the parts share. A new case holds both directions and is red with the import-following removed.
4. The duplication list's entries follow their clones into the new fixture files by mark; a clone the split cut in two carries an entry per mark, seven entries whose clone the split ended came off, and three the folded `MODULE` paths ended came off.
5. The history audit gained the families M, L, K, C, E and X and reads the comments of `config/` and every line of the three documents. The C family matches JPEG marker names, reworded to `0xC0`.

## Found and fixed on the way

- `audit.ts`'s head comment and DESIGN.md said a finding's signature is over its message and matches the cockpit's; the code hashes the catalog key and its arguments. Both now say what the code does.
- DESIGN.md's non-goal excluded a language server, against the ruling of 2026-09-22; its PTY paragraph named tmux sessions `ock-<id>` and a pty module; its boundary row for `state/` named fewer data modules than the test allows; a decision named `repositoryRoots`, which does not exist. All four now match the tree.
- `src/lib/state/life/memories.ts` named a test file that does not exist; it names `memories-message.test.ts`.
- `.prettierignore` listed two config files the tree does not hold; they are gone from the list.

## Revert lines

`node bin/revert-check.mjs` over the test files that carry one, on main at the landing: the counts are in `agents/reviews/Q58-landing.md`. Sixteen lines are unproven, and each is unproven at the base too: the same run over those seven files at their paths in 572e12ae prints `23 reverts, 19 unproven`, the 16 among its 19. Checked by order, every revert line of an unsplit test file names the line its base twin named, as that line sits now (139 lines; the two list entries whose text changed by path alone sit on the line they sat on). The 16 are booked into Q59, in the state file's booked list and in `agents/briefs/Q59.md`.

## What a reader sees change

- The Config view. Before: one card per `.yml` of `config/`, the five vocabularies titled `glyphs.yml`, `icons.yml`, `manifest-schema.yml`, `meta.yml` and `vocab.yml` and sorted among the others, then `local.yml`. After: the top-level files (`appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml`), then the five titled `catalogs/glyphs.yml`, `catalogs/icons.yml`, `catalogs/manifest-schema.yml`, `catalogs/meta.yml`, `catalogs/vocab.yml`, then `local.yml`. To look at: the Config view on the TEST page, the five catalog cards and one opened in a source tab.
- The file browser's engine root holds a `catalogs/` folder with the five files in it, and a source tab opened on one names its path `catalogs/<name>.yml`.
- Two finding sentences name the new place: `icon_not_glyph` says `config/catalogs/glyphs.yml` and `theme_labels_retired` says `config/catalogs/vocab.yml`.
- No URL changed: the 23 `+server.ts` paths with the route groups taken out are the base's. The rail, the lanes, the menus and the file browser draw as before.

## Repair round 1

Every finding of `agents/reviews/Q58-refuter.md`, repaired in the worktree:

- Tests mirror `src/lib`: `tests/views/shared/card/{card,card-docs,card-layout,cardlinks}.test.ts`, `tests/views/shared/links/{crosslinks,source-button}.test.ts`, `tests/views/shared/prose/intro.test.ts`, `tests/server/accounts/connect/oauth.test.ts` (moved at the landing), `tests/ui/tabs/tab-strip.test.ts`, `tests/ui/tree/{tree-keys,tree}.test.ts`, `tests/ui/controls/{glyph,tag}.test.ts`, `tests/state/workbench/layout/open/{preview,show-in-files}.test.ts`, `tests/server/sessions/stores/{codex,turns,transcripts}.test.ts`.
- History: `tests/checks/tree/allow-duplication.txt` names no step id; `src/lib/server/edit/writes.ts` and `src/lib/state/workbench/layout.svelte.ts` say what the modules are rather than when they were split. The history audit reads `.txt` files whole and `#` comments of `.sh` files; a planted case holds that reading, with a revert line for each of the two branches, and its head comment and the DATE comment say so.
- The audits case's revert line cites the line that passes the imported names (`tests/checks/tree/audits.test.ts:186`); `node bin/revert-check.mjs tests/checks/tree/audits.test.ts`: 7 reverts, 0 unproven.
- Stale paths in comments and documents are rewritten: the eleven head comments and the DESIGN.md lines the reviews named (`views/boards/focus/lanes/LaneHead.svelte`, `shared/forms/EntryForm.svelte`, `shared/changes/ChangeCounts.svelte`, `views/sources/repositories/Repo.svelte`, `views/academic/present/parts/`), three names older than the step (`state/layout.ts`, `state/board.ts`, `sessions/codex.ts`), and eleven comments naming `config/text.yml` or `config/text-oculus.yml`, which now name the text catalogs under `config/text/`.
- The brief's decision 2 and its item 2 state the layout built, and its Tests 1 allows only the renames a moved path forces; the report states the renames, the history check's reach and the reader-visible changes.
- Comment lines the path rewrites pushed past 100 columns are rewrapped in the source files: every comment paragraph holding such a line, a one-line doc comment split into a block, a revert directive, a list item and indented code left as they are, and a paragraph rewrapped around a directive, never through it. YAML comments keep one line per paragraph, as `agents/spec.md` asks; the paragraphs of `config/catalogs/icons.yml` and `config/catalogs/vocab.yml` are one line each, and their spaced-hyphen dashes are reworded. Every `path:line` reference to a moved line is re-pointed, and every "at A and B" position of `tests/checks/tree/allow-duplication.txt` is set to where its copy first sits, read with the check's own `copies` function (181 positions rewritten; none is left pointing elsewhere). The comment directly above an absence is what the negatives check reads as its reason, so each such comment keeps the whole reason on that line. Comment lines over 100 columns that are not in the base tree verbatim, revert directives and YAML left out: none (a scan of every tracked file against the base tree unpacked by `git archive 572e12ae`).
- Verification: see `agents/reviews/Q58-landing.md`, run on main over the landed tree.
- The 61 empty folders the moves left on disk are removed.
