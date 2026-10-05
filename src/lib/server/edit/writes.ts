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
// new idea, writes/entries.ts for a collection file, writes/subtasks.ts for a subtask line and a
// career host, writes/bodies.ts for the body parsers (one per kind of write), writes/file-undo.ts
// for taking back a file operation, and the writers of the engine's own configuration files, in
// writes/config/: deck.ts for the deck, audit-mute.ts for the audit's mute list, rail.ts for the
// rail list, roots.ts for the default workspace's folders, config-key.ts for one option of a
// tracked config file and config-value.ts for one list or family of one. What an importer of this
// module needs of them is re-exported here, so an importer may name this module or the one that
// holds the function.

import { json } from '@sveltejs/kit';
import { join } from 'node:path';
import { portfolioConfigFrom } from '../../data/index.ts';
import { changesKeep, configDir, loadLocal, localFile } from '../../data/sources/config.ts';
import { FILES_KIND } from '../../data/file-ops.ts';
import { tokenedBody } from '../core/auth.ts';
import { changeAt, defaultChangesPath, logChanges, pathOf } from '../core/changes.ts';
import { undoChange } from './writes/undo.ts';
import { defaultBookmarksPath } from '../files/fs/bookmarks.ts';
import { rootsFile } from '../files/files.ts';
import { entities as entitiesOf, projects as projectsOf } from '../sessions/stores/hooks.ts';
import type { HubLike } from '../sessions/stores/hooks.ts';
import { setFlag, setOverride } from '../sessions/overrides.ts';
import { glyphNames } from '../../data/sources/config/rail.ts';
import { createIdea, writeManifest } from './writes/manifest.ts';
import { configWrite } from './writes/config/config-write.ts';
import { rootsHeldIn, type RootsHeld } from './writes/config/roots.ts';
import { filesTargetOf, undoFiles, type FilesDeps, type FilesTarget } from './writes/file-undo.ts';
import { createEntry, removeEntry, reorderCollection, writeEntry } from './writes/entries.ts';
import { careerRules, writeHost, writeSubtask, writeSubtaskAdd } from './writes/subtasks.ts';
import {
    addLead,
    addRadarEntry,
    addLinkedinIdea,
    radarBucketKeys,
    deleteFeedEntry,
    isFeedKind,
    markLinkedinPosted,
    writeFeedField
} from './feeds.ts';
import {
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
 * is absent on a machine that has not set `sessions_overrides` in local.yml, and
 * `defaultOverridesPath()` is used then.
 *
 * `bookmarks` is a collection of the reader's own that lives outside the hub, so the four entry
 * writes are given it and resolve the key `bookmarks` to that file rather than to a hub one.
 */
export type WriteTarget = {
    hub: string;
    config: PortfolioConfig;
    /** The engine directory this write's configuration was read from. */
    engine: string;
    /** The career file and its host statuses, out of the request's configuration. */
    career: CareerRules;
    overrides?: string;
    /**
     * The projects of the portfolio this server last published, which the deck write builds its
     * catalog of slide keys from. It is required rather than optional so that a route reaching for
     * a target cannot leave the deck write with no catalog and refuse every save; a process that
     * has published no portfolio yet names no projects, and the write refuses with a reason.
     */
    projects: () => Project[];
    /**
     * One entity map (the domains, the resources) of the portfolio this server last published, or
     * null while it has published none, which the config writes check a choice against. A target
     * built without it checks those choices for their type alone.
     */
    entities?: (kind: 'domains' | 'resources') => Record<string, unknown> | null;
    bookmarks: string;
    /**
     * Where this machine's change log is, how much of it is kept, and the chain an append waits
     * behind. A caller with no server in hand holds none, and then a write records nothing.
     */
    changes?: ChangeLog;
    /**
     * The engine's own config/behavior.yml, where the audit's mute list lives. It is named here
     * rather than reached for, so a test writes a copy and a run started over another engine
     * directory writes that copy rather than the checkout's.
     */
    behaviorFile: string;
    /**
     * The engine's own config/layout.yml, where the rail's list of pages lives, named here for the
     * reason `behaviorFile` is.
     */
    layoutFile: string;
    /**
     * The glyph names of config/catalogs/glyphs.yml as this write's configuration holds them, which
     * a rail entry's glyph must be one of.
     */
    glyphs: string[];
    /**
     * The `roots:` list of the engine's config/sources.yml, where the default workspace's folders
     * live, and what the roots in force hold, which an added folder is checked against. A target
     * built without it writes no roots: the write answers `unwritable`.
     */
    sources?: { file: string; held: RootsHeld };
    /**
     * What taking back a file operation runs over: the roots the file browser serves, the local
     * history folder and the chain the file operations wait on. A target built without it answers
     * `unwritable` to the undo of a file operation.
     */
    files?: FilesTarget;
};

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
     * The id the file gives the entry this write made or edited, read after the write, so a page
     * holding a form over that entry is told where the entry now is. Only an entry write carries
     * it.
     */
    id?: string;
};

