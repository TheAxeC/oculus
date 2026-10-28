// Layer 2, server. Account setup's git section: what it draws of each git host of the hub's
// `sign_in` (a row with `credential_address`), and its one POST behind the page's token: `status`
// (the section with where each Sign in stands), `client_id` (save the client id of the reader's
// OAuth App), `sign_in` (start the device flow), `cancel`, and `sign_out` (take the token out).
//
// A host an action names must be a git host row of `sign_in`, and a Sign in needs the row's
// `device_code`, `token`, `user` and `git_scope` and a saved client id; a refusal is a 200 with
// the sentence (`refused`), and a body that is no such request a 400. The one action on a key no
// git host row names is Sign out of a key whose file holds a token, which deletes that file; the
// section lists each such key, and each key whose row names another address than its token was
// granted for, with its login and the sentence why git is given none. What is answered never
// holds the client id or the token: a host says whether a client id is saved and which login a
// token granted for the row's address belongs to.

import { json } from '@sveltejs/kit';
import { gitClientId, isGitHostKey } from '../../../../data/accounts/connect.ts';
import type { GitHosts, GitHostSetup, GitUnlisted } from '../../../../data/model/index.ts';
import { signInRows, textCatalog, type SignInRow } from '../../../../data/sources/config.ts';
import { gatedBody } from '../../../core/auth.ts';
import { helperCommand, helperPath } from '../../../core/git/credentials.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import { words } from '../../../core/words.ts';
import { missingSentence, signInWords, type SignInWords } from '../providers.ts';
import type { GitSignIns, SignInHost } from './signins.ts';
import {
    heldGitKeys,
    readGitHost,
    removeGitHostFile,
    removeGitToken,
    saveGitClientId
} from './store.ts';

/** The fields of a git host row a Sign in needs, in the order a missing one is named. */
const NEEDED = [
    ['deviceCode', 'device_code'],
    ['token', 'token'],
    ['user', 'user'],
    ['gitScope', 'git_scope']
] as const;

/** The row as a host a Sign in can run on, or the field it lacks as the hub's file names it. */
function hostOf(row: SignInRow): SignInHost | { lacking: string } {
    for (const [field, named] of NEEDED) {
        if (row[field] === undefined) return { lacking: named };
    }
    return {
        key: row.key,
        credentialAddress: row.credentialAddress ?? '',
        deviceCode: row.deviceCode ?? '',
        token: row.token ?? '',
        user: row.user ?? '',
        gitScope: row.gitScope ?? ''
    };
}

/** What the git section is read from. */
export type GitSection = {
    rows: readonly SignInRow[];
    words: SignInWords;
    text: Record<string, string>;
    providerDir: string;
    /** The engine folder the credential helper ships in, and the program that runs it. */
    engine: string;
    execPath: string;
};

/** The section's sources out of a merged configuration, the providers' folder and the engine. */
export function gitSectionOf(
    config: Record<string, unknown>,
    providerDir: string,
    engine: string
): GitSection {
    return {
        rows: signInRows(config),
        words: signInWords(config),
        text: textCatalog(config),
        providerDir,
        engine,
        execPath: process.execPath
    };
}

/** One host as the section draws it; a file that cannot be read is a host with nothing saved. */
function hostSetup(row: SignInRow, section: GitSection, signIns: GitSignIns | null): GitHostSetup {
    let held: ReturnType<typeof readGitHost>;
    try {
        held = readGitHost(section.providerDir, row.key);
    } catch {
        held = {};
    }
    const host = hostOf(row);
    const missing =
        'lacking' in host
            ? missingSentence({ key: row.key, field: host.lacking }, section.words)
            : '';
    const granted = held.token !== undefined && held.address === row.credentialAddress;
    return {
        key: row.key,
        name: row.name,
        register: row.register ?? '',
        address: row.credentialAddress ?? '',
        missing,
        clientSaved: held.clientId !== undefined,
        login: granted ? (held.login ?? '') : '',
        flow: signIns?.flow(row.key) ?? null
    };
}

