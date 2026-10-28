// Layer 2, server. The key setup of Account setup's cluster section that runs on this machine: the
// path of a cluster's key file, which the hub's `clusters.key_file` gives with `{type}` and
// `{resource}` put in and the reader may change before the key is made; Make key, which runs
// `ssh-keygen` and never overwrites a key file that is there; and the host's key, which
// `ssh-keyscan` reads when `~/.ssh/known_hosts` does not hold the host, shown as its SHA256
// fingerprints and appended to that file only once the reader has confirmed them.
//
// The host is the one `ssh -G` resolves the connection to (clusters/resolution.ts), with its port,
// since the host of a cluster entry may be an alias of the reader's ssh configuration, which
// `ssh-keyscan` cannot read, and `known_hosts` names the host ssh connects to, `[host]:port` for a
// port other than 22. The confirm carries the fingerprints the reader saw: the key is read again
// and appended only when it gives the same ones, so what is trusted is what was shown.
//
// Every program is started with an argument vector and no shell through the injected `KeyRun`, so
// a test answers without starting `ssh-keygen` or `ssh-keyscan`, and the home folder is handed in,
// so a test points the key and `known_hosts` at a folder of its own.

import { execFile } from 'node:child_process';
import {
    appendFileSync,
    existsSync,
    mkdirSync,
    openSync,
    readSync,
    closeSync,
    statSync
} from 'node:fs';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import type { KeyType } from '../../../../data/sources/config.ts';

/** How long one program of the key setup is given; `ssh-keyscan` gives up on its own after 8 s. */
const KEY_MS = 20000;

/** What a program printed and whether it ended well, or the start's error as its standard error. */
export type KeyRun = (
    program: string,
    args: string[],
    input?: string
) => Promise<{ stdout: string; stderr: string; ok: boolean }>;

/** The real run of a program with an argument vector, no shell, and its input closed. */
export const runKey: KeyRun = (program, args, input) =>
    new Promise((answer) => {
        const child = execFile(program, args, { timeout: KEY_MS }, (error, stdout, stderr) => {
            answer({
                stdout,
                stderr: stderr || (error === null ? '' : error.message),
                ok: error === null
            });
        });
        child.stdin?.on('error', () => undefined);
        child.stdin?.end(input ?? '');
    });

/** What the last part of a key file's path the setup makes may hold. */
const KEY_NAME = /^[A-Za-z0-9._-]+$/;

/**
 * The path of a key file Make key may make: `~/` resolved against `home`, lying under `home`, its
 * last part letters, digits, dots, dashes and underscores, not ending in `.pub` and holding no
 * single quote; null for any other.
 */
export function makeablePath(value: string, home: string): string | null {
    const path = value.startsWith('~/') ? join(home, value.slice(2)) : value;
    if (!isAbsolute(path)) return null;
    const full = resolve(path);
    const inside = relative(home, full);
    if (inside === '' || inside.startsWith('..') || isAbsolute(inside)) return null;
    const name = basename(full);
    if (!KEY_NAME.test(name) || name.endsWith('.pub')) return null;
    return full;
}

/** The path `clusters.key_file` gives for one cluster, before it is checked. */
export function filledKeyFile(template: string, keyType: KeyType, resource: string): string {
    return template.replaceAll('{type}', keyType).replaceAll('{resource}', resource);
}

/** What Make key did: made the key, found one there it uses as it is, or failed with a line. */
export type MadeKey = { made: string } | { exists: string } | { failed: string };

/**
 * Make the key at `path` (already checked by makeablePath): `ssh-keygen -t <type> -f <path> -N ''
 * -C oculus-<resource>`, each its own argument, with no passphrase. A key file or its `.pub` that
 * is there is used as it is and nothing runs; the folder is made at mode 0700 when it is missing.
 * The input is closed, so a `ssh-keygen` that found a file made in between and asks whether to
 * overwrite it reads no answer and overwrites nothing.
 */
export async function makeKey(
    path: string,
    keyType: KeyType,
    resource: string,
    run: KeyRun = runKey
): Promise<MadeKey> {
    if (existsSync(path) || existsSync(`${path}.pub`)) return { exists: path };
    mkdirSync(join(path, '..'), { recursive: true, mode: 0o700 });
    const done = await run('ssh-keygen', [
        '-t',
        keyType,
        '-f',
        path,
        '-N',
        '',
        '-C',
        `oculus-${resource}`
    ]);
    if (!done.ok) return { failed: firstLine(done.stderr) };
    return { made: path };
}

