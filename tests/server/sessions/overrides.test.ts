// setOverride against a temporary overrides file: what it keeps.
//
// Nothing here reads or writes ~/.oculus. Every case makes its own file under the system temporary
// directory and asserts the path is inside it before the write, so the user's own pins are never in
// reach of this suite.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { setHidden, setOverride } from '../../../src/lib/server/sessions/overrides.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const ID = 'sess-1';
const AREA = '/hub/projects/manuscripts/alpha';

/** A fresh overrides file that does not exist yet, inside the system temporary directory. */
function file(body?: unknown): string {
    const dir = scratchDir('oculus-overrides-');
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

    it('writes a missing file and refuses one it cannot read, leaving it as it was', () => {
        const missing = file();
        expect(setOverride(ID, { area: AREA }, missing).changed).toEqual(['area']);
        expect(held(missing)).toEqual({ sessions: { [ID]: { area: AREA } } });

        const cases: [string | null, string][] = [
            ['{"sessions": ', 'is not JSON'],
            ['["a", "list"]', 'is not the shape'],
            [null, 'cannot be read']
        ];
        for (const [body, reason] of cases) {
            const path = file();
            if (body === null) mkdirSync(path);
            else writeFileSync(path, body);
            const said = `${basename(path)} ${reason}: ${path}`;

            const pinned = setOverride(ID, { area: AREA, title: 'name' }, path);
            expect(pinned.changed).toEqual([]);
            expect(pinned.records).toEqual([]);
            expect(pinned.refused).toEqual([
                { field: 'area', reason: said },
                { field: 'title', reason: said }
            ]);

            const archived = setHidden(ID, true, path);
            expect(archived.changed).toEqual([]);
            expect(archived.refused).toEqual([{ field: 'hidden', reason: said }]);

            if (body === null) expect(statSync(path).isDirectory()).toBe(true);
            else expect(readFileSync(path, 'utf8')).toBe(body);
        }
    });
});
