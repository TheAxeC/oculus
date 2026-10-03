// Layer 4, test. The registry's system probe reads a process's start time whatever locale the
// server runs in, since `ps` names the weekday and month in the locale's words and parseStamp reads
// them only in English.
//
// The one process asked about is this test's own, and the only signal sent to it is signal 0.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { registryCandidates, systemProbe } from '../../../src/lib/server/sessions/registry.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const SAVED = { LC_ALL: process.env.LC_ALL, LANG: process.env.LANG };

afterEach(() => {
    if (SAVED.LC_ALL === undefined) delete process.env.LC_ALL;
    else process.env.LC_ALL = SAVED.LC_ALL;
    if (SAVED.LANG === undefined) delete process.env.LANG;
    else process.env.LANG = SAVED.LANG;
});

describe('the system probe', { tags: ['slow'] }, () => {
    it("reads this process's start time under a locale that is not English", () => {
        process.env.LC_ALL = 'nl_NL.UTF-8';
        process.env.LANG = 'nl_NL.UTF-8';
        const start = systemProbe.starts([process.pid]).get(process.pid);
        expect(start).toBeDefined();
        // A start in the past and after 2026 began, which only a stamp read as a date gives.
        expect(start).toBeLessThanOrEqual(Date.now() / 1000);
        expect(start).toBeGreaterThan(Date.UTC(2026, 0, 1) / 1000);
    });
});

describe('a registry file read as a candidate', () => {
    /** The candidates one registry file gives, under a probe that finds every pid running. */
    function candidates(body: unknown) {
        const dir = scratchDir('oculus-registry-');
        writeFileSync(join(dir, '1.json'), JSON.stringify(body));
        return registryCandidates([dir], { running: () => true, starts: () => new Map() });
    }
    const base = { sessionId: 's', pid: 7 };

    it('is no candidate without a whole pid, a session id or a map', () => {
        for (const body of [
            { ...base, pid: 1.5 },
            { ...base, pid: '1' },
            { ...base, sessionId: '' },
            []
        ]) {
            expect(candidates(body)).toStrictEqual([]);
        }
    });

    it('reads a text field of the wrong type as empty and any whole pid as a pid', () => {
        expect(candidates({ ...base, status: 3 })[0].status).toBe('');
        expect(candidates({ ...base, pid: 2 ** 60 })[0].pid).toBe(2 ** 60);
    });

    it('truncates a start stamp and reads a missing or textual one as zero', () => {
        expect(candidates({ ...base, startedAt: 1.5 })[0].startedAt).toBe(1);
        expect(candidates({ ...base, startedAt: '5' })[0].startedAt).toBe(0);
        expect(candidates(base)[0].startedAt).toBe(0);
    });
});
