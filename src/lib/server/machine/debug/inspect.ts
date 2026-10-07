// Layer 2, server. What the debug client reads from the adapter while a program is paused: the
// stack, the scopes of a frame with their variables, and an expression evaluated in a frame. Each
// function asks through a `Link`, the three things it needs of the session it belongs to: the
// request to the adapter, the reading of a body through a zod shape (which ends the session when
// the body does not read), and the path of a frame's file as the page named it. So this module
// holds no state, and the session decides whether an answer is wanted once it arrives.

import type { ZodType } from 'zod';
import type { DebugFrame, DebugScope, DebugWatch } from '../../../data/model/index.ts';
import { scopesShape, stackShape, evaluateShape, variablesShape } from './shapes.ts';
import { Refused, THREAD, type Command, type Requests } from './wire.ts';

/** The result of an evaluation: the adapter's value, or the text it failed with. */
export type Evaluation = { value: string } | { failed: string };

/** What a read of the adapter needs of the session that asks. */
export type Link = {
    ask: <C extends Command>(command: C, args: Requests[C]) => Promise<unknown>;
    read: <T>(shape: ZodType<T>, body: unknown) => T;
    reported: (path: string | undefined) => string;
};

/** The frames of the pause, the top one first. */
export async function readFrames(link: Link): Promise<DebugFrame[]> {
    const body = await link.ask('stackTrace', { threadId: THREAD });
    return link.read(stackShape, body).stackFrames.map((one) => ({
        id: one.id,
        name: one.name,
        path: link.reported(one.source?.path),
        line: one.line,
        column: one.column ?? 0
    }));
}

/** The scopes of a frame with the variables each one holds. */
export async function readScopes(link: Link, frame: number): Promise<DebugScope[]> {
    const body = await link.ask('scopes', { frameId: frame });
    const scopes: DebugScope[] = [];
    for (const scope of link.read(scopesShape, body).scopes) {
        if (scope.variablesReference === 0) {
            scopes.push({ name: scope.name, variables: [] });
            continue;
        }
        const answer = await link.ask('variables', {
            variablesReference: scope.variablesReference
        });
        const variables = link.read(variablesShape, answer).variables;
        scopes.push({
            name: scope.name,
            variables: variables.map((one) => ({ name: one.name, value: one.value }))
        });
    }
    return scopes;
}

/** One evaluation: the adapter's value or its error text. */
export async function evaluateIn(
    link: Link,
    expression: string,
    context: 'watch' | 'repl' | 'hover',
    frame: number
): Promise<Evaluation> {
    try {
        const body = await link.ask('evaluate', { expression, frameId: frame, context });
        return { value: link.read(evaluateShape, body).result };
    } catch (error) {
        if (error instanceof Refused) return { failed: error.message };
        throw error;
    }
}

/** Each watch expression evaluated in a frame, a value or the adapter's error. */
export async function evaluateWatch(
    link: Link,
    expressions: string[],
    frame: number
): Promise<DebugWatch[]> {
    const results: DebugWatch[] = [];
    for (const expression of expressions) {
        const answer = await evaluateIn(link, expression, 'watch', frame);
        results.push(
            'value' in answer
                ? { expression, value: answer.value }
                : { expression, error: answer.failed }
        );
    }
    return results;
}
