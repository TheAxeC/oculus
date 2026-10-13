// Layer 4, test helper. Apps that register language servers, and the relay that serves them: the
// server is a node program that answers the requests a case scripts and records every message it is
// sent to a file, the app's host is the real runner, and the relay is the real one over the host
// manager's tools. A case reads what the page was sent from the recording sink and what the server
// was sent from the log. The page's own transport (ui/controls/editor/kit/lsp/transport.ts) can be
// put between the relay and a recording stand-in for Monaco's client (`pageClients`), to read what
// the client is handed.
//
// Every folder is under the system temporary directory (tests/fixtures/scratch.ts).

import { readFileSync, existsSync, watch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Relay } from '../../../../../src/lib/server/machine/lsp/relay/relay.ts';
import { SchemaFeed } from '../../../../../src/lib/server/machine/lsp/schema-feed.ts';
import { createServers } from '../../../../../src/lib/server/machine/lsp/servers.ts';
import { appFeed } from '../../../../../src/lib/server/root/process/context/app-feed.ts';
import { latexBuild } from '../../../../../src/lib/data/sources/config/settings.ts';
import type { LspRpc } from '../../../../../src/lib/data/model/index.ts';
import { config } from '../../../../routes/apps/apps-fixture.ts';
import { frame, recordingSink, settle } from '../../lsp/lsp-fixture.ts';
import { world, type AppSpec, type World } from './hosts-world.ts';
import {
    LspTransport,
    type TransportHost
} from '../../../../../src/lib/ui/controls/editor/kit/lsp/transport';
import type { LspPort } from '../../../../../src/lib/ui/controls/editor/kit/lsp/services';
import type { LspModel } from '../../../../../src/lib/ui/controls/editor/kit/lsp/transport/messages';

/** The folder of the oculus package, whose own servers a shipped relay runs. */
const OWN = resolve(import.meta.dirname, '../../../../..');

/** How a scripted server answers. */
export type ServerScript = {
    capabilities?: Record<string, unknown>;
    /** The contents of a hover answer; none answers null. */
    hover?: string;
    /** The locations a definition request answers. */
    definition?: unknown;
    /** The items a completion request answers. */
    completion?: unknown[];
    /** Milliseconds a request waits before it is answered. */
    delay?: Partial<Record<'hover' | 'definition' | 'completion', number>>;
    /** The diagnostics published for a document when it opens. */
    diagnostics?: unknown[];
    /** The diagnostics for a document are published empty when a hover for it is asked. */
    clearOnHover?: boolean;
    /** The program exits right after `initialized`. */
    exitAfterInitialize?: boolean;
    /** Registers the hover capability dynamically after `initialized`. */
    dynamicHover?: boolean;
    /** The program stays up when its input closes and when it is asked to end. */
    stubborn?: boolean;
    /** The path of a named pipe the program holds open for writing until it ends. */
    lifeline?: string;
};

/** The text of a server program for a script; its first argument is the log file. */
export function serverProgram(script: ServerScript): string {
    return `
const fs = require('node:fs');
const SCRIPT = ${JSON.stringify(script)};
const log = process.argv[2];
const note = (m) => { if (log) fs.appendFileSync(log, JSON.stringify(m) + '\\n'); };
if (log) fs.writeFileSync(log + '.pid', String(process.pid));
if (SCRIPT.lifeline) fs.openSync(SCRIPT.lifeline, 'w');
if (SCRIPT.stubborn) { process.on('SIGTERM', () => {}); setInterval(() => {}, 1000000); }
let buf = Buffer.alloc(0);
const send = (m) => { const s = JSON.stringify(m); process.stdout.write('Content-Length: ' + Buffer.byteLength(s) + '\\r\\n\\r\\n' + s); };
const later = (kind, fn) => setTimeout(fn, (SCRIPT.delay || {})[kind] || 0);
process.stdin.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  for (;;) {
    const i = buf.indexOf('\\r\\n\\r\\n'); if (i < 0) return;
    const n = Number(/Content-Length: (\\d+)/.exec(buf.subarray(0, i).toString())[1]);
    if (buf.length < i + 4 + n) return;
    const m = JSON.parse(buf.subarray(i + 4, i + 4 + n).toString()); buf = buf.subarray(i + 4 + n);
    note(m);
    if (m.method === 'initialize') send({ jsonrpc: '2.0', id: m.id, result: { capabilities: SCRIPT.capabilities || {} } });
    else if (m.method === 'initialized') {
      if (SCRIPT.exitAfterInitialize) process.exit(3);
      if (SCRIPT.dynamicHover) send({ jsonrpc: '2.0', id: 'reg1', method: 'client/registerCapability', params: { registrations: [{ id: 'h', method: 'textDocument/hover' }] } });
    }
    else if (m.method === 'textDocument/hover' && SCRIPT.clearOnHover) send({ jsonrpc: '2.0', method: 'textDocument/publishDiagnostics', params: { uri: m.params.textDocument.uri, diagnostics: [] } });
    else if (m.method === 'textDocument/hover') later('hover', () => send({ jsonrpc: '2.0', id: m.id, result: SCRIPT.hover === undefined ? null : { contents: SCRIPT.hover } }));
    else if (m.method === 'textDocument/definition') later('definition', () => send({ jsonrpc: '2.0', id: m.id, result: SCRIPT.definition === undefined ? null : SCRIPT.definition }));
    else if (m.method === 'textDocument/completion') later('completion', () => send({ jsonrpc: '2.0', id: m.id, result: SCRIPT.completion || [] }));
    else if (m.method === 'textDocument/didOpen' && SCRIPT.diagnostics) send({ jsonrpc: '2.0', method: 'textDocument/publishDiagnostics', params: { uri: m.params.textDocument.uri, diagnostics: SCRIPT.diagnostics } });
    else if (m.method === 'shutdown') send({ jsonrpc: '2.0', id: m.id, result: null });
    else if (m.method === 'exit') process.exit(0);
  }
});
`;
}

