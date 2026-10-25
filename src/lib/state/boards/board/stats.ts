// Layer 2, client state. The counts on a board's controls, waiting lines, sizes and dissemination
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
import { setting, type BoardItem, type BoardStats, type VenueCount } from './presets.ts';

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
 * The counts a project board's controls carry: how many projects it holds, which line 2 of its bar
 * ends with; how many carry a deadline, which the deadline toggle reads; how many are blocked (a
 * chip whose word of `chips` carries `blocked`), the Situation button's badge; and the venues that
 * `venue_conc_warn` of `focus:` or more of its projects at a stage flagged `live` aim at, the
 * Venue button's mark, counted as the Focus venue-load line counts them. The counts are over the
 * board's own projects, before any filter, so they say what the board is rather than what is on
 * screen. A venue is counted by its name, so the one journal catalogued in two hubs of the
 * workspace is one venue with the papers of both, and carries the registry's short name. `config`
 * gives the settings, and `wordsOf` the words a project's stage and chips are read by, those of
 * the project's hub.
 */
export function stats(
    items: BoardItem[],
    venues: Record<Id, Venue>,
    config: Record<string, unknown> = {},
    wordsOf: (hub: string) => Record<string, unknown> = () => config
): BoardStats {
    const warnAt = setting(config, 'venue_conc_warn', VENUE_WARN);
    const counts = new Map<string, { id: Id; count: number }>();
    let blocked = 0;
    let dated = 0;
    for (const item of items) {
        const words = wordsOf(rootOf(item.project));
        if (anyWord(words, 'chips', 'blocked', item.project.chips)) blocked += 1;
        if (item.project.deadline !== undefined && item.project.deadline !== '') dated += 1;
        const id = item.venue?.id;
        if (id === undefined || !hasWord(words, 'stages', 'live', item.project.stage)) continue;
        const name = byKey(venues, id)?.name ?? keyOf(id);
        const held = counts.get(name);
        counts.set(name, { id: held?.id ?? id, count: (held?.count ?? 0) + 1 });
    }
    const rows: (VenueCount & { name: string })[] = [...counts.entries()]
        .filter(([, { count }]) => count >= warnAt)
        .map(([name, { id, count }]) => {
            const venue = byKey(venues, id);
            const short = venue?.short !== undefined && venue.short !== '' ? venue.short : name;
            return { id, short, name, count };
        });
    rows.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
    return {
        projects: items.length,
        blocked,
        dated,
        warnAt,
        venues: rows.map(({ id, short, count }) => ({ id, short, count }))
    };
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
