// Layer 4, server test. Recover's access to the credentialed services (G114), through the `access`
// addresses of the fixture rows of `recover.sources` (tests/server/core/reader/rows.yml): for
// PhysioNet, Kaggle and Synapse, no `downloads` row of the service, or a row whose request the
// service answers with 401 or 403, is access missing, which keeps Fetch from starting; a row the
// service answers with 200 is access granted. A PhysioNet set whose `SHA256SUMS.txt` answers 200
// without a row is open and needs none. The answers are the recorded ones and the answers the
// services' API references give (recorded.ts). A home holding `~/.netrc` and
// `~/.kaggle/kaggle.json` lends no credential, and no fetch script passes curl `--netrc`.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { RecoverAccess, RecoverSource } from '../../../../../src/lib/data/model/index.ts';
import type { DownloadAccount } from '../../../../../src/lib/data/sources/config.ts';
import {
    accessGranted,
    accessOf
} from '../../../../../src/lib/server/machine/runs/recover/access.ts';
import { localDeps } from '../../../../../src/lib/server/machine/runs/recover/local.ts';
import { fetchScript } from '../../../../../src/lib/server/machine/runs/recover/plan.ts';
import {
    handleRecover,
    handleRecoverState
} from '../../../../../src/lib/server/machine/runs/recover/routes.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import {
    DOWNLOADS,
    RECOVER_ROWS,
    datasetOf,
    listDeps,
    recoverRequest,
    targetOf
} from './harness.ts';
import { answering, recorded, reply, type Asked, type Routes } from './recorded.ts';

const MITDB_SUMS = 'https://physionet.org/files/mitdb/1.0.0/SHA256SUMS.txt';
const MIMIC_SUMS = 'https://physionet.org/files/mimiciv/3.1/SHA256SUMS.txt';
const KAGGLE_LIST =
    'https://www.kaggle.com/api/v1/datasets/list/awsaf49/brats20-dataset-training-validation';
const SYNAPSE_PROFILE = 'https://repo-prod.prod.sagebase.org/repo/v1/userProfile';

const MITDB: RecoverSource = { kind: 'physionet', project: 'mitdb', version: '1.0.0' };
const MIMIC: RecoverSource = { kind: 'physionet', project: 'mimiciv', version: '3.1' };
const KAGGLE: RecoverSource = {
    kind: 'kaggle',
    dataset: 'awsaf49/brats20-dataset-training-validation'
};
const SYNAPSE: RecoverSource = { kind: 'synapse', ids: ['syn51514110'] };

/** The `help` of the fixture row's `auth` entry that names the `downloads` row `service`. */
function helpOf(service: string): string | undefined {
    const entry = RECOVER_ROWS.flatMap((row) => row.auth ?? []).find((one) => one.row === service);
    return entry?.help;
}

/** What an access entry says of each service besides its state: its row's name, user and help. */
const PHYSIONET = {
    service: 'physionet',
    name: 'PhysioNet',
    basic: true,
    help: helpOf('physionet')
};
const KAGGLE_ACCESS = { service: 'kaggle', name: 'Kaggle', basic: true, help: helpOf('kaggle') };
const SYNAPSE_ACCESS = {
    service: 'synapse',
    name: 'Synapse',
    basic: false,
    help: helpOf('synapse')
};

/** A login answer by whether the request carries a credential: the recorded 403 without one. */
function login(status: number): (asked: Asked) => Response {
    return (asked) =>
        asked.headers.authorization === undefined
            ? recorded('physionet/mimiciv-nologin', MIMIC_SUMS)
            : reply(status, status === 200 ? 'sums' : 'refused');
}

/** The kind of credential a request carried: Basic, Bearer or none. */
function scheme(asked: Asked): string {
    return asked.headers.authorization?.split(' ')[0] ?? 'none';
}

type AccessRow = {
    name: string;
    sources: RecoverSource[];
    downloads: DownloadAccount[];
    routes: Routes;
    access: RecoverAccess[];
    asked: [string, string][];
};

const ROW_OF = {
    physionet: DOWNLOADS.filter((one) => one.service === 'physionet'),
    kaggle: DOWNLOADS.filter((one) => one.service === 'kaggle'),
    synapse: DOWNLOADS.filter((one) => one.service === 'synapse')
};

