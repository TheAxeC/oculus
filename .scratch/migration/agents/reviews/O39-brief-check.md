# O39 brief check

Usage: aeebe0d3e26943120, claude-opus-5-5, 235,565 tokens, 82 tool uses, 13.4 min.

# Brief check of O39 (tools/oculus/.scratch/migration/agents/briefs/O39.md, 135 lines, mtime Oct 20 23:58; read again after it changed mid-check, and the findings below are against that version, which cites ruling O39 split and has part A built by a builder)

The findings that would stop or mislead the step come first:
- (1) item 5's calendar-link count gives 48 on the unchanged history, so part B would stop on a false hit;
- (2) the part A path case fails, because `.scratch/archive` does not exist;
- (3) the dictated YAML fails the prettier check inside test:quick and test:landing;
- (4) spec.md:38 forbids a builder to write a `project.yml`, and the brief asks for one;
- (5) one `npm run app:release` run writes one archive, not three;
- (6) the brief names no base copy, which spec.md:33 requires;
- (7) nothing says where ledger writes go between the clone and the deletion, and the deletion check as written (`git log -1` of both) cannot hold once item 6 adds its commit.

## Names

`git grep -n "tools/oculus" -- ':!tools/oculus' ':!**/local.yml'` returns the brief's list exactly. That is `.agents/plan.yaml:5,6,7,9,10,12`, `.oculus/config.yml:56-57`, `.oculus/workspaces/research-hub.yml:12`, `CLAUDE.md:35`, `CLAUDE.md:99`, `CONTEXT.md:3`, `README.md:3`, `README.md:21`, and `applications/.../source-ledger.md:568` (a record). Every one of these is in the write list for part C except the last.

Hits for other names that the brief's grep cannot see:
- `projects/active/linfoot-estimator/README.md:214`: "it cannot open a ledger for this project, because `.agents/plan.yaml` configures only oculus". Part C removes the hub's `.agents/plan.yaml`, which makes the reason in this sentence false. Found by `git grep -n "\.agents/plan\.yaml" -- ':!tools/oculus/.scratch'`. It is not in the write list.
- `~/.claude-work/settings.json` is a symlink to `~/.claude/settings.json` (`ls -la`: `/Users/axelfaes/.claude-work/settings.json -> /Users/axelfaes/.claude/settings.json`). The two "line 58" edits of part C are therefore one file. An edit through the link that writes by rename would replace the symlink with a plain file. `grep -n claude-usage` on both prints the same line 58, `/Users/axelfaes/workspace/research-hub/tools/oculus/utils/claude-usage.sh`.
- `~/Applications/Oculus.app/Contents/Resources/app/main.cjs` names `research-hub/tools/oculus` (`grep -rl "research-hub/tools/oculus" ~/Applications/Oculus.app/Contents`). This is the stub from `app:package`, which imports the checkout by its absolute path (`src/desktop/package.ts:2-4`). Deleting `tools/oculus` breaks it. It is not in the write list.
- `~/.oculus/views.json` holds 22 `tools/oculus` occurrences: Files-view selections and expansions (`"path": "tools/oculus/README.md"`, `"research-hub:tools/oculus/config"`) and side-view states keyed by `tools/oculus/src/...` and `tools/oculus/.scratch/migration/plan.md`. `~/.oculus/layouts.json` has 4, all in help text. After the deletion these view states point at missing files. Under the no-migration rule they show as unknown. That is a visible change, and part C lists no before and after for it.
- `docs/figures/gen_figures.py:396-397` defaults `OCULUS_DIR` to `~/workspace/oculus`. Part B makes it true. No change is needed.
- `docs/AGENT-APPROACH.md:58` lists "Oculus" as part of the research-hub layer. It stays true read as "apparatus I build". No change is needed.
- Inside oculus: `.scratch/migration/agents/spec.md` names `tools/oculus` six times (`:7`, `:33`, `:36`, `:76`, `:87`, `:101`), for example ":76 from `tools/oculus` in the worktree". `land.sh:71` (`landing_tool=$landing_root/tools/oculus`) and `land.sh:212` also name it. The state file names it in "Verification, every package" (`:319` `sh tools/oculus/.scratch/migration/land.sh`, `:323-325`), in "Procedures" (`:341` the absolute path of the verify command, `:343`), and in its config block comments (`:6`, `:8` "from tools/oculus", which has no trailing slash). Item 6 rewrites only the config block's `tools/oculus/` prefixes and "Where things are". The new `.agents/plan.yaml` points `rules:` at spec.md, so every later brief there would carry false paths. Found by `grep -n "tools/oculus" spec.md land.sh orchestrator-state.md`.
- Tests that name `tools/oculus` use it as a synthetic fixture path (`tests/data/helpers/hub-names.test.ts:32`, `tests/data/snapshot/reference-hub.ts:28`). They stay true.
- `DESIGN.md:416` uses `tools/oculus/config` as an example. It stays true.
- Searches that found nothing: `.claude/settings.local.json`, `.codex/`, `.oculus/tasks/` and `.git/info/exclude` (its nested-repos block is empty); symlinks into `tools/oculus` under the skills, bin, Applications and LaunchAgents folders (a `find -type l` loop printed nothing); `crontab -l | grep -c oculus` (0).

