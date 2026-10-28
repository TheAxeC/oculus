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