const ROWS: AccessRow[] = [
    {
        name: 'PhysioNet, an open set: no row needed',
        sources: [MITDB],
        downloads: [],
        routes: { [MITDB_SUMS]: recorded('physionet/mitdb', MITDB_SUMS) },
        access: [],
        asked: [[MITDB_SUMS, 'none']]
    },
    {
        name: 'PhysioNet, a credentialed set with no row: missing',
        sources: [MIMIC],
        downloads: [],
        routes: { [MIMIC_SUMS]: login(200) },
        access: [{ ...PHYSIONET, state: 'missing', row: false, status: 403 }],
        asked: [[MIMIC_SUMS, 'none']]
    },
    {
        name: 'PhysioNet, a credentialed set with a row that holds no user: missing, as with no row',
        sources: [MIMIC],
        downloads: [{ service: 'physionet', secret: 'pw' }],
        routes: { [MIMIC_SUMS]: login(200) },
        access: [{ ...PHYSIONET, state: 'missing', row: false, status: 403 }],
        asked: [[MIMIC_SUMS, 'none']]
    },
    {
        name: 'PhysioNet, a credentialed set with a row answered 200: granted',
        sources: [MIMIC],
        downloads: ROW_OF.physionet,
        routes: { [MIMIC_SUMS]: login(200) },
        access: [{ ...PHYSIONET, state: 'ok', row: true, status: 200 }],
        asked: [
            [MIMIC_SUMS, 'none'],
            [MIMIC_SUMS, 'Basic']
        ]
    },
    {
        name: 'PhysioNet, a credentialed set with a row answered 401: missing',
        sources: [MIMIC],
        downloads: ROW_OF.physionet,
        routes: { [MIMIC_SUMS]: login(401) },
        access: [{ ...PHYSIONET, state: 'missing', row: true, status: 401 }],
        asked: [
            [MIMIC_SUMS, 'none'],
            [MIMIC_SUMS, 'Basic']
        ]
    },
    {
        name: 'PhysioNet answering 500 without a row: unreachable, not missing',
        sources: [MIMIC],
        downloads: [],
        routes: { [MIMIC_SUMS]: reply(500, 'down') },
        access: [{ ...PHYSIONET, state: 'unreachable', row: false, status: 500 }],
        asked: [[MIMIC_SUMS, 'none']]
    },
    {
        name: 'PhysioNet giving no answer: unreachable',
        sources: [MIMIC],
        downloads: ROW_OF.physionet,
        routes: {
            [MIMIC_SUMS]: () => {
                throw new Error('no answer');
            }
        },
        access: [{ ...PHYSIONET, state: 'unreachable', row: true }],
        asked: [[MIMIC_SUMS, 'none']]
    },
    {
        name: 'Kaggle with no row: missing, nothing asked',
        sources: [KAGGLE],
        downloads: [],
        routes: {},
        access: [{ ...KAGGLE_ACCESS, state: 'missing', row: false }],
        asked: []
    },
    {
        name: 'Kaggle with a kaggle-token row and no kaggle row: missing, nothing asked',
        sources: [KAGGLE],
        downloads: [{ service: 'kaggle-token', secret: 'kaggle-token-of-the-test-xyz' }],
        routes: {},
        access: [{ ...KAGGLE_ACCESS, state: 'missing', row: false }],
        asked: []
    },
    {
        name: 'Kaggle with a row answered 200: granted',
        sources: [KAGGLE],
        downloads: ROW_OF.kaggle,
        routes: { [KAGGLE_LIST]: recorded('kaggle/list') },
        access: [{ ...KAGGLE_ACCESS, state: 'ok', row: true, status: 200 }],
        asked: [[KAGGLE_LIST, 'Basic']]
    },
    {
        name: 'Kaggle with a row answered 401: missing',
        sources: [KAGGLE],
        downloads: ROW_OF.kaggle,
        routes: { [KAGGLE_LIST]: reply(401, 'Unauthorized') },
        access: [{ ...KAGGLE_ACCESS, state: 'missing', row: true, status: 401 }],
        asked: [[KAGGLE_LIST, 'Basic']]
    },
    {
        name: 'Synapse with no row: missing, nothing asked',
        sources: [SYNAPSE],
        downloads: [],
        routes: {},
        access: [{ ...SYNAPSE_ACCESS, state: 'missing', row: false }],
        asked: []
    },
    {
        name: 'Synapse with a row answered 200: granted',
        sources: [SYNAPSE],
        downloads: ROW_OF.synapse,
        routes: { [SYNAPSE_PROFILE]: recorded('synapse/user-profile') },
        access: [{ ...SYNAPSE_ACCESS, state: 'ok', row: true, status: 200 }],
        asked: [[SYNAPSE_PROFILE, 'Bearer']]
    },
    {
        name: 'Synapse with a row answered 403: missing',
        sources: [SYNAPSE],
        downloads: ROW_OF.synapse,
        routes: { [SYNAPSE_PROFILE]: reply(403, 'Forbidden') },
        access: [{ ...SYNAPSE_ACCESS, state: 'missing', row: true, status: 403 }],
        asked: [[SYNAPSE_PROFILE, 'Bearer']]
    },
    {
        name: 'a service two sources need, one finding it missing: missing',
        sources: [MITDB, MIMIC, KAGGLE],
        downloads: ROW_OF.kaggle,
        routes: {
            [MITDB_SUMS]: recorded('physionet/mitdb', MITDB_SUMS),
            [MIMIC_SUMS]: login(200),
            [KAGGLE_LIST]: recorded('kaggle/list')
        },
        access: [
            { ...PHYSIONET, state: 'missing', row: false, status: 403 },
            { ...KAGGLE_ACCESS, state: 'ok', row: true, status: 200 }
        ],
        asked: [
            [MITDB_SUMS, 'none'],
            [MIMIC_SUMS, 'none'],
            [KAGGLE_LIST, 'Basic']
        ]
    }
];

