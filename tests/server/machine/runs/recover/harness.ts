// Layer 4, test helper. What the Recover tests run the runs through in place of the machines: a
// folder of stand-in programs (curl, tmux, sbatch, squeue) that record the argument vector each
// call was given, a login node played by the system's `sh` over a scratch home, the copier that
// sends into that home, a zip written byte by byte, and the target of the /api/recover route with
// one dataset, its sources read by the fixture rows of `recover.sources`
// (tests/server/core/reader/rows.yml).
//
// A stand-in records each call as its program's name and its arguments separated by NUL bytes, so
// a value holding a space, a quote or a line break comes back as the one argument it was.

import { spawnSync } from 'node:child_process';
import {
    chmodSync,
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    statSync,
    writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';
import type { Dataset, RecoverSource } from '../../../../../src/lib/data/model/index.ts';
import type { DownloadAccount } from '../../../../../src/lib/data/sources/config.ts';
import type { RunResult } from '../../../../../src/lib/server/machine/hpc/ssh.ts';
import type { Copier } from '../../../../../src/lib/server/machine/hpc/transfer.ts';
import type { ClusterDeps } from '../../../../../src/lib/server/machine/runs/recover/cluster.ts';
import type { LocalDeps } from '../../../../../src/lib/server/machine/runs/recover/local.ts';
import type { RecoverTarget } from '../../../../../src/lib/server/machine/runs/recover/routes.ts';
import type {
    Fetcher,
    ListDeps
} from '../../../../../src/lib/server/machine/runs/recover/files.ts';
import type { ReaderRow } from '../../../../../src/lib/data/sources/config/settings/rows/grammar.ts';
import { fixtureRows } from '../../../core/reader/rows.ts';
import { SEVEN_ZIP_FILES } from '../../../../../src/lib/server/machine/runs/recover/unpack.ts';
import { plantScratch, scratchDir } from '../../../../fixtures/scratch.ts';

/** The secrets of the `downloads` rows the tests hand Recover; none may reach a vector or a log. */
export const SECRETS = {
    physionet: 'pn-pass "with" \\ quote',
    kaggle: 'kg-key-5f1e9c',
    synapse: 'syn-token-a8d2'
};

/** A `downloads` row of each service, with the secrets above. */
export const DOWNLOADS: DownloadAccount[] = [
    { service: 'physionet', user: 'john', secret: SECRETS.physionet },
    { service: 'kaggle', user: 'johnsmith', secret: SECRETS.kaggle },
    { service: 'synapse', secret: SECRETS.synapse }
];

/** One recorded call of a stand-in: the program's name and its arguments. */
export type Call = { program: string; args: string[] };

/** A folder of stand-ins and the record they write to. */
export type Stand = { bin: string; record: string; calls: () => Call[] };

/**
 * Stand-ins for the programs named, each recording its call, printing the program's line of
 * `answers` when one is given, sleeping the program's seconds of `waits` when given, and ending
 * with code 0; a `tmux ls` with no answer lists no session. The folder also holds a `timeout`
 * that runs the program it is given, unless `timeout` is one of the names.
 */
export function standIns(
    names: string[],
    answers: Partial<Record<string, string>> = {},
    waits: Partial<Record<string, number>> = {}
): Stand {
    const bin = scratchDir('oculus-recover-bin-');
    const record = join(bin, 'calls.rec');
    if (!names.includes('timeout')) {
        writeFileSync(join(bin, 'timeout'), '#!/bin/sh\nshift\nexec "$@"\n', { mode: 0o755 });
    }
    for (const name of names) {
        const answer = answers[name];
        const wait = waits[name];
        writeFileSync(
            join(bin, name),
            [
                '#!/bin/sh',
                `{ printf '%s\\0' ${name} "$@"; printf '\\001'; } >> "${record}"`,
                ...(answer === undefined ? [] : [`printf '%s\\n' '${answer}'`]),
                ...(wait === undefined ? [] : [`sleep ${wait}`]),
                'exit 0',
                ''
            ].join('\n'),
            { mode: 0o755 }
        );
    }
    return {
        bin,
        record,
        calls: () =>
            existsSync(record)
                ? readFileSync(record, 'utf8')
                      .split('\u0001')
                      .filter((one) => one !== '')
                      .map((one) => {
                          const [program, ...args] = one.split('\u0000').slice(0, -1);
                          return { program, args };
                      })
                : []
    };
}

/** Run a command string with the system's `sh`, the stand-ins first on PATH and HOME set. */
export function shell(command: string, stand: Stand, home: string): RunResult {
    const done = spawnSync('sh', ['-c', command], {
        encoding: 'utf8',
        env: { PATH: `${stand.bin}:${process.env.PATH ?? ''}`, HOME: home, LC_ALL: 'C' }
    });
    return { stdout: done.stdout, stderr: done.stderr, code: done.status ?? 1 };
}

/** Run a script file with the system's `sh`, as the detached fetch does. */
export function shellFile(script: string, stand: Stand, home: string): RunResult {
    const done = spawnSync('sh', [script], {
        encoding: 'utf8',
        env: { PATH: `${stand.bin}:${process.env.PATH ?? ''}`, HOME: home, LC_ALL: 'C' }
    });
    return { stdout: done.stdout, stderr: done.stderr, code: done.status ?? 1 };
}

/** What a send to the played login node carried: each file's text and mode as it was sent. */
export type Sent = { to: string; name: string; text: string; mode: number };

/**
 * A login node played by `sh` over a scratch home: the runner runs each remote command string
 * there, the copier copies into it keeping each file's mode, and both record what they were given.
 */
export function loginNode(stand: Stand): {
    deps: ClusterDeps;
    remoteHome: string;
    commands: string[];
    sent: Sent[];
} {
    const remoteHome = scratchDir('oculus-recover-login-');
    const commands: string[] = [];
    const sent: Sent[] = [];
    const copy: Copier = (input) => {
        const target = input.vector.at(-1) ?? '';
        const to = join(remoteHome, target.slice(target.indexOf(':') + 1));
        mkdirSync(to, { recursive: true });
        for (const name of input.files) {
            const from = join(input.cwd, name);
            const mode = statSync(from).mode & 0o777;
            sent.push({ to, name, text: readFileSync(from, 'utf8'), mode });
            copyFileSync(from, join(to, name));
            chmodSync(join(to, name), mode);
        }
        return Promise.resolve({ stdout: '', stderr: '', code: 0 });
    };
    return {
        deps: {
            resource: 'cluster',
            connection: { host: 'login' },
            runner: (_connection, remote) => {
                commands.push(remote);
                return Promise.resolve(shell(remote, stand, remoteHome));
            },
            copy,
            home: scratchDir('oculus-recover-mac-'),
            nodeVersion: 'v24.0.0',
            nodeDownload: 'https://nodejs.org/dist',
            sevenZip: () =>
                plantScratch(
                    'oculus-recover-7z-',
                    Object.fromEntries(SEVEN_ZIP_FILES.map((name) => [name, '']))
                )
        },
        remoteHome,
        commands,
        sent
    };
}

/** A zip of stored entries, written byte by byte, by each entry's name and text. */
export function zipOf(entries: Record<string, string>): Buffer {
    const locals: Buffer[] = [];
    const centrals: Buffer[] = [];
    let offset = 0;
    for (const [name, text] of Object.entries(entries)) {
        const data = Buffer.from(text);
        const named = Buffer.from(name);
        const sum = crc32(data);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0x21, 12);
        local.writeUInt32LE(sum, 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(named.length, 26);
        const central = Buffer.alloc(46);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0x21, 14);
        central.writeUInt32LE(sum, 16);
        central.writeUInt32LE(data.length, 20);
        central.writeUInt32LE(data.length, 24);
        central.writeUInt16LE(named.length, 28);
        central.writeUInt32LE(offset, 42);
        locals.push(local, named, data);
        centrals.push(central, named);
        offset += local.length + named.length + data.length;
    }
    const directory = Buffer.concat(centrals);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(Object.keys(entries).length, 8);
    end.writeUInt16LE(Object.keys(entries).length, 10);
    end.writeUInt32LE(directory.length, 12);
    end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, directory, end]);
}

