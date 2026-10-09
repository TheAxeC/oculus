# D50 review

D50 review (reviewer, `refute` rules, nothing changed). Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/D50, base 2ed26dc28.

## Verification lines (my runs, HOME=$TMPDIR/d50rev/home)

Verify 1, `npm run test:quick -- --base 2ed26dc28`:
- ok ASCII gate (0.7 s)
- ok prettier (2.3 s): All matched files use Prettier code style!
- ok svelte-kit sync (12.4 s)
- ok eslint (37.0 s)
- ok svelte-check (47.1 s): ... COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
- ok vitest (78.4 s)
- test:quick: 79.5 s (limit 45.0 s); every command passed
- test:quick: over the time limit

Verify 2, `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts tests/routes/edit/roots.test.ts tests/routes/sessions/terminal-actions.test.ts tests/checks/config tests/checks/source/keys.test.ts --testTimeout 0 --hookTimeout 0`:
- Test Files 1 failed | 8 passed (9)
- Tests 1 failed | 119 passed (120)
- The one failure: FAIL |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings, key "entries[2].status", "key entries[2].status is required". This is the failure that point 5 of D50-cases.md rules as passed.

Report's guarded-entries command, rerun in the same form:
- Test Files 1 failed | 76 passed (77)
- Tests 1 failed | 732 passed (733)
- Same single failure. This matches the report.

My own subset (tests/server/files, the fs route, apps, routes/apps, schedules, hpc, data/sources/config, server/root, routes/edit, state/system/config, changes.test):
- Test Files 39 passed (39)
- Tests 377 passed (377)

`npm run test:checks`:
- Test Files 1 failed | 16 passed (17)
- Tests 1 failed | 252 passed (253)
- Same single failure. This matches the report.

Other checks:
- comment-width test: Tests 2 passed (2)
- YAML parse of every changed or added yml: parsed 26, exit 0
- perl ASCII gate over src, tests and config (with --exclude=local.yml): no output, exit 0. `bin` does not exist ("ls: bin: No such file or directory").
- Non-ASCII grep over the hub and demo `.oculus/config`, the docs, the registries, DESIGN.md and HELP: exit 1, no hits.
- `sh utils/folder-check.sh`: exit 0.
- Sizes (`wc -l`): context.ts 868, config-checks.ts 526, portfolio.ts 730, merge.ts 457, rows.ts 363. All are under 880.
- unused-exports compared with the base: two lines differ. `roots.ts: ROOTS, rootsOf, dirAsWritten` became `rootsOf, dirAsWritten`. `files.ts: CACHE, resolveRootFile, engineRoot, withFixed` became `CACHE, resolveRootFile, rootsFile, engineRoot, withFixed`. This matches the report.
- `git diff 2ed26dc28 --stat`: 109 files changed, 3403 insertions(+), 2050 deletions(-).
- `git status --short`: 114 entries. The untracked ones are `.oculus/`, `D50-report.md`, `tools/oculus/demo/.oculus/`, `carry-over.ts` and `hub-layer.ts`. `find .oculus tools/oculus/demo/.oculus` lists config files only, so my runs left nothing behind.
- `find tools/oculus -name adr -type d`: no output, exit 0. No ADR folder exists.

Failing first. I ran this on a scratch copy at $TMPDIR/d50rev/baserun: the base source with the final tests.
- 7 new or changed tests fail with the assertions the report quotes:
  - routes config-key: "expected { Object (at, kind, ...) } to match object { kind: 'config-key', ...(2) }"
  - roots: "expected 500 to be 200"
  - both terminal-actions tests
  - server config-key: "expected '# ===...' to be '# ===...'"
  - settings: "expected { ...(2) } to match object { value: { resource: '' }, ...(1) }"
  - manifest: "expected [ [ 'app:notes' ], [ 'apps[hub/]' ] ] to deeply equal [ [ 'app:notes' ], [] ]"
- The new config.test.ts rows: 5 fail ("expected 'utwente' to be 'other'" and similar).
- All of this matches the report.

## Verdicts, items of "What to build"

1. Holds. `loadConfig(engine, {hub, instead})` and `mergeHub` are limited to `HUB_LIST` per dotted path.
2. Holds. The carry-over runs once per start, after `load()` and before the watchers (context.ts). See B2, B3 and B4.
3. Holds. The defaults take the hub, and `machineFolder` defaults to `<hub>/.oculus/apps`.
4. Holds, except for one stale sentence in the hub layer's layout.yml (S5).
5. Holds. The empty values give no cluster, no LinkedIn feed and an empty venue/audit.
6. Holds in behaviour. Hub-layer writes and their undo work, including the creation of the file and its key. The test form is in S2 and the comment width in S3.
7. Holds. The Settings hub row (`hub-layer.ts`, `ConfigRow.hub`) and `workbench.settings_layer_absent`.
8. Violated in part. Sentences the change makes false remain in docs/DATA-MAP.md:222 and :312, tools/oculus/DESIGN.md:270 and .oculus/config/layout.yml:7 (S5).
9. Holds (sizes and folder-check above).
10. Holds. The chat instruction names the owner through `ownerName(hub)`, with "its owner" as the fallback.

