// Layer 2, server. The acts on the files of an open deck: a new slide file, a slide copied, a
// slide taken out and an image dropped on a slide.
//
// An act reads the deck as the reader sees it now (server/content/deck/read.ts), finds the slide it
// names and the entry of `order:` that placed it, and refuses, with nothing written, when the slide
// is not in a file of the deck itself or the file's text is not the `base` the page read. The
// edits are over the bytes (data/sources/deck/slide-text.ts for a slide file, server/edit/
// deck-edit.ts for `order:`), each read back, so a file whose shape an edit cannot keep is refused
// whole. Every file an act changes is one record holding the file's text before and after (an
// empty text for a file that was not there, or is not there after), all under one key so that
// History takes the act back as one step (deck-undo.ts).

import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import trashLibrary from 'trash';
import { parse } from 'yaml';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '../../../../../../data/file-ops.ts';
import {
    appendToSlide,
    deleteSlide,
    duplicateSlide,
    newSlideText
} from '../../../../../../data/sources/deck/slide-text.ts';
import { DECK_FILE } from '../../../../../../data/sources/deck/read.ts';
import {
    readSpec,
    type DeckSpec,
    type OrderEntry
} from '../../../../../../data/sources/deck/spec.ts';
import { splitSlides } from '../../../../../../data/sources/deck/split.ts';
import type { Deck } from '../../../../../../data/model/index.ts';
import { writeTextAtomic } from '../../../../../core/json.ts';
import { inside, realPath } from '../../../../../core/paths.ts';
import { words } from '../../../../../core/words.ts';
import { readDeck, type DeckSource } from '../../../../../content/deck/read.ts';
import { resolveRootPath, type Root } from '../../../../../files/files.ts';
import { addOrderEntry, removeOrderEntries } from '../../../../deck-edit.ts';
import type { ChangeRecord } from '../../../../../core/changes.ts';
import type { FilesDeps } from '../../../file-undo.ts';
import type { WriteOutcome, WriteTarget } from '../../../../writes.ts';

/** What an act answers with: what it changed, refused and recorded, and what to show next. */
export type ActOutcome =
    | { changed: string[]; refused: WriteOutcome['refused']; records?: ChangeRecord[]; id?: string }
    | { error: 'unwritable' };

/** The field of the record of a dropped image's own file, which holds a hash and not a text. */
export const IMAGE_BYTES = 'image-bytes';

/** The extensions of the images a slide takes. */
const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

/** A deck open for an act: where it is, what it holds, and the words its refusals use. */
export type OpenDeck = {
    into: WriteTarget;
    roots: Root[];
    root: string;
    path: string;
    /** The real path of the deck's `present.yml`, its text as read, and what it holds. */
    file: string;
    text: string;
    spec: DeckSpec;
    deck: Deck;
    /** The key every record of the act is filed under. */
    act: string;
};

/** The refusal of an act: the field it concerns and the reason in words. */
function refusal(open: Pick<OpenDeck, 'path'>, reason: string): ActOutcome {
    return { changed: [], refused: [{ field: open.path, reason }] };
}

