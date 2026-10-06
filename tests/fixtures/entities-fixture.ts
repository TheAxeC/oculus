// What a synthetic portfolio holds for the two entities that are summaries of one file each rather
// than maps keyed by id. A fixture tree has none of the three generated feeds on it and no career
// file, so both are the empty answer; a test that is about them says so by overriding these. The
// project every test builds from is here too, so a field added to Project is added once, and so is
// the app row, so a field added to AppRow is.

import type { AppRow, Career, Feeds, Project, Resource } from '../../src/lib/data/model/index.ts';

/** No feed file on this hub, which is not the same answer as a feed with nothing in it. */
export const NO_FEEDS: Feeds = {
    leads: null,
    radar: null,
    scout: null,
    linkedin: null
};

/** No career file on this hub. */
export const NO_CAREER: Career | null = null;

/** The value and everything it holds frozen, so a case that shares it cannot change it. */
function frozen<T extends object>(value: T): T {
    for (const held of Object.values(value)) {
        if (typeof held === 'object' && held !== null) frozen(held);
    }
    return Object.freeze(value);
}

/**
 * A cluster, a machine and a storage, the three kinds of the resources registry. Every case that
 * takes it shares it, so it is frozen; a case that needs a changed entry spreads one.
 */
export const RESOURCES: Record<string, Resource> = frozen({
    utwente: {
        id: 'utwente',
        name: 'UTwente HPC',
        kind: 'cluster',
        host: 'utwente',
        links: [],
        order: 0
    },
    'this-mac': { id: 'this-mac', name: 'This Mac', kind: 'machine', links: [], order: 1 },
    data: { id: 'data', name: 'Local data', kind: 'storage', links: [], order: 2 }
});

/** A project with every required field empty, and the fields a case sets in place of those. */
export function fixtureProject(over: Partial<Project> = {}): Project {
    return {
        id: 'one',
        tier: 'active',
        ghost: false,
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
        collaborators: [],
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
        files: 1,
        bytes: 10,
        hash: 'a',
        approved: true,
        kept: false,
        key: 'k',
        storeBytes: 0,
        storeVersion: '',
        storeFile: '',
        ...change
    };
}
