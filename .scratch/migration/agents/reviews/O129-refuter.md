# Step O129 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O129, base 81a913408)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

Every command ran from the worktree root, in the foreground, with PATH including `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin`.

```
$ npx vitest run tests/server/root/process/first-run.test.ts tests/server/machine/hpc/submit-files.test.ts tests/checks/config/config-folder.test.ts
 Test Files  3 passed (3)
      Tests  49 passed | 2 skipped (51)

$ ls 'src/routes/api/(machine)/lines' src/lib/server/machine/lines.ts src/lib/state/system/lines.svelte.ts src/lib/views/system/status/LineCounts.svelte docs/licenses/GPL-2.0.txt
ls: docs/licenses/GPL-2.0.txt: No such file or directory
ls: src/lib/server/machine/lines.ts: No such file or directory
ls: src/lib/state/system/lines.svelte.ts: No such file or directory
ls: src/lib/views/system/status/LineCounts.svelte: No such file or directory
ls: src/routes/api/(machine)/lines: No such file or directory
exit 1

$ grep -rnw cloc src tests config docs README.md package.json package-lock.json utils --exclude=local.yml
exit 1

$ git diff 81a913408 -- package.json package-lock.json
package.json @@ -81,7 +81,6 @@      -        "cloc": "2.6.0-cloc",
package-lock.json @@ -30,7 +30,6 @@  -                "cloc": "2.6.0-cloc",
package-lock.json @@ -4522,15 +4521,6 @@  the nine lines of the "node_modules/cloc" block removed
(no added line, no changed line outside cloc's)

$ grep -rnw perl src --exclude=local.yml
exit 1

$ git show 81a913408:src/lib/server/machine/lines.ts | grep -nw perl   (the before of C4, from the base text)
40 41 98 105 111 112 179 180 185 195 215 341
$ git show 81a913408:src/lib/server/root/process/start/first-run.ts | grep -nw perl
18 56 206 207 208 209

$ sh utils/unused-exports.sh > <scratchpad>/ue-after.txt; diff ../O129-base/unused-exports.txt <scratchpad>/ue-after.txt
exit 0
1c1
< Unused exports (228)
---
> Unused exports (226)
81d80
< src/lib/server/machine/lines.ts: TOP_LEVEL, CLOC_TIMEOUT_MS, counted, folderOf, todoLine
180d178
< src/lib/state/system/lines.svelte.ts: readCount
230c228
< Unused exported types (108)
---
> Unused exported types (107)
317d314
< src/lib/state/system/lines.svelte.ts: Lines

$ npm run test:quick   (npm run diagrams not run: it writes tracked files; see Declined to judge)
test:quick: 35 changed file(s), from git since HEAD
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (3.3 s)
ok      svelte-check (11.1 s): 1793713008502 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (174.0 s): Duration  159.28s (transform 80.07s, setup 0ms, import 166.38s, tests 325.95s, environment 4ms)
ok      vitest (198.0 s): Duration  184.75s (transform 82.29s, setup 0ms, import 250.29s, tests 456.48s, environment 18.78s)
ok      vitest slow (308.3 s): Duration  295.20s (transform 23.68s, setup 0ms, import 170.76s, tests 997.89s, environment 20ms)
test:quick: 311.0 s; every command passed
(chosen among them: first-run.test.ts "changed", diagrams.test.ts and keys.test.ts "imports at depth 1", submit-files.test.ts "imports at depth 1", config-folder.test.ts "imports at depth 2", comment-width.test.ts and history.test.ts "scans the source text of a changed file")
$ git status --short | wc -l   (after the run: the tree unchanged)
      35

$ LC_ALL=C grep -n '[^ -~]' <every touched file and the builder's report>
exit 1
$ git diff 81a913408 -U0 | grep "^+" | grep -v "^+++" | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O12[0-9]|20[0-9][0-9]-"
exit 1

Commands the builder's report quotes, rerun:
$ grep -rn "createLines\|LinesStore\|system/lines" src                                  exit 1
$ grep -rn -e trackedFiles -e FolderLines -e LanguageLines -e LineTally src tests        exit 1
$ grep -n perl README.md                                                                 exit 1
$ grep -rn "api/lines" src                                                               exit 1
$ grep -rlE "cloc|perl|LineCounts|lines\.svelte|api/lines|trackedFiles|FolderLines|LanguageLines|LineTally|GPL|machine/lines|system/lines" docs/diagrams   exit 1
$ grep -cw <name> src/lib/server/core/git/files.ts
run 9, refused 7, milliseconds 4, TIMEOUT_MS 4, reasonOf 3, Read 3, HASH 2, NO_REPOSITORY 2, pathInside 2, FILE_LOG_FORMAT 2, parseFileLog 2, GitFilePage 2, words 4
$ grep -rn "thousands_separator\|thousands" src tests config docs --exclude=local.yml     no thousands_separator hit; only unrelated prose and the keys packed_thousands, n_thousands
$ grep -rn "words/format" tests src | grep -w grouped                                    exit 1 (no importer of format's grouped; every other `grouped` is ui/menu/menu-items.ts's)
$ ls node_modules/cloc                                                                   lib  package.json  README.md
$ wc -l <the files of the report's table>                                                every "Lines now" figure matches (Status.svelte 179, context.ts 877, client-state.ts 199, index.ts 835, files.ts 141, run.ts 354, shipped.ts 17, first-run.ts 271, first-run.test.ts 238, status.yml 12, server.yml 633, GroupHead.svelte 239, package.json 132, package-lock.json 10328, third-party.md 9, HELP.md 617, README.md 118, format.ts 123, app.yml 337)
$ python3 -I -c '<read of package-lock.json packages for a license holding GPL>'         745 []
```

