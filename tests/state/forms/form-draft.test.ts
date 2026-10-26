// Layer 2, client-state tests. The draft of a form: the edits kept in the editor instance's ui
// record under the kind of form and the thing they were typed for, compared against the saved
// value now, settled after a save, and read back after a reload from the view states a second
// page's page state is handed, as the server's read hands them.
//
// The project is synthetic and handed to the project target through its projectOf argument, and
// the page kind is judged by a table of saved values, so what is checked is the draft. Typing into
// the form and pressing Save are DOM events no case here fires.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    primaryKeyOf,
    type Collection,
    type Project,
    type SchemaField,
    type Snapshot
} from '../../../src/lib/data/model/index.ts';
import {
    createFormDraft,
    type DraftTarget,
    type FormDraftStore
} from '../../../src/lib/state/forms/form-draft.ts';
import {
    createPages,
    pageDraftTarget,
    type Pages
} from '../../../src/lib/state/forms/page-entry.ts';
import { createSettled } from '../../../src/lib/state/forms/settled.svelte.ts';
import {
    projectDraftTarget,
    writableField,
    type FormField
} from '../../../src/lib/state/forms/schema.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;
let projects: Record<string, Project>;
let saved: Record<string, Record<string, unknown>>;
let drafts: FormDraftStore;

function project(id: string, statusLine: string): Project {
    const fields: Partial<Project> = {
        id,
        title: `The ${id} project`,
        statusLine,
        pillarIds: [],
        domainIds: [],
        fundingIds: [],
        datasetIds: [],
        relatedIds: [],
        resourceIds: [],
        results: [],
        ideas: [],
        lead: [],
        collaborators: [],
        supervisors: [],
        waitingOn: [],
        followups: [],
        subtasks: []
    };
    return fields as Project;
}

/** A page entry judged by the table of its saved values; `key` is not written by a save. */
function pageTarget(): DraftTarget {
    return {
        values: (name) => saved[name] ?? null,
        differs: (_name, _field, edit, value) => JSON.stringify(edit) !== JSON.stringify(value),
        writable: (_name, field) => field !== 'key'
    };
}

function build(storeOf: ClientState): FormDraftStore {
    return createFormDraft(storeOf.ui, {
        project: projectDraftTarget(
            (id) => projects[id] ?? null,
            (_key, values) => values,
            () => false,
            () => [{ field: 'id', label: 'id', type: 'text', section: '', primary_key: true }]
        ),
        page: pageTarget()
    });
}

beforeEach(() => {
    client = createClientState();
    projects = { alpha: project('alpha', 'drafting'), beta: project('beta', 'submitted') };
    saved = { 'venues:jbhi': { short: 'JBHI', tier: 'a' } };
    drafts = build(client);
});

describe('the edits', () => {
    it('keeps an edit per instance and reports it unsaved while it differs', () => {
        drafts.editDraft('ed-1', 'project', 'alpha', 'status.line', 'under review');
        expect(drafts.draftEdits('ed-1', 'project', 'alpha')).toEqual({
            'status.line': 'under review'
        });
        expect(drafts.draftDirty('ed-1')).toBe(true);
        expect(drafts.draftDirty('ed-2')).toBe(false);
    });

    it('reads the edits typed for another thing as none', () => {
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'short', 'J-BHI');
        expect(drafts.draftEdits('ed-1', 'page', 'venues:other')).toEqual({});
        expect(drafts.draftEdits('ed-1', 'project', 'alpha')).toEqual({});
    });

    it('does not count an edit equal to the saved value, nor one the save does not write', () => {
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'short', 'JBHI');
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'key', 'changed');
        expect(drafts.draftDirty('ed-1')).toBe(false);
    });

    it('does not count an edit of the field the manifest form flags as its primary key', () => {
        drafts.editDraft('ed-1', 'project', 'alpha', 'id', 'renamed');
        expect(drafts.draftDirty('ed-1')).toBe(false);
    });

    it('writes every field of a manifest form whose flag is on a tags field, as no reader keys by it', () => {
        const form = (field: string, type: string, flagged: boolean): FormField => ({
            field,
            label: field,
            type,
            section: '',
            ...(flagged ? { primary_key: true as const } : {})
        });
        const onTags = [form('id', 'text', false), form('lead', 'tags', true)];
        expect(primaryKeyOf(onTags)).toBeNull();
        expect(writableField('lead', onTags)).toBe(true);
        expect(writableField('id', onTags)).toBe(true);
        const onText = [form('id', 'text', true), form('lead', 'tags', false)];
        expect(writableField('id', onText)).toBe(false);
        expect(writableField('lead', onText)).toBe(true);
    });

    it('counts any edit of a thing the snapshot does not hold', () => {
        drafts.editDraft('ed-1', 'page', 'venues:gone', 'short', 'words');
        expect(drafts.draftDirty('ed-1')).toBe(true);
    });
});

