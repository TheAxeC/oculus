// Layer 2, client state. The schemas of what the terminals store reads off the wire: one terminal
// as the `sessions` payload and a start's answer carry it, the list of them, and the `pty:` payload
// of a pane's output. Each answers the data model's own type, so a store never casts what the
// server sent.

import { z } from 'zod';
import type { PtyPayload, Terminal } from '../../../data/model/index.ts';
import { readAs, survivorsShape } from '../../../data/shapes/shapes.ts';

/** One terminal with every field the page draws; the server sets all of them but `foreign`. */
export const terminalShape = z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
    icon: z.string(),
    color: z.string(),
    kind: z.enum(['claude', 'codex', 'shell']),
    cwd: z.string(),
    command: z.string(),
    pid: z.number(),
    created: z.string(),
    attached: z.boolean(),
    resumes: z.object({ tool: z.enum(['claude', 'codex']), id: z.string() }).nullable(),
    task: z.boolean(),
    exit: z.number().nullable(),
    job: z
        .object({
            repo: z.string(),
            name: z.string(),
            source: z.enum(['file', 'saved', 'found', 'latex']).optional(),
            token: z.string().optional(),
            chain: z.array(z.object({ name: z.string(), cwd: z.string() })).optional()
        })
        .nullable(),
    foreign: z.boolean().optional()
}) satisfies z.ZodType<Terminal>;

/**
 * The terminals of a list: the list itself when every item is a terminal, so a view gets the same
 * objects, else a new list of the items that are.
 */
const terminalsShape = survivorsShape(terminalShape);

/**
 * A reader of the `sessions` payload's terminals that reads a list once. The terminals are asked
 * for by id on every render, so the answer for a list is held until another list is handed in.
 * It answers null for a value that is no list.
 */
export function terminalsReader(): (list: unknown) => Terminal[] | null {
    let heard = false;
    let from: unknown;
    let read: Terminal[] | null = null;
    return (list) => {
        if (heard && list === from) return read;
        heard = true;
        from = list;
        read = readAs(terminalsShape, list);
        return read;
    };
}

/** The bytes a `pty:` payload carries, base64 as sent. */
const ptyPayloadShape = z.object({ bytes: z.string().catch('') }) satisfies z.ZodType<PtyPayload>;

/** The encoded bytes of a `pty:` payload, and the empty text for a payload that carries none. */
export function ptyBytesOf(payload: unknown): string {
    return readAs(ptyPayloadShape, payload)?.bytes ?? '';
}
