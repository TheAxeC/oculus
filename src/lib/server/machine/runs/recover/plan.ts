// Layer 2, server. A Recover plan: each listed file against what the target folder holds, stated
// verified, present, partial, different or missing, the totals, and the files a Fetch takes.
//
// A file is verified only when a check row of `<key>.checks.json` (verify.ts) matches the file's
// size and modification time and holds the checksum the source lists; a row with another checksum
// makes it different, and a row whose size or time no longer matches is stale and leaves the file
// present. A file smaller than the source states is partial and one larger is different. A file
// whose source states no checksum, or no size, is present once it is there at the size stated.
// Nothing here reads a file's bytes: the plan is the disk's sizes and times against the list.
//
// The files a Fetch takes become one shell script that either machine runs (`fetchScript`), and a
// credential reaches curl through a config file of its own (`curlConfig`), never the script.

import type {
    RecoverChecksum,
    RecoverCredential,
    RecoverFileState,
    RecoverRow,
    RecoverTotals
} from '../../../../data/model/index.ts';
import type { DownloadAccount } from '../../../../data/sources/config.ts';
import { shellWord } from '../../pty/shell-word.ts';
import { safeName, type RemoteFile } from './files.ts';

/** What a file of the plan is on the target. */
type FileState = RecoverFileState;

/** A file on the disk: its size in bytes and its modification time in whole seconds. */
export type OnDisk = { size: number; mtime: number };

/** A check row: the file it was made for, at its size and time, and the checksum it computed. */
export type CheckRow = { name: string; size: number; mtime: number; checksum: RecoverChecksum };

/** One row of the plan: the listed file, its state and the bytes the target holds of it. */
export type PlanRow = RecoverRow;

/** A letter or digit first, then letters, digits, `.`, `_` and `-`. */
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/**
 * Whether a hub's name or a dataset's key can stand in a file name and a session name of Recover:
 * one that starts with a dash or holds a slash would read as an option or a path.
 */
export function validName(value: string): boolean {
    return NAME.test(value);
}

/**
 * The part of a dataset's `path:` below `~/data/`, or null when the path is not under `~/data` or
 * holds a part that climbs or is not a plain name, so Recover writes nowhere else.
 */
export function dataPart(path: string | undefined): string | null {
    if (!path?.startsWith('~/data/')) return null;
    const rest = path.slice('~/data/'.length).replace(/\/+$/, '');
    return safeName(rest) ? rest : null;
}

/** The plan's totals: files, the bytes they make, the bytes a Fetch needs and the free space. */
export type PlanTotals = RecoverTotals;

/** The state of one file against the disk and its check row. */
function stateOf(
    file: RemoteFile,
    disk: OnDisk | undefined,
    check: CheckRow | undefined
): FileState {
    if (disk === undefined) return 'missing';
    if (file.size !== null && disk.size < file.size) return 'partial';
    if (file.size !== null && disk.size > file.size) return 'different';
    if (file.checksum === null) return 'present';
    if (check?.size !== disk.size || check.mtime !== disk.mtime) return 'present';
    const same =
        check.checksum.kind === file.checksum.kind &&
        check.checksum.value.toLowerCase() === file.checksum.value.toLowerCase();
    return same ? 'verified' : 'different';
}

/** The plan of the listed files against the disk's files and the check rows, with its totals. */
export function planOf(
    files: RemoteFile[],
    disk: Map<string, OnDisk>,
    checks: CheckRow[],
    free: number | null
): { rows: PlanRow[]; totals: PlanTotals } {
    const checked = new Map(checks.map((row) => [row.name, row]));
    const rows = files.map((file) => {
        const held = disk.get(file.name);
        return {
            ...file,
            state: stateOf(file, held, checked.get(file.name)),
            have: held?.size ?? 0
        };
    });
    const fetched = fetchList(rows);
    return {
        rows,
        totals: {
            files: rows.length,
            bytes: rows.reduce((sum, row) => sum + (row.size ?? 0), 0),
            missing: fetched.reduce((sum, row) => sum + bytesToFetch(row), 0),
            unsized: fetched.filter((row) => row.size === null).length,
            free
        }
    };
}

/** The bytes a Fetch of a row still needs: the rest of a partial file, all of any other. */
function bytesToFetch(row: PlanRow): number {
    if (row.size === null) return 0;
    return row.state === 'partial' ? row.size - row.have : row.size;
}

/** One file a Fetch takes, and whether its download resumes from the bytes on the disk. */
export type FetchItem = { row: PlanRow; resume: boolean };

/**
 * The rows a Fetch takes: the missing, partial and different files, or of those only the one named.
 * A partial file resumes where it stopped; a different file is fetched again from its first byte.
 */
function fetchList(rows: PlanRow[], only?: string): PlanRow[] {
    return rows.filter(
        (row) =>
            (row.state === 'missing' || row.state === 'partial' || row.state === 'different') &&
            (only === undefined || row.name === only)
    );
}

/** The fetch items of the rows a Fetch takes, each partial one resumed. */
export function fetchItems(rows: PlanRow[], only?: string): FetchItem[] {
    return fetchList(rows, only).map((row) => ({ row, resume: row.state === 'partial' }));
}

/** The rows Verify checks: each file on the disk at its full size whose source lists a checksum. */
export function verifyList(rows: PlanRow[]): PlanRow[] {
    return rows.filter(
        (row) =>
            row.checksum !== null &&
            (row.state === 'present' || row.state === 'verified' || row.state === 'different') &&
            (row.size === null || row.have === row.size)
    );
}

