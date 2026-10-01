// The entry forms' drafts: what a reader typed into a form, kept per view instance in the ui store
// and read back after a reload through a fake storage; whether an instance holds unsaved work,
// against the entry as the snapshot holds it now; the keys that keep two forms and two instances
// apart; what a save, a cancel, a delete and a form's close forget; the tab close that forgets
// them; and the local target a form outside any pane keeps its values in.
//
// Nothing here touches localStorage or the DOM. What a form does with a draft when it is pressed
// is a DOM event no case here fires.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Entry, Snapshot } from '../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import {
    ADDED_SUFFIX,
    FORMS_SUFFIX,
    addedKey,
    createFormDrafts,
    draftTarget,
    formKey,
    formsKey,
    localDrafts,
    parseAdded,
    parseDrafts,
    parseFormKey,
    snapshotEntries,
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

    // Revert: in takeFormDraft of state/forms/form-drafts.svelte.ts, forget the draft whatever it
    // holds.
    it("takes an add's draft only while it is still what was sent, whole", () => {
        drafts.setFormField('one', ADD, 'title', typed('sent'));
        const sent = drafts.formEdits('one', ADD);

        // Typed on while the request was out: nothing is taken and the form is not closed.
        drafts.setFormField('one', ADD, 'title', typed('typed while the save was out'));
        expect(drafts.takeFormDraft('one', ADD, sent)).toBe(false);
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'typed while the save was out' });

        // Closed and opened again, then typed into: that draft is the reader's too.
        drafts.clearFormDraft('one', ADD);
        drafts.setFormField('one', ADD, 'note', typed('typed into the form opened again'));
        expect(drafts.takeFormDraft('one', ADD, sent)).toBe(false);
        expect(drafts.formEdits('one', ADD)).toEqual({ note: 'typed into the form opened again' });

        // Closed and opened again, then one of the fields sent typed back into it: still not what
        // went, since the other field the save sent is not in it.
        drafts.clearFormDraft('one', ADD);
        drafts.setFormField('one', ADD, 'title', typed('sent'));
        expect(drafts.takeFormDraft('one', ADD, { ...sent, note: 'sent too' })).toBe(false);
        expect(drafts.formEdits('one', ADD)).toEqual({ title: 'sent' });

        // Nothing touched since it went: the draft is forgotten and the form may close.
        expect(drafts.takeFormDraft('one', ADD, sent)).toBe(true);
        expect(drafts.formEdits('one', ADD)).toEqual({});
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();

        // A form nobody typed into sent nothing, and its answer takes that nothing.
        expect(drafts.takeFormDraft('one', ADD, {})).toBe(true);
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();
    });

    // Revert: in endFormSave of state/forms/form-drafts.svelte.ts, leave the form in the record.
    it('marks a form while a save from it is out, one form and one instance at a time', () => {
        expect(drafts.formsSaving('one')).toEqual([]);
        drafts.beginFormSave('one', EDIT);
        expect(drafts.formsSaving('one')).toEqual([EDIT]);
        expect(drafts.formsSaving('two')).toEqual([]);

        // Two forms of one instance, each taken out by its own answer.
        drafts.beginFormSave('one', ADD);
        expect(drafts.formsSaving('one')).toEqual([EDIT, ADD]);
        drafts.endFormSave('one', EDIT);
        expect(drafts.formsSaving('one')).toEqual([ADD]);
        drafts.endFormSave('one', ADD);
        expect(drafts.formsSaving('one')).toEqual([]);

        // A second press of a control already saving adds nothing, and an answer for a form with no
        // save out takes nothing away.
        drafts.beginFormSave('one', ADD);
        drafts.beginFormSave('one', ADD);
        expect(drafts.formsSaving('one')).toEqual([ADD]);
        drafts.endFormSave('one', EDIT);
        expect(drafts.formsSaving('one')).toEqual([ADD]);
    });

    // Revert: in createClientState of state/client/context.ts, drop the forgetForms call from the
    // forget the layout is handed.
    it('leaves no save mark for a tab the layout closed, whenever the answer lands', () => {
        client.layout.loadLayout(fakeStorage());
        const own = client.layout.openView('tasks');
        client.formDrafts.beginFormSave(own, EDIT);
        expect(client.formDrafts.formsSaving(own)).toEqual([EDIT]);
        client.layout.closeInstance(own);
        expect(client.formDrafts.formsSaving(own)).toEqual([]);

        // The answer lands after the tab is gone: it takes a mark away and writes none back.
        client.formDrafts.endFormSave(own, EDIT);
        expect(client.formDrafts.formsSaving(own)).toEqual([]);
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

    // Revert: in localDrafts of state/forms/form-drafts.svelte.ts, have `taken` forget the draft
    // and answer true whatever it holds.
    it("takes an add's draft only while it is what was sent, as an instance's target does", () => {
        const target = draftTarget(client.formDrafts, null, localDrafts());
        target.set(ADD, 'title', typed('sent'));
        const sent = target.edits(ADD);
        target.set(ADD, 'title', typed('typed while the save was out'));
        expect(target.taken(ADD, sent)).toBe(false);
        expect(target.edits(ADD)).toEqual({ title: 'typed while the save was out' });
        expect(target.taken(ADD, target.edits(ADD))).toBe(true);
        expect(target.edits(ADD)).toEqual({});
    });

    // Revert: in localDrafts of state/forms/form-drafts.svelte.ts, have beginSave record nothing.
    it("says a save from one of its forms is out, as an instance's target does", () => {
        const target = draftTarget(client.formDrafts, null, localDrafts());
        expect(target.saving(ADD)).toBe(false);
        target.beginSave(ADD);
        expect(target.saving(ADD)).toBe(true);
        expect(target.saving(EDIT)).toBe(false);
        target.endSave(ADD);
        expect(target.saving(ADD)).toBe(false);
    });

    it('is handed the instance drafts inside a pane', () => {
        const target = draftTarget(client.formDrafts, 'one', localDrafts());
        target.set(ADD, 'title', typed('inside'));
        expect(client.formDrafts.formEdits('one', ADD)).toEqual({ title: 'inside' });
        target.clear(ADD);
        expect(client.ui.instanceState(formsKey('one'))).toBeUndefined();
    });
});

