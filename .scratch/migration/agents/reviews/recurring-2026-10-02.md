Recurring-findings pass, plan oculus/migration. This pass was read-only: no file was written in the tree, no state-changing git command was run, and no agent or skill was started. The only files written are helper files in my own scratchpad. `tools/oculus/config/local.yml` was not opened, and ports 8787 and 8790 were not touched.

## 1. What was not read in full, first

- **Q88c and the X3a round-1 review.** `ls agents/reviews/Q88c-refuter.md agents/reviews/X3a-round1-refuter.md` prints "No such file or directory" for both, because both reviews were still running.
- **How the findings were read.** I took every finding from all 103 reports through an extraction (`extract.py` in my scratchpad), one line per finding, each cut to about 270 characters. Five reports gave wrong counts through that extraction, so I read them by hand: D27, Q102, Q110, Q80 and R18.
- **How membership was checked.** Every step listed under a cause below was confirmed by a `grep -niE` over that step's refuter file in this turn. The line number given is the hit that grep printed. A step I could not confirm that way was left out, so some counts are lower bounds.
- **Round-1 briefs.** I read only their standing paragraphs, plus greps for "Append", "Rewrite your report" and checks.sh. The per-finding rulings inside them were not read in full.
- **First-review counts.** These are the extraction's count of round-0 list items. They include the reviewer's lines saying a check came back clean, so they are upper bounds on defects, not exact defect counts. For the five steps above, the counts are hand counts.

## 2. Counts

- **Reports.** 103 refuter reports newer than `recurring-2026-09-17.md`, from `find agents/reviews -name '*-refuter.md' -newer recurring-2026-09-17.md | wc -l`. All 103 were read.
- **Steps.** 100 distinct steps. Q36, Q53 and Q56 each also have a `-round1-refuter.md`.
- **Round-1 briefs.** `ls agents/briefs/*-round1.md` lists 32 files covering 31 steps; D35 has two, `D35-round1.md` and `D35-first-build-round1.md`.
- **Repair-round section.** The extraction found none in Q103, Q36, Q51, Q53, Q54, Q56, Q77c, Q77d, Q90, Q94, Q95, U4 and X3a. X3a's round-1 review is still running.

| Step | R1 brief | 1st review | Step | R1 brief | 1st review | Step | R1 brief | 1st review |
|---|---|---|---|---|---|---|---|---|
| D13a | no | 28 | Q53 | no | 48 | Q85a2 | yes | 77 |
| D13b | yes | 52 | Q54 | no | 32 | Q85a4 | yes | 56 |
| D13c | no | 41 | Q56 | no | 5 | Q85b | yes | 7 |
| D24 | yes | 13 | Q58 | no | 18 | Q85c | yes | 16 |
| D27 | yes | 13 | Q59 | no | 23 | Q85d | yes | 11 |
| D31 | yes | 11 | Q65 | no | 68 | Q86 | no | 11 |
| D35 | yes (2) | 71 | Q66 | yes | 11 | Q86b | no | 6 |
| E1 | no | 34 | Q67 | no | 42 | Q86c | yes | 9 |
| E2 | no | 20 | Q68 | no | 12 | Q87 | no | 16 |
| E3 | yes | 11 | Q69 | no | 18 | Q88 | no | 39 |
| L3 | no | 53 | Q70 | no | 13 | Q88b | yes | 19 |
| L4 | yes | 12 | Q71 | no | 35 | Q89 | no | 31 |
| L5 | no | 53 | Q73 | no | 89 | Q90 | no | 53 |
| L6 | no | 13 | Q74 | no | 39 | Q92 | no | 28 |
| L7 | no | 36 | Q76 | no | 59 | Q93 | no | 51 |
| M4 | yes | 15 | Q77a | no | 41 | Q94 | no | 7 |
| O31 | no | 31 | Q77b | no | 40 | Q95 | no | 5 |
| O32 | no | 50 | Q77c | no | 33 | Q96 | no | 21 |
| Q100 | no | 43 | Q77d | no | 27 | Q97 | no | 3 |
| Q101 | no | 16 | Q77e | no | 27 | Q98 | no | 9 |
| Q102 | no | 16 | Q78 | no | 50 | Q99 | no | 13 |
| Q103 | no | 36 | Q79a | no | 18 | R14 | no | 28 |
| Q106 | yes | 28 | Q79b | no | 28 | R18 | no | 13 |
| Q107 | yes | 6 | Q79c | no | 12 | S2 | no | 73 |
| Q108 | yes | 25 | Q79d | no | 18 | S3a | yes | 68 |
| Q109 | yes | 48 | Q80 | no | 13 | S3b | yes | 82 |
| Q110 | yes | 4 | Q81 | no | 56 | S3c | yes | 18 |
| Q111 | yes | 39 | Q82 | no | 28 | U1 | no | 59 |
| Q35 | yes | 36 | Q83 | yes | 76 | U2 | yes | 112 |
| Q36 | no | 40 (round1 file: 1) | Q84 | no | 15 | U3 | yes | 25 |
| Q48 | no | 12 | Q85a1 | no | 8 | U4 | no | 8 |
| Q49 | no | 52 | | | | X3a | yes | 60 |
| Q50 | no | 15 | | | | X3b | no | 34 |
| Q51 | no | 15 | | | | X3d | yes | 81 |
| Q52 | no | 19 | | | | | | |

The `-round1-refuter.md` files of Q53 and Q56 hold 0 first-review findings each.

**State of the R14 and Q59 checks today:**
- **Verify list.** `orchestrator-state.md` lines 7 to 13 list 7 commands: `npm test`, `test:checks`, `check`, `build`, `format:check`, `lint` and the ASCII grep.
- **Removed or never wired.** R14's head-comment print, `utils/cited-lines.mjs`, `utils/scratch-count.sh` and the config-diff print are not in that list.
- **Retired.** The revert directive and the browser suite were retired by Q93, and spec.md:53 now says "there is no browser suite and no revert directive".
- **Still running.** `tests/checks/source/comment-width.test.ts` (WIDTH = 100, from Q59), `tests/checks/source/history.test.ts` (package ids, dates and "this session" only), and under `tests/checks/tree`: `duplication.test.ts` (jscpd, 8 lines and 50 tokens), `size.test.ts`, `audits.test.ts`, `negatives.test.ts` and `scratch.test.ts`.

## 3. Causes seen in three or more steps

Every "smallest change" below is a rule sentence for `agents/spec.md` or a sentence every brief carries. Where a script is named, it computes a fact, and writing it needs Axel's approval first.

### A. A document, head comment or catalog sentence is made false by the change (67 steps)

**Cause.** The builder changes behaviour but does not re-read the prose that describes that behaviour: DESIGN.md, HELP.md, README.md, catalog text and the head and doc comments.

