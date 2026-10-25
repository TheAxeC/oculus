// Layer 2, server. The feed writes of the write route: a field or a deletion of a feed entry, a new
// lead, a new Lit Watch paper, a paper saved to Literature, a new LinkedIn idea and a LinkedIn
// post. server/edit/writes.ts hands every body to `feedRoute` before the writes after them and
// records what it answers, so the route keeps one place where a write is logged and answered.
//
// A write to an existing entry names it by its internal id, `<hub>:<key>` (data/snapshot/hubs/
// feeds.ts), and is routed by the id's hub part as every record write is (writes/hubs.ts); a write
// that makes an entry answers with the new entry's id. A body of another kind answers null and the
// route goes on; a refusal of the route itself (an unknown feed, no hub, no file) is the Response
// the page reads; a write that was made or refused field by field is its outcome and the kind it is
// logged under.

import { json } from '@sveltejs/kit';
import { keyOf } from '../../../data/helpers/hub-names.ts';
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
import {
    homeNaming,
    homeOf,
    noHub,
    routeRefusal,
    rootedHome,
    routed,
    withHubId
} from '../writes/hubs.ts';
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
        const off = routeRefusal(into, [field.id]);
        if (off !== null) return off;
        const at = routed(into, field.id, app);
        const outcome =
            at === null
                ? NOT_FOUND
                : writeFeedField(
                      at.into.hub,
                      at.into.config,
                      field.feed,
                      at.id,
                      field.field,
                      field.value
                  );
        if (!outcome.found) {
            const error = words(text, 'server.write_route.no_entry', keyOf(field.id), field.feed);
            return refused(error, 404);
        }
        return { outcome, kind: 'feed-field' };
    }

    const gone = feedDeleteWrite(body);
    if (gone !== null) {
        if (!isFeedKind(gone.feed)) {
            return refused(words(text, 'server.write_route.unknown_feed', gone.feed), 400);
        }
        const off = routeRefusal(into, [gone.id]);
        if (off !== null) return off;
        const at = routed(into, gone.id, app);
        const outcome =
            at === null
                ? NOT_FOUND
                : deleteFeedEntry(at.into.hub, at.into.config, gone.feed, at.id);
        if (!outcome.found) {
            const error = words(text, 'server.write_route.no_entry', keyOf(gone.id), gone.feed);
            return refused(error, 404);
        }
        return { outcome, kind: 'feed-delete' };
    }

    const lead = leadAddWrite(body);
    if (lead !== null) {
        const home = homeOf(into, app);
        if (home === null) return noHub(into, app);
        const outcome = addLead(home.hub, home.config, lead.fields);
        if (!outcome.found) return refused(words(text, 'server.write_route.no_leads_feed'), 404);
        return { outcome: withHubId(outcome, home), kind: 'lead-add' };
    }

    const radar = radarAddWrite(body);
    if (radar !== null) {
        const home = homeOf(into, app);
        if (home === null) return noHub(into, app);
        const buckets = radarBucketKeys(home.config.merged);
        const outcome = addRadarEntry(home.hub, home.config, radar.fields, buckets);
        if (!outcome.found) return refused(words(text, 'server.write_route.no_radar_file'), 404);
        return { outcome: withHubId(outcome, home), kind: 'radar-add' };
    }

    const paper = literatureSaveWrite(body);
    if (paper !== null) {
        const home = rootedHome(into, paper.root, app, () => homeNaming(into, LITERATURE, app));
        if (home instanceof Response) return home;
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
        return { outcome: withHubId(outcome, home), kind: 'literature-save' };
    }

    const idea = linkedinIdeaWrite(body);
    if (idea !== null) {
        const home = homeOf(into, app);
        if (home === null) return noHub(into, app);
        const outcome = addLinkedinIdea(home.hub, home.config, idea.title, idea.category);
        if (!outcome.found) {
            return refused(words(text, 'server.write_route.no_linkedin_folder'), 404);
        }
        return { outcome: withHubId(outcome, home), kind: 'linkedin-idea' };
    }

    const post = linkedinPostWrite(body);
    if (post !== null) {
        const off = routeRefusal(into, [post.id]);
        if (off !== null) return off;
        const at = routed(into, post.id, app);
        const outcome =
            at === null ? NOT_FOUND : markLinkedinPosted(at.into.hub, at.into.config, at.id);
        if (!outcome.found) return refused(words(text, 'server.write_route.no_idea_file'), 404);
        return { outcome, kind: 'linkedin-post' };
    }

    return null;
}
