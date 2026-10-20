// Layer 2, server. The write side of the application: the endpoint, and where on this machine it
// writes.
//
// routes/api/write/+server.ts is the route module and holds nothing but its POST, since a route
// module may export only its verbs; everything the write does is here and in writes/. The order is
// the order of the refusals: the request must come from this application's own page and carry the
// process token, the body must be a write this route knows, and the id must name a project or an
// entry the reader found. Only then does yaml-edit touch the bytes, and only then, and only when
// something actually changed, is the file written.
//
// What the schema does to a field differs by what is written. A manifest field must be one
// manifest-schema.yml names, and one it does not name is refused. A collection entry's text,
// textarea, select, date or checkbox field is checked against the type its own file's schema
// declares, so a value that does not fit is refused while the other fields of the request are
// written; a tags, metalist or raw field is checked by yaml-edit's own vocabulary, and a field the
// file's schema does not declare at all is written as it was given. The one write that stops whole
// is a registry entry whose key field is cleared or moved onto another entry's value, since the
// registry keys its entities by it.
//
// The work is in the modules below it, one concern each: writes/manifest.ts for a project.yml and a
// new idea, edit/feeds/feed-route.ts for the feed writes and Save to Literature
// (edit/feeds/feeds.ts and edit/feeds/literature.ts write them), writes/entries.ts for a
// collection file, writes/subtasks.ts for a subtask line and a career host, writes/bodies.ts for
// the body parsers (one per kind of write), writes/file-undo.ts for taking back a file operation,
// and the writers of configuration files, in writes/config/: deck.ts for a deck group's slides,
// audit-mute.ts for the audit's mute list, rail.ts for the rail list, folders.ts for the open
// workspace's folders, config-key.ts for one option of oculus's defaults files, config-value.ts for
// one list or family of one and config-reset.ts for taking one out again, each written in the open
// workspace file or the primary hub's settings file (config-place.ts). What an importer of this
// module needs of them is re-exported here, so an importer may name this module or the one that
// holds the function.

import { json } from '@sveltejs/kit';
import { join, resolve } from 'node:path';
import { appsSettings, changesKeep, type LocalConfig } from '../../data/sources/config.ts';
import { FILES_KIND } from '../../data/file-ops.ts';
import type { HubSettings } from '../../data/index.ts';
import { tokenedBody } from '../core/auth.ts';
import { changeAt, defaultChangesPath, logChanges } from '../core/changes.ts';
import { undoChange } from './writes/undo.ts';
import { APP_STORE, queuedStore, writeAppStore } from './writes/apps/store.ts';
import { gateWrite, storeWrite } from './writes/apps/gate.ts';
import { defaultAppData } from '../machine/apps/store/store.ts';
import type { AppsHeld, HeldApp } from '../machine/apps/read/held.ts';
import { entities as entitiesOf, projects as projectsOf } from '../sessions/stores/hooks.ts';
import type { HubLike } from '../sessions/stores/hooks.ts';
import { setFlag, setOverride } from '../sessions/overrides.ts';
import { glyphNames } from '../../data/sources/config/rail.ts';
import { createIdea, writeManifest } from './writes/manifest.ts';
import { configWrite } from './writes/config/config-write.ts';
import { writeDeckEdit } from './writes/config/lists/deck/deck-acts.ts';
import { undoDeckEdit } from './writes/config/lists/deck/deck-undo.ts';
import type { OpenWorkspace } from '../files/workspace/open.ts';
import { perOculus } from '../files/workspace/paths.ts';
import { words } from '../core/words.ts';
import {
    homeOf,
    hubKeysOf,
    routed,
    routedEntry,
    routedOrder,
    routedRoot,
    routedTarget
} from './writes/hubs.ts';
import { primaryConfig, hubManifests, hubTargets, type HubTarget } from '../files/roots.ts';
import { filesTargetOf, undoFiles, type FilesDeps, type FilesTarget } from './writes/file-undo.ts';
import { createEntry, removeEntry, reorderCollection, writeEntry } from './writes/entries.ts';
import {
    careerRules,
    writeCareer,
    writeHost,
    writeSubtask,
    writeSubtaskAdd
} from './writes/subtasks.ts';
import { feedRoute } from './feeds/feed-route.ts';
import {
    deckEditWrite,
    deleteEntryWrite,
    entryWrite,
    careerWrite,
    hostWrite,
    manifestWrite,
    newEntry,
    newIdea,
    reorderWrite,
    sessionWrite,
    subtaskAdd,
    subtaskWrite,
    undoWrite
} from './writes/bodies.ts';
import type { ChangeLog, ChangeRecord } from '../core/changes.ts';
import type { FsWrites } from '../core/json.ts';
import type { Refusal } from './yaml/yaml-edit.ts';
import type { CareerRules, SubtaskTarget } from './writes/subtasks.ts';
import type { PortfolioConfig, Project } from '../../data/model/index.ts';