describe('Recover access', () => {
    it.each(ROWS)('$name', async (one) => {
        const { fetch, asked } = answering(one.routes);
        const access = await accessOf(one.sources, listDeps(fetch, one.downloads));
        expect(access).toEqual(one.access);
        expect(accessGranted(access)).toBe(one.access.every((each) => each.state === 'ok'));
        expect(asked.map((each) => [each.url, scheme(each)])).toEqual(one.asked);
    });

    it('lends no credential from ~/.netrc or ~/.kaggle/kaggle.json, and passes curl no --netrc', async () => {
        const home = scratchDir('oculus-recover-netrc-');
        writeFileSync(
            join(home, '.netrc'),
            'machine physionet.org login john password netrc-pass\n'
        );
        mkdirSync(join(home, '.kaggle'));
        writeFileSync(
            join(home, '.kaggle', 'kaggle.json'),
            '{"username":"johnsmith","key":"kaggle-json-key"}'
        );
        vi.stubEnv('HOME', home);
        try {
            const { fetch, asked } = answering({
                [MIMIC_SUMS]: login(200),
                [KAGGLE_LIST]: recorded('kaggle/list')
            });
            expect(await accessOf([MIMIC, KAGGLE], listDeps(fetch, []))).toEqual([
                { ...PHYSIONET, state: 'missing', row: false, status: 403 },
                { ...KAGGLE_ACCESS, state: 'missing', row: false }
            ]);
            expect(asked.map(scheme)).toEqual(['none']);
        } finally {
            vi.unstubAllEnvs();
        }
        const script = fetchScript(
            [
                {
                    row: {
                        name: 'a.dat',
                        size: 1,
                        checksum: null,
                        url: 'https://physionet.org/files/mimiciv/3.1/a.dat',
                        source: 0,
                        service: 'physionet',
                        state: 'missing',
                        have: 0
                    },
                    resume: false
                }
            ],
            { folder: '~/data/mimiciv', log: '/l', script: '/s', configs: { physionet: '/c' } },
            'title'
        );
        expect(script).not.toContain('netrc');
    });

    it('keeps Fetch from starting while access is missing, and states the access to the view', async () => {
        const startDetached = vi.fn(() => 1);
        const local = {
            ...localDeps(scratchDir('oculus-recover-home-'), new Map()),
            startDetached
        };
        const entry = datasetOf([MIMIC], { id: 'mimiciv', path: '~/data/mimiciv' });
        const { fetch } = answering({ [MIMIC_SUMS]: login(401) });
        const target = targetOf(entry, fetch, local);
        const post = await handleRecover(
            recoverRequest({ action: 'fetch', target: 'mac', hub: 'research-hub', key: 'mimiciv' }),
            target
        );
        expect(await post.json()).toEqual({ refused: 'access' });
        expect(startDetached).not.toHaveBeenCalled();
        const state = (await (
            await handleRecoverState(
                recoverRequest(
                    new URLSearchParams({ target: 'mac', hub: 'research-hub', key: 'mimiciv' })
                ),
                target
            )
        ).json()) as { access: RecoverAccess[]; granted: boolean };
        expect(state.access).toEqual([{ ...PHYSIONET, state: 'missing', row: true, status: 401 }]);
        expect(state.granted).toBe(false);
    });
});
