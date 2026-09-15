// Layer 2, client state, pure. The deck as data: the `deck:` map of config/present.yml read into the
// typed Deck, and the ordered list of slides the Present view draws.
//
// The list is assembled the way the deck is written. The `order:` places the deck's own slides and
// any project slide it names; every other project slide is placed before the closing slide, so a
// project that has just written a PRESENT.md is in the deck without this file or the config changing.
// A saved `selection:` then decides which of them are shown and a saved `slide_order:` decides where,
// both keyed by the same slide key: a project slide's own id, and `kind` or `kind:ref` for the
// deck's own. A key either list holds for a slide that is no longer there places nothing, because
// the two lists are written over one hub and read over whatever the hub holds now.
//
// Nothing here reads a store or a file: the caller hands in the config map and the projects, which
// is what makes every case of tests/state/present.test.ts a plain call. The one thing it reaches for
// is the tone catalog, because a colour the deck writes as a hex is painted as the palette hue that
// hex stands for, which is what keeps every pair on a slide inside the set contrast.test.ts measures.

import { byKey, fields, isMap, str, strings } from '../data/guards.ts';
import { toneOf, UNKNOWN_TONE } from './tones.ts';
import type {
    Deck,
    DeckCard,
    DeckChip,
    DeckEntry,
    DeckFraming,
    DeckIdea,
    DeckIdeas,
    DeckKind,
    DeckMeta,
    DeckSlide,
    DeckSummary,
    DeckSummaryRow,
    DeckTheme,
    PresentSlide,
    Project
} from '../data/model.ts';

/** The model types a Present component needs, re-exported so no view imports the data layer. */
export type {
    Deck,
    DeckChip,
    DeckFraming,
    DeckIdeas,
    DeckMeta,
    DeckSlide,
    DeckSummary,
    DeckTheme,
    PresentPanel,
    PresentSlide,
    Project
} from '../data/model.ts';

/** The kinds `order:` may name, so a line naming anything else places no slide. */
const KINDS: DeckKind[] = ['title', 'framing', 'project', 'summary', 'ideas', 'closing'];

/** Where a project sorts among the slides no `order:` line placed. */
const TYPE_RANK: Record<string, number> = { active: 0, manuscript: 1, idea: 2 };

/**
 * The tiers whose slides join the deck on their own. Work that is finished or somebody else's is on
 * the deck only when the `order:` places it or a saved selection holds it, so a public deck does not
 * grow an archived project the day its PRESENT.md is written.
 */
const OPEN_TIERS = ['active', 'manuscripts', 'ideas'];

/** The rank of a type the map does not name, which puts archived and coauthor work last. */
const LAST_RANK = 9;

/** The entities a `&` escape in a deck title stands for, for the plain words the overview draws. */
const ENTITIES: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' '
};

/**
 * Whether a slide was written as a slide. A PRESENT.md with no `present:` front matter still has a
 * slide in the deck, carrying its narrative and nothing else, and that is the one the view draws as
 * the body rather than as the four-layer project slide.
 */
export function hasSlideContent(slide: PresentSlide): boolean {
    return (
        slide.title !== undefined ||
        slide.sub !== undefined ||
        slide.hook !== undefined ||
        slide.tag !== undefined ||
        slide.eli5 !== undefined ||
        slide.equation !== undefined ||
        slide.specs.length > 0 ||
        slide.panels.length > 0 ||
        slide.method.length > 0 ||
        slide.results.length > 0
    );
}

/** What one Present pane holds of its own: the slide it is on, and whether its grid is open. */
export type PresentState = {
    /** The key of the slide the pane draws; empty means the deck's first. */
    slide: string;
    overview: boolean;
};

/** One pane's own state out of whatever its instance holds, with the defaults for what is missing. */
export function parsePresentState(value: unknown): PresentState {
    const held = fields(value);
    return { slide: str(held.slide) ?? '', overview: held.overview === true };
}

/** The key a slide is named by in `selection:` and `slide_order:`. */
export function slideKey(entry: DeckEntry): string {
    if (entry.slide === 'project') return entry.ref ?? '';
    return entry.ref === undefined ? entry.slide : `${entry.slide}:${entry.ref}`;
}

