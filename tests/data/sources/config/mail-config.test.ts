// The mail connector's two configuration readers: the `mail:` rows of the machine's own file, and
// the `mail:` block of behavior.yml. Every sentence either of them throws is named here, and the
// machine that names neither is checked to read as an empty list.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import {
    LOCAL_NAME,
    engineDir,
    loadConfig,
    loadLocal,
    mailSettings
} from '../../../../src/lib/data/sources/config.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const made: string[] = [];

afterEach(() => {
    while (made.length > 0) rmSync(made.pop() ?? '', { recursive: true, force: true });
});

/** An engine directory of this case's own, which scratchDir makes inside the temp directory. */
function scratch(): string {
    const dir = scratchDir('oculus-mail-config-');
    made.push(dir);
    return dir;
}

/** The machine's own file where loadLocal reads it: inside the engine's config folder. */
function writeLocal(dir: string, body: string): void {
    const folder = join(dir, 'config');
    const file = join(folder, LOCAL_NAME);
    expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
    mkdirSync(folder, { recursive: true });
    writeFileSync(file, body);
}

describe('the mail rows of the machine own file', () => {
    it('reads one row per account, in the order the file names them', () => {
        const dir = scratch();
        writeLocal(
            dir,
            'mail:\n  - { provider: google, label: work }\n  - { provider: microsoft, label: uni }\n'
        );
        expect(loadLocal(dir).mail).toEqual([
            { provider: 'google', label: 'work' },
            { provider: 'microsoft', label: 'uni' }
        ]);
    });

    it('keeps the two lists apart, so one mailbox may be a calendar and a mail account', () => {
        const dir = scratch();
        writeLocal(
            dir,
            [
                'calendars:',
                '  - { provider: google, label: work }',
                'mail:',
                '  - { provider: google, label: work }',
                ''
            ].join('\n')
        );
        const local = loadLocal(dir);
        expect(local.calendars).toEqual([{ provider: 'google', label: 'work' }]);
        expect(local.mail).toEqual([{ provider: 'google', label: 'work' }]);
    });

    it('leaves the list empty when the machine names no account', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\n');
        expect(loadLocal(dir).mail).toEqual([]);
        expect(loadLocal(dir).mailDir).toBe(undefined);
    });

    it('resolves mail_dir against the engine when the file gives a relative path', () => {
        const dir = scratch();
        writeLocal(dir, 'mail_dir: state/mail\n');
        expect(loadLocal(dir).mailDir).toBe(join(dir, 'state', 'mail'));
    });

    for (const [body, sentence] of [
        ['mail: one\n', 'mail must be a list'],
        ['mail: [one]\n', 'mail[0] must be a map'],
        [
            'mail:\n  - { provider: fastmail, label: work }\n',
            'mail[0].provider must be google or microsoft'
        ],
        [
            'mail:\n  - { provider: ics, label: work }\n',
            'mail[0].provider must be google or microsoft'
        ],
        [
            'mail:\n  - { provider: google }\n',
            'mail[0].label must be lowercase letters, digits and dashes'
        ],
        [
            'mail:\n  - { provider: google, label: "../escape" }\n',
            'mail[0].label must be lowercase letters, digits and dashes'
        ],
        [
            'mail:\n  - { provider: google, label: work }\n  - { provider: google, label: work }\n',
            'mail[1].label repeats work for google'
        ],
        ['mail_dir: 7\n', 'mail_dir must be a path']
    ] as const) {
        it(`throws "${sentence}"`, () => {
            const dir = scratch();
            writeLocal(dir, body);
            expect(() => loadLocal(dir)).toThrow(`${LOCAL_NAME}: ${sentence}`);
        });
    }
});

describe('mailSettings', () => {
    it('reads the two keys of the config oculus ships', () => {
        expect(mailSettings(loadConfig(engineDir()).config)).toEqual({
            pollMin: 10,
            perSignal: 25
        });
    });

    for (const [config, sentence] of [
        [{}, 'mail must be a map'],
        [{ mail: [] }, 'mail must be a map'],
        [{ mail: { per_signal: 25 } }, 'mail.poll_min must be a number'],
        [{ mail: { poll_min: 10, per_signal: 'all' } }, 'mail.per_signal must be a number']
    ] as const) {
        it(`throws "${sentence}"`, () => {
            expect(() => mailSettings(config as Record<string, unknown>)).toThrow(
                `config/behavior.yml: ${sentence}`
            );
        });
    }
});
