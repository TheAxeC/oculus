// Layer 2, client state. Collection cards and the two attention rows of projects for Focus: the
// manifests behind their docs and the projects no lane shows, work in flight or ideas of the
// Projects and Personal boards. All values are derived from the supplied snapshot and config; the
// view resolves configured colours through toneOf. A record is read under the words of its own hub
// when `wordsOf` (data/shapes/vocab-keys.ts) gives them: a project's stage, and the `fund_stages`
// row of the grant's hub its status falls in; the band's columns are those of every hub's words.

import { z } from 'zod';
import type { Entry, Id, Project, Snapshot } from '../../../data/model/index.ts';
import { focusSetting, text as str } from '../../../data/helpers/guards.ts';
import { joinedEntries, rootOf } from '../../../data/helpers/hub-names.ts';
import { hasWord, type WordsOf } from '../../../data/shapes/vocab-keys.ts';
import {
    anyValueShape,
    fieldItemsShape,
    readAs,
    rowsShape,
    wordShape
} from '../../../data/shapes/shapes.ts';
import { closesDeadline, deadlineMet, focusWords, labelOf } from '../focus.ts';

/** How many project links an attention row of projects draws before its "(+N more)". */
const ROW_LINKS = 4;

/**
 * The manifest-lag attention line, with the four project links it draws and the remainder count.
 */
export type ManifestBehind = {
    count: number;
    projects: { id: Id; label: string; days: number }[];
    more: number;
};

/**
 * The attention row of the projects no lane shows, with the four project links it draws and the
 * remainder count, the shape of the manifest-lag line.
 */
export type Unplaced = {
    count: number;
    projects: { id: Id; label: string }[];
    more: number;
};

/**
 * The attention row of the projects `unplaced` of state/boards/focus.ts gives, in title order, or
 * null when there are none.
 */
export function unplacedRow(missing: Project[]): Unplaced | null {
    if (missing.length === 0) return null;
    const sorted = [...missing].sort((a, b) => a.title.localeCompare(b.title));
    return {
        count: sorted.length,
        projects: sorted
            .slice(0, ROW_LINKS)
            .map((project) => ({ id: project.id, label: labelOf(project) })),
        more: Math.max(0, sorted.length - ROW_LINKS)
    };
}

/** One card of the band above the lanes. */
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
    /** The name of the entry's hub, which the card's chip shows for a hub but the primary. */
    root?: string;
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

/**
 * The projects whose stage carries `live` in `stages` of their own hub's words whose manifest lags
 * their documents past the grace of `stale_lag_days` under `focus:`.
 */
export function manifestsBehind(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): ManifestBehind | null {
    const grace = focusSetting(config, 'stale_lag_days');
    if (grace === null) return null;
    const stale = projects
        .filter(
            (project) =>
                hasWord(wordsOf?.(rootOf(project)) ?? config, 'stages', 'live', project.stage) &&
                project.staleDays !== undefined &&
                project.staleDays >= grace
        )
        .sort((a, b) => (b.staleDays ?? 0) - (a.staleDays ?? 0) || a.title.localeCompare(b.title));
    if (stale.length === 0) return null;
    return {
        count: stale.length,
        projects: stale.slice(0, ROW_LINKS).map((project) => ({
            id: project.id,
            label: labelOf(project),
            days: project.staleDays ?? 0
        })),
        more: Math.max(0, stale.length - ROW_LINKS)
    };
}

/** One row of `fund_stages`: its words and the statuses it gathers, lowercased. */
const stageShape = z
    .object({ label: wordShape, color: wordShape, statuses: fieldItemsShape })
    .transform((row) => ({
        label: row.label,
        color: row.color,
        statuses: row.statuses.map((one) => one.toLowerCase())
    }));

const stagesShape = rowsShape(stageShape);

/** The stages of `fund_stages`, and the statuses each one gathers. */
function fundStages(
    config: Record<string, unknown>
): { label: string; color: string; statuses: string[] }[] {
    return readAs(stagesShape, config.fund_stages) ?? [];
}

/** The `focus_lane_tones` of the band: a colour for each column, empty where none is named. */
const tonesShape = z.object({ funding: wordShape, jobs: wordShape, teaching: wordShape });

