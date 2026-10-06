# Step T1e brief check (on main at cf91445bf)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/T1e.md`. Every command ran from `tools/oculus` on main at `cf91445bf` unless another directory is named. The ledger files `plan.md`, `orchestrator-state.md`, `queue.md` and `agents/reviews/T1c-report.md` are uncommitted on main, and the briefs T1b, T1d and T1e are untracked (`git status --short .`). They were read as they are on disk.

## 1. Names

- `routes/page.test.ts` loses its source cases (:80-160). `grep -rn "routes/page.test" src tests utils config DESIGN.md HELP.md README.md --exclude=local.yml` finds one hit outside the paths: `tests/shell/context-guard.test.ts:5`, "The listener that calls it is read as source in tests/routes/page.test.ts." This becomes false once :150-160 go. The file is in T1d's folder. Item 10's parenthetical covers only comments "that name a deleted or renamed test file", and page.test.ts is neither deleted nor renamed, so the line is not clearly in scope.
- `tests/data/real-hub.probe.ts` is judged "like a helper" (item 6). `grep -rn "real-hub.probe" ...` finds `.scratch/migration/agents/spec.md:37`, which names it as one of the four real-hub readers. That sentence becomes false if the probe is deleted. The rules file is outside every path list, and item 10's parenthetical (src/, utils/, the other test folders) leaves it out.
- `tests/fixtures/` exports. `agents/reviews/T1c-report.md:174` says "Unused exports of `tests/fixtures/` for T1e ...: `ClientState` re-export in `client.ts`; `sweepingOnError` in `scratch.ts`; `gitPayload` in `sessions-fixture.ts`". T1e's brief does not carry this. T1b's and T1d's briefs also say "A helper of `tests/fixtures/` that the sweep leaves unused is named in the report for T1e". T1e runs beside them, so those names never reach T1e's builder, and no step removes what they name.
- `agents/reviews/T1c-report.md:179` proposes Doc text for a file in T1e's paths: "`tests/routes/machine/commands.test.ts:8`: '(tests/server/root/hooks.test.ts)' ... Replace the path". T1e's brief does not mention it, so both steps may write that line.
- `allow-duplication.txt`, lines 26-47. Both the main file and the T1c worktree copy were read (`diff tools/oculus/tests/checks/tree/allow-duplication.txt .agents/worktrees/T1c/tools/oculus/tests/checks/tree/allow-duplication.txt`). T1c has already deleted line 37 and rewritten lines 39, 40, 42-44 and 46, all inside T1e's range. `grep -n "tests/state" tests/checks/tree/allow-duplication.txt` shows line 30, which T1b's brief also claims ("lines 30 and 65-110").
- Comments in other files name files in these folders: DESIGN.md:34, 85, 167, 179, 181, 197, 223, 423, 425; HELP.md:308; `config/catalogs/vocab.yml:153`; `config/catalogs/options.yml:3`; `utils/size-allow.txt:3`. Found with `grep -rn --exclude=local.yml "tests/\(routes\|data\|checks\|fixtures\)/" config DESIGN.md HELP.md README.md ...`. Each names a check that item 5 keeps, so none becomes false as long as no check file is renamed.
- `tests/checks/tree/size.test.ts:10-11` (inside the paths) says size-allow.txt "is read by this and by the one-line command of the verification list, which holds the same rule in awk". This is false on main. The verify list in `orchestrator-state.md` holds no size command (npm test, test:checks, check, build, format:check, lint, the ASCII grep), and `grep -rn "size-check.sh" ... .scratch/migration/orchestrator-state.md ~/.claude/skills/land/templates/checks.sh` finds none.

