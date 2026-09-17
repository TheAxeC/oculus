// The entry forms' drafts: what a reader typed into a form, kept per view instance in the ui store
// and read back after a reload through a fake storage; whether an instance holds unsaved work,
// against the entry as the snapshot holds it now; the keys that keep two forms and two instances
// apart; what a save, a cancel, a delete and a form's close forget; the tab close that forgets them;
// and the local target a form outside any pane keeps its values in.
//
// Nothing here touches localStorage or the DOM. What a form does with a draft when it is pressed
// is tests/browser/unsaved-forms.spec.ts.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Entry, Snapshot } from '../../src/lib/data/model.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import {
    FORMS_SUFFIX,
    createFormDrafts,
    draftTarget,
    formKey,
    formsKey,
    localDrafts,
    parseDrafts,
    parseFormKey,
    snapshotEntries,
    type FormDraftsStore,
    type TypedField
} from '../../src/lib/state/form-drafts.svelte.ts';
import type { FormValue } from '../../src/lib/state/form-values.ts';
import { UI_KEY } from '../../src/lib/state/ui.svelte.ts';
import { setCatalog } from '../../src/lib/state/text.ts';
import { createClientState, type ClientState } from '../client.ts';
import { fakeStorage } from './layout-fixture.ts';

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

    it('forgets a draft a cancel or a delete threw away, and only that one', () => {
        drafts.setFormField('one', ADD, 'title', typed('added'));
        drafts.setFormField('one', EDIT, 'status', typed('done', 'open'));
        drafts.clearFormDraft('one', ADD);
        expect(drafts.formEdits('one', ADD)).toEqual({});
        expect(drafts.formEdits('one', EDIT)).toEqual({ status: 'done' });
        drafts.clearFormDraft('one', EDIT);
        expect(drafts.formEdits('one', EDIT)).toEqual({});
        expect(drafts.formsDirty('one')).toBe(false);
        // An instance with no form left holding anything leaves no entry behind in the ui store.
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();
    });
});

describe('what counts as unsaved', () => {
    it('compares an edit form with the entry as the snapshot holds it now', () => {
        drafts.setFormField('one', EDIT, 'status', typed('review', 'open'));
        expect(drafts.formsDirty('one')).toBe(true);
        // The file comes to hold what was typed: nothing is unsaved.
        known.tasks.probe = entry('probe', { status: 'review' });
        expect(drafts.formsDirty('one')).toBe(false);
        // Typed back to what the entry held at the keystroke, over an entry that has since changed.
        drafts.setFormField('one', EDIT, 'status', typed('open', 'open'));
        known.tasks.probe = entry('probe', { status: 'changed-on-disk' });
        expect(drafts.formsDirty('one')).toBe(true);
    });

    it('never counts a draft whose entry the collection no longer holds, and drops it at the next write', () => {
        drafts.setFormField('one', EDIT, 'status', typed('review', 'open'));
        drafts.setFormField('one', ADD, 'title', typed('kept'));
        known.tasks = {};
        drafts.clearFormDraft('one', ADD);
        expect(drafts.formsDirty('one')).toBe(false);
        expect(drafts.formEdits('one', EDIT)).toEqual({});
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();

        // Gone with no write after it: still held in storage, and never counted.
        known.tasks = { probe: entry('probe', { status: 'open' }) };
        drafts.setFormField('two', EDIT, 'status', typed('review', 'open'));
        expect(drafts.formsDirty('two')).toBe(true);
        known.tasks = {};
        expect(client.ui.instanceState(formsKey('two'))).toBeDefined();
        expect(drafts.formsDirty('two')).toBe(false);
    });

    it('compares an add form, and an entry the snapshot says nothing about, with the opening value', () => {
        drafts.setFormField('one', ADD, 'root', typed('hub', 'hub'));
        expect(drafts.formsDirty('one')).toBe(false);
        drafts.setFormField('one', ADD, 'root', typed('other', 'hub'));
        expect(drafts.formsDirty('one')).toBe(true);

        const mark = formKey('bookmarks', 'notes');
        drafts.setFormField('two', mark, 'label', typed('notes', 'notes'));
        expect(drafts.formsDirty('two')).toBe(false);
        drafts.setFormField('two', mark, 'label', typed('renamed', 'notes'));
        expect(drafts.formsDirty('two')).toBe(true);
    });

    it('counts nothing the save would write unchanged', () => {
        drafts.setFormField('one', EDIT, 'status', typed(' open ', 'open'));
        drafts.setFormField('one', EDIT, 'tags', typed('a,b', 'a, b', 'tags'));
        expect(drafts.formsDirty('one')).toBe(false);
        drafts.setFormField('one', EDIT, 'tags', typed('a, b, c', 'a, b', 'tags'));
        expect(drafts.formsDirty('one')).toBe(true);
    });

    it('registers the client own drafts with the close guard', () => {
        client.formDrafts.setFormField('one', ADD, 'title', typed('words'));
        expect(client.ui.unsaved('one')).toBe(true);
        client.formDrafts.clearFormDraft('one', ADD);
        expect(client.ui.unsaved('one')).toBe(false);
    });
});

