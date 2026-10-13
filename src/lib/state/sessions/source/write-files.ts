// Layer 2, client state, pure. The hub file a write over /api/write changes, named from the write's
// own arguments and the configuration the page reads, so the write path can refuse a write over a
// file a source tab holds unsaved text of before the write is sent.
//
// A write that creates its file (a new idea, a LinkedIn idea, a picture on the Memories wall, a
// deck made in a folder) names none, since no tab can hold unsaved text of a file not yet written,
// and neither does a write whose file the page cannot name from what the write carries: the session
// overrides, the open workspace's folders and the git, open and deposit endpoints. A file of the
// primary hub is named under the primary's folder name, and a file of oculus's own config folder
// under the workspace folder that holds it, so a workspace with no primary names no hub file and a
// workspace with no folder over oculus's config names no config file.

import { fields } from '../../../data/helpers/guards.ts';
import { joinPath } from '../../../data/helpers/files/paths.ts';
import { CAREER_FILE, MANIFEST, ROOT_FOLDER } from '../../../data/helpers/hub-names.ts';
import type { FeedKind, FeedsPayload, Project } from '../../../data/model/index.ts';
import { placeOf } from '../../../data/snapshot/place.ts';
import { viewSourceFile, type ViewSource } from '../view-source.ts';

/** The lookups the page makes of its own stores to name a file a write carries only an id of. */
export type FileLookups = {
    /** The folder name of the open workspace's primary hub, or null when it names none. */
    primary: () => string | null;
    /** The workspace folder that holds oculus's config folder and the path to it, or null. */
    engine: () => { root: string; path: string } | null;
    /**
     * The manifest file of a project by its id, under the root that holds it (its hub, or its
     * workspace folder); null when none has it.
     */
    projectManifest: (id: string) => ViewSource | null;
    /** The file of a collection of a hub other than the primary, by its id; null for any other. */
    collectionFile: (id: string) => ViewSource | null;
    /** The file of each feed, per kind, as the page last received them. */
    feeds: () => FeedsPayload | null;
    /** The file a recorded change wrote, under the root that holds it, by its moment. */
    changeFile: (at: string) => ViewSource | null;
    /**
     * Whether it cannot be told yet if a source tab holds unsaved text of a file, the roots being
     * unread; a write over such a file waits.
     */
    unsavedUnknown: (file: ViewSource) => boolean;
};

/**
 * The manifest file of a project under the root that holds it: the file the project was read from,
 * `project.yml` or `.oculus/project.yml` in its folder, whether the folder lies in a hub or is a
 * workspace folder. Null for no project and for a project with no folder.
 */
export function manifestOfProject(
    project: Project | undefined,
    primary: string | null
): ViewSource | null {
    if (project === undefined || project.folder === '') return null;
    const { root, path } = placeOf(project, primary);
    const name = project.file.endsWith(`/${ROOT_FOLDER}/${MANIFEST}`)
        ? `${ROOT_FOLDER}/${MANIFEST}`
        : MANIFEST;
    return { root, path: path === '' ? name : `${path}/${name}` };
}

/** Lookups that name nothing, for a store built without the page's. */
export const NO_LOOKUPS: FileLookups = {
    primary: () => null,
    engine: () => null,
    projectManifest: () => null,
    collectionFile: () => null,
    feeds: () => null,
    changeFile: () => null,
    unsavedUnknown: () => false
};

/** The text of a field, and '' for anything else. */
function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** A file of the primary hub, or null for an empty path and for a workspace with no primary. */
function inHub(path: string, look: FileLookups): ViewSource | null {
    const primary = look.primary();
    return path === '' || primary === null ? null : { root: primary, path };
}

/** A file of oculus's config folder, or null for an empty name and when no folder holds it. */
function inConfig(path: string, look: FileLookups): ViewSource | null {
    const place = look.engine();
    return path === '' || place === null
        ? null
        : { root: place.root, path: joinPath(place.path, path) };
}

/** The file a feed's entries live in, by the feed's name. */
function feedFile(
    feed: string,
    config: Record<string, unknown>,
    look: FileLookups
): ViewSource | null {
    if (feed === 'leads' || feed === 'radar') return viewSourceFile(feed, config, look.primary());
    return null;
}

/**
 * The file of the feed `kind` in the hub the write's `root` names: the primary's, whose file the
 * configuration gives, when it is absent.
 */
function feedFileOf(
    kind: FeedKind,
    root: string,
    feeds: FeedsPayload | null,
    config: Record<string, unknown>,
    look: FileLookups
): ViewSource | null {
    if (root === '') return kind === 'linkedin' ? null : feedFile(kind, config, look);
    const hubFiles = feeds?.[kind].hubFiles ?? {};
    return Object.hasOwn(hubFiles, root) ? inRoot(root, hubFiles[root]) : null;
}

/**
 * The file of the collection `name` of the hub an entry's id names, as the server routes the write
 * (server/edit/writes/hubs.ts): a view names the collection by its bare key and the entry by its id
 * in the portfolio, `<hub name>:<id>` for an entry of a hub other than the primary. Null when the
 * id names no such hub's collection, which leaves the write the primary's.
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
        viewSourceFile('collection', merged, look.primary(), text(name));
    switch (body.kind) {
        case 'manifest':
            return look.projectManifest(text(body.id));
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
            return look.projectManifest(text(target.id));
        }
        case 'host':
        case 'career':
            return inHub(text(merged.career_file) || CAREER_FILE, look);
        case 'feed-field':
        case 'feed-delete': {
            const feed = text(body.feed);
            if (feed !== 'leads' && feed !== 'radar') return null;
            return feedFileOf(feed, text(body.root), look.feeds(), merged, look);
        }
        case 'lead-add':
            return viewSourceFile('leads', merged, look.primary());
        case 'radar-add':
            return viewSourceFile('radar', merged, look.primary());
        case 'linkedin-post': {
            const root = text(body.root);
            const hubFiles = look.feeds()?.linkedin.hubFiles ?? {};
            const folder =
                root === ''
                    ? viewSourceFile('linkedin', merged, look.primary())
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
            return inConfig('layout.yml', look);
        case 'config-key':
        case 'config-value':
            return inConfig(text(body.file), look);
        case 'audit-mute':
        case 'app-setting':
            return inConfig('behavior.yml', look);
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
    return look.projectManifest(id);
}
