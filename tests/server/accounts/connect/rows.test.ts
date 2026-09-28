// The one edit oculus makes to the machine's own config/local.yml: an account row added to or
// taken from `calendars:` or `mail:`, with every comment and byte outside that row kept, and a text
// the machine file would not read back refused rather than returned.
//
// Pure text in, text out: nothing here touches a file.

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
    addAccountRow,
    removeAccountRow
} from '../../../../src/lib/server/accounts/connect/rows.ts';

const FILE = '/machine/config/local.yml';
const HEAD = `# The machine's own file, with the reader's comments.
hub: /machine/hub   # where the hub is
`;
const WORK = { provider: 'google', label: 'work' } as const;
const UNI = { provider: 'microsoft', label: 'uni' } as const;

/** The new text of an edit that must succeed. */
function text(edit: { text: string } | { reason: string }): string {
    if ('reason' in edit) throw new Error(`the edit was refused: ${edit.reason}`);
    return edit.text;
}

describe('an account row added', () => {
    it('writes the list key under the file it was not in, keeping every line before it', () => {
        const after = text(addAccountRow(HEAD, 'calendars', WORK, FILE));
        expect(after).toBe(`${HEAD}calendars:\n  - { provider: google, label: work }\n`);
    });

    it('extends a block list at the indent of its first row, with the comments between kept', () => {
        const before = `${HEAD}mail:\n    # the university box\n    - provider: microsoft\n      label: uni\ncalendar_dir: /x\n`;
        const after = text(addAccountRow(before, 'mail', WORK, FILE));
        expect(after).toBe(
            `${HEAD}mail:\n    # the university box\n    - provider: microsoft\n      label: uni\n    - { provider: google, label: work }\ncalendar_dir: /x\n`
        );
    });

    it('extends a flow list after its last row', () => {
        const before = `${HEAD}calendars: [{ provider: microsoft, label: uni }] # both\n`;
        const after = text(addAccountRow(before, 'calendars', WORK, FILE));
        expect(after).toBe(
            `${HEAD}calendars: [{ provider: microsoft, label: uni }, { provider: google, label: work }] # both\n`
        );
    });

    it('fills an empty flow list, and one written as a null', () => {
        const empty = text(addAccountRow(`${HEAD}mail: []\n`, 'mail', WORK, FILE));
        expect(empty).toBe(`${HEAD}mail: [{ provider: google, label: work }]\n`);
        const tilde = text(addAccountRow(`${HEAD}mail: ~ # none yet\n`, 'mail', WORK, FILE));
        expect(tilde).toBe(`${HEAD}mail: [{ provider: google, label: work }] # none yet\n`);
    });

    it('fills an empty flow list keeping a comment inside its brackets', () => {
        const before = `${HEAD}calendars: [ # c\n  { provider: google, label: work } ] # k\n`;
        const emptied = text(removeAccountRow(before, 'calendars', WORK, FILE));
        const after = text(addAccountRow(emptied, 'calendars', WORK, FILE));
        expect(after).toContain('# c');
        expect(after).toContain('# k');
        expect((parse(after) as { calendars: unknown }).calendars).toEqual([WORK]);
    });

    it('fills a key written with nothing under it', () => {
        const after = text(addAccountRow(`${HEAD}calendars:\nmail: []\n`, 'calendars', WORK, FILE));
        expect(after).toBe(`${HEAD}calendars:\n  - { provider: google, label: work }\nmail: []\n`);
    });

    it('quotes a label YAML would read as another type, so the row reads back as written', () => {
        const after = text(
            addAccountRow(HEAD, 'mail', { provider: 'google', label: '2026' }, FILE)
        );
        expect(after).toContain('{ provider: google, label: "2026" }');
        expect((parse(after) as { mail: unknown }).mail).toEqual([
            { provider: 'google', label: '2026' }
        ]);
    });

    it('makes the file from nothing when the machine has none', () => {
        expect(text(addAccountRow('', 'mail', WORK, FILE))).toBe(
            'mail:\n  - { provider: google, label: work }\n'
        );
    });

    it('refuses a row the machine file would refuse, naming the reason', () => {
        const edit = addAccountRow(`${HEAD}port: not-a-port\n`, 'mail', WORK, FILE);
        expect('reason' in edit && edit.reason).toContain('port');
    });

    it('refuses a list key that holds something other than a list', () => {
        const edit = addAccountRow(`${HEAD}mail: a-word\n`, 'mail', WORK, FILE);
        expect(edit).toEqual({ reason: 'mail is not a list' });
    });
});

