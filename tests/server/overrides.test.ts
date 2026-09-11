// setOverride against a temporary overrides file: what one pin or rename writes, and what it keeps.
//
// Nothing here reads or writes ~/.oculus. Every case makes its own file under the system temporary
// directory and asserts the path is inside it before the write, so the user's own pins are never in
// reach of this suite.

import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { overrides, setHidden, setOverride } from '../../src/lib/server/sessions/overrides.ts';

const ID = 'sess-1';
const AREA = '/hub/projects/manuscripts/alpha';

/** A fresh overrides file that does not exist yet, inside the system temporary directory. */
function file(body?: unknown): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-overrides-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    const path = join(dir, 'sessions.json');
    expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
    if (body !== undefined) {
        writeFileSync(path, typeof body === 'string' ? body : JSON.stringify(body));
    }
    return path;
}

function held(path: string): unknown {
    return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

describe('setOverride', () => {
    it('pins a session to an area, and unpins it', () => {
        const path = file();
        expect(setOverride(ID, { area: AREA }, path)).toEqual({ changed: ['area'], refused: [] });
        expect(held(path)).toEqual({ sessions: { [ID]: { area: AREA } } });

        expect(setOverride(ID, { area: '' }, path)).toEqual({ changed: ['area'], refused: [] });
        expect(held(path)).toEqual({ sessions: {} });
    });

    it('sets a title, and clears it', () => {
        const path = file();
        expect(setOverride(ID, { title: 'my name' }, path)).toEqual({
            changed: ['title'],
            refused: []
        });
        expect(held(path)).toEqual({ sessions: { [ID]: { title: 'my name' } } });

        expect(setOverride(ID, { title: '' }, path)).toEqual({ changed: ['title'], refused: [] });
        expect(held(path)).toEqual({ sessions: {} });
    });

    it('writes both fields in one call', () => {
        const path = file();
        expect(setOverride(ID, { area: AREA, title: 'my name' }, path)).toEqual({
            changed: ['area', 'title'],
            refused: []
        });
        expect(held(path)).toEqual({ sessions: { [ID]: { area: AREA, title: 'my name' } } });
    });

    it('keeps the keys it was not given, and the entries of other sessions', () => {
        const path = file({
            sessions: {
                [ID]: { hidden: true, title: 'my name', note: 'a key nothing here reads' },
                other: { area: '/elsewhere' }
            },
            top: 'kept'
        });
        setOverride(ID, { area: AREA }, path);
        expect(held(path)).toEqual({
            sessions: {
                [ID]: {
                    hidden: true,
                    title: 'my name',
                    note: 'a key nothing here reads',
                    area: AREA
                },
                other: { area: '/elsewhere' }
            },
            top: 'kept'
        });
    });

    it('removes an entry that the clearing emptied, and leaves the rest', () => {
        const path = file({ sessions: { [ID]: { area: AREA }, other: { hidden: true } } });
        setOverride(ID, { area: '' }, path);
        expect(held(path)).toEqual({ sessions: { other: { hidden: true } } });
    });

    it('keeps an entry that still holds a dismissal after the pin is cleared', () => {
        const path = file();
        setHidden(ID, true, path);
        setOverride(ID, { area: AREA }, path);
        expect(setOverride(ID, { area: '' }, path)).toEqual({ changed: ['area'], refused: [] });
        expect(held(path)).toEqual({ sessions: { [ID]: { hidden: true } } });
    });

    it('refuses an area that is not an absolute path, and writes nothing', () => {
        const path = file();
        expect(setOverride(ID, { area: 'projects/alpha' }, path)).toEqual({
            changed: [],
            refused: [{ field: 'area', reason: 'the area must be an absolute path' }]
        });
        expect(held(path)).toBe(null);
    });

    it('writes the title of a call whose area was refused', () => {
        const path = file();
        const outcome = setOverride(ID, { area: 'relative', title: 'my name' }, path);
        expect(outcome.changed).toEqual(['title']);
        expect(outcome.refused).toEqual([
            { field: 'area', reason: 'the area must be an absolute path' }
        ]);
        expect(held(path)).toEqual({ sessions: { [ID]: { title: 'my name' } } });
    });

    it('writes nothing when the value is already what the file holds', () => {
        const path = file({ sessions: { [ID]: { area: AREA } } });
        writeFileSync(path, JSON.stringify({ sessions: { [ID]: { area: AREA } } }) + '\n');
        expect(setOverride(ID, { area: AREA }, path)).toEqual({ changed: [], refused: [] });
        // The trailing newline is still there, so the file was not rewritten.
        expect(readFileSync(path, 'utf8').endsWith('\n')).toBe(true);
    });

    it('replaces a corrupt file with a map holding only the new entry', () => {
        const path = file('not json at all');
        setOverride(ID, { area: AREA }, path);
        expect(held(path)).toEqual({ sessions: { [ID]: { area: AREA } } });
        expect(overrides(path)).toEqual({ [ID]: { area: AREA } });
    });

    it('refuses a call with no session id', () => {
        const path = file();
        expect(() => setOverride('', { area: AREA }, path)).toThrow();
        expect(() => setOverride(null, { area: AREA }, path)).toThrow();
        expect(held(path)).toBe(null);
    });
});
