# Step D71 refuter report (on .agents/worktrees/D71, base 1568cf1ed)

A page this report cites is named with its section; a finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
# 1, from tools/oculus (Node v24.21.0)
npm run diagrams && npm run test:quick
  ok ASCII gate (0.5 s) | ok prettier (0.5 s) | ok eslint (1.7 s) | ok svelte-kit sync (2.2 s)
  ok svelte-check (8.5 s): ... 483 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok vitest (53.5 s)
  test:quick: 54.1 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  (lists integrity.test.ts, keys.test.ts, boundaries.test.ts as test:checks and roots.test.ts,
   deposit-compare.test.ts, deposit.test.ts as test:slow)
npx vitest run tests/checks/config/integrity.test.ts tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/routes/edit/roots.test.ts tests/server/git/deposit-compare.test.ts tests/server/git/deposit.test.ts
  Test Files 6 passed (6) | Tests 43 passed (43)

# 2
LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)
  prints nothing (find also prints "bfs: error: bin: No such file or directory": tools/oculus has no bin/)
LC_ALL=C grep -n '[^ -~]' <16 manifests> <2 demo manifests> docs/DATA-MAP.md .oculus/config/sources.yml <cockpit files>
  manifests, DATA-MAP, sources.yml: nothing. Cockpit HELP.md and layout.yml: their existing glyph lines
  (e.g. layout.yml:109-122, HELP.md:9-345); no changed line is among them.

# 3
sh utils/unused-exports.sh ; diff with D71-base/tools/oculus/unused-exports.txt
  Unused exports (246) against (243). Added: manifests.ts cloneSiteOf; picker.ts pickerScript (was PICKER_SCRIPT);
  clone/clone.ts defaultBranchOf; clone/exclude.ts BLOCK_START, BLOCK_END, escapedForIgnore, excludeLines,
  excludeFileOf, withBlock; layout/index.ts UNSAVED, layoutKey, unreadKey; saved/storage.ts layoutKey, unreadKey;
  palette.ts nameOfAddress; the rest are moved paths. Matches the report's list.

# 4
wc -l over every changed or new file under tools/oculus/src (printing those within 15 of the limit)
  871/880 server/git/deposit/deposit.ts | 877/880 server/root/watch/portfolio.ts
  520/520 shell/keys/Palette.svelte | 518/520 views/boards/deposit/Deposit.svelte
sh utils/folder-check.sh  -> exit 0

# 5, from the worktree root
python3 tools/cockpit/build.py --selftest
  projects: 94 real | 0 ghost ... ❌ SELFTEST FAIL - 6 broken reference(s) + 33 validation error(s)  (exit 1)
  same command in the main checkout: the same 39 lines (diff of the failure lines prints nothing)
bash tools/cockpit/tests/run.sh  -> Ran 19 tests ... OK ; PASS - 11 modules load in order, 20/20 window.CK exports present
python3 -c "import yaml,glob; ..."  -> prints nothing, exit 0

# 6
grep -rn "repos\.yml\|softwareRows\|Coverage.svelte\|views\.code\b" tools/oculus/src ... tools/cockpit/src  -> nothing, exit 1

