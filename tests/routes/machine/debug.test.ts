// Layer 2, route tests. POST /api/debug: the write token every action needs, and the approval of
// the text a launch runs. The handler is called with a scratch repository as the one served root, a
// scratch home for the approvals file, and a debug client whose `spawn` records its calls and
// returns a child of in-memory streams, so no adapter starts. Add Configuration runs over a writer
// with a change log of its own, and its writes are read back as History lists them and taken back
// by the undo of the Files view.
//
// What this does NOT cover: the origin rule, which hooks.server.ts applies to every request under
// /api/ ahead of a route seeing it (tests/server/root/hooks-server.test.ts), and the adapter's
// side of the protocol, which a real `rite_dap` answers.
// @module-tag slow: a launch row runs over the 5 s limit on a loaded machine.

import { EventEmitter } from 'node:events';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { readChanges, type Change } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { undoFiles } from '../../../src/lib/server/edit/writes/file-undo.ts';
import type { WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import type { OpsTarget } from '../../../src/lib/server/files/fs/ops.ts';
import { defaultApprovalsPath } from '../../../src/lib/server/machine/approvals/approvals.ts';
import {
    handleDebugPost,
    type DebugRouteOptions
} from '../../../src/lib/server/machine/debug/routes.ts';
import { DebugClient } from '../../../src/lib/server/machine/debug/session.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import {
    enterHome,
    leaveHome,
    plantRepo
} from '../../server/machine/runs/commands/commands-fixture.ts';

const TOKEN = 'the write token of this test';
const HOST = 'http://127.0.0.1:8791';

/** A child whose streams are in memory and whose kill is recorded. */
class FakeChild extends EventEmitter {
    pid = 4242;
    stdin = new PassThrough();
    stdout = new PassThrough();
    stderr = new PassThrough();
    kill(): boolean {
        return true;
    }
}

let repo = '';
let base = '';
let client: DebugClient;
let spawned: { command: string; args: readonly string[]; cwd: string }[] = [];

beforeEach(() => {
    enterHome();
    base = scratchDir('oculus-debug-writes-');
    ops = fsWrites();
    // The change log waits on a chain of its own, as the process's does, apart from the writes'.
    changeLog = { file: join(base, 'changes.jsonl'), keep: 500, writes: fsWrites() };
    spawned = [];
    repo = plantRepo(
        {
            'a.rite': '(print 1)\n',
            'b.rite': '(print 2)\n',
            '.oculus/launch.yml':
                'configurations:\n    - name: run\n      program: a.rite\n    - name: other\n      program: b.rite\n'
        },
        []
    );
    client = new DebugClient({
        hub: new Hub(),
        spawn: (command, args, options) => {
            spawned.push({ command, args, cwd: options.cwd });
            return new FakeChild();
        },
        adapter: () => 'rite_dap',
        catalog: () => textCatalog(loadConfig(engineDir()).config)
    });
});

afterEach(() => {
    client.close();
    leaveHome();
});

/** One writer over the repository, with the change log History lists and a history folder. */
const writer = (): OpsTarget => ({
    roots: [{ key: 'repo', dir: repo }],
    writes: ops,
    changes: changeLog,
    history: join(base, 'history')
});

let ops = fsWrites();
let changeLog = { file: '', keep: 500, writes: fsWrites() };

function mine(): DebugRouteOptions {
    return {
        rootsFor: () => [repo],
        approvalsFor: () => defaultApprovalsPath(),
        configFor: () => loadConfig(engineDir()).config,
        writes: fsWrites(),
        files: writer,
        client
    };
}

/** The launch of one configuration, as the page posts it. */
function launching(name: string): Record<string, unknown> {
    return { action: 'launch', repo, name, context: {}, breakpoints: [], functions: [], watch: [] };
}

async function post(body: unknown): Promise<{ status: number; body: unknown }> {
    const response = await handleDebugPost(
        pagePost(`${HOST}/api/debug`, body, TOKEN),
        TOKEN,
        mine()
    );
    return { status: response.status, body: await response.json() };
}