## The step line

O39's line and its Step 0 bullets (`plan.md:655-659`) against "What to build":
- O33 (1), extraction, what moves, history and ledger: items 1 and 4. Holds.
- O33 (1), "how the hub then runs it": the workspace path and the hub text, item 11. The desktop launcher (`~/Applications/Oculus.app`; Z907 says `app:package` is the launcher) has no requirement.
- O33 (1), oculus keeps its name, `~/.oculus`, each repository's `.oculus/` and its browser keys (ruling Rename dropped): nothing changes and no requirement is needed. Holds.
- O33 (9), the private repository, its description and topics, Axel pushes: item 8. Holds.
- O33 (9) and Step 0, "the draft Release v0.1.0 with the three archives of `npm run app:release`": item 9. One run writes one archive. `release.ts:78-79` defaults `--platform` and `--arch` to this machine and writes `release/oculus-<version>-<platform>-<arch>`. O33's own brief (A18, `O33.md:194`) names three runs: the default, then `-- --platform linux --arch x64`, then `--arch arm64`. O33's "no unpacked archive holds the checkout's absolute path (`grep -r`)" check has no requirement in O39.
- O33 (3), the Lima run: item 10. Two parts have no requirement. O33's line says "the page looked at on TEST through Lima's forwarded port", and the brief says "a scratch page". O33 decision 12 (`O33.md:239`) says "the arm64 one is run in Lima", meaning the release archive; the brief runs only the source tree in Lima.
- Step 0, the hub drops oculus from its `.agents/plan.yaml`, and the hub text: item 11. Holds.
- Step 0, the deletion of all of `tools/oculus` on Axel's yes: item 11. Holds.
- Step 0, "before the repository is made public, `git filter-repo --path .scratch/ --invert-paths` takes the ledger out of its history": no requirement, and it is not booked anywhere the new repository carries forward. O39 is the last open step (the grep for unticked package lines finds only O39), so this obligation would live only in an archived plan line.
- Ruling O39 additions: items 1 and 3. Its purpose clause, "so oculus is shown as a project", has no check (see Cases).
- Ruling Steps after O33, the non-ledger part (worktrees made from and landed on the oculus repository): no requirement. `land.sh` and spec.md are left with `tools/oculus` paths (see Names).
- O33's part-1 text "the briefs' worktree path is rewritten once" (`O33.md:76`) is reversed by item 6 ("Briefs and reviews of landed steps are records and stay"). It is not named as a decision.

## Premises