/** A title written as HTML, as the plain words an overview tile and a pane title draw. */
export function plainTitle(html: string): string {
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (whole, name: string) => {
            if (name.startsWith('#x') || name.startsWith('#X')) {
                return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
            }
            if (name.startsWith('#'))
                return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
            return ENTITIES[name.toLowerCase()] ?? whole;
        })
        .replace(/\s+/g, ' ')
        .trim();
}

/** The palette hue a colour the deck wrote stands for, and nothing when it wrote none. */
function hue(value: unknown): string | undefined {
    const written = str(value);
    return written === undefined || written === '' ? undefined : toneOf(written);
}

/** The `tag_tones:` map, a hue name per `tag.class`, dropping anything that is not a name. */
function tagTones(value: unknown): Record<string, string> {
    const held: Record<string, string> = {};
    for (const [key, item] of Object.entries(fields(value))) {
        const tone = str(item);
        if (tone !== undefined && tone !== '') held[key] = tone;
    }
    return held;
}

function chips(value: unknown): DeckChip[] {
    if (!Array.isArray(value)) return [];
    const held: DeckChip[] = [];
    for (const item of value) {
        if (!isMap(item)) continue;
        held.push({ label: str(item.label) ?? '', tone: hue(item.color) ?? UNKNOWN_TONE });
    }
    return held;
}

function meta(value: unknown): DeckMeta {
    const map = fields(value);
    const held: DeckMeta = { legend: chips(map.legend) };
    const words = (key: string, field: keyof DeckMeta): void => {
        const text = str(map[key]);
        if (text !== undefined) Object.assign(held, { [field]: text });
    };
    words('kicker', 'kicker');
    words('title_html', 'titleHtml');
    words('lede', 'lede');
    words('hint', 'hint');
    words('closing_kicker', 'closingKicker');
    words('closing_title_html', 'closingTitleHtml');
    words('closing_lede', 'closingLede');
    words('contact', 'contact');
    return held;
}

function themes(value: unknown): Record<string, DeckTheme> {
    const held: Record<string, DeckTheme> = {};
    for (const [key, item] of Object.entries(fields(value))) {
        if (!isMap(item)) continue;
        held[key] = { tone: hue(item.color) ?? UNKNOWN_TONE, label: str(item.label) ?? '' };
    }
    return held;
}

function cards(value: unknown): DeckCard[] {
    if (!Array.isArray(value)) return [];
    const held: DeckCard[] = [];
    for (const item of value) {
        if (!isMap(item)) continue;
        const card: DeckCard = {};
        const n = str(item.n);
        const title = str(item.title);
        const body = str(item.body);
        if (n !== undefined) card.n = n;
        if (title !== undefined) card.title = title;
        if (body !== undefined) card.body = body;
        held.push(card);
    }
    return held;
}

function framing(value: unknown): Record<string, DeckFraming> {
    const held: Record<string, DeckFraming> = {};
    for (const [key, item] of Object.entries(fields(value))) {
        const map = fields(item);
        const one: DeckFraming = { cards: cards(map.cards), legend: chips(map.legend) };
        const title = str(map.title);
        const lede = str(map.lede);
        const hint = str(map.hint);
        if (title !== undefined) one.title = title;
        if (lede !== undefined) one.lede = lede;
        if (hint !== undefined) one.hint = hint;
        held[key] = one;
    }
    return held;
}

function rows(value: unknown): DeckSummaryRow[] {
    if (!Array.isArray(value)) return [];
    const held: DeckSummaryRow[] = [];
    for (const item of value) {
        if (!isMap(item)) continue;
        const row: DeckSummaryRow = {};
        for (const key of ['field', 'project', 'mechanism', 'headline'] as const) {
            const text = str(item[key]);
            if (text !== undefined) row[key] = text;
        }
        const tone = hue(item.color);
        if (tone !== undefined) row.tone = tone;
        held.push(row);
    }
    return held;
}

