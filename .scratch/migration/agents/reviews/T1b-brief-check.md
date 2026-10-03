# Step T1b brief check (on main at 1e14d279)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/T1b.md`. Every command ran from `tools/oculus` on main at 1e14d2799 unless it names another folder. On main, `git status --short .` shows only ledger files changed (`plan.md`, `orchestrator-state.md`, `queue.md`, `T1c-report.md`, and the untracked `T1b.md`), so `src/` and `tests/` are main's head.

## 1. Names

- Files under `tests/state/` (deleted, renamed): `grep -rn "tests/state" src tests --include='*.ts' --include='*.svelte' | grep -v "^tests/state/"` prints 48 hits: checks 9, data 2, routes 2, server 4, shell 9, views 16, src 6. This matches the brief. The 9 `tests/checks` hits are string literals in `tests/checks/utils/outside-paths.test.ts:255-319`, fixture text held in strings. They are not comments, and no deletion makes them false. The six `src` comments are handed to "Doc text" (item 8). Of those, `src/lib/state/life/memories.ts:11` ("memories-message.test.ts pins the two exports equal") names a test that cannot fail: `src/lib/server/content/memories.ts:25` imports `MAX_UPLOAD_BYTES` from `data/file-ops.ts` and `:50` re-exports it, and `tests/state/life/memories-message.test.ts:77` compares the two. The comment becomes false once item 1 deletes that test, and item 8 covers it.
- Outside `src` and `tests`: a grep of `tests/state` over the whole `tools/oculus` tree (excluding `node_modules`, `.scratch`, build output and `local.yml`) finds no hit in `DESIGN.md`, `HELP.md`, `README.md`, `docs/`, `config/`, `utils/` or `package.json`. `package.json:12-14` names only `--tagsFilter`.
- `tests/checks/tree/allow-duplication.txt`: `grep -n "tests/state" tests/checks/tree/allow-duplication.txt` gives lines 30 and 65-110, as the brief says. Pairing those entries with the other sweeps' folders:
  - Line 30 pairs `tests/data/snapshot/normalise.test.ts` (T1e).
  - 26 lines pair a `tests/state` file with a `tests/views` file (T1d): 70, 71, 72, 73, 74, 76, 77, 79, 85, 86, 87, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 103 and 104. The command that shows it is `grep -n "tests/state" ... | awk '{print $1, $2}' | grep -v "tests/state.*tests/state"`.
  - `duplication.test.ts:597-606` fails on an entry whose clone is no longer shared. A clone can stop being shared because either side changes, so T1d's or T1e's sweep can make the same entry stale.
- The slow-tier sentences (`vite.config.ts:31-35`, `README.md:15`, `HELP.md`, `agents/spec.md:56`): handed to "Doc text". The HELP line numbers are wrong (Premises 1).
- Helpers in other sweeps' folders that `tests/state` imports: `grep -rhn "from '\(\.\./\)*\(server\|ui\|shell\|views\|...\)/" tests/state` lists `server/machine/line-counts.ts`, `server/machine/pty/tmux-fixture.ts`, `shell/fixtures/Alpha.svelte`, `shell/rail/rail-fixture.ts`, `shell/rail/shipped-rail.ts`, `ui/controls/editor/monaco-diff.ts` (2 importers), `views/shared/real-text.ts` (2) and `views/system/workbench/workbench-fixture.ts`. Deleting a test can leave one of these with no importer. The brief only says what happens to an unused helper of `tests/fixtures/`.

Findings:
1. The 27 allow-list entries at lines 30, 70-74, 76, 77, 79, 85-87, 89-100, 103 and 104 each name a file of T1d or T1e as well as a `tests/state` file. The step line says "its paths disjoint from theirs", and the brief claims lines 30 and 65-110 as its own without saying which sweep removes an entry that both could make stale, or that this file is shared with T1d and T1e.
2. The eight helpers under `tests/server`, `tests/shell`, `tests/ui` and `tests/views` imported by `tests/state` are not covered: the brief says nothing about one the sweep leaves unused. The `tests/fixtures` sentence of "Paths this step writes" covers only `tests/fixtures`.

## 2. The step line

