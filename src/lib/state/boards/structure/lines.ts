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
import { realProjects } from '../../sources/registries/venues.ts';

export type { Domain, Pillar, Project, Venue } from '../../../data/model/index.ts';

const LIVE = ['active', 'idea'];
const FLIGHT = ['active'];

export type TierRow = { key: string; label: string; color?: string };
export type TierCount = TierRow & { count: number };
export type ArchiveGroup = { type: string; count: number; projects: Project[] };
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
export function lineMembers(line: Pillar, projects: Project[], dead: string[] = []): Project[] {
    return realProjects(projects, dead).filter((project) => project.pillarIds.includes(line.id));
}

/** Active projects, the type counted as currently in flight. */
export function inFlight(projects: Project[]): Project[] {
    return projects.filter((project) => FLIGHT.includes(project.type ?? ''));
}

/** One non-empty chip per configured venue tier, with unrated as the fallback. */
export function tierStrip(members: Project[], venues: Venue[], tiers: TierRow[]): TierCount[] {
    if (tiers.length === 0) return [];
    const known = new Set(tiers.map((tier) => tier.key));
    const fallback = known.has('unrated') ? 'unrated' : tiers[tiers.length - 1].key;
    const venueTier = new Map(venues.map((venue) => [venue.id, venue.tier]));
    const counts = new Map<string, number>();
    for (const project of inFlight(members)) {
        const held = project.venueId === undefined ? undefined : venueTier.get(project.venueId);
        const key = held !== undefined && known.has(held) ? held : fallback;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return tiers
        .map((tier) => ({ ...tier, count: counts.get(tier.key) ?? 0 }))
        .filter((tier) => tier.count > 0);
}

/** Real projects whose pillar tags name no entry in the registry. */
export function orphans(lines: Pillar[], projects: Project[], dead: string[] = []): Project[] {
    const known = new Set(lines.map((line) => line.id));
    return realProjects(projects, dead).filter(
        (project) => !project.pillarIds.some((id) => known.has(id))
    );
}

/** Non-real projects grouped in the configured dead-status order. */
export function archival(projects: Project[], dead: string[]): ArchiveGroup[] {
    const unreal = projects.filter((project) => !realProjects([project], dead).includes(project));
    return dead
        .map((type) => {
            const grouped = unreal.filter((project) => project.type === type);
            return { type, count: grouped.length, projects: grouped };
        })
        .filter((group) => group.count > 0);
}

/** A card is dormant when it has no active or idea member. */
export function isDormant(members: Project[]): boolean {
    return !members.some((project) => LIVE.includes(project.type ?? ''));
}

/** Real projects that name one domain, preserving project order. */
export function domainMembers(domain: Domain, projects: Project[], dead: string[] = []): Project[] {
    return realProjects(projects, dead).filter((project) => project.domainIds.includes(domain.id));
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
    dead: string[] = []
): { domain: Domain; projects: Project[] }[] {
    return domains
        .map((domain) => ({ domain, projects: domainMembers(domain, projects, dead) }))
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

/** One row of `venue_tiers`: a map with a key, a label that is a string and a string colour. */
const tierRowShape = z
    .object({
        key: wordShape.refine((key) => key !== ''),
        label: optionalTextShape,
        color: optionalTextShape
    })
    .transform((row): TierRow => ({
        key: row.key,
        label: row.label ?? row.key,
        ...(row.color === undefined ? {} : { color: row.color })
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
