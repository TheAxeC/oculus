// Layer 2, server. GET and POST /api/state. A route module may export only its verbs, so everything
// the request does is here and src/routes/api/(machine)/state/+server.ts is the lines that join
// them.
//
// A GET answers the page state of the state folder whole (files.ts), with the version of the
// `state` channel it is at least as new as and a finding for each file that does not read; the
// page's load is handed the same read (`pageStateRead`). A POST carries the write token and one
// write (writes.ts), runs it behind the process's write chain and publishes on the `state` channel
// what the other pages are told of it.

import { json } from '@sveltejs/kit';
import type { Finding, PageStateRead, StatePayload } from '../../../../data/model/index.ts';
import { findingText } from '../../../../data/helpers/finding-text.ts';
import { tokenedBody } from '../../../core/auth.ts';
import type { Hub } from '../../../core/channels.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import { words } from '../../../core/words.ts';
import { readPageState } from './files.ts';
import { applyStateWrite, mergeState, pageStateWriteShape } from './writes.ts';

/** The channel a save of the page state is told on. */
const STATE_CHANNEL = 'state';

const NO_STORE = { 'cache-control': 'no-store' };

/** What the routes need of the process. */
export type StateRouteOptions = {
    /** The state folder, `~/.oculus` outside a test. */
    folder: string;
    /** The text catalog of the merged config, which words a finding and a refusal. */
    text: () => Record<string, string>;
    /** The process's write chain. */
    writes: FsWrites;
    hub: Hub;
};

/** The page state as a page reads it, with the findings of the files that do not read. */
export function pageStateRead(
    folder: string,
    text: Record<string, string>,
    hub: Hub
): PageStateRead {
    const unreadable = (file: string, reason: string): Finding => ({
        file,
        key: '',
        message: findingText(text, 'findings.workspace.page_state_unreadable', reason)
    });
    const version = hub.version(STATE_CHANNEL);
    const { state, findings } = readPageState(folder, unreadable);
    return { ...state, version, findings };
}

/** Register the `state` channel's pending-message policy on one process-owned hub. */
export function registerStateChannel(hub: Hub): void {
    hub.merge(STATE_CHANNEL, (held, next) => ({
        ...next,
        payload: mergeState(held.payload as StatePayload, next.payload as StatePayload)
    }));
}

export function handleStateGet(options: StateRouteOptions): Response {
    return json(pageStateRead(options.folder, options.text(), options.hub), {
        headers: NO_STORE
    });
}

export async function handleStatePost(
    request: Request,
    token: string,
    options: StateRouteOptions
): Promise<Response> {
    const text = options.text();
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: () => text });
    if (read instanceof Response) return read;
    const parsed = pageStateWriteShape.safeParse(read.body);
    if (!parsed.success) {
        return json(
            { ok: false, error: words(text, 'server.state.bad_write') },
            { status: 400, headers: NO_STORE }
        );
    }
    const applied = await chained(options.writes, () =>
        applyStateWrite(options.folder, parsed.data, {
            unreadable: (file) => words(text, 'server.state.unreadable', file),
            unwritable: (file, why) => words(text, 'server.state.unwritable', file, why)
        })
    );
    if (applied.told !== null) options.hub.publish(STATE_CHANNEL, applied.told);
    const refused = !applied.answer.ok && 'error' in applied.answer;
    return json(applied.answer, { status: refused ? 409 : 200, headers: NO_STORE });
}
