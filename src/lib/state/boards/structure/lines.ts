// Layer 2, client state. Pure joins for the Pillars and Domains views: the registry lines in the
// order their collection file lists them, their sections by `pillar_kinds`, membership, portfolio
// status, the venue tiers the config names and their counts, and the archival groups, and the
// Pillars view's saved state with its folded sections. The views receive ready-to-draw lists. A
// project is read under the words of its own hub when the caller gives them (`wordsOf`), and a list
// over several hubs (the tiers, the Archival band's stages) is drawn from every hub's words.

import { z } from 'zod';
import { byKey } from '../../../data/helpers/guards.ts';
import type { Domain, Pillar, Project, Snapshot, Venue } from '../../../data/model/index.ts';
import { categoriesBy, isArchival } from '../../../data/shapes/boards/categories.ts';
import {
    optionalTextShape,
    readAs,
    rowsShape,
    searchRevealShape,
    wordShape
} from '../../../data/shapes/shapes.ts';
import {
    hasWord,
    recordWords,
    skippedTiers,
    wordsNumbered,
    type WordsOf
} from '../../../data/shapes/vocab-keys.ts';
import { realProjects } from '../../sources/registries/venues.ts';
import { instanceFolded } from '../../shared/page/folds.ts';

export type { Domain, Pillar, Project, Venue } from '../../../data/model/index.ts';

/**
 * One venue tier of `venue_tiers`: its key, label and colour, and whether it is the fallback a
 * project with no venue or no rated venue counts under (the row marked `assignable: false`).
 */
export type TierRow = { key: string; label: string; color?: string; fallback?: boolean };
export type TierCount = TierRow & { count: number };
export type ArchiveGroup = { stage: string; count: number; projects: Project[] };
export type PillarsState = { reveal?: string; folded: string[] };
export type DomainsState = { reveal?: string };

/** The palette destination a saved state names, absent unless it is a non-empty text. */
const revealShape = searchRevealShape.pick({ reveal: true });

/** The optional palette destination shared by the two registry-line views. */
function parseRevealState(raw: unknown): { reveal?: string } {
    const reveal = readAs(revealShape, raw)?.reveal;
    return reveal === undefined ? {} : { reveal };
}

/** Saved state of one Pillars instance: its palette destination and its folded sections. */
export function parsePillarsState(raw: unknown): PillarsState {
    return { ...parseRevealState(raw), folded: instanceFolded(raw) };
}

/** Saved state of one Domains instance. */
export function parseDomainsState(raw: unknown): DomainsState {
    return parseRevealState(raw);
}

/** Real projects that name one pillar, preserving project order. */
export function lineMembers(
    line: Pillar,
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return realProjects(projects, config, wordsOf).filter((project) =>
        project.pillarIds.includes(line.id)
    );
}

/** The projects whose stage carries `live` in `stages`, the work counted as in flight. */
export function inFlight(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return projects.filter((project) =>
        hasWord(recordWords(config, wordsOf, project), 'stages', 'live', project.stage)
    );
}

/**
 * One non-empty chip per configured venue tier, a project with no venue or no rated venue counted
 * under the fallback row, or the last row when none is the fallback.
 */
