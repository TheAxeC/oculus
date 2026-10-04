// Layer 2, client-state tests. Which tabs a page holds and what closing it asks: the rules the
// shell's pane menus and page leaves and the Pages view read, over hand-built page lists and
// instance ids.

import { describe, expect, it } from 'vitest';
import { closeAsk, pageInstanceIds } from '../../../../src/lib/state/workbench/navigation/pages.ts';
import type { Page } from '../../../../src/lib/state/workbench/layout/index.ts';
import { bench, pane, split } from '../layout/layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** One page holding a tree, named as given. */
function page(id: string, label: string, root = pane([])): Page {
    return { id, label, workbench: bench(root) };
}

describe('the question a close asks', () => {
    it("lists every instance of every pane of a page, in the tree's own order", () => {
        const two = split('row', [0.5, 0.5], [pane(['a']), pane(['b', 'c'])]);
        expect(pageInstanceIds(page('p', '', pane(['a', 'b'])))).toEqual(['a', 'b']);
        expect(pageInstanceIds(page('p', '', two))).toEqual(['a', 'b', 'c']);
        expect(pageInstanceIds(page('p', ''))).toEqual([]);
    });
});

describe('what a close asks once a busy terminal is known', () => {
    const dirty = (id: string): boolean => id === 'text';
    const nameOf = (id: string): string => (id === 'text' ? 'notes.md' : id);
    const build = { id: 'a1a1a1-shell', name: 'build', command: 'npm' };
    const MANY = 'Close this pane and the 2 tabs in it?';

    // Revert: drop the unsaved tab from the detail, or name the terminal before it.
    it('asks one question over a pane with unsaved text and a busy terminal, the text first', () => {
        const ask = closeAsk({
            ids: ['text', 't'],
            unsaved: dirty,
            nameOf,
            many: MANY,
            busy: [build]
        });
        expect(ask?.message).toBe(MANY);
        const detail = ask?.detail ?? '';
        expect(detail).toContain('notes.md');
        expect(detail).toContain('build');
        expect(detail.indexOf('notes.md')).toBeLessThan(detail.indexOf('build'));
    });
});
