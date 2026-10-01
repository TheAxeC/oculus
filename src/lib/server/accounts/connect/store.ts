// Layer 2, server. The credential files: one per provider holding that provider's client half, one
// per account holding that account's refresh token, where each is, what each may hold, and the
// writes that put a half, a token or an empty account file on disk.
//
// The client half is the reader's own: a Google Desktop OAuth client's id and secret, or an Entra
// public-client application's id and tenant. The setup page writes it once per provider into
// `~/.oculus/connect/<provider>.json`, and that one application then serves every account of the
// provider in both connectors, each account still asking for its own consent and keeping its own
// token. An account file that carries a client half of its own keeps it and is read as it always
// was, so a file written by hand before the provider file existed goes on working unchanged.
// Neither half is in the tracked tree or in config/local.yml, so nothing the repository holds
// names an account of the reader's.
//
// Each connector has a folder of its own for its account files, which the kind selects, and an
// account of one connector has a file and a consent of its own even when it is the same mailbox as
// an account of the other: a calendar token never gains send rights, and a mail token never gains
// calendar rights.
//
// A calendar's published link is an account file too, `ics-<label>.json` holding `{ "url": ... }`:
// the link is the reader's key to the calendar, so it is kept as a token is, in a file of this
// folder at 0600, and never in config/local.yml.
//
// Every folder is resolved at the call and never at import, as server/core/changes.ts and
// server/machine/usage/accounts.ts resolve theirs, so a test points a connector at a directory of
// its own and a served run at the directory the machine's own file or its HOME names. Every write
// replaces the file whole through a temporary file and a rename, at mode 0600 in a 0700 folder.
//
// Nothing here logs, publishes or answers a field of a file. An error naming a field names the
// field and never its value.

import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { isMap } from '../../../data/helpers/guards.ts';
import { connectKey, type ProviderHalf } from '../../../data/accounts/connect.ts';
import type {
    AccountRow,
    ConnectAccountConfig,
    ConnectKind,
    ConnectProvider
} from '../../../data/model/index.ts';
import { writeTextAtomic } from '../../core/json.ts';

/** The mode every credential file is created and kept at: it holds the reader's own secrets. */
const MODE = 0o600;

/** The mode a credential folder is created at, for the same reason. */
const DIR_MODE = 0o700;

export type GoogleCredentials = {
    provider: 'google';
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
};

export type MicrosoftCredentials = {
    provider: 'microsoft';
    clientId: string;
    /** The Entra directory the application is registered in; `common` unless a file names one. */
    tenant: string;
    refreshToken?: string;
};

export type Credentials = GoogleCredentials | MicrosoftCredentials;

/** The client half of either provider: its credentials without the account's refresh token. */
type ClientHalf =
    Omit<GoogleCredentials, 'refreshToken'> | Omit<MicrosoftCredentials, 'refreshToken'>;

/** ~/.oculus/calendar or ~/.oculus/mail, resolved at the call rather than at import. */
export function defaultConnectDir(kind: ConnectKind): string {
    return join(homedir(), '.oculus', kind);
}

/** ~/.oculus/connect, where the one file per provider lives, resolved at the call. */
export function defaultProviderDir(): string {
    return join(homedir(), '.oculus', 'connect');
}

/** The credential file of one account inside a connector's directory. */
export function credentialFile(dir: string, account: AccountRow): string {
    return join(dir, `${connectKey(account)}.json`);
}

/** The file holding one provider's client half inside the provider directory. */
export function providerFile(providerDir: string, provider: ConnectProvider): string {
    return join(providerDir, `${provider}.json`);
}

/** What a field of a credential file holds when it is set: text with a character in it. */
const fieldShape = z.string().min(1);

/** A field of a file as a non-empty string, or undefined when it is absent or not one. */
function field(record: Record<string, unknown>, name: string): string | undefined {
    const held = fieldShape.safeParse(record[name]);
    return held.success ? held.data : undefined;
}

/**
 * One file as a JSON object, or null when it is not there. A file that is there and is not a JSON
 * object throws the sentence the view shows, which names the file and never what it held.
 */
function readRecord(file: string): Record<string, unknown> | null {
    if (!existsSync(file)) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
        throw new Error(`${file} is not JSON`);
    }
    if (!isMap(parsed)) throw new Error(`${file} must hold a JSON object`);
    return parsed;
}

/**
 * The client half one file holds, or undefined when it names no client id. A file naming a Google
 * client id and no secret is refused with the field named, since the token call cannot be made
 * without it.
 */
function halfIn(
    file: string,
    record: Record<string, unknown>,
    provider: ConnectProvider
): ClientHalf | undefined {
    const clientId = field(record, 'client_id');
    if (clientId === undefined) return undefined;
    if (provider === 'google') {
        const clientSecret = field(record, 'client_secret');
        if (clientSecret === undefined) throw new Error(`${file}: client_secret is missing`);
        return { provider, clientId, clientSecret };
    }
    return { provider, clientId, tenant: field(record, 'tenant') ?? 'common' };
}

