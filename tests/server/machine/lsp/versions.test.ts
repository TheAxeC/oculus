// Layer 4, server test. The version a server holds a document at: a file the page closes and opens
// again, or changes to a version the server held before, is sent to the server at a version above
// every one it was sent before for that file, since a server may keep what it parsed of a file by
// its version. And the page's `textDocument/didSave`: a server whose `initialize` declared `save`
// in its `textDocumentSync` is told the file was saved, with the text when it asked for it, and a
// server that did not declare it is sent nothing.

import { describe, expect } from 'vitest';
import { it } from '../../../fixtures/scratch.ts';
import {
    close,
    frame,
    makeRelay,
    open,
    pageFile,
    plantRoot,
    recordingSink,
    settle,
    stubSpawn
} from './lsp-fixture.ts';

const YAML = 'lsp:yaml';
const PYTHON = 'lsp:python';

/** The versions of the textDocument messages a stub was sent, in order, with their method. */
function sent(messages: { method?: string; params?: unknown }[]): [string, number][] {
    const found: [string, number][] = [];
    for (const message of messages) {
        const params = message.params as {
            textDocument?: { version?: number };
        };
        if (
            message.method === 'textDocument/didOpen' ||
            message.method === 'textDocument/didChange'
        )
            found.push([message.method, params.textDocument?.version ?? -1]);
    }
    return found;
}

describe('the version a document is held at', () => {
    it('is above every version sent before for the file, after a close and an open again', async () => {
        const dir = plantRoot(['a.yml']);
        const spawned = stubSpawn();
        const relay = makeRelay({ roots: () => [{ key: 'repo', dir }], spawn: spawned.spawn });
        const { sink } = recordingSink();
        const uri = pageFile('repo', 'a.yml');
        open(relay, sink, YAML, uri, 'yaml');
        await settle();
        relay.inbound(
            sink,
            frame(YAML, {
                jsonrpc: '2.0',
                method: 'textDocument/didChange',
                params: { textDocument: { uri, version: 2 }, contentChanges: [{ text: 'a: 2\n' }] }
            })
        );
        close(relay, sink, YAML, uri);
        await settle();
        open(relay, sink, YAML, uri, 'yaml');
        await settle();
        const versions = sent(spawned.children[0].messages).map(([, version]) => version);
        expect(versions).toHaveLength(3);
        expect(versions[0]).toBe(1);
        expect(versions[1]).toBe(2);
        expect(versions[2]).toBeGreaterThan(2);
        await relay.close();
    });

    // The version a server names toward the page is the page's own: the shift a reopened file was
    // given is taken off, so an edit computed after the reopen passes the page's check on the
    // version it holds.
    it('is the page version again in an answer and in an applyEdit request', async () => {
        const dir = plantRoot(['a.py']);
        const spawned = stubSpawn();
        const relay = makeRelay({ roots: () => [{ key: 'repo', dir }], spawn: spawned.spawn });
        const { sink, frames } = recordingSink();
        const uri = pageFile('repo', 'a.py');
        open(relay, sink, PYTHON, uri, 'python');
        await settle();
        close(relay, sink, PYTHON, uri);
        await settle();
        open(relay, sink, PYTHON, uri, 'python');
        await settle();
        const stub = spawned.children[0];
        const opens = stub.messages.filter((message) => message.method === 'textDocument/didOpen');
        const named = (opens[1].params as { textDocument: { uri: string; version: number } })
            .textDocument;
        expect(named.version).toBeGreaterThan(1);
        const edit = {
            documentChanges: [
                {
                    textDocument: { uri: named.uri, version: named.version },
                    edits: [
                        {
                            range: {
                                start: { line: 0, character: 0 },
                                end: { line: 0, character: 1 }
                            },
                            newText: 'y'
                        }
                    ]
                }
            ]
        };
        relay.inbound(
            sink,
            frame(PYTHON, {
                jsonrpc: '2.0',
                id: 7,
                method: 'textDocument/rename',
                params: {
                    textDocument: { uri },
                    position: { line: 0, character: 0 },
                    newName: 'y'
                }
            })
        );
        await settle();
        const asked = stub.messages.find((message) => message.method === 'textDocument/rename');
        stub.say({ jsonrpc: '2.0', id: asked?.id ?? null, result: edit });
        stub.say({
            jsonrpc: '2.0',
            id: 'srv-1',
            method: 'workspace/applyEdit',
            params: { edit }
        });
        await settle();
        const versionOf = (value: unknown): unknown =>
            (value as { documentChanges: { textDocument: { version: number } }[] })
                .documentChanges[0].textDocument.version;
        const answer = frames.find((one) => one.payload.id === 7);
        const request = frames.find((one) => one.payload.method === 'workspace/applyEdit');
        expect(versionOf(answer?.payload.result)).toBe(1);
        expect(versionOf((request?.payload.params as { edit: unknown }).edit)).toBe(1);
        await relay.close();
    });
});

