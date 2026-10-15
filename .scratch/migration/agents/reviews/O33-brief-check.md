# Step O33 brief check (on main at 69252f5d9)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O33.md`. Read from the working tree: the brief is untracked and `plan.md` carries uncommitted changes (`git diff --stat -- tools/oculus/.scratch/migration/plan.md`: 12 insertions, 1 deletion: the "Premises corrected at O33's /spec" Step 0 bullet, Z906 to Z914, and agent 21 in the Agents section). `plan.md` has no `## Goal` heading. Its goal is its opening line, "Execution ledger for `tools/oculus/DESIGN.md`" under "# Migration plan: cockpit to oculus". The part of that goal O33 delivers is taken as the step's own line: oculus out of the hub into its own repository, the cockpit retired, oculus running on Linux, and parts (4) to (14).

## 1. Names

- `tools/cockpit` (deleted in phase B): `git grep -n tools/cockpit -- ':!tools/cockpit' ':!tools/oculus/.scratch' ':!*local.yml'`. It finds the 15 files the brief lists, so the list is complete. The brief names only some of the lines in those files: `CLAUDE.md:39,41,47,88,101`, `README.md:21,22,23,26`. These lines also become false and are covered only by part 2's general bullet ("Every file outside `tools/cockpit` that names it ... is changed"):
  - `CLAUDE.md:53` ("`python3 tools/cockpit/build.py --selftest` passes, and `--dummy` too ... `bash tools/cockpit/tests/run.sh` passes").
  - `CLAUDE.md:102` ("`python3 tools/cockpit/build.py` reports broken refs").
  - `README.md:3`, `README.md:16` and `README.md:28-37` (the glyph-surface list under the Unicode policy).
  - `docs/RESEARCH-APPROACH.md:90` (cites `tools/cockpit/src/cockpit/schema.py:61`).
  - `.gitignore:13,129-136`.
  - `.agents/plan.yaml:12` (`worktree_paths` names `tools/cockpit`). The brief's path list gives only "its `tools/cockpit` roadmap line" (line 5).
  - `.agents/skills/project-cleanup/SKILL.md:255` ("Run `python3 tools/cockpit/build.py`"). This line is outside the brief's paths, which name only line 18 of that file.
- `tools/cockpit` without the path. These say "cockpit" or `build.py` and become false, but no grep for the path finds them: `CLAUDE.md:20` (`build.py --selftest` as a gate), `CLAUDE.md:60` ("cockpit groups them"), `feeds/literature-radar.yml:3` ("rendered into cockpit.html by build.py radar_tab_html"), `feeds/position-leads.yml:1,4-5` ("the profile in README.md (the search spec)", "the cockpit reads it with yaml.safe_load"). The brief's paths name only line 10 and line 2 of the two feeds.
- `.agents/plan.yaml:5` `roadmap: tools/cockpit/ROADMAP.md`: deleting `tools/cockpit` deletes the roadmap file the plan skills read for project `oculus`. The brief names the line as written but does not say what it becomes.
- `/research-cockpit`: `git grep -n /research-cockpit -- ':!tools/oculus/.scratch' ':!*local.yml' ':!.agents/skills/research-cockpit'`. These hits are outside the brief's list in part 2(d) and its premise:
  - `tools/oculus/HELP.md:485` ("written by the card and by `/research-cockpit inbox`").
  - `tools/oculus/tests/fixtures/hubs/demo/feeds/literature-radar.yml:2`.
  - `tools/oculus/src/lib/server/machine/runs/schedules/task.ts:5` (the head comment).
  - The tests `tests/routes/sessions/terminal-actions.test.ts:92`, `tests/server/machine/runs/schedules/run.test.ts:46,55` and `tests/data/sources/feeds.test.ts:43-45`.
  - `tools/present/content/present.yml:3` ("(or /research-cockpit present)"), outside the brief's paths.
  - `projects/archive/nogo/fed-faithful-ecg/CLAUDE.md:21` and `projects/manuscripts/ecg-readable-substrate/CLAUDE.md:22` ("then rebuild the cockpit (`/research-cockpit`)"), outside the brief's paths, under `projects/`, which the rules file bans unless a brief names it.
- `research-cockpit`, `remove-unicode`, `project-new` (the skills deleted in phase B): `git grep -n -E "research-cockpit|remove-unicode|project-new" -- ':!tools/oculus/.scratch' ':!tools/cockpit' ':!*local.yml'`, plus `git ls-files | grep -E "(research-cockpit|remove-unicode|project-new)$"`. These hits outside the brief's paths become false or dangle:
  - The tracked symlinks `.claude/skills/research-cockpit`, `.claude/skills/remove-unicode`, `.claude/skills/project-new`, `.codex/skills/research-cockpit`, `.codex/skills/remove-unicode` and `.codex/skills/project-new`. Each points at the deleted folder (`ls -la ~/.claude/skills` shows the same links). They are in no phase B list.
  - `.agents/skills/project-cleanup/SKILL.md:102,263` (send the reader to the `remove-unicode` skill) and `:277` (`/project-new`). Project-cleanup stays, so these lines point at deleted skills. Only line 18 is in the brief.
  - `docs/AGENT-APPROACH.md:76` (names `research-cockpit` and `project-new` among the skills that "own the procedures") and `:106` (names `research-cockpit` among the skills). The file is in the brief's paths, but only for part 6, and no requirement rewords these lines.
  - Outside the repository: the memory index names "research-cockpit / project-new skills" (`MEMORY.md`, "Research cockpit infra"). The rules file does not reach it. It is named here for the session.
