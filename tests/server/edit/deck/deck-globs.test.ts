// Layer 2, server test. The deck acts that make a deck folder drop the folder-glob keys that cover
// it in the same call (server/edit/writes/config/lists/deck/deck-new.ts), so a read made at once
// after the act's answer, through the store the server holds, finds the new deck with no wait for
// the watcher. The hub is a temporary directory (deckTarget); nothing outside it is written.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { Deck } from '../../../../src/lib/data/model/index.ts';
import { readDeck } from '../../../../src/lib/server/content/deck/read.ts';
import { handleWrite } from '../../../../src/lib/server/edit/writes.ts';
import { deckSourceOf } from '../../../../src/lib/server/edit/writes/config/lists/deck/deck-files.ts';
import { it, test } from '../../../fixtures/scratch.ts';
import { TOKEN, deckTarget, request, warmConfig } from '../../../routes/edit/write-fixture.ts';

test.beforeAll(warmConfig);

/** A deck whose two groups find decks made from an outline and decks made in a folder. */
const INDEX = [
    'groups:',
    '    outlines:',
    "        find: { folders: ['notes/*-slides'] }",
    '        discover: true',
    '    made:',
    "        find: { folders: ['fresh/*/present.yml'] }",
    '        discover: true',
    'order:',
    '    - title.md',
    '    - { slides: outlines }',
    '    - { slides: made }',
    ''
].join('\n');

/** The folders of the members of one group of the deck. */
function members(deck: Deck | 'outside', group: string): string[] {
    if (deck === 'outside') throw new Error('the deck is outside the roots');
    return (deck.groups.find((one) => one.name === group)?.members ?? []).map((one) => one.path);
}

describe('a deck act and the folder globs the server holds (case C11)', () => {
    it('finds the deck an outline and a create made in a read made at once after each act', async () => {
        const into = deckTarget();
        const roots = [{ key: 'hub', dir: into.hub }];
        mkdirSync(join(into.hub, 'index'));
        writeFileSync(join(into.hub, 'index', 'present.yml'), INDEX);
        writeFileSync(join(into.hub, 'index', 'title.md'), '# Index\n');
        mkdirSync(join(into.hub, 'notes'));
        writeFileSync(join(into.hub, 'notes', 'talk.md'), '# One\n\n# Two\n');
        mkdirSync(join(into.hub, 'fresh', 'x'), { recursive: true });
        const read = (): Deck | 'outside' => readDeck(deckSourceOf(into, roots), 'hub', 'index');
        expect(members(read(), 'outlines')).toEqual([]);
        expect(members(read(), 'made')).toEqual([]);

        const outlined = await handleWrite(
            request({ kind: 'deck-edit', act: 'outline', root: 'hub', file: 'notes/talk.md' }),
            TOKEN,
            into
        );
        expect(outlined.status).toBe(200);
        expect(members(read(), 'outlines')).toEqual(['notes/talk-slides']);

        const created = await handleWrite(
            request({
                kind: 'deck-edit',
                act: 'create',
                root: 'hub',
                folder: 'fresh/x',
                title: 'X'
            }),
            TOKEN,
            into
        );
        expect(created.status).toBe(200);
        expect(members(read(), 'made')).toEqual(['fresh/x']);
    });
});
