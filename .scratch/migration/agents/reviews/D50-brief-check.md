# Step D50 brief check (on main at aa8f467de)

Read: `agents/briefs/D50.md` (185 lines), `plan.md` (D50 at :711, Additions of 2026-10-09 at :1609, Z751 at :1618), `agents/spec.md` (103 lines), `agents/guarded.md`, `.agents/plan.yaml`, and the tree. Nothing was changed.

## 1. Names

1. **The five default functions have callers outside the write list.** Command: `grep -rn "\bdefaultBookmarksPath\b|defaultNotesDir|defaultWorkspacesPath|defaultSchedulesPath|machineFolder" src tests utils`. The written files (`writes.ts:268`, `context.ts:292,342,374,382,434,791`, `apps.ts:132,203,244`) are covered. Five callers are not:
   - `src/routes/api/(files)/fs/+server.ts:26-28` (workspaces, bookmarks, notes)
   - `src/routes/api/(machine)/schedules/+server.ts:19`
   - `src/lib/server/edit/writes/config/roots.ts:264`
   - `src/lib/server/root/watch/git-start.ts:36`
   - `src/lib/server/files/roots.ts:32`

   Each function takes no argument today (`bookmarks.ts:38`, `notes.ts:43`, `fs.ts:193`, `file.ts:67`). A default "from the hub" needs the hub, so each of these callers stays on `~/.oculus/<name>` unless it changes. The brief names none of them.

2. **Head comments that name `~/.oculus/<name>` for the five are outside the write list.** Command: `grep -rn "\.oculus/bookmarks|\.oculus/notes|\.oculus/workspaces|\.oculus/schedules|\.oculus/apps" src`. The comments:
   - `shell/rail/ActivityRail.svelte:63`
   - `shell/rail/ScheduleList.svelte:3`
   - `shell/rail/UpdateTray.svelte:3`
   - `server/machine/runs/schedules/watch.ts:1`
   - `state/sources/explorer/view/bookmark-rows.ts:2`
   - `data/model/model-machine.ts:3`
   - `data/helpers/run/schedules.ts:1`
   - `routes/+page.svelte:216`
   - `views/sources/files/Files.svelte:43`

   `Files.svelte:43` also says "the file `~/.oculus/bookmarks.yml` is under no served root, so no form or source tab". That becomes false: the file now lies under the hub root and is served. Item 8 reaches only changed files, while `spec.md:68` makes every sentence the change falsifies a defect.

3. **Words the page shows become false.** `config/text/app.yml:202-203` (`unread_schedules`, `unread_schedules_at`: "'~/.oculus/schedules.yml does not read...'") is a page-visible sentence. `app.yml` is not in the write list.

4. **Doc sentences missing from the brief's list.** Its own grep and `grep -rn "sources.yml|layout.yml|vocab.yml|behavior.yml" docs/DATA-MAP.md` find these:
   - `HELP.md:172`: a machine app lives in `~/.oculus/apps/<name>/`.
   - `docs/apps.md:20`: "Root app ... the hub included". Under decision 3 this is false.
   - `docs/apps.md:11`: the trust rationale (see 6.5).
   - `DESIGN.md:573`: `~/.oculus/bookmarks.yml` is watched.
   - `DESIGN.md:492`: the config view is one card per `.yml` of the engine's `config/`, and the hub documents are `docs:` of `layout.yml`.
   - `DESIGN.md:547`: `venue_themes` and `data_themes` are in `config/catalogs/vocab.yml`.
   - `docs/configuration.md:3`: "Every setting of oculus lives in ... the engine's `config/` folder and ... `local.yml`".
   - `docs/DATA-MAP.md:219, 232, 233, 235, 296, 300, 302, 308, 310, 316`: each names `tools/oculus/config/...` as the home of a key that moves.

   The brief names only `DATA-MAP.md:311` and `:517`.

