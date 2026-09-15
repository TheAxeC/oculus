// Layer 3, partial of views/File.svelte. The highlighter: the core build of highlight.js with the
// languages this window draws registered by name, and the one call that paints a file's text.
//
// The core build rather than the whole package, which carries close to two hundred languages against
// the eleven a research tree actually holds. The registration runs once at load and is never written
// after, because the library keeps its own registry and there is nothing per reader about which
// languages exist.
//
// The text is escaped by highlight.js before any span is emitted, which is what lets the code window
// put the result in the document; nothing else here touches the file's bytes.

import hljs from 'highlight.js/lib/core';
import type { LanguageFn } from 'highlight.js';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import latex from 'highlight.js/lib/languages/latex';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

/** What the highlighter falls back to for a name it has no language for. */
const PLAIN = 'plaintext';

/** Every language the window registers. A name outside this map is drawn as plain text. */
const REGISTERED: Record<string, LanguageFn> = {
    bash,
    css,
    javascript,
    json,
    latex,
    markdown,
    plaintext,
    python,
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
