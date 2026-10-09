// Layer 2, server. The thread oculus holds to find the comments of a code file. It is plain
// JavaScript that node runs directly as a worker, since it must start the same way from `vite dev`,
// from the built server and from the desktop app, and it imports the Shiki package that Node
// resolves from oculus's own folder.
//
// A request on the thread's port is `{ id, language, text }`: the text of a file up to the end of
// the last line that holds a character the writing rules mark, and the Shiki id of its grammar. The
// answer is `{ id, ranges }`: `ranges` is a flat list of triples `from, to, kind` with offsets into
// the text in UTF-16 units, `kind` 1 for a Python docstring and 0 for a comment. A request that
// fails, a grammar that cannot be loaded included, answers `{ id, error }` with the first line of
// the message, and the next request is answered as usual. A message that is not a request gets
// no answer, and the requests after it are answered.
//
// A character is in a comment when a scope of its token starts with `comment.`, and in Python
// also when a scope starts with `string.quoted.docstring.`, which is how the grammar scopes the
// string that is a module's, class's or function's documentation, prefixed (`r`) or not. Tokens
// come from the grammar's own `tokenizeLine` with the rule stack carried from one line to the
// next, so a block comment or a docstring that spans lines is followed. The grammar tokenises a
// line with its break appended, so a token's end is cut back to the line's own length. A string, a
// template string, a regular expression and the text of an HTML or JSX element carry no such
// scope.
//
// A line longer than `LONG_LINE` units is not tokenised and the rest of the file is answered as
// holding no comment, since a minified line takes the grammar longer than any reader waits; the
// answer is `{ id, ranges }` with the comments found before that line. Requests are answered
// one at a time, in the order they arrive, and each grammar is loaded once.

import { parentPort } from 'node:worker_threads';
import { createHighlighter } from 'shiki';

/** The longest line, in UTF-16 units, the grammar is given. */
const LONG_LINE = 2000;

const BREAK = /\r\n|\r|\n/g;

/** @typedef {{ id: number, language: string, text: string }} Request */

/** @type {Promise<import('shiki').HighlighterGeneric<string, string>> | null} */
let highlighter = null;

/** The grammars being loaded or loaded, each once. @type {Map<string, Promise<void>>} */
const grammars = new Map();

/** The highlighter, created by the first request; one that failed to be created is not kept. */
function held() {
    if (highlighter === null) {
        const creating = createHighlighter({ themes: [], langs: [] });
        highlighter = creating;
        creating.catch(() => {
            if (highlighter === creating) highlighter = null;
        });
    }
    return highlighter;
}

/** Load a grammar once; every later request for it waits on the same load. */
function load(language) {
    let pending = grammars.get(language);
    if (pending === undefined) {
        pending = held().then((one) => one.loadLanguage(language));
        grammars.set(language, pending);
        pending.catch(() => grammars.delete(language));
    }
    return pending;
}

/** The ranges of the comments of one text, up to the first line that is too long. */
function rangesOf(grammar, language, text) {
    const ranges = [];
    let stack = null;
    let at = 0;
    for (const found of [...text.matchAll(BREAK), null]) {
        const end = found === null ? text.length : found.index;
        if (end - at > LONG_LINE) return ranges;
        const result = grammar.tokenizeLine(text.slice(at, end), stack);
        stack = result.ruleStack;
        let open = null;
        for (const token of result.tokens) {
            const docstring =
                language === 'python' &&
                token.scopes.some((scope) => scope.startsWith('string.quoted.docstring.'));
            const comment = token.scopes.some((scope) => scope.startsWith('comment.'));
            const kind = docstring ? 1 : comment ? 0 : -1;
            const from = at + token.startIndex;
            const to = at + Math.min(token.endIndex, end - at);
            if (to <= from) continue;
            if (open !== null && open.kind === kind && open.to === from) {
                open.to = to;
                continue;
            }
            if (open !== null) ranges.push(open.from, open.to, open.kind);
            open = kind < 0 ? null : { from, to, kind };
        }
        if (open !== null) ranges.push(open.from, open.to, open.kind);
        if (found !== null) at = found.index + found[0].length;
    }
    return ranges;
}

/** The answer to one request: its ranges, or the first line of why it failed. */
async function answer(request) {
    try {
        await load(request.language);
        const grammar = (await held()).getLanguage(request.language);
        return { id: request.id, ranges: rangesOf(grammar, request.language, request.text) };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { id: request.id, error: message.split('\n')[0] };
    }
}

let queue = Promise.resolve();
parentPort?.on('message', (request) => {
    queue = queue
        .then(async () => parentPort?.postMessage(await answer(request)))
        .catch(() => undefined);
});