5. **Hub data files that name the engine file for moved keys.** Command: `grep -rn "tools/oculus/config" registries/*.yml`. The lines:
   - `registries/venues.yml:27` (a field help the edit form shows)
   - `registries/data.yml:28`
   - `registries/domains.yml:1`
   - `registries/resources.yml:1`
   - `tools/oculus/demo/registries/resources.yml:1`

   The brief forbids writing hub data folders. `spec.md:103` allows hub lines only when a brief names them, so each must be named or ruled as left.

6. **Readers of the keys the engine empties or drops** (grep per key over `src tests config docs`):
   - **`linkedin_dir`:** `data/index.ts:153` falls back to `FEED_FILES.linkedin = 'theaxec.github.io/_linkedin'` (`index.ts:106`). Removing the key reads the website folder, not "absent (no website feed)". `portfolio.ts:241` always adds that folder to the watch, and `options.yml:1334` has the same default. Other readers: `state/sessions/view-source.ts:31`, `views/feeds/linkedin/Linkedin.svelte:22`. `data/index.ts` is not in the write list.
   - **`publications_file`:** `audit/rules.ts:112` reads absent as `''`, so that reader holds. `options.yml:1327` still carries the website default.
   - **`slurm.resource`:** `slurmSettings` reads it through `settingReader` (`settings.ts:148-151`), which falls back to the options default when the key is absent. That default is `utwente` (`options.yml:337`), so "absent (no cluster)" still polls utwente. If the default is removed, `defaultOf` throws `noRule` (`settings.ts:144`). Today an empty value is already a finding: `config.test.ts:545` "slurm.resource must not be empty; the default is used". `hpc/host.ts:12-19` has no "no cluster is set" sentence. The brief specifies none of this.
   - **`data_domains`:** `audit/rules.ts:110` reads absent as an empty set, which holds. `options.yml:187` keeps this hub's list as the default, which is what the Settings Reset writes.
   - **`domains`:** it is a map. `catalog-files.ts:77` declares `z.record(...)`, and `vocab.yml:51` holds a map. The brief's "`domains` ... are `[]`" is a whole-file shape finding on the engine's `vocab.yml`, against G12. The value should be `{}` or absent. Readers: `data/index.ts:168`, `state/shared/words/tones.ts:84-85`, `data/sources/deck/read.ts:126`, `server/content/deck/read.ts:82`.
   - **`venue_themes`, `data_themes`:** read by `views/sources/venues/Venues.svelte:64`, `views/sources/data/Data.svelte:61` and `data/snapshot/validate.ts:401`. The registry schemas hold `from: vocab.venue_themes` and `from: vocab.data_themes` (`registries/venues.yml:27`, `data.yml:28`), and `vocab.yml:263,279` says "a word used in the registry and missing here is a finding". A hub without its layer therefore gets one finding per theme word, not "no themes".
   - **`roots`:**
     - The findings: `files.ts:150` `readRoots` names `rootsFile(engine)` (`files.ts:242`, the engine's `sources.yml`). It is called from `portfolio.ts:550`.
     - The write: Add Folder to Workspace, Remove and reorder go through `config-write.ts:94-96` into `writes.ts:273` `sources.file: rootsFile(engine)` (`roots.ts:179-258`). That writes the engine file, which the hub layer then overrides whole, so the write has no effect.
     - Undo reads `rootsNow` (`undo.ts:141`).

     `roots.ts`, `config-write.ts`, `undo.ts` and `files.ts` are not in the write list, and no case covers a roots write.
   - **`docs`:**
     - The findings: `content/docs.ts:521-542` names `layoutFile(engine)`, called at `context.ts:320` and `portfolio.ts:551`.
     - The page readers: `Markdown.svelte:88`, `Doc.svelte:84`.
     - The list itself also holds oculus's own guides (`layout.yml:176-184`, `tools/oculus/docs/*.md`, `tools/oculus/DESIGN.md`). An engine `docs: []` takes oculus's own guides out of every other hub's catalogue (see 2.3).
   - **Tests that read these keys from the engine:**
     - `tests/checks/config/config-folder.test.ts:128` (`data_domains`), `:199-200` (the website keys), `:229-230` (the themes lists) and `:412` (the `help` arrangement).
     - `tests/checks/config/config.test.ts:490,545` (`slurm.resource` rows).
     - The fixture engines `tests/data/snapshot/reference-hub.ts:178` and `rename.test.ts:192` write `data_domains` and `slurm.resource` into their own fixture configs and are not affected.

7. **`loadConfig` callers and its signature.** `grep -rln "loadConfig(" src` gives 9 files. `server/edit/feeds.ts`, `server/root/process/words.ts` and `server/root/watch/git-start.ts` are not in the write list, and about 60 test files call it. `loadConfig(engine)` (`merge.ts:153`) has no hub. The hub is `local.hub`, defaulting to `resolve(engine,'..','..')` (`local.ts:201`). Item 3 never says how `loadConfig` gets the hub (a new parameter, or a `readLocal` inside), so the extent of the change is undecided.

8. **`configDir` callers.** `grep -rln "configDir(" src` gives 22. The ones outside the write list that name a hub-list key's file: `server/files/files.ts:242` (`rootsFile`) and `server/content/docs.ts` (`layoutFile`). Both become false; the rest read engine-only files.

9. **`chat_instruction`.** Its G35 test is `tests/routes/sessions/terminal-actions.test.ts:497-509` ("starts a focused interactive Claude terminal and writes its private index first"). It fills only `{0}` and `{1}`, then asserts `not.toMatch(/\{[012]\}/)`, so it fails once the instruction holds `{2}`. The brief's guarded list (G12, G13, G14, G24, G8) omits G35.

10. **`help` arrangement.** The only test reader is `config-folder.test.ts:412`, which checks only that the property exists. Saved layouts keep their tabs (see 6.13).

11. **`src/lib/server/edit/writes/config` holds 10 items.** It is full by `ls | wc -l` and is not listed among the full folders, yet the write routing for the hub layer lives there.

## 2. The step line

Each part of `plan.md:711`, with the brief item that serves it:

1. `<hub>/.oculus/` and the five files defaulting there: item 1, and item 2 (the carry-over, from Z751(d)).
2. "outside the folders whose changes rebuild the portfolio": **no "What to build" item states it.** Only the premise paragraph and case 6 do, and case 6's workspace leg is wrong (4.2).
3. The secrets, `approvals.json` and machine state stay: item 1's last sentence and case 4.
4. Two layers with the hub's in `<hub>/.oculus/config/`: item 3, and items 4 and 6.
5. The hub layer's contents, item by item:
   - Folder layout of `sources.yml`: items 3 and 4.
   - Documents list of `layout.yml`: items 3 and 4. That list also holds oculus's own guides (`layout.yml:176-184`). Item 4 moves them into this hub's layer and empties the engine's. Meanwhile the `help` arrangement keeps oculus's guides as tabs by hub-relative paths (`tools/oculus/docs/...`, `layout.yml:93`), so the guides leave the engine catalogue but stay in the engine arrangement. That split is a design point the step line does not settle; the brief settles it silently.
   - `slurm.resource`: items 3 and 4.
   - `domains`, `venue_themes`, `data_themes`: items 3 and 4.
   - `data_domains` and `roots` are added beyond the step line's words, under Z751(a).
6. The chat instruction neutral, with the owner from `self: true`: item 7.
7. The structure stays oculus's with no hub override: item 3's finding for any other key, and case 9.
8. The docs follow: item 8. The list there is incomplete (1.4, 1.5).

## 3. Premises

1. `grep -rn "join(homedir(), '.oculus'" src` holds. It gives 18 hits, the five at `bookmarks.ts:39`, `notes.ts:44`, `fs.ts:194`, `schedules/file.ts:68` and `watch/apps.ts:95`, matching the brief's ranges. `connect/store.ts:74,79` and `approvals.ts:44` hold. `window.json` is at `src/desktop/app.ts:128`.
2. The base copy `.agents/worktrees/D50-base/tools/oculus/` does not exist (`ls`: No such file or directory), and neither does its `unused-exports.txt`. The spec skill makes it after the brief check, so this is pending, not false.
3. `ls -a ~/workspace/research-hub | grep -c '^\.oculus$'` gives 0. `git check-ignore -v .oculus/x` prints nothing (exit 1). Both hold.
4. **The sparse checkout excludes `.oculus` (new).** `git -C .agents/worktrees/D51 sparse-checkout list` shows a cone of `applications deck docs education feeds funding network projects registries side-projects tasks tools/cockpit tools/oculus tools/present`, matching `.agents/plan.yaml` `worktree_paths`. Hub-root `.oculus` is outside it. Two consequences:
   - The builder's `.oculus/config/*` files sit outside the cone for the landing commit.
   - Every later worktree (D51 and on) lacks the hub layer, so its G14 run reads empty theme lists and gets a finding per theme word (1.6).

   `.oculus` needs adding to `worktree_paths`, which is not in the brief.
5. The portfolio watcher premise (`portfolio.ts:225-260`) holds for the folders, and `personalRoots` drops the hub (`portfolio.ts:281-296`). It omits that the watcher also polls the workspaces file and rebuilds on its change (`portfolio.ts:96-98, 348-355`).
6. `ROOT_FOLDER` at `hub-names.ts:86` holds. `scan.ts:217` holds. `docs/apps.md:11,19-20` holds.
7. `loadConfig` at `merge.ts:153` holds. `configDir` at `folder.ts:14-16` holds. 22 files call `configDir` (holds). `options.yml:6-7` holds.
8. `sources.yml` line numbers hold (13, 24, 28-49, 53-65, 69, 73, 76, 79, 82, 92-98, 100, 104), except that the roots comment is lines 85-91, not 86-91.
9. **`layout.yml` line numbers are off by one.** The `help` arrangement key is at 92 (its value at 93), and `docs:` is at 171 (170 is its comment).
10. `behavior.yml:26` (`data_domains`) holds; `slurm:` is 75-80 (holds). `vocab.yml` 51, 264, 280 hold. `server.yml:14` holds. `chat.ts:86,93` hold.
11. `people.yml`: the self comment at :2-3 and the schema `self` at :16 hold. The `axel-faes` entry starts at :108, with `self: true` at :112. `demo/registries/people.yml:33` holds. `normalise.ts:406-419` and `model-entities.ts:703` hold.
12. The demo hub has 11 items and no `.oculus` (holds).
13. **The brief's docs grep finds more hits than it lists** (rerun output in 1.4).
14. Folder sizes rerun with `ls | wc -l`: 10, 10, 10, 10, 9, 6, as stated.
15. `docs/` has no glossary (`ls tools/oculus/docs`): holds.

## 4. Cases and checks

1. **Case 14** points at the wrong test file. It names "G8's table" in `tests/server/edit/writes.test.ts`, and the write list names that file, but it holds no config rows (`grep -n "slurm|config" tests/server/edit/writes.test.ts`). The guarded tests are elsewhere (`guarded.md:51,54`):
   - G8 config key: `tests/server/edit/config-key.test.ts`, "replaces the value and keeps every other byte, the comment on its line included".
   - G9 undo: `tests/routes/edit/config-key.test.ts`, "puts the file back byte for byte and logs the undo above the write".
   - G8 roots: `tests/routes/edit/roots.test.ts`.
2. **Case 6's workspace leg is wrong on main and after.** The workspaces file is polled and a change is a rebuild by design (`portfolio.ts:96-98, 348-355`). `hub.publish` increments the version on every publish (`channels.ts:147`, `portfolio.ts:19`), so a saved workspace publishes a new portfolio version.
3. **Case 11's view parts cannot be seen at the landing look.** Axel's server has a cluster, so they rest on reading and unit-level runs, and the case should say so. Also as written, with the options default `utwente`, "no cluster" does not happen (1.6).
4. **Cases 12, 13 and 16 read the real hub.** They build the snapshot over this hub's data and read the real `people.yml`. `spec.md:37` names the only four things allowed to read the real hub. Either the brief rules these scratch runs allowed (read only) or they run over a copy.
5. **Case 18** says "every option of the hub list is described once, with its file". `domains`, `venue_themes` and `data_themes` are catalog keys, not options (`options.yml` groups at :15, 170, 973, 1207, 1220, 1364). The case passes vacuously for them.
6. **Case 1** says "after the start". A builder starts no server for a page (`spec.md:62`), so the case is a run of the carry-over function plus a reading of the start order in `context.ts`. The case should say which.
7. **Breakage testing:** none. Verify item 4 runs the new tests on the unchanged tree, which `spec.md:65` requires, and it removes no code. No case is inconsistent with the no-page rule (`D50.md:154`). The look is on TEST on Axel's server (holds).
8. **Cases that check places the step does not change:** case 4 (`approvals.json`, `calendar/`, `mail/`, `connect/`, `changes.jsonl` reading, a regression check), and case 13's projects and findings (the demo's manifests are unchanged; only its layer is new).
9. **No case covers:**
   - the roots write (Add Folder to Workspace into the hub layer);
   - a `docs` family write;
   - Edit in File of a hub-layer file saved through the source tab;
   - findings naming the hub-layer file (`rootsFile`, `docFindings`, `settingFindings`);
   - the `from` record.

