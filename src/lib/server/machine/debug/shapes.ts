// Layer 2, server. What the debug adapter's events and response bodies must hold for the client to
// read them: one zod shape for each, so an answer that does not read ends the session rather than
// reaching the state half read. The shapes name the fields the client uses; any other field of a
// body is left unread.

import { z } from 'zod';

export const outputShape = z.object({ category: z.string().optional(), output: z.string() });

export const stoppedShape = z.object({
    reason: z.string(),
    description: z.string().optional(),
    hitBreakpointIds: z.array(z.number()).optional()
});

/** The answer to a set of breakpoints: one entry for each breakpoint sent, in order. */
export const breakpointsShape = z.object({
    breakpoints: z.array(
        z.object({
            id: z.number().optional(),
            verified: z.boolean(),
            message: z.string().optional()
        })
    )
});

export type BreakpointAnswers = z.infer<typeof breakpointsShape>['breakpoints'];

/** A `breakpoint` event: the adapter's new word on a breakpoint it answered before. */
export const breakpointEventShape = z.object({
    reason: z.string(),
    breakpoint: z.object({
        id: z.number().optional(),
        verified: z.boolean(),
        message: z.string().optional()
    })
});

export const stackShape = z.object({
    stackFrames: z.array(
        z.object({
            id: z.number(),
            name: z.string(),
            line: z.number(),
            column: z.number().optional(),
            source: z.object({ path: z.string().optional() }).optional()
        })
    )
});

export const scopesShape = z.object({
    scopes: z.array(z.object({ name: z.string(), variablesReference: z.number() }))
});

export const variablesShape = z.object({
    variables: z.array(z.object({ name: z.string(), value: z.string() }))
});

export const evaluateShape = z.object({ result: z.string() });
