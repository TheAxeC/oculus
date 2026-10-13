// Layer 2, server. What an app's host registers with the language tools: the servers it created
// with `oculus.languages.registerLanguageServer`, the one in-host server that serves every
// `register*Provider` call, the diagnostic collections and the languages it asks for.
//
// A server is held as the options the app gave: a `documentSelector`, the settings sections it is
// asked for and its `initializationOptions`. It is not started here. The language server relay
// (lsp/relay/) starts one server for each folder of the app's scope with the first document of a
// selected language, through `open`, which asks the host to make the server
// (`oculus/languages/start`) and gives back the `languageServer` stream the host opens for it.
//
// The providers an app registers are one server too, named `providers`. Its selector and the
// capabilities its providers answer are told by the host (`oculus/languages/providers`) whenever a
// provider is added or removed.

import { z } from 'zod';
import type { AppToolsHost, AppToolsServer } from '../../../../data/model/index.ts';
import { Refused, parsed, type HostHandler, type HostNotice } from '../host/connection.ts';
import type { HostTools } from './registry.ts';
import type { AppStream } from './streams.ts';

/** The id of the server that serves the providers of an app. */
const PROVIDERS = 'providers';

/** The milliseconds the host has to open the stream of a server it was asked to start. */
const START_MS = 10_000;

const selectorShape = z
    .array(
        z.object({
            language: z.string().default(''),
            pattern: z.string().default('')
        })
    )
    .max(64);

const registerShape = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('server'),
        id: z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),
        options: z.object({
            selector: selectorShape,
            output: z.string().max(200).default(''),
            sections: z.array(z.string().max(200)).max(64).default([]),
            initializationOptions: z.unknown().default(null)
        })
    }),
    z.object({
        kind: z.literal('collection'),
        id: z.string().min(1).max(200),
        options: z.unknown().optional()
    })
]);

const unregisterShape = z.object({
    kind: z.enum(['server', 'collection']),
    id: z.string().min(1)
});

const providersShape = z.object({
    selector: selectorShape,
    capabilities: z.record(z.string(), z.unknown())
});

const diagnosticsShape = z.object({
    collection: z.string().min(1),
    uri: z.string().min(1),
    diagnostics: z.array(z.record(z.string(), z.unknown())).max(10_000)
});

/** A server of an app as the relay reads it. */
export type AppServerReg = {
    /** The view id of the app. */
    app: string;
    /** The root key the app is confined to; empty for a machine app. */
    root: string;
    id: string;
    /** The name the status item and the diagnostics' source show. */
    name: string;
    selector: readonly { language: string; pattern: string }[];
    sections: readonly string[];
    initializationOptions: unknown;
    /** The capabilities of the in-host providers; null for a server the app made itself. */
    capabilities: Record<string, unknown> | null;
};

/** The diagnostics an app's collection holds for a file, as the host last set them. */
export type CollectionDiagnostics = {
    app: string;
    collection: string;
    uri: string;
    diagnostics: Record<string, unknown>[];
};

/** What the language tools of one host hold, and what the relay asks of them. */
export type LanguageTools = {
    handlers: Record<string, HostHandler>;
    notices: Record<string, HostNotice>;
    /** The servers registered, the providers' first. */
    servers(): AppServerReg[];
    /** The diagnostics each collection holds, by file URI. */
    collections(): Map<string, Map<string, Record<string, unknown>[]>>;
    /** Ask the host to start the server for a folder; the stream it opens. */
    open(server: string, root: string): Promise<AppStream>;
    fill(into: AppToolsHost): void;
    stop(): void;
};

/** The language tools of one host. */
export function languageTools(
    host: HostTools,
    heard: (diagnostics: CollectionDiagnostics) => void
): LanguageTools {
    const servers = new Map<string, AppServerReg>();
    const collections = new Map<string, Map<string, Record<string, unknown>[]>>();
    let providers: AppServerReg | null = null;

    const handlers: Record<string, HostHandler> = {
        'oculus/languages/register': (params) => {
            const app = host.app();
            const body = parsed(registerShape, params);
            if (body.kind === 'collection') {
                if (collections.has(body.id)) throw new Refused('refused:registered');
                collections.set(body.id, new Map());
            } else {
                if (servers.has(body.id) || body.id === PROVIDERS) {
                    throw new Refused('refused:registered');
                }
                servers.set(body.id, {
                    app: app.id,
                    root: app.row.root,
                    id: body.id,
                    name: body.options.output === '' ? body.id : body.options.output,
                    selector: body.options.selector,
                    sections: body.options.sections,
                    initializationOptions: body.options.initializationOptions,
                    capabilities: null
                });
            }
            host.changed();
            return null;
        },
        'oculus/languages/unregister': (params) => {
            host.app();
            const body = parsed(unregisterShape, params);
            if (body.kind === 'server') servers.delete(body.id);
            else if (collections.delete(body.id)) {
                host.notify('oculus/languages/cleared', { collection: body.id });
            }
            host.changed();
            return null;
        },
        'oculus/languages/providers': (params) => {
            const app = host.app();
            const body = parsed(providersShape, params);
            providers =
                Object.keys(body.capabilities).length === 0
                    ? null
                    : {
                          app: app.id,
                          root: app.row.root,
                          id: PROVIDERS,
                          name: app.row.title,
                          selector: body.selector,
                          sections: [],
                          initializationOptions: null,
                          capabilities: body.capabilities
                      };
            host.changed();
            return null;
        },
        'oculus/languages/list': () => [...host.scope.env.languages().values()]
    };

    const notices: Record<string, HostNotice> = {
        'oculus/languages/diagnostics': (params) => {
            const app = host.app();
            const body = parsed(diagnosticsShape, params);
            const own = collections.get(body.collection);
            if (own === undefined) return;
            if (body.diagnostics.length === 0) own.delete(body.uri);
            else own.set(body.uri, body.diagnostics);
            heard({ app: app.id, ...body });
        }
    };

    return {
        handlers,
        notices,
        servers: () => [...(providers === null ? [] : [providers]), ...servers.values()],
        collections: () => collections,
        async open(server, root) {
            const wanted = host.streams.expect(START_MS);
            try {
                await host.request('oculus/languages/start', { server, root, token: wanted.token });
                return await wanted.stream;
            } catch (error) {
                wanted.cancel();
                throw error;
            }
        },
        fill(into) {
            const shown = (one: AppServerReg): AppToolsServer => ({
                id: one.id,
                selector: [...one.selector],
                output: one.name,
                sections: [...one.sections]
            });
            into.servers = [...servers.values()].map(shown);
            into.providers =
                providers === null
                    ? null
                    : {
                          selector: [...providers.selector],
                          capabilities: providers.capabilities ?? {}
                      };
            into.collections = [...collections.keys()];
        },
        stop() {
            servers.clear();
            collections.clear();
            providers = null;
        }
    };
}
