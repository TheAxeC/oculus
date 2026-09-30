// Layer 2, client state. The two requests the terminals store makes of /api/terminal that carry no
// state of their own: an action posted with the write token, answered as ok or as the server's
// words, and the busy read that says which terminals run a program other than their shell. Both go
// through `fetch`, which a test replaces.

import type { Terminal } from '../../../data/model/index.ts';

/** What an action answered: the terminal it names, or what the server refused it with. */
export type TerminalAnswer = {
    ok: boolean;
    /** The terminal the action was about, empty when the server refused before naming one. */
    id: string;
    /** What went wrong, or the empty string. Already the server's words. */
    error: string;
    /** The terminal a start answered, when it did. */
    terminal?: Terminal;
};

/** A terminal running a program other than its shell, and the program; empty when unread. */
export type BusyTerminal = { id: string; name: string; command: string };

/**
 * Post one action with the write token. A page rendered on the server has no fetch and posts
 * nothing.
 */
export async function postTerminal(body: unknown, token: string): Promise<TerminalAnswer> {
    if (typeof fetch !== 'function') return { ok: false, id: '', error: '' };
    try {
        const response = await fetch('/api/terminal', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': token },
            body: JSON.stringify(body)
        });
        const answer = (await response.json()) as {
            ok?: boolean;
            id?: string;
            terminal?: Terminal;
            error?: string;
        };
        if (!response.ok) {
            const error = typeof answer.error === 'string' ? answer.error : String(response.status);
            return { ok: false, id: '', error };
        }
        return {
            ok: true,
            id: answer.terminal?.id ?? answer.id ?? '',
            error: '',
            terminal: answer.terminal
        };
    } catch (error) {
        return { ok: false, id: '', error: error instanceof Error ? error.message : String(error) };
    }
}

/** The most ids one busy read names; the server refuses more. */
const BUSY_READ = 64;

/**
 * Which of these terminals run a program other than their shell, from a fresh read of the server,
 * in groups of at most BUSY_READ ids. A group whose read fails names every terminal of it with no
 * program, so a close asks.
 */
export async function readBusy(
    ids: string[],
    labelOf: (id: string) => string
): Promise<BusyTerminal[]> {
    const found: BusyTerminal[] = [];
    for (let at = 0; at < ids.length; at += BUSY_READ) {
        const group = ids.slice(at, at + BUSY_READ);
        try {
            const response = await fetch(`/api/terminal?busy=${group.join(',')}`);
            if (!response.ok) throw new Error(String(response.status));
            const body = (await response.json()) as {
                busy?: { id: string; busy: boolean; command: string }[];
            };
            for (const one of body.busy ?? []) {
                if (!one.busy) continue;
                found.push({ id: one.id, name: labelOf(one.id), command: one.command });
            }
        } catch {
            for (const id of group) found.push({ id, name: labelOf(id), command: '' });
        }
    }
    return found;
}