/**
 * An app `name` that declares a language (`notes`, of `.note` files, unless `language` names
 * another with its extension) and registers a server for it with this script.
 */
export function languageApp(
    name: string,
    script: ServerScript,
    log: string,
    over: {
        title?: string;
        extra?: string;
        keys?: string;
        language?: { id: string; extension: string };
    } = {}
): AppSpec {
    const title = over.title ?? name;
    const language = over.language ?? { id: 'notes', extension: '.note' };
    return {
        keys: `activation: [onTab]\ncontributes:\n  languages:\n    - id: ${language.id}\n      extensions: ["${language.extension}"]\n${over.keys ?? ''}`,
        files: { 'server.js': serverProgram(script) },
        host: `import { fileURLToPath } from 'node:url';
export function activate(oculus) {
  const client = oculus.languages.registerLanguageServer('${name}', {
    outputChannelName: '${title}',
    documentSelector: [{ language: '${language.id}' }],
    serverOptions: { command: process.execPath, args: [fileURLToPath(new URL('./server.js', import.meta.url)), ${JSON.stringify(log)}] }
  });
  client.start();
${over.extra ?? ''}}
`
    };
}

/** The files of the app `name` planted as a root app of a root: under its `.oculus/apps` folder. */
export function asRootApp(name: string, spec: AppSpec): Record<string, string> {
    const base = `.oculus/apps/${name}`;
    const out: Record<string, string> = {
        [`${base}/app.yml`]: `name: ${name}\ntitle: ${name}\nbridge: 1\nhost: host.mjs\n${spec.keys ?? ''}`,
        [`${base}/index.html`]: '<!doctype html><title>a</title>\n',
        [`${base}/host.mjs`]: spec.host ?? 'export function activate() {}\n'
    };
    for (const [path, body] of Object.entries(spec.files ?? {})) out[`${base}/${path}`] = body;
    return out;
}

/** The messages a server was sent, from its log. */
export function sentTo(log: string): LspRpc[] {
    if (!existsSync(log)) return [];
    return readFileSync(log, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as LspRpc);
}

/**
 * Wait until what a server logged satisfies `accepts`, checked once at the call and again at each
 * change of the log's folder; resolves with the messages logged then.
 */
export function logged(log: string, accepts: (sent: LspRpc[]) => boolean): Promise<LspRpc[]> {
    return new Promise((resolve) => {
        const check = (): void => {
            const sent = sentTo(log);
            if (!accepts(sent)) return;
            watcher.close();
            resolve(sent);
        };
        const watcher = watch(dirname(log), check);
        check();
    });
}

/** What a frame to the page carries. */
export type Payload = LspRpc & Record<string, unknown>;

export type LanguageWorld = {
    w: World;
    relay: Relay;
    page: ReturnType<typeof recordingSink>;
    /** Send the page's frame on a channel. */
    send: (channel: string, message: LspRpc) => void;
    /** The file URI the relay names a file of the root `r`. */
    uri: (path: string) => string;
    /** Initialize the channel and open a document on it. */
    open: (channel: string, path: string, text?: string, version?: number) => void;
    /** Open a document of another root on a channel already initialized. */
    openIn: (channel: string, root: string, path: string, text?: string) => void;
    /** Wait until the page was sent a frame this accepts. */
    until: (accepts: (payload: Payload) => boolean) => Promise<void>;
    close: () => Promise<void>;
};

