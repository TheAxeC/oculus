// Layer 4, server test. Where Recover writes and how its values reach a program (G113). A hub, key
// or `path:` that would read as an option or name a folder outside `~/data`, and a file name from
// a source that is absolute or climbs out, are refused before any process starts. On this Mac the
// fetch script is run by the system's `sh` with a stand-in curl that records its argument vector,
// and the unpack is the real 7z-wasm run on zips written byte by byte, a source's folder inside
// the archive taken alone and refused when the archive holds it in another letter case, as a file,
// as a link or empty, and when it is absolute or climbs out, and an archive 7-Zip ends with code
// 2 (a link it ignores as dangerous) placing nothing; on the cluster each remote command string is
// run by `sh` over a scratch home in place of the login node, with stand-ins for tmux, sbatch and
// curl. A credential of `downloads` is followed from its config file (mode 600) to its removal,
// and looked for in every vector, command string, script and log.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type {
    RecoverCredential,
    RecoverSource,
    RecoverState
} from '../../../../../src/lib/data/model/index.ts';
import type { DownloadAccount } from '../../../../../src/lib/data/sources/config.ts';
import {
    clusterPlace,
    jobFolder,
    startClusterFetch,
    startClusterJob
} from '../../../../../src/lib/server/machine/runs/recover/cluster.ts';
import {
    localDeps,
    localPlace,
    recoverFiles,
    startLocalFetch,
    startLocalUnpack,
    type LocalDeps,
    type LocalRuns
} from '../../../../../src/lib/server/machine/runs/recover/local.ts';
import {
    credentialFiles,
    fetchItems,
    type PlanRow
} from '../../../../../src/lib/server/machine/runs/recover/plan.ts';
import {
    handleRecover,
    handleRecoverState
} from '../../../../../src/lib/server/machine/runs/recover/routes.ts';
import {
    UNPACK_PROGRAM,
    unpackVector
} from '../../../../../src/lib/server/machine/runs/recover/unpack.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import {
    DOWNLOADS,
    SECRETS,
    datasetOf,
    loginNode,
    recoverRequest,
    shell,
    shellFile,
    standIns,
    targetOf,
    zipOf,
    type Call
} from './harness.ts';
import { answering, ranged } from './recorded.ts';

/** A name that holds a space, a single quote and a command substitution. */
const ODD = "it's a $(touch pwned) file.dat";

/** A folder inside an archive that holds a space, a single quote and a command substitution. */
const ODD_FOLDER = "Training data/it's $(touch pwned)";

/** The zip each folder case unpacks: two files below `A/B` and one below `C`. */
const NESTED = { 'A/B/x.txt': 'x', 'A/B/sub/y.txt': 'y', 'C/z.txt': 'z' };

/**
 * A zip whose named entries are symbolic links made on Unix, each entry's text its link's target:
 * the central directory's "made by" gives Unix, and the high half of its external attributes the
 * link's mode.
 */
function withLinks(zip: Buffer, links: string[]): Buffer {
    const end = zip.length - 22;
    let at = zip.readUInt32LE(end + 16);
    for (let count = zip.readUInt16LE(end + 10); count > 0; count -= 1) {
        const length = zip.readUInt16LE(at + 28);
        if (links.includes(zip.toString('utf8', at + 46, at + 46 + length))) {
            zip.writeUInt16LE((3 << 8) | 20, at + 4);
            zip.writeUInt32LE((0o120777 << 16) >>> 0, at + 38);
        }
        at += 46 + length + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
    }
    return zip;
}

/** A row of the plan, missing unless the case says otherwise. */
function row(extra: Partial<PlanRow>): PlanRow {
    return {
        name: 'a.dat',
        size: 10,
        checksum: { kind: 'sha256', value: 'a'.repeat(64) },
        url: 'https://physionet.org/files/mitdb/1.0.0/a.dat',
        source: 0,
        state: 'missing',
        have: 0,
        ...extra
    };
}

/** How the fixture rows carry a secret: PhysioNet's and Kaggle's user, Synapse's bearer header. */
const BASIC: RecoverCredential = { basic: true };
const BEARER: RecoverCredential = { header: 'Authorization', prefix: 'Bearer ' };

