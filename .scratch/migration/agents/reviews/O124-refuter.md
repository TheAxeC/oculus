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