/**
 * What a write needs to know: which hub to write in, what its manifests are checked against, where
 * the per-session overrides file is, and where the reader's own bookmarks are. The overrides path
 * is absent on a machine that has not set `sessions_overrides` in a hub's local.yml, and
 * `defaultOverridesPath()` is used then.
 *
 * `bookmarks` is a collection of the reader's own that lives outside the hubs' record files (in the
 * primary hub's `.oculus` folder), so the four entry writes are given it and resolve the key
 * `bookmarks` to that file rather than to a hub one. A workspace with no primary has none.
 */
export type WriteTarget = {
    /** The primary hub's folder, or null while the workspace has no primary. */
    hub: string | null;
    /** The name of the hub `hub` is: the primary's, or null while the workspace has no primary. */
    primary: string | null;
    config: PortfolioConfig;
    /** The engine directory this write's configuration was read from. */
    engine: string;
    /**
     * The engine's own configuration, under no hub's settings, as the server keeps it parsed: the
     * lists a write reads from the engine alone (the Lit Watch buckets, the Literature path).
     */
    engineConfig: () => Record<string, unknown>;
    /** The career file and its host statuses, out of the request's configuration. */
    career: CareerRules;
    overrides?: string;
    /**
     * The projects of the portfolio this server last published, which the deck write reads a
     * group's decks from. It is required rather than optional so that a route reaching for a target
     * cannot leave the deck write with no projects and refuse every save; a process that has
     * published no portfolio yet names no projects, and the write refuses with a reason.
     */
    projects: () => Project[];
    /**
     * One entity map (the domains, the resources) of the portfolio this server last published, or
     * null while it has published none, which the config writes check a choice against. A target
     * built without it checks those choices for their type alone.
     */
    entities?: (kind: 'domains' | 'resources') => Record<string, unknown> | null;
    bookmarks?: string;
    /**
     * Where this machine's change log is, how much of it is kept, and the chain an append waits
     * behind. A caller with no server in hand holds none, and then a write records nothing.
     */
    changes?: ChangeLog;
    /**
     * The glyph names of config/catalogs/glyphs.yml as this write's configuration holds them, which
     * a rail entry's glyph must be one of.
     */
    glyphs: string[];
    /**
     * The open workspace, whose folders the Files view's Add Folder and Remove Folder write into
     * its file (or into the state while it is unsaved), and in whose file's `settings:` a Settings
     * write of an option lands (writes/config/config-place.ts). A target built without it writes no
     * folders, the folders write answering `unwritable`, and has no workspace file to set an
     * option in.
     */
    workspace?: OpenWorkspace;
    /**
     * The hubs other than the primary, each with its own settings, which a write that names a
     * record of one of them is routed to (writes/hubs.ts). A target built without it knows the one
     * hub.
     */
    hubs?: HubTarget[];
    /**
     * What taking back a file operation runs over: the roots the file browser serves, the local
     * history folder and the chain the file operations wait on. A target built without it answers
     * `unwritable` to the undo of a file operation.
     */
    files?: FilesTarget;
    /**
     * What a write from an app's frame needs: the apps the server holds, the folder the machine
     * apps' stores and the undo folder are under, the largest store in kilobytes, the call that
     * tells the apps watcher a store changed, and the chain every write of one store file waits on.
     * A target built without it refuses every write that carries an app header.
     */
    apps?: {
        held: () => AppsHeld;
        data: string;
        maxKb: number;
        stored?: () => void;
        queue?: (file: string) => FsWrites;
    };
};

/**
 * A target over one hub: the primary of the workspace, or another hub of it that a write was routed
 * to (writes/hubs.ts). Every writer that reads or writes a hub's files takes this one.
 */
export type PrimaryTarget = WriteTarget & { hub: string; primary: string };