/** The three rows each fetch case takes: an odd name, a partial file and a Synapse file. */
const ROWS: PlanRow[] = [
    row({
        name: ODD,
        url: "https://physionet.org/files/mitdb/1.0.0/it's%20a.dat",
        service: 'physionet',
        credential: BASIC
    }),
    row({
        name: 'part.dat',
        state: 'partial',
        have: 4,
        service: 'physionet',
        credential: BASIC
    }),
    row({
        name: 'syn/b.dat',
        url: 'https://www.synapse.org/file/b',
        service: 'synapse',
        credential: BEARER,
        throttle: '2M'
    }),
    row({ name: 'held.dat', state: 'verified', have: 10 })
];

/** This Mac's deps over a scratch home, with the fetch's start and the process reading replaced. */
function macDeps(startDetached: LocalDeps['startDetached']): LocalDeps {
    return {
        ...localDeps(scratchDir('oculus-recover-home-'), new Map()),
        processOf: () => null,
        startDetached
    };
}

/** The transfers of a recorded curl call, split at `--next`. */
function transfers(call: Call): string[][] {
    const out: string[][] = [[]];
    for (const arg of call.args) {
        if (arg === '--next') out.push([]);
        else out[out.length - 1].push(arg);
    }
    return out;
}

/** The argument after a flag in a transfer. */
function after(transfer: string[], flag: string): string | undefined {
    const at = transfer.indexOf(flag);
    return at === -1 ? undefined : transfer[at + 1];
}

/**
 * Whether a text holds any secret of `downloads`, by the first seven characters of each, so a
 * secret written with its quotes escaped is found too.
 */
function holdsSecret(text: string): boolean {
    return Object.values(SECRETS).some((secret) => text.includes(secret.slice(0, 7)));
}

type PlaceRow = {
    name: string;
    hub: string;
    key: string;
    path: string | undefined;
    part: string | null;
};

const PLACES: PlaceRow[] = [
    {
        name: 'a key that reads as an option',
        hub: 'research-hub',
        key: '--output',
        path: '~/data/mitdb',
        part: null
    },
    {
        name: 'a key with a slash',
        hub: 'research-hub',
        key: 'a/b',
        path: '~/data/mitdb',
        part: null
    },
    {
        name: 'a hub that reads as an option',
        hub: '-x',
        key: 'mitdb',
        path: '~/data/mitdb',
        part: null
    },
    { name: 'a path outside ~/data', hub: 'research-hub', key: 'mitdb', path: '/etc', part: null },
    {
        name: 'a path that climbs out of ~/data',
        hub: 'research-hub',
        key: 'mitdb',
        path: '~/data/../etc',
        part: null
    },
    {
        name: 'a path that is ~/data itself',
        hub: 'research-hub',
        key: 'mitdb',
        path: '~/data',
        part: null
    },
    {
        name: 'a path beside ~/data',
        hub: 'research-hub',
        key: 'mitdb',
        path: '~/database/x',
        part: null
    },
    {
        name: 'a path with an empty part',
        hub: 'research-hub',
        key: 'mitdb',
        path: '~/data/a//b',
        part: null
    },
    { name: 'no path', hub: 'research-hub', key: 'mitdb', path: undefined, part: null },
    {
        name: 'a folder under ~/data',
        hub: 'research-hub',
        key: 'mitdb',
        path: '~/data/physionet/mitdb/',
        part: 'physionet/mitdb'
    }
];

type NameRow = { name: string; source: RecoverSource; refused: string };

const URL_A = 'https://h.example/a.dat';

const NAMES: NameRow[] = [
    {
        name: 'a name that climbs out',
        source: { kind: 'url', urls: [{ url: URL_A, name: '../x' }] },
        refused: '../x'
    },
    {
        name: 'an absolute name',
        source: { kind: 'url', urls: [{ url: URL_A, name: '/abs' }] },
        refused: '/abs'
    },
    {
        name: 'a name that climbs out inside the address',
        source: { kind: 'url', urls: [{ url: 'https://h.example/d/%2E%2E%2Fx' }] },
        refused: '../x'
    },
    {
        name: 'an into folder that climbs out',
        source: { kind: 'url', urls: [{ url: URL_A }], into: '../up' },
        refused: '../up'
    },
    {
        name: 'a name two files share',
        source: { kind: 'url', urls: [{ url: URL_A }, { url: 'https://h.example/b/a.dat' }] },
        refused: 'a.dat'
    }
];

