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

## Repair round 1, refuted

# Step S3b refuter report over repair round 1 (on .agents/worktrees/S3b, base 41177dcf)

A page this report cites is named with its section. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
From the worktree root, as the prompt gave it:
$ PATH=...:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md
$ npm test
npm error enoent Could not read package.json: ... open '/Users/axelfaes/workspace/research-hub/.agents/worktrees/S3b/package.json'
checks: failed with exit 254: npm test
(The verify block says "from tools/oculus in the worktree". The list was rerun from there.)

From .agents/worktrees/S3b/tools/oculus:
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
diagrams exit=0. `git status --short | shasum` gave 2a9875e5... before and after the run. `git diff 41177dcf --stat -- docs/diagrams` gave 6 files, 562 insertions, 514 deletions, the same churn as before the run.

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
exit=0
$ npm test
 Test Files  357 passed | 20 skipped (377)
      Tests  5538 passed | 577 skipped (6115)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790825970532 COMPLETED 2494 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Brief verify 3, with tests/checks/diagrams added as round 1 says:
$ npx vitest run tests/server/edit tests/routes/edit tests/server/machine/usage tests/checks/diagrams --testTimeout 0
 Test Files  21 passed (21)
      Tests  542 passed (542)

Brief verify 4 (shasum of appearance, behavior, layout, present, sources and catalogs/options.yml), taken after all the runs above:
97cdefba..., ca2a2cf0..., ec13dbee..., cb54e715..., 1674b4d9..., ad8e2934...
These are the same sums the builder's report and the first refuter report give.

The rules file's perl ASCII gate over src, tests and config, with local.yml excluded by name: prints nothing.
sh utils/folder-check.sh -> folder=0. sh utils/size-check.sh -> size=0.
LC_ALL=C grep -n '[^ -~]' utils/diagrams/writes.mjs HELP.md DESIGN.md -> nothing.

Brief verify 5 and the closures. These were run on a scratch copy of tools/oculus under the session scratchpad. The copy was made with rsync excluding node_modules, .scratch and config/local.yml, and node_modules was symlinked. A baseline run of the four step test files on the copy gave Tests 151 passed (151).

- First run on the unchanged source. The src and config diff was reversed with `git diff 41177dcf -- tools/oculus/src tools/oculus/config` and `patch -R`, and config-key.ts was deleted:
  npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit tests/server/machine/usage/refresh.test.ts tests/state/client/writes.test.ts --testTimeout 0
   Test Files  6 failed | 3 passed (9)
        Tests  20 failed | 191 passed (211)
  This matches the report exactly. The 20 failures are the 12 config-key route tests, the 3 unwritable-undo tests, the page-write test, the 2 requireRefreshSettings tests and the 2 parser tests.
- Ruling 1, the finder's throw after the edit swallowed (catch sets given = []): 2 failed, "refuses a write when a finder throws on the configuration holding it, in its own words" and "... throws before the edit and again after it".
- Ruling 1, a finder that threw before the edit compared with an empty set (seen = new Set()): 1 failed, "compares nothing for a finder that threw before the edit and gives findings after it".
- Ruling 3, copyOf replaced by the JSON copy: 1 failed, "writes beside a file value that JSON cannot hold: infinity, not a number and minus zero".
- Ruling 3, copyOf replaced by the parsed value itself: 1 failed, "refuses an edit that would change a second key, which an alias of the map reads".
- Ruling 10, the catch in undoChange removed: 1 failed, "answers unwritable for a setting whose file has turned read-only", Error: EACCES: permission denied, open '.../config/behavior.yml'.
- Ruling 10, the rail branch mapped to null: 1 failed, the rail test, "expected 404 to be 500".
- Ruling 10, the deck branch mapped to null: 1 failed, the deck test, "expected 404 to be 500".
- Ruling 10, writes.ts mapping 'unwritable' to 404: all 3 unwritable-undo tests failed, "expected 404 to be 500".
- Ruling 5, utils/diagrams/writes.mjs reversed to the base with `git diff 41177dcf -- tools/oculus/utils/diagrams/writes.mjs` and `patch -R`, then npm run diagrams and npx vitest run tests/checks/diagrams:
   x parts two arrows that reach one module from two modules (expected 1 to be 2)
   x parts a plain arrow that runs along an arrow drawn through its words (expected 1 to be 2)
   x have no two arrows running along each other in the write diagram: the four pairs the first report quoted (feeds.ts to file on disk along feeds.ts->json.ts for 85, along feeds.ts->entries.ts for 41, config-key.ts->json.ts along deck.ts->json.ts for 56, entries.ts->changes.ts along manifest.ts->changes.ts for 54)
   x draws no arrow for a local that has the name of an import (expected 'digraph writes {...' not to contain 'lib/server/edit/old.ts')
   Test Files  2 failed | 1 passed (3), Tests  4 failed | 68 passed (72)
  This matches the report.
