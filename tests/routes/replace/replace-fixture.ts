// Layer 4, test helper. The world the replace tests run in: a served folder and an engine folder
// under a scratch directory, the ops target over them with the search timeout of a real server,
// the real ripgrep binary through the dependency, and the posts a page makes (a replace, an
// undo).
//
// Every directory is under the system temporary directory, asserted before anything is written.
// The engine folder holds a stand-in `local.yml` of the test's own, which the guard on the
// machine's local file names, so the `protected` refusal is proved without any real configuration
// file being opened.

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import type {
    FileStamp,
    OpsRequest,
    ReplaceHit,
    ReplaceQuery
} from '../../../src/lib/data/file-ops.ts';
import { handleWrite } from '../../../src/lib/server/edit/writes.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleOps, type OpsTarget } from '../../../src/lib/server/files/fs/ops.ts';
import { TOKEN as OPS_TOKEN } from '../../server/files/ops-fixture.ts';
import { TOKEN, changesOf, request, target } from '../edit/write-fixture.ts';

/** The milliseconds one file's search is given, standing in for `search.timeout_s`. */
export const TIMEOUT = 10000;

export type ReplaceWorld = { into: WriteTarget; ops: OpsTarget; hub: string; engine: string };

/** A served folder `hub` holding these files and an `engine` folder holding a `local.yml`. */
export function replaceWorld(files: Record<string, string | Buffer> = {}): ReplaceWorld {
    const into = target();
    const served = join(into.hub, 'served');
    const engineDir = join(into.hub, 'engine');
    for (const dir of [served, engineDir]) {
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        mkdirSync(dir, { recursive: true });
    }
    for (const [name, body] of Object.entries(files)) {
        mkdirSync(join(served, name, '..'), { recursive: true });
        writeFileSync(join(served, name), body);
    }
    writeFileSync(join(engineDir, 'local.yml'), '# a stand-in of the test\nneedle: 1\n');
    const hub = realpathSync(served);
    const engine = realpathSync(engineDir);
    const roots = [
        { key: 'hub', dir: hub },
        { key: 'engine', dir: engine }
    ];
    const history = join(into.hub, 'history');
    const writes = fsWrites();
    into.files = { roots: () => roots, history, writes };
    return {
        into,
        hub,
        engine,
        ops: {
            roots,
            writes,
            changes: into.changes,
            hub: into.hub,
            history,
            searchTimeout: TIMEOUT
        }
    };
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
