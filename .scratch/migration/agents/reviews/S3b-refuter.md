# Step S3b refuter report (on .agents/worktrees/S3b, base 41177dcf)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

All commands were run from `.agents/worktrees/S3b/tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

```
$ npm run diagrams
exit 0. Afterwards `git status --short` listed the same 27 paths as before the run, so the committed diagrams match what the source generates.

$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
exit=0
$ npm test
 Test Files  357 passed | 20 skipped (377)
      Tests  5530 passed | 577 skipped (6107)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790822486138 COMPLETED 2494 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Verify 3: npx vitest run tests/server/edit tests/routes/edit tests/server/machine/usage --testTimeout 0
 Test Files  18 passed (18)
      Tests  462 passed (462)

Verify 4: shasum of config/appearance.yml, behavior.yml, layout.yml, present.yml, sources.yml and catalogs/options.yml, taken before diagrams/checks/verify 3 and again after them, then diffed
SUMS-SAME (97cdefba..., ca2a2cf0..., ec13dbee..., cb54e715..., 1674b4d9..., ad8e2934..., the same sums the report gives)

Verify 5, the first run on the unchanged tree. The scratch copy was under $TMPDIR. Its source and config changes were reversed with `git diff 41177dcf -- tools/oculus/src tools/oculus/config` and `patch -R`, config-key.ts was deleted, and the step's tests were kept. Then:
npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit tests/server/machine/usage/refresh.test.ts tests/state/client/writes.test.ts --testTimeout 0
 Test Files  5 failed | 4 passed (9)
      Tests  17 failed | 191 passed (208)