**Steps.** Report = `agents/reviews/<step>-refuter.md`; "Sec" means the line is the finding's heading in that section.

| Step | Line | Quote |
|---|---|---|
| D13a | 71 | `load.ts:6-8` ("the server renders the editor's host and never reaches this code") |
| D13b | 122 | `HELP.md:181`: "A file holding carriage returns ... has no block actions" against ruling 3 |
| D13c | 119 | "HELP.md:145 now says the code theme is saved to `config/layout.yml`" |
| D31 | 113 | HELP.md:186, DESIGN.md:128 "without asking for a password or a passphrase" |
| D35 | Standards | "A sentence made false or stale." (DESIGN.md:403) |
| E1 | Spec S1 | "DESIGN.md:303 opens `deck` among kinds 'which edit the hub's own data'" |
| E3 | Spec | DESIGN.md:311 replaces the brief's rule for a settled fetch |
| L3 | 50 | "The diff makes a user-visible string false: `config/text/views/system/config.yml:8`" |
| L4 | R1 Standards | "a head comment the diff makes false by moving the pane out of the Focus group" |
| L5 | 64 | "A comment the diff makes false. `Document.svelte:16-18`" |
| L7 | Spec | HELP.md row `y1-y9` "reads as if the whole group is reached" |
| M4 | 61 | "S1. Sentence made false, outside the path list. README.md:33" |
| O32 | 61 | "T1. A head comment is now false. `sessions.ts:18`" |
| Q101 | 38 | "`Composer.svelte:5` ... and `:9-11` ... are false after the diff" |
| Q106 | Spec | "DESIGN.md:218 and :402, as rewritten ... are false for these two commands" |
| Q107 | Behaviour | `HELP.md:146` (`pages` row) against `storage.ts:18` |
| Q109 | 182 | "One clause of DESIGN.md:361 is false when a resize gets no answer" |
| Q111 | 177 | "A head comment the change wrote therefore describe[s]" a path that does not run |
| Q49 | 267 | "A head comment the code makes false, `Ticker.svelte:14-15`" |
| Q50 | 50 | "The head comment above `ADDRESSED` (`:241-245`) claims more than the code does" |
| Q52 | 57 | "`DESIGN.md:340` is made false in three ways" |
| Q58 | 60 | "Head comments made false by the moves" |
| Q59 | R1 Standards | "`TreeItem.svelte:7-8`, a head comment the same file's diff makes false" |
| Q65 | Standards | "`form-drafts.svelte.ts:245-246`, false now" |
| Q67 | 57 | "DESIGN.md:300 made false" |
| Q68 | Standards | `git.ts:19`: "the same watch" now reads as the poll |
| Q69 | 47 | "cache.ts:67,85: two comments the diff makes false" |
| Q71 | Spec | head comment `order.ts:8-10` "true of the folder but false of `model.ts`" |
| Q73 | 105 | DESIGN.md and HELP.md:205 "Both are false for `layer-server.svg` and `layer-views.svg`" |
| Q74 | Standards | "`bin/diagrams/code.mjs:31-32` ... This is false at end of file" |
| Q77c | Standards | "`bin/revert-check.mjs:10-11` ... This is false for `=>`" |
| Q77d | Standards | "A comment made false by the diff" (`dev-server.test.ts:120-124`) |
| Q77e | 64 | "Two comments make a false statement" (`diagrams.mjs:14`, `parsed.mjs:5`) |
| Q78 | 62 | "`HELP.md:136` is false for some headings" |
| Q79a | 69 | "`roots.ts:13`, not in the diff but made false by it" |
| Q79b | 71 | "`code.ts:216` ... the comment is false" |
| Q79c | Standards | DESIGN.md:282, the extension-map sentence |
| Q79d | 105 | "`list-edit.ts:20`, `host-status.ts:4`, `agents.ts:12` ... are false" |
| Q81 | 236 | "Sentences the round made false about the sheet" |
| Q83 | Standards | "St3: an images.ts comment is false for JPEG" |
| Q84 | 132 | DESIGN.md:174 and HELP.md:260 "types only" |
| Q85a1 | Standards | `hooks.ts:15-17` head comment on zod schemas |
| Q85a2 | Proof | `codex.ts:151` and `DESIGN.md:148` on reading without a schema |
| Q85c | Standards | `DESIGN.md:148`, the zod rule per folder |
| Q85d | Standards | `DESIGN.md:169-170` Boundaries table rows |
| Q86 | Standards | "`layout.ts:96-97` ... is false whenever the fit scale is not 1" |
| Q86b | 115 | "The other new sentence is also false." |
| Q88 | 190 | HELP.md Terminal row "Kill Terminal (picked twice ...)" |
| Q88b | 108 | README.md:13 licence list lacks the new `trash` dependency |
| Q89 | Standards | "`DESIGN.md:271` still carries a false clause in the sentence the diff rewrote" |
| Q93 | 92 | "Head comments made false by the strip (spec.md:57)" |
| Q94 | 32 | "`Agents.svelte:14-15` ... is false" |
| Q98 | Standards | "`record.ts:31` ... is made false for a slash-command prompt" |
| Q99 | Standards | "`DESIGN.md:264` ... and `channel.ts:495-498` ... are false" |
| R14 | 201 | "Two head comments the diff makes false" |
| R18 | 52 | "That sentence is false against the code" (HELP Doc text) |
| S2 | Spec | "Archive now applies to live sessions, and a comment is now false." |
| S3a | 189 | a head comment describing editors S3b and S3c build later |
| S3b | Spec | "the comment in `config-key.ts:11-17` and `:75-80` is false" |
| U1 | Standards | Doc text omits DESIGN.md:234, which the change makes false |
| U3 | Spec S1 | "`DESIGN.md:410` ... `--fs-lg`" sizes misstated |
| X3a | Standards T3 | "HELP.md states a refusal that does not exist (item 19)" |
| X3b | Standards | "`Deposit.svelte:63` ... The `type Ask` this comment documented was removed" |
| X3d | 171 | "St2. DESIGN.md:389 has a sentence the diff makes false" |
| D27 | R1 Findings | "a reader trusts the head comment and takes the final cases to be the non-tracked ones" |
| Q102 | 145 | "T1. The TerminalList.svelte head comment and prop docs are made false by the change." |
| Q110 | 128 | "ST1. The new head comment is half false." |

**Spec rule.** spec.md:59 covers it: "After changing a name, a construct or a shape, grep it across `src`, `tests`, `config`, `HELP.md`, `DESIGN.md` and `README.md` ... A sentence in a document or a head comment that the change makes false is a defect of the change." The rule is triggered by a change of name. Most of these findings follow a change of behaviour where no name changed ("parsed once", "no second press", "saved to layout.yml"), so the grep finds nothing.

