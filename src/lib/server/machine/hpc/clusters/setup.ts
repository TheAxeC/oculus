// Layer 2, server. The requests of Account setup's cluster section and of Settings' clusters rows,
// one POST behind the page's token: `read` (every cluster of `slurm.resource` with its connection,
// the key file the hub gives for it, the public key of the `.pub` file beside its key file, its
// `access` text and what `ssh -G` resolves it to, and the rows of this machine's `clusters:`),
// `make_key` (the key file made or found, with its public key), `host_key` (whether `known_hosts`
// holds the host, else its fingerprints), `trust_host` (the confirm), `put_key`, and `save` and
// `remove`, which write one `clusters:` row of the primary hub's `local.yml` through the one writer
// of such a row (`writeClusterRow`, edit/writes/config/config-key.ts, handed in by the route),
// behind the process's write chain. A public key is read from the `.pub` file alone, with no ssh
// run.
//
// A cluster an action names must be one of `slurm.resource`, and is refused with the sentence that
// it is not one before anything runs; a remove is the exception, since a row of a cluster the hub
// does not name is the reader's to take out. A refusal is a 200 with the sentence
// (`refused`), and a body that is no such request a 400. The password of `put_key` is checked to
// hold no line break and handed to put-key.ts; no answer, refusal or log carries it.

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { json } from '@sveltejs/kit';
import type {
    ClusterRow,
    ClusterSetup,
    ClusterSetupCluster
} from '../../../../data/model/index.ts';
import {
    clusterKeySettings,
    textCatalog,
    type ClusterAccount
} from '../../../../data/sources/config.ts';
import { keyFilePath, USER_NAME } from '../../../../data/sources/config/local.ts';
import { gatedBody } from '../../../core/auth.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import { words } from '../../../core/words.ts';
import {
    connectionFor,
    connectionsNow,
    hostWordsOf,
    latestResources,
    type ClusterConnection,
    type ClusterSources
} from './connections.ts';
import {
    filledKeyFile,
    hostKnown,
    makeablePath,
    makeKey,
    runKey,
    scanHost,
    trustHost,
    type HostAddress,
    type KeyRun
} from './keys.ts';
import { PUT_DEPS, putKey, type PutDeps } from './put-key.ts';
import { resolveConnection, runResolve, type ResolveRun } from './resolution.ts';

/**
 * The one writer of a `clusters:` row (`writeClusterRow` of edit/writes/config/config-key.ts,
 * which the route hands in, since that folder sits above this one): the row written, refused with
 * its sentence, or nothing to change.
 */
type ClusterRowWriter = (
    hub: string,
    resource: string,
    row: { resource: string; user: string; keyFile: string } | null,
    text: Record<string, string>
) => { path: string } | { refused: string } | null;

/**
 * What the cluster section's route acts on; `home`, `run`, `resolve` and `put` are this machine's
 * when absent.
 */
export type ClusterSetupTarget = {
    token: string;
    writeRow: ClusterRowWriter;
    /** What the clusters are read from now: the hub, the primary, the config, the rows. */
    sources: ClusterSources;
    /** The primary hub's folder, whose `local.yml` a row is written in; null with no primary. */
    hubDir: () => string | null;
    writes: FsWrites;
    /** The home folder the key file and `~/.ssh/known_hosts` are under. */
    home?: string;
    run?: KeyRun;
    resolve?: ResolveRun;
    put?: PutDeps;
};

/** A refusal: the sentence, answered as a 200. */
function refused(sentence: string): Response {
    return json({ refused: sentence });
}

const badBody = (): Response => json({ error: 'bad body' }, { status: 400 });

/** A field of the body as text, or null when it is not one. */
function textOf(body: Record<string, unknown>, name: string): string | null {
    const value = body[name];
    return typeof value === 'string' ? value : null;
}

/** The sentence naming which of the two key settings is empty and where it is set, or ''. */
function keyMissing(config: Record<string, unknown>, text: Record<string, string>): string {
    const keys = clusterKeySettings(config);
    const missing = [
        ...(keys.keyType === '' ? [words(text, 'hpc.key_missing', 'clusters.key_type')] : []),
        ...(keys.keyFile === '' ? [words(text, 'hpc.key_missing', 'clusters.key_file')] : [])
    ];
    return missing.join(' ');
}

/**
 * The key file the hub gives for a cluster, `~/` resolved, or '' with none; a path Make key would
 * refuse is '' with the sentence naming `clusters.key_file` as `refused`.
 */
function suggestedFile(
    config: Record<string, unknown>,
    resource: string,
    home: string
): { suggested: string; keyRefused: string } {
    const keys = clusterKeySettings(config);
    if (keys.keyType === '' || keys.keyFile === '') return { suggested: '', keyRefused: '' };
    const filled = filledKeyFile(keys.keyFile, keys.keyType, resource);
    const path = makeablePath(filled, home);
    if (path !== null) return { suggested: path, keyRefused: '' };
    const text = textCatalog(config);
    return { suggested: '', keyRefused: words(text, 'hpc.key_file_hub_refused', filled) };
}