export type WriteOutcome = {
    /**
     * False when the hub holds no project with that id; then nothing was read and nothing written.
     */
    found: boolean;
    changed: string[];
    refused: Refusal[];
    /**
     * What the change log records of this write: the value the file held and the value written, at
     * the one point the writer has both. A write that changed nothing carries none.
     */
    records?: ChangeRecord[];
    /**
     * The id the file gives the entry this write made or edited, read after the write, so the page
     * is told where the entry now is when the write renamed it. Only an entry write carries it.
     */
    id?: string;
};

// The writers and the parsers, re-exported under their own names.
export { coerce, createIdea, fieldTypes, writeManifest } from './writes/manifest.ts';
export { writeDeckSlides } from './writes/config/lists/deck/deck.ts';
export { createEntry, removeEntry, reorderCollection, writeEntry } from './writes/entries.ts';
export { collectionFile, identityField } from '../files/fs/collections.ts';
export { writeHost, writeSubtask, writeSubtaskAdd } from './writes/subtasks.ts';
export type { SubtaskAction, SubtaskTarget } from './writes/subtasks.ts';
export { writeMute } from './writes/config/lists/audit-mute.ts';
export { writeRail } from './writes/config/lists/rail.ts';
export { writeConfigKey } from './writes/config/config-key.ts';
export { writeConfigValue } from './writes/config/config-value.ts';
export {
    auditMuteWrite,
    configKeyWrite,
    configValueWrite,
    deckEditWrite,
    deckSlidesWrite,
    deleteEntryWrite,
    entryWrite,
    feedDeleteWrite,
    feedFieldWrite,
    hostWrite,
    manifestWrite,
    leadAddWrite,
    radarAddWrite,
    linkedinIdeaWrite,
    linkedinPostWrite,
    newEntry,
    newIdea,
    railWrite,
    reorderWrite,
    rootsWrite,
    sessionWrite,
    subtaskAdd,
    subtaskWrite,
    undoWrite
} from './writes/bodies.ts';
export { undoChange, valueNow } from './writes/undo.ts';

/** The kind the change log files the acts on a deck's files under. */
const DECK_EDIT = 'deck-edit';

/**
 * The open workspace and the machine's values a target is made from, both as the server holds
 * them at the call, the reader of the settings of the workspace's other hubs, and the engine's own
 * configuration, which the server answers from the parses it keeps.
 */
export type Carried = {
    open: OpenWorkspace;
    local: LocalConfig;
    settings: HubSettings;
    defaults: () => { config: Record<string, unknown> };
};

/**
 * What a request carries into `target`: the workspace open now, the machine's values read now, the
 * server's kept parse of each other hub's settings and its kept parse of the engine's own folder.
 */
export function carriedOf(server: {
    workspace: { open(): OpenWorkspace };
    machine: () => LocalConfig;
    configCache: { hub: HubSettings; defaults: Carried['defaults'] };
}): Carried {
    return {
        open: server.workspace.open(),
        local: server.machine(),
        settings: server.configCache.hub,
        defaults: server.configCache.defaults
    };
}

/**
 * Where writes land on this machine: the primary hub of the open workspace, the machine's values
 * read from the workspace's hubs, the request's merged configuration as its route read it, and the
 * projects of the portfolio this request's server last published.
 *
 * The server is passed in rather than reached from a module, so nothing here is process-wide. A
 * caller with no server in hand (a document read, a deposit action) names no projects, and only the
 * deck write depends on them.
 */
export function target(
    engine: string,
    merged: Record<string, unknown>,
    carried: Carried,
    server?: {
        hub: HubLike;
        fsWrites: FsWrites;
        opsWrites?: FsWrites;
        apps?: {
            held: () => AppsHeld;
            rereadStores?: () => void;
            storeQueue?: (file: string) => FsWrites;
        };
    },
    appData: string = defaultAppData()
): WriteTarget {
    const { open, local, settings, defaults } = carried;
    return {
        hub: open.primaryDir,
        primary: open.primary,
        config: primaryConfig(merged, open),
        engine,
        engineConfig: () => defaults().config,
        career: careerRules(merged),
        overrides: local.sessionsOverrides,
        projects: () => (server === undefined ? [] : projectsOf(server.hub)),
        entities: server === undefined ? undefined : (kind) => entitiesOf(server.hub, kind),
        bookmarks: perOculus(open.primaryDir, merged).bookmarks ?? undefined,
        glyphs: glyphNames(merged) ?? [],
        hubs: hubTargets(open, settings),
        workspace: open,
        files: filesTargetOf(() => open.roots, local.history, server?.opsWrites),
        changes:
            server === undefined
                ? undefined
                : {
                      file: local.changes ?? defaultChangesPath(),
                      keep: changesKeep(merged),
                      writes: server.fsWrites,
                      undoDir: join(appData, '.undo'),
                      hub: server.hub
                  },
        apps:
            server?.apps === undefined
                ? undefined
                : {
                      held: () =>
                          server.apps?.held() ?? { apps: [], findings: [], folders: [], links: [] },
                      data: appData,
                      maxKb: appsSettings(merged).storeMaxKb,
                      stored: () => server.apps?.rereadStores?.(),
                      queue: server.apps.storeQueue
                  }
    };
}

