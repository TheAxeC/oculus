// Layer 2, client state. Board statistics, waiting lines, type counts, sizes and dissemination live
// here because they describe board content rather than its saved controls.

import type { Id, Project, Snapshot, Venue } from '../../data/model.ts';
import { strings, text as str } from '../../data/guards.ts';
import { t } from '../text.ts';
import { type BoardItem, type BoardStats, type TypeCount, type VenueCount } from './presets.ts';

/** The status chip the stats strip counts as ready to go out. */
const SUBMIT_READY = 'submit-ready';

/** The focus lane the stats strip counts as waiting on somebody else. */
const BLOCKED = 'blocked';

/** How many venues the strip's distribution shows, most aimed at first. */
const STATS_VENUES = 8;

/** The `venue_conc_warn` the config names when it names none. */
const VENUE_WARN = 4;

/** The derived line under a project's chips, and the class that gives the line its kind. */
export type WaitingLine = { kind: 'people' | 'review' | 'blocked'; text: string };

/**
 * What a project is waiting on. Explicit people win over submission review, which wins over a
 * generic external block. A collaborator id not in the collection remains useful as written.
 */
export function waitingLine(
    project: Project,
    venues: Record<Id, Venue>,
    collaborators: Record<Id, string>
): WaitingLine | null {
    if (project.waitingOn.length > 0) {
        const names = project.waitingOn.map((id) => collaborators[id] ?? id).join(', ');
        return { kind: 'people', text: t('project.helper.waiting_on', names) };
    }
    if (project.chips.includes('submitted')) {
        const venue = project.venueId === undefined ? undefined : venues[project.venueId];
        const name = venue === undefined ? '' : venue.short?.trim() || venue.name;
        return {
            kind: 'review',
            text:
                venue === undefined
                    ? t('project.helper.under_review_unset')
                    : t('project.helper.under_review_at', name)
        };
    }
    if (project.chips.includes('blocked')) {
        return { kind: 'blocked', text: t('project.helper.blocked_external') };
    }
    return null;
}

/** A number out of the merged config, and the fallback behavior.yml's own comment names. */
function setting(config: Record<string, unknown>, key: string, fallback: number): number {
    const value = config[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * The strip above the board: how many projects it holds, how many are ready to go out, how many
 * are waiting on somebody, how many are dated, and where they are aimed. The counts are over the
 * board's own projects, before any filter, so the strip says what the board is rather than what is
 * on screen. The venues come from the registry rather than from the manifests, so a chip carries
 * the catalogued short name and the full one it stands for.
 */
export function stats(
    items: BoardItem[],
    venues: Record<Id, Venue>,
    config: Record<string, unknown> = {}
): BoardStats {
    const warnAt = setting(config, 'venue_conc_warn', VENUE_WARN);
    const counts = new Map<Id, number>();
    let submitReady = 0;
    let blocked = 0;
    let dated = 0;
    for (const item of items) {
        if (item.chips.includes(SUBMIT_READY)) submitReady += 1;
        if (item.project.focus === BLOCKED) blocked += 1;
        if (item.project.deadline !== undefined && item.project.deadline !== '') dated += 1;
        const id = item.venue?.id;
        if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const rows: VenueCount[] = [...counts.entries()].map(([id, count]) => {
        const venue = venues[id];
        const name = venue?.name ?? id;
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
 * How many projects carry each type, in the `type_order` of the config, with a type that list does
 * not name after the ones it does and in its own order. A project with no type is not counted:
 * there is no toggle to draw for a type that has no name.
 */
export function typeCounts(items: BoardItem[], order: string[] = []): TypeCount[] {
    const counts = new Map<string, number>();
    for (const item of items) {
        const type = item.project.type;
        if (type === undefined || type === '') continue;
        counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    const rank = (type: string): number => {
        const at = order.indexOf(type);
        return at < 0 ? order.length : at;
    };
    return [...counts.entries()]
        .map(([type, count]) => ({ type, count }))
        .sort((left, right) => rank(left.type) - rank(right.type));
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
 * the work was disseminated. An events entry the reader only attended is not one: its `role` says `attend`, and
 * attending somebody else's conference is not this project appearing anywhere.
 */
export function disseminated(snapshot: Snapshot, id: Id): Dissemination[] {
    const found: Dissemination[] = [];
    for (const collection of ACTIVITY) {
        const entries = snapshot.entities.collections[collection]?.entries ?? [];
        for (const entry of entries) {
            const role = str(entry.fields.role);
            if (collection === 'events' && role === 'attend') continue;
            if (!strings(entry.fields.related).includes(id)) continue;
            found.push({ collection, id: entry.id, title: entry.title });
        }
    }
    return found;
}
