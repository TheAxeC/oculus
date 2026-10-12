# D71 brief check

D71 brief check report (read-only; no file changed, no state-changing git command; no `local.yml`, `~/.oculus` or `secrets` read)

Five findings block or would derail the builder: 4.1 (tests without guarded entries), 4.2 (hub data written with no script), 4.3 (git commands the spec forbids), 4.5 (verify 6 cannot pass inside the write list) and 3.1 (the folder writer refuses the new key).

## 1. Names

Command: `git grep -nIE "<name>" -- . ':!*local.yml' ':!secrets' ':!tools/oculus/.scratch'`, filtered against the write list (brief:107-123). It was run for `repos\.yml`, `softwareRows`, `Coverage\.svelte`, `Software\.svelte`, `oculus\.layout\.v1`, `repository_scan_depth`, `clone_dir` and `project_in_hub`. It was also run for `Code view|Code tab|code collection`.

Hits outside the write list:
1. `tools/cockpit/data/HELP.md:138` `| A **GitHub repo** | registries/repos.yml | Code tab |`. Part 9 makes this false.
2. `tools/cockpit/src/cockpit/render/helpers.py:188`: a comment that names "the curated repos.yml cards". Part 9 makes this false, and brief:50 says every comment naming repos.yml must say what is true. Both hit 1 and hit 2 also make verify 6 fail (see 4.5).
3. `tools/cockpit/dummy/data/config/layout.yml:93`, `tools/cockpit/dummy/registries/repos.yml:1,5`, `tools/cockpit/src/cockpit/render/collections.py:25,111` and `helpers.py:206`. These are the dummy hub's own file and comments about the cockpit's Code tab. They stay true, because the dummy keeps its tab.
4. `oculus.layout.v1`, `repository_scan_depth`, `clone_dir`, `project_in_hub`, `softwareRows`, `Coverage.svelte` and `Software.svelte` have no hit outside the write list.
5. Palette names: `grep -rn "'clone'\|workspace-new\|workspace-close\|cmd_clone" src config` hits only `src/lib/server/git/deposit-git.ts:103,217`, git's own `clone` subcommand. Nothing collides.
6. `RawManifest.repository`: 46 hits in `src` and `tests` (`grep -rn "\.repository\b\|repository?:" src tests | wc -l`). All are inside the write list. `src/lib/state/client/selectors.svelte.ts:85` is in a file D64 also changes.

Hits inside the write list that the step makes false but the brief never names:
7. `.oculus/config/sources.yml:7` ("A project is any folder that contains a project.yml"; false after part 5), `:11` ("the tier personal, the type idea"; false after part 9) and `:17` ("the folder is not there now"; false after part 9). The same holds for `tools/oculus/config/sources.yml:9`, and `:20`'s tier list leaves out `software`.
8. `config/text/findings.yml:28`: the `project_in_hub` text says "its .oculus/project.yml". Part 5 makes the finding hold for a top `project.yml` too.
9. `src/lib/data/model/model-entities.ts:26-27` ("a project of the tier `software` is on none"), `src/lib/state/boards/board/presets.ts:188-190` ("The four boards ... reached from the Code view") and `src/lib/state/client/selectors.svelte.ts:332` ("although no board lists it") are false once the Software board exists.
10. `docs/DATA-MAP.md:182`, `:263`, `:388` and `:561` describe the placements part 5 changes. The manifest field table (`:383-426`, with `code_availability.*` at `:423-426`) lacks the `repository.*` rows part 7 adds. The brief names DATA-MAP only for repos.yml (brief:50).

## 2. The step line

The line is `plan.md:777`. Its sub-bullet is `:778`. The rulings are `:1858-1868`.

