// Layer 2, server. Normalize Claude and Codex transcript usage records for every server consumer.

import { z } from 'zod';

export type UsageEvent = {
    model: string;
    stamp: string | number | null;
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
    thinking: number;
    ttl?: '1h' | '5m' | null;
    context?: number;
    contextWindow?: number;
};

export type UsageTotals = Pick<
    UsageEvent,
    'input' | 'output' | 'cacheRead' | 'cacheCreation' | 'thinking'
>;

/** A stamp as the record writes it: any text but the empty one, or a finite number, else none. */
const usageStampShape = z
    .union([z.string().min(1), z.number()])
    .nullable()
    .catch(null);

/** A token count as the record writes it: a finite number, else none. */
const countShape = z.number().optional().catch(undefined);

/** The whole part of a token count, and zero for none. */
function trunc(count: number | undefined): number {
    return Math.trunc(count ?? 0);
}

/** The usage map of a Claude assistant record, every count read as zero when it is missing. */
const claudeCountsShape = z.object({
    input_tokens: countShape,
    output_tokens: countShape,
    cache_read_input_tokens: countShape,
    cache_creation_input_tokens: countShape,
    output_tokens_details: z.object({ thinking_tokens: countShape }).optional().catch(undefined),
    cache_creation: z
        .object({ ephemeral_1h_input_tokens: countShape, ephemeral_5m_input_tokens: countShape })
        .nullish()
        .catch(null)
});

/**
 * The fields of a Claude assistant record's `message` that usage is read from: its model, and its
 * usage map when it has one. `fold.ts` reads the rest of the message beside them in one parse.
 */
export const claudeMessageFields = {
    model: z.string().optional().catch(undefined),
    usage: claudeCountsShape.nullish().catch(null)
};

/** The `message` of a Claude assistant record: its model, and its usage map when it has one. */
const claudeUsageMessageShape = z
    .object(claudeMessageFields)
    .catch(() => ({ model: undefined, usage: undefined }));

/** What of a message the usage is read from, as `claudeMessageFields` parses it. */
export type UsageMessage = z.output<typeof claudeUsageMessageShape>;

/**
 * What decides whether a Claude record carries usage. Its `message` is read only once the record
 * proves to be an assistant's, which is a fraction of the records of a transcript.
 */
const claudeRecordShape = z.object({
    type: z.string().catch(''),
    timestamp: z.unknown().optional(),
    message: z.unknown().optional()
});

/**
 * The usage one Claude assistant record carries. A `message` or `usage` that is no map reads as
 * absent. The context is left out of the answer when the record carries no usage map, and the ttl
 * is the hour window when it was written to, else the five-minute one.
 */
export function usageOf(stamp: UsageEvent['stamp'], message: UsageMessage): UsageEvent {
    const usage = message.usage ?? null;
    const creation = usage?.cache_creation ?? null;
    let ttl: '1h' | '5m' | null = null;
    if (creation !== null) {
        if (trunc(creation.ephemeral_1h_input_tokens)) ttl = '1h';
        else if (trunc(creation.ephemeral_5m_input_tokens)) ttl = '5m';
    }
    const input = trunc(usage?.input_tokens);
    const cacheRead = trunc(usage?.cache_read_input_tokens);
    const cacheCreation = trunc(usage?.cache_creation_input_tokens);
    return {
        model: message.model ?? '',
        stamp,
        input,
        output: trunc(usage?.output_tokens),
        cacheRead,
        cacheCreation,
        thinking: trunc(usage?.output_tokens_details?.thinking_tokens),
        ttl,
        ...(usage === null ? {} : { context: input + cacheCreation + cacheRead })
    };
}

/** The normalized usage carried by one Claude assistant record. */
export function claudeUsage(record: Record<string, unknown>): UsageEvent | null {
    const head = claudeRecordShape.parse(record);
    if (head.type !== 'assistant') return null;
    return usageOf(
        usageStampShape.parse(head.timestamp),
        claudeUsageMessageShape.parse(head.message)
    );
}

/** The lifetime totals of a Codex token count, each read as zero when it is missing. */
const codexTotalsShape = z.object({
    input_tokens: countShape,
    output_tokens: countShape,
    cached_input_tokens: countShape,
    cache_write_input_tokens: countShape,
    reasoning_output_tokens: countShape
});

/**
 * What a Codex `token_count` event carries: the lifetime totals when it has them, the last turn's
 * occupancy when it has that, and the context window. An `info` that is no map carries none of
 * them.
 */
export const codexInfoShape = z
    .object({
        total_token_usage: codexTotalsShape.nullish().catch(null),
        last_token_usage: z
            .object({ input_tokens: countShape, cached_input_tokens: countShape })
            .nullish()
            .catch(null),
        model_context_window: countShape
    })
    .catch(() => ({
        total_token_usage: null,
        last_token_usage: null,
        model_context_window: undefined
    }));

/** What a `token_count` event's `info` carries, as `codexInfoShape` reads it. */
export type CodexInfo = z.output<typeof codexInfoShape>;

/**
 * What decides whether a Codex record is a token count: the record's type and stamp, and its
 * `payload` read only once the record proves to be an event, which most records of a rollout are
 * not counts of.
 */
const codexRecordShape = z.object({
    type: z.string().catch(''),
    timestamp: z.unknown().optional(),
    payload: z.unknown().optional()
});

/** The type of an event's payload, and its `info` read only for a token count. */
const codexTokenPayloadShape = z
    .object({ type: z.string().catch(''), info: z.unknown().optional() })
    .catch(() => ({ type: '', info: undefined }));

function delta(previous: Partial<UsageTotals>, field: keyof UsageTotals, total: number): number {
    const difference = total - (previous[field] ?? 0);
    previous[field] = total;
    return difference < 0 ? total : difference;
}

/**
 * The normalized delta carried by the `info` of one Codex token-count event, read against the
 * lifetime totals `previous` holds, which it moves on.
 */
export function codexUsageOf(
    stamp: UsageEvent['stamp'],
    info: CodexInfo,
    previous: Partial<UsageTotals>
): UsageEvent {
    // An event without lifetime totals counts nothing and leaves the baseline as it is, while its
    // occupancy and window are still carried.
    const totals = info.total_token_usage ?? null;
    const last = info.last_token_usage ?? null;
    const window = trunc(info.model_context_window);
    const step = (field: keyof UsageTotals, total: number | undefined): number =>
        totals === null ? 0 : delta(previous, field, trunc(total));
    return {
        model: '',
        stamp,
        input: step('input', totals?.input_tokens),
        output: step('output', totals?.output_tokens),
        cacheRead: step('cacheRead', totals?.cached_input_tokens),
        cacheCreation: step('cacheCreation', totals?.cache_write_input_tokens),
        thinking: step('thinking', totals?.reasoning_output_tokens),
        ...(last === null
            ? {}
            : { context: trunc(last.input_tokens) + trunc(last.cached_input_tokens) }),
        ...(window ? { contextWindow: window } : {})
    };
}

/** The normalized delta carried by one Codex token-count record. */
export function codexUsage(
    record: Record<string, unknown>,
    previous: Partial<UsageTotals>
): UsageEvent | null {
    const head = codexRecordShape.parse(record);
    if (head.type !== 'event_msg') return null;
    const payload = codexTokenPayloadShape.parse(head.payload);
    if (payload.type !== 'token_count') return null;
    return codexUsageOf(
        usageStampShape.parse(head.timestamp),
        codexInfoShape.parse(payload.info),
        previous
    );
}