/**
 * Whether an account's own file names a client id, which a Remove deletes with the file. A file
 * that cannot be read names none here; the poll says why it cannot be read.
 */
export function hasOwnHalf(dir: string, account: AccountRow): boolean {
    try {
        return field(readRecord(credentialFile(dir, account)) ?? {}, 'client_id') !== undefined;
    } catch {
        return false;
    }
}

/**
 * Whether this machine holds a client half for the provider, in the provider's own file. A file
 * that is there and cannot be read throws, so a broken half is said rather than read as absent.
 */
export function providerReady(providerDir: string, provider: ConnectProvider): boolean {
    const file = providerFile(providerDir, provider);
    const record = readRecord(file);
    return record !== null && halfIn(file, record, provider) !== undefined;
}

/**
 * One account's credentials, or null when no client half is on this machine for it yet. The half
 * is the account file's own when that file names a client id, and the provider file's otherwise;
 * the refresh token is always the account file's. A file that is there and cannot be read as the
 * provider's shape throws the sentence the view shows, which names the file and the field and
 * never what the field held.
 */
export function readCredentials(
    dir: string,
    account: ConnectAccountConfig,
    providerDir: string
): Credentials | null {
    const file = credentialFile(dir, account);
    const own = readRecord(file) ?? {};
    const refreshToken = field(own, 'refresh_token');
    let half = halfIn(file, own, account.provider);
    if (half === undefined) {
        const shared = providerFile(providerDir, account.provider);
        const record = readRecord(shared);
        half = record === null ? undefined : halfIn(shared, record, account.provider);
        if (half === undefined && record !== null) {
            throw new Error(`${shared}: client_id is missing`);
        }
    }
    if (half === undefined) return null;
    return half.provider === 'google' ? { ...half, refreshToken } : { ...half, refreshToken };
}

/**
 * Write one credential file whole, at 0600 in a 0700 folder. An existing file is brought to 0600
 * before the replacement is made, since the replacement takes the mode of the file it replaces and
 * a file written by hand may have been left readable by others.
 */
function writeCredentialFile(file: string, dir: string, record: Record<string, unknown>): void {
    mkdirSync(dir, { recursive: true, mode: DIR_MODE });
    if (existsSync(file)) chmodSync(file, MODE);
    writeTextAtomic(file, `${JSON.stringify(record, null, 4)}\n`, MODE);
}

/**
 * Put a refresh token into an account's file, leaving every other field of it as it was. The file
 * is made when it is not there, which is the case for an account whose client half is its
 * provider's.
 */
export function writeRefreshToken(
    dir: string,
    account: ConnectAccountConfig,
    refreshToken: string
): void {
    const file = credentialFile(dir, account);
    const held = readRecord(file) ?? {};
    writeCredentialFile(file, dir, { ...held, refresh_token: refreshToken });
}

/**
 * Keep a refresh token the provider handed back in place of the one it was sent, and only while
 * the account's file is there: a file that is gone is an account removed while its token call was
 * in flight, and writing the token would bring that account's file back.
 */
export function keepRotatedToken(
    dir: string,
    account: ConnectAccountConfig,
    refreshToken: string
): void {
    if (!existsSync(credentialFile(dir, account))) return;
    writeRefreshToken(dir, account, refreshToken);
}

/**
 * Make an added account's file, holding nothing yet when its provider file carries the client
 * half. A file that is already there is left as it is, so an account named again keeps what its
 * file held.
 */
export function writeAccountFile(dir: string, account: AccountRow): void {
    const file = credentialFile(dir, account);
    if (existsSync(file)) return;
    writeCredentialFile(file, dir, {});
}

/** Take a removed account's file away; the provider's file stays for the other accounts. */
export function removeAccountFile(dir: string, account: AccountRow): void {
    rmSync(credentialFile(dir, account), { force: true });
}

/**
 * Keep a published link in its account's file, replacing the link it held and leaving every other
 * field of it as it was.
 */
export function writePublishedLink(dir: string, account: AccountRow, url: string): void {
    const file = credentialFile(dir, account);
    const held = readRecord(file) ?? {};
    writeCredentialFile(file, dir, { ...held, url });
}

/**
 * The published link an account's file holds, or undefined when the file is not there or holds
 * none. A file that is there and cannot be read throws the sentence naming the file.
 */
export function readPublishedLink(dir: string, account: AccountRow): string | undefined {
    return field(readRecord(credentialFile(dir, account)) ?? {}, 'url');
}

/** Write one provider's client half, replacing the one that was there. */
export function writeProviderHalf(providerDir: string, half: ProviderHalf): void {
    const record =
        half.provider === 'google'
            ? { client_id: half.clientId, client_secret: half.clientSecret }
            : {
                  client_id: half.clientId,
                  ...(half.tenant === undefined ? {} : { tenant: half.tenant })
              };
    writeCredentialFile(providerFile(providerDir, half.provider), providerDir, record);
}
