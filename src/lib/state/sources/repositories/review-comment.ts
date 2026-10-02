// Layer 2, client state. A comment on a line of a session's diff, from the words a reader writes to
// the prompt the session receives: the prompt's text, the refusal that holds on both ways of
// sending it, the send itself (typed into the session's oculus terminal when it runs in one,
// copied to the clipboard otherwise), the guard that keeps one box from sending twice, the line
// each outcome says, and the keys the comment box takes. The diff view draws the box and presses;
// every rule of what is sent and said lives here, with each dependency of a send handed in, so the
// page, the terminal and the clipboard are never reached by a test.
//
// The prompt is `<path>:<line>: <text>`, the form a compiler and an agent both read as a place. The
// refusal is the steer's own (data/model's STEER_MAX and STEER_CONTROL, which the server checks the
// same text against), so the clipboard is never handed what the terminal would refuse.

import { STEER_CONTROL, STEER_MAX } from '../../../data/model/index.ts';
import { t } from '../../shared/words/text.ts';

/** The side of a diff a comment is on: the version being changed to, or the one before. */
export type DiffSide = 'modified' | 'original';

/** One comment: the file and line it is on, the side and diff it is on, and what it says. */
type ReviewComment = {
    path: string;
    line: number;
    side: DiffSide;
    /** Whether the diff is the staged one, whose modified side is the index. */
    staged: boolean;
    text: string;
};

/** The id of the bar the comment box is drawn in, among the hunk bars of its section. */
export const COMMENT_BAR = 'comment';

/** How long the line saying where a comment went stays, in milliseconds. */
export const NOTICE_MS = 5000;

/** The path a comment on one side of a file names: the old path before the change. */
export function pathOfSide(file: { oldPath: string; newPath: string }, side: DiffSide): string {
    const [wanted, other] =
        side === 'original' ? [file.oldPath, file.newPath] : [file.newPath, file.oldPath];
    return wanted === '' ? other : wanted;
}

/**
 * An agent's prompt box reads these first characters as a shell, a memory, a mention or a command.
 */
