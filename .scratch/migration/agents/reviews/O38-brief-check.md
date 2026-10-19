# Brief check: O38

Read on main at 32e13faf2 (`git log --oneline -1`), with the uncommitted `agents/guarded.md` the state shows (`git diff --stat`: 19 insertions, 4 deletions). Nothing was changed.

## Names

N.1 Sweep re-run. I ran the brief's pattern with `git grep -l -I -E` folder by folder, leaving out the four tools, the three skills, `.scratch`, `**/manuscript/**` and `secrets`. It gives 118 files, and `diff` against the sorted `O38-sweep.txt` prints nothing. The sweep holds.

N.2 Default paths in src that the step makes stale. These lines name `.oculus/data/<key>.yml` and are outside "Paths this step writes" and outside the sweep (`git grep -n -F ".oculus/data" -- src tests docs config ...`):
- `src/lib/data/sources/registries.ts:24-35` (`REGISTRY_FILES`, eight registry defaults)
- `src/lib/data/sources/collections.ts:32-34` (`LITERATURE_FILE`)

After Part 3 item 2 they no longer match `config/sources.yml`. A hub that names no `collections:` list, which is the real hub after Part 3 item 3, then reads its registries and Literature from the old flat paths. That makes them false, and case 14 fails.

N.3 Tests that hit old paths, outside the write list (`git grep -n -E "'registries'|'feeds'|literature-radar\.yml|..."`):
- `tests/routes/hubs/make.test.ts:213-251` asserts `.oculus/data/venues.yml` and `.oculus/data/literature.yml`. It is Make Folder a Hub's test (case 15) and becomes false.
- `tests/data/hubs/hub-portfolio.test.ts:145,180,212,220,244` copies the demo hub, then writes `registries/venues.yml`, `network/events.yml`, `registries/people.yml`, `network/joint-work.yml` and `feeds/position-leads.yml`. Once Part 3 item 5 moves the demo layout, these writes go to files nothing reads, so the test is false.
- `tests/routes/edit/apps/app-gate.test.ts:178` reads `feeds/literature-radar.yml` of the write fixture's hub. `write-fixture.ts` is in the sweep and moves, so this read fails with ENOENT.
- `tests/routes/sessions/terminal-fixture.ts:93-95` writes `registries/venues.yml` into a hub with no `collections:` block. Whether any test reads that file was not verified.

N.4 The demo hub keeps funding, education, applications and tasks under `records/` (`tests/fixtures/hubs/demo/.oculus/config.yml:17-22`). The sweep pattern does not match `records/`, so Part 3 item 5's "take the new layout" has no list of the `records/` readers.

N.5 `config/behavior.yml:39,41,47` are comments naming `literature-radar.yml` and `position-leads.yml`. The file is outside the write list, and the renames to `radar.yml` and `leads.yml` make the comments false.

N.6 Names the brief changes but never greps:
- `recoverCommand` (`index.ts:150,216,357,589,691`, `model/index.ts:125`, `portfolio.ts:688`, `scan.test.ts:112`, `wallpaper.test.ts:109`)
- `RECOVER_KEY` (`hub-names.ts:298`, `pty/routes.ts:31,402`)
- `recoverFindings`, `recoverCommandOf`, `recoverable` (`index.ts:154,373,603`)
- the findings key `recover_command_key` (`findings.yml:72`)

Every hit is in the write list, but neither the grep of case 16 nor the brief's "What is on the tree" grep finds them. The brief cites `scan.test.ts:112` and `wallpaper.test.ts:109` as hits of a grep that does not print them.

N.7 `CAREER_FILE` and `career_file` hits outside the write list. `src/lib/state/sessions/source/write-files.ts:15,179` reads the constant and stays true. `src/lib/state/sessions/view-source.ts:34` uses the key name and stays true.

N.8 `hpcPath` and `hpc_path` have no hit outside the write list. `docs/apps.md:377` lists `hpcPath?` and `retrieval?` in the dataset shape apps receive. It falls under `docs/` and becomes false.

