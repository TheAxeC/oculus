// Layer 2, client-state tests. The entry forms' drafts: what a reader typed into a form, kept per
// view instance in the ui store and read back after a reload through a fake storage; whether an
// instance holds unsaved work.
//
// Nothing here touches localStorage or the DOM. What a form does with a draft when it is pressed
// is a DOM event no case here fires.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Entry } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import {
    createFormDrafts,
    formKey,
    type FormDraftsStore,
    type TypedField
} from '../../../src/lib/state/forms/form-drafts.svelte.ts';
import type { FormValue } from '../../../src/lib/state/forms/form-values.ts';
import { UI_KEY } from '../../../src/lib/state/workbench/ui.svelte.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { fakeStorage } from '../workbench/layout/layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

/** The entries the lookup knows, by collection and id; a collection absent here is unknown. */
let known: Record<string, Record<string, Entry>>;
let client: ClientState;
let drafts: FormDraftsStore;

function entry(id: string, fields: Record<string, unknown>): Entry {
    return { id, title: id, fields, file: '/hub/tasks/tasks.yml', index: 0 };
}

function lookup(collection: string, id: string): Entry | null | undefined {
    const held = known[collection] as Record<string, Entry> | undefined;
    return held === undefined ? undefined : (held[id] ?? null);
}

beforeEach(() => {
    known = { tasks: { probe: entry('probe', { status: 'open', tags: ['a', 'b'] }) } };
    client = createClientState();
    client.ui.loadUi(fakeStorage());
    drafts = createFormDrafts(client.ui, lookup);
});

const ADD = formKey('tasks', null);
const EDIT = formKey('tasks', 'probe');

/** One typed text value, over a control that held `base` before any typing. */
function typed(value: FormValue, base: FormValue = '', kind = 'text'): TypedField {
    return { value, kind, base };
}

describe('one form draft', () => {
    it('keeps a typed value and reads it back by instance and form', () => {
        drafts.setFormField('one', ADD, 'title', typed('A typed title'));
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'A typed title' });
        expect(drafts.formsDirty('one')).toBe(true);
    });
});

describe('what counts as unsaved', () => {
    it('registers the client own drafts with the close guard', () => {
        client.formDrafts.setFormField('one', ADD, 'title', typed('words'));
        expect(client.ui.unsaved('one')).toBe(true);
        client.formDrafts.clearFormDraft('one', ADD);
        expect(client.ui.unsaved('one')).toBe(false);
    });
});

describe('a reload', () => {
    it('reads the drafts back out of the storage the ui store saved them to', () => {
        const storage = fakeStorage();
        client.ui.loadUi(storage);
        drafts.setFormField('one', ADD, 'title', typed('survives'));
        drafts.setFormField(
            'one',
            EDIT,
            'links',
            typed([{ label: 'a', value: 'b' }], [], 'metalist')
        );

        const next = createClientState();
        next.ui.loadUi(storage);
        const again = createFormDrafts(next.ui, lookup);
        expect(again.formEdits('one', ADD)).toEqual({ title: 'survives' });
        expect(again.formEdits('one', EDIT)).toEqual({ links: [{ label: 'a', value: 'b' }] });
        expect(again.formsDirty('one')).toBe(true);
        expect(storage.held[UI_KEY]).toContain('survives');
    });
});
