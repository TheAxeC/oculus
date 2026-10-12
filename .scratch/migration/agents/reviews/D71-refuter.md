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
