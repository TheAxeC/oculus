// The calendar connector's two configuration readers: the `calendars:` rows of the machine's own
// file, and the `calendar:` block of behavior.yml. Every sentence either of them throws is named
// here, and the machine that names neither is checked to read as it did before.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import {
    LOCAL_NAME,
    calendarSettings,
    engineDir,
    loadConfig,
    loadLocal
} from '../../../src/lib/data/sources/config.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const made: string[] = [];

afterEach(() => {
    while (made.length > 0) rmSync(made.pop() ?? '', { recursive: true, force: true });
});

/** An engine directory of this case's own, asserted to be inside the temporary directory. */
function scratch(): string {
    const dir = scratchDir('oculus-calendar-config-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
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

describe('the calendars rows of the machine own file', () => {
    it('reads one row per account, in the order the file names them', () => {
        const dir = scratch();
        writeLocal(
            dir,
            'calendars:\n  - { provider: google, label: work }\n  - { provider: microsoft, label: uni }\n'
        );
        expect(loadLocal(dir).calendars).toEqual([
            { provider: 'google', label: 'work' },
            { provider: 'microsoft', label: 'uni' }
        ]);
    });

    it('gives the same label to one account of each provider', () => {
        const dir = scratch();
        writeLocal(
            dir,
            'calendars:\n  - { provider: google, label: work }\n  - { provider: microsoft, label: work }\n'
        );
        expect(loadLocal(dir).calendars).toHaveLength(2);
    });

    it('reads a published calendar link as a row of the provider ics', () => {
        const dir = scratch();
        writeLocal(dir, 'calendars:\n  - { provider: ics, label: work }\n');
        expect(loadLocal(dir).calendars).toEqual([{ provider: 'ics', label: 'work' }]);
    });

    it('leaves the list empty when the machine names no account', () => {
        const dir = scratch();
        writeLocal(dir, 'hub: /srv/research-hub\n');
        expect(loadLocal(dir).calendars).toEqual([]);
        expect(loadLocal(dir).calendarDir).toBe(undefined);
    });

    it('resolves calendar_dir against the engine when the file gives a relative path', () => {
        const dir = scratch();
        writeLocal(dir, 'calendar_dir: state/calendar\n');
        expect(loadLocal(dir).calendarDir).toBe(join(dir, 'state', 'calendar'));
    });

    for (const [body, sentence] of [
        ['calendars: one\n', 'calendars must be a list'],
        ['calendars: [one]\n', 'calendars[0] must be a map'],
        [
            'calendars:\n  - { provider: fastmail, label: work }\n',
            'calendars[0].provider must be google, microsoft or ics'
        ],
        [
            'calendars:\n  - { provider: google }\n',
            'calendars[0].label must be lowercase letters, digits and dashes'
        ],
        [
            'calendars:\n  - { provider: google, label: "../escape" }\n',
            'calendars[0].label must be lowercase letters, digits and dashes'
        ],
        [
            'calendars:\n  - { provider: google, label: work }\n  - { provider: google, label: work }\n',
            'calendars[1].label repeats work for google'
        ],
        ['calendar_dir: 7\n', 'calendar_dir must be a path']
    ] as const) {
        it(`throws "${sentence}"`, () => {
            const dir = scratch();
            writeLocal(dir, body);
            expect(() => loadLocal(dir)).toThrow(`${LOCAL_NAME}: ${sentence}`);
        });
    }
});

describe('calendarSettings', () => {
    it('reads the three keys of the config oculus ships', () => {
        expect(calendarSettings(loadConfig(engineDir()).config)).toEqual({
            pollMin: 15,
            daysBack: 31,
            daysAhead: 62
        });
    });

    for (const [config, sentence] of [
        [{}, 'calendar must be a map'],
        [{ calendar: [] }, 'calendar must be a map'],
        [{ calendar: { days_back: 1, days_ahead: 14 } }, 'calendar.poll_min must be a number'],
        [
            { calendar: { poll_min: 15, days_back: 'one', days_ahead: 14 } },
            'calendar.days_back must be a number'
        ],
        [{ calendar: { poll_min: 15, days_back: 1 } }, 'calendar.days_ahead must be a number']
    ] as const) {
        it(`throws "${sentence}"`, () => {
            expect(() => calendarSettings(config as Record<string, unknown>)).toThrow(
                `config/behavior.yml: ${sentence}`
            );
        });
    }
});
