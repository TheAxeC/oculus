// Layer 2, server tests. An Add of an account row from the Calendar or Inbox view writes the
// primary hub's `.oculus/local.yml`, and is refused with the catalog sentence while the workspace
// has no primary; a Remove writes the file of the hub whose row it is (G13). Every hub is a scratch
// folder under the system temporary directory and no consent is started: the rows are published
// links, which have none.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { connectKey } from '../../../../src/lib/data/accounts/connect.ts';
import type { CalendarAccountConfig } from '../../../../src/lib/data/model/index.ts';
import {
    addAccount,
    removeAccount,
    type AccountBook,
    type AccountTarget
} from '../../../../src/lib/server/accounts/connect/actions.ts';
import { ConnectStates } from '../../../../src/lib/server/accounts/connect/oauth.ts';
import { fsWrites } from '../../../../src/lib/server/core/json.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const SENTENCE = 'the workspace has no primary hub';

/** A scratch hub whose `.oculus/local.yml` holds the text, and the path of that file. */
function hubWith(text: string): { dir: string; file: string } {
    const dir = scratchDir('oculus-account-rows-');
    mkdirSync(join(dir, '.oculus'), { recursive: true });
    const file = join(dir, '.oculus', 'local.yml');
    writeFileSync(file, text);
    return { dir, file };
}

/** The calendar target over a book that names the files by hub. */
function targetOf(
    files: Record<string, string>,
    primary: string | null,
    accounts: CalendarAccountConfig[] = []
): AccountTarget {
    const dir = scratchDir('oculus-account-files-');
    const book: AccountBook = {
        file: () => (primary === null ? null : (files[primary] ?? null)),
        fileOf: (hub) => files[hub] ?? null,
        noPrimary: () => SENTENCE,
        writes: fsWrites(),
        reload: noop
    };
    return {
        dir,
        providerDir: join(dir, 'connect'),
        redirect: 'http://127.0.0.1:8791/callback',
        states: new ConnectStates(),
        open: noop,
        accounts,
        book
    };
}

const LINK = 'https://example.org/work.ics';

describe('an account row added from the Calendar or Inbox view', () => {
    it("is written into the primary hub's local.yml and no other hub's", async () => {
        const first = hubWith('port: 8790\n');
        const second = hubWith('port: 8790\n');
        const into = targetOf({ first: first.file, second: second.file }, 'second');
        const answer = await addAccount('calendar', into, {
            provider: 'ics',
            label: 'work',
            url: LINK
        });
        expect(answer.status).toBe(200);
        expect(readFileSync(second.file, 'utf8')).toContain('label: work');
        expect(readFileSync(first.file, 'utf8')).toBe('port: 8790\n');
    });

    it('is refused with the catalog sentence while the workspace has no primary, and nothing is written', async () => {
        const only = hubWith('port: 8790\n');
        const into = targetOf({ only: only.file }, null);
        const answer = await addAccount('calendar', into, {
            provider: 'ics',
            label: 'work',
            url: LINK
        });
        expect(answer.status).toBe(400);
        expect(await answer.json()).toEqual({ error: 'file', reason: SENTENCE });
        expect(readFileSync(only.file, 'utf8')).toBe('port: 8790\n');
    });
});

describe('an account row removed from the Calendar or Inbox view', () => {
    it('is taken out of the file of the hub that holds it, whichever hub is the primary', async () => {
        const first = hubWith('calendars:\n  - { provider: ics, label: home }\n');
        const second = hubWith('calendars:\n  - { provider: ics, label: work }\n');
        const rows: CalendarAccountConfig[] = [
            { provider: 'ics', label: 'home', hub: 'first' },
            { provider: 'ics', label: 'work', hub: 'second' }
        ];
        const into = targetOf({ first: first.file, second: second.file }, 'second', rows);
        const answer = await removeAccount('calendar', into, { account: connectKey(rows[0]) });
        expect(answer.status).toBe(200);
        expect(readFileSync(first.file, 'utf8')).not.toContain('home');
        expect(readFileSync(second.file, 'utf8')).toBe(
            'calendars:\n  - { provider: ics, label: work }\n'
        );
    });
});