describe('an account row removed', () => {
    it('takes one row of a block list and every line of it, keeping the rest', () => {
        const before = `${HEAD}calendars:\n  - provider: google\n    label: work\n  # the university\n  - { provider: microsoft, label: uni }\nport: 8787\n`;
        const after = text(removeAccountRow(before, 'calendars', WORK, FILE));
        expect(after).toBe(
            `${HEAD}calendars:\n  # the university\n  - { provider: microsoft, label: uni }\nport: 8787\n`
        );
    });

    it('takes one row of a flow list with its comma', () => {
        const before = `${HEAD}mail: [{ provider: microsoft, label: uni }, { provider: google, label: work }]\n`;
        expect(text(removeAccountRow(before, 'mail', WORK, FILE))).toBe(
            `${HEAD}mail: [{ provider: microsoft, label: uni }]\n`
        );
        expect(text(removeAccountRow(before, 'mail', UNI, FILE))).toBe(
            `${HEAD}mail: [{ provider: google, label: work }]\n`
        );
    });

    it("leaves the last row's block list written empty rather than a key with nothing under it", () => {
        const before = `${HEAD}mail:\n  - { provider: google, label: work }\nport: 8787\n`;
        const after = text(removeAccountRow(before, 'mail', WORK, FILE));
        expect(after).toBe(`${HEAD}mail: []\nport: 8787\n`);
        expect((parse(after) as { mail: unknown }).mail).toEqual([]);
    });

    it("keeps the comment beside the list's key when its last row goes", () => {
        const before = `${HEAD}calendars: # my calendars\n  - { provider: google, label: work } # uni\nport: 8790\n`;
        expect(text(removeAccountRow(before, 'calendars', WORK, FILE))).toBe(
            `${HEAD}calendars: [] # my calendars\nport: 8790\n`
        );
    });

    it('keeps the comment lines inside the list when its last row goes, and drops only its own', () => {
        const before = `${HEAD}calendars: # my calendars\n  # the work one\n  - { provider: google, label: work } # uni\nport: 8790\n`;
        const after = text(removeAccountRow(before, 'calendars', WORK, FILE));
        expect(after).toBe(`${HEAD}calendars: [] # my calendars\n  # the work one\nport: 8790\n`);
        // The row's own trailing comment goes with it.
        expect(after).not.toContain('# uni');
    });

    it("leaves the last row's flow list with its brackets and the comment beside it", () => {
        const before = `${HEAD}calendars: [{ provider: google, label: work }] # mine\nport: 8790\n`;
        expect(text(removeAccountRow(before, 'calendars', WORK, FILE))).toBe(
            `${HEAD}calendars: [] # mine\nport: 8790\n`
        );
    });

    it('refuses an account the list does not hold', () => {
        const before = `${HEAD}mail: [{ provider: microsoft, label: uni }]\n`;
        expect(removeAccountRow(before, 'mail', WORK, FILE)).toEqual({
            reason: 'mail holds no such account'
        });
    });

    it('refuses an edit that would change more than the one row', () => {
        // The same row written twice: the edit takes one, the list the reader wants has neither.
        const before = `${HEAD}mail:\n  - { provider: google, label: work }\n  - { provider: google, label: work }\n`;
        expect(removeAccountRow(before, 'mail', WORK, FILE)).toEqual({
            reason: 'the edit of mail would change more than the one row'
        });
    });
});
