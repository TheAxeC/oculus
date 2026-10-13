// Layer 2, server. The body of POST /api/ops as a shape, one per operation: what
// server/files/fs/ops.ts reads a request with before any operation runs.

import { z } from 'zod';
import type { OpsRequest } from '../../../../data/file-ops.ts';

const place = z.object({ root: z.string(), path: z.string() });

/** The half of a search that a replace and its preview are made under. */
const queryShape = z.object({
    q: z.string(),
    word: z.boolean(),
    case: z.boolean(),
    regex: z.boolean(),
    under: z.string()
});

/** A position of the protocol, as an `lsp-edit` names the places its edits are made at. */
const position = z.object({
    line: z.number().int().min(0),
    character: z.number().int().min(0)
});

/** The files of an `lsp-edit` and of a `writing-fix`: each with the hash it was read at. */
const editFiles = z.array(
    z.object({
        root: z.string(),
        path: z.string(),
        hash: z.string(),
        edits: z.array(
            z.object({
                range: z.object({ start: position, end: position }),
                newText: z.string()
            })
        )
    })
);

/** The body of POST /api/ops, one shape per operation. */
export const opsShape = z.discriminatedUnion('op', [
    z.object({
        op: z.literal('create'),
        root: z.string(),
        path: z.string(),
        name: z.string(),
        folder: z.boolean()
    }),
    z.object({ op: z.literal('rename'), root: z.string(), path: z.string(), name: z.string() }),
    z.object({ op: z.literal('trash'), root: z.string(), paths: z.array(z.string()) }),
    z.object({ op: z.literal('delete'), root: z.string(), paths: z.array(z.string()) }),
    z.object({
        op: z.literal('paste'),
        mode: z.enum(['copy', 'move']),
        items: z.array(place),
        root: z.string(),
        path: z.string(),
        replace: z.boolean()
    }),
    z.object({
        op: z.literal('upload'),
        root: z.string(),
        path: z.string(),
        name: z.string(),
        data: z.string(),
        replace: z.boolean()
    }),
    z.object({
        op: z.literal('replace'),
        query: queryShape,
        replace: z.string(),
        preserveCase: z.boolean(),
        items: z.array(
            z.object({
                root: z.string(),
                path: z.string(),
                hits: z.array(
                    z.object({
                        line: z.number().int().min(1),
                        at: z.number().int().min(0),
                        match: z.string()
                    })
                )
            })
        )
    }),
    z.object({
        op: z.literal('preview'),
        query: queryShape,
        replace: z.string(),
        preserveCase: z.boolean(),
        root: z.string(),
        path: z.string(),
        hits: z.array(z.object({ line: z.number().int().min(1), at: z.number().int().min(0) }))
    }),
    z.object({ op: z.literal('lsp-edit'), files: editFiles }),
    z.object({ op: z.literal('writing-fix'), files: editFiles })
]) satisfies z.ZodType<OpsRequest>;
