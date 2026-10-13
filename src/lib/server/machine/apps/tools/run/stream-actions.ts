// Layer 2, server. What POST /api/terminal and GET /api/terminal?busy= do to a terminal that is a
// `terminal` stream to an app's host (stream-terminals.ts) instead of a tmux session: stop it,
// rename it, give it an icon and a colour, clear what the server keeps of its output, type into
// it, interrupt it and ask whether it is busy. The same words refuse the same things as for a tmux
// terminal (pty/edit.ts): a title with a control character, an icon outside the glyph vocabulary
// and a colour outside the eight. A stream terminal has no size of its own to set, since the
// smallest size of the pages that show it is what the host is told (the channel reports it), so a
// resize request is answered and changes nothing.

import { json } from '@sveltejs/kit';
import { TERMINAL_COLORS } from '../../../../../data/model/index.ts';
import { refusal } from '../../../pty/refusal.ts';
import type { StreamTerminalSet } from './stream-terminals.ts';

const NO_STORE = { 'cache-control': 'no-store' };

/** The longest title a terminal may carry. */
const TITLE_MAX = 80;

/** The byte a terminal reads as an interrupt. */
const INTERRUPT = Buffer.from([0x03]);

/** What the actions need of the set and of the process. */
export type StreamActionsEnv = {
    streams: StreamTerminalSet;
    /** The names of the glyph vocabulary an icon may be. */
    glyphs: () => string[];
};

/** The actions of the endpoint that a stream terminal answers itself. */
const ACTIONS = ['stop', 'rename', 'restyle', 'clear', 'resize', 'steer', 'interrupt'];

/**
 * The answer to a request that names a stream terminal, or null when the request is not one:
 * the id is not a stream terminal's, or the action is not one a stream terminal answers here.
 */
export function streamAction(
    message: Record<string, unknown>,
    env: StreamActionsEnv
): Response | null {
    const id = message.id;
    if (typeof id !== 'string' || !env.streams.has(id)) return null;
    const action = message.action;
    if (typeof action !== 'string' || !ACTIONS.includes(action)) return null;
    const done = () => json({ ok: true, id }, { headers: NO_STORE });
    if (action === 'stop') {
        env.streams.close(id);
        return done();
    }
    if (action === 'rename') {
        const title = message.title;
        // eslint-disable-next-line no-control-regex
        if (typeof title !== 'string' || /[\u0000-\u001f\u007f]/.test(title.trim())) {
            return refusal('bad-terminal');
        }
        if (title.trim().length > TITLE_MAX) return refusal('bad-terminal');
        env.streams.style(id, { title: title.trim() });
        return done();
    }
    if (action === 'restyle') {
        const { icon, color } = message;
        const bad =
            (icon === undefined && color === undefined) ||
            (icon !== undefined &&
                (typeof icon !== 'string' || (icon !== '' && !env.glyphs().includes(icon)))) ||
            (color !== undefined &&
                (typeof color !== 'string' ||
                    (color !== '' && !(TERMINAL_COLORS as readonly string[]).includes(color))));
        if (bad) return refusal('bad-terminal');
        env.streams.style(id, {
            ...(typeof icon === 'string' ? { icon } : {}),
            ...(typeof color === 'string' ? { color } : {})
        });
        return done();
    }
    if (action === 'clear') {
        env.streams.clear(id);
        return done();
    }
    if (action === 'steer') {
        const text = typeof message.text === 'string' ? message.text : '';
        env.streams.input(id, Buffer.from(`${text}\r`, 'utf8'));
        return done();
    }
    if (action === 'interrupt') {
        env.streams.input(id, INTERRUPT);
        return done();
    }
    return done();
}

/**
 * Whether each stream terminal named runs: one that has not ended is busy with no program named.
 */
export function streamBusy(
    ids: string[],
    streams: StreamTerminalSet
): { id: string; busy: boolean; command: string }[] {
    return ids.map((id) => ({
        id,
        busy: streams.record(id)?.exit === null,
        command: ''
    }));
}
