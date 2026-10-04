// Layer 1, data tests. The rules the page and the server share for a new account and a provider's
// client half: which provider each connector takes, which label an account may take, and what shape
// a Google or a Microsoft client id must have, each refusal one word the page puts into a sentence.

import { describe, expect, it } from 'vitest';
import { accountRefusal, providerHalf } from '../../../src/lib/data/accounts/connect.ts';

const GOOGLE_ID = '1234-abcd.apps.googleusercontent.com';
const GUID = '0f0e0d0c-0b0a-0908-0706-050403020100';

describe('a new account', () => {
    const rows = [{ provider: 'google', label: 'work' }] as const;

    it.each([
        ['an unknown provider', 'mail', 'yahoo', 'box', 'provider'],
        ['a label with a capital', 'mail', 'google', 'Work', 'label'],
        ['a label that climbs', 'mail', 'google', '../up', 'label'],
        ['a label taken under the provider', 'mail', 'google', 'work', 'taken'],
        ['the same label under the other provider', 'mail', 'microsoft', 'work', null],
        ['a published link on a calendar', 'calendar', 'ics', 'rooster', null],
        ['a published link on the mail', 'mail', 'ics', 'rooster', 'provider']
    ] as const)('takes %s as %s', (_row, connector, provider, label, refusal) => {
        expect(accountRefusal(connector, rows, provider, label)).toBe(refusal);
    });
});

describe("a provider's client half", () => {
    it.each([
        [
            'a Google id off googleusercontent.com',
            'google',
            { clientId: 'abc', clientSecret: 's' },
            { refused: 'google_id' }
        ],
        [
            'a Google secret with a space',
            'google',
            { clientId: GOOGLE_ID, clientSecret: 'a b' },
            { refused: 'google_secret' }
        ],
        [
            'a Google id and secret with stray whitespace',
            'google',
            { clientId: ` ${GOOGLE_ID}\n`, clientSecret: ' s ' },
            { half: { provider: 'google', clientId: GOOGLE_ID, clientSecret: 's' } }
        ],
        [
            'a Microsoft id that is no GUID',
            'microsoft',
            { clientId: 'not-a-guid' },
            { refused: 'microsoft_id' }
        ],
        [
            'a Microsoft tenant that is no GUID',
            'microsoft',
            { clientId: GUID, tenant: 'contoso' },
            { refused: 'tenant' }
        ],
        [
            'a Microsoft tenant left empty',
            'microsoft',
            { clientId: GUID, tenant: '' },
            { half: { provider: 'microsoft', clientId: GUID } }
        ],
        [
            'a Microsoft tenant that is a GUID',
            'microsoft',
            { clientId: GUID, tenant: GUID },
            { half: { provider: 'microsoft', clientId: GUID, tenant: GUID } }
        ]
    ] as const)(
        'answers %s with the refusal or the half it names',
        (_row, provider, fields, answer) => {
            expect(providerHalf(provider, fields)).toEqual(answer);
        }
    );
});
