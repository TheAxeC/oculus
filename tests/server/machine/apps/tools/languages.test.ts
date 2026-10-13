// Layer 2, server test. The language servers an app registers (lib/server/machine/apps/tools/
// languages.ts and the relay's app entries, lsp/relay/relay-apps.ts, relay-join.ts) over the real
// runner and the real relay: the app declares a language and registers a server, the relay starts
// one server per served root with the first document, the page's requests reach it and its answers
// come back, and several servers of one language are joined the way VS Code's client joins them.
// These are the language-server rows of G77, G36 and G63, with the `didSave` a tab's save sends to
// the servers that declared it and the end of a server whose client the app stops.
//
// The servers are node programs that answer a script (world/language-app.ts) and log what they are
// sent. Every folder is synthetic, under the system temporary directory. What this does NOT cover:
// the page's client and its status items (tests/state/system/machine/lsp/), and the shipped
// servers (the other suites of this folder).
// @module-tag slow: each case starts node processes.

import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { runDeclared } from '../../../../../src/lib/server/machine/apps/shell/commands.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import type { LspRpc } from '../../../../../src/lib/data/model/index.ts';
import {
    asRootApp,
    languageApp,
    languageWorld,
    logged,
    sentTo,
    type Payload
} from '../world/language-app.ts';

const hoverCaps = { hoverProvider: true };

/** A frame to the page saying a server is ready. */
const ready = (payload: Payload) => payload.oculus === 'state' && payload.state === 'ready';

/** A frame to the page carrying the answer to the request with this id. */
const answerTo = (id: number) => (payload: Payload) => payload.id === id;

describe('a server an app registers', () => {
    it('starts with the first document of its language under a served root, and the page gets its answers', async () => {
        const log = join(scratchDir('oculus-lang-'), 'one.jsonl');
        const l = languageWorld({
            one: languageApp('one', { capabilities: hoverCaps, hover: 'hello from one' }, log)
        });
        await l.w.hosts.tab('app:one');
        l.open('lsp:notes', 'a.note');
        await l.until(answerTo(1));
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 2,
            method: 'textDocument/hover',
            params: { textDocument: { uri: l.uri('a.note') }, position: { line: 0, character: 0 } }
        });
        await l.until(answerTo(2));
        const reply = l.page.frames.find((one) => one.payload.id === 2)?.payload;
        const methods = sentTo(log).map((one) => one.method);
        await l.close();
        expect([JSON.stringify(reply?.result), methods.slice(0, 3)]).toEqual([
            JSON.stringify({ contents: 'hello from one' }),
            ['initialize', 'initialized', 'textDocument/didOpen']
        ]);
    }, 30000);

    it('starts from a serverOptions function that answers the program to run', async () => {
        const log = join(scratchDir('oculus-lang-'), 'fn.jsonl');
        const spec = languageApp('fn', { capabilities: hoverCaps, hover: 'from a function' }, log);
        spec.host = String(spec.host)
            .replace(
                /serverOptions: \{ command: ([^,]*), args: (\[.*\]) \}\n/,
                'serverOptions: () => { const child = spawn($1, $2); return { reader: child.stdout, writer: child.stdin }; }\n'
            )
            .replace(
                'import { fileURLToPath }',
                "import { spawn } from 'node:child_process';\nimport { fileURLToPath }"
            );
        const l = languageWorld({ fn: spec });
        await l.w.hosts.tab('app:fn');
        l.open('lsp:notes', 'a.note');
        await l.until(ready);
        const started = sentTo(log).some((one) => one.method === 'initialize');
        await l.close();
        expect(started).toBe(true);
    }, 30000);

    it('is started once for two documents of one root and once more for a second root', async () => {
        const log = join(scratchDir('oculus-lang-'), 'roots.jsonl');
        const l = languageWorld(
            { one: languageApp('one', { capabilities: hoverCaps }, log) },
            { r: { 'a.note': 'a\n', 'b.note': 'b\n' }, s: { 'c.note': 'c\n' } }
        );
        await l.w.hosts.tab('app:one');
        l.open('lsp:notes', 'a.note');
        await l.until(answerTo(1));
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: {
                textDocument: { uri: l.uri('b.note'), languageId: 'notes', version: 1, text: 'b' }
            }
        });
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: {
                textDocument: {
                    uri: 'oculus-file:///s/c.note',
                    languageId: 'notes',
                    version: 1,
                    text: 'c'
                }
            }
        });
        const sent = await logged(
            log,
            (all) => all.filter((one) => one.method === 'textDocument/didOpen').length === 3
        );
        const initializes = sent.filter((one) => one.method === 'initialize');
        const roots = initializes.map((one) =>
            String((one.params as { rootUri?: string }).rootUri)
        );
        await l.close();
        expect(roots.map((one) => one.split('/').slice(-2).join('/')).sort()).toEqual([
            'roots/r',
            'roots/s'
        ]);
    }, 30000);
});

