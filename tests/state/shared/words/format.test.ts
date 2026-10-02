// The conversions the session views share. The catalog is the real one of config/text/, so the
// suffixes and the separator checked here are the words the file holds; the numbers and the paths
// are the test's own.
//
// Every function that reads a clock is handed the moment to read it against, so nothing here
// depends on when it runs. The dates are built with the local constructor rather than parsed out of
// a `Z` stamp, since what these produce is local time and a test that pinned an offset would only
// pass in one timezone.

import { describe, expect, it } from 'vitest';
import {
    clock,
    compactCount,
    grouped,
    modelShort,
    relativeTo,
    seconds,
    span,
    stamp
} from '../../../../src/lib/state/shared/words/format.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);
setCatalog(catalog);

/** A local ISO stamp of a moment, which is what a transcript's own stamps read back as. */
function at(year: number, month: number, day: number, hour: number, minute: number): string {
    return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

const NOW = new Date(2026, 8, 10, 9, 0, 0, 0).getTime();

describe('grouped', () => {
    it('groups the thousands of a count with the catalog separator', () => {
        expect(grouped(0)).toBe('0');
        expect(grouped(999)).toBe('999');
        expect(grouped(1000)).toBe('1,000');
        expect(grouped(83011)).toBe('83,011');
        expect(grouped(1234567)).toBe('1,234,567');
        expect(grouped(-1234)).toBe('-1,234');
    });
});

describe('compactCount', () => {
    it('writes millions with one decimal, and drops a decimal that is zero', () => {
        expect(compactCount(1900000)).toBe('1.9M');
        expect(compactCount(2000000)).toBe('2M');
    });

    it('drops the decimal altogether above ten million', () => {
        expect(compactCount(12300000)).toBe('12M');
    });

    it('writes thousands whole, and anything under a thousand as it is', () => {
        expect(compactCount(84000)).toBe('84k');
        expect(compactCount(1000)).toBe('1k');
        expect(compactCount(512)).toBe('512');
        expect(compactCount(0)).toBe('0');
    });

    it('treats anything that is not a number as none', () => {
        expect(compactCount(Number.NaN)).toBe('0');
    });
});

describe('stamp and clock', () => {
    it('shows the clock alone for today', () => {
        expect(stamp(at(2026, 9, 10, 14, 5), NOW)).toBe('14:05');
    });

    it('shows the date before the clock for any earlier day', () => {
        expect(stamp(at(2026, 9, 3, 7, 9), NOW)).toBe('09-03 07:09');
    });

    it('shows nothing for a missing or unreadable stamp', () => {
        expect(stamp(null, NOW)).toBe('');
        expect(stamp('', NOW)).toBe('');
        expect(stamp('not a date', NOW)).toBe('');
    });

    it('is the clock whatever day it is from', () => {
        expect(clock(at(2026, 1, 2, 3, 4))).toBe('03:04');
        expect(clock(null)).toBe('');
    });
});

describe('seconds and span', () => {
    it('counts whole seconds between two stamps', () => {
        expect(seconds(at(2026, 9, 10, 8, 0), at(2026, 9, 10, 8, 1), NOW)).toBe(60);
    });

    it('counts a missing end from the moment it is given', () => {
        expect(seconds(at(2026, 9, 10, 8, 58), null, NOW)).toBe(120);
    });

    it('answers with nothing for an unreadable start, and for an end before the start', () => {
        expect(seconds(null, at(2026, 9, 10, 8, 0), NOW)).toBe(null);
        expect(seconds(at(2026, 9, 10, 8, 1), at(2026, 9, 10, 8, 0), NOW)).toBe(null);
    });

    it('writes a span in seconds under a minute and in minutes above one', () => {
        expect(span(45)).toBe('45 s');
        expect(span(90)).toBe('1m 30s');
        expect(span(3605)).toBe('60m 05s');
    });
});

describe('the names', () => {
    it('takes the vendor prefix off a model name', () => {
        expect(modelShort('claude-opus-5')).toBe('opus-5');
        expect(modelShort('gpt-5-codex')).toBe('gpt-5-codex');
        expect(modelShort(null)).toBe('');
    });

    it('writes a path inside a workspace relative to it, and leaves any other alone', () => {
        expect(relativeTo('/ws/src/a.ts', '/ws')).toBe('src/a.ts');
        expect(relativeTo('/other/a.ts', '/ws')).toBe('/other/a.ts');
        // The workspace itself is not inside itself, and no workspace relativises nothing.
        expect(relativeTo('/ws', '/ws')).toBe('/ws');
        expect(relativeTo('/ws/a.ts', '')).toBe('/ws/a.ts');
    });
});
