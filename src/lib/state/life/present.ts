// Layer 2, client state, pure. What one Present pane holds of its own, and the reads over a deck
// the server answered.
//
// A deck is read by the server (data/sources/deck/read.ts) and arrives whole: the slides in order
// with their words, the groups with their members, the facts of each project a slide comes from.
// What is here is the pane's own state (the slide it is on, whether its grid is open, the decks it
// has shown, the controls of its filter and its Project facts toggle), the deck a tab's layout
// state names, the moves over a deck's slides, and the one hue a slide's status tag wears. A
// presentation adds the names its two windows share (the audience address, and the window, channel
// and lock name), the size of the audience window, the messages they send each other, and the
// presenter screen's timer and clock text.
//
// A pane's filter is the Projects board's filter over the member projects of the deck's groups of
// project decks (`memberItems`): the same function works it out (state/boards/board/filter-menu.ts
// `boardFilter`) from the controls the pane saves under the board's own keys, and its controls are
// the pane's alone: the file is never written for them. The deck route is asked for the deck with
// the keys of the projects the bar shows (`shownKeys`), or for the whole deck while it shows every
// member.
//
// Nothing here reads a store or a file.

import { z } from 'zod';
import { byKey, isMap, item } from '../../data/helpers/guards.ts';
import { bareId, rootOf } from '../../data/helpers/hub-names.ts';
import { MAX_DRAFT_BYTES, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '../../data/file-ops.ts';
import { plainText } from '../../data/prose/literature.ts';
import { optionalTextShape, readAs, rowsShape, unchangedAs } from '../../data/shapes/shapes.ts';
import {
    emptyBoardState,
    parseBoardState,
    type BoardItem,
    type BoardState
} from '../boards/board/index.ts';
import { domainTone } from '../shared/words/tones.ts';
import { t } from '../shared/words/text.ts';
import { slideHeight } from '../../data/model/index.ts';
import type {
    Deck,
    DeckGroup,
    DeckSlide,
    PresentSlide,
    ProjectFact
} from '../../data/model/index.ts';

/** The model's values a Present component needs, re-exported so no view imports the data layer. */
export { DECK_GAP, SLIDE_PAGE_PT, SLIDE_SHAPE } from '../../data/model/index.ts';

/** The model types a Present component needs, re-exported so no view imports the data layer. */
export type {
    Deck,
    DeckCard,
    DeckIdeaCard,
    DeckSlide,
    DeckSummaryRow,
    FactField,
    PresentPanel,
    PresentSlide,
    ProjectFact
} from '../../data/model/index.ts';

/**
 * Whether a project slide was written with the rich keys. One written with none carries its body
 * alone, and that is what the view draws instead of the four-layer slide.
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

/** A deck by the served root it is in and its folder under that root. */
export type DeckRef = { root: string; path: string };

/** How many decks a pane remembers having shown. */
const RECENT_LIMIT = 10;

/**
 * The controls of a pane's filter, under the board's own keys of its saved state: the search, the
 * stale, deadline and waiting toggles, Mine only and the picks by facet, the slices under `slice`.
 */
export type PresentBar = Pick<
    BoardState,
    'search' | 'stale' | 'dated' | 'waiting' | 'mine' | 'filters'
>;

/**
 * What one Present pane holds of its own: its place in the deck it shows, its history, its Project
 * facts toggle and the controls of its filter.
 */
export type PresentState = PresentBar & {
    /** The key of the slide the pane draws; empty means the deck's first. */
    slide: string;
    overview: boolean;
    /** The decks the pane has shown, newest first, without the one it shows now. */
    recent: DeckRef[];
    /**
     * Whether the strip of a project's facts at the foot of its slides shows its words, in the pane
     * and in its presenter screen, audience window and PDF; on unless the pane turned it off.
     */
    facts: boolean;
};

/** One remembered deck, kept when it names both halves. */
const refShape = z.object({ root: z.string().min(1), path: z.string() });

/** The fields a Present pane keeps, each read as absent when it is of the wrong type. */
const presentStateShape = z.object({
    slide: optionalTextShape,
    overview: z.boolean().catch(false),
    recent: rowsShape(refShape).catch(() => []),
    facts: z.boolean().catch(true)
});

/**
 * The controls of a pane's filter out of a board's state, the card fields (`mode`, `more`,
 * `labels`, `folded`, `columns`) left out, since the Present view draws no cards.
 */
export function barFields(state: BoardState): PresentBar {
    const { search, stale, dated, waiting, mine, filters } = state;
    return { search, stale, dated, waiting, mine, filters };
}

/**
 * One pane's own state out of what its instance holds, with defaults for what is missing. The
 * controls of its filter are read by the board's parser, so a facet the board does not know is
 * dropped and Mine only is on until the reader turns it off; which slices and compute values the
 * deck's projects hold is read against by the filter (`boardFilter`), which holds those projects.
 */
export function parsePresentState(value: unknown): PresentState {
    const held = readAs(presentStateShape, value);
    return {
        ...barFields(parseBoardState(value)),
        slide: held?.slide ?? '',
        overview: held?.overview ?? false,
        recent: (held?.recent ?? []).slice(0, RECENT_LIMIT),
        facts: held?.facts ?? true
    };
}

/**
 * The groups of a deck that hold project decks: a member or a candidate of each is a project's
 * deck. They are the groups the deck route narrows (data/sources/deck/groups.ts `ofProjects`).
 */
function projectDeckGroups(deck: Deck): DeckGroup[] {
    return deck.groups.filter((group) =>
        [...group.members, ...group.candidates].some((one) => one.projectId !== undefined)
    );
}

/** Whether a deck holds a group of project decks, which is when its pane draws the filter. */
export function filterable(deck: Deck | null): boolean {
    return deck !== null && projectDeckGroups(deck).length > 0;
}

/**
 * The projects a pane's filter runs over: the board items that are member projects of the deck's
 * groups of project decks, every member of the deck's answer counted, kept or not. A member is
 * matched by its project's key (`DeckMember.projectId`) to a board item of the deck's own hub
 * (`deck.hub`), so a project of another hub with the same key is never one, and a member that
 * matches no board item (a deck that is no project's, a project the snapshot lacks) is none. Each
 * project is one item however many groups hold its deck, in the order of `items`.
 */
export function memberItems(deck: Deck, items: readonly BoardItem[]): BoardItem[] {
    const keys = new Set(
        projectDeckGroups(deck).flatMap((group) =>
            group.members.flatMap((one) => one.projectId ?? [])
        )
    );
    return items.filter((one) => rootOf(one.project) === deck.hub && keys.has(bareId(one.project)));
}

/**
 * The kept list a pane's deck is read under, from the projects its filter runs over (`members`) and
 * those the bar shows (`shown`): null while every member is shown, which asks for the whole deck,
 * else the keys of the projects shown in their own hub's files, each once and sorted, so one state
 * asks under one query key; `[]` when none is shown.
 */
export function shownKeys(
    members: readonly BoardItem[],
    shown: readonly BoardItem[]
): string[] | null {
    if (shown.length === members.length) return null;
    return [...new Set(shown.map((one) => bareId(one.project)))].sort();
}

/**
 * The `path` a tab's layout state holds for the deck that is a root's own folder. A tab's identity
 * needs a filled path, and that deck's path is empty, so the state holds this one in its place.
 */
const ROOT_TOP = '.';

/** The `root` and `path` fields of a state that names a deck. */
const deckFieldsShape = z.object({ root: optionalTextShape, path: optionalTextShape });

/**
 * The deck a tab's layout state names: its `root` and `path`, which are the tab's identity as a
 * LaTeX tab's are. A state with no root names the portfolio deck, which is the empty reference;
 * the Present store resolves it against the configuration.
 */
export function deckRefOf(state: unknown): DeckRef {
    const held = readAs(deckFieldsShape, state);
    const root = held?.root ?? '';
    if (root === '') return { root: '', path: '' };
    const path = held?.path ?? '';
    return { root, path: path === ROOT_TOP ? '' : path };
}

/** Whether two references name one deck. */
export function sameDeck(left: DeckRef, right: DeckRef): boolean {
    return left.root === right.root && left.path === right.path;
}

/**
 * The reference a tab is named by for a deck: the empty one for the portfolio deck (`home`, null
 * while the configuration is unread), so every way of opening it finds the one portfolio tab.
 */
export function tabDeck(ref: DeckRef, home: DeckRef | null): DeckRef {
    return home !== null && sameDeck(ref, home) ? { root: '', path: '' } : ref;
}

/** The remembered decks after the pane left `shown` for `next`: `shown` first, `next` removed. */
function withRecent(recent: DeckRef[], shown: DeckRef, next: DeckRef): DeckRef[] {
    const rest = recent.filter((one) => !sameDeck(one, shown) && !sameDeck(one, next));
    return [shown, ...rest].slice(0, RECENT_LIMIT);
}

/** The text an editor holds unsaved for one file, as the deck route reads the deck over it. */
export type DeckDraft = { root: string; path: string; text: string };

/** The source tab's fields a draft is matched by: its file's root and path, and no `head`. */
const sourceFieldsShape = z.object({
    root: z.string().min(1),
    path: z.string().min(1),
    head: z.unknown().optional()
});

/** The most drafts one deck request carries. */
const MAX_DRAFTS = 64;

/**
 * The unsaved drafts of the source tabs of one page: each tab that holds a file the disk does not
 * have, once per file. A tab over a version at HEAD or in the index, a draft cut at the read limit
 * and a draft larger than the route takes are left out, so one such file never refuses the rest.
 */
export function pageDrafts(
    tabs: readonly { id: string; view: string; state: unknown }[],
    draftOf: (id: string) => {
        file: string;
        text: string;
        saved: string;
        loaded: boolean;
        truncated: boolean;
    }
): DeckDraft[] {
    const found = new Map<string, DeckDraft>();
    for (const tab of tabs) {
        if (tab.view !== 'source') continue;
        const at = readAs(sourceFieldsShape, tab.state);
        if (at === null || at.head !== undefined) continue;
        const draft = draftOf(tab.id);
        const key = `${at.root}/${at.path}`;
        if (!draft.loaded || draft.truncated || draft.file !== key || draft.text === draft.saved) {
            continue;
        }
        if (new TextEncoder().encode(draft.text).length > MAX_DRAFT_BYTES || found.has(key))
            continue;
        found.set(key, { root: at.root, path: at.path, text: draft.text });
    }
    return [...found.values()].slice(0, MAX_DRAFTS);
}

/**
 * The features the browser's audience window is opened with: a window of its own in the slide's
 * shape, half as wide as the available width of the screen the page is on (`availWidth`), and of
 * the browser's own size for a width that is no number above zero. A slide has no size, so the
 * window takes one from the screen.
 */
export function audienceFeatures(availWidth: number): string {
    if (!Number.isFinite(availWidth) || availWidth <= 0) return 'popup';
    const width = Math.round(availWidth / 2);
    return `popup,width=${width},height=${Math.round(slideHeight(width))}`;
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

/** The hue a slide's status chip wears, from the deck's `tag_tones` by the tag's class. */
export function tagToneOf(deck: Deck, slide: PresentSlide): string | undefined {
    return byKey(deck.tagTones, slide.tag?.class ?? '');
}

/**
 * The facts of the project a slide comes from, the strip at its foot draws: null for a slide of no
 * project's deck, and for a project with no field that holds a value, which has no strip.
 */
export function slideFacts(deck: Deck, slide: DeckSlide): ProjectFact[] | null {
    const facts = slide.project === undefined ? undefined : byKey(deck.projects, slide.project);
    return facts === undefined || facts.length === 0 ? null : facts;
}

/** Where a key sits in a deck's slides, and the first slide when the deck does not hold it. */
export function indexOf(slides: DeckSlide[], key: string): number {
    const found = slides.findIndex((slide) => slide.key === key);
    return found === -1 ? 0 : found;
}

/** The slide a key names, the first slide when the deck does not hold it, null for none. */
export function slideAt(slides: DeckSlide[], key: string): DeckSlide | null {
    return item(slides, indexOf(slides, key)) ?? null;
}

/** The key `by` slides on, stopping at both ends; the key given back for an empty deck. */
export function stepKey(slides: DeckSlide[], key: string, by: number): string {
    const next = Math.min(Math.max(indexOf(slides, key) + by, 0), slides.length - 1);
    return item(slides, next)?.key ?? key;
}

/** Where a move goes in a deck: some slides on (negative for back), or to either end. */
export type Move = { by: number } | { to: 'first' | 'last' };

/** The key a move from `key` comes to, the key itself for an empty deck. */
export function movedKey(slides: DeckSlide[], key: string, move: Move): string {
    if ('by' in move) return stepKey(slides, key, move.by);
    return (move.to === 'first' ? slides.at(0) : slides.at(-1))?.key ?? key;
}

/**
 * The hue a slide carries on the overview tile and on its own left edge: its project's domain, and
 * nothing for a slide that belongs to no project.
 */
export function slideTone(row: DeckSlide): string | undefined {
    if (row.kind === 'project')
        return row.domain === undefined ? undefined : domainTone(row.domain);
    if (row.kind === 'idea') {
        return row.card.domain === undefined ? undefined : domainTone(row.card.domain);
    }
    return undefined;
}

/**
 * A deck's title in plain words, the markup a title may hold taken out and its entities read as
 * text, or the deck's name when nothing is left: what a member, a candidate or a deck is named by
 * outside its own slides, which draw the title with its markup.
 */
export function deckWords(title: string, name: string): string {
    const plain = plainText(title);
    return plain === '' ? name : plain;
}

/**
 * The words a deck's tab, its menu entry and the audience window carry: its title in plain words,
 * else its name.
 */
export function deckLabel(deck: Deck): string {
    return deckWords(deck.title, deck.name);
}

/** The `label` a tab's layout state holds, which names the tab; empty for none. */
export function labelOf(state: unknown): string {
    const label = isMap(state) ? state.label : undefined;
    return typeof label === 'string' ? label : '';
}

/** A tab's layout state with its label set, every other field kept. */
export function withLabel(state: unknown, label: string): unknown {
    return { ...(isMap(state) ? state : {}), label };
}

/**
 * A tab's layout state naming a deck: `base` (the label) with the deck's `root` and `path`, which
 * make the deck the tab's identity. The portfolio deck is the one with no root and no path.
 */
export function deckState(base: unknown, ref: DeckRef): Record<string, unknown> {
    const rest: Record<string, unknown> = { ...(isMap(base) ? base : {}) };
    delete rest.root;
    delete rest.path;
    return ref.root === '' ? rest : { ...rest, root: ref.root, path: ref.path || ROOT_TOP };
}

/**
 * A pane's own state after it leaves the deck it showed (`shown`, null when none is resolved) for
 * `next`: the first slide, the grid closed, every control of its filter as a board starts
 * (`emptyBoardState`), since its picks are values of the members of the deck it left, and that deck
 * remembered. The Project facts toggle is a setting of the pane and stays as it was.
 */
export function leftDeck(value: unknown, shown: DeckRef | null, next: DeckRef): PresentState {
    const held = parsePresentState(value);
    return {
        ...held,
        ...barFields(emptyBoardState()),
        slide: '',
        overview: false,
        recent: shown === null ? held.recent : withRecent(held.recent, shown, next)
    };
}

/** One row of the deck menu: what it is called, and the deck it opens. */
export type DeckChoice = { id: string; label: string; ref: DeckRef };

/** The folder name a deck reference ends in, which names a deck the menu has no title for. */
function folderName(ref: DeckRef): string {
    return (
        ref.path
            .split('/')
            .filter((part) => part !== '')
            .at(-1) ?? ref.root
    );
}

/** What the catalog's `t` is to the helpers below. */
type Say = (key: string, ...args: (string | number)[]) => string;

/** The decks the menu lists: the one on screen, portfolio, project and recent ones. */
export function deckChoices(
    on: { ref: DeckRef; deck: Deck } | null,
    home: DeckRef | null,
    projects: { ref: DeckRef; id: string; title: string }[],
    recent: DeckRef[],
    t: Say
): DeckChoice[] {
    const found: DeckChoice[] = [];
    const add = (choice: DeckChoice): void => {
        if (!found.some((one) => sameDeck(one.ref, choice.ref))) found.push(choice);
    };
    if (on !== null) add({ id: 'shown', label: deckLabel(on.deck), ref: on.ref });
    if (home !== null) add({ id: 'portfolio', label: t('present.deck_portfolio'), ref: home });
    for (const one of projects) {
        add({ id: `project:${one.id}`, label: t('present.deck_project', one.title), ref: one.ref });
    }
    for (const [index, one] of recent.entries()) {
        add({ id: `recent:${index}`, label: folderName(one), ref: one });
    }
    return found;
}

/**
 * What a pane says when its deck draws nothing, and whether that is a failure: no deck named, the
 * answer yet to come, a request that failed, or a folder that holds no slides.
 */
export function nothingToShow(
    ref: DeckRef | null,
    answer: { deck: Deck | null; error: string; loading: boolean } | null,
    t: Say
): { message: string; error: boolean } {
    if (ref === null) return { message: t('present.empty_unnamed'), error: false };
    if (answer === null || answer.loading) return { message: t('present.loading'), error: false };
    const deck = answer.deck;
    if (deck === null) return { message: t('present.failed', answer.error), error: true };
    if (deck.state === 'unnamed') return { message: t('present.empty_unnamed'), error: false };
    const folder = deck.path === '' ? deck.name : deck.path;
    if (deck.state === 'missing')
        return { message: t('present.empty_missing', folder), error: true };
    if (deck.state === 'no_file') {
        return { message: t('present.empty_no_file', folder), error: false };
    }
    if (deck.state === 'unreadable') {
        return { message: t('present.empty_unreadable', folder), error: true };
    }
    return { message: t('present.empty', folder), error: false };
}

// What the Present view offers to do with a slide, and the facts the acts need from a slide and its
// file: which acts a slide offers, where its file opens it, the words an act says, and what a
// dropped file must be to be an image of the slide. A slide is the deck's own when a file entry of
// `order:` placed it: only that slide can be copied, deleted or given an image, since the file is
// the deck's to change. A slide of a member deck belongs to the other deck, and a summary or a grid
// is an entry of `present.yml` that Delete takes out of `order:`. The server decides the same thing
// from the same facts and refuses the rest; the menu offers only what it would take.

/** The acts a slide can offer, in the order its menu lists them. */
export const SLIDE_ACTS = ['edit', 'new', 'duplicate', 'delete'] as const;

export type SlideAct = (typeof SLIDE_ACTS)[number];

/** The extensions an image dropped on a slide may have, which the server takes. */
const IMAGE_ENDINGS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

/**
 * The kind of `order:` entry that placed a slide, or undefined for a slide with no source. The
 * slide names the entry by its place in the file's list (`source.entry`), which is the entry's
 * `entry`.
 */
function placedBy(deck: Deck, row: DeckSlide): Deck['order'][number]['kind'] | undefined {
    const source = row.source;
    return source === undefined
        ? undefined
        : deck.order.find((one) => one.entry === source.entry)?.kind;
}

/** Whether a file entry of the deck's `order:` placed the slide, so its file is the deck's own. */
function ownSlide(deck: Deck, row: DeckSlide | null): boolean {
    return row !== null && placedBy(deck, row) === 'file';
}

/** Whether the deck's `present.yml` can be edited: the file is there and was read. */
function editable(deck: Deck | null): boolean {
    return deck !== null && (deck.state === 'ok' || deck.state === 'empty');
}

/** The acts the slide on screen offers, in the order the menu lists them. */
export function slideActs(deck: Deck | null, row: DeckSlide | null): SlideAct[] {
    if (deck === null || !editable(deck)) return [];
    const acts: SlideAct[] = [];
    if (row?.source !== undefined) acts.push('edit');
    acts.push('new');
    if (ownSlide(deck, row)) acts.push('duplicate');
    if (
        row !== null &&
        (ownSlide(deck, row) || ['summary', 'grid'].includes(placedBy(deck, row) ?? ''))
    ) {
        acts.push('delete');
    }
    return acts;
}

/** The name of the file a slide is in, for the question Delete asks. */
function fileName(row: DeckSlide): string {
    return row.source?.path.split('/').at(-1) ?? '';
}

/** What Delete asks before it writes: the slide's title and the file it is in. */
export function deleteQuestion(row: DeckSlide): { message: string; detail: string } {
    const title = row.title === '' ? row.key : row.title;
    const entry = row.kind === 'summary' || row.kind === 'grid';
    return {
        message: t('present.delete_message', title),
        detail: entry
            ? t('present.delete_entry', fileName(row))
            : t('present.delete_detail', fileName(row))
    };
}

/** Why a drop on a slide writes nothing, or the empty string for a drop that is one image. */
export function dropRefusal(
    deck: Deck,
    row: DeckSlide | null,
    files: readonly { name: string; size: number }[]
): string {
    if (row === null || !ownSlide(deck, row)) return t('present.drop_not_own');
    if (files.length !== 1) return t('present.drop_one');
    const file = files[0];
    const ending = file.name.split('.').at(-1)?.toLowerCase() ?? '';
    if (!file.name.includes('.') || !IMAGE_ENDINGS.includes(ending)) {
        return t('present.drop_not_image', file.name);
    }
    if (file.size > MAX_UPLOAD_BYTES)
        return t('present.drop_large', file.name, String(MAX_UPLOAD_MB));
    return '';
}

/**
 * The part of an answer the pane depends on, the project each slide names and each project's facts
 * among it; the slides are the server's own and are kept.
 */
export const deckShape = unchangedAs<Deck>(
    z.object({
        root: z.string(),
        hub: z.string(),
        path: z.string(),
        name: z.string(),
        title: z.string(),
        state: z.enum(['ok', 'empty', 'no_file', 'unreadable', 'missing', 'unnamed']),
        slides: z.array(
            z.object({
                key: z.string(),
                kind: z.string(),
                title: z.string(),
                project: z.string().optional()
            })
        ),
        groups: z.array(z.object({ name: z.string() })),
        tagTones: z.record(z.string(), z.string()),
        projects: z.record(
            z.string(),
            z.array(z.object({ field: z.string(), words: z.array(z.string()) }))
        ),
        findings: z.array(z.unknown())
    })
);

/** The deck's `present.yml` as a write names it: the deck's folder and the file in it. */
export function deckFile(ref: DeckRef): string {
    return ref.path === '' ? 'present.yml' : `${ref.path}/present.yml`;
}

/** A deck's `root` and `path` written as a query is, so no two decks give the same text. */
function deckQuery(ref: DeckRef): string {
    return new URLSearchParams({ root: ref.root, path: ref.path }).toString();
}

/** The path of the print route, which draws every slide of one deck for the PDF. */
const PRINT_ROUTE = '/present/print';

/** The address of the print route for a deck, relative to the server it is asked of. */
export function printAddress(ref: DeckRef): string {
    return `${PRINT_ROUTE}?${deckQuery(ref)}`;
}

/** The path of the audience route, which draws the slide on show and nothing else. */
const AUDIENCE_ROUTE = '/present/show';

/** The address of the audience route for a deck, relative to the server it is asked of. */
export function audienceAddress(ref: DeckRef): string {
    return `${AUDIENCE_ROUTE}?${deckQuery(ref)}`;
}

/**
 * What names one deck's presentation: the audience window, the channel its page and the presenter
 * screen talk over, and the lock the presenter screen holds while it presents.
 */
export function presentName(ref: DeckRef): string {
    return `oculus-present-${deckQuery(ref)}`;
}

/**
 * What names one deck's export to PDF: the Web Lock the exporting pane holds from the press until
 * its print page has the filter's kept list and the Project facts toggle, so a second press of
 * Export on the deck, from any pane, waits for none and says the export is in progress.
 */
export function exportName(ref: DeckRef): string {
    return `oculus-present-export-${deckQuery(ref)}`;
}

/**
 * What the windows of a presentation and an export say to each other over the deck's channel. The
 * presenter screen says which slide is on (`slide`), that its deck was read again (`changed`),
 * that it ended (`end`, after which the audience window closes itself where it can) and that its
 * page is going away (`left`, after which the audience window says the screen has ended and offers
 * to close, as it does when the lock tells it). The audience window says that it opened, which
 * slide its reader moved to (`move`) and that it closed. Each key is the key a slide of the deck
 * carries.
 *
 * The audience page, when it opens, and the print page, before it reads the deck, ask which
 * projects the filter keeps and whether the strip of a project's facts shows its words
 * (`keep-asked`, `from` naming which of the two asks). The answer is a `keep`: the kept list or
 * null for no filter, and the pane's Project facts toggle (`facts`). The presenting pane answers
 * the audience page with `at` 0, and says it again with `at` 0 whenever its kept list or its
 * toggle changes; the exporting pane answers the print page with both as they were at the press
 * and `at` the moment of the press, in milliseconds. The audience page takes only the answers with
 * `at` 0 and the print page only the others, so neither takes the answer of a pane that is not its
 * own.
 */
const messageShape = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('slide'), key: z.string() }),
    z.object({ kind: z.literal('changed') }),
    z.object({ kind: z.literal('end') }),
    z.object({ kind: z.literal('left') }),
    z.object({ kind: z.literal('opened') }),
    z.object({ kind: z.literal('move'), key: z.string() }),
    z.object({ kind: z.literal('closed') }),
    z.object({ kind: z.literal('keep-asked'), from: z.enum(['audience', 'print']) }),
    z.object({
        kind: z.literal('keep'),
        keep: z.array(z.string()).nullable(),
        facts: z.boolean(),
        at: z.number().int().nonnegative()
    })
]);