/** A band card sorts by its date, and by its title when it has none. */
function bandOrder(a: BandItem, b: BandItem): number {
    const one = a.deadline ?? '';
    const two = b.deadline ?? '';
    if (one !== '' && two !== '') return one.localeCompare(two);
    if (one !== '') return -1;
    if (two !== '') return 1;
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
}

/**
 * One entry's band card, read under `words`, the words of the entry's own hub: it counts down to
 * its deadline unless its status carries `deadline_met` or `closes_deadline` there, the deadline
 * then being met or closed, and a card with no deadline sorts as an undated one.
 */
function bandItem(entry: Entry, key: string, words: Record<string, unknown>): BandItem {
    const note = str(entry.fields.note) === '' ? str(entry.fields.sub) : str(entry.fields.note);
    const status = str(entry.fields.status);
    const card: BandItem = { id: entry.id, title: entry.title, entry: key };
    if (!deadlineMet(words, status) && !closesDeadline(words, status)) {
        card.deadline = entryDeadline(entry);
    }
    if (note !== '') card.note = note;
    if (entry.root !== undefined) card.root = entry.root;
    return card;
}

/**
 * The band above the lanes: the durable work that is not a project. Grants stack by the stage their
 * status names, a stage of `fund_stages` of every hub's words holding the grants whose status the
 * row of the same label of their own hub's words names; positions are the applications whose
 * status is in `applications_open` under `focus:`, and teaching the education entries whose status
 * is in `education_open` there.
 */
export function collectionLanes(
    snapshot: Snapshot,
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Band {
    const collections = snapshot.entities.collections;
    const grants = joinedEntries(collections, 'funding');
    const funding: BandStage[] = [];
    const read = new Map<string, ReturnType<typeof fundStages>>();
    const stagesOf = (hub: string): ReturnType<typeof fundStages> => {
        const held = read.get(hub) ?? fundStages(wordsOf?.(hub) ?? config);
        read.set(hub, held);
        return held;
    };
    const words = wordsOf?.() ?? config;
    /** The words of an entry's own hub, the config where no `wordsOf` is given. */
    const wordsAt = (entry: Entry): Record<string, unknown> => wordsOf?.(rootOf(entry)) ?? config;
    for (const stage of fundStages(words)) {
        const items = grants
            .filter((entry) => {
                const own = stagesOf(rootOf(entry)).find((one) => one.label === stage.label);
                return (own?.statuses ?? []).includes(
                    str(entry.fields.status).trim().toLowerCase()
                );
            })
            .map((entry) => bandItem(entry, 'funding', wordsAt(entry)))
            .sort(bandOrder);
        if (items.length > 0) funding.push({ label: stage.label, color: stage.color, items });
    }
    const open = focusWords(config, 'applications_open');
    const applications = joinedEntries(collections, 'applications')
        .filter((entry) => open.includes(str(entry.fields.status).trim().toLowerCase()))
        .map((entry) => bandItem(entry, 'applications', wordsAt(entry)))
        .sort(bandOrder);
    const running = focusWords(config, 'education_open');
    const education = joinedEntries(collections, 'education')
        .filter((entry) => running.includes(str(entry.fields.status).trim().toLowerCase()))
        .map((entry) => bandItem(entry, 'education', wordsAt(entry)))
        .sort(bandOrder);
    const tones = readAs(tonesShape, words.focus_lane_tones) ?? {
        funding: '',
        jobs: '',
        teaching: ''
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

/** A metadata row labelled Deadline, as the ISO day its value holds, and none for another row. */
const deadlineRowShape = z
    .object({
        label: wordShape.refine((label) => label.trim().toLowerCase() === 'deadline'),
        value: anyValueShape
    })
    .transform((row) => isoDate(row.value));

const deadlineRowsShape = rowsShape(deadlineRowShape);

/** The first valid Deadline metadata row, or nothing. */
function metaDeadline(entry: Entry): string {
    return (readAs(deadlineRowsShape, entry.fields.meta) ?? []).find((date) => date !== '') ?? '';
}

/** How many items the band's stages hold together, which is what a lane's head counts. */
export function stageItemCount(stages: BandStage[]): number {
    return stages.reduce((sum, stage) => sum + stage.items.length, 0);
}

/** Whether the band holds any card at all: a grant at some stage, an application or a course. */
export function bandHasCards(band: Band): boolean {
    return band.funding.length + band.applications.length + band.education.length > 0;
}
