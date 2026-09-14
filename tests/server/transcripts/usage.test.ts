// Layer 4, test. Direct coverage of the shared Claude and Codex transcript usage readers.

import { describe, expect, it } from 'vitest';
import {
    claudeUsage,
    codexUsage,
    type UsageTotals
} from '../../../src/lib/server/transcripts/usage.ts';

type Json = Record<string, unknown>;

function claude(ttl: '1h' | '5m' | null): Json {
    return {
        type: 'assistant',
        timestamp: '2026-09-13T10:00:00Z',
        message: {
            model: 'claude-opus',
            usage: {
                input_tokens: 10,
                output_tokens: 20,
                cache_read_input_tokens: 30,
                cache_creation_input_tokens: 40,
                output_tokens_details: { thinking_tokens: 50 },
                cache_creation: {
                    ephemeral_1h_input_tokens: ttl === '1h' ? 40 : 0,
                    ephemeral_5m_input_tokens: ttl === '5m' ? 40 : 0
                }
            }
        }
    };
}

function codex(total: Json | null, last: Json = {}): Json {
    return {
        type: 'event_msg',
        timestamp: '2026-09-13T11:00:00Z',
        payload: {
            type: 'token_count',
            info: {
                ...(total === null ? {} : { total_token_usage: total }),
                last_token_usage: last,
                model_context_window: 258400
            }
        }
    };
}

describe('claudeUsage', () => {
    it('normalizes the model, stamp, counts, context and cache ttl', () => {
        expect(claudeUsage(claude('1h'))).toEqual({
            model: 'claude-opus',
            stamp: '2026-09-13T10:00:00Z',
            input: 10,
            output: 20,
            cacheRead: 30,
            cacheCreation: 40,
            thinking: 50,
            ttl: '1h',
            context: 80
        });
        expect(claudeUsage(claude('5m'))?.ttl).toBe('5m');
        expect(claudeUsage(claude(null))?.ttl).toBeNull();
    });

    it('rejects another record type and marks an assistant without usage', () => {
        expect(claudeUsage({ type: 'user' })).toBeNull();
        expect(
            claudeUsage({
                type: 'assistant',
                timestamp: 42,
                message: { model: 'model-only' }
            })
        ).toEqual({
            model: 'model-only',
            stamp: 42,
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheCreation: 0,
            thinking: 0,
            ttl: null
        });
    });
});

describe('codexUsage', () => {
    it('returns deltas and replaces the supplied baseline with the new totals', () => {
        const previous: Partial<UsageTotals> = {
            input: 10,
            output: 20,
            cacheRead: 30,
            cacheCreation: 40,
            thinking: 50
        };
        expect(
            codexUsage(
                codex(
                    {
                        input_tokens: 15,
                        output_tokens: 26,
                        cached_input_tokens: 37,
                        cache_write_input_tokens: 48,
                        reasoning_output_tokens: 59
                    },
                    { input_tokens: 100, cached_input_tokens: 25 }
                ),
                previous
            )
        ).toEqual({
            model: '',
            stamp: '2026-09-13T11:00:00Z',
            input: 5,
            output: 6,
            cacheRead: 7,
            cacheCreation: 8,
            thinking: 9,
            context: 125,
            contextWindow: 258400
        });
        expect(previous).toEqual({
            input: 15,
            output: 26,
            cacheRead: 37,
            cacheCreation: 48,
            thinking: 59
        });
    });

    it('uses the new total after a decrease, and counts nothing without totals while carrying the context', () => {
        const previous: Partial<UsageTotals> = {
            input: 100,
            output: 100,
            cacheRead: 100,
            cacheCreation: 100,
            thinking: 100
        };
        const decreased = codexUsage(
            codex({
                input_tokens: 10,
                output_tokens: 10,
                cached_input_tokens: 10,
                cache_write_input_tokens: 10,
                reasoning_output_tokens: 10
            }),
            previous
        );
        expect(decreased).toMatchObject({
            input: 10,
            output: 10,
            cacheRead: 10,
            cacheCreation: 10,
            thinking: 10
        });
        expect(previous).toEqual({
            input: 10,
            output: 10,
            cacheRead: 10,
            cacheCreation: 10,
            thinking: 10
        });
        expect(
            codexUsage(codex(null, { input_tokens: 100, cached_input_tokens: 25 }), previous)
        ).toEqual({
            model: '',
            stamp: '2026-09-13T11:00:00Z',
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheCreation: 0,
            thinking: 0,
            context: 125,
            contextWindow: 258400
        });
        expect(previous).toEqual({
            input: 10,
            output: 10,
            cacheRead: 10,
            cacheCreation: 10,
            thinking: 10
        });
        expect(
            codexUsage({ type: 'event_msg', payload: { type: 'item_completed' } }, previous)
        ).toBeNull();
    });
});
