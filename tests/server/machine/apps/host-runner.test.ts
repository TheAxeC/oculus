// Layer 2, server test. The real runner (lib/server/machine/apps/host/host-runner.mjs) started
// under node by the manager: what a host may import, what its output holds, how it answers and
// that no process is left after the manager closes.
//
// Every folder is synthetic, under the system temporary directory, and every host file is planted
// by the case. What this does NOT cover: Electron's node (the runner is started with the same
// `ELECTRON_RUN_AS_NODE=1` and execPath the desktop app uses) and the scripted hosts of
// host-manager.test.ts.
// @module-tag slow: each case starts a node process.

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import { world, type World } from './hosts-world.ts';

const NOTES = 'app:notes';

/** A real host of the app `notes` with this host file, and files planted beside the folder. */
function real(host: string, outside: Record<string, string> = {}): World {
    const w = world({ notes: { host } }, {}, { real: true });
    for (const [path, body] of Object.entries(outside)) {
        mkdirSync(join(w.fixture.machine, path, '..'), { recursive: true });
        writeFileSync(join(w.fixture.machine, path), body);
    }
    return w;
}

/** The state of the host's row and its output as one text, read before the manager closes. */
const seen = (w: World): [string | undefined, string] => {
    const row = w.hosts.rows().find((one) => one.app === NOTES);
    return [row?.state, w.hosts.output(NOTES).join('\n')];
};

/** Whether a process of this id is alive. */
function alive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

const OUTSIDE = { 'outside.js': 'export const x = 1;\n', 'outside.cjs': 'module.exports = 1;\n' };

const REFUSED: [string, string, string][] = [
    [
        'a static import of a file outside the folder',
        "import '../outside.js';\nexport function activate() {}\n",
        'outside.js'
    ],
    [
        'a dynamic import() of a file outside the folder',
        "export async function activate() { await import('../outside.js'); }\n",
        'outside.js'
    ],
    [
        'a require of a file outside the folder made through createRequire',
        "import { createRequire } from 'node:module';\nexport function activate() { createRequire(import.meta.url)('../outside.cjs'); }\n",
        'outside.cjs'
    ],
    [
        'a package of a node_modules above the folder',
        "import 'pkg';\nexport function activate() {}\n",
        'pkg'
    ]
];

describe('refuses every import of a file outside the recorded files of the app, whichever way it is asked', () => {
    it.each(REFUSED)(
        '%s ends the host with the refused file in its output',
        async (_row, host, file) => {
            const w = real(host, {
                ...OUTSIDE,
                'node_modules/pkg/index.js': 'export const p = 1;\n'
            });
            await w.hosts.tab(NOTES);
            const row = await w.ended(NOTES);
            await w.hosts.close();
            expect([row.state, w.hosts.output(NOTES).join('\n').includes(file)]).toEqual([
                'ended',
                true
            ]);
        }
    );

    it('refuses a link of the folder to a file outside it and a dot-led file of the folder', async () => {
        const w = real("import './link.js';\nexport function activate() {}\n", OUTSIDE);
        symlinkSync(
            join(w.fixture.machine, 'outside.js'),
            join(w.fixture.machine, 'notes', 'link.js')
        );
        writeFileSync(join(w.fixture.machine, 'notes', '.hidden.js'), 'export const h = 1;\n');
        const dot = real("import './.hidden.js';\nexport function activate() {}\n");
        writeFileSync(join(dot.fixture.machine, 'notes', '.hidden.js'), 'export const h = 1;\n');
        await w.hosts.tab(NOTES);
        await dot.hosts.tab(NOTES);
        const link = await w.ended(NOTES);
        const hidden = await dot.ended(NOTES);
        const [linkState, linkSaid] = [link.state, w.hosts.output(NOTES).join('\n')];
        const [dotState, dotSaid] = [hidden.state, dot.hosts.output(NOTES).join('\n')];
        await w.hosts.close();
        await dot.hosts.close();
        expect([
            linkState,
            linkSaid.includes('link.js'),
            dotState,
            dotSaid.includes('.hidden.js')
        ]).toEqual(['ended', true, 'ended', true]);
    });

    it('loads a node built-in, a file of its own folder and a package inside its own folder', async () => {
        const w = real(
            "import { readFileSync } from 'node:fs';\nimport { x } from './lib.js';\nimport { p } from './node_modules/inner/index.js';\nexport function activate(oculus) { oculus.onRequest(() => [typeof readFileSync, x, p]); }\n"
        );
        writeFileSync(join(w.fixture.machine, 'notes', 'lib.js'), 'export const x = 1;\n');
        mkdirSync(join(w.fixture.machine, 'notes', 'node_modules', 'inner'), { recursive: true });
        writeFileSync(
            join(w.fixture.machine, 'notes', 'node_modules', 'inner', 'index.js'),
            'export const p = 2;\n'
        );
        w.rescan();
        w.rescan(['notes']);
        const answer = await w.hosts.request(NOTES, 'ask', null, 't');
        await w.hosts.close();
        expect(answer).toEqual({ ok: true, value: ['function', 1, 2] });
    });
});

describe('runs a host file under the runner and ends it with the manager', () => {
    it('keeps the messages working when the host logs at import and in activate, and keeps the lines', async () => {
        const w = real(
            "console.log('at import');\nexport function activate(oculus) { console.log('in activate'); oculus.onRequest((method, params) => ({ method, params })); }\n"
        );
        const answer = await w.hosts.request(NOTES, 'ping', { n: 1 }, 'tab-1');
        const [, output] = seen(w);
        await w.hosts.close();
        expect([answer, output.includes('at import'), output.includes('in activate')]).toEqual([
            { ok: true, value: { method: 'ping', params: { n: 1 } } },
            true,
            true
        ]);
    });

    it.each([
        ['has no activate', 'export const x = 1;\n', 'activate'],
        [
            'throws in activate',
            "export function activate() { throw new Error('exploded'); }\n",
            'exploded'
        ]
    ])('ends a host file that %s, with the error in its output', async (_row, host, said) => {
        const w = real(host);
        await w.hosts.tab(NOTES);
        const row = await w.ended(NOTES);
        await w.hosts.close();
        expect([row.state, w.hosts.output(NOTES).join('\n').includes(said)]).toEqual([
            'ended',
            true
        ]);
    });

    it('answers a thrown error as refused with its message, and leaves no process after close', async () => {
        const w = real(
            "export function activate(oculus) { oculus.onRequest((method) => { if (method === 'boom') throw new Error('nope'); return 'fine'; }); }\n"
        );
        const fine = await w.hosts.request(NOTES, 'ok', null, 't');
        const pid = w.hosts.rows()[0]?.pid ?? 0;
        const boom = await w.hosts.request(NOTES, 'boom', null, 't');
        const before = alive(pid);
        await w.hosts.close();
        expect([fine, boom, pid > 0, before, alive(pid)]).toEqual([
            { ok: true, value: 'fine' },
            { ok: false, word: 'refused:nope' },
            true,
            true,
            false
        ]);
    });

    it('calls deactivate of the host file before the process ends', async () => {
        const w = real(
            "import { writeFileSync } from 'node:fs';\nexport function activate() {}\nexport function deactivate() { writeFileSync(new URL('./deactivated', import.meta.url), 'yes'); }\n"
        );
        await w.hosts.tab(NOTES);
        const folder = join(w.fixture.machine, 'notes');
        await w.hosts.stop(NOTES);
        const { existsSync } = await import('node:fs');
        expect(existsSync(join(folder, 'deactivated'))).toBe(true);
    });
});