function summaries(value: unknown): Record<string, DeckSummary> {
    const held: Record<string, DeckSummary> = {};
    for (const [key, item] of Object.entries(fields(value))) {
        const map = fields(item);
        const one: DeckSummary = { rows: rows(map.rows) };
        const title = str(map.title);
        const foot = str(map.foot);
        if (title !== undefined) one.title = title;
        if (foot !== undefined) one.foot = foot;
        held[key] = one;
    }
    return held;
}

function ideas(value: unknown): DeckIdeas | null {
    if (!isMap(value)) return null;
    const items: DeckIdea[] = [];
    for (const item of Array.isArray(value.items) ? value.items : []) {
        if (!isMap(item)) continue;
        const one: DeckIdea = {};
        for (const key of ['title', 'desc', 'maturity'] as const) {
            const text = str(item[key]);
            if (text !== undefined) one[key] = text;
        }
        const tone = hue(item.color);
        if (tone !== undefined) one.tone = tone;
        items.push(one);
    }
    const held: DeckIdeas = { items };
    const title = str(value.title);
    const lede = str(value.lede);
    const hint = str(value.hint);
    if (title !== undefined) held.title = title;
    if (lede !== undefined) held.lede = lede;
    if (hint !== undefined) held.hint = hint;
    return held;
}

/** The `order:` lines, dropping one that names a kind the deck has no slide of. */
function order(value: unknown): DeckEntry[] {
    if (!Array.isArray(value)) return [];
    const held: DeckEntry[] = [];
    for (const item of value) {
        if (!isMap(item)) continue;
        const kind = str(item.slide);
        if (kind === undefined || !KINDS.includes(kind as DeckKind)) continue;
        const ref = str(item.ref);
        held.push(
            ref === undefined ? { slide: kind as DeckKind } : { slide: kind as DeckKind, ref }
        );
    }
    return held;
}

/** A saved list of keys, or null when the file holds none and the order alone decides. */
function saved(value: unknown): string[] | null {
    return Array.isArray(value) ? strings(value) : null;
}

/** The deck of the merged config, empty in every part when the config holds no `deck:` map. */
export function deckFrom(config: Record<string, unknown>): Deck {
    const map = fields(config.deck);
    return {
        meta: meta(map.meta),
        themes: themes(map.themes),
        order: order(map.order),
        framing: framing(map.framing),
        summaries: summaries(map.summaries),
        ideas: ideas(map.ideas),
        selection: saved(map.selection),
        slideOrder: saved(map.slide_order),
        equationsDir: str(map.equations_dir) ?? '',
        tagTones: tagTones(map.tag_tones)
    };
}

/** The framing slide a ref names, or nothing when the deck declares none under that key. */
export function framingOf(deck: Deck, ref: string | undefined): DeckFraming | undefined {
    return byKey(deck.framing, ref ?? '');
}

/** The summary slide a ref names, or nothing when the deck declares none under that key. */
export function summaryOf(deck: Deck, ref: string | undefined): DeckSummary | undefined {
    return byKey(deck.summaries, ref ?? '');
}

/** The hue a slide's status chip wears, from the deck's `tag_tones` by the tag's class. */
export function tagToneOf(deck: Deck, slide: PresentSlide): string | undefined {
    return byKey(deck.tagTones, slide.tag?.class ?? '');
}

/** The deck's theme for a project, by the first of its domains the deck names. */
export function themeOf(deck: Deck, project: Project): DeckTheme | undefined {
    for (const domain of project.domainIds) {
        const theme = byKey(deck.themes, domain);
        if (theme !== undefined) return theme;
    }
    return undefined;
}

/** One project's slides paired with the project, in the order the deck places them. */
export type SlideSource = {
    slide: PresentSlide;
    project: Project;
};

/**
 * Every project slide there is, by its id, sorted the way the slides no `order:` line placed are
 * appended: active work first, then manuscripts, then ideas, then everything else, each by title.
 */
