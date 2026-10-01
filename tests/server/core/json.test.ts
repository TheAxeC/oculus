// Layer 2, server test. The atomic writers of server/core/json.ts: the mode a file keeps or is made
// with, the folder a write makes, and what a write that throws leaves behind: the old content and
// the folder as it was, with no temporary file beside them.
//
// The last cases are of `quickly` in data/shapes/shapes.ts, the quick path over a schema, which
// refuses the schema forms it cannot rebuild.
//
// Every file is under a scratch directory of the case's own, asserted inside it before the write.
// What this does NOT cover: the fsync, which no file system call made afterwards can observe.

import {
    chmodSync,
    lstatSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    statSync,
    symlinkSync,
    writeFileSync
} from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { z } from 'zod';
import { writeTextAtomic } from '../../../src/lib/server/core/json.ts';
import { quickly } from '../../../src/lib/data/shapes/shapes.ts';
import * as fold from '../../../src/lib/server/sessions/fold.ts';
import * as codex from '../../../src/lib/server/sessions/stores/codex.ts';
import * as turns from '../../../src/lib/server/sessions/stores/turns.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** A path under a scratch directory of this case's own, and that directory. */
function place(name: string): { dir: string; path: string } {
    const dir = scratchDir('oculus-json-');
    const path = join(dir, name);
    expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
    return { dir, path };
}

/** The permission bits of a file. */
function modeOf(path: string): number {
    return statSync(path).mode & 0o777;
}

describe('the mode an atomic write leaves', () => {
    it('keeps an existing private file private, with no new mode and with one', () => {
        const { path } = place('private.json');
        writeFileSync(path, 'before');
        chmodSync(path, 0o600);
        writeTextAtomic(path, 'one');
        expect(modeOf(path)).toBe(0o600);
        writeTextAtomic(path, 'two', 0o640);
        expect(modeOf(path)).toBe(0o600);
        expect(readFileSync(path, 'utf8')).toBe('two');
    });

    it('makes a new file with the mode it is given', () => {
        const { path } = place('new.json');
        writeTextAtomic(path, 'made', 0o640);
        expect(modeOf(path)).toBe(0o640);
        expect(readFileSync(path, 'utf8')).toBe('made');
    });

    it('refuses a read-only file with the error an in-place write gives, and leaves it as it was', () => {
        const { path } = place('locked.yml');
        writeFileSync(path, 'before\n');
        chmodSync(path, 0o444);
        let inPlace: unknown = null;
        try {
            writeFileSync(path, 'after\n');
        } catch (error) {
            inPlace = error;
        }
        expect(inPlace).toMatchObject({ code: 'EACCES' });
        expect(() => writeTextAtomic(path, 'after\n')).toThrow((inPlace as Error).message);
        let atomic: unknown = null;
        try {
            writeTextAtomic(path, 'after\n', 0o644);
        } catch (error) {
            atomic = error;
        }
        expect(atomic).toMatchObject({ code: 'EACCES', syscall: 'open', path });
        expect(readFileSync(path, 'utf8')).toBe('before\n');
        expect(modeOf(path)).toBe(0o444);
    });
});

describe('the folder an atomic write lands in', () => {
    it('is made when it is not there', () => {
        const { dir } = place('unused');
        const path = join(dir, 'a', 'b', 'file.txt');
        writeTextAtomic(path, 'deep');
        expect(readFileSync(path, 'utf8')).toBe('deep');
    });

    it('is left as it was, the old content with it, by a write under a file', () => {
        const { dir, path } = place('plain.txt');
        writeFileSync(path, 'old');
        const before = readdirSync(dir).sort();
        expect(() => writeTextAtomic(join(path, 'child.txt'), 'new')).toThrow();
        expect(readFileSync(path, 'utf8')).toBe('old');
        expect(readdirSync(dir).sort()).toEqual(before);
    });

    it('is left as it was by a write onto a folder', () => {
        const { dir, path } = place('taken');
        mkdirSync(path);
        writeFileSync(join(dir, 'beside.txt'), 'kept');
        const before = readdirSync(dir).sort();
        expect(() => writeTextAtomic(path, 'new')).toThrow();
        expect(readdirSync(dir).sort()).toEqual(before);
        expect(readdirSync(path)).toEqual([]);
    });
});

describe('an atomic write through a link', () => {
    it('writes the file the link names and leaves the link a link', () => {
        const { dir, path } = place('target.yml');
        writeFileSync(path, 'old');
        const link = join(dir, 'link.yml');
        symlinkSync(path, link);
        writeTextAtomic(link, 'new');
        expect(lstatSync(link).isSymbolicLink()).toBe(true);
        expect(readFileSync(path, 'utf8')).toBe('new');
    });
});

describe('quickly', () => {
    it('refuses a loose object', () => {
        expect(() => quickly(z.looseObject({ a: z.string() }))).toThrow(/plain object/);
    });

    it('refuses a strict object', () => {
        expect(() => quickly(z.strictObject({ a: z.string() }))).toThrow(/plain object/);
    });

    it('refuses an object carrying a check', () => {
        const shape = z.object({ a: z.string() }).refine(() => true);
        expect(() => quickly(shape)).toThrow(/object without a check/);
    });

    it('refuses a list carrying a check', () => {
        expect(() => quickly(z.array(z.string()).min(1))).toThrow(/list without a check/);
    });

    it('finds a refused form inside a field, a wrapper, a list and a union', () => {
        expect(() => quickly(z.object({ a: z.array(z.number()).max(2) }))).toThrow(/list/);
        expect(() =>
            quickly(z.object({ a: z.looseObject({}).optional().catch(undefined) }))
        ).toThrow(/plain object/);
        expect(() => quickly(z.array(z.looseObject({})))).toThrow(/plain object/);
        expect(() => quickly(z.union([z.string(), z.looseObject({})]))).toThrow(/plain object/);
    });

    it('builds over a plain object, a list and the wrappers, and answers what the shape answers', () => {
        const shape = z.object({
            name: z.string().optional().catch(undefined),
            items: z.array(z.number().catch(0)).nullable().catch(null)
        });
        const quick = quickly(shape);
        for (const value of [{ name: 'a', items: [1, 2] }, { name: 3, items: [1, 'x'] }, {}, 5]) {
            const [quickAnswer, answer] = [quick.safeParse(value), shape.safeParse(value)];
            expect([quickAnswer.success, quickAnswer.data]).toStrictEqual([
                answer.success,
                answer.data
            ]);
        }
    });

    it('builds over every shape the readers of the sessions folder hold', () => {
        // Each of these modules builds its schemas with `quickly` when it is imported.
        for (const loaded of [fold, codex, turns]) {
            expect(Object.keys(loaded).length).toBeGreaterThan(0);
        }
    });
});
