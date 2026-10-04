// Layer 2, client-state tests. The source tab's drafts: the unsaved-text rule a close asks.

import { beforeEach, describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { noop } from '../../fixtures/doubles.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let editSourceDraft: ClientState['source']['editSourceDraft'];
let sourceDraft: ClientState['source']['sourceDraft'];
let sourceDirty: ClientState['source']['sourceDirty'];
let loadUi: ClientState['ui']['loadUi'];

beforeEach(() => {
    client = createClientState();
    ({ editSourceDraft, sourceDraft, sourceDirty } = client.source);
    ({ loadUi } = client.ui);
});

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

beforeEach(() => loadUi({ getItem: () => null, setItem: noop }));

describe('an untitled source tab', () => {
    // Revert: leave the draft clean once the reader typed.
    it('is unsaved once the reader types, which is what closing it asks about', () => {
        client.source.loadUntitledDraft('one');
        expect(sourceDirty('one')).toBe(false);
        editSourceDraft('one', 'typed');
        expect(sourceDirty('one')).toBe(true);
        expect(client.ui.unsaved('one')).toBe(true);
    });

    it('keeps the typed text when it is opened again', () => {
        client.source.loadUntitledDraft('one');
        editSourceDraft('one', 'typed');
        client.source.loadUntitledDraft('one');
        expect(sourceDraft('one').text).toBe('typed');
    });
});