/** The relay over a world made with real hosts for these apps. */
export function languageWorld(
    specs: Record<string, AppSpec>,
    roots: Record<string, Record<string, string>> = { r: { 'a.note': 'hello\n' } },
    over: Parameters<typeof world>[2] & {
        /** Run oculus's own servers (a real node process) beside the apps'. */
        shipped?: boolean;
    } = {}
): LanguageWorld {
    const { shipped: _shipped, ...worldOver } = over;
    const w = world(specs, {}, { real: true, roots, ...worldOver });
    const { feed, attach } = appFeed();
    attach(w.hosts.tools, new SchemaFeed());
    const latex = () => latexBuild(config);
    const own = over.shipped === true ? OWN : '/oculus';
    const node = over.shipped === true ? process.execPath : '/node';
    const relay = new Relay({
        oculus: own,
        node,
        roots: () => w.fixture.roots,
        lspFolder: () => join(w.fixture.base, 'lsp'),
        approvals: () => join(w.fixture.base, 'approvals.json'),
        latex,
        env: over.shipped === true ? process.env : {},
        servers: createServers(
            over.shipped === true
                ? { oculus: own, node, latex }
                : { oculus: own, node, exists: () => true, latex }
        ),
        appServers: feed
    });
    relay.gate(() => true);
    const page = recordingSink();
    const send = (channel: string, message: LspRpc): void => {
        relay.inbound(page.sink, frame(channel, message));
    };
    return {
        w,
        relay,
        page,
        send,
        uri: (path) => `oculus-file:///r/${path}`,
        open(channel, path, text = 'hello\n', version = 1) {
            send(channel, {
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: { capabilities: {} }
            });
            send(channel, {
                jsonrpc: '2.0',
                method: 'textDocument/didOpen',
                params: {
                    textDocument: {
                        uri: `oculus-file:///r/${path}`,
                        languageId: 'notes',
                        version,
                        text
                    }
                }
            });
        },
        openIn(channel, root, path, text = 'hello\n') {
            send(channel, {
                jsonrpc: '2.0',
                method: 'textDocument/didOpen',
                params: {
                    textDocument: {
                        uri: `oculus-file:///${root}/${path}`,
                        languageId: 'notes',
                        version: 1,
                        text
                    }
                }
            });
        },
        until: (accepts) => page.arrival(accepts),
        async close() {
            await relay.close();
            await w.hosts.close();
            await settle();
        }
    };
}

/** The page's transport of one language channel over the relay, and what it handed its client. */
export type PageClient = {
    transport: LspTransport;
    /** The messages the transport handed the client, in order. */
    handed: LspRpc[];
    /** The messages the transport wrote to the relay, in order. */
    written: LspRpc[];
    /** Register the model of a file of the root `r`, which puts the file on the servers. */
    open: (path: string, text?: string) => LspModel;
    /** Wait until a message handed to the client or written to the relay is one `accepts` takes. */
    seen: (accepts: (message: LspRpc) => boolean) => Promise<void>;
};

/**
 * The page's side of a language channel: each call of `make` puts a new transport, as a client the
 * page makes, on the one port, which carries what the transport writes to the relay and every frame
 * the relay sends on the channel to the transports that listen. The host of the transport does
 * nothing; the client is a recording stand-in that answers nothing.
 */
export function pageClients(l: LanguageWorld, language: string): { make: () => PageClient } {
    const channel = `lsp:${language}`;
    const listeners = new Set<(payload: LspRpc) => void>();
    const writers = new Set<(payload: LspRpc) => void>();
    const port: LspPort = {
        state: { value: 'open', onChange: () => () => undefined },
        send: (payload) => {
            for (const one of writers) one(payload as LspRpc);
            l.send(channel, payload as LspRpc);
            return true;
        },
        listen: (fn) => {
            const one = fn as (payload: LspRpc) => void;
            listeners.add(one);
            return () => listeners.delete(one);
        }
    };
    const send = l.page.sink.send.bind(l.page.sink);
    l.page.sink.send = (text) => {
        const out = send(text);
        const sent = JSON.parse(text) as { channel: string; payload: LspRpc };
        if (sent.channel === channel) for (const one of listeners) one(sent.payload);
        return out;
    };
    const host = new Proxy({}, { get: () => () => undefined }) as TransportHost;
    const make = (): PageClient => {
        const transport = new LspTransport(port, language, host, () => 0);
        const handed: LspRpc[] = [];
        const written: LspRpc[] = [];
        let waiting: { accepts: (message: LspRpc) => boolean; resolve: () => void }[] = [];
        const heard = (message: LspRpc): void => {
            waiting = waiting.filter((one) => {
                if (!one.accepts(message)) return true;
                one.resolve();
                return false;
            });
        };
        const writer = (message: LspRpc): void => {
            if (transport.closed) return;
            written.push(message);
            heard(message);
        };
        writers.add(writer);
        transport.setListener((message) => {
            handed.push(message);
            heard(message);
        });
        void transport.send({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: { capabilities: {} }
        } as never);
        let models = 0;
        return {
            transport,
            handed,
            written,
            open(path, text = 'hello\n') {
                models += 1;
                const id = models;
                const model: LspModel = {
                    uri: { toString: () => `inmemory://model/${id}` },
                    getValue: () => text,
                    getVersionId: () => 1,
                    getLanguageId: () => language,
                    onDidChangeContent: () => ({ dispose: () => undefined })
                };
                transport.register(model, { root: 'r', path });
                return model;
            },
            seen(accepts) {
                if ([...handed, ...written].some(accepts)) return Promise.resolve();
                return new Promise((resolve) => waiting.push({ accepts, resolve }));
            }
        };
    };
    return { make };
}
