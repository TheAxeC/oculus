// Layer 1, data, pure. One slide of a deck read into the slide the view draws, by its kind.
//
// A slide is a front matter and Markdown. The first line of the body that is a `#` heading is the
// slide's heading; what follows is read by the kind. The words stay Markdown: the page typesets
// them. The reader only finds the parts a kind draws apart from the rest (the lede under a title,
// the cards of a section, the one image of an image slide, the two columns, the display formula,
// the code block), and rewrites the address of every relative image so the page can draw it.
//
// A kind this module does not know is a finding and places nothing.

import { str } from '../../helpers/guards.ts';
import {
    DECK_GAP,
    type DeckCard,
    type DeckIdeaCard,
    type DeckSlide,
    type PresentSlide,
    type SlideKind
} from '../../model/index.ts';
import { projectSlide, type Figures } from './project.ts';
import type { RawSlide } from './split.ts';
import type { Raise } from './spec.ts';

/** What the reader knows of the project a deck belongs to. */
export type DeckProject = {
    id: string;
    /** The project's manifest, which a finding about it names. */
    file: string;
    /** The project's folder relative to the hub. */
    folder: string;
    /** The scan tier the project is in. */
    tier: string;
    chips: string[];
    short: string;
    title: string;
    type?: string;
    domain?: string;
};

/** What one slide is read against. */
export type KindContext = {
    /** The slide's key, which a finding about it names. */
    key: string;
    /** The deck's folder under its root, for the words of a finding. */
    folder: string;
    /** The deck's name. */
    deck: string;
    project: DeckProject | null;
    figures: Figures;
    /** How an image of the Markdown resolves: the address of a file that is there. */
    image: (href: string) => { src: string } | { error: 'outside' | 'missing' };
    raise: Raise;
};

/** The kinds a slide's `kind:` may name. */
const KINDS: readonly SlideKind[] = [
    'title',
    'section',
    'text',
    'image',
    'columns',
    'equation',
    'code',
    'closing',
    'project',
    'idea'
];

/** A slide read, and the group its `legend:` names, which the reader turns into domain keys. */
export type Built = { slide: DeckSlide; legend?: string };