- "the test sweep of `tests/state/` (205 files, 66,497 lines)": premise 2 and the intro of "What to build".
- "deletes every test there that breaks `agents/spec.md`'s test rule (`:57`, its three sentences of Z365 included)": item 1, and item 3 for "well under a second".
- "read file by file, slow-tagged files included": the intro of "What to build" and "What it must do".
- "may cut harder than one test per behaviour (Z363): a variation of an outcome another case already gives is cut": item 1, fifth bullet.
- "cases of one outcome become rows of one table": item 2.
- "a test that passes with its behaviour taken out is deleted": item 1, fourth bullet.
- "where a behaviour is tested both in its own module and at a higher level (a route, a view), the step owning the higher folder deletes the higher test unless it is the one case of the wiring": item 1, sixth bullet, but only for `tests/data`. No item covers the `tests/state` cases that drive server modules, whose own tests are in `tests/server`:
  - `tests/state/sources/fs-channel.test.ts:8-9` imports `Hub` and `registerFilesChannel` from `src/lib/server`.
  - `sources/repositories/capabilities/store-wire.test.ts:13` imports `ACTIONS`, `OPERATIONS` and `gitBodyShape` from `server/git/git-routes.ts`.
  - `sessions/terminal/commands-pane.test.ts:18-24` drives `captureTask` and `startTerminal` through a real tmux.
  - The command that lists them is `grep -rln "src/lib/server\|lib/server/" tests/state`.
- "a test that cannot run well under a second takes the slow tag": item 3 and Decision 1.
- "Its report lists each removal with the behaviour it guarded or why it guarded none, and the line count of its folders before and after": item 7.
- "Runs beside the other sweeps, its paths disjoint from theirs": "Paths this step writes". The `allow-duplication.txt` lines are not disjoint (Names 1).
- "T1a follows all four": no work in this step.

Findings:
1. The lowest-level part of the line has no item for a `tests/state` test that exercises server code (`fs-channel.test.ts`, `store-wire.test.ts`, `commands-pane.test.ts`) when a `tests/server` test holds the same behaviour. Item 1's sixth bullet names only `tests/data`.
2. "its paths disjoint from theirs" does not hold for the 27 shared allow-list entries (Names 1).

## 3. Premises

- Counts: `find tests/state -name '*.test.ts' | wc -l` prints 205, and `find tests/state -name '*.ts' -exec cat {} + | wc -l` prints 66497. The per-folder loop prints boards 23/7213, client 11/3704, feeds 8/1723, forms 5/2021, life 7/2482, sessions 23/8266, shared 11/4109, sources 53/13662, system 19/5215, workbench 45/18102. `ls -p tests/state | grep -v /` prints nothing. All match.
- Slow tag: `grep -rl "@module-tag slow" tests/state` prints only `tests/state/client/socket-timing.test.ts`. The tag sits at `:8-9`, a two-line paragraph that ends the head comment; the brief's "the last line" fits in substance. `grep -rn "{ tags: \[" tests/state` prints nothing. `grep -rn "{ tags:" tests/state` prints only `boards/collection/collection-fields.test.ts:361`. All match.
- Audits: `grep -rn "it('audits" tests/state` prints the six lines the brief names, and `grep -rn "['\"\`]audits" tests/state` finds no other form. Match.
- Source and config reads: `grep -rn "readFileSync\|readdirSync\|import.meta.glob\|?raw" tests/state` prints `generation.test.ts:121`, `settings/search.test.ts:139`, `settings/rows.test.ts:397` and `:425`, and `settings/fixture.ts:41`. `rows.test.ts:8` holds the local.yml sentence. `src/lib/data/sources/config.ts:6-8` says loadConfig leaves `local.yml` out, and `grep -rn "loadLocal\|localFile" tests/state` prints nothing. All match.
- Cause files: `grep -rln "spawn\|execFile\|exec(\|createServer\|listen(" tests/state` prints `commands-pane.test.ts` and `hunks-git.test.ts`. `grep -rln "setTimeout([^,]*, *[1-9]" tests/state` prints `terminals.test.ts` (`:423`, 20 ms), `sections.test.ts` (`:172`, 30 ms) and `view-state.test.ts` (`:150`, 2 ms). This matches the brief. `tmux-fixture.ts:15-17` runs `tmux -V` at module load, which makes `commands-pane.test.ts` a module-load cause.
- Largest files: `find tests/state -name '*.ts' -exec wc -l {} + | sort -n | tail -7` prints 846, 847, 868, 883, 883 and 893 for the files named. `size.test.ts:28` holds `const LINES = 900;`. Match.
- Folders at 10: the `ls -A | wc -l` loop over `find tests/state -type d` prints the same 11 folders. The rule is held by `utils/folder-check.sh`, which `size.test.ts` runs (`:13-14`, `:149-163`). Match.
- Vitest: `node_modules/vitest/package.json` gives 4.1.11, and `vite.config.ts:35` is the `tags:` line. The file the brief calls `@vitest/runner` `tasks.d.ts` is named `node_modules/@vitest/runner/dist/tasks.d-DEYaIMIu.d.ts` on disk. Its `:1200-1201` holds the two `describe` overloads, the second taking `SuiteOptions`, and `:826` holds `tags?`. Match in substance.
- Helper importers: a grep by full path gives `layout-fixture` 16 test files (13 shell, 1 ui, 2 views) plus the allow list, `board-fixture` 5, `commands-fixture` 3, `rail-badges-fixture` 2, `side-fixture` 1 and `settings/fixture` 1. Match.
- Outside comments: 48 hits, split as the brief says (Names). Match, except that the 9 checks hits are strings, not comments.
- `allow-duplication.txt`: `wc -l` prints 128. The `tests/state` lines are 30 and 65-110, line 30 is the pair named, and `duplication.test.ts:304` and `:597-606` are the checks named. Match.
- Slow-tier sentences: `sed -n 340,343p HELP.md` prints the server paragraph, a blank line, "The checks, from `tools/oculus`:" and a blank line. `grep -n "slow" HELP.md` gives `:344` ("leaving out the tree checks and the files tagged slow") and `:346` (the `npm run test:slow` sentence). `README.md:15` and `vite.config.ts:31-35` match.
- In flight: `grep -n "tests/server" tests/checks/tree/allow-duplication.txt` gives lines 37, 39, 40 and 42-63, so T1c's range of 37-63 matches. On main, `tmux-fixture.ts` exports `TMUX`, `PrivateTmux`, `privateTmux` and `watchEnds`. In `.agents/worktrees/T1c`, `tmux-fixture.ts:9` re-exports `privateTmux`, `tmuxOptions`, `watchEnds` and `PrivateTmux` from `./tmux-server.ts`, and `:12` defines `TMUX`. Every export `commands-pane.test.ts:27` imports is kept. Match.
- ADR: `ls tools/oculus/docs` prints `diagrams`. Match.

