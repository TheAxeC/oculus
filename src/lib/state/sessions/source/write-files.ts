// Layer 2, client state, pure. The hub file a write over /api/write changes, named from the write's
// own arguments and the configuration the page reads, so the write path can refuse a write over a
// file a source tab holds unsaved text of before the write is sent.
//
// A write that creates its file (a new idea, a LinkedIn idea, a picture on the Memories wall, a
// deck made in a folder) names none, since no tab can hold unsaved text of a file not yet written,
// and neither does a write whose file the page cannot name from what the write carries: the session
// overrides, the default workspace's roots and the git, open and deposit endpoints.

import { fields } from '../../../data/helpers/guards.ts';
import {
    CAREER_FILE,
    ENGINE_ROOT,
    HUB_ROOT,
    MANIFEST,
    ROOT_FOLDER
} from '../../../data/helpers/hub-names.ts';
import type { FeedKind, FeedsPayload, Project } from '../../../data/model/index.ts';
import { placeOf } from '../../../data/snapshot/place.ts';
import { viewSourceFile, type ViewSource } from '../view-source.ts';

/** The lookups the page makes of its own stores to name a file a write carries only an id of. */
export type FileLookups = {
    /**
     * The folder of a project by its id, under the root that holds it (its hub, or its repository,
     * whose folder is the empty path); null when none has it.
     */
    projectFolder: (id: string) => ViewSource | null;
    /** The file of a collection of a hub other than the first, by its id; null for any other. */
    collectionFile: (id: string) => ViewSource | null;
    /** The file of each feed, per kind, as the page last received them. */
    feeds: () => FeedsPayload | null;
    /** The file a recorded change wrote, under the root that holds it, by its moment. */
    changeFile: (at: string) => ViewSource | null;
};

/**
 * The folder of a project under the root that holds it, from the project's record: its hub's root
 * at its folder, or its repository's root at the empty path. Null for no project and for a project
 * with no folder.
 */
export function folderOfProject(project: Project | undefined): ViewSource | null {
    if (project === undefined || project.folder === '') return null;
    const { root, path } = placeOf(project);
    return { root, path };
}

/** Lookups that name nothing, for a store built without the page's. */
export const NO_LOOKUPS: FileLookups = {
    projectFolder: () => null,
    collectionFile: () => null,
    feeds: () => null,
    changeFile: () => null
};

/** The folder of the engine's configuration, where the root `engine` is served from. */
const CONFIG_ROOT = ENGINE_ROOT;

/** The text of a field, and '' for anything else. */
function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** A file of the hub, or null for an empty path. */
function inHub(path: string): ViewSource | null {
    return path === '' ? null : { root: HUB_ROOT, path };
}

/**
 * A project's manifest, under the root that holds the project: `project.yml` in the project's
 * folder of its hub, and `.oculus/project.yml` for a project read from a repository, whose folder
 * is the top of its root (an empty path).
 */
function manifestOf(folder: ViewSource | null): ViewSource | null {
    if (folder === null) return null;
    const path = folder.path === '' ? ROOT_FOLDER : folder.path;
    return { root: folder.root, path: `${path}/${MANIFEST}` };
}

/** A file of the engine's config folder, or null for an empty name. */
function inConfig(path: string): ViewSource | null {
    return path === '' ? null : { root: CONFIG_ROOT, path };
}

/** The file a feed's entries live in, by the feed's name. */
function feedFile(feed: string, config: Record<string, unknown>): ViewSource | null {
    if (feed === 'leads' || feed === 'radar') return viewSourceFile(feed, config);
    return null;
}

/**
 * The file of the feed `kind` in the hub the write's `root` names: the first hub's, whose file the
 * configuration gives, when it is absent.
 */
function feedFileOf(
    kind: FeedKind,
    root: string,
    feeds: FeedsPayload | null,
    config: Record<string, unknown>
): ViewSource | null {
    if (root === HUB_ROOT) return kind === 'linkedin' ? null : feedFile(kind, config);
    const hubFiles = feeds?.[kind].hubFiles ?? {};
    return Object.hasOwn(hubFiles, root) ? inRoot(root, hubFiles[root]) : null;
}