1. (1) Open item 66 (a) maps to part 1. (2) close and new, in the `...` menu, map to part 2. (3) The usage defect maps to part 3, including the sub-bullet's "40 stay". (4) Open item 68 (a) maps to part 4. (5) Open item 67's six parts map to parts 6 (part 1), 7 (parts 2 to 4), 8 (part 5) and 9 (part 6). (6) The placements map to part 5. (7) Z850, Z851 and 69 (a) map to part 9. Z849 maps to part 5 and Z852 to part 8.
2. Contradiction with Z852 (`plan.md:1868`). Z852 says a not-cloned project's Clone, on its card and project view, "clones into its `clone_dir` with no question". Part 7 (brief:48) says "Clone, after a yes, clones". One of them has to change.
3. Part 8's project.yml adds `title`, `status: { chips: [building] }` and `eli5` the description. Z852 names only `tier: personal`, `type: active` and the `repository:` block. These additions are not in "Decisions taken in this brief".
4. Part 4's "Every project is eligible ... The project view passes the deposit for every project" changes existing behaviour. Today `Project.svelte:123` passes `deposit` only when there is no repository, and `ProjectCard.svelte:19-20` documents that. Open item 68 (`plan.md:1860`) rules only the diffs, Fetch, the comparison and the workbench tab. "Open item 67's design" (`:1861`) says existing behaviour is unchanged. The change has no ruling and is not listed as a decision.
5. Open item 67 (1)'s clause "a folder of projects is a hub whose sources.yml scans `dir: .`" has no part. The brief treats it as true already (brief:29), and no HELP or doc requirement says so.
6. Nothing in the line or the rulings asks for these parts: the "deposit.ts under 880" clause and the cockpit Code tab removal. The second follows from deleting repos.yml.
7. plan.md has no Goal section. `grep -n "Goal" plan.md` prints nothing. The top is the title and the "Execution ledger" paragraph (`plan.md:1-3`).

## 3. Premises (main at e934dc7b4, `git rev-parse --short HEAD`)

1. **Wrong (blocking).** brief:32 says "any other key is ignored" on a folder entry. That holds for reading only (`src/lib/server/files/workspace/folders.ts:119-167`). The writer that Add Folder, Remove Folder and reorder use is `src/lib/server/edit/writes/config/lists/folders.ts` (333 lines). Its `itemShape` is `{name, path}` (`:64`), and per its head comment it refuses `invalid` "an entry that is no name and path pair" (`:13-14`, `:220-227`). Save As writes `{ name, path }` only (`src/lib/server/files/workspace/actions.ts:37-39`). Part 6's "keep the key" therefore needs this writer. The brief never names it, in "What is on the tree" or in "Read". Its tests sit under G8 and G9.
2. `readManifests` is at `manifests.ts:211` (`grep -n "^export function readManifests"`), not `:199`. `manifestDir` is at `:308`.
3. The labels are at `config/text/app.yml:47-50`: `cmd_workspace` at 47-48 and `cmd_workspace_save` at 49-50. brief:16 says 49-50 for both. `:121-122` holds.
4. brief:23 and brief:45 assume the mirror is "hidden from the Files view". Axel's workspace serves `~/.oculus` as the root `oculus-state` (`.oculus/workspaces/research-hub.yml:11`), and nothing in `src/lib` hides `deposits` (`grep -rn "deposits" src/lib | grep -v server/git/deposit` gives only comments). So today the mirror is visible there. Either part 4 must hide it (new behaviour), or the premise is wrong.
5. `act()` in `src/lib/server/files/fs.ts:463-468` sends every unnamed action to `selectWorkspace`. The new actions must be named before that fallthrough. The brief does not say so.
6. `projectIds` (`deposit.ts:299-308`) also reads only the scan folders. Part 4 names only `depositFor`.
7. Holds: `storage.ts:28,35,42,51,14-19`; `actions.ts:56,84`; `fs.ts:460-468`; `fs.svelte.ts:805-806,504-523` (the answer also carries `home`, `engine`, `machine`); the `grep -rn "workspace-new\|workspace-close\|closeWorkspace" src` prints nothing; `palette-modes.ts:33-39`; `WorkspaceHeader.svelte:81-82`; `Files.svelte:272-273`; `HELP.md:286`; `refresh.ts:69,73-96`; the transcript count is 40 (`grep -l '"agentName":"oculus-usage-' ~/.claude/projects/*/*.jsonl | wc -l`; `~/.claude-work/projects` is a link to the same folder); `accounts.ts:337`; `sessions.ts:376`; `grep -rn "agent-name\|agentName" src/lib` prints nothing; `deposit.ts` is 873 lines with `cpSync` at :643, `ahead` at :816 and `depositFor` at :255 using `readManifests` at :264 and `code` at :281; `deposit.ts` and `deposit-git.ts` contain no fetch or behind; `Deposit.svelte` is 501 lines; `ProjectCard.svelte:19-20,230-238`; `card.ts:96-101`; `layout.yml:112-120`; `folder-opener.ts:60-78`; `manifests.ts:62-92,262-280,277`; `entersFolder` (`hub-names.ts:295-297`); `folders.ts:168-176`; `findings.yml:28`; `value-rule.ts:159-160`; `portfolio.ts:690-731`; `sources.yml:87`; `options.yml:1403-1411`; `settings.ts:489-496`; `git.ts:24-30,128`; repos.yml has 20 entries (python yaml listing; 16 to move); the `code` collection at `.oculus/config/sources.yml:71` and `tools/oculus/config/sources.yml:66`; `layout.yml:88-89`; `demo/registries/repos.yml` (3 entries); cockpit `layout.yml:116`; `serve_watch.py:12`; DATA-MAP :169, :195, :216, :281, :320; `presets.ts:191-196`; `Projects.svelte:17-22`; `collection.ts:716`; `filter-menu.ts:50-71`; `.gitignore:22`; gh 2.95.0; `deposit.ts:157,218` (`options.gh`); `pointDefaultAtMain` at `deposit.ts:846`. The `find projects side-projects -path '*/.oculus/project.yml'` prints nothing, and no `~/workspace/*/project.yml` exists ("no matches found").
8. The `dir: .` probe was not rerun (see Declined). Reading `manifests.ts:211-256` agrees with it.

