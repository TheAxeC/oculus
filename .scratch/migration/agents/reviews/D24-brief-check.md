BRIEF CHECK REPORT: step D24 (the Personal board), brief `tools/oculus/.scratch/migration/agents/briefs/D24.md` (working-tree version), main at c73570a5. Read-only; nothing changed. Paths are relative to `/Users/axelfaes/workspace/research-hub/tools/oculus` unless absolute. I did not read, grep or hash `config/local.yml`, started no server, ran no test and no state-changing git command.

Findings that block the step as written, in order of weight:
- A. Item 3's watcher plan cannot be built from the paths and calls the brief names (Names 5, 6; Premises 7).
- B. Opening `side-projects` to `readManifests` opens a GitHub-repository-creating deposit action and manifest writes on side-project ids; Case 18 and "no new write path" are wrong (Premises 3).
- C. Two new files named in the brief put two folders over the ten-item limit (Names 3).
- D. Item 5 / Case 15 name a finding that does not exist; item 7 names two components that cannot do what the brief says (Premises 4, 5, 6).
- E. At least nine existing tests pin things the step changes and are not in the paths list (Names 2).

## Names

1. `Tier` (`src/lib/data/model/model-entities.ts:16`) and `Project.tier` (`:88`, `:430`).
   - Command: `grep -rn "\bTier\b" src tests config HELP.md DESIGN.md README.md --exclude=local.yml`.
   - Hits outside the brief's paths: `state/boards/board/presets.ts:5,33,170` (`Record<string, Tier[]>`, not exhaustive), eight test fixtures that take a `Tier` argument, `manifest-schema.yml:30`.
   - No exhaustive switch over `Tier` exists, so adding the member breaks nothing. No fix needed.

2. Tests that pin what the step changes and are not in "Paths this step writes".
   - `tests/state/workbench/navigation/registry.test.ts` ("registers every view id the application has", exact sorted list from line 166): needs `personal`.
   - `tests/state/workbench/navigation/catalogue.test.ts:311`: `p: ['projects','coauthor','archive']` becomes four.
   - `tests/state/workbench/navigation/arrangement.test.ts:279`: `projects: [['projects','coauthor','archive']]` becomes four.
   - `tests/checks/config/integrity.test.ts:77-81`: `counts.projects += countManifests(join(hub, rule.dir))` over every scan rule. With the new rule this counts the 3 side-project manifests, while `snapshot.entities.projects` excludes them, so "holds exactly what a second count of the tree finds" (line 117-124) fails. If `personal` is added to `ENTITY_KINDS` (`normalise.ts:93`), `held` gains a `personal` key that `counts` lacks.
   - `tests/checks/config/config-folder.test.ts` (this file is in the paths, but the brief gives no reason):
     - the exact vocab.yml key list (`'catalogs/vocab.yml': [...]`, lines 178-203, checked by "holds exactly the expected top-level keys, and no more", line 359) needs `side_project_status`;
     - `CATALOG_FILES` (lines ~205-262) needs `views/boards/personal.yml`, and the file must open with `# Oculus text owned by ` (line 382);
     - "names the six scan tiers" (318-330) asserts six dirs and `filter(optional)` of length 1;
     - the roots test (line 406) asserts `['cathedra','game-engine']`.
   - Fix: add the first four to the paths and to "What to build" with their new expected values. Name the config-folder.test.ts assertions in item 1, 5, 6 and 8.

3. Folder limit (`utils/folder-check.sh`, run by `tests/checks/tree/size.test.ts`).
   - Command: `git ls-files src/lib/state/boards | sed 's|src/lib/state/boards/||' | cut -d/ -f1 | sort -u` prints `board career.ts collection.ts focus-lanes.ts focus.ts person.ts project-context.ts structure ticker.ts waiting.ts` (10). The same command on `src/lib/data/sources` prints `career.ts collections.ts config config.ts docs.ts feeds.ts manifests.ts present.ts registries.ts yaml-file.ts` (10).
   - The brief adds `src/lib/state/boards/personal.ts` and `src/lib/data/sources/personal.ts`. Each makes 11 and `size.test.ts` fails.
   - Related: `tests/server/root` and `tests/server/root/watch` also hold exactly 10, so no new test file may go there. `portfolio.test.ts` is 877 lines.
   - Fix: say where the new modules go.
     - Option 1 (ends the cause): move `focus.ts`, `focus-lanes.ts`, `ticker.ts`, `waiting.ts` into `state/boards/focus/`, and `manifests.ts` into a `sources/manifests/` folder beside `personal.ts`. The importers of the moved files join the paths.
     - Option 2: put each new module inside an existing subfolder that fits.
   - The lazy option is to name the files and let the builder find the red.

