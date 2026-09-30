// Layer 4, view test. Audits of the two grid actions that need a clipboard or a grid, handed
// fakes: Clear (the grid and then the server's history) and Copy as HTML (the serialised selection
// as text/html with its plain text, a said failure when there is no clipboard), and the grid menu
// offering Copy as HTML only over a selection.
//
// What this does NOT cover: the presses that run them and the grid they act on, which need a DOM
// and are seen on screen; the server's clear is tests/routes/sessions/terminal-edit.test.ts.

import { describe, expect, it } from 'vitest';
import {
    clearGrid,
    copyAsHtml
} from '../../../src/lib/views/sessions/terminal/grid/grid-actions.ts';
import {
    gridMenu,
    MENU_COPY_HTML
} from '../../../src/lib/views/sessions/terminal/terminal-list.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

describe('Clear', () => {
    // Revert: clear only the grid, or only the history, in clearGrid.
    it('audits that it empties the grid and asks the server to clear the terminal history', async () => {
        const events: string[] = [];
        const grid = { clear: () => events.push('grid') };
        const failure = await clearGrid(grid, 'a1a1a1-shell', (id) => {
            events.push(`history ${id}`);
            return Promise.resolve({ ok: true, id, error: '' });
        });
        expect(events).toEqual(['grid', 'history a1a1a1-shell']);
        expect(failure).toBe('');
    });

    // Revert: drop the server's refusal in clearGrid.
    it("audits that it returns the server's refusal", async () => {
        const failure = await clearGrid({ clear: () => undefined }, 'a1a1a1-shell', (id) =>
            Promise.resolve({ ok: false, id, error: 'not listed' })
        );
        expect(failure).toBe('not listed');
    });
});

describe('Copy as HTML', () => {
    /** The clipboard item the browser makes, keeping the parts it was given. */
    class Item {
        constructor(public parts: Record<string, Blob>) {}
    }

    // Revert: write the HTML without the plain text, or the plain text without the HTML.
    it('audits that it writes the serialised selection as text/html and its plain text as text/plain', async () => {
        const written: Item[][] = [];
        const asked: unknown[] = [];
        const failure = await copyAsHtml(
            {
                serializeAsHTML: (options) => {
                    asked.push(options);
                    return '<div>hi</div>';
                }
            },
            'hi',
            { write: (items) => (written.push(items), Promise.resolve()) },
            Item
        );
        expect(failure).toBe('');
        expect(asked).toEqual([{ onlySelection: true }]);
        const parts = written[0][0].parts;
        expect(Object.keys(parts).sort()).toEqual(['text/html', 'text/plain']);
        expect(await parts['text/html'].text()).toBe('<div>hi</div>');
        expect(await parts['text/plain'].text()).toBe('hi');
    });

    // Revert: swallow a rejected clipboard write in copyAsHtml.
    it('audits that it says a failure when the clipboard refuses', async () => {
        const refuses = { write: () => Promise.reject(new Error('denied')) };
        const failure = await copyAsHtml({ serializeAsHTML: () => '<b/>' }, 'x', refuses, Item);
        expect(failure).not.toBe('');
    });

    // Revert: serialise the selection before checking there is a clipboard and a ClipboardItem.
    it('audits that it says a failure when there is no ClipboardItem or no clipboard', async () => {
        let serialised = 0;
        const serializer = {
            serializeAsHTML: () => {
                serialised += 1;
                return '<b/>';
            }
        };
        const clipboard = { write: () => Promise.resolve() };
        expect(await copyAsHtml(serializer, 'x', clipboard, undefined)).not.toBe('');
        expect(await copyAsHtml(serializer, 'x', undefined, Item)).not.toBe('');
        // Nothing is serialised for a page that has nowhere to write it.
        expect(serialised).toBe(0);
    });

    // Revert: offer Copy as HTML in gridMenu without a selection.
    it('audits that it is offered on the grid menu only while the grid holds a selection', () => {
        const words = (key: string): string => key;
        expect(gridMenu(true, false, words).map((item) => item.id)).toContain(MENU_COPY_HTML);
        // Without a selection there is nothing to serialise, so the item is not offered.
        expect(gridMenu(false, false, words).map((item) => item.id)).not.toContain(MENU_COPY_HTML);
    });
});
