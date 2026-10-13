// Layer 2, server test. The features a server of an app declares, as the page's client of the
// language sees them and asks for them (lib/server/machine/lsp/relay/relay-server.ts,
// relay-route.ts, relay-join.ts, held/held.ts, and ui/controls/editor/kit/lsp/transport.ts on the
// page's side), over the real runner, the real relay and the page's real transport between the
// relay and a recording stand-in for Monaco's client:
//
// - each feature an app server declares that oculus's own server of the language does not, whether
//   in its `initialize` answer or by registering it later, is handed to the client as a
//   registration, for every client the page makes on the channel, and withdrawn when the server
//   goes; the semantic tokens of an app server are drawn by the page from its legend and are not
//   registered;
// - a request of the page for a feature goes only to the servers that declared it, and one no
//   server of an app declared is answered with no result at once.
//
// These are language-server rows of G77. The servers are node programs that answer a script
// (world/language-app.ts) and log what they are sent. Every folder is synthetic, under the system
// temporary directory. What this does NOT cover: Monaco's client taking a registration and the
// menu of the editor reading it (`provides` in ui/controls/editor/kit/lsp/client.ts), which need a
// DOM.
// @module-tag slow: each case starts node processes.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { LspRpc } from '../../../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import {
    languageApp,
    languageWorld,
    logged,
    pageClients,
    sentTo,
    type LanguageWorld,
    type PageClient,
    type ServerScript
} from '../world/language-app.ts';
import { frame, recordingSink } from '../../lsp/lsp-fixture.ts';

/** The registrations of the requests a client was handed, by method, in order. */
function registered(client: PageClient): string[] {
    return client.handed
        .filter((one) => one.method === 'client/registerCapability')
        .flatMap((one) =>
            ((one.params as { registrations?: { method: string }[] }).registrations ?? []).map(
                (r) => r.method
            )
        );
}

/** Whether the transport answered the relay's request with this id, or handed it to the client. */
const dealtWith = (id: unknown) => (message: LspRpc) => message.id === id;

/** The relay's last request to the page of this method, once it is sent. */
async function relayAsks(l: ReturnType<typeof languageWorld>, method: string): Promise<LspRpc> {
    await l.until((payload) => payload.method === method);
    const all = l.page.frames.filter((one) => one.payload.method === method);
    return all[all.length - 1].payload;
}

/** One app `look` with a server of this script, its log, and the page's client with a.note. */
async function oneApp(name: string, script: ServerScript) {
    const log = join(scratchDir('oculus-feat-'), `${name}.jsonl`);
    const l = languageWorld({ look: languageApp('look', script, log) });
    await l.w.hosts.tab('app:look');
    const clients = pageClients(l, 'notes');
    const client = clients.make();
    const model = client.open('a.note');
    await l.until((payload) => payload.oculus === 'state' && payload.state === 'ready');
    return { l, log, clients, client, model };
}

const AT = { position: { line: 0, character: 0 } };