Each premise was rerun.
- `ls -d ~/workspace/oculus`: "No such file or directory". Holds.
- `which git-filter-repo`: `/Users/axelfaes/.pyenv/shims/git-filter-repo`. `git filter-repo --version`: `a40bce548d2c`. Holds.
- `gh auth status`: "Logged in to github.com account TheAxeC (keyring)", scopes including `repo`. Holds. Also `gh repo view TheAxeC/oculus`: "Could not resolve to a Repository", so the name is free.
- `which limactl`: "limactl not found". Holds.
- `tools/oculus/.agents/` is empty (`ls -la`) and `tools/oculus/.oculus` is missing. `git check-ignore -v tools/oculus/.agents/plan.yaml tools/oculus/.oculus/project.yml` prints nothing (exit 1). Holds.
- `tools/oculus/.gitignore` is the 11 lines listed. Holds.
- The hub's `.agents/plan.yaml` has the 18 keys listed (`cat -n`). Holds.
- Ordo's manifest has the listed keys, `focus: run` included. Holds.
- `package.json:27-28` names `app:package` and `app:release`. Holds.
- The grep list of hub text holds (see Names).
- Status line on line 58 of both files holds; the two paths are one file.
- `git apply --check O33-phase-c-hub-text.patch`: "error: patch failed: README.md:1". Holds.
- `ls docs/adr tools/oculus/docs/adr`: both "No such file or directory". Holds.
- One premise is wrong by omission. The brief's opening says "No standards pages are listed in the configuration". The state file's config block has `standards: [tools/oculus/.scratch/migration/agents/spec.md]` (`orchestrator-state.md:12`). The hub's plan.yaml has `standards: []`.

## Cases and checks

- Part A path keys: `ls .scratch/archive` gives "No such file or directory" (tools/oculus has `.scratch/` with `migration/`, `ROADMAP.md` and an empty `shots/`). So `test -e` of `archive_root` fails in the worktree and in the new repository, and the builder would stop at its first run. Ordo's own check (`~/.local/share/ordo-stable/skills/ordo-init/templates/check_config.py`, run by `/ordo-init` on an existing file) requires only the pages (`PAGE_KEYS = roadmap, verification, rules`) to exist. It also checks the key set, the kinds, that the worktree root is ignored (`check-ignore -q --no-index`) and that the config is not ignored.
- Part A `.gitignore`: `git check-ignore .agents/plan.yaml` prints nothing for a tracked file whatever the rules say. That half needs `--no-index`, as ordo-init uses. The first half holds, since check-ignore reports a parent-directory rule (the hub shows `.gitignore:119:/.agents/worktrees/ .agents/worktrees/x/y`).
- Part A manifest: holds against the rules file. But spec.md:38 says a builder writes "never a `project.yml`", and the brief has a builder write `tools/oculus/.oculus/project.yml`. This clashes with "its rules govern this step unchanged". The brief has to state the exception, citing ruling O39 additions and O39 split.
- Verify 1 against spec.md:49 (Prettier pinned; run `npm run format`; never hand-format). `test:quick` formats any changed `.yml`/`.yaml` (`tests/tiers/quick.mjs`: `FORMATTED = /\.(ts|js|mjs|json|svelte|css|html|yml|yaml)$/`), and `.prettierignore` does not cover either new file. I ran oculus's prettier 3.9.6 on scratch copies of Ordo's manifest and template. It rewrites `title: "Ordo"` to `'Ordo'` and nests `chips` at 4 spaces. It collapses the aligned trailing comments. `prettier --check .` flags both `.agents/plan.yaml` and `.oculus/project.yml` (scratch run: "[warn] .agents/plan.yaml", "[warn] .oculus/project.yml"). So the dictated `title: "Oculus"` and comment-aligned plan.yaml fail test:quick, and later `format:check` in test:landing. The brief must either accept the prettier form or add both files to `.prettierignore`, which would widen the write list.
- spec.md:33 requires the brief to name a base copy for the builder's `diff -rq`. None is named (`.agents/worktrees/` holds `O38-base`, `O44-base` and `O46-base`, but no O39 one).
- spec.md:60: part A makes a visible change on Axel's server. The workspace folder `oculus` already points at `tools/oculus`, and `server/files/workspace/folders.ts:38` reads a root's `.oculus/project.yml` as a project, so an Oculus card appears. No case or look covers it.
- spec.md:82 dictates the first line "Everything in the brief is done". The brief changes it to "Everything in part A is done" (`grep -n "Everything in part A" O39.md`: line 128). That is a departure, and it is not named.
- Part B history: `git log --oneline -- tools/oculus | wc -l` in the hub is 2558, the same with `--full-history` and `--all`, and there are 0 merges. The counts will match only before item 6's commit, which adds one, and the brief does not order the case before item 6. "The last commit's subject is the same in both" also fails after item 6.
- Part B secrets: rerunning the item 5 counts on the hub's history of `tools/oculus` gives `local.yml` commits 0, `webcal://|\.ics\?` lines 48, token shapes 0. All 48 are mentions of the scheme in code and text ("does not start `https://` or `webcal://`") and the test fixtures `webcal://secret.example` and `webcal://outlook.example` (`grep -oE "webcal://[A-Za-z0-9.-]+" | sort | uniq -c`). No real address is among them. As written, item 5 stops part B on these false hits.
- Part C deletion: "the hub's `git status` shows only the paths listed to Axel" checks places the step does not change. `git status --short` now shows 14 linfoot manuscript-work deletions, a modified `meeting-response.pdf`, and an untracked `projects/active/linfoot-estimator/meeting-response/`, all unrelated to O39.
- Part C deletion: "`git log -1` of both naming the same last change". After item 6 the new repository's `git log -1` is the ledger-path commit. Any ledger booking committed in the hub after the clone, under `tools/oculus/.scratch/`, is missing from the new repository. The brief does not say where the bookings of part B and part C are written.