/** The archives Unpack opens: files of an unpacking source, on the disk at their full size. */
export function unpackList(rows: PlanRow[]): PlanRow[] {
    return rows.filter(
        (row) =>
            row.unpack !== undefined &&
            ARCHIVE.test(row.name) &&
            (row.state === 'present' || row.state === 'verified')
    );
}

/** The names 7-Zip opens as archives. */
const ARCHIVE = /\.(zip|7z|rar|tar|tgz|tar\.gz|tar\.bz2|tar\.xz)$/i;

/**
 * A path as one shell word: a path under the home folder (`~/...`) as `"$HOME"/` followed by the
 * rest quoted, so the shell of either machine puts its own home in front, and any other path
 * quoted whole.
 */
export function pathWord(path: string): string {
    return path.startsWith('~/') ? `"$HOME"/${shellWord(path.slice(2))}` : shellWord(path);
}

/** A rate curl's `--limit-rate` takes: digits and an optional unit letter. */
const RATE = /^\d+[kKmMgG]?$/;

/** A text curl reads inside double quotes, or null when it holds a line break. */
function quotedForCurl(value: string): string | null {
    if (/[\r\n]/.test(value)) return null;
    return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

/**
 * The text of a curl config file carrying a `downloads` row's secret the way the file's
 * `recover.sources` row says: `user` with the row's user and secret for `basic`, else the header
 * the row names with its prefix and the secret (such as `Authorization: Bearer <token>`). Null
 * when a value holds a line break, which no config line can carry, or `basic` has no user.
 */
function curlConfig(account: DownloadAccount, credential: RecoverCredential): string | null {
    if ('basic' in credential) {
        if (account.user === undefined) return null;
        const user = quotedForCurl(`${account.user}:${account.secret}`);
        return user === null ? null : `user = ${user}\n`;
    }
    const header = quotedForCurl(
        `${credential.header}: ${credential.prefix ?? ''}${account.secret}`
    );
    return header === null ? null : `header = ${header}\n`;
}

/** One credential file of a Fetch: the `downloads` row it carries and the file's text. */
export type CredentialFile = { service: string; text: string };

/**
 * The credential file of each `downloads` row the items' files need, in the items' order. Null
 * when a row is absent, when its name cannot stand in a file name, or when a value cannot go in a
 * config file, so no Fetch starts with a file it cannot sign in for.
 */
export function credentialFiles(
    items: FetchItem[],
    downloads: readonly DownloadAccount[]
): CredentialFile[] | null {
    const files: CredentialFile[] = [];
    for (const { row } of items) {
        const service = row.service;
        if (service === undefined || files.some((one) => one.service === service)) continue;
        const account = downloads.find((one) => one.service === service);
        if (account === undefined || row.credential === undefined || !validName(service))
            return null;
        const text = curlConfig(account, row.credential);
        if (text === null) return null;
        files.push({ service, text });
    }
    return files;
}

/** Where a fetch script runs: its dataset folder, its log, its own file and its config files. */
export type ScriptPlace = {
    /** The dataset's folder, `~/...` or absolute. */
    folder: string;
    log: string;
    script: string;
    /** The config file of each `downloads` row a file of the fetch needs. */
    configs: Record<string, string>;
};

/**
 * The shell script of a Fetch: a trap that removes its config files and itself when it ends
 * however it ends, the dataset's folder made before its output is appended to the log (on the
 * cluster the log is in that folder), and curl runs whose transfers are joined by `--next`, each
 * with its own options: `-C -` for a file that resumes, `--limit-rate` for a throttled source,
 * `--config` for one that needs a credential. Every value is one shell word, and no credential is
 * in the text: only the path of the config file that holds it. The script ends with the code of
 * the last curl that failed, or 0.
 */
export function fetchScript(items: FetchItem[], place: ScriptPlace, title: string): string {
    const configs = Object.values(place.configs).map(pathWord);
    const sections = items.map(({ row, resume }) => {
        const config = row.service === undefined ? undefined : place.configs[row.service];
        return [
            '--fail',
            '-L',
            '--retry',
            '5',
            '-sS',
            '--create-dirs',
            '-w',
            shellWord('fetched %{http_code} %{size_download} %{filename_effective}\\n'),
            ...(resume ? ['-C', '-'] : []),
            ...(row.throttle !== undefined && RATE.test(row.throttle)
                ? ['--limit-rate', shellWord(row.throttle)]
                : []),
            ...(config === undefined ? [] : ['--config', pathWord(config)]),
            '-o',
            shellWord(row.name),
            shellWord(row.url)
        ].join(' ');
    });
    return [
        '#!/bin/sh',
        `# ${title}`,
        `trap ${shellWord(`rm -f ${[...configs, pathWord(place.script)].join(' ')}`)} EXIT`,
        "trap 'exit 143' HUP INT TERM",
        `mkdir -p ${pathWord(place.folder)} || exit 1`,
        `exec >> ${pathWord(place.log)} 2>&1`,
        'say() { printf \'%s %s\\n\' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }',
        `say ${shellWord(`fetch: ${items.length} files`)}`,
        `cd ${pathWord(place.folder)} || exit 1`,
        'code=0',
        ...batches(sections).map((batch) => `curl ${batch.join(' --next ')} || code=$?`),
        'say "fetch: curl ended with code $code"',
        'exit $code',
        ''
    ].join('\n');
}

/** How many transfers one curl of a fetch script runs, so no command line passes the limit. */
const TRANSFERS_PER_CURL = 200;

/** The sections in runs of TRANSFERS_PER_CURL. */
function batches(sections: string[]): string[][] {
    const out: string[][] = [];
    for (let at = 0; at < sections.length; at += TRANSFERS_PER_CURL) {
        out.push(sections.slice(at, at + TRANSFERS_PER_CURL));
    }
    return out;
}