The item 5 grep, rerun with word boundaries over `src tests config docs README.md package.json utils --exclude=local.yml --exclude-dir=diagrams` for `lines of code|line counts? of|count again|\bcloc\b|\bperl\b|GPL|LineCounts|lines\.svelte|api/lines|trackedFiles|FolderLines|LanguageLines|LineTally|thousands grouped|copyleft`: every hit is one the brief lists as left alone (`parse.ts:10,272,284,285,315`, `texlab/links.ts:3`, `tests/tiers/run.mjs:25`, `settings.test.ts:75,587`), unrelated prose (`ChangeCounts.svelte:2`, `filter-menu.ts:45`, `DepositCompare.svelte:34`, `HELP.md:309`, `accounts.test.ts:65`, `unimath.yml:2010`, `fs.ts:362,430`), or 7z-wasm's row and the new opening of `docs/third-party.md:3,7`. A grep of the whole worktree outside `node_modules`, `.git`, `.svelte-kit`, `.scratch` and `.agents` adds only `CLAUDE.md:49`, the ASCII gate's perl command, which stays true.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The four files and the route folder are gone (C2 rerun). `Status.svelte` loses the import and the element; the wrapper keeps `margin-top: 16px` as `.hooks` and loses `display: flex`, `flex-direction` and `gap`. `lines` and its doc comment are out of `context.ts` and `client-state.ts`. The four model types and `trackedFiles` are deleted (grep exit 1). Every import `files.ts` keeps is still read, and eslint and svelte-check pass in test:quick. The class rename from `groups` to `hooks` is scoped to `Status.svelte`, and no stylesheet, test or document names the old class (`grep -rn "\.groups\b..." src/lib/views/system tests docs/HELP.md`: only the unrelated `.groups` of `settings/List.svelte`).
- 2: holds. The 22 `status.lines_*` keys, `server.start.fix_perl_xcode` and `server.start.needs_perl` are removed. Each `t('...')` key the deleted client files read is a `status.lines_*` key, and none has a reader left. `app.thousands_separator` goes with `grouped` of `format.ts`: `LineCounts.svelte` was that function's only importer and the function was the key's only reader, so the rules file's export rule and item 2's "every other word the deleted code alone read" both require the removal. `keys.test.ts` passes in test:quick.
- 3: holds. The `'perl'` kind and its row are gone, perl is out of the head comment, "four" becomes "three" at `first-run.ts:53` and `:174`, git, tmux and claude keep their rows and their order, and `PROGRAMS` is `['git', 'tmux', 'claude']`. C4 exits 1, and the G73 file passes 17 of 17 rows (part of the 49 passed above).
- 4: holds. `package.json` and the lock lose exactly cloc's lines (diff read above), `docs/licenses/GPL-2.0.txt` is deleted, cloc's row is gone, and the opening sentence says one bundled program, which holds for 7z-wasm (`unpack.ts:1`, "run by Node in a process of its own").
- 5: holds. `HELP.md:249`, `README.md:58`, and the comments of `Status.svelte`, `GroupHead.svelte`, `run.ts:32` and `:51-59`, `files.ts:1-4`, `shipped.ts:1-4` and `first-run.ts:17-24,53,174` all say what is left. The new `files.ts` head comment names the Timeline, and it is the Timeline that reads `fileLog`: `git-reads.ts:35,123` wires it as the `log` read, `run.ts:65` calls that form "the Timeline's", and `fs-history.ts` is read by `explorer/sections/timeline-state.svelte.ts`. The item 5 grep finds no hit the step makes false. One sentence outside item 5's named places is under Standards 1.