export function tierStrip(
    members: Project[],
    venues: Venue[],
    tiers: TierRow[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): TierCount[] {
    if (tiers.length === 0) return [];
    const known = new Set(tiers.map((tier) => tier.key));
    const fallback = (tiers.find((tier) => tier.fallback === true) ?? tiers[tiers.length - 1]).key;
    const venueTier = new Map(venues.map((venue) => [venue.id, venue.tier]));
    const counts = new Map<string, number>();
    for (const project of inFlight(members, config, wordsOf)) {
        const held = project.venueId === undefined ? undefined : venueTier.get(project.venueId);
        const key = held !== undefined && known.has(held) ? held : fallback;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return tiers
        .map((tier) => ({ ...tier, count: counts.get(tier.key) ?? 0 }))
        .filter((tier) => tier.count > 0);
}

/**
 * Real projects whose pillar tags name no entry in the registry, leaving out the projects of the
 * tiers `research_audit.skip_tiers` of their own hub's words names, which need no pillar.
 */
export function orphans(
    lines: Pillar[],
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    const known = new Set(lines.map((line) => line.id));
    return realProjects(projects, config, wordsOf).filter(
        (project) =>
            !skippedTiers(recordWords(config, wordsOf, project)).includes(project.tier ?? '') &&
            !project.pillarIds.some((id) => known.has(id))
    );
}

/**
 * The projects of the Archival band: those whose category, the first row of `categories:` of their
 * own hub's words holding them, carries `archival: true`, grouped by stage in the order of the
 * numbers the words of `stages` of every hub's words carry as `dead` (failed, then stopped, in
 * oculus's own vocab.yml).
 */
export function archival(
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): ArchiveGroup[] {
    const filed = categoriesBy(config, wordsOf);
    const unreal = projects.filter((project) => {
        const { words, categories } = filed(project);
        return isArchival(project, categories, words);
    });
    return wordsNumbered(wordsOf?.() ?? config, 'stages', 'dead')
        .map((stage) => {
            const grouped = unreal.filter((project) => project.stage === stage);
            return { stage, count: grouped.length, projects: grouped };
        })
        .filter((group) => group.count > 0);
}

/**
 * A card is dormant when it has no member whose stage carries `on_map` in `stages` of its own hub's
 * words.
 */
export function isDormant(
    members: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): boolean {
    return !members.some((project) =>
        hasWord(recordWords(config, wordsOf, project), 'stages', 'on_map', project.stage)
    );
}

/** Real projects that name one domain, preserving project order. */
export function domainMembers(
    domain: Domain,
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): Project[] {
    return realProjects(projects, config, wordsOf).filter((project) =>
        project.domainIds.includes(domain.id)
    );
}

/**
 * The registry's lines in the order their collection file lists its entries, then every line the
 * file does not list, in registry order, so a line added outside the file is still drawn.
 */
export function inEntryOrder<T extends { id: string }>(
    lines: T[],
    entries: readonly { id: string }[]
): T[] {
    const byId = new Map(lines.map((line) => [line.id, line]));
    const ordered = entries.map((entry) => byId.get(entry.id)).filter((line) => line !== undefined);
    const seen = new Set(ordered.map((line) => line.id));
    return [...ordered, ...lines.filter((line) => !seen.has(line.id))];
}

/**
 * The portfolio's domains or pillars in the order their collection file lists its entries, then
 * every one the file does not list; none before the portfolio arrives.
 */
export function registryLines(
    snapshot: Snapshot | null,
    kind: 'domains',
    entries: readonly { id: string }[]
): Domain[];
export function registryLines(
    snapshot: Snapshot | null,
    kind: 'pillars',
    entries: readonly { id: string }[]
): Pillar[];
export function registryLines(
    snapshot: Snapshot | null,
    kind: 'domains' | 'pillars',
    entries: readonly { id: string }[]
): (Domain | Pillar)[] {
    const held: Record<string, Domain | Pillar> = snapshot?.entities[kind] ?? {};
    return inEntryOrder(Object.values(held), entries);
}

/** Each domain with its real member projects, a domain that has none left out. */
export function domainsWithMembers(
    domains: Domain[],
    projects: Project[],
    config: Record<string, unknown>,
    wordsOf?: WordsOf
): { domain: Domain; projects: Project[] }[] {
    return domains
        .map((domain) => ({ domain, projects: domainMembers(domain, projects, config, wordsOf) }))
        .filter((item) => item.projects.length > 0);
}

/**
 * One section of the Pillars view: a row of `pillar_kinds` with the lines of its kind, or the Other
 * section, whose key is the empty text, of the lines whose kind no row names. `color` is the row's
 * colour as written, the empty text for a row without one and for Other.
 */
export type KindSection = { key: string; label: string; color: string; lines: Pillar[] };

/**
 * A row of `pillar_kinds` as the sections read it: a text key of at least one character, so none is
 * the Other section's, its label, the key when it names none, and its colour. The config check
 * words a row of another form (data/shapes/catalog-files/vocab.ts).
 */
const kindRowShape = z
    .looseObject({
        key: z.string().min(1),
        label: z.unknown().optional(),
        color: z.unknown().optional()
    })
    .transform((row) => ({
        key: row.key,
        label: typeof row.label === 'string' && row.label !== '' ? row.label : row.key,
        color: typeof row.color === 'string' ? row.color : ''
    }));

/** The kind of the off-pillar lines: a card muted, and the section that holds the Archival card. */
export const OFFPILLAR = 'offpillar';

/** The record of a registry's map under `id`, null for none, a name off the prototype included. */
export function registryRecord<T>(records: Record<string, T> | undefined, id: string): T | null {
    return byKey(records ?? {}, id) ?? null;
}

/**
 * The sections of the Pillars view over the lines given: one per row of `pillar_kinds` of the words
 * given (the union of every hub's, state/shared/words/tones.ts `vocabOf`), in the list's order,
 * each key once with the first row naming it, holding the lines whose `kind` is its key; then the
 * Other section of the lines whose kind no row names, a line with no kind among them. A value of
 * the list that is no row reads as no section. Each section holds its lines in the order given, and
 * a section that holds none is kept, since the view draws the Orphans card in the first row's
 * section and the Archival card in the section of `offpillar` whatever lines they hold.
 */
export function lineKinds(lines: readonly Pillar[], words: Record<string, unknown>): KindSection[] {
    const rows = readAs(rowsShape(kindRowShape), words.pillar_kinds) ?? [];
    const named = new Set<string>();
    const sections: KindSection[] = [];
    for (const row of rows) {
        if (named.has(row.key)) continue;
        named.add(row.key);
        sections.push({ ...row, lines: lines.filter((line) => line.kind === row.key) });
    }
    const other = lines.filter((line) => !named.has(line.kind ?? ''));
    sections.push({ key: '', label: '', color: '', lines: other });
    return sections;
}

/**
 * One row of `venue_tiers`: a map with a key, a label that is a string and a string colour; a row
 * with `assignable: false` is the fallback tier.
 */
const tierRowShape = z
    .object({
        key: wordShape.refine((key) => key !== ''),
        label: optionalTextShape,
        color: optionalTextShape,
        assignable: z.unknown()
    })
    .transform((row): TierRow => ({
        key: row.key,
        label: row.label ?? row.key,
        ...(row.color === undefined ? {} : { color: row.color }),
        ...(row.assignable === false ? { fallback: true } : {})
    }));

const tierRowsShape = rowsShape(tierRowShape);

/**
 * The venue tiers `venue_tiers` of the merged config names, in its order: a row without a key is
 * dropped, a row without a label is labelled by its key, and a colour is kept where it is a string.
 */
export function venueTiers(value: unknown): TierRow[] {
    return readAs(tierRowsShape, value) ?? [];
}

/** How many projects the archival groups hold together. */
export function archivedCount(groups: ArchiveGroup[]): number {
    return groups.reduce((sum, group) => sum + group.count, 0);
}