const LOC = (name: string) => [
    {
        uri: `oculus-file:///r/${name}.note`,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }
    }
];

describe('a document outside the folders of the workspace', () => {
    it('is given to no server of an app, whether the root is unknown or the path climbs out of its root', async () => {
        const log = join(scratchDir('oculus-lang-'), 'outside.jsonl');
        const l = languageWorld(
            { one: languageApp('one', { capabilities: hoverCaps }, log) },
            { r: { 'a.note': 'a\n', 'b.note': 'b\n' } }
        );
        await l.w.hosts.tab('app:one');
        l.open('lsp:notes', 'a.note');
        await l.until(answerTo(1));
        for (const uri of [
            'oculus-file:///nowhere/b.note',
            'oculus-file:///r/../escape.note',
            'file:///etc/c.note'
        ]) {
            l.send('lsp:notes', {
                jsonrpc: '2.0',
                method: 'textDocument/didOpen',
                params: { textDocument: { uri, languageId: 'notes', version: 1, text: 'x' } }
            });
        }
        // The messages of a page are handled in order, so a document opened after them is on the
        // server only when the refused ones before it were dealt with.
        l.openIn('lsp:notes', 'r', 'b.note');
        const sent = await logged(
            log,
            (all) => all.filter((one) => one.method === 'textDocument/didOpen').length >= 2
        );
        const opened = sent
            .filter((one) => one.method === 'textDocument/didOpen')
            .map((one) => (one.params as { textDocument: { uri: string } }).textDocument.uri);
        await l.close();
        expect(opened.map((one) => one.split('/').slice(-1)[0])).toEqual(['a.note', 'b.note']);
    }, 30000);
});