describe('the entry an add form made', () => {
    // Revert: in setFormAdded of state/forms/form-drafts.svelte.ts, keep what was made in a
    // variable of the store rather than in the instance's own state.
    it('is kept in the instance state, so a form drawn again still writes it', () => {
        drafts.setFormAdded('one', ADD, { id: 'made', value: 'made' });
        expect(drafts.formAdded('one', ADD)).toEqual({ id: 'made', value: 'made' });
        expect(drafts.formAdded('one', EDIT)).toBeNull();
        expect(drafts.formAdded('two', ADD)).toBeNull();
        expect(addedKey('one')).toBe(`one${ADDED_SUFFIX}`);

        // A store built again over the same storage, which is the form drawn again after a tab
        // switch or a reload, reads what the first one wrote.
        const again = createFormDrafts(client.ui, lookup);
        expect(again.formAdded('one', ADD)).toEqual({ id: 'made', value: 'made' });
    });

    // Revert: in clearFormDraft of state/forms/form-drafts.svelte.ts, drop the forgetAdded call, by
    // dropping the line under the signature.
    it('is forgotten when its form closes, and when its answer takes the draft whole', () => {
        drafts.setFormAdded('one', ADD, { id: 'made', value: 'made' });
        drafts.clearFormDraft('one', ADD);
        expect(drafts.formAdded('one', ADD)).toBeNull();
        expect(client.ui.instanceState(addedKey('one'))).toBeUndefined();

        drafts.setFormField('one', ADD, 'title', typed('sent'));
        const sent = drafts.formEdits('one', ADD);
        drafts.setFormAdded('one', ADD, { id: 'sent', value: 'sent' });
        expect(drafts.takeFormDraft('one', ADD, sent)).toBe(true);
        expect(drafts.formAdded('one', ADD)).toBeNull();
    });

    // Revert: in moveFormDraft of state/forms/form-drafts.svelte.ts, leave the draft where it is,
    // by returning from the line under the guard.
    it('goes with the draft when a save writes the entry under another id', () => {
        // The bookmarks are not in the snapshot, so nothing there says the entry under the new id
        // is gone. A collection the snapshot holds says so until its next push, which drops the
        // draft: the case below pins that, and it is why only the bookmark form is carried over a
        // rename.
        const before = formKey('bookmarks', 'tool.py');
        const after = formKey('bookmarks', 'tool.py renamed');
        drafts.setFormField('one', before, 'path', typed('typed while the save was out'));
        drafts.setFormAdded('one', before, { id: 'tool.py', value: 'tool.py' });

        drafts.moveFormDraft('one', before, after);
        expect(drafts.formEdits('one', before)).toEqual({});
        expect(drafts.formEdits('one', after)).toEqual({
            path: 'typed while the save was out'
        });
        expect(drafts.formAdded('one', before)).toBeNull();
        expect(drafts.formAdded('one', after)).toEqual({ id: 'tool.py', value: 'tool.py' });

        // A move onto the key the form is already under writes nothing.
        drafts.moveFormDraft('one', after, after);
        expect(drafts.formEdits('one', after)).toEqual({
            path: 'typed while the save was out'
        });
    });

    // Revert: in keep of state/forms/form-drafts.svelte.ts, write every draft whatever the snapshot
    // says, by dropping the gone check.
    it('is dropped by a move onto an entry the snapshot says the collection no longer holds', () => {
        const before = formKey('tasks', 'probe');
        drafts.setFormField('one', before, 'status', typed('typed', 'open'));
        drafts.moveFormDraft('one', before, formKey('tasks', 'probe renamed'));
        expect(drafts.formEdits('one', formKey('tasks', 'probe renamed'))).toEqual({});
    });

    // Revert: in parseAdded of state/forms/form-drafts.svelte.ts, keep every entry of the record as
    // it stands, by dropping the three guards.
    it('is read back from a record holding anything at all, keeping only what it wrote', () => {
        expect(parseAdded(undefined)).toEqual({});
        expect(parseAdded('a word')).toEqual({});
        expect(parseAdded({ [ADD]: { id: 'made', value: 'made' } })).toEqual({
            [ADD]: { id: 'made', value: 'made' }
        });
        // A key no form makes, a shape no form wrote, and an empty id are each left out.
        expect(parseAdded({ 'not a form key': { id: 'made', value: 'made' } })).toEqual({});
        expect(parseAdded({ [ADD]: { id: 5, value: 'made' } })).toEqual({});
        expect(parseAdded({ [ADD]: { id: '', value: 'made' } })).toEqual({});
    });

    // Revert: in addedKey of state/forms/form-drafts.svelte.ts, hold the made entries under the
    // instance's own id rather than under one of its own.
    it('keeps an instance whose id already ends in the added suffix apart from the one it names', () => {
        const colliding = addedKey('one');
        drafts.setFormAdded('one', ADD, { id: 'of one', value: 'of one' });
        drafts.setFormAdded(colliding, ADD, { id: 'of the other', value: 'of the other' });
        expect(drafts.formAdded('one', ADD)).toEqual({ id: 'of one', value: 'of one' });
        expect(drafts.formAdded(colliding, ADD)).toEqual({
            id: 'of the other',
            value: 'of the other'
        });
    });

    // Revert: in localDrafts of state/forms/form-drafts.svelte.ts, have setAdded record nothing.
    it('is kept by a form outside any pane in a target of its own', () => {
        const target = draftTarget(client.formDrafts, null, localDrafts());
        expect(target.added(ADD)).toBeNull();
        target.set(ADD, 'title', typed('typed'));
        target.setAdded(ADD, { id: 'made', value: 'made' });
        expect(target.added(ADD)).toEqual({ id: 'made', value: 'made' });

        const after = formKey('tasks', 'made');
        target.move(ADD, after);
        expect(target.edits(after)).toEqual({ title: 'typed' });
        expect(target.added(after)).toEqual({ id: 'made', value: 'made' });
        expect(target.added(ADD)).toBeNull();

        target.clear(after);
        expect(target.added(after)).toBeNull();
    });
});

