// The word wrap a source tab keeps with its draft, beside the indentation: the value Alt+Z set,
// null for the configured value, a stored value outside the four words read as null, and the
// choice dropped when the tab is pointed at another file.
//
// What this does NOT cover: the keypress, which is seen at the look, and the value the tab then
// draws (tests/state/sessions/source/source-options.test.ts).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { createClientState, type ClientState } from '../../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;

beforeEach(() => {
    client = createClientState();
    client.ui.loadUi({ getItem: () => null, setItem: noop });
});

afterEach(() => vi.unstubAllGlobals());

describe('the word wrap kept with a draft', () => {
    it('is null until a tab keeps one, and per instance', () => {
        expect(client.source.sourceDraft('one').wrap).toBeNull();
        client.source.setSourceWrap('one', 'off');
        expect(client.source.sourceDraft('one').wrap).toBe('off');
        expect(client.source.sourceDraft('two').wrap).toBeNull();
        client.source.setSourceWrap('one', null);
        expect(client.source.sourceDraft('one').wrap).toBeNull();
    });

    // Red when a stored value outside the four words is drawn, or one of them is dropped.
    it.each([
        ['off', 'off'],
        ['on', 'on'],
        ['wordWrapColumn', 'wordWrapColumn'],
        ['bounded', 'bounded'],
        [1, null],
        [true, null],
        ['sideways', null],
        ['ON', null],
        [[], null],
        [{}, null],
        [undefined, null]
    ])('reads a stored %j as %j', (wrap, read) => {
        client.ui.setInstanceState('one', { wrap });
        expect(client.source.sourceDraft('one').wrap).toBe(read);
    });

    it('keeps the choice across typing and drops it for another file', async () => {
        vi.stubGlobal('fetch', () => Promise.resolve(new Response('text\n')));
        await client.source.loadSourceDraft('one', 'hub', 'a.md');
        client.source.setSourceWrap('one', 'off');
        client.source.editSourceDraft('one', 'typed');
        expect(client.source.sourceDraft('one').wrap).toBe('off');
        await client.source.loadSourceDraft('one', 'hub', 'a.md');
        expect(client.source.sourceDraft('one').wrap).toBe('off');
        await client.source.loadSourceDraft('one', 'hub', 'b.md');
        expect(client.source.sourceDraft('one').wrap).toBeNull();
    });
});