## 5. The question (could it pass without the goal being reached?)

1. **Case 1:** yes. It can pass with the copy function correct but called after the files store, the schedules watcher or the apps watcher has read its path. The ordering in item 2 is not checked.
2. **Cases 2, 3, 5, 9, 10, 15:** no. Each observes the outcome directly.
3. **Case 4:** no for "not copied". It shows nothing about item 1.
4. **Case 6:** yes. The "no new version" half passes if the scratch run does not run the portfolio watcher. The workspace leg is wrong (4.2).
5. **Case 7:** no.
6. **Case 8:** no for the merge. It does not show which file a later finding names.
7. **Case 11:** yes. It passes on the merged map lacking `slurm.resource` while `slurmSettings` still returns `utwente` from the options default.
8. **Case 12:** yes, in three ways:
   - The maps can be equal while findings still name engine files (`rootsFile`, `layoutFile`).
   - They can be equal while the `from` record says the engine file.
   - They are equal if `loadConfig` resolves the hub layer from a different hub than `local.hub`.
9. **Case 13:** yes against item 5's "shows what it shows on main". The snapshot can match while the demo's view catalogue (13 `docs` entries on main), its Live HPC (resource `utwente`, with `demo/registries/resources.yml:14` holding `utwente`) and its domain colours differ. Item 5 also says its own two things that disagree:
   - "values its manifests use": the demo's domains are `graphs`, `method`, `nlp` (`grep -rhn "^domain:" demo/projects`), and `graphs`/`nlp` are not in the engine's map.
   - "what it shows on main".