/**
 * The file of the collection `name` of the hub an entry's id names, as the server routes the write
 * (server/edit/writes/hubs.ts): a view names the collection by its bare key and the entry by its id
 * in the portfolio, `<root key>:<id>` for an entry of a hub other than the first. Null when the id
 * names no such hub's collection, which leaves the write the first hub's.
 */
function entryHubFile(name: string, id: string, look: FileLookups): ViewSource | null {
    const colon = id.indexOf(':');
    return colon <= 0 ? null : look.collectionFile(`${id.slice(0, colon)}:${name}`);
}

/** A file under a root, or null for an empty path. */
function inRoot(root: string, path: string): ViewSource | null {
    return path === '' ? null : { root, path };
}

/**
 * The file a body sent to /api/write changes, or null when it creates its file or the page cannot
 * name it. `config` is the merged configuration as the page last received it.
 */
export function writtenFile(
    request: unknown,
    config: Record<string, unknown> | null,
    look: FileLookups
): ViewSource | null {
    const body = fields(request);
    const merged = config ?? {};
    const collection = (name: unknown, id: unknown = ''): ViewSource | null =>
        look.collectionFile(text(name)) ??
        entryHubFile(text(name), text(id), look) ??
        viewSourceFile('collection', merged, text(name));
    switch (body.kind) {
        case 'manifest':
            return manifestOf(look.projectFolder(text(body.id)));
        case 'entry':
        case 'delete-entry':
            return collection(body.collection, body.id);
        case 'new-entry':
            return collection(body.collection);
        case 'reorder':
            return collection(body.collection, Array.isArray(body.order) ? body.order[0] : '');
        case 'subtask':
        case 'subtask-add': {
            const target = fields(body.target);
            if (text(target.collection) !== '') return collection(target.collection, target.id);
            return manifestOf(look.projectFolder(text(target.id)));
        }
        case 'host':
            return inHub(text(merged.career_file) || CAREER_FILE);
        case 'feed-field':
        case 'feed-delete': {
            const feed = text(body.feed);
            if (feed !== 'leads' && feed !== 'radar') return null;
            return feedFileOf(feed, text(body.root) || HUB_ROOT, look.feeds(), merged);
        }
        case 'lead-add':
            return viewSourceFile('leads', merged);
        case 'radar-add':
            return viewSourceFile('radar', merged);
        case 'linkedin-post': {
            const root = text(body.root) || HUB_ROOT;
            const hubFiles = look.feeds()?.linkedin.hubFiles ?? {};
            const folder =
                root === HUB_ROOT
                    ? viewSourceFile('linkedin', merged)
                    : inRoot(root, Object.hasOwn(hubFiles, root) ? hubFiles[root] : '');
            const file = text(body.file);
            return folder === null || file === ''
                ? null
                : { root: folder.root, path: `${folder.path}/${file}` };
        }
        case 'deck-slides':
            return { root: text(body.root), path: text(body.path) };
        case 'deck-edit':
            return ['new', 'duplicate', 'delete', 'image'].includes(text(body.act))
                ? { root: text(body.root), path: text(body.path) }
                : null;
        case 'rail':
            return inConfig('layout.yml');
        case 'config-key':
        case 'config-value':
            return inConfig(text(body.file));
        case 'audit-mute':
        case 'app-setting':
            return inConfig('behavior.yml');
        case 'undo':
            return look.changeFile(text(body.at));
        default:
            return null;
    }
}

/**
 * The file a deposit action changes: `push` writes the project's `code_availability` back into its
 * manifest, and no other action writes a file the page can name (the rest work in the mirror clone
 * under the machine-local state folder).
 */
export function depositedFile(action: string, id: string, look: FileLookups): ViewSource | null {
    if (action !== 'push') return null;
    return manifestOf(look.projectFolder(id));
}