describe('a saved record of the wrong shape', () => {
    const OK = { value: 'v', kind: 'text', base: 'b' };

    it.each([
        ['["c",null]', { collection: 'c', entry: null }],
        ['["c","e"]', { collection: 'c', entry: 'e' }],
        ['["c",3]', null],
        ['["c"]', null],
        ['["c","e","x"]', null],
        ['["c",["e"]]', null],
        ['["c",true]', null],
        ['[3,null]', null],
        ['[null,null]', null],
        ['{"0":"c","1":null,"length":2}', null],
        ['"c"', null],
        ['null', null],
        ['', null]
    ])('reads the form key %s as %j', (form, expected) => {
        expect(parseFormKey(form)).toStrictEqual(expected);
    });

    it('answers the collection before the entry', () => {
        expect(Object.keys(parseFormKey('["c","e"]') ?? {})).toStrictEqual(['collection', 'entry']);
    });

    it.each([
        [
            'a string value and base',
            { value: 's', kind: 'text', base: 'b' },
            { value: 's', kind: 'text', base: 'b' }
        ],
        [
            'a ticked value over an unticked base',
            { value: true, kind: 'checkbox', base: false },
            { value: true, kind: 'checkbox', base: false }
        ],
        ['an empty kind', { value: '', kind: '', base: '' }, { value: '', kind: '', base: '' }],
        [
            'metalist rows with a key more than a row has',
            { value: [{ label: 'a', value: 'b', extra: 1 }], kind: 'metalist', base: [] },
            { value: [{ label: 'a', value: 'b' }], kind: 'metalist', base: [] }
        ]
    ])('keeps a field holding %s', (_name, typed, expected) => {
        expect(parseDrafts({ [ADD]: { f: typed } })).toStrictEqual({ [ADD]: { f: expected } });
    });

    it.each([
        ['a kind that is a number', { value: 'x', kind: 3, base: '' }],
        ['a kind that is missing', { value: 'x', base: '' }],
        ['a value that is a number', { value: 3, kind: 'text', base: '' }],
        ['a value that is null', { value: null, kind: 'text', base: '' }],
        ['a value that is a map', { value: {}, kind: 'text', base: '' }],
        ['a value that is missing', { kind: 'text', base: '' }],
        ['a base that is missing', { value: 'x', kind: 'text' }],
        ['a base that is a number', { value: 'x', kind: 'text', base: 0 }],
        ['a base that is null', { value: 'x', kind: 'text', base: null }],
        [
            'a metalist value holding a number',
            {
                value: [{ label: 'a', value: 3 }],
                kind: 'metalist',
                base: []
            }
        ],
        [
            'a metalist base holding a number',
            {
                value: [],
                kind: 'metalist',
                base: [{ label: 3, value: 'a' }]
            }
        ],
        ['a metalist row that is null', { value: [null], kind: 'metalist', base: [] }],
        ['a metalist row that is a list', { value: [['a', 'b']], kind: 'metalist', base: [] }],
        ['a metalist row without a value', { value: [{ label: 'a' }], kind: 'metalist', base: [] }],
        ['a typed value that is null', null],
        ['a typed value that is a list', [OK]],
        ['a typed value that is a string', 'x'],
        ['a typed value that is a number', 3]
    ])('leaves out a field holding %s', (_name, typed) => {
        expect(parseDrafts({ [ADD]: { f: typed } })).toStrictEqual({});
    });

    it('keeps an empty metalist on both sides', () => {
        const typed = { value: [], kind: 'metalist', base: [] };
        expect(parseDrafts({ [ADD]: { f: typed } })).toStrictEqual({ [ADD]: { f: typed } });
    });

    it('answers a field as its value, kind and base, in that order, and nothing else', () => {
        const kept = parseDrafts({
            [ADD]: { f: { base: 'b', extra: 1, kind: 'text', value: 'v' } }
        });
        expect(Object.keys(kept[ADD].f)).toStrictEqual(['value', 'kind', 'base']);
    });

    it('answers the forms and the fields in the order the record holds them', () => {
        const kept = parseDrafts({
            [EDIT]: { z: OK, a: OK },
            [ADD]: { m: OK }
        });
        expect(Object.keys(kept)).toStrictEqual([EDIT, ADD]);
        expect(Object.keys(kept[EDIT])).toStrictEqual(['z', 'a']);
    });

    it.each([
        ['a form key with a number entry', formKeyOf(['c', 3])],
        ['a form key without an entry', formKeyOf(['c'])],
        ['a form key that is no JSON', 'not json'],
        ['a form key of the prototype', '__proto__']
    ])('leaves out the fields of %s', (_name, form) => {
        expect(parseDrafts({ [form]: { f: OK } })).toStrictEqual({});
    });

    it.each([
        ['a list', []],
        ['a list of fields', [OK]],
        ['a string', 'f'],
        ['a number', 3],
        ['null', null],
        ['a map with no field', {}]
    ])('leaves out a form whose fields are %s', (_name, fields) => {
        expect(parseDrafts({ [ADD]: fields })).toStrictEqual({});
    });

    it('keeps the fields of a form that pass beside the ones that do not', () => {
        const kept = parseDrafts({
            [ADD]: { good: OK, bad: { value: 3, kind: 'text', base: '' } }
        });
        expect(kept).toStrictEqual({ [ADD]: { good: OK } });
    });

    it.each([[undefined], [null], [[]], [[ADD]], ['x'], [3], [true]])(
        'answers no drafts for the record %j',
        (raw) => {
            expect(parseDrafts(raw)).toStrictEqual({});
        }
    );

    it('answers a draft a plain object of its own', () => {
        const kept = parseDrafts({ [ADD]: { f: OK } });
        expect(Object.getPrototypeOf(kept)).toBe(Object.prototype);
        expect(Object.getPrototypeOf(kept[ADD])).toBe(Object.prototype);
    });

    it('skips an own __proto__ field of a draft and keeps the others', () => {
        const fields = parsed(
            '{"__proto__":{"kind":"text","value":"x","base":""},"title":{"kind":"text","value":"t","base":""}}'
        );
        const kept = parseDrafts({ [ADD]: fields });
        expect(Object.keys(kept)).toStrictEqual([ADD]);
        expect(Object.keys(kept[ADD])).toStrictEqual(['title']);
        expect(Object.getPrototypeOf(kept[ADD])).toBe(Object.prototype);
        expect(kept).toStrictEqual({ [ADD]: { title: { value: 't', kind: 'text', base: '' } } });
    });

    it('keeps no form whose only field is an own __proto__ key', () => {
        const fields = parsed('{"__proto__":{"kind":"text","value":"x","base":""}}');
        expect(parseDrafts({ [ADD]: fields })).toStrictEqual({});
    });

    it('keeps no field of a draft whose typed values carry no base, __proto__ among them', () => {
        const fields = parsed(
            '{"__proto__":{"kind":"text","value":"x"},"title":{"kind":"text","value":"t"}}'
        );
        expect(parseDrafts({ [ADD]: fields })).toStrictEqual({});
    });

    it('leaves out a record whose own key is __proto__', () => {
        const raw = parsed('{"__proto__":{"f":{"kind":"text","value":"x","base":""}}}');
        expect(parseDrafts(raw)).toStrictEqual({});
    });

    it.each([
        ['an id and a value', { id: 'a', value: 'b' }, { id: 'a', value: 'b' }],
        ['an empty value', { id: 'a', value: '' }, { id: 'a', value: '' }],
        ['more keys than it wrote', { value: 'b', extra: 1, id: 'a' }, { id: 'a', value: 'b' }],
        ['an empty id', { id: '', value: 'b' }, undefined],
        ['a number id', { id: 3, value: 'b' }, undefined],
        ['a number value', { id: 'a', value: 3 }, undefined],
        ['no value', { id: 'a' }, undefined],
        ['no id', { value: 'b' }, undefined],
        ['null', null, undefined],
        ['a list', ['a', 'b'], undefined],
        ['a string', 'a', undefined]
    ])('reads the added entry %s', (_name, held, expected) => {
        const kept = parseAdded({ [ADD]: held });
        expect(kept).toStrictEqual(expected === undefined ? {} : { [ADD]: expected });
        if (expected !== undefined) {
            expect(Object.keys(kept[ADD])).toStrictEqual(['id', 'value']);
        }
    });

    it.each([
        ['a form key with a number entry', formKeyOf(['c', 3])],
        ['a form key without an entry', formKeyOf(['c'])],
        ['a form key that is no JSON', 'not json']
    ])('leaves out the added entry of %s', (_name, form) => {
        expect(parseAdded({ [form]: { id: 'a', value: 'b' } })).toStrictEqual({});
    });

    it.each([[undefined], [null], [[]], [[{ id: 'a', value: 'b' }]], ['x'], [3]])(
        'answers no added entries for the record %j',
        (raw) => {
            expect(parseAdded(raw)).toStrictEqual({});
        }
    );

    it('answers the added entries in the order the record holds them', () => {
        const kept = parseAdded({
            [EDIT]: { id: 'e', value: 'e' },
            [ADD]: { id: 'a', value: 'a' }
        });
        expect(Object.keys(kept)).toStrictEqual([EDIT, ADD]);
    });

    it('leaves out an own __proto__ key of the added entries, which no form key names', () => {
        const raw = parsed('{"__proto__":{"id":"a","value":"b"}}');
        expect(parseAdded(raw)).toStrictEqual({});
    });
});

