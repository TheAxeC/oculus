// Layer 2, client state. The shapes a write's answer is read through (writes.svelte.ts): the parts
// of the answer the page reads, the refusals it lists, and the configured wait a write is given up
// after. A file of its own so the store holds only the sending and the telling.

import { z } from 'zod';
import { optionalTextShape, survivorsShape, unchanged } from '../../../data/shapes/shapes.ts';
import type { WriteAnswer } from '../../shared/stores/shapes.ts';

/** One refusal the endpoint names, answered as the endpoint sent it. */
const refusalShape = unchanged(z.object({ field: z.string(), reason: z.string() }));

/** One branch row of a deposit `branches` answer, as the endpoint sent it. */
const branchShape = unchanged(
    z.object({ name: z.string(), upstream: z.string(), current: z.boolean() })
);

/**
 * The parts of a write's answer the page reads, each with the value it takes when the answer has
 * none: a list that is no list is empty (`branches` absent), a text that is no text is absent, and
 * an item a list should hold and does not is left out of it.
 */
export const answerShape = z.object({
    error: optionalTextShape,
    code: optionalTextShape,
    reason: optionalTextShape,
    changed: survivorsShape(z.string()).catch([]),
    refused: survivorsShape(refusalShape).catch([]),
    output: optionalTextShape,
    branches: survivorsShape(branchShape).optional().catch(undefined),
    id: optionalTextShape,
    hash: optionalTextShape,
    file: optionalTextShape
}) satisfies z.ZodType<
    Pick<
        WriteAnswer,
        | 'error'
        | 'code'
        | 'reason'
        | 'changed'
        | 'refused'
        | 'output'
        | 'branches'
        | 'id'
        | 'hash'
        | 'file'
    >
>;

/** The refusals an answer lists, however many of them are well formed. */
export const refusalsShape = z.object({ refused: z.array(z.unknown()).catch([]) });

/** The configured wait: `writes.timeout_seconds`, a positive number. */
const timeoutShape = z.object({ writes: z.object({ timeout_seconds: z.number().positive() }) });

/**
 * How long a write waits for its answer before it is given up, in milliseconds, from
 * `writes.timeout_seconds` of config/defaults/behavior.yml; null when the configuration names no
 * positive number, and then a write waits as long as the request does.
 */
export function writeTimeout(config: Record<string, unknown> | null): number | null {
    const parsed = timeoutShape.safeParse(config);
    return parsed.success ? parsed.data.writes.timeout_seconds * 1000 : null;
}