Findings:
1. `HELP.md:342` is wrong: on main the two sentences that describe the slow tier only by its file form are `HELP.md:344` and `HELP.md:346`.

## 4. Cases and checks

- `registry.test.ts:505` and `:522` (delete): consistent with `spec.md:57` (no test of a constant, and a failure that stops no view). The glyph keys themselves stay held by `:473` ("names a glyph key whose value is a name config/catalogs/glyphs.yml holds").
- `registry.test.ts:547` (delete): consistent. Its `toBeDefined()` lines repeat what `:473` holds for every registered view.
- `forces.test.ts:257` (keep, retitled): see The question 5.
- `fs.test.ts:108` (keep, retitled): consistent. The code path, where a relist during an in-flight read sends no second request, is not held by `:83`, whose pair is not in flight.
- `terminal-close.test.ts:281` (keep, retitled, comment rewritten): consistent. Its title also carries "as before", which `spec.md:42` bans. The retitle removes it.
- `generation.test.ts:156-175` (delete): consistent with `spec.md:61`.
- `client/socket-timing.test.ts` (delete): consistent with Decision 4. `.agents/plan.yaml:22` reads `bench: []`. `client/socket-stub.ts` stays: `grep -rln "socket-stub" tests src` gives `system/machine/processes.test.ts` and `client/config-seed.test.ts`.
- `system/settings/rows.test.ts:393-410`: the `it` opens at `:394` and its body runs to `:421`. The terminal-control assertions at `:411-420` sit outside the range the case gives.
- Shared helper exports kept: consistent with Decision 2.
- Allow-list stale entry removed: consistent. See Names 1 for the shared lines.
- Fold listed old title against row: consistent with item 2 and item 7.
- "A test whose minimum over five runs is 95 ms in one sample and 105 ms in another: Decision 1's rule decides, on the minimum over all samples taken": this conflicts with Decision 1 ("the minimum of its times over five verbose runs of its own file") and with item 7 ("Each test tagged by time gives its five times"). The case uses every sample taken, while the decision and the report shape use five runs.

Findings:
1. The 95/105 ms case and Decision 1 define the sample differently: all samples against five runs. The brief does not say which governs, or what the report gives when more than five runs were taken. T1c's open point D1, the 100 ms boundary, is this same question, and the state file has it unjudged (`orchestrator-state.md:197`).
2. The `rows.test.ts` case gives `:393-410`, but the test spans `:394-421`.

## 5. The question

