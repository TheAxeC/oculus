// Layer 2, client-state tests. The manifest editor's draft: the edits kept in the editor instance's
// ui record, compared against the project's value in the snapshot now, forgotten by Revert and by
// what a save took, and read back after a reload through a fake storage.
//
// The project is synthetic and handed to the store through its projectOf argument, so what is
// checked is the draft. Typing into the form and pressing Save are DOM events no case here fires.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '../../../src/lib/data/model/index.ts';
import {
    createManifestDraft,
    editDiffers,
    parseManifestDraft,
    type ManifestDraftStore
} from '../../../src/lib/state/forms/manifest-draft.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { fakeStorage } from '../workbench/layout/layout-fixture.ts';

let client: ClientState;
let projects: Record<string, Project>;
let drafts: ManifestDraftStore;

function project(id: string, statusLine: string): Project {
    const fields: Partial<Project> = {
        id,
        title: `The ${id} project`,
        statusLine,
        authors: ['Faes'],
        pillarIds: [],
        domainIds: [],
        fundingIds: [],
        datasetIds: [],
        relatedIds: [],
        results: [],
        ideas: [],
        collaborators: [],
        waitingOn: [],
        followups: [],
        subtasks: []
    };
    return fields as Project;
}

beforeEach(() => {
    client = createClientState();
    client.ui.loadUi(fakeStorage());
    projects = { alpha: project('alpha', 'drafting'), beta: project('beta', 'submitted') };
    drafts = createManifestDraft(client.ui, (id) => projects[id] ?? null);
});

describe('the edits', () => {
    it('keeps an edit per instance and reports it unsaved while it differs', () => {
        drafts.editManifest('ed-1', 'alpha', 'status.line', 'under review');
        expect(drafts.manifestEdits('ed-1', 'alpha')).toEqual({ 'status.line': 'under review' });
        expect(drafts.manifestDirty('ed-1')).toBe(true);
        expect(drafts.manifestDirty('ed-2')).toBe(false);
    });

    it('reports nothing unsaved for an edit that says what the project says, trimmed', () => {
        drafts.editManifest('ed-1', 'alpha', 'status.line', 'drafting  ');
        expect(drafts.manifestDirty('ed-1')).toBe(false);
        expect(editDiffers(['a', 'b'], ['a', 'b'])).toBe(false);
        expect(editDiffers(['a', 'b'], ['a'])).toBe(true);
    });

    it('answers from the snapshot now: an edit the file came to hold is no longer unsaved', () => {
        drafts.editManifest('ed-1', 'alpha', 'status.line', 'accepted');
        expect(drafts.manifestDirty('ed-1')).toBe(true);
        projects.alpha = project('alpha', 'accepted');
        expect(drafts.manifestDirty('ed-1')).toBe(false);
    });

    it('reports nothing unsaved for a follow-up edit kept from before the project held two notes', () => {
        projects.alpha = {
            ...project('alpha', 'drafting'),
            followups: [{ do: 'first' }, { do: 'second' }]
        };
        drafts.editManifest('ed-1', 'alpha', 'followup.do', 'typed earlier');
        // No save posts the field of a project with several notes, so closing the tab loses
        // nothing.
        expect(drafts.manifestDirty('ed-1')).toBe(false);
        drafts.editManifest('ed-1', 'alpha', 'next', 'go');
        expect(drafts.manifestDirty('ed-1')).toBe(true);
    });

    it('reports nothing unsaved for a date typed for a project with no note, until the text is typed', () => {
        drafts.editManifest('ed-1', 'alpha', 'followup.after', '2026-12-01');
        // A date alone is not a note, so no save posts it and closing the tab loses nothing.
        expect(drafts.manifestDirty('ed-1')).toBe(false);
        drafts.editManifest('ed-1', 'alpha', 'followup.do', 'call');
        expect(drafts.manifestDirty('ed-1')).toBe(true);
    });

    it('keeps two instances apart and never hands one project the edits of another', () => {
        drafts.editManifest('ed-1', 'alpha', 'title', 'one');
        drafts.editManifest('ed-2', 'beta', 'title', 'two');
        expect(drafts.manifestEdits('ed-1', 'alpha')).toEqual({ title: 'one' });
        expect(drafts.manifestEdits('ed-2', 'beta')).toEqual({ title: 'two' });
        expect(drafts.manifestEdits('ed-1', 'beta')).toEqual({});
        // An edit typed for another project than the draft's starts the draft afresh.
        drafts.editManifest('ed-1', 'beta', 'next', 'three');
        expect(drafts.manifestEdits('ed-1', 'beta')).toEqual({ next: 'three' });
        expect(drafts.manifestEdits('ed-1', 'alpha')).toEqual({});
    });

    it('treats a draft for a project the snapshot no longer holds as unsaved when it has words', () => {
        drafts.editManifest('ed-1', 'gone', 'title', 'words');
        expect(drafts.manifestDirty('ed-1')).toBe(true);
        drafts.editManifest('ed-2', 'gone', 'title', '');
        expect(drafts.manifestDirty('ed-2')).toBe(false);
    });

    it('forgets every edit on Revert', () => {
        drafts.editManifest('ed-1', 'alpha', 'title', 'one');
        drafts.editManifest('ed-1', 'alpha', 'next', 'two');
        drafts.revertManifest('ed-1');
        expect(drafts.manifestEdits('ed-1', 'alpha')).toEqual({});
        expect(drafts.manifestDirty('ed-1')).toBe(false);
        expect(client.ui.instanceState('ed-1')).toBeUndefined();
    });
});