4. `buildPortfolio` callers outside the paths.
   - Command: `grep -rn buildPortfolio src tests`.
   - Callers: `tests/checks/config/integrity.test.ts:92`, `tests/state/client/socket-timing.test.ts:31` (not in any listed test folder), `tests/data/demo-hub.test.ts:18`, `tests/data/real-hub.probe.ts:80`, `tests/data/portfolio-config.test.ts:167`, `tests/data/snapshot/build-timing.test.ts:64`.
   - The brief says "takes the Files roots as a further argument" without saying it is optional.
   - Fix: state `roots` is an optional fourth argument defaulting to `[]`, so these callers stay valid.

5. `repositoryRoots` is not what item 3 needs.
   - Item 3 says the watcher "passes `repositoryRoots(...)`" and `buildPortfolio` takes `{ key, dir }`. `src/lib/server/files/roots.ts:45` returns `string[]` of directories (`.map((one) => expandHome(one.dir))`), with no keys. It drops only the engine root, so the hub root (key `hub`) is still in it.
   - Fix: use `browserRoots(target)` (returns `Root[]`), drop keys `HUB_ROOT` and `ENGINE_ROOT`, call `expandHome` on each dir, and dedupe by realpath against the hub and the engine config folder too. A `sources.yml` root that is the hub under another key must not be read as a hub card.

6. `RootsTarget` needs `local.workspaces`, which the watcher does not have.
   - `RootsTarget` is `{ config, engine, local: { hub, workspaces? } }` (`roots.ts:15-19`). `WatchPaths` (`watch/portfolio.ts:53-62`) holds `hub, engine, icons, host` only. `server/root/context.ts:256` builds it, and the git watcher there is given `workspacesFile = local.workspaces ?? defaultWorkspacesPath()` (`:300`).
   - Without it, `browserRoots` falls back to `~/.oculus/workspaces.json` and ignores a `workspaces:` override of `local.yml`, so the board disagrees with the Files view.
   - `context.ts` and `tests/server/root/context.test.ts` are not in the paths. D35, in flight, writes `context.ts`.
   - Fix: add both to the paths. Pass `workspaces` (or a `roots: () => Root[]` as the git watcher gets) through `WatchPaths` from `local`, which context.ts already holds. This reads `local.yml` in no new way. Add a "steps in flight" paragraph (see Premises 9).

7. `personal` is already a name in the tree.
   - Command: `grep -rn "personal" src config tests --exclude=local.yml -il`.
   - Existing: `src/lib/views/personal/{account-setup,calendar,memories}`, `config/text/views/personal/`, `tests/views/personal/`, `tests/checks/imports/order.ts:85`, `type-scale.test.ts:70,81,140-144`, `config-folder.test.ts:227-229`.
   - Those views sit on the Incoming, Help and Views pages. The new view is `views/boards/personal/` and `config/text/views/boards/personal.yml`, beside a folder of another meaning. Nothing collides mechanically, because `src/routes/views.ts:43` registers by glob.
   - The brief's own verify step 3 greps `side-projects\|entities.personal` and so never meets those hits. Fix: add one sentence to the brief that the existing `personal` folders are unrelated and untouched.

8. vocab.yml line numbers.
   - Command: `sed -n 183,196p config/catalogs/vocab.yml`. The comment is line 186, `career_host_status:` is 187, its five entries are 188-192, and blank lines follow.
   - The brief says "lines 185-190" (premise) and "block after line 190" (paths). Inserting after 190 lands inside `career_host_status` (`candidate` is 190). Fix: "after line 192".

9. `tier: personal` and the premise "the scan rule's `tier:` field is not read".
   - It is read client-side: `state/workbench/rail-badges.svelte.ts:31,183` (`scanTypeShape` has `tier`; `rows.filter((row) => row.tier === preset.id)`). `config/catalogs/options.yml:511` does not say it is unread.
   - The value `personal` is inert there (it matches no board id), so nothing breaks. But the premise is false and the rule carries three words for one thing: tier `side-projects`, `tier: personal`, entity kind `personal`.
   - Fix: reword the premise to "read only by `projectTypeOrder`, which matches `projects`", and state why the value is `personal`.

