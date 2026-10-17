// Layer 2, client state. Refresh refusals belong to the usage payload current when the response
// arrives. A newer payload clears the visible refusal in every Usage view without an effect.
//
// The store also holds the accounts whose refresh the reader pressed, from each press until that
// press's own answer (the route answers once the refresh has run, or with its refusal), so the
// account's refresh control turns while it runs. A refresh the server runs on its own cadence is
// no press of the reader's and is held by nothing.

import { z } from 'zod';
import type { UsagePayload } from '../../../../data/model/index.ts';
import { byKey } from '../../../../data/helpers/guards.ts';
import { optionalTextShape, readAs, readJson } from '../../../../data/shapes/shapes.ts';
import type { EntitiesStore, WritesStore } from '../../../shared/stores/shapes.ts';
import { t } from '../../../shared/words/text.ts';

/** What the route answers a refusal with: the words of its error, absent when it is no text. */
const refusalShape = z.object({ error: optionalTextShape });

/**
 * The route's error words, each answered by a catalog string; anything else is the request failing.
 */
function refusalText(body: unknown): string {
    switch (readAs(refusalShape, body)?.error) {
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

/** Refresh refusals of the usage view, and the refreshes the reader pressed, for one client. */
export type UsageRefreshStore = {
    refreshRefusal: (label: string) => string;
    /** Whether a refresh of the account the reader pressed is still waiting for its answer. */
    refreshing: (label: string) => boolean;
    refreshUsageAccount: (label: string) => Promise<void>;
};

export function createUsageRefresh(
    entities: EntitiesStore,
    writes: WritesStore
): UsageRefreshStore {
    let refusals = $state.raw<Record<string, { payload: UsagePayload | null; reason: string }>>({});
    /** How many presses of each account's refresh wait for their answer. */
    let pressed = $state.raw<Record<string, number>>({});

    /** Count one press of an account's refresh in, or one answered press out. */
    function hold(label: string, step: 1 | -1): void {
        const count = (byKey(pressed, label) ?? 0) + step;
        pressed = Object.fromEntries(
            Object.entries({ ...pressed, [label]: count }).filter(([, held]) => held > 0)
        );
    }

    function refreshRefusal(label: string): string {
        const held = byKey(refusals, label);
        return held?.payload === entities.usage() ? t('usage.refresh_refused', held.reason) : '';
    }

    async function refreshUsageAccount(label: string): Promise<void> {
        let reason = '';
        hold(label, 1);
        try {
            const response = await fetch('/api/usage/refresh', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-oculus-token': writes.writeToken()
                },
                body: JSON.stringify({ account: label })
            });
            if (!response.ok) reason = refusalText(await readJson(response));
        } catch {
            reason = t('usage.refusal_failed');
        } finally {
            hold(label, -1);
        }
        if (reason !== '') {
            const payload = entities.usage();
            refusals = Object.fromEntries(
                Object.entries(refusals).filter(([, held]) => held.payload === payload)
            );
            refusals = { ...refusals, [label]: { payload, reason } };
        }
    }

    return {
        refreshRefusal,
        refreshing: (label) => (byKey(pressed, label) ?? 0) > 0,
        refreshUsageAccount
    };
}
