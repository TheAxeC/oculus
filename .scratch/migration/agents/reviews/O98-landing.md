# O98 landing

Position: the migration plan (`.scratch/migration/plan.md`), step O98, accounts and connections, landed on main with the research hub's commit of its Hub text. In flight: O97 (building). Next: O97's report and review, then /spec O99.

## Open items

None.

## Check of Steps 1

The runner's agent listing showed one subagent, O97's builder a0fed28c88758e2aa; none of O98's builder (a8cc0514e57924553) or reviewers was listed.

## NOT DONE

- The look did not open Submit's cluster pick (it needs a Submit press), a failing fetch in Source Control (no repository's fetch fails on this machine) or the delete ask of the resource `utwente` (a Delete press). Their behaviour is held by G43's 'the cluster a confirmed plan runs on', the fetch rows of G13 and the references test; on the screen they are not verified.
- The new route test `tests/routes/git/credentials.test.ts` has no run on the tree before repair round 2. It shows that a route's git gets the pairs of the server's one credentials object; what shows that no module state holds the rows is the boundaries check (11 passed) with the required parameters (svelte-check, 0 errors).

## What landed

- The step's whole range from base 54304adb4 (one wip commit 58195760f: the build and repair rounds 1 and 2), 264 files, +14603 -5952 with the fixes at landing and the regenerated diagrams. What it builds is booked under O98 in `plan.md`.
- The research hub's `.oculus/config.yml`: the report's Hub text with round 1's `connections:` block: `slurm.resource: [utwente]`, `clusters.key_type` and `clusters.key_file`, six `connections.failures` rows each with `for`, the `sign_in` rows google, microsoft and github, and `recover.node_download`.
- `agents/guarded.md`: G135 new after G84; G1, G7, G8, G13, G34, G43 and G113 as the report's Doc text gives them, with the changes below.
- The Data move: `ls ~/.oculus/recover/research-hub/` shows only `pbc-cirrhosis.list.json`; no `*.job.json`, `cluster/` or `jobs/` exists, so nothing was moved.

## Fixes at landing

From the review over round 1 (withdrawn from round 2) and the review over round 2:

1. A `connections.failures` row with `for: []` is a finding naming `connections.failures[<n>].for` and is not read (`failureRows`, `src/lib/data/sources/config/settings/connectors.ts`); the `for` help in `config/options/behavior.yml` says so. Row 'a row for no connection' of `tests/data/hubs/connection-keys.test.ts` (G13): red on the unchanged code, `AssertionError: expected { value: [ { ...(4) }, { ...(4) } ], ...(1) } to strictly equal { value: [ { ...(4) } ], ...(1) }`; green after.
2. `mac` in `slurm.resource` is a finding, "slurm.resource holds mac, which names this Mac and no cluster; it is left out", and is not polled: `resourceKeys` in `connectors.ts`, the problem `this-mac` in `reader.ts`, its sentence in `catalogs.ts` and `config/text/findings.yml`, its Settings reason in `origins.ts`; the `slurm.resource` help says so. Row 'the key of this Mac' of `tests/data/sources/config/settings.test.ts`: red on the unchanged code, `AssertionError: expected { value: { ...(5) }, problems: [] } to match object { value: { resources: [ 'a' ] }, ...(1) }`; green after (both files: `Tests 111 passed (111)`).
3. `CLUSTERS_ONCE_WORDS` (`src/lib/data/sources/config/machine.ts`) reads "rows of clusters that no earlier hub has a row for"; its test line in `tests/data/sources/config/local/machine.test.ts` changed with it (`Tests 12 passed`).
4. `tests/server/machine/hpc/clusters/failure-rows.test.ts` and `tests/views/personal/account-setup/cluster-steps.test.ts` removed, outside G13's and G135's guarantees; their cases run once before the removal, sources and output below. The emptied folders `tests/views/personal/account-setup` and `tests/views/personal` went with them.
5. `tests/server/accounts/connect/git/routes.test.ts:135` is 'refuses Sign out of a key with no row and no file, and writes nothing (G135)', named under G135.
6. The comments of `src/lib/server/git/clone/clone.ts:21-25`, `src/lib/server/git/deposit/deposit-git.ts:34-39` and `tests/fixtures/doubles.ts:1-8` rewrapped as whole paragraphs at 100 columns; `clone.ts` reworded so the test clause follows from the runner the caller gives.
7. `docs/data-map.md`: the five lines of the report's Doc text. The count of keys read from the primary alone is seventeen: 57 keys in `hub-names.ts` less the 40 of `OWN_HUB_KEYS`, listed by command as portfolio_deck, career_file, bookmarks, schedules, apps_dir, wallpaper.image, docs, counts, slurm.resource, clusters.key_type, clusters.key_file, connections.failures, sign_in, recover.node_download, lint.writing_skip, lint.writing_glyphs, app_settings.
8. `agents/guarded.md`: G135's Code line names the one credentials object, `gitCredentials` in `credentials.ts`, built in `src/lib/server/root/context.ts`; its Test line names `tests/routes/git/credentials.test.ts` with its four titles and the Sign out row of item 5, and leaves out `cluster-steps.test.ts`. G13's Test line leaves out the `hpc_host` row and `failure-rows.test.ts`, and names 'a row for no connection' and 'the key of this Mac'. Every `src/` and `tests/` path the added lines name exists in the gate, and each of the 72 titles ending in a G tag is found under `tests/`.
9. Prettier's line breaks in `catalogs.ts` and `connectors.ts`.