const ROWS: { name: string; capabilities: Record<string, unknown>; sent: unknown[] }[] = [
    {
        name: 'declares save as true',
        capabilities: { textDocumentSync: { save: true } },
        sent: [{}]
    },
    {
        name: 'declares save with includeText',
        capabilities: { textDocumentSync: { save: { includeText: true } } },
        sent: [{ text: 'x = 2\n' }]
    },
    {
        name: 'declares save without includeText',
        capabilities: { textDocumentSync: { save: {} } },
        sent: [{}]
    },
    {
        name: 'declares a sync of open, close and change only',
        capabilities: { textDocumentSync: { openClose: true, change: 2 } },
        sent: []
    },
    { name: 'declares the sync as a number', capabilities: { textDocumentSync: 2 }, sent: [] },
    {
        name: 'declares save as false',
        capabilities: { textDocumentSync: { save: false } },
        sent: []
    }
];

describe('a save of a file the page holds', () => {
    for (const row of ROWS) {
        it(`is sent to a server that ${row.name} as ${JSON.stringify(row.sent)}`, async () => {
            const dir = plantRoot(['a.py']);
            const spawned = stubSpawn(() => ({ capabilities: row.capabilities }));
            const relay = makeRelay({ roots: () => [{ key: 'repo', dir }], spawn: spawned.spawn });
            const { sink } = recordingSink();
            const uri = pageFile('repo', 'a.py');
            open(relay, sink, PYTHON, uri, 'python');
            await settle();
            relay.inbound(
                sink,
                frame(PYTHON, {
                    jsonrpc: '2.0',
                    method: 'textDocument/didSave',
                    params: { textDocument: { uri }, text: 'x = 2\n' }
                })
            );
            await settle();
            const saves = spawned.children[0].messages.filter(
                (message) => message.method === 'textDocument/didSave'
            );
            expect(saves.map((one) => one.params)).toEqual(
                row.sent.map((extra) => ({
                    textDocument: { uri: expect.stringMatching(/a\.py$/) as unknown },
                    ...(extra as object)
                }))
            );
            await relay.close();
        });
    }

    it('is sent to no server for a file the page does not hold', async () => {
        const dir = plantRoot(['a.py']);
        const spawned = stubSpawn(() => ({ capabilities: { textDocumentSync: { save: true } } }));
        const relay = makeRelay({ roots: () => [{ key: 'repo', dir }], spawn: spawned.spawn });
        const { sink } = recordingSink();
        open(relay, sink, PYTHON, pageFile('repo', 'a.py'), 'python');
        await settle();
        relay.inbound(
            sink,
            frame(PYTHON, {
                jsonrpc: '2.0',
                method: 'textDocument/didSave',
                params: { textDocument: { uri: pageFile('repo', 'b.py') }, text: '' }
            })
        );
        await settle();
        expect(spawned.children[0].received).not.toContain('textDocument/didSave');
        await relay.close();
    });
});