(These are the report's figures exactly. The failing tests are the 12 new route tests, the 2 parser tests, the writer file at load, the 2 requireRefreshSettings tests and the page-write test.)

The report's mutation checks, rerun on the scratch copy restored to the finished source (a cmp of every src and config file against the worktree found no difference). Command: npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts --testTimeout 0
- loop over READERS removed: Tests 6 failed | 35 passed (41), the same six tests the report names
- finders comparison removed (return null): 1 failed, "refuses a code theme that is none..."
- catalog check in configKeyNow removed: 1 failed, "answers gone for a record naming a file the catalog does not track"
- -0 normalisation removed: 1 failed, "writes minus zero as zero..."
- reviewer's own: the six extra readers (iconSet, vocabCatalog, glyphCatalog, iconCatalog, catalogOf, glyphNames) removed from READERS: Tests 41 passed (41)

The report's diagram claim, rerun on the scratch copy with the two `plain(...)` calls and the `plain` import removed from config-key.ts, then `npm run diagrams` and `npx vitest run tests/checks/diagrams`:
 x have no two arrows running along each other in the write diagram
 "lib/server/edit/feeds.ts to file on disk (calls) along lib/server/edit/feeds.ts->lib/server/core/json.ts for 85",
 "lib/server/edit/feeds.ts to file on disk (calls) along lib/server/edit/feeds.ts->lib/server/edit/writes/entries.ts for 41",
 "lib/server/edit/writes/config-key.ts->lib/server/core/json.ts along lib/server/edit/writes/deck.ts->lib/server/core/json.ts for 56",
 "lib/server/edit/writes/entries.ts->lib/server/core/changes.ts along lib/server/edit/writes/manifest.ts->lib/server/core/changes.ts for 54",
 Tests  1 failed | 67 passed (68)

Gates the report quotes:
sh utils/folder-check.sh -> prints nothing, folder=0; sh utils/size-check.sh -> prints nothing, size=0
ls -A | wc -l: src/lib/server/edit/writes 9, tests/server/edit 10, tests/routes/edit 7 (as reported; tests/server/edit is at the ten-item limit)
The rules file's perl ASCII gate over src, tests and config (local.yml excluded): prints nothing (bin/ does not exist in this tree)

The scratch copy was removed afterwards. The worktree is unchanged: 27 status lines, the same as at the start.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `bodies.ts` `configKeyWrite` takes the `body.kind !== 'config-key'` form. Its refusals are in `write.test.ts` ("the config-key body"), and both parser tests failed on the unchanged tree (`configKeyWrite is not a function`).
- 2: violated. Spec 1: a findings reader that throws is swallowed, and the brief's one list is two arrays. Spec 2: the list holds readers that cannot refuse a value, against ruling 2's comment. Spec 4: the read-back comparison refuses valid writes to a file that holds `.inf`, `.nan` or `-0` anywhere. Proof 1: a no-op `plain(...)` was added to pass the diagram check. The refusal order, the catalog lookup, the controls, locate, the splice through `replaceValue`, the atomic write, the record shape and the `loadConfig(engine, instead)` merge all hold, and the 27 writer tests show them.
- 3: holds. `writes.ts:498-509` catches the writer's throw as `500 { error: 'unwritable' }`, the outcome goes through `answer(..., 'config-key', into)`, and the head comment at `:20-26` is true to the file. Case 19's two route tests pass.
- 4: holds. In `undo.ts:133`, `configKeyNow` answers not-found for a key that is gone, a file that does not parse or a file the catalog does not track. `apply` (`undo.ts:246-249`) writes `change.before` through `writeConfigKey`. Cases 15, 16 and 24 pass. Behaviour 2 covers an unwritable file during an undo.
- 5: violated. Standards 1: the new `ChangeRecord.key` doc says the rail list addresses a config file's name, but rail's key is `'rail'`. The History word (`history.yml`, `kind_config_key: setting`) holds.
- 6: holds. `writes.svelte.ts:329` and `shapes.ts:169`. The page-write test is one POST to `/api/write` with the exact body, and it failed on the unchanged tree.
- 7: violated. Standards 2: `HELP.md:256` now lists "the audit mute" among the writes the change log records, and the audit mute records nothing. `DESIGN.md:313` holds, with `config-key` among the closed kinds per ruling 3.

Cases of the brief's "Cases" (as ruled at round 0 where a ruling applies):

- 1: met. `tests/server/edit/config-key.test.ts` checks the byte comparison and the record. The route test checks the record in the log. "has a word of its own in the History view" checks the word "setting".
- 2: met. Writer and route tests check `{ changed: [], refused: [] }`, no record and the same bytes.
- 3: met. Checks the reader's sentence and that the file is unchanged.
- 4: met, under ruling 1: `2.5` gives the reader's sentence; `"300"`, `true`, `[]`, `null`, `1e309` and `{}` give not_number; `-0` on `calendar.days_back` is written as `0`.
- 5: met. Checks the reason, the bytes and the mtime of the scratch `local.yml`.
- 6: met. All 13 names are refused as no_entry, `catalogs/options.yml` among them.
- 7: met. Checks `themes`, `data_domains`, `audit_ignore` and `read_limits`.
- 8: met.
- 9: met.
- 10: met. The colon, hash and quotes read back. A newline is written double-quoted over both a double-quoted and a single-quoted line.
- 11: met. Checks `board.search.projects` and `deck.meta.kicker`.
- 12: met. Double and single quotes are kept, and an apostrophe is doubled.
- 13: met.
- 14: met. All the variants are refused as not_in_file, plus the alias-of-map case as not_kept.
- 15: met. The route test checks byte-for-byte and the undo record above the write.
- 16: met (route test).
- 17: met. Checks two writes in a row and two at once.
- 18: met. The parser returns null for each body, and the route answers 400. See Spec 3 for the target that test uses.
- 19: met. Checks the missing file and the read-only file through the route, plus the writer throwing.
- 20: met. Checks `paint_limit_kb`, `usage_refresh_min`, `usage_refresh_model` and `code_theme`.
- 21: met. The write is refused with the `search.max_hits` sentence.
- 22: met.
- 23: met. Checks the plain, single-quoted and double-quoted forms.
- 24: met.
- 25: met. Checks CRLF with a BOM and without one.
- 26: met.
- 27: met.
- 28: met. `target()` throws with the `changes.keep` sentence before any writer runs, and the file is unchanged.

## 1. Spec

- `src/lib/server/edit/writes/config-key.ts:201-208` and `:104-114`: `function findingsOf(...) { try { return FINDERS.flatMap(...) } catch { return []; } }`.
  - What is wrong:
    - Item 2 says the list is "one array". It also says a write is refused when "any reader in the writer's list throws (whether or not it threw before)", the findings readers included.
    - The diff splits the list into `READERS` and `FINDERS`. A throw from any finder empties the findings of every finder, and the write goes on. No test covers the catch.
  - Failure scenario 1: a finder throws on the merged configuration after the edit. Examples are `docFindings` hitting `statSync` with EACCES or ELOOP on a `docs:` path (`content/docs.ts:485`), or a later finder that throws on a value. `findingsOf(after)` is then `[]`, nothing counts as fresh, and the write lands. A reader in `READERS` that threw the same way would refuse it.
  - Failure scenario 2: a finder throws before the edit but not after it. `seen` is empty, so the first finding that already existed is reported as new, and the write is refused with words that do not describe this write.
  - Verdict: item 2 violated.
- `src/lib/server/edit/writes/config-key.ts:75-102`, `READERS`, from `textCatalog` down to `glyphNames`, with the comment "Every reader of the merged configuration that can refuse a value: ..., and the catalogs".
  - What is wrong:
    - Ruling 2 has the list's comment name "every reader of the merged config that can refuse a value", and leaves `notifyConfig` out for the reason that it never throws.
    - Five of the added readers can never throw, by their code:
      - `vocabCatalog` (`catalogs.ts:41-45`)
      - `glyphCatalog` and `iconCatalog` (`stringMap`, which drops bad entries)
      - `catalogOf` (`options.ts:49-52`, which returns `{}`)
      - `glyphNames` (`rail.ts:63-66`)
    - `iconSet` throws only when `readFileSync` of an icon SVG fails. With all six removed, the step's 41 tests still pass.
    - So the comment in `config-key.ts:11-17` and `:75-80` is false, and the list contradicts the criterion ruling 2 used to leave `notifyConfig` out.
    - None of the six makes a valid write fail on today's tree: every write test passes on scratch copies of the checkout's config.
    - There is one exception. `iconSet` reads every mapped icon file on every write, and a read error on one icon file becomes the refusal of every config-key write.
  - Failure scenario: a `lucide-static` icon file resolves but cannot be read (a partial install, a permission change). Every option write is then refused, with an `EACCES: ... open .../icons/x.svg` message shown as the reason beside an unrelated option.
  - Verdict: item 2 violated.
- `src/lib/server/edit/writes/config-key.ts:186-193`, `const expected = JSON.parse(JSON.stringify(read.before))`.
  - What is wrong: item 2 refuses an edit only when the parsed result "differs from the original anywhere else".
    - The JSON copy turns `Infinity` and `NaN` into `null`, and `-0` into `0`. `isDeepStrictEqual` then finds a difference where there is none.
    - Reproduced with `node -e` and yaml's `parse`: `a: .inf`, `a: -0` and `a: .nan` beside `k: 1`, with `k` set to 2, each give `false`.
    - No tracked config file holds such a value today. A grep over `config/*.yml` with `--exclude=local.yml` printed nothing.
  - Failure scenario: a reader writes `offset: .inf` or `x: -0` by hand anywhere in `behavior.yml`. Every config-key write to that file is then refused as not_kept ("The edit would change more than this one value"), and nothing says which value is to blame.
  - Verdict: item 2 violated.
- `tests/routes/edit/write.test.ts:727-736`, `const response = await handleWrite(request(body), TOKEN, target());`.
  - What is wrong: the brief says "a route test builds its target with engine set to that temporary engine, never engineDir()". The fixture's `target()` sets `engine: engineDir()`, which is `write-fixture.ts:121`. Today's parser rejects these bodies, and the writer would refuse them anyway (no_entry or not_number), so the checkout is not reachable now.
  - Failure scenario: a later change makes the parser accept one of these bodies with a valid value. The test then writes the checkout's `config/behavior.yml`.
  - Verdict: none (case 18 is met).
- Brief, "What is on the tree", against items 5 and 7: two premises that the reviewer's grep does not reproduce.
  - What is wrong:
    - Item 5 says a config file's name is what the record addresses "for `rail` and `config-key`". But `rail.ts:28` has `export const RAIL = 'rail'`, and `rail.ts:115` has `key: RAIL`.
    - Item 7 has `HELP.md:256` list the audit mute as a recorded write. The brief's own line 11 says `audit-mute` "returns no records" (`audit-mute.ts:90`, `return { changed: [IGNORE], refused: [] }`), and `answer` logs only `outcome.records` (`writes.ts:548-552`).
    - The report does not name either point as wrong in the brief, though its "Report" section asks for that.
  - Failure scenario: the builder followed both. The two false sentences are Standards 1 and Standards 2.
  - Verdict: items 5 and 7 violated.

## 2. Proof

- `src/lib/server/edit/writes/config-key.ts:61` and `:314-315`, `import { plain, type ChangeRecord } ...` and `before: plain(held), after: plain(wanted),`.
  - What is wrong:
    - `plain` maps `undefined` to `null` (`changes.ts:125-127`). `held` is never undefined, since `locate` refuses a null or empty value, and `wanted` cannot be undefined because it comes from JSON. So the calls do nothing.
    - The report says the calls were added because the diagram check needed them. With them removed, `tests/checks/diagrams/readable.test.ts` fails with four pairs of arrows running along each other (rerun above). Three of the four pairs are arrows of other modules (feeds.ts, entries.ts, manifest.ts).
    - So a check that guards the drawing is made to pass by a code change that has nothing to do with the behaviour. The defect the check found is in `utils/diagrams/writes.mjs`, which leaves those pairs unparted, and it is left in place.
    - The renamed local (now `scalar`, `config-key.ts:292`) was renamed for the same reason, a dotted arrow drawn for a local that shadowed the import. The rename does no harm in itself, but it was made for the diagram as well.
    - The report's judgment call 1 justifies `plain` "as the manifest, entry, subtask and feed writers do". It leaves out `rail` (`rail.ts:115`) and `deck` (`deck.ts:106-113`), the two config writers this one follows, which record without `plain`.
    - The report's Findings 1 also names the hazard ("A later step that adds a module to the write chain may meet the same check") without fixing it. That goes against the rules file's "A risk you name is a task you own".
  - Failure scenario:
    - The next writer added to the write chain meets the same red check and takes the same no-op route.
    - A reader of `config-key.ts` reads `plain(held)` as a sign that `held` can be undefined.
    - The layout defect in `writes.mjs` stays hidden behind code that exists only to move arrows.
  - Verdict: item 2 violated. The lazy option is to keep the calls. The fix that ends the cause is to part these pairs in `utils/diagrams/writes.mjs` and remove the no-op calls.
- `S3b-report.md`, judgment call 7: "`READERS` also holds readers that cannot refuse an option's value today but read the merged config and can throw on it (`iconSet`, `catalogOf`, `glyphNames`, the vocab, glyph and icon catalogs)".
  - What is wrong: five of these cannot throw on any configuration (Spec 2). The removal test above leaves 41 of 41 passing.
  - Decision that rests on it: whether the list matches ruling 2's criterion for leaving `notifyConfig` out.
  - Failure scenario: the orchestrator accepts the list as "every reader that can refuse", when it holds readers that cannot.
  - Verdict: item 2 violated (with Spec 2).

## 3. Standards

- `src/lib/server/core/changes.ts:67-71`, `` `deck`, or a config file's name for the rail list and a setting. ``
  - What is wrong: the rules file's "What every package obeys" says "A sentence in a document or a head comment that the change makes false is a defect of the change". The rail list's record key is `'rail'` (`rail.ts:28`, `:115`), not a config file's name.
  - Failure scenario: a reader of `ChangeRecord` writes an undo or a History reader for rail that expects `key` to be `layout.yml`, and it never matches.
  - Verdict: item 5 violated.
- `HELP.md:256`, "the feeds, the deck, the rail list, the audit mute, a setting written from the Settings view and the per-session overrides".
  - What is wrong: the same rule as above. The audit mute writes no change record (`audit-mute.ts:90`, `writes.ts:548-552`), so HELP now tells the reader that the audit mute appears in History and can be undone. It does neither.
  - Failure scenario: a reader mutes an audit finding and looks for the row in History to take it back. There is no row.
  - Verdict: item 7 violated.
- `S3b-report.md`, Findings 2: "I ran `git diff --stat -- docs/diagrams` once".
  - What is wrong: the rules file's "Where you work" says "You never run a git command". The command was read-only and the tree shows no effect.
  - Failure scenario: a builder that runs git in a worktree can change the state the orchestrator lands from. This one did not.
  - Verdict: none.
- `src/lib/server/edit/yaml-edit.ts:107`, `export type Written = ...`.
  - What is wrong: no module outside `yaml-edit.ts` imports `Written` from it. The grep found only `entry-edit/lines.ts`'s own `Written`, and `config-key.ts` imports only `replaceValue` and `Refusal`. The export is not needed, which goes against YAGNI under the rules file's "The principles every package is judged on".
  - Failure scenario: a later reader takes `yaml-edit.ts`'s `Written` for a shared type and couples to it, beside the separate `Written` in `entry-edit/lines.ts:48`.
  - Verdict: none.

## 4. Behaviour

- `src/lib/server/machine/usage/refresh.ts:402-410`, `if (typeof model !== 'string' || model.trim() === '') throw new Error('usage_refresh_model must not be empty');`.
  - What is wrong:
    - When `usage_refresh_model` is absent or not a string, server startup used to fail with a `TypeError` from `options.model.trim()`. It now fails with the named sentence.
    - The report's row ("`watchUsageRefresh` | inline checks | calls `requireRefreshSettings`, same two sentences") does not state this change, which is an improvement.
  - Failure scenario: none harmful. A reader who compares startup errors before and after would find a difference the report does not list.
  - Verdict: none.
- `src/lib/server/edit/writes/undo.ts:246-249` and `writes.ts:519`: `const outcome = writeConfigKey(into.engine, change.key, change.field, change.before);`.
  - What is wrong: the undo of a setting whose file has turned read-only throws out of `undoChange` and `handleWrite`. Nothing catches it, so the route answers SvelteKit's generic 500 rather than `{ error: 'unwritable' }`, which the write path answers (item 3). The report's "Undo of a setting" row does not state this, and no test covers it. `rail`'s undo has the same gap.
  - Failure scenario: the reader makes `behavior.yml` read-only and presses undo on a setting row in History. The page gets an untyped server error instead of the unwritable answer.
  - Verdict: none (item 4 does not ask for it).

## Declined to judge

- How much time each write costs: `loadConfig` twice, all five finders twice, `iconSet` reading every mapped icon file, and `loadLocalOrDefaults` once. This was not measured, and the brief sets no bound on it.
- Whether, with the `plain` import removed, the diagram tool still draws a false dotted arrow for a local named `plain`, as the report says. That would be a second defect in the tool. It was not reproduced; only the four-pair failure was.
- Whether "a setting written from the Settings view" in `HELP.md:256` should wait for S3c, since today no view sends the write. The brief set this wording, so it is the orchestrator's call.
- Item 2's coverage beyond its scope. A grep of every `throw new Error` in `src` found no other reader that throws on a merged-config value: `careerRules` and `portfolioConfigFrom`, which `target()` runs, do not throw. The reviewer judged the list to cover the brief's scope (`createServerContext` and `src/lib/data/sources/config/`). Readers that silently fall back, like `notifyConfig`, are outside what this check can find.

Reviewer usage: tokens not visible to the reviewer; about 62 tool uses; time not measured.
