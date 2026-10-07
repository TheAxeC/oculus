// Layer 2, route tests. POST /api/debug: the write token every action needs, and the approval of
// the text a launch runs. The handler is called with a scratch repository as the one served root, a
// scratch home for the approvals file, and a debug client whose `spawn` records its calls and
// returns a child of in-memory streams, so no adapter starts.
//
// What this does NOT cover: the origin rule, which hooks.server.ts applies to every request under
// /api/ ahead of a route seeing it (tests/server/root/hooks-server.test.ts), and the adapter's
// side of the protocol, which a real `rite_dap` answers.

import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect } from 'vitest';
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
let client: DebugClient;
let spawned: { command: string; args: readonly string[]; cwd: string }[] = [];

beforeEach(() => {
    enterHome();
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
});
