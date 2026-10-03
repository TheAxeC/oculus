// What server/core/git/compare.ts's headFile reads: a file as HEAD or the index holds it, for
// the Open File (HEAD) item of a change row. A read: it runs `show` over a path git reads
// literally and changes nothing.
//
// What this does NOT cover: the route that answers it (tests/routes/git/head.test.ts) and the
// source tab that shows it.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { describe, expect } from 'vitest';
import { headFile } from '../../../../src/lib/server/core/git/compare.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { git, isolateGit, put, scratchRepo } from '../../git/refs/repo.ts';

isolateGit();

describe('headFile', () => {
    it('reads the text HEAD holds, whatever the worktree holds now', () => {
        const root = scratchRepo();
        put(root, 'kept.txt', 'changed in the worktree\n');
        expect(headFile(root, 'head', 'kept.txt')).toEqual({ ok: true, value: { text: 'one\n' } });
    });

    it('reads the text the index holds for the index side', () => {
        const root = scratchRepo();
        put(root, 'kept.txt', 'staged\n');
        git(root, 'add', 'kept.txt');
        put(root, 'kept.txt', 'changed again\n');
        expect(headFile(root, 'index', 'kept.txt')).toEqual({
            ok: true,
            value: { text: 'staged\n' }
        });
        expect(headFile(root, 'head', 'kept.txt')).toEqual({ ok: true, value: { text: 'one\n' } });
    });

    it('answers missing for a file only the worktree holds', () => {
        const root = scratchRepo();
        put(root, 'new.txt', 'loose\n');
        expect(headFile(root, 'head', 'new.txt')).toEqual({ ok: true, value: { missing: true } });
        expect(headFile(root, 'index', 'new.txt')).toEqual({ ok: true, value: { missing: true } });
    });

    it('answers missing for a file added to the index and not in HEAD', () => {
        const root = scratchRepo();
        put(root, 'added.txt', 'added\n');
        git(root, 'add', 'added.txt');
        expect(headFile(root, 'head', 'added.txt')).toEqual({ ok: true, value: { missing: true } });
        expect(headFile(root, 'index', 'added.txt')).toEqual({
            ok: true,
            value: { text: 'added\n' }
        });
    });

    it('answers missing in a repository with no commit', () => {
        const root = scratchDir('oculus-unborn-');
        git(root, 'init', '-q', '-b', 'main');
        put(root, 'a.txt', 'a\n');
        expect(headFile(root, 'head', 'a.txt')).toEqual({ ok: true, value: { missing: true } });
    });

    it('answers binary for a file whose bytes are not text', () => {
        const root = scratchRepo();
        put(root, 'blob.bin', Buffer.from([0, 1, 2, 3, 0, 255, 254, 0]));
        git(root, 'add', 'blob.bin');
        git(root, 'commit', '-q', '-m', 'Binary');
        expect(headFile(root, 'head', 'blob.bin')).toEqual({ ok: true, value: { binary: true } });
    });

    it('reads a path as a literal, never as a glob', () => {
        const root = scratchRepo();
        expect(headFile(root, 'head', '*.txt')).toEqual({ ok: true, value: { missing: true } });
        expect(headFile(root, 'index', '*.txt')).toEqual({ ok: true, value: { missing: true } });
    });

    it('refuses a directory', () => {
        const root = scratchRepo();
        put(root, 'dir/a.txt', 'a\n');
        git(root, 'add', 'dir/a.txt');
        git(root, 'commit', '-q', '-m', 'Folder');
        expect(headFile(root, 'head', 'dir').ok).toBe(false);
        expect(headFile(root, 'index', 'dir').ok).toBe(false);
    });

    it('refuses a path outside the repository, a lone dash and an empty path', () => {
        const root = scratchRepo();
        for (const path of ['../kept.txt', '/etc/hosts', '-x', '']) {
            expect(headFile(root, 'head', path).ok, path).toBe(false);
        }
    });
});
