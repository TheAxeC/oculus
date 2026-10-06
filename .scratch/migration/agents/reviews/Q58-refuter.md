# Step Q58 refuter report (on .agents/worktrees/Q58, base e9a53f16)

The first review, by a fresh reviewer agent (claude:opus) that changed nothing; saved by the orchestrator as the agent returned it.

## Verification (rerun by the reviewer)
```
npx vitest run --reporter=dot
  Test Files  271 passed (271)
       Tests  4402 passed (4402)          (no timeout, no rerun needed)
base e9a53f16, same command in a git-archive copy with node_modules linked:
  Test Files  262 passed | 1 skipped (263)
       Tests  4380 passed | 15 skipped (4395)
npm run check
  COMPLETED 1300 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS   (exit 0)
npm run build
  built in 11.83s   (exit 0)
npm run format:check
  All matched files use Prettier code style!
npm run lint
  exit 0, no output
ASCII gate (perl form)
  prints nothing, exit 0
sh bin/size-check.sh      exit 0
sh bin/folder-check.sh    exit 0
bin/folder-check.sh over a git-archive copy of e9a53f16
  23 lines ("config holds 11 items ...", ..., "tests/views holds 54 items ..."), exit 1
npm run test:browser      (port 8792 free on first probe)
  271 passed (7.0m)
Commands the report quotes:
node bin/revert-check.mjs tests/checks/tree/size.test.ts
  10 reverts, 0 unproven, 0 unchecked                     (matches the report)
node bin/revert-check.mjs tests/checks/tree/audits.test.ts tests/checks/tree/boundaries.test.ts
  19 reverts, 0 unproven, 0 unchecked                     (one of them is a false proof, see 2)
npx vitest run tests/checks/config/config-folder.test.ts   Tests 22 passed (22)   (matches)
npx vitest run tests/checks/tree/boundaries.test.ts        Tests 10 passed (10)   (matches)
npx vitest run tests/checks/source/history.test.ts         Tests 1 passed (1)
browser system.spec.ts: 5 cases, all passed in the full run above (matches)
Reviewer's own reverts, in a scratch copy of the worktree:
  boundaries.test.ts:116 set to `return [`views/${parts[1]}/**`];` -> 1 failed | 9 passed ("catches a violation of every row it can be shown one of")
  audits.test.ts:186 set to `const names = renderNames(text);` -> 2 failed | 5 passed (the new planted case, and the real tree's audit list)
Route URLs: the 23 `+server.ts` paths under src/routes with `(group)/` segments removed are identical to base (diff of the two sorted lists is empty).
```

## 1. Spec
- src/lib/views/ and config/text/views/: brief decision 2 fixes the non-listed views at `views/opened/` and `config/text/views/opened/`. Neither folder exists: deposit, editor, person and project sit under boards/, doc, document, file, note and source under sources/, slides under academic/. The report states it as judgment call 1, with the reason that `views/` would reach eleven. That count is right: registry.ts, shared/ and the eight groups are ten tracked items. But the brief named the shape. The clash between decision 2 and the ten-items rule goes to a ruling. It should not be settled by a substitute layout. The reason also does not hold for `config/text/views/`, which holds eight group folders and has room for an `opened/`.
- Brief, Tests 1, says "with no case renamed". The report says 175 case names changed: 172 through the move map, 3 by hand, among them the history audit's `names no package id, date or session in any comment` renamed to `... in any comment or document` (tests/checks/source/history.test.ts:125). Its DONE row "Case count" does not say that this part of the brief is unmet.
- Brief item 2 says "`tests/` mirrors `src/lib` where a test has a source counterpart", and the report's folder map says it mirrors. It does not for: tests/ui/tab-strip.test.ts (src/lib/ui/tabs/tab-strip.ts), tests/ui/tree-keys.test.ts (src/lib/ui/tree/tree-keys.ts), tests/state/workbench/preview.test.ts and show-in-files.test.ts (src/lib/state/workbench/layout/open/), tests/server/sessions/codex.test.ts and turns.test.ts (src/lib/server/sessions/stores/).
- Brief item 4, history wording out of every file of `tests`: tests/checks/tree/allow-duplication.txt:740-743 still name step ids ("the split of Q51", "which Q48 grew", "Q51's new part test").
- Brief item 4, "what the code did before", in src: src/lib/server/edit/writes.ts:20 "split out when one file passed nine hundred lines", :23 "Everything they export that this file exported before the split is re-exported here", :135 "under the name this file gave them before the split". Also src/lib/state/workbench/layout.svelte.ts:136 "What moved out is per-instance work".
- The brief's premise, line 7, gives `src/lib/views/Files.svelte 566`. The base bin/size-allow.txt listed it at 587, and `wc -l` at base gives 566. The premise was right about the file and the list was stale. No finding against the build.

