# Brief check of D68 (workspaces as files), read on main at a86225c4c

Every command below was run read-only from `/Users/axelfaes/workspace/research-hub` (`git rev-parse HEAD` printed `a86225c4c23c8cefb0eeb05f01612600c71656a9`). No file was edited, and no file named `local.yml` was read or grepped.

Six findings need a fix before dispatch. Each is explained under its check.
1. Case 15 breaks spec.md line 63.
2. The cases are not mapped to guarded.md entries, which spec.md line 58 requires.
3. Two paths the brief requires changing are outside its write list: `vite.config.ts` (it reads the port) and `config/schemas/manifest-schema.yml` (the item 9 grep hits it).
4. The Settings view reads and lists oculus's own config files through the `engine` root. The brief removes that root and says nothing to replace it.
5. The brief has no rule for the 61 uses of `local.hub` when there is no primary.
6. G73 refuses a start when the hub folder is missing. Item 4 says "Nothing errors". The brief does not resolve this.

## 1. Names

Command: `git grep -l -F "<name>" -- . ':(exclude)*local.yml'`, with `src/` and `tests/` left out, for each name. A second `git grep -n -E` covered `roots:`, `hub: true`, `config/local.yml`, `wallpaper`, `memories`, `wallpaper.(dir|file|pick)`, `memories.dir` and `localFile`, leaving out `.scratch`, `src` and `tests`. The skills folders were grepped with `grep -rlE "workspaces\.json|config/local\.yml|HUB_ROOT|ENGINE_ROOT|hub: true|tools/oculus/config/appearance|wallpaper\.dir" ~/workspace/ordo ~/.claude/skills/ ~/.claude/CLAUDE.md ~/.claude/rules ~/.agents/skills`, which printed nothing.

Hits under `tools/oculus/.scratch/` (old briefs, reviews, patches, plan.md, history, choices.md, orchestrator-state.md) are records and stay as they are. No hits for `byPrefix` outside src and tests. The hits outside the write list:

**Made false by the change. Not in the write list, and none is named for the orchestrator at landing:**
- `docs/DATA-MAP.md:58,73,182,302,553,557,561,573,574`, the hub doc. It describes `roots:` entries with `key`, `dir` and `hub`, `hub: true`, "a project of the first hub", and `workspaces.json` in `.oculus/`.
- `CLAUDE.md:102`, the hub instruction file: "a `roots:` entry for the repository in `.oculus/config/sources.yml`". After the change a personal project's repository is added to a workspace file instead.
- `.agents/skills/research-cockpit/SKILL.md:155`: "`mail_dir` key of `tools/oculus/config/local.yml`". After the change it is the primary's `.oculus/local.yml`.
- `.oculus/wallpaper/README.md:3`: "The key `wallpaper.dir` of `tools/oculus/config/appearance.yml` selects the directory and either a filename fragment or the configured pick rule". Item 8 removes all three things it names.
- `.oculus/config/sources.yml:91`, the comment above `roots:`. Item 10 says "takes `roots:` out" but does not mention the comment.
- `tools/oculus/README.md:13`: "Machine-local values live in `config/local.yml` of the engine directory". spec.md line 69 puts README.md in the grep set, but the brief has it in neither the write list nor the item 9 grep.
- `tools/oculus/demo/README.md:3`: "Point `hub:` in `tools/oculus/config/local.yml` at this folder". The write list allows `demo/` only "where a test or case needs a file of a hub".
- `tools/oculus/config/schemas/manifest-schema.yml:34`: "for a repository the key of its roots: entry". The item 9 grep covers `config`, so it requires this hit to change, but `config/schemas/` is not in the write list.
- `tools/oculus/vite.config.ts:18,114`: `port: loadLocal(engineDir()).port`. This is the dev server's port. It is outside `src/`, outside the write list, and missing from the brief's count of loadLocal callers.
- `tools/oculus/utils/folder-check.sh:5` is a comment naming `config/local.yml` as the example ignored file. It goes stale, and `utils/` is outside the write list.

**Not false, but stale after the change:**
- `tools/oculus/.gitignore:6` and `.prettierignore:30` (`config/local.yml`).
- The ASCII gate's `! -name local.yml`.