const READ_AS_COMMAND = /^[!#@/]/;

/**
 * The prompt a comment becomes. A blank comment is the empty prompt, which `commentRefusal`
 * refuses.
 */
export function commentPrompt(comment: ReviewComment): string {
    const text = comment.text.trim();
    if (text === '') return '';
    const path = READ_AS_COMMAND.test(comment.path) ? `./${comment.path}` : comment.path;
    let mark = '';
    if (comment.side === 'original') mark = ' (before the change)';
    else if (comment.staged) mark = ' (staged)';
    return `${path}:${String(comment.line)}${mark}: ${text}`;
}

/** What makes a prompt unsendable: no words in it, a character the steer refuses, or too long. */
type Refusal = 'empty' | 'control' | 'long';

/**
 * Why a prompt is not sent, or null when it may be, on the terminal path and the clipboard path.
 */
export function commentRefusal(prompt: string): Refusal | null {
    if (prompt.trim() === '') return 'empty';
    if (STEER_CONTROL.test(prompt)) return 'control';
    if (prompt.length > STEER_MAX) return 'long';
    return null;
}

/** The sentence for a refusal that leaves the box open; the empty one says nothing. */
export function refusalLine(refusal: Refusal): string {
    if (refusal === 'control') return t('sessions.comment_control');
    if (refusal === 'long') return t('sessions.comment_long', STEER_MAX);
    return '';
}

/** What the terminal answered a steer: whether it took it, and what it said when it did not. */
type SteerAnswer = { ok: boolean; error: string };

/** What a send needs of the page, each a function so a case can pass its own. */
export type SendDeps = {
    /** The oculus terminal the session runs in now, or null when it runs elsewhere. */
    terminal: () => { id: string } | null;
    /** Type a message into a terminal and press Enter. */
    steer: (id: string, text: string) => Promise<SteerAnswer>;
    /** Put a text on the clipboard; null where the browser has none. */
    copy: ((text: string) => Promise<void>) | null;
};

/** How a send ended. */
type SendResult =
    { kind: 'sent' } | { kind: 'copied' } | { kind: 'failed'; error: string } | { kind: 'refused' };

/**
 * Send a prompt: typed into the session's terminal when it has one, else copied. A terminal that
 * answers badly is a failure with what it said (empty when it said nothing), and a clipboard that
 * is absent, rejects or throws is a refusal.
 */
export async function sendComment(prompt: string, deps: SendDeps): Promise<SendResult> {
    const terminal = deps.terminal();
    if (terminal !== null) {
        try {
            const answer = await deps.steer(terminal.id, prompt);
            return answer.ok ? { kind: 'sent' } : { kind: 'failed', error: answer.error };
        } catch (error) {
            return {
                kind: 'failed',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    if (deps.copy === null) return { kind: 'refused' };
    try {
        await deps.copy(prompt);
        return { kind: 'copied' };
    } catch {
        return { kind: 'refused' };
    }
}

/** The page's clipboard writer, or null outside a secure context, where there is no clipboard. */
export function browserCopy(): ((text: string) => Promise<void>) | null {
    if (typeof navigator === 'undefined') return null;
    const clipboard = (navigator as { clipboard?: Clipboard }).clipboard;
    if (clipboard === undefined) return null;
    return (text) => clipboard.writeText(text);
}

/**
 * The sends of one comment box. Only one is in flight at a time, and a send whose box was closed,
 * moved or dropped before it landed is superseded: it still ends, but hands nothing back.
 */
type SendGuard = {
    /** The token of a send that may start, or null while another is in flight. */
    begin: () => number | null;
    /** Whether a send begun with this token still belongs to the box that is open. */
    holds: (token: number) => boolean;
    /** The send ended, however it ended. */
    end: () => void;
    /** The box closed, moved or went: what is in flight no longer belongs to it. */
    cancel: () => void;
};

/** A guard with nothing in flight. */
export function sendGuard(): SendGuard {
    let flying = false;
    let epoch = 0;
    return {
        begin() {
            if (flying) return null;
            flying = true;
            return epoch;
        },
        holds: (token) => token === epoch,
        end() {
            flying = false;
        },
        cancel() {
            epoch += 1;
        }
    };
}

/**
 * Send a prompt under a guard: null when another send is in flight or when the box this one
 * belonged to has closed, moved or gone by the time it ended.
 */
export async function sendOnce(
    guard: SendGuard,
    prompt: string,
    deps: SendDeps
): Promise<SendResult | null> {
    const token = guard.begin();
    if (token === null) return null;
    try {
        const result = await sendComment(prompt, deps);
        return guard.holds(token) ? result : null;
    } finally {
        guard.end();
    }
}

/** What a session is called in the box's head and in the lines about a send. */
export function commentTitle(session: { id: string; title: string }): string {
    return session.title === '' ? session.id : session.title;
}

/**
 * The line a send ends with, and whether the box is done: a comment that went to the terminal or
 * to the clipboard closes the box and says where it went; one that did not keeps the box and says
 * why.
 */
export function commentOutcome(result: SendResult, title: string): { done: boolean; line: string } {
    if (result.kind === 'sent') return { done: true, line: t('sessions.comment_sent', title) };
    if (result.kind === 'copied') return { done: true, line: t('sessions.comment_copied', title) };
    if (result.kind === 'refused') return { done: false, line: t('sessions.comment_clipboard') };
    return {
        done: false,
        line: result.error === '' ? t('sessions.comment_silent') : result.error
    };
}

/** A bar of a diff editor, as the editor takes it. */
type CommentBarShape = {
    id: string;
    after: number;
    side?: DiffSide;
    order?: number;
};

/**
 * The bars of a section with the comment box's added after the commented line of its side, ordered
 * below a hunk bar after the same line.
 */
export function commentBars(
    bars: readonly CommentBarShape[],
    at: { side: DiffSide; line: number } | null
): CommentBarShape[] {
    if (at === null) return [...bars];
    return [...bars, { id: COMMENT_BAR, after: at.line, side: at.side, order: 1 }];
}

/** What a key in the comment box asks: Ctrl or Cmd with Enter sends, Escape closes. */
export function commentKey(event: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
}): 'send' | 'close' | null {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) return 'send';
    if (event.key === 'Escape') return 'close';
    return null;
}
