// Layer 2, client state, pure. The hub file a write over /api/write changes, named from the write's
// own arguments and the configuration the page reads, so the write path can refuse a write over a
// file a source tab holds unsaved text of before the write is sent, with the refusal it is answered
// with (`unsavedAnswer`).
//
// A write that creates its file (a new idea, a LinkedIn idea, a picture on the Memories wall, a
// deck made in a folder) names none, since no tab can hold unsaved text of a file not yet written,
// and neither does a write whose file the page cannot name from what the write carries: the session
// overrides, the open workspace's folders and the git, open and deposit endpoints. A write that
// names a record changes the file of the hub the record's id names, as the server routes it
// (server/edit/writes/hubs.ts), the primary's as any other, and an id that names no hub names no
// file. A write that adds a record and names no hub changes the file of the hub the server gives it
// (`chosenHub` of state/shared/page/hubs.ts, the rule of `homeOf` in server/edit/writes/hubs.ts):
// the primary's, else the workspace's one hub's, and for Save to Literature the primary's when it
// holds the Literature collection, else the one other hub's that does, under each hub's key of the
// `literature` registry; with several hubs and none chosen it names no file, and the server refuses
// the write with the sentence asking which hub. A Settings write lands where the server places it
// (server/edit/writes/config/config-place.ts): a key of the hub list in the settings file of the
// hub the write names, the primary's when it names none, any other option, the rail and the
// audit's mute list in the open workspace file, which is named under the workspace folder of its
// hub, so the unsaved workspace and a workspace file outside every folder name none.

import { fields } from '../../../data/helpers/guards.ts';
import {
    HUB_FILE,
    MANIFEST,
    ROOT_FOLDER,
    addressOfId,
    hubFileOf,
    type RegistryWord
} from '../../../data/helpers/hub-names.ts';
import type { FeedKind, FeedsPayload, Project } from '../../../data/model/index.ts';
import { placeOf } from '../../../data/snapshot/place.ts';
import { chosenHub } from '../../shared/page/hubs.ts';
import { viewSourceFile, type ViewSource } from '../view-source.ts';
import type { WriteAnswer } from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';

