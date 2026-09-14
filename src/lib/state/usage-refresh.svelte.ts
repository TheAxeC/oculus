// Layer 2, client state. Refresh refusals belong to the usage payload current when the response
// arrives. A newer payload clears the visible refusal in every Usage view without an effect.

import type { UsagePayload } from '../data/model.ts';
import { byKey } from '../data/guards.ts';
import { usage } from './entities.svelte.ts';
import { t } from './text.ts';
import { writeToken } from './writes.svelte.ts';

let refusals = $state.raw<Record<string, { payload: UsagePayload | null; reason: string }>>({});

export function refreshRefusal(label: string): string {
    const held = byKey(refusals, label);
    return held?.payload === usage() ? t('usage.refresh_refused', held.reason) : '';
}

/** The route's error words, each answered by a catalog string; anything else is the request failing. */
function refusalText(body: unknown): string {
    const error =
        typeof body === 'object' && body !== null && 'error' in body ? body.error : undefined;
    switch (error) {
        case 'forbidden':
            return t('usage.refusal_forbidden');
        case 'bad body':
        case 'bad account':
            return t('usage.refusal_bad_request');
        case 'account not found':
            return t('usage.refusal_not_found');
        default:
            return t('usage.refusal_failed');
    }
}

export async function refreshUsageAccount(label: string): Promise<void> {
    let reason = '';
    try {
        const response = await fetch('/api/usage/refresh', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-oculus-token': writeToken() },
            body: JSON.stringify({ account: label })
        });
        if (!response.ok) reason = refusalText(await response.json().catch(() => null));
    } catch {
        reason = t('usage.refusal_failed');
    }
    if (reason !== '') {
        const payload = usage();
        refusals = Object.fromEntries(
            Object.entries(refusals).filter(([, held]) => held.payload === payload)
        );
        refusals = { ...refusals, [label]: { payload, reason } };
    }
}
