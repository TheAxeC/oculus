// Layer 2, client-state tests. The channel each source tab follows for its file
// (state/sessions/source/disk.svelte.ts), in Svelte's client runtime since a tab that is closed or
// pointed at another file leaves its channel in an effect: which tabs subscribe, and when the
// channel is dropped with a message to the server.
//
// It does not cover the server's side of the unsubscribe message, which open-files.test.ts does.

import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import type { SourceDraft } from '../../../../src/lib/state/sessions/source/draft.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { server } from './source-server.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));
afterEach(() => vi.unstubAllGlobals());

const A = 'source:fixture/a.md';
const B = 'source:fixture/b.md';

/** One thing done to the tabs, in the order a row lists them. */
type Step =
    | { open: string; path: 'a.md' | 'b.md' }
    | { close: string }
    | { type: string; text: string }
    | { rename: string; to: string }
    | { outside: string; text: string };

type Row = {
    title: string;
    steps: Step[];
    subscribed: string[];
    unsubscribed: string[];
    drafts?: Record<string, Partial<SourceDraft>>;
};

const rows: Row[] = [
    {
        title: 'is subscribed once for several tabs over one file',
        steps: [{ open: 'one', path: 'a.md' }, { open: 'two', path: 'a.md' }, { close: 'one' }],
        subscribed: [A],
        unsubscribed: []
    },
    {
        title: 'is dropped, with a message to the server, when the last tab over the file closes',
        steps: [
            { open: 'one', path: 'a.md' },
            { open: 'two', path: 'a.md' },
            { close: 'one' },
            { close: 'two' }
        ],
        subscribed: [A],
        unsubscribed: [A]
    },
    {
        title: 'moves with a tab pointed at another file: the old channel is dropped and the new one followed',
        steps: [
            { open: 'one', path: 'a.md' },
            { open: 'one', path: 'b.md' }
        ],
        subscribed: [A, B],
        unsubscribed: [A]
    },
    {
        title: 'follows a file renamed under the tab, keeping its text and its mark and hearing the new file',
        steps: [
            { open: 'one', path: 'a.md' },
            { type: 'one', text: 'typed\n' },
            { rename: 'one', to: 'fixture/b.md' },
            { outside: 'fixture/b.md', text: 'another program\n' }
        ],
        subscribed: [A, B],
        unsubscribed: [A],
        drafts: { one: { text: 'typed\n', disk: 'changed' } }
    }
];

describe('the channel of a source tab', () => {
    it.each(rows)('$title', async (row) => {
        const env = server();
        env.files.set('fixture/a.md', 'a\n');
        env.files.set('fixture/b.md', 'b\n');
        for (const step of row.steps) {
            if ('open' in step) {
                await env.source.loadSourceDraft(step.open, 'fixture', step.path);
            } else if ('close' in step) {
                env.ui.clearInstanceState(step.close);
            } else if ('type' in step) {
                env.source.editSourceDraft(step.type, step.text);
            } else if ('rename' in step) {
                const held = env.ui.instanceState(step.rename) as Record<string, unknown>;
                env.ui.setInstanceState(step.rename, { ...held, file: step.to });
            } else {
                env.outside(step.outside, step.text);
            }
            flushSync();
            await env.settled();
        }
        expect(env.subscribed).toEqual(row.subscribed);
        expect(env.unsubscribed).toEqual(row.unsubscribed);
        for (const [id, fields] of Object.entries(row.drafts ?? {})) {
            expect(env.source.sourceDraft(id)).toMatchObject(fields);
        }
    });
});