export type PresentMessage = z.infer<typeof messageShape>;

/** The message a value on the channel is, or null for anything else. */
export function parseMessage(value: unknown): PresentMessage | null {
    return readAs(messageShape, value);
}

/**
 * The timer of a presenter screen: the time spent up to the last start or resume, and when it last
 * started, null while it is paused.
 */
export type Timer = { spent: number; since: number | null };

/** A timer that starts counting at `now`. */
export function startedTimer(now: number): Timer {
    return { spent: 0, since: now };
}

/** The milliseconds a timer has counted at `now`. */
export function timerElapsed(timer: Timer, now: number): number {
    return timer.spent + (timer.since === null ? 0 : Math.max(0, now - timer.since));
}

/** The timer stopped at `now`, holding what it counted. */
export function pausedTimer(timer: Timer, now: number): Timer {
    return { spent: timerElapsed(timer, now), since: null };
}

/** The timer counting again from `now`, a running one as it is. */
export function resumedTimer(timer: Timer, now: number): Timer {
    return timer.since === null ? { spent: timer.spent, since: now } : timer;
}

/** The timer back at nothing: counting from `now` when it was running, still paused when not. */
export function resetTimer(timer: Timer, now: number): Timer {
    return { spent: 0, since: timer.since === null ? null : now };
}

/** A count of milliseconds as `H:MM:SS`. */
export function timerText(ms: number): string {
    const seconds = Math.floor(Math.max(0, ms) / 1000);
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    return `${Math.floor(seconds / 3600)}:${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/** The time of day as `HH:MM` on a 24-hour clock. */
export function clockText(at: Date): string {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

export { MAX_UPLOAD_MB };

/** Whether a PDF of this many bytes is within the upload's size. */
export function pdfFits(bytes: number): boolean {
    return bytes <= MAX_UPLOAD_BYTES;
}
