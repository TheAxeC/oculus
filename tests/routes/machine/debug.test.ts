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
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { parse } from 'yaml';
import { it } from '../../fixtures/scratch.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
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
import { WriteLog } from '../write-log.ts';

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
/** The writer Add Configuration runs over, with the change log History lists. */
const log = new WriteLog('repo', () => repo);
let client: DebugClient;
let spawned: { command: string; args: readonly string[]; cwd: string }[] = [];

beforeEach(() => {
    enterHome();
    log.start('oculus-debug-writes-');
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

function mine(): DebugRouteOptions {
    return {
        rootsFor: () => [repo],
        approvalsFor: () => defaultApprovalsPath(),
        configFor: () => loadConfig(engineDir()).config,
        writes: fsWrites(),
        files: () => log.writer(),
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

    describe('the writes of launch.yml', () => {
        const added = { name: 'third', type: 'rite', program: 'a.rite' };
        const launch = (): string => join(repo, '.oculus', 'launch.yml');

        it('lists the write of an existing launch.yml and undoes it to the old text', async () => {
            const old = readFileSync(launch(), 'utf8');
            const answered = await post({ action: 'addConfiguration', repo, configuration: added });
            const text = readFileSync(launch(), 'utf8');
            const listed = log.listed().map((one) => [one.field, (one.before as unknown[]).length]);
            await log.undoNewest();
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
            const listed = log.listed().map((one) => [one.field, (one.before as unknown[]).length]);
            await log.undoNewest();
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
            expect([answered.status, existsSync(join(repo, '.oculus')), log.listed()]).toEqual([
                400,
                false,
                []
            ]);
        });

        /** The names of the configurations launch.yml lists now. */
        function names(): string[] {
            const read = parse(readFileSync(launch(), 'utf8')) as {
                configurations: { name: string }[];
            };
            return read.configurations.map((one) => one.name);
        }

        /** The changes to the configuration `name`, or its delete when `changes` is null. */
        function editing(name: string, changes: Record<string, unknown> | null): unknown {
            return { action: 'editConfiguration', repo, name, changes };
        }

        it('changes only the keys an edit names, every other line of the file kept byte for byte', async () => {
            const long = `a/${'deep/'.repeat(20)}main.rite`;
            const written = `configurations:\n  - name: run # the first\n    type: rite\n    request: launch\n    program: ${long}\n    args: [one, two]\n  - name: other\n    program: b.rite\n    env: {A: x}\n`;
            repo = plantRepo({ 'a.rite': '(print 1)\n', '.oculus/launch.yml': written }, []);
            const answered = await post(editing('run', { cwd: 'sub' }));
            expect([answered.status, readFileSync(launch(), 'utf8')]).toEqual([
                200,
                written.replace('    args: [one, two]\n', '    args: [one, two]\n    cwd: sub\n')
            ]);
        });

        it('writes an edited configuration in its place with the comments kept, lists it and undoes it', async () => {
            const commented =
                '# the runs of this repository\nconfigurations:\n    - name: run\n      program: a.rite\n    - name: other # the second\n      program: b.rite\n';
            repo = plantRepo({ 'a.rite': '(print 1)\n', '.oculus/launch.yml': commented }, []);
            const edited = { name: 'renamed', program: 'b.rite', cwd: '.' };
            const answered = await post(editing('run', edited));
            const text = readFileSync(launch(), 'utf8');
            const read = parse(text) as { configurations: Record<string, unknown>[] };
            const listed = log.listed().map((one) => one.field);
            await log.undoNewest();
            expect([answered.status, answered.body]).toEqual([200, { line: 3 }]);
            expect([read.configurations, listed]).toEqual([
                [edited, { name: 'other', program: 'b.rite' }],
                ['edit-configuration']
            ]);
            expect([text.includes('# the runs'), text.includes('# the second')]).toEqual([
                true,
                true
            ]);
            expect(readFileSync(launch(), 'utf8')).toBe(commented);
        });

        it('takes a deleted configuration out, lists the delete and undoes it', async () => {
            const old = readFileSync(launch(), 'utf8');
            const answered = await post(editing('other', null));
            const after = names();
            const listed = log.listed().map((one) => one.field);
            await log.undoNewest();
            expect([answered.status, after, listed]).toEqual([
                200,
                ['run'],
                ['delete-configuration']
            ]);
            expect(readFileSync(launch(), 'utf8')).toBe(old);
        });

        it('refuses an edit of a name the file does not hold, to a name another entry holds, or to no name', async () => {
            const old = readFileSync(launch(), 'utf8');
            const missing = await post(editing('gone', null));
            const taken = await post(editing('run', { name: 'other', program: 'a.rite' }));
            const unnamed = await post(editing('run', { name: '', program: 'a.rite' }));
            expect([missing.status, taken.status, unnamed.status]).toEqual([400, 400, 400]);
            expect([readFileSync(launch(), 'utf8'), log.listed()]).toEqual([old, []]);
        });
    });
});
