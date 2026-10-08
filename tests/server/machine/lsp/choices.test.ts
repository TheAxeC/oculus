// Layer 4, server test. The choices file of the language servers: an unreadable file is never
// written over.
//
// The folder is a scratch one handed in; a case never reads or writes the machine's own
// `~/.oculus/lsp`.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import type { LspToPage } from '../../../../src/lib/data/model/index.ts';
import { applyChoose, chosenFor } from '../../../../src/lib/server/machine/lsp/choices.ts';
import type { Adapter, Choice } from '../../../../src/lib/server/machine/lsp/servers.ts';

/** The adapter of a server that accepts the choice it is handed and lists nothing. */
const accepting = (choice: Choice): Adapter =>
    ({
        choose: () => ({ choice, apply: 'configuration' }),
        choices: () => ({})
    }) as unknown as Adapter;

/** A choice written the way the page's `choose` message writes it: done, or the refusal's code. */
async function choose(
    folder: string,
    repo: string,
    choice: Choice
): Promise<{ ok: true } | { ok: false; code: string }> {
    const sent: LspToPage[] = [];
    await applyChoose(
        accepting(choice),
        { root: repo, lsp: folder, approvals: join(folder, 'approvals.json'), env: {} },
        { oculus: 'choose', root: 'repo' },
        undefined,
        undefined,
        (payload) => sent.push(payload)
    );
    const refused = sent.find((one) => one.oculus === 'refused');
    return refused?.oculus === 'refused' ? { ok: false, code: refused.code } : { ok: true };
}

/** The choices file of an lsp folder. */
const choicesPath = (folder: string): string => join(folder, 'choices.json');

type Row = { name: string; steps: () => Promise<void> };

const ROWS: Row[] = [
    {
        name: 'reads a choices file that is not JSON as empty and refuses a write over it, leaving it',
        steps: async () => {
            const folder = join(scratchDir('oculus-lsp-'), 'lsp');
            mkdirSync(folder, { recursive: true });
            const file = choicesPath(folder);
            const bytes = 'not json {';
            writeFileSync(file, bytes);
            expect(chosenFor(folder, '/repo')).toEqual({});
            const refused = await choose(folder, '/repo', {
                interpreter: '/repo/.venv/bin/python'
            });
            expect(refused).toEqual({ ok: false, code: 'choices_unread' });
            expect(readFileSync(file, 'utf8')).toBe(bytes);
        }
    },
    {
        name: 'reads a file of the wrong shape as empty and refuses a write over it, leaving it',
        steps: async () => {
            const folder = scratchDir('oculus-lsp-');
            const file = choicesPath(folder);
            const bytes = JSON.stringify({ version: 2, repositories: {} });
            writeFileSync(file, bytes);
            expect(chosenFor(folder, '/repo')).toEqual({});
            expect(await choose(folder, '/repo', { database: 'build' })).toEqual({
                ok: false,
                code: 'choices_unread'
            });
            expect(readFileSync(file, 'utf8')).toBe(bytes);
        }
    },
    {
        name: 'writes a choice to a folder that is not there yet and reads it back beside another repository',
        steps: async () => {
            const folder = join(scratchDir('oculus-lsp-'), 'made', 'lsp');
            expect(await choose(folder, '/one', { interpreter: '/one/.venv/bin/python' })).toEqual({
                ok: true
            });
            expect(await choose(folder, '/one', { database: 'build/debug' })).toEqual({ ok: true });
            expect(await choose(folder, '/two', { database: 'out' })).toEqual({ ok: true });
            expect(chosenFor(folder, '/one')).toEqual({
                interpreter: '/one/.venv/bin/python',
                database: 'build/debug'
            });
            expect(chosenFor(folder, '/two')).toEqual({ database: 'out' });
        }
    }
];

describe('the choices file', () => {
    it.each(ROWS)('$name', async ({ steps }) => {
        await steps();
    });
});
