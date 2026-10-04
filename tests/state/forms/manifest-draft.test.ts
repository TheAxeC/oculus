// Layer 2, client-state tests. The manifest editor's draft: the edits kept in the editor instance's
// ui record, compared against the project's value in the snapshot now, and read back after a reload
// through a fake storage.
//
// The project is synthetic and handed to the store through its projectOf argument, so what is
// checked is the draft. Typing into the form and pressing Save are DOM events no case here fires.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Project } from '../../../src/lib/data/model/index.ts';
import {
    createManifestDraft,
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
