// Layer 2, client state. What a question to an app's host came to, read from the answer of
// `POST /api/app-host`: its value, or the word the server refused it with, `host_down` when the
// answer names none.

import type { Posted } from '../../shared/stores/shapes.ts';

/** What a question to a host came to: its value, or the word it was refused with. */
export type HostAnswer = { ok: true; value: unknown } | { ok: false; word: string };

/** The answer of the server read as a `HostAnswer`. */
export function hostAnswer(posted: Posted): HostAnswer {
    if (posted.ok && posted.body.ok === true) return { ok: true, value: posted.body.value };
    return {
        ok: false,
        word: typeof posted.body.word === 'string' ? posted.body.word : 'host_down'
    };
}
