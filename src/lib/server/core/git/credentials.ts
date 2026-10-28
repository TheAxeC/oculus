// Layer 2, server. What every git oculus starts is given so that git asks oculus's credential
// helper (server/accounts/connect/credential-helper.mjs) for the token of a git host the reader
// signed in to in Account setup. A token is handed over only while the primary hub's `sign_in`
// holds a git host row whose key is the token file's and whose `credential_address` is the address
// the file was granted for: for each such file in `~/.oculus/connect/` (`git-<key>.json`, written
// by server/accounts/connect/git/store.ts), two config pairs on that address:
// `credential.<address>.helper` set to the empty value, which clears the helpers the reader's own
// config names for that address so none of them answers first, then set to
// `!ELECTRON_RUN_AS_NODE=1 '<process.execPath>' '<helper path>' '<key>' '<address>'`, the helper
// named for the one file and address it may answer from. A token whose row is taken out of
// `sign_in`, or whose row names another address, is given to no git, and Account setup lists it
// with its Sign out. A git started by oculus takes the pairs as `-c` arguments before its
// subcommand (`args` of `GitCredentials`); a terminal takes them as `GIT_CONFIG_COUNT`,
// `GIT_CONFIG_KEY_<n>` and `GIT_CONFIG_VALUE_<n>` (`env`), which a shell that sets
// `GIT_CONFIG_COUNT` itself replaces.
//
// The values in the helper's shell line are oculus's own two paths, a row key (FORM_PATTERNS
// row_key) and an https origin (FORM_PATTERNS https_origin), each in single quotes; neither form
// holds a quote, and a path holding a single quote would end its quote, so it sets no helper at
// all (`helperCommand` answers null), which is a finding on `sign_in` while it names a git host
// (`helperFindings`) and which Account setup's git section says. No token is in an argument or a
// variable: git runs the helper, and the helper reads the token from the file.
//
// It sits in server/core, below every folder that starts git. It holds no state: the server
// context (root/context.ts) builds one `GitCredentials` over the rows root/live-settings.ts last
// read from the merged configuration and passes it to every git start and terminal, in each module
// graph the server runs as. The rows and the folder are read again at each start, so a Sign in, a
// Sign out or a change of a row holds for the next git. A file that cannot be read is passed over,
// since a git start must not fail on it.

import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isMap } from '../../../data/helpers/guards.ts';
import type { Finding } from '../../../data/model/index.ts';
import { engineDir } from '../../../data/places/engine-dir.ts';
import {
    keyFile,
    signInRows,
    textCatalog,
    type ConfigWhere,
    type SignInRow
} from '../../../data/sources/config.ts';
import { FORM_PATTERNS } from '../../../data/sources/config/catalog/value-rule.ts';
import { words } from '../words.ts';

/** `~/.oculus/connect`, the folder of the providers' and the git hosts' files, at the call. */
export function connectFolder(): string {
    return join(homedir(), '.oculus', 'connect');
}

/** Where the credential helper ships, from the checkout or the app's folder. */
const HELPER_SOURCE = join('src', 'lib', 'server', 'accounts', 'connect', 'credential-helper.mjs');

/** The helper's path under an engine folder. */
export function helperPath(engine: string): string {
    return join(engine, HELPER_SOURCE);
}

/**
 * The shell line git runs the helper with, or null when either path holds a single quote, which
 * the line quotes it in.
 */
export function helperCommand(execPath: string, helper: string): string | null {
    if (execPath.includes("'") || helper.includes("'")) return null;
    return `!ELECTRON_RUN_AS_NODE=1 '${execPath}' '${helper}'`;
}

/**
 * The finding of a configuration whose `sign_in` names a git host while git cannot be given the
 * helper, since the path of the program this process runs on or of the helper under the engine
 * holds a single quote; none otherwise.
 */
export function helperFindings(
    where: ConfigWhere,
    config: Record<string, unknown>,
    execPath: string = process.execPath
): Finding[] {
    const hosts = signInRows(config).filter((row) => row.credentialAddress !== undefined);
    if (hosts.length === 0 || helperCommand(execPath, helperPath(where.engine)) !== null) return [];
    const message = words(textCatalog(config), 'findings.config.git_helper_quote');
    return [{ file: keyFile(where, 'sign_in'), key: 'sign_in', message }];
}