/** The lookups the page makes of its own stores to name a file a write carries only an id of. */
export type FileLookups = {
    /** The folder name of the open workspace's primary hub, or null when it names none. */
    primary: () => string | null;
    /** The folder names of the open workspace's hubs, in the folders' order, the primary's too. */
    hubs: () => string[];
    /** The open workspace file under the workspace folder that holds it, or null. */
    workspaceFile: () => ViewSource | null;
    /**
     * The manifest file of a project by its id, under the root that holds it (its hub, or its
     * workspace folder); null when none has it.
     */
    projectManifest: (id: string) => ViewSource | null;
    /**
     * The file of the collection `name` of the hub named `hub`, under the root that holds it; null
     * when that hub holds no such collection.
     */
    collectionFile: (hub: string, name: string) => ViewSource | null;
    /**
     * The key the hub named `hub` gives a registry: the key of its own `collections:` entry of it,
     * else of oculus's; the empty text when neither names it.
     */
    registryKey: (hub: string, registry: RegistryWord) => string;
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
export function manifestOfProject(project: Project | undefined): ViewSource | null {
    if (project === undefined || project.folder === '') return null;
    const { root, path } = placeOf(project);
    const name = project.file.endsWith(`/${ROOT_FOLDER}/${MANIFEST}`)
        ? `${ROOT_FOLDER}/${MANIFEST}`
        : MANIFEST;
    return { root, path: path === '' ? name : `${path}/${name}` };
}

/**
 * Lookups that name nothing, for a store built without the page's. Frozen, since every such store
 * shares the one object.
 */
export const NO_LOOKUPS: Readonly<FileLookups> = Object.freeze({
    primary: () => null,
    hubs: () => [],
    workspaceFile: () => null,
    projectManifest: () => null,
    collectionFile: () => null,
    registryKey: () => '',
    feeds: () => null,
    changeFile: () => null,
    unsavedUnknown: () => false
});

/** The text of a field, and '' for anything else. */
function text(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/** A file of the primary hub, or null for an empty path and for a workspace with no primary. */
function inHub(path: string, look: FileLookups): ViewSource | null {
    const primary = look.primary();
    return path === '' || primary === null ? null : { root: primary, path };
}

/**
 * The file a Settings write of the option `key` of the defaults file `file` lands in: for a key of
 * the hub list, the settings file of the hub `root` names, the primary's when it names none; the
 * open workspace file for any other.
 */
function settingsFile(
    file: string,
    key: string,
    root: string,
    look: FileLookups
): ViewSource | null {
    if (file === '' || key === '') return null;
    if (hubFileOf(key) !== file) return look.workspaceFile();
    return root === '' ? inHub(HUB_FILE, look) : inRoot(root, HUB_FILE);
}

/**
 * The file of the feed `kind` in the hub named `root`, the hub part of the entry's internal id;
 * none for a write that names no hub, which the server refuses.
 */
function feedFileOf(kind: FeedKind, root: string, feeds: FeedsPayload | null): ViewSource | null {
    const hubFiles = feeds?.[kind].hubFiles ?? {};
    return Object.hasOwn(hubFiles, root) ? inRoot(root, hubFiles[root]) : null;
}

/** A file under a root, or null for an empty root or path. */
function inRoot(root: string, path: string): ViewSource | null {
    return root === '' || path === '' ? null : { root, path };
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
    // The file of the collection `name` of the hub `hub`: the file the hub's collection was read
    // from, or for the primary's, before it holds one, the file the configuration names.
    const collection = (hub: string, name: unknown): ViewSource | null =>
        hub === ''
            ? null
            : (look.collectionFile(hub, text(name)) ??
              (hub === look.primary()
                  ? viewSourceFile('collection', merged, hub, text(name))
                  : null));
    // The file of the collection `name` that holds the entry of the id `id` in the portfolio.
    const holding = (name: unknown, id: unknown): ViewSource | null =>
        collection(addressOfId(text(id)).hub, name);
    // The hub a write that adds a record names, else the primary's, else the one hub's, and none
    // with several hubs and no primary, a write the server refuses.
    const home = (root: unknown): string =>
        text(root) || (look.primary() ?? chosenHub(look.hubs(), null) ?? '');
    // The Literature collection of a hub: the file of its key of the `literature` registry.
    const literature = (hub: string): ViewSource | null => {
        const key = look.registryKey(hub, 'literature');
        return key === '' ? null : collection(hub, key);
    };
    // The hub a Literature save that names no hub goes to: the primary's when it holds the
    // collection, else the one other hub's that does, none when several do, and `home`'s when none
    // does.
    const literatureHome = (): string => {
        const primary = look.primary();
        if (primary !== null && literature(primary) !== null) return primary;
        const holding = look.hubs().filter((hub) => hub !== primary && literature(hub) !== null);
        if (holding.length === 0) return home('');
        return chosenHub(holding, null) ?? '';
    };
    // The file of the feed `kind` a write that adds to it changes: the hub's it names, else the
    // primary's, as its configuration names it, else the one hub's, and none with several hubs and
    // no primary.
    const added = (kind: 'leads' | 'radar', root: unknown): ViewSource | null => {
        const primary = look.primary();
        const hub = home(root);
        if (hub !== '' && hub === primary) return viewSourceFile(kind, merged, primary);
        return feedFileOf(kind, hub, look.feeds());
    };
    switch (body.kind) {
        case 'manifest':
            return look.projectManifest(text(body.id));
        case 'entry':
        case 'delete-entry':
            return holding(body.collection, body.id);
        case 'new-entry':
            return collection(home(body.root), body.collection);
        case 'literature-save':
            return literature(text(body.root) || literatureHome());
        case 'reorder':
            return holding(body.collection, Array.isArray(body.order) ? body.order[0] : '');
        case 'subtask':
        case 'subtask-add':
        case 'followup':
        case 'followup-add': {
            const target = fields(body.target);
            if (text(target.collection) !== '') return holding(target.collection, target.id);
            return look.projectManifest(text(target.id));
        }
        case 'career':
            return inRoot(home(''), text(merged.career_file));
        case 'feed-field':
        case 'feed-delete': {
            const feed = text(body.feed);
            if (feed !== 'leads' && feed !== 'radar') return null;
            return feedFileOf(feed, addressOfId(text(body.id)).hub, look.feeds());
        }
        case 'lead-add':
            return added('leads', undefined);
        case 'radar-add':
            return added('radar', body.root);
        case 'linkedin-post': {
            const { hub, key } = addressOfId(text(body.id));
            const folder = feedFileOf('linkedin', hub, look.feeds());
            return folder === null || key === ''
                ? null
                : { root: folder.root, path: `${folder.path}/${key}` };
        }
        case 'deck-slides':
            return { root: text(body.root), path: text(body.path) };
        case 'deck-edit':
            return ['new', 'duplicate', 'delete', 'image'].includes(text(body.act))
                ? { root: text(body.root), path: text(body.path) }
                : null;
        case 'rail':
        case 'audit-mute':
            return look.workspaceFile();
        case 'config-key':
        case 'config-value':
        case 'config-reset':
            return settingsFile(text(body.file), text(body.key), text(body.root), look);
        case 'app-setting':
            return inHub(HUB_FILE, look);
        case 'undo':
            return look.changeFile(text(body.at));
        default:
            return null;
    }
}

/** The deposit actions that write the project's `code_availability` back into its manifest. */
const MANIFEST_ACTIONS = ['push', 'zenodoReview', 'zenodoPublish'];

/**
 * The file a deposit action changes: `push` writes the GitHub repository's keys of the project's
 * `code_availability` back into its manifest, and `zenodoReview` and `zenodoPublish` the Zenodo
 * deposit's; no other action writes a file the page can name (the rest work in the mirror clone
 * under the machine-local state folder).
 */
export function depositedFile(action: string, id: string, look: FileLookups): ViewSource | null {
    if (!MANIFEST_ACTIONS.includes(action)) return null;
    return look.projectManifest(id);
}

/** The code of the refusal a write over a file with unsaved text in a tab is answered with. */
const FILE_UNSAVED = 'file_unsaved';

/** The code of the refusal a write is answered with while it cannot be told if a tab holds it. */
const FOLDERS_LOADING = 'folders_loading';

/**
 * The refusal of a write over `file` while a source tab holds unsaved text of it, or while it
 * cannot be told yet whether one does; null when the write goes out, a write that names no file
 * among them. The sentence names the file.
 */
export function unsavedAnswer(
    file: { root: string; path: string } | null,
    look: Readonly<Pick<FileLookups, 'unsavedUnknown'>>,
    heldUnsaved: (file: { root: string; path: string }) => boolean
): WriteAnswer | null {
    if (file === null) return null;
    const name = file.path.slice(file.path.lastIndexOf('/') + 1);
    if (look.unsavedUnknown(file)) {
        const error = t('app.folders_loading', name);
        return { ok: false, changed: [], refused: [], error, code: FOLDERS_LOADING };
    }
    if (!heldUnsaved(file)) return null;
    const error = t('app.file_unsaved', name);
    return { ok: false, changed: [], refused: [], error, code: FILE_UNSAVED };
}