## Verdicts, cases

- 1 to 11, 13, 16, 18, 19, 21: met by reading the code and the report. The report's runs used scripts in the builder's $TMPDIR, so I could not rerun them; for those runs these cases are not verifiable by me.
- 12: met. The integrity output was reproduced; it differs only by the ruled `entries[2].status`.
- 14: partial. The behaviour is met and fails first as quoted. The test is a new describe with new titles, not a row (S2).
- 15: partial. Same reason as 14 (S2). The roots undo is not byte-for-byte on spacing, but the base had the same behaviour.
- 17: not verifiable. It needs a look at the page.
- 20: not verifiable for the page half; the report's scratch run was not rerun.
- 22: met under point 5 of D50-cases.md.

## Spec

S1. The builder ran a git command. The report says at line 3 that it ran `git status`. spec.md says the builder never runs a git command.

S2. Cases 14 and 15 got new tests where the brief asked for rows, and none of the new tests is named in guarded.md.
- Where:
  - tests/server/edit/config-key.test.ts: new describe 'a key of the hub list written to the hub layer', with 2 its.
  - tests/routes/edit/config-key.test.ts: new describe 'taking a setting of the hub layer back'.
  - tests/routes/edit/roots.test.ts: new describe 'the roots write in the hub layer', with 2 its.
  - tests/routes/sessions/terminal-actions.test.ts: new it 'names the owner the portfolio marks in the instruction'.
  - The settings test: new describe 'slurmSettings with no cluster', a second test of a unit that already has one.
- Why it is wrong:
  - D50.md case 14 asks for "rows in G8's tests/server/edit/config-key.test.ts and G9's tests/routes/edit/config-key.test.ts", and case 15 for "a row in tests/routes/edit/roots.test.ts".
  - spec.md allows one test per unit, written as a table, named in guarded.md by file and title, and no other test.
- Failure scenario: guarded.md names titles these tests do not carry, so the entries' test lists no longer describe what guards G8, G9 and G35. The next step that edits those units finds more than one test per unit.
- The manifest.test.ts addition is a proper row.

S3. Two edited comments were not rewrapped as whole paragraphs at 100 columns.
- src/lib/server/edit/writes/config/roots.ts:10 (74 columns) ends mid-sentence: "// out again (config-checks.ts `takeOutAdded`). The edit is over the bytes".
- src/lib/state/system/config/groups.ts:13 (72 columns): "// the sentence that a change creates it. The rows of such a file are in", followed by "// no heading. ...".
- The comment-width test passes because it checks only the upper limit.

S4. An export is now unused. src/lib/server/files/files.ts:242 has `export function rootsFile(engine: string): string`. Its only use in src is files.ts:264; the other users are tests (config.test.ts:188, config-folder.test.ts:360/369). spec.md says such an export is removed or made local, but the report keeps it "for tests". The unused-exports line above shows it as new.

S5. Sentences the change makes false (item 8):
- .oculus/config/layout.yml:7: "`group` is a key of `nav_groups` above". This hub-layer file has no `nav_groups`; it lives in the engine's file.
- docs/DATA-MAP.md:312: "| `tools/oculus/config/layout.yml` | `docs` | list | hub documents | ...". The documents now come from `.oculus/config/layout.yml`, and the engine's list is empty.
- docs/DATA-MAP.md:222: "| Settings | System | the configuration files of `tools/oculus/config/` |". Settings now also shows the hub-layer files.
- tools/oculus/DESIGN.md:270: "a folder of this machine ... A root app is written by whoever writes to its root, a `git pull` included, so it reaches less than a machine app". The machine folder is now the git-tracked `<hub>/.oculus/apps`, which a `git pull` also writes (docs/apps.md:11 now says so). The rationale DESIGN gives for the difference in reach no longer holds as written.
- tests/checks/config/config-folder.test.ts:356-358: "The two roots of sources.yml sit under the home directory of whoever runs this". The engine's sources.yml now has `roots: []` (config/sources.yml:77).
- src/lib/server/files/fs/notes.ts:6, minor: "it never leaves it [this machine]". The notes now sit in the git-tracked hub folder and leave with a push.
- docs/configuration.md, "The hub's own folder" section: "a saved workspace does, as before". "As before" is history wording in a doc.

S6. The `chat_focus_note` wording changed from "FOCUS -" to "FOCUS:". The brief does not ask for this. The report states it as judgment call 11. Minor.

## Proof