10. Documents the change makes false or incomplete, not listed.
    - `DESIGN.md:93` (core entities list), `DESIGN.md:102` (`entities: { projects...; venues...; ... }`).
    - `HELP.md:240` ("Everything on the boards is read from the research hub... a project is any folder holding a `project.yml`").
    - `HELP.md:231` (the `catalogs/vocab.yml` row lists its contents).
    - Command: `grep -n -i "tiers\|scan rule\|entities" DESIGN.md HELP.md README.md`.
    - Fix: add them to item 10 and to the paths. Spec.md requires the grep over `HELP.md`, `DESIGN.md`, `README.md` after a changed name.

11. Findings produced by `record()` for a side-project manifest.
    - `manifests.ts:104-131` emits `findings.manifests.id_not_folder` when `id:` differs from the folder and `type_not_tier` when `type:` differs from the rule type (`side-project`). The brief says "`id`, ignored", and a `type:` key would get two findings (`type_not_tier` plus the extra-key one).
    - The brief also gives no list of the new `findings.manifests.personal_*` keys (user-visible sentences), and `tests/checks/source/keys.test.ts` requires each key to have a literal reader.
    - Fix: list the keys and their words (no manifest, no title, unknown status, extra key, ...). State that `record()` is bypassed or its findings reused for the tier.

12. "Z218 to Z223 ... each booked in `choices.md` and `plan.md` Rulings".
    - Command: `grep -rln "Z218\|Z219\|Z220\|Z221\|Z222\|Z223" .scratch/migration` prints only `agents/briefs/D24.md` and `choices.md`.
    - They are not in `plan.md` or `orchestrator-state.md`, although `choices.md` says "Booked in the state file's closed log and `plan.md` Rulings". Fix: book them there, or reword the brief.

## The step line

Plan line (plan.md:431): "a Personal board: side projects drawn as cards, from `side-projects/<slug>/project.yml` in the hub and `<repo>/.oculus/project.yml` in each Files root, status one of idea, building, running, parked". The brief quotes it faithfully.

| Part | Items | Verdict |
|---|---|---|
| Personal board, drawn as cards | 6, 7 | covered |
| hub `side-projects/<slug>/project.yml` | 1, 2, 4 | covered |
| `<repo>/.oculus/project.yml` in each Files root | 3, 8 | covered, but item 3's wiring is not buildable as written (Names 5, 6) |
| status one of four | 4, 5 | covered |
| 09-22: "hub manifest's fields where they apply, no manuscript fields" | 4 | superseded by 09-25's five fields; the brief should say so |
| 09-25: nothing on a research board, Focus, website | 2, 7, Case 2 | covered for readers of the snapshot; not for the `readManifests` callers (Premises 3) |
| 09-25: own tier beside `projects/ideas` | 1 | covered |
| 09-25: move to `~/workspace/<slug>` | none | The repository is read only if it is a Files root. The HELP row (item 10) does not tell the reader to add the folder as a root (Add Folder, or `sources.yml`). Fix: add that sentence. |
| 09-25: six repositories; Z216 roots | 8 | covered |
| Z217 (a): landing writes each and commits in its repository | 9 | The brief has no item for the landing. `youtube-downloader/.gitignore` line 4 is `*.yml`. Command: `git -C ~/workspace/youtube-downloader check-ignore -v .oculus/project.yml` prints `.gitignore:4:*.yml	.oculus/project.yml`. A commit "by path" is refused for that repository. This is a new decision for Axel: (a) `git add -f` that one file; (b) add `!.oculus/project.yml` to that repository's `.gitignore` (a second write, which ends the cause); (c) leave it untracked, which is the lazy option. Recommendation: (b), booked as an open item before the landing. |

Parts with no item: none, apart from the two rows marked "none" and the decision above.

## Premises (rerun of "What is on the tree")

Confirmed by the commands named:
- `ls ../../side-projects` prints `gpu-game-boy residual scripted-os`, and `cat ../../side-projects/*/project.yml` shows exactly `title`, `status: idea`, `eli5`, `next`, `links: []` in each.
- `side-projects` is absent from `worktree_paths` in `.agents/plan.yaml`.
- `ls -d ~/workspace/*/` shows the six repositories. None has `.oculus` (`ls ~/workspace/<repo>/.oculus` fails for each). Each has `README.md`.
- `config/sources.yml`: `scan:` at 14-20, `projects/ideas` at 15, `roots:` at 92 with two entries (93-94).
- Line numbers that matched: `scanRuleShape` `data/index.ts:45`; `manifests.ts:186` and `readManifests` at 176-222; the callers at `data/index.ts:230`, `subtasks.ts:58`, `manifest.ts:175,243`, `pty/context.ts:39`, `project-files.ts:183`, `deposit.ts:231,265`, `docs.ts:187`; `Tier` at 16; `Entities` 137-151; `normalise` 686, 690, 754; layout.yml 72-73; `coauthor_glyph` at projects.yml:74; HELP 102-103; DESIGN 377, 404; `roleDirectories` 180-189; `watchPortfolio` 213; `buildPortfolio` call at 352.
- Wrong or imprecise:
  - The cited command `grep -rn "\.tier\b" src/lib` does not print `audit/projects.ts:129,183,...` (those are the `for` lines above the `ghost` checks at 130, 184, ...). It also prints `rail-badges.svelte.ts:183`, which is the config row's `tier`, not `Project.tier`.
  - The vocab line numbers (Names 8) and the `tier:` claim (Names 9).