const IMAGE = /!\[((?:[^[\]]|\[[^\]]*\])*)\]\(\s*([^)\s]+)(\s+"[^"]*")?\s*\)/g;
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;
const HEADING = /^#\s+(.*?)\s*#*\s*$/;
const ITEM = /^\s{0,3}(\d+)[.)]\s+(.*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** A heading's words turned into the plain words the overview names the slide with. */
function plain(text: string): string {
    return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/[`*_#]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** The body's first `#` heading, and the body after it. A body that opens otherwise has none. */
function headingOf(body: string): { heading: string; rest: string } {
    const lines = body.split('\n');
    const first = lines.findIndex((line) => line.trim() !== '');
    const found = first < 0 ? null : HEADING.exec(lines[first]);
    if (found === null) return { heading: '', rest: body };
    return {
        heading: found[1],
        rest: lines
            .slice(first + 1)
            .join('\n')
            .trim()
    };
}

/**
 * Every relative image of a Markdown text addressed through the file route. An image the deck's
 * folder lacks, or that lies outside the root, becomes the gap (DECK_GAP) named by its path, and a
 * finding says so.
 */
function addressed(markdown: string, context: KindContext): string {
    return markdown.replace(IMAGE, (whole, alt: string, href: string, title?: string) => {
        if (ABSOLUTE.test(href)) return whole;
        const found = context.image(decodeURI(href));
        if ('src' in found) return `![${alt}](${found.src}${title ?? ''})`;
        context.raise(
            context.key,
            found.error === 'outside'
                ? 'findings.deck.path_outside'
                : 'findings.deck.figure_missing',
            href,
            context.folder
        );
        return `![${href.replace(/[[\]\\]/g, '\\$&')}](${DECK_GAP})`;
    });
}

/**
 * The words of a section: what comes before the numbered list (the lede), the list's items, what
 * follows (the foot). Words with no list are the lede. A `foot:` in the slide's front matter is
 * the foot in place of the words after the list, so a section with no list can still have one.
 */
function sectionParts(rest: string): { lede: string; items: [string, string][]; foot: string } {
    const before: string[] = [];
    const after: string[] = [];
    const items: [string, string][] = [];
    let state: 'before' | 'list' | 'after' = 'before';
    for (const line of rest.split('\n')) {
        const item = ITEM.exec(line);
        if (state !== 'after' && item !== null) {
            state = 'list';
            items.push([item[1], item[2]]);
        } else if (state === 'list') {
            if (/^\s+\S/.test(line) && items.length > 0) {
                const last = items[items.length - 1];
                last[1] = `${last[1]}\n${line.trim()}`;
            } else if (line.trim() !== '') {
                state = 'after';
                after.push(line);
            }
        } else if (state === 'before') before.push(line);
        else after.push(line);
    }
    return {
        lede: before.join('\n').trim(),
        items,
        foot: after.join('\n').trim()
    };
}

/** One list item as a card: its leading bold words are the title, the rest the body. */
function card(number: string, text: string): DeckCard {
    const bold = /^\*\*(.+?)\*\*\s*[:.,-]?\s*([\s\S]*)$/.exec(text);
    return bold === null
        ? { n: number, title: '', body: text }
        : { n: number, title: bold[1], body: bold[2].trim() };
}

/** The first fenced block of a text, fences included, and nothing when it holds none. */
function fenced(text: string): string {
    const lines = text.split('\n');
    const open = lines.findIndex((line) => FENCE.test(line));
    if (open < 0) return '';
    const mark = FENCE.exec(lines[open])?.[1] ?? '```';
    for (let at = open + 1; at < lines.length; at += 1) {
        const closing = new RegExp(`^ {0,3}${mark[0]}{${mark.length},}[ \\t]*$`);
        if (closing.test(lines[at])) return lines.slice(open, at + 1).join('\n');
    }
    return lines.slice(open).join('\n');
}

/** The strings of a front matter, with the group counts filled in, as a text map. */
function text(meta: Record<string, unknown>, name: string): string {
    return str(meta[name]) ?? '';
}

/** The card an `idea` slide and a grid draw. */
function ideaCard(meta: Record<string, unknown>, body: string, context: KindContext): DeckIdeaCard {
    const project = context.project;
    const card: DeckIdeaCard = {
        name:
            project === null
                ? (str(meta.title) ?? context.deck)
                : project.short !== ''
                  ? project.short
                  : project.title,
        desc: text(meta, 'desc') !== '' ? text(meta, 'desc') : body
    };
    if (project?.domain !== undefined) card.domain = project.domain;
    if (project !== null && project.chips.length > 0) card.maturity = project.chips[0];
    return card;
}

/** The title the overview names a slide by. */
function titled(heading: string, body: string, fallback: string): string {
    const words = plain(heading !== '' ? heading : (body.split('\n').find((l) => l.trim()) ?? ''));
    return words === '' ? fallback : words;
}

/**
 * One raw slide read as the slide its kind says. `number` is the slide's place in its file, which
 * names it when it has no words of its own.
 */
export function buildSlide(raw: RawSlide, number: number, context: KindContext): Built | null {
    const meta = raw.meta ?? {};
    const declared = meta.kind === undefined ? 'text' : str(meta.kind);
    const kind = KINDS.find((one) => one === declared);
    if (kind === undefined) {
        context.raise(context.key, 'findings.deck.kind_unknown', String(meta.kind));
        return null;
    }
    const base = { key: context.key };
    const notes = str(meta.notes);
    const withNotes = <T extends object>(slide: T): T =>
        notes === undefined ? slide : { ...slide, notes };
    const group = str(meta.legend);
    const body = addressed(raw.body, context);
    const { heading, rest } = headingOf(body);
    const fallback = `${context.deck} ${number + 1}`;
    const title = titled(heading, body, fallback);
    switch (kind) {
        case 'title':
        case 'closing': {
            const slide: DeckSlide = withNotes({
                ...base,
                kind,
                title,
                kicker: str(meta.kicker),
                heading,
                lede: rest,
                contact: str(meta.contact),
                legend: []
            });
            return { slide, legend: group };
        }
        case 'section': {
            const parts = sectionParts(rest);
            const slide: DeckSlide = withNotes({
                ...base,
                kind,
                title,
                heading,
                lede: parts.lede,
                cards: parts.items.map(([n, one]) => card(n, one)),
                foot: str(meta.foot) ?? parts.foot,
                legend: []
            });
            return { slide, legend: group };
        }
        case 'text':
            return { slide: withNotes({ ...base, kind, title, body }) };
        case 'image': {
            const found = new RegExp(IMAGE.source).exec(rest);
            return {
                slide: withNotes({
                    ...base,
                    kind,
                    title,
                    heading,
                    src: found?.[2] ?? '',
                    alt: (found?.[1] ?? '').replace(/\\([[\]\\])/g, '$1')
                })
            };
        }
        case 'columns': {
            const [left, ...others] = rest.split(/^\|\|\|[ \t]*$/m);
            return {
                slide: withNotes({
                    ...base,
                    kind,
                    title,
                    heading,
                    left: left.trim(),
                    right: others.join('\n').trim()
                })
            };
        }
        case 'equation': {
            const display = /\$\$([\s\S]+?)\$\$/.exec(rest);
            return {
                slide: withNotes({
                    ...base,
                    kind,
                    title,
                    heading,
                    equation: display?.[1].trim() ?? '',
                    rest: display === null ? rest : rest.replace(display[0], '').trim()
                })
            };
        }
        case 'code':
            return {
                slide: withNotes({ ...base, kind, title, heading, code: fenced(rest) })
            };
        case 'project': {
            const slide: PresentSlide = projectSlide(
                meta,
                body,
                context.figures,
                context.raise,
                context.key,
                context.folder
            );
            const project = context.project;
            const built: DeckSlide = withNotes({
                ...base,
                kind,
                title: slide.title !== undefined ? plain(slide.title) : (project?.short ?? title),
                slide,
                type: project?.type,
                domain: project?.domain
            });
            return { slide: built };
        }
        case 'idea': {
            const slideCard = ideaCard(meta, raw.body, context);
            return {
                slide: withNotes({ ...base, kind, title: slideCard.name, card: slideCard })
            };
        }
        default:
            return null;
    }
}