- The report's claim under ruling 1 that a docs: path under an unreadable folder does not make docFindings throw. A node probe with a folder at chmod 000 printed "exists false". That fits content/docs.ts:479, where existsSync runs before statSync, so the finder gives "no file at" and does not throw.

grep checks: `grep -n "type Written" yaml-edit.ts` gives `107:type Written = ...`, which is not exported. `grep -n plain config-key.ts` finds only prose in comments; there is no import and no call.
The scratch copy was removed. Two logs (checks.log and diagrams.log) were written to the shared scratchpad and may have replaced files of the same name there. At the end, `git status --short | shasum` from tools/oculus gave 2a9875e5..., the same as at the start (31 lines), and `git diff 41177dcf --stat` gave 27 files, 1036 insertions, 570 deletions.
```

## Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. `bodies.ts` `configKeyWrite` uses the `body.kind !== 'config-key'` form. Its refusal tests are in `write.test.ts` ("the config-key body"), and both parser tests failed on the unchanged source.
- 2: holds. Each round-1 closure checked out on rerun:
  - Ruling 1: the finders have no catch after the edit; a finder whose before-run throws is not compared; both shapes are in one comment at `config-key.ts:71-76`. The three mutation runs above fail.
  - Ruling 2: `READERS` (`:83-98`) holds only readers that throw on a config value. `textCatalog` throws `TextNotAMap` through `merge.ts:210-214`. `iconSet` is out, since `iconFile` (`catalogs.ts:76-83`) returns null for a name with no file.
  - Ruling 3: `copyOf` is at `:182-187`, and both mutations fail.
  - Ruling 5: `plain` is gone.
  The refusal order, the catalog lookup, the splice, the atomic write and the record all stand from round 0, and the step's 32 writer tests pass.
- 3: holds. `writes.ts:498-509`. The head comment at `:20-26` is true to the file.
- 4: holds. `valueNow` reads through `configKeyNow` (`undo.ts:134`). `apply` writes through `writeConfigKey` (`undo.ts:264-267`). Cases 15, 16 and 24 pass. Behaviour 1 below covers the reader-facing wording of the new `unwritable` answer.
- 5: holds. `history.yml:50` has `kind_config_key: setting`. The `changes.ts:69` doc now says "`deck`, `rail` for the rail list, or a config file's name for a setting" (ruling 6).
- 6: holds. `writes.svelte.ts` `writeConfigKey` and `shapes.ts:169`. The page-write test failed on the unchanged source.
- 7: violated. See Standards 1. `HELP.md:256` holds after ruling 7. `DESIGN.md:313` names `config-key` among the closed kinds, but two line citations on that line, and one on `DESIGN.md:266`, are made false by the step.

Cases (as ruled at round 0 where a ruling applies):

- 1: met. The writer test compares bytes and checks the record. The route test checks the log row. "has a word of its own in the History view, a setting" checks "setting".
- 2: met. The writer and route tests check `{ changed: [], refused: [] }`, no record and the same bytes.
- 3: met. The reader's sentence is checked, and the file is unchanged.
- 4: met, under ruling 1. `2.5` gives the reader's sentence. `"300"`, `true`, `[]`, `null`, `1e309` and `{}` give not_number. `-0` on `calendar.days_back` is written as `0`.
- 5: met. The reason, the bytes and the mtime of the scratch `local.yml` are checked.
- 6: met. All 13 names are refused as no_entry.
- 7: met.
- 8: met.
- 9: met.
- 10: met.
- 11: met.
- 12: met.
- 13: met.
- 14: met. The alias-of-map case is still refused as not_kept, and the round-1 mutation confirms it.
- 15: met.
- 16: met.
- 17: met.
- 18: met. The body tests now use `configTarget()` (`write.test.ts:732`). Spec 1 covers one more config-key body that still runs on `engineDir()`.
- 19: met.
- 20: met.
- 21: met.
- 22: met.
- 23: met.
- 24: met.
- 25: met.
- 26: met.
- 27: met.
- 28: met.

## 1. Spec

- `tests/routes/edit/write.test.ts:341` and `:370-373`: `'config-key': { kind: 'config-key', file: 'behavior.yml', key: 'changes.keep' }` in `MALFORMED`, run through `const into = target();`.
  - What is wrong: `target()` sets `engine: engineDir()` (`write-fixture.ts:119`). The brief says "a route test builds its target with engine set to that temporary engine, never engineDir()". Ruling 4 moved only the tests at `:727-736` to `configTarget()`. This second config-key body test still runs against the checkout.
  - Failure scenario: none today. The parser rejects the body, and with no `value` the writer would refuse it as not_number anyway. If a later change makes the parser accept this body, the test runs a config-key write against the checkout's `config/`.
  - Verdict: none (case 18 met). The fix is one line at landing: `configTarget()` for this kind.
- `src/lib/server/edit/writes/undo.ts:255-256` (the deck branch of `apply`): `if ('error' in outcome) return outcome.error === 'unwritable' ? UNWRITABLE : null;`. This is the builder's Finding 1.
  - Ruling 10 names "a config-key or a rail change" and the round says "change nothing else", so the deck mapping is outside the ruling's letter. It is inside the ruling's intent ("an undo whose writer [cannot write] its file answers 500 unwritable, as the write path does") and inside the round's paths (`undo.ts`, `undo.test.ts`).
  - The deck had the same cause on the next lines of `apply`. Before the round, `writeDeck`'s `{ error: 'unwritable' }` became `null`, so the undo answered `404 { error: 'nothing' }`, which says the change cannot be taken back.
  - The behaviour is right. The deck's own write path answers `500 { error: 'unwritable' }` for the same word (`writes.ts:449-454`), and the undo now matches it. The deck test fails without the line (rerun above).
  - Leaving the deck out would have left the same defect in the function the ruling sent the builder to change. The report names the change openly.
  - Verdict: none. Keep it.

## 2. Proof

- `S3b-report.md`, "Host and user-visible changes", the row "`HELP.md:256` | listed the audit mute among the recorded writes | says muting an audit finding is not recorded".
  - What is wrong: at the base, `HELP.md:256` did not list the audit mute; only the round-0 diff added it. The "Before" column describes the builder's own round-0 state, not the base. Against the base, the change is that HELP now says muting an audit finding goes through the write endpoint and is not recorded.
  - Failure scenario: a reader of the landing record believes the base HELP was wrong about the audit mute and that this step corrected it.
  - Verdict: none. Correct the row at landing.

## 3. Standards

- `DESIGN.md:313`: "(`server/edit/writes/entries.ts:68`, `server/edit/writes.ts:84-85`)" and "since `undoChange` answers `nothing` for such a record (`writes/undo.ts:184`)". Also `DESIGN.md:266`: "(`+page.server.ts:26-27`, `writes.svelte.ts:420-421`)".
  - What is wrong: the rules file, "What every package obeys", says "A sentence in a document or a head comment that the change makes false is a defect of the change".
    - The step adds lines above all three cited places. The lines were checked on a scratch copy of the base files (`patch -R`) and on the worktree.
    - The bookmarks comment of `WriteTarget` was at `writes.ts:84-85` at the base and is now at `:89-90`.
    - The `undo === 'none'` line was at `undo.ts:185` at the base (already one off) and is now at `:188`.
    - `invalidateAll` was at `writes.svelte.ts:420-421` and is now at `:430-431`; `:420-421` now hold `setTimeout` and `try {`.
  - Brief item 7 has DESIGN.md:313 corrected in place for a sentence the step makes false. `DESIGN.md:266` is outside the brief's path list, but its citation drifts because of this step's insert.
  - Failure scenario: a reader follows `writes.ts:84-85` and lands in the overrides sentence of the `WriteTarget` doc, or follows `writes.svelte.ts:420-421` and finds a timer instead of the 403 reload.
  - Verdict: item 7 violated. The fix at landing is three numbers: `writes.ts:89-90`, `undo.ts:188`, `writes.svelte.ts:430-431`. Whoever lands after X3d and Q109 should recompute them, since those steps also touch DESIGN.md.

## 4. Behaviour

- `src/lib/server/edit/writes/undo.ts:192-199` and `writes.ts:524-526` against `src/lib/views/system/history/rows.ts:85-93`, `sentenceFor`: `return t('history.refused', word);` for any word it does not know.
  - What is wrong:
    - Ruling 10 adds a new undo answer word, `unwritable`. The History view words each undo answer through `sentenceFor`, whose doc says "The sentence for what the endpoint answered, never its own word". It has branches for `moved`, `gone`, `unknown`, `nothing` and `refused` only.
    - `send` (`writes.svelte.ts:439-442`) passes `body.error` through, so the row now reads "The undo was refused: unwritable", the wire word.
    - `config/text/views/system/history.yml` has no `history.unwritable` key. The test `tests/views/system/history.test.ts:98-118` ("has a sentence of its own for every word the endpoint answers, and never the word") still lists four words.
    - The rules file says that after changing a shape, every hit is carried. The report's table states the 500 answer but not what the History row says.
    - This is a reading of the code; no screen was looked at.
  - Failure scenario: a reader makes `behavior.yml`, `layout.yml` or `present.yml` read-only and presses undo on a setting, rail or deck row. The row says "The undo was refused: unwritable". Before the round, rail and deck said "This write cannot be taken back.", which was also wrong.
  - Verdict: none against item 4's text. Ruling 10's closure stops short of its one consumer.
  - The fix at landing: a `history.unwritable` sentence in `history.yml`, a branch in `sentenceFor`, and the word added to the test at `history.test.ts:99-104`. `rows.ts` and `history.test.ts` are outside the step's paths.
- `src/lib/server/edit/writes/config-key.ts:259-267`, `configKeyNow`: `try { ... readFileSync(join(configDir(engine), file), 'utf8') ... } catch { return none; }`.
  - What is wrong: a file the undo cannot read (mode 000, EACCES) answers not found, so the undo answers `404 { error: 'gone' }` ("What this write addressed is no longer in the hub"). The write path answers `500 { error: 'unwritable' }` for the same file.
  - Ruling 10's tests make the file read-only, which `valueNow` can still read, so this case is not exercised. Item 4 lists not-found for a missing key and an unparsed file only.
  - `railNow` and `deckNow` were not read for the same pattern.
  - Failure scenario: `behavior.yml` at mode 000, undo pressed on a setting row. The reader is told the setting is gone when it is still in the file.
  - Verdict: none (outside item 4's letter). Fix it at landing (let a read error other than ENOENT reach the undo's catch), or book it.
- `utils/diagrams/writes.mjs:189`: `const LOCAL = /\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;`.
  - What is wrong: ruling 5 asks the tool to draw no arrow for "a local variable that shadows an import". The pattern catches only `const name` and the other keyword-name forms. A destructured local (`const { plain } = x`) and a parameter (`(plain) =>`, `function f(plain)`) that shadow an import still draw a call or dotted reference arrow. Judgment call 10 states the opposite limit (an inner-block local hides the import for the whole body) but not this one.
  - Comments are blanked before the scan (`code.mjs` `codeOf`), so a comment cannot hide an arrow.
  - Failure scenario: a writer takes a parameter named like one of its imports. The write diagram draws an arrow to that module for a call the code does not make, and the reader of `docs/diagrams/writes.svg` sees a dependency that is not there.
  - Verdict: none. No module of the write chain does this today: `npm run diagrams` left the committed diagrams unchanged.

## Declined to judge

- The cost of each write (`loadConfig` twice, the five finders twice, `loadLocalOrDefaults` once). It was not measured, and the brief sets no bound.
- Whether the History wording fix (Behaviour 1) lands in this step or with S3c, which draws the Settings editor. That is the orchestrator's choice. It is a reader-visible string reached by the rail and deck undo today, not only by S3c's caller.
- Whether `textCatalog(before.config)` at `config-key.ts:282`, outside any catch, should answer something other than `500 unwritable` when the current `text:` tree is not a map. That has been so since round 0, and the brief's item 3 covers only an exception reading or writing the file.

Reviewer usage: tokens not visible to the reviewer; about 45 tool uses; time not measured.

## Closed (findings of the run over repair round 1, at landing on main)

- Spec 1, the malformed `config-key` body on `target()`: `tests/routes/edit/write.test.ts` builds that kind's target with `configTarget()`.
- Spec 2, the deck branch of `apply`: kept, as the finding says.
- Proof 1, the report's `HELP.md:256` row: the Before column gives the base's state.
- Standards 1, three stale line citations: `DESIGN.md` reads `server/edit/writes.ts:89-90`, `writes/undo.ts:188`, `writes.svelte.ts:430-431`, recomputed after X3d's landing.
- Behaviour 1, the History row worded "The undo was refused: unwritable": `history.unwritable` in `config/text/views/system/history.yml`, a branch in `sentenceFor` (`views/system/history/rows.ts`), the word in `tests/views/system/history.test.ts`, which failed first.
- Behaviour 2, an unreadable file's undo answering `gone`: `configKeyNow`, `deckNow` and `railNow` throw on `EACCES`, and `undoChange` reads the current value inside its catch; two tests in `tests/routes/edit/undo.test.ts` failed first with `expected 404 to be 500`.
- Behaviour 3, a destructured local or a parameter named like an import: `localsOf` in `utils/diagrams/writes.mjs` reads the body's syntax tree; four cases in `tests/checks/diagrams/diagrams.test.ts` failed first. `npm run diagrams` changed no committed diagram.
