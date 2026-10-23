// Layer 2, state tests. Which hub's Literature collection Save to Literature on a card writes to
// and looks in (G8): the primary hub's when the primary holds the collection, else the first hub's
// that does; the card names that hub's root in the save (SaveToLiterature.svelte), so the server
// writes the paper where the card looks for it. The collections are listed as the selectors list
// them, in the workspace's folder order, each with its hub's name in `root`; the primary is `hub`.

import { describe, expect, it } from 'vitest';
import { literatureHome } from '../../../src/lib/state/feeds/literature/saved.ts';

describe('the Literature collection a card saves to', () => {
    it.each([
        { name: 'the primary, before another hub', hubs: ['hub', 'lab'], at: 0 },
        { name: 'the primary, after another hub', hubs: ['lab', 'hub'], at: 1 },
        { name: 'the first hub, when the primary names none', hubs: ['lab', 'other'], at: 0 },
        { name: 'the one hub, a second hub', hubs: ['lab'], at: 0 }
    ])('is $name (G8)', (row) => {
        const all: { root?: string }[] = row.hubs.map((root) => ({ root }));
        const home = literatureHome(all, 'hub');
        expect(home).toBe(all[row.at]);
        expect(home?.root).toBe(row.hubs[row.at]);
    });

    it('is none when no hub names Literature', () => {
        expect(literatureHome<{ root?: string }>([], 'hub')).toBeUndefined();
    });
});