describe('several servers of one language', () => {
    it('join their answers the way VS Code joins them: the first declaring server defines, hovers join, a slow one is cancelled after 2 s', async () => {
        const dir = scratchDir('oculus-lang-');
        const logs = { one: join(dir, 'one.jsonl'), two: join(dir, 'two.jsonl') };
        const caps = {
            hoverProvider: true,
            definitionProvider: true,
            completionProvider: {}
        };
        const l = languageWorld({
            one: languageApp(
                'one',
                {
                    capabilities: caps,
                    hover: 'from one',
                    definition: LOC('one'),
                    completion: [{ label: 'a' }]
                },
                logs.one,
                { title: 'One Server' }
            ),
            two: languageApp(
                'two',
                {
                    capabilities: caps,
                    hover: 'from two',
                    definition: LOC('two'),
                    completion: [{ label: 'b' }],
                    delay: { completion: 6000 }
                },
                logs.two,
                { title: 'Two Server' }
            )
        });
        await l.w.hosts.tab('app:one');
        await l.w.hosts.tab('app:two');
        l.open('lsp:notes', 'a.note');
        const states = (name: string) => (payload: Payload) =>
            payload.oculus === 'state' && payload.state === 'ready' && payload.name === name;
        await l.until(states('One Server'));
        await l.until(states('Two Server'));
        const position = {
            textDocument: { uri: l.uri('a.note') },
            position: { line: 0, character: 0 }
        };
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 3,
            method: 'textDocument/definition',
            params: position
        });
        await l.until(answerTo(3));
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 4,
            method: 'textDocument/hover',
            params: position
        });
        await l.until(answerTo(4));
        // The join's 2 s wait runs on a fake clock: the request is asked of both servers, the
        // fast one answers, and the page has no answer until the clock passes the wait.
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 5,
            method: 'textDocument/completion',
            params: position
        });
        const asks = (all: LspRpc[]) =>
            all.filter((one) => one.method === 'textDocument/completion').length === 1;
        await Promise.all([logged(logs.one, asks), logged(logs.two, asks)]);
        // The fast server's answer is in before the clock moves: a definition asked of it after
        // the completion comes back on the same connection behind the completion's answer.
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 6,
            method: 'textDocument/definition',
            params: position
        });
        await l.until(answerTo(6));
        const early = l.page.frames.some((one) => one.payload.id === 5);
        await vi.advanceTimersByTimeAsync(1999);
        const beforeWait = l.page.frames.some((one) => one.payload.id === 5);
        await vi.advanceTimersByTimeAsync(1);
        vi.useRealTimers();
        await l.until(answerTo(5));
        const frame = (id: number) =>
            l.page.frames.find((one) => one.payload.id === id)?.payload.result;
        const twoMethods = sentTo(logs.two).map((one) => one.method);
        const cancelled = (
            await logged(logs.two, (all) => all.some((one) => one.method === '$/cancelRequest'))
        ).some((one) => one.method === '$/cancelRequest');
        await l.close();
        const items = frame(5) as { label: string }[] | { items: { label: string }[] } | null;
        const labels = (Array.isArray(items) ? items : (items?.items ?? [])).map(
            (one) => one.label
        );
        expect([
            JSON.stringify(frame(3)).includes('one.note'),
            twoMethods.includes('textDocument/definition'),
            JSON.stringify(frame(4)).includes('from one') &&
                JSON.stringify(frame(4)).includes('from two'),
            labels,
            early || beforeWait,
            cancelled
        ]).toEqual([true, false, true, ['a'], false, true]);
    }, 40000);
});

describe('an app that stops acting while its server runs', () => {
    it('has its server end, its diagnostics leave the document, its capabilities withdrawn and the page told the server is gone, when the app is disabled', async () => {
        const log = join(scratchDir('oculus-lang-'), 'one.jsonl');
        const l = languageWorld({
            one: languageApp(
                'one',
                {
                    capabilities: hoverCaps,
                    hover: 'x',
                    diagnostics: [
                        {
                            range: {
                                start: { line: 0, character: 0 },
                                end: { line: 0, character: 1 }
                            },
                            message: 'flaw',
                            severity: 1
                        }
                    ]
                },
                log
            )
        });
        await l.w.hosts.tab('app:one');
        l.open('lsp:notes', 'a.note');
        await l.until(ready);
        await l.until(
            (payload) =>
                payload.method === 'textDocument/publishDiagnostics' &&
                JSON.stringify(payload.params).includes('flaw')
        );
        const before = l.page.frames.length;
        l.w.disable('app:one');
        await l.until((payload) => payload.oculus === 'gone' && payload.server === 'app:one#one');
        await l.until((payload) => payload.method === 'client/unregisterCapability');
        await l.until(
            (payload) =>
                payload.method === 'textDocument/publishDiagnostics' &&
                (payload.params as { diagnostics: unknown[] }).diagnostics.length === 0
        );
        const after = l.page.frames.slice(before).map((one) => one.payload);
        await l.close();
        const cleared = after.find((one) => one.method === 'textDocument/publishDiagnostics');
        const withdrawn = after.find((one) => one.method === 'client/unregisterCapability');
        expect([
            after.some((one) => one.oculus === 'gone' && one.server === 'app:one#one'),
            (cleared?.params as { diagnostics?: unknown[] } | undefined)?.diagnostics,
            JSON.stringify(withdrawn?.params).includes('hoverProvider')
        ]).toEqual([true, [], true]);
    }, 30000);
});

