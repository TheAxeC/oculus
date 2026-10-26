Everything in the brief is built, but verify 1's run after the last change exited 1: its 11 red lines are time-outs in 7 test files the step does not change, each passing when rerun alone by name, while the landing gate's own vitest and svelte-check ran on the same machine.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md` lines 191-195 (read with `sed -n 185,200p`):

"## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

The list holds no entry. This step raises none.

## The ruling this build carries

`.scratch/migration/agents/briefs/O85-cases.md`, round 0:

1. Case 16, option (a): a row with a hub other than the primary chosen, whose hub's settings file is being read, could not be read, is cut or does not parse, draws that file's sentence (`loading`, `unreadable`, `cut`, `unparsed`, naming B's file) under its control, and its control, editor, Reset and Edit in file send nothing. The primary's rows stay as they are. Option (c) was named the lazy option.
2. Drafts and typed text keyed by hub, option (a): a draft and a typed text made with a hub other than the primary chosen are kept under file, key and that hub's name; one made for the primary, or in a workspace of one hub, under file and key alone. The write list gains `src/lib/state/system/config/editors/slots.ts`, `src/lib/state/system/config/typed.ts`, `src/lib/views/system/workbench/editors/Editor.svelte` and `src/lib/views/system/workbench/settings/Control.svelte`. Case 20 adds: a draft made with B chosen is drawn again when B is chosen again after a switch to A, and A's row shows A's own draft or none. Option (b) was named the lazy option.

Both are built: ruling 1 in `hubRow` of `src/lib/state/system/config/view/hub-settings.svelte.ts:171-190` (`blocked` set from the hub file's `said`), the blocked guards of `write.ts`, `editors/writer.ts`, `Item.svelte` (Reset) and `EditLink.svelte`; ruling 2 in `slotOf`/`inSlot` of `slots.ts:52-67`, `typed.ts`, `Editor.svelte` and `Control.svelte`.

## The cases: the first run on the unchanged tree, and the run after the change

The first run (base 8d52965c) was handed back in round 0 and stands as ruled; its text, every case with the command or the reading that checked it and its output as printed, and its program `first-run.ts`, are quoted in full under "The first run, as handed back in round 0" at the end of this report. Its result per case is repeated below in short after "First run:". The run after the change is the case-run program `after-run.ts` (source at the end of this report), run with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node after-run.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O85` from the scratchpad's `caserun` folder; it writes into a temporary folder it removes at its end, and `git status --short | wc -l` in the worktree printed `47` after its first run, the same list as before it. It ran again after the slice moved to `data/sources/config/settings/hub-slice.ts`, and `diff` of its output with the first run's, the temporary folder's name replaced by `TMP` in both, printed nothing (`diff exit 0`). Its output is quoted below line for line, the absolute temporary path inside the two undo answers shortened by the program itself to 200 characters as printed.