Findings:

1. The watcher is the only caller of `buildPortfolio` with real roots, and item 3 leaves its wiring open. Its filter drops the roots' events.
   - `watch/portfolio.ts:381-396` opens each directory with `accepts = relevant(filename) && named(join(dir, filename))`. `namedByConfig` (`:133-157`) accepts only registries, collections, feeds, the career file and paths under a hub scan tier. A `<root>/.oculus/project.yml` path returns false, so the event queues nothing. A flat watch on the root's `.oculus/` folder reaches no rebuild unless `namedByConfig` also learns the roots.
   - `watchFile` (`:197-201`) and `openFile` (`:290-304`) say "A folder that is not there is not watched and not refused, so one made later is picked up at the next rebuild". Following that precedent leaves all six repositories, none of which has `.oculus/` at landing, deaf to a manifest written later. Only `openParent` (`:244-266`) hears a directory created later.
   - Item 3's "whichever the watcher already does ... (the report names which)" leaves a choice that decides whether Case 12 passes for the six repositories. Fix: require `openParent` semantics for a missing `.oculus/`, extend `namedByConfig` with the roots, and add the "`.oculus` created later" case.

2. The saved workspaces file is not watched by the portfolio watcher. The git watcher polls it (`watch/git.ts:426`), but `watchPortfolio` never reads or polls `workspaces.json`. A folder added in a named workspace, or a workspace switch, changes `addedRoots` (`fs.ts:259`) without any rebuild. X3a, in flight, appends `{key, dir}` to `sources.yml roots:` for the default workspace, which does reach the rebuild through the engine config watch. Fix: poll or watch the workspaces file as the git watcher does, add a case, or rule that saved-workspace roots are not read. Which one is a decision for Axel; the first is the one that ends the cause.

3. `readManifests` callers on a `side-projects` manifest (the check you asked for):
   - `server/edit/writes/subtasks.ts:58` `subtaskHost`: finds the side project by id, `insideHub` is true (scan membership, `manifest.ts:184-187`), so a subtask write lands in the side-project manifest. Its key is outside the five and becomes an "extra key" finding.
   - `server/edit/writes/manifest.ts:175,243` (`manifestValue`, `writeManifest`): a write by id is accepted for any field the research schema names (`title`, `eli5`, `next`, `venue_id`, `pin`, `focus`, ...). `status` is refused only because the schema names `status.chips` and `status.line` as children ("the field is a group"). So Case 18's "refused as a write to a manifest outside the research tiers would be today" has no referent: today there is no such tier, and on the unchanged tree the id does not exist. After the change the write is accepted.
   - `server/git/deposit.ts:231,265` plus `deposit-routes.ts:141 knownIds`: `projectIds()` is `readManifests(...).manifests.map(id)`, and `POST /api/deposit` accepts any such id. For `residual`, `adopt` and `push` would run `gh repo create` with `visibility` defaulting to `'public'` (`deposit.ts:258,385`). This is a write path to a public GitHub repository, opened by adding the scan rule.
   - `server/machine/pty/context.ts:39`: the portfolio chat context lists every non-ghost manifest under "PROJECT MANIFESTS (status/venue source of truth)", so the three side projects are handed to every portfolio chat as projects.
   - `server/files/project-files.ts:183` and `server/content/docs.ts:187 folderOf`: read-only listing and document resolution by id; harmless and arguably wanted.
   - Fix: the brief must decide, per caller, whether the side-projects tier is visible. The cause is item 1's "the seven callers find a side project by its id". Give `readManifests` a tier filter or option (research callers pass it; `buildPortfolio` reads the side tier explicitly), so the deposit, subtask, manifest-write and chat-context callers do not see it. Alternatively, keep them visible and add a refusal for the tier in `deposit-routes.ts`, `subtasks.ts` and `manifest.ts`. Either way these files join the paths and Case 18 becomes a concrete refusal case. The lazy option is to document the exposure.