**In the write list, and must change:**
- `DESIGN.md:93,272,410,618,646,681`
- `HELP.md:285,286,299,451,468-470`
- `docs/apps.md:15,16,39,65,338,344,375,398,422`
- `config/sources.yml:80-81`
- `config/catalogs/options.yml:64-131,1409-1445`
- `config/text/findings.yml:18-35`
- `config/text/server.yml:134` ("Set rite_dap_bin in config/local.yml") and `:302`
- `config/text/views/sources/files.yml:213` (`refused_root_fixed`)
- `docs/diagrams/writes.dot` and `.svg` (`defaultWorkspacesPath`)

**`tools/cockpit`:** the wallpaper and memories hits are the cockpit's own config and are not affected. The `roots:` hits there are Python loops and unrelated.

**`guarded.md` entries whose text or test rows the change makes false.** This is outside the write list; the orchestrator rewrites guarded.md. The brief asks for G3 only (item 7). From `grep -n` over guarded.md:
- G2 line 12: the row 'an address for the engine root, answered closed'.
- G8 and G9 lines 63 and 66: the `roots.test.ts` rows, including "keeps each entry's tier and hub".
- G28 line 73: 'sends the write when the engine root is served from a worktree config folder' and 'refuses ... when the engine root is the hub own config folder'.
- G31 line 92: the saved workspaces file. Line 94 is `tests/server/files/workspaces.test.ts`.
- G49 line 34: "`open` never reaches the engine root".
- G61 lines 188-190: "the engine's config folder", and 'reads the layer of the hub that local.yml names now'.
- G69 lines 186-187: `workspacesAnswer`.
- G13 line 172: the roots reader's `tier` (`tests/data/hubs/hub-roots.test.ts`).
- G73 lines 203-205: "a hub folder that is missing or cannot be read" is a required lack; 'no local.yml and the default hub two folders above the engine is no lack'.
- G74 line 206: "the engine's place in the hub".
- G14 line 173: `realHub` finds the hub through `loadLocal(engine).hub` (`tests/fixtures/real-hub.ts`).

## 2. The step line

`grep -n '^- D68 workspaces as files' plan.md` gives line 771. Each part of the line and the item that serves it:
- One YAML file `.oculus/workspaces/<name>.yml` with `name` and `path`, both required, `~/` or absolute: item 1.
- An optional `primary` naming the folder whose `local.yml` gives the one-per-oculus keys: items 1 and 7.
- `roots:` and `workspaces.json` converted once by hand and deleted: item 10, by the orchestrator. The code side is spread over items 2, 3 and 9. No item says that `roots` leaves `HUB_LIST['sources.yml']` (`hub-names.ts:205`), or that `configuredRootsOf` and its caller `routes/api/(sessions)/customizations/+server.ts:12` go.
- `claude` and `~/.oculus` go into the workspace file: item 10.
- The open workspace and the recent list are machine state in `~/.oculus`: item 4.
- Add and Remove Folder edit the open workspace's file only: item 5. Item 5 also has the unsaved workspace write the state file. That comes from Z822, not from the step line.
- `HUB_ROOT` and `ENGINE_ROOT` go, and the Files view shows exactly the listed folders: item 2.
- A folder is a hub when it holds `.oculus/config/`, and `hub: true` goes: item 3.
- Everything follows the open workspace (projects, search, git, Problems, bookmarks, apps): item 6.
- oculus works with no hub and no primary: items 4, 6 and 7, partly. The 61 uses of `local.hub` in 23 files (`grep -rn "local\.hub\|local()\.hub" src | wc -l` printed 61) have no stated rule. Among them: terminals and chat (`pty/start/chat.ts:96-117`, `api/terminal`), sessions and customizations, deck, hpc, search, latex, `src/server.ts:144`, `config-cache.ts` (the hub settings layer), `project-files.ts`, `schedules/watch.ts`, and the write target's `hub` (`server/edit/writes/hubs.ts`).
- `local.yml` in each hub's `.oculus/`, out of git, `hub` key removed: items 7 and 10.
- Port, program paths and HPC alias from the primary only, and a misplaced key is a finding: item 7.
- `accounts`, `calendars` and `mail` joined, a repeated label a finding, each entry marked with its hub: item 7.
- Memories and wallpaper folders in each hub's `sources.yml`, with their defaults: item 8.
- The photo wall shows every hub's photos: item 8.
- A wallpaper picker with thumbnails, the choice kept in the primary's settings: item 8.
- The partial-name match and its fallbacks removed: item 8.
- oculus's own `appearance.yml` keeps only the look: item 8.
- G3 follows `local.yml`: item 7.

