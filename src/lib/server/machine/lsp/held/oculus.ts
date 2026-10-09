// Layer 2, server. What the relay does with the page's own messages on a language's channel
// beside the JSON-RPC ones: restarting a server, the log of its output, the library files the page
// reads, the choices of a root and the approvals it asks (choices.ts). The server of a root is the
// one the page opened a document of that language on; a message about a root with none running
// only answers with the root's choices.
// The `links` request of a move in the Files view is the relay's own (held/requests/links.ts).

import type { LspToPage, LspToServer } from '../../../../data/model/index.ts';
import { serverFacts } from '../../../../data/prose/lsp-servers.ts';
import type { ChangeLog } from '../../../core/changes.ts';
import { applyApprove, applyChoose, applyRevoke, sendChoices } from '../choices.ts';
import { readLibrary } from '../library/read.ts';
import type { RootEnv, ServerEntry } from '../servers.ts';
import type { ServedRoot } from '../uris.ts';
import { languageOf } from '../wire.ts';
import { heldKey, type Held, type Page } from './held.ts';

/** What the messages read of the relay. */
export type OculusContext = {
    roots(): ServedRoot[];
    env(root: ServedRoot): RootEnv;
    changes(): ChangeLog | undefined;
    send(page: Page, channel: string, payload: LspToPage): void;
};

/** The server of a root key the page named, and the root. */
export function heldOf(
    roots: readonly ServedRoot[],
    page: Page,
    entry: ServerEntry,
    key: string
): { root?: ServedRoot; held?: Held } {
    const root = roots.find((one) => one.key === key);
    return { root, held: root === undefined ? undefined : page.helds.get(heldKey(entry, root)) };
}

/**
 * The servers of the same root that depend on the approval a message makes or takes back, which
 * start again with it.
 */
function followers(
    roots: readonly ServedRoot[],
    page: Page,
    entry: ServerEntry,
    message: Extract<LspToServer, { oculus: 'approve' | 'revoke' }>
): Held[] {
    const root = roots.find((one) => one.key === message.root);
    return [...page.helds.values()].filter(
        (one) =>
            one.entry !== entry &&
            one.root.real === root?.real &&
            serverFacts(one.entry.id).approvedBy === message.approval.kind
    );
}

/** One message of the page to the server of its channel's language. */
export async function handleOculus(
    context: OculusContext,
    page: Page,
    channel: string,
    entry: ServerEntry,
    message: LspToServer
): Promise<void> {
    const send = (payload: LspToPage): void => context.send(page, channel, payload);
    if (message.oculus === 'read') {
        send(
            await readLibrary(message, {
                library: page.library,
                language: languageOf(channel) ?? '',
                served: (key) => context.roots().some((one) => one.key === key)
            })
        );
        return;
    }
    if (message.oculus === 'held' || message.oculus === 'held_ask' || message.oculus === 'links') {
        return;
    }
    const { root, held } = heldOf(context.roots(), page, entry, message.root);
    if (root === undefined) return;
    const { adapter } = entry;
    const env = context.env(root);
    switch (message.oculus) {
        case 'restart':
            await held?.restart();
            return;
        case 'output':
        case 'output_off': {
            if (held === undefined) return;
            const asks = (page.outputs.get(held) ?? []).filter(
                (ask) => ask.channel !== channel || ask.root !== message.root
            );
            if (message.oculus === 'output') {
                asks.push({ channel, root: message.root });
                send({ oculus: 'output', root: message.root, lines: held.output, append: false });
            }
            page.outputs.set(held, asks);
            return;
        }
        case 'choices':
            await sendChoices(adapter, env, message.root, send);
            return;
        case 'choose':
            await applyChoose(adapter, env, message, held, context.changes(), send);
            return;
        case 'approve':
            await applyApprove(
                adapter,
                env,
                message,
                held,
                followers(context.roots(), page, entry, message),
                send
            );
            return;
        case 'revoke':
            await applyRevoke(
                adapter,
                env,
                message,
                held,
                followers(context.roots(), page, entry, message),
                send
            );
    }
}
