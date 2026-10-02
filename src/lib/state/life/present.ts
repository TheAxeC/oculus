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

import { decodeHTML } from 'entities';
import { z } from 'zod';
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
import { byKey } from '../../data/helpers/guards.ts';
import { mapOfShape, optionalTextShape, readAs, rowsShape } from '../../data/shapes/shapes.ts';
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

/** The fields a Present pane keeps, each read as absent when it is of the wrong type. */
const presentStateShape = z.object({
    slide: optionalTextShape,
    overview: z.boolean().catch(false)
});

/**
 * One pane's own state out of whatever its instance holds, with the defaults for what is missing.
 */
export function parsePresentState(value: unknown): PresentState {
    const held = readAs(presentStateShape, value);
    return { slide: held?.slide ?? '', overview: held?.overview ?? false };
}

export { PRESENT_DOC, slideKey };

/** The size in px a slide is laid out at; the pane scales this frame as a whole. */
export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 720;

/**
 * The uniform scale that fits the frame inside a box of the given size, or 0 for a box with no
 * size, a negative one or one that is not a number (a hidden tab, the first paint).
 */
export function fit(width: number, height: number): number {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 0;
    return Math.min(width / FRAME_WIDTH, height / FRAME_HEIGHT);
}

/**
 * The least scale a slide's equation is drawn at to fit its card. A formula that needs more is
 * drawn at it and scrolls in its card, since text any smaller is no longer read from a slide.
 */
export const LEAST_EQUATION_SCALE = 0.5;

/**
 * The scale, in em of the formula's own size, that draws an equation `needed` px wide in `room` px
 * of its card: 1 when it fits or the card has no width yet, else the ratio rounded down to a
 * hundredth, so the rounding never leaves it a pixel too wide, and never below
 * LEAST_EQUATION_SCALE.
 */
export function equationScale(needed: number, room: number): number {
    if (room <= 0 || needed <= room) return 1;
    return Math.max(LEAST_EQUATION_SCALE, Math.floor((room / needed) * 100) / 100);
}

/**
 * A title written as HTML, as the plain words an overview tile and a pane title draw. The escapes
 * are decoded by `entities`, the parser the mail snippet and the manual use; a no-break space it
 * gives is folded into a plain one with the rest of the white space.
 */
