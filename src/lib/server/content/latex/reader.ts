// Layer 2, server. The shared LaTeX reader (data/prose/latex.ts) bound to latex-utensils' parser,
// which the server imports statically. The page binds the same reader to the same package through
// `lazyReader` and a dynamic import (state/sources/explorer/sections/outline.ts), so both read one
// rule with one parser.

import { latexParser } from 'latex-utensils';
import { magicCommentsWith, readTexWith, type TexRead } from '../../../data/prose/latex.ts';

/** The magic comments of a file's leading comment block, by lower-cased key. */
export function magicComments(text: string): ReadonlyMap<string, string> {
    return magicCommentsWith((source, options) => latexParser.parse(source, options), text);
}

/** The sections and includes of a text, and whether the parser refused it. */
export function readTex(text: string): TexRead {
    return readTexWith((source, options) => latexParser.parse(source, options), text);
}