/** A dataset entry Recover runs, of the hub `research-hub`, changed by the case. */
export function datasetOf(retrieval: RecoverSource[], extra: Partial<Dataset> = {}): Dataset {
    return {
        id: 'mitdb',
        name: 'MIT-BIH',
        retrieval,
        path: '~/data/mitdb',
        recover: true,
        themes: [],
        projectIds: [],
        ...extra
    };
}

/** The rows of `recover.sources` the tests read the sources with: the fixture's (rows.yml). */
export const RECOVER_ROWS: ReaderRow[] = fixtureRows().recover;

/** The User-Agent the tests' requests carry. */
export const TEST_AGENT = 'oculus/test';

/** What a listing or an access check of the tests is given: the fetch, the rows and the agent. */
export function listDeps(fetch: Fetcher, downloads: DownloadAccount[]): ListDeps {
    return { fetch, downloads, rows: RECOVER_ROWS, agent: TEST_AGENT };
}

/**
 * The route's target over one dataset, this Mac's deps and the played cluster, when given; the
 * Recover watcher is told nothing unless the case hands it one. Every hub reads its sources with
 * the fixture's rows.
 */
export function targetOf(
    entry: Dataset,
    fetch: Fetcher,
    local: LocalDeps,
    cluster?: ClusterDeps,
    live: RecoverTarget['live'] = { changed: () => undefined, version: () => 0 }
): RecoverTarget {
    return {
        token: 'token',
        hubs: () => ['research-hub'],
        dataset: (hub, key) => (hub === 'research-hub' && key === entry.id ? entry : null),
        downloads: () => DOWNLOADS,
        rows: () => RECOVER_ROWS,
        agent: TEST_AGENT,
        fetch,
        local,
        cluster: (resource) => {
            if (resource !== 'cluster')
                return { missing: `${resource} is not listed`, unlisted: true };
            return cluster ?? { missing: 'no host' };
        },
        live
    };
}

/** A request to /api/recover: a GET with its query, or a POST of a body with the write token. */
export function recoverRequest(body: Record<string, unknown> | URLSearchParams): Request {
    if (body instanceof URLSearchParams) {
        return new Request(`http://127.0.0.1:8791/api/recover?${body.toString()}`);
    }
    return new Request('http://127.0.0.1:8791/api/recover', {
        method: 'POST',
        headers: {
            origin: 'http://127.0.0.1:8791',
            host: '127.0.0.1:8791',
            'x-oculus-token': 'token'
        },
        body: JSON.stringify(body)
    });
}