10. **Case 14:** yes for the goal of item 6. It covers `slurm.resource` and `slurm.poll_min` only, not roots, docs, or Edit in File.
11. **Case 16:** no for the words. It does not check a `{2}` collision in the G35 test (1.9).
12. **Case 17:** no for the row. The look covers the page.
13. **Case 18:** yes for the vocab keys (4.5).
14. **Step-line check "outside the folders whose changes rebuild":** nothing checks it beyond case 6.
15. **Items 1 to 9:**
    - Item 1: yes, if the five callers outside the write list (1.1) keep `~/.oculus`.
    - Item 3: yes, if the engine `domains: []` raises a shape finding nobody counts, since G12 runs it but case 12 compares only maps.
    - Item 4: yes. "absent" reads still give `utwente` and the LinkedIn website folder (1.6).
    - Item 6: yes, for the roots write.
    - Item 7: no.
    - Item 8: yes. The list is short (1.4, 1.5).
    - Item 9: no.

## 6. Implied inputs

1. **`HOME` unset.** `os.homedir()` falls back to the passwd entry, so the carry-over reads the real home. Expected: no difference, named.
2. **The hub is the home folder, or inside `~/.oculus`.** `<hub>/.oculus` then equals `~/.oculus`. The carry-over sees both present and copies nothing (correct). The hub layer `<hub>/.oculus/config/` then lies inside a private folder (`private-folders.ts:24`), withheld from the YAML server and refused by language-server edits. The expected result should be named.
3. **A `local.yml` key set to the old default path** (`bookmarks: ~/.oculus/bookmarks.yml`). The key wins and nothing is copied, so this reader stays in the home folder. That follows item 2's rule. Has a wrong answer that costs: the reader expects the move and it silently does not happen. Name it.
4. **A symlinked `~/.oculus/notes`, or a linked app folder.** Item 2 does not say whether the link or its target is copied. A copied link lands a symlink pointing outside the hub inside the hub (and in git). Expected result needed.
5. **An app approved by its hash whose folder the carry-over copies** (has happened: E4 machine apps exist under `~/.oculus/apps`). `hashApp` hashes the folder path (`apps/record.ts:78-80`), so every copied app gets a new hash. It loses its approval, and `approvals.json` keeps stale entries carrying the old `folder`. Expected result needed: ask again, or carry the approval, which is a write to machine state the brief keeps out.
6. **Machine apps in a git repository.** `docs/apps.md:11` justifies the machine app's full channels by its living "in a folder of this machine", and root apps get fewer channels because "a `git pull` ... writes the root app". Decision 3 puts full-channel apps in the hub, which a `git pull` writes. A machine app under "Keep approved while I edit" stays approved through file changes (`scan.ts:144-147`, `apps.md:137`), so a pulled change to its scripts runs with every channel unasked until the server ends. This is a clash between DESIGN's app trust model and Z751(c), for the orchestrator to raise or rule.
7. **Schedules whose commands are approved by text.** Approvals key on the repository and the chain (`approvals.ts:80`), so they are unaffected by the move. In a hub shared by git, a schedule written on one machine runs on every machine that reads the hub (approval still per machine). Name it.
8. **`workspaces.json` holding absolute paths** (`fs.ts:22-30`). Shared through the hub's git, they are wrong on another machine or account. The brief does not say whether `<hub>/.oculus/` is tracked or ignored. `git check-ignore` shows nothing ignores it, so after the carry-over the notes, bookmarks, workspaces, schedules and apps show as untracked files in the hub. The tracked or ignored choice is a user-visible shape the brief does not name.
9. **A second machine reading the same hub** after a pull. The hub's copy exists, so nothing is copied, and that machine's own `~/.oculus` bookmarks and notes stop being read without a word. Expected: named, with the log or a finding.
10. **Notes' local history.** The history folder is keyed by a SHA of the real path (`docs/files-and-search.md:51`), so a carried-over note loses its earlier save copies. Name it.
11. **The demo hub's own lists.** Item 5 disagrees with itself (5.9). The demo has `utwente` in its resources and domains `graphs`/`nlp` that the engine's map lacks.
12. **Tests that build config from a fixture engine with no hub, and tests over the real engine.**
    - A fixture engine under `$TMPDIR` defaults its hub to `$TMPDIR/../..` (`local.ts:201`), an uncontrolled folder.
    - About 60 test files call `loadConfig` over the real engine. In the worktree (no `local.yml`) that reads the real hub's `.oculus/config/`, which `spec.md:37` limits to four named tests.
    - G12 ("every shipped config file reads with no finding") then also covers the hub layer.

    Expected results needed, and the `loadConfig` signature decides them (1.7).