## 2. Proof
- tests/checks/tree/audits.test.ts:292: the new case's directive is `revert: tests/checks/tree/audits.test.ts:221 => const names = renderNames(text);`. Line 221 is `    return dir;` inside the `scratch` helper. The import-following call is at line 186. revert-check prints red for it, but the case turns red because the scratch helper breaks, not because the import-following is removed. The report counts it among the 154 proven lines. The real revert at :186 does turn the case red (2 failed | 5 passed), so the rule is held. The directive is wrong and gives a false proof.
- The DONE row "History wording out ... tests/checks/source/history.test.ts passes over comments of src, tests, bin, config" is not what that check reads. `isComment` (history.test.ts:75-83) recognises `#` only in `.yml`. A `#` comment in `bin/*.sh`, and any line of a `.txt` file, is never read. So the audit is green over allow-duplication.txt:740-743, which carry Q51/Q48. The prose patterns ("before the split") are also outside its vocabulary.
- Allow lists, each compared with base with paths stripped: allow-styling.ts, allow-audits.txt, allow-negatives.ts, allow-duplication.txt, bin/size-allow.txt, FROZEN, ownPartials and the audits import-following each hold the same rule; no new clone admitted and no rule loosened.
- The report says 16 unproven revert lines are booked into Q59, yet its first line reads "Everything in the brief is done". Not verified by the reviewer: whether those 16 are all inherited from base.

## 3. Standards
- DESIGN.md:178 and :266 name `views/boards/focus/LaneHead.svelte`; the file is at src/lib/views/boards/focus/lanes/LaneHead.svelte. DESIGN.md:247 `shared/EntryForm.svelte` is now shared/forms/. :268 `shared/ChangeCounts.svelte` is now shared/changes/. :275 `repositories/Repo.svelte` is now views/sources/repositories/.
- Head comments made false by the moves: `shared/ProgramButton.svelte` (now shared/links/) at CardDocs.svelte:8, EntryCard.svelte:14, File.svelte:43, Source.svelte:32; `shared/BookmarkStar.svelte` (now shared/links/) at File.svelte:40, Source.svelte:28; `shared/ChangeCounts.svelte` (now shared/changes/) at ChangeGroups.svelte:9, repositories/Changes.svelte:13; `shared/Markdown.svelte` (now shared/prose/) at source/Preview.svelte:3; `files/Sections.svelte` and `files/ShowPath.svelte` at Files.svelte:41 and :62.
- History in comments: src/lib/server/edit/writes.ts:20, :23, :135, src/lib/state/workbench/layout.svelte.ts:136 and tests/checks/tree/allow-duplication.txt:740-743.
- Path rewrites left comment lines past the column the file is wrapped at (tests/checks/tree/boundaries.test.ts:28-30, :119-120; src/lib/views/system/config/files.ts:7; src/lib/server/content/audit.ts:6; src/lib/state/client/writes.svelte.ts:6). Cosmetic; breaks no rule of spec.md.
- The 61 empty directories left on disk are untracked and count for nothing.

## 4. Behaviour
- Config view. Before: one card per top-level `.yml`, the five vocabularies named `glyphs.yml` and so on and sorted among the others, then local.yml. After: the five cards are titled `catalogs/glyphs.yml`, `catalogs/icons.yml`, `catalogs/manifest-schema.yml`, `catalogs/meta.yml`, `catalogs/vocab.yml` and sit together after the top-level files, then local.yml. The report has no before-and-after for the look on the TEST page.
- The file browser's engine root: the five catalogs open at `catalogs/<name>.yml`. The report does not state it.
- No URL changed and the rail groups are unchanged; no other reader-visible difference was found.