describe('a server that exits on its own', () => {
    it('is started again by a request after each exit, at most 4 times in 3 minutes, and then left failed until Restart', async () => {
        const log = join(scratchDir('oculus-lang-'), 'one.jsonl');
        const l = languageWorld({
            one: languageApp('one', { capabilities: hoverCaps, exitAfterInitialize: true }, log)
        });
        await l.w.hosts.tab('app:one');
        l.open('lsp:notes', 'a.note');
        const failures = (count: number) => () =>
            l.until(
                () =>
                    l.page.frames.filter(
                        (one) => one.payload.oculus === 'state' && one.payload.state === 'failed'
                    ).length >= count
            );
        await failures(1)();
        const hover = (id: number): void =>
            l.send('lsp:notes', {
                jsonrpc: '2.0',
                id,
                method: 'textDocument/hover',
                params: {
                    textDocument: { uri: l.uri('a.note') },
                    position: { line: 0, character: 0 }
                }
            });
        for (let again = 2; again <= 5; again += 1) {
            hover(10 + again);
            await failures(again)();
        }
        hover(20);
        await l.until(answerTo(20));
        const refused = l.page.frames.find((one) => one.payload.id === 20)?.payload.error;
        const starts = () => sentTo(log).filter((one) => one.method === 'initialize').length;
        const blocked = starts();
        l.send('lsp:notes', { oculus: 'restart', root: 'r', server: 'app:one#one' } as never);
        const restarted = (
            await logged(
                log,
                (all) => all.filter((one) => one.method === 'initialize').length === 6
            )
        ).filter((one) => one.method === 'initialize').length;
        await l.close();
        expect([blocked, refused !== undefined, restarted]).toEqual([5, true, 6]);
    }, 60000);
});

describe('a root app with a language server in a workspace of two roots', () => {
    it('is given only the documents of its own root', async () => {
        const log = join(scratchDir('oculus-lang-'), 'ra.jsonl');
        const app = languageApp('ra', { capabilities: hoverCaps }, log);
        const l = languageWorld(
            {},
            {
                r: { 'a.note': 'a\n', 'c.note': 'c\n', ...asRootApp('ra', app) },
                s: { 'b.note': 'b\n' }
            },
            { approve: ['ra'] }
        );
        const id = l.w.held().apps[0].id;
        await l.w.hosts.tab(id);
        l.open('lsp:notes', 'a.note');
        await l.until(ready);
        l.openIn('lsp:notes', 's', 'b.note');
        // The page's messages are handled in order: a document of the app's own root opened after
        // the other root's is on the server only when that one was dealt with.
        l.openIn('lsp:notes', 'r', 'c.note');
        const opened = (
            await logged(
                log,
                (all) => all.filter((one) => one.method === 'textDocument/didOpen').length >= 2
            )
        )
            .filter((one) => one.method === 'textDocument/didOpen')
            .map((one) => (one.params as { textDocument: { uri: string } }).textDocument.uri);
        await l.close();
        expect(opened.map((one) => one.split('/').slice(-3).join('/'))).toEqual([
            'roots/r/a.note',
            'roots/r/c.note'
        ]);
    }, 30000);
});

const flaw = (message: string) => ({
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
    message,
    severity: 1
});

/** The last diagnostics list the page was sent for a document. */
function lastDiagnostics(frames: { payload: Payload }[]): { message: string; source?: string }[] {
    const sent = frames
        .map((one) => one.payload)
        .filter((one) => one.method === 'textDocument/publishDiagnostics');
    const last = sent.at(-1)?.params as
        { diagnostics: { message: string; source?: string }[] } | undefined;
    return last?.diagnostics ?? [];
}