type ConfigRow = {
    name: string;
    account: DownloadAccount;
    credential: RecoverCredential;
    text: string | null;
};

const CONFIGS: ConfigRow[] = [
    {
        name: 'PhysioNet: the user and the secret, quotes and backslashes escaped',
        account: DOWNLOADS[0],
        credential: BASIC,
        text: 'user = "john:pn-pass \\"with\\" \\\\ quote"\n'
    },
    {
        name: 'Kaggle: the user and the key',
        account: DOWNLOADS[1],
        credential: BASIC,
        text: 'user = "johnsmith:kg-key-5f1e9c"\n'
    },
    {
        name: 'Synapse: the token as a header',
        account: DOWNLOADS[2],
        credential: BEARER,
        text: 'header = "Authorization: Bearer syn-token-a8d2"\n'
    },
    {
        name: 'a secret with a line break: no config',
        account: { service: 'kaggle', user: 'u', secret: 'a\nb' },
        credential: BASIC,
        text: null
    }
];

describe('Recover writes only inside its folders', () => {
    it.each(PLACES)('places $name', (one) => {
        const home = '/Users/someone';
        const local = localPlace(home, one.hub, one.key, one.path);
        const cluster = clusterPlace(one.hub, one.key, one.path);
        if (one.part === null) {
            expect(local).toBeNull();
            expect(cluster).toBeNull();
        } else {
            expect(local?.folder).toBe(join(home, 'data', one.part));
            expect(cluster?.folder).toBe(`~/data/${one.part}`);
        }
    });

    it.each(NAMES)('refuses $name before anything is fetched', async (one) => {
        const { fetch } = answering({ 'https://h.example/*': ranged(5) });
        const target = targetOf(datasetOf([one.source]), fetch, macDeps(vi.fn(() => 1)));
        const query = new URLSearchParams({ target: 'mac', hub: 'research-hub', key: 'mitdb' });
        const answer = await handleRecoverState(recoverRequest(query), target);
        expect(((await answer.json()) as RecoverState).refusal).toEqual({
            refused: 'name',
            source: 'url',
            label: 'Address',
            name: one.refused
        });
    });

    it.each([
        {
            name: 'a key that reads as an option',
            key: '--output',
            path: '~/data/mitdb',
            status: 400,
            refused: 'dataset'
        },
        {
            name: 'a key with a slash',
            key: 'mit/db',
            path: '~/data/mitdb',
            status: 400,
            refused: 'dataset'
        },
        { name: 'a path outside ~/data', key: 'mitdb', path: '/etc', status: 400, refused: 'place' }
    ])('refuses a fetch of $name before any process starts, on either machine', async (one) => {
        const stand = standIns(['tmux', 'curl']);
        const node = loginNode(stand);
        const startDetached = vi.fn(() => 1);
        const local = macDeps(startDetached);
        const entry = datasetOf([{ kind: 'url', urls: [{ url: URL_A }] }], { path: one.path });
        const { fetch } = answering({ [URL_A]: ranged(5) });
        for (const where of ['mac', 'cluster']) {
            const answer = await handleRecover(
                recoverRequest({
                    action: 'fetch',
                    target: where,
                    hub: 'research-hub',
                    key: one.key
                }),
                targetOf(entry, fetch, local, node.deps)
            );
            expect(answer.status).toBe(one.status);
            expect(await answer.json()).toEqual({ refused: one.refused });
        }
        expect(startDetached).not.toHaveBeenCalled();
        expect(node.commands).toEqual([]);
        expect(stand.calls()).toEqual([]);
        expect(existsSync(join(local.home, 'data'))).toBe(false);
    });
});

