// Layer 2, client-state tests. Which tabs a page holds and what closing it asks: the rules the
// shell's pane menus and page leaves and the Pages view read, over hand-built page lists and
// instance ids; and the file a document tab names, of the hub or of oculus's own folder.

import { describe, expect, it } from 'vitest';
import {
    closeAsk,
    closeWords,
    fileOfTab,
    pageInstanceIds,
    shownFileOfTab
} from '../../../../src/lib/state/workbench/navigation/pages.ts';
import type { Page } from '../../../../src/lib/state/workbench/layout/index.ts';
import { bench, pane, split } from '../layout/layout-fixture.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../src/lib/state/shared/words/text.ts';
import { createClientState } from '../../../fixtures/client.ts';

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

describe('what a close asks once the tabs the autosave mode saves were saved', () => {
    const nameOf = (id: string): string => id;

    /** A ui store whose tab `text` holds unsaved text until a saver takes it. */
    function held(saver: (open: Set<string>, ids: string[]) => void) {
        const { ui } = createClientState();
        const open = new Set(['text']);
        ui.registerUnsaved((id) => open.has(id));
        ui.registerSaveBeforeClose((ids) => {
            saver(open, ids);
            return Promise.resolve();
        });
        return ui;
    }

    it('asks nothing for a tab the save took, and answers no tab left unsaved', async () => {
        const ui = held((open, ids) => ids.forEach((id) => open.delete(id)));
        expect(await ui.saveBeforeClose(['text'])).toEqual([]);
        const asked = closeAsk({
            ids: ['text'],
            unsaved: ui.unsaved,
            nameOf,
            many: 'many',
            busy: []
        });
        expect(asked).toBeNull();
    });

    it('asks the unsaved-text question for a tab whose save was refused', async () => {
        const ui = held(() => undefined);
        expect(await ui.saveBeforeClose(['text'])).toEqual(['text']);
        const asked = closeAsk({
            ids: ['text'],
            unsaved: ui.unsaved,
            nameOf,
            many: 'many',
            busy: []
        });
        expect(asked && closeWords(asked)).toBe(t('ui.tab_close_dirty'));
    });

    it('asks how many go when several tabs close, naming only the tabs left unsaved', async () => {
        const ui = held((open, ids) => ids.forEach((id) => open.delete(id)));
        const asked = closeAsk({
            ids: ['text', 'other'],
            unsaved: ui.unsaved,
            nameOf,
            many: 'Close 2 tabs?',
            busy: []
        });
        expect(await ui.saveBeforeClose(['text', 'other'])).toEqual([]);
        expect(asked?.message).toBe('Close 2 tabs?');
        expect(asked?.detail).toContain('text');
        const after = closeAsk({
            ids: ['text', 'other'],
            unsaved: ui.unsaved,
            nameOf,
            many: 'Close 2 tabs?',
            busy: []
        });
        expect(after).toEqual({ message: 'Close 2 tabs?', detail: '' });
    });
});

describe('the file a tab names', () => {
    const engineTab = {
        view: 'doc',
        state: { id: 'engine:docs/apps.md', path: 'docs/apps.md', engine: true }
    };
    const hubTab = {
        view: 'doc',
        state: { id: 'docs/RESEARCH-APPROACH.md', path: 'docs/RESEARCH-APPROACH.md' }
    };
    const labTab = {
        view: 'doc',
        state: {
            id: 'lab:docs/RESEARCH-APPROACH.md',
            path: 'docs/RESEARCH-APPROACH.md',
            hub: 'lab'
        }
    };
    const IN_HUB = { primary: 'hub', engineHub: 'hub', engineAt: 'tools/oculus' };
    const ROWS = [
        {
            row: 'an engine tab with oculus inside the primary hub',
            tab: engineTab,
            place: IN_HUB,
            file: { root: 'hub', path: 'tools/oculus/docs/apps.md' }
        },
        {
            row: 'an engine tab with oculus inside another hub',
            tab: engineTab,
            place: { primary: 'hub', engineHub: 'lab', engineAt: 'tools/oculus' },
            file: { root: 'lab', path: 'tools/oculus/docs/apps.md' }
        },
        {
            row: 'an engine tab with oculus in no folder of the workspace',
            tab: engineTab,
            place: { primary: 'hub', engineHub: '', engineAt: '' },
            file: null
        },
        {
            row: 'a hub document tab, which is a document of the primary hub',
            tab: hubTab,
            place: IN_HUB,
            file: { root: 'hub', path: 'docs/RESEARCH-APPROACH.md' }
        },
        {
            row: 'a document tab that names its hub',
            tab: labTab,
            place: IN_HUB,
            file: { root: 'lab', path: 'docs/RESEARCH-APPROACH.md' }
        },
        {
            row: 'a hub document tab with no primary hub',
            tab: hubTab,
            place: { primary: '', engineHub: '', engineAt: '' },
            file: null
        }
    ];

    it.each(ROWS)('$row', ({ tab, place, file }) => {
        expect(fileOfTab(tab, place)).toEqual(file);
        expect(shownFileOfTab(tab, place)).toEqual(file);
    });
});