Cases of the brief's "Cases":

- C1: met. After the change the rows pass (rerun: 3 files, 49 passed, 2 skipped). The report quotes the failure before the change at `:204:48`, `:221:65` and `:233:46`. Those lines are the `expect` lines of the `ROWS` table, the zenity row and the wsl row (read at `first-run.test.ts:201-236`). They run with a PATH holding only `PROGRAMS` (`startLacks` at line 86, `lacksOn`), which on the base row at `first-run.ts:206-210` names a `perl` lack. The run before the change was not repeated (Declined to judge).
- C2: met, rerun above (every path missing, exit 1).
- C3: met, rerun above (grep exit 1; the diff of the two package files removes only cloc's lines).
- C4: met, rerun above (exit 1 after; before reproduced from the base text, the same 18 lines).
- C5: met, rerun above (only removals and the two counts).
- C6: met by reading the CSS. The landing look's `getBoundingClientRect` measurement remains the proof the brief names for the drawn page. The reading: `Surface` is `display: contents` (and a padded block over a wallpaper), so `.hooks` follows the git `<p>` (`margin: 0`) at `margin-top: 16px`. `GroupHead`'s `section.group` has no margin, and its `h3.strip` has `margin: 0 0 8px`, so no top margin collapses into the 16 px. When the hooks are open, the block ends on `.controls`, which has no bottom margin, and `.samples { margin-top: 16px }` puts the Gallery 16 px below. When the hooks are folded, the body is `hidden="until-found"`: content-visibility hidden, its own formatting context, zero height. The strip's 8 px therefore stays inside the section as it did inside the old flex item, and the section-to-Gallery gap stays 16 px. No Lines of code element is in the markup.
- C7: met, through C1: the rows run on a PATH with no perl, and no row names a lack.
- C8: met by reading `first-run.ts:115-134`. `behind` iterates only `wanted`, the entries of `package-lock.json`, so an extra `node_modules/cloc` (present in this worktree, `ls node_modules/cloc`) is no lack.
- C9: met by reading each place listed (item 5 above). One sentence outside C9's list is under Standards 1.
- C10: met by reading `pane-fold.ts:45` (`open: (key) => !folded().includes(key)`) and `folds.ts`. `instanceFolded` keeps "a key no group has ... and folds nothing", and `foldedWith` keeps every other key, so `hooks` stays folded and `lines` is read by nothing.
- C11: met by reading. `shipped.ts:7-17` ships `'docs'` as it is on the tree, and `release.ts:56` installs with `['ci', '--omit=dev', ...]` from the lock. With C2 and C3, the app holds no `GPL-2.0.txt` and no `node_modules/cloc`, and the lock holds no GPL-licensed entry (Python read: 745 entries, none).

## 1. Spec

none

## 2. Proof

none

## 3. Standards

- `src/lib/state/shared/words/format.ts:6-7`: "The words come from the catalog like every other word: a suffix and a separator are strings a reader sees, so they are keys rather than literals." What is wrong: at the base, the separator this sentence named was `app.thousands_separator`, read by `grouped` (`git show 81a913408:src/lib/state/shared/words/format.ts`, lines 43 and 49). The diff removes both and rewrites the first paragraph of this head comment, but it leaves this paragraph, so the file no longer reads any separator key. The one separator the file still writes itself is the literal `:` of `clock()` and `stamp()` (`${pad(date.getHours())}:${pad(date.getMinutes())}`). The rules file's "What every package obeys" section says a sentence in a head comment that the change makes false is a defect of the change, and the report lists `format.ts:1-4` as rewritten without judging lines 6-8. The fix is small and inside the files the step already writes: the sentence names a suffix alone, or names the templates that carry a separator (`sessions.stamp_day`, `sessions.ag_mins`). Failure scenario: a reader maintaining `format.ts` takes the head comment to mean that a separator is a catalog key, looks for the key, and finds none, or reads the `:` literal as a breach of the file's own rule. Verdict: none; it is outside the places items 1 to 5 name, and it can be fixed at landing.

## 4. Behaviour

none

## Declined to judge

- The run of C1 and of verify 2a before the change. Repeating it means running the changed test against the base `first-run.ts` in a copy of the tree. I judged C1 by reading the three failing lines the report quotes against the test's PATH setup and the base perl row.
- The C3 "before" count of 41 hits. I did not count it, since no decision rests on it. The C4 "before" was reproduced from the base text.
- `npm run diagrams`. It writes tracked files, so I did not run it. The committed diagrams are checked by `tests/checks/diagrams/diagrams.test.ts` ('are what the source gives now, each file byte for byte'), which test:quick chose and passed. The `channels.*` rewrite (`context.ts:175` to `:174`) is generated output from the one import line removed above line 175, and it falls under the brief's "any other file of `docs/diagrams` that `npm run diagrams` rewrites".
- The output the report quotes from `npm uninstall cloc --package-lock-only` (the audit summary and the fsevents warning). Rerunning it would write and reach the network. Its effect on the two package files is read above.
- `agents/guarded.md` G73 in the worktree's ledger copy still names "git, tmux, perl, the Claude CLI". The brief leaves that rewrite to the orchestrator at landing, and builders never edit `.scratch/`.
- Decision 3, removing `lines` from `folded` in `~/.oculus/views.json`. It is the orchestrator's at landing, and I did not read `~/.oculus`.
- The overlap with O128, which is in flight. Both steps write `docs/HELP.md` (lines 249 and 307) and the generated diagrams. Whether the merge is simple, and whether the diagrams must be regenerated after both steps land, is the orchestrator's judgement at landing, and the landing gate's diagram check settles the second.
- My test:quick run wrote only the generated `.svelte-kit` types (its `svelte-kit sync`). `git status --short` shows the same 35 entries after it. Whether git ignores `.svelte-kit` would take `git check-ignore .svelte-kit`, which is outside the git this review runs.

Reviewer usage: a9c8c428e5b66ae90, claude-opus-5-5, 209753 tokens, 64 tool uses, 11 min 26 s.

## Repair round 1, refuted

Every command ran from the worktree root `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O129`, in the foreground, with PATH including `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin`. The round's delta: for each of the 34 paths of `../migration-O129-round-1/files.txt`, `diff -u <snapshot copy> <worktree file>` (each deleted path checked absent). Only `src/lib/state/shared/words/format.ts` differs, in its head comment's second paragraph (snapshot lines 6-8 become lines 6-11). `git status --short` shows the same 34 entries as `files.txt`, plus the two untracked ledger files `.scratch/migration/agents/briefs/O129-round-1.md` and `.scratch/migration/agents/reviews/O129-report.md`. No other path changed.

```
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
Error: Test timed out in 5000ms.
 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 7 passed (8)
(the row timed out at 5992ms; it is tests/checks/source/history.test.ts:159)

$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts --testTimeout 0 --hookTimeout 0 --reporter=verbose
<check mark> |unit| tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils 2293ms
<check mark> |unit| tests/checks/source/comment-width.test.ts > a comment line > is found in each language the tree is written in 1ms
<check mark> |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment 6317ms
(and the five other history.test.ts rows)
 Test Files  2 passed (2)
      Tests  8 passed (8)

$ sed -n 16p package.json
        "test:checks": "vitest run tests/checks --testTimeout 0 --hookTimeout 0",
$ sed -n 283-286p tests/tiers/quick.mjs
if (checks.length > 0) {
    const flags = ['--testTimeout', '0', '--hookTimeout', '0', ...loader];
(vite.config.ts:474-479, the comment: "The tree checks under tests/checks ... run by npm run test:checks with no time limit")

$ LC_ALL=C grep -n '[^ -~]' src/lib/state/shared/words/format.ts
exit 1, nothing printed
$ LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/state/shared/words/format.ts .scratch/migration/agents/reviews/O129-report.md
nothing printed
$ npx prettier --check src/lib/state/shared/words/format.ts
All matched files use Prettier code style!
$ diff -u <snapshot format.ts> format.ts | grep '^+' | grep -v '^+++' | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O1[0-9][0-9]|20[0-9][0-9]-"
exit 1
$ awk 'NR<=11 {print NR, length($0)}' format.ts
6 100, 7 98, 8 100, 9 99, 10 98, 11 89; each line plus the next line's first word exceeds 100 (125, 102, 120, 103, 102), so the wrap is greedy
$ grep -nE "t\('|\$\{pad|function pad|0\$\{value" format.ts   (worktree, then snapshot)
worktree: pad 19-20, n_millions 38, n_thousands 40, ':' 51, '-' 60, stamp_day 61, day_sun..day_sat 73-79, ahead 81, ':' 88, ag_secs 112, ag_mins 113
snapshot: pad 16-17, n_millions 35, n_thousands 37, ':' 48, '-' 57, stamp_day 58, day_sun..day_sat 70-76, ahead 78, ':' 85, ag_secs 109, ag_mins 110
$ grep -rn -e "stamp_day:" -e "ag_secs:" -e "ag_mins:" -e "n_millions:" -e "n_thousands:" -e "ahead:" -e "day_sun:" -e "day_sat:" config/text --exclude=local.yml
agents.yml:9 ag_mins: '{0}m {1}s'; agents.yml:12 ag_secs: '{0} s'; session-list.yml:37 n_millions: '{0}M'; session-list.yml:38 n_thousands: '{0}k'; session-list.yml:60 stamp_day: '{0} {1}'; app.yml:192 ahead: '{0} {1}'; app.yml:198 day_sat: Sat; app.yml:199 day_sun: Sun (plus unrelated msg_docs_ahead, ch_ahead and deposit's ahead)
$ git diff 81a913408 --numstat -- src/lib/state/shared/words/format.ts config/text/app.yml
10 20 src/lib/state/shared/words/format.ts
0 1 config/text/app.yml
$ wc -l src/lib/state/shared/words/format.ts
126

The brief's checks, rerun over the repaired tree:
$ npx vitest run tests/server/root/process/first-run.test.ts tests/server/machine/hpc/submit-files.test.ts tests/checks/config/config-folder.test.ts
 Test Files  3 passed (3)
      Tests  49 passed | 2 skipped (51)
$ ls 'src/routes/api/(machine)/lines' src/lib/server/machine/lines.ts src/lib/state/system/lines.svelte.ts src/lib/views/system/status/LineCounts.svelte docs/licenses/GPL-2.0.txt
five "No such file or directory" lines, exit 1
$ grep -rnw cloc src tests config docs README.md package.json package-lock.json utils --exclude=local.yml
exit 1
$ git diff 81a913408 -- package.json package-lock.json   (changed lines only)
the root entry's "cloc": "2.6.0-cloc", the nine lines of the "node_modules/cloc" block, package.json's "cloc": "2.6.0-cloc"; no added line
$ grep -rnw perl src --exclude=local.yml
exit 1
$ sh utils/unused-exports.sh > <scratchpad>/ue-after.txt; diff ../O129-base/unused-exports.txt <scratchpad>/ue-after.txt
only the two counts (228 to 226, 108 to 107) and three '<' lines (lines.ts, lines.svelte.ts readCount, lines.svelte.ts Lines); no line added
$ grep -rn "words/format.ts:[0-9]\|format\.ts:[0-9]" src tests docs README.md utils config --exclude=local.yml
exit 1 (nothing cites format.ts by line, so the three-line shift moves no citation in the tree)
$ grep -rln "words/format" tests ; grep -rln "\bcompactCount\b\|\bmodelShort\b\|\bstamp(\|\bspan(" tests
tests/checks/tree/layer-rows.ts (a layer table row) ; nothing
```

The round's point, Standards 1 of the first review: **closed**. The sentence "a suffix and a separator are strings a reader sees, so they are keys rather than literals" is gone. I checked the new paragraph line by line against the file. (1) The count suffixes `sessions.n_millions` and `sessions.n_thousands` are read at lines 38 and 40. (2) The day names `app.schedules.day_sun` to `app.schedules.day_sat` are read at lines 73-79. (3) The templates are read as named: `sessions.stamp_day` at line 61 joins a stamp's day and time (`'{0} {1}'`), `app.schedules.ahead` at line 81 joins the weekday and `stamp`'s day form, and `sessions.ag_secs` and `sessions.ag_mins` at lines 112-113 write a span. These are every `t()` call in the file, and every key is in the catalog. (4) The literal `:` is written at line 51 (`stamp`) and line 88 (`clock`), and the literal `-` between month and day at line 60 (`stamp`). No other punctuation literal reaches the output. The `0` of `pad` (line 20) is what "padding" names. The decimal point of `1.9M` comes from `Number.prototype.toFixed` (line 37), not from a literal, so "two characters are written by the functions themselves" holds. (5) "Arithmetic, padding and slicing" holds for what is left. `compactCount`, `seconds` and `span` are arithmetic. `pad` is the padding. `modelShort`'s prefix `replace`, `relativeTo`'s `slice` and `compactCount`'s `.0` trim are the slicing. `dateOf` and `ahead`'s weekday index are reads.

The round asked for the `:` as "the one character" only if a read showed that to hold, and said a false sentence is left unwritten and handed back with the read. The builder found the second literal `-`, left that sentence unwritten, handed the read back in the report's "Anything in the brief that was wrong or impossible", and wrote the true sentence naming both characters. That falls inside the paragraph rewrite the round ordered, not beyond it.

The round's check command, run as written, is red on one row, which times out under vitest's default 5000 ms limit. Run in the form the tree runs `tests/checks` (`package.json:16`, `tests/tiers/quick.mjs:283-286`, the comment at `vite.config.ts:474-479`), it passes 8 of 8. Running the checks with `--testTimeout 0` loosens no threshold: it is the time limit the tree itself sets for these checks, and the round brief's command left that flag out. The row that times out scans every comment of the whole tree, so its time follows the tree's size and not the one comment paragraph the round changed. I judge the round's check passed. The red result under the default limit comes from how the command was written, not from a defect of the step. The report's DONE row states both forms with their output.

No fix reaches beyond the point. The delta is the one paragraph, and no code line of `format.ts` changed (the diff loop above).

### Verdicts

Items of the brief's "What to build", over the whole diff since `81a913408`:

- 1: holds. C2 rerun: the four files and the route folder are gone. `Status.svelte` loses the import and `<LineCounts />`, and `.groups` (flex, column, 16 px gap) becomes `.hooks { margin-top: 16px; }` with its comment rewritten (`git diff 81a913408`). `lines` and its doc comment are out of `context.ts` and `client-state.ts`. The four model types and `trackedFiles` are deleted. The first-run, submit-files and config-folder tests pass (49 passed, 2 skipped).
- 2: holds. The diff removes the 22 `status.lines_*` keys, `server.start.fix_perl_xcode`, `server.start.needs_perl` and `app.thousands_separator` (numstat `0 1 config/text/app.yml`). `thousands_separator` has no reader left.
- 3: holds. The `'perl'` kind and its row are gone, the head comment no longer names perl, both counts of "four" are now "three" (diff), `PROGRAMS` is `['git', 'tmux', 'claude']`, C4 exits 1 and the G73 file passes.
- 4: holds. The package diff removes only cloc's lines, `docs/licenses/GPL-2.0.txt` is gone, and `docs/third-party.md` loses cloc's row and says one bundled program.
- 5: holds. `HELP.md:249`, `README.md:58`, `Status.svelte`, `GroupHead.svelte:58-68`, `run.ts:32` and `:51-58`, `files.ts:1-4`, `shipped.ts:1-4` and `first-run.ts:17-24,53,174` all say what is left (diff read above). The `format.ts` paragraph, which lay outside item 5's named places, is now true (the round's point, above). One older clause of `format.ts:3-4` is under Findings 2.

