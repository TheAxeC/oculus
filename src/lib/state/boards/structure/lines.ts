// Layer 2, client state. Joins for the Pillars and Domains views, and the venue tier a project card
// draws: the registry lines in the order their collection file lists them, their sections by
// `pillar_kinds`, membership, portfolio status, the venue tiers the config names and their counts,
// and the archival groups, and the Pillars view's saved state with its folded sections; and the
// glyph, hue and label a project card's Venue tag draws a venue's tier with (`venueTierMark`). The
// views receive ready-to-draw lists. The Pillars and Domains joins are pure over what they are
// given; the tier join reads the installed glyph vocabulary (state/shared/words/text.ts
// `hasGlyph`), so a glyph name a hub mistypes is never drawn, and takes its hue through
// state/shared/words/tones.ts `wordsTone`, whose module reads the configuration's generation, a
// Svelte rune; both tie this module to the page's installed words and keep it out of a module Node
// runs unbuilt. A project is read under the
// words of its own hub when the caller gives them (`wordsOf`), a venue under the words of the
// venue's own hub, its rows and its hue alike, and a list over several hubs (the tiers, the
// Archival band's stages) is drawn from every hub's words.

import { z } from 'zod';
import { byKey } from '../../../data/helpers/guards.ts';
import { rootOf } from '../../../data/helpers/hub-names.ts';
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
    oneWordWith,
    recordWords,
    skippedTiers,
    wordsNumbered,
    type WordsOf
} from '../../../data/shapes/vocab-keys.ts';
import { realProjects } from '../../sources/registries/venues.ts';
import { instanceFolded } from '../../shared/page/folds.ts';
import { hasGlyph } from '../../shared/words/text.ts';
import { wordsTone } from '../../shared/words/tones.ts';

export type { Domain, Pillar, Project, Venue } from '../../../data/model/index.ts';

/**
 * One venue tier of `venue_tiers`: its key, label, colour and glyph name, and whether it is the
 * fallback, the row marked `assignable: false`, which a project with no venue or no rated venue
 * counts under.
 */
export type TierRow = {
    key: string;
    label: string;
    color?: string;
    glyph?: string;
    fallback?: boolean;
};

/**
 * A venue's tier as a project card draws it: the glyph of its row, the hue of the row's colour
 * where the palette maps it to one, and the row's label, the glyph's tip.
 */
export type TierMark = { glyph: string; tone?: string; label: string };
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

/**
 * The projects that name one pillar, dead ends included, preserving project order: the one list a
 * line's card counts, its page's row counts and its board holds. What says how active the line is
 * (its dormant look, its in-flight and tier metrics) reads the real ones among them.
 */