N.9 The `recover` view id collides with no registration (`git grep -n "'recover'"`). Its only other uses are the card action id at `DatasetCard.svelte:98` and the pty action that goes.

N.10 The browser value names and the body class names of Part 6 are not given anywhere in the brief, so they cannot be grepped. The words `brackets` and `monospace` collide with no existing name in `src` or `config`.

N.11 `utils/migrations/migrate-joint-work.mjs` is named only by its own usage lines (`git grep -n migrate-joint-work`).

N.12 Part 1 item 3 says `tools/skills/catalog.yaml` "loses the entries of the three deleted skills". The grep for `cockpit|unicode|project-new` in `tools/skills` finds no such entry. The file's only sweep hit is `catalog.yaml:343` (`registries/venues.yml`).

## The step line

T.1 Ruling Z915 (O38's Step 0, "what it holds") says the hub `README.md` names the last commit that holds `tools/cockpit`. No part of "What to build" asks for it, and `grep -n -i cockpit README.md` shows no such line today. The deletion would land with no pointer to the archive commit.

T.2 Step 0 says "open item 109 (a) to (g) checked whole against the tree". The brief has no premise line for it. The only record is `orchestrator-state.md:312`, a check on main at 4a75112b5, which was not re-run at 32e13faf2.

T.3 Ruling 153 says absinta, jakel, macnair2024 and the nine cellxgene sets "move into `~/data/<key>` with the code that reads them". Part 4 gathers only ruling 154's three sets. These readers are absent from "What to build" and from the write list:
- `projects/archive/disproved/ms-lipid-handshake/code/core/config.py:16-27`
- `projects/archive/disproved/ms-lipid-handshake/code/paper.py:23`
- `projects/manuscripts/fed-multicellular-immune/code/core/config.py:13`

The new `derived` entries `ms-lipid-handshake` and `fed-immune-tensor` describe folders whose raw data this step never moves. The session's moves in Part 7 do not name them either.

T.4 `O38-recover.md:72` lists "mimic-iv's `throttle` is honoured" among the registry defects it fixes. Part 2 gives no `throttle` field for `physionet` and no download behaviour for it.

T.5 Every other requirement maps to a part:
- O33 split, O29, 109, 121 and 152: Part 1
- 151, 153 (kinds, `path:`, cluster, bci-iv-4, no write-back), 156 (1) and (3), and Z933: Part 2
- the 154 data move and folder placement: Part 3
- 154 "leads, career and the spread sets": Part 4
- 154 part 4 and 156 (2): Parts 2.1 and 5
- Rice toggles: Part 6
- 155 and 156 (4): Part 7

No part lacks a requirement.

## Premises

P.1 Line 16 holds. `git ls-files <path> | wc -l` gives 189, 23, 2, 2, 3, 1 and 1. `git ls-files -s .claude/skills .codex/skills | grep ^120000` lists the six links.

P.2 Line 17 is partly wrong. `wc -l` gives 279. The method list leaves out `direct`, which `redownload.py:245` (`method in ("url", "direct")`) fetches. The script does not read `~/.netrc`: it checks the file's presence (`:31`), and wget reads it, as `:86` says ("wget reads ~/.netrc automatically (no flags needed)").

P.3 Line 18 differs from the grep's output:
- `scan.test.ts:112` and `wallpaper.test.ts:109` are not printed; they hold `recoverCommand`.
- `src/lib/server/machine/lsp/adapters/markdown/own/backticks.ts:2` is printed but not listed.
- `config/text/views/sources/data.yml` has the four keys at 10, 11, 14 and 15. Line 13 is `recover: Recover`, the card's label, and the brief does not say whether it stays.

Every other line range holds.

P.4 Line 19: `git grep -n hpcPath` prints `docs/apps.md:377`, `model-entities.ts:513`, `normalise.ts:354` and `DatasetCard.svelte:155,163,164`. `docs/templates.md:648,664` and `normalise.test.ts:159` are `hpc_path` hits.

P.5 Line 20 holds (`DESIGN.md:738` example `tools/data/redownload.py:61`, `:762`).

P.6 Line 21's line numbers are wrong. `grep -n "^collections:\|^career_file"` gives:
- `config/sources.yml`: collections 30-46, `career_file` 50 (the brief says 32-49 and 53)
- `.oculus/config.yml`: collections 31-47, `career_file` 56, writing globs 69-94 (the brief says 32-49, 53 and 80-93)

The listed old paths hold.

P.7 Line 22 holds (118, see N.1).

P.8 Line 23 holds for every folder (`git ls-tree --name-only HEAD <folder>/ | wc -l`).

P.9 Line 24 holds (`wc -l`: 879, 878, 877, 851, 854, 508).

P.10 Line 25 holds:
- `BROWSER_NAMES` is at `browser.ts:23-31`.
- `git grep -c "body\.rice" -- src` gives 94 rules in 54 files.
- The `themes.css:47-67`, `ToolButton.svelte:463-494`, `Chip.svelte:167-193` and `Tag.svelte:85-93` ranges hold.

P.11 Line 26 is wrong about the submit path. `Runner`, `SSH_OPTIONS`, `copy`, `copyVector`, `validId`, `safePath`, `scratchRule` and `cancel` exist (`grep -n` in `hpc/`). But `submit.ts:208-247` (`compute`) refuses anything that is not a `.slurm` file inside a project's `code/` folder in a served root, and it rsyncs that folder. `scratchRule` (`scratch.ts:111-114`) reads a script file from disk under a code folder. A job script that `cluster.ts` generates cannot go "through the HPC submit path" as it stands. `submit.ts` and `scratch.ts` are outside the write list, and `hpc/` holds 10 items.

P.12 Line 27 holds, except that `import.meta.glob` is at `src/routes/views.ts:47`, not 48.

P.13 Line 28 is declined: cluster facts, and the cluster is not reached.

P.14 Line 29 holds (`git grep -n -E "data/archive|ptb-xl-raw|PED_unzip|BraTS-PED"` per `projects/` folder). It shows glassbox's six and ecg-readable-substrate's five hpc scripts as stated.

P.15 Line 30 holds (`registries/data.yml:172` `hpc_path: "~/data/mitdb/"`; dongho `config.py:17` `~/data/mit-bih`).

P.16 Lines 31 to 33 hold. G1 names `tests/routes/machine/recover.test.ts`. G35 carries no recover operation. G111 to G115 are at `guarded.md:311-325`. `ls docs/adr tools/oculus/docs/adr` finds neither folder.

## Cases and checks

C.1 Case 16 and Verify 6 ask the builder to run `git grep`. `spec.md:33` forbids the builder any git command, read-only ones included.

C.2 Case 13 calls `tests/checks/config/integrity.test.ts` "G32's existing test". It is G14's (`guarded.md:189-191`: "G14. The real hub builds with no findings, read only. Code: `src/lib/data/index.ts`"). Verify 2 does not name G14.

C.3 Verify 2 leaves out entries whose code the step changes. `spec.md:59` says such a step runs each entry's test. The entries, from `awk` over the Code lines of `guarded.md`:
- G8 (`writes.ts`, `writes/bodies.ts`, `writes/subtasks.ts`)
- G13 (`sourcesFindings` of `index.ts`, the config readers)
- G14 (`index.ts`)
- G28 (`writes.svelte.ts`)
- G49 (`CLOSED_WRITES`, whose test `app-gate.test.ts` reads an old path)
- G85 (`pty/routes.ts`)
- G9 (whose test names `tests/routes/hubs/make.test.ts`)

C.4 `spec.md:105` lets a builder reword hub text by hand only where a ruling asks for it, and then "the report lists each line before and after". This step rewrites by hand 54 registry entries, about 50 hub files from the sweep and the project readers. The brief's Report section has no part for those before-and-after lines.

C.5 Verify 5 requires that no non-ASCII character remains in any changed file outside `tools/oculus`. Counting the non-ASCII bytes per changed hub file with `perl`, every file passes except `.agents/skills/project-cleanup/SKILL.md`. That file has 28 lines with non-ASCII bytes: 21 em dashes, en dashes, arrows, Greek letters and math signs. The other hits are accented letters in names.

Passing Verify 5 forces edits to the skill file beyond O38-paths item 12. Rulings 121 and 152 allow skill edits only per approved line. `spec.md:56` (no hard wrapping in Markdown you edit) does the same: the edited lines 18, 31, 67, 122, 126, 153, 202, 220-221, 248-249 and 255 sit inside hard-wrapped paragraphs. This is a clash between two rulings and goes to Axel.

C.6 Case 18 cannot run as written. `bttn-incident-af/code/run_all.sh:21-25` fixes `DATA="$HOME/data"`, with no override, and runs `cd "$HOME/projects/afnet/code"`. Lines 35-51 fail on the env tarball, the ECG zip, the hosp files and `record_list.csv` before the PTB-XL block at 57-70. Line 84 then calls `sbatch`. A run "on a scratch DATA folder" needs HOME pointed at a scratch folder with stubs of every prerequisite, and the case does not say so.

C.7 None of the cases asks the builder to check or explain a place the step does not change.

## The question

Q.1 Case 13 and Verify 2 (integrity): `tests/fixtures/hubs/real-hub.ts:33-36` skips the real-hub cases unless `OCULUS_TEST_HUB` is set. The brief never names the variable, so the case passes as skipped without reading the rewritten registry.

Q.2 Case 14 has the same dependency. Without `OCULUS_TEST_HUB=<base copy>` and `=<worktree>`, `real-hub.probe.ts` prints one skip line, and the "same counts" comparison compares nothing.

Q.3 Case 16 and Verify 6:
- The pattern leaves out every old data path (`registries/`, `feeds/`, `funding/funding.yml` and so on) and the skill names `research-cockpit`, `remove-unicode` and `project-new`. Part 1 item 3 and Part 3 item 4 can therefore pass with old lines left.
- Its expected result is wrong. `grep -c` with the case's pattern on `feeds/position-leads.yml` gives 0, because the scout lines name `/research-cockpit scout`, which the pattern does not match. The expected output is nothing.

Q.4 Cases 1 to 3 do not require the "recorded" answers to be captured from the live APIs, with their URL and date. Builder-made fixtures in an assumed shape pass while the real Hugging Face, TCIA, DANDI or figshare answers differ.

Q.5 Cases 2 and 8 pass while credentialed PhysioNet can never download. The brief requires "never `--netrc`" (Part 2 item 2). `man curl` says `-n, --netrc` "Makes curl scan the .netrc file", and curl reads it only with that flag (curl 8.7.1 here). So the access check passes, Fetch is enabled, and curl gets 401 or 403. The design also has no route to list a credentialed set's files: `SHA256SUMS.txt` answers 403 without a login, and the server never reads `~/.netrc`.

Q.6 Case 4 can inject "verified" into the plan. Nothing is written back and only the log is kept, so the brief defines no place for a check result. The real view would either hash isles24's 99 GB `train.7z` on each GET or never show verified.

Q.7 Case 7 can pass on rows for this Mac alone. The cluster `Runner` (`ssh.ts:7-12`, `:56`) takes one remote command string and no stdin, so the brief gives no way for a Synapse token to reach curl on the cluster without a command line.

Q.8 Case 9 checks only whether the pid is alive. After a reboot, a reused pid reads as a running fetch, and Stop then kills an unrelated process.

Q.9 Case 11 passes on the script's text, while the job cannot be sent through `submit.ts` (P.11).

Q.10 Case 18 passes with a stub zip that lacks PTB-XL's inner folder `ptb-xl-a-large-publicly-available-electrocardiography-dataset-1.0.3/` (`run_all.sh:58,62`), while the real zip extracts into that subfolder.

Q.11 Part 2 item 1 is checked only by "parses with no finding".
- `pmc-patients`, the second of the 54 keys (`grep -n "^  - key:"`), has no row in `O38-recover.md` section 1, which claims "Each of the 54 entries".
- An entry left in the old map form still parses, since `record.ts:176-178` accepts the one-record object form.
- `pmc-patients`' `hpc_path` names a file, not a folder.

Q.12 No case checks Part 3 item 4's old-path lines or Part 4's readers, for example the grep `data/archive|ptb-xl-raw|PED_unzip` after the change.

Q.13 Part 2 item 6 (Login node) is proved only at the look, and no data path behind it is defined (I.10).

## Implied inputs

I.1 The curl netrc flag (Q.5). Expected: curl on the target is run with `--netrc` or `--netrc-optional`, oculus still never opening the file, and the credentialed `SHA256SUMS.txt` is fetched the same way on the target. The cost is that every credentialed set (mimic-iv, mimic-iv-note, mimic-iv-ecg) cannot be recovered.

I.2 Remote values. `Runner` sends one string to the remote shell (`ssh.ts:7-12`), so "every value one argument" (G113, Part 2) cannot hold literally on the cluster. Expected: each value quoted with one existing helper (`pty/shell-word.ts:11` `shellWord` or `pty/tmux.ts:173` `quote`), and G113 read as one shell word there. Registry and API values (URLs, file names) are untrusted.

I.3 Tokens on the cluster. The Synapse token lives in `local.yml` on this Mac, and the Kaggle token in the target's `kaggle.json`. The brief does not say how either reaches curl on the cluster. Expected: a mode-600 file sent with the copier and removed after the run, or the cluster target refused for these kinds.

I.4 Kaggle listing. `tokened.ts` lists Kaggle files from the server while the access check runs on the target, so the server needs a token from this Mac even for a cluster target. Expected: the brief names which file the server reads. That the Kaggle list API needs auth was not verified here.

I.5 The Synapse token key. `config/catalogs/options.yml:1372-1390` holds only claude and codex `accounts`, calendars and mail, and no Synapse key. The new `local.yml` key, its options entry and its Settings section are a user-visible shape the brief does not name (`spec.md:18`).

I.6 Where the verified state lives (Q.6). Expected: a named record under `~/.oculus/recover/<hub>/`, which is itself a saved-record key (`spec.md:18`).

I.7 Pid reuse (Q.8). Expected: the pid file records the start time and command, and both are compared before "running" or Stop.

I.8 Two hubs with one dataset key, for example `mitdb`. The tmux session `-s <key>` collides on the cluster, and Stop ends the other hub's run (G115). `openBeside('recover', { id: key })` names no hub either. Expected: the session and the view state carry the hub.

I.9 A second Fetch while a run is going, from the same view or another window. Neither the brief nor the cases say what happens (`spec.md:71`). Expected: a refusal, or the view attaches to the existing run.

I.10 The Login node section reads its sessions from a source the brief does not name: the GET route takes `key` and `target`, and no poller is assigned.

I.11 Unpack layout.
- The PTB-XL zip holds one top folder, while the brief puts `ptbxl_database.csv` at `~/data/ptb-xl/` top. The step's 7z-wasm unpack strips nothing, and `run_all.sh:62` (`unzip ... -d`) does not either.
- A PhysioNet `archive: true` zip has no line in `SHA256SUMS.txt`, so it can never be "verified".
- bttn's default zip name is `ptb-xl-1.0.3.zip`, while PhysioNet serves the long name.

Expected: a strip or `into:` rule and the archive's check rule. The cost is that readers find nothing at the top of the folder.

I.12 The dataset shape.
- `model-entities.ts:512` types `retrieval` as `Record<string, unknown>`, and `normalise.ts:353` (`mapShape.safeParse`) drops a list.
- `DatasetCard.svelte:6,75-79` reads `method` and `notes` from it, and the card shows `data.fetch` and `data.hpc`.
- `docs/apps.md:377` is the app-visible shape.

None of this is named. Without it every card loses its method and notes silently. Expected: `retrieval` typed as the source list, `notes` at the entry's top level, `path` with its label, and the apps guide row rewritten.

I.13 Where `recover` is computed. Part 2 puts it in the server's `recover/registry.ts`, while the card reads the snapshot built in `src/lib/data/`. That gives two parsers of `retrieval`, against `spec.md:87`. Expected: one parser in `src/lib/data/`, used by both.

I.14 The duplicated default paths (N.2) and the stale tests (N.3, N.4). Expected: these paths join the write list.

I.15 `.agents/plan.yaml:12`'s `worktree_paths` keeps `feeds`, `registries` and `tasks`, which this step removes, and lacks `.oculus`. Every later worktree would miss the hub data, and its real-hub checks would skip. Expected: the gone folders removed and `.oculus` added. Item 14 removes only `tools/cockpit` and `tools/present`.

I.16 Rice toggles.
- `applyTheme`'s callers are `src/lib/ui/theme/app-theme.ts:137,144,149` (with the `ThemeDraw` type at `:110-122`), outside the write list.
- `drawSavedTheme` (`app-theme.ts:155-168`) draws the find page and the presenter's pages with no per-browser values.
- If the new classes switch brackets or monospace on, those pages lose today's look.

Expected: classes set only when a toggle is off, and the value and class names stated.

I.17 Ruling 153's readers (T.3).

I.18 `throttle` (T.4).

I.19 `pmc-patients` (Q.11).

I.20 The `url` kind's "`sha256` per URL (optional)" has no stated shape: a map from URL to hash, or a parallel list.

I.21 Once the hub's `.oculus/config.yml` drops `collections:`, every collection is unnamed. `model/index.ts:141-145` says "A hub reports only what it names, so a file in this list that is missing is no finding". The real hub then gets no finding when a moved data file is missing. Expected: the brief states this consequence of the ruling.

## ADRs

A.1 None exist: `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both.

## Dictated text

D.1 `"Login node"`: `grep -n -F '"Login node"' O38.md` finds line 62. Holds.

D.2 `**Brackets**` and `**Monospace**` (lines 100 and 101). Hold.

D.3 `"access missing"` (line 114). Holds, as a catalog line through `t()`.

D.4 The help text without `and as its folder name under ~/data` (line 50). Holds.

D.5 `id: 'recover'`, `listed: false` (line 61). Hold.

D.6 O38-paths item 12 `:18`, "the hub README's "Project layout and tiers"" (`grep -n -F "Project layout and tiers" O38-paths.md`, line 20). Holds: `README.md:25` is that heading.

D.7 O38-paths item 12 `:31,:122`, "oculus's project card" (line 21), and `:67`, "oculus's views". Hold.

D.8 O38-paths item 12 `:126,:153`, oculus's `read_limits` (`config/behavior.yml:8`: `results` 300) (line 23). Holds: `grep -n read_limits` gives line 8 with `results: 300`.

D.9 O38-paths item 12 `:255`, "the Audit view shows no readability finding for this project" (line 25). Holds: `src/lib/server/content/audit/projects.ts:459-471` reads `readLimits`.

D.10 O38-paths item 20 (line 39), "oculus's Deposit", put in the `.depositignore` comments, and items 12 `:202,:220-221` and 21 (lines 24 and 40), "oculus's Deposit view". The result breaks `spec.md:70`: a sentence the change makes false. The comment reads "tools/deposit/deposit.py renames this to .gitignore in the public deposit" (dongho `.depositignore:1-2`), and after the swap it says oculus's Deposit renames the file. It does not: `deposit.ts:725-733` writes the mirror's `.gitignore` from the patterns of `code/.gitignore` and `code/.depositignore`.

D.11 O38-paths item 19 (line 38), "the portfolio deck's look". `funding/about-axel/README.md:22` would still say the CSS and JS are "inlined verbatim from" (`deck.css` / `deck.js`). `git ls-files | grep -E "/deck\.(css|js)$"` finds them only under `tools/present`, which this step deletes. That breaks `spec.md:70` (a false sentence). Whether the portfolio deck's look matches is under Declined.

## Declined to judge

- The cluster facts of line 28 (OS, Node, the probe jobs 629365 and 629366): the brief forbids connecting to the cluster.
- Whether the Kaggle, TCIA (NBIA) and Hugging Face APIs answer in the shapes `O38-recover.md` section 1 assumes, and whether Kaggle's list needs auth: settling it needs live calls to those APIs, which were not made.
- Whether "the portfolio deck's look" (O38-paths item 19) is true of the deck oculus's Present view draws: only a look comparing `about-axel.html` with the Present view settles it.
- Whether `tests/routes/sessions/terminal-fixture.ts:95`'s `registries/venues.yml` is read by any test: not traced.

## Usage

Usage: ab45d7f72335b6554, claude-opus-5-5, 307,354 tokens, 105 tool uses, 18.0 min.

## Closed

Each finding the brief can take is closed by the change named here, to be written into the brief when /spec runs again after open item 158; the three findings that are Axel's are open item 158.

- N.2, N.3, N.4, N.5, I.14: `src/lib/data/sources/registries.ts`, `src/lib/data/sources/collections.ts`, `tests/routes/hubs/make.test.ts`, `tests/data/hubs/hub-portfolio.test.ts`, `tests/routes/edit/apps/app-gate.test.ts`, `tests/routes/sessions/terminal-fixture.ts` and `config/behavior.yml` join the write list; the defaults exist once (`config/sources.yml` read by both readers, or the constants derived from one table) and the demo hub's `records/` readers are found by a grep the brief gives for `records/`.
- N.6, P.3, Q.3, C.1, Q.12: the brief's names grep and case 16 add `recoverCommand`, `RECOVER_KEY`, `recoverFindings`, `recoverCommandOf`, `recoverable`, `recover_command_key`, the old data paths, the skill names, `data/archive`, `ptb-xl-raw` and `PED_unzip`; the builder runs it with `grep -rn` (no git); the expected output is nothing; `data.yml`'s `recover: Recover` stays as the card's label; `backticks.ts:2` is listed.
- N.8, I.12: `docs/apps.md:377` and the dataset model join the build: `retrieval` typed as the source list, `notes` at the entry's top level, `path` with its label, the card's method and notes read from the new shape.
- N.10, I.16: the values are `brackets` and `monospace` in `BROWSER_NAMES`; the body classes are `rice-plain` (Brackets off) and `rice-sans` (Monospace off), set only when a toggle is off, so `drawSavedTheme`'s pages keep today's look; `src/lib/ui/theme/app-theme.ts` joins the write list.
- N.12: Part 1 item 3's `catalog.yaml` sentence is removed; its one hit, `catalog.yaml:343`, is Part 3's.
- T.1: Part 1 adds the hub `README.md` line naming the last commit that holds `tools/cockpit` (the base commit's parent of the deletion, written at landing by the session, since the commit is known only then).
- T.2: the premise of open item 109 (a) to (g) is rerun at 32e13faf2 and quoted under "What is on the tree".
- T.3, I.17: Part 4 adds ruling 153's moves: absinta, jakel and macnair2024 into `~/data/<key>` and the nine cellxgene sets into `~/data/<key>`, with `ms-lipid-handshake/code/core/config.py:16-27`, `paper.py:23` and `fed-multicellular-immune/code/core/config.py:13` changed; the session's moves at landing name them.
- T.4, I.18: the `physionet` kind keeps the entry's `throttle` as curl's `--limit-rate`.
- P.2: the premise line names `direct` and says wget reads `~/.netrc`.
- P.6, P.12: the line numbers are corrected (`config/sources.yml:30-46,50`; `.oculus/config.yml:31-47,56,69-94`; `views.ts:47`).
- P.11, Q.9: `cluster.ts` builds its own job script, copies it with the HPC copier to `~/.oculus/recover/jobs/` on the cluster and runs `sbatch` through the `Runner`; it runs `scratchRule`'s printed-code test on the script text through a function `scratch.ts` exports for text, so the rule is one; `scratch.ts` joins the write list.
- C.2, C.3: case 13 names G14; Verify 2 adds G8, G9, G13, G14, G28, G49 and G85.
- C.4: the Report adds a section listing each hub line rewritten by hand, before and after.
- C.6, Q.10: case 18 is checked by reading `run_all.sh`'s PTB-XL block against the real zip's layout (its one top folder), and the block extracts with that folder stripped.
- Q.1, Q.2: cases 13 and 14 run with `OCULUS_TEST_HUB` set to the base copy and to the worktree, and the report quotes both counts.
- Q.4: the recorded answers are captured from the live public APIs (Zenodo, figshare, DANDI, Hugging Face, Stanford purl, GEO, TCIA, PhysioNet's open `mitdb` `SHA256SUMS.txt`) with their URL and date in each fixture's head; Kaggle and Synapse fixtures follow their published API reference, named.
- Q.6, I.6: closed by the orchestrator in automode (Z934): a file check's result is kept in `~/.oculus/recover/<hub>/<key>.checks.json`, one row per file with its size, mtime and the checksum it matched; a row whose size or mtime differs from the file is stale and the file reads present.
- Q.7, I.2, I.3: every value on the cluster reaches the remote shell quoted by `shellWord` (`pty/shell-word.ts:11`), G113 read as one shell word there; how a token reaches curl on the cluster is open item 158 (2).
- Q.8, I.7: the pid file records the process's start time and command; both are compared before a run reads as running and before Stop signals it.
- I.4: the server lists Kaggle files with this Mac's `~/.kaggle/kaggle.json`, read by the server code only, never shown or logged.
- I.8: the tmux session is `<hub>-<key>` and the view's instance state carries the hub with the key.
- I.9: a second Fetch, Verify or Unpack while a run of that dataset goes is refused with a catalog line, and the view shows the running one.
- I.10: GET of the recover route with `target=cluster` and no key lists every session on the socket `oculus-recover`; the Login node section polls it while open.
- I.11: closed by the orchestrator in automode (Z935): a source may carry `strip: <n>`, the number of leading folders the unpack drops; ptb-xl's source has `strip: 1`; an `archive: true` zip that `SHA256SUMS.txt` does not list is checked by size alone and reads present; the session moves the cluster's `ptb-xl-1.0.3.zip` under PhysioNet's name and bttn's default follows.
- Q.11, I.19: pmc-patients gets a `huggingface` source `zhengyun21/PMC-Patients` with `patterns: [PMC-Patients-V2.json]` and `path: ~/data/pmc-patients`; the report lists each of the 54 entries with its kind, and an entry left in the old map form is a finding of the build.
- I.13: `retrieval` is parsed once, in `src/lib/data/`, and the server's `recover/` reads that result.
- I.15: `.agents/plan.yaml`'s `worktree_paths` and the state file's copy lose `feeds`, `registries` and `tasks` and gain `.oculus`.
- I.20: a `url` source's `urls` is a list of `{ url, sha256? }`.
- I.21: closed by the orchestrator in automode (Z936): a hub that holds a `.oculus/data/` folder reports a missing default collection file as a finding, as a named one is.
- D.10: the `.depositignore` comment becomes "oculus's Deposit writes these patterns into the deposit's .gitignore".
- D.11: `funding/about-axel/README.md:22` says the CSS and JS are inlined in each page, with no source file named.
- Q.5, I.1, I.5, C.5: open item 158 (1) PhysioNet credentials, (2) the Synapse token, (3) the project-cleanup skill's characters and wrapping.
