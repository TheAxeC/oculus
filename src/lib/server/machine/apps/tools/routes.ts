// Layer 2, server. What the page asks of the tools of the running hosts through POST /api/app-host
// (routes/host.ts calls `handleToolsPost` for these actions; the write token is checked there):
//
// - `decorate` asks for the file decorations of the files a Files view draws, one root and a list
//   of paths; the answer holds the joined decoration of each path and the paths whose providers
//   had not answered in time, which are named as changed when they do.
// - `scm` is the reader's action on a source control of an app: typing in its input box, the
//   accept command, a press on a row, a menu command on the control, a group or rows, and the
//   original text of a file for the quick diff. A command a menu runs must be one the app declares.
// - `file` reads a grammar, language configuration, snippet file or schema the app's manifest
//   names, as JSON, for the editor's languages; any other path is `missing`.
// - `terminal` reports the terminal a page shows, which the host reads as `activeTerminal`.
//
// An app that does not act, whose host is not running or that holds no such source control is
// refused with the word of the refusal: `closed`, `host_down` or `missing`.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { toolFileValue } from '../read/tool-files/tool-files.ts';
import { Refused } from '../host/connection.ts';
import type { AppTools } from './registry.ts';

const NO_STORE = { 'cache-control': 'no-store' };

/** The most paths one `decorate` names. */
const DECORATE_MAX = 500;

/** A change of the quick diff, as VS Code's `LineChange` names its lines (1-based, 0 for none). */
const changeShape = z.object({
    originalStartLineNumber: z.number().int().min(0),
    originalEndLineNumber: z.number().int().min(0),
    modifiedStartLineNumber: z.number().int().min(0),
    modifiedEndLineNumber: z.number().int().min(0)
});

/** The actions of the tools a body can carry. */
export const toolsShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('decorate'),
        root: z.string().min(1).max(4096),
        paths: z.array(z.string().max(4096)).max(DECORATE_MAX)
    }),
    z.object({
        action: z.literal('scm'),
        app: z.string().min(1),
        id: z.string().min(1).max(200),
        op: z.discriminatedUnion('kind', [
            z.object({ kind: z.literal('input'), value: z.string().max(1_000_000) }),
            z.object({ kind: z.literal('accept') }),
            z.object({
                kind: z.literal('pressed'),
                group: z.string().max(200),
                uri: z.string().max(4000)
            }),
            z.object({
                kind: z.literal('execute'),
                command: z.string().min(1).max(500),
                scope: z.enum(['sourceControl', 'group', 'resource', 'change']),
                group: z.string().max(200).default(''),
                resources: z.array(z.string().max(4000)).max(1000).default([]),
                change: z
                    .object({
                        root: z.string().min(1).max(500),
                        path: z.string().max(4000),
                        changes: z.array(changeShape).max(10_000),
                        index: z.number().int().min(0)
                    })
                    .optional()
            }),
            z.object({
                kind: z.literal('original'),
                root: z.string().min(1).max(500),
                path: z.string().max(4000)
            })
        ])
    }),
    z.object({
        action: z.literal('file'),
        app: z.string().min(1),
        kind: z.enum(['grammar', 'configuration', 'snippets', 'schema']),
        path: z.string().min(1).max(4096)
    }),
    z.object({
        action: z.literal('terminal'),
        app: z.string().min(1),
        id: z.string().min(1).max(100)
    })
]);

/** An answer: `{ ok: true, value }` or `{ ok: false, word }`. */
function answered(result: { ok: true; value: unknown } | { ok: false; word: string }): Response {
    return json(result, { headers: NO_STORE });
}

/** Whether the body is one of the tools' actions. */
export function isToolsBody(body: unknown): body is z.infer<typeof toolsShape> {
    return toolsShape.safeParse(body).success;
}

/** Answer an action of the tools. */
export async function handleToolsPost(
    body: z.infer<typeof toolsShape>,
    tools: AppTools
): Promise<Response> {
    if (body.action === 'decorate') {
        const done = await tools.decorations.decorate(body.root, body.paths);
        return answered({ ok: true, value: done });
    }
    const app = tools.active(body.app);
    if (app === undefined) return answered({ ok: false, word: 'closed' });
    if (body.action === 'file') {
        const value = toolFileValue(app.row.folder, app.row.contributes, body.kind, body.path);
        return value === null
            ? answered({ ok: false, word: 'missing' })
            : answered({ ok: true, value });
    }
    if (body.action === 'terminal') {
        const terminals = tools.terminalsOf(app.id);
        if (terminals === undefined) return answered({ ok: false, word: 'host_down' });
        terminals.active(body.id);
        return answered({ ok: true, value: null });
    }
    const source = tools.source(app.id);
    if (source === undefined) return answered({ ok: false, word: 'host_down' });
    if (!source.has(body.id)) return answered({ ok: false, word: 'missing' });
    const op = body.op;
    try {
        if (op.kind === 'input') {
            source.input(body.id, op.value);
            return answered({ ok: true, value: null });
        }
        if (op.kind === 'accept') {
            await source.accept(body.id);
            return answered({ ok: true, value: null });
        }
        if (op.kind === 'pressed') {
            return answered({
                ok: true,
                value: await source.pressed(body.id, op.group, op.uri)
            });
        }
        if (op.kind === 'original') {
            return answered({ ok: true, value: await source.original(body.id, op.root, op.path) });
        }
        if (!app.row.contributes.commands.some((one) => one.command === op.command)) {
            return answered({ ok: false, word: 'not_declared' });
        }
        await source.execute(body.id, op.command, op.scope, op.group, op.resources, op.change);
        return answered({ ok: true, value: null });
    } catch (error) {
        return answered({ ok: false, word: error instanceof Refused ? error.word : 'host_down' });
    }
}