describe('a credential reaches curl only through its config file', () => {
    it.each(CONFIGS)('$name', (one) => {
        const items = fetchItems([
            row({ name: 'a.dat', service: one.account.service, credential: one.credential })
        ]);
        const files = credentialFiles(items, [one.account]);
        const text = one.text;
        expect(files).toEqual(text === null ? null : [{ service: one.account.service, text }]);
    });

    it(
        'fetches on this Mac with each value one argument and no credential outside its file',
        { tags: ['slow'] },
        () => {
            const stand = standIns(['curl']);
            const seen: { script: string; configs: Record<string, number | null> } = {
                script: '',
                configs: {}
            };
            let home = '';
            const deps = macDeps((script) => {
                seen.script = readFileSync(script, 'utf8');
                for (const service of ['physionet', 'kaggle', 'synapse'] as const) {
                    const file = recoverFiles(home, 'research-hub', 'mitdb').config(service);
                    seen.configs[service] = existsSync(file) ? statSync(file).mode & 0o777 : null;
                }
                expect(shellFile(script, stand, home).code).toBe(0);
                return 4242;
            });
            home = deps.home;
            const files = recoverFiles(home, 'research-hub', 'mitdb');
            mkdirSync(files.dir, { recursive: true });
            writeFileSync(files.config('kaggle'), 'left by an earlier run');
            writeFileSync(files.script, 'left by an earlier run');
            const place = localPlace(home, 'research-hub', 'mitdb', '~/data/mitdb');
            if (place === null) throw new Error('the place is refused');

            expect(startLocalFetch(place, fetchItems(ROWS), DOWNLOADS, deps)).toBeNull();

            expect(seen.configs).toEqual({ physionet: 0o600, kaggle: null, synapse: 0o600 });
            expect(holdsSecret(seen.script)).toBe(false);
            const calls = stand.calls();
            expect(calls.map((one) => one.program)).toEqual(['curl']);
            const sent = transfers(calls[0]);
            expect(sent.map((one) => after(one, '-o'))).toEqual([ODD, 'part.dat', 'syn/b.dat']);
            expect(sent.map((one) => one.at(-1))).toEqual(ROWS.slice(0, 3).map((one) => one.url));
            expect(sent.map((one) => after(one, '-C'))).toEqual([undefined, '-', undefined]);
            expect(sent.map((one) => after(one, '--limit-rate'))).toEqual([
                undefined,
                undefined,
                '2M'
            ]);
            expect(sent.map((one) => after(one, '--config'))).toEqual([
                files.config('physionet'),
                files.config('physionet'),
                files.config('synapse')
            ]);
            expect(calls[0].args.some(holdsSecret)).toBe(false);
            expect(existsSync(files.config('physionet'))).toBe(false);
            expect(existsSync(files.config('synapse'))).toBe(false);
            expect(existsSync(files.script)).toBe(false);
            expect(existsSync(files.config('kaggle'))).toBe(false);
            expect(holdsSecret(readFileSync(files.log, 'utf8'))).toBe(false);
            expect(readdirSync(join(home, 'data', 'mitdb'))).toEqual([]);
        }
    );

    it.each([
        {
            name: 'a secret with a line break',
            downloads: [{ service: 'physionet' as const, user: 'u', secret: 'a\nb' }]
        },
        { name: 'no row of the service', downloads: [] }
    ])('starts no fetch on this Mac with $name, and leaves no config file', (one) => {
        const startDetached = vi.fn(() => 1);
        const deps = macDeps(startDetached);
        const place = localPlace(deps.home, 'research-hub', 'mitdb', '~/data/mitdb');
        if (place === null) throw new Error('the place is refused');
        expect(startLocalFetch(place, fetchItems(ROWS.slice(0, 1)), one.downloads, deps)).toBe(
            'credential'
        );
        expect(startDetached).not.toHaveBeenCalled();
        expect(readdirSync(recoverFiles(deps.home, 'research-hub', 'mitdb').dir)).toEqual([]);
    });

    it(
        'fetches on the cluster with each value one shell word and no credential outside its file',
        { tags: ['slow'] },
        async () => {
            const stand = standIns(['curl', 'tmux']);
            const node = loginNode(stand);
            const remote = join(node.remoteHome, '.oculus', 'recover', 'research-hub');
            mkdirSync(remote, { recursive: true });
            writeFileSync(join(remote, 'mitdb.kaggle.curl'), 'left by an earlier run');
            const place = clusterPlace('research-hub', 'mitdb', '~/data/mitdb');
            if (place === null) throw new Error('the place is refused');

            expect(
                await startClusterFetch(place, fetchItems(ROWS), DOWNLOADS, node.deps)
            ).toBeNull();

            expect(node.commands.some(holdsSecret)).toBe(false);
            expect(node.sent.map((one) => [one.name, one.mode, holdsSecret(one.text)])).toEqual([
                ['mitdb.physionet.curl', 0o600, true],
                ['mitdb.synapse.curl', 0o600, true],
                ['mitdb.fetch.sh', 0o600, false]
            ]);
            const stage = join(jobFolder(node.deps.home, 'research-hub', 'cluster'), 'mitdb.stage');
            expect(existsSync(stage)).toBe(false);
            expect(existsSync(join(remote, 'mitdb.kaggle.curl'))).toBe(false);
            const tmux = stand.calls().filter((one) => one.program === 'tmux');
            expect(tmux.map((one) => one.args)).toEqual([
                ['-L', 'oculus-recover', 'ls', '-F', '#{session_name}'],
                [
                    '-L',
                    'oculus-recover',
                    'new-session',
                    '-d',
                    '-s',
                    'research-hub-mitdb',
                    `sh "$HOME"/'.oculus/recover/research-hub/mitdb.fetch.sh'`
                ]
            ]);

            expect(shell(tmux[1].args[6], stand, node.remoteHome).code).toBe(0);

            const curl = stand.calls().filter((one) => one.program === 'curl');
            const sent = transfers(curl[0]);
            expect(sent.map((one) => after(one, '-o'))).toEqual([ODD, 'part.dat', 'syn/b.dat']);
            expect(sent.map((one) => after(one, '-C'))).toEqual([undefined, '-', undefined]);
            expect(sent.map((one) => after(one, '--config'))).toEqual([
                join(remote, 'mitdb.physionet.curl'),
                join(remote, 'mitdb.physionet.curl'),
                join(remote, 'mitdb.synapse.curl')
            ]);
            expect(curl[0].args.some(holdsSecret)).toBe(false);
            expect(readdirSync(remote)).toEqual([]);
            const log = readFileSync(join(node.remoteHome, 'data', 'mitdb', 'recover.log'), 'utf8');
            expect(log).toContain('fetch: 3 files');
            expect(holdsSecret(log)).toBe(false);
            expect(readdirSync(join(node.remoteHome, 'data', 'mitdb'))).toEqual(['recover.log']);
        }
    );

    it(
        'starts no fetch on the cluster with a secret that has a line break, and sends nothing',
        { tags: ['slow'] },
        async () => {
            const stand = standIns(['tmux']);
            const node = loginNode(stand);
            const place = clusterPlace('research-hub', 'mitdb', '~/data/mitdb');
            if (place === null) throw new Error('the place is refused');
            const downloads = [{ service: 'physionet' as const, user: 'u', secret: 'a\nb' }];
            expect(
                await startClusterFetch(place, fetchItems(ROWS.slice(0, 1)), downloads, node.deps)
            ).toBe('credential');
            expect(node.sent).toEqual([]);
            expect(stand.calls().map((one) => one.args[2])).toEqual(['ls']);
            const stage = join(jobFolder(node.deps.home, 'research-hub', 'cluster'), 'mitdb.stage');
            expect(existsSync(stage)).toBe(false);
        }
    );
});

