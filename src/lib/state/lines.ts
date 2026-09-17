// Layer 2, client state. Pure joins for the Pillars and Domains views: membership, portfolio
// status, venue-tier counts and the archival groups. The views receive ready-to-draw lists.

import type { Domain, Pillar, Project, Venue } from '../data/model.ts';
import { parseOpenForms, type OpenForms } from './open-forms.ts';
import { realProjects } from './venues.ts';

export type { Domain, Pillar, Project, Venue } from '../data/model.ts';

const LIVE = ['active', 'manuscript', 'idea'];
const FLIGHT = ['active', 'manuscript'];

export type TierRow = { key: string; label: string; color?: string };
export type TierCount = TierRow & { count: number };
export type ArchiveGroup = { type: string; count: number; projects: Project[] };
export type PillarsState = OpenForms & { reveal?: string };
export type DomainsState = OpenForms & { reveal?: string };

/** The open forms and the optional palette destination shared by the two registry-line views. */
function parseRevealState(raw: unknown): OpenForms & { reveal?: string } {
    const open = parseOpenForms(raw);
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return open;
    const reveal = (raw as Record<string, unknown>).reveal;
    return typeof reveal === 'string' && reveal !== '' ? { ...open, reveal } : open;
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

/** Active and manuscript projects, the two types counted as currently in flight. */
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

/** A card is dormant when it has no active, manuscript or idea member. */
export function isDormant(members: Project[]): boolean {
    return !members.some((project) => LIVE.includes(project.type ?? ''));
}

/** Real projects that name one domain, preserving project order. */
export function domainMembers(domain: Domain, projects: Project[], dead: string[] = []): Project[] {
    return realProjects(projects, dead).filter((project) => project.domainIds.includes(domain.id));
}