export function slideSources(projects: Project[]): SlideSource[] {
    const ranked = [...projects].sort((left, right) => {
        const gap =
            (TYPE_RANK[left.type ?? ''] ?? LAST_RANK) - (TYPE_RANK[right.type ?? ''] ?? LAST_RANK);
        return gap !== 0 ? gap : left.title.localeCompare(right.title);
    });
    return ranked.flatMap((project) =>
        (project.present ?? []).map((slide) => ({ slide, project }))
    );
}

/** The words a row of the deck is named by in the overview and the pane title. */
function titleOf(deck: Deck, entry: DeckEntry, source: SlideSource | undefined): string {
    switch (entry.slide) {
        case 'title':
            return plainTitle(deck.meta.titleHtml ?? '');
        case 'closing':
            return plainTitle(deck.meta.closingTitleHtml ?? '');
        case 'framing':
            return plainTitle(byKey(deck.framing, entry.ref ?? '')?.title ?? '');
        case 'summary':
            return plainTitle(byKey(deck.summaries, entry.ref ?? '')?.title ?? '');
        case 'ideas':
            return plainTitle(deck.ideas?.title ?? '');
        default:
            if (source === undefined) return '';
            return plainTitle(source.slide.title ?? source.project.title);
    }
}

/** The hue a project's slide is drawn in, from the deck's themes by the project's domain. */
function toneFor(deck: Deck, source: SlideSource | undefined): string | undefined {
    if (source === undefined) return undefined;
    return themeOf(deck, source.project)?.tone;
}

/**
 * The deck as the reader moves through it: the `order:` lines that resolve, every project slide the
 * order did not name placed before the closing slide, the saved selection applied, and the saved
 * order applied over what is left. A deck whose order places something but names no closing slide
 * still ends with one; a deck that places nothing holds no slides at all.
 */
export function deckSlides(deck: Deck, projects: Project[]): DeckSlide[] {
    const sources = slideSources(projects);
    const byId = new Map(sources.map((source) => [source.slide.id, source]));
    const named = new Set(
        deck.order.filter((entry) => entry.slide === 'project').map((entry) => entry.ref ?? '')
    );

    // A deck that places nothing places nothing at all, closing slide included: the view's empty
    // state is what a config holding no deck reads as, rather than one blank slide.
    const placed = [...deck.order];
    if (placed.length > 0 && !placed.some((entry) => entry.slide === 'closing')) {
        placed.push({ slide: 'closing' });
    }
    // With nothing saved, an unnamed slide joins the deck only from the three open tiers; a saved
    // selection is the reader's own list and decides on its own, archived work included.
    const extras: DeckEntry[] = sources
        .filter((source) => !named.has(source.slide.id))
        .filter(
            (source) =>
                deck.selection !== null || OPEN_TIERS.includes(source.project.tier as string)
        )
        .map((source) => ({ slide: 'project' as const, ref: source.slide.id }));
    const close = placed.findIndex((entry) => entry.slide === 'closing');
    const cut = close === -1 ? placed.length : close;
    const entries = [...placed.slice(0, cut), ...extras, ...placed.slice(cut)];

    const rows: DeckSlide[] = [];
    const seen = new Set<string>();
    for (const entry of entries) {
        const source = entry.slide === 'project' ? byId.get(entry.ref ?? '') : undefined;
        if (entry.slide === 'project' && source === undefined) continue;
        const key = slideKey(entry);
        if (key === '' || seen.has(key)) continue;
        seen.add(key);
        const tone = toneFor(deck, source);
        const row: DeckSlide = { key, kind: entry.slide, title: titleOf(deck, entry, source) };
        if (entry.ref !== undefined) row.ref = entry.ref;
        if (tone !== undefined) row.tone = tone;
        rows.push(row);
    }

    const chosen =
        deck.selection === null ? rows : rows.filter((row) => deck.selection?.includes(row.key));
    if (deck.slideOrder === null) return chosen;
    const positions = deck.slideOrder;
    return [...chosen].sort((left, right) => {
        const at = (key: string): number => {
            const found = positions.indexOf(key);
            return found === -1 ? positions.length : found;
        };
        return at(left.key) - at(right.key);
    });
}
