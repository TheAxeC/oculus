// Layer 3, primitive test. The ids a language server transport sends
// (ui/controls/editor/kit/lsp/transport.ts): a client made after another one ended counts its
// request ids from the start again, while the relay still answers what the ended one asked, so
// each transport sends its ids after its own period and takes an answer only under an id it sent.
// An answer to the ended transport's request is never given to the new client's request of the
// same number (a folding answer given to a links request was the "reading 'start'" throw of
// `translateBackRange`, and given to an inlay hints request the "reading 'map'" of
// `toLspInlayHintLabel`); the client's cancel names the id its request was sent under. Two
// transports share one port here, as a language's transports share its channel.
//
// It does not cover Monaco's providers, which the look does.

import { describe, expect, it } from 'vitest';
import {
    LspTransport,
    type TransportHost
} from '../../../../src/lib/ui/controls/editor/kit/lsp/transport';
import type { LspPort } from '../../../../src/lib/ui/controls/editor/kit/lsp/services';

/** A port both transports listen on, with what was sent to the relay. */
function sharedPort() {
    const listeners: ((payload: Record<string, unknown>) => void)[] = [];
    const sent: Record<string, unknown>[] = [];
    const port: LspPort = {
        state: { value: 'open', onChange: () => () => undefined },
        send: (payload) => {
            sent.push(payload);
            return true;
        },
        listen: (fn) => {
            listeners.push(fn);
            return () => listeners.splice(listeners.indexOf(fn), 1);
        }
    };
    const answer = (body: Record<string, unknown>): void => {
        for (const one of [...listeners]) one({ jsonrpc: '2.0', ...body });
    };
    return { port, sent, answer };
}

/** A transport of one period over the port, its model registered, and what it handed its client. */
function transportOf(port: LspPort, period: string) {
    const transport = new LspTransport(port, 'latex', {} as TransportHost, () => 0, period);
    const delivered: Record<string, unknown>[] = [];
    transport.setListener((message) => delivered.push(message));
    transport.register(
        {
            uri: { toString: () => 'inmemory://model/1' },
            getValue: () => '\\section{A}\n',
            getVersionId: () => 1,
            getLanguageId: () => 'latex',
            onDidChangeContent: () => ({ dispose: () => undefined })
        },
        { root: 'rite', path: 'a.tex' }
    );
    return { transport, delivered };
}

const DOCUMENT = { textDocument: { uri: 'inmemory://model/1' } };

/** Let the transports handle what came in. */
const settle = (): Promise<void> => new Promise((done) => setTimeout(done, 0));

describe('an answer to a request of an ended transport', () => {
    it('is never given to the request of the same number of the transport after it', async () => {
        const { port, sent, answer } = sharedPort();
        const ended = transportOf(port, 'p1:');
        void ended.transport.send({
            jsonrpc: '2.0',
            id: 1,
            method: 'textDocument/foldingRange',
            params: DOCUMENT
        });
        ended.transport.close();
        const now = transportOf(port, 'p2:');
        void now.transport.send({
            jsonrpc: '2.0',
            id: 1,
            method: 'textDocument/documentLink',
            params: DOCUMENT
        });
        answer({ id: 'p1:1', result: [{ startLine: 0, endLine: 1 }] });
        await settle();
        expect(now.delivered).toEqual([]);
        const link = {
            range: { start: { line: 0, character: 1 }, end: { line: 0, character: 8 } }
        };
        answer({ id: 'p2:1', result: [link] });
        await settle();
        expect({
            ids: sent.flatMap((one) => (one.id === undefined ? [] : [one.id])),
            delivered: now.delivered.map((one) => one.id)
        }).toEqual({ ids: ['p1:1', 'p2:1'], delivered: [1] });
    });

    it('names in a cancel the id the request was sent under', () => {
        const { port, sent } = sharedPort();
        const made = transportOf(port, 'p3:');
        void made.transport.send({ jsonrpc: '2.0', method: '$/cancelRequest', params: { id: 4 } });
        expect(sent.find((one) => one.method === '$/cancelRequest')?.params).toEqual({
            id: 'p3:4'
        });
    });
});
