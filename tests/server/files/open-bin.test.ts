// The opener of an https address (server/files/open.ts): it refuses anything that is not an https
// address before any program runs. The values the machine file's `open_bin` takes are
// tests/data/sources/config/local.test.ts's.

import { describe, expect, it } from 'vitest';
import { addressOpener } from '../../../src/lib/server/files/open.ts';

describe('the address opener', () => {
    it('refuses anything but an https address, and runs no program for it', async () => {
        // A program that is not there: were it run, the answer would be its spawn error.
        const open = addressOpener('/nonexistent/program-that-is-never-run');
        for (const target of ['file:///etc/hosts', 'http://example.invalid/', '/etc/hosts']) {
            await expect(open(target)).rejects.toThrow('open refused');
        }
    });
});