describe('the diagnostics of several servers of one document', () => {
    it('show together with the name of each server as the source, and a clear of one leaves the other', async () => {
        const dir = scratchDir('oculus-lang-');
        const l = languageWorld({
            one: languageApp(
                'one',
                { capabilities: hoverCaps, diagnostics: [flaw('from one')], clearOnHover: true },
                join(dir, 'one.jsonl'),
                { title: 'One Server' }
            ),
            two: languageApp(
                'two',
                { capabilities: hoverCaps, diagnostics: [flaw('from two')] },
                join(dir, 'two.jsonl'),
                { title: 'Two Server' }
            )
        });
        await l.w.hosts.tab('app:one');
        await l.w.hosts.tab('app:two');
        l.open('lsp:notes', 'a.note');
        await l.until(
            (payload) =>
                payload.method === 'textDocument/publishDiagnostics' &&
                (payload.params as { diagnostics: unknown[] }).diagnostics.length === 2
        );
        const together = lastDiagnostics(l.page.frames).map((one) => [one.message, one.source]);
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 7,
            method: 'textDocument/hover',
            params: {
                textDocument: { uri: l.uri('a.note') },
                position: { line: 0, character: 0 }
            }
        });
        const seen = l.page.frames.length;
        await l.until(() =>
            l.page.frames
                .slice(seen)
                .some(
                    (one) =>
                        one.payload.method === 'textDocument/publishDiagnostics' &&
                        (one.payload.params as { diagnostics: unknown[] }).diagnostics.length === 1
                )
        );
        const left = lastDiagnostics(l.page.frames).map((one) => [one.message, one.source]);
        await l.close();
        expect([together, left]).toEqual([
            [
                ['from one', 'One Server'],
                ['from two', 'Two Server']
            ],
            [['from two', 'Two Server']]
        ]);
    }, 30000);
});

describe('the version a document is sent to a server of an app at', () => {
    it('is above every version sent before for the file, after a close and an open again', async () => {
        const log = join(scratchDir('oculus-lang-'), 'one.jsonl');
        const l = languageWorld({
            one: languageApp('one', { capabilities: hoverCaps }, log)
        });
        await l.w.hosts.tab('app:one');
        l.open('lsp:notes', 'a.note', 'a\n', 1);
        await l.until(ready);
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            method: 'textDocument/didClose',
            params: { textDocument: { uri: l.uri('a.note') } }
        });
        l.openIn('lsp:notes', 'r', 'a.note');
        const versions = (
            await logged(
                log,
                (all) => all.filter((one) => one.method === 'textDocument/didOpen').length === 2
            )
        )
            .filter((one) => one.method === 'textDocument/didOpen')
            .map(
                (one) => (one.params as { textDocument: { version: number } }).textDocument.version
            );
        await l.close();
        expect([versions.length, versions[1] > versions[0]]).toEqual([2, true]);
    }, 30000);
});

const PROVIDERS_HOST = `
export function activate(oculus) {
  const selector = [{ language: 'notes' }];
  oculus.languages.registerHoverProvider(selector, {
    provideHover: () => new oculus.Hover('provider says hi')
  });
  oculus.languages.registerCompletionItemProvider(selector, {
    provideCompletionItems: () => { throw new Error('boom'); }
  });
  oculus.languages.registerDefinitionProvider(selector, {
    provideDefinition: (document) => new oculus.Location(document.uri, new oculus.Range(0, 0, 0, 1))
  });
  const lint = oculus.languages.createDiagnosticCollection('lint');
  const style = oculus.languages.createDiagnosticCollection('style');
  oculus.workspace.onDidOpenTextDocument((document) => {
    lint.set(document.uri, [new oculus.Diagnostic(new oculus.Range(0, 0, 0, 1), 'lint flaw')]);
    style.set(document.uri, [new oculus.Diagnostic(new oculus.Range(0, 0, 0, 1), 'style flaw')]);
  });
  oculus.commands.registerCommand('pro.clearLint', () => lint.clear());
}
`;

