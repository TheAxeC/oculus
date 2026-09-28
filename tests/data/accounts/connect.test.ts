// The rules the page and the server share for a new account and a provider's client half: which
// label an account may take, and what shape a Google or a Microsoft client id must have, each
// refusal one word the page puts into a sentence.

import { describe, expect, it } from 'vitest';
import { accountRefusal, providerHalf } from '../../../src/lib/data/accounts/connect.ts';

const GOOGLE_ID = '1234-abcd.apps.googleusercontent.com';
const GUID = '0f0e0d0c-0b0a-0908-0706-050403020100';

describe('a new account', () => {
    it('is refused for an unknown provider, a label of the wrong shape and a label taken', () => {
        const rows = [{ provider: 'google', label: 'work' }] as const;
        expect(accountRefusal(rows, 'yahoo', 'box')).toBe('provider');
        expect(accountRefusal(rows, 'google', 'Work')).toBe('label');
        expect(accountRefusal(rows, 'google', '../up')).toBe('label');
        expect(accountRefusal(rows, 'google', 'work')).toBe('taken');
        // The same label under the other provider is another account.
        expect(accountRefusal(rows, 'microsoft', 'work')).toBe(null);
    });
});

describe("a provider's client half", () => {
    it('takes a Google id only on googleusercontent.com, and a secret with no space', () => {
        expect(providerHalf('google', { clientId: 'abc', clientSecret: 's' })).toEqual({
            refused: 'google_id'
        });
        expect(providerHalf('google', { clientId: GOOGLE_ID, clientSecret: 'a b' })).toEqual({
            refused: 'google_secret'
        });
        expect(
            providerHalf('google', { clientId: ` ${GOOGLE_ID}\n`, clientSecret: ' s ' })
        ).toEqual({
            half: { provider: 'google', clientId: GOOGLE_ID, clientSecret: 's' }
        });
    });

    it('takes a Microsoft id and an optional tenant only as GUIDs', () => {
        expect(providerHalf('microsoft', { clientId: 'not-a-guid' })).toEqual({
            refused: 'microsoft_id'
        });
        expect(providerHalf('microsoft', { clientId: GUID, tenant: 'contoso' })).toEqual({
            refused: 'tenant'
        });
        expect(providerHalf('microsoft', { clientId: GUID, tenant: '' })).toEqual({
            half: { provider: 'microsoft', clientId: GUID }
        });
        expect(providerHalf('microsoft', { clientId: GUID, tenant: GUID })).toEqual({
            half: { provider: 'microsoft', clientId: GUID, tenant: GUID }
        });
    });
});
