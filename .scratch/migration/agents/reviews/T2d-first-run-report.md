Everything in the brief is done. Nothing was run, as the brief says (no test, verify list, build, npm command); every statement below comes from a `find`, `grep`, `wc` or a read of the files after the last edit.

## 1. One line per entry

- G1: `tests/routes/git/git.test.ts`, "the git endpoint" / "refuses a request with no token" (403, the error text, and `ran` stays empty).
- G2: `tests/routes/files/file.test.ts`, "serving a file under a root" / "has nothing for %s", table cut to the five rows that are a path or root outside the configured roots (climbs out, climbs after descending, absolute path, symbolic link out of the root, a root nobody configured). The rows "a file that is not there", "a directory", "the root itself", "a root that is not there" are deleted.
- G3: `tests/routes/replace/ops-replace.test.ts`, "what stops a replace" / "refuses `protected` for the machine's local file of the engine root, which it never opens".
- G4: none in my folders (grep for callback, state, oauth over routes/ and data/ finds no provider callback test).
- G5: `tests/checks/source/html-sites.test.ts`, kept whole.
- G6: `tests/routes/git/git.test.ts`, "the Source Control actions" / "refuses each asking action unconfirmed, and takes it confirmed with its fields" (18 rows kept: each row is a distinct action of the `CONFIRMED` set). This test carries `{ tags: ['slow'] }` as it did before, so `npm test` leaves it out.
- G7: `tests/routes/files/open-program.test.ts`, "what macOS open is run with and the floor under it" / "names the application for a file and reveals a folder, the path last" (the argument list of `openArgs`, path last).
- G8: `tests/routes/edit/audit-mute.test.ts`, "the audit mute write" / "parks one signature and keeps every other byte of the file".
- G9: `tests/routes/edit/undo/undo.test.ts`, "taking a change back" / "writes a manifest field back, logs the undo, and undoes the undo".
- G10: `tests/routes/files/file-undo.test.ts`, "taking a create back" / "moves the file to the Trash while it is unchanged, and records the reverse". This holds the Trash half of G10 through the undo of a create. The route's own file-operation cases are `tests/server/files/ops.test.ts`, outside my folders, so two sweeps may name a test for G10; settle at landing.
- G11: none in my folders (`grep -rln "hooks.server" tests/routes tests/data tests/checks tests/fixtures` after the deletions finds only `tests/checks/diagrams/diagrams.test.ts`, which names the file in a string; nothing in the four folders starts the server).
- G12: `tests/checks/config/config-folder.test.ts`, kept whole.
- G13: `tests/checks/config/config.test.ts`, kept whole.
- G14: `tests/checks/config/integrity.test.ts`, kept whole.
- G15: `tests/data/sources/manifests.test.ts`, "readManifests" / "reports a flat manifest whose own type disagrees with its tier and uses the tier" (the project is still in the list, with a finding on `type`).
- G16: `tests/checks/tree/boundaries.test.ts`, kept whole.
- G17: `tests/checks/imports/order.test.ts`, kept whole.
- G18: `tests/checks/imports/cycles.test.ts`, kept whole.
- G19: `tests/checks/imports/augments.test.ts`, kept whole.
- G20: `tests/checks/tree/size.test.ts`, kept whole.
- G21: `tests/checks/tree/duplication.test.ts`, kept whole.
- G22: `tests/checks/source/history.test.ts`, kept whole.
- G23: `tests/checks/source/comment-width.test.ts`, kept whole.
- G24: `tests/checks/source/keys.test.ts`, kept whole.
- G25: `tests/checks/diagrams/diagrams.test.ts`, kept whole.
- G26: `tests/checks/look/contrast.test.ts`, kept whole.
- G27: `tests/checks/utils/claude-usage.test.ts`, kept whole.

## 2. Counts

Commands, run in `tools/oculus/tests` over `routes data checks fixtures`: test files `find ... -name '*.test.ts' | wc -l`; `.ts` files `find ... -name '*.ts' | wc -l`; lines `find ... -name '*.ts' | xargs cat | wc -l`; calls `find ... -name '*.ts' | xargs grep -Eo '\b(it|test)(\.each|\.skip|\.only|\.concurrent)?\(' | wc -l`. Before comes from a copy of the four folders taken before the first edit.

