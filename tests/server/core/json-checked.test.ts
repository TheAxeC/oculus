// What readJsonChecked (lib/server/core/json.ts) answers for a file: nothing for a missing one, the
// parsed value for one that parses, and the reason for one that is there and does not read.
//
// Every file is under the system temporary directory. Nothing reads or writes ~/.oculus.

import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { readJsonChecked } from '../../../src/lib/server/core/json.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

describe('reading a JSON file with the reason it did not read', () => {
    it('answers each state of the file', () => {
        const dir = scratchDir('oculus-json-checked-');
        expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const good = join(dir, 'good.json');
        writeFileSync(good, '{"a": 1}');
        const broken = join(dir, 'broken.json');
        writeFileSync(broken, '{"a": ');
        const folder = join(dir, 'folder.json');
        mkdirSync(folder);

        expect(readJsonChecked(join(dir, 'missing.json'))).toEqual({ ok: true, value: undefined });
        expect(readJsonChecked(good)).toEqual({ ok: true, value: { a: 1 } });
        expect(readJsonChecked(broken)).toEqual({ ok: false, reason: 'is not JSON' });
        expect(readJsonChecked(folder)).toEqual({ ok: false, reason: 'cannot be read' });
    });
});