Findings:
1. `tests/shell/context-guard.test.ts:5` becomes false and is not named. Item 10's parenthetical does not reach a comment about a file that is kept.
2. `spec.md:37` becomes false if item 6 deletes the probe, and it is not named.
3. T1c-report.md:174 (fixture exports named for T1e) is not carried. Neither is the matching sentence of T1b's and T1d's briefs. Fixture exports left unused by the other three sweeps have no owner.
4. T1c-report.md:179's Doc text for `routes/machine/commands.test.ts:8` is a second writer of a line in T1e's paths, and the brief does not mention it.
5. The allow-duplication range 26-47 overlaps T1c's edited lines (37, 39, 40, 42-46) and T1b's line 30. The brief says only "Some pair a file of another sweep's folders". It does not say which sweep removes a shared entry, whether the "at N and M" line numbers are rewritten (T1c rewrites them), or that the dispatch entry needs `shared_paths`.
6. `size.test.ts:10-11` is a false sentence inside the paths, and the case verdict for `:133` rests on it (see 4).

## 2. The step line

- "deletes every test there that breaks `agents/spec.md`'s test rule ..., read file by file, slow-tagged files included": the preamble of "What to build" and item 1. Two parts are taken out of it: item 5 ("A check that the sweep finds guards nothing ... is not deleted: the report names it ... for Axel's ruling") and Decision 6 (`checks/tree/audits.test.ts` and `allow-audits.txt` left out of the paths).
- "may cut harder than one test per behaviour (Z363): a variation of an outcome another case already gives is cut": item 1, fifth bullet.
- "cases of one outcome become rows of one table": item 2.
- "a test that passes with its behaviour taken out is deleted": item 1, fourth bullet.
- "where a behaviour is tested both in its own module and at a higher level ..., the step owning the higher folder deletes the higher test unless it is the one case of the wiring": item 1, sixth bullet, and Decision 4.
- "a test that cannot run well under a second takes the slow tag": item 3 and Decision 1.
- "Its report lists each removal with the behaviour it guarded or why it guarded none, and the line count of its folders before and after": item 9.
- "Runs beside the other sweeps, its paths disjoint from theirs": "Paths this step writes". The paths are not disjoint (Names 5).
- Counts: "120 files, 36,967 lines" matches `find ... -name '*.test.ts' | wc -l` = 120 and `find ... -name '*.ts' -exec cat {} + | wc -l` = 36967.

Findings:
1. The step line has no exemption for `tests/checks/`, yet item 5 and Decision 6 take out part of it. On the rules file: `spec.md:57` says "A test that still passes with its behaviour removed is deleted, never kept as an audit", and Z354 says "no audits". `audits.test.ts:232` ("is named an audit everywhere under tests/views") requires that every case under `tests/views/` that never renders be titled "audits" (`findAudits`, `:202-210`), which directly contradicts that rule. Decision 6 defers the file to "the ruling that settles them with T1d", but no such ruling exists. `grep -n "audits.test\|allow-audits" plan.md orchestrator-state.md queue.md agents/briefs/T1d.md` finds only Z349, which is about D25, and the state file's Open items list holds only Z314. T1d's brief never mentions `audits.test.ts`.
   - Concrete result: T1d's case keeps `views/personal/memories.test.ts:202` retitled without "audits". That case calls `answered(...)` and renders nothing, so `audits.test.ts:232` fails. T1d's deletions of listed cases make `allow-audits.txt` stale (107 entries name `tests/views`, by `grep -c "^tests/views" tests/checks/tree/allow-audits.txt`), so `:321` "holds the allow list to cases the tree still has" fails too. Neither step's paths let it fix either file.
   - Decision 6 is therefore not consistent with the rules file, and not with the step line, which covers `tests/checks/`. It leaves T1d's verify item 1 (test:checks) red with no owner. The deferral is unbooked. Under "Steps / The brief check" item 4, a fix that changes scope or makes a choice the user would see is a stop, and this one has to be raised now.
2. Item 5's "named for Axel's ruling, not deleted" narrows "deletes every test there that breaks" the test rule. The reason it gives, "since a check is part of the verify list", does not hold for a single check: the verify list holds the command `npm run test:checks`, not each file. Whether deleting a gate is a user-visible choice is Axel's to say (see "Declined to judge"). The brief needs either a ruling or a line in Rulings that grants the carve-out. As written it is a booking in place of the work the step line names.
3. "its paths disjoint from theirs" does not hold (Names 5).

