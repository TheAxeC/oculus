// The machine file's `open_bin`, the program an https address is handed to: the values its reader
// refuses, and the opener refusing anything that is not an https address before any program runs.

import { describe, expect, it } from 'vitest';
import { checkLocal } from '../../../src/lib/data/sources/config.ts';
import { addressOpener } from '../../../src/lib/server/files/open.ts';

const FILE = '/machine/config/local.yml';

describe('open_bin in the machine file', () => {
    // revert: src/lib/data/sources/config/local.ts "if (typeof record.open_bin !== 'string' || record.open_bin.length === 0) {" => if (typeof record.open_bin !== 'string') {
    it('refuses an empty program, naming the key', () => {
        expect(checkLocal('hub: /machine/hub\nopen_bin: ""\n', FILE)).toBe(
            `${FILE}: open_bin must be a non-empty string`
        );
    });

    // revert: src/lib/data/sources/config/local.ts "if (typeof record.open_bin !== 'string' || record.open_bin.length === 0) {" => if (record.open_bin === '') {
    it('refuses a program that is not a string, naming the key', () => {
        expect(checkLocal('hub: /machine/hub\nopen_bin: [open]\n', FILE)).toBe(
            `${FILE}: open_bin must be a non-empty string`
        );
    });
});

describe('the address opener', () => {
    // revert: src/lib/server/files/open.ts "if (!openableAddress(target)) throw new Error('open refused');" => delete
    it('refuses anything but an https address, and runs no program for it', async () => {
        // A program that is not there: were it run, the answer would be its spawn error.
        const open = addressOpener('/nonexistent/program-that-is-never-run');
        for (const target of ['file:///etc/hosts', 'http://example.invalid/', '/etc/hosts']) {
            await expect(open(target)).rejects.toThrow('open refused');
        }
    });
});