Every part has an item. The one without a full requirement is "oculus works with no hub and no primary", for the consumers listed above.

## 3. Premises

Every claim below was rerun.

**Hold:**
- `grep -rln "HUB_ROOT\|ENGINE_ROOT" src utils | wc -l` printed 71, and the tests count printed 81.
- `files.ts:512` is `export { ENGINE_ROOT, HUB_ROOT };`, and `place.ts:16` is the same.
- `files.ts:520` is `return { key: ENGINE_ROOT, dir: configDir(engine) };`, and `:544` adds it.
- `files.ts:59` is `export type Root = { key: string; dir: string; hub?: true; noProject?: true };`.
- `hubRefusal` starts at `:183`.
- Every app closure line holds: `reach/fs.ts:203`, `reach/open.ts:123`, `methods.ts:411,438`, `scan.ts:265`, `manifest.ts:336`, `manager.ts:682`.
- `rows.ts:128`, `groups.ts:202`, `config-files.ts:53`, `write-files.ts:57` (`const CONFIG_ROOT = ENGINE_ROOT;`), `build.ts:186,191`, `lookup.ts:92`, `source.ts:148,150,216`, `source-bytes.ts:54`, `ops.ts:377` and `machine-file.ts:29`.
- `config/layout.yml:93` (`engine: true`), `catalogue.ts:54` and `docs.ts:43`.
- `config/sources.yml:80-81` (`roots: []`), and `HUB_LIST` lists `'roots'`.
- `roots.ts` is 395 lines.
- The hub's six roots: `sed -n '/^roots:/,$p' .oculus/config/sources.yml` printed cathedra, game-engine, ordo, scotoma, officium and youtube-downloader.
- `defaultWorkspacesPath` at `fs.ts:196-198`.
- The polls at `watch.ts:302`, `git.ts:700-701`, `portfolio.ts:322`, `open-files.ts:138-140` and `apps-hosts.ts:105-106`.
- `cat .oculus/workspaces.json` shows one workspace `name: ""` with `claude` and `oculus-state`. The dirs are absolute `/Users/axelfaes/...`; the brief writes `~/.claude`. Item 10 writes `~/` paths, which is fine.
- `DEFAULT_ROOT` at `fs.ts:129`, added at `:306`.
- The catalog lines in `files.yml` hold: `:6` `add_skipped`, `:125` `menu_save_workspace`, `:129` `menu_switch_workspace`, `:213` `refused_root_fixed`.
- `LOCAL_KEYS` matches the list (`local.ts:157-182`), and `hub` defaults to `resolve(engine,'..','..')` (`:201`).
- `grep -rln "loadLocal\|readLocal(" src | wc -l` printed 16. That count includes `local.ts` itself and the re-export in `config.ts`, and it misses `vite.config.ts` and `tests/fixtures/real-hub.ts`.
- G3 is at `guarded.md:13` and its Test line at `:15`.
- `private.ts` closes `~/.oculus`, each hub's `secrets` and the paths local.yml places (head comment, lines 1-7).
- `appearance.yml:56-75` holds the wallpaper and memories blocks as quoted.
- `choose` at `wallpaper.ts:46` matches the full name, then a part (`:54`), then picks random or the first.
- `ls -a demo/.oculus` prints only `config`.
- ADR: `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both.

**Imprecise:**
- `config/catalogs/options.yml:64-100` covers `wallpaper.dir` (64) to `wallpaper.themes` (100). `panel_opacity` is at 107, `popover_opacity` at 115, `panel_blur` at 123 and `memories.dir` at 131. The rows run from 64 to about 135.
- "The desktop app reads its port (`src/desktop/app.ts:43`, `src/desktop/server/process.ts:29`)": both lines are the doc comment "The port a missing local.yml means" over `defaultPort`. The desktop app does not read local.yml for the port. It passes `--default-port` (`process.ts:82-83`). The server reads the port through `readLocalWithDefault` (`server/root/process/start/port.ts`), and the app reads the hub and `claude_bin` through `machineFacts(args.engine, ...)` (`app.ts:322`, `first-run.ts:209-221`). The brief names neither `port.ts` nor `first-run.ts`.
- The list of `workspaces.json` readers misses `server/root/watch/git-start.ts:37`, `server/root/watch/apps.ts:172`, `server/root/context.ts:309,359,821`, `server/files/roots.ts:69`, `routes/api/(files)/fs/+server.ts:26` and `edit/writes/config/lists/roots.ts:386`. Source: `grep -rn "workspaces\.json\|defaultWorkspacesPath\|workspacesFile" src`.
- The worktree `.agents/worktrees/D68` and the base copy `D68-base` do not exist yet. `ls .agents/worktrees` printed only `gate`. That is expected before `spec` creates them.

**Facts the builder needs that the brief does not state:**
- `wc -l`: `src/lib/server/root/context.ts` is 880 lines, exactly at the cap, and any addition forces a split. `files/fs/ops.ts` is 860, `state/sources/fs.svelte.ts` 827, `root/watch/portfolio.ts` 799.

## 4. Cases and checks against spec.md

- **Case 15 breaks spec.md:63**: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says." Case 15 starts `npm run dev` (which is `vite dev`, package.json:9) and checks that "the page loads, the Files view shows `demo` alone, the Focus board shows the demo's projects". That is the look at landing. It also rests on vite's port, read by `vite.config.ts:114`, which is outside the write list. It belongs as a look-at-landing row, plus a unit run of the context over a scratch state that names a demo workspace file.
- **Case 14 (run)** checks a drawn state ("its open-in-editor is absent and the sentence says why"). By spec.md:63-64 that is the look. The first half, that rows for `wallpaper.dim` and a theme key write `config/appearance.yml`, can be a unit run of the config-key and config-value writers under G8.
- **The (test) cases are not mapped to guarded.md entries.** spec.md:58 says "A test exists only as the test of one entry of `agents/guarded.md` ... A step that needs a new entry stops and asks Axel for it." The brief names no entry for any case. Possible homes: cases 8-10 under G13 (`local.ts`), case 5 under G8 and G9 (roots write), case 11 under G3, case 12 under G2 and G49, cases 1-2 perhaps under G32 or G13. Cases 7 (switch), 4 (empty start), 6 (Save As) and 13 (wallpaper choice and the joined memories list) have no evident entry: `grep -n "wallpaper"` in guarded.md has no hit, and `memories` appears only in G1's token row. As written, the builder must stop on these mid-step. The brief should either name the entry for each case or have Axel's yes for new entries before dispatch.
- spec.md:58 also says "A step deletes the tests and entries its change makes obsolete". The brief names none of the obsolete rows listed under check 1 except G3's.
- **Verify item 6** reads: "A test that would still pass with the behaviour taken out of the code is an audit". This can be read as asking for a run with the behaviour removed, which spec.md:65 and the global no-breakage rule forbid. It should say the test is judged by reading.
- **Verify item 1** omits `npm run diagrams` before `test:quick` (spec.md:25), though `docs/diagrams/` is in the write list "(regenerated)".
- **Verify item 5's folder list** leaves out the folders that hold most cases' tests: `tests/routes/edit` (roots.test.ts, case 5), `tests/data/sources/config` (local.test.ts, cases 8-10), `tests/routes/apps` and `tests/state/system/apps` (case 12), `tests/server/root` (first-run, config-cache, inert-context), `tests/routes/replace`, `tests/server/git`, `tests/server/edit` and `tests/server/machine/lsp` (the G3 rows of case 11), and `tests/routes/docs`. Checked with `ls`.
- **Case 11's wording "each refuses as before"**, if copied into a test title, is a history word that spec.md:43 bans.
- **Case 4 "(a scratch HOME)"**: setting `HOME` in a test is process-wide state. spec.md:85 says "a dependency is passed in". The brief should say the context takes the state file's folder, or the home folder, as a dependency. Today `tests/server/root/inert-context.ts:57-70` (`scratchReadLocal`) injects `readLocal`.
- **Case 12's second half** ("a read of a hub's `.oculus/local.yml` answers `closed`") is checked against a place the new closure does not decide. The path is under the dot folder `.oculus`, so the existing dot-segment rule already answers `closed` (the G2 row 'an address for a path under a dot-led folder, answered closed'). See check 5.

## 5. Could each pass without the goal?

**Cases:**
- **Case 1.** Yes. It can pass on one roots function while the docs route (`docs.ts:102,530,766-768`, `?hub=` and the `root` default `HUB_ROOT`), app hosts, search (`api/search` takes `local.hub`), LaTeX, deposit and HPC still assume a fixed key or `local.hub`. It needs to name the units it covers: the file route, the fs listing, and the roots handed to search, LSP and app hosts.
- **Case 2.** Partly. The ids can be right while writes go to the wrong hub's file: `hubs.ts:52,98,100,138` compare against `HUB_ROOT`. No case writes a record of `lab:beta`, or of `research-hub:alpha` with no primary.
- **Case 3.** No for what it lists. It leaves out a name with `:` or `/` (the `:` is the id separator), and two names over one path.
- **Case 4.** It can pass while the desktop app or first-run still refuses the start for a missing hub (G73, `first-run.ts:164-170`).
- **Case 5.** No.
- **Case 6.** No for its inputs. Save As name validation (empty, `../x`, `a/b`) is missing.
- **Case 7.** Yes. "the watchers follow" can be shown for one watcher while the LSP relay, the app hosts (`apps-hosts.ts`), the open-files poll and the git watch still poll a fixed file. Each poller should be named.
- **Case 8.** Yes for the step line's "the port, the program paths and the HPC alias": only the port is tested. `vite.config.ts:114` and `port.ts` can still read the engine folder.
- **Case 9.** It can pass while the default accounts (`local.ts:204-206`, `claude` and `codex`) are added once per hub and so trip the repeated-label finding on every two-hub machine.
- **Case 10.** No.
- **Case 11.** No, if every row is moved.
- **Case 12.** The second half yes, as said in check 4. A test that exercises the closure lists the hub's `.oculus` folder itself as a workspace folder, so `local.yml` sits at a path with no dot segment.
- **Case 13.** It does not check a traversal value (`wallpaper.image: lab/../../secrets/x.jpg`), a `<hub>` part naming a non-hub or unlisted folder, or whether the fragment `x` is a finding (G13 says a wrong value is one).
- **Case 14.** A run that cannot show the drawn state passes by reading alone.
- **Case 15.** Not admissible (check 4).

**The step line:** it could pass with the Files view correct while the Settings view goes blank. `Settings.svelte:109,172,175-177` reads every config file's text with `fileText(ENGINE_ROOT, file)` and lists `catalogs/`, `schemas/` and `text/` with `listing(ENGINE_ROOT, path)`. With the root gone, those reads answer nothing. No case covers it.

**Items:**
- **Item 1.** Covered by case 3, except a file that does not parse.
- **Item 2.** It can pass while hub documents, the docs route's `?hub=` parameter, G74's engine-in-hub tab names (`pages.ts:505-506`, `engineHubPath`), the reference index (`build.ts:186,191`), the write-body default root (`state/client/writes.svelte.ts:290-433` sends no `root` for the hub) and the Settings listings still need a fixed key. No case touches them.
- **Item 3.** It can pass while the existing findings `project_in_hub`, `project_same_dir`, `missing_dir` and `hubs.id_prefix` (`config/text/findings.yml:18-35`) are dropped, because the item does not say whether they carry over.
- **Item 4.** "a state naming a file that is gone" has no case.
- **Item 5.** Case 5.
- **Item 6.** No case for bookmarks, notes, schedules or apps with and without a primary. That includes "their add actions say why".
- **Item 7.** "A relative path in a hub's local.yml resolves against that hub's folder", "removing one writes the file that holds the row", "the desktop app takes its port the same way" and the account-add refusal with no primary have no case.
- **Item 8.** "a photo added goes to the primary's folder, else the first hub's" and "oculus's own appearance.yml keeps only the look" have no case. The picker is a look item and is not named as one.
- **Item 9.** Its grep cannot pass without editing `config/schemas/manifest-schema.yml`, which is outside the write list.

## 6. Implied inputs the cases do not state

Each input below has a wrong answer that would cost something.
1. **Two folders over one real path** (a plain folder listed twice, or once through a symlink). Expected: a finding naming the file and the later entry, which is left out. Without it, git watchers, LSP servers and `sameDiskFile` run twice. Item 3 covers hubs only.
2. **A folder inside a listed hub.** This is Axel's landing setup: item 10 lists `oculus` at `~/workspace/research-hub/tools/oculus` inside `research-hub`. Expected: served under both names; `sameDiskFile` treats `research-hub:tools/oculus/config/x` and `oculus:config/x` as one file by real path; it is not a project. Also: a non-hub folder holding `.oculus/project.yml` inside a hub. Today that is `project_in_hub`, no project. The brief must say whether that stays.
3. **A workspace project whose folder name equals a primary project's bare id.** Item 3 gives a non-hub project "the folder's name as its id and the primary's prefix rule", so both carry the bare id. Expected: a finding naming both, and the folder's project left out. Otherwise a write can reach the wrong manifest.
4. **`primary` naming a folder that is no hub.** Expected: a finding, and the workspace runs with no primary.
5. **A workspace file that does not parse.** Expected: a finding naming the file, no folders served, and Add, Remove and reorder refused with the file left byte for byte (G31's rule).
6. **A workspace file edited by hand while oculus runs.** Expected: roots, portfolio and watchers follow at the next poll. Today the pollers watch one fixed path. They must now poll `~/.oculus/workspace.json` and the open file, whose path changes on a switch.
7. **A state file that does not parse, or names a file outside every hub's `.oculus/workspaces/`, or names a workspace file whose own hub it does not list.** Expected per item 4: an empty unsaved workspace, with the state not overwritten until a deliberate write (G31).
8. **A switch while a source tab of a removed folder holds unsaved text.** Expected: the tab keeps its text and shows the missing root, and nothing is forgotten while the roots are read (G28 and G69).
9. **A switch to a workspace whose primary sets another `port`, or other state paths** (`changes`, `history`, `approvals`, `lsp`, `sessions_cache`, `schedule_record`). The port cannot change in a running process. Moving the change log or the approvals mid-process loses undo and re-asks every app. Expected result unstated. It needs a decision: for example, read at start only, with a finding naming the key that changed.
10. **The desktop app with no workspace.** Expected: it starts on its default port with an empty workspace, and first-run reports no hub lack. Today `first-run.ts:164-170` makes a missing hub a required lack (G73).
11. **App hosts across a switch.** Machine apps come from the new primary's `.oculus/apps`, and root apps of removed folders stop (the guarded.md:51 row 'stops the host when ... the workspace changes'). Unstated: is a non-primary hub's `.oculus/apps` a root app or a machine app? And an app manifest whose `files:` names `hub` or `engine`: the finding `files_engine` (`docs/apps.md:39`) and its fate are not stated.
12. **Language servers per root.** The `~/.oculus/lsp` state follows `lsp` from the primary. Relay reconcile on a switch is covered by item 6.
13. **Deposit, LaTeX and HPC with `HUB_ROOT` and `local.hub`** (`git/deposit.ts:285`, `content/latex/endpoint.ts:201,222`, `pty/latex/latex.ts:196`, `hpc/submit.ts:152`, `sessions/index.ts:60`, `content/deck/read.ts:90-91`). Expected: each resolves a project's hub by its record's name, and does nothing for a hub not listed. A deposit to the wrong folder pushes the wrong code.
14. **The `hubs.ts` write with no primary.** Expected: every record id carries `<name>:` and is routed to its hub. A bare id answers not found. With no hub, a new project form has no `new_project_dir` and is refused with a sentence.
15. **The reference scan of oculus's own config without the engine root** (`build.ts:186,191`, `lookup.ts:92`). Expected: references into the engine's config resolve to the workspace folder that holds it, and with none they have no openable definition. Unstated.
16. **The test fixtures.** `tests/server/root/inert-context.ts` (`scratchReadLocal` moves `workspaces` and other state under the scratch engine) and `tests/fixtures/real-hub.ts` (`realHub` uses `loadLocal(engine).hub`, a key that goes). Expected: the context takes the state folder as a dependency, and `realHub` finds the hub two folders above the engine without a config key. The brief must say this, because the four real-hub tests (spec.md:37) depend on it.
17. **Two hubs that set no `accounts`.** Expected: the default `claude` and `codex` rows appear once, with no finding.
18. **A leftover `config/local.yml` in an oculus checkout reached through a workspace folder.** Examples: another checkout, or a worktree under `.agents/worktrees/` inside the hub. Item 7 stops guarding it, so it would be served and given to the YAML server. Whether such files exist was not checked, because the brief forbids listing them. The brief should decide whether oculus's own `config/local.yml` stays a closed name or is left unguarded.
19. **Two hubs that each hold `.oculus/workspaces/lab.yml`.** The Switch Workspace list and `:workspace lab` in the palette (HELP.md:285) need a rule for telling them apart.
20. **A listed folder that gains or loses `.oculus/config/` while oculus runs.** Expected: it becomes or stops being a hub at the next build, as G61's rows say for the hub layer.

## 7. ADRs

`ls docs/adr tools/oculus/docs/adr` printed "No such file or directory" for both. `find . -maxdepth 4 -type d -iname adr` found none. The brief's line 5 holds.

## 8. Dictated text

- **The YAML example, brief lines 34-37.** `grep -n "folders:\|{ name: research-hub\|{ name: claude\|primary: research-hub" D68.md` printed lines 34, 35, 36 and 37. It holds: ASCII (`LC_ALL=C grep -n '[^ -~]' D68.md` printed nothing), no user path, and one line per entry. It uses two-space list indentation, as the hub's existing data YAML does (`.oculus/config/sources.yml:11-15`). spec.md:48's four-space rule binds authored source formatted by prettier, and the config YAML is prettier-ignored (`.prettierignore:19-26`). The brief should say Save Workspace As writes exactly this flow style, since the file's text shape is then oculus's output.
- **The quoted names in item 10** (`.oculus/workspaces/research-hub.yml`, `research-hub`, `oculus`, `claude`, `oculus-state`) hold. `oculus` does not collide with `rootKey`'s name for `~/.oculus`, because item 10 names that one `oculus-state`.
- No catalog sentence is dictated. Every refusal sentence is left to the builder (see Other findings).

## Other findings

**Wrong or incomplete on the tree:**
- "oculus's own documents ... stay served by the docs route as they are" (item 2) cannot hold literally. `server/content/docs.ts:71,102,530,613,766-768` and `state/system/docs.svelte.ts:237-241` key hub documents and the engine-in-hub document on `HUB_ROOT` (the `?hub=` query parameter, `root` defaulting to `HUB_ROOT`, `engineAt` in the hub). G74 (guarded.md:206) describes this behaviour. The brief must say what the hub documents (the hub layer's `docs:` key) and G74's links become with a primary and with none.
- G73 (guarded.md:203) requires refusing a start for a missing hub folder. Item 4 requires an empty start with nothing erroring. The brief does not name `first-run.ts` or G73. This is a clash between a guarded guarantee and the ruling, and it goes to the orchestrator to resolve before dispatch.
- The G3 checks list in item 7 leaves out the three routes that pass `local: localFile(server.engine)` to `protectedFiles` (`ops.ts:375`): `routes/api/(machine)/lint/+server.ts:33`, `routes/api/(git)/git/+server.ts:34` and `routes/api/(files)/ops/+server.ts:41`. It also leaves out the local.yml watcher `server/root/watch/local.ts`, which watches oculus's `config/` folder for hand edits and must now watch every hub's `.oculus/`, following a switch.

**Requirements the builder will need that the brief leaves unsaid:**
- **How a switch reaches the server today.** The page writes `current` into `workspaces.json` through the fs write route. Five pollers watch that one fixed path: `lsp/held/watch.ts:302`, `root/watch/git.ts:700`, `root/watch/portfolio.ts:322` (queue, then rebuild), `files/fs/open-files.ts:138` and `root/process/apps-hosts.ts:105`. In addition, `context.ts:816-823` re-follows when local.yml's `workspaces` or `hub` changes. After the change there are two files: the state file, and a workspace file whose path changes on a switch. The brief's "as a switch does today" does not say this.
- **How the merged portfolio is rebuilt.** `portfolio.ts` reads `browserRoots`, `hub: true` roots go through `joinHubs` (`data/index.ts`), and `merge.ts` and `hub-names.ts` prefix ids. The first hub is `local.hub` together with the config cache's hub layer (`config-cache.ts:8`). The brief does not say the hub settings layer becomes the primary's, nor what the merged config is with no primary.
- **The Settings view.** It reads each engine config file's text and lists `catalogs/`, `schemas/` and `text/` through the `engine` root (`Settings.svelte:109,172,175-177`; `settings/List.svelte:94` opens files by `ENGINE_ROOT`). The brief says only that writes go by path and that the open needs a workspace folder. Something must give the view the files' text and the folder listings without serving the folder, or the Catalogs, Schemas and Texts groups and the file statuses go blank. This is user-visible. Also: the "This machine" section (options.yml `local.yml:` entries, `groups.ts` `local: file === LOCAL_NAME`) shows which hub's file, and hub-list keys with no primary are refused or hidden. Unstated.
- **Wire formats and saved-record keys left unnamed**, which spec.md:18 asks the brief to name:
  - the keys of `~/.oculus/workspace.json`, which the orchestrator also writes at landing (item 10);
  - the workspaces answer to the page, which today is `{ current, workspaces }` with `ShownRoot.fixed`;
  - the default of a write body with no `root`, today the hub (`writes.svelte.ts:290-433`, docs.ts);
  - the record `root` field apps read, "absent or `hub` for the first hub" (`docs/apps.md:338,344,375`);
  - the route that serves a thumbnail or memory image of a named hub;
  - the memories list answer's hub field.
- **Landing data (item 10).** It must also remove a `workspaces:` key if local.yml has one, which would otherwise become case 10's finding. It must check for relative paths, because item 7 moves their base from the engine folder to the hub. It should consider converting `~/.oculus` saved layouts and change records that name `hub:` or `engine:` roots. spec.md:42 allows the orchestrator to change data once. Z821 chose "shows as unknown" without weighing that option, and the unknown views are the lazier option.
- The shipped `config/layout.yml:93` doc tab id `engine:docs/apps.md` is a document id, not a root. The brief should say it stays, so the builder does not read "a saved page that names `engine:`" as covering it.
- The new picker in the Settings view needs a `ui/` primitive (spec.md:51). None exists for a thumbnail grid, and the brief does not say whether one is added to `ui/`.

**Choices left to the builder that are user-visible:**
- every refusal and empty-state sentence (Save As refused, no primary, account add refused, no open for engine files);
- the picker's layout and its place in Settings;
- the recent list's length and how gone files show in it;
- the unsaved workspace's name in the header;
- the stem `rootKey` uses once `DEFAULT_ROOT.key` (`workspace`) goes (`fs.ts:329`);
- whether closing "oculus's own folder" to apps (item 2) means the whole engine folder or its `config/` folder. DESIGN.md:410 closes `config/` today, and closing the whole folder would also hide `src/` from apps.

## Declined to judge

- Whether a leftover `config/local.yml` exists in any worktree or other checkout (implied input 18). Checking would mean listing files named `local.yml`, which this task forbids.
- Whether the real hub's `.oculus/local.yml` exists, and whether Axel's local.yml has relative paths or a `workspaces:` key. Same reason.
- Whether `.oculus/workspaces/research-hub.yml` should be tracked in git (`.oculus/workspaces.json` is tracked, per `git ls-files .oculus`). That is a landing decision, not a fact on the tree.

Usage: a8997d9ca2c7cbe23, claude-opus-5-5, 237,719 tokens, 72 tool uses, 11.1 min.
