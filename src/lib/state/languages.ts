// Layer 2, client state. The highlighter: the core build of highlight.js with the languages the page
// draws registered by name, and the one call that paints text.
//
// It sits in the state layer because two views paint with it, the source tab's code window and editor
// and the diff pane of a repository, and a view may not import another view's partial.
//
// The core build rather than the whole package, which carries close to two hundred languages against
// the eighteen a research tree actually holds. The registration runs once at load and is never
// written after, because the library keeps its own registry and there is nothing per reader about
// which languages exist.
//
// There is no Svelte grammar in the package, so a component file is painted as xml: its markup and
// its style block colour, a `<script>` block without a `lang` attribute colours as JavaScript, and the
// `<script lang="ts">` block every component here writes does not.
//
// The text is escaped by highlight.js before any span is emitted, which is what lets the code window
// put the result in the document; nothing else here touches the file's bytes.

import hljs from 'highlight.js/lib/core';
import type { LanguageFn } from 'highlight.js';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import ini from 'highlight.js/lib/languages/ini';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import julia from 'highlight.js/lib/languages/julia';
import latex from 'highlight.js/lib/languages/latex';
import lisp from 'highlight.js/lib/languages/lisp';
import makefile from 'highlight.js/lib/languages/makefile';
import markdown from 'highlight.js/lib/languages/markdown';
import matlab from 'highlight.js/lib/languages/matlab';
import ocaml from 'highlight.js/lib/languages/ocaml';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import r from 'highlight.js/lib/languages/r';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

/** What the highlighter falls back to for a name it has no language for. */
export const PLAIN = 'plaintext';

/**
 * Bytes of text above which the editor's mirror is painted without colour. The mirror is painted
 * again on every keystroke, and the grammars cost more than a frame on a file past this size, so
 * a larger file is edited over escaped text; the code window, painted once, colours every size.
 */
export const PAINT_LIMIT = 64 * 1024;

/** Every language the window registers. A name outside this map is drawn as plain text. */
const REGISTERED: Record<string, LanguageFn> = {
    bash,
    css,
    diff,
    ini,
    javascript,
    json,
    julia,
    latex,
    lisp,
    makefile,
    markdown,
    matlab,
    ocaml,
    plaintext,
    python,
    r,
    typescript,
    xml,
    yaml
};

for (const [name, definition] of Object.entries(REGISTERED)) {
    hljs.registerLanguage(name, definition);
}

/** The names the window can paint, which is what a file's type is matched against. */
export function registered(): string[] {
    return Object.keys(REGISTERED);
}

/**
 * One file's text as escaped HTML with the highlighter's own span classes on it. An illegal
 * construct is ignored rather than thrown: a half-written file is still a file the reader opened.
 */
export function codeHtml(text: string, language: string): string {
    const name = language in REGISTERED ? language : PLAIN;
    return hljs.highlight(text, { language: name, ignoreIllegals: true }).value;
}

/** The line numbers a file's text needs, which is one per line of it. */
export function lineNumbers(text: string): number[] {
    const lines = text === '' ? 0 : text.split('\n').length;
    return Array.from({ length: lines }, (_, at) => at + 1);
}
