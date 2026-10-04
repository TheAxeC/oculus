// Layer 1, data tests. The `calendars:` rows and `calendar_dir` of the machine's own file, read by
// loadLocal: the rows in the order the file names them, a label shared by two providers, and a
// machine that names no account. The sentences loadLocal throws are rows of checkLocal in
// local.test.ts, and the `calendar:` block of behavior.yml is calendarSettings, in
// settings.test.ts.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { LOCAL_NAME, loadLocal } from '../../../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';

/** An engine directory whose config folder holds the machine's own file with `body`. */
function engineWith(body: string): string {
    return plantScratch('oculus-calendar-config-', { [join('config', LOCAL_NAME)]: body });
}

describe('the calendars rows of the machine own file', () => {
    it('reads one row per account, in the order the file names them', () => {
        const dir = engineWith(
            'calendars:\n  - { provider: google, label: work }\n  - { provider: microsoft, label: uni }\n'
        );
        expect(loadLocal(dir).calendars).toEqual([
            { provider: 'google', label: 'work' },
            { provider: 'microsoft', label: 'uni' }
        ]);
    });

    it('gives the same label to one account of each provider', () => {
        const dir = engineWith(
            'calendars:\n  - { provider: google, label: work }\n  - { provider: microsoft, label: work }\n'
        );
        expect(loadLocal(dir).calendars).toHaveLength(2);
    });

    it('reads a published calendar link as a row of the provider ics', () => {
        const dir = engineWith('calendars:\n  - { provider: ics, label: work }\n');
        expect(loadLocal(dir).calendars).toEqual([{ provider: 'ics', label: 'work' }]);
    });

    it('leaves the list empty when the machine names no account', () => {
        const dir = engineWith('hub: /srv/research-hub\n');
        expect(loadLocal(dir).calendars).toEqual([]);
        expect(loadLocal(dir).calendarDir).toBe(undefined);
    });

    it('resolves calendar_dir against the engine when the file gives a relative path', () => {
        const dir = engineWith('calendar_dir: state/calendar\n');
        expect(loadLocal(dir).calendarDir).toBe(join(dir, 'state', 'calendar'));
    });
});
