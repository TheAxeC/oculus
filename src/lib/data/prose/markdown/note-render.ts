// Layer 1, data. How a note's links, embeds and tags are drawn in its rendered half and the
// Markdown Preview: a marked extension over note-links.ts's tokenizers, given what the page knows
// of the note's hub (`NoteContext`). It writes markup only; ui/html.ts renders the document with
// it, puts the embedded notes in, and sanitises the whole.
//
// A link is an `a` of the class `wikilink`, its address `#note=` and the link's name and heading
// encoded once, which the press on it reads back (`pressedNote`), so the press opens the note at
// its heading, or makes it when it is missing, and never moves the page's address. A link to no
// note carries `unresolved` as well, and a name the rule refuses carries the sentence saying why as
// its title. The shown text is the text after `|`, else the name, with `> heading` after it for a
// link to a heading; it is escaped, so whatever it holds is drawn as text.
//
// An embed of an image of the notes folder is an `img` whose address is the file route's
// (`fileAddress`); an embed of a note is a slot the caller fills with that note's rendered text,
// or that section of it, framed; an embed inside an embedded note is drawn as a link, so a note
// embedding one that embeds it again stops at the second level. An embed of a missing file is
// drawn as an unresolved link, and one whose name climbs out (`..`) or starts at `/` draws nothing.
// An embed alone on its line is a block of its own, which ends the paragraph before it, and its
// slot is a `div`; an embed inside a line of text has a `span` for its slot.
// A tag is an `a` of the class `note-tag`, its address `#tag=` and the word encoded once.

import type { MarkedExtension, Tokens } from 'marked';
import { escapeAttribute } from './markdown.ts';
import {
    tagTokenizer,
    wikiParts,
    wikiTokenizer,
    type TagToken,
    type WikiParts,
    type WikiToken
} from './note-links.ts';
import { isNote } from './note-names.ts';

/** What a note's drawing knows of its hub's notes. */
export type NoteContext = {
    /** The path inside the notes folder a link's name names, or null for none. */
    resolve: (name: string) => string | null;
    /** The address the page draws a file of the notes folder at. */
    fileAddress: (path: string) => string;
    /** The sentence saying why the name rule refuses a name, or null for a name it allows. */
    refusal: (name: string) => string | null;
    /** Whether an embedded note draws its text, which is false inside an embedded note. */
    embeds: boolean;
};

/** A note's drawing as a page hands it in: its hub's context, and an embedded note's text. */
export type NoteDrawing = Omit<NoteContext, 'embeds'> & {
    /** The text of a note of the folder an embed names, or null while it is not read. */
    text: (path: string) => string | null;
};

/**
 * One embedded note the caller draws into its slot: the note, the heading, the name, and whether
 * the embed stands alone on its line (`block`), so its slot is a block and not a run of a line.
 */
export type EmbedSlot = { path: string; heading: string; name: string; block: boolean };

/** What the address of a link and of a tag starts with. */
const NOTE_HREF = '#note=';
const TAG_HREF = '#tag=';

/** The class every link carries, and the one a link to no note carries beside it. */
export const LINK_CLASS = 'wikilink';
export const UNRESOLVED_CLASS = 'unresolved';

/** The class of the frame an embedded note is drawn in, and of a slot before it is filled. */
export const EMBED_CLASS = 'embed';
export const SLOT_CLASS = 'note-slot';

/** The token type of an embed alone on its line. */
const EMBED_LINE_TOKEN = 'noteEmbedLine';

/** An embed alone on its line, indented by at most three spaces, with the spaces after it. */
const EMBED_LINE = /^ {0,3}(!\[\[([^[\]\n]+?)\]\])[ \t]*(?:\n|$)/;

/** A line holding an embed alone, after the first line of a run of text. */
const EMBED_LINE_START = /\n(?= {0,3}!\[\[[^[\]\n]+?\]\][ \t]*(?:\n|$))/;

/** The extensions of the files an embed draws as a picture. */
const PICTURES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'];

/** Whether a path of the notes folder is a picture. */
function isPicture(path: string): boolean {
    const at = path.lastIndexOf('.');
    return at > 0 && PICTURES.includes(path.slice(at + 1).toLowerCase());
}

/** The address of a link: its name, and its heading after `#`, encoded once. */
export function noteHref(parts: Pick<WikiParts, 'name' | 'heading'>): string {
    const target = parts.heading === '' ? parts.name : `${parts.name}#${parts.heading}`;
    return `${NOTE_HREF}${encodeURIComponent(target)}`;
}