describe('a save', () => {
    it('forgets what it sent and keeps a value typed while it was on its way', () => {
        drafts.setFormField('one', ADD, 'title', typed('sent'));
        drafts.setFormField('one', ADD, 'note', typed('sent too'));
        const sent = drafts.formEdits('one', ADD);
        drafts.setFormField('one', ADD, 'note', typed('typed after'));
        drafts.setFormField('one', ADD, 'status', typed('typed first after'));
        expect(drafts.settleFormDraft('one', ADD, sent)).toBe(true);
        expect(drafts.formEdits('one', ADD)).toEqual({
            note: 'typed after',
            status: 'typed first after'
        });
    });

    it('forgets the whole draft when nothing was typed after it went', () => {
        drafts.setFormField('one', ADD, 'title', typed('sent'));
        expect(drafts.settleFormDraft('one', ADD, drafts.formEdits('one', ADD))).toBe(false);
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();
    });

    it('writes nothing back for a draft the tab close took away before the answer landed', () => {
        drafts.setFormField('one', ADD, 'title', typed('sent'));
        const sent = drafts.formEdits('one', ADD);
        client.ui.clearInstanceState(formsKey('one'));
        expect(drafts.settleFormDraft('one', ADD, sent)).toBe(false);
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();
    });
});

describe("a form's close", () => {
    it('forgets the add form draft when its toggle closes it, and nothing when it opens it', () => {
        drafts.setFormField('one', ADD, 'title', typed('typed'));
        expect(drafts.toggleAdd('one', 'tasks', false)).toBe(true);
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'typed' });
        expect(drafts.toggleAdd('one', 'tasks', true)).toBe(false);
        expect(drafts.formEdits('one', ADD)).toEqual({});
    });

    it('forgets the edit form that closes, whether its own toggle or another card closes it', () => {
        known.tasks.other = entry('other', { status: 'open' });
        const other = formKey('tasks', 'other');
        drafts.setFormField('one', EDIT, 'status', typed('review', 'open'));
        expect(drafts.toggleEdit('one', 'tasks', '', 'probe')).toBe('probe');
        expect(drafts.formEdits('one', EDIT)).toEqual({ status: 'review' });
        expect(drafts.toggleEdit('one', 'tasks', 'probe', 'other')).toBe('other');
        expect(drafts.formEdits('one', EDIT)).toEqual({});
        drafts.setFormField('one', other, 'status', typed('done', 'open'));
        expect(drafts.toggleEdit('one', 'tasks', 'other', 'other')).toBe('');
        expect(drafts.formEdits('one', other)).toEqual({});
    });
});