| | before | after |
|---|---|---|
| test files | 117 | 24 |
| `.ts` files | 145 | 47 |
| lines of `.ts` | 34511 | 8199 |
| `it(` / `test(` calls | 1577 | 230 |
| all files (the two `.txt` allow lists included) | 147 | 48 |

Deleted: 93 test files (the 16 tree checks of the brief among them, with `tree/allow-audits.txt` and `tree/allow-negatives.ts`), and the helpers `checks/config/options-findings.ts`, `data/prose/latex-headings.ts`, `routes/files/open-fixture.ts`, `data/real-hub.probe.ts` (each: `grep`/resolver run over `tests/`, `utils/`, `src/`, `bin/`, `vite.config.ts`, `package.json` finds no importer). Also deleted: `utils/migrations/migrate-joint-work.mjs`, `utils/migrations/rename-program-to-pillar.ts`, and the empty `utils/migrations/` folder. Empty test folders left by the deletions are removed. Kept test files (24): the seven routes files and `data/sources/manifests.test.ts` named above, plus the 16 whole checks of G5, G12 to G14, G16 to G27.

Edited kept test files (every other test, describe block, import and helper that served only deleted tests removed): `routes/git/git.test.ts` 591 to 120 lines, `routes/files/file.test.ts` 314 to 80, `routes/replace/ops-replace.test.ts` 410 to 38, `routes/files/open-program.test.ts` 486 to 20, `routes/edit/audit-mute.test.ts` 245 to 116, `routes/edit/undo/undo.test.ts` 693 to 78, `routes/files/file-undo.test.ts` 367 to 101, `data/sources/manifests.test.ts` 342 to 131.

Edited helpers: in `routes/edit/write-fixture.ts` the exports used by no remaining file are removed (`overridesOf`, `AREA`, `tasksOf`, `hold`, `wrote`, `undoneBack`, `undoneMoved`, `recorded`, `deckOf`, `configTarget`) with the imports only they used; in `routes/replace/replace-fixture.ts` `previewPost`, `records`, `undo`, `stamps` and their imports; in `routes/sessions/terminal-fixture.ts` `SESSION`, `GONE`, `CHAT_CONFIG`, `CHAT_CATALOG`, `source`, `command`, `filled` and their imports; in `fixtures/scratch.ts` `scratchMade`. `checks/tree/allow-duplication.txt` lost the 10 entries that name a file I deleted (lines 26 to 33, 35, 36 of the old file), because the duplication check refuses an entry whose clone is gone.

## 3. Helpers kept because a file outside my folders imports them (importer, first of the list)

- `checks/diagrams/counted.ts`: `tests/views/boards/project.test.ts` (3 importers; `checks/diagrams/diagrams.test.ts` also)
- `checks/imports/order.ts`: `utils/diagrams/diagrams.mjs`, `graphs.mjs`, `source.mjs` (named by the brief)
- `checks/look/themes.ts`: `tests/themes/derive.test.ts` (3 importers)
- `checks/source/code.ts`: `tests/ui/controls/tag.test.ts` (8 importers)
- `checks/walk.ts`: `tests/server/core/paths.test.ts` (7 importers)
- `fixtures/client.ts`: `tests/shell/commands/command-ask.test.ts` (214 importers)
- `fixtures/doubles.ts`: `tests/server/accounts/calendar/routes.test.ts` (76)
- `fixtures/entities-fixture.ts`: `tests/server/content/audit.test.ts` (33)
- `fixtures/feeds-fixture.ts`: `tests/views/feeds/leads.test.ts` (3)
- `fixtures/kinds.ts`: `tests/views/system/history.test.ts`
- `fixtures/present.ts`: `tests/server/machine/usage/usage.test.ts` (13)
- `fixtures/real-hub.ts`: `tests/server/edit/entry-edit.test.ts`, `tests/server/edit/yaml/yaml-edit.test.ts`
- `fixtures/scratch.ts`: `tests/server/accounts/calendar/live.test.ts` (117)
- `fixtures/sessions-fixture.ts`: `tests/server/root/hooks.test.ts` (30)
- `routes/edit/write-fixture.ts`: `tests/server/core/changes.test.ts`, `tests/server/edit/config-key.test.ts`, `tests/server/edit/config-value.test.ts`
- `routes/sessions/terminal-fixture.ts`: `tests/server/machine/commands/run.test.ts`

