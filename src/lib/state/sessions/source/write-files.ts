// Layer 2, client state, pure. The hub file a write over /api/write changes, named from the write's
// own arguments and the configuration the page reads, so the write path can refuse a write over a
// file a source tab holds unsaved text of before the write is sent.
//
// A write that creates its file (a new idea, a LinkedIn idea, a picture on the Memories wall, a
// deck made in a folder) names none, since no tab can hold unsaved text of a file not yet written,
// and neither does a write whose file the page cannot name from what the write carries: the session
// overrides, the default workspace's roots and the git, open and deposit endpoints.

import { fields } from '../../../data/helpers/guards.ts';
import { CAREER_FILE, ENGINE_ROOT, HUB_ROOT } from '../../../data/helpers/hub-names.ts';
import { viewSourceFile, type ViewSource } from '../view-source.ts';

/** The lookups the page makes of its own stores to name a file a write carries only an id of. */
export type FileLookups = {
    /** The hub-relative folder of a project by its id, or null when no project has it. */
    projectFolder: (id: string) => string | null;
    /** The file a recorded change wrote, relative to the hub, by its moment; null when unknown. */
    changeFile: (at: string) => string | null;
};

/** Lookups that name nothing, for a store built without the page's. */
export const NO_LOOKUPS: FileLookups = { projectFolder: () => null, changeFile: () => null };

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
    const collection = (name: unknown): ViewSource | null =>
        viewSourceFile('collection', merged, text(name));
    switch (body.kind) {
        case 'manifest': {
            const folder = look.projectFolder(text(body.id));
            return folder === null ? null : inHub(`${folder}/project.yml`);
        }
        case 'entry':
        case 'new-entry':
        case 'delete-entry':
        case 'reorder':
            return collection(body.collection);
        case 'subtask':
        case 'subtask-add': {
            const target = fields(body.target);
            if (text(target.collection) !== '') return collection(target.collection);
            const folder = look.projectFolder(text(target.id));
            return folder === null ? null : inHub(`${folder}/project.yml`);
        }
        case 'host':
            return inHub(text(merged.career_file) || CAREER_FILE);
        case 'feed-field':
        case 'feed-delete':
            return feedFile(text(body.feed), merged);
        case 'lead-add':
            return viewSourceFile('leads', merged);
        case 'radar-add':
            return viewSourceFile('radar', merged);
        case 'linkedin-post': {
            const folder = viewSourceFile('linkedin', merged);
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
            return inConfig('behavior.yml');
        case 'undo': {
            const file = look.changeFile(text(body.at));
            return file === null ? null : inHub(file);
        }
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
    const folder = look.projectFolder(id);
    return folder === null ? null : inHub(`${folder}/project.yml`);
}