## The question

Each check, asked whether it could pass without the goal being reached:
- Part A path keys: yes. `test -e` plus `yaml.safe_load` pass for a file the plan skills refuse (a stray `projects:` key, a wrong kind, a missing required key). `check_config.py` would fail on those. As written it fails anyway on `archive_root`.
- `.gitignore` case: yes. Its second half passes for any tracked `plan.yaml`.
- Manifest keys: yes. The key set can be exact while oculus is not shown as a project, which is the ruling's purpose. Only a look at the Personal board, or reading the manifest list oculus serves, shows that.
- History count: yes. The counts match while a stray branch rides along: filter-repo turns the clone's `origin/worktree-agent-a725e5ffad2a09974` into a local branch (`git for-each-ref` lists `refs/heads/worktree-agent-a725e5ffad2a09974`, an ancestor of main), so the new repository carries it. A fact check closes this: `git rev-parse <clone head>:tools/oculus` against the new repository's `HEAD^{tree}` before item 6, plus a list of branches.
- Secrets: no. As written it cannot pass at all.
- test:landing in the new repository: yes for the hub-reading cases. With `OCULUS_TEST_HUB` unset they skip with one printed line (`tests/fixtures/hubs/real-hub.ts`), so "every command passed" says nothing about oculus reading the hub from outside it. The brief does not say whether the variable is set.
- Remote view: it holds for the remote's metadata. The push is Axel's.
- Server cwd: yes. It passes while the page shows nothing of the hub. A look that Axel's pages load would close it.
- Deletion grep: yes. It passes with the desktop stub, the status line, linfoot `README.md:214`, spec.md, `land.sh` and the Procedures paths all false, and with hub-side copies of oculus still on disk: the gate worktree `.agents/worktrees/gate` (3.1G, a worktree of the hub at main) and `.claude/worktrees/agent-a725e5ffad2a09974`.
- Item 6: yes. See Names; the files the next orchestrator reads keep `tools/oculus`.
- Item 9: no as written, since the "three archives" cannot come from one run.
- Item 10: yes. "`npm ci` inside it" on the mounted `~/workspace/oculus` would either fail (read-only mount) or, if the mount is writable, delete and replace the Mac's `node_modules` with Linux binaries. That would break item 7's install and Axel's server of part C, while every quoted last line looks green. The brief does not say where the tree lives inside the VM. I am judging from Lima's default home mount; I did not run Lima.
- Items 11 and 12 hold as written.

## Implied inputs