describe('the cluster jobs and the unpack take each value as one argument', () => {
    it.each([
        {
            action: 'verify' as const,
            words: 'the checksum and the file name',
            unpack: { strip: 2, folder: ODD_FOLDER },
            line: /^check /,
            want: ['sha256', 'a'.repeat(64), ODD]
        },
        {
            action: 'unpack' as const,
            words: 'the file name, the strip and the folder',
            unpack: { strip: 2, folder: ODD_FOLDER },
            line: /^unpack '/,
            want: [ODD, '2', ODD_FOLDER]
        },
        {
            action: 'unpack' as const,
            words: 'the file name, the strip and no folder',
            unpack: { strip: 0 },
            line: /^unpack '/,
            want: [ODD, '0', '']
        }
    ])(
        'the $action job reads $words each as one word, and sbatch its script',
        { tags: ['slow'] },
        async (one) => {
            const stand = standIns(['curl', 'sbatch', 'tmux'], { sbatch: '4567' });
            const node = loginNode(stand);
            const place = clusterPlace('research-hub', 'mitdb', '~/data/mitdb');
            if (place === null) throw new Error('the place is refused');
            const rows = [row({ name: ODD, state: 'present', have: 10, unpack: one.unpack })];
            expect(await startClusterJob(one.action, place, rows, node.deps)).toBeNull();
            expect(stand.calls().find((call) => call.program === 'sbatch')?.args).toEqual([
                '--parsable',
                `research-hub-mitdb-${one.action}.sh`
            ]);
            const sent = join(
                node.remoteHome,
                '.oculus',
                'recover',
                'jobs',
                `research-hub-mitdb-${one.action}.sh`
            );
            const script = readFileSync(sent, 'utf8');
            const line = script.split('\n').find((text) => one.line.test(text)) ?? '';
            const record = join(scratchDir('oculus-recover-words-'), 'words');
            const fn = line.split(' ')[0];
            shell(`${fn}() { printf '%s\\0' "$@" > ${record}; }; ${line}`, stand, node.remoteHome);
            expect(readFileSync(record, 'utf8').split('\0').slice(0, -1)).toEqual(one.want);
            expect(
                existsSync(join(node.deps.home, '.oculus', 'recover', 'research-hub', 'jobs'))
            ).toBe(false);
        }
    );

    it('passes the program, each path and the folder of an unpack as one argument each', () => {
        const input = {
            archive: "/d/it's a set.zip",
            work: '/d/.recover-unpack-k',
            target: '/d',
            strip: 1,
            folder: ODD_FOLDER
        };
        expect(unpackVector(input, '/7z')).toEqual([
            '-e',
            UNPACK_PROGRAM,
            '/7z',
            "/d/it's a set.zip",
            '/d/.recover-unpack-k',
            '/d',
            '1',
            ODD_FOLDER
        ]);
    });

    it.each<{
        name: string;
        archive: string;
        entries: Record<string, string>;
        links?: string[];
        strip: number;
        folder?: string;
        after: string[];
        texts: Record<string, string>;
        said?: string;
    }>([
        {
            name: 'unpacks a zip into its folder, its first folder stripped',
            archive: "my 'set'.zip",
            entries: { 'top/a.txt': 'A', 'top/sub/b.txt': 'B' },
            strip: 1,
            after: ['a.txt', "my 'set'.zip", 'sub'],
            texts: { 'a.txt': 'A', 'sub/b.txt': 'B' }
        },
        {
            name: 'keeps a name that climbs out, and an absolute one, inside the folder',
            archive: 'slip.zip',
            entries: { '../evil.txt': 'x', '/abs.txt': 'y', 'ok.txt': 'z' },
            strip: 0,
            after: ['abs.txt', 'evil.txt', 'ok.txt', 'slip.zip'],
            texts: { 'evil.txt': 'x', 'abs.txt': 'y', 'ok.txt': 'z' }
        },
        {
            name: 'unpacks only the folder a source names, its contents at the top of the folder',
            archive: 'set.zip',
            entries: NESTED,
            strip: 0,
            folder: 'A/B',
            after: ['set.zip', 'sub', 'x.txt'],
            texts: { 'x.txt': 'x', 'sub/y.txt': 'y' }
        },
        {
            name: 'unpacks the folder a source names with the strip counted below it',
            archive: 'set.zip',
            entries: NESTED,
            strip: 1,
            folder: 'A',
            after: ['set.zip', 'sub', 'x.txt'],
            texts: { 'x.txt': 'x', 'sub/y.txt': 'y' }
        },
        {
            name: 'moves nothing from an archive that holds no folder of that name',
            archive: 'set.zip',
            entries: NESTED,
            strip: 0,
            folder: 'A/Q',
            after: ['set.zip'],
            texts: {},
            said: 'unpack failed: the archive holds no folder A/Q'
        },
        {
            name: "moves nothing for a folder that differs from the archive's in letter case",
            archive: 'set.zip',
            entries: NESTED,
            strip: 0,
            folder: 'a/b',
            after: ['set.zip'],
            texts: {},
            said: 'unpack failed: the archive holds no folder a/b'
        },
        {
            name: 'moves nothing for a folder that is a file in the archive',
            archive: 'set.zip',
            entries: NESTED,
            strip: 0,
            folder: 'A/B/x.txt',
            after: ['set.zip'],
            texts: {},
            said: 'unpack failed: the archive holds no folder A/B/x.txt'
        },
        {
            name: 'moves nothing for a folder that is empty in the archive',
            archive: 'set.zip',
            entries: { 'A/E/': '', 'A/F/f.txt': 'f' },
            strip: 0,
            folder: 'A/E',
            after: ['set.zip'],
            texts: {},
            said: 'unpack failed: the folder A/E in the archive is empty'
        },
        {
            name: 'moves nothing for a folder that is a link the archive holds',
            archive: 'set.zip',
            entries: { 'A/B/x.txt': 'x', 'A/L': 'B' },
            links: ['A/L'],
            strip: 0,
            folder: 'A/L',
            after: ['set.zip'],
            texts: {},
            said: 'unpack failed: the archive holds no folder A/L'
        },
        ...['A/B', undefined].map((folder) => ({
            name: `${folder === undefined ? 'with no folder' : `with the folder ${folder}`}, places nothing when 7-Zip ends with code 2`,
            archive: 'set.zip',
            entries: { 'A/B/x.txt': 'x', 'A/M': '../..' },
            links: ['A/M'],
            strip: 0,
            folder,
            after: ['set.zip'],
            texts: {},
            said: 'unpack failed: 7-Zip ended with code 2 on set.zip'
        })),
        ...['../up', '/abs', 'A/../../up'].map((folder) => ({
            name: `refuses the folder ${folder} and moves nothing`,
            archive: 'set.zip',
            entries: NESTED,
            strip: 0,
            folder,
            after: ['set.zip'],
            texts: {},
            said: `unpack failed: the archive holds no folder ${folder}`
        }))
    ])('$name', { tags: ['slow'], timeout: 90000 }, async (one) => {
        const runs: LocalRuns = new Map();
        let told = (): void => undefined;
        const ended = new Promise<void>((resolve) => (told = resolve));
        const deps = localDeps(scratchDir('oculus-recover-home-'), runs, () => told());
        const place = localPlace(deps.home, 'research-hub', 'mitdb', '~/data/mitdb');
        if (place === null) throw new Error('the place is refused');
        mkdirSync(place.folder, { recursive: true });
        writeFileSync(
            join(place.folder, one.archive),
            withLinks(zipOf(one.entries), one.links ?? [])
        );
        const rows = [
            row({
                name: one.archive,
                state: 'present',
                have: 1,
                checksum: null,
                unpack: {
                    strip: one.strip,
                    ...(one.folder === undefined ? {} : { folder: one.folder })
                }
            })
        ];

        expect(startLocalUnpack(place, rows, deps)).toBeNull();
        await ended;
        expect(runs.size).toBe(0);

        expect(readdirSync(deps.home).sort()).toEqual(['.oculus', 'data']);
        expect(readdirSync(join(deps.home, 'data'))).toEqual(['mitdb']);
        expect(readdirSync(place.folder).sort()).toEqual(one.after);
        for (const [name, text] of Object.entries(one.texts)) {
            expect(readFileSync(join(place.folder, name), 'utf8')).toBe(text);
        }
        const log = readFileSync(recoverFiles(deps.home, 'research-hub', 'mitdb').log, 'utf8');
        expect(log).toContain(`unpack: ${one.said ?? `unpacked ${one.archive}`}`);
        expect(log).not.toContain('7-Zip warned');
    });
});
