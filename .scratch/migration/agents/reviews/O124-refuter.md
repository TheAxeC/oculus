# Reviewer report, step O124

## Verification lines

All commands ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O124`.

Check 1, `npm run test:quick`. It ran twice, and neither run printed `every command passed`.

Run 1 (load 12 to 13), tail as printed:
```
Test Files  2 failed | 86 passed (88)
     Tests  10 failed | 817 passed | 353 skipped (1180)
test:quick: 599.3 s; failed: vitest, vitest slow
```
The last failures shown were `Test timed out in 20000ms` in `tests/data/hubs/hub-portfolio.test.ts` and `tests/data/hubs/self.test.ts`. I kept only the tail of this run, so the failures of the `vitest` line are not verified.

Run 2 (load 13), as printed:
```
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (2.3 s)
ok      svelte-check (9.5 s): 1793659191091 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (178.7 s): Duration  165.28s (transform 71.47s, setup 0ms, import 162.53s, tests 424.32s, environment 5ms)
FAILED  vitest (201.2 s)
 FAIL  |unit| tests/server/machine/lsp/adapters/markdown-links-lent.test.ts > a link request with the text of a tab the server holds no document of > leaves the document open, at the page text, when the page opens the file meanwhile
Error: markdown/getEditForFileRenames was not sent within 30000 ms
 Test Files  1 failed | 228 passed | 70 skipped (299)
      Tests  1 failed | 3314 passed | 827 skipped (4142)