13. **Saved layouts with the old `help` arrangement.** A page saved before the change keeps its four hub-document tabs. Axel's Help page at the landing look shows them unless reset. Expected: named (kept, or migrated).
14. **The Settings view's Reset of a hub key.** Reset writes the options `default` (`options.yml:3`): `utwente` (:337), this hub's `data_domains` (:187), and the website paths (:1327, :1334). Reset on any hub writes this hub's values into that hub's layer. The brief changes only the options' "files and help", not these defaults.
15. **A write of a hub key when `<hub>/.oculus/config/` or the key does not exist.** `config-key.ts` and `config-value.ts` edit the bytes of an existing key and refuse `not_in_file` (`config-value.ts:150`). Item 6's "created with the key" needs a new insert path. The undo of that creation (case 14, "byte for byte") means removing the file, and possibly the folder made with it. Expected result needed.
16. **A hub-layer file that sets `slurm: { resource: x, days: 5 }`.** `slurm.days` is outside the list, so it should be a finding while `slurm.resource` is applied. Name this per dotted key.
17. **A `local.yml` placed in `<hub>/.oculus/config/`.** Is it merged, refused, served? G3 guards only the engine's `config/local.yml`. Expected result needed.
18. **`hub` of `local.yml` changed while the server runs.** The five defaults and the hub layer move. `context.ts:806` re-reads apps on `appsDir` and `workspaces`, not on `hub`. Expected result needed.
19. **D55's later multi-hub use.** Per-hub settings need `loadConfig` per hub, and D55 marks `hub: true` in `roots:`, whose list now sits in one hub's layer. The signature chosen here (1.7) should not need reopening.