describe('a feature a server of an app declares', () => {
    it('is handed to the page client as a registration, which the transport refuses none of, for a language no oculus server serves', async () => {
        const { l, client, model } = await oneApp('a', {
            capabilities: { hoverProvider: true },
            hover: 'a note'
        });
        const ask = await relayAsks(l, 'client/registerCapability');
        await client.seen(dealtWith(ask.id));
        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
        const refused = client.written.filter((one) => one.id === ask.id && one.error);
        await l.close();
        expect([registered(client), refused, JSON.stringify(hover)]).toEqual([
            ['textDocument/hover'],
            [],
            JSON.stringify({ contents: 'a note' })
        ]);
    }, 30000);

    it('is handed to the page client for a language oculus serves, when oculus own server does not declare it', async () => {
        const log = join(scratchDir('oculus-feat-'), 'md.jsonl');
        const l = languageWorld(
            {
                look: languageApp(
                    'look',
                    { capabilities: { hoverProvider: true, codeLensProvider: {} } },
                    log,
                    { language: { id: 'markdown', extension: '.md' } }
                )
            },
            { r: { 'a.md': '# a\n' } }
        );
        await l.w.hosts.tab('app:look');
        const client = pageClients(l, 'markdown').make();
        client.open('a.md', '# a\n');
        const ask = await relayAsks(l, 'client/registerCapability');
        await client.seen(dealtWith(ask.id));
        await l.close();
        expect(registered(client)).toEqual(['textDocument/codeLens']);
    }, 30000);

    it('is handed to the page client from the providers an app registers in its host', async () => {
        const l = languageWorld({
            prov: {
                keys: 'activation: [onTab]\ncontributes:\n  languages:\n    - id: notes\n      extensions: [".note"]\n',
                host: `export function activate(oculus) {
  oculus.languages.registerHoverProvider({ language: 'notes' }, {
    provideHover() { return new oculus.Hover('from a provider'); }
  });
}
`
            }
        });
        await l.w.hosts.tab('app:prov');
        const client = pageClients(l, 'notes').make();
        const model = client.open('a.note');
        const ask = await relayAsks(l, 'client/registerCapability');
        await client.seen(dealtWith(ask.id));
        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
        await l.close();
        expect([registered(client), JSON.stringify(hover).includes('from a provider')]).toEqual([
            ['textDocument/hover'],
            true
        ]);
    }, 30000);

    it('is registered for workspace symbols and the call and type hierarchies, and not for semantic tokens, which the page draws from the legend', async () => {
        const { l, client } = await oneApp('sem', {
            capabilities: {
                hoverProvider: true,
                workspaceSymbolProvider: true,
                callHierarchyProvider: true,
                typeHierarchyProvider: true,
                semanticTokensProvider: {
                    legend: { tokenTypes: ['a'], tokenModifiers: [] },
                    full: true
                }
            }
        });
        const ask = await relayAsks(l, 'client/registerCapability');
        await client.seen(dealtWith(ask.id));
        await l.close();
        expect(registered(client)).toEqual([
            'textDocument/hover',
            'workspace/symbol',
            'textDocument/prepareCallHierarchy',
            'textDocument/prepareTypeHierarchy'
        ]);
    }, 30000);

    it('is handed to a second client the page makes on the same socket after its last document closed', async () => {
        const { l, clients, client, model } = await oneApp('again', {
            capabilities: { hoverProvider: true },
            hover: 'again'
        });
        const first = await relayAsks(l, 'client/registerCapability');
        await client.seen(dealtWith(first.id));
        client.transport.unregister(model);
        client.transport.close();
        const next = clients.make();
        const reopened = next.open('a.note');
        // The answer of a hover comes after every message the relay sent the client before it.
        const hover = await next.transport.ask(reopened, 'textDocument/hover', AT);
        await l.close();
        expect([registered(next), JSON.stringify(hover)]).toEqual([
            ['textDocument/hover'],
            JSON.stringify({ contents: 'again' })
        ]);
    }, 30000);

    it('is handed to the client of a page that takes the running server over after a reload', async () => {
        const { l, log, client } = await oneApp('reload', {
            capabilities: { hoverProvider: true },
            hover: 'again'
        });
        const first = await relayAsks(l, 'client/registerCapability');
        await client.seen(dealtWith(first.id));
        l.relay.remove(l.page.sink);
        const page = recordingSink();
        const reloaded: LanguageWorld = {
            ...l,
            page,
            send: (channel, message) => {
                l.relay.inbound(page.sink, frame(channel, message));
            },
            until: (accepts) => page.arrival(accepts)
        };
        const next = pageClients(reloaded, 'notes').make();
        const reopened = next.open('a.note');
        // The answer of a hover comes after every message the relay sent the client before it.
        const hover = await next.transport.ask(reopened, 'textDocument/hover', AT);
        const started = sentTo(log).filter((one) => one.method === 'initialize').length;
        await l.close();
        expect([registered(next), JSON.stringify(hover), started]).toEqual([
            ['textDocument/hover'],
            JSON.stringify({ contents: 'again' }),
            1
        ]);
    }, 30000);

    it('is withdrawn from the page client when the app stops acting', async () => {
        const { l, client } = await oneApp('stop', { capabilities: { hoverProvider: true } });
        const ask = await relayAsks(l, 'client/registerCapability');
        await client.seen(dealtWith(ask.id));
        l.w.disable('app:look');
        const withdrawn = await relayAsks(l, 'client/unregisterCapability');
        await client.seen(dealtWith(withdrawn.id));
        const handed = client.handed.find((one) => one.id === withdrawn.id);
        await l.close();
        expect(
            (handed?.params as { unregisterations?: { method: string }[] } | undefined)
                ?.unregisterations
        ).toEqual([{ id: 'oculus-app:notes:hoverProvider', method: 'textDocument/hover' }]);
    }, 30000);

    it('is handed to the page client when the server registers it after initialize, and its requests reach the server', async () => {
        const { l, log, client, model } = await oneApp('dyn', {
            capabilities: {},
            dynamicHover: true,
            hover: 'registered later'
        });
        // The server logs the relay's answer to its registration.
        await logged(log, (all) =>
            all.some((one) => one.id === 'reg1' && one.method === undefined)
        );
        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
        await l.close();
        expect([registered(client), JSON.stringify(hover)]).toEqual([
            ['textDocument/hover'],
            JSON.stringify({ contents: 'registered later' })
        ]);
    }, 30000);
});