1. (look) First run: no choice drawn (`Item.svelte` drew none). After: `chosenRow` (`hub-settings.svelte.ts:193-204`) gives a row of two hubs `choice: { offered: [A, B], chosen: A }`, and `Item.svelte` draws the Select; test `chosen-hub.test.ts` "two hubs: the primary first and chosen". The look is the orchestrator's on TEST.
2. (look) First run: B could not be chosen. After: B chosen gives `hubRow`, the value, default and line read from B's slice and file; test "shows lab's value, default and line, and opens lab's file, with lab chosen".
3. After: `--- case 3: stages relabelled, root B` / `changed: ["catalogs/vocab.yml:stages"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\n"` / `case 3 undo: {"found":true,"changed":["catalogs/vocab.yml:stages"],"refused":[],"records":[{"file":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o85-after-run-2Kkiqb/w1/B/.oculus/config.yml","key":"catalogs/vo; A now: "{}\n"; B now: "{}\n"`. First run: written to A.
4. (look) After: `--- case 4: reset rail_color, root B, B sets it` / `changed: ["catalogs/vocab.yml:rail_color"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "{}\n"`. First run: the key stayed in B.
5. After: `--- case 5: categories row idea relabelled, root B` / `changed: ["catalogs/vocab.yml:categories"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "categories:\n  - key: idea\n    label: ideas\n    stages:\n      words: [ nascent, scoping ]\n    color: \"#7c5cff\"\n"`. First run: written to A.
6. After: `--- case 6: manifest_fields row added, root B` / `changed: ["schemas/manifest-schema.yml:manifest_fields"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "manifest_fields:\n  - field: grant_id\n    label: Grant\n    type: text\n    section: Core\n    help: The grant number.\n"`. First run: written to A.
7. After: `--- case 7: scan [only-b], root B` / `changed: ["sources.yml:scan"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "scan:\n  - { dir: only-b }\n"`. First run: refused, checked under A's folder.
8. After: `--- case 8: audit.required_files [README.md], root B` / `changed: ["behavior.yml:audit.required_files"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "audit:\n  required_files:\n    - { file: README.md }\n"`. First run: written to A.
9. (look) After: `--- case 9: lint.writing_skip, no root` / `changed: ["behavior.yml:lint.writing_skip"]; refused: []; records: 1` / `A same as before: false; A now: "lint:\n  writing_skip: [ \"*.tex\" ]\n"` / `B same as before: true; B now: "{}\n"`. No choice: `withHubs` passes a row whose `readPerHub(file, key)` is false unchanged (`hub-settings.svelte.ts:216-219`); test row "a key read from the primary alone: no choice". First run: the same file, no choice.
10. (look) After: test rows "one hub, the primary: no choice" and "one hub that is not the primary: no choice, the write names it" (`chosen-hub.test.ts`). First run: no choice, the primary's file.
11. (look) After: `--- case 11: no primary, stages, root B` / `changed: ["catalogs/vocab.yml:stages"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\n"` and `--- case 11/25: no primary, memories_dir only-b, root B` / `changed: ["sources.yml:memories_dir"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\nmemories_dir: only-b\n"`. Page: test rows "two hubs and no primary: none chosen, nothing written" and "two hubs and no primary, lab picked". First run: refused with `no_primary`.
12. After: `--- case 12: stages, root "C"` / `changed: []; refused: [{"field":"catalogs/vocab.yml:stages","reason":"The workspace has no hub named C"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "{}\n"` / `case 12 extra: <scratch>/w14/x exists: false`; `--- case 12: stages, root ""` / `changed: []; refused: [{"field":"catalogs/vocab.yml:stages","reason":"The workspace has no hub named "}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "{}\n"` / `case 12 extra: <scratch>/w15/x exists: false`; `--- case 12: stages, root "../x"` / `changed: []; refused: [{"field":"catalogs/vocab.yml:stages","reason":"The workspace has no hub named ../x"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "{}\n"` / `case 12 extra: <scratch>/w16/x exists: false`. First run: each written to A.
13. After: `--- case 13: lint.writing_skip, root B` / `changed: []; refused: [{"field":"behavior.yml:lint.writing_skip","reason":"lint.writing_skip is read from the primary hub's settings file alone, so it is not set for the hub B"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "{}\n"`. First run: written to A.
14. After: `--- case 14: stages, no root` and `--- case 14: stages, root A`, each `changed: ["catalogs/vocab.yml:stages"]; refused: []; records: 1` / `A same as before: false; A now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\n"` / `B same as before: true; B now: "{}\n"`. Recorded and undone alike: test "writes the primary alike for a body naming it and a body naming no hub" (`config-key.test.ts`). First run: the same.
15. After: `--- case 15: B config.yml links to local.yml, rail_color root B` / `changed: []; refused: [{"field":"catalogs/vocab.yml:rail_color","reason":"a hub's .oculus/local.yml is the machine's own file and is not written from here"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "port: 9999\n"`. First run: written to A.
16. As ruled. After, the body: `--- case 16: B does not parse, rail_color root B` / `changed: []; refused: [{"field":"catalogs/vocab.yml:rail_color","reason":"The file does not parse"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "stages: [unclosed\n"`. The row: test "names lab's file in the sentence of a lab file that does not parse" (`chosen-hub.test.ts`) and "sends nothing for a row that says why it writes nothing" (`row-writer.test.ts`). First run: written to A; the case was ruled.
17. After, reading: `git diff --stat 8d52965c -- src/lib/data/model/ src/lib/server/root/` prints nothing, so `ConfigPayload` (`src/lib/data/model/index.ts:267-282`) and the channel's builder are unchanged; the view reads B through the route alone. First run: the same payload.
18. After: `--- case 18: B has no config.yml, rail_color root B` / `changed: []; refused: [{"field":"catalogs/vocab.yml:rail_color","reason":"The workspace has no hub named B"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: null` / `case 18 extra: B/.oculus/config.yml exists: false`. First run: written to A.
19. After, the body: `--- case 19: target lists no B, rail_color root B` / `changed: []; refused: [{"field":"catalogs/vocab.yml:rail_color","reason":"The workspace has no hub named B"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "{}\n"`. The page: test row "lab chosen and gone from the workspace: the primary chosen again", and the effect in `Settings.svelte:146-158` that drops a pick of a hub that left. First run: written to A.
20. After, the body: `--- case 20: stages, base stale for B, root B` / `changed: []; refused: [{"field":"catalogs/vocab.yml:stages","reason":"The setting changed in the file since it was read, so nothing was written"}]; records: 0` / `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "rail_color: \"#222222\"\n"`. The draft: tests "is kept under lab, drawn again when lab is chosen again, and never shown on the primary's row" and "names lab in its write, is ended by lab's push alone, and says lab's refusal on lab's row" (`editor-saved.test.ts`), and "refuses a base lab's merge does not give, and a lab file that does not parse" (`config-value.test.ts`). First run: refused against A's value; drafts keyed by file and key.
21. After: `--- case 21: reset rail_color, root B, B does not set it (A does)` / `changed: []; refused: []; records: 0` / `A same as before: true; A now: "rail_color: \"#654321\"\n"` / `B same as before: true; B now: "{}\n"`. The page sends nothing: `own` is read from B's file for B's row (`hubRow`), and `write.ts` sends no reset when `own` is false. First run: A's key taken out.
22. After: `--- case 22: copy rail_color, root B, A sets #aaaaaa` / `changed: ["catalogs/vocab.yml:rail_color"]; refused: []; records: 1` / `A same as before: true; A now: "rail_color: \"#aaaaaa\"\n"` / `B same as before: false; B now: "rail_color: \"#16a34a\"\n"` / `case 22 undo: {"found":true,"changed":["catalogs/vocab.yml:rail_color"],"refused":[],"records":[{"file":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o85-after-run-2Kkiqb/w24/B/.oculus/config.yml","key":"catalo; A now: "rail_color: \"#aaaaaa\"\n"; B now: "{}\n"`. First run: A's file changed.
23. After: `case 23 undo after B changed: {"error":"moved"}; A now: "{}\n"; B now: "stages:\n  exploring: { label: by hand }\n"` and `case 23 undo after B left: {"error":"gone"}; A now: "{}\n"; B now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\n"`; tests in `tests/routes/edit/undo/hub-settings.test.ts`. First run: no write reached B.
24. After: test "refuses a write that names the hub lab when the tab holds lab's settings file, and sends one to the primary" (`held-unsaved.test.ts`). First run: the guard named A's file.
25. After: `--- case 25: primary A, memories_dir only-b, root B` / `changed: ["sources.yml:memories_dir"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "memories_dir: only-b\n"`, and case 11/25 above with no primary. The picker: `listsFor(row)` (`Settings.svelte:285-290`) gives a row with B chosen the lists of `listsWith(..., hub)`, whose `folder` lists B's root (`hubListing`); the config-key test row "a folder of lab in a workspace with no primary, written into lab". First run: checked under A, refused with `no_primary` without a primary.
26. After: test "names lab in its write and its reset, and keeps lab's answer apart from the primary's" (`row-writer.test.ts`); `write.ts` and `editors/writer.ts` key every map by `heldKey(row)`. First run: keyed by `row.id` alone.
27. After: `--- case 27: one hub B, no primary, rail_color root B` / `changed: ["catalogs/vocab.yml:rail_color"]; refused: []; records: 1` / `A same as before: true; A now: "{}\n"` / `B same as before: false; B now: "rail_color: \"#dc2626\"\n"`; the row: test row "one hub that is not the primary: no choice, the write names it". First run: refused with `no_primary`.
28. After: `--- case 28: no primary, lint.writing_skip, no root` / `changed: []; refused: [{"field":"behavior.yml:lint.writing_skip","reason":"The workspace has no primary hub, so there is nowhere to keep this; name a hub as primary in the workspace file"}]; records: 0` and `--- case 28: no primary, lint.writing_skip, root B` / `changed: []; refused: [{"field":"behavior.yml:lint.writing_skip","reason":"lint.writing_skip is read from the primary hub's settings file alone, so it is not set for the hub B"}]; records: 0`, each with `A same as before: true; A now: "{}\n"` / `B same as before: true; B now: "{}\n"`. First run: both `no_primary`.
29. After: `case 29: B's slice holds stage exploring: true; A's merge holds it: false` (A's file `stages:\n  exploring: null\n`); test "answers lab's slice as lab's merge gives it, keeps a stage the primary removes, and refuses another name" (`chosen-hub.test.ts`). First run: B's merge not reachable.
30. After, reading: `Settings.svelte:166-174`, the effect on `pushed` (the config channel's version) refreshes each hub in `others` and calls `reader.want(others, pushed)`, which reads every wanted hub again at a new version; test "reads each hub wanted, reads it again at a new version, and keeps no answer it overtook". First run: the push came, Settings did not read B.
31. After: `--- case 31: B: status 200; hub B; top keys ["audit","categories","chat_context","chips","collections","data_access","facet_tones","focus_clusters","focus_lane_tones","focus_lanes","forms","fund_stages","lead_statuses","linkedin_dir","manifest_fields","memories_dir","new_project_dir","options","palette","radar_buckets","rail_color","research_audit","roles","scan","stages","statuses","ticker_categories","tiers","venue_categories","venue_tiers","wallpaper_dir"]; from {"palette":"catalogs/vocab.yml","stages":"catalogs/vocab.yml","forms":"catalogs/vocab.yml","chips":"catalogs/vocab.yml","statuses":"catalogs/vocab.yml","lead_statuses":"catalogs/vocab.yml","focus_clusters":"catalogs/vocab.yml","focus_lanes":"catalogs/vocab.yml","fund_stages":"catalogs/vocab.yml","focus_lane_tones":"catalogs/vocab.yml","ticker_categories":"catalogs/vocab.yml","facet_tones":"catalogs/vocab.yml","tiers":"catalogs/vocab.yml","research_audit":"catalogs/vocab.yml","roles":"catalogs/vocab.yml","categories":"catalogs/vocab.yml","rail_color":"catalogs/vocab.yml","data_access":"catalogs/vocab.yml","venue_categories":"catalogs/vocab.yml","venue_tiers":"catalogs/vocab.yml","radar_buckets":"catalogs/vocab.yml","audit":"behavior.yml","scan":"sources.yml","new_project_dir":"sources.yml","collections":"sources.yml","chat_context":"sources.yml","linkedin_dir":"sources.yml","memories_dir":"sources.yml","wallpaper_dir":"sources.yml","manifest_fields":"schemas/manifest-schema.yml"}`, `--- case 31: "C": {"status":404,"body":{"error":"The workspace has no hub named C"}}`, `--- case 31: "": {"status":404,"body":{"error":"The workspace has no hub named "}}`, `--- case 31: null: {"status":404,"body":{"error":"The workspace has no hub named "}}`. First run: no route.

## DONE / NOT DONE

| Item | State | Check and output |
|---|---|---|
| 1. The 37 keys named once | DONE | `src/lib/data/shapes/hub-keys.ts` `OWN_HUB_KEYS` (37 entries, counted with `awk` over the array and `grep -c`) and `readPerHub`, imported by `config-place.ts`, `config-write.ts`, `undo.ts`, `hub-settings.ts`, `hub-settings.svelte.ts` and `data/sources/config/settings/hub-slice.ts` (`grep -rln "shapes/hub-keys" src`); the slice those keys make of a hub's merged settings is `src/lib/data/sources/config/settings/hub-slice.ts`, since a module of `data/shapes` may not import the key-path walk of `data/sources/config/merge/tree.ts` (the folder order of `tests/checks/imports/order.ts`); `git diff 8d52965c -- src/lib/data/helpers/hub-names.ts` prints nothing |
| 2. The write names its hub | DONE | cases 3-8, 11-16, 18-23, 25, 27, 28 above; G8 and G9 tests |
| 3. The page sends it | DONE | `writes.svelte.ts`, `shapes.ts`, `editors/writer.ts`, `write-files.ts`; tests of G28 and G96; no split needed, `writes.svelte.ts` is 876 lines |
| 4. The row offers the hub | DONE | `chosen-hub.test.ts` rows; `row-writer.test.ts`, `editor-saved.test.ts` |
| 5. The row shows the chosen hub's value | DONE | route, reader, `hubRow`; cases 2, 29, 30, 31 |
| 6. Words | DONE | `config/text/server.yml` `primary_only`, `not_hub_key`; `config/text/views/system/workbench.yml` six `settings_hub_*`/`settings_pick_hub` keys |
| 7. Tests | DONE | listed under "New tests"; one new file outside the named ones, for the size rule (see "Brief wrong or impossible") |
| 8. Comments and schema description | DONE | see "Sentences that describe the behaviour" |
| 9. Doc text | DONE | section "Doc text" |
| Ruling 1 (case 16) | DONE | case 16 above |
| Ruling 2 (drafts by hub) | DONE | case 20 above |
| Verify 1 | RED, every red line a time-out in an unchanged file, each passing alone | `npm run diagrams && npm run test:quick -- --base 8d52965c` after the last change: `test:quick: 60 changed file(s), from git since 8d52965c`, `test:quick: 131 test file(s)`, `ok      svelte-kit sync (7.9 s)`, `ok      prettier (7.9 s): All matched files use Prettier code style!`, `ok      ASCII gate (8.4 s)`, `ok      svelte-check (174.0 s): 1793031428811 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      eslint (325.4 s)`, `ok      vitest checks (417.0 s): Duration  397.49s (transform 310.50s, setup 0ms, import 888.39s, tests 563.69s, environment 2ms)`, `FAILED  vitest (542.8 s)` (`Tests  4 failed / 1143 passed / 474 skipped (1621)`, each `Error: Test timed out in 5000ms.`), `FAILED  vitest slow (806.7 s)` (`Tests  7 failed / 467 passed / 79 skipped (553)`, each `Error: Test timed out in 20000ms.`), `test:quick: 814.9 s; failed: vitest, vitest slow`, exit 1. The folder check is in `vitest checks`, green. The 11 tests, rerun alone with `npx vitest run <file> -t "<title>"` (the slow ones with `--testTimeout 20000`), each passed: `tests/server/edit/app-store.test.ts` (2), `tests/server/edit/literature.test.ts` (1), `tests/routes/edit/deck-slides.test.ts` (1), `tests/data/hubs/hub-portfolio.test.ts` (4), `tests/routes/edit/config-key.test.ts` (1), `tests/routes/edit/rail.test.ts` (1), `tests/routes/edit/apps/app-setting.test.ts` (1); titles under "Process" |
| Verify 2 | DONE | `npx vitest run tests/server/edit/config-key.test.ts tests/server/edit/config-value.test.ts tests/routes/edit/undo/undo.test.ts tests/state/client/held-unsaved.test.ts tests/state/system/settings/ tests/routes/edit/undo/hub-settings.test.ts --testTimeout 20000`: `Test Files  12 passed (12)` / `Tests  197 passed (197)`, run before the slice moved out of `hub-keys.ts`; after the move `npx vitest run tests/state/system/settings/chosen-hub.test.ts --testTimeout 20000` (the one file of the list that imports the slice): `Test Files  1 passed (1)` / `Tests  16 passed (16)`; the list's files are among the related tests of verify 1 |
| Verify 3 | DONE | `wc -l` of the 46 changed files below; largest source file `src/lib/state/client/writes.svelte.ts` 876, largest component `src/lib/views/system/workbench/Settings.svelte` 510 |
| Verify 4 | DONE | "New tests" below; the unchanged-tree run `Test Files  7 failed / 4 skipped (11)`, `Tests  26 failed / 3 passed / 96 skipped (125)` (vitest prints the separators as `|`) |
| Verify 5 | DONE | `sh utils/unused-exports.sh` exit 0; `diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O85-base/unused-exports.txt <output>` printed nothing, `diff exit 0` |
| Verify 6 | DONE | `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml` printed nothing, exit 1 |
| Verify 7 | DONE | the perl gate of `spec.md` over the 46 changed files printed nothing, `exit 0`; `LC_ALL=C grep -n '[^ -~]'` over this report printed nothing, exit 1 |
| Verify 8 | DONE | the hits and why each stays, under "Sentences that describe the behaviour" |
| Verify 9 | DONE | `spec.md`, the one standards page, holds no rule on sentence length; its list rule (line 56, one line per paragraph or bullet in Markdown or YAML) holds for the eight new catalog lines, each one line; no new list item departs from it |

## New tests

Each failed on the unchanged tree (a scratch copy of the base's `src`, `config`, `utils` with the step's test files laid over it, run with `npx vitest run <the step's test files>`), except the two marked audit. The failing line is quoted as vitest printed it.

| File | Title | Entry | Proof or audit | Failing line on the unchanged tree |
|---|---|---|---|---|
| tests/server/edit/config-key.test.ts | a write that names a hub > a folder of lab written into lab's settings file, the primary's left | G8 | proof | `config-key.test.ts:454:61` `AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]` |
| same | a hub no workspace folder carries, refused | G8 | proof | `:456:20` `AssertionError: expected [ 'sources.yml:memories_dir' ] to deeply equal []` |
| same | an empty hub name, refused | G8 | proof | the same line and message |
| same | a hub name that is a path, refused | G8 | proof | the same line and message |
| same | lab whose settings file is gone, refused, and no file is made | G8 | proof | the same line and message |
| same | lab whose settings file does not parse, refused | G8 | proof | the same line and message |
| same | a key read from the primary alone, refused for lab | G8 | proof | `:456:20` `AssertionError: expected [ 'behavior.yml:slurm.resource' ] to deeply equal []` |
| same | a key of the open workspace file, refused for lab | G8 | proof | `:456:20` `AssertionError: expected [ 'appearance.yml:code_theme' ] to deeply equal []` |
| same | a folder of lab in a workspace with no primary, written into lab | G8 | proof | `:452:56` `AssertionError: expected [ [ { ...(2) } ], [] ] to deeply equal [ [], [ 'sources.yml:memories_dir' ] ]` (vitest prints `<horizontal ellipsis>(2)`) |
| same | a key read from the primary alone, with no primary and lab named, refused | G8 | proof | `:456:52` `Error: text key not in config: server.workspace.primary_only` |
| same | a key read from the primary alone, with no primary and no hub named, refused | G8 | audit | passed on the unchanged tree; the `no_primary` refusal it checks is behaviour the step keeps |
| same | Edit in a file with lab named: lab's value in force copied into lab's file | G8 | proof | `:454:61` `AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]` |
| same | writes the primary alike for a body naming it and a body naming no hub | G8 | audit | passed on the unchanged tree, where the parser dropped `root`; it holds the primary's write as it is |
| same | refuses lab's settings file that is a link to a hub's .oculus/local.yml, and writes nothing | G8 | proof | `:486:16` `AssertionError: expected [ 'sources.yml:memories_dir' ] to deeply equal []` |
| tests/server/edit/config-value.test.ts | writes a changed row of categories, by its key into lab's settings file and leaves the primary's | G8 | proof | `config-value.test.ts:441:13` `TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))` |
| same | writes a field added to the project form into lab's settings file and leaves the primary's | G8 | proof | `:441:13` `AssertionError: expected undefined to deeply equal [ { field: 'grant_id', ...(3) } ]` (`<horizontal ellipsis>` as printed) |
| same | writes a scan folder that lab's folder alone holds into lab's settings file and leaves the primary's | G8 | proof | `:440:56` `AssertionError: expected [ [ { ...(2) } ], [] ] to deeply equal [ [], [ 'sources.yml:scan' ] ]` |
| same | writes a file every project of lab must hold, under audit into lab's settings file and leaves the primary's | G8 | proof | `:441:13` `AssertionError: expected undefined to deeply equal [ { file: 'README.md' } ]` |
| same | refuses a base lab's merge does not give, and a lab file that does not parse | G8 | proof | `:455:55` `AssertionError: expected 'Entry 1, field dir: This option takes...' to be 'The file does not parse' // Object.is equality` (`<horizontal ellipsis>` as printed) |
| same | resets a key lab's file sets, and answers a key it does not set with nothing changed | G8 | proof | `:463:31` `AssertionError: expected [] to deeply equal [ 'sources.yml:memories_dir' ]` |
| tests/routes/edit/undo/hub-settings.test.ts (new) | taking back a Settings write to a hub other than the primary > puts lab's settings file back and leaves the primary's as it was | G9 | proof | `hub-settings.test.ts:71:23` `AssertionError: expected '/var/folders/7r/49ks4w4558vcr57tvb9sv...' to be '/var/folders/7r/49ks4w4558vcr57tvb9sv...' // Object.is equality` (`<horizontal ellipsis>` as printed; the record names the primary's file) |
| same | refuses as moved a write whose stage another hand changed since in lab's file | G9 | proof | `:83:24`, the same message |
| same | answers gone for a write of a hub that has left the workspace, and writes nothing | G9 | proof | `:95:23`, the same message |
| tests/state/client/held-unsaved.test.ts | a Settings write over a file a source tab holds unsaved text of > refuses a write that names the hub lab when the tab holds lab's settings file, and sends one to the primary | G28 | proof | `held-unsaved.test.ts:355:24` `AssertionError: expected [ { kind: 'config-key', ...(3) }, ...(2) ] to deeply equal []` |
| tests/state/system/settings/row-writer.test.ts | a Settings row with a hub chosen > names lab in its write and its reset, and keeps lab's answer apart from the primary's | G96 | proof | `row-writer.test.ts:176:33` `TypeError: Cannot read properties of undefined (reading 'hub')` |
| same | sends nothing for a row that says why it writes nothing | G96 | proof | `:203:40` `AssertionError: expected { writes: [], resets: [ [ ...(2) ] ] } to deeply equal { writes: [], resets: [] }` |
| tests/state/system/settings/editor-saved.test.ts | a draft made with a hub other than the primary chosen > is kept under lab, drawn again when lab is chosen again, and never shown on the primary's row | G96 | proof | `editor-saved.test.ts:102:42` `TypeError: slotOf is not a function` |
| same | names lab in its write, is ended by lab's push alone, and says lab's refusal on lab's row | G96 | proof | `:130:23` `AssertionError: expected "vi.fn()" to be called with arguments: [ 'behavior.yml', 'read_limits', ...(4) ]` |
| tests/state/system/settings/chosen-hub.test.ts (new) | the hub a Settings row names > each of its 8 rows (two hubs: the primary first and chosen; two hubs, lab chosen; a key read from the primary alone: no choice; one hub, the primary: no choice; one hub that is not the primary: no choice, the write names it; two hubs and no primary: none chosen, nothing written; two hubs and no primary, lab picked; lab chosen and gone from the workspace: the primary chosen again) | G96 | proof | the file does not load: `chosen-hub.test.ts:19:1` `Error: Cannot find module '../../../../src/lib/data/shapes/hub-keys.ts'` |
| same | names lab's file in the sentence of a lab file that does not parse | G96 | proof | the same |
| same | shows lab's value, default and line, and opens lab's file, with lab chosen | G96 | proof | the same |
| same | the text typed in a box with a hub chosen > is kept under lab and not shown on the primary's row, and both are kept | G96 | proof | the same |
| same | the reader of a hub's settings > reads each hub wanted, reads it again at a new version, and keeps no answer it overtook | G96 | proof | the same |
| same | the route that answers the settings of a hub > answers lab's slice as lab's merge gives it, keeps a stage the primary removes, and refuses another name | G96 | proof | the same |

The entry for each is a judgment from the brief's list: G8 for the server writes, G9 for undo, G28 for the unsaved guard, G96 for the Settings rows. `chosen-hub.test.ts` and `hub-settings.test.ts` are new files the orchestrator adds to those entries. The edits made to tests after the unchanged-tree run (the undo case split into three, the `LAB_SETTINGS` fixture default) are checked by reading.

## Terms

The tree has no glossary file (`ls docs` prints `apps.md data-map.md diagrams HELP.md palette.md templates.md`).

## Files with line counts

From `wc -l` over every changed and new file (46, `.scratch/` left out):

| Lines | File |
|---|---|
| 538 | config/text/server.yml |
| 282 | config/text/views/system/workbench.yml |
| 54 | src/lib/data/shapes/hub-keys.ts (new) |
| 63 | src/lib/data/sources/config/settings/hub-slice.ts (new) |
| 57 | src/lib/data/sources/config/merge/workspace-file.ts |
| 789 | src/lib/server/edit/writes.ts |
| 712 | src/lib/server/edit/writes/bodies.ts |
| 177 | src/lib/server/edit/writes/config/config-key.ts |
| 297 | src/lib/server/edit/writes/config/config-place.ts |
| 235 | src/lib/server/edit/writes/config/config-reset.ts |
| 86 | src/lib/server/edit/writes/config/config-sources.ts |
| 322 | src/lib/server/edit/writes/config/config-value.ts |
| 212 | src/lib/server/edit/writes/config/config-write.ts |
| 624 | src/lib/server/edit/writes/undo.ts |
| 46 | src/lib/server/files/source/hub-settings.ts (new) |
| 876 | src/lib/state/client/writes.svelte.ts |
| 291 | src/lib/state/sessions/source/write-files.ts |
| 526 | src/lib/state/shared/stores/shapes.ts |
| 159 | src/lib/state/system/config/editors/slots.ts |
| 211 | src/lib/state/system/config/editors/sources.ts |
| 206 | src/lib/state/system/config/editors/writer.ts |
| 69 | src/lib/state/system/config/messages.ts |
| 504 | src/lib/state/system/config/rows.ts |
| 98 | src/lib/state/system/config/typed.ts |
| 236 | src/lib/state/system/config/view/hub-settings.svelte.ts (new) |
| 187 | src/lib/state/system/config/write.ts |
| 251 | src/lib/views/system/workbench/editors/Editor.svelte |
| 43 | src/lib/views/system/workbench/editors/writer.svelte.ts |
| 510 | src/lib/views/system/workbench/Settings.svelte |
| 157 | src/lib/views/system/workbench/settings/Control.svelte |
| 109 | src/lib/views/system/workbench/settings/EditLink.svelte |
| 484 | src/lib/views/system/workbench/settings/Item.svelte |
| 235 | src/lib/views/system/workbench/settings/List.svelte |
| 39 | src/lib/views/system/workbench/settings/writer.svelte.ts |
| 20 | src/routes/api/(docs)/hub-settings/+server.ts (new) |
| 866 | tests/checks/tree/boundaries.test.ts |
| 102 | tests/routes/edit/undo/hub-settings.test.ts (new) |
| 579 | tests/routes/edit/write-fixture.ts |
| 541 | tests/server/edit/config-key.test.ts |
| 503 | tests/server/edit/config-value.test.ts |
| 533 | tests/state/client/held-unsaved.test.ts |
| 371 | tests/state/system/settings/chosen-hub.test.ts (new) |
| 158 | tests/state/system/settings/editor-saved.test.ts |
| 27 | tests/state/system/settings/fixture.ts |
| 214 | tests/state/system/settings/row-writer.test.ts |
| 62 | tests/views/system/workbench/workbench-fixture.ts |

`npm run diagrams` also rewrote `docs/diagrams/*.dot` and `*.svg` (12 files, `git diff 8d52965c --stat -- docs/diagrams`), which the path list names.

## Judgment calls the brief left open

1. The page sends `root` only for a hub other than the primary (`sendTo` in `write.ts` and `editors/writer.ts`), so a write to the primary is the body it was; the server treats a `root` naming the primary the same (case 14).
2. A row gets `slot` (the hub its drafts, typed text and write state are kept under) only in a workspace of more than one hub with a hub other than the primary chosen, as ruling 2 words it; a one-hub workspace whose hub is not the primary writes that hub with `hub` set and no `slot`.
3. The route's answer carries `from` for the top-level keys of the slice, beside `hub` and `config`, since the rows read the file a value came from.
4. Two new server sentences: `primary_only` for a hub other than the primary named on one of the 12 keys (the brief's new sentence), and `not_hub_key` for a hub named on a key that is not in the hub list at all (a key of the open workspace file), which the brief did not name; refusing it with `primary_only` would say something false.
5. A row whose hub's settings are being read shows the primary's value with the sentence `settings_hub_loading` and sends nothing; a failed read shows `settings_hub_failed` with the server's reason. The reader keeps the slice it has while a new read is out, so a refresh after a push does not blank the row.
6. A reset that leaves a hub's settings file holding comments alone writes `{}` after them (`keptAsMap`, `config-reset.ts`), since a file of comments alone does not parse as a map and the next write to it was refused. The primary's file meets the same reset; the change is the same for both.
7. The test fixture `labTarget` defaults lab's file to `LAB_SETTINGS = '# the lab\nwallpaper_dir: pictures\n'`, a file that parses as a map, for the reason in 6.
8. Files written outside the path list, each because a listed change needs it: `src/lib/state/system/config/messages.ts` (the three row sentences), `src/lib/views/system/workbench/editors/writer.svelte.ts` (`lists` per row), `tests/checks/tree/boundaries.test.ts` (the `state` allow list gains `data/shapes/hub-keys` and `data/sources/config/settings/hub-slice`, which the page and the server both import), `src/lib/data/sources/config/settings/hub-slice.ts` (new, in a folder of 9 items, since `data/sources/config/merge` holds 10 and `data/shapes` may not import `merge/tree.ts`), `tests/routes/edit/write-fixture.ts` (`labTarget`), `tests/views/system/workbench/workbench-fixture.ts` (the new required `onchoose` prop), and `undo.ts` lines 45 and 47 (the imports `recordLayers` needs; O79's hunks are near 259-341, 495 and 587). Ruling 2's four files are its own widening.
9. `hub-file.ts` is unchanged: the hub's file is read through the same `HubFile` shape, built for B's root by `settingsOf(root)` in `Settings.svelte`.

## Host- and user-visible changes, before and after

- Request bodies `config-key`, `config-value`, `config-reset`: before, no hub field (an unknown `root` was dropped by the parser and the write went to the primary). After, an optional `root: string`: no `root` or the primary's name writes the primary; another hub's name writes that hub's `.oculus/config.yml` for one of the 37 keys; refusals, all as the 200 with `refused`: `The workspace has no hub named <root>` (unknown, empty, path-like, settings file gone), `<key> is read from the primary hub's settings file alone, so it is not set for the hub <root>` (one of the 12), `<key> is kept in the open workspace file, not in a hub's settings file, so the write names no hub` (a key outside the hub list), and the existing `not_parsed`, `local.yml` and "changed since it was read" refusals for B's file.
- New route `GET /api/hub-settings?hub=<name>`: 200 with `{ hub, config, from }`, `config` holding the 37 keys' merged values at their places and their `options` entries, `from` the defaults file each top-level key was read from (case 31's output); 404 with `{ error: "The workspace has no hub named <name>" }` for a name no hub of the open workspace has, an empty name or no name. No channel changes.
- Undo in History: before, a record of another hub's file answered gone. After, it is taken back in that hub's file; refused as moved after another hand changed the file, as gone after the hub left.
- The Settings view (the look on TEST): in a workspace of more than one hub, each row of the 37 keys draws, under its description, a `Hub` select (tooltip "The hub whose .oculus/config.yml this setting is read from and written to."), listing the hubs with the primary first and chosen; with no primary it shows "Pick a hub" and the row says "Pick the hub this setting is written to; nothing is written until a hub is picked." Picking B redraws the row with B's value, Modified against B's merge, B's line, and the Edit in file link named `B/.oculus/config.yml` (with the line) opening B's file; while B's settings are read the row says "Reading the settings of the hub B..."; when B's file is being read, unreadable, cut or does not parse, the row draws that file's sentence under its control and its control, editor, Reset and Edit in file do nothing. The 12 primary-only keys and every row in a workspace of one hub draw no select. To see it: open Settings in a workspace of two hubs, scroll to Stages (Catalogs) or Memories folder (Sources), pick the second hub.
- The unsaved-text guard: a write naming B is refused before sending while a source tab holds unsaved text of B's `.oculus/config.yml`.

## Changed lines of existing assertions, allow lists and predicates

From `git diff -U0 8d52965c -- tests`: no existing assertion line changed. The changed existing lines:

| File | Line | Before | After |
|---|---|---|---|
| tests/checks/tree/boundaries.test.ts | 308 (allow list `ALLOWED`, `state`) | (none) | `'data/shapes/hub-keys',` added after `'data/shapes/vocab-keys',` |
| tests/checks/tree/boundaries.test.ts | 346 (allow list `ALLOWED`, `state`) | (none) | `'data/sources/config/settings/hub-slice',` added after `'data/sources/config/catalog/value-rule',`; the two entries' comment paragraph at 131-135 |
| tests/views/system/workbench/workbench-fixture.ts | 58 | `props: { row, id, writer, editors, lists },` | `props: { row, id, writer, editors, lists, onchoose: () => undefined },` |
| tests/state/system/settings/fixture.ts | 11 | `const config = loadConfig(engineDir()).config;` | `export const config = loadConfig(engineDir()).config;` with a doc comment |
| tests/server/edit/config-key.test.ts | 2-3 (head comment), 29, 32 (imports) | the head comment naming the primary's file; `import { writeConfigKey } ...`; `import { defaultsFile, refusalOf, scratchEngine } ...` | the head comment naming the hub the write names; the imports widened |
| tests/server/edit/config-value.test.ts | 22, 26 (imports) | `import { loadLayers } ...`; `import { defaultsFile, refusalOf, scratchEngine } ...` | the imports widened |
| tests/state/system/settings/fixture.ts | 2 (head comment) | `themes installed, the shipped options catalog.` | `themes installed, the shipped config and its options catalog.` |

`tests/routes/edit/undo/undo.test.ts` is byte-identical with the base (`git diff 8d52965c --stat -- tests/routes/edit/undo/undo.test.ts` prints nothing).

## Sentences that describe the behaviour

Rewritten, each read after the change:

- `src/lib/server/edit/writes/undo.ts:103-112`, `recordLayers`'s doc comment: rewritten (the hub whose file the record names, gone after it left, moved after another hand).
- `src/lib/server/edit/writes.ts:29-32`, head comment: rewritten.
- `src/lib/state/sessions/source/write-files.ts` head comment and `settingsFile`'s doc: rewritten (the chosen hub's file).
- `src/lib/data/sources/config/merge/workspace-file.ts:55`, the schema description: rewritten.
- `config-place.ts` head comment and `otherHubLayers`/`everyHubLayers` docs, `config-reset.ts` head comment, `config-key.ts`, `config-value.ts`, `config-write.ts` (`landing`, `configWrite`), `config-sources.ts` (fields `hub` and `primary`), `bodies.ts` (the three body types' `root`), `rows.ts` (head comment, `fileRows`, `placeName`, the `hub`, `slot`, `choice`, `blocked` fields), `write.ts`, `editors/writer.ts`, `editors/sources.ts`, `slots.ts`, `typed.ts`, `writes.svelte.ts:562-627`, `shapes.ts:386-417`, `Settings.svelte`, `Item.svelte`, `List.svelte`, `EditLink.svelte`, `Control.svelte`, `Editor.svelte`: rewritten where they named the primary's file or the key of a draft; each read after the change and true.
- `docs/HELP.md:325`, `docs/HELP.md:527`, `docs/data-map.md:258`: made false by the step; their replacements are in "Doc text", applied at landing.

Still true, from verify 8 (`grep -rn "primary hub's settings file\|primary hub's .oculus/config.yml\|primary hub's \`.oculus/config.yml\`" src config --exclude=local.yml`), each hit about a primary-only key or the primary's own reading:

- `src/desktop/windows/start-colours.ts:11`: the merge in force, the primary's file. Still true.
- `src/lib/server/content/wallpaper.ts:10`: `wallpaper.image`, primary-only. Still true.
- `src/lib/server/edit/writes/undo.ts:106`: the target's own place is the primary's file or the workspace file; the next sentence names the other hubs. Still true.
- `src/lib/server/edit/writes/config/app-setting.ts:2,97`: `app_settings`, primary-only. Still true.
- `src/lib/server/machine/apps/read/scan.ts:82`: `apps_dir`, primary-only. Still true.
- `src/lib/server/root/context.ts:366`: the primary's file read for the request's config. Still true.
- `src/lib/server/files/workspace/paths.ts:3,52,59`: `bookmarks`, `schedules`, `apps_dir` and the reader's options. Still true.
- `src/lib/state/life/pictures/wallpapers.svelte.ts:32`: `wallpaper.image`. Still true.
- `src/lib/state/system/config/config-files.ts:23`: the root of the group's line for the primary's file, which decision 6 keeps. Still true.
- `src/lib/state/client/writes.svelte.ts:587`: `app_settings`. Still true.
- `src/lib/data/helpers/files/apps/settings.ts:4`: `app_settings`. Still true.
- `src/lib/views/system/workbench/Settings.svelte:31`: the group's line reading the primary's file. Still true.
- `src/lib/views/system/workbench/Settings.svelte:225`: the user's files of the primary's rows. Still true.
- `src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte:6`: `wallpaper.image`. Still true.
- `config/options/sources.yml:166,171,176`: `bookmarks`, `schedules`, `apps_dir`. Still true.
- `config/defaults/sources.yml:68`: `wallpaper.image`. Still true.
- `config/defaults/behavior.yml:300`: `app_settings`. Still true.
- `config/text/server.yml:522`: the new `primary_only` sentence. True.

The grep of the changed signatures: `grep -rn "typedText\|withTypedText\|withSavedDraft\|hasSavedDraft\|savedBase" src tests` outside `slots.ts` and `typed.ts` prints the callers in `Settings.svelte:187,189`, `Item.svelte:175,179`, `Editor.svelte:89,118,121,122,131`, `Control.svelte:72,79,83`, `chosen-hub.test.ts:270-276` and `editor-saved.test.ts:102-111`, each passing `slotOf(row)`, and two unrelated local names (`QuickPick.svelte:38` and `Console.svelte:170`, a constant and a function of their own). None in `config`, `docs` or `README.md`.

## History-word grep

`git diff 8d52965c -- src tests config | grep "^+" | grep -n -i "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands"`, and the same pattern by `grep -n -i -H` over the six new files; each hit judged:

- `104:+// that one key out and pass the checks a write passes (config-checks.ts) before anything is` (`config-reset.ts`): the order of operations in one call. Not history.
- `236:+     * before it opens the file. The change is recorded in History and can be taken back.` (`writes.svelte.ts`): the order of Edit in file's two actions. Not history.
- `715:+    // started over a value the file no longer holds is named and cannot be saved, only discarded,` (`Editor.svelte`): a draft over a value the file does not hold now. Existing wording, rewrapped.
- `766:+    /** The name the file is shown under, the hub's before it for a hub other than the primary. */` (`EditLink.svelte`) and `801:+    /** The name the row's user file is shown under, the hub's before it for another hub. */` (`Item.svelte`): the hub's name placed before the path. Position, not history.
- Lines 929-1045 of the diff (`config-key.test.ts`) and `tests/routes/edit/undo/hub-settings.test.ts:29,70,73,77`: the identifier `before` (a parameter or a constant holding a file's text) and vitest's `test.beforeAll`. Code, not comment or title.

## Brief wrong or impossible

1. Item 7 names only the existing files of G8, G9, G28 and G96 and `chosen-hub.test.ts`. The undo cases in `tests/routes/edit/undo/undo.test.ts` took it to 929 lines, over the size check's 900 (`tests/checks/tree/size.test.ts:28-29`), and `spec.md`'s size rule asks a file over the limit to be split by concern in the step. The cases are in a new file, `tests/routes/edit/undo/hub-settings.test.ts` (102 lines), and `undo.test.ts` equals the base. The orchestrator adds the file to G9.
2. Item 9 gives `docs/data-map.md:260`; the sentence is at line 258 on the base (`grep -n` in "Doc text"). The brief's "three keys" includes `linkedin_dir`, which is read per hub (the premise correction booked in `plan.md`'s Rulings), so the replacement drops it.
3. Item 4 names `hubList` for the hubs a row offers; `hubList` gives an empty list for a workspace of one hub, so `Settings.svelte` uses `hubsTaking(...)`, the rule Add follows, which gives that one hub, as item 4 and case 27 need.
4. The empty-name refusal of a body reads `The workspace has no hub named ` with nothing after it (case 12, case 31): it is the existing `no_hub_named` sentence the brief names, and no page sends an empty `root`.

## Process

- The case-run programs ran under the approval of open item 262 (a) (`plan.md:2626`, "a builder may run the cases of its brief with a case-run program that only prints the result of each case, writes nothing into the step's diff, and has its source and output quoted in the report"), from the scratchpad. Their outputs and the other check outputs went into scratchpad files by shell redirect (`after-run.out`, `quick-final.out`, `unused-final.txt`, `changed-final.txt`); `spec.md:65` counts a shell redirect that changes a file as a script. No file of the worktree was written that way.
- An earlier shell append to `tests/routes/edit/undo/undo.test.ts` was made in the build; that text now lives in `tests/routes/edit/undo/hub-settings.test.ts`, written with Write, and `undo.test.ts` equals the base.
- Every worktree file was otherwise changed with the Edit and Write tools.
- Verify 1 (`npm run diagrams && npm run test:quick -- --base 8d52965c`) was started three times. The first run ended red: `test:quick: 467.1 s; failed: vitest checks, vitest, vitest slow`, with `tests/checks/imports/order.test.ts > the folder order of each layer > holds the data folders` failing on `"data/shapes/hub-keys.ts:15 imports data/sources/config/merge/tree.ts (data/sources, above data/shapes)"`, a defect of the step, fixed by moving the slice into `data/sources/config/settings/hub-slice.ts`; its three other red lines were timeouts in files the step does not change, each rerun alone by name and passing: `tests/routes/hubs/hub-routing.test.ts` "names every hub by its prefix when the workspace has no primary, and refuses a bare id" (`Tests  1 passed | 6 skipped (7)`), `tests/data/hubs/workspace-projects.test.ts` "is the second hub's project alone when that hub's scan reads its manifest" (`Tests  1 passed | 4 skipped (5)`) and `tests/data/hubs/hub-portfolio.test.ts` "resolves a key its own hub does not hold in the one other hub that holds it, with no finding (C2, C4)" with `--testTimeout 20000` (`Tests  1 passed | 15 skipped (16)`); the orchestrator's landing gate in `.agents/worktrees/gate` was running its own vitest and svelte-check at the same time (`pgrep -fl "vitest|svelte-check"`). The second run was stopped before it ended, when `sh utils/folder-check.sh` showed the first place of the slice, `data/sources/config/merge`, at 11 items. The third ran after the last change, as quoted in the table; its red lines, each `Test timed out`, each rerun alone and passing: app-store "a value equal to the file with its keys in another order, which writes and records nothing" and "a host update of undefined, which deletes the key and keeps the rest" (`Tests  1 passed | 14 skipped (15)` each); literature "keys the paper of [ 'Osei M.' ] as 'osei2026certified'" (`-t "keys the paper of"`, `Tests  17 passed | 7 skipped (24)`); deck-slides "moves a name across two lists and an entry of the order, each in one write that keeps every other line" (`Tests  1 passed | 1 skipped (2)`); hub-portfolio "resolves a reference of the second hub in the primary hub when the primary alone holds the key", "resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32)", "keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding" and "gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)" (`Tests  1 passed | 15 skipped (16)` each); routes config-key "puts the file back byte for byte and logs the undo above the write: 'an option the workspace file holds'" (`Tests  4 passed | 7 skipped (11)`, the title's table rows); rail "records the change, and the undo puts the workspace file back byte for byte" (`Tests  1 passed | 4 skipped (5)`); app-setting "writes the one key into the settings file, which the merged configuration then reads" (`Tests  1 passed | 11 skipped (12)`). The four fast-tier ones were rerun with vitest's default time limit; `pgrep -fl "vitest|svelte-check"` during the run showed processes of `.agents/worktrees/gate` alone besides this run. By the brief's rule the list is not run a fourth time for them. After the fix, `npx vitest run tests/checks/imports/order.test.ts tests/checks/tree/boundaries.test.ts --testTimeout 0` gave `Tests  24 passed (24)`.
- Verify 2 ran once in full, before the slice moved; see its row.
- Nothing the builder started is running.

## Doc text

`grep -n "A key of the hub's list is written to the primary hub's" docs/HELP.md`:

```
325:- **Settings.** Each control writes your value into the open workspace file's `settings:` as you set it, keeps the file's comments, and is undoable in History; with no workspace file open it offers Save Workspace As... and writes nothing. A key of the hub's list is written to the primary hub's `.oculus/config.yml`, and oculus's own files are never written. A value differing from oculus's is marked Modified, and Reset takes your value out of its file. A list or map is written as you see it, and an entry of oculus's you remove or hide is written as `removed: true` (a list) or `null` (a map), so it stays out. Each heading has Open Settings File, which opens the workspace file, and Show Defaults, which opens oculus's defaults file to read only; Edit in a file opens the file at the key, adding the key with the value in force when the file lacks it. The `local.yml` keys are listed under This machine with their value in force. Search takes `@modified` and `@id:`.
```

Replacement of its second sentence: "A key of the hub's list that each hub's own `.oculus/config.yml` is read for is written to the `.oculus/config.yml` of the hub its row names, and any other key of the hub's list to the primary hub's; oculus's own files are never written."

`grep -n "Settings writes a hub's words" docs/HELP.md`:

```
527:- Every option is described in its file under `config/options/` and set in Settings. A wrong value is a finding, and that option takes oculus's value. Settings writes a hub's words, its categories and its form fields to the primary hub's `.oculus/config.yml`, refused when the workspace has no primary, and a workspace's catalogs and words to the workspace file. A hub's words and a workspace's catalogs are written as what changed from oculus's: the words changed or added, a null or a removal for each of oculus's taken out, and nothing for a word as oculus ships it. Their rows have no Move, since the merge keeps oculus's order.
```

Replacement of its third sentence: "In a workspace of more than one hub, the row of a key each hub's own `.oculus/config.yml` is read for (a hub's words, its categories, its form fields among them) names the hub it writes, the primary first and chosen, and writes that hub's `.oculus/config.yml`; with no primary no hub is chosen and nothing is written until one is picked. The keys read from the primary hub's file alone write the primary's, refused when the workspace has no primary. A workspace's catalogs and words are written to the workspace file."

`grep -n "linkedin_dir\` and \`portfolio_deck\` are not read" docs/data-map.md`:

```
258:- Its `config.yml` paths are read from its own folder. Its `career_file`, `linkedin_dir` and `portfolio_deck` are not read. Its `audit:` holds its own projects to the conventions it names and checks them against its own website feed.
```

Replacement of its second sentence: "Its `portfolio_deck`, `career_file`, `bookmarks`, `schedules`, `apps_dir`, `wallpaper.image`, `docs`, `counts`, `slurm.resource`, `lint.writing_skip`, `lint.writing_glyphs` and `app_settings` are not read: those keys are read from the primary hub's file alone."

## The after-change case-run program, as run

`after-run.ts`, in the session scratchpad's `caserun` folder (236 lines):

```ts
// Case-run program of O85's server cases on the changed tree: the first run's program, with the
// write target carrying the text catalog the new refusals are worded from, each answer printed as
// its changed and refused lists, and the undo cases and the route of case 31 run.
// It writes nothing into the worktree.

import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TREE = process.argv[2];
const { configWrite } = await import(`${TREE}/src/lib/server/edit/writes/config/config-write.ts`);
const { undoChange } = await import(`${TREE}/src/lib/server/edit/writes/undo.ts`);
const { loadConfig, textCatalog } = await import(`${TREE}/src/lib/data/sources/config.ts`);
const { hubSettingsAnswer } = await import(`${TREE}/src/lib/server/files/source/hub-settings.ts`);

const HUB_FILE = '.oculus/config.yml';
const scratch = mkdtempSync(join(tmpdir(), 'o85-after-run-'));
const engine = join(scratch, 'engine');
cpSync(join(TREE, 'config'), join(engine, 'config'), { recursive: true });
const TEXT = textCatalog(loadConfig(engine, {}).config);

type World = { a: string; b: string };
let n = 0;
function world(aText: string | null = '{}\n', bText: string | null = '{}\n'): World {
    n += 1;
    const a = join(scratch, `w${n}`, 'A');
    const b = join(scratch, `w${n}`, 'B');
    for (const [dir, text] of [[a, aText], [b, bText]] as const) {
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        if (text !== null) writeFileSync(join(dir, HUB_FILE), text);
    }
    mkdirSync(join(b, 'only-b'), { recursive: true });
    return { a, b };
}
const read = (dir: string): string | null =>
    existsSync(join(dir, HUB_FILE)) ? readFileSync(join(dir, HUB_FILE), 'utf8') : null;

/** A write target: primary A unless `primary` is null, with the hubs listed in `others`. */
function target(w: World, primary: 'A' | null, others: ('A' | 'B')[]): Record<string, unknown> {
    const dirOf = (name: 'A' | 'B'): string => (name === 'A' ? w.a : w.b);
    return {
        hub: primary === null ? null : w.a,
        primary,
        engine,
        config: { text: TEXT },
        projects: () => [],
        glyphs: [],
        hubs: others.map((key) => ({ key, hub: dirOf(key), config: {} }))
    };
}

function merged(dir: string, key: string): unknown {
    let node: unknown = loadConfig(engine, { hub: dir }).config;
    for (const step of key.split('.')) node = (node as Record<string, unknown>)[step];
    return node;
}

type Answer = { kind?: string; outcome?: { changed?: unknown; refused?: unknown; records?: Record<string, unknown>[] } };

function show(label: string, w: World, answer: Answer, beforeA: string | null, beforeB: string | null): void {
    const a = read(w.a);
    const b = read(w.b);
    console.log(`--- ${label}`);
    console.log(`changed: ${JSON.stringify(answer.outcome?.changed)}; refused: ${JSON.stringify(answer.outcome?.refused)}; records: ${answer.outcome?.records?.length ?? 0}`);
    console.log(`A same as before: ${a === beforeA}; A now: ${JSON.stringify(a)}`);
    console.log(`B same as before: ${b === beforeB}; B now: ${JSON.stringify(b)}`);
}

function run(label: string, w: World, into: unknown, body: Record<string, unknown>): Answer {
    const beforeA = read(w.a);
    const beforeB = read(w.b);
    const answer = configWrite(body, into as never) as Answer;
    show(label, w, answer, beforeA, beforeB);
    return answer;
}

function undo(label: string, w: World, into: unknown, answer: Answer, kind: string): void {
    const record = answer.outcome?.records?.[0];
    if (record === undefined) {
        console.log(`${label}: no record`);
        return;
    }
    const undone = undoChange(into as never, { ...record, kind, at: 't' } as never);
    console.log(`${label}: ${JSON.stringify(undone).slice(0, 200)}; A now: ${JSON.stringify(read(w.a))}; B now: ${JSON.stringify(read(w.b))}`);
}

const VOCAB = 'catalogs/vocab.yml';
function relabelled(dir: string): Record<string, unknown> {
    const stages = structuredClone(merged(dir, 'stages')) as Record<string, Record<string, unknown>>;
    stages.exploring = { ...stages.exploring, label: 'exploring now' };
    return stages;
}

// Case 3, its undo, and case 23: the undo after B changed and after B left.
{
    const w = world();
    const into = target(w, 'A', ['B']);
    const answer = run('case 3: stages relabelled, root B', w, into, {
        kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.b), base: merged(w.b, 'stages'), root: 'B'
    });
    undo('case 3 undo', w, into, answer, 'config-value');
    const v = world();
    const intoV = target(v, 'A', ['B']);
    const second = run('case 23: stages relabelled, root B, then B changed by hand', v, intoV, {
        kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(v.b), base: merged(v.b, 'stages'), root: 'B'
    });
    writeFileSync(join(v.b, HUB_FILE), 'stages:\n  exploring: { label: by hand }\n');
    undo('case 23 undo after B changed', v, intoV, second, 'config-value');
    const u = world();
    const third = run('case 23: stages relabelled, root B, then B left', u, target(u, 'A', ['B']), {
        kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(u.b), base: merged(u.b, 'stages'), root: 'B'
    });
    undo('case 23 undo after B left', u, target(u, 'A', []), third, 'config-value');
}
// Case 4 and 21: reset with root B, B setting the key and B not setting it.
{
    const w = world('{}\n', 'rail_color: "#123456"\n');
    run('case 4: reset rail_color, root B, B sets it', w, target(w, 'A', ['B']), { kind: 'config-reset', file: VOCAB, key: 'rail_color', root: 'B' });
    const v = world('rail_color: "#654321"\n', '{}\n');
    run('case 21: reset rail_color, root B, B does not set it (A does)', v, target(v, 'A', ['B']), { kind: 'config-reset', file: VOCAB, key: 'rail_color', root: 'B' });
}
// Case 5: categories row changed by its key.
{
    const w = world();
    const rows = structuredClone(merged(w.b, 'categories')) as Record<string, unknown>[];
    rows[2] = { ...rows[2], label: 'ideas' };
    run('case 5: categories row idea relabelled, root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'categories', value: rows, base: merged(w.b, 'categories'), root: 'B' });
}
// Case 6: manifest_fields row added.
{
    const w = world();
    run('case 6: manifest_fields row added, root B', w, target(w, 'A', ['B']), {
        kind: 'config-value', file: 'schemas/manifest-schema.yml', key: 'manifest_fields',
        value: [{ field: 'grant_id', label: 'Grant', type: 'text', section: 'Core', help: 'The grant number.' }],
        base: merged(w.b, 'manifest_fields'), root: 'B'
    });
}
// Case 7: scan with a dir in B alone.
{
    const w = world();
    run('case 7: scan [only-b], root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: 'sources.yml', key: 'scan', value: [{ dir: 'only-b' }], base: merged(w.b, 'scan'), root: 'B' });
}
// Case 8: audit.required_files.
{
    const w = world();
    run('case 8: audit.required_files [README.md], root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'audit.required_files', value: [{ file: 'README.md' }], base: merged(w.b, 'audit.required_files'), root: 'B' });
}
// Case 9 and 13: lint.writing_skip with no root and with root B.
{
    const w = world();
    run('case 9: lint.writing_skip, no root', w, target(w, 'A', ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(w.a, 'lint.writing_skip') });
    const v = world();
    run('case 13: lint.writing_skip, root B', v, target(v, 'A', ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(v.a, 'lint.writing_skip'), root: 'B' });
}
// Case 11 and 25: no primary, root B, stages and memories_dir in a folder of B alone.
{
    const w = world();
    run('case 11: no primary, stages, root B', w, target(w, null, ['A', 'B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.b), base: merged(w.b, 'stages'), root: 'B' });
    run('case 11/25: no primary, memories_dir only-b, root B', w, target(w, null, ['A', 'B']), { kind: 'config-key', file: 'sources.yml', key: 'memories_dir', value: 'only-b', root: 'B' });
    const v = world();
    run('case 25: primary A, memories_dir only-b, root B', v, target(v, 'A', ['B']), { kind: 'config-key', file: 'sources.yml', key: 'memories_dir', value: 'only-b', root: 'B' });
}
// Case 12: root naming no hub, empty, and a path.
for (const root of ['C', '', '../x']) {
    const w = world();
    run(`case 12: stages, root ${JSON.stringify(root)}`, w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.a), base: merged(w.a, 'stages'), root });
    console.log(`case 12 extra: <scratch>/w${n}/x exists: ${existsSync(join(w.a, '..', 'x'))}`);
}
// Case 14: no root and root A.
{
    const w = world();
    run('case 14: stages, no root', w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.a), base: merged(w.a, 'stages') });
    const v = world();
    run('case 14: stages, root A', v, target(v, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(v.a), base: merged(v.a, 'stages'), root: 'A' });
}
// Case 15: B's settings file a link to B's local.yml.
{
    const w = world('{}\n', null);
    writeFileSync(join(w.b, '.oculus', 'local.yml'), 'port: 9999\n');
    symlinkSync(join(w.b, '.oculus', 'local.yml'), join(w.b, HUB_FILE));
    run('case 15: B config.yml links to local.yml, rail_color root B', w, target(w, 'A', ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 16: B's file does not parse.
{
    const w = world('{}\n', 'stages: [unclosed\n');
    run('case 16: B does not parse, rail_color root B', w, target(w, 'A', ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 18: B's settings file removed while the target still lists B.
{
    const w = world('{}\n', null);
    run('case 18: B has no config.yml, rail_color root B', w, target(w, 'A', ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
    console.log(`case 18 extra: B/.oculus/config.yml exists: ${existsSync(join(w.b, HUB_FILE))}`);
}
// Case 19: B left the workspace.
{
    const w = world();
    run('case 19: target lists no B, rail_color root B', w, target(w, 'A', []), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 20: a base B's file no longer holds.
{
    const w = world('{}\n', 'rail_color: "#222222"\n');
    run('case 20: stages, base stale for B, root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.a), base: { stale: true }, root: 'B' });
}
// Case 22: copy with root B on a key B lacks, B's value differing from A's, and its undo.
{
    const w = world('rail_color: "#aaaaaa"\n', '{}\n');
    const into = target(w, 'A', ['B']);
    const answer = run('case 22: copy rail_color, root B, A sets #aaaaaa', w, into, { kind: 'config-key', file: VOCAB, key: 'rail_color', value: merged(w.b, 'rail_color'), copy: true, root: 'B' });
    undo('case 22 undo', w, into, answer, 'config-key');
}
// Case 27: one hub B, not primary.
{
    const w = world();
    run('case 27: one hub B, no primary, rail_color root B', w, target(w, null, ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 28: no primary, a key read from the primary alone.
{
    const w = world();
    run('case 28: no primary, lint.writing_skip, no root', w, target(w, null, ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(w.b, 'lint.writing_skip') });
    run('case 28: no primary, lint.writing_skip, root B', w, target(w, null, ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(w.b, 'lint.writing_skip'), root: 'B' });
}
// Case 29: A removes a stage B keeps; B's slice keeps it, and its focus_lanes default as B's merge gives it.
// Case 31: the route's answer for B and for a name no hub has.
{
    const w = world('stages:\n  exploring: null\n', '{}\n');
    const open = { hubs: [{ name: 'A', dir: w.a }, { name: 'B', dir: w.b }] };
    const settings = (dir: string) => loadConfig(engine, { hub: dir });
    const b = hubSettingsAnswer('B', open, settings, TEXT) as { status: number; body: { hub: string; config: Record<string, unknown>; from: Record<string, string> } };
    console.log(`--- case 31: B: status ${b.status}; hub ${b.body.hub}; top keys ${JSON.stringify(Object.keys(b.body.config).sort())}; from ${JSON.stringify(b.body.from)}`);
    console.log(`case 29: B's slice holds stage exploring: ${'exploring' in (b.body.config.stages as Record<string, unknown>)}; A's merge holds it: ${'exploring' in (merged(w.a, 'stages') as Record<string, unknown>)}`);
    for (const name of ['C', '', null]) {
        console.log(`--- case 31: ${JSON.stringify(name)}: ${JSON.stringify(hubSettingsAnswer(name, open, settings, TEXT))}`);
    }
}

rmSync(scratch, { recursive: true, force: true });
```

## The first run, as handed back in round 0

Quoted from the round-0 hand-back, unchanged.

The server cases were run by a case-run program (approved by the ruling of open item 262 (a), `plan.md:2626`), `first-run.ts` in the session scratchpad, run with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node first-run.ts /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O85`. It writes into a temporary folder it removes at its end and nothing into the worktree (`git status --short` in the worktree printed nothing after it ran). Its source is quoted at the end of this section. Each "answer" line of an accepted write carries the whole change record (over 400 characters, cut by the program at 400); those lines are not quoted below, and the "A now" and "B now" lines that follow them, quoted verbatim, show which file the write changed. On the unchanged tree the body parsers (`bodies.ts` `configKeyShape`, `configValueShape`, `configResetShape`, plain `z.object`) drop the unknown key `root`, so every body naming B is the primary's write.

The page cases were checked by reading the unchanged tree, with the commands named. No page was run (the rules file: a builder runs no page).

1. (look) Reading: `grep -rn "hubList\|chosenHub" src/lib/views/system src/lib/state/system` prints `Settings.svelte:153` (`hubListing`) and `:169` only, both the primary's folder; `Item.svelte` draws no hub choice. The value shown is the primary's in force (`rows.ts:279` `valueAt(config, key)` over `config()?.config`, `Settings.svelte:213-214`). Result: no choice; A's value shown, as now.
2. (look) Reading: no way to choose B (case 1), and the page holds only the primary's merged configuration and catalog (`Settings.svelte:188,213`). Result: B's value cannot be shown.
3. Program, "case 3: stages relabelled, root B": `A same as before: false; A now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\n"`, `B now: "{}\n"`; the undo of its record: `A now: "{}\n"; B now: "{}\n"`. Result: the write lands in A's file and its undo restores A's.
4. (look) Program, "case 4: reset rail_color, root B, B sets it": `answer: {"kind":"config-reset","outcome":{"found":true,"changed":[],"refused":[]}}`, `A same as before: true; A now: "{}\n"`, `B now: "rail_color: \"#123456\"\n"`. Result: the key stays in B's file. No B choice on the page (case 1).
5. Program, "case 5: categories row idea relabelled, root B": `A same as before: false; A now: "categories:\n  - key: idea\n    label: ideas\n    stages:\n      words: [ nascent, scoping ]\n    color: \"#7c5cff\"\n"`, `B now: "{}\n"`. Result: lands in A.
6. Program, "case 6: manifest_fields row added, root B": `A same as before: false; A now: "manifest_fields:\n  - field: grant_id\n    label: Grant\n    type: text\n    section: Core\n    help: The grant number.\n"`, `B now: "{}\n"`. Result: lands in A.
7. Program, "case 7: scan [only-b], root B": `answer: {"kind":"config-value","outcome":{"found":true,"changed":[],"refused":[{"field":"sources.yml:scan","reason":"Entry 1, field dir: This option takes a folder of the hub, and only-b is not one"}]}}`, `A same as before: true; A now: "{}\n"`, `B now: "{}\n"`. Result: checked under A's folder and refused.
8. Program, "case 8: audit.required_files [README.md], root B": `A same as before: false; A now: "audit:\n  required_files:\n    - { file: README.md }\n"`, `B now: "{}\n"`. Result: lands in A.
9. (look) Program, "case 9: lint.writing_skip, no root": `A same as before: false; A now: "lint:\n  writing_skip: [ \"*.tex\" ]\n"`, `B now: "{}\n"`. Result: lands in A, as the case wants; no row draws a choice (case 1).
10. (look) Reading: no row draws a choice (case 1); a write with no root lands in the primary's file (case 14's run). A one-hub workspace whose hub is not primary: case 27.
11. (look) Program, "case 11: no primary, stages, root B" and "case 11/25: no primary, memories_dir only-b, root B": both `refused` with `"reason":"The workspace has no primary hub, so there is nowhere to keep this; name a hub as primary in the workspace file"`, `A same as before: true; A now: "{}\n"`, `B now: "{}\n"`. Result: refused with `no_primary`; no choice drawn.
12. Program, "case 12: stages, root \"C\"", "root \"\"" and "root \"../x\"": each `A same as before: false; A now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\n"`, `B now: "{}\n"`, and `case 12 extra: <scratch>/wN/x exists: false`. Result: each written to A, none refused; no folder `x` made.
13. Program, "case 13: lint.writing_skip, root B": `A same as before: false; A now: "lint:\n  writing_skip: [ \"*.tex\" ]\n"`, `B now: "{}\n"`. Result: written to A, not refused; the new sentence does not exist.
14. Program, "case 14: stages, no root" and "case 14: stages, root A": both `A same as before: false; A now: "stages:\n  exploring: { label: exploring now, icon: orange, color: \"#f59e0b\", live: true, on_map: true }\n"`, `B now: "{}\n"`. Result: holds as the case wants (the root dropped, the same file).
15. Program, "case 15: B config.yml links to local.yml, rail_color root B": `A same as before: false; A now: "rail_color: \"#dc2626\"\n"`, `B now: "port: 9999\n"`. Result: written to A; B's `local.yml` untouched.
16. Program, "case 16: B does not parse, rail_color root B": `A same as before: false; A now: "rail_color: \"#dc2626\"\n"`, `B now: "stages: [unclosed\n"`. Result: written to A. Reading of the page half: see "What stops the step"; the primary's row says nothing of its file's read and writes regardless. The case is wrong under the brief's own rule.
17. Reading: `ConfigPayload` (`src/lib/data/model/index.ts:267-282`) carries `config`, `hubs`, `text`, `icons`, `codeThemeClasses`, `host`, `findings`, `from`. Result: holds now; the step must keep it.
18. Program, "case 18: B has no config.yml, rail_color root B": `A same as before: false; A now: "rail_color: \"#dc2626\"\n"`, `B now: null`. Result: written to A; no file of B made.
19. Program, "case 19: target lists no B, rail_color root B": `A same as before: false; A now: "rail_color: \"#dc2626\"\n"`, `B now: "{}\n"`. Result: written to A, not refused. Page half: no choice to fall back from (case 1).
20. Program, "case 20: stages, base stale for B (B relabelled before), root B": `answer: {"kind":"config-value","outcome":{"found":true,"changed":[],"refused":[{"field":"catalogs/vocab.yml:stages","reason":"The setting changed in the file since it was read, so nothing was written"}]}}`, `A same as before: true; A now: "{}\n"`, `B now: "rail_color: \"#222222\"\n"`. Result: refused, checked against A's value. Page half, reading: `editors/writer.ts:95,140` key the write out and the answer by `row.id` alone, `slots.ts:91` the draft by file and key alone.
21. Program, "case 21: reset rail_color, root B, B does not set it (A does)": `A same as before: false; A now: "{}\n"`, `B now: "{}\n"`, with a record (the answer line). Result: A's key taken out and recorded. Page half, reading: `write.ts:97` and `editors/writer.ts:127` send no reset when `row.own` is false, `own` being the primary's file's.
22. Program, "case 22: copy rail_color, root B, A sets #aaaaaa": `A same as before: false; A now: "rail_color: \"#16a34a\"\n"`, `B now: "{}\n"`. Result: A's file changed from `#aaaaaa` to the value sent; B's file untouched.
23. Program, the undo of case 3's record (above): A's file restored. An undo of a write to B after B changed or left cannot be reached: no write reaches B. `recordLayers` (`undo.ts:108-112`) takes the target's own layers alone.
24. Reading: `write-files.ts:118-121` `settingsFile` names `inHub(HUB_FILE, look)`, the primary's settings file, whatever hub. Result: a write meant for B is guarded by A's file.
25. Program, "case 25: primary A, memories_dir only-b, root B": `A same as before: false; A now: "memories_dir: only-b\n"`, `B now: "{}\n"`; with no primary ("case 11/25"), refused with `no_primary` (case 11). Reading: `Settings.svelte:144-150` `folder()` lists `hubRoot`, the primary's folder. Result: checked and written under A; the picker lists A's folders.
26. Reading: `write.ts:95` keys the write sequence, the shown value and the sentence by `row.id` alone (`<file>:<key>`). Result: no hub in the key.
27. Program, "case 27: one hub B, no primary, rail_color root B": `answer: {"kind":"config-key","outcome":{"found":true,"changed":[],"refused":[{"field":"catalogs/vocab.yml:rail_color","reason":"The workspace has no primary hub, so there is nowhere to keep this; name a hub as primary in the workspace file"}]}}`, `A same as before: true; A now: "{}\n"`, `B now: "{}\n"`. Result: refused with `no_primary`.
28. Program, "case 28: no primary, lint.writing_skip, no root" and "root B": both refused with the `no_primary` sentence above, `A now: "{}\n"`, `B now: "{}\n"`. Result: the first half holds as now; the second gives `no_primary`, the new sentence not existing.
29. Reading: the page builds every row over the primary's merged configuration and its catalog (`Settings.svelte:188,213-214`), whose option defaults are the primary's merge's. Result: B's merge is not reachable.
30. Reading: `Settings.svelte:118-123` refreshes `OCULUS_CONFIG_ROOT`, the primary's root and the workspace file's root at each config push, no other hub's. A write to any hub's `.oculus/config.yml` does republish the config channel: `portfolio.ts:573` watches each hub's `HUB_FILE` with `isConfig` true, and `queue(true, ...)` makes the rebuild publish `config` (`portfolio.ts:610-616`). Result: the push the case rests on happens; Settings does not read B again.
31. Program: `--- case 31: route file exists: false`. Result: no route.

No case other than 16 was found wrong under the brief's rules.

The program's inputs were corrected once by `sed -i ''` on the program file in the session scratchpad (a colour `#111111` the hue control refuses became `#dc2626`, and the `audit.required_files` value became a list of records), after its first run showed both refused for their input rather than for the case; the ruling notes it. Every output quoted above is from the run after that change.

`first-run.ts`, as run:

```ts
// Case-run program of O85's server cases: builds scratch hubs A and B under the system temporary
// folder and a scratch engine (a copy of the worktree's config/), sends each case's body through
// configWrite (and undoChange for the undo cases), and prints what each file holds after.
// It writes nothing into the worktree.

import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TREE = process.argv[2];
const { configWrite } = await import(`${TREE}/src/lib/server/edit/writes/config/config-write.ts`);
const { undoChange } = await import(`${TREE}/src/lib/server/edit/writes/undo.ts`);
const { loadConfig } = await import(`${TREE}/src/lib/data/sources/config.ts`);

const HUB_FILE = '.oculus/config.yml';
const scratch = mkdtempSync(join(tmpdir(), 'o85-first-run-'));
const engine = join(scratch, 'engine');
cpSync(join(TREE, 'config'), join(engine, 'config'), { recursive: true });

type World = { a: string; b: string };
let n = 0;
function world(aText: string | null = '{}\n', bText: string | null = '{}\n'): World {
    n += 1;
    const a = join(scratch, `w${n}`, 'A');
    const b = join(scratch, `w${n}`, 'B');
    for (const [dir, text] of [[a, aText], [b, bText]] as const) {
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        if (text !== null) writeFileSync(join(dir, HUB_FILE), text);
    }
    mkdirSync(join(b, 'only-b'), { recursive: true });
    return { a, b };
}
const read = (dir: string): string | null =>
    existsSync(join(dir, HUB_FILE)) ? readFileSync(join(dir, HUB_FILE), 'utf8') : null;

/** A write target: primary A unless `primary` is null, with the hubs listed in `others`. */
function target(w: World, primary: 'A' | null, others: ('A' | 'B')[]): unknown {
    const dirOf = (name: 'A' | 'B'): string => (name === 'A' ? w.a : w.b);
    return {
        hub: primary === null ? null : w.a,
        primary,
        engine,
        projects: () => [],
        glyphs: [],
        hubs: others.map((key) => ({ key, hub: dirOf(key), config: {} }))
    };
}

function merged(dir: string, key: string): unknown {
    let node: unknown = loadConfig(engine, { hub: dir }).config;
    for (const step of key.split('.')) node = (node as Record<string, unknown>)[step];
    return node;
}

function show(label: string, w: World, answer: unknown, beforeA: string | null): void {
    const a = read(w.a);
    console.log(`--- ${label}`);
    console.log(`answer: ${JSON.stringify(answer).slice(0, 400)}`);
    console.log(`A same as before: ${a === beforeA}; A now: ${JSON.stringify(a)}`);
    console.log(`B now: ${JSON.stringify(read(w.b))}`);
}

function run(label: string, w: World, into: unknown, body: Record<string, unknown>): unknown {
    const beforeA = read(w.a);
    const answer = configWrite(body, into as never);
    show(label, w, answer, beforeA);
    return answer;
}

const VOCAB = 'catalogs/vocab.yml';
function relabelled(dir: string): Record<string, unknown> {
    const stages = structuredClone(merged(dir, 'stages')) as Record<string, Record<string, unknown>>;
    stages.exploring = { ...stages.exploring, label: 'exploring now' };
    return stages;
}

// Case 3, and its undo (case 23's first half on the unchanged tree).
{
    const w = world();
    const into = target(w, 'A', ['B']);
    const answer = run('case 3: stages relabelled, root B', w, into, {
        kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.b), base: merged(w.b, 'stages'), root: 'B'
    }) as { outcome?: { records?: Record<string, unknown>[] } };
    const record = answer.outcome?.records?.[0];
    if (record !== undefined) {
        const undone = undoChange(into as never, { ...record, kind: 'config-value', at: 't' } as never);
        console.log(`case 3 undo: ${JSON.stringify(undone).slice(0, 200)}; A now: ${JSON.stringify(read(w.a))}; B now: ${JSON.stringify(read(w.b))}`);
    }
}
// Case 4 and 21: reset with root B, B setting the key and B not setting it.
{
    const w = world('{}\n', 'rail_color: "#123456"\n');
    run('case 4: reset rail_color, root B, B sets it', w, target(w, 'A', ['B']), { kind: 'config-reset', file: VOCAB, key: 'rail_color', root: 'B' });
    const v = world('rail_color: "#654321"\n', '{}\n');
    run('case 21: reset rail_color, root B, B does not set it (A does)', v, target(v, 'A', ['B']), { kind: 'config-reset', file: VOCAB, key: 'rail_color', root: 'B' });
}
// Case 5: categories row changed by its key.
{
    const w = world();
    const rows = structuredClone(merged(w.b, 'categories')) as Record<string, unknown>[];
    rows[2] = { ...rows[2], label: 'ideas' };
    run('case 5: categories row idea relabelled, root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'categories', value: rows, base: merged(w.b, 'categories'), root: 'B' });
}
// Case 6: manifest_fields row added.
{
    const w = world();
    run('case 6: manifest_fields row added, root B', w, target(w, 'A', ['B']), {
        kind: 'config-value', file: 'schemas/manifest-schema.yml', key: 'manifest_fields',
        value: [{ field: 'grant_id', label: 'Grant', type: 'text', section: 'Core', help: 'The grant number.' }],
        base: merged(w.b, 'manifest_fields'), root: 'B'
    });
}
// Case 7: scan with a dir in B alone.
{
    const w = world();
    run('case 7: scan [only-b], root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: 'sources.yml', key: 'scan', value: [{ dir: 'only-b' }], base: merged(w.b, 'scan'), root: 'B' });
}
// Case 8: audit.required_files.
{
    const w = world();
    run('case 8: audit.required_files [README.md], root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'audit.required_files', value: [{ file: 'README.md' }], base: merged(w.b, 'audit.required_files'), root: 'B' });
}
// Case 9 and 13: lint.writing_skip with no root and with root B.
{
    const w = world();
    run('case 9: lint.writing_skip, no root', w, target(w, 'A', ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(w.a, 'lint.writing_skip') });
    const v = world();
    run('case 13: lint.writing_skip, root B', v, target(v, 'A', ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(v.a, 'lint.writing_skip'), root: 'B' });
}
// Case 11 and 25: no primary, root B, stages and memories_dir in a folder of B alone.
{
    const w = world();
    run('case 11: no primary, stages, root B', w, target(w, null, ['A', 'B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.b), base: merged(w.b, 'stages'), root: 'B' });
    run('case 11/25: no primary, memories_dir only-b, root B', w, target(w, null, ['A', 'B']), { kind: 'config-key', file: 'sources.yml', key: 'memories_dir', value: 'only-b', root: 'B' });
    const v = world();
    run('case 25: primary A, memories_dir only-b, root B', v, target(v, 'A', ['B']), { kind: 'config-key', file: 'sources.yml', key: 'memories_dir', value: 'only-b', root: 'B' });
}
// Case 12: root naming no hub, empty, and a path.
for (const root of ['C', '', '../x']) {
    const w = world();
    run(`case 12: stages, root ${JSON.stringify(root)}`, w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.a), base: merged(w.a, 'stages'), root });
    console.log(`case 12 extra: ${join(w.a, '..', 'x')} exists: ${existsSync(join(w.a, '..', 'x'))}`);
}
// Case 14: no root and root A.
{
    const w = world();
    run('case 14: stages, no root', w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.a), base: merged(w.a, 'stages') });
    const v = world();
    run('case 14: stages, root A', v, target(v, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(v.a), base: merged(v.a, 'stages'), root: 'A' });
}
// Case 15: B's settings file a link to B's local.yml.
{
    const w = world('{}\n', null);
    writeFileSync(join(w.b, '.oculus', 'local.yml'), 'port: 9999\n');
    symlinkSync(join(w.b, '.oculus', 'local.yml'), join(w.b, HUB_FILE));
    run('case 15: B config.yml links to local.yml, rail_color root B', w, target(w, 'A', ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 16: B's file does not parse.
{
    const w = world('{}\n', 'stages: [unclosed\n');
    run('case 16: B does not parse, rail_color root B', w, target(w, 'A', ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 18: B's settings file removed while the target still lists B.
{
    const w = world('{}\n', null);
    run('case 18: B has no config.yml, rail_color root B', w, target(w, 'A', ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 19: B left the workspace.
{
    const w = world();
    run('case 19: target lists no B, rail_color root B', w, target(w, 'A', []), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 20: a base B's file no longer holds.
{
    const w = world('{}\n', 'rail_color: "#222222"\n');
    run('case 20: stages, base stale for B (B relabelled before), root B', w, target(w, 'A', ['B']), { kind: 'config-value', file: VOCAB, key: 'stages', value: relabelled(w.a), base: { stale: true }, root: 'B' });
}
// Case 22: copy with root B on a key B lacks, B's value differing from A's.
{
    const w = world('rail_color: "#aaaaaa"\n', '{}\n');
    run('case 22: copy rail_color, root B, A sets #aaaaaa', w, target(w, 'A', ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: merged(w.b, 'rail_color'), copy: true, root: 'B' });
}
// Case 27: one hub B, not primary.
{
    const w = world();
    run('case 27: one hub B, no primary, rail_color root B', w, target(w, null, ['B']), { kind: 'config-key', file: VOCAB, key: 'rail_color', value: '#dc2626', root: 'B' });
}
// Case 28: no primary, a key read from the primary alone.
{
    const w = world();
    run('case 28: no primary, lint.writing_skip, no root', w, target(w, null, ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(w.b, 'lint.writing_skip') });
    run('case 28: no primary, lint.writing_skip, root B', w, target(w, null, ['B']), { kind: 'config-value', file: 'behavior.yml', key: 'lint.writing_skip', value: ['*.tex'], base: merged(w.b, 'lint.writing_skip'), root: 'B' });
}
// Case 31: the route.
console.log(`--- case 31: route file exists: ${existsSync(join(TREE, 'src/routes/api/(docs)/hub-settings/+server.ts'))}`);

rmSync(scratch, { recursive: true, force: true });
```
