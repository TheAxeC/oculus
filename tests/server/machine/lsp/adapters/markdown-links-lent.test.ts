// Layer 4, server test. A link request carries the texts of the page's tabs with unsaved text
// (server/machine/lsp/held/requests/links.ts): a Markdown file among them that the server holds no
// document of, as when a moved tab is between its close under the old address and its open under
// the new one, is opened on the server with the tab's text before the server is asked, so the
// edit is computed over it and never over the disk's; the answer names that text, and the document
// is closed once the server answered. A page that opens the file while the server is asked takes
// the document over (relay/relay-route.ts, openOn), at the text it opens it with, and it stays
// open.
//
// The relay runs on vitest's fake clock over stub child processes (lsp-fixture.ts). It does not
// cover what the real Markdown server computes, which the look does.

import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it } from '../../../../fixtures/scratch.ts';
import {
    advance,
    frame,
    makeRelay,
    pageFile,
    plantRoot,
    recordingSink,
    relaysMade,
    sentOnClock,
    stubSpawn
} from '../lsp-fixture.ts';

const CHANNEL = 'lsp:markdown';
const made = relaysMade();

/** The document's own notices of open, change and close. */
const SYNC = ['textDocument/didOpen', 'textDocument/didChange', 'textDocument/didClose'];

/**
 * The notices that open, change or close a document the server was sent, as method and text, in
 * order. A request about the document, such as the diagnostics the relay asks for when the
 * platform's watch reports a planted file late, is not one of them.
 */
function about(messages: { method?: string; params?: unknown }[], uri: string): string[] {
    return messages.flatMap((one) => {
        if (!SYNC.includes(String(one.method))) return [];
        const params = one.params as
            | {
                  textDocument?: { uri?: string; text?: string };
                  contentChanges?: { text?: string }[];
              }
            | undefined;
        if (params?.textDocument?.uri !== uri) return [];
        const text = params.textDocument.text ?? params.contentChanges?.[0]?.text;
        return [text === undefined ? String(one.method) : `${String(one.method)} ${text}`];
    });
}

/** Ask for the edit of a move with a tab's unsaved text; `meanwhile` runs while it is asked. */
async function asked(meanwhile: (send: (payload: object) => void) => void) {
    const dir = plantRoot(['a.md', 'docs/b.md']);
    const spawned = stubSpawn();
    const relay = makeRelay({ roots: () => [{ key: 'repo', dir }], spawn: spawned.spawn });
    made.push(relay);
    const page = recordingSink();
    const send = (payload: object): void => {
        relay.inbound(page.sink, frame(CHANNEL, payload));
    };
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { capabilities: {} } });
    send({
        oculus: 'links',
        id: 3,
        root: 'repo',
        moves: [{ from: 'docs/b.md', to: 'docs/c.md' }],
        texts: [{ path: 'a.md', text: 'Typed.\n' }]
    });
    const child = await spawned.childOf(0);
    await advance(0);
    const question = await sentOnClock(child, 'markdown/getEditForFileRenames');
    meanwhile(send);
    await advance(0);
    child.say({ jsonrpc: '2.0', id: question.id, result: { edit: { documentChanges: [] } } });
    await page.arrival((payload) => payload.oculus === 'links_answer');
    await advance(0);
    const answer = page.frames.find((one) => one.payload.oculus === 'links_answer')?.payload;
    const uri = pathToFileURL(join(dir, 'a.md')).href;
    const before = child.messages.slice(0, child.messages.indexOf(question));
    return {
        held: answer?.held,
        before: about(before, uri),
        after: about(child.messages.slice(before.length + 1), uri)
    };
}

describe('a link request with the text of a tab the server holds no document of', () => {
    it('opens the tab text on the server before asking, names it, and closes it after', async () => {
        expect(await asked(() => undefined)).toEqual({
            held: [{ uri: pageFile('repo', 'a.md'), text: 'Typed.\n' }],
            before: ['textDocument/didOpen Typed.\n'],
            after: ['textDocument/didClose']
        });
    });

    it('leaves the document open, at the page text, when the page opens the file meanwhile', async () => {
        const opened = (send: (payload: object) => void): void =>
            send({
                jsonrpc: '2.0',
                method: 'textDocument/didOpen',
                params: {
                    textDocument: {
                        uri: pageFile('repo', 'a.md'),
                        languageId: 'markdown',
                        version: 1,
                        text: 'Typed more.\n'
                    }
                }
            });
        expect(await asked(opened)).toEqual({
            held: [{ uri: pageFile('repo', 'a.md'), text: 'Typed.\n' }],
            before: ['textDocument/didOpen Typed.\n'],
            after: ['textDocument/didChange Typed more.\n']
        });
    });
});
