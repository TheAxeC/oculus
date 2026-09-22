// Layer 2, server. Normalize Claude and Codex transcript usage records for every server consumer.

import { isMap } from '../../data/helpers/guards.ts';

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

function count(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0;
}

function stamp(value: unknown): string | number | null {
    if (typeof value === 'string') return value === '' ? null : value;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** The normalized usage carried by one Claude assistant record. */
export function claudeUsage(record: Record<string, unknown>): UsageEvent | null {
    if (record.type !== 'assistant') return null;
    const message = isMap(record.message) ? record.message : {};
    const usage = isMap(message.usage) ? message.usage : null;
    const values = usage ?? {};
    const creation = isMap(values.cache_creation) ? values.cache_creation : null;
    let ttl: '1h' | '5m' | null = null;
    if (creation !== null) {
        if (count(creation.ephemeral_1h_input_tokens)) ttl = '1h';
        else if (count(creation.ephemeral_5m_input_tokens)) ttl = '5m';
    }
    const details = isMap(values.output_tokens_details) ? values.output_tokens_details : {};
    return {
        model: typeof message.model === 'string' ? message.model : '',
        stamp: stamp(record.timestamp),
        input: count(values.input_tokens),
        output: count(values.output_tokens),
        cacheRead: count(values.cache_read_input_tokens),
        cacheCreation: count(values.cache_creation_input_tokens),
        thinking: count(details.thinking_tokens),
        ttl,
        ...(usage !== null
            ? {
                  context:
                      count(values.input_tokens) +
                      count(values.cache_creation_input_tokens) +
                      count(values.cache_read_input_tokens)
              }
            : {})
    };
}

function delta(previous: Partial<UsageTotals>, field: keyof UsageTotals, total: number): number {
    const difference = total - (previous[field] ?? 0);
    previous[field] = total;
    return difference < 0 ? total : difference;
}

/** The normalized delta carried by one Codex token-count record. */
export function codexUsage(
    record: Record<string, unknown>,
    previous: Partial<UsageTotals>
): UsageEvent | null {
    if (record.type !== 'event_msg') return null;
    const payload = isMap(record.payload) ? record.payload : {};
    if (payload.type !== 'token_count') return null;
    const info = isMap(payload.info) ? payload.info : {};
    // An event without lifetime totals counts nothing and leaves the baseline as it is, while its
    // occupancy and window are still carried.
    const totals = isMap(info.total_token_usage) ? info.total_token_usage : null;
    const last = isMap(info.last_token_usage) ? info.last_token_usage : null;
    const window = count(info.model_context_window);
    const step = (field: keyof UsageTotals, key: string): number =>
        totals === null ? 0 : delta(previous, field, count(totals[key]));
    return {
        model: '',
        stamp: stamp(record.timestamp),
        input: step('input', 'input_tokens'),
        output: step('output', 'output_tokens'),
        cacheRead: step('cacheRead', 'cached_input_tokens'),
        cacheCreation: step('cacheCreation', 'cache_write_input_tokens'),
        thinking: step('thinking', 'reasoning_output_tokens'),
        ...(last === null
            ? {}
            : { context: count(last.input_tokens) + count(last.cached_input_tokens) }),
        ...(window ? { contextWindow: window } : {})
    };
}
