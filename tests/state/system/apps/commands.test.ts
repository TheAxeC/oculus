// Layer 2, client state test. How an app's `commands.run` is answered by the page
// (lib/state/system/apps/commands.ts): the command is looked up by name in the commands file of the
// app's root, the hub's for a machine app, and the call settles with how the press of it ended.
//
// The commands store is a double that answers a press as the case says. What this does NOT cover:
// the approval question and the terminal a real press opens (the commands store's own tests)
// and the page method that counts the call under apps.opens_per_min (methods.test.ts).

import { describe, expect } from 'vitest';
import { appCommands } from '../../../../src/lib/state/system/apps/commands.ts';
import { it } from '../../../fixtures/scratch.ts';

type End = { repo: string; name: string; outcome: { kind: string } };

/** A commands store whose press ends with the outcome `kind`, and the presses it was asked for. */
function store(kind: string, listed = [{ name: 'build', source: 'file' }]) {
    const listeners = new Set<(end: End) => void>();
    const pressed: [string, string, string][] = [];
    const run = appCommands({
        commands: {
            load: () => Promise.resolve({ commands: listed }),
            press: (repo, name, source) => {
                pressed.push([repo, name, source]);
                for (const listener of [...listeners]) listener({ repo, name, outcome: { kind } });
                return Promise.resolve(true);
            },
            afterPress: (listener) => {
                listeners.add(listener);
                return () => listeners.delete(listener);
            }
        },
        served: () => [
            { key: 'hub', dir: '/hub' },
            { key: 'cathedra', dir: '/cathedra' }
        ]
    });
    return { run: run.run, pressed, listeners };
}

describe('runs the command of an app root and settles with how the press ended', () => {
    it.each([
        ['started', 'ok'],
        ['dropped', 'declined'],
        ['refused', 'failed']
    ])('a press that ends %s settles %s', async (kind, expected) => {
        const { run, listeners } = store(kind);
        expect(await run('', 'build')).toBe(expected);
        expect(listeners.size).toBe(0);
    });

    it('presses the command of the hub for a machine app and of its own root for a root app', async () => {
        const { run, pressed } = store('started');
        await run('', 'build');
        await run('cathedra', 'build');
        expect(pressed).toEqual([
            ['/hub', 'build', 'file'],
            ['/cathedra', 'build', 'file']
        ]);
    });

    it.each([
        [
            'a name the commands file does not hold',
            'cathedra',
            'nope',
            [{ name: 'build', source: 'file' }]
        ],
        [
            'a command saved through the form',
            'cathedra',
            'build',
            [{ name: 'build', source: 'form' }]
        ],
        [
            'a root the file browser does not show',
            'elsewhere',
            'build',
            [{ name: 'build', source: 'file' }]
        ]
    ])('answers missing for %s and presses nothing', async (_row, root, name, listed) => {
        const { run, pressed } = store('started', listed);
        expect(await run(root, name)).toBe('missing');
        expect(pressed).toEqual([]);
    });
});