/**
 * The keys whose file holds a token that no git host row names with the file's address, each with
 * its login and the sentence saying why git is given none: the row is gone or names no
 * `credential_address`, or it names another address. A file that cannot be read is passed over.
 */
function unlistedOf(section: GitSection): GitUnlisted[] {
    const unlisted: GitUnlisted[] = [];
    for (const key of heldGitKeys(section.providerDir)) {
        let held: ReturnType<typeof readGitHost>;
        try {
            held = readGitHost(section.providerDir, key);
        } catch {
            continue;
        }
        const row = section.rows.find((one) => one.key === key);
        if (row?.credentialAddress !== undefined && row.credentialAddress === held.address)
            continue;
        const missing =
            row?.credentialAddress === undefined
                ? words(section.text, 'accounts.git_unlisted_row', key)
                : words(section.text, 'accounts.git_unlisted_address', key);
        unlisted.push({ key, login: held.login ?? '', missing });
    }
    return unlisted;
}

/**
 * The git section: one host per git host row, the keys holding a token no row names, the sentence
 * of a hub that names none, and the sentence for a credential helper git cannot be given. With no
 * Sign ins at hand, every host's `flow` is null, which is what the unguarded read answers.
 */
export function gitHostsOf(section: GitSection, signIns: GitSignIns | null): GitHosts {
    const hosts = section.rows
        .filter((row) => row.credentialAddress !== undefined)
        .map((row) => hostSetup(row, section, signIns));
    const command = helperCommand(section.execPath, helperPath(section.engine));
    return {
        hosts,
        unlisted: unlistedOf(section),
        none: hosts.length === 0 ? words(section.text, 'accounts.git_none') : '',
        helperRefused: command === null ? words(section.text, 'accounts.git_helper_refused') : ''
    };
}

/** What the git section's route acts on: the page's token, the section, Sign ins and writes. */
export type GitTarget = {
    token: string;
    section: () => GitSection;
    signIns: GitSignIns;
    writes: FsWrites;
};

const badBody = (): Response => json({ error: 'bad body' }, { status: 400 });

/** A refusal: the sentence, answered as a 200. */
function refused(sentence: string): Response {
    return json({ refused: sentence });
}

/** One write of a host's file behind the chain; a file it cannot read or write is refused. */
async function written(target: GitTarget, work: () => void): Promise<Response> {
    try {
        await chained(target.writes, work);
    } catch (error) {
        return refused(error instanceof Error ? error.message : String(error));
    }
    return json({ ok: true });
}

/** The one POST of the git section. */
export async function handleGitSignIn(request: Request, target: GitTarget): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const section = target.section();
    if (body.action === 'status') return json(gitHostsOf(section, target.signIns));
    if (!isGitHostKey(body.key)) return badBody();
    const key = body.key;
    const row = section.rows.find((one) => one.key === key);
    if (row?.credentialAddress === undefined) {
        if (body.action === 'sign_out' && heldGitKeys(section.providerDir).includes(key)) {
            target.signIns.cancel(key);
            return written(target, () => removeGitHostFile(section.providerDir, key));
        }
        return refused(words(section.text, 'accounts.git_no_host', key));
    }
    switch (body.action) {
        case 'client_id': {
            const clientId = gitClientId(body.client_id);
            if (clientId === null) return refused(words(section.text, 'accounts.git_client_id'));
            return written(target, () => saveGitClientId(section.providerDir, key, clientId));
        }
        case 'sign_in': {
            const host = hostOf(row);
            if ('lacking' in host) {
                return refused(missingSentence({ key, field: host.lacking }, section.words));
            }
            let clientId: string | undefined;
            try {
                clientId = readGitHost(section.providerDir, key).clientId;
            } catch (error) {
                return refused(error instanceof Error ? error.message : String(error));
            }
            if (clientId === undefined) {
                return refused(words(section.text, 'accounts.git_no_client_id'));
            }
            return json({ flow: await target.signIns.start(host, clientId) });
        }
        case 'cancel':
            target.signIns.cancel(key);
            return json({ ok: true });
        case 'sign_out':
            target.signIns.cancel(key);
            return written(target, () => removeGitToken(section.providerDir, key));
        default:
            return badBody();
    }
}
