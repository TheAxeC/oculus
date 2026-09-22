// Layer 2, client state. Collection cards and the manifest-lag attention line for Focus. All values are derived from the supplied snapshot and config; the view resolves configured colours through toneOf.

import type { Entry, Id, Project, Snapshot } from '../../data/model.ts';
import { isMap, byKey, text as str } from '../../data/helpers/guards.ts';
import { numericSetting } from '../workbench/rail-badges.ts';

/** The manifest-lag attention line, with the four project links it draws and the remainder count. */
export type ManifestBehind = {
    count: number;
    projects: { id: Id; label: string; days: number }[];
    more: number;
};

/** One card of the band under the lanes. */
export type BandItem = {
    id: string;
    title: string;
    /** The collection view key, including funding, whose entry the card reveals. */
    entry: string;
    deadline?: string;
    /**
     * The card's one line of prose: the entry's own `note:`, and its `sub:` descriptor when it has
     * none, which is what the education file writes instead. The view shortens it to a sentence.
     */
    note?: string;
};

/** One stage stacked inside the funding column of the band. */
export type BandStage = {
    label: string;
    color: string;
    items: BandItem[];
};

/** The band: grant applications by stage, positions out for an answer, teaching this year. */
export type Band = {
    tones: { funding: string; jobs: string; teaching: string };
    funding: BandStage[];
    applications: BandItem[];
    education: BandItem[];
};

/** Active and manuscript projects whose manifest lags their documents past the configured grace. */
export function manifestsBehind(
    projects: Project[],
    config: Record<string, unknown>
): ManifestBehind | null {
    const grace = numericSetting(config, 'stale_lag_days');
    if (grace === null) return null;
    const stale = projects
        .filter(
            (project) =>
                (project.type === 'active' || project.type === 'manuscript') &&
                project.staleDays !== undefined &&
                project.staleDays >= grace
        )
        .sort((a, b) => (b.staleDays ?? 0) - (a.staleDays ?? 0) || a.title.localeCompare(b.title));
    if (stale.length === 0) return null;
    return {
        count: stale.length,
        projects: stale.slice(0, 4).map((project) => ({
            id: project.id,
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string takes the fallback here, which ?? would not
            label: project.short || project.title,
            days: project.staleDays ?? 0
        })),
        more: Math.max(0, stale.length - 4)
    };
}

/** The stages of `fund_stages`, and the statuses each one gathers. */
function fundStages(
    config: Record<string, unknown>
): { label: string; color: string; statuses: string[] }[] {
    const rows = config.fund_stages;
    if (!Array.isArray(rows)) return [];
    const out: { label: string; color: string; statuses: string[] }[] = [];
    for (const row of rows) {
        if (!isMap(row)) continue;
        const statuses = Array.isArray(row.statuses)
            ? row.statuses.filter((one): one is string => typeof one === 'string')
            : [];
        out.push({
            label: str(row.label),
            color: str(row.color),
            statuses: statuses.map((one) => one.toLowerCase())
        });
    }
    return out;
}

/** A band card sorts by its date, and by its title when it has none. */
function bandOrder(a: BandItem, b: BandItem): number {
    const one = a.deadline ?? '';
    const two = b.deadline ?? '';
    if (one !== '' && two !== '') return one.localeCompare(two);
    if (one !== '') return -1;
    if (two !== '') return 1;
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

function bandItem(entry: Entry, key: string): BandItem {
    const note = str(entry.fields.note) === '' ? str(entry.fields.sub) : str(entry.fields.note);
    const card: BandItem = {
        id: entry.id,
        title: entry.title,
        entry: key,
        deadline: entryDeadline(entry)
    };
    if (note !== '') card.note = note;
    return card;
}

/**
 * The band under the lanes: the durable work that is not a project. Grants stack by the stage their
 * status names, positions are the applications still out for an answer, and teaching is what the
 * education file marks as running this academic year.
 */
export function collectionLanes(snapshot: Snapshot, config: Record<string, unknown>): Band {
    const collections = snapshot.entities.collections;
    const grants = byKey(collections, 'funding')?.entries ?? [];
    const funding: BandStage[] = [];
    for (const stage of fundStages(config)) {
        const items = grants
            .filter((entry) =>
                stage.statuses.includes(str(entry.fields.status).trim().toLowerCase())
            )
            .map((entry) => bandItem(entry, 'funding'))
            .sort(bandOrder);
        if (items.length > 0) funding.push({ label: stage.label, color: stage.color, items });
    }
    const applications = (byKey(collections, 'applications')?.entries ?? [])
        .filter((entry) => str(entry.fields.status).trim().toLowerCase() === 'active')
        .map((entry) => bandItem(entry, 'applications'))
        .sort(bandOrder);
    const education = (byKey(collections, 'education')?.entries ?? [])
        .filter((entry) => str(entry.fields.status).trim().toLowerCase() === 'ongoing')
        .map((entry) => bandItem(entry, 'education'))
        .sort(bandOrder);
    const held = isMap(config.focus_lane_tones) ? config.focus_lane_tones : {};
    const tones = {
        funding: str(held.funding),
        jobs: str(held.jobs),
        teaching: str(held.teaching)
    };
    return { funding, applications, education, tones };
}

/** An ISO day, excluding year-only and malformed date values. */
function isoDate(value: unknown): string {
    const text = str(value).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

/** A collection deadline or date, then the first valid Deadline metadata row: the ticker's rule. */
export function entryDate(entry: Entry): string {
    const top = isoDate(entry.fields.deadline) || isoDate(entry.fields.date);
    if (top !== '') return top;
    return metaDeadline(entry);
}

/**
 * The rule for a lane card's countdown: a top-level deadline, else the Deadline metadata row; a
 * bare `date` does not count.
 */
export function entryDeadline(entry: Entry): string {
    const top = isoDate(entry.fields.deadline);
    if (top !== '') return top;
    return metaDeadline(entry);
}

/** The first valid Deadline metadata row, or nothing. */
function metaDeadline(entry: Entry): string {
    const rows = Array.isArray(entry.fields.meta) ? entry.fields.meta : [];
    for (const row of rows) {
        if (!isMap(row) || str(row.label).trim().toLowerCase() !== 'deadline') continue;
        const date = isoDate(row.value);
        if (date !== '') return date;
    }
    return '';
}
