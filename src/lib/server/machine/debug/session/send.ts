// Layer 2, server. What the debug client (session.ts) sends an adapter about breakpoints once the
// handshake allows it: one file's breakpoints, the function breakpoints and the exception filters
// that are on. A condition, a hit condition and a log message go to the adapter only for what it
// declared, and an answer is dropped when the run it was asked in is no longer the current one.

import type { ZodType } from 'zod';
import type { DebugBreakpointSpec } from '../../../../data/model/index.ts';
import { realPath } from '../../../core/paths.ts';
import { RITE } from '../app/capabilities.ts';
import type { Filters } from '../app/filters.ts';
import type { Breakpoints } from '../breakpoints.ts';
import { breakpointsShape } from '../shapes.ts';
import type { Command, Requests } from '../wire.ts';
import type { FunctionSpec, Run } from './types.ts';

/** What the sends need of the client: the request, the shape reader and the stores they fill. */
export type Sending = {
    ask: <C extends Command>(run: Run, command: C, args: Requests[C]) => Promise<unknown>;
    read: <T>(run: Run, shape: ZodType<T>, body: unknown) => T;
    current: (run: Run) => boolean;
    breakpoints: Breakpoints;
    filters: Filters;
};

/**
 * Set one file's breakpoints. A condition, a hit condition and a log message go to the adapter
 * only for what it declared; a breakpoint that carries one the adapter did not declare is set
 * as a plain breakpoint.
 */
export async function sendBreakpoints(
    sending: Sending,
    run: Run,
    path: string,
    specs: DebugBreakpointSpec[]
): Promise<void> {
    run.named.set(realPath(path) ?? path, path);
    const caps = run.capabilities;
    const kept = specs.map((spec) => ({
        line: spec.line,
        ...(caps.conditions && spec.condition ? { condition: spec.condition } : {}),
        ...(caps.hitConditions && spec.hitCondition ? { hitCondition: spec.hitCondition } : {}),
        ...(caps.logpoints && spec.logMessage ? { logMessage: spec.logMessage } : {})
    }));
    const body = await sending.ask(run, 'setBreakpoints', { source: { path }, breakpoints: kept });
    const answers = sending.read(run, breakpointsShape, body).breakpoints;
    if (!sending.current(run)) return;
    sending.breakpoints.setFile(path, specs, answers);
}

/** Set the function breakpoints the page holds. */
export async function sendFunctions(
    sending: Sending,
    run: Run,
    specs: FunctionSpec[]
): Promise<void> {
    const caps = run.capabilities;
    const body = await sending.ask(run, 'setFunctionBreakpoints', {
        breakpoints: specs.map((spec) => ({
            name: spec.name,
            ...(caps.functionConditions && spec.condition ? { condition: spec.condition } : {}),
            ...(caps.functionConditions && caps.hitConditions && spec.hitCondition
                ? { hitCondition: spec.hitCondition }
                : {})
        }))
    });
    const answers = sending.read(run, breakpointsShape, body).breakpoints;
    if (!sending.current(run)) return;
    sending.breakpoints.setFunctions(specs, answers);
}

/** Send the exception filters that are on; the oculus adapter is sent none. */
export async function sendExceptions(sending: Sending, run: Run): Promise<void> {
    if (run.type !== RITE && sending.filters.list().length === 0) return;
    await sending.ask(run, 'setExceptionBreakpoints', sending.filters.body());
}