/** One row of `clusters:` as Settings lists it. */
function rowOf(account: ClusterAccount): ClusterRow {
    return {
        resource: account.resource,
        user: account.user ?? '',
        keyFile: account.keyFile ?? '',
        hub: account.hub ?? ''
    };
}

/**
 * The public half of a key file, the one line of the `.pub` file beside it, or null when that file
 * cannot be read or holds more than one line. The key file itself is never read.
 */
function publicKeyOf(keyFile: string): string | null {
    try {
        const line = readFileSync(`${keyFile}.pub`, 'utf8').trim();
        return line === '' || line.includes('\n') ? null : line;
    } catch {
        return null;
    }
}

/** What the section and the Settings rows draw from. */
async function readSetup(target: ClusterSetupTarget, home: string): Promise<ClusterSetup> {
    const { sources } = target;
    const config = sources.config();
    const text = textCatalog(config);
    const entries = latestResources(sources.hub, sources.primary);
    const resolve = target.resolve ?? runResolve;
    const clusters = await Promise.all(
        connectionsNow(sources).map(async (connection): Promise<ClusterSetupCluster> => {
            const offered = suggestedFile(config, connection.resource, home);
            const start = connection.keyFile ?? offered.suggested;
            return {
                resource: connection.resource,
                name: connection.name,
                missing: connection.missing ?? '',
                host: connection.host,
                user: connection.user ?? '',
                keyFile: connection.keyFile ?? '',
                ...offered,
                publicKey: start === '' ? '' : (publicKeyOf(start) ?? ''),
                access:
                    entries !== null && Object.hasOwn(entries, connection.resource)
                        ? (entries[connection.resource].access ?? '')
                        : '',
                resolution: await resolveConnection(connection, resolve)
            };
        })
    );
    return {
        clusters,
        hint: clusters.length === 0 ? hostWordsOf(config).noCluster : '',
        keyMissing: keyMissing(config, text),
        rows: sources.accounts().map(rowOf)
    };
}

/** The connection of the cluster a body names, or the refusal that answers instead. */
function namedCluster(
    target: ClusterSetupTarget,
    body: Record<string, unknown>
): ClusterConnection | Response {
    const resource = textOf(body, 'resource');
    if (resource === null) return badBody();
    const found = connectionFor(target.sources, resource);
    if ('missing' in found) return refused(found.missing);
    return found.connection;
}

/** Where ssh connects for a cluster, as `ssh -G` says, or the refusal with ssh's line. */
async function addressOf(
    target: ClusterSetupTarget,
    connection: ClusterConnection
): Promise<HostAddress | Response> {
    const resolution = await resolveConnection(connection, target.resolve ?? runResolve);
    if (resolution === null) return refused(connection.missing ?? '');
    if ('error' in resolution) return refused(resolution.error);
    return { hostname: resolution.hostname, port: resolution.port };
}

async function makeKeyAnswer(
    target: ClusterSetupTarget,
    body: Record<string, unknown>,
    home: string
): Promise<Response> {
    const connection = namedCluster(target, body);
    if (connection instanceof Response) return connection;
    const typed = textOf(body, 'keyFile');
    if (typed === null) return badBody();
    const config = target.sources.config();
    const text = textCatalog(config);
    const missing = keyMissing(config, text);
    if (missing !== '') return refused(missing);
    const path = makeablePath(typed, home);
    if (path === null) return refused(words(text, 'hpc.key_file_refused', typed));
    const keyType = clusterKeySettings(config).keyType;
    if (keyType === '') return refused(missing);
    const made = await makeKey(path, keyType, connection.resource, target.run ?? runKey);
    if ('failed' in made) return refused(words(text, 'hpc.key_failed', made.failed));
    if ('exists' in made) {
        return json({
            path: made.exists,
            publicKey: publicKeyOf(made.exists) ?? '',
            said: words(text, 'hpc.key_exists', made.exists)
        });
    }
    return json({
        path: made.made,
        publicKey: publicKeyOf(made.made) ?? '',
        said: words(text, 'hpc.key_made', made.made)
    });
}

async function hostKeyAnswer(
    target: ClusterSetupTarget,
    body: Record<string, unknown>,
    home: string
): Promise<Response> {
    const connection = namedCluster(target, body);
    if (connection instanceof Response) return connection;
    const address = await addressOf(target, connection);
    if (address instanceof Response) return address;
    const run = target.run ?? runKey;
    if (await hostKnown(address, home, run)) return json({ known: true });
    const scanned = await scanHost(address, run);
    const text = textCatalog(target.sources.config());
    if ('failed' in scanned) return refused(words(text, 'hpc.host_scan_failed', scanned.failed));
    return json({ known: false, fingerprints: scanned.fingerprints });
}