describe('a request of the page for a feature', () => {
    it('that the server of an app did not declare is answered with no result and not sent to it, asked as the document opens and once the server is ready', async () => {
        const log = join(scratchDir('oculus-feat-'), 'sym.jsonl');
        const l = languageWorld({ look: languageApp('look', {}, log) });
        await l.w.hosts.tab('app:look');
        const client = pageClients(l, 'notes').make();
        const model = client.open('a.note');
        const answers: unknown[] = [];
        const symbols = (): void =>
            void client.transport.ask(model, 'textDocument/documentSymbol').then(
                (result) => answers.push(result),
                (error: unknown) => answers.push(String(error))
            );
        // The outline asks as the document opens, before the server answered `initialize`.
        symbols();
        await l.until((payload) => payload.oculus === 'state' && payload.state === 'ready');
        symbols();
        // The script answers a definition with no result, so its answer is a signal that comes
        // after both documentSymbol requests, which the script never answers, were dealt with.
        const definition = await client.transport.ask(model, 'textDocument/definition', AT);
        const answered = [...answers];
        const sent = sentTo(log)
            .map((one) => one.method)
            .filter(
                (one) => one === 'textDocument/documentSymbol' || one === 'textDocument/definition'
            );
        await l.close();
        expect([answered, definition, sent]).toEqual([[null, null], null, []]);
    }, 30000);

    it('for the workspace symbols of a root, whose server of an app did not declare them, is answered with no result and not sent to it', async () => {
        const { l, log, client, model } = await oneApp('wsym', {
            capabilities: { hoverProvider: true },
            hover: 'signal'
        });
        let settled: unknown = 'waiting';
        void client.transport.ask(model, 'workspace/symbol', { query: 'a' }).then(
            (result) => (settled = result),
            (error: unknown) => (settled = String(error))
        );
        // The server answers a hover after it read every request sent to it before the hover.
        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
        const answered = settled;
        const sent = sentTo(log)
            .map((one) => one.method)
            .filter((one) => one === 'workspace/symbol');
        await l.close();
        expect([answered, JSON.stringify(hover), sent]).toEqual([
            null,
            JSON.stringify({ contents: 'signal' }),
            []
        ]);
    }, 30000);

    it('that follows a call hierarchy goes to the server that declared the call hierarchy, not to the first server of the document', async () => {
        const dir = scratchDir('oculus-feat-');
        const logs = { one: join(dir, 'one.jsonl'), two: join(dir, 'two.jsonl') };
        const l = languageWorld({
            one: languageApp('one', { capabilities: { hoverProvider: true } }, logs.one),
            two: languageApp('two', { capabilities: { callHierarchyProvider: true } }, logs.two)
        });
        await l.w.hosts.tab('app:one');
        await l.w.hosts.tab('app:two');
        l.open('lsp:notes', 'a.note');
        const opened = (log: string) =>
            logged(log, (all) => all.some((one) => one.method === 'textDocument/didOpen'));
        await opened(logs.one);
        await opened(logs.two);
        const item = {
            name: 'a',
            kind: 12,
            uri: l.uri('a.note'),
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
            selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }
        };
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 7,
            method: 'callHierarchy/incomingCalls',
            params: { item }
        });
        const asked = (log: string) =>
            sentTo(log).some((one) => one.method === 'callHierarchy/incomingCalls');
        // Both logs are in one folder, so a wait on one sees a write to either.
        await logged(logs.one, () => asked(logs.one) || asked(logs.two));
        const where = { one: asked(logs.one), two: asked(logs.two) };
        await l.close();
        expect(where).toEqual({ one: false, two: true });
    }, 30000);
});
