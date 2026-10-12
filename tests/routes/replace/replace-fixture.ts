// Layer 4, test helper. The world the replace tests run in: a served folder and a hub folder under
// a scratch directory, the ops target over them with the search timeout of a real server, the real
// ripgrep binary through the dependency, and the posts a page makes (a replace, an undo).
//
// Every directory is under the system temporary directory, asserted before anything is written. The
// hub folder holds a stand-in `.oculus/local.yml` of the test's own, and its `.oculus` folder is
// listed as a root `dot`, which the guard on the machine's local files names, so the `protected`
// refusal is proved without any real configuration file being opened. `plantOculusLocal` plants a
// stand-in `local.yml` in the world's oculus config folder, which lies inside the hub folder and is
// also listed as a root `oculus`, so the guard on oculus's own file is proved the same way.

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect, it } from 'vitest';
import type {
    FileStamp,
    OpsRequest,
    ReplaceHit,
    ReplaceQuery
} from '../../../src/lib/data/file-ops.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleOps, type OpsTarget } from '../../../src/lib/server/files/fs/ops.ts';
import { TOKEN as OPS_TOKEN } from '../../server/files/ops-fixture.ts';
import { TOKEN, changesOf, request, target } from '../edit/write-fixture.ts';

/** The milliseconds one file's search is given, standing in for `search.timeout_s`. */
export const TIMEOUT = 10000;

export type ReplaceWorld = {
    into: PrimaryTarget;
    ops: OpsTarget;
    hub: string;
    dot: string;
    config: string;
};

/**
 * A served hub folder `hub` holding these files, and a hub `peer` whose `.oculus` folder is served
 * as the root `dot` and holds a `local.yml`.
 */
export function replaceWorld(files: Record<string, string | Buffer> = {}): ReplaceWorld {
    const into = target();
    const served = join(into.hub, 'served');
    const peerDir = join(into.hub, 'peer');
    const dotDir = join(peerDir, '.oculus');
    for (const dir of [served, dotDir]) {
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        mkdirSync(dir, { recursive: true });
    }
    for (const [name, body] of Object.entries(files)) {
        mkdirSync(join(served, name, '..'), { recursive: true });
        writeFileSync(join(served, name), body);
    }
    writeFileSync(join(dotDir, 'local.yml'), '# a stand-in of the test\nneedle: 1\n');
    const hub = realpathSync(served);
    const peer = realpathSync(peerDir);
    const dot = realpathSync(dotDir);
    const roots = [
        { key: 'hub', dir: hub, hub: true as const },
        { key: 'peer', dir: peer, hub: true as const },
        { key: 'dot', dir: dot }
    ];
    const history = join(into.hub, 'history');
    const writes = fsWrites();
    const config = join(hub, 'oculus', 'config');
    into.files = { roots: () => roots, config, history, writes };
    return {
        into,
        hub,
        dot,
        config,
        ops: {
            roots,
            config,
            writes,
            changes: into.changes,
            history,
            searchTimeout: TIMEOUT
        }
    };
}

/** The two ways the stand-in `local.yml` of oculus's config folder is reached in the world. */
export const OCULUS_LOCAL_ROUTES: [string, string, string][] = [
    ['a workspace folder over the oculus config folder', 'oculus', 'local.yml'],
    ['the hub folder that holds the oculus config folder', 'hub', 'oculus/config/local.yml']
];

/**
 * Plant a stand-in `local.yml` and an `other.yml` in the world's oculus config folder, serve the
 * folder as the root `oculus` and answer the path of the `local.yml`.
 */
export function plantOculusLocal(w: ReplaceWorld): string {
    expect(w.config.startsWith(realpathSync(tmpdir()) + sep)).toBe(true);
    mkdirSync(w.config, { recursive: true });
    const local = join(w.config, 'local.yml');
    writeFileSync(local, '# a stand-in of the test\nneedle: 1\n');
    writeFileSync(join(w.config, 'other.yml'), 'needle: 2\n');
    w.ops.roots.push({ key: 'oculus', dir: realpathSync(w.config) });
    return local;
}