/** The address of a tag. */
function tagHref(tag: string): string {
    return `${TAG_HREF}${encodeURIComponent(tag)}`;
}

/** The text after a prefix, decoded once, or null for another address or one that does not. */
function decodedAfter(href: string, prefix: string): string | null {
    if (!href.startsWith(prefix)) return null;
    try {
        return decodeURIComponent(href.slice(prefix.length));
    } catch {
        return null;
    }
}

/** The name and heading a link's address names, or null for an address that is no link's. */
export function pressedNote(href: string): { name: string; heading: string } | null {
    const target = decodedAfter(href, NOTE_HREF);
    if (target === null) return null;
    const hash = target.indexOf('#');
    return hash < 0
        ? { name: target, heading: '' }
        : { name: target.slice(0, hash), heading: target.slice(hash + 1) };
}

/** The tag a tag's address names, or null for an address that is no tag's. */
export function pressedTag(href: string): string | null {
    return decodedAfter(href, TAG_HREF);
}

/** Whether a name climbs out of the folder or starts at the top of the disk. */
function climbs(name: string): boolean {
    return name.startsWith('/') || name.startsWith('\\') || name.split(/[/\\]/).includes('..');
}

/** A link drawn: resolved or not, its shown text escaped, the refusal as its title. */
function linkHtml(parts: WikiParts, found: boolean, refused: string | null): string {
    const words =
        parts.shown ?? (parts.heading === '' ? parts.name : `${parts.name} > ${parts.heading}`);
    const kind = found ? LINK_CLASS : `${LINK_CLASS} ${UNRESOLVED_CLASS}`;
    const title = refused === null ? '' : ` title="${escapeAttribute(refused)}"`;
    return `<a class="${kind}" href="${escapeAttribute(noteHref(parts))}"${title}>${escapeAttribute(words)}</a>`;
}

/**
 * The extension that draws a note's links, embeds and tags, over the context of its hub. Each
 * embedded note drawn as a slot is pushed on `slots`, its slot holding `mark` and its index, which
 * the caller replaces with the note's text.
 */
export function noteExtension(
    context: NoteContext,
    slots: EmbedSlot[],
    mark: string
): MarkedExtension {
    const link = wikiTokenizer();
    const tag = tagTokenizer();
    const drawn = (embed: boolean, inner: string, block: boolean): string => {
        const parts = wikiParts(inner);
        if (climbs(parts.name)) return embed ? '' : linkHtml(parts, false, null);
        const refused = parts.name
            .split('/')
            .map((one) => context.refusal(one))
            .find((one) => one !== null);
        const path = refused === undefined ? context.resolve(parts.name) : null;
        if (embed && path !== null && isPicture(path)) {
            const alt = escapeAttribute(parts.shown ?? parts.name);
            return `<img src="${escapeAttribute(context.fileAddress(path))}" alt="${alt}">`;
        }
        if (embed && path !== null && isNote(path) && context.embeds) {
            slots.push({ path, heading: parts.heading, name: parts.name, block });
            return block
                ? `<div class="${SLOT_CLASS}">${mark}-${slots.length - 1}</div>\n`
                : `<span class="${SLOT_CLASS}">${mark}-${slots.length - 1}</span>`;
        }
        return linkHtml(parts, path !== null, refused ?? null);
    };
    return {
        extensions: [
            {
                name: EMBED_LINE_TOKEN,
                level: 'block',
                start(src: string) {
                    const found = EMBED_LINE_START.exec(src);
                    return found === null ? undefined : found.index + 1;
                },
                tokenizer(src: string): Tokens.Generic | undefined {
                    const found = EMBED_LINE.exec(src);
                    if (found === null) return undefined;
                    return { type: EMBED_LINE_TOKEN, raw: found[0], inner: found[2] };
                },
                renderer(token: Tokens.Generic) {
                    const html = drawn(true, String(token.inner), true);
                    if (html === '' || html.startsWith(`<div class="${SLOT_CLASS}">`)) return html;
                    return `<p>${html}</p>\n`;
                }
            },
            {
                ...link,
                renderer(token: Tokens.Generic) {
                    const wiki = token as WikiToken;
                    return drawn(wiki.embed, wiki.inner, false);
                }
            },
            {
                ...tag,
                renderer(token: Tokens.Generic) {
                    const word = (token as TagToken).tag;
                    return `<a class="note-tag" href="${escapeAttribute(tagHref(word))}">#${escapeAttribute(word)}</a>`;
                }
            }
        ]
    };
}