The review over round 2's Proof finding (the route test as proof of the module-state fix) is answered under NOT DONE; its fourth Standards finding (the 43 edited `expect(` lines not listed) needs no change in code: the reviewer compared each before and after line and every expected value is unchanged.

## The case runs of the two removed files

`npx vitest run tests/server/machine/hpc/clusters/failure-rows.test.ts tests/views/personal/account-setup/cluster-steps.test.ts tests/data/sources/config/local/machine.test.ts --reporter=verbose`, in the gate before the removal:

```
the fetch: {"kind":"Git key refused","fix":"Add this Mac's ssh key to the git host, or use its https address and sign in in Account setup","line":"git@github.com: Permission denied (publickey).","at":"1970-01-01T00:00:00.000Z"}
the poll: {"kind":"Key refused","fix":"Put the key on the cluster in Account setup"}
 v |unit| tests/server/machine/hpc/clusters/failure-rows.test.ts > a failure line by the connection that wrote it > gives the git row's fix for a fetch (G13) 3ms
 v |unit| tests/server/machine/hpc/clusters/failure-rows.test.ts > a failure line by the connection that wrote it > gives the cluster row's fix for the ssh poll of a cluster (G13) 0ms
 v |unit| tests/views/personal/account-setup/cluster-steps.test.ts > the public key of a cluster in Account setup > is drawn with its copy press, with no password typed and the host not yet trusted (G135) 28ms
 v |unit| tests/views/personal/account-setup/cluster-steps.test.ts > the public key of a cluster in Account setup > is not drawn for a key file with no public key (G135) 1ms
 Test Files  3 passed (3)
      Tests  16 passed (16)
```

The cases 9 and 18 to 23 of the builder's deleted case-run programs (`r3.test.ts`, `probe.mts`) were rerun by the review over round 1: case 9 by its own run, cases 18 to 23 by the suite tests credentials, askpass, put-key, setup, signins and keys, green in Verify 1.

`tests/server/machine/hpc/clusters/failure-rows.test.ts` as it ran:

```ts
// Layer 4, server test. The rows of `connections.failures` by the connection that wrote the line:
// one line that a cluster's ssh and a git host's ssh both write, `Permission denied (publickey)`,
// is told by the row whose `for` holds `cluster` when the ssh poll of a cluster wrote it (the
// failures each cluster's watcher is handed, `clusterSettingsOf`) and by the row whose `for` holds
// `git` when a fetch wrote it (`fetchFailureOf`), whichever row comes first in the list.

import { describe, expect } from 'vitest';
import {
    engineDir,
    failureRows,
    loadConfig,
    toldFailure
} from '../../../../../src/lib/data/sources/config.ts';
import { fetchFailureOf } from '../../../../../src/lib/server/core/git/state.ts';
import { clusterSettingsOf } from '../../../../../src/lib/server/machine/hpc/clusters/connections.ts';
import { it } from '../../../../fixtures/scratch.ts';

/** The shipped options catalog of behavior.yml, which the reader takes the rows' rule from. */
const OPTIONS = (loadConfig(engineDir()).config.options as Record<string, unknown>)['behavior.yml'];

const CLUSTER_FIX = 'Put the key on the cluster in Account setup';
const GIT_FIX =
    "Add this Mac's ssh key to the git host, or use its https address and sign in in Account setup";

/** The two rows of the research hub's text that hold the same match, the cluster's first. */
const ROWS = failureRows({
    options: { 'behavior.yml': OPTIONS },
    connections: {
        failures: [
            {
                kind: 'Key refused',
                for: ['cluster'],
                match: 'Permission denied (publickey)',
                fix: CLUSTER_FIX
            },
            {
                kind: 'Git key refused',
                for: ['git'],
                match: 'Permission denied (publickey)',
                fix: GIT_FIX
            }
        ]
    }
});

/** What GitHub's ssh writes for a key it does not know, and the line git's failure is said by. */
const OUTPUT =
    'git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository.\n';

describe('a failure line by the connection that wrote it', () => {
    it("gives the git row's fix for a fetch (G13)", () => {
        const failure = fetchFailureOf(OUTPUT, 'fatal: ...', ROWS, new Date(0));
        console.info(`the fetch: ${JSON.stringify(failure)}`);
        expect(failure).toEqual({
            kind: 'Git key refused',
            fix: GIT_FIX,
            line: 'git@github.com: Permission denied (publickey).',
            at: '1970-01-01T00:00:00.000Z'
        });
    });

    it("gives the cluster row's fix for the ssh poll of a cluster (G13)", () => {
        const slurm = { resources: ['utwente'], days: 7, pollMin: 1, quotaMin: 30, prewarm: false };
        const words = { sshExited: '', slurmLate: '', overrun: '' };
        const connection = { resource: 'utwente', name: 'UT', host: 'cluster.example.org' };
        const [settings] = clusterSettingsOf(slurm, [connection], words, ROWS);
        const failure = toldFailure(settings.failures, OUTPUT);
        console.info(`the poll: ${JSON.stringify(failure)}`);
        expect(failure).toEqual({ kind: 'Key refused', fix: CLUSTER_FIX });
    });
});
```

`tests/views/personal/account-setup/cluster-steps.test.ts` as it ran:

```ts
// Layer 3, view-partial tests. The steps of one cluster in Account setup's cluster section
// (views/personal/account-setup/ClusterSteps.svelte), rendered on the server over a fresh client:
// a cluster whose key file has a public key the read answered draws that key with its copy press
// beside the Put step before any password is typed and before the host is trusted, and a cluster
// whose key file has none draws no public key. What this does NOT cover: the steps' requests, which
// the server suite reads (tests/server/machine/hpc/clusters/setup.test.ts).

import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { ClusterSetupCluster } from '../../../../src/lib/data/model/index.ts';
import ClusterSteps from '../../../../src/lib/views/personal/account-setup/ClusterSteps.svelte';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import { clientContext, emptyClient } from '../../../fixtures/client.ts';
import { installRealText } from '../../shared/real-text.ts';

installRealText();

const PUBLIC = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOfthecase oculus-utwente';

/** A cluster of the section with this machine's row, its key file and the public key read. */
function cluster(publicKey: string): ClusterSetupCluster {
    return {
        resource: 'utwente',
        name: 'UT',
        missing: '',
        host: 'cluster.example.org',
        user: 'me',
        keyFile: '/home/me/.ssh/oculus-utwente',
        suggested: '',
        keyRefused: '',
        publicKey,
        access: '',
        resolution: null
    };
}

/** The steps' markup, comments taken out. */
function steps(publicKey: string): string {
    const { body } = render(ClusterSteps, {
        props: { cluster: cluster(publicKey), keyMissing: '', onsaved: () => undefined },
        context: clientContext(emptyClient())
    });
    return body.replace(/<!--[^>]*-->/g, '');
}

describe('the public key of a cluster in Account setup', () => {
    it('is drawn with its copy press, with no password typed and the host not yet trusted (G135)', () => {
        const html = steps(PUBLIC);
        expect(html).toContain(`data-copy-value="${PUBLIC}"`);
        expect(html).toContain(t('accounts.cluster_public_key'));
        expect(html).not.toContain(t('accounts.cluster_password'));
    });

    it('is not drawn for a key file with no public key (G135)', () => {
        const html = steps('');
        expect(html).not.toContain('data-copy-value');
        expect(html).not.toContain(t('accounts.cluster_public_key'));
    });
});
```

## Checks

In the gate worktree `.agents/worktrees/gate` at main's head 5712c0db4, `git cherry-pick -n 54304adb4..migration-O98` conflicted only in the generated `docs/diagrams/channels.dot`, `channels.svg`, `layers.dot` and `layers.svg`, taken from main and regenerated. After the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick` printed:

```
test:quick: 264 changed file(s), from git since HEAD
test:quick: 352 test file(s)
ok      ASCII gate (3.3 s)
ok      svelte-kit sync (3.4 s)
ok      prettier (5.0 s): All matched files use Prettier code style!
ok      svelte-check (43.6 s): 1793182677950 COMPLETED 558 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (79.3 s)
ok      vitest checks (222.2 s): Duration  210.58s (transform 69.61s, setup 0ms, import 272.17s, tests 446.91s, environment 6ms)
ok      vitest (283.4 s): Duration  273.85s (transform 296.63s, setup 0ms, import 550.36s, tests 491.49s, environment 18.05s)
FAILED  vitest slow (541.1 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a value its hub cannot resolve in the primary hub that holds it, the field keeping the key its file holds (G32)
test:quick: 545.0 s; failed: vitest slow
```

The one red line is `Error: Test timed out in 20000ms.` in a file the step does not change; `npx vitest run tests/data/hubs/hub-portfolio.test.ts` alone: `Test Files 1 passed (1)`, `Tests 16 passed (16)`. The landing goes on by the standing demand on load timeouts. Not covered: tests that reach no changed file within the import depth.

On main the same range was cherry-picked, the gate's tree brought over path by path, and `git diff --cached --binary` of main and the gate compared under `cmp`: same.

The builder ran the full verify list three times over the step, once a build, as its report states. The verify list was not changed. A/B: none, `bench: []`.

## The look, on 8790

With the Hub text written, in a new Chrome tab:

- Live HPC: one section, "UTwente HPC", with "ssh connects to hpc-head1.ewi.utwente.nl as faesayl on port 22, offering ~/.ssh/id_ed25519_utwente"; the cluster answers with a maintenance notice ("Connection closed by 130.89.6.254 port 22"), drawn under the ssh failure words with Refresh now; Login node the same.
- The status bar: the HPC item "unreachable" in the warning tone, its tip "UTwente HPC: The cluster did not answer over ssh. Is this Mac on the UT network or on EduVPN? Open Live HPC."
- Account setup: Google and Microsoft with the scopes of their `sign_in` rows; Git hosts with GitHub's register page `https://github.com/settings/applications/new`, the client id field and Sign in; Clusters (Live HPC), UTwente HPC: user name, key file `/Users/axelfaes/.ssh/id_ed25519_utwente`, Make key, "The key of the host utwente" with Read the host's key, the public key of the `.pub` file, Save, the `ssh -G` line. Put the key is not drawn before the host's key is read.
- Settings: `connections.failures` with 6 entries, read from `.oculus/config.yml:94`; `slurm.resource` a pick holding `utwente`, its help with the sentence on `mac`. The Findings pane: "No findings".
- Recover of pbc-cirrhosis: the target pick This Mac and UTwente HPC.
- Not looked at: Submit's cluster pick, a failing fetch in Source Control, the delete ask of `utwente` (NOT DONE).

The Recover pane opened for the look was closed and the side pane put back on Usage.

## Found

Nothing outside the brief.

## Agents

- Builder a8cc0514e57924553, claude-opus-5-5: 327915 tokens, 2155 tool uses, 4 h 9 min 32 s; round 1 370072 tokens, 535 tool uses, 69 min 16 s; round 2 51 min before Axel's pause (no usage notice), then 270540 tokens, 124 tool uses, 15 min 28 s.
- Brief check a5d4f9a13f2831178, claude-opus-5-5: 236369 tokens, 81 tool uses, 13 min 47 s.
- Reviewer ace99e5278712884d, claude-opus-5-5: 249353 tokens, 136 tool uses, 26 min 20 s, dispatched outside /refute, its report discarded (ruling 525 (a)).
- Reviewer a7bc5df274463e2fa, claude-opus-5-5: 85779 tokens, 90 tool uses, 25 min 29 s.
- Reviewer over round 1 ab06a81d516bd9450, claude-opus-5-5: 309384 tokens, 67 tool uses, 22 min 30 s.
- Reviewer over round 2 a3b236225c0b704c9, claude-opus-5-5: 273317 tokens, 61 tool uses, 14 min 15 s.

The builder's first report did not pass its bar: two repair rounds, the second the one round past the cap for the red boundaries check.

## Next

O97's report, then /refute O97, its round and /land with its look on 8790; then /spec O99.