/**
 * The cases of one route that must refuse oculus's own `local.yml`: for each way the file is
 * reached, plant the stand-in, send it through `send` and assert the answer is `protected` for
 * that name and the file is unchanged.
 */
export function refusesOculusLocal(
    send: (
        w: ReplaceWorld,
        before: string,
        root: string,
        path: string
    ) => Promise<{ body: unknown }>
): void {
    it.each(OCULUS_LOCAL_ROUTES)(
        "refuses `protected` for oculus's own config/local.yml, reached through %s",
        async (_where, root, path) => {
            const w = replaceWorld({ 'a.txt': 'foo\n' });
            const local = plantOculusLocal(w);
            const before = readFileSync(local, 'utf8');
            const answer = await send(w, before, root, path);
            expect(answer.body).toMatchObject({ error: 'protected', failed: `${root}/${path}` });
            expect(readFileSync(local, 'utf8')).toBe(before);
        }
    );
}

/** The query half of a replace over `q`, a literal case-insensitive one unless changed. */
export function queryOf(q: string, changes: Partial<ReplaceQuery> = {}): ReplaceQuery {
    return { q, word: false, case: false, regex: false, under: '', ...changes };
}

/** One match a replace names. */
export function hit(line: number, at: number, match: string): ReplaceHit {
    return { line, at, match };
}

type ReplaceBody = {
    query: ReplaceQuery;
    replace: string;
    preserveCase?: boolean;
    items: { root: string; path: string; hits: ReplaceHit[] }[];
};

/** POST /api/ops with a replace. */
export async function replacePost(w: ReplaceWorld, body: ReplaceBody | Record<string, unknown>) {
    const message =
        'op' in body ? body : ({ op: 'replace', preserveCase: false, ...body } as OpsRequest);
    return opsPost(w, message);
}

/**
 * One file an `lsp-edit` names: the edits to make and the hash of the bytes it is expected to hold.
 */
type LspEditFile = Extract<OpsRequest, { op: 'lsp-edit' }>['files'][number];

/** One edit of a language server: the text from one position to another replaced. */
export function lspEdit(
    from: [number, number],
    to: [number, number],
    newText: string
): LspEditFile['edits'][number] {
    return {
        range: {
            start: { line: from[0], character: from[1] },
            end: { line: to[0], character: to[1] }
        },
        newText
    };
}

/** The hash of a file's bytes the page sends as the text it expects the file to hold. */
export function hashOf(bytes: string | Buffer): string {
    return createHash('sha256').update(bytes).digest('hex');
}

/** One file of an `lsp-edit` over the text the page read, which `hash` is taken of. */
export function lspFile(
    path: string,
    read: string | Buffer,
    edits: LspEditFile['edits'],
    root = 'hub'
): LspEditFile {
    return { root, path, hash: hashOf(read), edits };
}

/** POST /api/ops with an `lsp-edit` of these files. */
export async function lspEditPost(w: ReplaceWorld, files: unknown[]) {
    return opsPost(w, { op: 'lsp-edit', files });
}

/** POST /api/ops with a `writing-fix` of these files, under the token unless it is null. */
export async function writingFixPost(
    w: ReplaceWorld,
    files: unknown[],
    token: string | null = OPS_TOKEN
) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (token !== null) headers['x-oculus-token'] = token;
    const response = await handleOps(
        new Request('http://localhost/api/ops', {
            method: 'POST',
            headers,
            body: JSON.stringify({ op: 'writing-fix', files })
        }),
        OPS_TOKEN,
        w.ops
    );
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** POST /api/ops with the token a page holds. */
async function opsPost(w: ReplaceWorld, message: unknown) {
    const response = await handleOps(
        new Request('http://localhost/api/ops', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': OPS_TOKEN },
            body: JSON.stringify(message)
        }),
        OPS_TOKEN,
        w.ops
    );
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** The records the file operations left, newest first. */
export function records(w: ReplaceWorld) {
    return changesOf(w.into).filter((one) => one.kind === 'files');
}

/** POST /api/write with the kind `undo` for the record made `at`. */
export async function undo(w: ReplaceWorld, at: string) {
    const response = await handleWrite(request({ kind: 'undo', at }), TOKEN, w.into);
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

export const stamps = (value: unknown) => value as FileStamp[];