ok      vitest slow (310.3 s): Duration  298.16s (transform 23.46s, setup 0ms, import 177.32s, tests 1001.10s, environment 20ms)
test:quick: 312.6 s; failed: vitest
```
- `npx vitest run tests/server/machine/lsp/adapters/markdown-links-lent.test.ts` alone printed `Test Files  1 passed (1)`, `Tests  2 passed (2)`.
- The two hub tests timed out in run 1 and passed in run 2's `vitest slow`.
- None of these three test files is a file the step changes. Under spec.md's "Verify before you report" paragraph they are timing failures under load and no finding.
- I did not run the list a third time.

Check 2, `LC_ALL=C grep -n '[^ -~]'` over the 36 source and config paths the step leaves: printed nothing, `exit=1`. The added lines of `docs/HELP.md`, `docs/templates.md` and `docs/data-map.md` give `0`.

Check 3:
- The first grep printed nothing, `exit=1`.
- `grep -n "'audit'" .../counts.ts` printed nothing, `exit=1`.
- `grep -n "findingsCount" src/routes/+page.svelte` printed `231:            findings: client.railBadges.findingsCount(),`.
- The two `test ! -e`: `exit=0`.

Check 4, `git diff d3a38520a --stat -- package.json package-lock.json`: printed nothing, `exit=0`.

Check 5 (reading against the standards): see the four headings. The only standards page is `.scratch/migration/agents/spec.md` (`.agents/plan.yaml`, `standards:`).

Commands the report quotes, rerun:
- Case program: its source copied from the report, `node case-final.mjs <worktree>` from my scratchpad. Output is byte for byte the report's 15 lines, from `files 2, open 5, muted 1: findingsCount 7 rail part {"count":7}` to `audit "m2": s2 | audit "stage": 0`.
- `yaml.safe_load` over the twelve config files: `ok <path>` twelve times.
- `sh utils/unused-exports.sh`, diffed against `../O124-base/unused-exports.txt`: `diff exit=0`.
- Name grep of the report: two lines, `tests/checks/config/config-folder.test.ts:349` and `:351`, both text file paths that keep their paths.
- Word grep over added lines: the `beforematch` hit, `AuditSection.svelte:17` "still", and a third hit, `AuditSection.svelte:252` "always", on a line moved unchanged from `Audit.svelte`. All three are non-historical.
- `npx eslint src/routes/+page.svelte`: exit 0.
- `npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/comment-width.test.ts`: both passed. They ran in one command with the diagrams file, whose two timeouts below were the only failures.
- `tests/checks/diagrams/diagrams.test.ts`: at the default 5 s limit two tests time out. With `--testTimeout=120000` it printed `Test Files  1 passed (1)`, `Tests  47 passed (47)`. In run 2 it passed inside `vitest checks`. The committed diagrams match the source byte for byte.
- File table line counts in the report match `git diff d3a38520a --stat`.

Premises rerun:
- `grep -n '^counts'` on the hub's `.oculus/config.yml`: nothing, exit 1.
- `grep -rln "audit\|gallery"` over the hub's `.oculus/workspaces`: nothing, exit 1.
- An import-resolving program in my scratchpad lists the `GroupHead` nesting. The only nesting on the tree is `Status.svelte:142` to `Gallery`, and the two direct ones in `AuditSection.svelte:199,216`. So no `--group-strip: 0px` box holds a `GroupHead`.

`git status --short` printed 50 lines before and after my runs.

## Verdicts

### What to build

1. One Findings view: holds. No file under `views/system/audit/`; the partial is drawn by `Findings.svelte`; one `data-instance`; `data-audit` and the note are gone; no `[data-audit]` reader remains.
2. One search: holds. `fileSearch` is beside `auditSearch`; the row key depends on the index only; the Files wrapper is hidden as ruled in `O124-cases.md`; the tab, status bar and rail read no search.
3. One count: holds. Readers are `Findings.svelte:14-15` and `+page.svelte:231`, both `railBadges.findingsCount()`. `entities.apps()` and `apps.findings()` are one source (`apps.svelte.ts:800`). `openCount` is `open().length` (`audit.svelte.ts:58`). So tab = Files head + Audit head with no search.
4. Gallery a section of Status: holds under ruling 1 of `O124-cases.md`.
5. Nested groups: violated, narrowly, finding S1. The mechanism holds.
6. The System page: holds. Orders are 0 to 7 with no collision; the `History` and `Processes` comments are true.
7. Words and pages: violated, narrowly, finding ST1. Every other listed line is done.

### Cases

| Case | Verdict | Evidence or what would settle it |
| --- | --- | --- |
| System page, no saved layout | met | `layout.yml` and `docs/palette.md` diffs; registrations listed by grep |
| Tab = status bar = heads, 7 | met | Case program printed 7; reading of the three readers |
| Mute, unmute | met | Case program 6 and 7; `mute` moved unchanged |
| Failed mute | met | Same `Empty error`, now above the Audit group |
| Both empty; only muted | met | `clear` needs all three lists empty; `count={shown.length}` draws 0 (`count !== undefined`) |
| Search on one side, or nothing | met | Case program and reading |
| Word only above the root | met | Case program, `search "Users": places []` |
| Key choice under a search | met | Every `li` stays mounted, so `KeyChoice` state stands |
| Closing note gone | met | Diff |
| Find-in-page, folded in folded | not verifiable | Reading agrees: the event bubbles, `found` is guarded, `changeViews` writes at once (`page-state.svelte.ts:412`). Settled by Cmd+F on a word in a folded kind inside folded Audit |
| Fold and reload | met | Keys in `folded`, `showMuted` in the pane's state, no collision |
| Arrow keys | met | `cards()` uses `checkVisibility`; the observer watches `hidden` over the subtree; `Findings` rows carry no `data-card` |
| Place press, Write the website | met | Moved unchanged |
| Open Status, Gallery closed then open | met | `{#if showGallery}`; `Hooks` and `LineCounts` hold no `data-card`; Reset through `bind:this`. The report's scoping to `SHOWN_VIEW` is right (`key-dom.ts:32`) |
| Nested scrolling | not verifiable | The CSS sum reads correct; Table `th` z-index 1 against strip 2; Audit and Gallery are last in their panes, so no strip overlap at a group's end. Settled by a short pane |
| Unnested strip, `LineCounts` table | met | `--group-above` is `0px`; `.scroller` still sets `0px` |
| Sample cards take the cursor | met | `Status.svelte:109` carries `data-instance`; `cursor` comes from the prop |
| Wallpaper, rice, free float | not verifiable | Reading agrees with ruling 1. Settled by the look under a wallpaper and a rice theme |
| y7, y8 | met | Orders 6 and 7; `docs/HELP.md:143`; no `y9` left in `src`, `config`, `docs` or `README.md` |
| Narrow pane | met | `.actions` `flex: none`, `.name` cut with an ellipsis, `Toolbar` not `overflow` wraps |
| Status socket and counts | met | Markup moved into `Surface`; `.view > [data-surface] > p` reaches the same `p` in both modes |

Each of the 21 cases has a first-run row in the report.

## Spec

**S1. `src/lib/ui/controls/heads/GroupHead.svelte:9`.**
- Hunk: `+    // SubHead.svelte beside it where it does not fold, and this component where it does.`
- What is wrong: brief item 5 says the head comment and `docs/HELP.md:296` both say a heading inside a group may be a group that folds, "and that Gallery starts folded". `HELP.md` says both. The head comment (lines 1 to 60, grepped for `start|folded|Gallery`) says only the first; its Gallery mention at lines 54 to 56 is a list entry.
- Failure scenario: a builder reading only this component's comment takes every `GroupHead` body as mounted once drawn, as its "A folded group's body stays in the page" paragraph says. The Gallery group's body holds nothing while closed, and a reveal into it finds no card.
- Size: one clause, fixable at landing.

Paths outside the write list:
- `config/catalogs/glyphs.yml` and `config/catalogs/icons.yml`: the deletion is needed and complete.
- `glyphReaders` (`config-folder.test.ts:90`) takes every string value under `config/` as a reader. `view: audit` was the only reader of the glyph `audit`, and the test at `:479` fails on a catalog name with no reader. `iconFindings` pairs the two catalogs, and both lose the row.
- No third catalog holds the name: `grep -rln "litwatch:" config` names the two catalogs and the two behavior files, whose hit is an unrelated setting.
- A grep of the hub's `.oculus` (no `local.yml`) for `glyph: audit` prints nothing, which settles the report's "the user's data was not read" for that folder.

Otherwise: no substitute mechanism, no reserved decision taken, no new dependency, no script beyond the allowed case program.

## Proof

**P1. Report, "The number of full-list runs".**
- Quote: "Three runs of `npm run test:quick` were started. The first was stopped before it printed a result."
- What is wrong: spec.md allows one run after the last change, and one more after a red line in a changed file. The stopped run is a third, with no reason given.
- Failure scenario: about 260 s of the machine's load spent with nothing to show. The landing cannot tell whether a change came after it.

**P2. Report, judgment 3.**
- Quote: "`grep -rn 'data-section' src tests | grep -v 'data-section='` prints nothing, so no code or test reads one by name."
- What is wrong: the filter drops every line holding `data-section=`, which includes a selector such as `[data-section="audit"]`. This check cannot show the risk it is quoted for.
- The claim itself holds: `grep -rnE "\[data-section|dataset\.section|data-section\\\\?=" src tests` prints only attribute setters.
- Failure scenario: a reader added by a selector would pass this grep and be reported as absent.

No seen-failing claim is needed, since no test changed (`git diff d3a38520a --stat -- tests` prints nothing). No test asserts a known defect, no threshold is widened, no file-scope mutable is added. `gallery?.reset()` guards a binding that is null while closed, which is the ruled state and no fallback. The count the step rests on reproduces.

## Standards

**ST1. `src/lib/server/content/audit/scan.ts:10-11`.**
- Hunk: `+// It is not the Files section of the Findings view and does not repeat it. Findings is what` followed by the kept `// data/snapshot/validate.ts found wrong in the files themselves, a bad id or an unknown chip; this`
- What is wrong: the first sentence was corrected and the next one left. "Findings" now names a view that holds this scan's output too, so "Findings is what validate found ... ; this is what is true of the files" is false as written. spec.md's "a sentence in a head comment the change makes false".
- Failure scenario: a reader of the scan's head comment concludes that its findings are drawn somewhere other than the Findings view.
- Fix: "That section is what ...".

**ST2. `src/lib/state/workbench/navigation/status.ts:455`.**
- Quote: `export function findingsCount(` alongside the new doc comment `How many file findings the Findings view lists, the part of its count the rail badges' findingsCount adds`.
- What is wrong: two exported functions named `findingsCount` now give different numbers: this one the file findings only, `railBadges.findingsCount()` the one count. `rail-badges.svelte.ts:22` imports the first under the alias `listedFindings`. CLAUDE.md, "Once a thing has a name, that name is used every time".
- Failure scenario: `+page.svelte` called this function by this name, and that is the defect item 3 removes. A new caller importing `findingsCount` from `navigation/status` gets the file count and disagrees with the tab.
- Fix: rename it to a file-findings name. `grep -rn findingsCount tests` prints nothing, and its only importer is `rail-badges.svelte.ts`.

Sizes pass the limits: 318, 425, 219, 186 and 213 lines. Comments: no history found.

Greps of `Audit view`, `Gallery view`, `audit tab` and `auditCount` over `src`, `config`, `docs` and `README.md` leave no false sentence. `README.md:46` stays true of the System page.

## Behaviour

**B1. Report, "Host- or user-visible changes", row "Findings tab, rail row, catalogue".**
- Quote: "Files only; Audit its own | The sum; the row `audit` of `counts` gone; System rail badge the same sum".
- What is wrong: the table leaves out four visible changes that the look is read against.
  1. The rail button's tooltip named Findings and Audit with a count each, and now names Findings alone with the sum (`docs/HELP.md:52`, "Its tooltip names each count above zero").
  2. The palette and the catalogue lose both entries (in the cases table only).
  3. The key that focuses a view's search (`focusSearch`, `input[data-search]`) now acts on Findings. On Status it acts only while the Gallery is open, and it leaves the key unclaimed when closed; the Gallery tab always had a search.
  4. Over a wallpaper the Status facts stand 8 px further in (`Surface.svelte` head comment). The row says only that with no wallpaper the first part looks as it did.
- Failure scenario: the look on landing compares against the table, sees a changed tooltip or inset, and has no line saying it is intended.

## Declined to judge

- That `npm run diagrams` and `npm run docs:palette` were run as the only writers of their files: both write into the worktree. `tests/checks/diagrams/diagrams.test.ts` and `palette.test.ts` were read through their passing runs instead.
- What drew the 1098 changed lines of `channels.svg`: sampled only. The `.dot` diff shows `bb` and position shifts, with 12 changed lines naming audit or gallery. The byte-for-byte test passes.
- Browser behaviour named above, all left to the look: the order of `beforematch` events, `checkVisibility` under an ancestor's `content-visibility: hidden`, and strip heights from `bind:offsetHeight` when a nested group opens.
- The orchestrator's one-time change of `~/.oculus/layouts.json`: that file is off limits to me.
- The mechanical comment sweep was read whole in the diff, not sampled. The two diagram `.svg` diffs other than `channels` were read by their `.dot`.
- The first full-list run's `vitest` failures: not verified, since I kept only the tail. A third run was not made.

Usage: a430c5101b0e5d36b, claude-opus-5-5, 303279 tokens, 41 tool uses, 24 min 38 s

## Repair round 1, refuted (step O124, on .agents/worktrees/migration-O124, base d3a38520a)

All six findings of the first review are closed, and no closure removes a check. Every item of the brief holds. The 21 cases come out at 18 met and 3 not verifiable, those three left to the look. This run raises three new findings, all in the report and none in the code: R1 the fifth full-list run, R2 stale open items, R3 a row short of what the look will see. Nothing in the tree needs changing.

All commands ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O124`. `git status --short` printed 51 lines before and after my runs.

```
Round's delta: 4 paths differ from the snapshot of the 48 in files.txt
  src/lib/server/content/audit/scan.ts
  src/lib/state/workbench/navigation/status.ts
  src/lib/state/workbench/rail-badges/rail-badges.svelte.ts
  src/lib/ui/controls/heads/GroupHead.svelte
Paths changed now that files.txt does not list: the three .scratch files (.scratch/migration/agents/briefs/O124-cases.md,
.scratch/migration/agents/briefs/O124-round1.md, .scratch/migration/agents/reviews/O124-report.md). All three compare equal to
the main checkout's copies under cmp (exit 0).

Check 1, npm run test:quick -- --base d3a38520a, one run, passed first time:
test:quick: 51 changed file(s), from git since d3a38520a
test:quick: 316 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (2.9 s)
ok      svelte-check (9.8 s): 1793661218691 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (201.1 s): Duration  186.99s (transform 71.24s, setup 0ms, import 183.31s, tests 504.77s, environment 5ms)
ok      vitest (235.3 s): Duration  223.23s (transform 76.98s, setup 0ms, import 260.97s, tests 603.59s, environment 9.00s)
ok      vitest slow (335.0 s): Duration  322.90s (transform 20.84s, setup 0ms, import 171.31s, tests 1105.60s, environment 18ms)
test:quick: 338.3 s; every command passed
Not covered, as it printed: tests that reach no changed file within the import depth, other than the checks under
tests/checks/source and tests/checks/tree; the build; the lint of unchanged files.
The list picked tests/checks/diagrams/diagrams.test.ts and tests/checks/diagrams/palette.test.ts.

Check 2, LC_ALL=C grep -n '[^ -~]' over the 36 source and config paths the step leaves: printed nothing, exit=1.
Added lines of docs/HELP.md, docs/templates.md, docs/data-map.md: grep -c gives 0.

Check 3:
first grep: printed nothing, exit=1
grep -n "'audit'" src/lib/data/sources/config/sections/counts.ts: printed nothing, exit=1
grep -n "findingsCount" src/routes/+page.svelte: 231:            findings: client.railBadges.findingsCount(),
test ! -e src/lib/views/system/audit && test ! -e src/lib/views/system/gallery: exit=0

Check 4, git diff d3a38520a --stat -- package.json package-lock.json: printed nothing, exit=0.
git status --short -- tests utils package.json package-lock.json: printed nothing, exit=0.

Check 5: read; see the headings below. The only standards page is .scratch/migration/agents/spec.md.

Commands the report quotes:
sh utils/unused-exports.sh, diff ../O124-base/unused-exports.txt <output>: diff exit=0, prints nothing.
grep -rn "listedFindings" src tests: prints nothing, exit=1.
grep -n "fileFindingsCount\|findingsCount" -r docs/diagrams: prints nothing, exit=1.
grep -rnE "\bfindingsCount\b" src tests less the lines naming railBadges: rail-badges.svelte.ts:90, :219, :388; status.ts:136; registry.ts:49.
grep -rnE "\[data-section|dataset\.section|data-section\\\\?=" src tests: 8 lines, Inbox.svelte:207, Status.svelte:135,
  AuditSection.svelte:190, :200, :217, Findings.svelte:124, SessionSection.svelte:48, Editor.svelte:282; all attribute setters.
Name grep of the report: two lines, tests/checks/config/config-folder.test.ts:349 and :351.
Case program, copied from the report's lines 69-107, node case-final.mjs <worktree> from my scratchpad: exit 0, 15 lines,
  diff against the report's lines 113-127 exit 0.
yaml.safe_load over the 12 files of git diff d3a38520a --name-only -- config: ok, twelve times.
Word grep over added lines: three hits, as the report judges them (beforematch, AuditSection.svelte "still", "always").
npx eslint src/routes/+page.svelte: exit=0.
npx vitest run tests/checks/config/config-folder.test.ts tests/checks/source/comment-width.test.ts (with --testTimeout=120000, the
  form the first review needed for the machine's load): Test Files  2 passed (2); Tests  30 passed | 2 skipped (32).
npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout=20000: Test Files  1 passed (1); Tests  16 passed (16).
diff -rq against ../O124-base: tests 0 lines, utils 0 lines.
wc -l: 318 AuditSection.svelte, 219 Findings.svelte, 425 status/Gallery.svelte, 186 Status.svelte, 216 GroupHead.svelte.
git diff d3a38520a --stat: status.ts 16, rail-badges.svelte.ts 23, GroupHead.svelte 45, scan.ts 6, Findings.svelte 134,
  Status.svelte 113, docs/HELP.md 17, channels.dot 469, channels.svg 1098, layer-views 6 and 6, layers 4 and 4: all as the report's table.
stat: status.ts 23:49:51, docs/diagrams/channels.svg 00:04:17.
find src config docs tests utils -newermt '2026-11-02 23:49:52', leaving out local.yml and docs/diagrams: prints nothing.
No vitest or quick.mjs process of this worktree is left (ps).
```

### Closure of each finding

- **S1, `GroupHead.svelte`: closed.** Lines 39 to 41 read "The Gallery group of Status does not hold to this: it starts folded and draws nothing while closed, so the Gallery's body is mounted when it opens, and neither a reveal nor find-in-page reaches a card in it while it is closed." It stands in the paragraph a reader of line 35 is reading, and `{#if showGallery}` at `Status.svelte:141` makes it true. The extra clause on reveal and find-in-page, and "The component holds no state", go no further than the finding, since the sentence needed its subject. Lines 35 to 43 are 76 to 100 columns, and `comment-width.test.ts` passes.
- **ST1, `scan.ts:10`: closed.** The line reads "That section is what", and the sentence is now true of the Files section. 96 columns.
- **ST2, `status.ts`, `rail-badges.svelte.ts`: closed.** The function is `fileFindingsCount`, imported at `rail-badges.svelte.ts:22` with no alias and called at `:220`. Both doc comments name the function they mean. `railBadges.findingsCount` keeps its name, as ruled. The greps above reproduce. No check was removed.
- **B1, report: closed for the four rows the round names, with R3 below on the inset.**
  - The tooltip row is true: `rail.ts:110-111`, `views.badge_title` `{0} {1}`, `ui.page_badge_separator` `, `, `ui.page_badge_tip` `{0} ({1})`.
  - The palette row is true: `docs/palette.md` loses both rows.
  - The `/` row is true: `key-dom.ts:40-45`. `Search` is the only carrier of `data-search` as an input, and in `status/` only `Gallery.svelte:220` draws one.
- **P1, report: closed as text.** It gives the reason for the stop and the changes after it. The reason cannot be rerun without restoring a selector that does not compile, so it is judged by reading: judgment 8 and the selector at `Status.svelte:157` agree with it.
- **P2, report: closed.** Judgment 3 quotes the ruled grep, and my run prints the same eight lines.

The round reaches no further than its six items. Only the four paths above changed, plus the report.

### Verdicts

Items of the brief's "What to build":

- 1, One Findings view: holds. No `views/system/audit/`; `Findings.svelte:147` draws `AuditSection`; one `data-instance` at `Findings.svelte:121`; note and `data-audit` gone; Muted's rule unchanged from the base (`hidden.length > 0`).
- 2, One search: holds. `fileSearch` stands beside `auditSearch`, the each key at `Findings.svelte:131` is the base's and does not depend on the filter, and the Files wrapper is hidden as ruled. Tab, status bar and rail read no search.
- 3, One count: holds. Readers are `Findings.svelte:14-15` and `+page.svelte:231`. `fileFindingsCount` is `allFindings(...).length`, the list `Findings.svelte` draws, and `findingsCount` adds `audit.openCount()`. `audit` is out of `COUNTED`, `counts`, `BadgeClient`.
- 4, Gallery a section of Status: holds under ruling 1 of `O124-cases.md`. No registration, `{#if showGallery}`, Reset in `actions` through `bind:this`, Search and Segment first in the body, `instance` a prop.
- 5, Nested groups: holds. The head comment now says both things the item asks for (`GroupHead.svelte:8-9`, `:39-41`). `docs/HELP.md:294` says "Muted and the Gallery start folded" and that a heading may be a group that folds. `--group-above` and the body's sum read correct. The only other reader of `--group-strip` beside `Table.svelte:110` is `settings/List.svelte:210`, `scroll-margin-top: var(--group-strip, 0)`, which takes a `calc()`.
- 6, The System page: holds. `layout.yml` holds status, findings, history. Orders 0 to 7 with no collision and no gap, by grep. The neighbour comments in `Status`, `Findings`, `History` and `Processes` are true.
- 7, Words and pages: holds. Every listed line is done, and `\bAudit\b` and `\bgallery\b` over `src`, `config`, `docs` and `README.md` leave no sentence calling either a view. No `y9` remains. `docs/templates.md:281` says "the audit" (judgment 9). The item's sentence list does not name that line, so it does not bind it.

Cases of the brief's "Cases":

- System page, no saved layout: met. `layout.yml` and `docs/palette.md` diffs; the registrations by grep; no quoted, listed or `view:` form of `audit` or `gallery` left in `config`, and `grep -rnE "['\"\`](audit|gallery)['\"\`]"` over `src` leaves only the channel and fold keys.
- Tab = status bar = heads, 7: met. Case program, `files 2, open 5, muted 1: findingsCount 7 rail part {"count":7}`; reading of the readers.
- Mute, unmute: met. Case program 6 and 7; `mute` moved unchanged.
- Failed mute: met. `AuditSection.svelte:185-187`, the same `Empty error`, above the group.
- Both empty; only muted: met. `clear` needs all three empty; `count={shown.length}` draws 0.
- Search on one side, or nothing: met. Case program and reading.
- Word only above the root: met. `search "Users": places []`.
- Key choice under a search: met. Every `li` stays mounted.
- Closing note gone: met. Diff.
- Find-in-page, folded in folded: not verifiable. The reading agrees (the event bubbles, `found` is guarded). Settled by Cmd+F on a word in a folded kind inside folded Audit at the look.
- Fold and reload: met. Keys `files`, `audit` and the six kinds, `showMuted` in the pane's state; in Status `lines`, `hooks` and the eight sections, no collision.
- Arrow keys: met. `workbench-keys.svelte.ts:395` `checkVisibility`; Files rows carry no `data-card`.
- Place press, Write the website: met. Moved unchanged.
- Open Status, Gallery closed then open: met. The reading gives the expected result; the report's scoping to `SHOWN_VIEW` is right.
- Nested scrolling: not verifiable. The CSS sum reads correct. Settled by a short pane at the look.
- Unnested strip, `LineCounts` table: met. `--group-above` resolves to `0px`; `.scroller` still sets `0px`.
- Sample cards take the cursor: met. `Status.svelte:109` carries `data-instance`, and `cursor` comes from the prop.
- Wallpaper, rice, free float: not verifiable. The reading agrees with ruling 1. Settled at the look under a wallpaper and a rice theme.
- y7, y8: met. Orders 6 and 7; `docs/HELP.md:143` reads `y1-y8`.
- Narrow pane: met. `.actions` `flex: none`, `.name` cut with an ellipsis, `Toolbar` with no `overflow`.
- Status socket and counts: met. Markup moved into `Surface`; `.view > :global([data-surface]) > :global(p)` reaches the same `p` in both modes.

### 1. Spec

**R2. Report, "Open items of the state file, verbatim".**
- Quote: "From `.scratch/migration/orchestrator-state.md:182-185`." followed by "Open item 636 (2026-11-02), step O123, raised by its brief check".
- What is wrong: the brief asks for the state file's open items. Under "## Open items" (`orchestrator-state.md:191-194`) the list now holds none, and item 636 stands under "## Closed items" at line 196. Neither the lines nor the status the report cites are true now. The round's brief said "Update the report in place", and the state file's demand "Briefs and repair briefs" asks for the open items copied at the moment the report is written, so the omission starts in the round's brief.
- Failure scenario: a reader of the landing's report, or the orchestrator copying from it, takes three of Axel's ruled choices for undecided and raises them again.
- Verdict: no item or case. Small, for the landing.

### 2. Proof

None. The report's counts, paths and quoted outputs reproduce. No test changed, so none asserts a defect or was widened. No check was removed by a closure.

### 3. Standards

**R1. Report, "The number of full-list runs", run 5.**
- Quote: "This run goes beyond what `spec.md` allows, since a red line in an unchanged file is not a reason to run the list again; it was made because the `vitest` line's failures could not be named from run 4."
- What is wrong: spec.md, "Token discipline": a red line in a file the step does not change "is rerun alone and named with that run in the report, and the list is not run again for it", and a run beyond that "is a finding of the review". The cause was `tail -30` on run 4, which cut the names, so run 4's `vitest` line stays unnamed, against the same sentence.
- What rests on it: the DONE row of Check 1 and the report's first line quote only run 5. Neither now depends on it. My own `npm run test:quick -- --base d3a38520a` printed `every command passed` over the same 51 changed files and 316 test files. The `find` above shows no file under `src`, `config`, `tests` or `utils` written after 23:49:51, and of `docs` only `docs/diagrams`, which the `npm run diagrams` before each list rewrites. The diagrams test passes. So no decision rests on run 5, and run 4's unnamed failures left no standing red: the step changes no test file, and two later runs on that tree are green.
- Failure scenario: 394 s of a loaded machine spent on a run the spec forbids, and a report that cannot say which tests went red in run 4.
- Verdict: no item or case. Nothing to change in the tree; the breach stays on the record in the report's own words.

### 4. Behaviour

**R3. Report, "Host- or user-visible changes", row "Status facts over a wallpaper".**
- Quote: "The facts stand in a block `Surface`, which pads its content `0 8px` over a wallpaper ... so they stand 8 px further in on each side."
- What is wrong: `Status.svelte:128-131` puts `LineCounts` and `Hooks` inside that same `Surface`, so their strips stand 8 px further in too, and the Gallery strip outside it (`:133-145`) does not. The row names the facts alone, and the "Status pane" row gives no inset. Over a wallpaper the Line counts and Hooks strips stand 8 px to the right of the Gallery strip.
- Failure scenario: the look on a wallpaper theme sees three strips of one pane on two left edges, and no line says that is the ruled layout.
- Verdict: no item or case; the layout follows ruling 1 of `O124-cases.md`. The row is what falls short.

### Declined to judge

- Whether `npm run diagrams` and `npm run docs:palette` were the only writers of their files: both write into the worktree, so I did not run them. `diagrams.test.ts` and `palette.test.ts` passed in the list instead.
- The first stopped run's reason, that `docs:palette` failed with `css_global_invalid_placement`: reproducing it needs the selector put back, which is breakage. Read only.
- The names of run 4's `vitest` failures: they are gone from the builder's run, and no run of mine can recover them.
- When item 636 closed relative to the builder's writing of the report: `git log` on the state file would settle it, and I run no such command. R2 is judged on the file as it stands now.
- Whether `O124-cases.md` and `O124-round1.md`, untracked in the worktree, reach the landing's wip commit: `git add` semantics at landing, which the three allowed git commands do not settle. The report names only the first of them as the orchestrator's.
- Browser behaviour, left to the look: the order of `beforematch` events, `checkVisibility` under a nested `content-visibility: hidden`, and strip heights from `bind:offsetHeight` when a nested group opens.
- The orchestrator's one-time change of `~/.oculus/layouts.json`: that file is off limits to me.
- The 1098 changed lines of `channels.svg`: not read line by line; the byte-for-byte diagrams test passes.

Reviewer usage: a33bae9f11781ca38, claude-opus-5-5, 260684 tokens, 34 tool uses, 13 min 14 s.

### Closed

- R1: closed at landing. No decision rests on the fifth run, the reviewer's own `test:quick` passed on the same tree, and the breach stands in the report's own words.
- R2: closed at landing. The report's open items part states the state file as it stands.
- R3: closed at landing. The report's row names the two strips inside `Surface` and the Gallery strip outside it.
