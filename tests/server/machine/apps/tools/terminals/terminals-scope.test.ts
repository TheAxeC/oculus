// Layer 2, server test. What a host may do with terminals (lib/server/machine/apps/tools/run/
// terminals.ts), with the host's end of the connection scripted in this process: it acts on a
// terminal its own app made and on no other, starts one only in a folder of the app's scope with
// plain environment names, holds at most 32, and every terminal of an app ends with the app. These
// are the terminal rows of G35.
//
// The terminals are rows in memory (world/terminals-double.ts), so no program runs. Every folder is
// synthetic, under the system temporary directory. What this does NOT cover: a program that runs in
// tmux (terminals-tmux.test.ts) and the terminals a host opens as streams (terminals.test.ts).

import { describe, expect } from 'vitest';
import type { MessageConnection } from 'vscode-jsonrpc/node';
import { it } from '../../../../../fixtures/scratch.ts';
import { terminalsDouble } from '../../world/terminals-double.ts';
import { world } from '../../world/hosts-world.ts';

const ONE = 'app:one';
const TWO = 'app:two';

/** A world of two apps with scripted hosts started, each with the connection it speaks on. */
async function started() {
    const double = terminalsDouble();
    const w = world(
        { one: {}, two: {} },
        {},
        { terminals: double, roots: { r: { 'a.txt': 'x\n' } } }
    );
    await w.hosts.tab(ONE);
    await w.hosts.tab(TWO);
    const connection = (name: string): MessageConnection => {
        const host = w.spawned.find((one) => one.name === name);
        if (host === undefined) throw new Error('no host ' + name);
        return host.connection;
    };
    /** The word of the refusal a request ends with, or its answer. */
    const ask = async (name: string, method: string, params: unknown): Promise<unknown> => {
        try {
            return await connection(name).sendRequest(method, params);
        } catch (error) {
            return (error as Error).message;
        }
    };
    const create = (name: string, over: Record<string, unknown> = {}) =>
        ask(name, 'oculus/terminals/create', {
            kind: 'tmux',
            name: 'T',
            shellPath: '',
            shellArgs: [],
            cwd: '',
            env: {},
            message: '',
            ...over
        });
    return { w, double, ask, create };
}

describe('a terminal of one app', () => {
    it('is acted on by that app and answered missing to every operation of another app', async () => {
        const s = await started();
        const made = (await s.create('one')) as { id: string };
        const mine = [
            await s.ask('one', 'oculus/terminals/list', {}),
            await s.ask('one', 'oculus/terminals/pid', { id: made.id }),
            await s.ask('one', 'oculus/terminals/sendText', {
                id: made.id,
                text: 'ls',
                execute: true
            })
        ];
        const theirs = [
            await s.ask('two', 'oculus/terminals/list', {}),
            await s.ask('two', 'oculus/terminals/pid', { id: made.id }),
            await s.ask('two', 'oculus/terminals/sendText', {
                id: made.id,
                text: 'rm',
                execute: true
            }),
            await s.ask('two', 'oculus/terminals/show', { id: made.id, preserveFocus: false }),
            await s.ask('two', 'oculus/terminals/hide', { id: made.id }),
            await s.ask('two', 'oculus/terminals/name', { id: made.id, name: 'mine' }),
            await s.ask('two', 'oculus/terminals/dispose', { id: made.id })
        ];
        const left = s.double.rows.map((one) => one.id);
        await s.w.hosts.close();
        expect([mine[0], mine[1] !== 'missing', mine[2], theirs, left]).toEqual([
            [{ id: made.id, name: 'T' }],
            true,
            null,
            [[], 'missing', 'missing', 'missing', 'missing', 'missing', 'missing'],
            [made.id]
        ]);
    });
});

describe('a terminal a host starts', () => {
    it('starts in the folder of the scope it names or the first one, and is refused a folder outside, a file and a name that is no variable', async () => {
        const s = await started();
        const root = s.w.fixture.roots[0].dir;
        const answers = [
            await s.create('one', { cwd: root }),
            await s.create('one', { cwd: '' }),
            await s.create('one', { cwd: '/' }),
            await s.create('one', { cwd: `${root}/a.txt` }),
            await s.create('one', { env: { 'BAD NAME': 'x' } })
        ];
        await s.w.hosts.close();
        expect(
            answers.map((one) => (typeof one === 'string' ? one : Object.keys(one as object)))
        ).toEqual([['id'], ['id'], 'outside', 'not_a_folder', 'refused:env']);
    });

    it('is refused with refused:full when the app holds 32, and the other app is not held to that', async () => {
        const s = await started();
        for (let at = 0; at < 32; at += 1) await s.create('one');
        const over = await s.create('one');
        const other = await s.create('two');
        const held = s.double.rows.filter((one) => one.app === ONE).length;
        await s.w.hosts.close();
        expect([over, typeof other, held]).toEqual(['refused:full', 'object', 32]);
    });
});

describe('the terminals of an app that is disabled', () => {
    it('end with the app and the terminals of another app stay', async () => {
        const s = await started();
        await s.create('one');
        await s.create('two');
        s.w.disable(ONE);
        await s.double.until(() => s.double.rows.every((one) => one.app !== ONE));
        const apps = s.double.rows.map((one) => one.app);
        await s.w.hosts.close();
        expect(apps).toEqual([TWO]);
    });
});