/** The first line of a program's error output that holds a character. */
export function firstLine(text: string): string {
    return (text.split('\n').find((line) => line.trim() !== '') ?? '').trim();
}

/** The host ssh connects to, as `ssh -G` resolved it, and its port. */
export type HostAddress = { hostname: string; port: string };

/** The name `known_hosts` holds the host by: the host for port 22, else `[host]:port`. */
function knownName(address: HostAddress): string {
    return address.port === '' || address.port === '22'
        ? address.hostname
        : `[${address.hostname}]:${address.port}`;
}

/** The reader's `~/.ssh/known_hosts` under a home folder. */
function knownHostsFile(home: string): string {
    return join(home, '.ssh', 'known_hosts');
}

/** Whether `known_hosts` holds the host (`ssh-keygen -F`, which exits 0 when it does). */
export async function hostKnown(
    address: HostAddress,
    home: string,
    run: KeyRun = runKey
): Promise<boolean> {
    const file = knownHostsFile(home);
    if (!existsSync(file)) return false;
    const done = await run('ssh-keygen', ['-F', knownName(address), '-f', file]);
    return done.ok && done.stdout.trim() !== '';
}

/** The host's key as `ssh-keyscan` read it, with its fingerprints, or the line it failed with. */
export type ScannedKey = { lines: string[]; fingerprints: string[] } | { failed: string };

/**
 * Read the host's key with `ssh-keyscan` (the host one argument after `--`) and its SHA256
 * fingerprints with `ssh-keygen -E sha256 -lf -` over the lines it printed.
 */
export async function scanHost(address: HostAddress, run: KeyRun = runKey): Promise<ScannedKey> {
    const port = address.port === '' ? '22' : address.port;
    const scanned = await run('ssh-keyscan', ['-T', '8', '-p', port, '--', address.hostname]);
    const lines = scanned.stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '' && !line.startsWith('#'));
    if (lines.length === 0) return { failed: firstLine(scanned.stderr) };
    const printed = await run('ssh-keygen', ['-E', 'sha256', '-lf', '-'], `${lines.join('\n')}\n`);
    if (!printed.ok) return { failed: firstLine(printed.stderr) };
    const fingerprints = printed.stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
    return { lines, fingerprints };
}

/** Whether a file's last byte is a line break, true for an empty file. */
function endsInBreak(file: string): boolean {
    const size = statSync(file).size;
    if (size === 0) return true;
    const handle = openSync(file, 'r');
    try {
        const last = Buffer.alloc(1);
        readSync(handle, last, 0, 1, size - 1);
        return last[0] === 0x0a;
    } finally {
        closeSync(handle);
    }
}

/** What the confirm of a host's key did: trusted it, found it trusted, or why it did neither. */
export type Trusted = { trusted: true } | { changed: true } | { failed: string };

/**
 * Trust the host's key the reader confirmed: read it again, and when its fingerprints are the ones
 * the reader saw (`seen`), append its lines to `known_hosts` (the file at mode 0600 and its folder
 * at 0700 when they are made), after a line break when the file's last line has none. A host the
 * file holds by now is left as it is.
 */
export async function trustHost(
    address: HostAddress,
    seen: readonly string[],
    home: string,
    run: KeyRun = runKey
): Promise<Trusted> {
    if (await hostKnown(address, home, run)) return { trusted: true };
    const scanned = await scanHost(address, run);
    if ('failed' in scanned) return scanned;
    const same =
        scanned.fingerprints.length === seen.length &&
        scanned.fingerprints.every((one, at) => one === seen[at]);
    if (!same) return { changed: true };
    const file = knownHostsFile(home);
    mkdirSync(join(home, '.ssh'), { recursive: true, mode: 0o700 });
    const lead = existsSync(file) && !endsInBreak(file) ? '\n' : '';
    appendFileSync(file, `${lead}${scanned.lines.join('\n')}\n`, { mode: 0o600 });
    return { trusted: true };
}
