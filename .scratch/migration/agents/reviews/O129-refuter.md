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
