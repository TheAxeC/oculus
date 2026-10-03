// readCount: what a texcount output says. The program reports its failures on standard output and
// exits 0, so the words are the first line that is only a number and a failure is a `!!!` line or
// an `(errors:N)` mark above zero.

import { describe, expect, it } from 'vitest';
import { readCount } from '../../../src/lib/server/content/latex/tools.ts';

describe('readCount', () => {
    it('reads the first line that is only a number', () => {
        expect(readCount('123\n')).toEqual({ words: 123 });
        expect(readCount('Words in text: x\n  45  \n7\n')).toEqual({ words: 45 });
    });

    it('reads a missing include as the reason between the marks', () => {
        const out = '!!! File nothere not found in path [./]. !!!\n1\n (errors:1)\n';

        expect(readCount(out)).toEqual({ failure: 'File nothere not found in path [./].' });
    });

    it('reads an unreadable main as its reason', () => {
        const out = '!!! File not found or not readable: missing.tex !!!\n0\n (errors:1)\n';

        expect(readCount(out)).toEqual({ failure: 'File not found or not readable: missing.tex' });
    });

    it('reads an error mark without a reason as a failure with none', () => {
        expect(readCount('4\n (errors:2)\n')).toEqual({ failure: '' });
    });

    it('does not read a number in a name as the count', () => {
        expect(readCount('chapter2.tex: none\n')).toEqual({ failure: '' });
        expect(readCount('5\n (errors:0)\n')).toEqual({ words: 5 });
    });
});
