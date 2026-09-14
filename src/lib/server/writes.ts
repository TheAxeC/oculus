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

import { portfolioConfigFrom } from '../data/index.ts';
import { engineDir, loadConfig, loadLocal } from '../data/sources/config.ts';
import { hasToken, sameOrigin } from './auth.ts';
import { setHidden, setOverride } from './sessions/overrides.ts';
import { createIdea, writeManifest } from './writes/manifest.ts';
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
    subtaskWrite
} from './writes/bodies.ts';
import type { Refusal } from './yaml-edit.ts';
import type { SubtaskTarget } from './writes/subtasks.ts';
import type { PortfolioConfig } from '../data/model.ts';

/**
 * What a write needs to know: which hub to write in, what its manifests are checked against, and
 * where the per-session overrides file is. The overrides path is absent on a machine that has not
 * set `sessions_overrides` in local.yml, and O12's own default is used then.
 */
export type WriteTarget = { hub: string; config: PortfolioConfig; overrides?: string };

export type WriteOutcome = {
    /** False when the hub holds no project with that id; then nothing was read and nothing written. */
    found: boolean;
    changed: string[];
    refused: Refusal[];
};

// The writers and the parsers, under the name this file gave them before the split.
export { coerce, createIdea, fieldTypes, insideHub, writeManifest } from './writes/manifest.ts';
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
export {
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
    subtaskWrite
} from './writes/bodies.ts';

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    });
}

/** Where writes land on this machine: the hub of local.yml, read the way every other reader does. */
export function target(): WriteTarget {
    const engine = engineDir();
    const local = loadLocal(engine);
    return {
        hub: local.hub,
        config: portfolioConfigFrom(loadConfig(engine).config),
        overrides: local.sessionsOverrides
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
        try {
            if (session.hidden !== undefined) {
                setHidden(session.id, session.hidden, into.overrides);
                changed.push('hidden');
            }
            if (session.area !== undefined || session.title !== undefined) {
                const outcome = setOverride(
                    session.id,
                    { area: session.area, title: session.title },
                    into.overrides
                );
                changed.push(...outcome.changed);
                refused.push(...outcome.refused);
            }
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return json(500, { error: `the session write could not be saved: ${reason}` });
        }
        return json(200, { ok: true, changed, refused });
    }

    const write = manifestWrite(body);
    if (write !== null) {
        const outcome = writeManifest(into.hub, into.config, write.id, write.fields);
        if (!outcome.found) return json(404, { error: `no project with the id ${write.id}` });
        return answer(outcome);
    }

    const entry = entryWrite(body);
    if (entry !== null) {
        const outcome = writeEntry(into.hub, into.config, entry.collection, entry.id, entry.fields);
        if (!outcome.found) {
            return json(404, { error: `no entry ${entry.id} in ${entry.collection}` });
        }
        return answer(outcome);
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
        return answer(outcome);
    }

    const added = subtaskAdd(body);
    if (added !== null) {
        const outcome = writeSubtaskAdd(into.hub, into.config, added.target, added.fields);
        if (!outcome.found) return json(404, { error: notFound(added.target) });
        return answer(outcome);
    }

    const host = hostWrite(body);
    if (host !== null) {
        const outcome = writeHost(into.hub, host.name, host.status);
        if (!outcome.found) return json(404, { error: `no host named ${host.name}` });
        return answer(outcome);
    }

    const fresh = newEntry(body);
    if (fresh !== null) {
        const outcome = createEntry(into.hub, into.config, fresh.collection, fresh.fields);
        if (!outcome.found) return json(404, { error: `no collection ${fresh.collection}` });
        return answer(outcome);
    }

    const order = reorderWrite(body);
    if (order !== null) {
        const outcome = reorderCollection(into.hub, into.config, order.collection, order.order);
        if (!outcome.found) return json(404, { error: `no collection ${order.collection}` });
        return answer(outcome);
    }

    const removal = deleteEntryWrite(body);
    if (removal !== null) {
        const outcome = removeEntry(into.hub, into.config, removal.collection, removal.id);
        if (!outcome.found) {
            return json(404, { error: `no entry ${removal.id} in ${removal.collection}` });
        }
        return answer(outcome);
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
        return answer(outcome);
    }

    const feedDelete = feedDeleteWrite(body);
    if (feedDelete !== null) {
        if (!isFeedKind(feedDelete.feed))
            return json(400, { error: `unknown feed ${feedDelete.feed}` });
        const outcome = deleteFeedEntry(into.hub, into.config, feedDelete.feed, feedDelete.id);
        if (!outcome.found) {
            return json(404, { error: `no entry ${feedDelete.id} in ${feedDelete.feed}` });
        }
        return answer(outcome);
    }

    const lead = leadAddWrite(body);
    if (lead !== null) {
        const outcome = addLead(into.hub, into.config, lead.fields);
        if (!outcome.found) return json(404, { error: 'the leads feed is not on this hub' });
        return answer(outcome);
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
        return answer(outcome);
    }

    const linkedinPost = linkedinPostWrite(body);
    if (linkedinPost !== null) {
        const outcome = markLinkedinPosted(into.hub, into.config, linkedinPost.file);
        if (!outcome.found)
            return json(404, { error: 'the LinkedIn idea file is not on this hub' });
        return answer(outcome);
    }

    const idea = newIdea(body);
    if (idea !== null) return answer(createIdea(into.hub, idea.fields));

    return json(400, { error: 'the body is not a write this route knows' });
}

/** What every write answers with when it was asked something this route knows. */
function answer(outcome: WriteOutcome): Response {
    return json(200, { ok: true, changed: outcome.changed, refused: outcome.refused });
}

/** The 404 a subtask write gives: the manifest or the entry its target names is not in the hub. */
function notFound(target: SubtaskTarget): string {
    return target.collection === undefined
        ? `no project with the id ${target.id}`
        : `no entry ${target.id} in ${target.collection}`;
}