/** A form key written by hand, for the shapes formKey does not make. */
function formKeyOf(parts: unknown[]): string {
    return JSON.stringify(parts);
}

describe('the snapshot lookup over a collection named like a property of every object', () => {
    it.each([['constructor'], ['__proto__'], ['toString'], ['hasOwnProperty']])(
        'knows nothing of the collection %s',
        (collection) => {
            const snapshot = {
                entities: { collections: { tasks: { id: 'tasks', entries: [entry('probe', {})] } } }
            } as unknown as Snapshot;
            expect(snapshotEntries(() => snapshot)(collection, 'probe')).toBeUndefined();
        }
    );

    it('keeps a draft of such a collection without asking the snapshot anything that throws', () => {
        const form = formKey('constructor', 'probe');
        const lookup = snapshotEntries(
            () => ({ entities: { collections: {} } }) as unknown as Snapshot
        );
        createFormDrafts(client.ui, lookup).setFormField('one', form, 'title', typed('typed'));
        const again = createFormDrafts(client.ui, lookup);
        expect(again.formEdits('one', form)).toStrictEqual({ title: 'typed' });
        expect(again.formsDirty('one')).toBe(true);
    });
});

/** A JSON text read as the unknown value a saved record or a config holds. */
function parsed(text: string): unknown {
    return JSON.parse(text) as unknown;
}