- Uncommitted ledger files: `git status --short -- tools/oculus` shows ` M orchestrator-state.md`, ` M plan.md`, ` M orchestrator-history.md`, `?? agents/briefs/O39.md`. A `--no-local` clone carries only commits. Expected: everything is committed before item 4, and ledger writes after the clone go to `~/workspace/oculus` only. The brief states neither.
- Ignored files in `tools/oculus` that the clone drops (`git status --short --ignored -- tools/oculus`): `.DS_Store`, `.svelte-kit/`, `.svelte-kit-app/`, `build/`, `build-app/`, `node_modules/`. All can be rebuilt. There is no `config/local.yml`. Nothing is lost. Already holds.
- node_modules: no symlinks into `tools/oculus` were found. Item 7's `npm ci` needs Node `^24.15.0 || >=26` with npm 11 or later (`package.json:30-33`) and `engine-strict=true` (`.npmrc`). Expected: item 7 runs with the nvm Node 24.21.0 path from the Procedures. Not stated.
- Lima VM: Node 24.15 or later and npm 11 must be installed inside (Ubuntu's apt Node is older and `engine-strict` refuses it), plus tmux and git for the suite. The tree should be copied or cloned onto the VM's own disk. Expected: each is stated. Missing.
- Hub worktrees: `git worktree list` shows `.agents/worktrees/gate` (detached at 0133a2cc6) and `.claude/worktrees/agent-a725e5ffad2a09974` (branch `worktree-agent-a725e5ffad2a09974`). Both hold `tools/oculus`. Expected: part C removes them, or names them as kept, and future landing gates are made in the new repository. Missing.
- The running 8790 server: `lsof` shows pid 94787 `node .../research-hub/tools/oculus/node_modules/.bin/vite dev`, cwd `/Users/axelfaes/workspace/research-hub/tools/oculus`. The case covers it. `~/.oculus/workspace.json` opens the hub's workspace file by absolute path, so a server started elsewhere finds the hub. Holds.
- `~/.oculus` state keyed by paths: `views.json` has 22 `tools/oculus` keys (see Names). Expected: listed to Axel as a visible change in part C. Missing.
- Scheduled runs: crontab 0; no LaunchAgent names oculus; the hub's `.oculus/config.yml` and `.oculus/tasks/` name `tools/oculus` only at lines 56-57; `approvals.json` has 0. Holds.
- Desktop app stub: `~/Applications/Oculus.app` names the old checkout. Expected: `npm run app:package` from `~/workspace/oculus`, on Axel's yes, before the deletion. Missing.
- Gate worktree: see above. Missing.
- Instructions for a session in the new repository: `tools/oculus` has no `CLAUDE.md` or `AGENTS.md` (`ls`), and no `.claude/settings.local.json`. A session started in `~/workspace/oculus` loads neither the hub's hard rules (no AI attribution in commits, never push, the plan rules) nor the hub's git allowlist. Its Claude Code memory slug also changes from `-Users-axelfaes-workspace-research-hub`, so the memory index the brief's item 12 edits would not load there. The plan's closing, at least, runs from the new repository. Missing.
- Lima writes `brew install lima` into `/opt/homebrew` and the VM under `~/.lima`. Neither is in the write list. Small.

## ADRs

`ls docs/adr tools/oculus/docs/adr`: both "No such file or directory". There are no records to read. In the new repository Ordo's default `adr: docs/adr` applies; `check_config.py:118` only notes that the folder does not exist yet.

## Dictated text

- `grep -n "roadmap: .scratch/ROADMAP.md" O39.md` (line 30, the path values): holds.
- `grep -n '`.agents/\*`' O39.md` (line 31, `.agents/*` and `!.agents/plan.yaml`): holds, and matches ordo-init step 9.
- `grep -n 'title: "Oculus"' O39.md` (line 32: `title: "Oculus"`, `type: active`, `tier: personal`, `status: { chips: [building] }`, `links: []`): holds for prose and ASCII. It breaks spec.md:49 in effect, since prettier rewrites `"Oculus"` to `'Oculus'` (singleQuote in `.prettierrc`), and the file fails test:quick unless formatted or ignored.
- Line 32, the eli5 guidance "(the research workbench that reads a research hub in one VS Code-like app, local and private)": holds. The `next` text is left to the builder. Since O39 is the last step, "what comes after this step" is open, and that is a judgment call the brief does not settle.
- `grep -n "calendar links" O39.md` (line 39, item 5's commands): the commands hold for character set and prose, but the calendar predicate is wrong (48 false hits). `git log --all -p` also pipes the content of the tracked `config/options/local.yml` (an options catalog) through the count. That is harmless for a count, but it conflicts with the session's own rule of never grepping a `local.yml`.
- `grep -n "A local research workbench" O39.md` (line 42, gh description and topics): holds.
- `grep -n "macOS app is unsigned" O39.md` (line 43, release notes): holds as prose, but is inaccurate. `release.ts:16-17` signs the bundle ad hoc, and the Linux archives are unsigned too. O33's brief says "notes that say both are unsigned" and gives `--title "oculus 0.1.0"`; O39 drops the title.
- `grep -n "limactl start" O39.md` (line 44): holds.
- `grep -n "is started there" O39.md` (line 52, the hub text): holds.
- `grep -n "import yaml" O39.md` (line 120): holds.
- `grep -n "LC_ALL=C grep -n" O39.md` (line 121): breaks spec.md:101, where the perl gate replaces the `grep '[^ -~]'` form wherever a brief names it. Either the perl form is used over these files, or the brief says why grep stays.
- `grep -n "Everything in part A is done" O39.md` (line 128): departs from spec.md:82's fixed first line.
- `grep -n "its intent is carried, its text is not" O39.md` (line 22) and `grep -n "and not in part A" O39.md` (line 92): both are borderline negation-contrast under spec.md:21. Each can be stated directly, for example "the hub text is written again from the patch's intent".
- `LC_ALL=C grep -n '[^ -~]' O39.md`: prints nothing (exit 1). `grep -n -E " -- |---| - "` finds dashes only inside commands. Holds.

## Declined to judge

- The other lines of `~/.claude/settings.json` (hooks or other commands naming `tools/oculus`). I was limited to the `grep -n claude-usage` line.
- Whether `npm run test:landing` passes outside the hub. It needs a clone and a full suite run, which this read-only check does not do.
- Lima's actual default mount mode on the version brew installs. Not installed, not run.
- Whether `gh repo edit --add-topic` takes the comma-joined list in one flag. Not run, since it would act on GitHub.
- The visible effect of the new manifest on Axel's boards. That needs a look on 8790, which I may not reach.
- The exact board or chip rules for `type: active` with `tier: personal`. Not read.

## Closed

Each finding is closed in the brief `agents/briefs/O39.md` as rewritten after this check, or by a ruling.

- (1) The calendar count: item 8 lists the calendar hosts and names each scheme mention and `.example` fixture, so only a real host stops part B; the listing prints host names, never an address.
- (2) `.scratch/archive` missing: the case runs Ordo's `check_config.py` and checks only the pages; item 1 says `archive_root` names a folder the plan skills make at a closing.
- (3) Prettier: decision 7 accepts prettier's form; the builder runs `npm run format`, and a case runs `prettier --check` over both files.
- (4) `spec.md:38`: item 3 states the exception under ruling O39 additions and ruling O39 split, for this one file.
- (5) One archive per run: item 11 makes three runs and greps each unpacked archive for the checkout path; the title and the signing sentence corrected.
- (6) No base copy: `.agents/worktrees/O39-base` named in part A's heading and in the report's file table.
- (7) Ledger writes and the deletion check: item 6 commits every ledger record before the clone and writes the ledger in the new repository only afterwards; the history case runs before item 9 with the tree compare and the branch list; item 7 deletes the stray branch.
- Names: `linfoot-estimator/README.md:214`, the settings symlink, the desktop stub, `views.json` and the hub's worktrees are in part C; item 9 rewrites every living ledger file and decision 6 names the reversal of `O33.md:76`.
- The step line: the filter-repo `--invert-paths` obligation is booked by item 9 in the new repository's `.scratch/ROADMAP.md`; the launcher is item 14's `app:package`; the Lima run starts the arm64 archive and makes a TEST page.
- Premises: the standards premise corrected in the brief's opening line.
- Cases: `check-ignore --no-index`; a manifest card note in "What is on the tree" and the look at landing; the first report line named as decision 11; the `git status` case narrowed to the step's paths; `OCULUS_TEST_HUB` set in item 10; a look at Axel's pages from the new server.
- Implied inputs: Node 24.21.0 named in item 10; the VM's Node, npm, tmux and git and the copy onto its own disk in item 13; `/opt/homebrew` and `~/.lima` in the write list.
- Instructions for a session in the new repository: ruling Z967 (self-rule), part A item 4 and part C items 15 and 16.
- Dictated text: the perl gate of `spec.md:101` replaces the grep form; the two negation-contrast sentences reworded; `title` left to prettier's quoting.