**Smallest change.** Add a spec.md sentence after line 59: "After changing what code does, re-read the head comment and the doc comment of every function you touched, and every DESIGN.md, HELP.md, README.md and catalog paragraph that describes that behaviour. List each one in the report as 'still true' or 'rewritten'." A script could print lines 1 to 14 of every changed file and every doc line holding a changed identifier, which is a fact. That needs Axel's approval, and it only gathers the text: whether a sentence is still true is judged by reading.

**R14/Q59 coverage.** R14 cause 2 was closed by a head-comment print that is no longer in the verify list (orchestrator-state.md:7-13), and the cause recurs. It is not covered today.

### B. A behaviour the step adds has no test that fails without it, or its test passes with the behaviour removed (53 steps)

**Cause.** The builder writes a test per behaviour but never checks that the test fails without the code. Since Q93 retired the revert directive, nothing forces that check.

| Step | Line | Quote |
|---|---|---|
| D13a | 61 | "the check cannot fail" (server build holds no Monaco) |
| D13b | 242 | "R6 redo never cleared ... stays green, 99 passed" |
| D24 | 102 | "no test sends a side project through" the Focus lanes |
| D35 | 269 | "partial in what a test proves" |
| L4 | 112 | `floatlayer.test.ts:164-170` asserts over `readFileSync('...Workbench.svelte')` source text |
| L5 | 57 | "Undo of a drag or a Hide ... is not tested anywhere in the diff." |
| L7 | 106 | "The core of the leads-to-Applications flow has no case." |
| O31 | 51 | "It still passes over a write" that is not atomic |
| O32 | 40 | "P1. No case proves judgment call 4" |
| Q100 | 50 | "all 10 tests of tinted.test.ts pass" with `selectors()` replaced |
| Q101 | 30 | "Revert R8 ... leaves every test green; the ruled change has no test." |
| Q107 | 95 | "The test passes with `attachTerminal` changed to join the first Terminal tab of any page" |
| Q108 | 71 | "The absence half cannot fail" |
| Q109 | 401 | "No test covers that path" (closed watcher) |
| Q111 | 149 | "With that change the test still pa[sses]" |
| Q48 | 69 | case "carries no revert of its own" |
| Q52 | 48 | "names a revert that leaves its own case green" |
| Q67 | 39 | "The write chain is untested." |
| Q69 | 40 | "the only launch fixture sets `run_in_background: true`" |
| Q70 | 135 | "two seed cases naming no revert, and none for the page side" |
| Q71 | 44 | "`graph.test.ts:429-441` stays green under its own revert" |
| Q73 | 195 | "Under the same revert, the `++` case stays green" |
| Q74 | 37 | "No case covers this." |
| Q76 | 100 | "No test covers either view under a re-read" |
| Q77c | 109 | "the converter's refusal paths and its usage untested" |
| Q77e | 47 | "Revert B ... All 67 cases passed" |
| Q78 | 50 | "now proven only through the shared rule" |
| Q79a | 118 | "dropping either entry leaves the suite" green |
| Q79b | 64 | "it asserts only `commentLines(...) == []`" |
| Q79c | 52 | the test "reads `languages()`", which after the change is fixed |
| Q79d | 33 | "no test pins it" |
| Q80 | 63 | "P1, three tests stay green with their change reverted" |
| Q81 | 85 | "stays green with the step reverted" |
| Q83 | 182 | "A hard link stops sharing content after a write ... it is untested" |
| Q85a2 | 127 | "S6. No case covers an `event_msg` without `payload`." |
| Q86 | 10 | "checked only through `nextStart()`" |
| Q86b | 34 | "clamp moved to once after all passes -> 35 passed GREEN" |
| Q88 | 36 | "`askTagDelete` with the stated revert ... green, 16 of 16 pass" |
| Q89 | 30 | "The Kill half of the Split-and-Kill case stays green with Kill on only one row." |
| Q92 | 63 | footer case "stays g[reen]" because it builds its own payload |
| Q93 | 161 | "with only the `//` branch of `blockOpens` removed ... the result is the same" |
| Q96 | 47 | "with `onValueChange={onchange}` removed, ever[y test passes]" |
| Q97 | 33 | "it stays green under reverts (a) and (b)" |
| Q98 | 29 | "The report's revert claim for `codeSpans` is wrong" |
| Q99 | 41 | "No test covers a first `sessions` message with no list followed by one with a list" |
| R18 | 36 | "It stays green with the guard reverted" |
| S3a | 172 | "a later edit to `findingsOf` reads the engine's `local.yml`, and the suite stays green" |
| S3c | 188 | "tocOf without its status filter: all 124 tests PASS" |
| U1 | 68 | "The theme-menu browser case's named revert does not revert this step's code." |
| U3 | 99 | empty.test.ts tests 1, 3 and 4 pass without the change |
| X3b | 34 | "The defects under Behaviour 1 and 2 sit in exactly these untested presses." |
| X3d | 73 | "The longest-ending test cannot fail (P1)." |
| Q110 | 66 | "Cases 5, 6, 7, 8, 10 and 11 passed on the unchanged tree." |

**Spec rules.** Three lines touch it, and none requires the check:
- spec.md:13 names "a test fitted to its revert" as lazy.
- spec.md:57 says "an assertion over source text, over a label alone or over a constant proves nothing and is reported as an audit".
- spec.md:60 asks for the empty, duplicated and colliding cases.

No line requires the builder to show that each test fails without the behaviour, now that spec.md:53 says "there is no ... revert directive".

**Smallest change.** Add to spec.md after line 57: "For each behaviour the step adds, the report quotes one run of its test on a scratch copy with that behaviour removed, and the failing line. A test with no such quote is titled 'audits that' and counts as an audit."

**R14/Q59 coverage.** R14 cause 1 was closed by `bin/revert-check.mjs`, which Q93 retired. It is not covered today.

### C. The report is not brought to the end state after a repair round (9 steps)

**Cause.** Round briefs tell the builder to append a section, so the earlier sections and the open-items copy go stale.

| Step | Line | Quote |
|---|---|---|
| D31 | 221 | "The report file still holds the older 'Item 14' section (lines 63-94)" |
| Q49 | 275 | "`Q49-report.md` still carries round 0's tables, which round 1 reversed" |
| Q71 | 289 | "the report's stale figures" |
| Q35 | 271 | "'Test count' ... is stale for five round-1 files" |
| Q77d | 54 | "The report's Part 1 section contradicts the delivered tree." |
| Q79a | 119 | "the open items copy says 'None' though Z43 was committed before the report was written" |
| Q84 | 257 | "Line 1 still says 'NOT DONE: item 4 ... is not built'" |
| Q85b | 263 | "the report's sentence that they need a ruling is stale" |
| Q99 | 40 | "Report's open items copy says '- None.'; the state file holds Z43." |