P1. No check reads this hub's roots any more.
- Where: tests/checks/config/config-folder.test.ts:360-371.
- Hunk: `const ROOTS = readRoots(loadConfig(engineDir()).config, rootsFile(engineDir())).roots;` ... `it.skipIf(MISSING.length > 0)('reads the roots of sources.yml without a finding', ...)`
- What is wrong: the test still reads the engine's `roots`, which is now `[]`, so it passes over an empty list. This hub's six roots are now in .oculus/config/sources.yml:81, and nothing checks them. The docs-list check was moved to the hub layer; the roots check was not.
- Failure scenario: a broken or missing root in the hub layer passes the check suite.

P2. A new reader of the real hub sits outside the scope of point 3 of D50-cases.md.
- Where: the docs-list test 'names a group of its own and a path under the hub for every document' in config-folder.test.ts.
- What is wrong: it now reads the real hub through `it.skipIf(!HUB.present)`, with `HUB` hoisted to the top of the describe. Point 3 names the `realHub()` block of that file, not the whole file. The report counts this test under "the same file".
- Failure scenario: on a checkout with a hub present, this test depends on the hub's content outside the named real-hub block. Moderate.

P3. A statement in the report is false for one case. The report says "A pulled app has no approval until the reader approves it". docs/apps.md:136-137 says that a machine app kept approved stays approved through a change to any file except `app.yml`, for as long as the server process runs. A pulled change to a kept machine app's scripts is therefore run without a question.

## Standards

S1 to S6 above cover the standards points: the git rule, the test form, the comment width, the unused export and the stale sentences. No other findings.

## Behaviour

B1. Rule clash, to raise with the orchestrator or Axel.
- The clash:
  - Ruling Z753(a) makes the hub's `.oculus/` tracked by git, with machine apps in `<hub>/.oculus/apps`.
  - Open item 25(a) gives machine apps every channel on the premise that "only the hub's owner writes" their folder.
  - docs/apps.md:11 now states that a `git pull` into the hub writes it as well.
- Failure scenario:
  1. A collaborator commits a change to a machine app's JS.
  2. Axel pulls while the app is kept approved.
  3. The frame reloads and runs the new code with every channel (inbox, calendar, sessions, usage), with no question asked (apps.md:136).
- After a restart, the hash check asks again. The window is the running session.
- The step built what both rulings say. The two rulings disagree, so this is not a defect of the build.

B2. The home copies stay, so the log line repeats on every start. After the first carry-over, every start logs `server.carry.kept` ("... is not read") for each of the five files that exist in `~/.oculus`, for as long as they stay there. The brief allows this, but it means a permanent line on every start until the reader deletes the home copies, and nothing tells them to.

B3. The carry-over copies the targets of links into a git-tracked folder.
- `carryOver` follows links. A link in `~/.oculus/notes` or `~/.oculus/apps` to a file or tree outside is copied as bytes into `<hub>/.oculus/`, which git tracks. This includes a secret or a large tree.
- Z753(f) rules that links are followed, but the brief does not name the git exposure.
- The notes reader refuses links, while the carry-over copies their targets.
- Failure scenario: a linked secret becomes an untracked file in the hub and is committed by the next `git add` of that folder.

B4. Personal files become untracked files of the hub after the first start.
- The files: the carried notes, schedules (a 0600 file naming this machine's prompts and folders), workspaces (absolute paths of this machine) and bookmarks.
- The report says "a hub-side bookmark... is a file of the hub's git tree", but shows no `git status` before and after. I did not start the app, so the exact listing is not verified.
- The hub has no `.gitignore` line for these files.
- This follows decision 7, but whether schedules and workspaces belong in the shared tree is a user-visible shape the step makes, and no one has ruled on it explicitly.

B5. A change of `hub` while oculus runs does not carry over for the new hub. The carry-over runs once per start (item 2), so this is consistent with the brief. It is not stated in the docs.

B6. The default Help page loses its four hub-document tabs. A saved page keeps them. The report states this.

B7. Readers of empty values.
- HPC with `resource: ''` and LinkedIn with an empty `linkedin_dir` read as "no cluster" and "no feed" in code.
- The `no_folder` LinkedIn text changed meaning and now takes `{0}`. Its callers pass it; nothing is missing in code.
- The page half of case 11 needs a look at the page, which I did not do.

## Declined to judge

- `npm run diagrams`: not run, because it writes into the worktree. The `tests/checks/diagrams` check inside `test:checks` passed.
- The builder's scratch scripts for cases 1-11, 13, 16, 18-21: not rerun, because they live in the builder's $TMPDIR. I judged those cases by reading the code.
- The page looks for cases 11, 17 and 20: not judged, because starting the app is outside my brief.
- Two git commands outside the two named forms, both read-only, neither changing anything:
  - `git -C <worktree> diff 2ed26dc28 --stat -- docs/DATA-MAP.md`, run from outside the worktree.
  - `git -C .../D50-base status` with errors suppressed, run while building the scratch copy.

## Usage

Agent id not visible to me; model claude-opus-5-5; about 375k tokens; about 62 tool uses; minutes not visible.
