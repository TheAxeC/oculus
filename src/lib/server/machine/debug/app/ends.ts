// Layer 2, server. The sentences a session ends with, from what is known when it does: the
// adapter's messages did not read, a request failed, the adapter exited with a code or a signal,
// the reader stopped it, or an app's adapter lost its stream.

import { words } from '../../../core/words.ts';
import type { WireFailure } from '../wire.ts';

/** How a session's end is worded in the console: as news or as an error. */
export type EndKind = 'console' | 'error';

/** The sentence for bytes of the adapter that did not read. */
export function failureText(catalog: Record<string, string>, failure: WireFailure): string {
    return {
        'bad-header': words(catalog, 'server.debug.bad_header'),
        'not-json': words(catalog, 'server.debug.not_json'),
        'not-message': words(catalog, 'server.debug.not_message'),
        partial: words(catalog, 'server.debug.partial')
    }[failure];
}

/** What is known of an adapter that ended. */
export type Exit = {
    failure: string | null;
    stopping: boolean;
    /** Whether the adapter itself said the program ended. */
    ended: boolean;
    /** Whether the adapter is an app's, whose stream reports no exit status. */
    app: boolean;
    code: number | null;
    signal: NodeJS.Signals | null;
};

/** The sentence an exit ends the session with, and how it is worded. */
export function exitText(
    catalog: Record<string, string>,
    exit: Exit
): { text: string; kind: EndKind } {
    if (exit.failure !== null) return { text: exit.failure, kind: 'error' };
    if (exit.stopping) return { text: words(catalog, 'server.debug.stopped'), kind: 'console' };
    if (exit.signal !== null) {
        return { text: words(catalog, 'server.debug.signal', exit.signal), kind: 'error' };
    }
    if (exit.code !== null && exit.code !== 0) {
        return { text: words(catalog, 'server.debug.exit_code', exit.code), kind: 'error' };
    }
    if (exit.app && exit.code === null && !exit.ended) {
        return { text: words(catalog, 'server.debug.adapter_lost'), kind: 'error' };
    }
    return { text: words(catalog, 'server.debug.finished'), kind: 'console' };
}
