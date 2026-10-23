// Layer 2, client state. Pure joins for the Pillars and Domains views: the registry lines in the
// order their collection file lists them, membership, portfolio status, the venue tiers the config
// names and their counts, and the archival groups. The views receive ready-to-draw lists.

import { z } from 'zod';
import type { Domain, Pillar, Project, Snapshot, Venue } from '../../../data/model/index.ts';
import {
    optionalTextShape,
    readAs,
    rowsShape,
    searchRevealShape,
    wordShape
} from '../../../data/shapes/shapes.ts';
import { hasWord, wordsNumbered } from '../../../data/shapes/vocab-keys.ts';
import { realProjects } from '../../sources/registries/venues.ts';

export type { Domain, Pillar, Project, Venue } from '../../../data/model/index.ts';

/**
 * One venue tier of `venue_tiers`: its key, label and colour, and whether it is the fallback a
 * project with no venue or no rated venue counts under (the row marked `assignable: false`).
 */
export type TierRow = { key: string; label: string; color?: string; fallback?: boolean };
export type TierCount = TierRow & { count: number };
export type ArchiveGroup = { stage: string; count: number; projects: Project[] };
export type PillarsState = { reveal?: string };
export type DomainsState = { reveal?: string };

/** The palette destination a saved state names, absent unless it is a non-empty text. */
const revealShape = searchRevealShape.pick({ reveal: true });

/** The optional palette destination shared by the two registry-line views. */
function parseRevealState(raw: unknown): { reveal?: string } {
    const reveal = readAs(revealShape, raw)?.reveal;
    return reveal === undefined ? {} : { reveal };
}

/** Saved state of one Pillars instance. */
export function parsePillarsState(raw: unknown): PillarsState {
    return parseRevealState(raw);
}

/** Saved state of one Domains instance. */
export function parseDomainsState(raw: unknown): DomainsState {
    return parseRevealState(raw);
}

/** Real projects that name one pillar, preserving project order. */
export function lineMembers(
    line: Pillar,
    projects: Project[],
    config: Record<string, unknown>
): Project[] {
    return realProjects(projects, config).filter((project) => project.pillarIds.includes(line.id));
}

/** The projects whose stage carries `live` in `stages`, the work counted as in flight. */
export function inFlight(projects: Project[], config: Record<string, unknown>): Project[] {
    return projects.filter((project) => hasWord(config, 'stages', 'live', project.stage));
}

/**
 * One non-empty chip per configured venue tier, a project with no venue or no rated venue counted
 * under the fallback row, or the last row when none is the fallback.
 */
export function tierStrip(
    members: Project[],
    venues: Venue[],
    tiers: TierRow[],
    config: Record<string, unknown>
): TierCount[] {
    if (tiers.length === 0) return [];
    const known = new Set(tiers.map((tier) => tier.key));
    const fallback = (tiers.find((tier) => tier.fallback === true) ?? tiers[tiers.length - 1]).key;
    const venueTier = new Map(venues.map((venue) => [venue.id, venue.tier]));
    const counts = new Map<string, number>();
    for (const project of inFlight(members, config)) {
        const held = project.venueId === undefined ? undefined : venueTier.get(project.venueId);
        const key = held !== undefined && known.has(held) ? held : fallback;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return tiers
        .map((tier) => ({ ...tier, count: counts.get(tier.key) ?? 0 }))
        .filter((tier) => tier.count > 0);
}

/** Real projects whose pillar tags name no entry in the registry. */
export function orphans(
    lines: Pillar[],
    projects: Project[],
    config: Record<string, unknown>
): Project[] {
    const known = new Set(lines.map((line) => line.id));
    return realProjects(projects, config).filter(
        (project) => !project.pillarIds.some((id) => known.has(id))
    );
}

/**
 * Non-real projects grouped by stage, in the order of the numbers the words of `stages` carry as
 * `dead` (nogo, dropped, disproved, abandoned, paused in oculus's own vocab.yml).
 */
export function archival(projects: Project[], config: Record<string, unknown>): ArchiveGroup[] {
    const real = new Set(realProjects(projects, config));
    const unreal = projects.filter((project) => !real.has(project));
    return wordsNumbered(config, 'stages', 'dead')
        .map((stage) => {
            const grouped = unreal.filter((project) => project.stage === stage);
            return { stage, count: grouped.length, projects: grouped };
        })
        .filter((group) => group.count > 0);
}

/** A card is dormant when it has no member whose stage carries `on_map` in `stages`. */
export function isDormant(members: Project[], config: Record<string, unknown>): boolean {
    return !members.some((project) => hasWord(config, 'stages', 'on_map', project.stage));
}

/** Real projects that name one domain, preserving project order. */
export function domainMembers(
    domain: Domain,
    projects: Project[],
    config: Record<string, unknown>
): Project[] {
    return realProjects(projects, config).filter((project) =>
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
    config: Record<string, unknown>
): { domain: Domain; projects: Project[] }[] {
    return domains
        .map((domain) => ({ domain, projects: domainMembers(domain, projects, config) }))
        .filter((item) => item.projects.length > 0);
}

/** The pillars proper, the provisional lines and the off-pillar lines, each in the order given. */
export function lineKinds(lines: Pillar[]): {
    pillars: Pillar[];
    provisional: Pillar[];
    offpillar: Pillar[];
} {
    return {
        pillars: lines.filter((line) => !['provisional', 'offpillar'].includes(line.kind ?? '')),
        provisional: lines.filter((line) => line.kind === 'provisional'),
        offpillar: lines.filter((line) => line.kind === 'offpillar')
    };
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
