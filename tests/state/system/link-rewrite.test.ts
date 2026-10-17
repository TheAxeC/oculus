// Layer 2, client-state test. The offer to keep the links in Markdown files pointing at moved
// items (state/system/machine/refactor/link-rewrite.ts): a root whose Markdown server gave no
// answer is said in a notification, whether no root answered or another root's server answered
// with edits, and nothing is shown or said for an answer with no edit. The request carries the text
// of each tab with unsaved text under the root, which the edits are computed over.
//
// What this does NOT cover: the relay's answer itself (tests/server/machine/lsp/lifetime.test.ts
// reads it for a move two roots hold) and the Refactor Preview the edit is shown in
// (refactor-preview.test.ts).

import { describe, expect } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../src/lib/state/shared/words/text.ts';
import { createLinkRewrite } from '../../../src/lib/state/system/machine/refactor/link-rewrite.ts';
import type { LinksReply } from '../../../src/lib/state/system/machine/lsp/lsp.svelte.ts';
import type { Move } from '../../../src/lib/state/sources/explorer/follow.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const MOVE: Move = { from: { root: 'inner', path: 'b.md' }, to: { root: 'inner', path: 'c.md' } };

const rows: { title: string; reply: LinksReply; said: string[] }[] = [
    {
        title: 'says the root whose server gave no answer beside the answer of another root',
        reply: { ok: true, edit: null, held: new Map(), overlaps: [], unanswered: ['hub'] },
        said: [t('source.md_links_no_answer', 'hub')]
    },
    {
        title: 'says the root of a request no server answered',
        reply: { ok: false, error: 'no_answer' },
        said: [t('source.md_links_no_answer', 'inner')]
    },
    {
        title: 'says nothing for an answer with no edit',
        reply: { ok: true, edit: null, held: new Map(), overlaps: [], unanswered: [] },
        said: []
    }
];

/** The one entry of the edit a second offer is answered with. */
const CREATED = { kind: 'create', uri: 'oculus-file:///inner/shown.md' };

describe('the offer to rewrite the links of moved items', () => {
    it.each(rows)('$title', async ({ reply, said }) => {
        const told: string[] = [];
        const submitted: unknown[] = [];
        const answers: LinksReply[] = [
            reply,
            {
                ok: true,
                edit: { documentChanges: [CREATED] },
                held: new Map(),
                overlaps: [],
                unanswered: []
            }
        ];
        // A second offer, answered with an edit, runs through the same steps as the row's and
        // reaches its submit after the row's offer has ended, so the checks made once it is
        // submitted see everything the row's offer said and submitted.
        let shown: (() => void) | null = null;
        const second = new Promise<void>((resolve) => {
            shown = resolve;
        });
        const offer = createLinkRewrite({
            askLinks: () => Promise.resolve(answers.shift() ?? reply),
            drafts: () => [],
            submit: (edit) => {
                submitted.push(edit);
                shown?.();
                return Promise.resolve({ applied: true });
            },
            say: (message) => told.push(message)
        });
        offer([MOVE]);
        offer([MOVE]);
        await second;
        expect(told).toEqual(said);
        expect(submitted).toEqual([{ documentChanges: [CREATED] }]);
    });
});

describe('the request for the edit of a move', () => {
    it('carries the text of each tab with unsaved text under the root, by its path', async () => {
        const asked: unknown[] = [];
        const draft = (file: string, text: string, saved: string) => ({
            file,
            text,
            saved,
            loaded: true
        });
        const offer = createLinkRewrite({
            askLinks: (root, moves, texts) => {
                asked.push({ root, moves, texts });
                return Promise.resolve({ ok: false, error: 'no_answer' });
            },
            drafts: () => [
                draft('inner/sub/README.md', 'Typed.\n', 'Saved.\n'),
                draft('inner/clean.md', 'Saved.\n', 'Saved.\n'),
                draft('other/a.md', 'Typed.\n', 'Saved.\n')
            ],
            submit: () => Promise.resolve({ applied: true }),
            say: () => undefined
        });
        offer([MOVE]);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(asked).toEqual([
            {
                root: 'inner',
                moves: [{ from: 'b.md', to: 'c.md' }],
                texts: [{ path: 'sub/README.md', text: 'Typed.\n' }]
            }
        ]);
    });
});
