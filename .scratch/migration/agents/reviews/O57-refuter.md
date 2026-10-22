# Step O57 refuter report (on .agents/worktrees/migration-O57, base 8c53e525)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

All commands ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O57`, in the foreground, with `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

```
uptime (before)        -> 18:37  up 9 days, 5 hrs, 1 user, load averages: 7.54 9.89 10.40
npm run diagrams && npm run test:quick   (18:37:10 to 18:38:39)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (1.9 s)
ok      svelte-check (8.9 s): 1792687051467 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (76.9 s): Duration  65.99s (transform 71.70s, setup 0ms, import 129.58s, tests 118.38s, environment 1.39s)
test:quick: 79.5 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
uptime (after)         -> 18:38  up 9 days,  5:02, 1 user, load averages: 9.88 9.97 10.37
shasum docs/diagrams/* before and after `npm run diagrams` -> identical ("diagrams-unchanged"); git status --short: 23 lines, as before
selection: 195 lines of the form "<test file>: <reason>" (one is "tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks"); quick.mjs:303-307 prints "over the time limit" as information, exit code is set by red commands only

Verify 1: npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/routes/sessions/compose.test.ts tests/routes/sessions/terminal.test.ts tests/routes/sessions/terminal-edit.test.ts tests/routes/sessions/latex-approvals.test.ts tests/server/machine/runs/commands/run.test.ts tests/server/machine/runs/schedules tests/data/sources/config/settings.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/templates.test.ts --reporter=dot
 Test Files  16 passed (16)
      Tests  214 passed | 2 skipped (216)

Verify 3: git status --short paths (svg left out) | xargs env LC_ALL=C perl -ne '<the spec.md gate>'  -> prints nothing, ascii-exit 0
Verify 4: sh utils/unused-exports.sh > <scratch>/unused-after.txt; diff ../migration-O57-base/unused-exports.txt <scratch>/unused-after.txt -> nothing, unused-diff-exit 0
Verify 7: wc -l -> hub-names.ts 435, config.ts 91, files.ts 197, problems.ts 69, chat.ts 140, context.ts 103, settings.test.ts 852, terminal-actions.test.ts 812, terminal-fixture.ts 342, config-folder.test.ts 808 (all at or under 880)

Report's quoted commands:
npx vitest run tests/routes/sessions/terminal-actions.test.ts -t "chat action" --reporter=verbose
 -> G35 case 52ms; 12 rows of 'writes one section per hub of the workspace into the index' 180ms to 655ms
      Tests  13 passed | 20 skipped (33)          (report: 13 passed | 20 skipped (33), reproduced)
npx vitest run tests/data/sources/config/settings.test.ts -t chatContext --reporter=verbose
      Tests  12 passed | 74 skipped (86)          (report: same, reproduced)
grep -c "^    { key:" src/lib/data/helpers/hub-names.ts -> 25   (reproduced)
grep -c "^[a-z_.]*: *#" docs/data-map.md -> 25                    (reproduced)
python3 yaml.safe_load of config/text/server.yml, config/defaults/sources.yml, config/options/sources.yml -> parses
grep -c "This chat runs in the hub whose folder is\|whose section lists it\|unless it is absolute" ../migration-O57-base/config/text/server.yml -> 0 (reproduced)
grep -rn "chat_context\|chatContext" ../migration-O57-base/{src,config,docs,tests} --exclude=local.yml | wc -l -> 0 (reproduced)
history-word grep over every added line of git diff 8c53e525 -> two hits, server.yml:57 "before reading its README.md" (unchanged instruction text) and files.ts head comment "before the config channel's first message" (existing phrase); same as the report
diff -rq migration-O57-base/{src,tests,utils,config,docs} migration-O57/... -x local.yml -> the 22 paths of git status, no other; base wc -l hub-names 434, files.ts 135, context.ts 44, terminal-actions 578, settings.test 778, terminal-fixture 276, data-map 209 (the report's table reproduced)
HUB_LIST keys against the data-map block, in order: diff of the two lists -> "same-keys-same-order" (25 keys)
Not rerun: the report's first run on the unchanged tree (the rule asks no reviewer rerun on the unchanged tree); the report's verify-list time 125.7 s (my one run: 79.5 s, see Declined).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `HUB_LIST` row at hub-names.ts:333 after `collections`, doc names "which of its records a chat's index holds"; defaults key and comment at config/defaults/sources.yml:48-49 (head comment "from scan to apps_dir" still true); option entry at config/options/sources.yml:59-64 with `heading: sources`, `section: Collections`, `control: multi`, `from: collections` and the help line; `EXPECTED` row at config-folder.test.ts:198; template lines at docs/templates.md:86-87; G83 and G12 tests pass (verify 1).
- 2: holds in substance, with one departure from the named mechanism, Spec S1. Reads by kind through `valueProblem(entry, value, { sourced: null })` (files.ts:140-151), wrong kind pushes a `value` problem naming `chat_context` and reads the default, keeps listed words in written order once (`new Set`, files.ts:179-180), never throws over any `collections:` value (table row 'a list that is no list'), in `PROBLEM_READERS` (problems.ts:47), exported at config.ts:75, named in the files.ts head comment.
- 3: holds. `portfolioContext` over `allHubs` with the primary moved first (context.ts:54-70), registries from the primary's folder only with a primary (context.ts:88-92), a section per hub with heading, manifests and the `chatContext` keys resolved through `collectionFiles(target.config.merged.collections)` first entry (context.ts:40-48), closing section with no primary (context.ts:94-101), `COLLECTION_ORDER` gone. One piece of dead code, Standards St1.
- 4: holds. chat.ts:123 writes `portfolioContext(config, open, options.hubSettings)` for both chats; `primaryConfig` import removed; `hubSettings` doc rewritten (chat.ts:41-44); `home`, `cwd`, the `no-primary` refusal and the instruction's `{0}` unchanged (chat.ts:100-107, 115 untouched by the diff).
- 5: holds. Both sentences reworded as the item says; the rest of `chat_instruction` is word for word (git diff of config/text/server.yml read whole).
- 6: holds. HELP.md:103 says what the index holds. data-map.md block lists all 25 keys of `HUB_LIST` in its order with a comment each and "these 25 keys"; the item asks for "every key of `hubKeys()` with a short comment each", so the rows and count are asked for, and the reorder is the builder's judgment call 7 (HUB_LIST order), inside the item. Each new comment checked against its key: `bookmarks`, `schedules`, `apps_dir` match config/defaults/sources.yml "Where the reader's own bookmarks, the schedules and the machine's apps live"; `counts` matches config/defaults/layout.yml:303-304; `statuses`, `career_host_status`, `career_score_dims`, `career_score_tones`, `leads_fit` match the `HUB_LIST` doc's words.
- 7: holds, with Standards St2 on the shape of the G13 test. G120 table case with 12 rows (C1 to C3, C7, C11 to C17, C19) under the exact title; G35 case keeps its title with its index and instruction assertions changed; `chatContext` describe in settings.test.ts; `EXPECTED` row.

Cases of the brief's "Cases":

- C1: met, row 1 of `INDEX_ROWS` (`threeHubLines`), exact non-empty lines, `hub`'s `people.yml` and `other`'s `venues.yml` planted and absent.
- C2: met, row 3, the primary's own settings file sets `[events]` (fixture `merged = settingsOf(at(primary)).config`), `other` sets `[funding]`.
- C3: met, row 4.
- C4: met, settings table row '[funding, nosuch]'.
- C5: met, the case 'reads a hub whose collections list leaves out tasks, and finds a number written there', first half, on a `loadConfig` map, plus `settingProblems` holds no `chat_context`.
- C6: met, table row '3' and the same case's second half with `settingProblems(wrongMap)` holding `chat_context`.
- C7: met, row 2, project chat of beta gives `threeHubLines`, the venue catalogue `planted: hub/...`.
- C8: met, config-folder.test.ts passes (verify 1).
- C9: met, templates.test.ts passes (verify 1); templates.test.ts:61-64 compares `templateKeys(...)` with `hubKeys()` by `keyDifference`.
- C10: met, G35 case passes with the three instruction assertions and no `{0}`, `{1}`, `{2}` left; their absence on the unchanged catalog is shown by the grep count 0 on the base copy, reproduced.
- C11: met, row 5, `### <abs tool>` inside the primary's section.
- C12: met, row 6, `# HUB third: ...` and nothing under it.
- C13: met, row 7, folders `other` then `hub`, `hub`'s section first and once.
- C14: met, table row '[funding, funding]' and row 8.
- C15: met, table row '[]' and row 9.
- C16: met, row 10 gives `other`'s section from oculus's defaults (both default files); the build's report of the finding is met by reading `readOtherHub` (src/lib/data/index.ts:601-622, `...findings` of `loadConfig`), since the row's own finding assertion reads the fixture's parse, Proof P1.
- C17: met, row 11, no registries, every hub's section, `# WORKSPACE FOLDERS (no hub)` with `### <abs tool>`.
- C18: met by reading, engine.ts:83-90 (`configItems(source, config.merged)`, the primary's merged map) and engine.ts:205-214 (`hub-config` with `rule: { hub: [HUB_FILE] }`).
- C19: met, row 12, the venue catalogue at the head and again as `## .oculus/data/research/venues.yml` in the primary's section.

## 1. Spec

- src/lib/data/sources/config/settings/files.ts:179: "const listed = sourcedItems(entry, config) ?? [];"; what is wrong: item 2 names the shape "read with `collectionFiles`, so the feeds count", and the reader uses the entry's `from: collections` source (`keysOfRows(config.collections)`, catalog/options.ts:469-473) instead. The brief's premise does not hold on the tree: `collectionFiles` lives in src/lib/data/sources/collections.ts, whose line 2 says "Server side only: it reads the filesystem and no client module may import it" and which imports `./yaml-file.ts` (`import { readFileSync } from 'node:fs'`, yaml-file.ts:10), while files.ts is imported by the page (src/lib/state/client/selectors.svelte.ts:39 `import { paintLimit, programApps } from '../../data/sources/config/settings/files.ts'`). The new imports of files.ts (catalog/options.ts, value-rule.ts, guards.ts) are already client-imported (state/system/config/rows.ts:41 and others). On the question whether the difference can give a wrong index: no. `rowsShape` drops a bad row and keeps the others (shapes.ts:166-172), so the keys of `collectionFiles(list)` are a subset of `keysOfRows(list)`; the only extra word `chatContext` can keep is a key whose rows all lack a string `file`, and context.ts:45-47 looks each kept word up in `collectionFiles(target.config.merged.collections)` and adds nothing when there is no entry, which is what the brief's form gives. Order, first entry per key and de-duplication are the same. The other caller, `settingProblems`, ignores the answer and reads only the problems. Failure scenario: none for the index; a `collections:` row `{ key: x, file: 3 }` with `chat_context: [x]` makes `chatContext` answer `[x]` where the brief's reader would answer `[]`, and the index holds no file for `x` in both. The builder reported the departure (report line 3, "Judgment calls" 1, "Wrong or impossible in the brief"). Proposed disposition: the brief's premise recorded as wrong, the departure accepted, no code change. Verdict: item 2 holds.

## 2. Proof

- tests/routes/sessions/terminal-actions.test.ts:805-809: "const { findings } = world.options.hubSettings(hub); expect(findings.map((one) => one.file)).toContain(join(hub, HUB_FILE));"; what is wrong: the assertion that stands for C16's "the settings finding the build already reports" reads the fixture's own `loadConfig` parse (`settingsOf`, terminal-fixture.ts, `chatWorld`), not the build or anything the step changes; it would still pass with the build's reporting of that finding taken out of `readOtherHub`. It is a check of `loadConfig`, which G13's tests cover. Failure scenario: a later change drops `...findings` from `readOtherHub` (index.ts:610); this row stays green while the Findings view loses the unreadable-settings finding of a second hub. C16 is met by the row's index assertion plus the reading named under the verdict. Proposed fix at landing: drop the `unread` field and lines 805-809, or leave them with C16's finding half recorded as checked by reading. Verdict: none (C16 met by reading).

## 3. Standards

- src/lib/server/machine/pty/start/context.ts:64-69: "const seen = new Set<string>(); return ordered.filter((one) => { if (seen.has(one.key)) return false; seen.add(one.key); return true; });"; what is wrong: spec.md, "The four headings" of the skill and spec.md "The principles every package is judged on" (YAGNI; code larger than its job). `allHubs` maps `open.hubs` once each (roots.ts:76-89), the two filters at context.ts:60-63 are disjoint, and the workspace reader refuses a repeated name (src/lib/server/files/workspace/folders.ts, `findings.workspace.repeated_name`), so no duplicate can reach this filter; the builder says so in judgment call 6. Failure scenario: a maintainer reads the set as guarding a real duplicate path and looks for the case that produces it. Proposed fix at landing: `return ordered;` in place of lines 64-69, and the doc's "each once" kept since it stays true. Verdict: none.
- tests/data/sources/config/settings.test.ts:808 and :832: "it.each([...])('answers for %s the keys of the collections list it names, or its default and a problem', ...)" and "it('reads a hub whose collections list leaves out tasks, and finds a number written there', ...)"; what is wrong: spec.md "What every package obeys", the test rule: "An entry keeps one test per unit it covers ... written as a table where a unit has several outcomes, with one row per input that gives a different outcome", and G13's Test line says "one case per setting reader"; `chatContext` has two cases. The brief's item 7 asks for "the row of `chatContext` (C4 to C6, C14, C15)". Failure scenario: a later step that maps G13's tests reader by reader finds two cases for `chatContext`, one with a title G13 does not name, and either keeps an extra test or deletes the one that holds C5 (the only check on a real `loadConfig` map). Proposed fix: fold the `loadConfig` case into the table as rows that plant a hub (or name the second case in G13's Test line under "Doc text"); this is a test restructure, which the orchestrator judges small or not. Verdict: none (item 7 holds; the cases are covered).

