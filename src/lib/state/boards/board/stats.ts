// Layer 2, client state. Board statistics, waiting lines, stage counts, sizes and dissemination
// live here because they describe board content rather than its saved controls.

import type { Id, Project, Snapshot, Venue } from '../../../data/model/index.ts';
import { byKey, strings, text as str } from '../../../data/helpers/guards.ts';
import { anyWord, hasWord } from '../../../data/shapes/vocab-keys.ts';
import {
    holdersOf,
    joinedEntries,
    keyOf,
    resolvedId,
    rootOf
} from '../../../data/helpers/hub-names.ts';
import { t } from '../../shared/words/text.ts';
import { waitingLabel } from '../waiting.ts';
import {
    setting,
    type BoardItem,
    type BoardStats,
    type StageCount,
    type VenueCount
} from './presets.ts';

/** The focus lane the stats strip counts as waiting on somebody else, a key of `focus_lanes`. */
const BLOCKED = 'blocked';

/** How many venues the strip's distribution shows, most aimed at first. */
const STATS_VENUES = 8;

/** The `venue_conc_warn` of `focus:` when the config names none. */
export const VENUE_WARN = 4;

/** The derived line under a project's chips, and the class that gives the line its kind. */
export type WaitingLine = { kind: 'people' | 'review' | 'blocked'; text: string };

/**
 * What a project is waiting on. Explicit people win over submission review (a stage whose word of
 * `stages` carries `pauses_countdown`), which wins over a generic external block (a chip whose word
 * of `chips` carries `blocked`). A `waiting-on:` value is a person drawn by name or another project
 * drawn by its label, through the one rule of waiting.ts.
 */
export function waitingLine(
    project: Pick<Project, 'waitingOn'> & Partial<Pick<Project, 'stage' | 'chips' | 'venueId'>>,
    config: Record<string, unknown>,
    venues: Record<Id, Venue>,
    people: Record<Id, string>,
    projects: Record<Id, Project> = {}
): WaitingLine | null {
    if (project.waitingOn.length > 0) {
        const names = project.waitingOn.map((id) => waitingLabel(id, people, projects)).join(', ');
        return { kind: 'people', text: t('project.helper.waiting_on', names) };
    }
    if (hasWord(config, 'stages', 'pauses_countdown', project.stage)) {
        const venue = project.venueId === undefined ? undefined : venues[project.venueId];
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string takes the fallback here, which ?? would not
        const name = venue === undefined ? '' : venue.short?.trim() || venue.name;
        return {
            kind: 'review',
            text:
                venue === undefined
                    ? t('project.helper.under_review_unset')
                    : t('project.helper.under_review_at', name)
        };
    }
    if (anyWord(config, 'chips', 'blocked', project.chips ?? [])) {
        return { kind: 'blocked', text: t('project.helper.blocked_external') };
    }
    return null;
}

/**
 * The strip above the board: how many projects it holds, how many are ready to go out (a stage
 * whose word of `stages` carries `submit_ready`), how many are waiting on somebody, how many are
 * dated, and where they are aimed. The counts are over the board's own projects, before any
 * filter, so the strip says what the board is rather than what is on screen. The venues come from
 * the registry rather than from the manifests, so a chip carries the catalogued short name and the
 * full one it stands for. A venue is counted by its name, so the one journal catalogued in two hubs
 * of the workspace is one chip with the papers of both.
 */
export function stats(
    items: BoardItem[],
    venues: Record<Id, Venue>,
    config: Record<string, unknown> = {}
): BoardStats {
    const warnAt = setting(config, 'venue_conc_warn', VENUE_WARN);
    const counts = new Map<string, { id: Id; count: number }>();
    let submitReady = 0;
    let blocked = 0;
    let dated = 0;
    for (const item of items) {
        if (hasWord(config, 'stages', 'submit_ready', item.project.stage)) submitReady += 1;
        if (item.project.focus === BLOCKED) blocked += 1;
        if (item.project.deadline !== undefined && item.project.deadline !== '') dated += 1;
        const id = item.venue?.id;
        if (id === undefined) continue;
        const name = byKey(venues, id)?.name ?? keyOf(id);
        const held = counts.get(name);
        counts.set(name, { id: held?.id ?? id, count: (held?.count ?? 0) + 1 });
    }
    const rows: VenueCount[] = [...counts.entries()].map(([name, { id, count }]) => {
        const venue = byKey(venues, id);
        return {
            id,
            short: venue?.short !== undefined && venue.short !== '' ? venue.short : name,
            name,
            count,
            warn: count >= warnAt
        };
    });
    rows.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
    return {
        active: items.length,
        submitReady,
        blocked,
        dated,
        venues: rows.slice(0, STATS_VENUES)
    };
}

/**
 * How many projects are at each stage, in the order of `stages` of the config, with a stage that
 * map does not name after the ones it does and in its own order. A project with no stage is not
 * counted: there is no toggle to draw for a stage that has no name.
 */
export function stageCounts(items: BoardItem[], order: string[] = []): StageCount[] {
    const counts = new Map<string, number>();
    for (const item of items) {
        const stage = item.project.stage;
        if (stage === undefined || stage === '') continue;
        counts.set(stage, (counts.get(stage) ?? 0) + 1);
    }
    const rank = (stage: string): number => {
        const at = order.indexOf(stage);
        return at < 0 ? order.length : at;
    };
    return [...counts.entries()]
        .map(([stage, count]) => ({ stage, count }))
        .sort((left, right) => rank(left.stage) - rank(right.stage));
}

/** A size as the file finder writes it: megabytes to one decimal, else whole kilobytes. */
export function humanSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 KB';
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.max(1, Math.floor(bytes / 1024))} KB`;
}

/** One entry of a collection that names a project: which collection it is in, and its words. */
export type Dissemination = { collection: string; id: Id; title: string };

/** The collections whose entries say a project was presented, taught or applied with. */
const ACTIVITY = ['events', 'education', 'applications'];

/**
 * The events, education and applications entries whose `related:` names one project, which is where
 * the work was disseminated: a key of `related:` names the project its entry's hub resolves it to,
 * its own hub's first, then the one other hub's that holds it. An events entry the reader only
 * attended is not one: its `role` says `attend`, and attending somebody else's conference is not
 * this project appearing anywhere.
 */
export function disseminated(snapshot: Snapshot, id: Id): Dissemination[] {
    const found: Dissemination[] = [];
    const held = holdersOf(Object.values(snapshot.entities.projects));
    const names = (entry: { root?: string }, key: string): boolean =>
        resolvedId(held, rootOf(entry), key) === id;
    for (const collection of ACTIVITY) {
        const entries = joinedEntries(snapshot.entities.collections, collection);
        for (const entry of entries) {
            const role = str(entry.fields.role);
            if (collection === 'events' && role === 'attend') continue;
            if (!strings(entry.fields.related).some((one) => names(entry, one))) continue;
            found.push({ collection, id: entry.id, title: entry.title });
        }
    }
    return found;
}
