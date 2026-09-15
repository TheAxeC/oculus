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
// The four modules below it, split out when one file passed nine hundred lines: writes/manifest.ts
// for a project.yml and a new idea, writes/entries.ts for a collection file, writes/subtasks.ts for
// a subtask line and a career host, writes/bodies.ts for the ten body parsers. Everything they
// export that this file exported before the split is re-exported here, so an importer names either.

import { join } from 'node:path';
import { portfolioConfigFrom } from '../data/index.ts';
import {
    changesKeep,
    configDir,
    engineDir,
    loadConfig,
    loadLocal
} from '../data/sources/config.ts';
import { hasToken, sameOrigin } from './auth.ts';
import { changeAt, defaultChangesPath, logChanges, pathOf } from './changes.ts';
import { undoChange } from './writes/undo.ts';
import { defaultBookmarksPath } from './fs/bookmarks.ts';
import { setHidden, setOverride } from './sessions/overrides.ts';
import { projects as projectsOf } from './sessions/hooks.ts';
import type { HubLike } from './sessions/hooks.ts';
import { createIdea, writeManifest } from './writes/manifest.ts';
import { writeDeck } from './writes/deck.ts';
import { writeMute } from './writes/audit-mute.ts';
import { createEntry, removeEntry, reorderCollection, writeEntry } from './writes/entries.ts';
import { writeHost, writeSubtask, writeSubtaskAdd } from './writes/subtasks.ts';
import {
    addLead,
    addLinkedinIdea,
    deleteFeedEntry,
    isFeedKind,
    markLinkedinPosted,
    writeFeedField
} from './feeds.ts';
import {
    auditMuteWrite,
    deckWrite,
    deleteEntryWrite,
    entryWrite,
    feedDeleteWrite,
    feedFieldWrite,
    hostWrite,
    manifestWrite,
    leadAddWrite,
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
import type { ChangeLog, ChangeRecord } from './changes.ts';
import type { FsWrites } from './fs.ts';
import type { Refusal } from './yaml-edit.ts';
import type { SubtaskTarget } from './writes/subtasks.ts';
import type { PortfolioConfig, Project } from '../data/model.ts';

/**
 * What a write needs to know: which hub to write in, what its manifests are checked against, where
 * the per-session overrides file is, and where the reader's own bookmarks are. The overrides path is
 * absent on a machine that has not set `sessions_overrides` in local.yml, and
 * `defaultOverridesPath()` is used then.
 *
 * `bookmarks` is a collection of the reader's own that lives outside the hub, so the four entry
 * writes are given it and resolve the key `bookmarks` to that file rather than to a hub one.
 */
export type WriteTarget = {
    hub: string;
    config: PortfolioConfig;
    overrides?: string;
    /**
     * The projects of the portfolio this server last published, which the deck write builds its
     * catalog of slide keys from. It is required rather than optional so that a route reaching for a
     * target cannot leave the deck write with no catalog and refuse every save; a process that has
     * published no portfolio yet names no projects, and the write refuses with a reason.
     */
    projects: () => Project[];
    bookmarks: string;
    /**
     * Where this machine's change log is, how much of it is kept, and the chain an append waits
     * behind. A caller with no server in hand holds none, and then a write records nothing.
     */
    changes?: ChangeLog;
    /**
     * The engine's own config/behavior.yml, where the audit's mute list lives. It is named here
     * rather than reached for, so a test writes a copy and the browser layer writes the copy
     * OCULUS_CONFIG points at rather than the checkout's.
     */
    behaviorFile: string;
};

export type WriteOutcome = {
    /** False when the hub holds no project with that id; then nothing was read and nothing written. */
    found: boolean;
    changed: string[];
    refused: Refusal[];
    /**
     * What the change log records of this write: the value the file held and the value written, at
     * the one point the writer has both. A write that changed nothing carries none.
     */
    records?: ChangeRecord[];
};

// The writers and the parsers, under the name this file gave them before the split.
export { coerce, createIdea, fieldTypes, insideHub, writeManifest } from './writes/manifest.ts';
export { writeDeck } from './writes/deck.ts';
export {
    collectionFile,
    createEntry,
    identityField,
    removeEntry,
    reorderCollection,
    writeEntry
} from './writes/entries.ts';
export { writeHost, writeSubtask, writeSubtaskAdd } from './writes/subtasks.ts';
export type { SubtaskAction, SubtaskTarget } from './writes/subtasks.ts';
export { writeMute } from './writes/audit-mute.ts';
export {
    auditMuteWrite,
    deckWrite,
    deleteEntryWrite,
    entryWrite,
    feedDeleteWrite,
    feedFieldWrite,
    hostWrite,
    manifestWrite,
    leadAddWrite,
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
export { undoChange, valueNow } from './writes/undo.ts';

/** The engine config file the audit's mute list lives in. */
const BEHAVIOR = 'behavior.yml';

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/**
 * Where writes land on this machine: the hub of local.yml, read the way every other reader does, and
 * the projects of the portfolio this request's server last published.
 *
 * The server is passed in rather than reached from a module, so nothing here is process-wide. A
 * caller with no server in hand (a document read, a deposit action) names no projects, and only the
 * deck write depends on them.
 */
export function target(server?: { hub: HubLike; fsWrites: FsWrites }): WriteTarget {
    const engine = engineDir();
    const local = loadLocal(engine);
    const merged = loadConfig(engine).config;
    return {
        hub: local.hub,
        config: portfolioConfigFrom(merged),
        overrides: local.sessionsOverrides,
        projects: () => (server === undefined ? [] : projectsOf(server.hub)),
        bookmarks: local.bookmarks ?? defaultBookmarksPath(),
        behaviorFile: join(configDir(engine), BEHAVIOR),
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
    into: WriteTarget
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token))
        return json(403, { error: 'the write token is missing or stale' });

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    const session = sessionWrite(body);
    if (session !== null) {
        const changed: string[] = [];
        const refused: Refusal[] = [];
        const records: ChangeRecord[] = [];
        try {
            if (session.hidden !== undefined) {
                const outcome = setHidden(session.id, session.hidden, into.overrides);
                changed.push(...outcome.changed);
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
            return json(500, { error: `the session write could not be saved: ${reason}` });
        }
        return answer({ found: true, changed, refused, records }, 'session', into);
    }

    const write = manifestWrite(body);
    if (write !== null) {
        const outcome = writeManifest(into.hub, into.config, write.id, write.fields);
        if (!outcome.found) return json(404, { error: `no project with the id ${write.id}` });
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
            return json(404, { error: `no entry ${entry.id} in ${entry.collection}` });
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
        if (!outcome.found) return json(404, { error: notFound(subtask.target) });
        return answer(outcome, 'subtask', into);
    }

    const added = subtaskAdd(body);
    if (added !== null) {
        const outcome = writeSubtaskAdd(into.hub, into.config, added.target, added.fields);
        if (!outcome.found) return json(404, { error: notFound(added.target) });
        return answer(outcome, 'subtask-add', into);
    }

    const host = hostWrite(body);
    if (host !== null) {
        const outcome = writeHost(into.hub, host.name, host.status);
        if (!outcome.found) return json(404, { error: `no host named ${host.name}` });
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
        if (!outcome.found) return json(404, { error: `no collection ${fresh.collection}` });
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
        if (!outcome.found) return json(404, { error: `no collection ${order.collection}` });
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
            return json(404, { error: `no entry ${removal.id} in ${removal.collection}` });
        }
        return answer(outcome, 'delete-entry', into);
    }

    const feedField = feedFieldWrite(body);
    if (feedField !== null) {
        if (!isFeedKind(feedField.feed))
            return json(400, { error: `unknown feed ${feedField.feed}` });
        const outcome = writeFeedField(
            into.hub,
            into.config,
            feedField.feed,
            feedField.id,
            feedField.field,
            feedField.value
        );
        if (!outcome.found) {
            return json(404, { error: `no entry ${feedField.id} in ${feedField.feed}` });
        }
        return answer(outcome, 'feed-field', into);
    }

    const feedDelete = feedDeleteWrite(body);
    if (feedDelete !== null) {
        if (!isFeedKind(feedDelete.feed))
            return json(400, { error: `unknown feed ${feedDelete.feed}` });
        const outcome = deleteFeedEntry(into.hub, into.config, feedDelete.feed, feedDelete.id);
        if (!outcome.found) {
            return json(404, { error: `no entry ${feedDelete.id} in ${feedDelete.feed}` });
        }
        return answer(outcome, 'feed-delete', into);
    }

    const lead = leadAddWrite(body);
    if (lead !== null) {
        const outcome = addLead(into.hub, into.config, lead.fields);
        if (!outcome.found) return json(404, { error: 'the leads feed is not on this hub' });
        return answer(outcome, 'lead-add', into);
    }

    const linkedinIdea = linkedinIdeaWrite(body);
    if (linkedinIdea !== null) {
        const outcome = addLinkedinIdea(
            into.hub,
            into.config,
            linkedinIdea.title,
            linkedinIdea.category
        );
        if (!outcome.found) return json(404, { error: 'the LinkedIn folder is not on this hub' });
        return answer(outcome, 'linkedin-idea', into);
    }

    const linkedinPost = linkedinPostWrite(body);
    if (linkedinPost !== null) {
        const outcome = markLinkedinPosted(into.hub, into.config, linkedinPost.file);
        if (!outcome.found)
            return json(404, { error: 'the LinkedIn idea file is not on this hub' });
        return answer(outcome, 'linkedin-post', into);
    }

    const deck = deckWrite(body);
    if (deck !== null) {
        let outcome;
        try {
            outcome = writeDeck(into.config, into.projects(), deck.selection, deck.order);
        } catch {
            // The file is the reader's own configuration and anything about it can go wrong on this
            // machine; the page is told which of the refusals it was and the file is left alone.
            return json(500, { error: 'unwritable' });
        }
        if ('error' in outcome) {
            return json(outcome.error === 'unwritable' ? 500 : 400, { error: outcome.error });
        }
        return answer({ found: true, ...outcome }, 'deck', into);
    }

    const mute = auditMuteWrite(body);
    if (mute !== null) {
        let outcome;
        try {
            outcome = writeMute(into.behaviorFile, mute.signature, mute.muted);
        } catch {
            // The file is the reader's own configuration and anything about it can go wrong on this
            // machine; the page is told which of the refusals it was and the file is left alone.
            return json(500, { error: 'unwritable' });
        }
        if ('error' in outcome) {
            return json(outcome.error === 'unwritable' ? 500 : 400, { error: outcome.error });
        }
        return answer({ found: true, ...outcome }, 'audit-mute', into);
    }

    const idea = newIdea(body);
    if (idea !== null) return answer(createIdea(into.hub, idea.fields), 'new-idea', into);

    const undo = undoWrite(body);
    if (undo !== null) {
        if (into.changes === undefined) return json(404, { error: 'unknown' });
        const change = changeAt(into.changes, undo.at);
        if (change === undefined) return json(404, { error: 'unknown' });
        const outcome = undoChange(into, change);
        if ('error' in outcome) {
            if (outcome.error === 'refused') {
                return json(400, { error: outcome.error, refused: outcome.refused });
            }
            return json(outcome.error === 'moved' ? 409 : 404, { error: outcome.error });
        }
        // The undo is a write like any other and is recorded like one, by the writer it went
        // through, so taking it back again is the row above it in the log.
        return answer(outcome, change.kind, into, change.at);
    }

    return json(400, { error: 'the body is not a write this route knows' });
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
    return json(200, { ok: true, changed: outcome.changed, refused: outcome.refused });
}

/** The 404 a subtask write gives: the manifest or the entry its target names is not in the hub. */
function notFound(target: SubtaskTarget): string {
    return target.collection === undefined
        ? `no project with the id ${target.id}`
        : `no entry ${target.id} in ${target.collection}`;
}
