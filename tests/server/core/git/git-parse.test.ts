// The parsers of src/lib/server/core/git/parse.ts: `status --porcelain=v1 -z`, which every module
// that reads the status splits its records through, and the change lists, line counts, attributes
// and one-line reasons the git reader builds from git's output.
//
// In `-z` output a record is two letters, a space and a path, never quoted, and a rename or a copy
// carries its old path as the next whole field, which is a path and not a record of its own.

import { describe, expect, it } from 'vitest';
import {
    parseAttributes,
    parseNumstat,
    shortReason,
    statusLists,
    statusRecords
} from '../../../../src/lib/server/core/git/parse.ts';

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

describe('the change lists of a status', () => {
    it('sorts each record into its list, the line counts on the worktree side alone', () => {
        const records = statusRecords('MM both.txt\0A  new.txt\0?? loose\0UU fight.txt\0');
        const counts = parseNumstat('3\t1\tboth.txt\0');
        const entry = (path: string, status: string, added = 0, deleted = 0) => ({
            path,
            status,
            added,
            deleted
        });
        expect(statusLists(records, counts, 10)).toEqual({
            staged: [entry('both.txt', 'M'), entry('new.txt', 'A')],
            unstaged: [entry('both.txt', 'M', 3, 1)],
            untracked: [entry('loose', '?')],
            conflicted: [entry('fight.txt', 'UU')]
        });
        expect(statusLists(records, counts, 1).staged).toEqual([entry('both.txt', 'M')]);
    });

    // Revert: leave `from` out of the entry statusLists builds.
    it('gives the entry of a rename or a copy its old path, and no other entry one', () => {
        const lists = statusLists(
            statusRecords(
                'R  new.txt\0old.txt\0RM both.txt\0was.txt\0C  copy.txt\0src.txt\0 M plain.txt\0'
            ),
            parseNumstat('2\t1\tboth.txt\0'),
            10
        );

        expect(lists.staged.map((one) => [one.path, one.from])).toEqual([
            ['new.txt', 'old.txt'],
            ['both.txt', 'was.txt'],
            ['copy.txt', 'src.txt']
        ]);
        // the worktree column of `RM` holds a modification, which is no rename
        expect(lists.unstaged.map((one) => Object.hasOwn(one, 'from'))).toEqual([false, false]);
    });

    it('reads a binary file of numstat as no counts and a rename by its new path', () => {
        expect(parseNumstat('-\t-\tpic.png\0' + '2\t0\t\0old.txt\0new.txt\0')).toEqual(
            new Map([
                ['pic.png', [null, null]],
                ['new.txt', [2, 0]]
            ])
        );
    });
});

describe("git's attributes and reasons", () => {
    it('reads the five attributes in the order asked, and a missing line as unspecified', () => {
        const output = [
            'a.txt: filter: lfs',
            'a.txt: text: unset',
            'a.txt: eol: crlf',
            'a.txt: working-tree-encoding: UTF-16',
            'a.txt: ident: set',
            ''
        ].join('\n');
        expect(parseAttributes(output)).toEqual({
            filter: 'lfs',
            text: 'unset',
            eol: 'crlf',
            workingTreeEncoding: 'UTF-16',
            ident: 'set'
        });
        expect(parseAttributes('')).toEqual({
            filter: 'unspecified',
            text: 'unspecified',
            eol: 'unspecified',
            workingTreeEncoding: 'unspecified',
            ident: 'unspecified'
        });
    });

    it("cuts a reason to its first line and width, without git's fatal prefix", () => {
        expect(shortReason(new Error('fatal: not a git repository\nhint'), 9)).toBe('not a git');
        expect(shortReason('  plain words  ', 120)).toBe('plain words');
    });
});