4. Item 5 and Case 15 ("the same checks / the same finding `career_host_status` gives") describe checks that do not exist.
   - Command: `grep -rn "career_host_status\|icon_not_glyph" src tests`. `findings.config.icon_not_glyph` (`data/sources/config/catalogs.ts:136`) is about `icons.yml` names, not vocab entries. `career_host_status` icons are checked only by the tree test "uses glyph names for every configured icon" (`config-folder.test.ts:471-489`), which names `career_host_status` and `status_legend` only. Nothing checks a colour as `#rrggbb`.
   - The colour path is `toneOf(hex)` (`state/shared/words/tones.ts:100`), which maps through `palette:` and falls back to `grey`. All four chosen hexes are in `palette:` (vocab.yml lines 25 `#d4a017`, 28 `#16a34a`, 32 `#0891b2`, 46 `#9ca3af`), giving tones `brass`, `green`, `cyan`, `grey`.
   - Fix: either (a) add a runtime finding (new `findings.config.*` keys with a reader) for `side_project_status` and say so in item 5, or (b) extend the tree test to `side_project_status` and drop "same finding" from Case 15. Option (a) matches the wording "finding" in the case; either way Case 15 must name the real check.

5. Item 4 "`links` is read as research manifests read it (`strings(entry.links)`, `normalise.ts:412`)".
   - `normalise.ts:412` is inside `person()` (the people registry). `manifest-schema.yml` has no `links` field, so no research manifest reads `links`. `strings()` (`helpers/guards.ts:67`) drops every non-string item and returns `[]` for a scalar, with no finding.
   - Item 7's "the links as `CardLinks` draws a project's" is also impossible: `CardLinks.svelte` draws funding, pillar, dataset, collaborator and software tags of a `BoardItem` (lines 46-81), not URLs or paths.
   - Fix: state what a `links` entry is (web address, hub path, root path), how it is drawn (the Person view only prints text: `Person.svelte:91`) and pressed (an `https` address goes to `open_bin`; a path opens through `openSourceFile`). State the scheme rule: a `javascript:` or `file:` entry from an untrusted repository must not become a clickable link. Say what a non-list `links:` gives (finding or nothing).

6. Item 7's "opens the manifest in the source editor through the existing open-file path (`state/workbench/layout/open/opening.ts`)". `opening.ts` is `createOpening` (`openView`, `openBeside`, `openInPane`). The open-file helper is `openSourceFile(client, { root, path, label })` in `views/shared/links/source-file.ts:16`. For a repository card the root key and the path `.oculus/project.yml` are needed; for the hub card, root `hub` and `side-projects/<slug>/project.yml`. Show in Files for a repository is `showInFiles(path, root)` (`show-in-files.ts:21`); the brief should give the arguments for a root's top folder. Fix: name `openSourceFile` and the arguments.

7. Item 3 `named`/`accepts` and "rebuilt when the roots change": see 1 and 2.

8. `tests/server/root/watch/portfolio.test.ts` exports `namedByConfig(hub, config)` and `watchedDirectories(hub, config)` and tests both. The brief changes their inputs without saying whether the new parameter is optional.

9. Nothing in the brief says which steps in flight share its files (spec.md asks the orchestrator to compare paths; the D35 and X3a briefs each carry such a paragraph).
   - D35 writes `server/root/context.ts`, `DESIGN.md` 224-235, `HELP.md` 216 and 236, `options.yml` 591-622, and `docs/diagrams/`.
   - X3a writes `server/files/roots.ts` (the roots D24 reads), `DESIGN.md`, `HELP.md`, `options.yml` (the `roots` description), `routes/+page.svelte`, and `sources.yml roots:` through a new write.
   - L4 writes `config/layout.yml` lines 45-53 and adds `floats:`, plus `options.yml`, `DESIGN.md`, `HELP.md`, and `watch/portfolio.ts` "only if its check refuses a key".
   - Q66, Q35 and the others share `docs/diagrams/` and `DESIGN.md`.
   - Fix: add the paragraph. D24 widened by `context.ts` conflicts with D35's write of the same file.