**Spec rules.** spec.md:14 ("A report states the end state") and spec.md:71 ("First line: anything NOT done ..."). Against them, about 17 of the 32 round-1 briefs say "Append a section 'Repair round 1' to your report", by grep over `agents/briefs/*-round1.md`.

**Smallest change.** Every repair brief carries this sentence in place of "Append": "Rewrite the report whole for the state after this round. Copy the open items from the state file at the moment you write it." This is a template sentence for the orchestrator's briefs, not a change to any skill.

**R14/Q59 coverage.** Not covered.

### D. The builder runs a git command (23 steps)

**Cause.** spec.md:32 lists only `add`, `commit`, `stash`, `checkout` and `status`. Builders read that list as allowing read-only commands such as `diff --stat`, `show`, `ls-files`, `rev-parse`, `log`, `check-ignore`, `--version` and the `-C .` forms.

| Step | Line | Quote |
|---|---|---|
| D13a | 75 | "The builder ran `git -C . diff --stat` in the worktree." |
| D24 | 115 | "the builder ran `git diff --stat ... >/dev/null` and `$(git diff --name-only ...)`" |
| E3 | 143 | "One read-only `git diff --stat` command ran inside the worktree" |
| L4 | 120 | "I ran `git diff --stat` twice, read-only, by mistake" |
| M4 | 63 | "the report says `git --version` was run once" |
| O31 | 58 | "The builder ran `git show HEAD:...context.ts`" |
| Q67 | 59 | "two read-only git commands (`git check-ignore`, `git status --porcelain`)" |
| Q71 | 127 | "The disclosed `git -C . status >/dev/null 2>&1`" |
| Q78 | 38 | "The builder disclosed one read-only `git diff --stat`" |
| Q79d | 49 | "The builder's git use leaves no trace in the worktree's git metadata" |
| Q81 | 99 | "the builder ran `git -C . status` in the worktree" |
| Q83 | 130 | "The builder ran `git -C . diff --stat`" |
| Q84 | 130 | "The builder ran two `git diff` commands" |
| Q85a1 | 118 | report section "Note on the no-git rule" |
| Q85a2 | 190 | "T6. The builder ran `git ls-files` and `git -C . diff --stat`." |
| Q89 | 44 | "It reports a read-only `git rev-parse` in the worktree." |
| Q98 | 35 | "The builder ran `git log -1` in the main checkout" |
| R18 | 31 | "'Early on I ran one read-only `git diff --stat`'" |
| S3b | 182 | "'I ran `git diff --stat -- docs/diagrams` once'" |
| X3a | 185 | "T2. The builder ran git commands." |
| X3d | 170 | "the builder ran `git -C . status` and `git status --short`" |
| Q102 | 122 | "S6. The builder ran git commands." |
| Q110 | 15 | "the builder's `git diff --stat` left nothing behind" |

Reviewers broke the same rule too: Q84-refuter.md:5 ("I ran `git show f7ab9b6a:<file>` three times") and Q110-refuter.md:3 ("I ran `git rev-parse HEAD`").

**Spec rules.** spec.md:32: "You never run a git command. Not `add`, not `commit`, not `stash`, not `checkout`, not `status`." spec.md:94 adds that "a builder runs no git command at all, since the orchestrator reads its diff". The examples in line 32 are the ones builders do not break.

**Smallest change.** Replace the examples in spec.md:32: "You never run a git command, read-only ones included: not `diff`, `diff --stat`, `log`, `show`, `status`, `ls-files`, `rev-parse`, `check-ignore`, `--version`, and no `git -C`. To see what you changed, compare against the file list your brief gives; to read a file as it was, use the base copy your brief names."

**R14/Q59 coverage.** Not covered.

### E. A figure, count or citation in the report does not reproduce (18 steps)

**Cause.** Numbers and `file:line` citations are taken before the last change and not re-taken.

| Step | Line | Quote |
|---|---|---|
| D35 | 143 | "Report line citations off by one." |
| E2 | 229 | "One row of the report's DONE table does not reproduce after the round" |
| L7 | 47 | "The failures the report gives do not reproduce" |
| Q35 | 112 | "The report says the row form of case 2 and case 3 'fails on the `li` selector'" (not reproduced) |
| Q52 | 125 | "Revert B's count does not reproduce" |
| Q54 | 119 | "One number in the report does not reproduce." |
| Q71 | 44 | "The report claims 0 unproven" (one case stays green) |
| Q77a | 222 | "The report says '9 now' for memory.mjs; the count is 8." |
| Q79b | 65 | "DONE on counts that differ (1519 before, 1521 after). My rerun gives 1516 and 1516" |
| Q85a1 | 189 | "json.ts 134 (the report says 135)" |
| Q89 | 101 | "`terminal-list.ts` has 144 lines; the report says 143." |
| Q95 | 42 | "the open-items 'None.' is at line 126 now" |
| Q99 | 19 | "80 passed ... (report says 77)" |
| R14 | 103 | "Timings in the report that my runs do not reproduce" |
| S3a | 57 | "My totals differ from the report's" |
| U1 | 58 | "The revert-check counts in the report are not the ones my run gives." |
| X3b | 35 | "That did not reproduce" (the browser directives claim) |
| X3d | 172 | "St3. DESIGN.md:405 cites a wrong line" |

**Spec rules.** spec.md:14 ("never state a measurement not taken"), spec.md:15 and spec.md:19 ("cite `file:line`"). None says when the measurement is taken.

**Smallest change.** Add to spec.md:14: "Every count, line count, timing and `file:line` in the report is taken after your last change; a figure from before it is re-taken or removed." A script is optional: `utils/cited-lines.mjs` already exists and checks that each cited `file:line` exists and is not blank, a fact. Adding it to the verify list needs Axel's approval. It cannot check that the cited line says what the report claims.

**R14/Q59 coverage.** R14 cause 4 built `cited-lines.mjs`, but it is not in the verify list (orchestrator-state.md:7-13) or in spec.md. Partly covered, and not run.

### F. A change the reader can see is missing from, or wrong in, the "before and after" (22 steps)

**Cause.** Builders list what the brief named and leave out side effects on what is drawn, focus, keys, accessible names, z-order and library defaults.