## 7. ADRs

1. `.agents/plan.yaml` has no `adr` key (`grep -n adr .agents/plan.yaml` prints nothing), and `find . -name adr -type d -not -path '*/node_modules/*'` finds none. No record is touched.

## 8. Dictated text

1. `D50.md:71` "the private, local-only research hub of {2}": holds (ASCII, plain).
2. `D50.md:71`, `:96` "its owner": holds. It has to be a catalog key, since it is page or agent text (`spec.md:48`). The brief says this only for the carry-over line and the findings.
3. `D50.md:176` "Everything in the brief is done": holds.
4. `D50.md:180` "no glossary": holds.
5. Not dictated, but carried by item 7's "keeps what it says": the kept text of `server.yml:14` holds two spaced hyphens standing in for dashes ("- it IS real", "numbers) - fine"), which `spec.md:20` and the prose rule ban. The rewrite should not carry them.
6. `LC_ALL=C grep -c '[^ -~]' D50.md` gives 0. The brief is ASCII.

## Declined to judge

1. Whether the paths shared with steps in flight merge simply is the orchestrator's comparison. Overlaps found by reading each brief's "Paths this step writes":
   - `config/sources.yml` (D48)
   - `config/catalogs/vocab.yml` (D41, D48)
   - `config/catalogs/options.yml` (D46, D48)
   - `config/behavior.yml` (D46)
   - `config/layout.yml` (D47, D57)
   - `context.ts` (D41, D46)
   - `portfolio.ts` (D41)
   - `writes.ts` (D48)
   - `docs/window.md` (D46, D52, D57)
   - `docs/apps.md` and `docs/configuration.md` (D48)
   - `docs/DATA-MAP.md` (D41, D52)

   D49, unbuilt and earlier in the ledger, deletes `docs/configuration.md` and `window.md` and rewrites `DATA-MAP.md`, which D50 also writes.
2. Whether `roots` belongs to "the folder layout of `config/sources.yml`" of the step line is Z751(a)'s ruling. I did not re-judge it.

Usage: claude-opus-5-5 (Opus 5.5).

Usage: a25c58150d1a4695d, claude-opus-5-5, 266,958 tokens, 111 tool uses, 14.4 min.