## 3. Premises

- Counts by folder and subfolder: the per-folder `find` loops printed exactly the figures of "What is on the tree" (routes 45 / 14435, data 42 / 10613, checks 33 / 11188, fixtures 0 / 731, and each subfolder). The files directly in each top folder (`ls -p ... | grep -v /`) match the list. Matches.
- Slow tags: `grep -rl "@module-tag slow" ...` prints the six files named. `grep -rn "{ tags:" ...` prints nothing (rc=1). Matches.
- Audit titles: `grep -rn "it('audits\|it(\"audits" ...` prints 17 lines: 16 tests plus the planted string at `checks/tree/audits.test.ts:272`. The brief says "17 tests are titled as audits ... and a string". There are 16 tests. Also checked: `grep -rnE "^\s*['\"\`]audits"` (titles on their own line) prints nothing.
- `audits.test.ts:201-207` and `:231-233` hold `findAudits` and the case "is named an audit everywhere under tests/views". Matches.
- `utils/diagrams/source.mjs:12` and `:15` read `BOUNDARIES` and `ORDERING`; `folder-check.sh:8` and `size-check.sh:9` name `size.test.ts`. Matches.
- Process and socket files: `grep -rln "spawn\|execFile\|execSync\|createServer\|\.listen(" ...` prints the 13 files listed, and the timer grep prints `routes/git/untracked.test.ts`. Both match the brief, but the list is not complete as a list of tests that start a process. `routes/git/refs.test.ts` and `routes/git/untracked.test.ts` run real git through `tests/server/git/refs/repo.ts`, where `git()` calls `execFileSync('git', ...)` at :40-45. `routes/sessions/latex.test.ts` plants shell scripts that the endpoint runs (`stub(bin, 'texcount', 'sleep 5')` at :438, `PATH: \`${bin}:/usr/bin:/bin\`` at :78). Found with `grep -rlE "scratchRepo|isolateGit|stub\(bin" tests/routes tests/data tests/checks`. The grep reads only the test file's own text.
- Largest files: `find ... -exec wc -l {} + | sort -n | tail` prints write 891, diagrams 882, normalise 871, terminal-actions 788, validate 781, scratch 751. `size.test.ts:28` is `const LINES = 900;`. Matches.
- Folders at 10 items: counted over `git ls-files`, which gives tests/routes 10, tests/fixtures 10, routes/files 10, data/sources 10 and checks/tree 10. Matches.
- Vitest: `grep '"version"' node_modules/vitest/package.json` prints 4.1.11, and `vite.config.ts:35` holds the tag. Matches.
- Fixture importers: the loop over `grep -rl "fixtures/<name>" tests src` prints client 215, scratch 191, doubles 81, entities-fixture 39, sessions-fixture 33, present 16, kinds 4, reason 4, feeds-fixture 3, real-hub 3. Matches.
- Outside comments: `grep -rn "tests/\(routes\|data\|checks\|fixtures\)/" src tests utils`, outside the four folders, gives tests/state 17, tests/views 13, tests/server 11, tests/ui 6, tests/shell 2, src/lib 20 (data 2, server 6, state 6, themes 1, ui 3, views 2), src/hooks.server.ts 1, utils/diagrams 9, folder-check.sh 1, size-check.sh 1. These match, but the grep also finds `utils/size-allow.txt:3`, which the brief leaves out. Over the documents and config the brief did not grep (Names, last bullets), it finds DESIGN.md, HELP.md:308, `config/catalogs/vocab.yml:153`, `options.yml:3` and `agents/spec.md:37`/`:53`.
- allow-duplication: `grep -n "tests/\(routes\|data\|checks\|fixtures\)/" tests/checks/tree/allow-duplication.txt` prints lines 9, 10 and 26-47. Lines 9 and 10 are the file's header comment ("# tests/checks/tree/duplication.test.ts instead, with the reason ..."), not entries. The brief calls them "the entries naming a file of these folders are lines 9, 10 and 26-47".
- Slow-tier sentences (`vite.config.ts:31-35`, `README.md:15`, `HELP.md:342`, `agents/spec.md:56`): `vite.config.ts:31-35` was confirmed. T1b's brief check found the HELP.md sentences at `HELP.md:344` and `:346` (`agents/reviews/T1b-brief-check.md`, Premises 1), and T1e's brief still says `HELP.md:342`. Not rerun here.
- Steps in flight: T1c's worktree writes lines 37-63 of allow-duplication.txt. The diff above confirms it, and it also shows T1c's edits at 37, 39, 40, 42-44 and 46.
- ADR: `ls tools/oculus/docs` prints `diagrams`. Matches.