describe('a save', () => {
    it('keeps a refused field and a field typed again, and drops the rest', () => {
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'short', 'J-BHI');
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'tier', 'b');
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'note', 'first');
        saved['venues:jbhi'] = { short: 'J-BHI', tier: 'a' };
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'note', 'second');

        drafts.settleDraft('ed-1', { short: 'J-BHI', tier: 'b', note: 'first' }, ['tier']);

        expect(drafts.draftEdits('ed-1', 'page', 'venues:jbhi')).toEqual({
            tier: 'b',
            note: 'second'
        });
    });
});

describe('a revert', () => {
    it('drops every edit and the unsaved mark with them', () => {
        drafts.editDraft('ed-1', 'page', 'venues:jbhi', 'short', 'J-BHI');
        drafts.revertDraft('ed-1');
        expect(drafts.draftEdits('ed-1', 'page', 'venues:jbhi')).toEqual({});
        expect(drafts.draftDirty('ed-1')).toBe(false);
    });
});

describe('a reload', () => {
    it('reads the edits back out of the view states the page state keeps', () => {
        drafts.editDraft('ed-1', 'project', 'alpha', 'lead', ['faes', 'another']);

        const next = createClientState();
        next.pageState.install({
            layouts: {},
            views: client.pageState.views(),
            debug: null,
            version: 1,
            findings: []
        });
        const again = build(next);
        expect(again.draftEdits('ed-1', 'project', 'alpha')).toEqual({
            lead: ['faes', 'another']
        });
        expect(again.draftDirty('ed-1')).toBe(true);
    });

    it('keeps the thing the edits were typed for as its hub and its name, and reads them back', () => {
        drafts.editDraft('ed-1', 'project', 'lab:alpha', 'lead', ['faes']);
        expect(client.ui.instanceState('ed-1')).toEqual({
            draft: { kind: 'project', hub: 'lab', name: 'alpha', edits: { lead: ['faes'] } }
        });
        expect(build(client).draftEdits('ed-1', 'project', 'lab:alpha')).toEqual({
            lead: ['faes']
        });
    });
});

describe('the wiring', () => {
    it("registers the client's own form draft with the close guard", () => {
        const wired = createClientState();
        wired.formDraft.editDraft('ed-1', 'project', 'not-in-any-snapshot', 'title', 'words');
        expect(wired.ui.unsaved('ed-1')).toBe(true);
        wired.formDraft.revertDraft('ed-1');
        expect(wired.ui.unsaved('ed-1')).toBe(false);
    });
});