10. Item 2 / Entities.
    - `Entities` gains a required `personal`. `npm run check` type-checks tests (`.svelte-kit/tsconfig.json` includes `../tests/**/*.ts`). Command: `grep -rlE "organisations: \{" tests | wc -l` prints 23 files that build the object literally, for example `tests/state/boards/board/board-fixture.ts:195-197`. `RawPortfolio` literals (`normalise.test.ts:242`, `validate.test.ts:132`, `validate-shapes.test.ts:70`, `build-timing.test.ts:38`) fail the same way if it gains a field.
    - The brief gives no decision between a required and an optional key, and does not widen the test paths. Fix: required, with `grep -rlE "organisations: \{" tests` as the path set. An optional key (which skips the 23 edits) is the lazy option.
    - Item 2 and item 4 also leave unnamed where a hub manifest becomes a `SideProject` (item 2 says `normalise`; item 3 says `buildPortfolio`; item 4 says `sources/personal.ts`). Fix: one parser in `personal.ts`, called for both, with what `RawPortfolio` carries named.

11. The six drafts (item 9). The READMEs are enough for `title`, `eli5` and `status`. Per repository:
    - `ordo/README.md`: 192 lines, states what it is.
    - `cathedra/README.md`: 178 lines, no status or next heading ("Possible future extensions" at line 130 is not a next action).
    - `game-engine/README.md`: its title is "Missal", not `game-engine`; `> **Status: in progress.**` at line 9.
    - `scotoma/README.md`: "Order of work" 56-68 names the open steps, so a `next` exists.
    - `officium/README.md`: 281 lines, no status.
    - `youtube-downloader/README.md`: 62 lines, no status.
    - So `next` is empty for four of the six, as the brief allows. The brief should say which title a draft uses when the README title differs from the root key (Missal vs `game-engine`).

12. Other premises: `docs/diagrams` has 18 files (outside the `src tests utils config` rule). `utils/folder-check.sh` exits 0 on the unchanged tree. Verify list has 7 commands (state file `verify:` block).

## Cases and checks

1. Case 1 ("the three hub manifests on the tree"): spec.md:35 allows only four named files to read the real hub. A new test cannot read `../../side-projects`. It must use a synthetic copy, or the case becomes an addition to `tests/checks/config/integrity.test.ts` (Names 2). Also state the layer that asserts "three cards": the selector or the rendered view.
2. Case 3: "status chip `running` in `#16a34a`". The chip receives a tone (`green`), and a `.ts` or `.svelte` may hold no raw hex. `--c-green` is `#16a34a` only in the base tokens (`themes/tokens.css:36`). Fix: assert the tone `green`.
3. Case 12 (a manifest written while the server runs): see Premises 1; add the variant "`.oculus` did not exist", and a variant that deletes and recreates the root directory.
4. Case 13: consistent with item 2 for the snapshot. For the callers of `readManifests` the first match by id is the research project (folder sort puts `projects/` before `side-projects/`), so writes land on the research project. Say so.
5. Case 15: unachievable as written (Premises 4).
6. Case 18: contradicts "no new write path" (Premises 3). On the unchanged tree the id does not exist, so the "first run" is "not found". State the intended refusal.
7. Cases 6 and 7 use "the folder name (the root's key for a repository)" for the title; consistent with item 4. Case 17 is consistent with item 6 and the existing arrangement behaviour.
8. Spec.md:60 requires every id and key exercised empty, duplicated and colliding with a reserved key. The cases do not do this for `root:<key>` ids (see Implied inputs 11, 12).
9. The closing paragraph's "first run of every case on the unchanged tree" cannot be run for cases that need modules that do not exist yet, so those fail only by import error. The brief should say the first run applies to the cases that exercise existing code (Cases 4 and 11 on the existing reader, Case 17, Case 18).

## The question

The goal: a Personal board that draws every hub side project and every Files root's `.oculus/project.yml` as cards, with nothing of them on any research board, Focus, or the website check.

Items:
- 1: yes, can pass alone. The rule exists and nothing is drawn; a green `npm test` proves nothing about cards unless Case 1 is asserted through the view.
- 2: partly. It keeps side projects out of `snapshot.entities.projects` and so out of every snapshot reader. It does not keep them out of the deposit, subtask, manifest-write and chat-context callers (Premises 3), which are research "readers" in the sense of the goal's "nothing on any research board".
- 3: yes. Tests that call `buildPortfolio(hub, config, 0, roots)` pass while the watcher, `context.ts` and `namedByConfig` never feed a real root, and the cards never appear in the server. Only a test of `watchPortfolio`'s rebuild with a real `.oculus/project.yml` outside the hub, plus a `context.test.ts` assertion on what is passed, proves the goal.
- 4, 5: yes. A shape and a vocabulary pass with no board.
- 6: yes, it can register and tab with an empty board.
- 7: yes, if the view tests render a fixture selector and never the snapshot path.
- 8: yes. Four config lines pass with no card.
- 9: yes. The drafts exist in a report; nothing checks a draft with the shipped reader. Fix: the refuter parses each draft with the new reader (zero findings).
- 10: yes. Docs pass with nothing built.
- Verify step 3's grep lists only files and proves no behaviour.

