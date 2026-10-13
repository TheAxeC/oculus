// Layer 2, server. What an adapter declares in its answer to `initialize`, read through a shape
// and turned into the capabilities the controls follow (`DebugCapabilities`). The oculus adapter's
// capabilities are fixed: it offers function breakpoints and the evaluation of an expression on
// hover, and none of the rest. An adapter that sends a body that does not read declares nothing.

import { z } from 'zod';
import type { DebugCapabilities } from '../../../../data/model/index.ts';

const filterShape = z.object({
    filter: z.string(),
    label: z.string().default(''),
    default: z.boolean().optional(),
    supportsCondition: z.boolean().optional()
});

/** The body of the `initialize` response, with the fields the client reads. */
const capabilitiesShape = z
    .object({
        supportsConfigurationDoneRequest: z.boolean().optional(),
        supportsFunctionBreakpoints: z.boolean().optional(),
        supportsConditionalBreakpoints: z.boolean().optional(),
        supportsHitConditionalBreakpoints: z.boolean().optional(),
        supportsLogPoints: z.boolean().optional(),
        supportsEvaluateForHovers: z.boolean().optional(),
        supportsSetVariable: z.boolean().optional(),
        supportsRestartRequest: z.boolean().optional(),
        supportsTerminateRequest: z.boolean().optional(),
        supportsCompletionsRequest: z.boolean().optional(),
        supportsLoadedSourcesRequest: z.boolean().optional(),
        exceptionBreakpointFilters: z.array(filterShape).optional()
    })
    .loose();

/** What the client needs of the answer beyond the controls: whether `configurationDone` is sent. */
export type Declared = DebugCapabilities & { configurationDone: boolean };

/** The type name the oculus adapter's capabilities are held under. */
export const RITE = 'rite';

/** The capabilities of the oculus adapter. */
export const RITE_CAPABILITIES: Declared = {
    conditions: false,
    hitConditions: false,
    logpoints: false,
    functions: true,
    functionConditions: false,
    setVariable: false,
    restart: false,
    terminate: false,
    hover: true,
    completions: false,
    loadedSources: false,
    exceptionFilters: [],
    configurationDone: true
};

/** The capabilities an adapter's body declares; none when the body does not read. */
export function declaredBy(body: unknown): Declared {
    const read = capabilitiesShape.safeParse(body ?? {});
    const caps = read.success ? read.data : {};
    return {
        conditions: caps.supportsConditionalBreakpoints === true,
        hitConditions: caps.supportsHitConditionalBreakpoints === true,
        logpoints: caps.supportsLogPoints === true,
        functions: caps.supportsFunctionBreakpoints === true,
        functionConditions:
            caps.supportsFunctionBreakpoints === true &&
            caps.supportsConditionalBreakpoints === true,
        setVariable: caps.supportsSetVariable === true,
        restart: caps.supportsRestartRequest === true,
        terminate: caps.supportsTerminateRequest === true,
        hover: caps.supportsEvaluateForHovers === true,
        completions: caps.supportsCompletionsRequest === true,
        loadedSources: caps.supportsLoadedSourcesRequest === true,
        exceptionFilters: (caps.exceptionBreakpointFilters ?? []).map((one) => ({
            filter: one.filter,
            label: one.label === '' ? one.filter : one.label,
            enabled: one.default === true,
            supportsCondition: one.supportsCondition === true
        })),
        configurationDone: caps.supportsConfigurationDoneRequest === true
    };
}

/** The capabilities as published, without the field only the client reads. */
export function shown(declared: Declared): DebugCapabilities {
    return Object.fromEntries(
        Object.entries(declared).filter(([key]) => key !== 'configurationDone')
    ) as unknown as DebugCapabilities;
}