| Step | Line | Quote |
|---|---|---|
| D13a | 79 | "the quick diff marks and the blamed line numbers are now mouse-only Monaco decorations" |
| L6 | 31 | "The full-width bar ... no ruling covers it" |
| L7 | 135 | "It does not say that the look on a browser with saved [layout differs]" |
| O31 | 65 | "now shows no Codex sessions; before, `~/.codex/sessions` was always read" |
| Q100 | 64 | "Visible changes the report does not state with a before and after." |
| Q58 | 66 | Config view card order changed |
| Q65 | 102 | "Reader-visible changes the 'before and after' section leaves out" |
| Q67 | 64 | "Keyboard move without before and after." |
| Q69 | 52 | "Code blocks ... lose their own fill and blur over a wallpaper" |
| Q78 | 81 | "but not that nothing under it is tinted" |
| Q79d | 48 | "its before and after is not stated" |
| Q80 | 94 | "B1, a visible change the report does not state." |
| Q81 | 74 | "Z-order values ... stated without a before and after" |
| Q86 | 27 | "The failure line has no before and after in the report" |
| Q86c | 85 | the before/after says circles "at least 4 units apart"; the case checks 3.5 |
| Q88 | 118 | "It does not state this loss." |
| Q92 | 82 | "The views no longer show the calendar name, the location or the tentative mark." |
| Q96 | 70 | "The trigger's accessible name hides the chosen icon." |
| S2 | 105 | "Resume changed for the default account, stated without before and after." |
| S3b | 197 | "a difference the report does not list" |
| U1 | 112 | "The report's before and after for the sparkline is wrong in one place." |
| Q102 | 97 | "The report does not state this, either as a judgment call or in its before and after." |

**Spec rules.** spec.md:54: "Your report's 'before and after' section ... names the view, the state to put it in and what should differ." It does not say what counts as visible.

**Smallest change.** Extend spec.md:54: "Visible includes what is drawn, colour and fill, order, focus and tab stops, keys, the accessible name, words of a refusal, z-order over other surfaces, and any default a library brings with a new component."

**R14/Q59 coverage.** Not covered.

### G. A user-visible shape or decision taken without raising it (8 steps)

**Cause.** spec.md:18 names only "a config key, a wire format, a vocabulary". Builders do not treat saved-record keys, z-order, attribute values or departures from a ruling as shapes.

| Step | Line | Quote |
|---|---|---|
| L5 | 37 | "Silent choice, the rail's Settings item." |
| Q76 | 37 | "The wire shape `file` ... is a user-visible shape the brief did not name." |
| Q81 | 74 | "This is a decision the brief did not leave open" (z-order 60/65/70/80) |
| Q89 | 22 | "`Page.views` is a new saved-layout key the brief did not name." |
| S2 | 58 | "`top` as a new key in `~/.oculus/sessions.json`. The report names only a 'row-menu key'." |
| X3d | 47 | "The badge colours depart from the brief and the report does not record it as a judgment call" |
| U1 | 154 | "Several new user-visible shapes are waiting on a ruling but are not booked" |
| Q102 | 97 | "The report does not state this, either as a judgment call" |

**Spec rules.** spec.md:18: "a user-visible shape (a config key, a wire format, a vocabulary) the brief does not name is reported as a decision the orchestrator may reverse".

**Smallest change.** Widen the parenthesis in spec.md:18 to "(a config key, a key in a saved record under `~/.oculus`, a wire format or route parameter, a vocabulary or attribute value, a keybinding, a z-order, a destructive action without confirmation, a departure from a ruling)".

**R14/Q59 coverage.** R14 cause 10's config-diff print is not in the verify list. Not covered.

### H. Writes outside the brief's path list, unflagged or flagged only after writing (17 steps)

**Cause.** No rule says "report before writing", and the report's file table does not mark paths outside the list.

| Step | Line | Quote |
|---|---|---|
| L5 | 20 | "1. Files outside the brief's path list." |
| M4 | 4 | "Sentence made false and outside the brief's path list" |
| Q67 | 31 | "Paths written outside the brief's list" |
| Q70 | 29 | "Paths outside the brief's list, which the report names" |
| Q71 | 39 | "`vite.config.ts` is edited outside the step's path list" |
| Q103 | 90 | the brief's "Paths this step writes" and `shared_paths` themselves miss paths (a brief defect) |
| Q77e | 121 | "That path is on neither the brief's path list nor the round's four fixes." |
| Q79a | 55 | "outside the brief's path list; needed by item 1" |
| Q81 | 50 | "`fuzzy.ts` (new, 66 lines) is outside the brief's path list, and the report does not name it as a widening" |
| Q86c | 77 | "`allow-duplication.txt:161` is changed, outside the brief's path list" |
| Q90 | 27 | "the brief's path list ... name[s] neither `docs/diagrams` nor `tests/checks/diagrams`" (a brief defect) |
| Q93 | 74 | "`tests/fixtures/scratch.ts:6-7` rewritten, outside the path list" |
| Q96 | 42 | "Paths outside the brief's list: `Select`, `MultiSelect` ..." |
| Q99 | 34 | "Path list widened to ..." (booked as Z43) |
| Q102 | 109 | "The report lists the files but never says they are outside the paths list." |
| X3a | 110 | "Source files outside the path list, two of them L4's, undisclosed" |
| X3d | 79 | "Paths outside the brief's list, judged one by one" |

**Spec rules.** spec.md:13's last clause: "work outside it is named in the report with what it is and why it is outside." No line covers the path list as such, which spec.md never names, by `grep -n "path list" agents/spec.md`, which printed nothing.

**Smallest change.** Add to spec.md: "The brief's 'Paths this step writes' is the write list. The report's file table marks each path outside it with the reason, and a path outside it that the step needs is named in the report before the step is handed back." A script could compute the changed-file list minus the brief's path list, a fact; it needs Axel's approval.

**R14/Q59 coverage.** Not covered.

### I. The first run on the unchanged tree is not given per case, or was taken on an earlier form of the tests (9 steps)

| Step | Line | Quote |
|---|---|---|
| Q109 | 173 | "The report's first run quotes no failing output." |
| Q87 | 70 | "no first run on the unchanged tree for the two cases the ruling added" |
| Q88 | 78 | "The cases added to these files after the rulings ..." (no first run) |
| Q89 | 34 | "Not every first run is quoted." |
| Q97 | 29 | "no case's first run is given" |
| S3c | 89 | "the brief asks, for each case, the first run on the unc[hanged tree]" (aggregate only) |
| X3d | 162 | "first-run rows ... were taken on older versions of those files" |
| Q102 | 117 | "S5. The first run is not given per case." |
| D27 | 48 | "The report quotes only the aggregate" |

**Spec rules.** None: `grep -n "first run\|unchanged tree" agents/spec.md` prints nothing. The demand lives only in briefs.

**Smallest change.** Add a spec.md sentence: "The report quotes, per new or changed test, its failing line on the unchanged tree, run once on the final form of the test; an aggregate count is not a first run."

**R14/Q59 coverage.** Not covered.

### J. History wording in comments or test titles (11 steps)

