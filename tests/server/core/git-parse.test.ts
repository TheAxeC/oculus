// The parser over `status --porcelain=v1 -z` in src/lib/server/core/git-parse.ts, which every
// module that reads the status splits its records through.
//
// In `-z` output a record is two letters, a space and a path, never quoted, and a rename or a copy
// carries its old path as the next whole field, which is a path and not a record of its own.

import { describe, expect, it } from 'vitest';
import { statusRecords } from '../../../src/lib/server/core/git-parse.ts';

describe('statusRecords', () => {
    it('reads a rename with its old path, an untracked path and a path with a space', () => {
        expect(statusRecords('R  new.txt\0old.txt\0?? loose\0 M a b.txt\0')).toEqual([
            { code: 'R ', path: 'new.txt', from: 'old.txt' },
            { code: '??', path: 'loose', from: null },
            { code: ' M', path: 'a b.txt', from: null }
        ]);
    });

    it('reads a copy and a rename in the worktree column with their old paths', () => {
        expect(statusRecords('C  copy.txt\0src.txt\0 R moved.txt\0was.txt\0')).toEqual([
            { code: 'C ', path: 'copy.txt', from: 'src.txt' },
            { code: ' R', path: 'moved.txt', from: 'was.txt' }
        ]);
    });

    it('has no records for empty output', () => {
        expect(statusRecords('')).toEqual([]);
        expect(statusRecords('\0')).toEqual([]);
    });
});