describe('a save', () => {
    it('drops what the save took and keeps what the server refused', () => {
        drafts.editManifest('ed-1', 'alpha', 'title', 'new title');
        drafts.editManifest('ed-1', 'alpha', 'status.line', 'under review');
        drafts.settleManifest('ed-1', { title: 'new title', 'status.line': 'under review' }, [
            'status.line'
        ]);
        expect(drafts.manifestEdits('ed-1', 'alpha')).toEqual({ 'status.line': 'under review' });
        expect(drafts.manifestDirty('ed-1')).toBe(true);
    });

    it('keeps a field typed again while the save was on its way', () => {
        drafts.editManifest('ed-1', 'alpha', 'title', 'sent');
        drafts.editManifest('ed-1', 'alpha', 'title', 'typed after');
        drafts.settleManifest('ed-1', { title: 'sent' }, []);
        expect(drafts.manifestEdits('ed-1', 'alpha')).toEqual({ title: 'typed after' });
    });

    it('clears the guard once everything sent was taken', () => {
        drafts.editManifest('ed-1', 'alpha', 'title', 'new title');
        drafts.editManifest('ed-1', 'alpha', 'next', ' ');
        drafts.settleManifest('ed-1', { title: 'new title' }, []);
        expect(drafts.manifestEdits('ed-1', 'alpha')).toEqual({});
        expect(drafts.manifestDirty('ed-1')).toBe(false);
    });

    it('writes nothing back for a draft the tab close took away before the answer landed', () => {
        drafts.editManifest('ed-1', 'alpha', 'title', 'new title');
        client.ui.clearInstanceState('ed-1');
        drafts.settleManifest('ed-1', { title: 'new title' }, []);
        expect(client.ui.instanceState('ed-1')).toBeUndefined();
    });
});

describe('a reload', () => {
    it('reads the edits back out of the storage the ui store saved them to', () => {
        const storage = fakeStorage();
        client.ui.loadUi(storage);
        drafts.editManifest('ed-1', 'alpha', 'authors', ['Faes', 'Another']);

        const next = createClientState();
        next.ui.loadUi(storage);
        const again = createManifestDraft(next.ui, (id) => projects[id] ?? null);
        expect(again.manifestEdits('ed-1', 'alpha')).toEqual({ authors: ['Faes', 'Another'] });
        expect(again.manifestDirty('ed-1')).toBe(true);
    });

    it.each([
        ['a project with no name', { project: '', edits: {} }, null],
        ['edits that are a list', { project: 'alpha', edits: [] }, null],
        ['no edits', { project: 'alpha' }, null],
        ['a string', 'alpha', null],
        [
            'a project and its edits',
            { project: 'alpha', edits: { title: 'x' } },
            { project: 'alpha', edits: { title: 'x' } }
        ]
    ])('reads %s of a saved record as %j', (_name, record, expected) => {
        expect(parseManifestDraft(record)).toEqual(expected);
    });
});

describe('the wiring', () => {
    it("registers the client's own manifest draft with the close guard", () => {
        const wired = createClientState();
        wired.ui.loadUi(fakeStorage());
        wired.manifestDraft.editManifest('ed-1', 'not-in-any-snapshot', 'title', 'words');
        expect(wired.ui.unsaved('ed-1')).toBe(true);
        wired.manifestDraft.revertManifest('ed-1');
        expect(wired.ui.unsaved('ed-1')).toBe(false);
    });
});