| Step | Line | Quote |
|---|---|---|
| O32 | 65 | "T3. Two items are borderline history" |
| Q101 | 41 | "'draws the composer in a tab saved by New before tabs owned their terminals'" |
| Q36 | 3 | "one comment carrying history" |
| Q81 | 97 | "`Palette.svelte:403` ... 'as the palette did before it' carries history" |
| Q83 | 124 | "St2: history in test names and comments." |
| Q88b | 243 | DESIGN.md:384 "the one dependency the step adds" |
| Q93 | 104 | "'A drag is exercised in a browser after this package lands.' This is history" |
| R14 | 266 | "`bin/cited-lines.mjs:49` names an earlier bug ('... used to read as a hit')" |
| S3a | 184 | "one carries history" |
| X3d | 174 | "St5. Test names that carry history" |
| D27 | 55 | `it('gives every extension ... the language it has always been painted in'` |

**Spec rules.** spec.md:40: "never which package, session, date, earlier bug or reverted attempt it came from. A comment naming a package id ... or a date is a defect." It does not name the wording forms ("before", "used to", "always been", "after this package lands", "the step adds"), and does not mention test titles.

**Smallest change.** Extend spec.md:40: "This holds for test titles too, and covers wording that compares with an earlier state: 'before', 'used to', 'no longer', 'still', 'always has been', 'as before', 'the step adds', 'after this package lands'." Matching these words by script would flag every present-tense "before" and "still", which is a judgment, so it stays a reading rule.

**R14/Q59 coverage.** Q59's `history.test.ts` matches package ids, dates and "this session" only. Partly covered.

### K. A helper, type, schema or rule duplicated below jscpd's threshold (13 steps)

| Step | Line | Quote |
|---|---|---|
| D13a | 74 | "`EditorAction` repeats `editor-status.svelte.ts:410` `EditorAction` field for field" |
| L3 | 44 | "Three copies of one parser, against spec 'a parser ... exists once'." |
| Q79d | 26 | "The brief's premise of seven copies is incomplete" (an eighth `isFieldMap`) |
| Q82 | 75 | "`KeyRow` is declared twice, identically" |
| Q83 | 133 | "St5: the macOS test exists twice." |
| Q85a4 | 154 | "both are copies of `guards.ts:36-40` `scalar`" |
| Q85d | 106 | "A type defined twice: `fs.ts` `BookmarkRow` equals `rail.ts:20` `Bookmark`." |
| Q88 | 101 | "this repeats the body of the repositories store's `shellIn`" |
| Q96 | 54 | "`GlyphList.svelte` ... repeats `MenuList.svelte` ... rule for rule" |
| Q102 | 153 | "T2. The eight colour names are declared twice." |
| R18 | 56 | "`sanitiseGraph` repeats `SVG_PROFILE` and `sanitiseSvg` almost line for line" |
| S2 | 87 | "It duplicates `words()` of `pty/chat.ts` ... the same helper exists twice." |
| U3 | 111 | "`function between(...)` is defined again in" seven test files |

**Spec rules.** spec.md:76: "a parser, a fold or a rule exists once and is reused".

**Smallest change.** Add to spec.md:76: "Before writing a helper, type or schema, grep `src` and `tests` for its name and for its key call, and reuse what exists; the report quotes that grep." A script could list identifiers declared at top level in two or more files, a fact; it needs Axel's approval. Whether two declarations are the same thing stays a reading judgment.

**R14/Q59 coverage.** R14 cause 3's `duplication.test.ts` (jscpd, 8 lines and 50 tokens) misses these small copies. Partly covered.

### L. An asynchronous path not exercised in flight, after close, or superseded (8 steps)

| Step | Line | Quote |
|---|---|---|
| D13b | 83 | "view state written after close" |
| D13c | 113 | "The P8 in-flight test is weaker than it needs to be." |
| Q107 | 377 | "Nothing tests the guard that stops a superseded read from setting the kept pid." |
| Q109 | 401 | "A waiting rebuild that starts after close ... No test covers that path" |
| Q67 | 42 | "The spec requires an asynchronous path to be exercised in flight and superseded" |
| Q80 | 81 | "the asynchronous rule in spec.md ... is only half covered on the server" |
| R18 | 37 | "The superseded path ... has no test." |
| X3b | 50 | "spec.md:58 (an asynchronous path superseded by a later one): `Diff.svelte:114-133`" |

**Spec rules.** spec.md:60: "Every asynchronous path is exercised in flight, after close, and superseded by a later one."

**Smallest change.** Add to spec.md:60: "The report lists each asynchronous path the step adds or changes, with the test name for each of the three cases, or why a case cannot occur."

**R14/Q59 coverage.** Not covered.

### N. The first line says "Everything in the brief is done" while something is red or undone (6 steps)

| Step | Line | Quote |
|---|---|---|
| Q107 | 147 | "The report's first line still says 'Everything in the brief is done'" |
| O32 | 52 | "the report's first line says 'Everything in the brief is done'" while brief item 8's "0 unproven" fails |
| Q58 | 56 | "16 unproven revert lines are booked into Q59, yet its first line reads 'Everything in the brief is done'" |
| Q92 | 147 | "The verify list is red on a file of this round" |
| Q94 | 28 | "The report's first line says everything is done while its own verify run did not hold" |
| Q97 | 29 | "The first line 'Everyt[hing ...]'" with no first run given |

**Spec rules.** spec.md:14 and spec.md:71 ("Never present partial work as complete").

**Smallest change.** Add to spec.md:71: "Each DONE row quotes the last line of the final run that proves it; a row whose run is red or missing is NOT DONE, and then the first line is not 'Everything in the brief is done'."

**R14/Q59 coverage.** Not covered.

### O. Unused export or dead prop (9 steps)

| Step | Line | Quote |
|---|---|---|
| D13a | 72 | "the `onscroll` prop ... now has no caller" |
| L5 | 65 | "A dead prop ... `dataBookmark` ... has no caller left" |
| O32 | 164 | "`liveSessions` ... now has no caller in `src`" |
| Q68 | 50 | "`signature` is exported and nothing imports it" |
| Q74 | 66 | "`wordNode` is re-exported ... and has no reader through that module" |
| Q81 | 100 | "`match` and `languageChoices` are now read only by tests" |
| Q96 | 56 | "`export function tooltipGroup()` has no importer besides its own module" |
| Q98 | 38 | "`export function slashCommand(...)`, has no reader outside `record.ts`" |
| S3b | 187 | "no module outside `yaml-edit.ts` imports `Written` from it" |

**Spec rules.** spec.md:76: "nothing is built for a need the plan does not name".

**Smallest change.** Add to spec.md:76: "Every export the step adds or leaves without a caller is grepped; one with no importer outside its own file and its tests is removed or made local." A script could list exports with no importer, a fact (lint does not report it today); it needs Axel's approval.