describe('POST /api/debug', () => {
    it('refuses a request without the write token', async () => {
        const bare = new Request(`${HOST}/api/debug`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
            body: JSON.stringify({ action: 'continue' })
        });
        expect((await handleDebugPost(bare, TOKEN, mine())).status).toBe(403);
        const wrong = pagePost(`${HOST}/api/debug`, launching('run'), 'wrong');
        expect((await handleDebugPost(wrong, TOKEN, mine())).status).toBe(403);
        expect(spawned).toEqual([]);
    });

    it('runs a debug launch only after its exact text is approved', async () => {
        const first = await post(launching('run'));
        expect(first.body).toEqual({ approve: { name: 'run', cwd: '.', program: 'a.rite' } });
        expect(spawned).toEqual([]);

        const approved = await post({ action: 'approve', repo, cwd: '.', program: 'a.rite' });
        expect(approved.body).toEqual({ ok: true });

        const changed = await post(launching('other'));
        expect(changed.body).toEqual({ approve: { name: 'other', cwd: '.', program: 'b.rite' } });
        expect(spawned).toEqual([]);

        const started = await post(launching('run'));
        expect(started.body).toEqual({ ok: true });
        expect(spawned).toEqual([{ command: 'rite_dap', args: [`${repo}/a.rite`], cwd: repo }]);
    });

    describe('Add Configuration', () => {
        const added = { name: 'third', type: 'rite', program: 'a.rite' };
        const launch = (): string => join(repo, '.oculus', 'launch.yml');

        /** The `at` of each write this case undid, which the History route records as `undoes`. */
        let undone = new Set<string>();
        beforeEach(() => {
            undone = new Set();
        });

        /** The writes History lists that no undo has taken back, newest first. */
        function listedWrites(): Change[] {
            return readChanges(changeLog).filter((one) => !undone.has(one.at));
        }

        /** Undo the newest write History lists, the way its Undo button does. */
        async function undoNewest(): Promise<Change> {
            const newest = listedWrites()[0];
            const target = {
                files: {
                    roots: () => writer().roots,
                    history: join(base, 'history'),
                    writes: ops
                }
            } as unknown as WriteTarget;
            const done = await undoFiles(target, newest, {
                trash: (path) => {
                    rmSync(path, { recursive: true, force: true });
                    return Promise.resolve();
                }
            });
            expect((done as { error?: string }).error).toBeUndefined();
            undone.add(newest.at);
            return newest;
        }

        it('lists the write of an existing launch.yml and undoes it to the old text', async () => {
            const old = readFileSync(launch(), 'utf8');
            const answered = await post({ action: 'addConfiguration', repo, configuration: added });
            const text = readFileSync(launch(), 'utf8');
            const listed = listedWrites().map((one) => [
                one.field,
                (one.before as unknown[]).length
            ]);
            await undoNewest();
            expect([answered.status, text.includes('name: third'), listed]).toEqual([
                200,
                true,
                [['add-configuration', 1]]
            ]);
            expect(readFileSync(launch(), 'utf8')).toBe(old);
        });

        it('lists the folder and the file for a folder with no launch.yml and undoes the file', async () => {
            repo = plantRepo({ 'a.rite': '(print 1)\n' }, []);
            const answered = await post({ action: 'addConfiguration', repo, configuration: added });
            const made = existsSync(launch());
            const listed = listedWrites().map((one) => [
                one.field,
                (one.before as unknown[]).length
            ]);
            await undoNewest();
            expect([answered.status, made, listed, existsSync(launch())]).toEqual([
                200,
                true,
                [
                    ['add-configuration', 0],
                    ['create', 0]
                ],
                false
            ]);
        });

        it('makes no folder and lists nothing for a configuration with no name on a folder with no launch.yml', async () => {
            repo = plantRepo({ 'a.rite': '(print 1)\n' }, []);
            const answered = await post({
                action: 'addConfiguration',
                repo,
                configuration: { ...added, name: '' }
            });
            expect([answered.status, existsSync(join(repo, '.oculus')), listedWrites()]).toEqual([
                400,
                false,
                []
            ]);
        });
    });
});