export function plainTitle(html: string): string {
    return decodeHTML(html.replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
}

/** The palette hue a colour the deck wrote stands for, and nothing when it wrote none. */
function hue(value: unknown): string | undefined {
    const written = readAs(optionalTextShape, value);
    return written ? toneOf(written) : undefined;
}

/** A legend chip: the label it is written with, and the hue of its colour. */
const chipShape = z
    .object({ label: optionalTextShape, color: z.unknown().optional() })
    .transform((row): DeckChip => ({
        label: row.label ?? '',
        tone: hue(row.color) ?? UNKNOWN_TONE
    }));

/** The chips of a legend, from the rows that are maps; none for a legend that is no list. */
const chipsShape = rowsShape(chipShape).catch(() => []);

/** The words of the deck's `meta:` map and the `DeckMeta` field each one is kept under. */
const META_WORDS = [
    ['kicker', 'kicker'],
    ['title_html', 'titleHtml'],
    ['lede', 'lede'],
    ['hint', 'hint'],
    ['closing_kicker', 'closingKicker'],
    ['closing_title_html', 'closingTitleHtml'],
    ['closing_lede', 'closingLede'],
    ['contact', 'contact']
] as const;

const metaShape = z
    .object({
        legend: chipsShape,
        kicker: optionalTextShape,
        title_html: optionalTextShape,
        lede: optionalTextShape,
        hint: optionalTextShape,
        closing_kicker: optionalTextShape,
        closing_title_html: optionalTextShape,
        closing_lede: optionalTextShape,
        contact: optionalTextShape
    })
    .transform((map): DeckMeta => {
        const held: DeckMeta = { legend: map.legend };
        for (const [from, to] of META_WORDS) {
            const text = map[from];
            if (text !== undefined) Object.assign(held, { [to]: text });
        }
        return held;
    })
    .catch(() => ({ legend: [] }));

/** A theme: the hue of its colour and its label. */
const themeShape = z
    .object({ color: z.unknown().optional(), label: optionalTextShape })
    .transform((item): DeckTheme => ({
        tone: hue(item.color) ?? UNKNOWN_TONE,
        label: item.label ?? ''
    }));

/** A framing card: the fields it is written with, a field it lacks left out. */
const cardShape = z
    .object({ n: optionalTextShape, title: optionalTextShape, body: optionalTextShape })
    .transform((item): DeckCard => {
        const card: DeckCard = {};
        if (item.n !== undefined) card.n = item.n;
        if (item.title !== undefined) card.title = item.title;
        if (item.body !== undefined) card.body = item.body;
        return card;
    });

/** A framing slide, the empty one for a value that is no map. */
const framingShape = z
    .object({
        title: optionalTextShape,
        lede: optionalTextShape,
        hint: optionalTextShape,
        cards: rowsShape(cardShape).catch(() => []),
        legend: chipsShape
    })
    .transform((map): DeckFraming => {
        const one: DeckFraming = { cards: map.cards, legend: map.legend };
        if (map.title !== undefined) one.title = map.title;
        if (map.lede !== undefined) one.lede = map.lede;
        if (map.hint !== undefined) one.hint = map.hint;
        return one;
    })
    .catch(() => ({ cards: [], legend: [] }));

/** A summary row: the four texts it is written with and the hue of its colour. */
const summaryRowShape = z
    .object({
        field: optionalTextShape,
        project: optionalTextShape,
        mechanism: optionalTextShape,
        headline: optionalTextShape,
        color: z.unknown().optional()
    })
    .transform((item): DeckSummaryRow => {
        const row: DeckSummaryRow = {};
        for (const key of ['field', 'project', 'mechanism', 'headline'] as const) {
            const text = item[key];
            if (text !== undefined) row[key] = text;
        }
        const tone = hue(item.color);
        if (tone !== undefined) row.tone = tone;
        return row;
    });

/** A summary slide, the empty one for a value that is no map. */
const summaryShape = z
    .object({
        title: optionalTextShape,
        foot: optionalTextShape,
        rows: rowsShape(summaryRowShape).catch(() => [])
    })
    .transform((map): DeckSummary => {
        const one: DeckSummary = { rows: map.rows };
        if (map.title !== undefined) one.title = map.title;
        if (map.foot !== undefined) one.foot = map.foot;
        return one;
    })
    .catch(() => ({ rows: [] }));

/** An idea: the three texts it is written with and the hue of its colour. */
const ideaShape = z
    .object({
        title: optionalTextShape,
        desc: optionalTextShape,
        maturity: optionalTextShape,
        color: z.unknown().optional()
    })
    .transform((item): DeckIdea => {
        const one: DeckIdea = {};
        for (const key of ['title', 'desc', 'maturity'] as const) {
            const text = item[key];
            if (text !== undefined) one[key] = text;
        }
        const tone = hue(item.color);
        if (tone !== undefined) one.tone = tone;
        return one;
    });

/** The ideas slide, none for a value that is no map. */
const ideasShape = z
    .object({
        title: optionalTextShape,
        lede: optionalTextShape,
        hint: optionalTextShape,
        items: rowsShape(ideaShape).catch(() => [])
    })
    .transform((map): DeckIdeas | null => {
        const held: DeckIdeas = { items: map.items };
        if (map.title !== undefined) held.title = map.title;
        if (map.lede !== undefined) held.lede = map.lede;
        if (map.hint !== undefined) held.hint = map.hint;
        return held;
    })
    .catch(() => null);

/** The `deck:` map of the merged config. */
const deckShape = z
    .object({
        meta: metaShape,
        themes: mapOfShape(themeShape).catch(() => ({})),
        order: z.unknown().optional().transform(deckOrder),
        framing: mapOfShape(framingShape).catch(() => ({})),
        summaries: mapOfShape(summaryShape).catch(() => ({})),
        ideas: ideasShape,
        selection: z.unknown().optional().transform(savedKeys),
        slide_order: z.unknown().optional().transform(savedKeys),
        tag_tones: mapOfShape(z.string().min(1)).catch(() => ({}))
    })
    .transform((map): Deck => ({
        meta: map.meta,
        themes: map.themes,
        order: map.order,
        framing: map.framing,
        summaries: map.summaries,
        ideas: map.ideas,
        selection: map.selection,
        slideOrder: map.slide_order,
        tagTones: map.tag_tones
    }));

/** The deck of the merged config, empty in every part when the config holds no `deck:` map. */
export function deckFrom(config: Record<string, unknown>): Deck {
    return (
        readAs(deckShape, config.deck) ?? {
            meta: { legend: [] },
            themes: {},
            order: [],
            framing: {},
            summaries: {},
            ideas: null,
            selection: null,
            slideOrder: null,
            tagTones: {}
        }
    );
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