Kept for a kept file inside my folders only: `checks/diagrams/tree.ts`, `checks/imports/augments.ts`, `checks/imports/graph.ts`, `checks/tree/allow-styling.ts`, `checks/tree/allow-duplication.txt`, `fixtures/reason.ts`, `routes/git/request.ts`, `routes/replace/replace-fixture.ts`.

## 4. Changes that are not a deletion

None of substance. Removing text left these two edits, both from the removal: the comma after the last kept row of the table in `file.test.ts` is dropped, and a blank line between the head comment and the imports of `open-program.test.ts` is kept where the removal had taken it. Import lists of kept files were rewritten as the shorter list of names still used; no assertion, title, threshold or allow-list row other than the 10 named above was edited.

## Decisions the orchestrator may reverse

1. `tests/data/real-hub.probe.ts` is deleted. It is a hand-run script (`node tests/data/real-hub.probe.ts`), imported by nothing, so brief step 4 deletes it. `agents/spec.md` ("Where you work") still lists it among the four readers of the real hub. If the script is wanted, restore the one file.
2. G6 keeps the slow-tagged table test, so `npm test` does not run G6 (the file's other test, G1, is not slow-tagged). I did not retag. G9 (`undo.test.ts` test) and G15 are not slow-tagged. G10, G7 and G3 are not slow-tagged.
3. G10 and G15 are judgment picks by reading: see lines above.

## Stale text left in place (outside deletion-only; for the landing fix)

- Head comments of kept files that still describe cases now gone: `routes/git/git.test.ts:1-3`, `routes/replace/ops-replace.test.ts:1-3`, `routes/files/open-program.test.ts:1-6`, `routes/edit/audit-mute.test.ts:1-8`, `routes/edit/undo/undo.test.ts:1-8`, `routes/files/file-undo.test.ts:1-11`, `routes/replace/replace-fixture.ts:1-9`, `routes/sessions/terminal-fixture.ts:1-4`, `routes/edit/write-fixture.ts:7-10` (names `tests/routes/edit/write.test.ts` and the config-key suites), `tests/checks/config/config.test.ts:3-4` (names `tests/data/sources/config/local.test.ts`), `tests/data/sources/manifests.test.ts:38-41` (the `buildHub` comment mentions "the two software ones below").
- Fixture content in kept helpers that only deleted tests read: `target()` in `routes/edit/write-fixture.ts` still plants the venues, data, radar, leads and LinkedIn files; `buildHub()` in `manifests.test.ts` still plants the nested, ghost, broken and decoy projects.
- Exports of kept helpers now used only inside their own file: `checks/diagrams/counted.ts` `counted` (dynamic import by `diagrams.test.ts`, so in use), `checks/source/code.ts` `code` and `fileCode`, `fixtures/reason.ts` `literalsIn`, `fixtures/scratch.ts` `sweepScratch`, `routes/edit/write-fixture.ts` `TASKS` and `CAREER`, `routes/git/request.ts` `HOST`, `routes/replace/replace-fixture.ts` `TIMEOUT` and `ReplaceWorld`, `routes/sessions/terminal-fixture.ts` `HOST`, `engineWith`, `tmux` and `configOf`.
- References to deleted tests outside my write list (found by `grep -rn` over `tests utils src config`): comments in `src/lib/data/sources/config/catalog/options.ts:54`, `config/catalogs/options.yml:3`, `src/lib/themes/derive.ts:65`, `config/catalogs/vocab.yml:153`, `src/lib/server/edit/writes/bodies.ts:5`, `src/lib/server/git/deposit-routes.ts:14`, `src/lib/server/machine/pty/sessions.ts:158`, `DESIGN.md` (`readable.test.ts`, `lane-distance.test.ts`), and about 30 test comments under `tests/server`, `tests/state`, `tests/views`, `tests/shell`. The scripts `utils/cited-lines.mjs` and `utils/outside-paths.mjs` had their tests in the deleted checks (`utils/cited-lines`, `utils/outside-paths`) and remain in `utils/`.
- One read-only `git status` was typed by mistake during the work; it printed nothing that was used and changed nothing.

## Not verified

No test, type check, lint or build was run (brief step 6). A static pass over every edited file found no unused import and no unused top-level declaration, and a resolver over `tests/`, `utils/`, `src/` found no relative import that points to a deleted file.
