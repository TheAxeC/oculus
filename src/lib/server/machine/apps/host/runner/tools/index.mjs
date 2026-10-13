// Layer 2, server. The tools' part of the object a host's `activate(oculus)` receives: the value
// classes of VS Code's API (`Uri`, `Range`, `Position`, `EventEmitter` and the rest), and the
// namespaces `oculus.languages`, `oculus.debug`, `oculus.tasks`, `oculus.scm` and the additions to
// `oculus.workspace` and `oculus.window` that reach the tools. The runner (host-runner.mjs) imports
// it before it installs its import guard and merges what it returns with the shell part.
//
// Each namespace is its own module and registers its own requests on the connection; this module
// makes the streams they share and hands each its parts.

import { createStreams } from '../streams.mjs';
import { createChildren } from './children.mjs';
import { TextDocument } from '../values/document.mjs';
import * as events from '../values/events.mjs';
import * as features from '../values/features.mjs';
import * as ranges from '../values/position-range.mjs';
import * as text from '../values/text.mjs';
import { Uri } from '../values/uri.mjs';
import { bridge, createServerClient } from './languages/servers.mjs';
import { createProviders } from './languages/providers.mjs';
import { createDebug } from './debug.mjs';
import { createDecorations } from './decorations.mjs';
import { createScm } from './scm.mjs';
import { createTasks } from './tasks.mjs';
import { createTerminals } from './terminals.mjs';
import { createWorkspace, RelativePattern } from './workspace.mjs';
import * as run from '../values/run.mjs';

/**
 * Objects joined with their getters kept as getters, so a member such as `terminals` reads the
 * current value each time the app reads it.
 */
export function joined(...parts) {
    const into = {};
    for (const part of parts) Object.defineProperties(into, Object.getOwnPropertyDescriptors(part));
    return into;
}

/** The value classes and enums every namespace uses, by the names VS Code gives them. */
function values() {
    return {
        ...events,
        ...features,
        ...ranges,
        ...text,
        ...run,
        Uri,
        TextDocument,
        RelativePattern
    };
}

/**
 * The tools part.
 * @param {{
 *   connection: any, report: (e: unknown) => void, note: (line: string) => void,
 *   texts: () => Record<string, string>, rpc: any,
 *   shell: { execute: (id: string, args: unknown[]) => Promise<unknown> },
 * }} link
 */
export function createTools(link) {
    const { connection, report, note } = link;
    const streams = createStreams({ connection, note, texts: link.texts });
    const children = createChildren();
    const sync = async (uri) => {
        try {
            const read = await connection.sendRequest('oculus/workspace/fs', {
                op: 'readDocument',
                uri: uri.toString()
            });
            return { languageId: read.languageId, text: read.text };
        } catch {
            return null;
        }
    };
    const workspace = createWorkspace({ connection, report, rpc: link.rpc, sync });
    const providers = createProviders({
        connection,
        report,
        note,
        documents: workspace.documents,
        events: workspace.documentEvents,
        sync
    });
    const terminals = createTerminals({ connection, report, streams });
    const tasks = createTasks({ connection, report, terminals });
    const debug = createDebug({ connection, report, streams, rpc: link.rpc, children });
    const scm = createScm({ connection, report, shell: link.shell });
    const decorations = createDecorations({ connection, report });
    const clients = new Map();
    const PROVIDERS = 'providers';

    const languages = {
        ...providers.api,
        registerLanguageServer(id, options) {
            if (clients.has(id)) throw new Error('refused:registered');
            const made = createServerClient({
                id,
                options,
                connection,
                streams,
                rpc: link.rpc,
                children,
                report,
                note
            });
            clients.set(id, made);
            return made.client;
        },
        async getLanguages() {
            return connection.sendRequest('oculus/languages/list', {});
        }
    };

    connection.onRequest('oculus/languages/start', async (params) => {
        if (params.server === PROVIDERS) {
            const stream = await streams.make('languageServer', {
                token: params.token,
                server: PROVIDERS,
                root: params.root
            });
            const entry = bridge(stream, providers.instance(), {
                pending: new Map(),
                requestHandlers: new Map(),
                noticeHandlers: new Map(),
                report,
                gone: () => undefined
            });
            entry.folder = params.root;
            return { stream: stream.id };
        }
        const made = clients.get(params.server);
        if (made === undefined) throw new Error('missing');
        return made.start(params);
    });

    return {
        values: values(),
        streams,
        /** The object an argument names in the terminals or the debug sessions, or undefined. */
        revive: (value) => terminals.revive(value) ?? debug.revive(value),
        workspace,
        api: {
            languages,
            workspace: workspace.api,
            window: joined(terminals.api, decorations.api),
            debug: debug.api,
            tasks: tasks.api,
            scm: scm.api
        },
        /** Hold what the first activation carried. */
        start(folders) {
            workspace.start(folders);
            void terminals.start();
        },
        /** End everything the tools hold when the host stops. */
        stop() {
            decorations.stop();
            tasks.stop();
            debug.stop();
            scm.stop();
            terminals.stop();
            streams.closeAll();
        }
    };
}