describe('the keys', () => {
    it('keeps two forms of one instance apart', () => {
        drafts.setFormField('one', ADD, 'title', typed('added'));
        drafts.setFormField('one', EDIT, 'title', typed('edited', 'probe'));
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'added' });
        expect(drafts.formEdits('one', EDIT)).toEqual({ title: 'edited' });
    });

    it('keeps one form of two instances apart', () => {
        drafts.setFormField('one', ADD, 'title', typed('in one'));
        drafts.setFormField('two', ADD, 'title', typed('in two'));
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'in one' });
        expect(drafts.formEdits('two', ADD)).toEqual({ title: 'in two' });
        drafts.clearFormDraft('one', ADD);
        expect(drafts.formsDirty('one')).toBe(false);
        expect(drafts.formsDirty('two')).toBe(true);
    });

    it('never gives the add form and an entry whose id is "new" or null-like one key', () => {
        const keys = [
            formKey('tasks', null),
            formKey('tasks', 'new'),
            formKey('tasks', 'null'),
            formKey('tasks', ''),
            formKey('', null),
            formKey('tasks","x', null),
            formKey('tasks', '","x')
        ];
        expect(new Set(keys).size).toBe(keys.length);
        for (const key of keys) expect(parseFormKey(key)).not.toBeNull();
        expect(parseFormKey('["tasks"]')).toBeNull();
        expect(parseFormKey('[7, null]')).toBeNull();
        expect(parseFormKey('not json')).toBeNull();
    });

    it('keeps an empty collection name and an empty entry id as keys of their own', () => {
        drafts.setFormField('one', formKey('', ''), 'title', typed('empty'));
        expect(drafts.formEdits('one', formKey('', ''))).toEqual({ title: 'empty' });
        expect(drafts.formEdits('one', formKey('', null))).toEqual({});
    });

    it('lets a second value typed into one field replace the first rather than sit beside it', () => {
        drafts.setFormField('one', ADD, 'title', typed('first'));
        drafts.setFormField('one', ADD, 'title', typed('second'));
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'second' });
    });

    it("sits beside the host view's own state, which a host writing its record whole cannot drop", () => {
        drafts.setFormField('one', ADD, 'title', typed('kept'));
        client.ui.setInstanceState('one', { search: 'x', statuses: [], hidden: [] });
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'kept' });
        expect(client.ui.instanceState('one')).toEqual({ search: 'x', statuses: [], hidden: [] });
        expect(formsKey('one')).toBe(`one${FORMS_SUFFIX}`);
    });

    it('keeps an instance whose id already ends in the suffix apart from the instance it names', () => {
        const colliding = formsKey('one');
        drafts.setFormField('one', ADD, 'title', typed('of one'));
        drafts.setFormField(colliding, ADD, 'title', typed('of the other'));
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'of one' });
        expect(drafts.formEdits(colliding, ADD)).toEqual({ title: 'of the other' });
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

    it('leaves out what a saved record holds that no control could', () => {
        expect(
            parseDrafts({
                [ADD]: {
                    title: { value: 'ok', kind: 'text', base: '' },
                    count: { value: 3, kind: 'text', base: '' },
                    rows: { value: [{ label: 1, value: 'x' }], kind: 'metalist', base: [] },
                    half: { value: 'no base', kind: 'text' },
                    kindless: { value: 'x', base: '' }
                },
                [EDIT]: 'not a form',
                'not a form key': { title: { value: 'x', kind: 'text', base: '' } },
                [formKey('tasks', 'empty')]: {}
            })
        ).toEqual({ [ADD]: { title: { value: 'ok', kind: 'text', base: '' } } });
        expect(parseDrafts(null)).toEqual({});
        expect(parseDrafts([])).toEqual({});
    });
});

describe('the snapshot lookup', () => {
    it('tells an entry, a missing entry and a collection it knows nothing of apart', () => {
        let snapshot: Snapshot | null = null;
        const entries = snapshotEntries(() => snapshot);
        expect(entries('tasks', 'probe')).toBeUndefined();
        snapshot = {
            entities: {
                collections: { tasks: { id: 'tasks', entries: [entry('probe', {})] } }
            }
        } as unknown as Snapshot;
        expect(entries('tasks', 'probe')?.id).toBe('probe');
        expect(entries('tasks', 'gone')).toBeNull();
        expect(entries('bookmarks', 'notes')).toBeUndefined();
    });
});

describe('a tab close', () => {
    it("forgets the closed instance's form drafts through the layout and nobody else's", () => {
        client.layout.loadLayout(fakeStorage());
        const one = client.layout.openView('tasks');
        const two = client.layout.openView('pillars');
        client.formDrafts.setFormField(one, ADD, 'title', typed('goes with the tab'));
        client.formDrafts.setFormField(two, ADD, 'title', typed('stays'));
        client.layout.closeInstance(one);
        expect(client.formDrafts.formEdits(one, ADD)).toEqual({});
        expect(client.ui.instanceState(formsKey(one))).toBeUndefined();
        expect(client.formDrafts.formEdits(two, ADD)).toEqual({ title: 'stays' });
    });

    it('asks nothing of an instance that never held a form', () => {
        expect(client.ui.unsaved('nobody')).toBe(false);
        expect(drafts.formsDirty('nobody')).toBe(false);
    });
});

describe('a form outside any pane', () => {
    it('keeps what is typed in its own target, and no instance holds a draft', () => {
        const target = draftTarget(client.formDrafts, null, localDrafts());
        target.set(ADD, 'title', typed('typed outside a pane'));
        expect(target.edits(ADD)).toEqual({ title: 'typed outside a pane' });
        expect(client.ui.instanceState(formsKey(''))).toBeUndefined();
        const saved = fakeStorage();
        client.ui.loadUi(saved);
        target.set(ADD, 'title', typed('typed again'));
        expect(saved.held[UI_KEY]).toBeUndefined();
        expect(target.settle(ADD, { title: 'typed again' })).toBe(false);
        expect(target.edits(ADD)).toEqual({});
    });

    it('is handed the instance drafts inside a pane', () => {
        const target = draftTarget(client.formDrafts, 'one', localDrafts());
        target.set(ADD, 'title', typed('inside'));
        expect(client.formDrafts.formEdits('one', ADD)).toEqual({ title: 'inside' });
        target.clear(ADD);
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();
    });
});
