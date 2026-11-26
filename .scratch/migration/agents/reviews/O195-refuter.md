# O195 refuter report

Usage: afbd02dbc48b6edac, claude-opus-5-5, 267542 tokens, 80 tool uses, 855 s.

## Verification lines run

All commands ran from the worktree root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Each ran once.

1. Tests: `unset TMPDIR; nice -n 10 npx vitest run --maxWorkers 4 --reporter dot <35 files>` (the brief's 18, plus cluster-folder, relation-shapes, resources, schema-rules, tier-stage, references, rename, lsp/adapters/hub-keys, hub-vocab, clones, manifests, choices, terminal-chat, deck-folders, cv-fields, paper-fields and server/edit/config-value):
   ```
   vitest exit 0
    Test Files  35 passed (35)
         Tests  701 passed | 2 skipped (703)
   ```
2. Prettier over the 48 changed files (docs/diagrams left out, no parser): `prettier exit 0`, `All matched files use Prettier code style!`
3. ESLint over the changed .ts/.svelte/.js: no output, `eslint exit 0`.
4. ASCII gate over the changed files, the two svg files separately: nothing printed, `ascii exit 0`, `svg ascii exit 0`.
5. `npm run check`: `check exit 0`, `COMPLETED 4691 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
6. `sh utils/unused-exports.sh` diffed against the base list:
   ```
   1c1
   < Unused exports (226)
   ---
   > Unused exports (225)
   137d136
   < src/lib/state/feeds/feeds.ts: FEEDS, staleAfter
   ```
7. Verify item 6 greps (`grep -rn --exclude=local.yml`):
   - 6a over src, config, docs and README.md: nothing (exit 1). Over tests: only fixture and test-hub value lines (`website-watch.test.ts:36,39`, `website-store.test.ts:26-29,74,81,131`, `website-hub.ts:32,35,38,41,53`, `audit.test.ts:386-389`, `website.test.ts:60,63,66,69`).
   - 6b, `litwatch`: only glyph lines (`LiteratureCard.svelte:117,120,125,128,187,195`, `Radar.svelte:146,201`, `config/text/views/feeds/radar.yml:27`, `config/text/views/boards/focus.yml:66`).
   - 6c, the scan folders: the commented example `docs/templates.md:48-54`, plus `docs/templates.md:59,418,1058`, `config/options/behavior.yml:66`, `model-entities.ts:75,98`, `exclude.ts:8`; none a default.
   - 6d: `0`.
8. `ls docs/adr`: no such folder; no ADR governs the diff.

## Verdicts on "What to build"

1. A feed's staleness on its update task: holds (`config/options/sources.yml:214-219`; `hub-rows.ts:174`; `task.ts:139`; `feeds.ts:110-149`; `focus.yml:66,69`; `CommandCenter.svelte:155,261`; the key gone from defaults, options, `desc_behavior` and `options.test.ts:230`; a cleared box removes the key by `fields.ts:388`, `:664` and `draft.ts:268`).
2. The website's files: holds.
3. The scan folders: holds; the new fixture breaks the folder rule (S1).
4. The LinkedIn tab: holds.
5. Names brought to the new ones: holds.
6. The session id in Details: holds (`detail-facts.ts:130`; `model-sessions.ts:201`; `session-detail.yml:23`).

## Verdicts on Cases

1 to 5: met, by reading (`feeds.ts:121-127`, `reading()`, the radar's `days === null`, the scout's date, `reading('inbox').at(0)` after the filter). 6: met (the new `hub-rows.test.ts` rows pass). 7: met, by reading (`workspace-layer.ts:326-343`). 8: not verifiable, left for the look. 9: met. 10: met (`badPaths` at `website.ts:154` and `publications.ts:94`). 11: met, by reading (`publications.ts:81`). 12: met. 13: not verifiable, left for the look. 14: not verifiable, left for the look and docs:shots. 15: met, by reading. 16: met. 17 to 20: met by reading (17 also by the G54 test); the look is left.

## Spec

- SP1. The new off reason of Write the website (`website.svelte.ts:132-134`, `career.yml:37`) is a product change outside the path list. It changes what G140 describes (`guarded.md:228`: a press with an empty path is refused with `website-bad-path`; now the button is off before any press). The report gives new titles for G139 only; G140 (`guarded.md:230`, 'writes the file website.files names and not the shipped one', now '... not the one at the path it replaces') and G125 (`guarded.md:191`, 'compare the file website.files names, and leave the shipped path alone', now '... leave the path it replaces alone') are renamed too. Failure scenario: only G139 is edited at landing, and G140 and G125 name tests that no longer exist.
- SP2. `AuditSection.svelte:166-167` reads the same `website.off()` and is not named; it is unreachable in practice (`publications.ts:95-103`).
- The other files outside the path list hold as needed.

## Proof

- P1. No failing line on the unchanged tree is quoted for the added or changed tests: `hub-rows.test.ts` cites a deleted file; `website-files.test.ts` gives a paraphrase; the new `website-store.test.ts` row and its changed TIPS and UNSAVED rows have no unchanged-tree run.
- P2. Runs beyond the spec and brief item 7: base-run (20, the brief's whole list on the unchanged tree); after1 (69), after2 (15), after3 (73), census runs over files the step does not change, a set readable from the callers; the four alone runs of red files the step does not change; every run before the last round with `TMPDIR=.agents/scratch/tmp`, raised timeouts and `nice -n 19`. Within the rules: after4, base-tree-run, the 8 single-file runs on unchanged code, the last round.
- P3. The last vitest run predates the last change (`terminal-fixture.ts` type, `guards.ts`); the reviewer's run after them gives the same `701 passed | 2 skipped`.
- P4. `tests/fixtures/hubs/hub-scan.ts:7-15`: `HUB_SCAN` is a file-scope array of objects, not frozen, handed by reference into merged configs in eight files; the spec says a shared object handed to callers is frozen or built per call. Failure scenario: a reader that mutates `config.scan` changes later tests' rules in the same worker.
- P5. The report's case 6 after-run gives `update_tasks[0].stale_days: field` for -1, 1.5 and soon; the added rows assert `range`, `whole` and `number` and pass.
- None found of a test asserting a defect, a widened predicate, an exempted check, or a test that passes with its behaviour taken out.

## Standards

- S1. `tests/fixtures/hubs/` holds 11 items, over the ten `utils/tree/folder-check.sh` allows (`hub-scan.ts` is the eleventh). Failure scenario: `tests/checks/tree/size.test.ts:182` is red at landing.
- S2. Edited comments not rewrapped at 100 columns: `website.svelte.ts:10` (127), `choices.test.ts:66` (112), `feeds.ts:92` (101), `deck-folders.test.ts:83` (101), `terminal-fixture.ts:255` (ends short mid-sentence).
- S3. The report's history-word grep leaves out `still` and `always`; `feeds.ts:96` "still nudges for" means "even so", not history.
- S4. Missing report sections: the grep before each new helper and constant (`HUB_SCAN`, `HUB_SCAN_LINES`, `PATHS`, `HEADER`, `FILE_SETTINGS`, `FILE_LINES`), and the empty, duplicate and collision statement for the new keys (`stale_days`, `career.website_no_path`, `sessions.f_id`, `focus.command.radar_glyph`, `refresh_radar_plain`); by reading none collides.

## Behaviour

- B1. The changed example of the task-name refusal (`config/text/server.yml:105`, "such as litwatch" to "such as weekly-digest") is not under "Visible changes".
- B2. On a second hub whose rows set no `stale_days`, the refresh strip nudged at 14/7/2 and now never does; the report states it only for the research hub.

## Declined to judge

- Cases 1 to 5, 7, 11 and 15 as runs: the case program is deleted; judged by reading.
- Whether the changed tests failed on the unchanged tree: needs a run over a base copy with the new tests, not done here.
- The folder count by the script: `folder-check.sh` runs `git ls-files`; S1 rests on `ls` and `.gitignore`.
- Whether the committed diagrams match the source: needs `npm run diagrams`, which writes outside `.agents/scratch`.
- The readers of `BASE_CHAT_CONFIG` outside item 1 (`compose.test.ts`, `terminal-actions.test.ts`, `latex-approvals.test.ts`, `runs/commands/run.test.ts`, `pty/agent-pane.test.ts`): not run; by reading their input is unchanged, and `npm run check` is green.
