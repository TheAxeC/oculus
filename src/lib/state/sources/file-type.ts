// Layer 2, client state. What a file's name says about it: its extension, the name a tab is
// labelled with, how it opens, and the language a code window paints it in.
//
// The formats a browser draws are read from the name: the server sends no type with a listing, the
// same answer has to serve a tree drawn before anything is opened, and a name is what the reader
// picks by. Whether anything else is text is the file's own first bytes, through
// data/helpers/files/text-kind.ts, because a name says nothing reliable about that and a list of
// extensions is wrong about every name nobody put on it.

import { isTextBytes } from '../../data/helpers/files/text-kind.ts';
import { extensionOf } from '../../data/helpers/files/opens-in-program.ts';
import { nameOf } from '../../data/helpers/files/paths.ts';
import { languageNamed, registered } from '../shared/words/languages.ts';

export { extensionOf, nameOf };

/** How a file opens: an HTML document, a code window, an image, a PDF, or a name and a link. */
export type FileKind = 'html' | 'text' | 'image' | 'pdf' | 'other';

/** A file's type, and for a text file the highlighter's name for its language. */
export type FileType = { kind: FileKind; language: string };

/**
 * The extensions highlight.js does not resolve to a registered language by their own name, and the
 * language each is painted in. Every other extension is asked of highlight.js first, and a text
 * file neither knows is painted as plain text.
 */
const LANGUAGES: Record<string, string[]> = {
    json: ['.ipynb'],
    bash: ['.slurm'],
    latex: ['.bib', '.sty', '.cls'],
    xml: ['.svelte'],
    lisp: ['.el', '.scm'],
    ocaml: ['.mli'],
    matlab: ['.m'],
    julia: ['.jl']
};

/**
 * The whole names a language claims, for a file that carries no extension to be read from. The name
 * is compared lowercased, which is what makes `Makefile` and `makefile` the same file to a reader.
 */
const NAMES: Record<string, string[]> = {
    makefile: ['makefile']
};

/** What the highlighter calls a file it has no language for. */
const PLAIN = 'plaintext';

/** The extensions drawn as a picture. */
const IMAGES = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

/** The extensions that open in the document view, which is the one type this view hands on. */
const PAGES = ['.html', '.htm'];

/**
 * The highlighter's name for a file's language: the one highlight.js resolves the extension to,
 * else the one LANGUAGES gives the extension, else the one NAMES gives the whole name.
 */
export function languageOf(name: string): string {
    const suffix = extensionOf(name);
    const known = languageNamed(suffix.slice(1));
    if (known !== null) return known;
    for (const [language, list] of Object.entries(LANGUAGES)) {
        if (list.includes(suffix)) return language;
    }
    const bare = nameOf(name).toLowerCase();
    for (const [language, list] of Object.entries(NAMES)) {
        if (list.includes(bare)) return language;
    }
    return PLAIN;
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
    if (PAGES.includes(suffix)) return { kind: 'html', language: PLAIN };
    if (IMAGES.includes(suffix)) return { kind: 'image', language: PLAIN };
    if (suffix === '.pdf') return { kind: 'pdf', language: PLAIN };
    const text = bytes !== undefined && isTextBytes(bytes);
    return { kind: text ? 'text' : 'other', language: languageOf(name) };
}

/**
 * Every language a name can resolve to: each grammar the code window registers, which `languageOf`
 * reaches through highlight.js's names and aliases, and those LANGUAGES and NAMES give.
 */
export function languages(): string[] {
    return [...new Set([...registered(), ...Object.keys(LANGUAGES), ...Object.keys(NAMES)])];
}