Cases:
- Case 1: fixture passes while the real hub's three manifests give findings. Fix: assert in `integrity.test.ts`.
- Case 2: passes if Focus and the audit are exercised through a synthetic snapshot; the goal's real hub is checked only by `integrity.test.ts`.
- Case 3: passes at the data level while the view is unreachable (the registration or the layout line missing). Fix: render the view from a snapshot built with a root.
- Case 12: passes with `watchFile` semantics for a root that already has `.oculus/`, and fails to prove the six repositories (Premises 1).
- Case 17: proves only the saved layout.
- The step line: could pass without the goal for the same reasons as items 1 and 3.

## Implied inputs missing from "Cases" (each with the expected result I propose)

1. Empty `project.yml` (0 bytes) or YAML `null`: `readYamlMap` gives `findings.file.not_a_map`; no card.
2. `project.yml` is a directory, a FIFO or a device (`readFileSync` blocks or throws): treated as not a file, with a finding; never read. The reader uses `readFileSync` with no size limit (`yaml-file.ts:26`).
3. Manifest larger than a limit (a repository file is not the reader's own): a finding and no card; name the limit's config key (spec.md:49).
4. `.oculus` is a file: no card, no crash, one logged watch refusal (`portfolio.ts:106-111`).
5. `project.yml` or `.oculus` is a symlink leaving the root: not read, with a finding (the file route refuses such links; the manifest reader would follow them).
6. Unreadable (EACCES): finding naming the error, no card.
7. Root directory not on this machine: `readRoots` keeps it in the list and reports it (`files.ts:188-196`). No card, no personal finding, no throw.
8. Root removed while the server runs, then restored: card goes, then returns. `handles.has(dir)` (`portfolio.ts:107`) keeps a dead handle after the directory is recreated (platform behaviour not verified).
9. Path with a space in the root's dir: card drawn, id `root:<key>` unaffected, Show in Files path encoded.
10. Symlinked root (`~/workspace/x` pointing to another root), or a configured root that is the hub or the engine config under another key: read once or not at all, by realpath, not by key.
11. Hub folder named `root:foo` and a root keyed `foo`: same id `root:foo`; `byId` (`normalise.ts:125`) overwrites silently. Expected: both kept or a finding naming the id. An id `__proto__` is lost the same way (`out[item.id] = item` on `{}`).
12. Saved workspace roots (`~/.claude` is the only saved root today): read like configured ones, once, with the workspace's current set.
13. Non-text `title` (number, list, empty, whitespace): folder name or key plus a finding. `status` in another case ("Running") or non-string: an unknown-status finding naming the value (decide whether case is normalised). `eli5`/`next` non-text: empty plus a finding. `links` non-list or non-string entries: a finding.
14. Text from a repository reaching HTML: drawn as text, not markdown or `{@html}`; a long `next` is clamped or cut as `ProjectCard` does (`firstSentence`).

## ADRs

None. `ls docs` (in `tools/oculus`) prints `diagrams`; `ls /Users/axelfaes/workspace/research-hub/docs/adr` fails; `find . -iname "adr*"` and `git ls-files | grep -i "/adr"` print nothing; `grep -n -i adr .agents/plan.yaml` exits 1. The brief's statement is correct.

## Declined to judge

- Whether Z218 to Z223 (the scan rule vocabulary, the `personal` view name, the status colours, the card design) are the right choices; they are Axel's and booked.
- The accuracy of any draft manifest's `status` for the six repositories; no drafts exist yet.
- Whether `fs.watch` on a deleted and recreated directory stays dead on this platform (stated as a risk in Implied inputs 8, not verified).
- The first run of the cases on the unchanged tree and the verify list; I ran no test.
- What `local.yml` sets (`workspaces`, `hub`) and whether the worktree has one, since I do not read that file; this affects the real-hub tests in the builder's worktree.
- The look of the board and its visual agreement with the other boards.

Usage: claude-sonnet-5-5 (read from the agent's transcript at 02:03), 318,451 tokens, 121 tool uses, 16.6 min.

## Closed

Each finding, with the change to `agents/briefs/D24.md` that closes it.

- Names 1: no change needed; "What is on the tree" says no exhaustive switch over `Tier` exists.
- Names 2: the four tests join the paths and items 4, 8, 9 and 11 give each one's new value (`registry.test.ts`, `catalogue.test.ts:311`, `arrangement.test.ts:279`, `integrity.test.ts` counting `projects` and `personal` apart, and `config-folder.test.ts`'s vocab list, `CATALOG_FILES`, scan-tier test and roots list).
- Names 3: item 3 places the new modules in folders below the limit (`state/boards/board/personal.ts`, `data/snapshot/normalise-personal.ts`, `readPersonal` in `manifests.ts` or a `data/sources/manifests/` folder); the limits are a premise; verify item 3 runs `utils/folder-check.sh`.
- Names 4: item 5 makes `roots` an optional fourth argument defaulting to `[]`.
- Names 5: item 5 uses `browserRoots`, drops `HUB_ROOT` and `ENGINE_ROOT`, expands `~` and deduplicates by real path against the hub, the engine config folder and earlier roots (Z228).
- Names 6: `WatchPaths` gains `roots` and `workspacesFile`, built in `context.ts:256-261` as the git watcher's are; `context.ts` and its test join the paths; "Steps in flight that share files" names D35's lines.
- Names 7: a premise says the existing `personal` folders are unrelated and untouched.
- Names 8: the block goes after line 192.
- Names 9: the premise now says `tier:` is read by `rail-badges.svelte.ts` against board ids; item 1 says why the value is `personal`.
- Names 10: item 13 adds `DESIGN.md:93,102` and `HELP.md:231,240`, and they join the paths.
- Names 11: item 7 lists the finding keys and says `record()`'s findings do not run on this tier.
- Names 12: Z218 to Z223 were booked in `plan.md` Rulings and the state file's closed log after the check started (`grep -c` printed 6 in each); with Z227 to Z232 the same.
- The step line, "move to `~/workspace/<slug>`": item 10's empty sentence and item 13's HELP row say a repository is read once it is a Files root.
- The step line, `.gitignore` of youtube-downloader: Z229, decision 9; the landing adds `!.oculus/project.yml`.
- Premises 1: item 6 requires `openParent` for a missing `.oculus/` and `namedByConfig` learning the roots; cases 15 cover both.
- Premises 2: item 6 polls the workspaces file (Z228); case 16.
- Premises 3: item 2 (Z227) keeps the tier out of `readManifests`, so the deposit, subtask, manifest-write and chat-context callers never see it; case 3 is a concrete refusal; the callers' tests join the paths.
- Premises 4: item 8 names the real check (the glyph test of `config-folder.test.ts`) and `toneOf`; case 20 reworded.
- Premises 5: item 10 draws links through `posting()` and leaves every other entry as text (Z230); case 12.
- Premises 6: item 10 names `openSourceFile` and `showInFiles` with their arguments.
- Premises 7: closed with Premises 1 and 2.
- Premises 8: item 6 makes the new parameters of `namedByConfig` and `watchedDirectories` optional; watcher tests stay in `portfolio.test.ts`.
- Premises 9: the section "Steps in flight that share files".
- Premises 10: item 4 makes `personal` required and puts the 23 files and the four `RawPortfolio` tests in the paths; item 7 names one parser for both sources.
- Premises 11: item 12 takes the README's own name as the title (Z232) and leaves `next` empty where none is named.
- Premises 12: no change needed.
- Cases and checks 1: case 1 uses a synthetic hub; the real hub is asserted in `integrity.test.ts`.
- Cases and checks 2: case 4 asserts the tone `green`.
- Cases and checks 3: case 15 covers `.oculus/` made later and a file removed.
- Cases and checks 4: case 18 reworded; research callers never see the side tier.
- Cases and checks 5: case 20 reworded.
- Cases and checks 6: case 3 is a concrete refusal.
- Cases and checks 7: no change needed.
- Cases and checks 8: ids `side:<slug>` and `root:<key>` (Z231); cases 6 and 18.
- Cases and checks 9: the closing paragraph says which cases fail by import on the unchanged tree.
- The question, items 3 and 9: cases 15, 16 and the `context.test.ts` path; item 12 parses each draft with the reader (case 24).
- Implied inputs 1 to 6: item 7 and case 11 (empty, not a map, directory, FIFO by `isFile`, 64 KiB limit, symlink).
- Implied inputs 7: case 7.
- Implied inputs 8: item 6 (reopened at the next rebuild); case 15.
- Implied inputs 9: case 23.
- Implied inputs 10: case 6.
- Implied inputs 11: ids with distinct prefixes (Z231).
- Implied inputs 12: item 5 and case 16.
- Implied inputs 13: item 7 and cases 8, 9, 12.
- Implied inputs 14: item 10 and case 13.
- ADRs: no change needed.