/** A file's text, or the empty text for one that is not there. */
export function textOf(path: string): string {
    return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/**
 * A real path under the hub's real folder spelled under the hub's own path, so a record names a
 * hub file by its path in the hub whether or not the hub's folder is reached through a link.
 */
export function hubSpelling(hub: string | null, file: string): string {
    const real = hub === null ? null : realPath(hub);
    return hub !== null && real !== null && inside(file, real)
        ? join(hub, relative(real, file))
        : file;
}

/** What a deck is read over for a write: the roots, the primary hub, its settings and projects. */
export function deckSourceOf(into: WriteTarget, roots: Root[]): DeckSource {
    return {
        roots,
        primary:
            into.primary === null || into.hub === null
                ? null
                : { key: into.primary, dir: into.hub },
        config: into.config,
        projects: into.projects(),
        hubs: into.hubs
    };
}

/** One record of an act: a file's text before and after, or a hash for an image. */
export function recordFor(
    open: Pick<OpenDeck, 'into' | 'act'>,
    field: string,
    file: string,
    before: string,
    after: string
): ChangeRecord {
    return {
        file: hubSpelling(open.into.hub, file),
        key: open.act,
        field,
        before,
        after,
        undo: 'field'
    };
}

/** A new key for the records of one act. */
export function actKey(): string {
    return randomBytes(6).toString('hex');
}

/**
 * The deck a request names, open for an act, or the refusal. The path must be a `present.yml`
 * inside a served root that holds a deck the reader can read.
 */
export function openDeck(into: WriteTarget, root: string, path: string): OpenDeck | ActOutcome {
    const roots = into.files?.roots();
    if (roots === undefined) return { error: 'unwritable' };
    const text = into.config.text;
    const gone = (reason: string): ActOutcome => ({
        changed: [],
        refused: [{ field: path, reason }]
    });
    if (posix.basename(path.replaceAll('\\', '/')) !== DECK_FILE)
        return gone(words(text, 'server.deck_edit.not_a_deck'));
    const at = resolveRootPath(roots, root, path);
    if ('error' in at) return gone(words(text, 'server.deck_edit.outside'));
    const deck = readDeck(deckSourceOf(into, roots), root, dirname(path));
    if (deck === 'outside' || (deck.state !== 'ok' && deck.state !== 'empty')) {
        return gone(words(text, 'server.deck_edit.no_deck'));
    }
    const held = readFileSync(at.path, 'utf8');
    const spec = readSpec(parse(held), () => undefined);
    if (spec === null) return gone(words(text, 'server.deck_edit.no_deck'));
    return { into, roots, root, path, file: at.path, text: held, spec, deck, act: actKey() };
}

/** The slide an act names, with the file entry that placed it and its file. */
type Placed = {
    entry: Extract<OrderEntry, { kind: 'file' }>;
    index: number;
    file: string;
    text: string;
};

/**
 * The slide of the deck's own files that `key` names, or the refusal: the deck must hold the
 * slide, a file entry of `order:` must have placed it, and the file must hold `base`.
 */
function placed(open: OpenDeck, key: string, base: string): Placed | ActOutcome {
    const slide = open.deck.slides.find((one) => one.key === key);
    if (slide === undefined)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.no_slide', key));
    const source = slide.source;
    const entry = source === undefined ? undefined : open.spec.order.at(source.entry);
    if (source === undefined || entry?.kind !== 'file') {
        return refusal(open, words(open.into.config.text, 'server.deck_edit.not_own', key));
    }
    const at = resolveRootPath(open.roots, source.root, source.path);
    if ('error' in at)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.outside'));
    const text = readFileSync(at.path, 'utf8');
    if (text !== base)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.changed', source.path));
    return { entry, index: source.index, file: at.path, text };
}

/** Whether an outcome is a refusal or a failure rather than a slide placed. */
function failed(held: Placed | ActOutcome): held is ActOutcome {
    return 'changed' in held || 'error' in held;
}

/** The names `order:` holds as file entries. */
function namedFiles(spec: DeckSpec): Set<string> {
    const named = new Set<string>();
    for (const entry of spec.order) if (entry.kind === 'file') named.add(entry.file);
    return named;
}

/** The deck's folder, which every file name of `order:` is relative to. */
function folderOf(open: OpenDeck): string {
    return dirname(open.file);
}

/** The path of a name in the deck's folder under the root, for the list of what changed. */
function underRoot(open: OpenDeck, file: string): string {
    const dir = dirname(open.path);
    const base = dir === '.' ? '' : dir;
    return posix.join(base, relative(folderOf(open), file).replaceAll('\\', '/'));
}

/** Write the deck's `present.yml`, which is the same file every act of the deck edits. */
function writeDeckFile(open: OpenDeck, text: string): void {
    writeTextAtomic(open.file, text);
}

/**
 * `slide-<n>.md` for the smallest n from 1 whose name is free on disk and not named in `order:`.
 */
function freeSlideName(open: OpenDeck): string {
    const named = namedFiles(open.spec);
    for (let at = 1; ; at += 1) {
        const name = `slide-${at}.md`;
        if (!named.has(name) && !existsSync(join(folderOf(open), name))) return name;
    }
}

/** A new slide file after the slide `after`, or at the end of `order:`. */
export function newSlide(open: OpenDeck, after: string | undefined): ActOutcome {
    const name = freeSlideName(open);
    const anchor =
        after === undefined ? undefined : open.deck.slides.find((one) => one.key === after);
    const order = addOrderEntry(open.text, anchor?.source?.entry ?? null, name);
    if (order === null)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.not_kept'));
    const file = join(folderOf(open), name);
    const text = newSlideText(words(open.into.config.text, 'server.deck_edit.new_slide_heading'));
    writeTextAtomic(file, text);
    writeDeckFile(open, order);
    return {
        changed: [underRoot(open, file), open.path],
        refused: [],
        id: `${name}#0`,
        records: [
            recordFor(open, 'new', file, '', text),
            recordFor(open, 'new', open.file, open.text, order)
        ]
    };
}

/** `<stem>-copy.md`, then `<stem>-copy-2.md` and on, the first name free beside the file. */
function copyName(open: OpenDeck, file: string): string {
    const named = namedFiles(open.spec);
    const dir = posix.dirname(file);
    const stem = posix.basename(file).replace(/\.md$/i, '');
    for (let at = 1; ; at += 1) {
        const leaf = `${stem}-copy${at === 1 ? '' : `-${at}`}.md`;
        const name = dir === '.' ? leaf : `${dir}/${leaf}`;
        if (!named.has(name) && !existsSync(resolve(folderOf(open), name))) return name;
    }
}

/** A slide copied: its file when it holds that slide alone, else its text right after itself. */
export function duplicate(open: OpenDeck, key: string, base: string): ActOutcome {
    const held = placed(open, key, base);
    if (failed(held)) return held;
    const { entry, index, file, text } = held;
    if (splitSlides(text).slides.length > 1) {
        const edited = duplicateSlide(text, index);
        if (edited === null)
            return refusal(open, words(open.into.config.text, 'server.deck_edit.not_kept'));
        writeTextAtomic(file, edited);
        return {
            changed: [underRoot(open, file)],
            refused: [],
            id: `${entry.file}#${index + 1}`,
            records: [recordFor(open, 'duplicate', file, text, edited)]
        };
    }
    const name = copyName(open, entry.file);
    const order = addOrderEntry(open.text, entry.index, name);
    if (order === null)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.not_kept'));
    const copy = resolve(folderOf(open), name);
    writeTextAtomic(copy, text);
    writeDeckFile(open, order);
    return {
        changed: [underRoot(open, copy), open.path],
        refused: [],
        id: `${name}#0`,
        records: [
            recordFor(open, 'duplicate', copy, '', text),
            recordFor(open, 'duplicate', open.file, open.text, order)
        ]
    };
}

/** The entries of `order:` that name one file, whatever way each is written. */
function entriesOf(open: OpenDeck, file: string): number[] {
    return open.spec.order
        .filter(
            (entry) =>
                entry.kind === 'file' && realPath(resolve(folderOf(open), entry.file)) === file
        )
        .map((entry) => entry.index);
}

/**
 * A slide taken out. A summary or a grid is its entry of `order:`; a slide of a file that holds
 * others is its text and the separator before it; a file that holds that slide alone goes to the
 * Trash, with every entry that names it.
 */
export async function remove(
    open: OpenDeck,
    key: string,
    base: string,
    deps: FilesDeps
): Promise<ActOutcome> {
    const slide = open.deck.slides.find((one) => one.key === key);
    const entry = slide?.source === undefined ? undefined : open.spec.order.at(slide.source.entry);
    if (entry !== undefined && (entry.kind === 'summary' || entry.kind === 'grid')) {
        if (base !== open.text)
            return refusal(
                open,
                words(open.into.config.text, 'server.deck_edit.changed', open.path)
            );
        const order = removeOrderEntries(open.text, [entry.index]);
        if (order === null)
            return refusal(open, words(open.into.config.text, 'server.deck_edit.not_kept'));
        writeDeckFile(open, order);
        return {
            changed: [open.path],
            refused: [],
            records: [recordFor(open, 'delete', open.file, open.text, order)]
        };
    }
    const held = placed(open, key, base);
    if (failed(held)) return held;
    const { file, index, text } = held;
    if (splitSlides(text).slides.length > 1) {
        const edited = deleteSlide(text, index);
        if (edited === null)
            return refusal(open, words(open.into.config.text, 'server.deck_edit.not_kept'));
        writeTextAtomic(file, edited);
        return {
            changed: [underRoot(open, file)],
            refused: [],
            records: [recordFor(open, 'delete', file, text, edited)]
        };
    }
    const order = removeOrderEntries(open.text, entriesOf(open, file));
    if (order === null)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.not_kept'));
    writeDeckFile(open, order);
    try {
        await (deps.trash ?? ((path, options) => trashLibrary(path, options)))(file, {
            glob: false
        });
    } catch {
        writeDeckFile(open, open.text);
        return { error: 'unwritable' };
    }
    return {
        changed: [underRoot(open, file), open.path],
        refused: [],
        records: [
            recordFor(open, 'delete', file, text, ''),
            recordFor(open, 'delete', open.file, open.text, order)
        ]
    };
}

/** The extension of a name in lower case, without its dot. */
function extensionOf(name: string): string {
    const at = name.lastIndexOf('.');
    return at < 0 ? '' : name.slice(at + 1).toLowerCase();
}

/** `name`, then `<stem>-2.<ext>`, `<stem>-3.<ext>` and on: the first name free in the folder. */
function freeImageName(folder: string, name: string): string {
    const dot = name.lastIndexOf('.');
    const stem = name.slice(0, dot);
    const extension = name.slice(dot);
    let held = name;
    for (let at = 2; existsSync(join(folder, held)); at += 1) held = `${stem}-${at}${extension}`;
    return held;
}

/**
 * The Markdown line that shows an image. A space, a parenthesis, `#`, `%` or `?` of the name is
 * percent-encoded: the deck reader's image pattern ends a link at a space or `)`, and the browser
 * would read the others as a fragment, an escape or a query. The reader decodes the link back to
 * the file's name.
 */
function imageLine(name: string): string {
    const stem = name.slice(0, name.lastIndexOf('.')).replace(/[[\]]/g, '');
    const link = name.replace(/[\s()#%?]/g, (one) =>
        one === '(' || one === ')'
            ? `%${one.charCodeAt(0).toString(16).toUpperCase()}`
            : encodeURIComponent(one)
    );
    return `![${stem}](${link})`;
}

/**
 * An image copied into the folder of the slide's file and linked at the end of the slide. The name
 * is the file's own name: it may hold no separator or `..`, may not start with a dot, and its
 * extension is one of an image the page draws.
 */
export function image(
    open: OpenDeck,
    request: { slide: string; base: string; name: string; data: string }
): ActOutcome {
    const { name, data } = request;
    const bad = /[/\\<>\0]/.test(name) || name.includes('..') || name.startsWith('.');
    if (bad)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.image_name', name));
    if (!IMAGES.includes(extensionOf(name))) {
        return refusal(open, words(open.into.config.text, 'server.deck_edit.image_type', name));
    }
    if (data.length > Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 4) {
        return refusal(
            open,
            words(open.into.config.text, 'server.deck_edit.image_large', name, MAX_UPLOAD_MB)
        );
    }
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length === 0)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.image_empty', name));
    if (bytes.length > MAX_UPLOAD_BYTES) {
        return refusal(
            open,
            words(open.into.config.text, 'server.deck_edit.image_large', name, MAX_UPLOAD_MB)
        );
    }
    const held = placed(open, request.slide, request.base);
    if (failed(held)) return held;
    const folder = dirname(held.file);
    const kept = freeImageName(folder, name);
    const edited = appendToSlide(held.text, held.index, imageLine(kept));
    if (edited === null)
        return refusal(open, words(open.into.config.text, 'server.deck_edit.not_kept'));
    const target = join(folder, kept);
    writeFileSync(target, bytes, { flag: 'wx' });
    writeTextAtomic(held.file, edited);
    return {
        changed: [underRoot(open, target), underRoot(open, held.file)],
        refused: [],
        id: request.slide,
        records: [
            recordFor(open, IMAGE_BYTES, target, '', hashOf(bytes)),
            recordFor(open, 'image', held.file, held.text, edited)
        ]
    };
}

/** The hash an image's record holds in place of its bytes. */
export function hashOf(bytes: Uint8Array): string {
    return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}
