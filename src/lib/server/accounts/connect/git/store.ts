// Layer 2, server. The file of one git host of the hub's `sign_in` (a row with
// `credential_address`): `git-<key>.json` in the providers' folder, `~/.oculus/connect/`, at mode
// 0600 in a 0700 folder (connect/store.ts writes it). It holds the client id of the reader's own
// OAuth App (`client_id`) and, once a Sign in was granted, the token (`token`), the login the token
// belongs to (`login`) and the credential address it was granted for (`credential_address`).
//
// The credential address is kept with the token so that the token is handed to git for the origin
// it was granted for and no other: the arguments every git start is given
// (server/core/git/credentials.ts) name it only while the git host row of the file's key names
// that same address as its `credential_address`, and the credential helper
// (connect/credential-helper.mjs) answers from the file only for that address. A token whose row
// is taken out of `sign_in`, or names another address, is given to no git. Sign out takes the
// token, the login and the address out and keeps the client id; for a key no git host row names,
// it deletes the file (`removeGitHostFile`), and Account setup lists every such key that holds a
// token (`heldGitKeys`).
//
// Nothing here logs or answers the token or the client id; an error names the file and the field.

import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { gitHostFileName } from '../../../../data/accounts/connect.ts';
import { readRecord, writeCredentialFile } from '../store.ts';

/** What one git host's file holds, each field absent when the file names none. */
export type GitHostFile = { clientId?: string; token?: string; login?: string; address?: string };

/** The name of a git host's file, `git-<key>.json`, its key the one group. */
const GIT_FILE = /^git-([a-z0-9_-]+)\.json$/;

/** The file of one git host inside the providers' folder. */
function gitHostFile(providerDir: string, key: string): string {
    return join(providerDir, gitHostFileName(key));
}

/** A field of a record as non-empty text, or undefined. */
function textField(record: Record<string, unknown>, name: string): string | undefined {
    const value = record[name];
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/** What a file holds, read from its record. */
function hostOf(record: Record<string, unknown>): GitHostFile {
    const held: GitHostFile = {};
    const clientId = textField(record, 'client_id');
    const token = textField(record, 'token');
    const login = textField(record, 'login');
    const address = textField(record, 'credential_address');
    if (clientId !== undefined) held.clientId = clientId;
    if (token !== undefined) held.token = token;
    if (login !== undefined) held.login = login;
    if (address !== undefined) held.address = address;
    return held;
}

/**
 * What one git host's file holds, empty when the file is not there. A file that is there and is
 * not a JSON object throws the sentence naming the file.
 */
export function readGitHost(providerDir: string, key: string): GitHostFile {
    return hostOf(readRecord(gitHostFile(providerDir, key)) ?? {});
}

/** Save the client id of a git host's OAuth App, keeping every other field of its file. */
export function saveGitClientId(providerDir: string, key: string, clientId: string): void {
    const file = gitHostFile(providerDir, key);
    const held = readRecord(file) ?? {};
    writeCredentialFile(file, providerDir, { ...held, client_id: clientId });
}

/** Save the token a Sign in was granted, with its login and the address it was granted for. */
export function saveGitToken(
    providerDir: string,
    key: string,
    granted: { token: string; login: string; address: string }
): void {
    const file = gitHostFile(providerDir, key);
    const held = readRecord(file) ?? {};
    writeCredentialFile(file, providerDir, {
        ...held,
        token: granted.token,
        login: granted.login,
        credential_address: granted.address
    });
}

/** Sign out: take the token, its login and its address out of the file, keeping the client id. */
export function removeGitToken(providerDir: string, key: string): void {
    const file = gitHostFile(providerDir, key);
    const held = readRecord(file);
    if (held === null) return;
    const kept = Object.fromEntries(
        Object.entries(held).filter(
            ([name]) => name !== 'token' && name !== 'login' && name !== 'credential_address'
        )
    );
    writeCredentialFile(file, providerDir, kept);
}

/**
 * Sign out of a key no git host row names: delete its file, client id included, since no row is
 * left to sign in through. A file that is not there is nothing to do.
 */
export function removeGitHostFile(providerDir: string, key: string): void {
    rmSync(gitHostFile(providerDir, key), { force: true });
}

/** The keys whose file in the providers' folder holds a token, in the order of the names. */
export function heldGitKeys(providerDir: string): string[] {
    let names: string[];
    try {
        names = readdirSync(providerDir).sort();
    } catch {
        return [];
    }
    const keys: string[] = [];
    for (const name of names) {
        const key = GIT_FILE.exec(name)?.[1];
        if (key === undefined) continue;
        let held: GitHostFile;
        try {
            held = readGitHost(providerDir, key);
        } catch {
            continue;
        }
        if (held.token !== undefined) keys.push(key);
    }
    return keys;
}