## 4. Behaviour

- src/lib/server/machine/pty/start/context.ts:88-92 with config/text/server.yml:57 and context.ts:5-6: "addFile(parts, primary.hub, registries.venues, '#', ' (venue catalogue)');" and the instruction "This chat runs in the hub whose folder is `{0}`. ... every folder in a section is relative to that hub's folder unless it is absolute."; what is wrong: the venue catalogue and pillars registry open the index outside any section, headed by a path relative to the primary's folder, and neither the heading nor the instruction says which folder that path is relative to; the only hub folder the instruction names outside the sections is `{0}`, which for a project chat of a project in another hub is that other hub's folder (chat.ts:104-106). The context.ts head comment ("every other folder and file by its path relative to the hub of its section") also does not cover the head files. Both follow the brief's dictated shapes (item 3 "each under its `# <path>` heading", item 5's wording), so this is a gap of the brief, and the report states the before and after of everything else. Failure scenario: a project chat of beta in C1's workspace (where `other` holds its own `.oculus/data/research/venues.yml`) is asked to cite or reopen the venue catalogue; it resolves `.oculus/data/research/venues.yml` against `{0}` = `other`'s folder and reads `other`'s file, not the primary's catalogue the index holds. Surface answers are unaffected, since the content is inline. Proposed fix: the head headings name the primary's absolute folder (for example `# <primary folder>/.oculus/data/research/venues.yml (venue catalogue)`), or one clause of the instruction says the files before the first section are the primary hub's; either changes dictated text, so the orchestrator decides whether it is a fix at landing. Verdict: none.

