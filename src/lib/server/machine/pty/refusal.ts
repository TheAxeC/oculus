// Layer 2, server. What POST /api/terminal refuses with: one word of TERMINAL_REFUSALS, and the
// names a sentence needs, never the text of an engine. A validator that rejects a field throws a
// plain Error, which is `bad-terminal`; a check that knows the cause throws TerminalRefused with
// its word; a failed tmux call reaches this module as TmuxFailed, because the route hands every
// handler a runner that wraps tmux's failure, and is told apart by asking whether the terminal the
// request names is still there: a terminal tmux no longer has has ended, and any other failure is
// the terminal's own. The page says the sentence the catalog holds for the word
// (state/shared/answers/terminal-words.ts).

import { json } from '@sveltejs/kit';
import {
    TERMINAL_REFUSALS,
    type Terminal,
    type TerminalRefusal
} from '../../../data/model/index.ts';
import type { LatexRefusal } from '../../../data/prose/latex.ts';

/**
 * Every word this endpoint answers: its own, and the words the file and LaTeX endpoints already
 * have sentences for: the two a folder of a root is refused with, and the ones of a LaTeX action.
 */
export type Word = TerminalRefusal | LatexRefusal | 'not-an-action' | 'outside' | 'missing';

const NO_STORE = { 'cache-control': 'no-store' };

/** A refusal whose cause the thrower knows: its word and the names its sentence is about. */
export class TerminalRefused extends Error {
    readonly word: TerminalRefusal;
    readonly names: string[];

    constructor(word: TerminalRefusal, names: string[] = []) {
        super(word);
        this.word = word;
        this.names = names;
    }
}

/** A tmux call that failed, holding tmux's own text for whoever reads the server's log. */
export class TmuxFailed extends Error {}

/** The word a text is, or null for any other text. */
function wordOf(text: unknown): TerminalRefusal | null {
    return TERMINAL_REFUSALS.find((one) => one === text) ?? null;
}

/** The 400 answer that carries one word and the names its sentence needs. */
export function refusal(word: Word, names: string[] = []): Response {
    const body = names.length === 0 ? { error: word } : { error: word, names };
    return json(body, { status: 400, headers: NO_STORE });
}

/**
 * The refusal a failed handler answers with. `id` is the terminal the request names, and `list`
 * reads the terminals tmux holds now, which is asked only for a failed tmux call.
 */
export async function refusalFor(
    error: unknown,
    id: unknown,
    list: () => Promise<Terminal[]>
): Promise<Response> {
    if (error instanceof TerminalRefused) return refusal(error.word, error.names);
    if (error instanceof TmuxFailed) {
        const held = typeof id === 'string' && (await list()).some((one) => one.id === id);
        return refusal(held ? 'terminal-failed' : 'terminal-ended');
    }
    const word = error instanceof Error ? wordOf(error.message) : null;
    return refusal(word ?? 'bad-terminal');
}
