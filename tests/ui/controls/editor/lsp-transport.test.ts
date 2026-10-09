// Layer 3, primitive test. What the language server transport (ui/controls/editor/kit/lsp/
// transport.ts) shows of a rename a server refused, G67: a refusal given at `prepareRename`
// rejects the request with the sentence, which the editor shows at the caret; a refusal given at
// `rename` is told to the page as the notice `lsp_edit_refused` and answers the editor with no
// result; a refusal with no words is the catalog's sentence for it, with no placeholder left in it.
//
// The words are the page's own (state/system/machine/refactor/notice-words.ts) over the checkout's
// catalog (tests/server/text.ts), so a refusal whose key the page does not word, or a sentence
// that needs a word the transport does not give, fails here.
//
// What this does NOT cover: the sentences the relay gives a refusal
// (tests/server/machine/lsp/adapters/hub-keys.test.ts) and the notice's look in the page.

import { describe, expect, it } from 'vitest';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import {
    LspTransport,
    type TransportHost
} from '../../../../src/lib/ui/controls/editor/kit/lsp/transport';
import type { LspPort } from '../../../../src/lib/ui/controls/editor/kit/lsp/services';
import { noticeWords } from '../../../../src/lib/state/system/machine/refactor/notice-words.ts';
import { TEXT } from '../../../server/text.ts';

setCatalog(TEXT);

const EMPTY = 'The language server refused this rename and gave no reason.';

/** A transport over a port that records what is sent, with the page's host recording its calls. */
function rig() {
    let hear: (payload: Record<string, unknown>) => void = () => undefined;
    const port: LspPort = {
        state: { value: 'open', onChange: () => () => undefined },
        send: () => true,
        listen: (fn) => {
            hear = fn;
            return () => undefined;
        }
    };
    const notices: string[][] = [];
    const host: Partial<TransportHost> = {
        words: (key, ...words) => noticeWords(key, words),
        notice: (key, ...words) => {
            notices.push([key, ...words]);
        },
        applyEdit: () => Promise.resolve({ applied: true }),
        markPreview: () => undefined,
        takePreview: () => false
    };
    const transport = new LspTransport(port, 'yaml', host as TransportHost, () => 0);
    const delivered: unknown[] = [];
    let handed: () => void = () => undefined;
    const answered = new Promise<void>((done) => (handed = done));
    transport.setListener((message) => {
        delivered.push(message);
        handed();
    });
    transport.register(
        {
            uri: { toString: () => 'inmemory://model/1' },
            getValue: () => 'venue_id: media\n',
            getVersionId: () => 1,
            getLanguageId: () => 'yaml',
            onDidChangeContent: () => ({ dispose: () => undefined })
        },
        { root: 'hub', path: 'p.yml' }
    );
    return {
        transport,
        /** Settles once the transport has handed the editor a message. */
        answered,
        notices,
        delivered,
        answer: (body: Record<string, unknown>) => hear({ jsonrpc: '2.0', ...body })
    };
}

const params = { textDocument: { uri: 'inmemory://model/1' }, position: { line: 0, character: 3 } };

/** How a request ended, once it settles: with a value, or rejected with a reason. */
function endOf(request: Promise<unknown>): Promise<string> {
    return request.then(
        () => 'resolved',
        (reason: unknown) => `rejected: ${String(reason)}`
    );
}

describe('a rename a server refused', () => {
    it('rejects prepareRename with the sentence the server gave, to show at the caret', async () => {
        const made = rig();
        const sent = made.transport.send({
            jsonrpc: '2.0',
            id: 7,
            method: 'textDocument/prepareRename',
            params
        });
        made.answer({ id: 7, error: { code: -32803, message: 'sciml is a refusal.' } });
        expect(await endOf(sent as Promise<unknown>)).toBe('rejected: sciml is a refusal.');
        expect(made.notices).toEqual([]);
    });

    it('rejects prepareRename with the catalog sentence for a refusal with no words', async () => {
        const made = rig();
        const sent = made.transport.send({
            jsonrpc: '2.0',
            id: 7,
            method: 'textDocument/prepareRename',
            params
        });
        made.answer({ id: 7, error: { code: -32803, message: '' } });
        expect(await endOf(sent as Promise<unknown>)).toBe(`rejected: ${EMPTY}`);
    });

    it('rejects prepareRename with the catalog sentence when the server gave no range', async () => {
        const made = rig();
        const sent = made.transport.send({
            jsonrpc: '2.0',
            id: 7,
            method: 'textDocument/prepareRename',
            params
        });
        made.answer({ id: 7, result: null });
        expect(await endOf(sent as Promise<unknown>)).toBe(
            "rejected: The element can't be renamed."
        );
    });

    it('answers a cancelled prepareRename with no refusal and no notice', async () => {
        const made = rig();
        const sent = made.transport.send({
            jsonrpc: '2.0',
            id: 7,
            method: 'textDocument/prepareRename',
            params
        });
        made.answer({ id: 7, error: { code: -32800, message: 'cancelled' } });
        expect(await endOf(sent as Promise<unknown>)).toBe('resolved');
        expect(made.notices).toEqual([]);
    });

    it.each([
        [
            'the sentence the server gave',
            'sciml is already a key of pillars.',
            'sciml is already a key of pillars.'
        ],
        ['the catalog sentence for a refusal with no words', '', EMPTY]
    ])(
        'tells a refusal of rename as a notice with %s, and answers the editor with no result',
        async (_name, given, shown) => {
            const made = rig();
            void made.transport.send({
                jsonrpc: '2.0',
                id: 2,
                method: 'textDocument/rename',
                params: { ...params, newName: 'x' }
            });
            made.answer({ id: 2, error: { code: -32803, message: given } });
            await made.answered;
            expect(made.notices).toEqual([['lsp_edit_refused', shown]]);
            expect(made.delivered).toEqual([{ jsonrpc: '2.0', id: 2, result: null }]);
        }
    );
});
