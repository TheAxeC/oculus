// Layer 1, data tests. The `mail:` rows and `mail_dir` of the machine's own file, read by
// loadLocal: the rows in the order the file names them, the two lists kept apart, and a machine
// that names no account. The sentences loadLocal throws are rows of checkLocal in local.test.ts,
// and the `mail:` block of behavior.yml is mailSettings, in settings.test.ts.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { LOCAL_NAME, loadLocal } from '../../../../src/lib/data/sources/config.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';

/** An engine directory whose config folder holds the machine's own file with `body`. */
function engineWith(body: string): string {
    return plantScratch('oculus-mail-config-', { [join('config', LOCAL_NAME)]: body });
}

describe('the mail rows of the machine own file', () => {
    it('reads one row per account, in the order the file names them', () => {
        const dir = engineWith(
            'mail:\n  - { provider: google, label: work }\n  - { provider: microsoft, label: uni }\n'
        );
        expect(loadLocal(dir).mail).toEqual([
            { provider: 'google', label: 'work' },
            { provider: 'microsoft', label: 'uni' }
        ]);
    });

    it('keeps the two lists apart, so one mailbox may be a calendar and a mail account', () => {
        const dir = engineWith(
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
        const dir = engineWith('hub: /srv/research-hub\n');
        expect(loadLocal(dir).mail).toEqual([]);
        expect(loadLocal(dir).mailDir).toBe(undefined);
    });

    it('resolves mail_dir against the engine when the file gives a relative path', () => {
        const dir = engineWith('mail_dir: state/mail\n');
        expect(loadLocal(dir).mailDir).toBe(join(dir, 'state', 'mail'));
    });
});