- `tools/oculus` as the place oculus lives (parts 1 and 5, and phase B's deletion): `git grep -n "tools/oculus" -- ':!tools/oculus' ':!*local.yml' ':!tools/cockpit' | grep -v "tools/oculus/.scratch"`. Hits outside the brief's paths that become false:
  - `.oculus/workspaces/research-hub.yml:12` `- { name: oculus, path: ~/workspace/research-hub/tools/oculus }`. This is the hub's workspace folder for oculus.
  - `.oculus/wallpaper/README.md:3` ("oculus's own value in `tools/oculus/config/sources.yml`").
  - `registries/data.yml:9` and `registries/pillars.yml:31` (both name `tools/oculus/config/catalogs/vocab.yml`). Only `registries/data.yml`'s `tools/cockpit` line is in the brief.
  - `CLAUDE.md:33` ("justified from `tools/oculus/DESIGN.md`'s own goals") and `CLAUDE.md:35` ("A multi-package plan lives under `.scratch/<feature>/` inside the tool it belongs to"). After "Steps after O33" the oculus ledger is no longer inside the tool.
  - Outside the repository: `~/.claude/settings.json:60` and `~/.claude-work/settings.json:60`, `"command": "/Users/axelfaes/workspace/research-hub/tools/oculus/utils/claude-usage.sh"`. This is the status line of both Claude accounts. Phase B's deletion of oculus's code from the hub breaks it, and no phase lists it.
- The same name inside oculus: `git grep -n "tools/oculus" -- src tests config utils DESIGN.md README.md`:
  - `DESIGN.md:594` ("Name: `oculus`, at `research-hub/tools/oculus`.") becomes false.
  - `utils/migrations/convert-decks.mjs:211` `const DEMO = 'tools/oculus/tests/fixtures/hubs/demo';` is code that assumes oculus sits in the hub.
  - `tests/tiers/quick.mjs:61` `resolve(ROOT, '..', '..', path)` assumes the git root is two folders above oculus.
  - `README.md:19` of oculus ("The checks run from `tools/oculus`").
  - `tests/tiers/essential.txt:7`.
  - All of these are inside the brief's paths, but the brief does not name them.
- `notify:` / `OSASCRIPT` / `notify()`: `git grep -n -E "notify|osascript|OSASCRIPT" -- src tests`, plus `grep -n "^    notify:" config/text/server.yml`. The group `notify:` in `config/text/server.yml:3` holds `idle_chip` and `permission_chip`, which `src/lib/views/sessions/session-detail/DetailsBody.svelte:112,114` reads for the Session view. Only `notify.stop` is the notification's (`src/routes/api/(sessions)/hook/+server.ts:15`). Removing "its words" whole would break the Session view's chips.
- `docs/DATA-MAP.md` (removed): `git grep -n -i DATA-MAP -- ':!tools/oculus/.scratch' ':!*local.yml' ':!tools/cockpit'`. Every hit is inside the brief's paths: `.oculus/config.yml:29,63`, `CONTEXT.md:3,6`, `README.md:6`, `docs/RESEARCH-APPROACH.md:57`, `tools/oculus/HELP.md:465,468`, `docs/templates.md:105`, `config/sources.yml:28`, and the tests `pages.test.ts` and `doc-link.test.ts`, which use it as a fixture path. Holds.
- `tools/figures`: `git grep -n tools/figures`. Every hit is listed in the brief's premise. `tools/cockpit/design/SESSIONS.md:164` goes with the cockpit. Holds.
- The new names `recover_command`, `OCULUS_TEST_HUB`, `app:release`, `.oculus/tasks`, `.oculus/data/`: `git grep -n -E "recover_command|OCULUS_TEST_HUB|app:release|\.oculus/tasks|\.oculus/data/"` prints nothing. There is no collision.
- `HUB_LIST` (`src/lib/data/helpers/hub-names.ts:226-240`): `recover_command` and the two lint lists become hub-layer keys only when they are added to this list. A key outside it "is a finding and is not applied" (`hub-names.ts:219-221`). G83 (`agents/guarded.md:61`) makes `docs/templates.md`'s config.yml block show every key of `hubKeys`. The brief names neither.

Findings:
1. The tracked symlinks `.claude/skills/{research-cockpit,remove-unicode,project-new}` and `.codex/skills/{research-cockpit,remove-unicode,project-new}` dangle after phase B, and they are in no phase B list or path list.
2. `.agents/skills/project-cleanup/SKILL.md:102,255,263,277` name `remove-unicode`, `/project-new` and `tools/cockpit/build.py`. The skill stays, and only line 18 is in the brief.
3. `.oculus/workspaces/research-hub.yml:12` keeps the folder `oculus` at `~/workspace/research-hub/tools/oculus`. After part 1 and phase B it points at a removed folder. The file is not in the brief's paths.
4. `~/.claude/settings.json:60` and `~/.claude-work/settings.json:60` run `research-hub/tools/oculus/utils/claude-usage.sh` as the status line, which phase B's deletion breaks. No phase lists them for Axel's yes.
5. These lines name `tools/oculus` paths and become false, and none is in the brief's paths: `.oculus/wallpaper/README.md:3`, `registries/data.yml:9`, `registries/pillars.yml:31`. `CLAUDE.md:33,35` are in the paths, but no requirement covers them.
6. `projects/archive/nogo/fed-faithful-ecg/CLAUDE.md:21`, `projects/manuscripts/ecg-readable-substrate/CLAUDE.md:22` and `tools/present/content/present.yml:3` name `/research-cockpit` and are outside the brief's paths. Case A19's grep prints them, so A19 cannot pass inside the write list.
7. `docs/AGENT-APPROACH.md:76,106` name the deleted skills, and no requirement covers them.
8. `.agents/plan.yaml:5`'s roadmap points into the deleted `tools/cockpit`, and the brief does not say what replaces it. `.agents/plan.yaml:12` also names `tools/cockpit`.
9. The feed header lines `feeds/literature-radar.yml:3` and `feeds/position-leads.yml:1,4-5` describe the cockpit and the skill's README. Only lines 10 and 2 are in the brief.
10. `notify:` in `config/text/server.yml` holds the Session view's two chips (`DetailsBody.svelte:112,114`). The brief's "its words in `config/text/server.yml`" does not separate them from `notify.stop`.
11. `HUB_LIST` must take `recover_command` and the lint lists, as the ruling "O33 repository and release" says ("the two keys added to the hub list"), and `docs/templates.md`'s config block must follow by G83. The brief names neither.
12. `DESIGN.md:594`, `utils/migrations/convert-decks.mjs:211` and `tests/tiers/quick.mjs:61` assume oculus at `research-hub/tools/oculus` and are not named by part 5.

## 2. The step line

- (1) Extraction, what moves, what the hub keeps, oculus keeping its name, Axel pushes: met by part 1. "How the hub then runs it": part 1 bullet 3 says the hub docs say oculus is started at `~/workspace/oculus`. The hub's own workspace file `.oculus/workspaces/research-hub.yml:12` and the two runners' status line (Names 3 and 4) are not covered.
- (2) The cockpit retired as O29 read: "launcher repointed" is met by Z907 (the launchers deleted, `app:package` as the launcher). "The `research-cockpit` skill and the hub docs updated", with each deletion listed path by path for Axel's yes: met by part 2 and phase B. "`tools/cockpit` archived": the brief deletes `tools/cockpit/` in phase B. "Archived" in the step line, and in Step 0 (g)'s "before the cockpit is archived", is turned into deletion by no ruling and no decision of the brief. "This folder deleted" is mapped to the ledger kept, by the ruling "Steps after O33": met.
- (3) Linux and WSL2: part 3. "Each platform branch held by a unit test with the platform passed in": part 3 says "so a unit test holds each branch". "Cases" then limits tests to the rules file's test rule, which allows a test only under an entry of `agents/guarded.md`. No entry is named for the shell fallback, the packager or the hook (see section 4). "The page looked at on TEST through Lima's forwarded port": the brief says "on a scratch page". The removal of the notification, tmux as the only backend, no native Windows and no CI are met.
- (4) README quickstart: part 4. Met.
- (5) A general research-hub app: part 5. The memories move went to D59 (Step 0). `ENGINE_IN_HUB` was corrected by a premise. The Data map, the hub and project controls, and the folded D77 item are met.
- (6) `tools/figures` to `docs/figures`: part 6. Met.
- (7) No dependency on the hub's `tools/`: part 7. Met, except the hub-list keys of the ruling (Names 11).
- (8) `.gitignore`: part 8. Met.
- (9) The private repository with description and topics, and a Release with a self-contained build after Axel's push: part 1 and part 9. The ruling "O33 repository and release" puts a Linux tarball in the Release. Phase C orders "the draft Release with the two builds; the Lima run of part 3", but the Linux build can only be made on Linux (the Lima machine), and the Lima run's command list (`npm ci`, `npm test`, `npm run build`, the server) has no `npm run app:release`.
- (10) to (14): parts 10 to 14. Met. Part 14 names `methods.ts` but not the places the step line names (`state/system/apps/frame/documents.ts:20`, `server/machine/apps/reach/open.ts:2`). The server check of `{ root, path }` is not addressed.
- Step 0 bullets: the `local.yml` line is in part 8, the pause lifted is under Executor, memories went to D59, `node_modules` and `servers.ts` are folded items, (a) to (g) of open item 109 are in part 2, the D77 page item is in part 5, and the premises are corrected. Met.
- Phase order: phase B's last deletion waits on "the new repository holds it and Axel's server runs from it", which is phase C. B is listed before C with no statement that this one item follows C.

Findings:
1. "`tools/cockpit` archived" (the step line and Step 0 (g)) is delivered as deletion, with no ruling or decision of the brief that says so.
2. The Linux tarball of the Release has no place in phase C. The Lima run builds no release archive, and the Release is listed before the Lima run.
3. The step line's "the page looked at on TEST" becomes "a scratch page".
4. "Each platform branch held by a unit test" has no guarded entry named for the shell fallback, the packager or the hook change (section 4, finding 2).
5. Part 14 does not mention the server-side check `server/machine/apps/reach/open.ts` that the step line names.
6. Phase B's deletion of oculus's code depends on phase C, but it is listed in B.

## 3. Premises

- Part 1, `open.ts:2-40`, `engine-dir.ts:19-27`, `docs.ts:455-465`: `sed -n` of each. The workspace reading, `engineDir` walking up to `package.json` and `config/`, and `enginePlace` returning `{ hub: '', at: '' }` all match.
- `git grep -n ENGINE_IN_HUB -- src`: prints nothing. Matches.
- The real-hub helpers: `sed -n 25,35p` shows `tests/fixtures/hubs/real-hub.ts:30` and `tests/data/real-hub.probe.ts:31` `const hub = resolve(engine, '..', '..');`. `git grep -ln real-hub -- tests src` prints `config-folder.test.ts`, `integrity.test.ts` and `real-hub.probe.ts`. Matches. The brief also says these and the part 7 paths are the code that assumes oculus is inside the hub. `git grep -n -E "resolve\([^)]*'\.\.', '\.\.'"` also finds `tests/tiers/quick.mjs:61`, and `git grep -n "tools/oculus" -- utils` finds `utils/migrations/convert-decks.mjs:211`. Differs.
- `package.json`: `python3 -c` over it prints `oculus True 0.0.1 None`, `app: electron .`, `app:package: node src/desktop/package.ts`. Matches. It also prints `engines` `{'node': '^24.15.0 || >=26.0.0', 'npm': '>=11'}`, which bears on part 4.
- `git ls-files tools/cockpit | wc -l`: 190. `git ls-files tools/cockpit/app` shows the three launchers, and port 8787 appears in `Cockpit Serve.command:16`, `Stop Cockpit.command:11` and `Cockpit.app/.../cockpit:24`. Matches.
- The file list from `git grep -l tools/cockpit -- ':!tools/cockpit' ':!tools/oculus/.scratch'`: the same 15 files. Matches.
- `taskCommand`: `task.ts:42` declares it and `:45` is `argv.push(\`/research-cockpit ${kind}\`);`. Matches.
- The texts naming `/research-cockpit`: `git grep -n /research-cockpit` prints every place the brief lists. It also prints `tools/oculus/HELP.md:485`, `tests/fixtures/hubs/demo/feeds/literature-radar.yml:2`, `task.ts:5`, three test files, `tools/present/content/present.yml:3` and two `projects/*/CLAUDE.md`. `config/sources.yml` and `config/catalogs/options.yml` hold none. The list differs, and the extra places are in section 1.
- `SCOUT_RUN`: `src/lib/data/sources/documents/feeds.ts:32` `/^\s*(\d{4}-\d{2}-\d{2})\b.*?scout/i`. Matches.
- The hub lines `CLAUDE.md:39,41,47`, `README.md:22,23,26`, `CONTEXT.md:17`, `docs/HPC-UTwente-howto.md:183`, `CLAUDE.md:88,101`, `README.md:21` and `project-cleanup/SKILL.md:18` were read with `sed -n` and `grep -n`, and each names what the brief says. Matches. As a full list of the hub lines that change it is short (section 1).
- Part 3, `package.ts:82` (`platform: 'darwin'`) and `:95` (`ditto`): matches. `picker.ts:198` refuses a platform other than darwin: matches. `pty/routes.ts:171` and `pty/sessions.ts:299` hold `/bin/zsh`: matches. `hooks.ts:31` holds `OSASCRIPT`: matches. `first-run.ts:141` is `const mac = platform === 'darwin';`: matches.
- `open.ts`: `grep -n -E "export (async )?function|const OPEN" src/lib/server/files/open.ts` prints `252:export function openArgs`, `259:export async function macOpenPath`, `68:export const OPEN = '/usr/bin/open';`. The brief says "`openArgs` at 262-264, `macOpenPath` at 269". Differs.
- The list of macOS-only calls ("The window options, the bridge, the menu and the windows already take the platform as a value"): `git grep -n -E "'/usr/bin/[a-z]+'|'(sips|iconutil|codesign|xattr|...)'" -- src` also finds:
  - `open.ts:69` `const XATTR = '/usr/bin/xattr';`, read by `readFinderInfo` (`open.ts:120`), which `openable` calls for every file.
  - `open.ts:291` `export const macOpenAddress: Opener = addressOpener(OPEN);`, used for https addresses (`server/root/context.ts:209`).
  - `package.ts:59` `sips`, `:65` `iconutil` and `:96-97` `codesign`.

  The brief's list differs.
- `notify:`: `grep -n -E "^notify:|Hook push|Hook event names" config/behavior.yml` prints 99, 100 and 101. `grep -n -E "notify\.(enabled|events|quiet)" config/catalogs/options.yml` prints 410, 416 and 423. `config/text/server.yml:3` is `notify:`. Matches. The group's contents differ from what "its words" implies (section 1).
- `which limactl`: `limactl not found`, rc 1. Matches.
- Part 4: `ls tools/oculus/README.md tools/oculus/tests/fixtures/hubs/demo` exists. Matches.
- Part 5: `docs/DATA-MAP.md` exists, and `docs/templates.md` has "## The hub's data files" at line 403 with one template per data file. Matches.
- Part 6: `git grep -ln tools/figures` lists the four documents and `gen_figures.py` as the brief does. Matches.
- Part 7: `git grep -n redownload -- src config` prints `pty/routes.ts:372`, `state/sources/registries/datasets.ts:51` and `config/text/views/sources/data.yml:8`. Matches. The hub patterns: `sed -n 194,225p config/behavior.yml` shows `writing_skip` running from 194 to 208, with the hub patterns at 205-208, and `writing_glyphs` running from 209 to 225, with its hub patterns at 210-225, not 210-220. The `options.yml` defaults run past 776 to about 781. Differs in its upper bounds.
- Part 8: `cat tools/oculus/.gitignore` prints `node_modules`, `.svelte-kit/`, `build/`, `.svelte-kit-app/`, `build-app/`. Matches.
- Part 9: `package.ts:1-9` is the comment that describes the stub, and `gh auth status` prints "Logged in to github.com account TheAxeC". Matches.
- Part 10: `FieldFilters.svelte:31-38` draws one `Chip` per chip. `git ls-files src | grep -i multiselect` prints `src/lib/ui/forms/choice/MultiSelect.svelte`. Matches.
- Part 11: `TitleBar.svelte:2-22` says "in the desktop app and in a browser alike". `Workbench.svelte:366` and `FloatWindow.svelte:51` draw `<TitleBar`. Matches.
- Part 14: `grep -n "Object.keys(file).length" methods.ts` prints `406:` (the refusal of a third key). The brief says 400-404, which is near and in the same block. `viewer.svelte.ts:347` is `goToPage(page: number)`, and it already clamps to `1..this.pages`. `pdf-place.ts:1-12`: matches.
- Folded items: `wc -l servers.ts` gives 647 lines, and `grep -n allow-fs-read` prints lines 444 and 557, both `join(options.oculus, 'node_modules')`. Matches. `agents/guarded.md:27` is G7's Test line, and G7's Code line names `servers.ts`. Matches.
- "Unknown view": `git grep -n -i "unknown view" -- config` prints `config/text/ui.yml:141: unknown_view: 'Unknown view: {0}'`. The brief says `:145`. Differs.
- "Where you work": the worktree is "sparse over the configuration's `worktree_paths` plus `.agents/skills`, `CLAUDE.md`, `README.md`, `CONTEXT.md` and `.gitignore`". `grep -n worktree_paths .agents/plan.yaml` gives `[tools/oculus, tools/cockpit, feeds, registries, projects, funding, network, education, applications, tasks, side-projects, tools/present, deck, docs]`. Phase A writes `.oculus/tasks/*.md`, `.oculus/config.yml`, `.agents/plan.yaml` and the `git mv` of `tools/figures`, and none of these is in that sparse set (`git ls-files .oculus` shows `.oculus/config.yml` is tracked at the hub root).

Findings:
1. `open.ts`: the brief says `openArgs` is at 262-264 and `macOpenPath` at 269. `grep -n` prints 252 and 259.
2. `config/text/ui.yml:145` in the brief. `git grep -n` prints `:141`.
3. The `writing_glyphs` hub patterns are 210-225 in `behavior.yml`, not 210-220, and the `options.yml` defaults run past 776.
4. The macOS-only call list is missing `/usr/bin/xattr` (`open.ts:69,120`), the https opener `macOpenAddress` through `/usr/bin/open` (`open.ts:291`, `context.ts:209`), `sips` and `iconutil` (`package.ts:59,65`) and `codesign` (`package.ts:96-97`). On Linux, `xattr` missing makes `openable` refuse every file, since `readFinderInfo` throws and `openable` catches it as false (`open.ts:231-247`).
5. The `/research-cockpit` place list is missing `HELP.md:485`, the demo hub's `feeds/literature-radar.yml:2`, `task.ts:5` and the three test files. Outside oculus it is missing `tools/present/content/present.yml:3` and the two `projects/*/CLAUDE.md` lines.
6. "The code that assumes oculus sits inside the hub is now the two test helpers ... and the hub paths of part 7": also `utils/migrations/convert-decks.mjs:211`, `tests/tiers/quick.mjs:61` and the sentence `DESIGN.md:594`.
7. The sparse worktree does not hold `.oculus/`, `.agents/plan.yaml` or `tools/figures`, all of which phase A writes.

## 4. Cases and checks

- A1: consistent. It also needs the server side's answer for a missing file (section 6).
- A2: consistent with the rules. It reads `SCOUT_RUN` (`feeds.ts:32`), which the step does not change, and it passes on the unchanged tree.
- A3, A4, A5: consistent with the rules file's "What every package obeys", but the tests they imply need guarded entries. The rules file says "A test exists only as the test of one entry of `agents/guarded.md`", and "A step that needs a new entry stops and asks Axel for it". G42 covers the picker (`guarded.md:28-30`), G7 covers open, and G73 covers first-run. No entry covers the shell fallback (`pty/sessions.ts:299`, `pty/routes.ts:171`), the packager or the hook's notify removal. The brief does not say which entry each platform test sits under, while the step line asks for "each platform branch held by a unit test".
- A6, A7: consistent. A7 follows the rules file's "No migration code".
- A8, A9, A10, A11: consistent.
- A12, A13: these need a DOM. The rules file says "A builder runs no page" and that such a case's proof is the look. The executor is the orchestrator and the brief's verify item 4 is a look, so this is consistent.
- A14, A15, A17: consistent.
- A16: rests on a diagnosis record that does not exist yet (Declined to judge).
- A18: "the unzipped app starts with the checkout moved away (`mv` to a scratch name and back)". The brief does not say which checkout. Axel's running server uses main's `tools/oculus`, and the rules file's "Where you work" forbids disturbing the process on his port. A move of main's checkout would take his server's files away while it runs.
- A19: "after phase B prints only the `feeds/position-leads.yml` history lines". `git grep` of the same pattern also prints `projects/archive/nogo/fed-faithful-ecg/CLAUDE.md:21`, `projects/manuscripts/ecg-readable-substrate/CLAUDE.md:22`, `tools/present/content/present.yml:3`, `.agents/skills/project-cleanup/SKILL.md:102,263,277`, `docs/AGENT-APPROACH.md:76` and the symlink blobs `.claude/skills/project-new`, `.codex/skills/project-new`, `.claude/skills/remove-unicode` and `.codex/skills/remove-unicode`, whose target paths hold the names. Most of these lie outside the brief's paths, and the rules file bans writes under `projects/` that a brief does not name.
- The brief's opening says the rules file governs "this step unchanged", but several of its own requirements contradict that file:
  - The rules file's "Where you work": "You never run a git command". The brief needs `git mv tools/figures docs/figures`, `git init` and `gh`.
  - "A builder runs no page: it starts no scratch oculus". The brief's verify item 4 and the Lima server do exactly that.
  - "Token discipline": a whole-suite command is a finding of the review. The Lima run's `npm test` is one.

  The executor is the orchestrator, and the Lima run is Axel's ruling, so the brief needs to say which rules of the file do not bind the inline orchestrator.
- Verify item 3 uses `LC_ALL=C grep -n '[^ -~]'`. The rules file's last paragraphs say the perl ASCII gate "replaces the `grep '[^ -~]'` form wherever a brief or a check names it".
- The rules file's principles ask for `sh utils/unused-exports.sh` to be compared "with the base's, which the brief names". The brief names no base output for it.

Findings:
1. A3, A4 and A5, and the step line's "each platform branch held by a unit test", have no guarded entry named for the shell fallback, the packager or the hook change. Under the rules file's test rule that is a stop for a new entry, or a statement in the brief of which entry each test sits under.
2. A18 does not name which checkout is moved. Moving main's `tools/oculus` would take the files of Axel's running server away.
3. A19 cannot pass within "Paths this step writes" (the hits listed above).
4. A2 asks the builder to check `feeds.ts`'s `SCOUT_RUN`, a place the step does not change.
5. The brief says the rules file governs the step "unchanged", yet it asks for git commands, a scratch oculus server, a look and a whole-suite `npm test`, all of which that file forbids a builder. Which of its rules bind the inline orchestrator is not stated.
6. Verify item 3 uses the `grep '[^ -~]'` form that the rules file's ASCII gate paragraph replaces with the perl form.
7. The base output for `utils/unused-exports.sh`, which the rules file asks the brief to name, is not named.

## 5. The question

The goal is the part of the plan's goal the step delivers. For each case and check: could it pass without the goal being reached?

- A1: yes. It passes once `taskCommand` builds the sentence, whatever the four hub task files hold. No case checks that `.oculus/tasks/litwatch.md`, `scout.md`, `inbox.md` and `linkedin.md` carry the skill's sections and the runbook and readme in full, or that the scout file tells each run to write the `meta.log` line.
- A2: yes. It passes on the unchanged tree (`SCOUT_RUN` already reads that line).
- A3, A4, A5: yes on their own, since they are unit-level runs with the platform passed in. The Lima run covers the real Linux path, but only `npm ci`, `npm test`, `npm run build` and the page. No open, reveal or picker press on Linux is named in it.
- A6, A7, A8: no.
- A9, A10, A11: no.
- A12, A13: no, with the look.
- A14: no.
- A15: no.
- A16: not judged (Declined).
- A17: no.
- A18: no for macOS. Yes for the Release as a whole: no case runs the Linux tarball.
- A19: yes. It is a grep of text. It cannot show that the cockpit is gone from use, for example the Claude status line and the workspace file (section 1).
- Part 1: no check is named. A check would cover the repository with one commit and no `.scratch/`, private, with the description and topics (`gh repo view`), and no push.
- Part 2(c), the templates: no check, apart from G83 if the templates fall under it.
- Part 2(e) to (g), the hub lines: the only check is A19's grep.
- Part 4, the README: no check.
- Part 5, the Data map moved and `docs/DATA-MAP.md` removed: no check other than the links.
- Part 6, the images rendering from `docs/figures`: no check, for example that every `figures/` path a document names exists.
- Part 7, "oculus depends on nothing of the hub's `tools/`": only `git grep -n tools/deposit -- src` is named. No `git grep -n "tools/" -- src config` is named.
- Part 8: no check, though the `.gitignore` is a fact a `cat` shows.
- Part 13, the Session view's text: only the look.
- Part 2(f) "nothing in oculus names it": already true. `git grep -n project-cleanup -- tools/oculus ':!tools/oculus/.scratch'` prints nothing, so its check passes without any work.
- Verify items 1 to 3 pass on any change that is clean. Verify item 4, the look, is the only check of the visible parts.

Findings:
1. A1 passes without the four task files being complete instructions.
2. A2 passes on the unchanged tree.
3. A18 does not cover the Linux tarball, so the "build that runs on its own" for Linux has no check.
4. A19 is a text grep that misses the runtime users of the old paths.
5. Parts 1, 2(c), 4, 5 (the Data map), 6, 7 and 8 have no check of their own in "Cases" or "Verify".

## 6. Implied inputs

This is a code step.

- Part 2:
  - A schedule in `.oculus/schedules.yml`, or a POST to the terminal task route (`pty/routes.ts:389`), naming a task whose file the primary hub lacks. This has happened in kind, since schedules exist. Expected: refused with a word, no session started. Missing; A1 covers only the tray.
  - The Focus board's refresh lines (`focus.yml:64-66`) for a task with no file. Expected: they offer no task. Missing.
- Part 3:
  - Linux with no `/usr/bin/xattr`. Expected: the FinderInfo check is skipped on Linux, and a listed file without an execute bit opens. Missing. As built today, `openable` refuses every file.
  - An https address opened on Linux (`macOpenAddress`, the OAuth consent flow). Expected: `xdg-open` (`wslview` under WSL2), never `/usr/bin/open`. On Debian and Ubuntu, `/usr/bin/open` can be `openvt` through alternatives. Missing.
  - A folder target (`kind: 'folder'`, which is not a reveal) on Linux. Expected: `xdg-open` of the folder or of its parent. Missing; A3 covers a file and a reveal.
  - `xdg-open` (or `wslview`) missing. Expected: a refusal that names the program, as A4 does for `zenity`. Missing.
  - `SHELL` set to the empty string. `pty/routes.ts:171` uses `??`, so it gives `''`. Expected: the platform fallback. Missing; A5 covers unset only.
  - The packager on Linux, where `sips`, `iconutil` and `codesign` are absent. Expected: those steps are skipped. Missing.
  - The Linux build's architecture. The Mac is arm64 (`uname -m`), and Lima's `template://ubuntu-lts` on that host is an aarch64 machine. The brief dictates `oculus-<version>-linux-x64.tar.gz`, while native modules (`@napi-rs/keyring`) and the `@vscode/ripgrep` binary are per-architecture. Expected: the archive name comes from the built architecture, or the machine is started as x86_64. Missing.
  - `@napi-rs/keyring` on a Linux machine with no Secret Service (G76 covers secrets). Expected: a stated lack or refusal. Missing.
- Part 5:
  - Make Folder a Hub on a folder inside an existing hub, or on a repository folder that holds `.oculus/project.yml`. Expected: not offered, or the outcome stated. Missing.
  - Make Folder a Project on a folder that holds a root `project.yml` (every research project). Expected: not offered. Missing; A10 checks only `.oculus/project.yml`.
  - Make Folder a Project on a folder outside every scan folder of the hub. Expected: refused, or offered with the project shown. Missing.
  - `OCULUS_TEST_HUB` set to a path that does not exist or is not a hub. Expected: the skip line naming the variable, or a failure that says why. Missing.
- Part 7:
  - A dataset key holding a single quote (`a'b`), since a hub value reaching a shell is untrusted under the rules file. Expected: one shell word, `'a'\''b'`. Missing; A8 has a space only.
  - `recover_command` with no `{key}`. Missing.
  - Two hubs in the workspace, each with its own `recover_command`. Expected: the dataset's own hub's command runs. Missing.
- Part 10: a field with exactly 12 and with 13 values, the boundary. Missing; A12 has 300 and 4.
- Part 14:
  - `page: "3"` (a string), `page: -1`, and a path ending `.PDF`. Expected: refused as closed, or the case rule stated. Missing.
  - `open` with a page for a PDF already open in a tab. Expected: the open tab goes to that page. This is common and missing.

Findings:
1. A schedule or the task route naming a task whose file is missing. This has happened in kind; expected: refused, not started.
2. The Focus refresh lines for a task with no file.
3. Linux without `xattr`. Expected: listed files open. A wrong answer refuses every file.
4. The https opener on Linux. Expected: `xdg-open`/`wslview`. A wrong answer runs `openvt`.
5. A folder target on Linux.
6. `xdg-open` missing.
7. `SHELL` empty.
8. The packager on Linux without `sips`, `iconutil` and `codesign`.
9. The Linux archive's architecture against an arm64 Lima machine.
10. The keyring with no Secret Service on Linux.
11. Make Folder a Hub inside a hub or on a repository with `.oculus/project.yml`.
12. Make Folder a Project on a folder holding a root `project.yml`, and outside the scan folders.
13. `OCULUS_TEST_HUB` set to a bad path.
14. A dataset key with a quote, and two hubs each with a `recover_command`.
15. 12 and 13 values for the chips-to-MultiSelect switch.
16. `page` as a string, a negative `page`, an uppercase `.PDF`, and a PDF already open in a tab.

## 7. ADRs

- `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both. `.agents/plan.yaml` and the configuration block name no `adr` key. There is no record.

Findings: none.

## 8. Dictated text

- The repository description, "A local research workbench: the projects, manuscripts, grants, data and code of a research hub in one VS Code-like app.": `grep -n 'A local research workbench' agents/briefs/O33.md` finds line 72. Holds, and it is the ruling's words verbatim.
- The topics "research, research-management, workbench, academic, latex, sveltekit, electron, vscode": `grep -n 'research-management' agents/briefs/O33.md` finds line 72. Holds, and they are the ruling's.
- The `gh repo create TheAxeC/oculus --private --description ... --source ~/workspace/oculus --remote origin` command: line 72. Holds. It has no `--push`, as the hub's git rule requires.
- The task sentence, "Do the update task described in {0}, following it step by step.": `grep -n 'Do the update task described' agents/briefs/O33.md` finds lines 79 and 201. Holds.
- The replacement wording "run Lit Watch from the Update tray": `grep -n 'run Lit Watch from the Update tray' agents/briefs/O33.md` finds line 81. Holds.
- The menu items "Make Folder a Hub", "Make Folder a Project" and the button "Make": `grep -n 'Make Folder a' agents/briefs/O33.md` finds lines 100, 101, 159 and 160. Holds, in the catalogue's title case (`config/text/ui.yml` "Copy into New Window").
- The `.gitignore` lines `node_modules`, `.svelte-kit/`, `build/`, `.svelte-kit-app/`, `build-app/`, `release/`, `.DS_Store`, `*.log`, `.env*`, `coverage/`, `.vite/`: `grep -n 'release/., .\.DS_Store' agents/briefs/O33.md` finds line 116. Holds.
- The archive names `release/oculus-<version>-mac-arm64.zip` and `release/oculus-<version>-linux-x64.tar.gz`: `grep -n 'linux-x64' agents/briefs/O33.md` finds line 120. As prose it holds. The fixed `x64` conflicts with an arm64 Lima build (section 6, item 9).
- The release `gh release create v0.1.0 --draft --title "oculus 0.1.0"`: `grep -n 'gh release create' agents/briefs/O33.md` finds line 121. Holds.
- The Lima commands `brew install lima`, `limactl start --name oculus-o33 template://ubuntu-lts` and `limactl delete --force oculus-o33`: `grep -n limactl agents/briefs/O33.md` finds line 90. They hold as commands.
- The picker command `zenity --file-selection --directory`: `grep -n zenity agents/briefs/O33.md` finds line 87. Holds.
- The hub value `python3 tools/data/redownload.py {key}`: `grep -n 'redownload.py {key}' agents/briefs/O33.md` finds lines 110 and 158. Holds, and it is the ruling's.
- The README requirements line, "Node 24.15 or later, npm 11, git, tmux, Claude Code optional; on Linux `zenity`": `grep -n 'Node 24.15 or later' agents/briefs/O33.md` finds line 94. It is not true of the tree: `package.json`'s `engines.node` is `^24.15.0 || >=26.0.0`, and G73 (`agents/guarded.md:218`) makes the first-run check refuse a Node outside "24.15 or later on the 24 line" and 26, so Node 25 is refused. The rules file's "What every package obeys" says "A sentence in a document or a head comment that the change makes false is a defect of the change".
- The fixtures `2026-10-20 (scout task): sweep` (A2) and `python3 tools/data/redownload.py 'a b'` (A8): lines 152 and 158. They hold.

Findings:
1. "Node 24.15 or later" (brief line 94) is false against `engines` (`^24.15.0 || >=26.0.0`) and G73. It should say Node 24.15 or later on the 24 line, or 26 or later. No ruling of Axel's fixes these words, so the session can close it in the brief.

## Declined to judge

- Part 12 and case A16: `ls agents/reviews/O33-diagnosis.md` prints "No such file or directory". The diagnosis is still running in another agent, so whether the brief carries its causes, places, fixes and cases correctly cannot be read.
- Whether "`tools/cockpit` archived" in O29 and Step 0 (g) means deletion or a move to an archive folder. That is Axel's call; it is raised as finding 1 of section 2.
- What `.agents/plan.yaml` should hold after the extraction (the roadmap path, and whether `worktree_paths` keeps `tools/oculus` for the hub's ledger). The ruling "Steps after O33" describes how later steps run from the oculus repository, but no ruling assigns that change of the configuration to O33.
- Changing `~/.claude/settings.json` and `~/.claude-work/settings.json`: whether O33 repoints the status line or Axel does is his call, since it is runner configuration. It is named as a hit in section 1.
- The look and the Lima run were not run, under the task's rule against starting a server or the app.

Agent usage: adcbfd466be0be62e, claude-opus-5-5, 249,112 tokens, 79 tool uses, 11.8 min.

## Closed

Names:
1. The six skill links: added to phase B's deletion list (brief, "Where you work", phase B; "Paths this step writes").
2. `project-cleanup/SKILL.md` lines 102, 255, 263, 277: added to phase B's edits beside line 18.
3. `.oculus/workspaces/research-hub.yml:12`: added to phase C, after Axel's server runs from `~/workspace/oculus`, for his yes.
4. The status line of both runner accounts: added to phase C for Axel's yes; the files are outside the repository and are his configuration.
5. `.oculus/wallpaper/README.md:3`, `registries/data.yml:9`, `registries/pillars.yml:31`, `CLAUDE.md:33,35`: listed under "What is on the tree" and covered by part 2's rewording bullet; the files are in the paths.
6. `projects/archive/nogo/fed-faithful-ecg/CLAUDE.md:21`, `projects/manuscripts/ecg-readable-substrate/CLAUDE.md:22`, `tools/present/content/present.yml:3`: named in the paths and in the rewording bullet; A19 rewritten.
7. `docs/AGENT-APPROACH.md:76,106`: listed and covered by the rewording bullet.
8. `.agents/plan.yaml:5`: the roadmap moves to `tools/oculus/.scratch/ROADMAP.md` (decision 11, a self-rule); `worktree_paths` loses `tools/cockpit` in phase B.
9. The feed header lines: the paths widened to `feeds/literature-radar.yml` lines 1-10 and `feeds/position-leads.yml` lines 1-5.
10. `notify:` words: only `notify.stop` is removed; the two chips stay (part 3 and the premise).
11. `HUB_LIST` and G83: part 7 adds the three keys to `HUB_LIST` and the templates block follows.
12. `DESIGN.md:594`, `convert-decks.mjs:211`, `quick.mjs:61`, `essential.txt:7`, `README.md:19`: added to part 5.

The step line:
1. "Archived" is delivered as deletion: decision 10, a self-rule, booked.
2. The Linux archives: built on the Mac per target (decision 12, a self-rule); the Lima run now comes before the Release and starts the Linux arm64 archive.
3. The look through Lima's forwarded port: the Lima run's page is looked at on a scratch page of a scratch oculus, since the TEST page belongs to Axel's server on 8790, which a Lima server cannot serve; the step line's "on TEST" is read as the look page of the plan's `look:` rule for a server that is not Axel's, as D35's port move was.
4. Platform tests: the new guarded entry G85 (decision 13, a self-rule), written into `agents/guarded.md`.
5. Part 14 names the server check `server/machine/apps/reach/open.ts`.
6. Phase order: the deletion of oculus's code moved to the end of phase C.

Premises:
1. `open.ts` line numbers corrected to 252, 259, 68.
2. `ui.yml:141` corrected.
3. `behavior.yml:210-225` and `options.yml:754-781` corrected.
4. `xattr`, the https opener, `sips`, `iconutil`, `codesign` added to the premise and to part 3.
5. The `/research-cockpit` places added to the premise list.
6. The other code assuming the hub place added to the premise and part 5.
7. The sparse paths widened to `.oculus`, `.agents`, `tools/figures`.

Cases and checks:
1. G85 named (above).
2. A18 rewritten: the O33 worktree is renamed, never main's checkout.
3. A19 rewritten for the state after phase A and after phases B and C.
4. A2 rewritten as a reading of the scout file and a refused schedule.
5. The rules file's opening sentence now says which rules bind the builder and that phases B and C are the orchestrator's ruled actions.
6. Verify item 3 now names the perl ASCII gate (`agents/spec.md:100`).
7. The base output of `utils/unused-exports.sh` named in verify item 4.

The question:
1. A2 now reads the four task files against the skill's text.
2. A2 rewritten (above).
3. A18 covers the Linux archives.
4. A19 is kept as a text check, and the runtime users (the workspace file, the status line) are phase C items with their own checks.
5. A22 added: the hub tool paths, the `.gitignore`, the figure paths, the Data map; part 1's repository is checked by `gh repo view` at phase C; part 4's README by reading.

Implied inputs: 1 and 2 in part 2 and A2; 3 to 8 in part 3 and A3, A5; 9 in decision 12 and A18; 10 in part 3 and A21; 11 and 12 in part 5 and A9, A10; 13 in part 5 and A20; 14 in part 7 and A8; 15 in A12; 16 in part 14 and A14.

Dictated text: 1. The Node requirement rewritten to "Node 24.15 or later on the 24 line, or 26 and later".