/** What a write that names a record answers when its record is of no hub it may reach. */
const NOT_FOUND: WriteOutcome = { found: false, changed: [], refused: [] };

/**
 * Whether a write from `app` (null for the page) may name the project `id` of `into`. An app's
 * write does not reach a project read from a workspace folder: its manifest is outside the hub.
 */
function reaches(into: PrimaryTarget, id: string, app: HeldApp | null): boolean {
    if (app === null) return true;
    return !hubManifests(into.hub, into.config).some(
        (one) => one.id === id && one.workspaceFolder !== undefined
    );
}

/**
 * The whole endpoint: refuse, or write and say what changed. A refusal names what was wrong and
 * nothing more; the page shows it beside the control that sent the write.
 */
export async function handleWrite(
    request: Request,
    token: string,
    into: WriteTarget,
    deps: FilesDeps = {}
): Promise<Response> {
    const read = await tokenedBody(request, token, { text: () => into.config.text });
    if (read instanceof Response) return read;
    const body = read.body;
    const gate = gateWrite(request.headers, body, into.apps?.held);
    if ('refused' in gate) return json({ error: 'kind' }, { status: 403 });
    const app = gate.app;
    if (app !== null) {
        const stored = storeWrite(body);
        if (stored !== null) return storeAnswer(into, app, stored.store);
    }
    const session = sessionWrite(body);
    if (session !== null) {
        const changed: string[] = [];
        const refused: Refusal[] = [];
        const records: ChangeRecord[] = [];
        try {
            for (const flag of ['hidden', 'top'] as const) {
                const value = session[flag];
                if (value === undefined) continue;
                const outcome = setFlag(session.id, flag, value, into.overrides);
                changed.push(...outcome.changed);
                refused.push(...outcome.refused);
                records.push(...outcome.records);
            }
            if (session.area !== undefined || session.title !== undefined) {
                const outcome = setOverride(
                    session.id,
                    { area: session.area, title: session.title },
                    into.overrides
                );
                changed.push(...outcome.changed);
                refused.push(...outcome.refused);
                records.push(...outcome.records);
            }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return json(
                { error: words(into.config.text, 'server.write_route.session_unsaved', reason) },
                { status: 500 }
            );
        }
        return answer({ found: true, changed, refused, records }, 'session', into);
    }

    const write = manifestWrite(body);
    if (write !== null) {
        const at = routed(into, write.id, app);
        const outcome =
            at === null || !reaches(at.into, at.id, app)
                ? NOT_FOUND
                : writeManifest(
                      at.into.hub,
                      at.into.config,
                      at.id,
                      write.fields,
                      'form',
                      undefined,
                      undefined,
                      at.hubKey
                  );
        if (!outcome.found) {
            const error = words(into.config.text, 'server.write_route.no_project', write.id);
            return json({ error }, { status: 404 });
        }
        return answer(outcome, 'manifest', into, undefined, app ?? undefined);
    }

    const entry = entryWrite(body);
    if (entry !== null) {
        const at = routedEntry(into, entry.collection, entry.id, app);
        const outcome =
            at === null
                ? NOT_FOUND
                : writeEntry(
                      at.into.hub,
                      at.into.config,
                      at.collection,
                      at.id,
                      entry.fields,
                      at.into.bookmarks,
                      at.hubKey
                  );
        if (!outcome.found) {
            const error = words(
                into.config.text,
                'server.write_route.no_entry',
                entry.id,
                entry.collection
            );
            return json({ error }, { status: 404 });
        }
        return answer(outcome, 'entry', into, undefined, app ?? undefined);
    }

    const subtask = subtaskWrite(body);
    if (subtask !== null) {
        const at = routedTarget(into, subtask.target, app);
        const outcome =
            at === null || !reaches(at.into, at.target.id, app)
                ? NOT_FOUND
                : writeSubtask(
                      at.into.hub,
                      at.into.config,
                      at.target,
                      subtask.key,
                      subtask.action,
                      subtask.value
                  );
        if (!outcome.found) {
            return json({ error: notFound(into.config.text, subtask.target) }, { status: 404 });
        }
        return answer(outcome, 'subtask', into, undefined, app ?? undefined);
    }

    const added = subtaskAdd(body);
    if (added !== null) {
        const at = routedTarget(into, added.target, app);
        const outcome =
            at === null || !reaches(at.into, at.target.id, app)
                ? NOT_FOUND
                : writeSubtaskAdd(at.into.hub, at.into.config, at.target, added.fields);
        if (!outcome.found) {
            return json({ error: notFound(into.config.text, added.target) }, { status: 404 });
        }
        return answer(outcome, 'subtask-add', into, undefined, app ?? undefined);
    }

    const host = hostWrite(body);
    if (host !== null) {
        const home = homeOf(into);
        if (home === null) return noHub(into);
        const outcome = writeHost(home.hub, host.name, host.status, into.career, into.config.text);
        if (!outcome.found) {
            const error = words(into.config.text, 'server.write_route.no_host', host.name);
            return json({ error }, { status: 404 });
        }
        return answer(outcome, 'host', into, undefined, app ?? undefined);
    }

    const career = careerWrite(body);
    if (career !== null) {
        const home = homeOf(into);
        if (home === null) return noHub(into);
        const outcome = writeCareer(home.hub, career.fields, into.career, into.config.text);
        if (!outcome.found)
            return json(
                { error: words(into.config.text, 'server.career.no_file') },
                { status: 404 }
            );
        return answer(outcome, 'career', into, undefined, app ?? undefined);
    }

    const fresh = newEntry(body);
    if (fresh !== null) {
        const home = fresh.root === undefined ? homeOf(into) : routedRoot(into, fresh.root, app);
        if (home === null && fresh.root !== undefined) {
            const error = words(into.config.text, 'server.workspace.no_hub_named', fresh.root);
            return json({ error }, { status: 404 });
        }
        if (home === null) return noHub(into);
        if (
            fresh.root !== undefined &&
            !home.config.collections.some((one) => one.key === fresh.collection)
        ) {
            const error = words(
                into.config.text,
                'server.write_route.no_collection_in_hub',
                fresh.root,
                fresh.collection
            );
            return json({ error }, { status: 404 });
        }
        const outcome = createEntry(
            home.hub,
            home.config,
            fresh.collection,
            fresh.fields,
            home.bookmarks,
            hubKeysOf(into)
        );
        if (!outcome.found) {
            const error = words(
                into.config.text,
                'server.write_route.no_collection',
                fresh.collection
            );
            return json({ error }, { status: 404 });
        }
        return answer(outcome, 'new-entry', into, undefined, app ?? undefined);
    }

    const order = reorderWrite(body);
    if (order !== null) {
        const at = routedOrder(into, order.collection, order.order, app);
        const outcome =
            at === null
                ? NOT_FOUND
                : reorderCollection(
                      at.into.hub,
                      at.into.config,
                      at.collection,
                      at.order,
                      at.into.bookmarks
                  );
        if (!outcome.found) {
            const error = words(
                into.config.text,
                'server.write_route.no_collection',
                order.collection
            );
            return json({ error }, { status: 404 });
        }
        return answer(outcome, 'reorder', into, undefined, app ?? undefined);
    }

    const removal = deleteEntryWrite(body);
    if (removal !== null) {
        const at = routedEntry(into, removal.collection, removal.id, app);
        const outcome =
            at === null
                ? NOT_FOUND
                : removeEntry(at.into.hub, at.into.config, at.collection, at.id, at.into.bookmarks);
        if (!outcome.found) {
            const error = words(
                into.config.text,
                'server.write_route.no_entry',
                removal.id,
                removal.collection
            );
            return json({ error }, { status: 404 });
        }
        return answer(outcome, 'delete-entry', into, undefined, app ?? undefined);
    }

    const fed = feedRoute(body, into, app);
    if (fed !== null) {
        if (fed instanceof Response) return fed;
        return answer(fed.outcome, fed.kind, into, undefined, app ?? undefined);
    }

    const deckEdit = deckEditWrite(body);
    if (deckEdit !== null) {
        const outcome = await writeDeckEdit(into, deckEdit, deps);
        if ('error' in outcome) return json({ error: outcome.error }, { status: 500 });
        return answer({ found: true, ...outcome }, 'deck-edit', into);
    }

    const configured = configWrite(body, into);
    if (configured !== null) {
        if ('error' in configured) {
            return json(
                {
                    error: configured.error,
                    ...(configured.reason === undefined ? {} : { reason: configured.reason })
                },
                { status: configured.status }
            );
        }
        return answer(configured.outcome, configured.kind, into);
    }

    const idea = newIdea(body);
    if (idea !== null) {
        const home = homeOf(into);
        if (home === null) return noHub(into);
        return answer(
            createIdea(home.hub, home.config, idea.fields),
            'new-idea',
            into,
            undefined,
            app ?? undefined
        );
    }

    const undo = undoWrite(body);
    if (undo !== null) {
        if (into.changes === undefined) return json({ error: 'unknown' }, { status: 404 });
        const change = changeAt(into.changes, undo.at);
        if (change === undefined) return json({ error: 'unknown' }, { status: 404 });
        const outcome =
            change.kind === FILES_KIND
                ? await undoFiles(into, change, deps)
                : change.kind === DECK_EDIT
                  ? await undoDeckEdit(into, change, deps)
                  : undoChange(into, change);
        if ('error' in outcome) {
            if (outcome.error === 'refused') {
                return json({ error: outcome.error, refused: outcome.refused }, { status: 400 });
            }
            // An undo that failed part way records the items it did before the one it stopped at.
            if (outcome.error === 'unwritable' && outcome.records !== undefined) {
                await logChanges(into.changes, change.kind, outcome.records, change.at);
            }
            const status =
                outcome.error === 'moved' ? 409 : outcome.error === 'unwritable' ? 500 : 404;
            return json({ error: outcome.error }, { status });
        }
        // The undo is a write like any other and is recorded like one, by the writer it went
        // through, so taking it back again is the row above it in the log.
        return answer(outcome, change.kind, into, change.at);
    }

    return json(
        { error: words(into.config.text, 'server.write_route.not_a_write') },
        { status: 400 }
    );
}

