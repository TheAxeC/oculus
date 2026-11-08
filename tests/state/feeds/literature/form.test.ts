// A Literature search tab's saved state as read back: a tab with no saved listing, a saved listing
// and a damaged one, since a form that does not read leaves the tab undrawn.

import { describe, expect, it } from 'vitest';
import { parseForm } from '../../../../src/lib/state/feeds/literature/form.ts';

/** One row of a saved listing, for the source `id`. */
function row(id: string): Record<string, unknown> {
    return { id, name: id, keyed: false, available: true, key: null, help: null, bibtex: null };
}

describe('the saved listing of a Literature search tab', () => {
    it('is none for a tab that saved nothing', () => {
        expect(parseForm({}).listed).toBeNull();
        expect(parseForm(undefined).listed).toBeNull();
    });

    it('is the list a tab saved', () => {
        const listed = parseForm({ listed: [row('openalex'), row('arxiv')] }).listed;
        expect(listed?.map((one) => one.id)).toEqual(['openalex', 'arxiv']);
    });

    it('is none for a list of the wrong shape or that names a source twice', () => {
        expect(parseForm({ listed: 3 }).listed).toBeNull();
        expect(parseForm({ listed: [row('openalex'), row('openalex')] }).listed).toBeNull();
    });
});
