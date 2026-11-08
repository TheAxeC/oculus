// Layer 2, server. What POST /api/terminal refuses with: one word of TERMINAL_REFUSALS, and the
// names a sentence needs. A validator that rejects a field throws a plain Error, which is
// `bad-terminal`; a check that knows the cause throws TerminalRefused with its word; a failed tmux
// call reaches this module as TmuxFailed, because the route hands every handler a runner that wraps
// tmux's failure. A failed tmux call of an action that starts a terminal is a terminal that did not
// start, and carries as its one name tmux's own first line (or the catalogue's words for a call
// tmux said nothing in), which the page quotes inside the catalogue's sentence, as git's and ssh's
// causes are quoted; no other text of an engine is a name. Any other failed tmux call, and a failed
// call on a terminal a start action has already started (the composer's typed prompt, which the
// route answers through `heldRefusal`), is told apart by asking whether that terminal is still
// there: a terminal tmux no longer has has ended, and any other failure is the terminal's own. The
// page says the sentence the catalog holds for the word (state/shared/answers/terminal-words.ts).

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

/**
 * A tmux call that failed: its message is the failure's own text, for whoever reads the server's
 * log, and `said` what a page may be told of it (tmux.ts `tmuxFailureWords`).
 */
export class TmuxFailed extends Error {
    readonly said: string;

    constructor(message: string, said: string) {
        super(message);
        this.said = said;
    }
}

/** The actions of POST /api/terminal that start a terminal. */
const STARTS: readonly unknown[] = [
    'start',
    'task',
    'compose',
    'chat',
    'command',
    'latex',
    'resume',
    'fork'
];

/** The word a text is, or null for any other text. */
function wordOf(text: unknown): TerminalRefusal | null {
    return TERMINAL_REFUSALS.find((one) => one === text) ?? null;
}

/** The answer that carries one word and the names its sentence needs, a 400 unless told another. */
export function refusal(word: Word, names: string[] = [], status = 400): Response {
    const body = names.length === 0 ? { error: word } : { error: word, names };
    return json(body, { status, headers: NO_STORE });
}

/**
 * The refusal of a failed tmux call on a terminal that had started: `terminal-failed` while the
 * terminals `list` reads still hold `id`, and `terminal-ended` once they do not.
 */
export async function heldRefusal(id: unknown, list: () => Promise<Terminal[]>): Promise<Response> {
    const held = typeof id === 'string' && (await list()).some((one) => one.id === id);
    return refusal(held ? 'terminal-failed' : 'terminal-ended');
}

/**
 * The refusal a failed handler answers with. `id` is the terminal the request names, `action` the
 * request's action, and `list` reads the terminals tmux holds now, which is asked only for a failed
 * tmux call of an action that starts no terminal.
 */
export async function refusalFor(
    error: unknown,
    id: unknown,
    action: unknown,
    list: () => Promise<Terminal[]>
): Promise<Response> {
    if (error instanceof TerminalRefused) return refusal(error.word, error.names);
    if (error instanceof TmuxFailed && STARTS.includes(action)) {
        return refusal('terminal-not-started', error.said === '' ? [] : [error.said]);
    }
    if (error instanceof TmuxFailed) return await heldRefusal(id, list);
    const word = error instanceof Error ? wordOf(error.message) : null;
    return refusal(word ?? 'bad-terminal');
}