describe('the providers an app registers', () => {
    it('answer from one in-host server, a provider that throws answers an error to its request alone, and one collection cleared leaves the other', async () => {
        const l = languageWorld({
            pro: {
                host: PROVIDERS_HOST,
                keys: 'activation: [onTab]\ncontributes:\n  languages:\n    - id: notes\n      extensions: [".note"]\n  commands:\n    - command: pro.clearLint\n      title: Clear\n'
            }
        });
        await l.w.hosts.tab('app:pro');
        l.open('lsp:notes', 'a.note');
        await l.until(ready);
        const position = {
            textDocument: { uri: l.uri('a.note') },
            position: { line: 0, character: 0 }
        };
        const ask = async (id: number, method: string): Promise<Payload> => {
            l.send('lsp:notes', { jsonrpc: '2.0', id, method, params: position });
            await l.until(answerTo(id));
            return l.page.frames.find((one) => one.payload.id === id)?.payload as Payload;
        };
        const hover = await ask(3, 'textDocument/hover');
        const completion = await ask(4, 'textDocument/completion');
        const definition = await ask(5, 'textDocument/definition');
        await l.until(
            () =>
                lastDiagnostics(l.page.frames).length === 2 &&
                JSON.stringify(l.page.frames.map((one) => one.payload)).includes('style flaw')
        );
        const together = lastDiagnostics(l.page.frames).map((one) => [one.message, one.source]);
        const seen = l.page.frames.length;
        const cleared = await runDeclared(l.w.hosts.shell, 'app:pro', 'pro.clearLint', []);
        await l.until(() =>
            l.page.frames
                .slice(seen)
                .some((one) => one.payload.method === 'textDocument/publishDiagnostics')
        );
        const left = lastDiagnostics(l.page.frames).map((one) => one.message);
        await l.close();
        expect([
            JSON.stringify(hover.result).includes('provider says hi'),
            completion.error !== undefined,
            JSON.stringify(definition.result).includes('a.note'),
            together,
            cleared.ok,
            left
        ]).toEqual([
            true,
            true,
            true,
            [
                ['lint flaw', 'lint'],
                ['style flaw', 'style']
            ],
            true,
            ['style flaw']
        ]);
    }, 30000);
});

describe('the providers of an app beside oculus own Markdown server', () => {
    it('answer a hover of the document and add their diagnostics with the collection as the source, while oculus own server stays ready', async () => {
        const host = `export function activate(oculus) {
  oculus.languages.registerHoverProvider({ language: 'markdown' }, {
    provideHover(document, position) { return new oculus.Hover('provider says ' + document.lineAt(position.line).text); }
  });
  const collection = oculus.languages.createDiagnosticCollection('prov');
  oculus.workspace.onDidOpenTextDocument((document) => {
    collection.set(document.uri, [new oculus.Diagnostic(new oculus.Range(0, 0, 0, 2), 'flagged', oculus.DiagnosticSeverity.Warning)]);
  });
}
`;
        const l = languageWorld(
            { prov: { host } },
            { r: { 'a.md': '# Title\n\nbody\n' } },
            { shipped: true }
        );
        await l.w.hosts.tab('app:prov');
        l.send('lsp:markdown', {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: { capabilities: {} }
        });
        l.send('lsp:markdown', {
            jsonrpc: '2.0',
            method: 'textDocument/didOpen',
            params: {
                textDocument: {
                    uri: 'oculus-file:///r/a.md',
                    languageId: 'markdown',
                    version: 1,
                    text: '# Title\n\nbody\n'
                }
            }
        });
        await l.until(
            (payload) =>
                payload.oculus === 'state' &&
                payload.state === 'ready' &&
                payload.server === undefined
        );
        await l.until(
            (payload) =>
                payload.method === 'textDocument/publishDiagnostics' &&
                JSON.stringify(payload.params).includes('flagged')
        );
        l.send('lsp:markdown', {
            jsonrpc: '2.0',
            id: 2,
            method: 'textDocument/hover',
            params: {
                textDocument: { uri: 'oculus-file:///r/a.md' },
                position: { line: 0, character: 1 }
            }
        });
        await l.until(answerTo(2));
        const hover = l.page.frames.find((one) => one.payload.id === 2)?.payload.result;
        const shown = l.page.frames
            .map((one) => one.payload)
            .filter((one) => one.method === 'textDocument/publishDiagnostics')
            .flatMap((one) => (one.params as { diagnostics: { source?: string }[] }).diagnostics);
        await l.close();
        expect([JSON.stringify(hover).includes('provider says # Title'), shown[0].source]).toEqual([
            true,
            'prov'
        ]);
    }, 40000);
});