export function lineMembers(line: Pillar, projects: Project[]): Project[] {
    return projects.filter((project) => project.pillarIds.includes(line.id));
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

/**
 * The projects that name one domain, dead ends included, preserving project order: the one list a
 * domain's card counts, its page's row counts and its board holds. Its dormant look reads the real
 * ones among them.
 */
export function domainMembers(domain: Domain, projects: Project[]): Project[] {
    return projects.filter((project) => project.domainIds.includes(domain.id));
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

/** Each domain with its member projects (`domainMembers`), a domain that has none left out. */
export function domainsWithMembers(
    domains: Domain[],
    projects: Project[]
): { domain: Domain; projects: Project[] }[] {
    return domains
        .map((domain) => ({ domain, projects: domainMembers(domain, projects) }))
        .filter((item) => item.projects.length > 0);
}

/**
 * One section of the Pillars view: a row of `pillar_kinds` with the lines of its kind, or the Other
 * section, whose key is the empty text, of the lines whose kind no row names. `color` is the row's
 * colour as written, the empty text for a row without one and for Other. `archival` marks the
 * section of the kind that carries `archival: true` (`archivalKind`).
 */
export type KindSection = {
    key: string;
    label: string;
    color: string;
    archival: boolean;
    lines: Pillar[];
};

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

/**
 * The kind of `pillar_kinds` of the words given that carries `archival: true`, the kind of the
 * lines off the pillars: their cards are drawn muted, and its section holds the Archival card. None
 * when no row carries it, or when two do, which is a finding of the vocabulary.
 */
export function archivalKind(words: Record<string, unknown>): string | undefined {
    return oneWordWith(words, 'pillar_kinds', 'archival');
}

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
 * section and the Archival card in the archival section (`archivalKind`) whatever lines they hold.
 */
export function lineKinds(lines: readonly Pillar[], words: Record<string, unknown>): KindSection[] {
    const rows = readAs(rowsShape(kindRowShape), words.pillar_kinds) ?? [];
    const archival = archivalKind(words);
    const named = new Set<string>();
    const sections: KindSection[] = [];
    for (const row of rows) {
        if (named.has(row.key)) continue;
        named.add(row.key);
        const held = lines.filter((line) => line.kind === row.key);
        sections.push({ ...row, archival: row.key === archival, lines: held });
    }
    const other = lines.filter((line) => !named.has(line.kind ?? ''));
    sections.push({ key: '', label: '', color: '', archival: false, lines: other });
    return sections;
}

/**
 * One row of `venue_tiers`: a map with a key, a label, a colour and a glyph name that are strings
 * where it writes them, and `assignable`, which a row may leave out; a row with `assignable: false`
 * is the fallback tier.
 */
const tierRowShape = z
    .object({
        key: wordShape.refine((key) => key !== ''),
        label: optionalTextShape,
        color: optionalTextShape,
        glyph: optionalTextShape,
        assignable: z.unknown().optional()
    })
    .transform((row): TierRow => ({
        key: row.key,
        label: row.label ?? row.key,
        ...(row.color === undefined ? {} : { color: row.color }),
        ...(row.glyph === undefined ? {} : { glyph: row.glyph }),
        ...(row.assignable === false ? { fallback: true } : {})
    }));

const tierRowsShape = rowsShape(tierRowShape);

/**
 * The venue tiers `venue_tiers` of the merged config names, in its order: a row without a key is
 * dropped, a row without a label is labelled by its key, and a colour and a glyph name are kept
 * where each is a string.
 */
export function venueTiers(value: unknown): TierRow[] {
    return readAs(tierRowsShape, value) ?? [];
}

/**
 * The tier a project card draws `venue` with, read from `venue_tiers` of the words of the venue's
 * own hub (`rootOf`), since its `tier` is a word of that hub's list, whichever hub's project names
 * it. The row is the one the venue's `tier` names, and for a venue with no tier or a tier the list
 * lacks the fallback row; a list with no fallback row gives such a venue none, so it is never drawn
 * with another tier's icon. A row with no glyph, or with a glyph name the vocabulary lacks, gives
 * no mark, so a mistyped name in a hub's list never reaches a Glyph that would throw; the name is
 * checked against the installed glyph vocabulary. The tone is the row's colour as the `palette` of
 * the same words maps it, and none for a colour that palette does not map to a hue, which the card
 * draws in the tag's muted colour.
 */
export function venueTierMark(venue: Venue, wordsOf: WordsOf): TierMark | null {
    const words = wordsOf(rootOf(venue));
    const tiers = venueTiers(words.venue_tiers);
    const row =
        tiers.find((tier) => tier.key === venue.tier) ??
        tiers.find((tier) => tier.fallback === true);
    if (row?.glyph === undefined || !hasGlyph(row.glyph)) return null;
    const tone = wordsTone(row.color, words);
    return { glyph: row.glyph, ...(tone === undefined ? {} : { tone }), label: row.label };
}

/** How many projects the archival groups hold together. */
export function archivedCount(groups: ArchiveGroup[]): number {
    return groups.reduce((sum, group) => sum + group.count, 0);
}