/** The name of a git host's file: `git-`, a row key, `.json`; the key is its one group. */
const HOST_FILE = /^git-([a-z0-9_-]+)\.json$/;

/** A field of a parsed file as non-empty text, or undefined. */
function textField(record: Record<string, unknown>, name: string): string | undefined {
    const value = record[name];
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/** A signed-in git host: the key of its file and row, and the address its token was granted for. */
type SignedIn = { key: string; address: string };

/**
 * Every git host whose file holds a token granted for an https origin that the git host row of
 * its key names as its `credential_address`, in the order of the files' names; a file that cannot
 * be read, holds no such address, or has no such row is passed over.
 */
function signedInHosts(folder: string, rows: readonly SignInRow[]): SignedIn[] {
    let names: string[];
    try {
        names = readdirSync(folder)
            .filter((name) => HOST_FILE.test(name))
            .sort();
    } catch {
        return [];
    }
    const hosts: SignedIn[] = [];
    for (const name of names) {
        const key = HOST_FILE.exec(name)?.[1] ?? '';
        let parsed: unknown;
        try {
            parsed = JSON.parse(readFileSync(join(folder, name), 'utf8'));
        } catch {
            continue;
        }
        if (!isMap(parsed) || textField(parsed, 'token') === undefined) continue;
        const address = textField(parsed, 'credential_address');
        if (address === undefined || !FORM_PATTERNS.https_origin.test(address)) continue;
        if (rows.some((row) => row.key === key && row.credentialAddress === address)) {
            hosts.push({ key, address });
        }
    }
    return hosts;
}

/**
 * The config pairs for the signed-in hosts: the clearing value, then the helper named for the
 * host's key and address.
 */
function credentialPairs(hosts: readonly SignedIn[], command: string | null): [string, string][] {
    if (command === null) return [];
    return hosts.flatMap(({ key, address }): [string, string][] => [
        [`credential.${address}.helper`, ''],
        [`credential.${address}.helper`, `${command} '${key}' '${address}'`]
    ]);
}

/**
 * Where the pairs are read from: the connect folder, the engine the helper ships under, and the
 * program that runs it.
 */
export type CredentialPlaces = { folder: string; engine: string; execPath: string };

/** This machine's places, read at the call. */
function machinePlaces(): CredentialPlaces {
    return { folder: connectFolder(), engine: engineDir(), execPath: process.execPath };
}

/**
 * The config pairs every git oculus starts and every terminal it opens is given, read again at
 * each call from the rows of `sign_in` and the files of the connect folder as they stand then.
 * `args` is them as `-c` arguments before a git's subcommand, each pair one `-c` and one
 * `<key>=<value>`; `env` is them as the `NAME=value` variables git reads config from its
 * environment by, none with no pair.
 */
export type GitCredentials = { args(): string[]; env(): string[] };

/**
 * The credentials over the rows `rows` answers at each call and the places `places` answers. The
 * server context builds one, over the primary hub's `sign_in` as the server last read it, and hands
 * it to every part that starts git or opens a terminal. With no git host row naming an address, the
 * connect folder is not read.
 */
export function gitCredentials(
    rows: () => readonly SignInRow[],
    places: () => CredentialPlaces = machinePlaces
): GitCredentials {
    const pairs = (): [string, string][] => {
        const held = rows();
        if (!held.some((row) => row.credentialAddress !== undefined)) return [];
        const at = places();
        const command = helperCommand(at.execPath, helperPath(at.engine));
        return credentialPairs(signedInHosts(at.folder, held), command);
    };
    return {
        args: () => pairs().flatMap(([key, value]) => ['-c', `${key}=${value}`]),
        env: () => {
            const all = pairs();
            if (all.length === 0) return [];
            return [
                `GIT_CONFIG_COUNT=${String(all.length)}`,
                ...all.flatMap(([key, value], at) => [
                    `GIT_CONFIG_KEY_${String(at)}=${key}`,
                    `GIT_CONFIG_VALUE_${String(at)}=${value}`
                ])
            ];
        }
    };
}