## Declined to judge

- The test:quick time. My run took 79.5 s against the 45 s limit at load averages 7.54 (start, 1 min) and 9.88 (end, 1 min), every command passed; the builder's 125.7 s at load 13.54 is not reproduced as a number, and no decision rests on it: quick.mjs:303-307 makes the limit informational and the exit code depends on red commands only. The selection held 195 test files, because the step changes widely imported modules (hub-names.ts, config.ts, files.ts) and test:quick picks every test within two imports; whether the 45 s limit can hold for a step that touches such modules is a property of the tool, not of this diff.
- The G120 rows took 180 ms to 655 ms each under that load; spec.md asks "well under a second". Whether 655 ms under a load of about 10 meets that is a judgment of the machine's load, so I report the figures only.
- The tree checks under tests/checks (boundaries, size, folder count) were not run: the brief's verify list does not name them and test:quick does not select them. The boundary point the builder raised was settled by reading the imports (Spec S1).
- The Settings view row of `chat_context` (its six picked words, its choices the hub's collection keys) needs the look on TEST; no page was run.
- The first run on the unchanged tree was not repeated, as the skill's Proof heading says; its quoted outputs are consistent with the base code read through `git show 8c53e525`-equivalent base copy (for example C7's venue catalogue from `other`'s folder, from base chat.ts:104-125).
- Whether the index growing with every hub's projects and files needs a cap is ruling 212's matter (the user's), not this review's.

Reviewer usage: a46362af9cc54a265, claude-opus-5-5, 237825 tokens, 55 tool uses, 11 min 55 s.

## Repair round 1, refuted

### Verification (rerun by the reviewer)

All commands ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O57`, in the foreground, with `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

```
uptime (before) -> 18:58  up 9 days,  5:22, 1 user, load averages: 5.50 6.66 8.16
npm run diagrams && npm run test:quick   -> exit 0
test:quick: 24 changed file(s), from git since HEAD
test:quick: 201 test file(s), 7 essential
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      ASCII gate (1.5 s)
ok      svelte-kit sync (3.6 s)
ok      eslint (2.5 s)
ok      svelte-check (13.6 s): 1792688361667 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (79.5 s): Duration  63.09s (transform 60.74s, setup 0ms, import 125.90s, tests 112.57s, environment 2.59s)
test:quick: 83.4 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
uptime (after)  -> 19:00  up 9 days,  5:23, 1 user, load averages: 10.97 8.52 8.73
git status --short | wc -l -> 24 (22 modified, plus the untracked .scratch/migration/agents/briefs/O57-round1.md and .scratch/migration/agents/reviews/O57-report.md), the same after `npm run diagrams`

Verify 1: npx vitest run tests/routes/sessions/terminal-actions.test.ts tests/routes/sessions/compose.test.ts tests/routes/sessions/terminal.test.ts tests/routes/sessions/terminal-edit.test.ts tests/routes/sessions/latex-approvals.test.ts tests/server/machine/runs/commands/run.test.ts tests/server/machine/runs/schedules tests/data/sources/config/settings.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/templates.test.ts --reporter=dot
 Test Files  16 passed (16)
      Tests  215 passed | 2 skipped (217)

Verify 3: git status --short paths (svg left out) | xargs env LC_ALL=C perl -ne '<the spec.md gate>' -> prints nothing, ascii-exit 0
Verify 4: sh utils/unused-exports.sh > <scratch>/unused-after.txt; diff ../migration-O57-base/unused-exports.txt <scratch>/unused-after.txt -> nothing, unused-diff-exit 0
Verify 7: wc -l -> hub-names.ts 435, config.ts 91, files.ts 197, problems.ts 69, chat.ts 140, context.ts 101, settings.test.ts 863, terminal-actions.test.ts 810, terminal-fixture.ts 342, config-folder.test.ts 808 (all at or under 880)

Report's quoted commands, rerun:
npx vitest run tests/routes/sessions/terminal-actions.test.ts -t "chat action" --reporter=verbose
 -> G35 case 74ms; 12 rows of 'writes one section per hub of the workspace into the index' 182ms to 841ms
      Tests  13 passed | 20 skipped (33)         (report: same counts, rows 194 ms to 745 ms)
npx vitest run tests/data/sources/config/settings.test.ts -t chatContext --reporter=verbose
 -> 13 rows of 'answers for %s the keys of the collections list it names, or its default and a problem', the last two 'a hub whose list leaves out tasks' 196ms and 'a hub whose list leaves out tasks, writing 3' 188ms
      Tests  13 passed | 74 skipped (87)         (report: same)
grep -n "HUB_FILE\|unread" tests/routes/sessions/terminal-actions.test.ts -> nothing, grep-exit 1 (report: prints nothing, reproduced)
sed -n 50,70p src/lib/server/machine/pty/start/context.ts -> orderedHubs returns the two filters of allHubs, no `seen` set (reproduced)
sed -n 598,625p src/lib/data/index.ts -> readOtherHub returns `findings: [...findings, ...sourcesFindings(...)]` with `findings` from `loaded` (the report's reading reproduced)
diff -rq -x local.yml migration-O57-base/{src,tests,utils,config,docs} migration-O57/... | wc -l -> 22 (report: "still lists the same 22 files", reproduced)
Round delta: diff -u of each path of ../migration-O57-round-1/files.txt against the worktree -> changed: context.ts, settings.test.ts, terminal-actions.test.ts; no path changed outside files.txt except the two untracked .scratch files (the round brief, identical to main's copy by `diff`, and the report)
Not rerun: the round's "before" runs on the round-0 tree (the B1 rows failing 3 of 13, the 12-test chatContext run); the rule asks no reviewer rerun on an earlier tree, and the snapshot copies agree with the quoted round-0 lines.
```

### Verdicts

Items of the brief's "What to build", over the whole diff since 8c53e525:

- 1: holds. `HUB_LIST` row `chat_context` after `collections` (hub-names.ts) with its doc; defaults key and comment (config/defaults/sources.yml:48-49); option entry with `heading: sources`, `section: Collections`, `control: multi`, `from: collections` (config/options/sources.yml:59-64); `EXPECTED` row (config-folder.test.ts:198); template lines (docs/templates.md:86-87); config-folder and templates tests pass (verify 1).
- 2: holds, with the departure of round 0's Spec S1 kept by the round brief's ruling 1 (the premise that files.ts may import `collectionFiles` is wrong: collections.ts is server-only). Diff of files.ts unchanged this round.
- 3: holds. `portfolioContext` over `orderedHubs` (allHubs, primary first, each once since `allHubs` maps `open.hubs` once each, roots.ts:75-87); the primary's venue catalogue and pillars registry at the head, now headed by their absolute path under ruling Z972 (context.ts:86-89); a section per hub with heading, manifests and the `chatContext` keys resolved through the hub's own `collectionFiles` first entry (context.ts:40-51); closing section with no primary (context.ts:91-98).
- 4: holds. chat.ts:123 writes `portfolioContext(config, open, options.hubSettings)` for both chats; unchanged this round.
- 5: holds. Both sentences of `chat_instruction` reworded, the rest word for word; with the head files now absolute, "every folder in a section is relative to that hub's folder unless it is absolute" leaves no relative path outside a section.
- 6: holds. HELP.md:103 and the data-map block of 25 keys; unchanged this round.
- 7: holds. G120 table case with 12 rows under the exact title (terminal-actions.test.ts:787); G35 case with its title; one `it.each` table for `chatContext` in settings.test.ts (G13's "one case per setting reader" now met); `EXPECTED` row.

Cases of the brief's "Cases":

- C1: met, row 1 (`threeHubLines`), now also the absolute head lines of the venue catalogue and the pillars registry.
- C2: met, row 3.
- C3: met, row 4.
- C4: met, settings row '[funding, nosuch]'.
- C5: met, settings row 'a hub whose list leaves out tasks', a `loadConfig` map, the five keys, no problem, flag `false` (`settingProblems` holds no `chat_context`).
- C6: met, settings row '3' (synthetic) and row 'a hub whose list leaves out tasks, writing 3' (`loadConfig` map), each with `chat_context: words` and flag `true`.
- C7: met, row 2, project chat of beta gives `threeHubLines`, the head `# <W>/hub/.oculus/data/research/venues.yml (venue catalogue)` with the primary's folder.
- C8: met, config-folder.test.ts passes (verify 1).
- C9: met, templates.test.ts passes (verify 1).
- C10: met, G35 case passes.
- C11: met, row 5.
- C12: met, row 6.
- C13: met, row 7.
- C14: met, settings row '[funding, funding]' and row 8.
- C15: met, settings row '[]' and row 9.
- C16: met, row 10 for the index; the settings finding the build reports is met by reading `readOtherHub` (src/lib/data/index.ts:601-622, `...findings` of `loaded`), as the round brief rules.
- C17: met, row 11.
- C18: met by reading (round 0's reading of catalog/schemas/engine.ts; no file of it changed this round).
- C19: met, row 12, the absolute venue heading at the head and `## .oculus/data/research/venues.yml` in the primary's section.

Items of the round brief:

- 1 (S1, no change): holds. files.ts is not in the round delta.
- 2 (P1): holds. The `unread` field, its value on the C16 row and the block are gone (grep prints nothing), the now-unused `HUB_FILE` import with them; the row keeps its index assertion; the report states the reading of `readOtherHub`. The removed assertion read the fixture's own parse, so no guard of the build's behaviour was lost by its removal.
- 3 (St1): holds. `orderedHubs` returns the two filters directly (context.ts:57-67); the doc keeps "each once".
- 4 (St2): holds. One `it.each` for `chatContext` with 13 rows, each giving the map, the value, the problems and the `settingProblems` flag; both inputs of the removed case are rows on `loadConfig` maps, its `not.toContain` and `toContain` now the flag column. One finding on two comment widths, Standards 1 below, does not change the verdict.
- 5 (B1): holds. Head files headed by `join(primary.hub, registries.<name>)`; section files keep relative headings; head comment of context.ts says so (lines 1-8); rows C1, C7 and C19 expect the absolute heading, and the planted pillars registry gives the pillars heading a row. The `addFile` signature change (file and heading line in place of hub, path, level, suffix) is what the absolute heading needs and goes no further.

### Findings

#### 1. Spec

none

#### 2. Proof

none

#### 3. Standards

- tests/data/sources/config/settings.test.ts:791 and tests/routes/sessions/terminal-actions.test.ts:605, added this round: "    /** A map over a catalog whose chat_context default is DEFAULT and LIST, with `held` laid over. */" (102 columns) and "    /** The lines of the head's venue catalogue of the primary `hub`, headed by its absolute path. */" (101 columns); what is wrong: spec.md, "What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns"; prettier (printWidth 100) does not wrap comments, so the verify list passes over them. Failure scenario: none in behaviour; the two comments run past the width every other comment of the step keeps, and a later comment-width pass flags lines this step wrote. The tree holds 39 comment lines over 100 columns in src and tests already (`find src tests -name '*.ts' | xargs awk 'length > 100 && /^ *(\/\/|\*|\/\*\*)/'`), so the rule is not enforced by a check. Proposed fix at landing: break each into a `/** ... */` block of lines at or under 100 columns. Verdict: none (round item 4 and item 5 hold).

#### 4. Behaviour

none. The one user-visible change of the round, the head files' headings from `# .oculus/data/research/venues.yml (venue catalogue)` and `# .oculus/data/pillars/pillars.yml` to the same paths joined to the primary's absolute folder, is stated by the report with before (the C7 diff of the round-0 run) and after (the head of C1's index quoted).

### Declined to judge

- The test:quick time: 83.4 s against the 45 s limit at load averages 5.50 to 10.97, every command passed; the exit code depends on red commands only, and no decision rests on the figure.
- The G120 rows took 182 ms to 841 ms each in my verbose run under a load near 10; spec.md asks "well under a second"; I report the figures only.
- The round's "before" runs on the round-0 tree (3 failed of 13 for B1; 12 tests for chatContext) were not repeated; the snapshot under migration-O57-round-1 holds the round-0 code they quote.
- Earlier sections of the builder's report keep round-0 figures the round changed (the Files table's context.ts 103, settings.test.ts 852 and terminal-actions.test.ts 812; "Doc text" naming terminal-actions.test.ts:784, now :787; the quoted C1 index's relative head lines); the "Repair round 1" section gives the current values and no decision rests on the old ones (G120 names its test by title).
- The Settings view row of `chat_context` needs the look on TEST; no page was run.
- The tree checks under tests/checks other than the two the brief names (size, boundaries, folder count) were not run; the brief's verify list does not name them.

Reviewer usage: a2c70600ff89b59d5, claude-opus-5-5, 150992 tokens, 25 tool uses, 5 min 23 s.

### Closed

- Standards 1: fixed at landing, inside round items 4 and 5's paths: the doc comments at `tests/data/sources/config/settings.test.ts:791` and `tests/routes/sessions/terminal-actions.test.ts:605` are rewrapped into blocks of lines at or under 100 columns.