**R14/Q59 coverage.** Not covered.

### P. A comment past 100 columns, or hand-broken mid-sentence (12 steps)

| Step | Line | Quote |
|---|---|---|
| D35 | 299 | "the head comment is left with a short third line" |
| L3 | 74 | "the head comment is hard-broken mid-sentence" |
| Q52 | 55 | "`git.ts:92` is 138 columns" |
| Q58 | 62 | "Path rewrites left comment lines past the column the file is wrapped at" |
| Q67 | 55 | "Hard-wrapped comment line." |
| Q70 | 38 | "(127 columns) and `:201` (140 columns)" |
| Q77b | 183 | "base.mjs:63 at 109 columns" |
| Q77e | 57 | "`diagrams.mjs:14` is 146 columns" |
| Q84 | 131 | "breaks a comment mid-sentence" |
| Q89 | 47 | "A head comment was left with a broken line." |
| Q96 | 118 | "the head comment breaks mid-sentence ('here. The keys' on its own line)" |
| U1 | 90 | "a doc comment hand-broken mid-sentence into a short line" |

Q84, Q89, Q96 and U1 come after Q59 landed, and all four are mid-sentence short lines, not width.

**Spec rules.** No spec line names comment width or rewrapping. Q59's `comment-width.test.ts` enforces 100 columns.

**Smallest change.** Add a spec.md sentence: "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short."

**R14/Q59 coverage.** Width is covered by Q59 and has not recurred after it. The mid-sentence short line is not covered.

### Q. Tests that depend on timing (4 steps)

| Step | Line | Quote |
|---|---|---|
| D13c | 179 | "It still rests on a 500 ms wall-clock margin, and a deterministic form with no timer exists" |
| Q69 | 43 | "a new fixed `page.waitForTimeout(300)`" |
| Q77d | 58 | "Portfolio negative waits `sleep(150)`." |
| Q36 | 99 | "The report's blind-spot figure is wrong under load." |

**Spec rules.** None.

**Smallest change.** Add a spec.md sentence: "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep or a wall-clock margin; a check that something did not happen advances a fake clock past the deadline."

**R14/Q59 coverage.** Not covered.

### R. Negation-contrast prose in DESIGN.md (3 steps)

| Step | Line | Quote |
|---|---|---|
| E1 | 289 | "Low: negation-contrast." |
| E2 | 145 | "'Two findings are about an apps folder and not an app'" |
| E3 | 147 | "'(read, not parsed)' ... both are the negation-[contrast]" |

**Spec rules.** spec.md:20: "Prose: plain, ASCII, no em dashes, no quips". It does not mention negation-contrast, which the user rules ban.

**Smallest change.** Extend spec.md:20 with "no 'not X but Y' construction; state the thing directly".

**R14/Q59 coverage.** Not covered. No case since E3.

### S. A brief premise found wrong (10 steps)

| Step | Line | Quote |
|---|---|---|
| Q73 | 32 | "Premise 3 of the brief does not reproduce in the tree at 96786a24." |
| Q76 | 36 | "The brief's premise was wrong." |
| Q77d | 43 | "Part 4's premise does not reproduce." |
| Q79a | 54 | "the brief's json() case ... was replaced ... without the stop the brief prescribes" |
| Q79d | 26 | "The brief's premise of seven copies is incomplete" |
| Q80 | 38 | "S1, a premise not reproduced and not reported." |
| Q82 | 51 | "The case 7 reading was not handed back." |
| S3b | 143 | "two premises that the reviewer's grep does not reproduce" |
| X3a | 47 | "cross-root clause: premise wrong" |
| Q102 | 60 | "the brief's premise about where the strip is wired is wrong" |

Q80, Q82 and Q79a were not handed back. Q76 and Q102 were stated in the report.

**Spec rules.** spec.md:71: "anything in the brief or the design that turned out wrong or impossible, said plainly". The rule exists; the miss is that builders work around a wrong premise without stopping.

**Smallest change.** Add to spec.md:71: "A premise of the brief that does not reproduce is quoted with the command that disproves it in the report's first section, before any work that depends on it."

**R14/Q59 coverage.** Not covered.

### T. A new key not exercised empty, duplicated and colliding (5 steps)

| Step | Line | Quote |
|---|---|---|
| D13b | 129 | git reports a type change "as two entries with the same path" |
| Q76 | 48 | "asks for the case where a stale tab is restated to `id: entry.path`" |
| Q67 | 44 | "The spec requires a new key to be exercised empty and colliding." |
| Q77b | 66 | cites the rule against a missing case |
| U1 | 34 | "The only check ... runs over the shipped file only." |

**Spec rules.** spec.md:60: "Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key."

**Smallest change.** Every brief that introduces a key or id names it and lists its three cases as acceptance items, so the builder cannot miss which key the rule applies to.

**R14/Q59 coverage.** Not covered.

### U. A hand-back with a red check (4 steps)

| Step | Line | Quote |
|---|---|---|
| Q82 | 195 | "`files.test.ts` is 928 lines, over the tree's 900-line check line" |
| Q85a2 | 3 | "Not done, first: the step is not green." |
| Q90 | 15 | "red tests/server/content/audit.test.ts" |
| Q99 | 67 | "red on `npm test`, `Test Files 1 failed`" |

**Spec rules.** spec.md:25 ("The full verify list (`checks.sh`) runs once, after your last change") and the line beginning "Run every command the brief lists" (spec.md:65).

**Smallest change.** Every repair brief carries: "After the round's last change, run the full verify list and quote its final lines in the report; a red line in a file you touched is fixed before hand-back."

**R14/Q59 coverage.** Not covered.

### V. Builder scratch or base copies left in a worktree (3 steps)

| Step | Line | Quote |
|---|---|---|
| Q86b | 79 | "`.agents/worktrees/Q86b/.scratch-builder/` (untracked ...) holding backup/graph.ts" |
| Q88 | 25 | "`tail .scratch-builder/first-run.log`" (the folder sits in the worktree) |
| X3d | 142 | "The builder put test copies into `.agents/worktrees/X3d-base/tools/oculus/tests` and left them there" |

**Spec rules.** None names it. spec.md:33 covers only `.scratch/`.

**Smallest change.** Add a spec.md sentence: "Backups, base copies and logs go in your session scratchpad, never in a worktree." The fact a script could check is untracked entries in the worktree's `git status --short` that are not on the brief's path list; the orchestrator already runs that command at landing.

**R14/Q59 coverage.** R14 cause 5 covered only `$TMPDIR` scratch. Not covered.

### W. A test, allow list or code edited only to satisfy a check, or a test that encodes a defect (4 steps)