## 4. Cases and checks against spec.md

1. **Blocking.** brief:101 makes cases 1-4, 6, 8, 9, 11-14, 16, 18, 19, 21, 22 and 24-26 tests, but names no `agents/guarded.md` entry for any of them. spec.md:58 allows a test only as one entry's test, and a step that needs a new entry stops and asks Axel. From `grep -n "^- G" guarded.md` and the Code lines:
   - No entry covers case 6 (the usage filter; G40 is about size only).
   - No entry covers cases 8 and 9 (Fetch, ahead and behind, `depositFor`; G30 is the secret scan only).
   - No entry covers cases 18, 19, 21 and 22 (Clone; G33's Code lines name no clone module).
   - No entry covers cases 24-26 (`:clone` with gh), or the per-folder depth walk of case 16 in `watch/git.ts`.
   - G29 ("saved layout of the current version is read") does not state per-workspace keys (cases 1 and 2).
   - Cases 3 and 4 (refusals of New) have no stated entry.

   Cases 11-14 fit G32 (`manifests.test.ts`), and the finding half of 14 and 16 fits G13 (the workspace folders reader). As written, the builder must stop at its first test.
2. **Blocking.** Part 9 writes `projects/software/`, `side-projects/` and 16 `project.yml` files, and deletes `registries/repos.yml`. spec.md:37 bans that, except under spec.md:104: "through the script the brief names and by nothing else", or hand-reworded lines a ruling of Axel's asks for. The brief names no script (brief:50, brief:133-138). Under the global rule a new script also needs Axel's approval of what it computes.
3. **Blocking.** brief:9 lets the builder run git commands in scratch repositories, and cases 18 and 27 ask for `git status`. spec.md:32 says the builder never runs a git command, read-only ones included, and spec.md:3 says a brief overrides nothing. Case 27's `git status of the real hub` also contradicts brief:9 itself, which allows scratch repositories only.
4. Case 27 checks a place the step cannot reach in the worktree. `theaxec.github.io/` is ignored (`.gitignore:22`), so it is absent from the worktree, and decision 7's "counts as cloned and the Repositories view lists it" (brief:138) holds only on main.
5. **Blocking.** Verify 6 (brief:172) cannot print nothing within the write list. Run on main, the same grep prints `tools/cockpit/data/HELP.md:138` and `tools/cockpit/src/cockpit/render/helpers.py:188`, and neither file is in the write list.
6. Verify 2 (brief:168) uses the `LC_ALL=C grep -n '[^ -~]'` form. spec.md:100 replaces it with the perl gate "wherever a brief ... names it".
7. Case 3's "the Files view says to add a folder" is a page check (spec.md:63-64) inside a case listed as a test.
8. spec.md:7: the brief names no DESIGN.md sections the step is measured against (`grep -n DESIGN briefs/D71.md` finds only :50, :114 and :172).
9. Verify 5 globs every `side-projects/**/project.yml`, including the three existing projects the step must leave alone (brief:121). It does no harm, but it reads past the step's own files.

## 5. Could it pass without the goal

1. Case 1 drives Switch only. A move made by another page and the desktop host's per-key turn (part 1) are untested, so the case can pass while those paths still use one key.
2. Case 4 leaves out "else the first hub" (no primary) and "unwritable".
3. Case 5 checks labels only. Pressing the menu items is not covered (cases 3 and 4 go through the palette).
4. Case 6 covers the Sessions list and its counts only. "Any other reader" (Agents, Timeline, `src/lib/server/transcripts/stores.ts`) can still list the transcripts.
5. Case 8 checks that the comparison lists the files that differ, but not that a file's diff against `origin/main` opens.
6. Case 10 leaves out `code_availability.url` without `code/`, Reset layout, and an existing folder workbench page.
7. Case 16 leaves out discovery of a clone made while oculus runs under -1. The rename-event rule in `git.ts:24-30` is bounded by depth.
8. Case 17 covers Add Folder and reorder. Part 6 also names Remove Folder and Save As, so those two can stay broken (see 3.1).
9. Case 21 tests the out-of-folder finding for a hub project only, not for a workspace-folder project.
10. Case 24 says "with the fields above" without asserting the `repository:` block.
11. Case 26 tests "not logged in" only. "gh missing" (part 8) is untested.
12. Case 27 depends on `git status` and on `theaxec.github.io` being present (see 4.3 and 4.4).
13. Parts 2, 3, 5, 7 and 9 each have at least one case that reaches their goal. Parts 1, 4, 6 and 8 have the gaps above.

## 6. Implied inputs, not stated

1. The page starts before the workspace answer arrives, or the fs answer fails. Which layout key is read? (Expected: none is read until the workspace is known.)
2. `followKey` follows one key (`storage.ts:22`). After a switch, the key it follows has to change. (Expected: it follows the open workspace's key.)
3. The hub's `.git` is a file, as in a worktree, so `.git/info/exclude` is not a path. (Expected: `git rev-parse --git-path info/exclude`.) `.git/info/` may also not exist yet. (Expected: it is made.)
4. The hub is not a git repository. (Expected: no exclude is written; whether Clone goes on is a decision.)
5. A clone into a folder whose `project.yml` has uncommitted hub changes. (Expected: the file is untouched and still tracked.)
6. A `clone_dir` with gitignore metacharacters (space, `#`, `!`, `*`, `[`). (Expected: escaped.)
7. An empty remote: `ls-remote --symref` answers no HEAD. (Expected: a refusal sentence.)
8. Clone names. A GitHub name with uppercase (`TheAxeC`, `registries/repos.yml` theaxec-profile-readme url) or dots fails the new-project id rule `^[a-z0-9][a-z0-9-]*$` (`src/lib/server/edit/writes/manifest.ts:532`). A name equal to an existing workspace folder name gives `repeated_name` (`folders.ts:150-153`); one equal to a project id gives `id_twice` (`manifests.ts:181-196`).
9. Save As writes back `repository_scan_depth` (see 3.1). The unsaved workspace's state shape is `{name, path}` (`state.ts:49`), so a depth there is a new key in a saved record (spec.md:18).
10. The demo hub's own config. `demo/.oculus/config` holds only `behavior.yml` and `catalogs` (`ls`), so it takes oculus's default `code` collection. The placements of the three demo entries are not stated: `tensorkit-tensor-decomposition-toolkit`; `example-hub`, a hub repository like research-hub; and `bench-suite`.
11. Tests that read repos.yml: `tests/data/sources/collections.test.ts:21,91` (a fixture key and path). Whether they stay is not stated.
12. A saved layout holding the `code` view, or a Projects page saved without `software`. (Expected under the no-migration rule: unknown or default; not stated.)
13. The Software board's New project. `new_project_dir` has no `software` entry (`.oculus/config/sources.yml:26`; engine comment `tools/oculus/config/sources.yml:20`). The board order is 5 (`Projects.svelte:17-22`). The page list `config/layout.yml:67` and the search placeholders `:133-134` are not named.
14. A hub scanning `dir: .`. Under part 5, `hasManifest(base)` (`manifests.ts:235`) would make the hub itself one project if `<hub>/.oculus/project.yml` exists, against "a hub is never a project" (`folders.ts:168`).
15. Usage spend. `src/lib/server/machine/usage/transcripts.ts` sums transcript tokens. Part 3's "any other reader" is ambiguous about spend. (Expected: spend keeps the refresher's real tokens; say so.)
16. The mirror diff reads text outside the workspace roots, and G2 (`guarded.md:10`) refuses such paths.
17. The hub `CLAUDE.md` requires a side-projects manifest to carry `title`, `eli5`, `next` and `links`. Parts 8 and 9 give neither `next` nor `links`.
18. `type: software` is terminal (`config/catalogs/vocab.yml:218`), but bttr and fl-kit get the chip `building`.
19. `projectIds` (see 3.6).
20. `~/.oculus` as a workspace folder under part 5 (see Declined).

## 7. ADRs

`ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both. `find . -type d -iname adr -not -path '*/node_modules/*'` prints nothing. No ADR folder exists, as brief:5 says.

## 8. Dictated text

1. `folders: []` (`grep -n "folders: \[\]"` gives :43 and :58). Holds.
2. The exclude lines `/<clone_dir from the hub>/*` and `!/<path of the project.yml from the hub>` (:48). They hold as gitignore semantics, since the negation works because only the folder's children are excluded. Metacharacter escaping is unstated (6.6).
3. `gh repo list --limit 1000 --json name,url,visibility,description,homepageUrl,repositoryTopics` (:49). Holds: `gh repo list --json` lists all six fields. `createdAt` is also offered for `date`, which part 8 leaves empty.
4. The project.yml fields (:49): `tier: personal`, `type: active`, `status: { chips: [building] }`. These break the hub CLAUDE.md side-projects shape (no `next` or `links`; 6.17) and go beyond Z852 (2.3).
5. `clone_dir: ../../theaxec.github.io` (:50, :138). Holds: it parses (python yaml) and matches Z851.
6. `[venues, data, statements]` (:50). Holds.
7. Decision 7's manifests (:134-138). `repository: { url: https://... }` and `[personal, plt, scripting-language, c++]` parse under PyYAML and `yaml` (node). Data checked against `registries/repos.yml`: `related` ids `elixir-fl4e`, `algebraic-subtyping` and `algebraic-effects-compilation` exist as project folders, and no new id collides (97 ids listed). None of the 16 entries has a Visibility row, so `visibility` is never written.
8. The whole brief passes the ASCII check: `LC_ALL=C grep -n '[^ -~]' briefs/D71.md` prints nothing. brief:144 "is reported, not installed" is a negation-contrast (spec.md:20). It is boilerplate, but it is the banned shape.

## D64 overlap

`git status --short` in `.agents/worktrees/D64` lists 167 paths. `git diff --stat` was read for the shared ones.

1. The brief's claim holds. D64 modifies `repositories.ts`, `change-tree.ts`, `RepoList.svelte` and `diff/` (`Diff.svelte`, `DiffSection.svelte`, `HunkBar.svelte`, `diff-read.ts`): 7 files, +199 -29.
2. D64 also changes `views/sources/repositories/Repositories.svelte` (+32: imports, derived state, `source` patch fields, markup). The brief gives this file to D71 for its one menu item. It is 479 lines on main and 503 on D64, so D71's handler takes the merged file toward the 520 limit.
3. Other files both steps are likely to change: `config/text/app.yml`, `findings.yml`, `server.yml`, `views/sources/repositories.yml`, `config/catalogs/glyphs.yml`, `icons.yml`, `DESIGN.md`, `src/lib/state/client/selectors.svelte.ts` (the `repository` rename at :85), `src/lib/data/model/index.ts`, `src/lib/server/machine/pty/sessions.ts` (holds `USAGE_PREFIX`), `src/lib/server/root/context.ts` (watcher wiring for the per-root depth), and the palette files `Palette.svelte`, `palette-open.ts` and `state/workbench/palette.ts` (for `:clone`). D64's write list is all of `tools/oculus/src/`, so more may follow.
4. Merging looks simple for the catalogs. D64's hunks there are additions in other groups: `debug_pause` near `debug`, an apps findings group at :288, `kind_task`. Merging is moderate for `Repositories.svelte` (adjacent markup and the size limit), `selectors.svelte.ts` and `context.ts`, which both steps change in the same region.

## Declined to judge

1. The `dir: .` probe of brief:29 was not rerun, because it needs a scratch hub on disk and I change no file. The scan code agrees by reading.
2. Whether `~/.oculus` holds `project.yml` or `.oculus/project.yml`, which would make the `oculus-state` workspace folder a project under part 5: reading `~/.oculus` is barred to me. `~/.claude` holds neither (`ls`).
3. Whether D64's final diff will grow further: it is in flight, and only its current worktree state was read.

Usage: about 64 tool uses. Token count and time are not visible to me.

Usage: af360c0361730ba65, claude-opus-5-5, 252,367 tokens, 96 tool uses, 14.6 min.

## Closed

Each finding is closed in `agents/briefs/D71.md` as rewritten after this report, or by a ruling booked in `plan.md`.

- 1.1, 1.2: the cockpit's `data/HELP.md` row and the `helpers.py:188` comment are in the write list and part 9. 1.3: the dummy hub stays, said in part 9. 1.4, 1.5: nothing to close. 1.6: the internal field's 46 uses are named under "What is on the tree"; `selectors.svelte.ts` is in `src/`, and the merge with D64 is named in `shared_paths`. 1.7 to 1.10: the two `sources.yml` scan comments, `findings.yml:28`, `model-entities.ts:26-27`, `presets.ts:186-190`, `selectors.svelte.ts:332` and the DATA-MAP rows (with new `repository.*` rows) are named in part 9 and under "What is on the tree".
- 2.1: nothing to close. 2.2: part 7 follows Z852, Clone asks no question. 2.3: the fields `:clone` writes are decision 8. 2.4: booked as Axel's ruling "Deposit for every project" (his words in the message of 2026-10-12), tagged on D71's line. 2.5: part 6 has HELP.md say a folder of projects is a hub scanning `dir: .`. 2.6: the size clause is spec.md's own rule restated; the cockpit removal follows from deleting the file. 2.7: noted; the plan opens with its ledger paragraph.
- 3.1: the folder writer and Save As are named in "What is on the tree", part 6 and case 17; the unsaved workspace takes no depth. 3.2, 3.3: line numbers corrected (:211, :308, `app.yml:47-50`). 3.4: the claim that the mirror is hidden is gone; part 4 says it stays in `~/.oculus/deposits`. 3.5: part 2 says the new actions are named before `act`'s last line. 3.6: `projectIds` named in part 4 and case 9.
- 4.1: Z853 (automode) names the entries, G29, G8, G13 and G32 widened and new G78 to G81; "Cases" files each test under one. 4.2: part 9 rests on Axel's ruling (open item 67 part 6) under spec.md's last paragraph, the hub files written by hand and listed in full in the report. 4.3: the builder runs no git; git runs only inside tests; case 18's `git status` is run by the test; case 28's real-hub git check is the orchestrator's at landing. 4.4: case 28 splits what the worktree can show from what main shows. 4.5: verify 6's paths now lie in the write list. 4.6: verify 2 names the perl gate. 4.7: case 3's page line goes to the look. 4.8: the DESIGN.md sections are named. 4.9: verify 5 reads only the new manifests.
- 5.1 to 5.12: cases 1, 2, 4, 5, 6, 8, 10, 16, 17, 21, 25 and 27 now carry the missing inputs; 5.13 nothing to close.
- 6.1, 6.2: part 1 (no key before the answer; the storage event follows the open key). 6.3, 6.4, 6.6: part 7 and case 24 (`git rev-parse --git-path`, escaping, no git repository, decision 10). 6.5: part 7 (the project.yml is as it was). 6.7: part 7 and case 22. 6.8: part 8, decision 9 and case 26. 6.9: part 6. 6.10: part 9 settles the demo's three entries. 6.11: part 9 (every fixture naming the collection). 6.12: part 9 (the unknown view, `src/lib/state/workbench/navigation/registry.ts:195`). 6.13: part 9 (order 5, the page list, the search words, no New project). 6.14: part 5 and case 14. 6.15: part 3 and decision 11. 6.16: part 4 (texts through the deposit route). 6.17: decisions 7 and 8 (`next`, `links`). 6.18: decision 7 (no chip in the software tier). 6.19: 3.6. 6.20: "What is on the tree" (`~/.oculus` holds neither file, `ls` by the orchestrator).
- 8.4: decision 8 now gives the personal shape. 8.7: decision 7 says no entry has a Visibility row. 8.8: the sentence is rewritten as "is named in the report with what it would replace, and nothing is installed".
- D64 overlap: recorded in the dispatch entry's `shared_paths`.
