// Layer 2, server. One account's credential file: where it is, what it may hold, and the one write
// that puts a refresh token into it.
//
// The client half of the file is the reader's own: a Google Desktop OAuth client's id and secret, or
// an Entra public-client application's id and tenant. Neither is in the tracked tree and neither is
// in config/local.yml, so nothing the repository holds names an account of the reader's. The
// connector writes one field, `refresh_token`, and reads the file at every poll.
//
// Each connector has a folder of its own, which the kind selects, and an account of one connector
// has a file and a consent of its own even when it is the same mailbox as an account of the other:
// a calendar token never gains send rights, and a mail token never gains calendar rights.
//
// The folder is resolved at the call and never at import, as server/git/changes.ts and
// server/machine/usage/accounts.ts resolve theirs, so a test points a connector at a directory of
// its own and a served run at the directory the machine's own file names.
//
// Nothing here logs, publishes or answers a field of the file. An error naming a field names the
// field and never its value.

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isMap } from '../../../data/helpers/guards.ts';
import { connectKey } from '../../../data/accounts/connect.ts';
import type { ConnectAccountConfig, ConnectKind } from '../../../data/model.ts';

/** The mode the credential file is created and kept at: it holds one account's own secrets. */
const MODE = 0o600;

/** The mode a connector's folder is created at, for the same reason. */
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
    /** The Entra directory the application is registered in; `common` unless the file names one. */
    tenant: string;
    refreshToken?: string;
};

export type Credentials = GoogleCredentials | MicrosoftCredentials;

/** ~/.oculus/calendar or ~/.oculus/mail, resolved at the call rather than at import. */
export function defaultConnectDir(kind: ConnectKind): string {
    return join(homedir(), '.oculus', kind);
}

/** The credential file of one account inside a connector's directory. */
export function credentialFile(dir: string, account: ConnectAccountConfig): string {
    return join(dir, `${connectKey(account)}.json`);
}

/** A field of the file as a non-empty string, or undefined when it is absent or not one. */
function field(record: Record<string, unknown>, name: string): string | undefined {
    const value = record[name];
    return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * One account's credentials, or null when the file is not there yet. A file that is there and
 * cannot be read as the provider's shape throws the sentence the view shows, which names the file
 * and the field and never what the field held.
 */
export function readCredentials(dir: string, account: ConnectAccountConfig): Credentials | null {
    const file = credentialFile(dir, account);
    if (!existsSync(file)) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
        throw new Error(`${file} is not JSON`);
    }
    if (!isMap(parsed)) throw new Error(`${file} must hold a JSON object`);
    const clientId = field(parsed, 'client_id');
    if (clientId === undefined) throw new Error(`${file}: client_id is missing`);
    const refreshToken = field(parsed, 'refresh_token');
    if (account.provider === 'google') {
        const clientSecret = field(parsed, 'client_secret');
        if (clientSecret === undefined) throw new Error(`${file}: client_secret is missing`);
        return { provider: 'google', clientId, clientSecret, refreshToken };
    }
    return {
        provider: 'microsoft',
        clientId,
        tenant: field(parsed, 'tenant') ?? 'common',
        refreshToken
    };
}

/**
 * Put a refresh token into an account's file, leaving every other field of it as it was, and leave
 * the file readable by its owner alone. The mode is set after the write as well as on the create,
 * since a file that already existed keeps the mode it had.
 */
export function writeRefreshToken(
    dir: string,
    account: ConnectAccountConfig,
    refreshToken: string
): void {
    const file = credentialFile(dir, account);
    mkdirSync(dir, { recursive: true, mode: DIR_MODE });
    let held: Record<string, unknown> = {};
    if (existsSync(file)) {
        const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
        if (!isMap(parsed)) throw new Error(`${file} must hold a JSON object`);
        held = parsed;
    }
    writeFileSync(file, `${JSON.stringify({ ...held, refresh_token: refreshToken }, null, 4)}\n`, {
        mode: MODE
    });
    chmodSync(file, MODE);
}
