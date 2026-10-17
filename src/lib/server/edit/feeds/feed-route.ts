// Layer 2, server. The feed writes of the write route: a field or a deletion of a feed entry, a new
// lead, a new Lit Watch paper, a paper saved to Literature, a new LinkedIn idea and a LinkedIn
// post. server/edit/writes.ts hands every body to `feedRoute` before the writes after them and
// records what it answers, so the route keeps one place where a write is logged and answered.
//
// A body of another kind answers null and the route goes on; a refusal of the route itself (an
// unknown feed, no hub, no file) is the Response the page reads; a write that was made or refused
// field by field is its outcome and the kind it is logged under.

import { json } from '@sveltejs/kit';
import { words } from '../../core/words.ts';
import {
    feedDeleteWrite,
    feedFieldWrite,
    leadAddWrite,
    linkedinIdeaWrite,
    linkedinPostWrite,
    literatureSaveWrite,
    radarAddWrite
} from '../writes/bodies.ts';
import { homeNaming, homeOf, routedRoot } from '../writes/hubs.ts';
import {
    addLead,
    addLinkedinIdea,
    addRadarEntry,
    deleteFeedEntry,
    isFeedKind,
    markLinkedinPosted,
    radarBucketKeys,
    writeFeedField
} from './feeds.ts';
import { engineLiteraturePath, saveLiterature } from './literature.ts';
import type { HeldApp } from '../../machine/apps/read/held.ts';
import type { WriteOutcome, WriteTarget } from '../writes.ts';

/** What the route does with a feed body: answer it as it is, or log and answer the outcome. */
export type FeedRouted = Response | { outcome: WriteOutcome; kind: string };

/** What a write that names a record answers when its record is of no hub it may reach. */
const NOT_FOUND: WriteOutcome = { found: false, changed: [], refused: [] };

/** The collection key of the saved papers. */
const LITERATURE = 'literature';

/** A refusal of the route, with its status. */
function refused(error: string, status: number): Response {
    return json({ error }, { status });
}

/** The refusal of a write that needs a hub when the workspace lists none. */
function noHub(into: WriteTarget): Response {
    return refused(words(into.config.text, 'server.workspace.no_hub'), 409);
}

/** The feed write a body is, made and answered, or null when the body is no feed write. */
export function feedRoute(
    body: unknown,
    into: WriteTarget,
    app: HeldApp | null
): FeedRouted | null {
    const text = into.config.text;

    const field = feedFieldWrite(body);
    if (field !== null) {
        if (!isFeedKind(field.feed)) {
            return refused(words(text, 'server.write_route.unknown_feed', field.feed), 400);
        }
        const at = routedRoot(into, field.root, app);
        const outcome =
            at === null
                ? NOT_FOUND
                : writeFeedField(at.hub, at.config, field.feed, field.id, field.field, field.value);
        if (!outcome.found) {
            return refused(words(text, 'server.write_route.no_entry', field.id, field.feed), 404);
        }
        return { outcome, kind: 'feed-field' };
    }

    const gone = feedDeleteWrite(body);
    if (gone !== null) {
        if (!isFeedKind(gone.feed)) {
            return refused(words(text, 'server.write_route.unknown_feed', gone.feed), 400);
        }
        const at = routedRoot(into, gone.root, app);
        const outcome =
            at === null ? NOT_FOUND : deleteFeedEntry(at.hub, at.config, gone.feed, gone.id);
        if (!outcome.found) {
            return refused(words(text, 'server.write_route.no_entry', gone.id, gone.feed), 404);
        }
        return { outcome, kind: 'feed-delete' };
    }

    const lead = leadAddWrite(body);
    if (lead !== null) {
        const home = homeOf(into);
        if (home === null) return noHub(into);
        const outcome = addLead(home.hub, home.config, lead.fields);
        if (!outcome.found) return refused(words(text, 'server.write_route.no_leads_feed'), 404);
        return { outcome, kind: 'lead-add' };
    }

    const radar = radarAddWrite(body);
    if (radar !== null) {
        const home = homeOf(into);
        if (home === null) return noHub(into);
        const buckets = radarBucketKeys(into.engineConfig());
        const outcome = addRadarEntry(home.hub, home.config, radar.fields, buckets);
        if (!outcome.found) return refused(words(text, 'server.write_route.no_radar_file'), 404);
        return { outcome, kind: 'radar-add' };
    }

    const paper = literatureSaveWrite(body);
    if (paper !== null) {
        const home =
            paper.root === undefined
                ? homeNaming(into, LITERATURE)
                : routedRoot(into, paper.root, app);
        if (home === null && paper.root !== undefined) {
            return refused(words(text, 'server.workspace.no_hub_named', paper.root), 404);
        }
        if (home === null) return noHub(into);
        if (
            paper.root !== undefined &&
            !home.config.collections.some((one) => one.key === LITERATURE)
        ) {
            const error = words(
                text,
                'server.write_route.no_collection_in_hub',
                paper.root,
                LITERATURE
            );
            return refused(error, 404);
        }
        const path = engineLiteraturePath(into.engineConfig());
        const outcome = saveLiterature(home.hub, home.config, path, paper.source, paper.paper);
        if (!outcome.found) {
            return refused(words(text, 'server.write_route.no_literature_file'), 404);
        }
        return { outcome, kind: 'literature-save' };
    }

    const idea = linkedinIdeaWrite(body);
    if (idea !== null) {
        const home = homeOf(into);
        if (home === null) return noHub(into);
        const outcome = addLinkedinIdea(home.hub, home.config, idea.title, idea.category);
        if (!outcome.found) {
            return refused(words(text, 'server.write_route.no_linkedin_folder'), 404);
        }
        return { outcome, kind: 'linkedin-idea' };
    }

    const post = linkedinPostWrite(body);
    if (post !== null) {
        const at = routedRoot(into, post.root, app);
        const outcome = at === null ? NOT_FOUND : markLinkedinPosted(at.hub, at.config, post.file);
        if (!outcome.found) return refused(words(text, 'server.write_route.no_idea_file'), 404);
        return { outcome, kind: 'linkedin-post' };
    }

    return null;
}
