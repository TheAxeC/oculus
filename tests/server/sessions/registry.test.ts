// Layer 4, test. The registry's system probe reads a process's start time whatever locale the
// server runs in, since `ps` names the weekday and month in the locale's words and parseStamp reads
// them only in English; the launch note's writer records its builder's start the same way.
//
// The one process asked about is this test's own, and the only signal sent to it is signal 0.

import { afterEach, describe, expect, it } from 'vitest';
import { systemProbe } from '../../../src/lib/server/sessions/registry.ts';

const SAVED = { LC_ALL: process.env.LC_ALL, LANG: process.env.LANG };

afterEach(() => {
    if (SAVED.LC_ALL === undefined) delete process.env.LC_ALL;
    else process.env.LC_ALL = SAVED.LC_ALL;
    if (SAVED.LANG === undefined) delete process.env.LANG;
    else process.env.LANG = SAVED.LANG;
});

describe('the system probe', () => {
    it("reads this process's start time under a locale that is not English", () => {
        process.env.LC_ALL = 'nl_NL.UTF-8';
        process.env.LANG = 'nl_NL.UTF-8';
        // revert: src/lib/server/sessions/registry.ts "env: { ...process.env, LC_ALL: 'C' }" => delete
        const start = systemProbe.starts([process.pid]).get(process.pid);
        expect(start).toBeDefined();
        // A start in the past and after 2026 began, which only a stamp read as a date gives.
        expect(start).toBeLessThanOrEqual(Date.now() / 1000);
        expect(start).toBeGreaterThan(Date.UTC(2026, 0, 1) / 1000);
    });
});
