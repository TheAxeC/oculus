# Step S3a refuter report (on .agents/worktrees/S3a, base 89bc8f36)

This report cites pages (the rules file, a standard, a skill's text) by their section, never by line number, because a page's lines move and its section names do not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams          (from the worktree's tools/oculus)
exit 0; git status --short afterwards lists the same six diagram files as before the run (layer-data, layer-views, layers .dot/.svg)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  352 passed | 20 skipped (372)
      Tests  5417 passed | 572 skipped (5989)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790813418945 COMPLETED 2484 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
ok built in 13.18s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(exit 0)

$ npx vitest run tests/checks/config tests/views/system/help.test.ts tests/views/system/config.test.ts tests/state/boards tests/views/boards/focus.test.ts --testTimeout 0
 Test Files  27 passed (27)
      Tests  557 passed (557)
$ npx vitest run tests/state/feeds/feeds.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)

spec.md ASCII gate (perl over src tests config, local.yml excluded): prints nothing.

Case 15, rerun (python3 over yaml.safe_load of options.yml and the five tracked files, each default compared with the file's value at its path):
checked 87 differences 0 families 21 {'appearance.yml': 14, 'behavior.yml': 44, 'layout.yml': 17, 'present.yml': 19, 'sources.yml': 14, 'local.yml': 16}
(matches the report's "checked 87 differences 0" and its per-file counts)

The unchanged tree: a copy of the worktree's tools/oculus under $TMPDIR (config/local.yml and .scratch not copied, node_modules symlinked), with `git diff 89bc8f36 -- tools/oculus/src tools/oculus/config` reverse-applied and the new options.yml and options.ts deleted; the step's tests kept as they are after the change:
$ npx vitest run tests/state/boards/focus-lanes.test.ts tests/state/boards/focus.test.ts tests/state/feeds/feeds.test.ts tests/views/boards/focus.test.ts tests/checks/config tests/views/system/help.test.ts tests/views/system/config.test.ts --testTimeout 0
 Test Files  7 failed | 3 passed | 1 skipped (11)
      Tests  12 failed | 212 passed | 9 skipped (233)
 failures: Cannot find module '.../config/options.ts' (options-catalog.test.ts via options-findings.ts, options-walk.test.ts);
 config-folder: expected [ 'agents', 'arch_color', ...(94) ] to deeply equal [ ...(93) ] and expected [ 'audit_ignore', ... (29) ] to deeply equal [ ...(28) ];
 TypeError: focusLabel is not a function (x3);
 expected [ 'HCC', 'HCC - chase', 'HCC: redraw' ] to deeply equal [ ...(3) ];
 expected 7 to be Infinity; expected 14 to be Infinity;
 expected [ 'litwatch', 'inbox', 'scout' ] to deeply equal [ 'scout' ];
 expected [ { feed: 'litwatch', days: null } ] to deeply equal [];
 expected 'Alpha' to be 'Alpha, the whole title';
 TypeError: LOCAL_KEYS is not iterable
```

Every failure message the report quotes for 16a to 16e, for ruling case 3, for LOCAL_KEYS and for config-folder came back in my run. My totals differ from the report's (`6 failed | 4 passed (10)`, `14 failed | 276 passed (290)`) because the two runs differ: the builder left `options.ts` in place and ran one file fewer. No decision rests on the totals.

## Verdicts

Items of the brief's "What to build":

- 1: **violated**. The `scan` family's `fields` leaves out the `tier` field, which a reader does read (Spec 1). Two descriptions say something the code does not do (Spec 2). Everything else in the item holds:
  - one `options:` key and six file maps;
  - the family rule in the head comment (options.yml:8);
  - the five named real cases;
  - default and control on every non-family entry;
  - `values` only on a choice;
  - 21 families, the brief's 22 less `indexes` (removed under Z130);
  - defaults equal to the tracked values (case 15 rerun).
- 2: **holds**. `options.ts` exports `CatalogEntry`, `Catalog`, `catalogOf` and `optionPaths` as specified, and its head comment explains why the walk stops at a family. `options-walk.test.ts` passes, and on the unchanged tree it fails because the module does not exist. One false sentence in the head comment is Standards 1.
- 3: **holds**. `options-catalog.test.ts` together with `options-findings.ts` covers every bullet of the item. The suite runs under `npm run test:checks`. The test's head says what it does not cover. The test that guards the "local.yml is never read" behaviour is weak (Proof 1).
- 4: **holds**. All parts are in place:
  - `LOCAL_KEYS` is exported (local.ts:92), and help.test.ts imports it.
  - `EXPECTED` gains `catalogs/options.yml`.
  - `desc_options` is the brief's sentence, word for word.
  - HELP.md:216 is reworded, and the table has the `agents` row (identical to desc_agents) and the `options` row.
  - DESIGN.md:44 matches the brief's text, and :85 gains both catalogs.
- 5: **holds**. Where each part is:
  - `focusLabel` is at focus.ts:323.
  - Lanes.svelte:218 hands the label to the card, and LaneCard draws `{label}` without reading any store.
  - ticker.ts:207, :329 and :374 call `focusLabel`.
  - Focus.svelte:98 and QuickAdd.svelte:40 still call `labelOf`; neither file is in the diff.
  - The layout.yml:168 comment and the presets.ts:190 comment are updated.
  - The catalog entry is `choice [short, full]` with default `short`.
  - Two notes: the ruling the item carries is Spec 3, and one sentence of the entry is Spec 2.
- 6: **holds**. `stale_days` is removed, and so are its comment, its `EXPECTED` row and `STALE_DAYS`. `staleAfter` now reads `refresh_stale_days` only and answers `Infinity` otherwise (feeds.ts:58-62). The doc comment and focus.test.ts:813 say "one key". The `refresh_stale_days` comment is kept and extended by one true sentence. The HELP.md row that still names the old key is Standards 2.

The cases ruling (S3a-cases.md):

- **Ruling 1** holds: grepping `no_funding` and `indexes` over src, tests, config (--exclude=local.yml), HELP.md, DESIGN.md and README.md finds no config key or sentence about them; only text-catalog words and unrelated identifiers remain.
- **Ruling 2** holds: `isNoFamily`, options-findings.ts:91-94.
- **Ruling 3** holds: feeds.ts:117-121, and the test "leaves a radar that has never run alone...".
- **Ruling 4** holds: neither `deck.selection` nor `deck.slide_order` is in options.yml.

Cases of the brief's "Cases":

- 1: met. The shipped-tree test passes, and it fails on the unchanged tree (options.ts missing; the builder's run with options.ts kept gives `options: missing or not a map...`).
- 2, 3, 4, 5, 6: met; options-catalog.test.ts has one row per input listed in each case, and all of them pass.
- 7, 8, 9, 10, 11: met (the same file; case 10's rows include "and does not throw").
- 12: met by reading. `findingsOf` takes its keys from the list the caller hands in. `readTracked` reads only the five tracked files (options-findings.ts:23, :256-264), and `loadConfig` leaves `local.yml` out (merge.ts:100). The guard test for this would still pass if the behaviour were taken out (Proof 1).
- 13: met ("accepts an empty list as a family and as a list"; the family-given-null row).
- 14: met (options-walk.test.ts; the bare-key row uses `bare:`, the same shape as a bare `indexes:`).
- 15: met (rerun above, 0 differences).
- 16a: met.
- 16b: partial. The card half is met: the test fails on the unchanged tree with `expected 'Alpha' to be 'Alpha, the whole title'`. The tab-name half has no test (Spec 4).
- 16c: met.
- 16d: met.
- 16e: met.
- 16, the ruling's case beside 16d: met.
- 16: met (help.test.ts, config-folder.test.ts and config.test.ts pass).
- 17: partial. The reader table is in the report. One family's field list is incomplete (Spec 1), and two descriptions are not true to their readers (Spec 2).

## 1. Spec

1. **The `scan` family omits a field a reader reads.**
   - Where: config/catalogs/options.yml:488-495. The catalog has `scan: ... description: ... its tier is the last segment of the folder ... fields: { dir, type, nested, optional }`.
   - What is wrong: every tracked `scan:` row also carries `tier:` (config/sources.yml:14-19), and that field is read:
     ```ts
     // src/lib/state/workbench/rail-badges.svelte.ts:172-182
     function projectTypeOrder(): string[] {
         const preset = selectors.boardPreset('projects');
         const rows = selectors.configMap().scan;
         ...
         return value.tier === preset.id && typeof value.type === 'string' ? [value.type] : [];
     ```
     This is the type order of the Projects tab's count split (`boardCells`, :191-196; `typeSplit` of an empty order returns no cells, rail-badges.ts:80-85).
   - What the brief asked: item 1 says "For a list of records, each record field". My comparison of each family's `fields` with the record fields the tracked files hold (a python walk) prints `sources.yml scan list file-only: ['tier']` and `sources.yml collections list file-only: ['icon', 'title']`. Every other family matches.
   - Failure scenario: S3c draws the `scan` family's fields from this entry. A reader who adds a scan row for a new project folder without `tier: projects`, or who removes `tier` because the editor never mentions it, empties or shortens the count split on the Projects tab button, and nothing names why.
   - Fix: add a `tier` line to `fields`, for example "the board whose tab counts this rule's types; `projects` puts the type in the Projects tab's split". The description should also stop presenting a project's tier (the folder's last segment) as if it were the only tier.
   - Verdict: item 1 violated, case 17 partial.
2. **Three descriptions are not true to their readers.**
   - (a) `refresh_stale_days.inbox` (options.yml:128-132) says "counted from the newest triage note under mail_dir. With no note yet there is no prompt."
     - What the code does: the nudge counts from the triage file's `run` date. That date is a top-level field of `<mail_dir>/triage.json`, written by the triage skill (triage.ts:64-78 reads `run`; mail/poll.ts:186 sends `notesRun: notes.run`; CommandCenter.svelte:58 passes it to `refresh`). DESIGN.md:397 agrees ("The file also carries the skill's own `run` date, which is what the Focus board's inbox nudge ... read"). A note written by the page's triage action keeps `held.run` (triage.ts:141), so it does not reset the count.
     - Failure scenario: a reader triages threads in the Inbox view, expects the inbox nudge to go away, and it stays until the skill writes `run`.
   - (b) `focus_label_mode` (options.yml:370-375) says it governs "the Focus board's lane cards and the week's ticker lines" and then "The full title is always on hover."
     - What the code does: a lane card has `title={project.title}` (LaneCard.svelte:75). A ticker row draws `{row.label}` in a button or span with no title attribute (ui/display/Ticker.svelte:303-322).
     - Failure scenario: under `short`, a reader hovers a ticker line to see the full title and gets nothing.
     - Fix: limit the hover sentence to the cards.
   - (c) `local.yml` `port` (options.yml:566-567) says "Without it the port is 8790, and 8787 is reserved."
     - What the code does: nothing refuses 8787. `grep -rn 8787 src` finds only the comment at local.ts:83, and the reader at local.ts:247-250 accepts any integer.
     - Failure scenario: a reader concludes the server will refuse 8787, sets a port expecting protection, and none exists.
   - Verdict: item 1 violated, case 17 partial.
3. **The brief carries a decision that the standing demands reserve for Axel, and the diff builds it.**
   - Where: config/layout.yml:168 `focus_label_mode: short      # Focus board cards and the week's ticker lines`, and ticker.ts:187, :207, :329, :374.
   - What is wrong: Axel's Z120 (a) says the comment "drops the ticker". Z122 (a) reverses that clause: the ticker lines take the key and the comment keeps the ticker. Z122 was closed "(the orchestrator, automode)" (plan.md Rulings; state file closed log, 2026-10-01 00:00), although:
     - the state file's own Z122 text says "Why this is not closed in automode: it changes a clause of your ruling, and a reversal of your ruling is yours";
     - the standing demand on automode lists "a reversal of a ruling Axel gave" under "Left open for Axel, never decided in automode".
   - The builder did what the brief asked. This is the same shape as an ADR contradiction the brief asked for: an open item for Axel, not a repair.
   - Failure scenario: Axel finds the ticker lines following `focus_label_mode` and the comment keeping the ticker, which is the opposite of his ruling's text, with no question ever put to him.
   - Verdict: none on the items (item 5 follows the brief).
4. **Half of case 16b has no test.**
   - The test comment at tests/views/boards/focus.test.ts:214-216 reads: "The project tab a press opens is named by the short handle (Focus.openProject), which needs a DOM and is not run here."
   - What is wrong: case 16b asks for a test that the project tab opened from the card is still named by the short handle. No test checks it.
   - By reading, it holds: Focus.svelte:96-99 `openView('project', { id, label: ... labelOf(project) })` is outside the diff (`git status --short` does not list Focus.svelte).
   - spec.md "What every package obeys" sends a press to the look at landing. The look should open a lane card on TEST with the key at `full` and confirm the tab name is the short handle.
   - Failure scenario: a later change routes `openProject` through `focusLabel`, and no test fails.
   - Verdict: case 16b partial.

## 2. Proof

1. **The local.yml guard test would still pass with the behaviour taken out.**
   - Where: tests/checks/config/options-catalog.test.ts:516-525:
     ```ts
     it('come from the reader of the file and are not read from a local.yml of the engine', () => {
         ... [`config/${LOCAL_NAME}`]: 'not_a_key: 1\n'
         expect(findingsOf(engine, ['hub', 'port'])).not.toContain(
             'local.yml: not_a_key: is not a key the machine-local file reads');
     ```
   - What is wrong: I changed `findingsOf` in a scratch copy so that it reads the planted `config/local.yml` and adds its keys to the key list. The copy lives under $TMPDIR, without the real local.yml, and the planted file is the test's own temporary fixture. The test still passed (`Tests  1 passed | 62 skipped (63)`). With that change the finding becomes `local.yml: not_a_key: has no catalog entry`, which the negative assertion never looks for.
   - The behaviour it guards, that the machine's own `local.yml` is never read, has a cost when broken: the real file holds machine paths and accounts.
   - Failure scenario: a later edit to `findingsOf` reads the engine's `local.yml`, and the suite stays green.
   - Fix: assert that no finding starts with `local.yml: not_a_key`. Or plant the sound fixture's tracked files beside it and assert `toEqual([])`.
   - Verdict: none (case 12 is met by reading).
2. **The report's claim that `tier:` has no reader is wrong, and a recommendation rests on it.**
   - Where: the builder's report, "Open items", S3a-2: "Three fields of tracked rows have no reader in `src`, the same shape as Z130: `tier:` on each `scan:` row (`config/sources.yml:14-19` ...)". The reader table also lists only `data/index.ts:47-58` and `manifests.ts:205-235` for `scan`.
   - What the rerun showed: `grep -rn "value.tier\|\.tier ===" src` prints `src/lib/state/workbench/rail-badges.svelte.ts:180: return value.tier === preset.id && typeof value.type === 'string'`. The field is read, by the Projects tab's count split.
   - The decision that rests on it: S3a-2 recommends (a), removing `tier` from the tracked rows "as Z130 (a) did".
   - Failure scenario: the orchestrator rules S3a-2 (a) in automode on the report's word. Every `scan` row loses `tier`, `projectTypeOrder()` returns `[]`, and the Projects tab button draws no count split. The `title:` and `icon:` half of S3a-2 does hold (see "Declined to judge").
   - Verdict: none.

## 3. Standards

1. **New comments describe work that does not exist yet, and one carries history.**
   - What the comments say:
     - src/lib/data/sources/config/options.ts:7-9: "The Settings editor draws the entries and the write that changes a key looks its entry up here".
     - tests/checks/config/options-findings.ts:3-5: "the shape the Settings editor and the write that changes a key rely on".
     - tests/checks/config/options-catalog.test.ts:9-11: "a write through the Settings editor changes the file and not the default, and it was compared once, when the catalog was written".
   - What is wrong: no Settings editor draws the catalog, and no `config-key` write exists; S3b and S3c build them (plan.md). spec.md "What every package obeys" says a sentence in a head comment that the change makes false is a defect. The brief already rewrote `desc_options` for this exact reason (brief check finding 1.1, Closed). "It was compared once, when the catalog was written" narrates a past event, which spec.md "What every package obeys" bans from comments.
   - Failure scenario: a reader of options.ts looks for the Settings editor or the write that uses the catalog and finds neither.
   - Fix: say "will draw" and "will look up", or drop the clause. Drop the history clause from the test head.
   - Verdict: none.
2. **HELP.md still names the removed key.**
   - Where: HELP.md:222, the `behavior.yml` row: "Thresholds, horizons and cadences: read limits, stale days, the context window, ...".
   - What is wrong: the diff removes the `stale_days` key, and this row still lists "stale days" among the file's contents. spec.md "What every package obeys" requires grepping each changed name and carrying the change into the docs.
   - Failure scenario: a reader looks for a `stale_days` key in behavior.yml and finds only `refresh_stale_days` and `stale_lag_days`.
   - Fix: "the refresh thresholds", or name `refresh_stale_days`.
   - Verdict: none.

## 4. Behaviour

None. The report states each change with its before and after:
- the label mode;
- the end of the code fallback for stale days;
- the removed keys;
- the new merged key;
- the map comment;
- the HELP.md and DESIGN.md rows.

## Declined to judge

- **`map_label_mode` accepts `short|title` (the builder's S3a-1).** Verified:
  - src/lib/state/boards/structure/graph.ts:83 checks `options.labelMode === 'title'`;
  - the board modes take `full` (presets.ts:304-308: "anything but `full` is the short handle");
  - the comment block at config/layout.yml:165-167 says `full` for every surface.

  The catalog's `values: [short, title]` follows item 1 ("the modes the code accepts"), so this is not a defect of the diff. Making the map accept `full` changes a config vocabulary, which is a user-visible shape and the orchestrator's or Axel's call. The new comment at layout.yml:174 is outside the brief's paths (layout.yml line 171 and 132-134) and is true.
- **`title:` and `icon:` on the `collections` rows (config/sources.yml:51-62).** Confirmed unread:
  - `collectionFiles` takes `key` and `file` only (src/lib/data/index.ts:60-69);
  - view-source.ts:45-53 and normalise.ts:60-69 read `key` and `file`;
  - a grep for `.title`, `.icon` and `configMap().collections` finds no other reader.

  The brief's items on unread keys (the cases ruling, Z130 (a)) name only `board.no_funding` and `indexes`, so they do not cover these fields. spec.md "The principles every package is judged on" ("no cockpit-only key") does. Whether to remove them at landing, as the same class as Z130 (a), is the orchestrator's call. The catalog's `collections` fields (`key`, `file`) are true as written. `tier` on the `scan` rows must not be removed with them (Proof 2).
- **The project tab's name and `focus_label_mode` (the builder's point).** Item 5 places the tab name outside the key ("The project tab's name and the quick-add picker keep `labelOf`"), and so does the catalog description. Focus.svelte:98 and QuickAdd.svelte:40 are unchanged. Whether the running page shows it is for the landing look (Spec 4).
- **900 lines against 1000 (the builder's point).** Not a contradiction and not a finding. tests/checks/tree/size.test.ts:4-5 says "The rule is the spec's: one source file under 1000 lines ... checked at 900 and 540 so a file is caught while it still has room to be split", and DESIGN.md:338 says the same.
- **Descriptions not checked.** I checked about 30 of the 124 entries against their readers:
  - appearance: `terminal.font_px`, all eight `wallpaper.*`, `crt.default`, `code_theme`, `themes`;
  - behavior: the three `refresh_stale_days.*`, `file_index.*`, `changes.keep`, `context_window`, `writes.timeout_seconds`, `search.*`, `notify.*`, `leads_badge_days`, `linkedin_cadence_days`;
  - layout: `direct_chord`, `rail`, `tab_split`, the four `*_label_mode`;
  - sources: `scan`, `collections`;
  - local.yml: `hub`, `port`, `hpc_host`, `claude_bin`, `open_bin`.

  The others were not verified. Two smaller points from the sample, neither false: `wallpaper.file` does not say that a name matching no image falls back to the first image (wallpaper.ts:54); options.yml:7 and options.ts:11 differ on whether a null is a leaf.
- **The `section` headings.** The builder chose eleven headings ("Audit", "Usage and sessions", "Thresholds and horizons", "Rail and pages", "Tab badges", "Project labels", "Project scan", "Registry and feed files", "Collections", "Roots", "Code theme") under the brief's decision 4. S3c will show them. The report does not list them as judgment calls; whether the words are right is a design reading.
- **The size of the config push.** The `options` key adds 33,136 bytes of JSON to every `config` push (python3, `len(json.dumps(...))` of options.yml). The brief accepted the catalog riding in the merged config (brief check 4.2, Closed; Z121 (1)). I did not judge the cost.
- **The look on TEST.** Not taken; the reviewer starts no server and opens no page.

Reviewer usage: about 285,000 tokens (from the context counter), 75 tool uses, minutes not measured.

## Repair round 1, refuted

Reviewed in the worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/S3a against base 89bc8f36. The diff since the base: `git status --short` lists 27 modified paths and 6 untracked ones. The round added two paths that were not in the 31 of the round base: src/lib/state/boards/structure/graph.ts and tests/state/boards/structure/graph.test.ts. Today's `git diff --binary 89bc8f36 | shasum` is 309ca424..., and the round base's was 5ee29d52....

How I found the round's delta: eleven files were modified after the round was sent at 02:25 (`stat -f "%Sm %N"`):
- config/catalogs/options.yml
- src/lib/data/sources/config/options.ts
- tests/checks/config/options-findings.ts
- tests/checks/config/options-catalog.test.ts
- config/text/views/system/config.yml
- HELP.md
- config/layout.yml
- config/sources.yml
- src/lib/state/boards/structure/graph.ts
- tests/state/boards/structure/graph.test.ts
- tests/checks/config/config-folder.test.ts

I read each of these in full, and judged them against the whole diff since the base.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams          (worktree tools/oculus)
exit 0; git status --short lists the same six diagram files as before (layer-data, layer-views, layers .dot/.svg)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  352 passed | 20 skipped (372)
      Tests  5418 passed | 572 skipped (5990)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  438 passed | 9 skipped (447)
$ npm run check
1790815544012 COMPLETED 2484 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 5.34s
built in 11.55s
   (each of the two lines opens with a check-mark glyph, left out here under the ASCII rule)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(exit 0)

$ npx vitest run tests/checks/config tests/views/system/help.test.ts tests/views/system/config.test.ts tests/state/boards tests/views/boards/focus.test.ts tests/state/feeds/feeds.test.ts --testTimeout 0
 Test Files  28 passed (28)
      Tests  566 passed (566)

Round report row 7, rerun:
$ npx vitest run tests/checks/config tests/data tests/views/structure --testTimeout 0
 Test Files  33 passed (33)
      Tests  557 passed (557)          (matches the report)

Round report row 3, rerun on the step's code:
$ npx vitest run tests/checks/config/options-catalog.test.ts -t "not read from a local.yml" --testTimeout 0
 Test Files  1 passed (1)
      Tests  1 passed | 62 skipped (63)   (matches the report)

Round report row 5, rerun:
$ grep -rn "stale days\|stale_days" src tests config HELP.md DESIGN.md README.md --exclude=local.yml | grep -v refresh_stale_days
src/lib/views/shared/card/ProjectCard.svelte:60 (the manifest-age warning), options-walk.test.ts:21-22,45-46, config.test.ts:374-505 (fixture keys), feeds.test.ts:156,162
(the same hits the report names; no false sentence left)

"Failed before" claims, reproduced on a scratch copy under $TMPDIR (rsync of the worktree's tools/oculus without node_modules, .svelte-kit, build, .scratch and config/local.yml; node_modules symlinked; `test -e config/local.yml` printed no-local). The copy passed graph.test.ts and options-catalog.test.ts unchanged: Test Files 2 passed, Tests 83 passed.

1. Ruling 6, with graph.ts:83 changed back to `options.labelMode === 'title'` in the copy only:
 FAIL |unit| tests/state/boards/structure/graph.test.ts > relationship graph > names a project node by the label mode: the full title under full, the short name otherwise
AssertionError: expected 'Al' to be 'Alpha, the whole title' // Object.is equality
      Tests  1 failed | 19 passed (20)
Restored afterwards, `cmp` equal to the worktree file.

2. Ruling 3, with a mutant of findingsOf in the copy only. The mutant reads <engine>/config/local.yml with yaml and adds its keys to localKeys:
 FAIL |unit| tests/checks/config/options-catalog.test.ts > the machine-local keys > come from the reader of the file and are not read from a local.yml of the engine
AssertionError: expected [ Array(1) ] to deeply equal []
+   "local.yml: not_a_key: has no catalog entry",
      Tests  1 failed | 62 passed (63)
Restored afterwards, `cmp` equal. The only local.yml the mutant read was the test's own planted fixture; the copy has none, and the scratch copy has been removed.

Case 15 rerun (python3 over yaml.safe_load: each non-family default compared with the current file's value at its path; the round changed no value of an option that has a default):
checked 87 differences 0 families 21 {'appearance.yml': 14, 'behavior.yml': 44, 'layout.yml': 17, 'present.yml': 19, 'sources.yml': 14, 'local.yml': 16}
The same script compared each list family's `fields` with the record fields in the tracked file and printed no file-only field. In the first review it printed `scan: ['tier']` and `collections: ['icon', 'title']`.

spec.md ASCII gate (perl over src tests config, local.yml excluded): prints nothing. LC_ALL=C grep over HELP.md and DESIGN.md: nothing.
yaml.safe_load of options.yml, sources.yml, layout.yml, behavior.yml and text/views/system/config.yml: ok.
```

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- **Item 1: violated, on one sentence (Findings, Spec 1). Fixable at landing.**
  - Spec 1 of the first review is closed: the `scan` family's `fields` now include `tier` (options.yml:496), true to rail-badges.svelte.ts:172-182, and preset.id is the view id 'projects' (selectors.svelte.ts:144-146).
  - Spec 2 of the first review is closed. I checked each corrected description against its reader:
    - (a) inbox: triage.ts:61-78 reads `run`, and `writeNote` (triage.ts:99-124) writes back `held` with `run` kept.
    - (b) hover: LaneCard.svelte:75 has `title={project.title}`; Ticker.svelte:303-322 has no title.
    - (c) port: local.ts:247-250 checks for an integer only.
  - The two corrections beyond the rulings are inside item 1 and case 17, and both are true:
    - `wallpaper.file` matches wallpaper.ts:47-57.
    - options.yml:7 matches options.ts:10.
  - Still true: everything else the first review found holding, and case 15 with 0 differences.
- **Item 2: holds.** The head comment of options.ts still describes callers that do not exist (Findings, Standards 1).
- **Item 3: holds.** The local.yml guard now fails under the mutant (above).
- **Item 4: holds.** HELP.md:222 and `desc_behavior` (config/text/views/system/config.yml:6) now name `refresh_stale_days`. help.test.ts:331 requires the manual to contain each `desc_<name>` text, so the two had to change together.
- **Item 5: holds as built.**
  - focus.ts:323, Lanes.svelte:218 and ticker.ts:187, :207, :329 and :374 are unchanged since the round base.
  - The catalog entry at options.yml:370-375 now limits the hover sentence to the lane cards.
  - The ticker clause is Z131, Axel's; see "Declined to judge".
- **Item 6: holds.** HELP.md no longer names `stale days`.

The round's own rulings:

- **Ruling 6 (Z132): holds.**
  - graph.ts:83 reads `'full'`.
  - The catalog entry gives `values: [short, full]`.
  - graph.test.ts:264 fails before the change (reproduced above).
  - Map.svelte:66-70 passes the string through unchanged.
  - The per-key comment at layout.yml:174 is back to the base text "Map tab nodes", not the "short|full" the ruling wrote. I judge this met: the block comment directly above, at :165-167, defines `short` and `full` for all four keys, and no reader is misled.
- **Ruling 7 (Z133): holds.**
  - The `collections` rows keep only `key` and `file` (sources.yml:51-62). No reader takes `title` or `icon` on a row: data/index.ts:61-69, view-source.ts:45-53, normalise.ts:60-69, entries.ts:72, undo.ts:79, pty/context.ts:46 and portfolio.ts:124 and :172 read `key` or `file`.
  - The two lines the round removed from config-folder.test.ts ("uses glyph names for every configured icon") read `icon` on those rows, so with the field gone they would have checked nothing. The next test, "names a glyph only where the source or another config file reads it", still passes, so no glyph lost its last reader when the icons were removed. No check guarding a live behaviour was removed.

The cases ruling (S3a-cases.md):

- Ruling 1 holds. A grep for `no_funding` and `indexes` over src, tests, config (with --exclude=local.yml), HELP.md, DESIGN.md and README.md finds only text-catalog words and unrelated identifiers.
- Ruling 2 holds (`isNoFamily`, options-findings.ts:91-94).
- Ruling 3 holds (feeds.ts:116-120; the test in feeds.test.ts that leaves a never-run radar alone).
- Ruling 4 holds: neither `deck.selection` nor `deck.slide_order` is in options.yml.

Cases of the brief's "Cases":

- 1: met. The shipped-tree test passes inside test:checks.
- 2 to 11: met. options-catalog.test.ts has one row per input, all passing.
- 12: met, now by a test as well as by reading. Planting `hub: /x` and `not_a_key: 1` beside the sound fixture gives `toEqual([])`, and that fails under the mutant that reads the planted file.
- 13: met.
- 14: met (options-walk.test.ts).
- 15: met (0 differences, rerun above).
- 16a, 16c, 16d, 16e, and case 16 beside 16d (from the cases ruling): met. None of these files changed in the round, and they pass in the focused run.
- 16b: partial. The card half is met. The tab-name half has no test; ruling 8 sends it to the landing look (Findings, Spec 2).
- 16: met. help.test.ts, config-folder.test.ts and config.test.ts pass.
- 17: partial. The scan description has one false sentence (Findings, Spec 1). Every other description the round touched is true to its reader in code.

### Findings

- **Spec 1. config/catalogs/options.yml:490 (scan entry, rewritten in this round under ruling 1).**
  - The text: "A project is any subfolder that holds a project.yml, and the project's own tier is the last segment of its folder."
  - What is wrong: "its folder" reads as the project's own folder. The last segment of that folder is the project's id (manifests.ts:126, `const id = folder.split('/').pop()`). The tier is the last segment of the scan rule's `dir` (manifests.ts:210, `const tier = (rule.dir.split('/').pop() ?? rule.dir)`), so a nested rule's projects at projects/coauthor/<category>/<id> all get the tier `coauthor`. Ruling 1 asked for the entry's true meaning.
  - Failure scenario: a reader of the catalog, or of the S3c Settings row drawn from it, concludes that the project in projects/active/hccnet has the tier `hccnet`. They then file projects expecting the folder name to set the tier, while the walk gives `active`.
  - Fix at landing, one phrase: "the project's own tier is the last segment of the rule's dir (projects/active gives active)".
  - Verdict: item 1 violated, case 17 partial.

- **Spec 2. Carried from the first review's Spec 4: case 16b's tab-name half.**
  - Where: tests/views/boards/focus.test.ts:214-216, "The project tab a press opens is named by the short handle (Focus.openProject), which needs a DOM and is not run here."
  - What is wrong: no test checks that the tab opened from a card is named by the short handle. Ruling 8 sends this to the look at landing; the round made no change, as ruled. By reading it holds: Focus.svelte is outside the diff and calls `labelOf`.
  - Failure scenario: a later change routes `openProject` through `focusLabel`, and no test fails.
  - Verdict: case 16b partial. Disposition per ruling 8: the landing look opens a lane card with the key at `full` and reads the tab's name.

- **Standards 1. src/lib/data/sources/config/options.ts:7-8 and tests/checks/config/options-findings.ts:3-5. The first review's Standards 1 is only partly closed.**
  - The text, options.ts: "An editor of the settings and a write of one key look an option up here, so a key path has one meaning wherever it is used."
  - The text, options-findings.ts: "the shape an editor of the settings and a write of one key look up".
  - What is wrong: ruling 4 asked the comments to "name no editor or write as existing" and gave the purpose form ("for an editor of the settings and a write of one key to look up"). The new text states in the present tense that an editor and a write look options up here. `grep -rn "catalogOf\|optionPaths\|config/options" src tests` finds no caller outside the check's own files (options-findings.ts:16-19, :195, :274; options-walk.test.ts). The round report's row 4 says "no editor or write is named as existing", which the present tense contradicts. The history clause in options-catalog.test.ts is gone, and that part of ruling 4 holds.
  - Failure scenario: a reader of options.ts looks for the editor or the write that looks an option up, finds neither, and cannot tell whether one is missing. Or a maintainer changing the catalog's shape holds back, believing an editor depends on it.
  - Fix at landing, a few words in each comment: "for an editor of the settings and a write of one key to look an option up".
  - Verdict: none.

- **Behaviour 1. The builder's report, "User-visible changes", item 5 (S3a-report.md:112), together with round row 6.**
  - The text: "`config/layout.yml:174` comment: `map_label_mode: short        # Map tab nodes; its word for the full title is `title``."
  - What is wrong: that comment no longer exists. `git diff 89bc8f36` shows no change at layout.yml:174, which is back to the base text "# Map tab nodes". The round's opening paragraph (S3a-report.md:288) lists what it supersedes and does not name this item.
  - The round's host-visible change has no before and after in that section:
    - Before: `map_label_mode: title` drew full titles on the Map, and `full` drew the short handle.
    - After: `full` draws full titles, and `title` draws the short handle (graph.ts:83; graph.test.ts:271-274).
    - The tracked value is `short`, so the tracked hub shows no change.
  - Failure scenario: the landing look reads "User-visible changes" as the spec's rules say. It looks for a comment that is not there, and it is not told that a hand-set `title` now gives the short handle.
  - Fix at landing: rewrite item 5 with the before and after above.
  - Verdict: none.

No Proof finding:
- The three rerun claims reproduce: the graph test fails before the change, the local.yml guard fails under the mutant, and the 33-file run matches.
- No check was loosened.
- The config-folder.test.ts edit is judged under ruling 7 above.

### Declined to judge

- **Z131, the ticker clause**, is Axel's ruling: whether the week's ticker lines follow `focus_label_mode` (as built, ticker.ts:187, :207, :329, :374) or keep the short handle (his Z120 (a) text). I judged item 5 as built.
- **The round's exact delta inside the four untracked files** (options.yml, options.ts, options-findings.ts, options-catalog.test.ts), and inside tracked files both rounds changed: only a shasum of the round base was recorded, so no diff against the round base exists. I read each file in full and judged the whole diff since the base. A change in them that the report's rows do not name could not be singled out as round work, but it was still read.
- **Descriptions outside the round:** not re-sampled beyond the first review's sample of about 30 entries and every entry this round touched.
- **The builder's proposal of a check comparing a family's `fields` with the tracked records:** a new computed check needs Axel's approval of what it computes (scripts-compute-facts), so it is not a finding here.
- **src/lib/data/sources/config/local.ts:83, "the reserved port 8787 is never used":** a sentence that existed before the step, outside the diff. Nothing refuses 8787 (local.ts:247-250). The diff does not make it false, so it is not a finding of this step.
- **The look on TEST:** not taken. The reviewer starts no server and opens no page.

Reviewer usage (completion notice): reviewer a193060d0c81340e9, served claude-opus-5-5, 239,655 tokens, 70 tool uses, 23.7 min.

## Closed

The run over repair round 1 is the run over the last round the cap allows, so none of its findings goes back to the builder. Each is small and inside the brief, and each is fixed on main at S3a's landing:

- Spec 1: `config/catalogs/options.yml:490`, the `scan` description names the tier as the last segment of the rule's `dir` (`projects/active` gives `active`), true to `manifests.ts:210`.
- Spec 2: the landing look opens a lane card with `focus_label_mode: full` and reads the name of the project tab it opens, per ruling 8 of `agents/briefs/S3a-round1.md`.
- Standards 1: `src/lib/data/sources/config/options.ts:7-8` and `tests/checks/config/options-findings.ts:3-5` state the purpose form, "for an editor of the settings and a write of one key to look an option up".
- Behaviour 1: item 5 of the report's "User-visible changes" (`agents/reviews/S3a-report.md:112`) is rewritten with the before and after of `map_label_mode` (`title` now gives the short handle, `full` the full title; the tracked value `short` shows no change).
