// Layer 2, server tests. The plate's todo signal as each provider reader asks for it: the label
// (Gmail) or the category (Outlook) `mail.todo_label` names, written in the provider's own query,
// and no todo request at all for an empty label. The provider is a fetcher that records each
// address it is asked for and answers an empty listing, so no case reaches the network.

import { describe, expect, it } from 'vitest';
import { readGoogleMail } from '../../../../src/lib/server/accounts/mail/google.ts';
import { readMicrosoftMail } from '../../../../src/lib/server/accounts/mail/microsoft.ts';
import type { MailReadArgs } from '../../../../src/lib/server/accounts/mail/plate.ts';

/** The arguments of one account's read with this label, and the addresses the read asked for. */
function account(todoLabel: string): { args: MailReadArgs; asked: string[] } {
    const asked: string[] = [];
    const fetcher = ((url: string | URL | Request) => {
        const address = url instanceof Request ? url.url : url.toString();
        asked.push(decodeURIComponent(address).replaceAll('+', ' '));
        return Promise.resolve(Response.json({ threads: [], value: [] }));
    }) as typeof fetch;
    return {
        args: {
            token: 't',
            base: 'https://mail.test',
            link: '',
            key: 'k',
            perSignal: 5,
            todoLabel,
            fetcher
        },
        asked
    };
}

describe('the todo signal of the plate', () => {
    it('asks Gmail for the label mail.todo_label names, quoted when it holds a space (G13)', async () => {
        const plain = account('todo');
        await readGoogleMail(plain.args);
        expect(plain.asked.filter((one) => one.includes('label:'))).toEqual([
            'https://mail.test/threads?q=in:inbox label:todo&maxResults=5'
        ]);
        const spaced = account('to do');
        await readGoogleMail(spaced.args);
        expect(spaced.asked.filter((one) => one.includes('label:'))).toEqual([
            'https://mail.test/threads?q=in:inbox label:"to do"&maxResults=5'
        ]);
    });

    it("asks Outlook for the category mail.todo_label names, each ' doubled (G13)", async () => {
        const read = account("Kim's");
        await readMicrosoftMail(read.args);
        expect(read.asked.filter((one) => one.includes('categories/any'))).toEqual([
            expect.stringContaining("categories/any(c: c eq 'Kim''s')")
        ]);
    });

    it('asks neither provider for a todo signal with an empty label (G13)', async () => {
        const google = account('');
        await readGoogleMail(google.args);
        expect(google.asked.map((one) => one.includes('label:'))).toEqual([false, false]);
        const outlook = account('');
        await readMicrosoftMail(outlook.args);
        expect(outlook.asked.some((one) => one.includes('categories/any'))).toBe(false);
    });
});
