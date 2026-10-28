# O98 refuter report

O98 refuter report (accounts and connections), worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O98, base 54304adb4. I changed nothing.

1. VERIFICATION LINES (verbatim)

Verify 1: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base 54304adb4` (9:06 wall, exit 1). Full output: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o98-review-quick.txt
  test:quick: 209 changed file(s), from git since 54304adb4
  ok      svelte-kit sync (4.7 s)
  ok      prettier (4.7 s): All matched files use Prettier code style!
  ok      ASCII gate (5.6 s)
  ok      eslint (6.7 s)
  ok      svelte-check (38.8 s): 1793169265706 COMPLETED 558 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest checks (250.9 s): Duration  236.05s ...
  FAILED  vitest (285.6 s)
    tests/data/snapshot/rename.test.ts > the rename of a hub key > edits 'a plain and a double-quoted reference<U+2026>' : Error: Test timed out in 5000ms.
    tests/routes/apps/app-files.test.ts > ... > an encoded climb to the folder of a sibling : Error: Test timed out in 5000ms.
    tests/server/core/credentials.test.ts > ... > sets no helper when a path holds a single quote, and says so on sign_in (G135) : Error: Test timed out in 5000ms.
    tests/server/root/watch/settings-watch.test.ts > ... > reads the workspaces again for an event at the root's settings file only : Error: Test timed out in 5000ms.
    Test Files  4 failed | 258 passed | 72 skipped (334)
    Tests  4 failed | 3208 passed | 862 skipped (4074)
  ok      vitest slow (541.0 s): Duration  530.29s ...
  test:quick: 545.8 s; failed: vitest
The four timed-out files, each run alone with `npx vitest run <file>`: rename.test 31 passed; app-files.test 27 passed; credentials.test 13 passed (the single-quote test took 529ms alone); settings-watch.test 1 passed. The four are timeouts under load. credentials.test is new in this step and starts a real node process (see Standards S1), which is why it times out in the unit tier. The builder's red slow-tier test G32 hub-portfolio passed in my slow tier above; alone it gives "Tests 1 passed | 15 skipped (16)".
Named under Declined: `npm run diagrams` and `npm run docs:palette` (both write files).

Verify 2 (ASCII perl gate over the 208 changed files): no output, exit 0.

Verify 3 (unused-exports diff): removals only:
  - src/lib/data/accounts/connect.ts: PROVIDERS, CALENDAR_PROVIDERS
  + src/lib/data/accounts/connect.ts: CALENDAR_PROVIDERS
  - src/lib/server/root/watch/git.ts: THROTTLE, IGNORED, relevant, rootsOf, subrepositories
  + src/lib/server/root/watch/git.ts: THROTTLE, rootsOf

Verify 4a (hpc_host grep) prints three lines, so it is red:
  tests/data/sources/config/local/local.test.ts:305:    it('reads hpc_host as a key it does not know, and nothing reads it (G13)', () => {
  tests/data/sources/config/local/local.test.ts:306:        const read = readLocalText('hpc_host: x\n', hub);
  tests/data/sources/config/local/local.test.ts:307:        expect(read.unknown).toEqual(['hpc_host']);

Verify 4b (address grep) prints:
  src/lib/server/accounts/connect/credential-helper.mjs:44:    const origin = `https://${host}`;
  src/lib/server/accounts/connect/git/signins.ts:3: (a comment)
  src/lib/server/accounts/connect/git/signins.ts:169:        if (started.verificationUri.startsWith('https://')) {
None of these is an address; 4b holds.

Verify 6 (sizes): no source file over 880 lines and no component over 520. The largest are context.ts 877, settings.test 878, git-write 865, sessions 860, model/index 858; Source.svelte is exactly 520. `sh utils/folder-check.sh` exits 0.

Verify 7 (history words in added comment lines and test titles): "before" appears only as order and "still older" at model-hpc.ts:89. Neither is history.

Reruns of the evidence commands the report quotes, each with `npx vitest run`, all pass: local/machine/machine-answer/machine-section 56; the two config-key files 50; store 4; signins 12; git routes 5; askpass 2; put-key 10; keys 13; setup 8; cluster-row 8; connection-keys 15; connection-args 2; oauth 4; hpc.test 3; actions 3; submit 30; referrers 15; settings.test 91; config.test 41; recover.test 15; runs.test 16.

2. ITEM VERDICTS (the brief's 22 "What to build" items)

1 holds. 2 violated in part: the hpc_host test stays at local.test.ts:305-309, Verify 4a red. 3 holds. 4 holds. 5 holds. 6 holds. 7 holds by reading; the look is at landing. 8 holds. 9 holds. 10 holds. 11 holds in behaviour, but the move of the Recover job records and stage folders is not reported (Behaviour B4, Spec P1). 12 holds. 13 holds. 14 holds. 15 holds. 16 partial: a key-only cluster cannot show its public key without a typed password (B3), and a `BatchMode yes` in the reader's ssh config stops Put the key (B2). 17 holds. 18 holds, except that sign-out is refused once the row or its credential_address is gone (B1). 19 violated: the token is handed to git from the saved files whatever `sign_in` holds, against "for each git host row with a saved token" and G135 (B1). 20 violated in part: HELP says the template has a microsoft row of sign_in and docs/templates.md has none (S4); HELP does not mention the Recover path move. 21 holds. 22 holds as text, with Standards S1 against the placement of three of its tests.

3. CASE VERDICTS (25 cases)

Met: 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25.
4 met at unit level for the counts; the pill and badge only by reading. A look on 8790 at landing would settle the view.
9 partial: met in behaviour (hpc_host is read as unknown and nothing reads it), but it was made a kept test, against item 2. It is not one of item 22's G13 rows, so it should have been a quoted case run.
22 partial: met in code and unit tests; the view part needs the look at landing.
Case 6 "no ssh runs" holds by reading poll.ts: a host of '' publishes unreachable without calling the runner. The case-run after.test.ts filters `s.host !== ''`.

4. FINDINGS

Spec
P1. A path under ~/.oculus changes with no migration note, no report line and no HELP line. src/lib/server/machine/runs/recover/cluster.ts:187-198 and 330-331:
    return join(recoverFiles(home, hub, '').dir, 'clusters');
    ...
    return join(jobFolder(home, place.hub, resource), `${place.key}.job.json`);
    ...
    return join(jobFolder(deps.home, place.hub, deps.resource), `${place.key}.stage`);
At the base (`git show 54304adb4:src/lib/server/machine/runs/recover/cluster.ts`) these were `<dir>/<key>.job.json` (line 176), a `cluster` stage (258) and a `jobs` stage (420). live/watch.ts:334-335 `resume()` reads only the new layout. Under spec, a key or path of a saved record under ~/.oculus is a user-visible shape, so this is a silent design decision. Its effect is B4. A grep for "job.json", ".stage" and "clusters/<" over the report and docs finds nothing.
P2. A design choice was made and not reported. src/lib/server/accounts/connect/git/store.ts:7-8: "so that the token is handed to git for the origin it was granted for and no other, whatever the row says later". The report does not say that removing a `sign_in` row leaves the token in use. That decision is Axel's, and it contradicts item 19 (B1).
P3. Verify 4a is red, from local.test.ts:305-309 (quoted above). The test also repeats the existing table at local.test.ts:92 ('takes a %s key as a key it does not know...').
P4. The report says the builder ran one read-only `git ls-files --others --exclude-standard`. spec.md allows only status, diff and show. The command was read-only and the report says so.
P5. The collision of a cluster key `mac` with this Mac is not stated, as spec.md:72 requires for a key a step introduces. Recover.svelte:67-72 drops a resource named `mac` from the pick ("`mac` is not offered, since that key names this Mac."), and routes.ts:108/246 always reads 'mac' as this Mac. A clusters row with resource `mac` is accepted by local.ts and by slurm.resource with no problem raised, so that cluster cannot be picked in Recover and says nothing about why.
P6. The case-run leftovers are still on disk, against "is gone before the report": temporary folders under tmpdir (ssh.log; o98-case21-*, o98-case22-* with known_hosts) and scratchpad outputs (after-cases.txt, hub-text-out.txt). I did not remove them, since I change nothing.

Proof
R1. Several parts spec.md requires are missing from the report: the history-word grep quoted with each hit judged (the report cites history.test instead); the list of head comments and docs marked "still true" or "rewritten"; the name-change grep quoted; the reuse grep run before a new helper; and a before/after table of every edited existing assertion and allow list. For example, the config-folder.test allow list gained clusters, connections, sign_in and recover with no line in the report.
R2. The file table is partial: it gives only the largest files and no line count for each changed file.
R3. caserun/probe.mts, an O98 program that prints `slurmSettings({slurm:{resource:['utwente']}})`, is not quoted, as spec.md:65 requires. Whether it ran is not verified. first.mts case probes 18-23 grep source text, so they count only as a first reading, not as a run.

Standards
S1. Three new tests start real processes in the unit tier and none is tagged slow, against spec's rule that such a test is tagged slow: tests/server/core/credentials.test.ts (spawnSync of node, lines 9 and 39), tests/server/machine/hpc/clusters/askpass.test.ts (execFile, line 20), tests/server/machine/hpc/clusters/put-key.test.ts (spawnSync('/bin/sh'), line 42). This is why credentials.test timed out in Verify 1: when the unit tier runs under load, this test turns the unit gate red.
S2. src/lib/state/workbench/navigation/status.ts:125-126 has two doc comments stacked over one type:
    /** The HPC poll's state in the bar's own few words, and in the queue's whole sentence. */
    /** The HPC item's label, its tooltip's lines, and whether it is in the warning tone. */
    export type HpcWords = { short: string; long: string; warning: boolean };
The first is stale. A reader cannot tell which one describes the type, and tooling picks the second.
S3. src/lib/state/system/machine/hpc/hpc.ts:86 `export function failed` has no doc comment, against the coding standard for exported functions.
S4. docs/templates.md: the sign_in example has google and github rows and no microsoft row. HELP's sentence "the google and microsoft rows of sign_in ... (its template has them)" is false about microsoft. A reader who looks for the microsoft row in the template does not find it.
S5. src/lib/data/sources/config/local.ts adds literal English problem words (`USER_WORDS`, `KEY_FILE_WORDS`, `${at}.resource repeats the resource of an earlier row`), and machine.ts adds a literal clusters-repeat sentence. This follows the file's existing `wrong()` pattern, but these are strings a reader sees, and spec says user-facing strings come from catalogs.

Behaviour
B1. The git token stays in use after its `sign_in` row or its credential_address is removed, and it can then no longer be signed out. src/lib/server/core/git/credentials.ts:100-112 builds the helper pairs from every file in ~/.oculus/connect that holds a token and a credential_address, and never reads `sign_in`:
        if (!isMap(parsed) || textField(parsed, 'token') === undefined) continue;
        const address = textField(parsed, 'credential_address');
        if (address !== undefined && FORM_PATTERNS.https_origin.test(address)) {
            addresses.push(address);
credential-helper.mjs answers from any file whose credential_address equals the origin. Meanwhile src/lib/server/accounts/connect/git/routes.ts:149-152 refuses every action, sign_out included (178-180), for a key whose row has no credentialAddress:
    const row = section.rows.find((one) => one.key === key);
    if (row?.credentialAddress === undefined) {
        return refused(words(section.text, 'accounts.git_no_host', key));
    }
and lines 105-107 list only rows with a credentialAddress, so the host is not drawn. Failure scenario: Axel removes the github row from sign_in to stop oculus using his GitHub token. Every git start still gets `-c credential.https://github.com.helper=...`, so pushes keep authenticating with the old token. Account setup no longer shows the host, and a sign_out request is refused with accounts.git_no_host. The only way out is to delete the file under ~/.oculus/connect by hand.
B2. A `BatchMode yes` in the reader's ssh config stops Put the key. src/lib/server/machine/hpc/clusters/put-key.ts:27-42 (PUT_OPTIONS, quoted above) sets no `-o BatchMode=no`. A command-line `-o` overrides ssh_config only for the options it names, so `Host *` / `BatchMode yes` stays in force. ssh then never runs SSH_ASKPASS, `asked()` stays 0, and the refusal lists password among the methods. `offersNoPassword` is therefore false, and the result is `{failed: <first line>}`. Failure scenario: a reader with `BatchMode yes` (common for scripted cluster access) types the right password and gets "Permission denied (publickey,password,keyboard-interactive)", with no hint that the config caused it. The fix is one more `-o BatchMode=no` in PUT_OPTIONS.
B3. A key-only cluster cannot show its public key without a typed password. ClusterSteps.svelte:199 `disabled={running !== '' || password === ''}` blocks the Put button on an empty password, and lines 204-205 show the public key only from put_key's noPassword answer. setup.ts:263-298 (putKeyAnswer) returns the public key only after the ssh has run. Failure scenario: on a cluster that accepts only keys (keys installed through a web portal), the reader has to type a dummy password and wait for an ssh refusal to see the key to paste. Nothing on the page says so.
B4. A Recover cluster job started before this step disappears from the view, and a second job can be started for the same entry. This follows from P1: resume() looks only under `<dir>/clusters/<resource>/<key>.job.json`, so an existing `<dir>/<key>.job.json` and its `cluster`/`jobs` stage folders are never read. Failure scenario: a long Recover job is queued on utwente when the step lands. After restart the entry shows no job, Recover offers the cluster again, and a second submit duplicates the cluster work. The old job's output is never fetched or unpacked, and its stage folder stays on disk.
B5. The rows of `connections.failures` are shared by the ssh poll (clusters/connections.ts:166-176) and git fetch failures (core/git/state.ts:154-160, `fetchFailureOf`: "the line the first row of the hub's `connections.failures` matches, with that row's kind and fix"). The row matching "Permission denied (publickey)" carries the fix "Put the key on the cluster in Account setup". Failure scenario: a git fetch over ssh to GitHub fails with "Permission denied (publickey)", and RepoItems.svelte shows the fix "Put the key on the cluster in Account setup", which points at the wrong service. Either the rows need a scope (ssh to a cluster vs git), or the fix text must not name the cluster. Which one is a hub-text shape for the orchestrator. The addresses in the hub text match the base code; I checked oauth.ts:120-143, calendar/google.ts:20, calendar/microsoft.ts:23, mail/google.ts:28,69, mail/microsoft.ts:38 and cluster.ts:308 with `git show 54304adb4:<path>`.

Confirmed without finding: submit.ts `submitChoices` picks the one compute: match, and a plan naming an unknown key is refused 'unknown-cluster'. Cancel and log carry the resource; ClusterLogPaths is keyed per cluster through logPathsOf. fetchFailure is kept through git-routes.ts `keepFetchOutcome` and autofetch, and a fetch, pull or sync that succeeds clears it. The device flow handles slow_down +5000ms, access_denied, expired and the cancel guards, and opens only https addresses. The askpass socket and script are 0700/0600, with SSH_ASKPASS_REQUIRE=force. hostKnown uses `ssh-keygen -F <name> -f ~/.ssh/known_hosts`, and trustHost re-scans and compares fingerprints. Make key uses the argument vector `-N ''` and keeps an existing file as it is. writeClusterRow writes the row alone, re-parses, reads back and writes at mode 0o600. Judgment calls 1 (recover.node_download made a primary-only HUB_LIST key) and 2 (slurm.resource set in a second hub becomes a finding) are reported and agree with the step line and Verify 4b. hub-names has 57 HUB_LIST rows (52 at the base), and PRIMARY_CONNECTION_KEYS lists six keys (hub-keys.ts:60-67). The builder is right about G8 at guarded.md:70: inserting the ruled words after "the one key `self`" gives "of the primary hub's" twice. Leaving that wording to the orchestrator is right, since the words are dictated. docs/adr does not exist (`ls docs/adr`: No such file or directory).

5. DECLINED TO JUDGE
- `npm run diagrams` and `npm run docs:palette`: both write files.
- Reruns of the case-run programs (caserun/first.mts, first-b.mts, probe.mts, bin/ssh, o98-caserun/case.config.mts, tests/after.test.ts, tests/hubtext.test.ts): they write to tmpdir and the scratchpad. caserun/ also holds O96's programs, which belong to another step.
- Whether d0688259b (Axel's data-map lines on hpc_host, "Twelve" and "resolves in the primary") is on main after 54304adb4: settled by `git log --oneline 54304adb4..main -- docs/data-map.md`, which is outside the allowed commands. At the base, docs/data-map.md has none of those lines.
- Whether the credential helper runs under Electron from a packaged app (asar path in execPath): settled by a packaged build and a git push from it.
- The view looks (Account setup cluster and git sections, the HPC pill and badge, Recover's cluster pick): settled by the look on 8790 at landing, which I may not touch.
- Whether the UT cluster offers password login at all, which decides whether Put the key works there: settled by an ssh to the cluster, which I may not open.

Usage: a7bc5df274463e2fa, claude-opus-5-5, 85779 tokens, 90 tool uses, 25 min 29 s.

## Repair round 1, refuted

Step O98, worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O98, base 54304adb4, round snapshot /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O98-round-1. I changed nothing and wrote no file.

The round's delta: 40 paths of `files.txt` differ from the snapshot (not counting `docs/diagrams`, which `npm run diagrams` rewrote). Two paths are new since the round was sent: `tests/server/machine/hpc/clusters/failure-rows.test.ts` and `tests/views/personal/account-setup/cluster-steps.test.ts`.

```
Verify 1: PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base 54304adb4   (09:17:02 to 09:25:14)
test:quick: 212 changed file(s), from git since 54304adb4
test:quick: 352 test file(s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.3 s)
ok      eslint (11.9 s)
ok      svelte-check (36.8 s): 1793175463014 COMPLETED 558 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest checks (272.6 s)
 FAIL  |unit| tests/checks/tree/boundaries.test.ts > layer boundaries > holds no process-wide state under src
AssertionError: expected [ Array(1) ] to deeply equal []
 Test Files  1 failed | 15 passed (16)
      Tests  1 failed | 307 passed | 9 skipped (317)
FAILED  vitest (326.2 s)
 FAIL  tests/routes/files/file-undo.test.ts > ... writes a 1 KB file back with its text: Test timed out in 5000ms.
 FAIL  tests/routes/hubs/hub-routing.test.ts > ...: Test timed out in 5000ms.
 FAIL  tests/routes/hubs/hub-secrets.test.ts > ... (G3): Test timed out in 5000ms.
 FAIL  tests/routes/hubs/make.test.ts > ... (G9): Test timed out in 5000ms.
 FAIL  tests/routes/hubs/make.test.ts > ... (G32): Test timed out in 5000ms.
 FAIL  tests/data/hubs/workspace-projects.test.ts > ...: Test timed out in 5000ms.
 FAIL  tests/server/machine/apps/manifest/manifest-tools.test.ts > ...: Test timed out in 5000ms.
 Test Files  6 failed | 255 passed | 75 skipped (336)
      Tests  7 failed | 3194 passed | 894 skipped (4095)
FAILED  vitest slow (488.1 s)
 FAIL  tests/data/hubs/hub-portfolio.test.ts > ... (G32): Test timed out in 20000ms.
 FAIL  tests/data/hubs/hub-portfolio.test.ts > ... (C6): Test timed out in 20000ms.
 Test Files  1 failed | 93 passed (94)
      Tests  2 failed | 892 passed | 313 skipped (1207)
test:quick: 491.5 s; failed: vitest checks, vitest, vitest slow
npx vitest run tests/checks/tree/boundaries.test.ts:
 +   "lib/server/core/git/credentials.ts holds module-level state in heldRows",
 Test Files  1 failed (1) / Tests  1 failed | 10 passed (11)
The timed-out files, each alone with npx vitest run <file> --reporter=dot:
 file-undo 8 passed; hub-routing 7 passed; hub-secrets 10 passed; make 35 passed; workspace-projects 5 passed; manifest-tools 15 passed; hub-portfolio 16 passed
 (tasks.test.ts, which the builder could not run alone, passed inside my slow tier: it is not among the failures.)

Verify 2 (perl ASCII gate over the 211 changed files that exist): no output, exit 0.
Verify 3 (comm against .agents/worktrees/O98-base/unused-exports.txt):
 added:   src/lib/data/accounts/connect.ts: CALENDAR_PROVIDERS ; src/lib/server/root/watch/git.ts: THROTTLE, rootsOf
 removed: src/lib/data/accounts/connect.ts: PROVIDERS, CALENDAR_PROVIDERS ; src/lib/server/root/watch/git.ts: THROTTLE, IGNORED, relevant, rootsOf, subrepositories
 (only removals: the two "added" lines are shortened forms of the removed ones)
Verify 4a: grep -rn "hpc_host\|hpcHost" src tests config docs --exclude=local.yml: no output, exit 1.
Verify 4b: two lines, neither an address:
 src/lib/server/accounts/connect/credential-helper.mjs:47:    const origin = `https://${host}`;
 src/lib/server/accounts/connect/git/signins.ts:169:        if (started.verificationUri.startsWith('https://')) {
Verify 6: sh utils/folder-check.sh exit 0; the round's files are within 880/520 (model/index.ts 860, Source.svelte 520, per the builder's table; not re-counted file by file).
Verify 7: grep of the round's added comment lines and test titles for the history words: 13 hits ("earlier row", "was granted for", "before its subcommand", "before the helper ... starts", "before any password"), each about order or run-time tense. None is history.

The evidence the round's report quotes, rerun:
 credentials.test + git/routes.test: Test Files 2 passed (2), Tests 29 passed (29)
 the same + local/machine.test + cluster-steps.test + clusters/setup.test: Test Files 5 passed (5), Tests 53 passed (53)
 put-key.test: Tests 10 passed (10)
 clusters/setup.test + cluster-steps.test: Test Files 2 passed (2), Tests 12 passed (12)
 connection-keys.test + failure-rows.test: Test Files 2 passed (2), Tests 20 passed (20)
 askpass.test: Tests 2 passed (2)
 app-setting.test alone: Test Files 1 passed (1), Tests 12 passed (12)
 local.test + machine.test + routes/machine/recover.test + recover/runs.test + recover/safety.test: Test Files 5 passed (5), Tests 126 passed (126) (the report's "8 files, 190 tests" set does not name its files)
 grep -n "module-tag" over the three files:
  put-key.test.ts:8:// @module-tag slow: the cases of the remote command start sh.
  credentials.test.ts:10:// @module-tag slow: every case of the helper starts node.
  askpass.test.ts:7:// @module-tag slow: every case starts the helper's program, which starts node.
 Names grep (grep -rn --exclude=local.yml -F <name> src tests docs config | wc -l): every count the report gives reproduces (hpcRouteHost 0 ... MAC_TARGET 11, CLUSTERS_ONCE_WORDS 3, publicKeyOf 5, cluster_public_key 4).
 P6 leftovers: ls of every path under "Removed": No such file or directory for each; no $TMPDIR/o98-case* or caserun-* remains.
 S4: docs/templates.md:173-180 holds the microsoft row, with the same addresses as the Hub text's microsoft row.
My own runs (node --input-type=module -e, nothing written):
 case 9: readLocalText('hpc_host: x\n', ...) -> unknown ["hpc_host"], config holds x: false
 mac row: clusters [{resource: mac},{resource: b}] -> [{"resource":"b","user":"me"}] with problem "clusters[0].resource must be the key of a cluster other than mac, which names this Mac"
 slurmSettings with resource [mac, utwente] -> ["mac","utwente"] []
 failureRows for: [] -> row read with "for":[] ; for: [mail] -> [] ; no for -> ["cluster","git"] ; for: 'git' -> ["git"] ; [git, git] -> ["git"]
```

### Verdicts

Items of the brief's "What to build", over the whole diff since the base. Items the round did not touch rest on the tests my Verify 1 ran green and on the first review's reading; I did not re-read them this round.

- 1: holds. The settings.test and config.test rows pass in Verify 1. My `slurmSettings` run gives the list.
- 2: holds. Verify 4a prints nothing, and case 9 is met by my run.
- 3: holds. The local.test set passes (126). My run shows a `mac` row is refused with its problem.
- 4, 5, 6, 8, 9, 10, 13, 14, 15, 17: hold. Their tests pass in Verify 1. For item 5, put-key.ts now passes `-o BatchMode=no` (put-key.test, 10 passed).
- 7: holds by reading; the look at landing settles the view.
- 11: holds. The new layout is stated under "Visible changes" and `docs/HELP.md:324`, and the Data move is given. No code reads the old layout (the cluster.ts diff).
- 12: holds, with Spec 1 (an empty `for`).
- 16: holds. B2 is closed in put-key.ts. B3 is closed in setup.ts and ClusterSteps.svelte (12 passed).
- 18: holds. An unlisted key is listed with its Sign out, and Sign out deletes its file (git/routes.test).
- 19: violated (Behaviour 1). The red boundaries check comes from the same binding.
- 20: partial. `docs/HELP.md:514` says "Every git oculus starts is given ..." and "every terminal oculus opens is given the same pairs". While Behaviour 1 stands, that is false for every git and terminal started by a route. The rest of the documents say the new shapes.
- 21: holds. The Hub text has the `for` rows and the new "Git key refused" row. The first review checked the addresses against the base.
- 22: partial (Standards 2).

Cases:

- 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 18, 21, 23, 24, 25: met. Their tests pass in Verify 1, as the first review read them.
- 4: met at unit level for the counts. The pill and the badge are settled by the look.
- 9: met (my run).
- 13: met. A row with no `for` reads both connections; failure-rows.test passes.
- 19: met. credentials.test passes, with the helper named for the key and the address.
- 20: partial. It is met for a git that a watcher of the server context starts. It is unmet for every git a route starts (Fetch, Push, Pull, Sync, clone, deposit) and for every terminal (Behaviour 1).
- 22: met in code and unit tests. The view is settled by the look.

Items of the round brief:

- 1 (B1, P2): partial. These parts are built and pass (29 tests): the row gate in `signedInHosts`, the helper named for the key and the address, Sign out of an unlisted key, the unlisted list, and the store.ts sentence. The rows reach `credentials.ts` through module-level state, which turns the boundaries check red and leaves route-started gits and terminals with no pairs (Behaviour 1).
- 2 (B2): closed (put-key.ts:40, put-key.test 10 passed).
- 3 (B3): closed (setup.ts:143-150 and :171, ClusterSteps.svelte; 12 passed).
- 4 (B4, P1): closed. The Data move is judged correct below.
- 5 (B5): closed, with Spec 1.
- 6 (P5): closed for the `clusters:` row (my run). Folding the word into `MAC_TARGET` (model-recover.ts:11), now read by watch.ts and routes.ts, goes beyond the finding but stays inside its concern and is judged sound. The `slurm.resource` half stays open (Spec 2).
- 7 (P3): closed. It removes a test as the ruling asked, and its case is a run (met).
- 8 (S1): closed. 9 (S2): closed. 10 (S3): closed; the snapshot already had a one-line doc comment, which is now longer. 11 (S4): closed. 12 (S5): closed in form, with Standards 3.
- 13 (P6): closed.
- 14 (R1, R2): closed. The name counts and the history grep reproduce.
- 15 (R3): partial (Proof 1).
- 16 (P4): not verifiable from the tree (Declined).

The builder's statement about scripts: in this round it wrote `credentials.ts` with a python script and appended to `routes.test.ts` with `cat >>`. In the first phase it wrote `AccountSetup.svelte` with python and appended to `docs/HELP.md` and `settings.test.ts` with `cat >>`. This breaks spec.md "What every package obeys" (an inline program that changes a file is a script needing approval) and the brief's "No script is written for this step". No approval is quoted in plan.md. The standing ruling "Unapproved builder scripts" in plan.md (2026-10-25) closes it in automode: the orchestrator records it and reads each hunk, keeping only what the read confirms. I read each of the five whole or by every hunk:

- `credentials.ts`, all 201 lines: coherent, apart from `heldRows` (Behaviour 1).
- `AccountSetup.svelte`, whole file and its diff against the base: coherent, nothing truncated or duplicated.
- `routes.test.ts`, all 145 lines: coherent, apart from Standards 2.
- `docs/HELP.md`, its eight hunks against the base and the closing section "Git hosts and clusters": coherent; the file ends in a newline.
- `settings.test.ts`, its four hunks: coherent; the new test is named under G13 in the Doc text.

The Data move (report "Data move"): it holds. The job record's shape `{id, action}` is the same in the old and new layouts (cluster.ts diff), so a moved record reads. `jobFolder` is `~/.oculus/recover/<hub>/clusters/<resource>`. The `mkdir -m 700` names both folders, so both get 700, as the code's own `mkdirSync(..., { mode: 0o700 })` does. `<key>.list.json` stays where `recoverFiles` reads it. The stage folders it moves are transient (the code removes them after each send), so moving them is harmless. One edge: if both an old `cluster` and an old `jobs` stage exist for one key, the second `mv` puts `jobs` inside `<key>.stage/`. This loses nothing, since the next run's `rmSync` clears the stage. The move assumes every old record is utwente's, which holds for the one hub whose `slurm.resource` was `utwente`.

The red boundaries check and the builder's three options:

- The check is right to refuse `heldRows`, and it is a defect, not only a rule breach (Behaviour 1).
- (a) is the better option, as a judgment. It is the owned object in the context, handed to every git start and to `fixedEnv`, and reached by routes through `locals.server`. It ends the defect in both module graphs and changes no user-visible shape, so it needs no ruling from Axel.
- (a2) narrows item 19's "every git oculus starts", which is a ruling.
- (b) is the lazy option. It adds a stored file and its format under `~/.oculus`, which is a shape needing a ruling, and it leaves a window in which a git reads stale rows.
- The hand-back as a stop is not one of the stop kinds, since (a) is a fix within the plan and changes no user-visible shape. It is a red verification command whose fix is too large for landing, which is the case where the refute skill allows one more round.

### Findings

#### 1. Spec

- `src/lib/data/sources/config/settings/connectors.ts:106-111`:
  ```
  function connectionsOf(row: Record<string, unknown>): FailureConnection[] {
      const held = row.for;
      if (held === undefined) return [...FAILURE_CONNECTIONS];
      const named: unknown[] = Array.isArray(held) ? held : [held];
      return FAILURE_CONNECTIONS.filter((one) => named.includes(one));
  ```
  With `config/options/behavior.yml:228` `empty: true`.
  - What is wrong: a row with `for: []` is read with no problem as `"for":[]` (my run), so neither the cluster poll nor the fetch ever tries it. spec.md asks that every key a step introduces is checked empty and that the report states what the code does. The report names `empty: true` and says nothing of an empty `for`.
  - Failure scenario: Axel writes `for: []` meaning "both" (the help says a row without `for` reads both). The row silently matches nothing, and no finding says why.
  - Verdict: item 12 holds, with this gap.
- Report "Repair round 1", item 6:
  > "Not done by the ruling's scope: a `slurm.resource` naming `mac` is still read with no finding, and that cluster is not offered in Recover's pick."
  - What is wrong: the half of P5 that concerns `slurm.resource` is open. My run shows `slurmSettings` with `[mac, utwente]` gives `["mac","utwente"]` and no problem, while `Recover.svelte:72` filters `mac` out of the pick. The report names it but neither books it nor raises it as an open item.
  - Failure scenario: a hub whose cluster key is `mac` gets a Live HPC section for it, but Recover never offers it and says nothing about why.
  - Verdict: none against the round's ruled item. It is a residual of P5 for the orchestrator to fold or raise.

#### 2. Proof

- Report, round item 15:
  > "The cases 18 to 23 are runs of the code in `<scratchpad>/o98-caserun/tests/r3.test.ts` ..."
  
  and item 7:
  > "The case stays the run of case 9 of `<scratchpad>/o98-caserun/tests/r3.test.ts`"
  
  and the probe run "with `node probe.mts`".
  - What is wrong: spec.md requires a case-run program's source to be quoted in the report so the reviewer can run it again. Neither the source of `r3.test.ts` nor that of `probe.mts` is quoted, and both were deleted under "Removed" (ls: No such file or directory). The report says so itself: "they would have to be written again".
  - My reruns: case 9 is met by my own run. Cases 18 to 23 are covered by suite tests that pass (credentials, askpass, put-key, setup, and the signins and keys tests in Verify 1). R3's closure for those runs cannot be reproduced.
  - Failure scenario: the reader of the landing report takes the quoted case-20 line ("git through run.ts reads helpers [...]") as proof that git starts get the helper. It ran in one module graph, with the rows set in that graph, and so does not show what a route-started git gets (Behaviour 1).
  - Verdict: round item 15 partial.
- Report "Repair round 1", Not done 1:
  > "Item 1 is built and its cases pass, but the `sign_in` rows reach every git start through a module-level binding ... The rules of the check forbid it"
  - What is wrong: the report presents the red check as a rule breach only. It does not state the behaviour that follows: in the request handler's module graph, `heldRows` is never set (Behaviour 1).
  - On tests: every test passes explicit `places` with `rows` (`tests/server/core/credentials.test.ts:160-216`). No test reaches the default `machinePlaces()` path that every real git start uses.
  - Failure scenario: the orchestrator weighs the three options as a question of style, when the code as it stands takes the token from every route-started git and every terminal.
  - Verdict: item 19 violated (with Behaviour 1).

#### 3. Standards

- `src/lib/server/core/git/credentials.ts:141-147`:
  ```
  let heldRows: readonly SignInRow[] = [];
  export function useSignInRows(rows: readonly SignInRow[]): void {
      heldRows = rows;
  ```
  - What is wrong: this breaks spec.md "The principles every package is judged on" ("No globals ... no module-level mutable state shared across module graphs ... A package that adds one is not landed"). `tests/checks/tree/boundaries.test.ts` "holds no process-wide state under src" is red on it. The check was not loosened: `FROZEN` is unchanged.
  - Failure scenario: see Behaviour 1.
  - Verdict: item 19 violated. The step cannot land while this stands.
- Tests outside their entry's guarantee (spec.md: a test exists only as the test of one entry, named there; a new entry or unit needs Axel's yes; guarded.md's head: "Views have no entry"):
  - `tests/server/accounts/connect/git/routes.test.ts:135`, `it('refuses Sign out of a key with no row and no file, and writes nothing', ...)`, is named under no entry in the Doc text (grep for its title in the report finds nothing).
  - `tests/views/personal/account-setup/cluster-steps.test.ts:47` and `:54` are view tests filed under G135. G135's ruled units are the token store, the refresh, the device flow, the credential helper, the password helper and the key setup's remote command. Drawing a public key is none of them.
  - `tests/server/machine/hpc/clusters/failure-rows.test.ts:51` and `:62` are filed under G13, but they test which rows a fetch and a poll try. G13 guarantees that a wrong config value is refused with a finding.
  - Failure scenario: the orchestrator writes these titles into guarded.md as the Doc text gives them, which widens G135 and G13 with units Axel did not rule. The unnamed routes.test.ts case stays in the suite with no entry.
  - Verdict: item 22 partial.
- `src/lib/data/sources/config/machine.ts:61`:
  ```
  const CLUSTERS_ONCE_WORDS = 'rows of clusters no hub read before has a row of';
  ```
  It gives the sentence "clusters must be rows of clusters no hub read before has a row of".
  - What is wrong: spec.md's prose rule asks for plain words. This sentence is hard to parse; the sentence it replaced ("clusters repeats the resource of a row of a hub read before") said the fact directly. The report's Verify 8 says it found no departure.
  - Failure scenario: Axel sees this finding in Settings for a second hub's row of one cluster and cannot tell what to fix.
  - Verdict: round item 12, closed in form.
- The python and `cat >>` writes, as stated above. This breaks spec.md "What every package obeys" and the brief's "No script is written for this step". It is closed by the plan.md ruling "Unapproved builder scripts" (record it, read each hunk). My read of the five files finds no damage beyond the findings above.
  - Verdict: none beyond the record.

#### 4. Behaviour

- `src/lib/server/core/git/credentials.ts:160-168`, with `src/lib/server/root/live-settings.ts:153` and `:208`:
  ```
  function machinePlaces(): CredentialPlaces {
      return { folder: connectFolder(), engine: engineDir(), execPath: process.execPath, rows: heldRows };
  ```
  ```
  useSignInRows(current.signIn);
  ```
  - What is wrong: the rows are set only in the module graph that builds the server context. That graph is where `live-settings.ts` runs, inside `createServerContext`, which `vite-plugin.ts:37` calls.
  - The request handler is a second module graph. It receives the context through `event.platform.req.oculus` (`src/hooks.server.ts:183-185`, `src/lib/server/root/context.ts:871-876`), and its route modules import the git code directly:
    - `src/routes/api/(git)/git/+server.ts:10` imports `$lib/server/git/git-routes`, which reaches `git-write.ts:166` and `:746`.
    - `src/routes/api/(sessions)/terminal/+server.ts:6` imports `$lib/server/machine/pty/routes`, which calls `startTerminal`, which reaches `sessions.ts:700` `fixedEnv: [GRID_ENV, ...terminalCredentialEnv()]`.
    - The boundaries check's own comment says the same: "The server runs as two module graphs (the built handler and the Node entry)" (`tests/checks/tree/boundaries.test.ts:440-441`).
    - In that graph `heldRows` stays `[]`, so `signedInHosts(folder, [])` keeps no host and `gitCredentialArgs()` and `terminalCredentialEnv()` give nothing.
  - What a user sees change: before this round, the pairs came from the token files alone and reached route-started gits too. After it:
    - Source Control's Fetch (`fetchAll`), Push, Pull and Sync, the clone and the deposit routes, and every terminal carry no `-c credential.<address>.helper` and no `GIT_CONFIG_*` pairs.
    - Only the gits that watchers and the automatic fetch start in the context graph get them.
  - The report should have stated this under "Not done" and "Visible changes"; it states only the check.
  - This is shown by reading the code above. No run of mine opens two module graphs.
  - Failure scenario: Axel signs in to GitHub in Account setup. The automatic fetch of an https remote works, but pressing Push in Source Control fails with git's own authentication failure. A `git push` typed in an oculus terminal asks the reader's own helper or fails, since that terminal holds no pairs.
  - Verdict: item 19 violated; item 20 partial; case 20 partial.

### Declined to judge

- `npm run diagrams` and `npm run docs:palette`: both write files.
- The "before" runs of each new or changed test on the tree as the round found it: the snapshot holds only the changed files, not a runnable tree, and building one would write files.
- The Data move script run on a scratch HOME: it writes files. I judged it by reading.
- Reruns of `r3.test.ts`, `probe.mts`, `case.config.mts` and the hub-text program: deleted, with no source quoted (Proof 1).
- The report's "8 files, 190 tests" run for items 6 and 12: the files are not named. My five-file set gives 126 passed, and no decision rests on the count.
- P4 (that no git command other than status, diff and show was run this round): the transcript is not mine to read.
- The looks (Account setup's public key line and the unlisted tokens list, Live HPC, Recover's pick, the status bar tip): the look on 8790 at landing, which I may not touch.
- Whether the credential helper runs under a packaged Electron app (asar path): settled by a packaged build.
- Whether the UT cluster offers password login: settled by an ssh to it, which I may not open.

Usage: ab06a81d516bd9450, claude-opus-5-5, 309384 tokens, 67 tool uses, 22 min 30 s.

## Repair round 2, refuted

Step O98, worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O98, base 54304adb4, round snapshot /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O98-round-2. I changed nothing in the worktree or the ledger.

What the round changed: 28 paths of `files.txt` differ from the snapshot. Four of them are `docs/diagrams/*`, which `npm run diagrams` rewrote. 53 tracked paths that `files.txt` does not list now differ from the base. One file is new and untracked: `tests/routes/git/credentials.test.ts`. I read every hunk of these.

```
Verify 1: PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base 54304adb4   (10:49:27 to 10:56:06, exit 0)
test:quick: 267 changed file(s), from git since 54304adb4
test:quick: 353 test file(s)
ok      ASCII gate (1.2 s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.5 s)
ok      eslint (29.6 s)
ok      svelte-check (42.5 s): 1793181013113 COMPLETED 558 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (217.1 s): Duration  205.17s (transform 76.89s, setup 0ms, import 240.57s, tests 459.64s, environment 7ms)
ok      vitest (237.7 s): Duration  229.26s (transform 158.18s, setup 0ms, import 342.82s, tests 530.25s, environment 17.75s)
ok      vitest slow (395.5 s): Duration  387.31s (transform 12.83s, setup 0ms, import 154.80s, tests 1381.74s, environment 21ms)
test:quick: 398.2 s; every command passed
 (the list covered tests/routes/git/credentials.test.ts and tests/server/core/credentials.test.ts as "changed", tests/checks/tree/boundaries.test.ts and tests/server/edit/config-value.test.ts at import depth 1)
Verify 2 (perl ASCII gate over the 262 changed files that exist, local.yml paths left out): no output, exit 0.
Verify 3 (sh utils/unused-exports.sh, exit 0, diffed against .agents/worktrees/O98-base/unused-exports.txt): removals only
 < src/lib/data/accounts/connect.ts: PROVIDERS, CALENDAR_PROVIDERS      > src/lib/data/accounts/connect.ts: CALENDAR_PROVIDERS
 < src/lib/server/root/watch/git.ts: THROTTLE, IGNORED, relevant, rootsOf, subrepositories      > src/lib/server/root/watch/git.ts: THROTTLE, rootsOf
Verify 4a: grep -rn "hpc_host\|hpcHost" src tests config docs --exclude=local.yml: no output, exit 1.
Verify 4b: three lines, none an address: credential-helper.mjs:47 `https://${host}`; git/signins.ts:3 (a comment); git/signins.ts:169 startsWith('https://').
Verify 6: largest sources context.ts 879, settings.test.ts 878, git-write.ts 866, sessions.ts 863, deposit.ts 861, model/index.ts 860; largest component Source.svelte 520; sh utils/folder-check.sh exit 0.
Verify 7: grep of the round's added comment lines and test titles for the history words: six hits, all "before" naming argument order ("before `-C`", "before the caller's", "before its own", "before a git's subcommand"). None is history.

The evidence the round's report quotes, rerun:
 npx vitest run tests/routes/git/credentials.test.ts --reporter=verbose:
  v |unit| tests/routes/git/credentials.test.ts > the gits the git route starts > carry the pairs for Fetch, Pull, Push and Sync with 'a signed-in host whose sign_in row na<ellipsis>' (G135) 1775ms
  v ... git route ... with 'the sign_in row removed' (G135) 1612ms
  v ... the gits the clone route starts ... (both states) 1290ms, 1976ms
  v ... the gits the deposit route starts ... (both states) 2896ms, 1535ms
  v ... a terminal a request opens > carries the GIT_CONFIG pairs ... (both states) 1360ms, 1100ms
  Test Files  1 passed (1)   Tests  8 passed (8)
 npx vitest run tests/checks/tree/boundaries.test.ts: Test Files  1 passed (1)   Tests  11 passed (11)
 git diff 54304adb4 --stat -- tests/checks/: only config-folder.test.ts (+4) and config.test.ts (+9 -7); boundaries.test.ts is unchanged.
 grep -rn "gitCredentialArgs\|terminalCredentialEnv\|useSignInRows\|heldRows" src tests docs utils: no output, exit 1.
 grep -rn "credentials?:\|credentials ??\|noCredentials" src: no output, exit 1.
 grep -rn "gitCredentials(" src: credentials.ts:168 (the definition) and context.ts:305 only.
 grep -n "credentials.args()" over the git starts: run.ts:256, :285; git-write.ts:170, :747; deposit-git.ts:159, :287; clone-git.ts:86. sessions.ts:703 `fixedEnv: [GRID_ENV, ...options.credentials.env()]`. (All match the report.)
 git show 54304adb4:src/lib/server/core/git/run.ts | grep -n credential: no output, exit 1. The base copy's core/git/ holds no credentials.ts (count 0).
 wc -l: watch/git.ts 811, the new test 292; tests/routes/git holds 6 items.
 npx svelte-check --tsconfig ./tsconfig.json --output machine: 1793181473321 COMPLETED 4382 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
 npx vitest run tests/server/edit/config-value.test.ts: Test Files  1 passed (1)   Tests  23 passed (23)
 npx vitest run tests/checks/diagrams/diagrams.test.ts alone: 2 failed | 45 passed (47); both fail with "Test timed out in 5000ms" ("are what the source gives now, each file byte for byte" and "are named stale, every one at once, ..."). The file is unchanged and its tier is green in Verify 1. Under the rules file this is not the step's failure.
```

### Verdicts

Items of the brief's "What to build", for the whole diff since the base. Items the round did not touch rest on Verify 1 green and on the earlier reviews' reading.

- 1: holds. The settings and config tests are green in Verify 1. The `slurm.resource` `mac` residual is one of round items 2 to 6, which were withdrawn to landing.
- 2: holds. Verify 4a prints nothing.
- 3, 4, 5, 6, 8, 9, 10, 14, 15, 17: hold. Their tests are green in Verify 1. The round changed only the call shapes of their git reads.
- 7: holds by reading. The look at landing settles the view.
- 11: holds.
- 12: holds. The empty-`for` residual is withdrawn to landing.
- 13: holds. `fetchAll` and the automatic fetch now take a `GitAt` (git-remote.ts, autofetch.ts:131-150), and Verify 1 is green.
- 16, 18: hold.
- 19: holds.
  - `credentials.ts` holds no mutable module state. I read the whole file; its module-level bindings are only the constants `HELPER_SOURCE` and `HOST_FILE`.
  - One object is built at `context.ts:305`, `gitCredentials(() => built.live?.signIn() ?? signIn)`, and held on `ServerContext.credentials` (server-context.ts).
  - Every git spawn takes it as a required argument, at the seven sites listed above. A terminal's `fixedEnv` takes it at sessions.ts:703, with `StartOptions.credentials` required.
  - The eight routes reach it through `locals.server`.
  - svelte-check over 4382 files gives 0 errors, so no caller leaves it out.
  - One default is left, `places = machinePlaces` (credentials.ts:170). It reads `homedir()`, `engineDir()` and `process.execPath` at the call and reads no module state, so the round brief's "No default that reads module state is left" holds.
- 20: holds. `docs/HELP.md:514` reads true of the code: pairs only for a host whose row names the token file's address, and a sign in or sign out holds for the next git. Three changed comments are not rewrapped (Standards 1 to 3).
- 21: holds.
- 22: partial (Spec 1). The three tests outside their entries are withdrawn to landing.

Cases:

- 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23, 24, 25: met. Their tests are green in Verify 1, as the earlier reviews read them.
- 4: met at unit level for the counts. The pill and the badge are settled by the look.
- 20: met.
  - A git started through the git route (fetch, pull, push, sync), the clone route and the deposit route (adopt, plan) carries the four `-c` words first when the row names the address. With the row removed it carries no `credential.` word.
  - A terminal's `new-session` carries the five `GIT_CONFIG_*` variables, or none.
  - All of these run through a context built by `createServerContext` (the route test, 8 passed). No token is in the pairs: PAIRS and ENV name only the helper's shell line.
- 22: met in code and unit tests. The view is settled by the look.

Items of the round brief:

- 1: closed, with Spec 1 and Standards 1 to 4.
  - `heldRows` and `useSignInRows` are gone (grep above).
  - The owned object exists, is passed with no default to every git start and terminal, and routes reach it through `locals.server`.
  - The boundaries check is unchanged and green.
  - The cases are G135 rows. Three of them go through the real `POST` of the git, clone and deposit `+server.ts` routes. The terminal row calls `handleTerminal` with options it builds itself, with `credentials: context.credentials`, so the terminal route's own wiring (`src/routes/api/(sessions)/terminal/+server.ts`, `credentials: server.credentials`) is shown by reading only.
  - The `restartFindings` move to `process/context/findings.ts:76-93` is the base code unchanged. I checked it against `git show 54304adb4:src/lib/server/root/context.ts` lines 152-164: same file choice, same key, same `server.workspace.restart_key` words. `heldBack()` and the config are still read at each call through the arrow at context.ts:166-167. The move keeps context.ts at 879 lines, which the size rule needs. It goes beyond the finding only as the split the rules file asks for, and the report names it.
- 2: holds.
  - "Behaviour of every git start and terminal, before and after" and "Visible changes" give the before and the after.
  - The report gives the before as "no git oculus starts carries a credential pair" at the base. That is right: the `git show` grep above prints nothing. The round brief's parenthesis, "pairs from the token files alone", describes the step's own first build, and the report states that one too.
  - "Not done" does not repeat it, since nothing of it is undone.

Specifically judged:
- No closure by removing a check: boundaries.test.ts is unchanged.
- I compared the 43 edited `expect(` lines of the round's test diffs, before and after. Every expected value is the same, and only the call shape (`repo` to `gitAt(repo)`, a credentials argument) and prettier's line breaks changed.

### Findings

#### 1. Spec

- Report "## Repair round 2" (no Doc text). The section names `tests/routes/git/credentials.test.ts` as "new, the G135 rows" (its file table) and gives its titles in a run quote. It gives no Doc text line for `agents/guarded.md`.
  - What is wrong: G135's Test line in the report's "Doc text" (report line 753, with the round 1 append at line 1175) does not name this file or its four titles. G135's Code line does not name `src/lib/server/root/context.ts`, where the one `GitCredentials` is built (`context.ts:305`). The rules file says a test exists only as the test of one entry, named there by file and title, and the orchestrator writes the entries at landing from the report's "Doc text" (brief item 22).
  - Failure scenario: the orchestrator writes G135 from the Doc text as given. The new route test then sits in the suite under no entry, and a later step that deletes "the tests its change makes obsolete" has no entry to say this file guards G135.
  - Verdict: item 22 partial. This is a line of Doc text, small enough to fix at landing.

#### 2. Proof

- Report "Repair round 2", Not done 2: "It calls `context.credentials` and route handlers that pass it, which the tree before item 1 did not have".
  - What is wrong: vitest does not type-check. On the round 1 tree, the git, clone and deposit rows never read `context.credentials`, and they run in one module graph, where live-settings called `useSignInRows` inside `createServerContext`. So those rows would most likely have passed there. This is my judgment by reading and is not verified, since no round 1 tree exists to run them on.
  - The test shows that a route's git gets the object's pairs. It does not show that the two-module-graph defect is gone. What shows that is the absence of module state (boundaries check, 11 passed) together with the required parameters (svelte-check, 0 errors), both of which I reran.
  - Failure scenario: the landing report cites this test as the proof that route-started gits in the built server get the pairs. A later change that again holds the rows in a binding set in one graph would pass it, and only the boundaries check would stop that change.
  - Verdict: none. Round item 1 stays closed.

#### 3. Standards

- `src/lib/server/git/clone/clone.ts:21-24`:
  ```
  // A command runs through the `GitRunner` the caller gives, the real git (clone-git.ts) with the
  // server context's credentials, so a test drives the steps over scratch repositories or a runner
  // of its own. Every
  // operation answers `{ ok, output, error }` and never throws.
  ```
  - What is wrong: the rules file ("What every package obeys") says a comment the step edits is rewrapped as a whole paragraph at 100 columns. Line 23 is 20 columns and ends inside a sentence. The "so" clause also no longer follows from the clause before it: the runner is the caller's, and the real git is one caller's choice.
  - Failure scenario: a reader takes the line break for a cut sentence, and reads "so a test drives the steps" as following from the credentials.
  - Verdict: item 20 (comments say what is true): holds; this is the wrapping and wording at landing.
- `tests/fixtures/doubles.ts:4-6`: "// driver that runs no tmux, the git credentials of a server signed in nowhere, and a language / // server channel that is open and takes what is sent. They / // exist once here so ...".
  - What is wrong: line 5 is 59 columns and ends inside a sentence. The same rewrap rule applies.
  - Failure scenario: the same as above.
  - Verdict: none.
- `src/lib/server/git/deposit/deposit-git.ts:37-39`: "// mirrors folder exactly as `run` does. Every git here is given the `-c` arguments of the / // credentials `Where` carries, the server context's, before its own / // (server/core/git/credentials.ts)."
  - What is wrong: line 38 is 68 columns and ends inside a sentence. The same rewrap rule applies.
  - Failure scenario: the same as above.
  - Verdict: none.
- Report "## Repair round 2", "The changed tests, before and after", and the file table ("34 other test files and helpers | credentials or `gitAt` passed").
  - What is wrong: the rules file asks the report to list every edit to an existing assertion with its before and after, one row per changed line, made from a diff. The round edited 43 `expect(` lines (for example `tests/server/git/git-ops.test.ts`, `expect((await fetchAll(repo, TEXT, ROOTS)).ok).toBe(true);` to the `gitAt(repo)` form; `tests/server/core/credentials.test.ts`, `expect(gitCredentialArgs(places)).toEqual([]);` to `expect(credentialsOf(places).args()).toEqual([]);`), and the report lists none of them. My comparison of the before and after lines finds every expected value unchanged.
  - Failure scenario: the orchestrator cannot see from the report that no expected value moved, and has to diff 34 files to learn it.
  - Verdict: none.

#### 4. Behaviour

- None. The round changes no key, text or view. The behaviour change of git starts and terminals is stated under "Visible changes", and it matches the code: pairs only through `signedInHosts` (credentials.ts:102-128), which keeps a file only when a row of its key names its address.

### Declined to judge

- `npm run diagrams` and `npm run docs:palette`: both write files.
- The report's "before" run of the 56 changed test files on the round 1 tree (09:44:14 to 09:45:24), and whether the new route test would have failed there: no round 1 tree exists, and building one would write files.
- The report's "after" run of the same 56 files: the report does not name them. No decision rests on its counts, and Verify 1 covers the changed tests.
- The report's statement that no program wrote a source, test, config or doc file this round: the transcript is not mine to read. I read every hunk of the round, and none shows damage.
- The looks (Live HPC, Account setup, Recover's pick, the status bar tip): the look on 8790 at landing, which I may not touch.
- Whether the credential helper runs under a packaged Electron app (asar path in `process.execPath`): settled by a packaged build.

Usage: a3b236225c0b704c9, claude-opus-5-5, 273317 tokens, 61 tool uses, 14 min 15 s.

### Closed

- Spec 1: fixed at landing. The orchestrator writes G135's Code line with `src/lib/server/root/context.ts` and its Test line with `tests/routes/git/credentials.test.ts` and its four titles.
- Proof 2: no change. The landing report names the boundaries check and svelte-check as what shows the module state gone, and the route test as what shows a route's git gets the pairs.
- Standards 1 to 3: fixed at landing, each comment rewrapped as one paragraph at 100 columns; the clone.ts sentence reworded so its clauses follow.
- Standards 4: no change in code. The reviewer's comparison of the 43 edited `expect(` lines, every expected value unchanged, is quoted in the landing report.
