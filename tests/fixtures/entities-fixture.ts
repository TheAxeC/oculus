// What a synthetic portfolio holds for the feeds, an entity that is a summary of files rather than
// a map keyed by id. A fixture tree has none of the generated feeds on it, so the feeds are the
// empty answer; a test that is about them says so by overriding this. The project every test builds
// from is here too, so a field added to Project is added once, and so is the app row, so a field
// added to AppRow is.

import { noContributes } from '../../src/lib/data/helpers/files/apps/contributes.ts';
import type { AppRow, Feeds, Project } from '../../src/lib/data/model/index.ts';

/** No feed file on this hub, which is not the same answer as a feed with nothing in it. */
export const NO_FEEDS: Feeds = {
    leads: null,
    radar: null,
    scout: null,
    linkedin: null,
    byHub: []
};

/** A project with every required field empty, and the fields a case sets in place of those. */
export function fixtureProject(over: Partial<Project> = {}): Project {
    return {
        id: 'one',
        tier: 'research',
        title: 'One',
        chips: [],
        results: [],
        ideas: [],
        waitingOn: [],
        followups: [],
        subtasks: [],
        relatedIds: [],
        resourceIds: [],
        fundingIds: [],
        datasetIds: [],
        pillarIds: [],
        domainIds: [],
        lead: [],
        collaborators: [],
        supervisors: [],
        docs: [],
        folder: '',
        file: '',
        ...over
    };
}

/** An app row with every field set, so a case names only what it changes. */
export function fixtureApp(change: Partial<AppRow> = {}): AppRow {
    return {
        name: 'notes',
        root: '',
        title: 'Notes',
        description: '',
        glyph: 'app_view',
        folder: '/apps/notes',
        entry: 'index.html',
        reads: [],
        writes: [],
        connects: [],
        host: '',
        readFolders: [],
        secrets: false,
        activation: ['onTab'],
        depends: [],
        contributes: noContributes(),
        disabled: false,
        machineDisabled: false,
        workspaceState: '',
        files: 1,
        bytes: 10,
        hash: 'a',
        approved: true,
        hashApproved: true,
        kept: false,
        key: 'k',
        storeBytes: 0,
        storeVersion: '',
        storeFile: '',
        ...change
    };
}