Cases of the brief's "Cases":

- C1: met. The rerun passes 49 rows with 2 skipped. The failure before the change, which the report quotes at `:204:48`, `:221:65` and `:233:46`, stands as the first review judged it.
- C2: met, rerun above (exit 1, every path missing).
- C3: met, rerun above (grep exit 1; the package diff removes only cloc's lines).
- C4: met, rerun above (exit 1).
- C5: met, rerun above (no line added).
- C6: met by reading `Status.svelte`'s markup and CSS in the diff. `.hooks` keeps `margin-top: 16px` after the git `<p>`, and `.samples` keeps the Gallery 16 px below. The `getBoundingClientRect` measurement at the landing look remains the proof the brief names.
- C7: met through C1's rows: the PATH holds only `PROGRAMS`, and no row names a lack.
- C8: met by reading `first-run.ts` `packageLacks`. It iterates only the lock's entries, and the round does not touch this file.
- C9: met by reading every place listed (item 5).
- C10: met by reading `pane-fold.ts` `open` as the first review did. The round does not touch it.
- C11: met by reading `shipped.ts`, whose diff keeps `SHIPPED_SOURCES`, and `release.ts`, together with C2 and C3.

### Findings

- Standards. `.scratch/migration/agents/reviews/O129-report.md`, section "Repair round 1" and section "Anything in the brief that was wrong or impossible": "`t('sessions.n_millions', ...)` line 35, `t('sessions.n_thousands', ...)` line 37, `t('sessions.stamp_day', day, time)` line 58, ... the literal `:` at lines 48 (`stamp`) and 85 (`clock`), the literal `-` at line 57 (`stamp`); `pad` (line 17)" and "false by the read of `format.ts:57`". What is wrong: every one of these line numbers is the snapshot's, taken before the round's paragraph grew from 3 lines to 6. In the worktree they are 38, 40, 61, 73-79, 81, 112, 113, 51, 88, 60 and 20 (the grep above, worktree against snapshot). The rules file's section "The working rules that bind every package (from the hub's CLAUDE.md)" says every `file:line` in the report is taken after the last change. The closure of the round's point rests on these citations, and the comment itself is correct. Failure scenario: the orchestrator at landing, checking the closure, opens `format.ts:57` for the `-` literal and finds `) {`, then `:48` for the `:` and finds a comment line of `stamp`'s neighbour, and must recompute every reference before accepting the point. Fix at landing: add 3 to each cited line (pad: 17 to 20). Verdict: none.
- Standards. `src/lib/state/shared/words/format.ts:3-4`: "No runes here, so every one of them is a pure function over its arguments and is tested directly." What is wrong: no test imports `format.ts` or calls its functions. `grep -rln "words/format" tests` prints only `tests/checks/tree/layer-rows.ts`, a layer table row, and a grep of `tests` for `compactCount`, `modelShort`, `stamp(` and `span(` prints nothing. The clause was already false at the base (`git show 81a913408:src/lib/state/shared/words/format.ts`, lines 3-4, same clause), so the step did not make it false. The step's first round did rewrite and rewrap this paragraph and carried the clause forward. The report lists `format.ts:1-4` as "rewritten". Under the rules file's test rule (a test exists only as the test of a `guarded.md` entry), the fix is a change to the comment ("can be tested directly", or the clause dropped), not a new test. That is one comment line in a file the step already writes, outside the round's point. Failure scenario: a maintainer changing `compactCount` or `stamp` trusts the head comment, expects a direct test to catch a regression, and none runs. Verdict: none. The disposition is the orchestrator's: a fix at landing or a note that it predates the step.

