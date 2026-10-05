// Layer 2, client state. What a file's name says about it: its extension, the name a tab is
// labelled with, how it opens, and the language a code window paints it in.
//
// The formats a browser draws are read from the name: the server sends no type with a listing, the
// same answer has to serve a tree drawn before anything is opened, and a name is what the reader
// picks by. Whether anything else is text is the file's own first bytes, through
// data/helpers/files/text-kind.ts, because a name says nothing reliable about that and a list of
// extensions is wrong about every name nobody put on it. The language is the config's: the map of
// config/sources.yml (data/helpers/files/languages.ts), handed in by the caller, so a file's
// language moves with the map and the kind of a file never waits for it.

import { isTextBytes } from '../../../data/helpers/files/text-kind.ts';
import { extensionOf } from '../../../data/helpers/files/opens-in-program.ts';
import type { LanguageMap } from '../../../data/helpers/files/languages.ts';
import { nameOf } from '../../../data/helpers/files/paths.ts';
import { t } from '../../shared/words/text.ts';

export { extensionOf, nameOf };

/**
 * How a file opens: an HTML document, a code window, an image, a PDF, or a name and a link. A file
 * the route says is not there is `missing`, which no name or bytes give.
 */
export type FileKind = 'html' | 'text' | 'image' | 'pdf' | 'other' | 'missing';

/** A file's type: how it opens. */
export type FileType = { kind: FileKind };

/** What the editor calls a file the map has no language for. */
const PLAIN = 'plaintext';

/** The extensions drawn as a picture. */
const IMAGES = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

/** The extensions that open in the document view, which is the one type this view hands on. */
const PAGES = ['.html', '.htm'];

/**
 * The name of the language a file opens in: the map's entry for its whole name lowercased, else for
 * its extension, else plain text. A name that starts with a dot has no extension to read, so a
 * dotfile is plain text, and the whole-name lookup leaves it alone for the same reason: `.py` is a
 * file called `.py`, not an extension.
 */
export function languageOf(name: string, map: LanguageMap): string {
    const bare = nameOf(name).toLowerCase();
    const whole = bare.startsWith('.') ? undefined : map.get(bare);
    return whole ?? map.get(extensionOf(name)) ?? PLAIN;
}

/**
 * How a file opens. The three formats a browser draws itself are the name's: an SVG is a picture
 * rather than text, as it is drawn everywhere else in the application. Everything else is text when
 * its first bytes say so and a download when they do not, so a `.txt` holding an archive is a
 * download and a script nobody gave an extension is text. A caller with no bytes yet gets `other`,
 * which is what the file view draws while it has none.
 */
export function typeOfFile(name: string, bytes?: Uint8Array): FileType {
    const suffix = extensionOf(name);
    if (PAGES.includes(suffix)) return { kind: 'html' };
    if (IMAGES.includes(suffix)) return { kind: 'image' };
    if (suffix === '.pdf') return { kind: 'pdf' };
    const text = bytes !== undefined && isTextBytes(bytes);
    return { kind: text ? 'text' : 'other' };
}

/** Every language a name can resolve to: those the map names, and plain text. */
export function languages(map: LanguageMap): string[] {
    return [...new Set([...map.values(), PLAIN])];
}

/** The id of the view that shows one Markdown file rendered, alone. */
export const MARKDOWN_PREVIEW_VIEW = 'markdown-preview';

/** The words a Markdown preview tab is labelled with: `Preview` and the file's name. */
export function previewLabel(path: string): string {
    return t('files.preview_tab', nameOf(path));
}

/** The state of a tab that shows one Markdown file rendered. */
export function markdownPreviewState(
    root: string,
    path: string
): { root: string; path: string; label: string } {
    return { root, path, label: previewLabel(path) };
}
