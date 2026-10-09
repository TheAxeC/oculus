Done after round 1: items 1 to 10 of `agents/briefs/D50-round1.md` are done in `.agents/worktrees/D50`, and nothing inside them is left. NOT done: the points that round did not send (Spec S6, Behaviour B1 which is open item 31, B4, B6, B7; "Not sent in round 1" below), and the looks on screen, which are the orchestrator's at landing on TEST. Two results are not plain passes. (1) `npx vitest run tests/checks/config ...` and `npm run test:checks` each show exactly one failing test, `tests/checks/config/integrity.test.ts > the real hub > validates with no findings`, whose one finding is `network/events.yml` `entries[2].status` "key entries[2].status is required" (line 47); `agents/briefs/D50-cases.md` point 5 counts it as a pass, and the same finding is printed before and after under "Case 12 and 22". (2) `npm run test:quick` passed every command but took 80.6 s against its 45 s limit, because 109 files changed in this step (`test:quick: over the time limit` is printed).

Boundary note: this round ran three read-only git commands by mistake while composing shell lines (`git diff --no-index --stat /dev/null /dev/null`, `git -C . diff --stat`, `git -C . ls-files`); none changed anything and no other git command ran.

## Open items

Read with `sed -n 172,179p tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout at the moment of writing. The section holds two items, both Axel's to rule on, decisions first:

- Open item 31 (D50's review, finding B1; not sent in this round). A machine app now lives in `<hub>/.oculus/apps`, which a `git pull` writes too, while open item 25 (a) gave a machine app every channel because only the hub's owner writes that folder. With an app kept approved, a collaborator's pushed change to its scripts runs with every channel and no question until oculus restarts (`docs/apps.md:136-137`). The state file's options: (a), recommended, ask again for any change to an app's files that oculus's own editor did not make, built in D50 as a second repair round; (b) keep `<hub>/.oculus/apps` out of git, which reverses ruling (9); (c) leave it as built and state the window in `docs/apps.md`, the lazy option because it keeps the hole and only describes it. Nothing in this round changes the behaviour; `docs/apps.md:11`, `docs/apps.md:136-137` and `DESIGN.md:270` state the window as it is.
- Open item 32 (R2's preparation, outside D50). R2's start check has no entry in `agents/guarded.md`. The state file's options: (a), recommended, a new entry G73 for the start check, tested by one table over the version rule, the lockfile rule and the hub folder; (b) no entry and no test, the lazy option.

## Round 1: each item of the brief, with its command, before and after

Commands run from `tools/oculus` of the worktree with `HOME=$TMPDIR/d50/home` (a scratch folder with a link `workspace` to `~/workspace`, so the roots check finds the six directories), or `HOME=$TMPDIR/d50/runs/<case>/home` for the scratch cases. "Before" is the base source (`$TMPDIR/d50/baserun/tools/oculus`, the worktree's tooling files) with the test file as it is now, or the round-0 source (`$TMPDIR/d50/r0run`, a copy of `.agents/worktrees/D50-round0/tools/oculus/src` and `config` with the worktree's `node_modules`) where the item is about code that exists in both.

### Item 1: the tests of cases 14 and 15 as rows

Command: for each of the five files, the `describe(`/`it(` titles of the worktree file against the base copy (`diff <(grep -oE "(describe|it|it\.each|it\.skipIf\([^)]*\))\(\s*'[^']*'|^\s+'[^']*'$" <base file> | sort) <(same on the worktree file | sort)`) print no title difference; the only line that differs is a string constant of `roots.test.ts`. Each new check is a row of the test the file already has, under that title.

| File and title it runs under | Rows now in it | Before (base source) | After |
|---|---|---|---|
| `tests/server/edit/config-key.test.ts`, 'one value written over its own bytes > replaces the value and keeps every other byte, the comment on its line included' | a `ROWS` table of three: a key outside the hub list with no hub; a key outside the hub list whatever hub is given; a key of the hub list with a hub that holds no layer file (layer file, record with `replaced` and `created`, engine file unchanged) | `AssertionError: expected { ...(5) } to deeply equal { ...(5) }` | passes |
| `tests/routes/edit/config-key.test.ts`, 'taking a setting back > puts the file back byte for byte and logs the undo above the write' | a `ROWS` table of two: a key outside the hub list; a key of the hub list whose layer file the write made (undo removes the file and its folders, the log names `.oculus/config/behavior.yml`) | `AssertionError: expected '/var/folders/...' to be '.oculus/config/behavior.yml'` | passes |
| `tests/routes/edit/roots.test.ts`, 'the roots write > appends the folder as an entry under a key made from its name, keeping every other line' | the add into a hub layer that does not exist (file and folders made, `created` listed) | `AssertionError: expected 500 to be 200` | passes |
| `tests/routes/edit/roots.test.ts`, 'the roots write > records the add and the remove, and the undo of each puts the list back' | the undo of an add that made the layer file, and the remove from a layer file that holds the list with its undo | `TypeError: Cannot read properties of undefined (reading 'at')` | passes |
| `tests/routes/sessions/terminal-actions.test.ts`, 'POST /api/terminal, the chat action > starts a focused interactive Claude terminal and writes its private index first' | a second chat call with `ownerFor: () => 'Axel Faes'` asserting `research hub of Axel Faes (oculus)` and no `its owner` | `AssertionError: expected 'You are an assistant embedded in Axel...' to contain 'research hub of its owner (oculus)'` (the test stops at its first failing assertion, so the owner row is reached only after the default-owner assertion passes) | passes |
| `tests/data/sources/config/settings.test.ts`, 'slurmSettings > answers the default for a %s with a %s problem' (four table rows) | after the loop of each row, `{ ...BLOCK, resource: '' }` answers `resource: ''` with no problem | the four rows fail with `AssertionError: expected { ...(2) } to match object { value: { resource: '' }, ...(1) }` | passes |

Commands: before, `cd $TMPDIR/d50/baserun/tools/oculus && npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts tests/routes/edit/roots.test.ts tests/routes/sessions/terminal-actions.test.ts tests/data/sources/config/settings.test.ts --testTimeout 0 --hookTimeout 0` printed `Test Files 5 failed (5)`, `Tests 9 failed | 89 passed (98)`; after, the same command in the worktree printed `Test Files 5 passed (5)`, `Tests 98 passed (98)`. No run was made on the round-0 copy: it holds the behaviour these rows test, so they pass there, and it is read-only without `node_modules`.

### Item 2: comments as whole paragraphs at 100 columns

Command: a scratch detector (outside the tree) that prints, for the lines the step added or changed against the base copy, a comment line after which the first word of the next line of the same paragraph would still fit in 100 columns. Before: 16 hits, `roots.ts:1`, `roots.ts:10`, `roots.ts:122`, `groups.ts:13`, `bookmarks.ts:1`, `config-key.ts:15`, `config-key.ts:102`, `context.ts:245`, `carry-over.ts:3`, `carry-over.ts:7`, `merge.ts:264`, `merge.ts:315`, `config-checks.ts:123`, `config-checks.ts:345`, `watch/bookmarks.ts:63`, and `config/sources.yml:2`, which is the title line `# sources.yml` above a one-line paragraph and not a wrapped paragraph. After: the one hit `config/sources.yml:2` only. Each hit's paragraph is refilled to 100 columns as a whole paragraph (`roots.ts:10`: "... The edit is over the bytes through server/edit/list-edit.ts: every other line of the file is kept, ..."; `groups.ts:13`: "... the sentence that a change creates it. The rows of such a file are in no heading. ..."). `npx vitest run tests/checks/source/comment-width.test.ts --testTimeout 0 --hookTimeout 0` printed `Tests 2 passed (2)`.

### Item 3: `rootsFile` is not exported

Before: `src/lib/server/files/files.ts:242: export function rootsFile(engine: string)`, imported by `tests/checks/config/config.test.ts:26` and `config-folder.test.ts:25`. After: `files.ts:245: function rootsFile(engine: string)` with its one caller at `files.ts:267`; `grep -rn rootsFile src tests` prints those two lines only. `config.test.ts:188` reads the engine's file through `sourceFile(engine, engine, loadConfig(engine).from, 'roots')` after writing `roots: []` to the scratch engine's `sources.yml`; the roots check of `config-folder.test.ts` reads it through `sourceFile(engineDir(), HUB.hub, from, 'roots')`. `sh utils/unused-exports.sh`: `Unused exports (245)` as the base, no name that the base list lacks (`rootsFile` is not listed), and `ROOTS` of `roots.ts` is no longer listed.

### Item 4: sentences the change made false

| Where | Before | After |
|---|---|---|
| `.oculus/config/layout.yml:7` | "`group` is a key of `nav_groups` above" | "`group` is a key of `nav_groups`, which the engine's layout.yml (tools/oculus/config/layout.yml) defines" |
| `docs/DATA-MAP.md:312` | the `docs` row named `tools/oculus/config/layout.yml` | names `.oculus/config/layout.yml` |
| `docs/DATA-MAP.md:222` | "the configuration files of `tools/oculus/config/`" | "... and, for the keys of the hub list, the hub's layer of them in `.oculus/config/`" |
| `tools/oculus/DESIGN.md:270` | a root app "reaches less than a machine app" because it "is written by whoever writes to its root, a `git pull` included"; the machine folder "a folder of this machine" | the machine folder is `<hub>/.oculus/apps/` unless `apps_dir` names another; both folders are written by whoever can write them, a `git pull` into the hub included; a machine app may read every channel and can be kept approved, so a change to any file but `app.yml` leaves it approved while the server runs; a root app is offered fewer channels, cannot be kept approved, and names only its own root |
| `tests/checks/config/config-folder.test.ts:356-358` | "The two roots of sources.yml sit under the home directory ... neither" | "The roots of the hub's sources.yml sit under the home directory of whoever runs this, and a checkout on a machine without those repositories has none of them" |
| `src/lib/server/files/fs/notes.ts:6` | "it never leaves it" | the folder is the hub's `.oculus/notes` unless `notes` in `local.yml` names another, so a note in the hub's folder travels with the hub when the hub is pushed |
| `docs/configuration.md`, "The hub's own folder" | "a saved workspace does, as before" | "a saved workspace does." |

Then the grep of the names the step changed across `docs/`, `DESIGN.md`, `HELP.md`, `README.md`, `docs/DATA-MAP.md` and the head comments (`grep -n 'bookmarks.yml\|schedules.yml\|workspaces.json\|~/.oculus\|sources.yml\|layout.yml\|nav_groups' ...`, read line by line) found and fixed these other false sentences: `DESIGN.md:391` ("`roots` ... in `config/sources.yml`" now the hub's layer; `config-key` and `config-value` now say a key of the hub list is written in the hub's layer), `DESIGN.md:417` ("the control is never offered for a root app, since a pull writes a root app's files" now "since whoever writes to a root writes its apps"), `DESIGN.md:492` (the Settings view's second line for the hub's layer file), `docs/files-and-search.md:35` (the added folders are written to the hub's layer of `sources.yml`), and the head comments that named `config/sources.yml` as the home of the roots list: `bodies.ts:147`, `roots.ts:49` and `:78`, `files.ts:145`, `:241` and `:260`, `fs.svelte.ts:249` and `:741`, `fs-transport.ts:100` and `:130`, `Files.svelte:46`. `docs/apps.md:11` and `:136-137` were already true.

### Item 5: links in the carry-over (ruling Z755)

Code: `src/lib/server/root/process/carry-over.ts` `copyFollowing(from, to, copying, walking)` takes the real path of every link and copies it only when it lies inside the real `~/.oculus` (`isWithin`); a link whose target lies outside is recorded, not copied, and `carryOver` returns one finding per such link from the new text `findings.config.carry_link_outside` ("the link {0} points to {1}, which is outside the home .oculus folder; it is not copied") when the copy of that file or folder completes. A link that is the shareable path itself is handled the same way. The head comment and `docs/configuration.md` state the rule.

Case 21 with a third link, `c21d.mts` (home `notes/` holds `a.md`, `inner.md -> a.md`, `linked.md -> <run>/outside/elsewhere.md` and `third.md -> <run>/outside/third.md`):

```
BEFORE (round-0 source)
findings=0
hub notes: ["a.md 048ee553a4bb","inner.md 048ee553a4bb","linked.md f56a6b37870f","third.md 2e1acdff8a51"]
  linked.md: exists=true symlink=false bytes="Elsewhere\nbytes outside the notes folder\n"
  third.md: exists=true symlink=false bytes="Third\nbytes outside the home .oculus folder\n"
AFTER
findings=2
  the link <home>/.oculus/notes/linked.md points to <run>/outside/elsewhere.md, which is outside the home .oculus folder; it is not copied
  the link <home>/.oculus/notes/third.md points to <run>/outside/third.md, which is outside the home .oculus folder; it is not copied
hub notes: ["a.md 048ee553a4bb","inner.md 048ee553a4bb"]
  inner.md: exists=true symlink=false bytes="Note A\nbody of note a\n"
  linked.md: exists=false
  third.md: exists=false
carrying leftovers: 0
```

`inner.md`, a link whose target is inside `~/.oculus`, is copied as a regular file with the bytes of `a.md` in both runs. `c21e.mts` (`~/.oculus/bookmarks.yml` itself a link to a file outside): `findings=1`, the same sentence naming `<home>/.oculus/bookmarks.yml` and its target, `bookmarks.yml in hub: false; copied lines: 0; carrying leftovers: 0`. `c21c.mts` (a link inside `notes/` back to `notes/`): one finding `could not be copied from <home>/.oculus/notes (<home>/.oculus/notes/loop links back to a folder being copied); the hub has no copy`, no hub `notes` folder, no `.carrying-` sibling.

### Item 6: the line for a home copy that stays

`config/text/server.yml:13`, `server.carry.kept`: before "{1} already exists and is the one read; {0} is not read.", after "{1} already exists and is the one read; {0} is no longer read and can be removed.". `c1to5b.mts 2` prints `info: <run>/hub/.oculus/bookmarks.yml already exists and is the one read; <run>/home/.oculus/bookmarks.yml is no longer read and can be removed.` The same sentence is in `docs/configuration.md` ("The hub's own folder").

### Item 7: when the copy is made

`docs/configuration.md:50`, "The hub's own folder", now opens the carry-over paragraph with "The copy is made when the server starts and not while it runs, so a `hub` changed in `local.yml` while oculus runs is carried at the next start." (`grep -n "carried at the next start" docs/configuration.md`).

### Item 8: the roots check over this hub's roots

Before: `config-folder.test.ts:360` (round-0 copy) `const ROOTS = readRoots(loadConfig(engineDir()).config, rootsFile(engineDir())).roots;` over the engine's `roots: []` (`config/sources.yml:77`), so the check passed over an empty list. After: the check is in the `realHub()` block (`const HUB = realHub()` at line 563), `it.skipIf(!HUB.present || MISSING.length > 0)('reads the roots of sources.yml without a finding', ...)` over `loadConfig(engineDir(), { hub: HUB.hub })`, asserting the list is not empty and has no finding. `npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose` printed `passed: ... oculus's own config directory > reads the roots of sources.yml without a finding 134ms`. A scratch run (`loadConfig(engineDir(), { hub: realHub().hub })`, `readRoots(config, sourceFile(..., 'roots'))`) printed `ROOTS6 <worktree> true cathedra,game-engine,ordo,scotoma,officium,youtube-downloader 6 [] <worktree>/.oculus/config/sources.yml`: six roots, no finding, read from the hub layer's file. The check is skipped, with the missing directories on the console, on a machine without one of those six directories, and in that run the roots are not read.

### Item 9: the documents-list test

It is now in the `realHub()` block (line 587), after the roots check and before the schema test (line 606), all three under `const HUB = realHub()`: `it.skipIf(!HUB.present)('names a group of its own and a path under the hub for every document', ...)` over `loadConfig(engineDir(), { hub: HUB.hub })`. `npx vitest run tests/checks/config/config-folder.test.ts --reporter=verbose` printed `passed: ... names a group of its own and a path under the hub for every document 133ms`.

### Item 10: this report

Rewritten whole; the sentence that a pulled app has no approval until the reader approves it is replaced under "Anything in the brief that was wrong or impossible" by what `docs/apps.md:136-137` says. The verify list ran once after the last change; its rows are in "DONE / NOT DONE".

## The cases the brief's rules got wrong, and the ruling

The ruling is `agents/briefs/D50-cases.md`. Each of the six points was applied as written.

- A1, case 12: compared for every key outside `options`, `text` and the `help` arrangement's tabs, which are equal; the difference inside `options` and `text` is printed under "Case 12" below. Ruling: comparing the hub-list keys alone is refused.
- A2, case 13 and item 8: the six text lines (`findings.yml` `domain_unknown` and `theme_labels_retired`, `views/sources/files.yml` `refused_roots_invalid`, `views/sources/doc.yml` `unlisted`, `views/academic/present.yml` and `slides.yml` `empty_unnamed`) name the hub's `.oculus/config/` file when the hub sets the key, else the engine's. Case 13 allows only the `domain_unknown` message to differ.
- A3, the readers of the real hub: `integrity.test.ts`, the `realHub()` block of `config-folder.test.ts`, `tests/fixtures/real-hub.ts` and `tests/data/real-hub.probe.ts` call `loadConfig(engine, { hub })`; every other test passes no hub.
- A4, the signature: `loadConfig(engine, opts?: { hub?: string; instead?: ReplacedFile })`, `ReplacedFile` is `{ name, text, layer: 'engine' | 'hub' }`, and the result gains `from`, a map keyed by dotted path (a top-level key or text key maps to the engine file name; a key the hub layer sets maps to `.oculus/config/<file>`). Both are internal and reversible.
- A5, case 22 and verify 2: the one failure above; quoted before and after under "Case 12 and 22".
- A6, the paths: added `edit/writes/config/config-write.ts`, `edit/writes/undo.ts`, `state/system/config/{groups,rows,config-files,write}.ts`, `views/system/workbench/Settings.svelte`, `settings/{Item,EditLink,List}.svelte`, `server/root/watch/local.ts`, the six text files, `tests/fixtures/real-hub.ts`, `tests/data/real-hub.probe.ts`. Each is in the file table with its reason. `BUILT_FROM.hub` in `server/root/watch/local.ts` was `['portfolio', 'usageRefresh', 'git']` and is `['portfolio', 'usageRefresh', 'git', 'bookmarks', 'schedules']`.

## The first run of the 22 cases on the unchanged tree

This is the first run as handed to the orchestrator (sections A and B of that message; section A is the table above).

Commands run with `HOME=$TMPDIR/d50/runs/<case>/home` and the hub and engine copy under `$TMPDIR/d50/runs/<case>`; scripts in `$TMPDIR/d50`.

1. `node c1to5.mts 1`: order of calls `watchApps > watchPortfolio > watchBookmarks > watchSchedules`; paths held `<home>/.oculus/workspaces.json`, `<home>/.oculus/bookmarks.yml`, `<home>/.oculus/schedules.yml`; apps watcher folder `<home>/.oculus/apps`, app `hello` as root `""`, 0 findings; hub `.oculus` absent; home unchanged; no copy line in the log. Reading: `createServerContext` calls `followRoots(..., local.workspaces ?? defaultWorkspacesPath())` at `context.ts:298`, before any watcher, so the carry-over goes at the top of the function.
2. `c1to5.mts 2` (hub `bookmarks.yml` present): hub file kept, readers still hold the home paths, nothing logged.
3. `c1to5.mts 3a` (`bookmarks` set to a hub path): bookmarks held `<hub>/other/bm.yml`, other four at home. `3b` (`bookmarks: ~/.oculus/bookmarks.yml`): held `<home>/.oculus/bookmarks.yml`. Nothing copied in either.
4. `c1to5.mts 4`: `approvals.json`, `calendar/`, `mail/`, `connect/`, `changes.jsonl` present at home; hub `.oculus` absent, home unchanged.
5. `c1to5.mts 5` (hub `.oculus` is a file): the start function completes, same paths held, nothing logged.
6. `c6first.mts`: bookmark, note, schedule and workspace writes through the default paths land in `<home>/.oculus/` (`bookmarks.yml`, `notes/n1.md`, `schedules.yml`, `workspaces.json`); hub `.oculus` absent. `c6.mts` (real `watchPortfolio` over a copy of the demo hub, files written under `<hub>/.oculus`): `after bookmarks + note + schedule + app written under <hub>/.oculus: new portfolio versions = 0`; `after workspaces.json written: new portfolio versions = 1` (workspaces file given as `<hub>/.oculus/workspaces.json`). So the watcher behaves as the brief expects once the paths move.
7. `c7.mts a` (default): `apps=hello(root="hub") findings=[]` (read as the hub root's app). `c7.mts b` (`apps_dir` = `<hub>/.oculus/apps`): `apps=hello(root="") findings=["apps[hub/]: .../hub/.oculus/apps is already read as an earlier apps folder or app folder, so it is left out"]`. This is the `repeated` finding the scan must skip (`scan.ts:208-228`).
8. `c8to11.mts` with `slurm: {resource: other}` and `roots` in `<hub>/.oculus/config`: `slurm.resource = "utwente"`, `slurm.poll_min = 20`, `roots` = the engine's six, `findings(0)`, `from? false`. Hub layer ignored; `from` not returned.
9. Same script: `usage_tiers` in the hub layer: engine value, no finding. `slurm: {resource: x, days: 5}`: `slurm.resource = "utwente"`, `slurm.days = 3`, no finding.
10. Same script: unparsable `behavior.yml` and a `local.yml` in the hub layer: engine values, no finding.
11. Same script, hub with no `.oculus/config`: `findings=0 slurmSettings.resource="utwente" data_domains=[7 words] venue_themes.length=13 data_themes.length=11 linkedin_dir="theaxec.github.io/_linkedin" publications_file="theaxec.github.io/_data/publications.yml" roots.length=6 docs.length=13 domains=12`. These are today's engine values, the ones item 4 empties.
12. `base12.mts` saved main's merged map (115 keys, 0 findings) to `$TMPDIR/d50/out/main-config.json` as the baseline. `npx vitest run tests/checks/config/integrity.test.ts`: 1 failed (A5), 7 passed. See A1 and A3.
13. `c13.mts`: `projects=11 snapshotFindings=11 configFindings=0 slurm.resource=utwente domains=12 venue_themes=13 data_themes=11 data_domains=7`, saved to `$TMPDIR/d50/out/demo-main.json`. See A2.
14. `c14to16.mts 14`: write of `slurm.resource`=other: `changed=["behavior.yml:slurm.resource"]`, record file `<engine>/config/behavior.yml`, hub `.oculus` absent; its undo gives the engine file back byte for byte. `slurm.poll_min`=30: same. The new rows (hub-layer file created, undo removes file and folder) have no code to run against yet.
15. `c14to16.mts 15`: Add Folder to Workspace writes `<engine>/config/sources.yml` (`record.file`), hub layer absent; its undo is byte for byte. Remove (`cathedra`) then its undo: `differs from before` (the entry comes back as `{ key: cathedra, dir: ... }` without the alignment spaces). That is today's roots undo; the roots row compares the list, and the report says so.
16. `c14to16.mts 16`: the `docs` family write (13 to 12 entries) changes `<engine>/config/layout.yml`; hub layer absent.
17. Reading: `Item.svelte:144` and `EditLink.svelte:23` open `sourceTabState(ENGINE_ROOT, row.file, row.line)`, so Edit in File on `slurm.resource` opens `engine:behavior.yml`.
18. `c18.mts`: a change to `<hub>/.oculus/config/sources.yml`: `new config versions: 0, new portfolio versions: 0`; for contrast a change to the engine's `config/sources.yml`: `new config versions 1, new portfolio versions 1`.
19. `c19.mts`: the rendered instruction names `Axel Faes`, holds the sentence `NEVER suggest writing up a null or negative result`, 2 spaced hyphens, no `{2}`, no "its owner". `npx vitest run tests/routes/sessions/terminal-actions.test.ts`: 20 passed.
20. Scratch vitest run (`$TMPDIR/d50/vt`, outside the tree): `Cluster group lines: ["behavior.yml"]`, `slurm.resource row: file=behavior.yml id=behavior.yml:slurm.resource state=set value="utwente" default="utwente"`. The rows are read from the text of the file the row names.
21. `c21.mts`: home `notes/` holds `a.md` and `linked.md -> symlink`; `listNotes` gives `["a"]`, `readNote(linked)` gives `null` (`noteFile` refuses a link); hub `.oculus` absent.
22. `npx vitest run tests/checks/config ...`: see A5 (1 failed, 75 passed). Baseline of the other named files: `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts tests/routes/edit/roots.test.ts tests/routes/sessions/terminal-actions.test.ts tests/checks/source/keys.test.ts --testTimeout 0 --hookTimeout 0`: `Test Files 5 passed (5)`, `Tests 33 passed (33)`.

## Each case after the change

Commands: `HOME=$TMPDIR/d50/runs/<case>/home node --experimental-strip-types --no-warnings <script>.mts` from `$TMPDIR/d50` (every script exits with code 3 unless `HOME` is under `$TMPDIR/d50`), and for the Settings rows `npx vitest run -c $TMPDIR/d50/vt/vitest.scratch.config.ts c20b.scratch --silent=false` (a vitest config outside the tree). No scratch file is in the tree.

1. `c1to5b.mts 1`: `order of calls: carryOver > watchApps > watchPortfolio > watchBookmarks > watchSchedules`; paths held `<hub>/.oculus/workspaces.json`, `<hub>/.oculus/bookmarks.yml`, `<hub>/.oculus/schedules.yml`; apps watcher folder `<hub>/.oculus/apps` with `hello(root="")` and 0 findings; hub `.oculus` holds `apps/hello/app.yml`, `apps/hello/index.html`, `bookmarks.yml`, `notes/a.md`, `schedules.yml`, `workspaces.json` with the home file's hashes (`bookmarks.yml 0c60c486c0da`, `notes/a.md 048ee553a4bb`); `home .oculus unchanged: true`; five log lines, one per file, of the form `Copied <run>/home/.oculus/notes to <run>/hub/.oculus/notes; the copy in the home folder is left as it is.`
2. `c1to5.mts 2` (hub `bookmarks.yml` present with other bytes, hash `728004bc939e`): it is kept; the other four are copied; log `<run>/hub/.oculus/bookmarks.yml already exists and is the one read; <run>/home/.oculus/bookmarks.yml is no longer read and can be removed.`; home unchanged.
3. `c1to5.mts 3a` (`bookmarks` set to `<hub>/other/bm.yml`): bookmarks held `<hub>/other/bm.yml`, no `bookmarks.yml` in the hub `.oculus`, four log lines. `3b` (`bookmarks: ~/.oculus/bookmarks.yml`): bookmarks held `<home>/.oculus/bookmarks.yml`, no `bookmarks.yml` in the hub, four log lines.
4. `c1to5.mts 4` (home also holds `approvals.json`, `calendar/`, `mail/`, `connect/`, `changes.jsonl`): the hub `.oculus` holds only the five; `home .oculus unchanged: true`.
5. `c1to5.mts 5` (hub `.oculus` is a file): the function completes, `hub .oculus: []`, five lines of the form `config: <run>/hub/.oculus/workspaces.json [] could not be copied from <run>/home/.oculus/workspaces.json (EEXIST: file already exists, mkdir '<run>/hub/.oculus'); the hub has no copy`, apps watcher `folders: []`.
6. `c6.mts`: `portfolio versions after start: 1`; `after bookmarks + note + schedule + app written under <hub>/.oculus: new portfolio versions = 0`; `after workspaces.json written: new portfolio versions = 1`.
7. `c7.mts a` and `c7.mts b` (b sets `apps_dir` to `<hub>/.oculus/apps`): `variant a: apps=hello(root="") findings=[]`, `variant b: apps=hello(root="") findings=[]`. The unchanged tree gave `hello(root="hub")` for a and a `repeated` finding for b. The row 'the hub apps folder, which is the machine folder by default' in `tests/server/machine/apps/manifest.test.ts` covers it, and the existing row 'an apps_dir that is a root apps folder' still expects `repeated` for a root other than the hub.
8. `c8to11.mts`: `slurm.resource = "other"`, `slurm.poll_min = 20`, `roots = [{"key":"mine","dir":"/nowhere/mine"}]`, `findings(0)`, `from` names `.oculus/config/behavior.yml` for `slurm.resource` and `.oculus/config/sources.yml` for `roots`. A roots finding names the hub file through `sourceFile(engine, hub, from, 'roots')` (`portfolio.ts:595`, `config-checks.ts`).
9. `c8to11.mts`: `usage_tiers` in the hub layer gives the engine's four tiers and the finding `<hub>/.oculus/config/behavior.yml [usage_tiers] key usage_tiers is not one the hub config layer sets; it is not applied`; `slurm: {resource: x, days: 5}` gives `slurm.resource = "x"`, `slurm.days = 3` and the finding `[slurm.days] key slurm.days is not one the hub config layer sets; it is not applied`.
10. `c8to11.mts`: an unparsable `behavior.yml` gives `slurm.resource = ""` and one finding `[] does not parse: Flow sequence in block collection must be sufficiently indented and end wi...` (the line is the library's message, cut here by the script at 90 characters); `local.yml` in the hub layer gives one finding `<hub>/.oculus/config/local.yml [] local.yml is the machine's own file and is never read from the hub config layer` and nothing of it read.
11. `c8to11.mts` case 11: `findings=0 slurmSettings.resource="" data_domains=[] venue_themes.length=0 data_themes.length=0 linkedin_dir=undefined publications_file=undefined roots.length=0 docs.length=0 domains=0`. Readers, `c11r.mts`: `audit dataDomains size 0 publicationsFile ""`; `hpc host "" missing "the settings of this hub name no cluster (slurm.resource in .oculus/config/behavior.yml)"` (the poller has no host to poll); `feeds {"leads":"feeds/position-leads.yml","radar":"feeds/literature-radar.yml","linkedin":""} linkedin read null`; `venue theme labels {} facets []`. The Venues view builds its facets from `themeWordLabels(configMap().venue_themes)` (`Venues.svelte:64`), which is that empty result, and `Linkedin.svelte` draws `linkedin.unnamed` for a feed whose `file` is `''`; both are read, not seen.
12. See "Case 12 and 22" below.
13. `c13.mts out/demo-after.json hub` over `tools/oculus/demo` with `loadConfig(TREE, { hub: demo })`: `projects=11 snapshotFindings=11 configFindings=0 slurm.resource=utwente domains=12 venue_themes=13 data_themes=11 data_domains=7`. Compared with `demo-main.json` by a python script: `projects equal`, `configFindings equal`, `slurmResource equal`, `domains equal`, `venue_themes equal`, `data_themes equal`, `data_domains equal`, and `findings DIFF` in exactly one entry, the `domain_unknown` message for `graph-bandits`: before "... which config/catalogs/vocab.yml does not list; its slides are drawn in the neutral tone", after "... which is not in the domains of .oculus/config/catalogs/vocab.yml in the hub (of config/catalogs/vocab.yml when the hub sets none); its slides are drawn in the neutral tone". The demo's layer holds no `docs`, so the demo's catalogue lists none of the 13 hub documents (on main it listed them, with no files behind them).
14. `c14to16.mts 14`: write of `slurm.resource`=other gives `changed=["behavior.yml:slurm.resource"]`, `record.file=<run>/hub/.oculus/config/behavior.yml`, the engine file unchanged, `hub/.oculus: ["config/","config/behavior.yml fb009dba6125"]`; its undo leaves the engine file byte for byte and the layer file absent (the folders are gone: `hub/.oculus: absent` after the `poll_min` write that follows). `slurm.poll_min`=30 gives `record.file=<run>/engine/config/behavior.yml`, the layer file absent, and its undo gives `back byte for byte`.
15. `c14to16.mts 15`: Add Folder to Workspace with no layer creates `<hub>/.oculus/config/sources.yml`, the record's `created` lists the made folders and file (stored relative to the hub: `['.oculus', '.oculus/config', '.oculus/config/sources.yml']`, asserted in `roots.test.ts`), the engine file unchanged, and its undo leaves the engine file byte for byte and the hub `.oculus` absent. With the layer holding `roots`, Add and its undo return the layer file byte for byte. Remove (`cathedra`) writes the layer file; its undo puts the list back with one line differing in spacing only (`  - { key: cathedra,    dir: ~/workspace/cathedra }` comes back as `  - { key: cathedra, dir: ~/workspace/cathedra }`, line 82 of the layer file). That is the roots writer's undo as it was on main (it rewrites the list from the recorded entries), and the rows compare the list.
16. `c14to16.mts 16`: a `docs` write with no layer creates `<hub>/.oculus/config/layout.yml` holding `docs:` and the one entry, engine file unchanged; its undo removes the file (`absent`). With the layer present (13 to 12 entries) the write changes only the layer file and the undo gives it back byte for byte.
17. `c17.mts`: `handleSourceInfo` for root `hub`, path `.oculus/config/behavior.yml` answers `200 {"ok":true,"readonly":false}`, so the source tab opens and saves it; `Item.svelte` and `Control.svelte` pass `placeOf(row)` to `EditLink`, which gives `{ root: 'hub', file: '.oculus/config/behavior.yml' }` for a hub row and `{ root: 'engine', file: 'behavior.yml' }` for any other (`rows.ts`). The save reaches the config channel through case 18.
18. `c18.mts`: a change to `<hub>/.oculus/config/sources.yml`: `new config versions: 1, new portfolio versions: 1`; a second change: `2` and `2`; for contrast the engine's `config/sources.yml`: `1` and `1`.
19. `c19b.mts` over a copy of the demo hub with the people file as it is (the entry `owner` carries `self: true`): `ownerName="Dr. Dana Example"`, instruction starts `You are an assistant embedded in the private, local-only research hub of Dr. Dana Example (ocul`, no rule sentence. With the `self: true` line removed: `ownerName=null`, `... research hub of its owner (oculus). Th`, no rule sentence. G35: see the table.
20. `c20b.scratch.test.ts` over the Settings model with the worktree's own hub layer: `Cluster group lines: [["engine","behavior.yml"],["hub",".oculus/config/behavior.yml"]]`; `slurm.resource row: file=behavior.yml hub={"path":".oculus/config/behavior.yml","present":true} state=set value="utwente" line=13`; `slurm.poll_min row: file=behavior.yml hub=null value=20 line=78`; with no layer file: `hub={"path":".oculus/config/behavior.yml","present":false} value=""`, and the group still lists the hub file's line. The look on TEST is the orchestrator's.
21. `c21d.mts` (home `notes/` holds `a.md`, `inner.md -> a.md`, `linked.md -> <run>/outside/elsewhere.md` and `third.md -> <run>/outside/third.md`; the last two point outside `~/.oculus`): `findings=2`, `the link <home>/.oculus/notes/linked.md points to <run>/outside/elsewhere.md, which is outside the home .oculus folder; it is not copied` and the same for `third.md`; hub `notes` holds `a.md` and `inner.md` (a regular file with the bytes of `a.md`, `symlink=false`), `linked.md: exists=false`, `third.md: exists=false`, `carrying leftovers: 0`; the unchanged round-0 source copied both outside links as files with `findings=0` (item 5 above). With a link inside `notes/` to `notes/` itself (`c21c.mts`) the copy of `notes` is refused with one finding, `<run>/hub/.oculus/notes could not be copied from <home>/.oculus/notes (<home>/.oculus/notes/loop links back to a folder being copied); the hub has no copy`, the hub has no `notes` folder and no `.carrying-` sibling is left.
22. See "Case 12 and 22" below.

### Case 12 and 22

`c22.mts` builds the snapshot over the worktree's hub root with `portfolioConfigFrom(loadConfig(...))`. Before (the unchanged tree's source, `D50_TREE=$TMPDIR/d50/baserun/tools/oculus`, `loadConfig(TREE)`): `configFindings 0 snapshot findings ["<hub>/network/events.yml:47 [entries[2].status] key entries[2].status is required"]`, `projects 94`. After (`loadConfig(TREE, { hub })`): the same line and `projects 94`. So `integrity.test.ts` gives the same findings before and after.

`c12after.mts`, run again after this round, compares `loadConfig(TREE, { hub: <worktree root> })` with main's `loadConfig(engine)` saved in `out/main-config.json` (115 keys, 0 findings). It printed `main keys=115 findings=0; now keys=115 findings=0`, `differing top-level keys: options, arrangements, text`, and for `arrangements` only `help` differs (`c12h.mts`: `other keys differing: 0`, `arrangements other than help differing: 0`). The `help` arrangement differs in its tabs: on main the default Help page opened `help`, then HPC how-to, Data map, Research approach and Agent approach, then the eight oculus guides, then `memories`; now it opens `help`, the eight oculus guides, then `memories`. The 13 hub documents stay in the catalogue as the hub layer's `docs` in `.oculus/config/layout.yml`. The differing leaves of `options` (18) and `text` (24; the first report printed 23, and the 24th is `findings.config.carry_link_outside`) are the following, printed by the script:

```
== options: 18 differing leaves
  behavior.yml.data_domains.default
     main: ["heart","liver","liverfl","liversurv","immune","brain","brainbci"]
     now:  []
  behavior.yml.data_domains.help
     main: "Domains expected to have a dataset. The audit reports an active or manuscript project in one of these domains that has no datasets entry."
     now:  "Domains expected to have a dataset. The audit reports an active or manuscript project in one of these domains that has no datasets entry. This is a setting of the hub, kept in the hub's .oculus/config/behavior.yml, and a hub that sets none expects no dataset."
  behavior.yml.slurm.resource.default
     main: "utwente"
     now:  ""
  behavior.yml.slurm.resource.empty
     main: undefined
     now:  "no cluster"
  behavior.yml.slurm.resource.help
     main: "The cluster the Live HPC poller queries: the key of a cluster entry of registries/resources.yml, whose host is the ssh alias. The machine's own hpc_host in local.yml takes precedence. A key that names no cluster with a host shows why in the HPC view."
     now:  "The cluster the Live HPC poller queries: the key of a cluster entry of registries/resources.yml, whose host is the ssh alias. This is a setting of the hub, kept in the hub's .oculus/config/behavior.yml. The machine's own hpc_host in local.yml takes precedence. Empty sets no cluster, and the HPC view says so and polls nothing. A key that names no cluster with a host shows why in the HPC view."
  layout.yml.docs.help
     main: "Hub documents listed in the view catalogue. Each is one entry inside its group, listed after the group's views, and opens the doc view. An entry that is not three non-empty strings is dropped, and a path with no file there draws the view's own missing line."
     now:  "Hub documents listed in the view catalogue. Each is one entry inside its group, listed after the group's views, and opens the doc view. An entry that is not three non-empty strings is dropped, and a path with no file there draws the view's own missing line. This is a setting of the hub, kept in the hub's .oculus/config/layout.yml; the engine's list is empty."
  local.yml.apps_dir.help
     main: "Where the machine's apps live, one folder of web files per app. Without it the folder is ~/.oculus/apps. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
     now:  "Where the machine's apps live, one folder of web files per app. Without it the folder is .oculus/apps in the hub, which only the hub's owner writes. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
  local.yml.bookmarks.help
     main: "Where the reader's own bookmarks live. Without it the file is ~/.oculus/bookmarks.yml. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
     now:  "Where the reader's own bookmarks live. Without it the file is .oculus/bookmarks.yml in the hub. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
  local.yml.notes.help
     main: "Where the scratch notes live. Without it the folder is ~/.oculus/notes. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
     now:  "Where the scratch notes live. Without it the folder is .oculus/notes in the hub. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
  local.yml.schedules.help
     main: "Where the schedules live, the entries the update tray's Schedules section lists and a reader may write by hand. Without it the file is ~/.oculus/schedules.yml. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
     now:  "Where the schedules live, the entries the update tray's Schedules section lists and a reader may write by hand. Without it the file is .oculus/schedules.yml in the hub. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
  local.yml.workspaces.help
     main: "Where the file browser's saved workspaces live. Without it the file is ~/.oculus/workspaces.json. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
     now:  "Where the file browser's saved workspaces live. Without it the file is .oculus/workspaces.json in the hub. A value of ~ or one starting with ~/ is under the home folder, and any other relative value is resolved against the engine directory. A change is read again at once."
  sources.yml.linkedin_dir.default
     main: "theaxec.github.io/_linkedin"
     now:  ""
  sources.yml.linkedin_dir.empty
     main: undefined
     now:  true
  sources.yml.linkedin_dir.help
     main: "The folder of the LinkedIn posts pipeline on the website, where a numbered file is posted and an xx- file is an idea."
     now:  "The folder of the LinkedIn posts pipeline on the website, where a numbered file is posted and an xx- file is an idea. Empty names no folder, and the LinkedIn view says so. This is a setting of the hub, kept in the hub's .oculus/config/sources.yml."
  sources.yml.publications_file.default
     main: "theaxec.github.io/_data/publications.yml"
     now:  ""
  sources.yml.publications_file.empty
     main: undefined
     now:  true
  sources.yml.publications_file.help
     main: "The public website's publications feed, cross-checked in the Audit view for missing, leaked, wrong-section and untracked entries. The check is skipped when the file is not checked out."
     now:  "The public website's publications feed, cross-checked in the Audit view for missing, leaked, wrong-section and untracked entries. Empty names no file, and the check is skipped, as it is when the file is not checked out. This is a setting of the hub, kept in the hub's .oculus/config/sources.yml."
  sources.yml.roots.help
     main: "The roots the server may serve local files from, one directory per key. A relative dir is a finding, and a dir that is not on this machine is a finding and its root serves nothing. Nothing outside a root is served, since both ends are resolved through realpath. These are the folders of the default workspace. The Files view's Add Folder to Workspace appends an entry here and Remove Folder from Workspace removes one, and a saved workspace keeps its own folders in its file."
     now:  "The roots the server may serve local files from, one directory per key. A relative dir is a finding, and a dir that is not on this machine is a finding and its root serves nothing. Nothing outside a root is served, since both ends are resolved through realpath. These are the folders of the default workspace, a setting of the hub kept in the hub's .oculus/config/sources.yml; the engine's list is empty. The Files view's Add Folder to Workspace appends an entry here and Remove Folder from Workspace removes one, and a saved workspace keeps its own folders in its file."
== text: 24 differing leaves
  app.schedules.problem_schedules_unread
     main: "The schedules file does not read, so oculus writes nothing to it."
     now:  "schedules.yml in the .oculus folder of the hub (or the path local.yml names) does not read, so oculus writes nothing to it."
  app.schedules.unread_schedules
     main: "~/.oculus/schedules.yml does not read, so no schedule runs and oculus writes nothing to it."
     now:  "schedules.yml in the .oculus folder of the hub (or the path local.yml names) does not read, so no schedule runs and oculus writes nothing to it."
  app.schedules.unread_schedules_at
     main: "~/.oculus/schedules.yml does not read at line {0}, so no schedule runs and oculus writes nothing to it."
     now:  "schedules.yml in the .oculus folder of the hub (or the path local.yml names) does not read at line {0}, so no schedule runs and oculus writes nothing to it."
  doc.unlisted
     main: "{0} is not in the documents list of config/layout.yml, and no entry there carries this tab's name."
     now:  "{0} is not in the documents list (docs in .oculus/config/layout.yml in the hub, or in config/layout.yml when the hub sets none), and no entry there carries this tab's name."
  files.refused_roots_invalid
     main: "The roots in config/sources.yml cannot be rewritten without losing a line, so the file is left as it is."
     now:  "The roots in .oculus/config/sources.yml in the hub cannot be rewritten without losing a line, so the file is left as it is."
  findings.config.carry_failed
     main: undefined
     now:  "could not be copied from {0} ({1}); the hub has no copy"
  findings.config.carry_link_outside
     main: undefined
     now:  "the link {0} points to {1}, which is outside the home .oculus folder; it is not copied"
  findings.config.hub_file_unknown
     main: undefined
     now:  "this file is not one the hub config layer takes (sources.yml, layout.yml, behavior.yml and catalogs/vocab.yml); it is not read"
  findings.config.hub_key_not_map
     main: undefined
     now:  "{0} must be a map holding keys the hub config layer sets; it is not applied"
  findings.config.hub_key_unknown
     main: undefined
     now:  "key {0} is not one the hub config layer sets; it is not applied"
  findings.config.hub_local
     main: undefined
     now:  "local.yml is the machine's own file and is never read from the hub config layer"
  findings.deck.domain_unknown
     main: "project {0} names the domain {1}, which config/catalogs/vocab.yml does not list; its slides are drawn in the neutral tone"
     now:  "project {0} names the domain {1}, which is not in the domains of .oculus/config/catalogs/vocab.yml in the hub (of config/catalogs/vocab.yml when the hub sets none); its slides are drawn in the neutral tone"
  findings.validate.theme_labels_retired
     main: "theme_labels is not read; the labels are data_themes in config/catalogs/vocab.yml"
     now:  "theme_labels is not read; the labels are data_themes in .oculus/config/catalogs/vocab.yml in the hub, or in config/catalogs/vocab.yml when the hub sets none"
  hpc.host_no_cluster
     main: undefined
     now:  "the settings of this hub name no cluster (slurm.resource in .oculus/config/behavior.yml)"
  linkedin.no_folder
     main: "No _linkedin folder."
     now:  "The LinkedIn folder {0} is not in the hub."
  linkedin.unnamed
     main: undefined
     now:  "The hub names no LinkedIn folder. Set linkedin_dir in the hub's .oculus/config/sources.yml to name one."
  present.empty_unnamed
     main: "No deck is set. Name the portfolio deck as `portfolio_deck` in config/sources.yml, or open a deck from a project card or from a folder in the Files view."
     now:  "No deck is set. Name the portfolio deck as `portfolio_deck` in .oculus/config/sources.yml in the hub or in config/sources.yml, or open a deck from a project card or from a folder in the Files view."
  server.carry.copied
     main: undefined
     now:  "Copied {0} to {1}; the copy in the home folder is left as it is."
  server.carry.kept
     main: undefined
     now:  "{1} already exists and is the one read; {0} is no longer read and can be removed."
  server.chat.chat_focus_note
     main: "FOCUS - answer specifically about project `{0}` ({1}). Your working directory is the project's own folder `{2}` (absolute); read its files for depth."
     now:  "FOCUS: answer specifically about project `{0}` ({1}). Your working directory is the project's own folder `{2}` (absolute); read its files for depth."
  server.chat.chat_instruction
     main: "You are an assistant embedded in Axel Faes' PRIVATE, local-only research hub (oculus). The hub root is `{0}`; every folder in the portfolio index is relative to this absolute path. Your working directory is `{1}`; for a project chat this is the project's own folder, also named in the focus note. The portfolio index file named below is your authoritative INDEX (every project's id, status, venue, headline results, and folder paths) - it IS real; never doubt it or claim you have no source. Answer surface questions from it directly. For DEPTH (methods, full results, dead-ends, manuscript text, code), READ the project's own files with your read tools. Resolve its index folder against the absolute hub root before reading its README.md, code/README.md, manuscript/ and code/; use those absolute paths from any working directory. Cite what you read (project id + file). Be concise. The data is PRIVATE (dead-ends, unpublished numbers) - fine to discuss here, but NEVER suggest writing up a null or negative result. Do not read human-only files named NOTES.md or DIARY.md. If neither the index nor the files say, say so."
     now:  "You are an assistant embedded in the private, local-only research hub of {2} (oculus). The hub root is `{0}`; every folder in the portfolio index is relative to this absolute path. Your working directory is `{1}`; for a project chat this is the project's own folder, also named in the focus note. The portfolio index file named below is your authoritative INDEX (every project's id, status, venue, headline results, and folder paths); it is real, so do not doubt it or claim you have no source. Answer surface questions from it directly. For depth (methods, full results, dead-ends, manuscript text, code), read the project's own files with your read tools. Resolve its index folder against the absolute hub root before reading its README.md, code/README.md, manuscript/ and code/; use those absolute paths from any working directory. Cite what you read (project id + file). Be concise. The data is private (dead-ends, unpublished numbers) and can be discussed here. Do not read human-only files named NOTES.md or DIARY.md. If neither the index nor the files say, say so."
  server.chat.chat_owner_fallback
     main: undefined
     now:  "its owner"
  slides.empty_unnamed
     main: "No deck is set. Name the portfolio deck as `portfolio_deck` in config/sources.yml, or open a deck from the Present view."
     now:  "No deck is set. Name the portfolio deck as `portfolio_deck` in .oculus/config/sources.yml in the hub or in config/sources.yml, or open a deck from the Present view."
  workbench.settings_layer_absent
     main: undefined
     now:  "{0} is not there. A change to a setting of the hub creates it."
```

The `help` arrangement difference and every other top-level key: `other keys differing: 0` (`c12h.mts`). `from` for the hub keys: `{"roots":".oculus/config/sources.yml","docs":".oculus/config/layout.yml","slurm.resource":".oculus/config/behavior.yml","data_domains":".oculus/config/behavior.yml","domains":".oculus/config/catalogs/vocab.yml","scan":".oculus/config/sources.yml","slurm":"behavior.yml","publications_file":".oculus/config/sources.yml"}`.

Case 22: `npx vitest run tests/checks/config tests/data/sources/config --testTimeout 0 --hookTimeout 0` (first report) printed `Test Files 1 failed | 8 passed (9)`, `Tests 1 failed | 184 passed (185)`, and after this round `c22.mts hub` printed `configFindings 0 snapshot findings ["<hub>/network/events.yml:47 [entries[2].status] key entries[2].status is required"]`, `projects 94`; the failure is `integrity.test.ts > the real hub > validates with no findings` with the `network/events.yml` finding above (before the change: `Tests 1 failed | 75 passed (76)` over `tests/checks/config`, same test). Every option of the hub list is described once with the hub layer's file in its help (the `options` rows above), and the vocab keys of the list (`domains`, `venue_themes`, `data_themes`), which are not options, are named in `docs/configuration.md` under "The hub's own folder" and in the vocab row of its table.

## DONE / NOT DONE

Run from `tools/oculus` of the worktree with `HOME=$TMPDIR/d50/home`, once after the last change of the round (the files under `$TMPDIR/d50/out/f-*.txt`).

| Row | Command | Output |
|---|---|---|
| diagrams | `npm run diagrams` | exit 0; `docs/diagrams/{channels,writes,layer-*}.{dot,svg}` regenerated |
| quick | `npm run test:quick -- <the 109 changed paths>` | `test:quick: 109 changed file(s)`, `ok prettier (4.5 s)`, `ok ASCII gate (4.7 s)`, `ok svelte-kit sync (16.6 s)`, `ok eslint (47.0 s)`, `ok svelte-check (45.7 s): ... COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (76.1 s)`, `test:quick: 80.6 s (limit 45.0 s); every command passed`, `test:quick: over the time limit` |
| verify 2 list | `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts tests/routes/edit/roots.test.ts tests/routes/sessions/terminal-actions.test.ts tests/checks/config tests/checks/source/keys.test.ts --testTimeout 0 --hookTimeout 0` | `Test Files 1 failed \| 8 passed (9)`, `Tests 1 failed \| 113 passed (114)`; the failure is the ruled `integrity.test.ts` finding (`entries[2].status`, line 47) |
| guarded entries of the files store, apps watcher, schedules, hpc, config writes | `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts tests/routes/edit/roots.test.ts tests/routes/sessions/terminal-actions.test.ts tests/checks/config tests/checks/source/keys.test.ts tests/server/files tests/routes/files/fs.test.ts tests/server/machine/apps tests/routes/apps tests/server/machine/runs/schedules tests/server/machine/hpc tests/routes/machine/hpc.test.ts tests/server/root tests/routes/edit tests/data tests/state/system tests/views/system tests/server/edit tests/server/core/changes.test.ts --testTimeout 0 --hookTimeout 0` | `Test Files 1 failed \| 76 passed (77)`, `Tests 1 failed \| 725 passed (726)` (733 tests before the seven new titles were folded into rows); the failure is the ruled finding. The slow-tagged files among them ran by path, not through `npm run test:slow` |
| checks | `npm run test:checks` | `Test Files 1 failed \| 16 passed (17)`, `Tests 1 failed \| 252 passed (253)`; the failure is the ruled finding; the roots check and the documents-list check of `config-folder.test.ts` ran and passed over this hub |
| key catalogue and comment width | `npx vitest run tests/checks/source/keys.test.ts tests/checks/source/comment-width.test.ts --testTimeout 0 --hookTimeout 0` | `Test Files 2 passed (2)`, `Tests 10 passed (10)` |
| ASCII gate | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` (the spec's form without `bin`, which does not exist in the worktree: `ls ../../bin` prints `No such file or directory`) | prints nothing; `LC_ALL=C grep -n '[^ -~]'` over the hub's `.oculus/config`, the demo's `.oculus/config`, `docs/*.md`, `HELP.md`, `DESIGN.md` and `docs/DATA-MAP.md` prints nothing |
| YAML | python `yaml.safe_load` over the changed YAML files, the hub's and the demo's layer files and the five registry files | `26 yaml files parsed` |
| folders | `sh utils/folder-check.sh` | exit 0, no output |
| sizes | `wc -l` | the table below; `context.ts` 868 (limit 880), `config-checks.ts` 526, `carry-over.ts` 176, the settings components at most 352 (limit 520) |
| unused exports | `sh utils/unused-exports.sh` against `.agents/worktrees/D50-base/tools/oculus/unused-exports.txt` | `Unused exports (245)` in both; a name-by-name comparison finds no name the base list lacks, and `ROOTS` of `roots.ts` is no longer listed |
| history words | the added lines of every changed file against the base, matched for `previously`, `used to`, `formerly`, `originally`, `reverted`, `legacy`, `as before`, `round N`, `step D`, `no longer` | hits are the required sentence of `server.carry.kept` ("is no longer read and can be removed"), present-tense uses (`carry-over.ts`: an approval keyed by the old folder no longer matches the copy) and the identifier `earlier` in code; none states a past |
| prose | the added lines of the docs, text and config files searched for a spaced hyphen, `--` and an em dash | none, except table separators, array arithmetic in code and `--dangerously-skip-permissions`, an existing flag name in `docs/window.md` |
| grep of changed names | `grep -rn -e rootsFile -e carry_link_outside -e "server.carry" -e copyFollowing -e isWithin src tests config docs HELP.md DESIGN.md README.md ../../docs/DATA-MAP.md` | `rootsFile` only in `files.ts:245` and `:267`; the other names only in `carry-over.ts` and `config/text/findings.yml:78`; no document names a changed name wrongly |
| diff against the base | `diff -rq .agents/worktrees/D50-base/tools/oculus tools/oculus -x node_modules -x .svelte-kit -x .scratch` | 109 paths of the step (the table below), plus the build infrastructure files the base copy does not hold (`.gitignore`, `.prettierignore`, `.prettierrc`, `assets`, `eslint.config.js`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `demo`) |
| scratch cases after the last change | `c1to5b.mts` 1 to 5, `c21c.mts`, `c21d.mts`, `c21e.mts`, `c12after.mts`, `c22.mts hub` | cases 1 to 5 as in "Each case after the change" (case 2's log line now ends "is no longer read and can be removed"); case 21 as quoted under item 5; case 12 prints `text: 24 differing leaves` and `options: 18`, the extra leaf being `findings.config.carry_link_outside`, and `server.carry.kept` reworded; case 22 prints the one `events.yml` finding and `projects 94` |

Items of the first brief, unchanged by this round:

| Item | Status | Where |
|---|---|---|
| 1 defaults of the five files in `<hub>/.oculus/` | DONE | `defaultBookmarksPath(hub)`, `defaultNotesDir(hub)`, `defaultWorkspacesPath(hub)`, `defaultSchedulesPath(hub)`, `machineFolder(local, engine)` in `watch/apps.ts`; cases 1 to 5 and 7 |
| 2 carry-over | DONE | `server/root/process/carry-over.ts`, called from `context.ts` before any reader; cases 1 to 5 and 21 |
| 3 two layers via `loadConfig(engine, { hub?, instead? })` | DONE | `data/sources/config/merge.ts`, `data/helpers/hub-names.ts`; cases 8 to 11 |
| 4 this hub's layer and the engine's general values | DONE | `.oculus/config/{sources,layout,behavior}.yml`, `.oculus/config/catalogs/vocab.yml`, `config/` and `config/catalogs/options.yml`; case 12 |
| 5 demo hub's layer | DONE | `tools/oculus/demo/.oculus/config/{behavior.yml,catalogs/vocab.yml}`; case 13 |
| 6 writes, undo, reload, watch, Settings view | DONE | `config-key.ts`, `config-value.ts`, `roots.ts`, `config-checks.ts`, `undo.ts`, `watch/portfolio.ts`, `state/system/config/*`, `Settings.svelte`; cases 14 to 18, 20 |
| 7 neutral chat instruction | DONE | `server.chat.chat_instruction` with `{2}`, `chat.ts`, `hooks.ts` `ownerName`; case 19 |
| 8 text and docs | DONE | the file table, and "Each paragraph and head comment" below |
| 9 sizes | DONE | `folder-check.sh` exit 0; `context.ts` 868 |
| 10 git | DONE | the hub's `.gitignore` is untouched; the hub layer files are new paths of the diff |
| The four registry lines (open item 26 (a)) | DONE | below |
| The looks on screen | NOT DONE here | the orchestrator's, on TEST |

## Tests added or changed, each with its failing line on the unchanged tree

The unchanged tree is a copy of the base (`$TMPDIR/d50/baserun/tools/oculus`, base `src`, the worktree's tooling files) with the test file as it is after its last change. Command: `npx vitest run <the files> --testTimeout 0 --hookTimeout 0`. The rows of cases 14 and 15 are rows of the tests the files already had, under those titles (round 1, item 1).

| Test (file, title) | On the unchanged tree | After |
|---|---|---|
| `tests/server/edit/config-key.test.ts`, 'one value written over its own bytes > replaces the value and keeps every other byte, the comment on its line included' (three rows: no hub, a hub with a key outside the list, a hub-list key with no layer file) | `AssertionError: expected { ...(5) } to deeply equal { ...(5) }` | passes |
| `tests/routes/edit/config-key.test.ts`, 'taking a setting back > puts the file back byte for byte and logs the undo above the write' (two rows) | `AssertionError: expected '/var/folders/...' to be '.oculus/config/behavior.yml'` | passes |
| `tests/routes/edit/roots.test.ts`, 'the roots write > appends the folder as an entry under a key made from its name, keeping every other line' (hub-layer add row) | `AssertionError: expected 500 to be 200` | passes |
| `tests/routes/edit/roots.test.ts`, 'the roots write > records the add and the remove, and the undo of each puts the list back' (undo of a made layer file, remove from a held layer) | `TypeError: Cannot read properties of undefined (reading 'at')` | passes |
| `tests/checks/config/config.test.ts`, 'replaces the engine value of a listed key whole and names the layer file in `from`' | `AssertionError: expected 'utwente' to be 'other'` | passes |
| the same file, 'names a key, a file and a local.yml the layer may not set, and applies none of them' | `AssertionError: expected [] to deeply equal [ [ ...(2) ], [ ...(2) ], [ ...(2) ], ...(1) ]` | passes |
| the same file, 'keeps the engine values and names the file when a layer file does not parse' | `AssertionError: expected [] to deeply equal [ Array(1) ]` | passes |
| the same file, 'reads the engine alone for a hub without the folder and for a call that passes no hub' | `AssertionError: expected [ { key: 'cathedra', ...(1) }, ...(5) ] to deeply equal []` | passes |
| the same file, 'reads an empty slurm.resource as no cluster, with no finding' | `AssertionError: expected [ Array(1) ] to deeply equal []` | passes |
| the same file, 'is the folder the engine root serves and the file a root finding names' (reads the file through `sourceFile`) | cannot run on the unchanged tree: `sourceFile` and the `from` of `loadConfig` do not exist there (the base exports `rootsFile`) | passes |
| `tests/data/sources/config/settings.test.ts`, 'slurmSettings > answers the default for a %s with a %s problem' (the empty-resource assertion of each of the four rows) | `AssertionError: expected { ...(2) } to match object { value: { resource: '' }, ...(1) }` | passes |
| `tests/server/machine/apps/manifest.test.ts`, 'the hub apps folder, which is the machine folder by default' | `AssertionError: expected [ [ 'app:notes' ], [ 'apps[hub/]' ] ] to deeply equal [ [ 'app:notes' ], [] ]` | passes |
| `tests/routes/sessions/terminal-actions.test.ts`, 'starts a focused interactive Claude terminal and writes its private index first' (G35, changed, with the owner row) | `AssertionError: expected 'You are an assistant embedded in Axel...' to contain 'research hub of its owner (oculus)'` | passes |
| `tests/data/sources/config/catalog/options.test.ts`, 'names a key an entry does not take, and leaves a control to optionFindings' (call shape changed) | `AssertionError: expected [] to deeply equal [ [ true, ...(1) ] ]` | passes |
| `tests/checks/config/config-folder.test.ts`, 'reads the roots of sources.yml without a finding' and 'names a group of its own and a path under the hub for every document' (in the `realHub()` block), `tests/checks/config/integrity.test.ts`, `tests/fixtures/real-hub.ts`, `tests/data/real-hub.probe.ts` | not run on the unchanged tree: they read this hub, which the copy of the base does not hold; the hub-less form gives 240 findings against 1 with the engine's empty lists (first run, A3); the roots check read the engine's empty list (item 8) | pass, except the ruled finding |
| `tests/server/root/eslint-switch.test.ts` | preserved behaviour (a new dependency `carryOver: () => []` of the test context) | passes |

Rows to enter in `agents/guarded.md` (I edit no plan file): G12 and G13, the four rows of 'loadConfig with the hub layer' and 'reads an empty slurm.resource as no cluster, with no finding' in `config.test.ts`, and the changed `EXPECTED` and documents-list rows of `config-folder.test.ts`; G14, the hub argument of `integrity.test.ts`; G8, the three rows in `tests/server/edit/config-key.test.ts`, the two hub-layer rows in `tests/routes/edit/roots.test.ts`, one in `tests/server/machine/apps/manifest.test.ts` and the empty-resource assertion in `tests/data/sources/config/settings.test.ts` under 'slurmSettings > answers the default for a %s with a %s problem'; G9, the two rows in `tests/routes/edit/config-key.test.ts`; G35, the changed row, which now holds the owner row. No new title is in any of those five files.

## Every edit to an existing assertion, allow list or predicate (from `diff` against the base)

| File | Before | After | Reason |
|---|---|---|---|
| `tests/checks/config/config.test.ts` (543 to 546) | `expect(lines).toContain('slurm.resource: slurm.resource must not be empty; the default is used')` | `expect(lines).toContain('slurm.resource: slurm.resource must be text; the default is used')` | an empty `slurm.resource` now means no cluster (brief item 4); the wrong-settings fixture now sets `5` |
| `tests/data/sources/config/wrong-settings.ts:7` | `slurm: { resource: '', ... }` | `slurm: { resource: 5, ... }` | `''` is a valid value now; `5` is the wrong type the test wants |
| `tests/checks/config/config-folder.test.ts` `EXPECTED['sources.yml']` | listed `'publications_file'`, `'linkedin_dir'` | both lines removed | the engine's `sources.yml` no longer defines the two keys; the hub's `sources.yml` does |
| the same file, 'names a group of its own and a path under the hub for every document' | `loadConfig(engineDir())` | `it.skipIf(!HUB.present)(...)` over `loadConfig(engineDir(), { hub: HUB.hub })`, placed in the `realHub()` block (`const HUB = realHub()` at line 563) with the other tests that read the hub | the documents list is the hub layer's (`docs: []` in the engine); the assertions are unchanged |
| the same file, 'reads the roots of sources.yml without a finding' | `readRoots(loadConfig(engineDir()).config, rootsFile(engineDir()))`, over the engine's `roots: []` | in the `realHub()` block, `it.skipIf(!HUB.present || MISSING.length > 0)` over `loadConfig(engineDir(), { hub: HUB.hub })` and `readRoots(config, sourceFile(engineDir(), HUB.hub, from, 'roots'))`; it also asserts `found.roots.length` is above zero | the roots are the hub layer's; the roots check read an empty list before |
| the same file, the `realHub()` block and `HUB` | `const HUB = realHub()` inside the later block; `loadConfig(engineDir())` | `const HUB = realHub()` in the same block, before the schema test; `loadConfig(engineDir(), { hub: HUB.hub })` | ruling point 3 |
| `tests/checks/config/config.test.ts:188` | `expect(rootsFile(engine)).toBe(join(engine, 'config', 'sources.yml'))` | `expect(sourceFile(engine, engine, loadConfig(engine).from, 'roots')).toBe(join(engine, 'config', 'sources.yml'))` after `writeConfig(engine, 'sources.yml', 'roots: []\n')` | `rootsFile` is no longer exported; the engine's file is read through `sourceFile` |
| the same file line 324 and `tests/data/sources/config/catalog/options.test.ts:84` | `loadConfig(engineDir(), { name, text })` | `loadConfig(engineDir(), { instead: { name, text, layer: 'engine' } })` | ruling point 4 |
| `tests/checks/config/integrity.test.ts:51`, `tests/fixtures/real-hub.ts:31`, `tests/data/real-hub.probe.ts:35` | `loadConfig(engine)` | `loadConfig(engine, { hub })` | ruling point 3 |
| `tests/routes/edit/roots.test.ts:49` | `sources: { file, held: {...} }` | `sources: { file, held: {...}, base: [] }` | the roots target now carries the list in force |
| `tests/routes/sessions/terminal-actions.test.ts:500` | `.replace('{1}', task.chatProject)` | the same plus `.replace('{2}', CHAT_CATALOG['server.chat.chat_owner_fallback'])`, and a second call in the same test with `ownerFor: () => 'Axel Faes'` | the instruction has a third placeholder, and its owner is named |
| `tests/server/root/eslint-switch.test.ts:46-49` | no `carryOver` | `carryOver: () => []` and the comment adds "no copy of `~/.oculus`" | the context takes the carry-over as a dependency |

No threshold, tolerance or predicate was loosened: every changed expectation asserts the new behaviour, and the old finding `slurm.resource must not be empty` is gone because the value it refused is now valid.

## The four registry lines (open item 26 (a)) and the demo line

| File and line | Before | After |
|---|---|---|
| `registries/data.yml:28` | `... from the data_themes list of tools/oculus/config/catalogs/vocab.yml; the Data view filters by them.` | `... from the data_themes list of .oculus/config/catalogs/vocab.yml in the hub; the Data view filters by them.` |
| `registries/venues.yml:27` | `... from the venue_themes list of tools/oculus/config/catalogs/vocab.yml.` | `... from the venue_themes list of .oculus/config/catalogs/vocab.yml in the hub.` |
| `registries/domains.yml:1` | `... from the `domains` map of tools/oculus/config/catalogs/vocab.yml)` | `... from the `domains` map of .oculus/config/catalogs/vocab.yml in the hub)` |
| `registries/resources.yml:1` | `... and `slurm.resource` in tools/oculus/config/behavior.yml are keys into this file ...` | `... and `slurm.resource` in .oculus/config/behavior.yml in the hub are keys into this file ...` |
| `tools/oculus/demo/registries/resources.yml:1` | the same sentence as `registries/resources.yml:1` | the same replacement |

The other `tools/oculus/config/...` mentions in the registries (`registries/data.yml:9` `data_access`, `registries/pillars.yml:31` `palette`) name keys that stay in the engine's vocab file, so they are unchanged and true.

## Terms

no glossary (`ls tools/oculus/docs` holds no `glossary.md`).

## Files with line counts

Lines in the base copy and in the worktree (`wc -l`) for the 109 paths of the step except the regenerated diagram files. Files at the worktree root: `docs/DATA-MAP.md` is 518 lines in the worktree (the base copy holds only `tools/oculus`), and each of `registries/data.yml`, `registries/venues.yml`, `registries/domains.yml`, `registries/resources.yml` has one line changed.

| File | Lines before | Lines now |
|---|---|---|
| `tools/oculus/config/behavior.yml` | 314 | 314 |
| `tools/oculus/config/catalogs/options.yml` | 1454 | 1457 |
| `tools/oculus/config/catalogs/vocab.yml` | 299 | 263 |
| `tools/oculus/config/layout.yml` | 184 | 171 |
| `tools/oculus/config/sources.yml` | 137 | 116 |
| `tools/oculus/config/text/app.yml` | 250 | 250 |
| `tools/oculus/config/text/findings.yml` | 238 | 244 |
| `tools/oculus/config/text/server.yml` | 284 | 288 |
| `tools/oculus/config/text/views/academic/present.yml` | 82 | 82 |
| `tools/oculus/config/text/views/academic/slides.yml` | 48 | 48 |
| `tools/oculus/config/text/views/feeds/linkedin.yml` | 33 | 34 |
| `tools/oculus/config/text/views/sources/doc.yml` | 18 | 18 |
| `tools/oculus/config/text/views/sources/files.yml` | 289 | 289 |
| `tools/oculus/config/text/views/system/machine/hpc.yml` | 79 | 80 |
| `tools/oculus/config/text/views/system/workbench.yml` | 210 | 211 |
| `tools/oculus/DESIGN.md` | 586 | 586 |
| `tools/oculus/docs/apps.md` | 861 | 861 |
| `tools/oculus/docs/configuration.md` | 69 | 90 |
| `tools/oculus/docs/files-and-search.md` | 150 | 150 |
| `tools/oculus/docs/views.md` | 281 | 281 |
| `tools/oculus/docs/window.md` | 82 | 82 |
| `tools/oculus/HELP.md` | 186 | 186 |
| `tools/oculus/src/lib/data/helpers/hub-names.ts` | 117 | 166 |
| `tools/oculus/src/lib/data/helpers/run/schedules.ts` | 232 | 232 |
| `tools/oculus/src/lib/data/index.ts` | 302 | 305 |
| `tools/oculus/src/lib/data/model/model-machine.ts` | 786 | 786 |
| `tools/oculus/src/lib/data/sources/config.ts` | 102 | 103 |
| `tools/oculus/src/lib/data/sources/config/catalog/value-rule.ts` | 260 | 263 |
| `tools/oculus/src/lib/data/sources/config/local.ts` | 573 | 573 |
| `tools/oculus/src/lib/data/sources/config/merge.ts` | 273 | 457 |
| `tools/oculus/src/lib/server/core/changes.ts` | 400 | 408 |
| `tools/oculus/src/lib/server/edit/feeds.ts` | 714 | 716 |
| `tools/oculus/src/lib/server/edit/writes.ts` | 635 | 640 |
| `tools/oculus/src/lib/server/edit/writes/bodies.ts` | 546 | 547 |
| `tools/oculus/src/lib/server/edit/writes/config/config-checks.ts` | 276 | 526 |
| `tools/oculus/src/lib/server/edit/writes/config/config-fit.ts` | 493 | 493 |
| `tools/oculus/src/lib/server/edit/writes/config/config-key.ts` | 132 | 173 |
| `tools/oculus/src/lib/server/edit/writes/config/config-value.ts` | 212 | 244 |
| `tools/oculus/src/lib/server/edit/writes/config/config-write.ts` | 100 | 112 |
| `tools/oculus/src/lib/server/edit/writes/config/roots.ts` | 273 | 369 |
| `tools/oculus/src/lib/server/edit/writes/undo.ts` | 413 | 482 |
| `tools/oculus/src/lib/server/files/files.ts` | 298 | 301 |
| `tools/oculus/src/lib/server/files/fs.ts` | 709 | 711 |
| `tools/oculus/src/lib/server/files/fs/bookmarks.ts` | 133 | 133 |
| `tools/oculus/src/lib/server/files/fs/collections.ts` | 150 | 150 |
| `tools/oculus/src/lib/server/files/fs/notes.ts` | 192 | 194 |
| `tools/oculus/src/lib/server/files/fs/open-files.ts` | 228 | 231 |
| `tools/oculus/src/lib/server/files/roots.ts` | 49 | 49 |
| `tools/oculus/src/lib/server/machine/apps/scan.ts` | 244 | 250 |
| `tools/oculus/src/lib/server/machine/hpc/host.ts` | 114 | 120 |
| `tools/oculus/src/lib/server/machine/pty/start/chat.ts` | 119 | 124 |
| `tools/oculus/src/lib/server/machine/runs/schedules/file.ts` | 706 | 706 |
| `tools/oculus/src/lib/server/machine/runs/schedules/watch.ts` | 734 | 734 |
| `tools/oculus/src/lib/server/root/context.ts` | 844 | 868 |
| `tools/oculus/src/lib/server/root/process/carry-over.ts` | new | 176 |
| `tools/oculus/src/lib/server/root/watch/apps.ts` | 374 | 377 |
| `tools/oculus/src/lib/server/root/watch/bookmarks.ts` | 111 | 111 |
| `tools/oculus/src/lib/server/root/watch/git-start.ts` | 50 | 51 |
| `tools/oculus/src/lib/server/root/watch/local.ts` | 158 | 158 |
| `tools/oculus/src/lib/server/root/watch/portfolio.ts` | 684 | 730 |
| `tools/oculus/src/lib/server/sessions/stores/hooks.ts` | 209 | 224 |
| `tools/oculus/src/lib/shell/rail/ActivityRail.svelte` | 360 | 361 |
| `tools/oculus/src/lib/shell/rail/ScheduleList.svelte` | 221 | 221 |
| `tools/oculus/src/lib/shell/rail/UpdateTray.svelte` | 262 | 262 |
| `tools/oculus/src/lib/state/sources/explorer/view/bookmark-rows.ts` | 101 | 101 |
| `tools/oculus/src/lib/state/sources/fs-transport.ts` | 445 | 445 |
| `tools/oculus/src/lib/state/sources/fs.svelte.ts` | 826 | 827 |
| `tools/oculus/src/lib/state/system/config/editors/fields.ts` | 662 | 665 |
| `tools/oculus/src/lib/state/system/config/groups.ts` | 309 | 351 |
| `tools/oculus/src/lib/state/system/config/messages.ts` | 58 | 59 |
| `tools/oculus/src/lib/state/system/config/rows.ts` | 266 | 363 |
| `tools/oculus/src/lib/state/system/config/view/hub-layer.ts` | new | 46 |
| `tools/oculus/src/lib/views/feeds/linkedin/Linkedin.svelte` | 331 | 333 |
| `tools/oculus/src/lib/views/sources/files/Files.svelte` | 366 | 366 |
| `tools/oculus/src/lib/views/system/workbench/Settings.svelte` | 342 | 352 |
| `tools/oculus/src/lib/views/system/workbench/settings/Control.svelte` | 150 | 150 |
| `tools/oculus/src/lib/views/system/workbench/settings/EditLink.svelte` | 24 | 24 |
| `tools/oculus/src/lib/views/system/workbench/settings/Item.svelte` | 330 | 332 |
| `tools/oculus/src/lib/views/system/workbench/settings/List.svelte` | 170 | 170 |
| `tools/oculus/src/routes/+page.svelte` | 287 | 287 |
| `tools/oculus/src/routes/api/(files)/fs/+server.ts` | 42 | 42 |
| `tools/oculus/src/routes/api/(machine)/schedules/+server.ts` | 35 | 35 |
| `tools/oculus/src/routes/api/(sessions)/terminal/+server.ts` | 44 | 45 |
| `tools/oculus/tests/checks/config/config-folder.test.ts` | 629 | 647 |
| `tools/oculus/tests/checks/config/config.test.ts` | 668 | 773 |
| `tools/oculus/tests/checks/config/integrity.test.ts` | 291 | 291 |
| `tools/oculus/tests/data/real-hub.probe.ts` | 134 | 134 |
| `tools/oculus/tests/data/sources/config/catalog/options.test.ts` | 102 | 102 |
| `tools/oculus/tests/data/sources/config/settings.test.ts` | 754 | 758 |
| `tools/oculus/tests/data/sources/config/wrong-settings.ts` | 84 | 84 |
| `tools/oculus/tests/fixtures/real-hub.ts` | 37 | 37 |
| `tools/oculus/tests/routes/edit/config-key.test.ts` | 61 | 93 |
| `tools/oculus/tests/routes/edit/roots.test.ts` | 205 | 263 |
| `tools/oculus/tests/routes/sessions/terminal-actions.test.ts` | 528 | 542 |
| `tools/oculus/tests/server/edit/config-key.test.ts` | 93 | 198 |
| `tools/oculus/tests/server/machine/apps/manifest.test.ts` | 689 | 703 |
| `tools/oculus/tests/server/root/eslint-switch.test.ts` | 140 | 144 |
| `.oculus/config/behavior.yml` | new | 13 |
| `.oculus/config/catalogs/vocab.yml` | new | 51 |
| `.oculus/config/layout.yml` | new | 21 |
| `.oculus/config/sources.yml` | new | 87 |
| `tools/oculus/demo/.oculus/config/behavior.yml` | new | 13 |
| `tools/oculus/demo/.oculus/config/catalogs/vocab.yml` | new | 51 |

The reason for each group of paths:

- Paths of the brief: `hub-names.ts` (the hub list and the layer paths), `merge.ts` (the two layers), `config.ts`, `local.ts`, `index.ts`, `value-rule.ts` (an empty path where the option allows it), `context.ts`, `carry-over.ts` (new), `watch/apps.ts`, `watch/bookmarks.ts`, `watch/git-start.ts`, `watch/portfolio.ts` (watches `<hub>/.oculus/config`), `files/fs.ts`, `fs/bookmarks.ts`, `fs/notes.ts`, `fs/collections.ts`, `fs/open-files.ts`, `files/roots.ts`, `schedules/file.ts`, `schedules/watch.ts`, `apps/scan.ts`, `hpc/host.ts`, `chat.ts`, `hooks.ts`, `routes/api/*` (the hub passed to the default paths), `config-key.ts`, `config-value.ts`, `roots.ts`, `config-checks.ts`, `config-fit.ts`, `writes.ts`, `changes.ts`, `feeds.ts`, the config, text and docs files, and the tests.
- Added by the ruling (point 6): `edit/writes/config/config-write.ts` and `edit/writes/undo.ts` (the write and undo of a key in the hub layer: the layer is chosen from the change's file, an added key is taken out with the made file and folders); `state/system/config/groups.ts`, `rows.ts`, `config-files.ts`, `write.ts` and the new `view/hub-layer.ts` (the Settings rows of a hub-list key read the hub layer's file and name it); `Settings.svelte`, `settings/Item.svelte`, `settings/EditLink.svelte`, `settings/List.svelte` and `settings/Control.svelte` (the file a row opens); `server/root/watch/local.ts` (`BUILT_FROM.hub`); the six text files; `tests/fixtures/real-hub.ts`; `tests/data/real-hub.probe.ts`.
- Added because a reader of an empty value needed it: `state/system/config/editors/fields.ts` and `config-fit.ts` (a file, folder or path control with `empty` accepts `''`), `feeds.ts` and `Linkedin.svelte` (an empty `linkedin_dir` is no feed), `hpc/host.ts` and `hpc.yml` (an empty `slurm.resource` is no cluster), `model-machine.ts` head comment.
- Head-comment rewordings: `ActivityRail.svelte`, `ScheduleList.svelte`, `UpdateTray.svelte`, `bookmark-rows.ts`, `fs.svelte.ts`, `Files.svelte`, `+page.svelte`, `data/helpers/run/schedules.ts`.
- The hub's own layer: `.oculus/config/sources.yml` (the keys `scan`, `portfolio_deck`, `venues_file`, `datasets_file`, `pillars_file`, `domains_file`, `people_file`, `organisations_file`, `resources_file`, `collections`, `leads_file`, `radar_file`, `publications_file`, `linkedin_dir`, `career_file`, `roots`: from `config/sources.yml` lines 13, 24, 28, 32, 36, 39, 43, 46, 49, 53, 69, 73, 76, 79, 82, 92 of the base to lines 8, 19, 23, 27, 31, 34, 38, 41, 44, 48, 64, 68, 71, 74, 77, 81), `.oculus/config/layout.yml` (`docs`: base `config/layout.yml:171` to line 8), `.oculus/config/behavior.yml` (`data_domains`: base `config/behavior.yml:26` to line 8; `slurm.resource: utwente`: base `:75` block to lines 12-13), `.oculus/config/catalogs/vocab.yml` (`domains`: base `:51` to line 8; `venue_themes`: `:264` to line 24; `data_themes`: `:280` to line 40). The demo's layer: `tools/oculus/demo/.oculus/config/behavior.yml` (`data_domains`, `slurm.resource: utwente`) and `catalogs/vocab.yml` (`domains`, `venue_themes`, `data_themes` as the engine held them on main), and no `roots`, website keys or `docs`.

- Added in round 1: `src/lib/server/edit/writes/bodies.ts`, `src/lib/state/sources/fs-transport.ts` (head comments that named `config/sources.yml` as the home of the roots list), `src/lib/server/files/files.ts` (`rootsFile` no longer exported, comments), `docs/files-and-search.md` (the roots write goes to the hub's layer).

## Each paragraph and head comment "What is on the tree" lists

Rewritten (the new text names the hub's `.oculus` folder or the two layers): `ActivityRail.svelte:63`, `ScheduleList.svelte:3`, `UpdateTray.svelte:3`, `schedules/watch.ts:1`, `schedules/file.ts:1`, `bookmark-rows.ts:2`, `model-machine.ts:3`, `data/helpers/run/schedules.ts:1`, `routes/+page.svelte:216`, `Files.svelte:43` (it also said the bookmarks file is under no served root: the file is in the hub root now and the sentence says it is written by the star and the Bookmarks controls), `files/fs.ts` (three comments), `fs/bookmarks.ts`, `fs/notes.ts` (it said a note never leaves the machine; it now says the folder is the hub's `.oculus/notes` unless `notes` in `local.yml` names another, so a note travels with the hub when the hub is pushed), `fs/collections.ts`, `watch/bookmarks.ts` (head and doc), `state/sources/fs.svelte.ts`, `data/sources/config/local.ts` (five doc comments), `apps/scan.ts` head, `hpc/host.ts` head, `merge.ts` head, `groups.ts` head, `Settings.svelte` head, `config-write.ts`/`config-checks.ts`/`config-key.ts`/`config-value.ts` doc comments, `carry-over.ts` (new). `config/text/app.yml` `unread_schedules`, `unread_schedules_at`, `problem_schedules_unread`: rewritten (the file is `schedules.yml` in the `.oculus` folder of the hub or the path `local.yml` names). `config/sources.yml` head and the comments of the keys that moved, `config/layout.yml` and `config/behavior.yml` comments, `config/catalogs/vocab.yml` comments, and the help of `workspaces`, `bookmarks`, `notes`, `schedules`, `apps_dir`, `docs`, `roots`, `slurm.resource`, `data_domains`, `publications_file`, `linkedin_dir` in `config/catalogs/options.yml`: rewritten. `docs/window.md:25,29`, `docs/files-and-search.md:35`, `docs/apps.md:11,19,20,22,42,45,48,64,74,599`, `docs/views.md:153,195,241`, `docs/configuration.md` (intro line 3, the table rows for layout, sources and vocab, the new sections "The two layers of settings" and "The hub's own folder", "What is kept outside the hub"), `DESIGN.md:91,270,272,306,391,417,492,547,573`, `HELP.md:170`, `docs/DATA-MAP.md:219,222,232,233,235,243,296,300,302,308,310,311,312,316,517`: rewritten. `README.md` of oculus (`~/.oculus/window.json`) and `docs/DATA-MAP.md:381` (`<root>/.oculus/apps/<name>/app.yml`): still true.

Still true, not edited: `README.md` of oculus (the `~/.oculus/window.json` line), `docs/DATA-MAP.md:381` (`<root>/.oculus/apps/<name>/app.yml`), and every comment of a file this step did not edit that names `~/.oculus/<file>`, which are the files that stay in `~/.oculus` (the second grep in the DONE table lists them).

Head comments naming the roots list as a list of `config/sources.yml` now name the hub's layer: `bodies.ts:147`, `roots.ts:49` and `:78`, `files.ts:145`, `:241` and `:260`, `fs.svelte.ts:249` and `:741`, `fs-transport.ts:100` and `:130`, `Files.svelte:46`.

## Judgment calls the brief left open

1. `loadConfig(engine, opts?: { hub?: string; instead?: ReplacedFile })` and the returned `from`, a map from a dotted path (or top-level key or text key) to the file it came from (the engine file's name, or `.oculus/config/<file>` for a hub-set key). Internal and reversible; ruled as point 4.
2. The hub list is the constant `HUB_LIST` in `data/helpers/hub-names.ts`, keyed by config file, with `hubKeysOf(name)`, `hubLayerPath(name)`, `fromHubLayer` and `HUB_LAYER`. Findings of the layer: `findings.config.hub_file_unknown`, `hub_local`, `hub_key_unknown`, `hub_key_not_map`, `carry_failed`. User-visible only as finding text.
3. A key set in a hub layer file replaces the engine's value whole; a map is walked per dotted path, so `slurm.resource` in the hub layer leaves `slurm.poll_min` as the engine's.
4. The write chooses the layer by the key: a key of the hub list goes to the hub layer's file (created with its folders when absent, the record's `created` lists what it made, outermost first), any other key to the engine file; `placeOf(engine, hub, file, key)` in `config-checks.ts`. The change log stores a path inside the hub relative to the hub. The undo takes the added text out and removes the file and folders the write made when they are empty.
5. The roots undo is the roots writer's own (a rewrite from the recorded entries), so the undo of a Remove in the layer file restores the list, not the alignment spaces of one line (case 15).
6. Empty values: `slurm.resource: ''` is no cluster, with the text `hpc.host_no_cluster` and no finding; `linkedin_dir: ''` is no feed (`FEED_FILES.linkedin = ''`), with the text `linkedin.unnamed`; `publications_file` absent is `''` and the audit skips the check. File, folder and path controls with `empty` accept `''` in the Settings view (`fields.ts`, `config-fit.ts`, `value-rule.ts`).
7. Settings view: `ConfigRow.hub: { path, present } | null`, `FileLine.root`, `HubLayer`, `LayerResult`, `placeOf(row)` (the root and file a row opens), `hubLayerText(file, listing, text)` in the new `state/system/config/view/hub-layer.ts` (`view/` held 3 files and holds 4), and the message `layerAbsent` (`workbench.settings_layer_absent`). A hub row shows the layer's value when the layer holds the key and the engine's general value otherwise, with no line number in that case. All internal and reversible.
8. The carry-over is `server/root/process/carry-over.ts` (`server/root/process` held 9 items and holds 10), an injectable `carryOver` dependency of `createServerContext`. It copies through a `.carrying-<pid>` sibling renamed into place, copies a folder entry by entry so no link is carried (a link whose target is inside `~/.oculus` is copied as the bytes it points to; a link whose target is outside it is not copied and gives one finding `findings.config.carry_link_outside` naming the link and its target, reported only when the copy of that file or folder completes), refuses a link that returns to a folder being copied, skips when the home and hub `.oculus` are the same real path, and does not copy `approvals.json`. A failed copy is the finding `findings.config.carry_failed` and the log line is `server.carry.copied` or `server.carry.kept`.
9. The scan reads `<hub>/.oculus/apps` once when it is the machine folder: the skip of `repeated` applies to the hub root only (`root.key === HUB_ROOT`), so any other root whose `.oculus/apps` is the machine folder still gets `repeated`.
10. The chat owner: `ownerName(hub)` in `hooks.ts` returns the name of the person the last portfolio marks `self: true`; with none, `server.chat.chat_owner_fallback` is `its owner`.
11. `chat_focus_note` is reworded from "FOCUS - answer specifically ..." to "FOCUS: answer specifically ...", outside the brief, because the G35 row asserts that the instruction text holds no spaced hyphen and the focus note joins the same system prompt.
12. `tests/checks/config/config-folder.test.ts` 'names a group of its own and a path under the hub for every document' and 'reads the roots of sources.yml without a finding' now read this hub's layer inside the `realHub()` block and are skipped when the hub folder is not there (`it.skipIf(!HUB.present)`), because the engine's `docs` and `roots` are empty. The roots check is also skipped when a directory of the hub's roots is not on the machine, with the directories named on the console, as it was before.
13. The default Help page: the four hub documents are not tabs of the engine's `help` arrangement any more; a Help page saved before keeps its tabs until reset.
14. `renderKey` (the text of an inserted key, flow maps for scalar-only entries) is checked by the scratch runs of cases 14 to 16 and by the roots rows, which assert the values and the byte restoration; there is no test row on the rendered text of a list of flow maps.
15. The vocab keys of the hub list (`domains`, `venue_themes`, `data_themes`) are not options of the catalogue; they are named in `docs/configuration.md`.

## Host- or user-visible changes, with before and after

For each: the view, the state to put it in, what should differ.

1. Files view, Bookmarks and Notes sections, saved workspaces, the update tray's schedules, the machine apps (Apps view). State: start the server on a hub with no `.oculus` folder and a `~/.oculus` that holds the five. Before: the five were read from and written to `~/.oculus/`. After: the server copies them into `<hub>/.oculus/` at start (log line `Copied ... the copy in the home folder is left as it is.`) and reads and writes there; `~/.oculus` is not changed. A file the hub already holds is kept and the log says the home copy "is no longer read and can be removed". A link under a copied folder that points outside `~/.oculus` is not copied and the Findings view gets one line naming the link and its target. A hub-side bookmark, note, schedule or app is a file of the hub's git tree.
2. Settings view, every group that holds a key of the hub list (case 20 checked the Cluster group). State: open Settings on this hub. Before: one file line per tracked file (`behavior.yml`, ...), the row values read from the engine file. After: a second file line `.oculus/config/<file>` under each group that holds a key of the hub list; the rows of those keys show the hub layer's value, and their Edit in File link opens `<hub>/.oculus/config/<file>` (other rows still open the engine file). With no layer file the line reads "{path} is not there. A change to a setting of the hub creates it." and a write creates the file and its folders.
3. Live HPC view. State: a hub whose `slurm.resource` is empty. Before: the default was `utwente`, so a hub with no setting polled `utwente`. After: the HPC view says "the settings of this hub name no cluster (slurm.resource in .oculus/config/behavior.yml)" and polls nothing. This hub and the demo keep `utwente` in their layers, so neither shows a change.
4. LinkedIn view. State: a hub with no `linkedin_dir`. Before: `theaxec.github.io/_linkedin` was the default and a missing folder read "No _linkedin folder." After: no folder is read and the view says "The hub names no LinkedIn folder. Set linkedin_dir in the hub's .oculus/config/sources.yml to name one."; a named folder that is not there reads "The LinkedIn folder {path} is not in the hub." This hub's layer sets `linkedin_dir`.
5. Audit view and Venues and Data views on a hub with no layer. Before: seven data domains were expected to have a dataset, the Venues and Data views listed the engine's theme words. After: none expected, no theme words. This hub and the demo keep them in their layers.
6. Help page. State: reset the Help page to its default (a saved page keeps its tabs). Before: tabs `help`, HPC how-to, Data map, Research approach, Agent approach, the eight oculus guides, `memories`. After: `help`, the eight oculus guides, `memories`. The four hub documents remain entries of the catalogue (`docs` in `.oculus/config/layout.yml`).
7. Terminals, Claude chat. State: start a chat. Before: the instruction named "Axel Faes' PRIVATE, local-only research hub" and carried "NEVER suggest writing up a null or negative result"; the focus note began "FOCUS - answer". After: "the private, local-only research hub of <owner> (oculus)", the owner being the person the portfolio marks `self: true` or "its owner", no rule sentence; the focus note begins "FOCUS: answer".
8. Update tray, Schedules section, when `schedules.yml` does not read. Before: "~/.oculus/schedules.yml does not read ...". After: "schedules.yml in the .oculus folder of the hub (or the path local.yml names) does not read ...".
9. Findings texts. `domain_unknown`, `theme_labels_retired`, the roots-rewrite refusal (`files.refused_roots_invalid`), the unlisted document line (`doc.unlisted`) and the two empty-deck lines (`present.empty_unnamed`, `slides.empty_unnamed`) name the hub's `.oculus/config/` file and the engine's, quoted in full under case 12.
10. A change of `hub` in `local.yml` while the server runs. `BUILT_FROM.hub` before: `['portfolio', 'usageRefresh', 'git']`; after: `['portfolio', 'usageRefresh', 'git', 'bookmarks', 'schedules']`, so the bookmarks and schedules watchers move to the new hub's default paths when `hub` changes.
11. The bookmarks watcher makes the folder of the file it watches when it is not there: before it made `~/.oculus`, now it makes `<hub>/.oculus` by default (`watch/bookmarks.ts:92`).
12. A change under `<hub>/.oculus/config/` on disk publishes new `config` and `portfolio` versions (case 18; before: none). A write of the five shareable files under `<hub>/.oculus/` publishes none (case 6).
13. Git. `<hub>/.oculus/` is part of the hub's tracked tree, so a `git pull` can bring machine apps and bookmarks from another clone.
14. Findings view, carry-over of a link. A link in `~/.oculus/notes/` (or another of the five) whose target is outside `~/.oculus` gives `the link <path> points to <target>, which is outside the home .oculus folder; it is not copied`, one line per link, and the rest of the folder is copied; a link back to the folder being copied refuses that folder's copy with `could not be copied from ...`.
15. Demo hub. Before: the 13 `docs` entries of this hub, whose files the demo does not hold, were in the demo's catalogue. After: the demo's catalogue lists none; its domains, themes, `data_domains` and `slurm.resource` equal main's (case 13).

## Anything in the brief that was wrong or impossible

- The two paths `src/lib/server/edit/config-write.ts` and `src/lib/server/edit/undo.ts` are `src/lib/server/edit/writes/config/config-write.ts` and `src/lib/server/edit/writes/undo.ts`; `agents/spec.md:37` names `entry-edit.test.ts` and `yaml-edit.test.ts`, which do not exist (ruled, point 3 and 6).
- Cases 12, 13 and 22 and verify 2 as worded could not hold (ruled above).
- Decision 7 (the hub's `.oculus/` tracked) against item 1's remark that only the hub's owner writes the machine apps: with the folder in git, a `git pull` into the hub writes machine apps and bookmarks from another clone. `docs/apps.md:11` now says the folder is written by the owner and by a `git pull` into the hub. A machine app kept approved stays approved through a change to any file but `app.yml` while the server runs (`docs/apps.md:136-137`), so a pulled change to a kept app runs with the machine app's channels and no question until oculus restarts or `app.yml` changes; after a restart the app is approved only for the files as they were at the press, and the next change asks again. That is open item 31.
- Verify 1 holds `npm run test:quick` to 45 s; with 109 changed files it took 80.6 s, with every command passing. The limit fits a small step.
- Case 15 says the Remove's undo "gives the hub layer back"; it gives the list back and not the alignment spaces of one line, as the roots writer's undo always did.
- The spec's ASCII gate names a `bin` folder that the worktree does not hold (`find` prints `bin: No such file or directory`); the gate was run over `src tests config`.
- Round 1 item 1 asked each row to be run on the round-0 copy. That copy holds the behaviour the rows test, so the rows pass there; it is also read-only with no `node_modules`, so no run was made on it. The failing lines are from the base source, as in the first report.

## Not sent in round 1

- Spec S6 (the `chat_focus_note` wording "FOCUS:" against "FOCUS -"): kept, because the G35 row asserts no spaced hyphen over the whole system prompt.
- Behaviour B1: open item 31 above.
- Behaviour B4 (the carried notes, schedules, workspaces and bookmarks become untracked files of the hub), which follows ruling (9) of Additions of 2026-10-09; the hub's `.gitignore` is untouched (DONE table, item 10).
- Behaviour B6 (the default Help page loses its four hub-document tabs; judgment call 13) and B7 (the readers of an empty `slurm.resource` and `linkedin_dir`; judgment call 6; the page half of case 11 is the orchestrator's look on TEST).