/**
 * Append the records a write made to the change log: stamped with this kind, their files named as
 * the log names them and the app the write came from marked. It is the one place the log is
 * written for a write, so the host's store update records through it as a frame's does.
 */
export async function recordWrite(
    outcome: WriteOutcome,
    kind: string,
    into: WriteTarget,
    undoes?: string,
    app?: HeldApp
): Promise<void> {
    const records = outcome.records?.map((record) => ({
        ...record,
        file: resolve(record.file),
        ...(record.created === undefined
            ? {}
            : { created: record.created.map((path) => resolve(path)) }),
        ...(app === undefined ? {} : { app: app.id })
    }));
    await logChanges(into.changes, kind, records, undoes);
}

/**
 * What every write answers with when it was asked something this route knows: the records are in
 * the change log before the page is answered, so a page that has seen its own write can read the
 * log and find it.
 */
async function answer(
    outcome: WriteOutcome,
    kind: string,
    into: WriteTarget,
    undoes?: string,
    app?: HeldApp
): Promise<Response> {
    await recordWrite(outcome, kind, into, undoes, app);
    return json({
        ok: true,
        changed: outcome.changed,
        refused: outcome.refused,
        id: outcome.id
    });
}

/** The refusal of a write that needs a hub when the workspace lists none. */
function noHub(into: WriteTarget): Response {
    return json({ error: words(into.config.text, 'server.workspace.no_hub') }, { status: 409 });
}

/** The 404 a subtask write gives: the manifest or the entry its target names is not in the hub. */
function notFound(text: Record<string, string>, target: SubtaskTarget): string {
    return target.collection === undefined
        ? words(text, 'server.write_route.no_project', target.id)
        : words(text, 'server.write_route.no_entry', target.id, target.collection);
}

/** The word an app's store write is refused with when its folder cannot be written. */
const UNWRITABLE_WORD = 'unwritable';

/** The answer to a store write of an app: written and recorded, or refused with its word. */
async function storeAnswer(into: WriteTarget, app: HeldApp, value: unknown): Promise<Response> {
    return queuedStore(into, app, async () => {
        let outcome;
        try {
            outcome = writeAppStore(into, app, value);
        } catch {
            // A folder that cannot be written is the app's refusal to word, not a failure of the
            // route.
            return json({
                ok: true,
                changed: [],
                refused: [{ field: 'store', reason: UNWRITABLE_WORD }]
            });
        }
        if ('error' in outcome) return json({ error: outcome.error }, { status: 500 });
        return answer(outcome, APP_STORE, into, undefined, app);
    });
}