Findings:
1. "17 tests are titled as audits": there are 16 tests and one planted string.
2. The process list is presented as the list of files to judge under Decision 1 but misses `routes/git/refs.test.ts` and `routes/git/untracked.test.ts`, which run git through the imported `repo.ts`, and `routes/sessions/latex.test.ts`, whose endpoint runs planted shell scripts and a 5 s sleep stub against a time limit. All three start real processes in their bodies.
3. The outside-comments premise leaves out `utils/size-allow.txt:3` and the document and config hits (DESIGN.md, HELP.md:308, vocab.yml:153, options.yml:3, spec.md:37).
4. allow-duplication lines 9 and 10 are header comments, not entries.
5. `HELP.md:342` is wrong (T1b's brief check: `:344` and `:346`). Not rerun here.

## 4. Cases and checks

- `routes/page.test.ts:80-160`, delete each: consistent with `spec.md:61`. The range also holds `:106` ("takes what the previous address carried before it reads its saved workbench"), a source-text case not titled as an audit (its comment at :105 says "An audit"). The case says "nine cases titled as audits", so `:106` is in the range but not in the count.
- `undo-removed.test.ts:110`, `:138`, keep: consistent with `spec.md:57` (lost work). No `tests/server` case was found that holds the "written as a map" fallback (`grep -n "it(" tests/server/edit/yaml/yaml-edit-removed.test.ts`), so the sixth bullet of item 1 does not remove it. The verdict does not state this reason.
- `data/sources/personal.test.ts:193`, keep: consistent. A corrupted entity map is wrong input accepted.
- `checks/tree/size.test.ts:133`, keep: inconsistent on two counts. Its reason, "the verify list's size check", is false (Names 6). The test also holds `expect(command).toContain('size-allow.txt')` over the text of `utils/size-check.sh` (`:134`, `:140`), an assertion over source text that item 1's third bullet and `spec.md:61` delete. Item 4 forbids rewriting a kept test's assertions, so the builder cannot both keep the case and remove that assertion.
- `checks/source/retired.test.ts:28`, keep: inconsistent with `spec.md:57`'s cost list. The test bans phrases in HELP.md, DESIGN.md and README.md (`RETIRED` at :12). A document naming a retired screen is none of lost work, a wrong file, a broken start, a wrong configuration accepted, or a view, key or command that stops working. The file reads three documents, not the tree, so "a check of the tree" does not describe it, and its head comment calls it "an audit of the documents' text" (:4). Item 5 would at most name it for Axel. The case decides keep in advance.
- `checks/source/add-forms.test.ts:60`, `:65`: consistent. Two add forms over one draft means a save takes the other form's values.
- `audits.test.ts` and `allow-audits.txt` left untouched: inconsistent with `spec.md:57` and Z354 (The step line 1).
- Fixture `real-hub.ts` kept: consistent. The case says "a helper ... that one file imports" while it names three importers, which is only a wording mismatch.
- Stale allow-duplication entry removed: consistent as stated, but see The question 3.
- Fold: consistent with T1c's round ruling 5.
- Decision 1 applied to `tests/checks/`, read against `spec.md:53` ("`tests/checks/tree/boundaries.test.ts` enforces them and must pass") and Decision 6 ("A check of the tree is part of the verify list"). `PATH=... npx vitest run tests/checks/tree/boundaries.test.ts --tagsFilter '!slow' --testTimeout 0 --reporter=verbose` (load average 11.91 7.25 6.88) printed "holds across src/lib 2209ms", "holds no process-wide state under src 442ms", "lets no view or shell component style a primitive own class 221ms" and "holds the styling lists to rules the tree still has 231ms". `duplication.test.ts:149` runs jscpd through `execFileSync` for its tree cases (:299, :303). `size.test.ts:135` and `:163` run `sh`, `scratch.test.ts:488` runs vitest, and `diagrams.test.ts` starts processes. Under Decision 1 each of these is slow by cause or by time. Verify item 3 then requires the tag, and `test:checks` runs `--tagsFilter '!slow'` (`package.json:13`). The tree checks would leave the verify list, which contradicts `spec.md:53`, item 5 and Decision 6.

Findings:
1. Decision 1 and verify item 3, applied to `tests/checks/`, move the boundary, duplication, size and diagram checks out of `npm run test:checks` and so out of the verify list. That contradicts `spec.md:53` and the brief's own item 5 and Decision 6. The brief needs to settle whether a tree check is tagged, and if one is, what runs it before landing. Where that choice changes what the verify list checks, it is Axel's.
2. The `size.test.ts:133` verdict rests on a false premise and keeps an assertion over source text that item 4 forbids the builder to remove.
3. The `retired.test.ts:28` keep verdict is not supported by `spec.md:57`'s cost list. It should be "judged under item 5 (named for Axel if it guards nothing)", not keep.
4. The `audits.test.ts` exclusion is inconsistent with `spec.md:57` and Z354 (The step line 1).
5. The `page.test.ts` case counts nine and leaves `:106` (a source case not titled as an audit) to inference.

## 5. The question

The question asked of each item is "could this pass without the goal being reached?" Here the goal is that every test in the four folders breaking the test rule is gone, each kept test runs in well under a second or is tagged, and coverage is held at the lowest level.

- page.test.ts case: yes. Verify item 4 greps only "audits" titles, so `:106`, a source case without the word, can stay while every check passes.
- undo-removed, personal, add-forms cases: no. Each is a reading verdict on a named test.
- size.test.ts:133 case: yes. It keeps a source-text assertion (Cases 2).
- retired.test.ts case: yes. It keeps a test with no cost under `spec.md:57`.
- audits.test.ts case: yes. A check that requires audit-titled tests stays, and the cross-sweep red has no owner.
- Fixture case: yes. "Nothing imports on this step's tree" is read at T1e's base, so exports that T1b, T1c and T1d leave unused stay (Names 3).
- allow-duplication case ("npm run test:checks green"): yes. If `duplication.test.ts`'s tree cases are tagged slow under Decision 1 (Cases 1), test:checks is green without running them. A stale or a new clone then passes.
- Fold case: no. The old titles against rows are read by the reviewer.
- The step line's check (the report lists each removal and the line counts): yes. Item 9 lists only tests deleted, folded, retitled or tagged, so a light sweep that leaves most files untouched gives a report that looks complete. T1b's brief check raised the same point (The question 2) and closed it with a "read, kept whole" row per file.
- Item 1: judged by reading. The verify list has no check that a removal's cited holder still exists after the other sweeps land. T1c's removals cite holders in T1e's folders: `T1c-report.md:381` cites `tests/data/helpers/guards.test.ts`, `:396` `tests/data/sources/config/settings.test.ts`, `:432` `.../config/local.test.ts`, `:481` `tests/routes/sessions/terminal-edit.test.ts`, `:513` `tests/data/helpers/files/nesting.test.ts` and `:514` `.../config/languages.test.ts`. T1e can cut or fold one of these as a variation, and every check still passes while T1c's coverage is gone.
- Item 3 (verify 3): yes. Verify 3 runs only over "each file the sweep changed", so an untouched file keeps a quick test with a cause: `refs.test.ts`, `untracked.test.ts`, `latex.test.ts` (Premises 2). T1c's refuter found exactly this (`T1c-refuter.md`, Spec 2: `registry.test.ts:23`, `serve.test.ts:41`, unchanged files), and round 1 ruled the tags. T1b's brief check closed it as "verify 3 runs over every file with a Decision 1 cause, changed or not". T1e's brief lacks both.
- Item 4: yes in part. `untracked.test.ts:134` waits `setTimeout(resolve, 100)` and then asserts `trash` was not called, a wall-clock wait that breaks `spec.md:64`. The brief does not say whether item 4 (replace the wait) comes before item 3 (judge the tag), and no verify item checks `spec.md:64`. T1b's brief check raised this as The question 3.
- Item 5: yes (Cases 1, The step line 1 and 2).
- Item 6: yes (Names 3; Implied inputs, the probe).
- Item 7: yes. No check greps each deleted or renamed path. T1b's brief check closed this with a verify item.
- Item 8: yes (see the allow-duplication case).
- Item 9: yes (see the step line's check).
- Item 10: yes. The parenthetical narrows "every sentence", so `context-guard.test.ts:5` and `spec.md:37` can go unreported.

Findings: every "yes" above, in particular the following.
1. The tree-check tagging leaves `test:checks` green without its checks.
2. Verify 3 runs over changed files only, a lesson of T1c's round that the brief lacks.
3. No guard keeps the tests in T1e's folders that T1c's removals cite as holders.
4. The report has no per-file "kept whole" row.
5. `page.test.ts:106` is not caught by verify 4.
6. Item 4 is not ordered before item 3 for `untracked.test.ts:134`.
7. No grep checks items 7 and 10.

## 6. Implied inputs

This is a judgment step over tests. These are the inputs the sweep will meet that the brief does not settle:

- The checks' own fixture cases: item 5 covers them, except those of `audits.test.ts`, which Decision 6 shuts out (The step line 1).
- The allow lists beside the checks:
  - `allow-audits.txt`: T1d's deletions make it stale and nobody may edit it (The step line 1). Missing.
  - `allow-negatives.ts`: `NEGATIVES = {}`, so nothing to settle.
  - `allow-styling.ts`: keyed on `src/` selectors, so nothing to settle.
  - `utils/size-allow.txt`: no entries, so nothing to settle.
  - `allow-duplication.txt`: the overlap and ownership (Names 5). Missing. The expected result is the rule T1b's brief check closed with: each sweep removes only an entry its own change makes stale, the "at N and M" line numbers left unchanged or rewritten by one named step, and `shared_paths` recorded.
- Tests of the scripts under `utils/` (`checks/utils/`): `cited-lines`, `claude-usage` (slow), `migrate-joint-work` (slow, a one-shot hub migration, `utils/migrations/migrate-joint-work.mjs`), `outside-paths`, and `rename-pillar` (a one-shot migration, `utils/migrations/rename-program-to-pillar.ts`; its head has no layer label). None of them reads the whole tree, so item 5 does not cover them, and the brief has no case for them. Missing. The expected result is a stated rule: judged under item 1 like any test, a migration that has already run on the hub judged by whether a rerun can still cost work.
- `data/real-hub.probe.ts`: it is "not a test", is run by hand with `node tests/data/real-hub.probe.ts` (:1-5), and nothing imports it. "Judged like a helper" therefore deletes it automatically under item 6. `spec.md:37` relies on it, and running it reads `config/local.yml` through `loadLocal`, which the builder may not do. Missing. The expected result is its own verdict as a case, plus the `spec.md:37` sentence in Doc text if it goes.
- `data/snapshot/build-timing.test.ts` (slow): a measurement that prints times and asserts only what it fed (head :1-4). T1b's brief deletes such a test ("a measurement that asserts nothing a user relies on", Decision 4), and T1e's brief has no rule for it, a disagreement with no reason given. Missing. The expected result is the same bullet as T1b, or the reason T1e differs.
- Tests that start a process through imported code (`refs`, `untracked`, `latex`): missing. The expected result is a slow tag by cause, with Decision 1 stating that a cause reached through imported code counts. T1b's brief check closed it that way.
- A probe at module load moved into a slow describe's `beforeAll` (T1c round ruling 2, now in T1b's item 3): T1e's item 3 has only the cold-start sentence. No module-load process was found in T1e's folders (`grep -rnE "'-V'|which |command -v|skipIf\(" ...` gave nothing relevant), so the rule is missing only for consistency with the other briefs.
- Helpers inside these folders that nothing imports after the sweep (`routes/edit/write-fixture.ts`, `routes/files/open-fixture.ts`, `routes/git/request.ts`, `routes/replace/replace-fixture.ts`, `routes/sessions/terminal-fixture.ts`, `data/prose/latex-headings.ts`, `checks/config/options-findings.ts`, and others): item 6 deletes unused helpers only under `tests/fixtures/`. T1b, T1c and T1d delete an unused helper in their own folders. That is a disagreement with no reason given. Missing.
- Helpers of other sweeps' folders imported here (`tests/server/edit/writes-fixture.ts`, `root/context-fixture.ts`, `machine/commands/commands-fixture.ts`, `machine/line-counts.ts`, `files/history-fixture.ts`, `files/ops-fixture.ts`, `git/refs/repo.ts`, found with `grep -rn "from '\.\./.*server/" tests/routes`): an export that T1e's deletions leave unused. Missing. The expected result is that it is named in the report for T1c, never deleted.
- Helpers here imported by the other sweeps' folders (`checks/source/code.ts`, `checks/walk.ts`, `routes/edit/write-fixture.ts`, `routes/sessions/terminal-fixture.ts`): Decision 2 covers them, but "What is on the tree" does not list them, as T1c's and T1d's briefs list theirs.
- A `src/` export left with no importer once a test goes (T1c's refuter, Standards 4, `subscriptionChannels`; `spec.md:83`): missing. The expected result is that it is named in Doc text for removal at landing, as T1b's brief check closed it.
- The layer label item 7 requires: a loop of `head -1` over the 151 `.ts` files finds 89 with no label and 13 spellings ("Layer 4, test" 18, "Layer 4, test helper" 15, "Layer 4, route test" 9, "Layer 2, server tests" 4, "Layer 1, data test" 4, "Layer 4, tree check" 2, and so on). Missing. The expected result is that the brief names the label for a route test, a data test, a check and a helper.
- Kept files within 20 lines of the cap (`spec.md:45`): `routes/edit/write.test.ts` 891 and `checks/diagrams/diagrams.test.ts` 882. Missing. The expected result is that a changed file left at 880 lines or more is split by concern, within the folder limit (`routes/edit` holds 9 items).
- The base copy (`spec.md:32`): the brief names none. `ls -d .agents/worktrees/*base*` finds none, and item 9's "before" figures and any restore need the unchanged tree. Missing.
- The tests in T1e's folders that T1c's removals cite as holders (The question, item 1), and the T1c Doc text line for `routes/machine/commands.test.ts:8` (Names 4): missing. The expected result is that each is kept, or that a removal names its replacement holder.

Findings: each "Missing" above.

## 7. ADRs

- `ls tools/oculus/docs` prints `diagrams`; `ls docs/adr` from the repository root prints "No such file or directory"; `grep -n "adr" .agents/plan.yaml` exits 1; `grep -n "adr:" orchestrator-state.md` exits 1. There is no ADR record.

Findings: none.

## Declined to judge

- Whether deleting a tree check that guards nothing (item 5), or `audits.test.ts` itself, is a user-visible choice that must go to Axel or a fix within the step line. This is the user's call. Either way it needs a booked ruling before dispatch, because T1d's verify cannot pass while `audits.test.ts` stands as it is.
- Whether the tree checks should leave `test:checks` for the slow tier, given their measured times (boundaries 2209 ms at load 11.9). That shapes T1a's quick list, which belongs to Z351 and Z363.
- Whether `describe(name, { tags: ['slow'] }, fn)` excludes the tests of a file that uses vitest's own `it` (`routes/page.test.ts` imports `it` from vitest, not from `fixtures/scratch.ts`). Probing it needs a test file written under `tests/`, and this check writes nothing.
- A runtime probe of every test in these folders for processes and sockets, as T1c's refuter ran. The prompt allows single files only. One file was run (boundaries.test.ts).
- Whether the one-shot migration scripts under `utils/migrations/` are still wanted, which decides their tests. That is outside what a read can settle.

Agent usage: claude-opus-5-5. Tokens and minutes were not measured by this agent. About 62 tool uses.


Completion notice: 250,547 tokens, 78 tool uses, 10.2 min (agent a32c33ef3cf8c3734).

## Closed

- Names 1 and The question 7 (`context-guard.test.ts:5`, a comment on a kept file): item 10 now covers every sentence anywhere outside the paths that the sweep makes false, that line named; verify 6 greps each deleted or renamed path.
- Names 2 and Implied inputs (the probe): `data/real-hub.probe.ts` is a case, kept and never run, since `spec.md:37` names it.
- Names 3 (fixture exports the other sweeps leave unused): item 6 says the orchestrator removes them at the landing of the last of the four sweeps, since they are unused only once those sweeps have landed; booked in the state file.
- Names 4 (T1c's Doc text for `routes/machine/commands.test.ts:8`): item 7 tells the builder to leave that line, which T1c's landing rewrites.
- Names 5 and The step line 3 (allow-duplication overlap): the step writes lines 26-29, 31-36, 38 and 47, removals only; an entry of line 30 (T1b's) or 37-46 (T1c's) made stale is named and removed by the orchestrator at landing; lines 9 and 10 are named as the header.
- Names 6 and Cases 2 (`size.test.ts:10-11` and `:133`): the false sentence is a premise and is corrected; the case keeps the run and drops the assertions over the script's text, under item 1's new paragraph on a kept test's deleted-kind assertion.
- The step line 1 and Cases 4 (`audits.test.ts`): booked as an open item for Axel; T1e leaves the two files and T1d waits for the ruling.
- The step line 2 (item 5's carve-out): kept, with its reason stated: each check was added by a step Axel approved, so removing one reverses that approval and is his. A check guarding no written rule is named for him.
- Premises 1: 16 tests, with the planted string named.
- Premises 2 and The question (item 3): the three files starting processes through imported code are listed; item 3 and Decision 1 count a cause reached through imported code; verify 3 runs over every file with a cause, changed or not.
- Premises 3: the document and config lines are named in item 10.
- Premises 4: lines 9 and 10 named as the header.
- Premises 5: `HELP.md:344` and `:346`.
- Cases 1 (tree checks slow by Decision 1): a tree check is never tagged; `test:checks` runs with no timeout and stays the verify list's tree check; tiering is T1a's. Item 3 and Decision 1 say so.
- Cases 3 (`retired.test.ts`): judged under item 5 against `spec.md:66`.
- Cases 5 and The question 5 (`page.test.ts:106`): in the case; verify 4 also checks that no read of `+page.svelte` is left.
- The question 3 (holders T1c cites): listed, item 9 and verify 7 keep them or name the new holder.
- The question 4 (no per-file row): item 9 lists every file, "read, kept whole" included.
- The question 6 (`untracked.test.ts:134`): item 4 replaces the wait before item 3 judges the tag; a case.
- The question, verify 4 (template-literal titles): the grep matches all three quote forms.
- Implied inputs, the `utils/` script tests: judged under item 1 like any test; nothing more is needed.
- Implied inputs, `build-timing.test.ts`: deleted as a measurement, the same bullet as T1b.
- Implied inputs, helpers in these folders and in other folders: item 6 deletes an unused helper of these folders and names one of another folder for its sweep; the lists are premises.
- Implied inputs, a `src/` export left with no importer: in item 10.
- Implied inputs, layer labels: item 7 names them.
- Implied inputs, files near the cap: item 4 splits a changed file left at 880 or more.
- Implied inputs, the base copy: `.agents/worktrees/T1e-base/tools/oculus/`, a premise.
- `vi.waitFor` and the hook time (from T1b's and T1d's checks): item 4, item 3 and Decision 7.