# 7 (new tests on the unchanged tree: a scratch copy of D71-base's src, tests and config with the worktree's node_modules)
npx vitest run tests/server/sessions/usage-sessions.test.ts tests/state/workbench/layout/folder-opener.test.ts
  usage: AssertionError: expected [ 'my-run', 'plain-run', 'usage-run' ] to deeply equal [ 'my-run', 'plain-run' ]
  folder-opener: 4 failed (expected -1 to be 3; expected [ 'files', 'search', ...(4) ] to include 'deposit'), 4 passed
  (matches the report's first run)

# Cases 15 and 28: a manifest reader (readManifests over each hub's .oculus/config/sources.yml scan)
node reader.ts <base engine> D71-base ; node reader.ts <worktree engine> D71 ; diff
  base 97 lines, worktree 113, 0 removed, 16 added (the 16 new manifests), 0 finding lines in either

# The report's open item, reproduced in scratch repositories with git
hub with side-projects/p/project.yml committed, clone into p, exclude '/side-projects/p/*' '!/side-projects/p/project.yml'
  git status --porcelain -uall  -> (nothing)
mv p q, exclude rewritten for q
  git status --porcelain  -> " D side-projects/p/project.yml" "?? side-projects/q/"
  git add side-projects/q/project.yml ; git add -f ...  -> silently adds nothing
  git update-index --add side-projects/q/project.yml  -> "A  side-projects/q/project.yml"
  git rm --cached side-projects/p/project.yml ; git add -A ; git status  -> "R  side-projects/p/project.yml -> side-projects/q/project.yml"
never-committed project.yml (the Clone from GitHub shape)
  git status -> "?? side-projects/" ; git update-index --add side-projects/p/project.yml ; git add -A
  git status -> "A  side-projects/p/project.yml" ; git ls-files -> side-projects/p/project.yml, x.txt (no gitlink)

# The nested-manifest exclude lines, in a scratch repository
exclude '/p/*' '!/p/.oculus' '!/p/.oculus/project.yml' ; files p/a.txt p/src/b.txt p/.oculus/{project,commands,local}.yml
  git status --porcelain -uall -> "?? p/.oculus/commands.yml" "?? p/.oculus/local.yml" "?? p/.oculus/project.yml"
exclude '/p/*' '!/p/.oculus' '/p/.oculus/*' '!/p/.oculus/project.yml'
  git status --porcelain -uall -> "?? p/.oculus/project.yml"

# Other reruns
npx tsc --noEmit -p .  -> 3 lines, all TS2614 "no exported member 'CardAction'" from *.svelte imports (svelte-check: 0 errors)
git diff 1568cf1ed --stat -- state/sources/repositories/repositories.ts change-tree.ts RepoList.svelte repositories/diff/  -> nothing
cat <main repo>/.git/info/exclude  -> no oculus block (no test wrote into the real repository)
```

## Verdicts

Items of "What to build":

- 1: holds. layout-workspaces.test.ts and save-turn.test.ts pass; storage.ts keys `oculus.layout.workspace:<identity>`; the report names `oculus.layout.workspace:/Users/axelfaes/workspace/research-hub/.oculus/workspaces/research-hub.yml`.
- 2: holds, with Behaviour 2. workspaces.test.ts "Close Workspace" and "New Workspace" pass.
- 3: holds. The one listing consumer of `transcripts/stores.ts` is `sessions/stores/transcripts.ts` (grep of imports); the usage fold keeps counting; the test fails on base as the report says. Behaviour 4 on cost.
- 4: violated in part. The additions hold (deposit-compare.test.ts passes, folder-opener.test.ts passes and fails on base); Behaviour 3 (the upstream "N ahead" is removed) and Standards 1 (the mirrors-only gate of deposit-git.ts is bypassed by an export while its comments still promise it).
- 5: holds. Case 15's reader run reproduces: 97 identical lines and the 16 new ones.
- 6: violated in part, Spec 3 (Save As drops an invalid depth).
- 7: violated, Behaviour 1 (a nested `.oculus/project.yml` clone leaks its `.oculus/` folder into the hub's git) and Spec 1 (exclude file found by a substitute rule).
- 8: violated in part, Spec 2 (the workspace entry and the project.yml Clone from GitHub writes are not in History) and Spec 6 (no typed-URL row until an address is typed).
- 9: violated in part, Standards 4 (DATA-MAP, docs/apps.md, DESIGN.md, HELP.md and the cockpit HELP say things the step made false). The data moves hold: 16 manifests match decision 7 field by field against base `registries/repos.yml`, both repos.yml gone, check 6 clean. Spec 5 on schema.py.
- 10: partial. The block, its rewrite, user lines and follow on move hold (clone-exclude.test.ts, file-undo.test.ts pass); Behaviour 1 and Spec 1 apply; the git status clause of cases 31 and 32 is not met (Proof 1).

Cases:

- 1: met, layout-workspaces.test.ts "is saved and shown again...", "the storage event", "the turn of the desktop host", "the workspace answer".
- 2: met, "Save As ..." and "reads no key and writes none before it has come".
- 3: met, workspaces.test.ts "Close Workspace: ... the file as it was"; the look is not taken.
- 4: met, workspaces.test.ts New Workspace rows (lab2, first hub, held, '', '..', 'a/b', no-hub, unwritable).
- 5: not verifiable here (DOM look). Reading: palette-modes.ts:43-45, Files.svelte:280-283, app.yml:57-60, files.yml:98,112.
- 6: met, usage-sessions.test.ts; it fails on base with the quoted assertion.
- 7: met, deposit-compare.test.ts "the diff of a changed file of the sync plan".
- 8: met, deposit-compare.test.ts "the comparison with origin/main" (behind 1; ahead 1 behind 1; differ list; head, branch and status unchanged by Fetch).
- 9: met, deposit-compare.test.ts "the projects that have a deposit" (see Proof 3 on :221).
- 10: met, folder-opener.test.ts (5 titles); base fails 4 as the report says.
- 11 to 14: met, manifests.test.ts:248, :266, :282, :297 and hub-folders.test.ts:189, :195 (pass in the quick run).
- 15: met, my reader run (97 identical, 16 added, 0 findings).
- 16: met, git-scan-depth.test.ts (-1, 2, global, live init) and hub-folders.test.ts finding rows.
- 17: met for whole-number depths (workspaces.test.ts, roots.test.ts); an invalid depth is dropped by Save As, Spec 3.
- 18: met, clone-exclude.test.ts "hides a clone made in the hub and keeps the project.yml tracked" (staged == []).
- 19: met, clone.test.ts "refuses a repository that tracks a file the folder holds...".
- 20: met, git-scan-depth.test.ts "the repositories cloned for projects"; ProjectCard.svelte:139-144 offers Clone only when `!block.cloned`.
- 21: met, excludeLines row "/site/*" and manifests.test.ts:441, :457.
- 22: met, clone.test.ts "follows a default branch that is not main", "refuses a remote with no branch".
- 23: met, clone.test.ts and routes/git/clone.test.ts "refuses an address that does not answer...".
- 24: partial, the `my #dir [a]` line is checked as text only and no git status is run over such a folder (Proof 4); worktree and no-repository halves met.
- 25: partial, Spec 6 (no typed-URL row beside the two rows until an address is typed); the manifest fields and the clone are met by routes/git/clone.test.ts.
- 26: met, routes/git/clone.test.ts "adds a folder under no scan folder..." and WRITES_NOTHING rows; state/sources/clone.test.ts "sends nothing when the reader cancels the panel".
- 27: met, routes/git/clone.test.ts "names gh auth login when $name".
- 28: met by the reader run above; the brief's `npx vitest run tests/data/real-hub.probe.ts` is not a test (its head says to run it with node) and was not run (Declined).
- 29: met by reading: config/layout.yml:67 five boards, :89 `[venues, data, statements]`; check 6 clean.
- 30: partial. run.sh passes; `--selftest` fails with the same 39 lines as the main checkout, so the step adds no failure and the case's premise (a pass) does not hold on main either.
- 31: partial, the block lines are met (clone-exclude.test.ts "moves the lines with a project folder renamed through the Explorer"); the git status clause is unmet as built (Proof 1).
- 32: partial, the same, and the test calls `read()` itself rather than the watcher's read (Proof 4).
- 33: met, "keeps the lines of the user above and below the block byte for byte".
- 34: met, file-undo.test.ts "a move of a folder holding a project whose clone_dir leaves it" (passes).
- 35: met, "loses the lines of a project folder that is removed".

## 1. Spec

1. src/lib/server/git/clone/exclude.ts:16-17, :76-95: "The file is found without running git: the hub's `.git` is a folder, or a file naming the folder of a linked worktree"; what is wrong: items 7 and 10 name "the file `git rev-parse --git-path info/exclude` names"; the substitute returns null for a hub that is a folder inside a larger repository (report, Judgment calls: "a hub nested in a larger repository is not handled"), where git would name that repository's exclude; failure scenario: a hub kept as a subfolder of another repository clones a project; no block is written and every file of the clone shows in that repository's git status; verdict: item 10 partial. Disclosed.
2. src/routes/api/(git)/clone/+server.ts:30-33: "const done = addFolder(server.workspace.open(), dir); return 'error' in done ? done.error : null;" and src/lib/server/git/clone/github.ts:176 "writeFileSync(join(dir, MANIFEST), manifest);"; what is wrong: Conventions: "Every write to a hub file or a workspace file ... is undoable from History as the existing workspace writes are." `addFolder` returns the change `records` (folders.ts:55-56) that the write route logs for Add Folder (config-write.ts:125); the clone route drops them, and the new project.yml gets no record, where the New project scaffold logs one (manifest.ts:735-743); failure scenario: Clone from GitHub into a folder outside every scan folder adds a workspace entry that History does not list and Undo cannot take back; verdict: item 8 violated in part.
3. src/lib/server/files/workspace/actions.ts:31-45 (`workspaceText` writes `one.scanDepth`, the parsed value): what is wrong: item 6: "The folder writer ... and Save As keep the key on every entry they carry"; Save As writes only a valid depth, so `repository_scan_depth: abc` is dropped (report, Judgment calls: "Save As carries only valid depths"); failure scenario: an entry with a mistyped depth is saved as a new workspace; the finding that named the entry is gone and the mistake is lost silently; verdict: item 6 violated in part, case 17 met only for valid values. Disclosed.
4. Report, "Prohibition disclosures": "I ran one read-only `git -C . status` by mistake ... and one read-only `git check-ignore -v`", and listed the main checkout's `.oculus/workspaces/`; what is wrong: the brief and spec.md "Where you work": the builder runs no git command at all and works in the worktree and nowhere else; failure scenario: none observed (read-only); recorded as a breach of the standing rules. Disclosed.
5. tools/cockpit/src/cockpit/schema.py:110-117 (8 rows added); what is wrong: the file is not in "Paths this step writes"; the report gives the reason (the cockpit's completeness gate flagged `tags` and `repository.*`); failure scenario: none in behaviour; the orchestrator should know the path list was widened. Disclosed.
6. src/lib/state/workbench/palette.ts:637-669 (`cloneRows`): "const address = addressLike(typed) && !repos.some(...)"; what is wrong: item 8 asks for "a row that takes a typed URL" and case 25 for "two rows plus the typed-URL row"; with nothing or a plain word typed there is no such row, it appears only once the text looks like `https://`, `ssh://` or `git@` (clone-rows.test.ts:33-36 asserts the rows for '' are the repositories alone); failure scenario: a reader opening `:clone` sees only the account's repositories and nothing tells them an address can be typed; verdict: case 25 partial.

## 2. Proof

1. Report, "Open item 1": "a clone folder whose project.yml the hub does not track cannot be tracked by the hub" and Option A "a manifest of such a project cannot be committed in the hub"; what is wrong: the cause reproduces (a folder holding a `.git` with no index entry under it is an embedded repository; `git status` shows `?? side-projects/q/`, porcelain `git add <path>` and `git add -f` add nothing, `git add -A` records a gitlink), but the limit does not: `git update-index --add side-projects/q/project.yml` puts the manifest in the index, after which status shows only the rename and `git add -A` records `R side-projects/p/project.yml -> side-projects/q/project.yml` with no gitlink; the same holds for a never-committed project.yml (verification block); decision resting on it: Axel's choice between A and B is offered without an option in which oculus (or the reader) indexes the manifest at its new path, and cases 31/32's status clause is called impossible when it is reachable; failure scenario: Axel picks B (a subfolder clone layout) to escape a limit that a one-line index write removes; verdict: cases 31, 32 partial. Which option is right is Axel's (Declined).
2. Report, DONE table row 6: "`state/sources/repositories/repositories.ts`"; what is wrong: the step does not change that file (`git diff --stat` prints nothing; the brief reserves it for D64); failure scenario: the orchestrator looks for part 6's code in a file D64 owns; no behaviour effect.
3. tests/server/git/deposit-compare.test.ts:212-221: "['nested', 'nested.py', true] ... expect(wrong || planned.ok).toBe(true);"; what is wrong: for the workspace folder project with `.oculus/project.yml` the sync's `ok` is never asserted (the expression is `true` whatever `planned.ok` is) and nothing says why; the flag is named `wrong`; failure scenario: the sync of a nested-placement project fails with `ok: false` and the case still passes, as long as the plan lists the file; verdict: case 9 met for the files and the mirror text, not for the outcome.
4. tests/server/git/clone-exclude.test.ts:63-69 and :257-266; what is wrong: case 24 asks that the hub's git status hide a clone named `my #dir`, the test compares the escaped line text only; case 32 asks for "the read the watcher triggers", the test calls `read()` (buildPortfolioWithSchemas plus syncExclude) itself; failure scenario: an escaping that git reads differently, or a watcher that does not rebuild on an outside `mv`, passes both; verdict: cases 24 and 32 partial.
5. Report, "Visible changes" 4: "Deposit view ... Before: none of these"; what is wrong: base showed the current branch's commits ahead of its upstream (base Deposit.svelte:229-231, `deposit.ahead '{0} ahead'`), which this step removes; failure scenario: the look at landing does not check the removed count; see Behaviour 3.

## 3. Standards

1. src/lib/server/git/deposit/deposit-git.ts:136-147: "/** The real git, private to this module so the refusal below is the only way to it. */ function git(...)" followed by "export const realGit: GitRunner = git;"; also :5-7 "Every command here therefore runs in a directory under that mirrors folder and nowhere else", and :27 "the one caller is deposit.ts"; what is wrong: spec.md comment rule (comments say what the code does now); the module's one gate (`run`, :153-160, refusing any directory outside the mirrors folder, the property DESIGN.md "Fixed git choices" and the deposit decision rely on) is now bypassed by an exported raw runner used by clone/clone.ts:27-33, while three comments still state the gate is the only way; clone-routes.ts:24 and deposit-compare.ts also import the module; failure scenario: a reader trusts the comment that no git from this module runs outside `~/.oculus/deposits` and reuses `realGit` elsewhere. The clone runner belongs in a module of its own, or the comments must say what is true.
2. src/lib/server/files/project/clone-dir.ts:10-12: "const followed = applyFollow(planned, from, to);"; what is wrong: the signature is `applyFollow(pending: Pending[], to: string)` (:151); failure scenario: a reader copies the example and passes three arguments.
3. src/lib/shell/keys/Palette.svelte (520 lines, the limit): the diff removes "and never mounts a view of its own", "so the list and the viewport are one box", "and the query is bound to the window, which reads the mode the palette is in", "so typing does not start it again"; what is wrong: spec.md size rule: comments are not shortened and code is not compacted to stay under the limit; failure scenario: the reasons a maintainer needed (why the viewport is one box, why the query is untracked) are gone from the file. Deposit.svelte (518), portfolio.ts (877) and deposit.ts (871) sit at the limit too.
4. Docs the step made false:
   - docs/DATA-MAP.md:67: "the `scan:` entry is `optional: true` and the folder is absent" (projects/software/ now exists).
   - docs/DATA-MAP.md:73: "drawn, edited and built (LaTeX) as a project of that tier, without Deposit" (part 4 gives every project a deposit).
   - docs/DATA-MAP.md:554: "The form opens ... the `repository.*` fields and `paths` empty, since it does not show their current value" (src/lib/state/forms/schema.ts:343-349 fills every `repository.*` field).
   - tools/oculus/docs/apps.md:324: "`repository?` (`{ root, dir }`, the workspace folder's name and the absolute folder ...)": the Project field is now `workspaceFolder?` (model-entities.ts:412) and `repository?` is the manifest block (`RepositoryBlock`, :228-238, :362), a changed shape an app reads.
   - tools/oculus/DESIGN.md:647: "a project of a repository is in `entities.projects` with the folder's name for its `id`, `repository: { root, dir }`" (same rename).
   - tools/oculus/HELP.md:237: "Its card is the project card, with ... from its `repository:` block, the repository it lives in": no view renders the block's url (grep of `project.repository` in src/lib/views and src/lib/state finds ProjectCard.svelte:140, the Clone action, and forms/schema.ts:303 only).
   - tools/oculus/HELP.md:474 (`:clone` bullet) ends "A folder project whose id is another project's id is a finding naming both, and the folder's project is left out. Gaining or losing `.oculus/config/` changes whether a folder is a hub at the next build.": two sentences of the workspace-folder project bullet (:472), moved into the Clone bullet they do not belong to.
   - tools/cockpit/data/HELP.md:210 and :252 still list "💻 Code" under Collections after the Code tab left tools/cockpit/data/config/layout.yml for the real hub.
   Failure scenario: a reader of the Data map, the apps page or Help is told the opposite of what the app does. Verdict: item 9 violated in part.
5. Comment lines left short mid-paragraph after edits: deposit-git.ts:27 (86 characters, "itself reached only"), git-start.ts:3 ("it reads with"), deposit-routes.ts:7 ("carries two things: the"), edit/writes/manifest.ts:7 ("The fields a"), data/sources/manifests.ts:295 ("the project's `category` when"); what is wrong: the writing standard's paragraph rule (no hard break at an arbitrary column); failure scenario: none in behaviour; the files read as unrewrapped edits.

## 4. Behaviour

1. src/lib/server/git/clone/exclude.ts:55-58: "for (let at = 1; at <= parts.length; at += 1) { lines.push(`!${patternOf(join(folder, ...parts.slice(0, at)))}`); }"; what is wrong: for a clone whose manifest is `.oculus/project.yml` with `clone_dir: .`, the lines are `/p/*`, `!/p/.oculus`, `!/p/.oculus/project.yml` (clone-exclude.test.ts:47-55 asserts them as text); `!/p/.oculus` re-includes the whole folder, so git status shows every file the clone keeps in `.oculus/` (scratch run: `?? p/.oculus/commands.yml`, `?? p/.oculus/local.yml`); adding `/p/.oculus/*` after the folder line leaves only `p/.oculus/project.yml` (scratch run). The report lists "ancestor `!` lines" as a judgment call without this consequence; failure scenario: a repository with `.oculus/project.yml` (the placement HELP names for a repository project) is cloned into a hub; its `.oculus/local.yml`, this machine's own values, appears untracked in the hub and a `git add -A` there stages it; item 7 ("the hub's git shows neither the clone nor its files") and G80 do not hold for this placement; verdict: item 7 violated, item 10 partial.
2. src/lib/server/files/workspace/actions.ts:84-88 (`makeWorkspace`, shared by New): "unsaved: { folders: [] }"; what is wrong: New Workspace from the unsaved workspace empties the unsaved workspace's folders, which are saved nowhere (Save As puts them in the file; New writes `folders: []`); workspaces.test.ts New Workspace asserts `state.unsaved.folders` toEqual([]); the brief asks only Close to return to an unsaved workspace with no folder, and the report's visible changes do not state it; failure scenario: a reader working unsaved with three folders runs `:workspace-new lab`, then Close Workspace, and finds the unsaved workspace empty; verdict: item 2 holds, this is an unstated change.
3. base src/lib/views/boards/deposit/Deposit.svelte:229-231 "{#if one.ahead > 0}<span class="mt">{t('deposit.ahead', one.ahead)}</span>" removed, with base deposit.ts:815-816 (ahead of the upstream); what is wrong: the brief: "Behaviour that exists today stays, except where a part below changes it"; part 4 adds counts against `origin/main`, it does not remove the count against the branch's upstream; on a branch whose upstream is not `origin/main` the two differ; failure scenario: a reader on a pushed side branch sees "N ahead" of origin/main and cannot tell whether anything is left to push; verdict: item 4 violated in part.
4. src/lib/server/sessions/stores/transcripts.ts:330-333: "claudeTranscripts(store, windowDays, 0)" (was capped at `maxSessions`); what is wrong: every scan now lists and stats every transcript in the window before folding stops at `maxSessions` kept; the cost is not measured and the report does not mention it; failure scenario: an account with many sessions in two days pays a longer scan on every rebuild (not verified).

## Declined to judge

- Which option of the report's open item 1 is right: Axel's call. Checked only that the stated cause reproduces and the stated limit does not (Proof 1).
- Every look and DOM press (cases 3, 5, menu items, the Deposit view, the Software board): no app was started.
- The desktop host's turn in a real Electron window: not started; only save-turn.test.ts and layout-workspaces.test.ts were read and run.
- `tests/data/real-hub.probe.ts`: not run, since it reads the sessions of the accounts the hub's local.yml names, which this reviewer may not open; the manifest reader run stands in for cases 15 and 28.
- Whether `theaxec.github.io` counts as cloned and what the hub's git shows of it on main: the orchestrator's check at landing, as the brief says.
- Whether test:quick's time over the limit (54.1 s against 45 s) is the step's: the base was not timed.
- The wording of the 16 manifests beyond decision 7's fields: they carry the old entries' text, Axel's data.

Reviewer usage: agent a54fc03776ec8539e, claude-opus-5-5, about 670,000 tokens from the session budget (15,000,000 at start, about 14,330,000 left), about 75 tool uses after a context compaction (the part before it not counted), minutes not measured.

## Repair round 1, refuted (on .agents/worktrees/D71, base 1568cf1ed)

```
# From the worktree's tools/oculus (Node, macOS). npm run diagrams was not run in the worktree,
# since it writes the committed diagrams; run in a scratch copy of the worktree, then
# diff -rq <scratch>/docs/diagrams <worktree>/docs/diagrams  -> prints nothing, exit 0.

npm run test:quick -- --base 1568cf1ed
  ok ASCII gate (0.6 s) | ok prettier (0.8 s) | ok svelte-kit sync (2.7 s) | ok eslint (2.2 s)
  ok svelte-check (9.7 s): ... 484 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok vitest (51.5 s)
  test:quick: 52.3 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  (lists integrity.test.ts, keys.test.ts, boundaries.test.ts as test:checks; roots.test.ts,
   deposit-compare.test.ts, deposit.test.ts as test:slow)

npx vitest run tests/checks --testTimeout 0 --hookTimeout 0
  Test Files 17 passed (17) | Tests 266 passed (266) | Duration 403.89s

LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)   -> prints nothing, exit 0
sh utils/folder-check.sh                                                     -> exit 0
sh utils/unused-exports.sh ; diff with D71-base/tools/oculus/unused-exports.txt
  Unused exports (243) -> (245). Lines added by the step (moves left out):
  server/git/clone/clone.ts: defaultBranchOf
  server/git/clone/exclude.ts: BLOCK_START, BLOCK_END, escapedForIgnore, lineOf, withBlock
  state/workbench/layout/index.ts: ... UNSAVED, layoutKey, unreadKey ...
  state/workbench/layout/saved/storage.ts: layoutKey, unreadKey
  state/workbench/palette.ts: ... nameOfAddress

Verbose run of every test file the round changed, plus tests/server/git/clone.test.ts:
npx vitest run <18 files> --reporter=verbose
  Test Files 18 passed (18) | Tests 196 passed (196)
  per file: clone-after 10, clone-exclude 24, clone-rows 17, data/sources/manifests 49,
  routes/git/clone 23, state/sources/clone 12, workspaces 12, deposit-compare 7, clone-ask 4,
  git-scan-depth 11, audit 3, usage-sessions 2, server/git/clone 8 (the counts the report gives)

From the worktree root:
PYTHONDONTWRITEBYTECODE=1 python3 tools/cockpit/build.py --dummy --selftest -> SELFTEST PASS, exit 0
run.sh's tests other than test_engine.py (test_engine.py runs the real selftest, Z708, and rewrites
AUDIT_AUTO.md in the worktree, so it was not run):
  test_pillars_tab 4 OK | test_presentation 5 OK | test_sessions 29 OK | test_sessions_group 24 OK
  test_sessions_git 19 OK | test_js_modules.js: PASS - 11 modules load in order, 20/20 window.CK exports present
python3 -c "import yaml,glob; ... + side-projects/finished/*/project.yml + side-projects/research-hub/project.yml ..." -> exit 0
grep -rn "repos\.yml\|softwareRows\|Coverage.svelte\|views\.code\b\|clone_dir\|cloneSiteOf\|realGit" <check 6 paths> -> nothing, exit 1
grep -rn "clone_dir\|cloneSiteOf\|realGit\|clone-dir" . (whole worktree, local.yml, node_modules, .scratch excluded) -> nothing
grep -rn "theaxec\.github\.io/" --include=... . | grep -v "https://\|...\|\.tex"   -> nothing, exit 1
git diff 1568cf1ed --stat -- src/lib/server/files/fs/ops.ts tests/routes/files/file-undo.test.ts src/lib/server/edit/writes/file-undo.ts -> nothing (the clone_dir follow is gone)

Reruns of the report's evidence:
npx tsc --noEmit -p .  -> 3 lines, all TS2614 'CardAction' from *.svelte (as the report says)
diff of side-projects/finished/<key>/project.yml against the pre-round side-projects/<key>/project.yml -> 6 identical
cat side-projects/research-hub/project.yml -> title, tier personal, type active, chips [building], eli5, next, links,
  tags [private, research-hub, infrastructure, tex], repository { url https://github.com/TheAxeC/research-hub, visibility private }
grep of every project.yml under projects/ and side-projects/ for repository: -> 16 files, no url twice; find ... -name .git -> none

The pre-round tree (base copy + agents/reviews/D71-before-round1.patch with its 9 renames, in the scratchpad)
and the base copy, each with the worktree's test file copied in:
  usage-sessions.test.ts  base: 2 failed ("expected [ 'my-run', 'plain-run', 'usage-run' ]", "expected [ 'usage-run', 'run-a' ]")
                          pre-round: 2 passed
  clone-rows.test.ts      base: 17 failed (TypeError: cloneRows is not a function); pre-round: 7 failed (no 'clone:type' row)
  workspaces.test.ts      pre-round: 2 failed (cases 38 and 39 as the report quotes), 10 passed

Reviewer probe (a scratch test in a scratch copy of the worktree, git only in temporary repositories):
syncNested run three times in a row over one hub, block read after each run:
  hub inside a larger repository (top/sites/hub, nested x/y): [["/sites/hub/x/y/"],[],["/sites/hub/x/y/"]]
  git -C top/sites/hub check-ignore -v x/y -> ".git/info/exclude:8:/sites/hub/x/y/\tx/y"
  hub that is a linked worktree: [["/p/q/"],["/p/q/"],["/p/q/"]]
  hub at the top of its repository: [["/p/"],["/p/"],["/p/"]]
```

### Verdicts

Items of D71.md's "What to build", over the whole diff since the base:

- 1: holds. layout-workspaces.test.ts and save-turn.test.ts are in the quick run's selection and pass; no code reads `oculus.layout.v1` (grep prints nothing).
- 2: holds. workspaces.test.ts Close and New rows pass; New leaves the unsaved folders (actions.ts:113, `takesUnsaved` false).
- 3: holds. usage-sessions.test.ts passes; Proof finding P1 on what its second test shows.
- 4: holds. deposit-compare.test.ts passes, the upstream count is back (deposit-compare.ts:86-91, DepositCompare.svelte:45-46), `realGit` is gone; ruling 11's comment finding S1 stands against deposit-git.ts.
- 5: holds. manifests.test.ts placement rows pass; the 16 hub manifests carry no duplicate url and no folder under projects/ or side-projects/ holds a `.git`, so `settle` drops none of them.
- 6: holds. workspaces.test.ts "writes a repository_scan_depth that is not a whole number as it was written" passes.
- 7: holds for Clone as rulings 1 to 5 replace it (routes/git/clone.test.ts, state/sources/clone.test.ts); the exclude part is ruling 6's, below.
- 8: holds as rulings 1, 2, 10 and the addition replace it.
- 9: holds. Check 6 prints nothing, both repos.yml are gone, the moved manifests are byte-identical; Spec finding S3 on a write outside the path list.
- 10 (replaced by ruling 6): violated in part, Behaviour B1.

Cases (the brief's, with 18, 19, 21, 24 to 26 and 31 to 35 replaced by D71-round1.md, and 36 to 44 added):

- 1, 2: met, layout-workspaces.test.ts in the passing quick run.
- 3, 4: met, workspaces.test.ts "Close Workspace ..." and the New Workspace rows (verbose run).
- 5: not verifiable here; the look at landing settles it.
- 6: met, usage-sessions.test.ts first test; fails on base as quoted above.
- 7, 8: met, deposit-compare.test.ts "the diff of a changed file of the sync plan" and "the comparison with origin/main" rows.
- 9: met, deposit-compare.test.ts "names a project of a scan folder in either placement ..." and "syncs the code folder of the project folder, never the one under .oculus"; `planned.ok` is asserted for every row.
- 10: met, folder-opener.test.ts in the passing quick run.
- 11 to 14: met, manifests.test.ts placement rows and hub-folders.test.ts in the passing runs.
- 15: met by the data: no hub manifest's url is another's and no project folder holds a `.git` (grep and find above); the reader run itself was not rerun (Declined).
- 16, 17: met, git-scan-depth.test.ts depth rows; workspaces.test.ts and roots.test.ts in the quick run.
- 18: met, routes/git/clone.test.ts "clones into the project folder of a hub, leaves its project.yml, and the hub git then shows nothing of the clone".
- 19: met, routes/git/clone.test.ts the two "refuses a repository that tracks ..." rows; state/sources/clone.test.ts "opens the panel again when the server holds files back ..." and "sends nothing when the reader cancels the panel".
- 20: met, git-scan-depth.test.ts "the repositories cloned for projects ..."; ProjectCard.svelte:139-142 offers Clone only for `clones.length === 0`.
- 21: met, manifests.test.ts "the address of a repository" and "the clones of a project" rows.
- 22, 23: met, server/git/clone.test.ts (8 passed) and routes/git/clone.test.ts "refuses an address that does not answer ...".
- 24: partial. The escaped names, the worktree hub and the no-repository hub are met (clone-exclude.test.ts); the hub inside a larger repository gets the right line once and loses it at the next rewrite, Behaviour B1.
- 25: met, routes/git/clone.test.ts "clones into <folder>/<name as GitHub gives it>, writes nothing else into it ...", clone-rows.test.ts, state/sources/clone.test.ts "opens the panel at the home folder, clones into the pick and asks what to do".
- 26: met. Cancel, a non-empty target and Add to Workspace are tested; the Undo half is met by reading only: `add` calls `fs.addRoot` (clone-after.svelte.ts:102), the call Add Folder makes (explorer/ops.svelte.ts:661, fs.svelte.ts:822), and no test asserts the History entry.
- 27: met, routes/git/clone.test.ts "names gh auth login when ..." rows.
- 28: met for the data (16 manifests, check 6, both repos.yml gone); real-hub.probe.ts not run (Declined).
- 29: met by reading, config/layout.yml:67 `[projects, coauthor, archive, personal, software]`, :89 `[venues, data, statements]`.
- 30: settled by Z708: the dummy selftest passes and run.sh's other tests pass; the real selftest is not this step's.
- 31: met, clone-exclude.test.ts "has a repository five levels down although the scan depth is 1 ...".
- 32: met, git-scan-depth.test.ts "is written at the start from the repositories on disk, follows a repository moved with mv ..." (the watcher's own rebuild); see Standards S5 on how it waits.
- 33: partial, Spec S4: a user line with no final newline gains one at every rewrite.
- 34: met, clone-exclude.test.ts "keeps a file the hub tracks tracked inside a folder that becomes a repository".
- 35: met, the same git-scan-depth.test.ts case (start and delete).
- 36: met, manifests.test.ts "raises no finding for a registry, collection or deck it inherits and does not hold" and "raises the finding for a registry its own sources.yml names ..."; the build passes `from` for the primary hub (portfolio.ts:717).
- 37: met, manifests.test.ts "a workspace folder whose repository's ..." rows.
- 38, 39: met, workspaces.test.ts; both fail on the pre-round tree as quoted.
- 40: met, deposit-compare.test.ts asserts `ahead` 1 and 0.
- 41 to 43: met, clone-after.test.ts "Open after a clone ..." rows.
- 44: met, clone-ask.test.ts "offers Open and Add to Workspace and Cancel and no third answer" (Cancel is the close control the ruling allows).

Rulings of D71-round1.md:

- 1: holds. github.ts:122-141 runs `git -C <parent> clone -- <url> <parent>/<name>` and writes nothing; no `project.yml` write anywhere under server/git/clone or the clone route (grep).
- 2 and the addition (open item 78): holds. CloneAsk.svelte offers Open and Add to Workspace with Cancel; Open closes a workspace file, asks Save, Don't Save or Cancel over unsaved folders, and an empty unsaved workspace is not asked (clone-after.svelte.ts:75-90). Behaviour B2 on the report's visible changes.
- 3: holds. clone.ts:95-157; the panel starts at `place.dir` (ProjectCard.svelte:258) and reopens on `held` (clone.svelte.ts:104-115).
- 4: holds. `clone_dir`, `cloneSiteOf` and `realGit` are nowhere; `placeClones` (clones.ts:21-55) with `sameAddress` (origin.ts:70-87).
- 5: holds within one hub's read (`settle`, manifests.ts:291-325); see Declined on a clone of another hub's project.
- 6: violated in part, Behaviour B1 (a hub inside a larger repository). The block markers, full-depth walk, start and watcher rewrites, unchanged lines and tracked files hold.
- 7: holds, `unnamedBy` (data/index.ts:345-355) and its three readers.
- 8: holds. The six folders are in side-projects/finished/, the website's project.yml is deleted, research-hub's manifest is as ruled, and the website grep prints nothing; Spec S3 on a project.yml edited outside the list.
- 9: holds (`writtenDepth`, actions.ts:32-51).
- 10: holds (palette.ts:642-677, clone-rows.test.ts).
- 11: partial, Standards S1.
- 12: holds. The four Palette.svelte passages are back (lines 282-283 and the three greps), and the language list is in shell/keys/lists/language-list.svelte.ts; the round removed no comment from Deposit.svelte, deposit.ts or portfolio.ts apart from the head of the removed `syncExclude`.
- 13: holds. My greps of the removed names and the replaced design's words over HELP.md, DESIGN.md, docs/ and src find no stale sentence; DATA-MAP.md:66, :72, :425, :552, :575, apps.md:324, DESIGN.md:647-648 and HELP.md:236-238 and :472-474 read true.
- 14: partial, Standards S6.
- 15, 16, 18, 20, 21: hold (workspaces.test.ts; deposit-compare.ts:86-91; deposit-compare.test.ts; audit/projects.ts diff and audit.test.ts; clone-routes.ts:114 and :129 hold the clone's own folder).
- 17: holds in code (`takeNewest`, sessions/stores/transcripts.ts:338-353); Proof P1 on its test and its timing.
- 19: holds. Each hiding claim runs `git status --porcelain -uall -z`, and the moved repository is found through the watcher (git-scan-depth.test.ts:183-212).

### Findings

- **B1 (Behaviour).** src/lib/server/git/clone/exclude.ts:138-143: "resolve(hub, source) === place.file && Number(line) >= own[0] ...". What is wrong: `git check-ignore -v` names the exclude file relative to the repository's top (`.git/info/exclude`, probe above), and the code resolves it against the hub folder. For a hub that is a folder inside a larger repository (`top/sites/hub`) the block's own line is then read as a rule from elsewhere, the repository is left out, and the next rewrite empties the block; the one after writes it again. The probe shows `[["/sites/hub/x/y/"],[],["/sites/hub/x/y/"]]` over three runs, against a stable block for a top-level hub and for a worktree hub. Ruling 6 names this layout. clone-exclude.test.ts "writes lines relative to the top of a larger repository that holds the hub" syncs once only, so it passes. Failure scenario: a hub kept as `sites/hub` of a larger repository with a clone at `sites/hub/x/y`. Every second watcher rebuild leaves the block empty. In that window the larger repository's `git status` lists `?? sites/hub/x/y/`, and an `add -A` records an embedded repository. The exclude file is also rewritten at every rebuild. Fix: resolve `source` against `place.top`, or compare it with the `--git-path` answer. Verdict: ruling 6 and item 10 violated in part, case 24 partial.
- **P1 (Proof).** Report, "Repair round 1", Cases table, row 17: "usage-sessions.test.ts | passes (behaviour already capped) | passes", under "The unchanged tree is a copy of tools/oculus as at base with each new or changed test file copied in". What is wrong: the claim does not hold on base, where both tests fail (quoted above). The builder's unchanged tree was the pre-round tree for this row and for clone-rows (base: 17 failed on a missing `cloneRows`; pre-round: 7 failed). Two things rest on it. First, the round's change to ruling 17 has no test that fails without it: "do not count towards the cap, and the scan folds no more files than the cap needs" passes on the pre-round tree. Second, the timing quoted (2,000 transcripts, none of them a usage transcript) does not reach the new path. `takeNewest` re-runs `claudeTranscripts` for each pass, and each pass walks and stats every transcript in the window before slicing (transcripts/stores.ts:24-44). So a scan whose newest files include usage transcripts walks the stores two or more times; the cost is not measured. Failure scenario: the refresher's transcripts are among the newest on this machine; every rebuild pays extra full walks, and no quoted number shows how many. Verdict: none (ruling 17 holds by reading).
- **S1 (Standards).** src/lib/server/git/deposit/deposit-git.ts:26-27: "Nothing here is reachable from a watcher, a timer or the socket: the one caller of its operations is deposit.ts". What is wrong: deposit-compare.ts:18-27 imports and calls `diffCmd`, `fetchCmd`, `logCmd`, `revParse` and `showCmd`. Ruling 11 asks that every comment of the module be made true, :27 by name. Failure scenario: a maintainer who changes one of these operations checks deposit.ts's calls only and breaks Fetch or the `origin/main` comparison. Verdict: ruling 11 partial.
- **S2 (Standards).** `sh utils/unused-exports.sh` lines above. What is wrong: spec.md "The principles": an export with no importer outside its own file and its tests is removed or made local. The report keeps `defaultBranchOf`, the five exclude.ts names, `layoutKey`, `unreadKey` and `nameOfAddress` "for their tests". Its list also leaves out the three re-exports the step added to state/workbench/layout/index.ts (`UNSAVED`, `layoutKey`, `unreadKey`). Failure scenario: the unused-export list grows with test-only surface, and a reader of the report does not learn of the index.ts lines. Verdict: none.
- **S3 (Spec).** projects/ideas/tao-of-ecs/project.yml:15 (`next:`) and projects/ideas/tao-of-ecs/README.md:28: "theaxec.github.io/blog/tao-of-ecs/" became "https://theaxec.github.io/blog/tao-of-ecs/". What is wrong: neither line is in "Paths this round writes" (the round names README.md:15 only), and spec.md forbids writing a `project.yml` the brief does not name. The edits make the round's website grep print nothing. The right course was to report that the grep matched a public address. The report discloses the edit. Failure scenario: hub data outside the ruling's list changes under a code step, and a manifest gains a value no ruling asked for. Verdict: none (ruling 8 holds otherwise).
- **S4 (Spec).** src/lib/server/git/clone/exclude.ts:70 and :82 (`text.replace(/\n$/, '')` ... `.join('\n')}\n`), asserted at clone-exclude.test.ts "keeps the lines of the user above and below the block ..." as `${below}\n`. What is wrong: case 33 and ruling 6 say lines outside the block are kept byte for byte. A file whose last user line has no final newline gains one at the first rewrite. Failure scenario: a user's exclude file ending without a newline is changed outside oculus's block by one byte. Verdict: case 33 partial.
- **S5 (Standards).** tests/server/git/git-scan-depth.test.ts:5-7: "nothing waits on a timer: a case resumes on the message of the `git` channel that names the repository", against :203, :206 and :210 `await vi.waitFor(..., { timeout: 10000 })`. What is wrong: the head comment is false for the new describe, and spec.md says a test waits on a signal, never a wall-clock margin. Failure scenario: a slow machine fails the case at 10 s with no defect, and a reader trusts the head comment. Verdict: none (case 32 met).
- **S6 (Standards).** src/lib/server/git/deposit/deposit-routes.ts:8: "// actions that can lose work (commit, push, snapshot, createBranch, switchBranch), a" (85 columns). The next span, "`confirm: true`", fits at exactly 100. What is wrong: ruling 14 names deposit-routes.ts:7, and the paragraph still breaks short. Failure scenario: none in behaviour; the comment reads as unrewrapped. Verdict: ruling 14 partial.
- **S7 (Spec).** agents/reviews/D71-report.md: the file now begins with "## Repair round 1" and holds nothing else. What is wrong: D71-round1.md says "Append a section 'Repair round 1' to your report at the same path". The round-0 report was replaced. That report held the per-entry test files and titles, the first run of cases 1 to 17, the DONE table per part, the judgment calls and round 0's visible changes. It is in neither the main checkout nor the before-round patch (grep of the patch finds no D71-report.md). The round-1 section also names the entry of cases 41 to 44 only as "the clone and workspace entry" and gives no test titles per entry, which the round asks for. Failure scenario: at landing the orchestrator cannot file the tests under `agents/guarded.md` or read the round-0 visible changes against the look without rebuilding them from the diff. Verdict: none.
- **S8 (Spec).** Report, "Disclosures": "in this round `git diff --no-index --stat /dev/null /dev/null` once by mistake". What is wrong: D71-round1.md and spec.md "Where you work": the builder runs no git command. Disclosed, and read-only. Failure scenario: none observed. Verdict: none.
- **B2 (Behaviour).** src/lib/shell/commands/CloneAsk.svelte:38-75 (the Save, Don't Save, Cancel question and the name box, a `Modal` with a `TextInput`). What is wrong: the report's "Visible changes" names only "the Open or Add to Workspace question". The second question and the name box are not described for the look. The name is asked in a box of its own, while the addition says Save "asks the name as `:workspace-save` does". Failure scenario: the look at landing does not open the unsaved-folders path and misses the new box's focus, keys and z-order. Verdict: none.

### Declined to judge

- `npx vitest run --exclude 'tests/checks/**'` (the report's broad run, slow tests included): not rerun. spec.md leaves the slow tests to the landing list, and a slow test may start processes on ports this reviewer may not touch.
- test:quick over its 45 s limit (52.3 s here): whether the time is the step's needs a timed base run, which was not taken.
- `tests/data/real-hub.probe.ts` and a reader run over the real hub for cases 15 and 28: the probe reads the accounts the hub's local.yml names, which this reviewer may not open.
- A workspace folder whose origin is the `repository.url` of a project of a hub other than the primary: `settle` sees only one hub's folders (readHubManifests), so such a folder may be read as a second project. Not probed.
- A project whose `repository.url` is a local path: `addressKey` returns null for it (origin.ts:70-81), so it never counts as cloned. Ruling 4 defines sameness by host and path, so this is not judged.
- The look: every DOM press, the question's buttons, the Deposit view, the Software board, the palette rows.
- `test_engine.py` of run.sh: not run, since it rewrites tools/cockpit/AUDIT_AUTO.md in the worktree and its selftest is settled by Z708.
- The 9,077-line delta: read in full for the clone, exclude, walk, clones, origin, settle, workspace actions, clone-after, CloneAsk, session scan, deposit-git head, audit and Palette hunks and for the tests named above. The moved files (data/sources/documents/, shell/commands/debug/, shell/keys/lists/file-names and lint-config) were checked as moves: diff against base shows only import lines changed. The svg diagrams were checked by regeneration only.

Reviewer usage: agent id not visible to this reviewer, claude-opus-5-5, about 330,000 tokens (15,000,000 at start, about 14,670,000 left), about 80 tool uses, minutes not measured.

## Closed

- Round 1, B1: fixed at landing in `src/lib/server/git/clone/exclude.ts`: the line git names is resolved against the top of the repository that holds the hub and compared by real path (`realOf(resolve(place.top, source)) === ownFile`), so a hub inside a larger repository keeps its block. The test "writes lines relative to the top of a larger repository that holds the hub" in `tests/server/git/clone-exclude.test.ts` syncs twice; the second sync writes nothing and the block stays.
- Round 1, P1: fixed at landing in the session scan: each store is listed once and the newest are folded until `maxSessions` are kept, so a store holding more refresher transcripts than the cap still yields the cap's count of real sessions; `gather` lost its cap parameter. `tests/server/sessions` passes (16).
- Round 1, S1: fixed at landing; the head comment of `deposit-git.ts` names `deposit-compare.ts` and the five operations it calls.
- Round 1, S2: fixed at landing; the test-only exports are made local (`exclude.ts` five names, `clone.ts` `defaultBranchOf`, `storage.ts` `layoutKey` and `unreadKey`, `palette.ts` `nameOfAddress`) and the tests reach them through `syncNested`, `cloneRows` and the layout fixture's literal keys. `sh utils/unused-exports.sh` adds no name against D71-base.
- Round 1, S3: fixed at landing; `projects/ideas/tao-of-ecs/project.yml` and `README.md:28` are as at base, and only the path change at `README.md:15` stays.
- Round 1, S4: fixed at landing; `withBlock` keeps a missing final newline after the block, and the rows of the block table and the test of the user's lines assert the file's own ending.
- Round 1, S5: fixed at landing; the block test of `git-scan-depth.test.ts` waits on the watcher's write, with no timer.
- Round 1, S6: fixed at landing; the comment of `deposit-routes.ts` is rewrapped and the comment-width check passes.
- Round 1, S7: fixed at landing; `agents/reviews/D71-report.md` holds the round-1 section followed by the round-0 report as committed.
- Round 1, S8: disclosed by the builder; the command was read-only and changed nothing, so nothing is to close.
- Landing, the gate: the three new test files that run real git (`tests/routes/git/clone.test.ts`, `tests/server/git/clone.test.ts`, `tests/server/git/clone-exclude.test.ts`) carry `// @module-tag slow`, and the describe of `git-scan-depth.test.ts` that runs real git carries `{ tags: ['slow'] }`, as spec.md's test rule says for a test that runs a real process; under load they ran past the 5 s limit of `npm test`.
- Round 1, B2: closed in the booking, which names the question after a clone (Open or Add to Workspace, then Save, Don't Save or Cancel when the unsaved workspace holds folders, and the name box with the name check `:workspace-save` applies). The look could not reach the question, which follows the macOS folder panel; `tests/state/sources/clone-after.test.ts` and `tests/shell/commands/clone-ask.test.ts` hold it.
- Landing, the look: the Deposit view said "The snapshot holds no project with the id solo:notes." while its first answer was loading; it now shows `deposit.loading` ("Reading the mirror of {0}...") while `held.loading` is true (`Deposit.svelte`, `config/text/views/boards/deposit.yml`).
- Landing, the look: the Present page of a hub whose `sources.yml` never names `portfolio_deck` drew "The folder deck is not there." as an error; the deck route now answers `unnamed` for that hub's missing default deck and the page says no deck is set (`server/content/deck/read.ts`, `model-deck.ts`, the deck route, `files/roots.ts`, `present.ts`, HELP.md, G32), with the test 'answers the portfolio deck of a hub that never names it as unnamed when its folder is missing, and a named one as missing' in `tests/routes/docs/deck.test.ts`, red without the fix (`Expected: "unnamed"`, `Received: "missing"`).
- Landing, the look: the Live HPC view on a hub that names no cluster shows `unreachable` and an error; booked as step D74 (Z855), a change of the HPC float that D71 does not touch.