describe('a save of a file the page holds', () => {
    it('is sent to the server of an app that declared save, with the text when it asked for it', async () => {
        const dir = scratchDir('oculus-lang-');
        const l = languageWorld({
            plain: languageApp(
                'plain',
                { capabilities: { textDocumentSync: { save: true } } },
                join(dir, 'plain.jsonl')
            ),
            texted: languageApp(
                'texted',
                { capabilities: { textDocumentSync: { save: { includeText: true } } } },
                join(dir, 'texted.jsonl')
            ),
            silent: languageApp(
                'silent',
                { capabilities: { textDocumentSync: 2 } },
                join(dir, 'silent.jsonl')
            )
        });
        for (const name of ['plain', 'texted', 'silent']) await l.w.hosts.tab(`app:${name}`);
        l.open('lsp:notes', 'a.note');
        const opened = (all: LspRpc[]) => all.some((one) => one.method === 'textDocument/didOpen');
        for (const name of ['plain', 'texted', 'silent']) {
            await logged(join(dir, `${name}.jsonl`), opened);
        }
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            method: 'textDocument/didSave',
            params: { textDocument: { uri: l.uri('a.note') }, text: 'saved text\n' }
        });
        // A request after the save is handled after it, so the silent server's log is complete
        // once it has seen the hover.
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 9,
            method: 'textDocument/hover',
            params: {
                textDocument: { uri: l.uri('a.note') },
                position: { line: 0, character: 0 }
            }
        });
        const saved = (name: string) =>
            logged(join(dir, `${name}.jsonl`), (all) =>
                all.some((one) => one.method === 'textDocument/didSave')
            );
        const plain = (await saved('plain')).filter((one) => one.method === 'textDocument/didSave');
        const texted = (await saved('texted')).filter(
            (one) => one.method === 'textDocument/didSave'
        );
        await l.close();
        const silent = sentTo(join(dir, 'silent.jsonl')).map((one) => one.method);
        expect([
            plain.map((one) => one.params),
            texted.map((one) => (one.params as { text?: string }).text),
            silent.includes('textDocument/didSave')
        ]).toEqual([
            [{ textDocument: { uri: expect.stringMatching(/a\.note$/) as unknown } }],
            ['saved text\n'],
            false
        ]);
    }, 30000);

    it('fires onDidSaveTextDocument of an app provider once, with the document', async () => {
        const host = `export function activate(oculus) {
  const selector = [{ language: 'notes' }];
  let saved = [];
  oculus.workspace.onDidSaveTextDocument((document) => saved.push(document.uri.path.split('/').pop()));
  oculus.languages.registerHoverProvider(selector, {
    provideHover: () => new oculus.Hover('saved ' + JSON.stringify(saved))
  });
}
`;
        const l = languageWorld({
            pro: {
                host,
                keys: 'activation: [onTab]\ncontributes:\n  languages:\n    - id: notes\n      extensions: [".note"]\n'
            }
        });
        await l.w.hosts.tab('app:pro');
        l.open('lsp:notes', 'a.note');
        await l.until(ready);
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            method: 'textDocument/didSave',
            params: { textDocument: { uri: l.uri('a.note') }, text: 'hello\n' }
        });
        l.send('lsp:notes', {
            jsonrpc: '2.0',
            id: 3,
            method: 'textDocument/hover',
            params: {
                textDocument: { uri: l.uri('a.note') },
                position: { line: 0, character: 0 }
            }
        });
        await l.until(answerTo(3));
        const hover = l.page.frames.find((one) => one.payload.id === 3)?.payload.result;
        await l.close();
        expect(JSON.stringify(hover)).toContain('saved [\\"a.note\\"]');
    }, 30000);
});

describe('an app that stops its own client', () => {
    it('has its server asked shutdown and then exit, and the page told it is gone', async () => {
        const log = join(scratchDir('oculus-lang-'), 'one.jsonl');
        const l = languageWorld({
            one: languageApp('one', { capabilities: hoverCaps }, log, {
                extra: "  oculus.commands.registerCommand('one.stop', () => client.stop());\n",
                keys: '  commands:\n    - command: one.stop\n      title: Stop\n'
            })
        });
        await l.w.hosts.tab('app:one');
        l.open('lsp:notes', 'a.note');
        await l.until(ready);
        const stopped = await runDeclared(l.w.hosts.shell, 'app:one', 'one.stop', []);
        await l.until((payload) => payload.oculus === 'gone' && payload.server === 'app:one#one');
        const methods = (await logged(log, (all) => all.some((one) => one.method === 'exit'))).map(
            (one) => one.method
        );
        await l.close();
        expect([stopped.ok, methods.slice(-2)]).toEqual([true, ['shutdown', 'exit']]);
    }, 30000);
});
