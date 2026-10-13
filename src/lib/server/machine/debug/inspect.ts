// Layer 2, server. What the debug client reads from the adapter while a program is paused: the
// stack, the scopes of a frame with their variables, and an expression evaluated in a frame. Each
// function asks through a `Link`, the three things it needs of the session it belongs to: the
// request to the adapter, the reading of a body through a zod shape (which ends the session when
// the body does not read), and the path of a frame's file as the page named it. So this module
// holds no state, and the session decides whether an answer is wanted once it arrives.

import type { ZodType } from 'zod';
import type {
    DebugFrame,
    DebugLoadedSource,
    DebugScope,
    DebugWatch
} from '../../../data/model/index.ts';
import {
    completionsShape,
    evaluateShape,
    scopesShape,
    setVariableShape,
    sourcesShape,
    stackShape,
    variablesShape
} from './shapes.ts';
import { Refused, type Command, type Requests } from './wire.ts';

/** The result of an evaluation: the adapter's value, or the text it failed with. */
export type Evaluation = { value: string } | { failed: string };

/** What a read of the adapter needs of the session that asks. */
export type Link = {
    ask: <C extends Command>(command: C, args: Requests[C]) => Promise<unknown>;
    read: <T>(shape: ZodType<T>, body: unknown) => T;
    reported: (path: string | undefined) => string;
    /** The thread the commands name. */
    thread: number;
};

/** The frames of the pause, the top one first. */
export async function readFrames(link: Link): Promise<DebugFrame[]> {
    const body = await link.ask('stackTrace', { threadId: link.thread });
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
            scopes.push({ name: scope.name, reference: 0, variables: [] });
            continue;
        }
        const answer = await link.ask('variables', {
            variablesReference: scope.variablesReference
        });
        const variables = link.read(variablesShape, answer).variables;
        scopes.push({
            name: scope.name,
            reference: scope.variablesReference,
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

/** The value the adapter holds for a variable after it was set. */
export async function setVariableIn(
    link: Link,
    reference: number,
    name: string,
    value: string
): Promise<string> {
    const body = await link.ask('setVariable', { variablesReference: reference, name, value });
    return link.read(setVariableShape, body).value;
}

/**
 * One completion of the Debug Console: `start` is the column, counting from 1, where `text`
 * replaces `length` characters; an adapter that names no start has the text inserted at the column
 * the request asked for.
 */
export type Completion = { label: string; text: string; start: number; length: number };

/** The completions of a text at a column in the selected frame. */
export async function completionsIn(
    link: Link,
    text: string,
    column: number,
    frame: number | null
): Promise<Completion[]> {
    const body = await link.ask('completions', {
        text,
        column,
        ...(frame === null ? {} : { frameId: frame })
    });
    return link.read(completionsShape, body).targets.map((one) => ({
        label: one.label,
        text: one.text ?? one.label,
        start: one.start ?? column,
        length: one.length ?? 0
    }));
}

/** The sources the adapter reports loaded, by the path the page names them. */
export async function loadedSourcesIn(link: Link): Promise<DebugLoadedSource[]> {
    const body = await link.ask('loadedSources', {});
    return link.read(sourcesShape, body).sources.map((one) => ({
        name: one.name ?? one.path ?? '',
        path: link.reported(one.path)
    }));
}