describe('a save the snapshot has not caught up with', () => {
    const SCHEMA: SchemaField[] = [
        { field: 'key', type: 'text', primary_key: true },
        { field: 'title', type: 'text', display: 1 },
        { field: 'role', type: 'text' }
    ];
    let version: number;
    let held: Record<string, Record<string, unknown>>;
    let settledPages: Pages;
    let settledDrafts: FormDraftStore;

    function snapshot(): Snapshot {
        const entries = Object.entries(held).map(([key, fields], index) => ({
            id: `hub:${key}`,
            root: 'hub',
            title: typeof fields.title === 'string' ? fields.title : '',
            fields,
            file: '/hub/pillars.yml',
            index
        }));
        const pillars: Collection = {
            id: 'hub:pillars',
            root: 'hub',
            title: 'Pillars',
            file: '/hub/pillars.yml',
            schema: SCHEMA,
            primary_key: 'key',
            entries
        };
        const career = {
            title: 'Career',
            sections: { milestone: 'Veni' },
            schema: [{ field: 'milestone', type: 'text' }]
        };
        return {
            entities: { collections: { 'hub:pillars': pillars }, career }
        } as unknown as Snapshot;
    }

    beforeEach(() => {
        version = 1;
        held = { alpha: { key: 'alpha', title: 'Old title', role: 'lead' } };
        const settled = createSettled(() => version);
        settledPages = createPages({ snapshot, feeds: () => null }, settled);
        settledDrafts = createFormDraft(client.ui, { page: pageDraftTarget(settledPages) });
    });

    /** What the server answered for a save of `fields`: written, so the page holds them. */
    function saved(id: string, fields: Record<string, unknown>, seq = settledPages.settle.begin()) {
        settledPages.settle.entry('pillars', id, fields, seq);
    }

    it('shows the saved title and clean fields at once, and the tab title with them', () => {
        settledDrafts.editDraft('ed-1', 'page', 'hub:pillars:alpha', 'title', 'New title');
        saved('hub:alpha', { title: 'New title' });
        settledDrafts.settleDraft('ed-1', { title: 'New title' }, []);

        const page = settledPages.pageOf('pillars', 'hub:alpha');
        expect(page?.values.title).toBe('New title');
        expect(page?.title).toBe('New title');
        expect(settledDrafts.draftEdits('ed-1', 'page', 'hub:pillars:alpha')).toEqual({});
        expect(settledDrafts.draftDirty('ed-1')).toBe(false);
    });

    it('shows a saved person role and a saved career section at once', () => {
        saved('hub:alpha', { role: 'adviser' });
        settledPages.settle.career({ milestone: 'Vidi' }, settledPages.settle.begin());

        expect(settledPages.pageOf('pillars', 'hub:alpha')?.values.role).toBe('adviser');
        expect(settledPages.pageNamed('career')?.values.milestone).toBe('Vidi');
    });

    it('shows the value the snapshot has once another writer changed the field', () => {
        saved('hub:alpha', { title: 'New title' });
        held = { alpha: { key: 'alpha', title: 'Written elsewhere', role: 'lead' } };
        version = 2;

        expect(settledPages.pageOf('pillars', 'hub:alpha')?.values.title).toBe('Written elsewhere');
    });

    it('keeps the saved value while the snapshot still shows the old one, and drops it for good after two builds', () => {
        saved('hub:alpha', { title: 'New title' });
        version = 2;
        expect(settledPages.pageOf('pillars', 'hub:alpha')?.values.title).toBe('New title');
        version = 3;
        expect(settledPages.pageOf('pillars', 'hub:alpha')?.values.title).toBe('Old title');
    });

    it('holds the values of the newest of two saves, whichever answer comes last', () => {
        const first = settledPages.settle.begin();
        const second = settledPages.settle.begin();
        saved('hub:alpha', { title: 'Second' }, second);
        saved('hub:alpha', { title: 'First' }, first);

        expect(settledPages.pageOf('pillars', 'hub:alpha')?.values.title).toBe('Second');
    });

    it('moves the page and its tab to the key a save gave the entry', () => {
        saved('hub:alpha', { key: 'beta' });

        expect(settledPages.pageOf('pillars', 'hub:alpha')?.key).toBe('hub:beta');
        expect(settledPages.pageOf('pillars', 'hub:beta')).toMatchObject({
            key: 'hub:beta',
            title: 'Old title'
        });
    });

    it('keeps an edit the save did not take under the key the save gave the entry', () => {
        settledDrafts.editDraft('ed-1', 'page', 'hub:pillars:alpha', 'key', 'beta');
        settledDrafts.editDraft('ed-1', 'page', 'hub:pillars:alpha', 'role', 'adviser');
        saved('hub:alpha', { key: 'beta' });
        settledDrafts.settleDraft('ed-1', { key: 'beta', role: 'adviser' }, ['role']);

        expect(settledDrafts.draftEdits('ed-1', 'page', 'hub:pillars:beta')).toEqual({
            role: 'adviser'
        });
    });

    it('shows an entry a write added from its first frame, and gives way to the snapshot', () => {
        expect(settledPages.pageOf('pillars', 'hub:gamma')).toBeNull();
        settledPages.settle.added(
            'pillars',
            'hub:gamma',
            { key: 'gamma', title: 'Fresh' },
            settledPages.settle.begin()
        );

        expect(settledPages.pageOf('pillars', 'hub:gamma')).toMatchObject({
            key: 'hub:gamma',
            title: 'Fresh'
        });
        held = { ...held, gamma: { key: 'gamma', title: 'Fresh', role: '' } };
        version = 2;
        expect(settledPages.pageOf('pillars', 'hub:gamma')?.values.role).toBe('');
    });
});