- `registry.test.ts:505`, `:522`, `:547`: no. The builder reads the code, and the deletion is judged against `:473`.
- `forces.test.ts:257` (keep): yes.
  - `src/lib/state/boards/structure/forces.ts:65-107` and `:147-150` have no branch for an empty node list: `createForces([])` builds a d3 simulation over `[]`, and `settleForces` ticks it.
  - The keep rests on "a throw there would stop the view", which nothing in oculus's code can produce today. The test exercises d3's handling of `[]`.
  - Under `spec.md:57` ("a test that still passes with its behaviour removed is deleted") and item 1's fourth bullet, the verdict could be delete.
  - The real empty input reaches this path through `layout.ts:240-241` (`mapPlacement`). No test at that level holds it: `layout.test.ts:94` tests `placeGraph`, which is not the forces path.
- `fs.test.ts:108`: no.
- `terminal-close.test.ts:281`: no. The kept test is the wiring case over `endedTerminals`, which `terminals.test.ts:672-704` tests as a pure function.
- `generation.test.ts:156-175`: no.
- `socket-timing.test.ts`: no.
- `rows.test.ts:393`: no.
- Helper exports, allow-list, fold: no. `test:checks` and the fold runs fail on a miss.
- 95/105 ms: yes. With two definitions of the sample, a test can be tagged or left quick depending on which one the builder uses (Cases and checks 1).
- The step line's check (the report's removals and line counts): yes.
  - Item 7 lists only tests "deleted, folded, retitled or tagged, file by file".
  - A file the builder never read and a file read and kept whole look the same in the report, and no verify item shows each of the 223 `.ts` files was read.
  - A sweep that deletes only the cases named passes all five verify items and `checks.sh`.
