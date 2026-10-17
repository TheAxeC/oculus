// Layer 2, server. The frames of an `lsp:<language>` channel, read and written. A frame is a JSON
// text `{ channel, payload }` from the page and `{ channel, version, payload }` from the server,
// the form every other message of the page's one socket has; the payload is a JSON-RPC message of
// the protocol, or one of the oculus messages data/model's `LspToServer` and `LspToPage` type
// (UV-2), told apart from a JSON-RPC message by their `oculus` field.
//
// The page's frames are read through zod schemas held to those types, so a frame that is none of
// them is refused here and nothing of it reaches a server. The relay sends each frame to the one
// socket it is for, in order; nothing is merged or dropped on the way, which the Hub's latest-only
// rule would do (server/core/channels.ts). `addressOf` names the document a request of the page is
// about, which is what the relay routes it by.

import { z } from 'zod';
import type { LspRpc, LspToPage, LspToServer } from '../../../data/model/index.ts';

/** The prefix of a language server channel, `lsp:<language>`. */
export const LSP_PREFIX = 'lsp:';

/** The language a channel is for, from `lsp:<language>`; null for any other channel. */
export function languageOf(channel: string): string | null {
    return channel.startsWith(LSP_PREFIX) && channel.length > LSP_PREFIX.length
        ? channel.slice(LSP_PREFIX.length)
        : null;
}

const rootShape = z.string().min(1);

/** A file as the page names it. */
const placeShape = z.object({ root: rootShape, path: z.string() });

/** The oculus messages a page may send. */
const oculusShape = z.discriminatedUnion('oculus', [
    z.object({ oculus: z.literal('restart'), root: rootShape, server: z.string().optional() }),
    z.object({ oculus: z.literal('output'), root: rootShape, server: z.string().optional() }),
    z.object({ oculus: z.literal('output_off'), root: rootShape, server: z.string().optional() }),
    z.object({ oculus: z.literal('choices'), root: rootShape }),
    z.object({
        oculus: z.literal('choose'),
        root: rootShape,
        interpreter: z.string().min(1).optional(),
        database: z.string().min(1).optional()
    }),
    z.object({
        oculus: z.literal('approve'),
        root: rootShape,
        approval: z.discriminatedUnion('kind', [
            z.object({ kind: z.literal('interpreter'), path: z.string().min(1) }),
            z.object({ kind: z.literal('config'), key: z.string().min(1) })
        ])
    }),
    z.object({
        oculus: z.literal('revoke'),
        root: rootShape,
        approval: z.object({ kind: z.literal('config') })
    }),
    z.object({ oculus: z.literal('read'), root: rootShape, uri: z.string().min(1) }),
    z.object({ oculus: z.literal('held'), files: z.array(placeShape) }),
    z.object({ oculus: z.literal('held_ask'), id: z.number().int(), files: z.array(placeShape) }),
    z.object({
        oculus: z.literal('links'),
        id: z.number().int(),
        root: rootShape,
        moves: z.array(z.object({ from: z.string().min(1), to: z.string().min(1) })).min(1),
        texts: z.array(z.object({ path: z.string().min(1), text: z.string() }))
    })
]) satisfies z.ZodType<LspToServer>;

/** A JSON-RPC message: a request, a notification or a response. */
const rpcShape = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.number(), z.string(), z.null()]).optional(),
    method: z.string().optional(),
    params: z.unknown().optional(),
    result: z.unknown().optional(),
    error: z
        .object({ code: z.number(), message: z.string(), data: z.unknown().optional() })
        .optional()
});

/** What a frame from the page holds. */
export type Inbound = { kind: 'oculus'; message: LspToServer } | { kind: 'rpc'; message: LspRpc };

/** A frame of an `lsp:` channel read from a text, or null when it is none. */
export function readFrame(text: string): { channel: string; payload: Inbound | null } | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null) return null;
    const channel = (parsed as { channel?: unknown }).channel;
    if (typeof channel !== 'string' || languageOf(channel) === null) return null;
    const payload = (parsed as { payload?: unknown }).payload;
    if (typeof payload === 'object' && payload !== null && 'oculus' in payload) {
        const read = oculusShape.safeParse(payload);
        return { channel, payload: read.success ? { kind: 'oculus', message: read.data } : null };
    }
    const rpc = rpcShape.safeParse(payload);
    return { channel, payload: rpc.success ? { kind: 'rpc', message: rpc.data } : null };
}

/** A frame for the page: the channel, the sequence number of this channel's frame, the message. */
export function writeFrame(channel: string, version: number, payload: LspRpc | LspToPage): string {
    return JSON.stringify({ channel, version, payload });
}

/** Whether a value is a plain object, which is what a message's params and fields are. */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The requests that follow up an item of a call or type hierarchy. */
export const HIERARCHY: readonly string[] = [
    'callHierarchy/incomingCalls',
    'callHierarchy/outgoingCalls',
    'typeHierarchy/supertypes',
    'typeHierarchy/subtypes'
];

/** The page's address of the document a message names, or null when it names none. */
export function addressOf(method: string, params: unknown): string | null {
    if (!isRecord(params)) return null;
    const document = params.textDocument;
    if (isRecord(document) && typeof document.uri === 'string') return document.uri;
    // The follow-up of a hierarchy names the item an earlier answer gave, whose file may be open
    // in no tab.
    if (HIERARCHY.includes(method) && isRecord(params.item)) {
        return typeof params.item.uri === 'string' ? params.item.uri : null;
    }
    // clangd's `textDocument/switchSourceHeader` takes the document's identifier itself.
    if (method === 'textDocument/switchSourceHeader') {
        return typeof params.uri === 'string' ? params.uri : null;
    }
    // A document link resolves by the note its server gave it, which names the document it is in.
    if (method === 'documentLink/resolve') {
        const data = params.data;
        const source = isRecord(data) ? data.source : null;
        const resource = isRecord(source) ? source.resource : null;
        return isRecord(resource) &&
            resource.scheme === 'oculus-file' &&
            typeof resource.path === 'string'
            ? `oculus-file://${resource.path}`
            : null;
    }
    if (method === 'completionItem/resolve') {
        const data = params.data;
        return isRecord(data) && typeof data.uri === 'string' ? data.uri : null;
    }
    if (method === 'workspace/executeCommand' && Array.isArray(params.arguments)) {
        const first: unknown = params.arguments[0];
        if (typeof first === 'string') return first;
        if (!isRecord(first)) return null;
        if (typeof first.file === 'string') return first.file;
        if (isRecord(first.changes)) return Object.keys(first.changes)[0] ?? null;
        if (Array.isArray(first.documentChanges)) {
            const change: unknown = first.documentChanges[0];
            const named = isRecord(change) ? change.textDocument : null;
            return isRecord(named) && typeof named.uri === 'string' ? named.uri : null;
        }
    }
    return null;
}

/**
 * The address of the first file a workspace edit names: a key of its `changes`, else the document
 * of its first `documentChanges` entry, or the address of the file an entry creates, renames or
 * deletes. Null for an edit that names none.
 */
export function editAddress(edit: unknown): string | null {
    if (!isRecord(edit)) return null;
    if (isRecord(edit.changes)) {
        const first = Object.keys(edit.changes).at(0);
        if (first !== undefined) return first;
    }
    if (!Array.isArray(edit.documentChanges)) return null;
    for (const change of edit.documentChanges as unknown[]) {
        if (!isRecord(change)) continue;
        const document = change.textDocument;
        if (isRecord(document) && typeof document.uri === 'string') return document.uri;
        const named = change.uri ?? change.oldUri;
        if (typeof named === 'string') return named;
    }
    return null;
}
