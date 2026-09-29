// Layer 1, data. The highlighter: the core build of highlight.js with the languages the app paints
// registered by name, the one call that paints text, and `codeColour`, the marked extension that
// paints the fenced code of every Markdown render with it.
//
// It sits in the data layer because both sides paint code with it: the server renders a document
// (server/content/docs.ts) and an assistant's turn (server/sessions/stores/turns.ts) through
// `codeColour`, and the page paints the read-only code window the source tab and the Config view
// draw (views/shared/code/Code.svelte) and a preview's Markdown, the window reaching it through
// state/shared/words/languages.ts, which re-exports it for the page layers. The file browser's
// state asks it too, which language a file's extension names, so the table of names and aliases
// is highlight.js's own and oculus keeps only the extensions it does not know. Its names are also
// the languages the source tab's editor opens a file under and the status bar lists; the editor
// colours them through Shiki's grammars (ui/controls/editor/kit/grammars.ts), not this
// highlighter.
//
// The core build rather than the whole package, which carries close to two hundred languages
// against the eighteen a research tree actually holds. The registration runs once at load and is
// never written after, because the library keeps its own registry and there is nothing per reader
// about which languages exist.
//
// There is no Svelte grammar in the package, so a component file is painted as xml: its markup and
// its style block colour, a `<script>` block without a `lang` attribute colours as JavaScript, and
// the `<script lang="ts">` block every component here writes does not.
//
// The text is escaped by highlight.js before any span is emitted, which is what lets the code
// window and a rendered document put the result in the document; nothing else here touches the
// file's bytes. The spans carry highlight.js's own classes, which themes/code.css colours.

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
import type { MarkedExtension } from 'marked';
import { markedHighlight } from 'marked-highlight';

/** What the highlighter falls back to for a name it has no language for. */
export const PLAIN = 'plaintext';

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
 * The registered name of the language highlight.js resolves a name or an alias to, or null when it
 * resolves none: `ts` and `tsx` are typescript's aliases, and the name a language was registered
 * under is the one whose definition is the same object. The lookup is highlight.js's own table of
 * names and aliases, so an extension it knows needs no line of oculus's.
 */
export function languageNamed(alias: string): string | null {
    if (alias === '') return null;
    const found = hljs.getLanguage(alias);
    if (found === undefined) return null;
    return Object.keys(REGISTERED).find((name) => hljs.getLanguage(name) === found) ?? null;
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

/**
 * The marked extension that paints a fenced block of a language the highlighter resolves, by name
 * or alias, and paints any other named fence as plain text, escaped. A fence with no language is
 * left to marked, which escapes it. The block carries `hljs language-<name>` as its class, the
 * language as the author wrote it, which is what a sanitised document keeps of it.
 */
export const codeColour: MarkedExtension = markedHighlight({
    langPrefix: 'hljs language-',
    highlight: (code, lang) => codeHtml(code, languageNamed(lang) ?? PLAIN)
});