- Item 1 (delete): yes, for the same reason. No verify item touches it, and only the refuter's reading would see a light sweep.
- Item 2 (fold): no. Verify 5 runs each table, and item 7 maps titles to rows.
- Item 3 (tag), verify 2 and verify 3: yes.
  - Verify 3 runs "Each file the sweep changed". A file the sweep leaves unchanged that holds a quick test with a Decision 1 cause passes it. This is the defect T1c's refuter found (`T1c-refuter.md`, Spec 2: `sessions/registry.test.ts:23` and `root/process/serve.test.ts:41`, neither in T1c's diff).
  - In `tests/state` this applies on main to `sources/repositories/diff/hunks-git.test.ts` (`spawnSync('git', ...)` at `:55`, no tag) and `sessions/terminal/commands-pane.test.ts` (`tmux` through `tmux-fixture.ts:15-17` at module load and `execFile('tmux', ...)` at `:75`, no tag). Both could be left unchanged and pass verify 3.
  - The cause list also comes from a grep over test text alone. A cause reached through imported code (T1c's `ps` through `systemProbe`) would not show in it.
- Item 4 (keep; wall-clock waits): yes. No verify item checks `spec.md:64`.
  - `terminals.test.ts:423` (`idle`, a 20 ms sleep "for a case that asserts nothing happened") and `sections.test.ts:172` (a 30 ms `settle` before asserting that nothing was delivered, `:181-206`) are fixed sleeps of the kind `spec.md:64` forbids.
  - The brief lists them only as Decision 1 causes, so a builder could tag them slow and pass verify 2 and 3 with the sleeps in place.
  - `view-state.test.ts:150` uses a 2 ms real timer to keep reads in flight. A deferred promise or a fake clock removes the cause without a tag.
- Item 5 (comments and helpers): yes. No verify item. A grep of each deleted or renamed file's path over `tests` and `src` would show a comment left naming it.
- Item 6 (allow list): no. `test:checks` fails on a stale entry or a new clone.
- Items 7 and 8 (report, Doc text): yes, as for the step line's check.

Findings:
1. Verify 3 covers only changed files, so `hunks-git.test.ts` and `commands-pane.test.ts`, untagged with causes, can stay as they are. It should run over every file of `tests/state` that has a Decision 1 cause, or over every file of `tests/state`.
2. Item 7's file-by-file list omits files kept whole, so the report cannot show that every file was read. Neither the step line's check nor item 1 can then tell a light sweep from a full one.
3. The three timers are listed as Decision 1 causes and not as `spec.md:64` breaches. The brief does not say that item 4 replaces a sleep (leaving the test quick) before item 3 judges the tag. No verify item checks `spec.md:64`.
4. Item 5 has no check. A grep per deleted or renamed path is one.
5. The `forces.test.ts:257` keep rests on a throw that `forces.ts` cannot produce. The case should give a reason the code supports, or leave the verdict to the builder's first run under item 1's fourth bullet.

## 6. Implied inputs

This is a judgment step over tests. These are the inputs the sweep will meet that the brief does not settle:

- `vi.waitFor`: missing.
  - `grep -rn "vi.waitFor" tests/state` gives 14 calls: `terminals.test.ts:432-609` (13) and `life/memories-message.test.ts:96` (1).
  - `node_modules/vitest/dist/chunks/test.DNmyFkvJ.js:3359-3406` checks once, then polls on a real `setInterval` of 50 ms (`interval = 50`, from `getSafeTimers`, so real even under fake timers) until the condition holds.
  - Decision 1 (a real timer of 1 ms or more) and `spec.md:64` (a wait on a signal) give different answers for it. T1c's round accepted it as a replacement for a sleep (`T1c-report.md`, section 10).
  - Expected: the brief says whether an awaited `vi.waitFor` whose first check fails is a cause.
- The order of item 4 and item 3 for the three real timers: missing. Expected: a fixed sleep is replaced under item 4 first, and the tag is judged on the result (The question 3).
- A test holding two copies of one value equal across a boundary no import may cross: missing.
  - `system/config-files.test.ts:17` (`LOCAL_NAME` of `state/system/config/config-files.ts:15` against `data/sources/config.ts`'s, named as that test's job by `config-files.ts:13`).
  - `life/memories-message.test.ts:76` (cannot fail, since the server re-exports the same constant, `server/content/memories.ts:25` and `:50`).
  - Item 1's "a test of a constant" and the cost list give different answers. Expected: the brief says whether an agreement test that can fail and whose failure is a wrong input accepted stays, and that a re-export makes it a pass-through.
- A check over the shipped configuration whose failure stops a view: missing.
  - `registry.test.ts:468` and `:473` hold every registration's label and glyph keys to the catalog.
  - `catalogEntry` throws on a missing key (`src/lib/state/shared/words/text.ts:50-55`).
  - `text.ts:44-47` and `registry.ts:12-14` name these tests as the gate `tests/checks/source/keys.test.ts` cannot give.
  - The brief deletes `:505`, `:522` and `:547` as "a constant" and settles only `rows.test.ts:393` among shipped-config checks. Expected: such a check stays where its failure stops a view, as `rows.test.ts:393`'s case argues.
- The layer label item 5 requires: missing.
  - A loop over every `tests/state` `.ts` file, testing for `Layer [0-9], ` with `grep -m1`, prints 116 files with no label.
  - The other 107 use 13 spellings across "Layer 2" and "Layer 4": "Layer 4, test" 31, "Layer 2, client-state tests" 17, "Layer 2, client state tests" 13, "Layer 4, state test" 10, and so on.
  - The imported `tests/views/shared/real-text.ts:1` says "Layer 5, test support".
  - `grep -n "Layer [0-9]" DESIGN.md` gives Layers 1 to 3 only.
  - Expected: the brief names the label a state test file carries.
- Helpers outside `tests/state` that the sweep can leave unused (Names 2): missing. Expected: named in the report for the owning sweep (T1c or T1d), not deleted.
- A `src/` export left with no importer once a test is deleted: missing. T1c's refuter raised one (`T1c-refuter.md`, Standards 4, `subscriptionChannels`), and `spec.md:83` requires such an export removed. Expected: the report names it for removal at landing, since `src/` is outside the paths.
- The base copy: missing.
  - `spec.md:32` says "to read a file as it was, use the base copy your brief names", and the brief names none.
  - T1c's builder lacked one: it read main's `tests/server`, ran `git show HEAD:` three times, and restored main's cases from there (`T1c-report.md`, sections 10 and 11.5).
  - Item 7's "before" counts and timings and any restore need the unchanged tree. Expected: the brief names the base copy's path.
- `tests/state` tests that drive server code (The step line 1): missing. Expected: judged under the lowest-level rule against `tests/server`.
- The 27 allow-list entries shared with T1d and T1e (Names 1): missing. Expected: the brief says which step removes a shared entry, or that each sweep removes one its own change makes stale, and the dispatch entry records it under `shared_paths`.
- Kept files near the size cap: `terminals.test.ts` 893, `repositories.test.ts` 883, `collection.test.ts` 883. `spec.md:45` says a file within 20 lines of its cap is split, and the check's cap is 900 (`size.test.ts:28`). This is listed only for a kept file the sweep changes that stays at 880 lines or more. Expected: such a file is split by concern.

Findings: each item above is missing from "Cases" and from the items.

## 7. ADRs

- `ls tools/oculus/docs` prints `diagrams`, and `ls docs/adr` from the repository root fails with "No such file or directory". `grep -n "adr" .agents/plan.yaml` prints nothing, and the state file's configuration block on main has no `adr` key. There is no record.

Findings: none.

## Declined to judge

- Whether `describe(name, { tags: ['slow'] }, fn)` excludes the tests of a `tests/state` file that uses vitest's own `it`, as against `tests/fixtures/scratch.ts`'s `it`, which T1c probed. Confirming it needs a probe test file under `tests/`, and this check writes nothing in the tree.
- Whether the readers of the configuration generation (`generation.test.ts:156-175`) could instead be held by a `*.client.test.ts` under `spec.md:65`. The brief rules out new tests, and whether that behaviour costs enough to need one is the orchestrator's call.
- Whether `socket-timing.test.ts`, the timing Q85b's item 13 built, is wanted as a benchmark under `bench:`. That is the user's call, and Decision 4 records it as reversible.
- A runtime probe of every `tests/state` test for processes, sockets and timers, which would mean running the whole folder. The prompt allows single files only.

Agent usage: claude-opus-5-5. Tokens and minutes were not measured; the session's context counter shows about 240,000 tokens used. 62 tool uses.


Completion notice: 249,285 tokens, 92 tool uses, 10.6 min (agent ab9456832c5dabe8a, model read below).

## Closed

- Names 1 and The step line 2 (27 allow-list entries shared with T1d and T1e): "What is on the tree" names them; item 6 says each sweep removes an entry its own change makes stale, removals only, and the orchestrator merges both removals at landing; the dispatch entry records the file under `shared_paths`.
- Names 2 (eight helpers outside `tests/state` that it imports): listed under "What is on the tree"; item 5 says one left with no importer is named in the report for the sweep that owns its folder, never deleted.
- The step line 1 (state tests that drive server code): listed under "What is on the tree"; item 1 gains a bullet that deletes such a test when a `tests/server/` test holds the behaviour, unless it is the one wiring case.
- Premises 1: `HELP.md:344` and `:346`, with the correction noted beside it.
- Cases and checks 1 and Implied inputs (`vi.waitFor` aside): Decision 1, item 7 and the case now all read the minimum over every verbose run taken, at least five; the case's verdict is quick at 95 ms. T1c's open point D1 is judged by the same rule.
- Cases and checks 2: the case reads `rows.test.ts:394-421`.
- The question 1: verify 3 runs over every file with a Decision 1 cause, changed or not, `hunks-git.test.ts` and `commands-pane.test.ts` named; item 3 counts a cause reached through imported code.
- The question 2: item 7 lists every file of `tests/state/`, a file kept whole as "read, kept whole" with its test count.
- The question 3: the three fixed waits are listed as `spec.md:64` breaches; item 4 replaces a fixed sleep before item 3 judges the tag.
- The question 4: verify 6 greps each deleted or renamed path.
- The question 5: the `forces.test.ts:257` case gives the code's reason (no branch for an empty list) and the verdict delete, unless the first run names oculus code the test would catch.
- Implied inputs, `vi.waitFor`: item 4 replaces it by the code's own signal where there is one; otherwise it stays and the test is judged by time.
- Implied inputs, agreement tests: item 1 gains the bullet; `config-files.test.ts:17` keep and `memories-message.test.ts:76` delete are cases.
- Implied inputs, shipped-config checks: `registry.test.ts:468` and `:473` are a case, verdict keep.
- Implied inputs, the layer label: item 5 names `// Layer 2, client-state tests.` and `// Layer 2, client-state test helper.`, from `DESIGN.md:110` and T1c's `tests/server` label.
- Implied inputs, a `src/` export left with no importer: item 5 sends it to "Doc text" for removal at landing.
- Implied inputs, the base copy: `.agents/worktrees/T1b-base/tools/oculus/` holds `src/` and `tests/` at the base, made at preparation; "What is on the tree" names it.
- Implied inputs, kept files near the cap: item 4 splits a changed file left at 880 lines or more.
- From T1d's brief check, the points that hold for `tests/state/` too: a hook's time and causes count with the tests it serves (item 3); a `*.client.test.ts` case of a press or focus is deleted under `spec.md:65` (item 1); a rewritten helper keeps how it fails (item 5); a removal names its holding test by `file:line`, marked when it lies in another sweep's folder (item 7).
