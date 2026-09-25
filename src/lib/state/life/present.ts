// Layer 2, client state, pure. The deck as data: the `deck:` map of config/present.yml read into
// the typed Deck, and the ordered list of slides the Present view draws.
//
// Which slides the deck places, under which keys and in which order, is data/helpers/deck.ts: the
// write that saves a selection checks the keys it was sent against the same rule, and a second copy
// of it would let the view and the write disagree about what a key is. What is here is the typed
// Deck the config map reads into, and the words and the hue each placed entry is drawn with.
//
// Nothing here reads a store or a file: the caller hands in the config map and the projects, which
// is what makes every case of tests/state/life/present.test.ts a plain call. The one thing it
// reaches for is the tone catalog, because a colour the deck writes as a hex is painted as the
// palette hue that hex stands for, which is what keeps every pair on a slide inside the set
// contrast.test.ts measures.

import {
    PRESENT_DOC,
    catalogKeys,
    deckChoice,
    deckEntries,
    deckOrder,
    deckSources,
    defaultKeys,
    savedKeys,
    slideKey
} from '../../data/helpers/deck.ts';
import { byKey, fields, isMap, str } from '../../data/helpers/guards.ts';
import { toneOf, UNKNOWN_TONE } from '../shared/words/tones.ts';
import type {
    Deck,
    DeckCard,
    DeckChip,
    DeckEntry,
    DeckFraming,
    DeckIdea,
    DeckIdeas,
    DeckMeta,
    DeckSlide,
    DeckSummary,
    DeckSummaryRow,
    DeckTheme,
    PresentSlide,
    Project
} from '../../data/model/index.ts';

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
} from '../../data/model/index.ts';

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

/**
 * One pane's own state out of whatever its instance holds, with the defaults for what is missing.
 */
export function parsePresentState(value: unknown): PresentState {
    const held = fields(value);
    return { slide: str(held.slide) ?? '', overview: held.overview === true };
}

export { PRESENT_DOC, slideKey };

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

/** The deck of the merged config, empty in every part when the config holds no `deck:` map. */
export function deckFrom(config: Record<string, unknown>): Deck {
    const map = fields(config.deck);
    return {
        meta: meta(map.meta),
        themes: themes(map.themes),
        order: deckOrder(map.order),
        framing: framing(map.framing),
        summaries: summaries(map.summaries),
        ideas: ideas(map.ideas),
        selection: savedKeys(map.selection),
        slideOrder: savedKeys(map.slide_order),
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
 * Every project slide there is, paired with its project, in the order data/helpers/deck.ts appends
 * the ones no `order:` line placed: active work first, then manuscripts, then ideas, then
 * everything else, each by title.
 */
export function slideSources(projects: Project[]): SlideSource[] {
    const held = new Map<string, SlideSource>();
    for (const project of projects) {
        for (const slide of project.present ?? []) held.set(slide.id, { slide, project });
    }
    return deckSources(projects).flatMap((source) => {
        const found = held.get(source.id);
        return found === undefined ? [] : [found];
    });
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
 * The deck as the reader moves through it: the entries data/helpers/deck.ts places, narrowed to the
 * saved selection and put in the saved order, each drawn with the words and the hue it wears.
 */
export function deckSlides(deck: Deck, projects: Project[]): DeckSlide[] {
    return rowsOf(
        deck,
        projects,
        deckChoice(placement(deck, projects), deck.selection, deck.slideOrder)
    );
}

/**
 * Every slide the deck could hold, in the order the Slides view lists them: every project slide
 * there is beside the deck's own, put in the saved order. It is the same catalog the deck write
 * checks against. An archived project's slide is in it, unticked until a selection names it.
 */
export function deckCatalog(deck: Deck, projects: Project[]): DeckSlide[] {
    return rowsOf(
        deck,
        projects,
        deckChoice(deckEntries(deck.order, deckSources(projects), true), null, deck.slideOrder)
    );
}

/** The catalog rows a deck with no saved selection shows, which is what the ticks start from. */
export function deckDefaultKeys(deck: Deck, projects: Project[]): string[] {
    return defaultKeys(deck.order, deckSources(projects));
}

/** The keys of that catalog, for a caller that wants the vocabulary and not the words. */
export function deckCatalogKeys(deck: Deck, projects: Project[]): string[] {
    return catalogKeys(deck.order, deckSources(projects), deck.slideOrder);
}

/** The entries the deck places before any saved selection narrows them. */
function placement(deck: Deck, projects: Project[]): DeckEntry[] {
    return deckEntries(deck.order, deckSources(projects), deck.selection !== null);
}

/** One row per entry: its key, its kind, the words it is named by and the hue it is drawn in. */
function rowsOf(deck: Deck, projects: Project[], entries: DeckEntry[]): DeckSlide[] {
    const byId = new Map(slideSources(projects).map((source) => [source.slide.id, source]));
    return entries.map((entry) => {
        const source = entry.slide === 'project' ? byId.get(entry.ref ?? '') : undefined;
        const tone = toneFor(deck, source);
        const row: DeckSlide = {
            key: slideKey(entry),
            kind: entry.slide,
            title: titleOf(deck, entry, source)
        };
        if (entry.ref !== undefined) row.ref = entry.ref;
        if (tone !== undefined) row.tone = tone;
        return row;
    });
}