async function trustAnswer(
    target: ClusterSetupTarget,
    body: Record<string, unknown>,
    home: string
): Promise<Response> {
    const connection = namedCluster(target, body);
    if (connection instanceof Response) return connection;
    const given: unknown = body.fingerprints;
    if (!Array.isArray(given)) return badBody();
    const seen = given.filter((one): one is string => typeof one === 'string');
    if (seen.length !== given.length) return badBody();
    const address = await addressOf(target, connection);
    if (address instanceof Response) return address;
    const done = await trustHost(address, seen, home, target.run ?? runKey);
    const text = textCatalog(target.sources.config());
    if ('failed' in done) return refused(words(text, 'hpc.host_scan_failed', done.failed));
    if ('changed' in done) return refused(words(text, 'hpc.host_changed'));
    return json({ known: true });
}

async function putKeyAnswer(
    target: ClusterSetupTarget,
    body: Record<string, unknown>,
    home: string
): Promise<Response> {
    const connection = namedCluster(target, body);
    if (connection instanceof Response) return connection;
    const user = textOf(body, 'user');
    const typedFile = textOf(body, 'keyFile');
    const password = textOf(body, 'password');
    if (user === null || typedFile === null || password === null) return badBody();
    const text = textCatalog(target.sources.config());
    if (/[\r\n]/.test(password)) return refused(words(text, 'hpc.put_line_break'));
    if (user !== '' && !USER_NAME.test(user)) return refused(words(text, 'hpc.put_user'));
    const keyFile = keyFilePath(typedFile);
    const publicKey = keyFile === null ? null : publicKeyOf(keyFile);
    if (publicKey === null) return refused(words(text, 'hpc.put_no_key', typedFile));
    const address = await addressOf(target, connection);
    if (address instanceof Response) return address;
    if (!(await hostKnown(address, home, target.run ?? runKey))) {
        return refused(words(text, 'hpc.put_host_unknown'));
    }
    const login = { host: connection.host, ...(user === '' ? {} : { user }) };
    const done = await putKey(login, password, publicKey, target.put ?? PUT_DEPS);
    if ('put' in done) return json({ said: words(text, 'hpc.put_done') });
    if ('noPassword' in done) {
        return json({
            noPassword: true,
            said: words(text, 'hpc.put_no_password'),
            publicKey,
            access: accessOf(target, connection.resource)
        });
    }
    if ('moreThanPassword' in done) return refused(words(text, 'hpc.put_more'));
    return refused(words(text, 'hpc.put_failed', done.failed));
}

/** The `access` text of a cluster's entry, or ''. */
function accessOf(target: ClusterSetupTarget, resource: string): string {
    const entries = latestResources(target.sources.hub, target.sources.primary);
    if (entries === null || !Object.hasOwn(entries, resource)) return '';
    return entries[resource].access ?? '';
}

async function rowAnswer(
    target: ClusterSetupTarget,
    body: Record<string, unknown>,
    remove: boolean
): Promise<Response> {
    const resource = textOf(body, 'resource');
    if (resource === null) return badBody();
    const text = textCatalog(target.sources.config());
    if (!remove) {
        const found = connectionFor(target.sources, resource);
        if ('unlisted' in found) return refused(found.missing);
    }
    const user = remove ? '' : textOf(body, 'user');
    const keyFile = remove ? '' : textOf(body, 'keyFile');
    if (user === null || keyFile === null) return badBody();
    const hub = target.hubDir();
    if (hub === null) return refused(words(text, 'hpc.row_no_primary'));
    const row = remove ? null : { resource, user: user.trim(), keyFile: keyFile.trim() };
    let done: ReturnType<ClusterRowWriter>;
    try {
        done = await chained(target.writes, () => target.writeRow(hub, resource, row, text));
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return refused(words(text, 'hpc.row_unwritable', reason));
    }
    if (done !== null && 'refused' in done) return refused(done.refused);
    if (done === null && remove) return refused(words(text, 'hpc.row_not_in_primary', resource));
    return json({ saved: done !== null });
}

/** The one POST of the cluster setup. */
export async function handleClusterSetup(
    request: Request,
    target: ClusterSetupTarget
): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const home = target.home ?? homedir();
    switch (body.action) {
        case 'read':
            return json(await readSetup(target, home));
        case 'make_key':
            return makeKeyAnswer(target, body, home);
        case 'host_key':
            return hostKeyAnswer(target, body, home);
        case 'trust_host':
            return trustAnswer(target, body, home);
        case 'put_key':
            return putKeyAnswer(target, body, home);
        case 'save':
            return rowAnswer(target, body, false);
        case 'remove':
            return rowAnswer(target, body, true);
        default:
            return badBody();
    }
}