| Step | Line | Quote |
|---|---|---|
| S2 | 81 | "Exemptions added to pass checks" |
| S3b | 162 | "The next writer added to the write chain meets the same red check and takes the same no-op route." |
| Q83 | 105 | "P1: a test asserts that a drawable JPEG gets no size." |
| X3a | 153 | "the expected values encode the doub[led row]" |

**Spec rules.** spec.md:16 and spec.md:55.

**Smallest change.** Add to spec.md:55: "The report lists every edit to an existing assertion, allow list or predicate with its before and after; code written only so a check passes is a finding."

**R14/Q59 coverage.** R14 cause 7's `negatives.test.ts` covers bare absences only. Partly covered.

### Y. An audit counted as proof (5 steps)

| Step | Line | Quote |
|---|---|---|
| Q78 | 48 | "Under spec.md it is an audit ... but the case title was not changed to say so." |
| Q88b | 112 | "'audits that words every message as VS Code does': it asserts catalog strings equal literals" |
| X3a | 149 | an `it('audits that ...')` case counted as proof |
| U1 | 75 | asserts over source text (`expect(source).toContain(...)`) |
| Q102 | 82 | "Cases 18 to 22 are met; case 22 by an audit." |

**Spec rules.** spec.md:57: "reported as an audit, never as coverage".

**Smallest change.** Add to spec.md:57: "A DONE row proved only by an audit says 'audit' in its proof column."

**R14/Q59 coverage.** R14 cause 9's `audits.test.ts` covers view tests only. Partly covered.

### Z. A literal or engine message reaches the reader (3 steps)

| Step | Line | Quote |
|---|---|---|
| Q80 | 86 | "a JavaScript-engine message reaches the reader" |
| Q83 | 123 | "two reader-visible literals are not catalog text" |
| X3d | 429 | "a literal string anywhere a reader sees it is a defect" (the status letter) |

**Spec rules.** spec.md:45: "A literal string, a raw hex or a literal glyph anywhere a reader sees it is a defect."

**Smallest change.** Add to spec.md:45: "An error from the engine or a library is mapped to a catalog line before it is shown."

**R14/Q59 coverage.** Not covered.

### AA. The size cap met by trimming or compacting instead of splitting (3 steps)

| Step | Line | Quote |
|---|---|---|
| Q79c | 111 | "`fs.ts` is 900 lines ... the step grew it from 896 and trimmed two doc comments" |
| Q82 | 195 | "`files.test.ts` is 928 lines, over the tree's 900-line check line" |
| Q89 | 271 | "`togglePanePin` is compacted" with `Terminal.svelte` at 540 |

**Spec rules.** spec.md:42 ("A file approaching it is split by concern") and spec.md:76.

**Smallest change.** Add to spec.md:42: "A file within 20 lines of its cap is split; comments are not shortened and code is not compacted to stay under it."

**R14/Q59 coverage.** R14 cause 6's `size.test.ts` catches going over the cap, not trimming to stay under it. Partly covered.

### AB. The report narrates wrong turns (3 steps)

| Step | Line | Quote |
|---|---|---|
| Q94 | 35 | "The report narrates the lint fix as a wrong turn" |
| Q77e | 138 | "the sentence narrates an in-round wro[ng turn]" |
| U2 | 298 | "Line 109 restates the first pass's wrong reasons" |

**Spec rules.** spec.md:14: "No narration of wrong turns taken and backed out."

**Smallest change.** The round-brief sentence under C ("Rewrite the report whole for the state after this round") also ends this cause, since appended sections are where the narration sits.

**R14/Q59 coverage.** Not covered.

### AC. File-scope mutable or shared objects (3 steps)

| Step | Line | Quote |
|---|---|---|
| Q79b | 132 | "adds exported module-level mutable state: eight `export let` bindings" (test fixture) |
| Q85a2 | 186 | "`const NO_CONTENT = { prompt: '', blocks: [], text: '' };` ... a shared ob[ject]" |
| X3d | 164 | "`press-on-render.ts:13` adds a file-scope mutable" (test helper) |

**Spec rules.** spec.md:75: "no module-level mutable state shared across module graphs". Two of the three cases are in tests, which the rule does not name.

**Smallest change.** Extend spec.md:75: "This holds in test fixtures and helpers too, and a shared fallback object handed to callers is frozen or built per call."

**R14/Q59 coverage.** Not covered.

### M. New cases in slow-tagged files that the verify list never runs (4 steps)

| Step | Line | Quote |
|---|---|---|
| D24 | 108 | new cases in `writes.test.ts:10` and three other files tagged `// @module-tag slow` |
| Q107 | 378 | "It is tested only in a file tagged slow, which `npm test` and `test:checks` leave out" |
| Q110 | 305 | "`writes.test.ts:10`, `// @module-tag slow` ... The new case is [skipped]" |
| Q88b | 111 | "a step never runs `npm run test:slow`" (the builder ran it) |

**Spec rules.** spec.md:53: "A file tagged slow ... is left out of both, and a step never runs `npm run test:slow`."

**Smallest change.** Add to spec.md:53: "A case the step adds goes in a file the verify list runs; if it can only live in a slow file, run that file alone with `npx vitest run <file>`, quote the run, and name it in the report."

**R14/Q59 coverage.** Not covered.

## 4. Causes under the threshold

- **A fixable defect written up as a limitation.** Two steps confirmed by grep: Q77a-refuter.md:271 ("The report lists this as a limitation. The fix is ...") and Q78-refuter.md:66 ("A risk named and left unfixed, and not stated prominently"). spec.md:13 and spec.md:17 already cover it.

## 5. The R14/Q59 closures in one view

| Cause | Closure | Status |
|---|---|---|
| A | R14 head-comment print | not in the verify list; recurs |
| B | R14 revert-check | retired by Q93; recurs |
| E | `cited-lines.mjs` | exists, not wired; recurs |
| G | R14 config-diff print | not in the verify list; recurs |
| J | Q59 `history.test.ts` | partial |
| K | `duplication.test.ts` | partial |
| P | Q59 `comment-width.test.ts` | covers width only |
| W | `negatives.test.ts` | partial |
| Y | `audits.test.ts` | partial |
| AA | `size.test.ts` | partial |
| all others | none | not covered |

## 6. What follows from this

Seven causes recur across the most steps: A (67 steps), B (53), D (23), F (22), E (18), H (17) and K (13). Three of the changes above are wording only. The decisions that are Axel's:
- **Wiring `utils/cited-lines.mjs` into the verify list (cause E).** It already exists.
- **New scripts.** Each needs his approval:
  - the changed files minus the brief's path list (H)
  - identifiers declared in two or more files (K)
  - exports with no importer (O)
  - the head-comment and doc-line print (A)
