// Layer 2, client-state test. The offer to keep the links in Markdown files pointing at moved
// items (state/system/machine/refactor/link-rewrite.ts): a root whose Markdown server gave no
// answer is said in a notification, whether no root answered or another root's server answered
// with edits, and nothing is shown or said for an answer with no edit.
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

describe('the offer to rewrite the links of moved items', () => {
    it.each(rows)('$title', async ({ reply, said }) => {
        const told: string[] = [];
        let submitted = 0;
        const offer = createLinkRewrite({
            askLinks: () => Promise.resolve(reply),
            submit: () => {
                submitted += 1;
                return Promise.reject(new Error('an answer with no edit is not shown'));
            },
            say: (message) => told.push(message)
        });
        offer([MOVE]);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(told).toEqual(said);
        expect(submitted).toBe(0);
    });
});