## Not checked
- revert-check over the other 29 test files that carry directives.
- The 706 renames with edits: read as a sample (all 70 modified files' configuration and script diffs, the four allow lists, boundaries.test.ts, audits.test.ts, history.test.ts, type-scale.test.ts, the Config view pair and the heads of all 32 added files), plus a grep that no old full path or lib-relative module path remains outside synthetic test data.
- Whether each split test file moved its cases whole, body by body.
- The look on the TEST page in Chrome (the orchestrator's).

Reviewer usage: 208,729 tokens, 76 tool uses, 23 minutes (the harness's count).

## Repair round 1, refuted

The run over repair round 1, by a fresh reviewer agent (claude:opus) that changed nothing; saved by the orchestrator with some sentences shortened, every finding, location and number kept.

### Verification (rerun by the reviewer)
```
(all from tools/oculus in .agents/worktrees/Q58; index tree 7a7696f9e9218c924691c07ae299eb9909ad8298, no unstaged changes)
npx vitest run --reporter=dot
  Test Files  271 passed (271)
       Tests  4403 passed (4403)        (no timeout, no rerun)
npm run check
  COMPLETED 1278 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS   (exit 0)
npm run build            exit 0
npm run format:check     All matched files use Prettier code style!
npm run lint             exit 0, no output
ASCII gate (perl form)   prints nothing, exit 0
sh bin/size-check.sh     exit 0
sh bin/folder-check.sh   exit 0
node bin/revert-check.mjs over the 17 node test files the round changed that carry a directive
  73 reverts, 14 unproven, 347 unchecked
  (the 14: form-drafts 7, writes-collection 2, explorer 2, person 2, leads 1; the Q59 set)
node bin/revert-check.mjs tests/browser/sources/repositories.spec.ts tests/browser/sources/files.spec.ts
  3 reverts, 0 unproven, 31 unchecked
node bin/revert-check.mjs tests/browser/sources/files-forms.spec.ts tests/browser/workbench/tabs.spec.ts
  13 reverts, 0 unproven, 19 unchecked
node bin/revert-check.mjs tests/browser/workbench/unsaved-forms.spec.ts
  8 reverts, 1 unproven, 12 unchecked   (form-drafts.svelte.ts:279 blank or comment; the Q59 set)
node bin/revert-check.mjs tests/browser/boards/focus-buttons.spec.ts
  14 reverts, 0 unproven, 5 unchecked
node bin/revert-check.mjs tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts
  19 reverts, 0 unproven, 0 unchecked
Reviewer's own checks (scripts in the scratchpad, reading the trees through git show):
  every revert directive, pre-round vs now, target line text compared: 170 compared, 2 differ
    (audits.test.ts:292, the intended fix; size.test.ts:103 -> bin/size-allow.txt:3, see 2)
  every src|tests|bin|config path:line reference in the tree and the three documents, pre-round vs now:
    252 compared, 2 differ (the same two); 10 short-form references, 0 differ
  every absence under tests/views and tests/browser, the line above it pre-round vs now: 3 changed
  duplication test with the round's MODULE rewrite reverted in the three git tests (scratch copy):
    Tests  9 passed (9)
  history test with `|| file.endsWith('.sh')` reverted (scratch copy): 1 failed | 1 passed
  allow-duplication.txt "at A and B" checked against where each entry's mark first sits:
    now 181 of 735 wrong; pre-round 179; base e9a53f16 69 of 742
  comment lines over 100 columns not verbatim in the base tree (directives left out): 22
  empty folders under src tests bin config: 0
```

### 1. Spec
- Brief, agents/briefs/Q58.md:33 against :22 and :14. The amended decision 2 says "A view opened for something rather than listed sits in the rail group it is opened from". Item 2 (line 22) still says "and the non-listed views under one group for views opened for something", and the premise at line 14 still lists those views as a group of their own. The brief now contradicts itself.
- Brief decision 2, the amendment itself. Axel's ruling (3) (orchestrator-state.md:112) covers "one subfolder per rail group the views sit in". The ten views opened for something sit in no rail group, so the ruling does not say where their catalogs go. The first review sent this to a ruling; the round settled it by amending the brief. That is a folder convention in `config/text/views/`, which the hub rules call user-visible. The eleven-items reason holds only for `src/lib/views/`; `config/text/views/` holds eight group folders and has room for an `opened/`. If the orchestrator counts this as its own reversible decision, it should still be booked as an open item and not closed silently.
- Brief Tests 1, amended to "No case is renamed except where its name carries a path ... or where the check it names now reads more than it did". The second exception fits exactly one case, the hand rename in tests/checks/source/history.test.ts:125, so the acceptance line was widened after the fact to match what was built. Keeping the old name and adding a new case would have met the original line.
- tests/server/git/deposit.test.ts:47-49, git-write.test.ts:44, git.test.ts:46. No finding and no brief item asks for the `fileURLToPath(new URL(...))` rewrite. Its stated reason is not reproduced (see 2).
- Brief item 2, "tests/ mirrors src/lib where a test has a source counterpart". The round's closure is partial: tests/views/shared/ is flat while its sources are in subfolders (card-layout.test.ts and cardlinks.test.ts cover shared/card/, crosslinks.test.ts covers shared/links/, intro.test.ts covers shared/prose/Intro.svelte), and tests/server/accounts/calendar/oauth.test.ts tests src/lib/server/accounts/connect/oauth.ts.

### 2. Proof
- Report, round bullet 6: "tests/checks/tree/duplication.test.ts failed on (`is not held anywhere under tests`, three pairs, mark be5931d3846b)". Not reproduced: with the three MODULE blocks put back to the pre-round form in a scratch copy, the duplication test gives `Tests 9 passed (9)`. The mark is in no allow list.
- Report, round bullet 7, the positions in allow-duplication.txt: for 181 of its 735 entries the "at A and B" position is not where that entry's mark first sits (pre-round 179, base 69). Entries 229 to 234 were not re-pointed after the MODULE rewrite (line 229 says "at 58 and 71" where the mark sits at 52 and 63); line 461 `fs.test.ts ... show-in-files.test.ts 000c5e17b995 at 276 and 520`, where the mark is at 59 and 534; lines 593 and 595 for glyph.test.ts and tag.test.ts.
- Report, round bullet 7: "Comment lines over 100 columns that are not in the base tree verbatim ...: none". Not reproduced: 22 such lines, all one-line `/** ... */` or `/* ... */` doc comments a path rewrite lengthened, for example src/lib/data/sources/present.ts:33 (107), src/lib/server/core/socket.ts:27 (109), src/lib/views/system/config/Config.svelte:62 (113), src/lib/ui/controls/Glyph.svelte:54 (110), tests/state/client/entities.test.ts:19 (109).
- Report, round bullet 7: "three such comments are split with the reason whole on the last line". In two of the three it is not: tests/browser/sources/repositories.spec.ts:356 reads only "// so the line says nothing.", and tests/browser/views/inbox.spec.ts:33 "// so it offers no control over a file.", the cause on the line before each.
- Report, round bullet 4: "Every path in a comment ... resolves". Not true: `config/text.yml` is named at src/lib/state/feeds/feeds.ts:10, src/lib/state/boards/ticker.ts:80, src/lib/state/boards/focus.ts:5, src/lib/state/client/socket.svelte.ts:8, tests/state/words/format.test.ts:1, tests/state/workbench/arrangement.test.ts:44, tests/state/workbench/layout/layout-store.test.ts:37, tests/views/boards/deposit.test.ts:4 and tests/views/boards/editor.test.ts:5; `config/text-oculus.yml` at src/lib/server/core/hooks.ts:139 and tests/views/boards/deposit.test.ts:5. DESIGN.md:233 says the six kinds are under `views/present/`; they are in src/lib/views/academic/present/parts/.
- tests/checks/tree/size.test.ts:103 `revert: bin/size-allow.txt:3 => ...`: the reflow changed what line 3 holds and the directive was not re-pointed. The case still turns red.
- tests/checks/source/history.test.ts:141 names only the `.txt` revert (`:83`); the `.sh` reading at :84 has no directive. The reviewer's manual revert turns the planted case red.
- Report DONE table, row "Every revert line proven": "over the 32 test files that carry one"; the other two places say 33, and `grep -rlE '//\s*revert:' tests | wc -l` gives 33.

### 3. Standards
- config/catalogs/vocab.yml:155-163. spec.md: "One line per paragraph or bullet in any Markdown or YAML you edit. No hard wrapping." The round hard-wrapped a one-line YAML comment paragraph into nine lines; config/catalogs/icons.yml:1-2 and :6-8 were rewrapped too.
- DESIGN.md:275 still names `repositories/Repo.svelte` (now views/sources/repositories/Repo.svelte); DESIGN.md:233 `views/present/` is stale as well.
- tests/checks/source/history.test.ts:1-6 and :49-52. The head comment does not say that every line of a `.txt` is read; the DATE doc comment says a date that is data "sits in code, which this audit does not read", false for a `.txt` file now.
- src/lib/server/edit/writes.ts:20-23. "so an importer names either": "either" has no referent after the rewrite.
- bin/folder-check.sh:6-7. A short ragged line after the wrap. Cosmetic.

### 4. Behaviour
- The round changed no non-comment line under src/. The only reader-visible change is the comment text of config/catalogs/vocab.yml and icons.yml, which the Config view and the source tab show: before, the lanes paragraph was one line; after, nine hard-wrapped lines. The report does not state this.
- The look on the TEST page is not reported.

### Not checked
- `npm run test:browser`, not run (8.0 minutes, over one command's time limit; the round changed no src code line).
- revert-check over the 10 directive-carrying test files the round did not change; their directive targets' text is unchanged by the round (the static comparison).
- The report's total "171 reverts, 16 unproven, 428 unchecked" as one run, and whether the 16 unproven fail the same way at base.
- Whether each of the ~500 reflowed paragraphs kept its words: of the 533 comment-only hunks, 59 changed words, and every one read is a path rewrite, a re-pointed line number or a named history rewording; not every hunk was read.
- The look on the TEST page (the orchestrator's).

Reviewer usage: 222,119 tokens, 84 tool uses, 34 minutes (the harness's count).

## Closed

The first review, closed in repair round 1 (the worktree, tree 7a7696f9):
- Brief decision 2 against the layout built: the brief states the layout built (decision 2 and item 2); the placement of the ten views opened for something is booked in the state file's open items for Axel, since ruling (3) does not place views with no rail group.
- "No case renamed": the brief's Tests 1 allows only renames a moved path forces; the history audit's case keeps its name and a second case covers the documents (on main at the landing).
- Tests not mirroring `src/lib`: the eleven named tests moved in the round; the eight the round review named moved at the landing.
- History in `allow-duplication.txt`, `writes.ts`, `layout.svelte.ts`: rewritten in the round.
- The audits directive naming `:221`: points at `:186`, red.
- The history audit not reading `.txt` and `.sh`: reads both; a planted case with a revert line per branch.
- Stale paths in DESIGN.md and head comments: rewritten in the round and at the landing.
- The 61 empty folders: removed.
- The Config view and the engine root's before and after: stated in the report's "What a reader sees change".

The run over repair round 1, closed at the landing on main:
- Brief item 2 and decision 2 disagreeing: item 2 rewritten to decision 2.
- Decision 2 settled without a ruling: booked as the state file's open item, with both options and a recommendation.
- Tests 1 widened after the fact: narrowed back to renames a moved path forces; `names no package id, date or session in any comment` keeps its name and `... in any document` is a new case.
- The `fileURLToPath(new URL(...))` rewrite asked for by nothing: the three MODULE lines are back in their pre-round form; the three test files differ from the pre-round tree only by comment rewrapping.
- Tests not mirroring `src/lib`: `card-docs`, `card-layout`, `card`, `cardlinks` under `tests/views/shared/card/`, `crosslinks`, `source-button` under `links/`, `intro` under `prose/`, `oauth` under `tests/server/accounts/connect/`.
- `allow-duplication.txt` positions: all 734 entries (`grep -cE` over the list) set to where their copy first sits, read with `copies` from `tests/checks/tree/duplication.test.ts` (181 rewritten).
- 22 one-line doc comments over 100 columns: split into block comments; the scan against the base tree finds no comment line over 100 columns that the step made, YAML and directives left out.
- Two reasons split across lines: each whole on the line above its absence (`inbox.spec.ts`, `repositories.spec.ts`).
- `config/text.yml` and `config/text-oculus.yml` in eleven comments, DESIGN.md `views/present/` and `repositories/Repo.svelte`: rewritten.
- `size.test.ts` directive naming a line the reflow changed: names `bin/size-allow.txt:4`, the list's last comment line, red.
- The `.sh` half of the history planted case with no directive: a second directive, `history.test.ts:85`.
- The DONE row's "32": the report names no count there; the counts are the landing report's.
- YAML comment paragraphs hard-wrapped in `icons.yml` and `vocab.yml`: one line per paragraph, spaced-hyphen dashes reworded.
- History test head comment and DATE comment: say a text file is read whole.
- `writes.ts` "either" with no referent: "this module or the one that holds the function".
- `folder-check.sh` ragged line: rewrapped.
- The look not reported: done at the landing, `agents/reviews/Q58-landing.md`.
