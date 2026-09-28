// What the source tab needs to put git in its gutter: the repository that holds a tab's file, the
// tab a repository's file opens in, how long ago a commit was, a blamed line's words, where a run
// of one commit's lines starts, and the gutter mark of each line.

import { describe, expect, it } from 'vitest';
import type { GitBlameLine } from '../../../../src/lib/data/model/index.ts';
import {
    ago,
    blameStarts,
    blameStatus,
    blameWords,
    marksByLine,
    repoOfFile,
    tabOfFile
} from '../../../../src/lib/state/sources/repositories/file-git.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';

// The words are the page's own, so the real catalog is installed as a rendered page installs it.
setCatalog(textCatalog(loadConfig(engineDir()).config));

const SERVED = [
    { key: 'hub', dir: '/hub' },
    { key: 'tool', dir: '/hub/tools/oculus/' }
];

/** A blamed line of one commit, or of none. */
function blamed(line: number, hash: string): GitBlameLine {
    return {
        line,
        hash,
        short: hash.slice(0, 7),
        author: 'Ada',
        when: '2026-09-20T12:00:00Z',
        subject: `commit ${hash}`,
        uncommitted: hash === ''
    };
}

describe('the repository of a file and the tab of a repository file', () => {
    it('gives a tab file to the deepest repository that holds it, and none when none does', () => {
        const repositories = ['/hub', '/hub/tools/oculus'];
        expect(repoOfFile(SERVED, { root: 'tool', path: 'src/a.ts' }, repositories)).toEqual({
            root: '/hub/tools/oculus',
            path: 'src/a.ts'
        });
        expect(repoOfFile(SERVED, { root: 'hub', path: 'README.md' }, repositories)).toEqual({
            root: '/hub',
            path: 'README.md'
        });
        expect(repoOfFile(SERVED, { root: 'gone', path: 'a' }, repositories)).toBeNull();
        expect(repoOfFile(SERVED, { root: 'hub', path: 'a' }, ['/elsewhere'])).toBeNull();
    });

    it('opens a repository file under the served root that holds it most closely', () => {
        expect(tabOfFile(SERVED, { root: '/hub/tools/oculus', path: 'src/a.ts' })).toEqual({
            root: 'tool',
            path: 'src/a.ts'
        });
        expect(tabOfFile(SERVED, { root: '/hub', path: 'notes.md' })).toEqual({
            root: 'hub',
            path: 'notes.md'
        });
        expect(tabOfFile(SERVED, { root: '/other', path: 'x' })).toBeNull();
    });

    it('leaves out a repository whose folder is the tab file itself', () => {
        const served = [{ key: 'disk', dir: '/' }];
        expect(
            repoOfFile(served, { root: 'disk', path: 'work/repo' }, ['/work', '/work/repo'])
        ).toEqual({ root: '/work', path: 'repo' });
    });

    it('leaves out a served root whose folder is the repository file itself', () => {
        expect(tabOfFile(SERVED, { root: '/hub', path: 'tools/oculus' })).toEqual({
            root: 'hub',
            path: 'tools/oculus'
        });
    });

    it('joins a file under a served root of the root folder without a doubled slash', () => {
        const served = [{ key: 'disk', dir: '/' }];
        expect(
            repoOfFile(served, { root: 'disk', path: 'work/repo/a.txt' }, ['/work/repo'])
        ).toEqual({ root: '/work/repo', path: 'a.txt' });
    });

    it('holds no file in a repository whose key is empty', () => {
        expect(repoOfFile(SERVED, { root: 'hub', path: 'a.txt' }, [''])).toBeNull();
    });
});

describe('the words a blamed line carries', () => {
    const NOW = Date.parse('2026-09-25T12:00:00Z');

    it('says how long ago in the largest unit that is at least one', () => {
        expect(ago('2026-09-25T11:59:30Z', NOW)).toBe('just now');
        expect(ago('2026-09-25T11:00:00Z', NOW)).toBe('1 hour ago');
        expect(ago('2026-09-25T10:00:00Z', NOW)).toBe('2 hours ago');
        expect(ago('2026-09-24T12:00:00Z', NOW)).toBe('1 day ago');
        expect(ago('2026-09-18T12:00:00Z', NOW)).toBe('1 week ago');
        expect(ago('2026-09-20T12:00:00Z', NOW)).toBe('5 days ago');
        expect(ago('2026-08-01T12:00:00Z', NOW)).toBe('1 month ago');
        expect(ago('not a date', NOW)).toBe('');
    });

    it('names the author, the age and the subject, and Not Committed Yet for a line no commit holds', () => {
        const line = blamed(3, 'abcdef123');
        expect(blameWords(line, NOW)).toEqual({
            gutter: 'Ada, 5 days ago',
            title: 'abcdef1 commit abcdef123 (2026-09-20). Open this commit in the graph.'
        });
        expect(blameStatus(line, NOW)).toBe('Ada, 5 days ago: commit abcdef123');
        expect(blameWords(blamed(4, ''), NOW).gutter).toBe('Not Committed Yet');
        expect(blameStatus(blamed(4, ''), NOW)).toBe('Not Committed Yet');
        expect(blameStatus(undefined, NOW)).toBe('');
    });

    it('writes the words on the first line of each run of one commit', () => {
        const lines = [
            blamed(1, 'a'),
            blamed(2, 'a'),
            blamed(3, 'b'),
            blamed(4, ''),
            blamed(5, '')
        ];
        expect([...blameStarts(lines)]).toEqual([1, 3, 4]);
    });
});

describe('the gutter mark of each line', () => {
    it('marks each line of an added or modified run, and a deletion on the line it sits before', () => {
        const byLine = marksByLine(
            [
                { kind: 'added', line: 2, count: 2 },
                { kind: 'modified', line: 6, count: 1 },
                { kind: 'deleted', line: 11, count: 0 }
            ],
            10
        );
        expect([...byLine]).toEqual([
            [2, { kind: 'added', start: 2 }],
            [3, { kind: 'added', start: 2 }],
            [6, { kind: 'modified', start: 6 }],
            [10, { kind: 'deleted', start: 11 }]
        ]);
    });
});