### Declined to judge

- `npm run test:quick` with `npm run diagrams` before it. I did not run them: this run forbids npm commands that write. `test:quick` runs `svelte-kit sync`, which writes `.svelte-kit`, and `diagrams` rewrites tracked files. The round changed one comment paragraph. prettier --check, the ASCII grep, the perl ASCII gate, `comment-width.test.ts` and `history.test.ts` cover it, all rerun above. The type check and eslint read no comment text. The first review's `test:quick` ran on the tree before the round.
- The runs before the change, for C1 and verify 2a, and the C3 "before" count of 41. They would need the unchanged tree. The first review's judgment of the quoted failing lines stands.
- The drawn 16 px gaps of C6. Only the look at landing settles them; I started no page.
- Decision 3, removing `lines` from `folded` in `~/.oculus/views.json`. It is the orchestrator's at landing, and I did not read `~/.oculus`.
- `agents/guarded.md` G73 in the worktree's ledger still names "git, tmux, perl, the Claude CLI" (`grep -n perl .scratch/migration/agents/guarded.md`: line 285). Builders never edit `.scratch/`; the rewrite is the orchestrator's at landing.
- The overlap with O128 in `docs/HELP.md` and the generated diagrams. Whether the merge is simple is the orchestrator's judgment at landing.

Reviewer usage: a00fab92642def271, claude-opus-5-5, 159544 tokens, 28 tool uses, 5 min 42 s.

## Closed

- First review, Standards 1 (the head comment of `format.ts` naming a separator key the file no longer reads): closed in repair round 1, which rewrote the paragraph; the review over the round found it true of the file.
- Over round 1, Standards (the stale line numbers in `O129-report.md`): fixed at landing, every cited line of `format.ts` moved to the worktree's numbering (38, 40, 61, 73-79, 81, 112, 113, 51, 88, 60 and 20).
- Over round 1, Standards (`format.ts:3-4`, "and is tested directly"): fixed at landing, the clause dropped, so the sentence ends "a pure function over its arguments."; `grep -rln "words/format" tests` prints only `tests/checks/tree/layer-rows.ts`, a layer table row and no import.
- Declined points 3 to 5 (the 16 px gaps, decision 3, G73): taken at landing, in the landing report.