// The writers and the parsers, re-exported under their own names.
export { coerce, createIdea, fieldTypes, insideHub, writeManifest } from './writes/manifest.ts';
export { writeDeck } from './writes/config/deck.ts';
export { createEntry, removeEntry, reorderCollection, writeEntry } from './writes/entries.ts';
export { collectionFile, identityField } from '../files/fs/collections.ts';
export { writeHost, writeSubtask, writeSubtaskAdd } from './writes/subtasks.ts';
export type { SubtaskAction, SubtaskTarget } from './writes/subtasks.ts';
export { writeMute } from './writes/config/audit-mute.ts';
export { writeRail } from './writes/config/rail.ts';
export { writeConfigKey } from './writes/config/config-key.ts';
export { writeConfigValue } from './writes/config/config-value.ts';
export { addRootTo, removeRootFrom, writeRoots } from './writes/config/roots.ts';
export {
    auditMuteWrite,
    configKeyWrite,
    configValueWrite,
    deckWrite,
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

/** The engine config file the audit's mute list lives in. */
const BEHAVIOR = 'behavior.yml';

/** The engine config file the rail's list of pages lives in. */
const LAYOUT = 'layout.yml';

/**
 * Where writes land on this machine: the hub of local.yml, read the way every other reader does,
 * the request's merged configuration as its route read it, and the projects of the portfolio this
 * request's server last published.
 *
 * The server is passed in rather than reached from a module, so nothing here is process-wide. A
 * caller with no server in hand (a document read, a deposit action) names no projects, and only the
 * deck write depends on them.
 */
export function target(
    engine: string,
    merged: Record<string, unknown>,
    server?: { hub: HubLike; fsWrites: FsWrites; opsWrites?: FsWrites }
): WriteTarget {
    const local = loadLocal(engine);
    return {
        hub: local.hub,
        config: portfolioConfigFrom(merged, engine),
        engine,
        career: careerRules(merged),
        overrides: local.sessionsOverrides,
        projects: () => (server === undefined ? [] : projectsOf(server.hub)),
        entities: server === undefined ? undefined : (kind) => entitiesOf(server.hub, kind),
        bookmarks: local.bookmarks ?? defaultBookmarksPath(),
        behaviorFile: join(configDir(engine), BEHAVIOR),
        layoutFile: join(configDir(engine), LAYOUT),
        glyphs: glyphNames(merged) ?? [],
        sources: {
            file: rootsFile(engine),
            held: rootsHeldIn(engine, merged, local.hub, local.workspaces)
        },
        files: filesTargetOf(
            rootsHeldIn(engine, merged, local.hub, local.workspaces).served,
            localFile(engine),
            local.history,
            server?.opsWrites
        ),
        changes:
            server === undefined
                ? undefined
                : {
                      file: local.changes ?? defaultChangesPath(),
                      keep: changesKeep(merged),
                      writes: server.fsWrites
                  }
    };
}

/**
 * The whole endpoint: refuse, or write and say what changed. A refusal names what was wrong and
 * nothing more; the page shows it beside the form.
 */
export async function handleWrite(
    request: Request,
    token: string,
    into: WriteTarget,
    deps: FilesDeps = {}
): Promise<Response> {
    const read = await tokenedBody(request, token);
    if (read instanceof Response) return read;
    const body = read.body;
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
                { error: `the session write could not be saved: ${reason}` },
                { status: 500 }
            );
        }
        return answer({ found: true, changed, refused, records }, 'session', into);
    }

    const write = manifestWrite(body);
    if (write !== null) {
        const outcome = writeManifest(into.hub, into.config, write.id, write.fields);
        if (!outcome.found)
            return json({ error: `no project with the id ${write.id}` }, { status: 404 });
        return answer(outcome, 'manifest', into);
    }

    const entry = entryWrite(body);
    if (entry !== null) {
        const outcome = writeEntry(
            into.hub,
            into.config,
            entry.collection,
            entry.id,
            entry.fields,
            into.bookmarks
        );
        if (!outcome.found) {
            return json({ error: `no entry ${entry.id} in ${entry.collection}` }, { status: 404 });
        }
        return answer(outcome, 'entry', into);
    }

    const subtask = subtaskWrite(body);
    if (subtask !== null) {
        const outcome = writeSubtask(
            into.hub,
            into.config,
            subtask.target,
            subtask.key,
            subtask.action,
            subtask.value
        );
        if (!outcome.found) return json({ error: notFound(subtask.target) }, { status: 404 });
        return answer(outcome, 'subtask', into);
    }

    const added = subtaskAdd(body);
    if (added !== null) {
        const outcome = writeSubtaskAdd(into.hub, into.config, added.target, added.fields);
        if (!outcome.found) return json({ error: notFound(added.target) }, { status: 404 });
        return answer(outcome, 'subtask-add', into);
    }

    const host = hostWrite(body);
    if (host !== null) {
        const outcome = writeHost(into.hub, host.name, host.status, into.career);
        if (!outcome.found) return json({ error: `no host named ${host.name}` }, { status: 404 });
        return answer(outcome, 'host', into);
    }

    const fresh = newEntry(body);
    if (fresh !== null) {
        const outcome = createEntry(
            into.hub,
            into.config,
            fresh.collection,
            fresh.fields,
            into.bookmarks
        );
        if (!outcome.found)
            return json({ error: `no collection ${fresh.collection}` }, { status: 404 });
        return answer(outcome, 'new-entry', into);
    }

    const order = reorderWrite(body);
    if (order !== null) {
        const outcome = reorderCollection(
            into.hub,
            into.config,
            order.collection,
            order.order,
            into.bookmarks
        );
        if (!outcome.found)
            return json({ error: `no collection ${order.collection}` }, { status: 404 });
        return answer(outcome, 'reorder', into);
    }

    const removal = deleteEntryWrite(body);
    if (removal !== null) {
        const outcome = removeEntry(
            into.hub,
            into.config,
            removal.collection,
            removal.id,
            into.bookmarks
        );
        if (!outcome.found) {
            return json(
                { error: `no entry ${removal.id} in ${removal.collection}` },
                { status: 404 }
            );
        }
        return answer(outcome, 'delete-entry', into);
    }

    const feedField = feedFieldWrite(body);
    if (feedField !== null) {
        if (!isFeedKind(feedField.feed))
            return json({ error: `unknown feed ${feedField.feed}` }, { status: 400 });
        const outcome = writeFeedField(
            into.hub,
            into.config,
            feedField.feed,
            feedField.id,
            feedField.field,
            feedField.value
        );
        if (!outcome.found) {
            return json(
                { error: `no entry ${feedField.id} in ${feedField.feed}` },
                { status: 404 }
            );
        }
        return answer(outcome, 'feed-field', into);
    }

    const feedDelete = feedDeleteWrite(body);
    if (feedDelete !== null) {
        if (!isFeedKind(feedDelete.feed))
            return json({ error: `unknown feed ${feedDelete.feed}` }, { status: 400 });
        const outcome = deleteFeedEntry(into.hub, into.config, feedDelete.feed, feedDelete.id);
        if (!outcome.found) {
            return json(
                { error: `no entry ${feedDelete.id} in ${feedDelete.feed}` },
                { status: 404 }
            );
        }
        return answer(outcome, 'feed-delete', into);
    }

    const lead = leadAddWrite(body);
    if (lead !== null) {
        const outcome = addLead(into.hub, into.config, lead.fields);
        if (!outcome.found)
            return json({ error: 'the leads feed is not on this hub' }, { status: 404 });
        return answer(outcome, 'lead-add', into);
    }

    const radar = radarAddWrite(body);
    if (radar !== null) {
        const outcome = addRadarEntry(
            into.hub,
            into.config,
            radar.fields,
            radarBucketKeys(into.engine)
        );
        if (!outcome.found) {
            return json({ error: 'Lit Watch has no file on this hub' }, { status: 404 });
        }
        return answer(outcome, 'radar-add', into);
    }

    const linkedinIdea = linkedinIdeaWrite(body);
    if (linkedinIdea !== null) {
        const outcome = addLinkedinIdea(
            into.hub,
            into.config,
            linkedinIdea.title,
            linkedinIdea.category
        );
        if (!outcome.found)
            return json({ error: 'the LinkedIn folder is not on this hub' }, { status: 404 });
        return answer(outcome, 'linkedin-idea', into);
    }

    const linkedinPost = linkedinPostWrite(body);
    if (linkedinPost !== null) {
        const outcome = markLinkedinPosted(into.hub, into.config, linkedinPost.file);
        if (!outcome.found)
            return json({ error: 'the LinkedIn idea file is not on this hub' }, { status: 404 });
        return answer(outcome, 'linkedin-post', into);
    }

    const configured = configWrite(body, into);
    if (configured !== null) {
        if ('error' in configured) {
            return json({ error: configured.error }, { status: configured.status });
        }
        return answer(configured.outcome, configured.kind, into);
    }

    const idea = newIdea(body);
    if (idea !== null) return answer(createIdea(into.hub, idea.fields), 'new-idea', into);

    const undo = undoWrite(body);
    if (undo !== null) {
        if (into.changes === undefined) return json({ error: 'unknown' }, { status: 404 });
        const change = changeAt(into.changes, undo.at);
        if (change === undefined) return json({ error: 'unknown' }, { status: 404 });
        const outcome =
            change.kind === FILES_KIND
                ? await undoFiles(into, change, deps)
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

    return json({ error: 'the body is not a write this route knows' }, { status: 400 });
}

/**
 * What every write answers with when it was asked something this route knows, and the one place the
 * change log is written: the records the writer made are stamped with this kind and appended before
 * the page is answered, so a page that has seen its own write can read the log and find it.
 */
async function answer(
    outcome: WriteOutcome,
    kind: string,
    into: WriteTarget,
    undoes?: string
): Promise<Response> {
    const records = outcome.records?.map((record) => ({
        ...record,
        file: pathOf(into.hub, record.file)
    }));
    await logChanges(into.changes, kind, records, undoes);
    return json({
        ok: true,
        changed: outcome.changed,
        refused: outcome.refused,
        id: outcome.id
    });
}

/** The 404 a subtask write gives: the manifest or the entry its target names is not in the hub. */
function notFound(target: SubtaskTarget): string {
    return target.collection === undefined
        ? `no project with the id ${target.id}`
        : `no entry ${target.id} in ${target.collection}`;
}
