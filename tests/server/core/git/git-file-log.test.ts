// Layer 4, server test. The commits that touched one file, as server/core/git/files.ts's fileLog
// reads them and GET /api/git?log=<repository>&path= answers them: newest first, across a rename,
// at most FILE_LOG_ENTRIES, the path read as a literal name, an empty list for a folder in no
// repository, and a refusal for a repository the server was not told to serve.
//
// Every repository is built in a temporary directory through the git watcher's own helpers, which
// confine each git command to it and pass the author on the command line.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { beforeEach, describe, expect } from 'vitest';
import { FILE_LOG_ENTRIES, fileLog } from '../../../../src/lib/server/core/git/files.ts';
import { handleGitGet } from '../../../../src/lib/server/git/git-reads.ts';
import type { GitCommit } from '../../../../src/lib/data/model/index.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { commitAll, gitText as git, put, repositoryIn } from '../../root/watch/repos.ts';

let dir = '';
let repo = '';

beforeEach(() => {
    dir = scratchDir('oculus-git-log-');
    repo = repositoryIn(dir, 'repo');
});

/** The subjects of a log, newest first. */
function subjects(commits: GitCommit[]): string[] {
    return commits.map((commit) => commit.subject);
}

/** One GET of the endpoint over the real reads, with the roots it may name. */
async function ask(query: string, roots: string[] = [repo]) {
    const response = await handleGitGet(new Request(`http://localhost/api/git?${query}`), {
        rootsFor: () => roots
    });
    return {
        status: response.status,
        body: (await response.json()) as { ok?: boolean; commits?: GitCommit[]; error?: string }
    };
}

describe('the commits of one file', () => {
    it('lists them newest first, and only the ones that touched the file', () => {
        put(repo, 'kept.txt', 'one\ntwo\n');
        commitAll(repo, 'touch kept');
        put(repo, 'other.txt', 'x\n');
        commitAll(repo, 'touch other');
        put(repo, 'kept.txt', 'one\ntwo\nthree\n');
        commitAll(repo, 'touch kept again');
        const read = fileLog(repo, 'kept.txt');
        expect(read.ok).toBe(true);
        if (read.ok)
            expect(subjects(read.value)).toEqual(['touch kept again', 'touch kept', 'first']);
    });

    it('follows the file across a rename', () => {
        put(repo, 'a.txt', 'alpha\nbeta\ngamma\ndelta\nepsilon\nzeta\n');
        commitAll(repo, 'add a');
        git(repo, 'mv', 'a.txt', 'b.txt');
        commitAll(repo, 'rename a to b');
        put(repo, 'b.txt', 'alpha\nbeta\ngamma\ndelta\nepsilon\nzeta\neta\n');
        commitAll(repo, 'edit b');
        const read = fileLog(repo, 'b.txt');
        expect(read.ok && subjects(read.value)).toEqual(['edit b', 'rename a to b', 'add a']);
    });

    it('lists at most FILE_LOG_ENTRIES commits', () => {
        const total = FILE_LOG_ENTRIES + 3;
        const stream = Array.from({ length: total }, (_, at) => {
            const text = `${at}\n`;
            const message = `edit ${at}`;
            return [
                'commit refs/heads/work',
                `committer Oculus Test <nobody@example.invalid> ${1700000000 + at} +0000`,
                `data ${message.length}`,
                message,
                ...(at === 0 ? ['from refs/heads/work^0'] : []),
                'M 100644 inline kept.txt',
                `data ${text.length}`,
                text
            ].join('\n');
        }).join('\n');
        expect(resolve(repo).startsWith(resolve(tmpdir()) + sep)).toBe(true);
        const done = spawnSync('git', ['-C', repo, 'fast-import', '--quiet'], {
            input: `${stream}\n`,
            timeout: 30000
        });
        expect(done.status).toBe(0);
        const read = fileLog(repo, 'kept.txt');
        expect(read.ok && read.value.length).toBe(FILE_LOG_ENTRIES);
        expect(read.ok && read.value[0].subject).toBe(`edit ${total - 1}`);
    });

    it('reads a path holding a star as that name, not as a pattern', () => {
        put(repo, 'star*.txt', 'literal\n');
        put(repo, 'star1.txt', 'other\n');
        commitAll(repo, 'add the star file and a file it would match');
        put(repo, 'star1.txt', 'other again\n');
        commitAll(repo, 'touch the file the star would match');
        const read = fileLog(repo, 'star*.txt');
        expect(read.ok && subjects(read.value)).toEqual([
            'add the star file and a file it would match'
        ]);
    });

    it('answers an empty list for a folder in no repository', () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        const read = fileLog(plain, 'kept.txt');
        expect(read).toEqual({ ok: true, value: [] });
    });

    it('answers an empty list for a path no commit touched', () => {
        put(repo, 'new.txt', 'not committed\n');
        const read = fileLog(repo, 'new.txt');
        expect(read).toEqual({ ok: true, value: [] });
    });

    it('refuses a path outside the repository', () => {
        const read = fileLog(repo, '../x');
        expect(read.ok).toBe(false);
    });
});

describe('GET /api/git?log=', () => {
    const query = (root: string, path: string) =>
        `log=${encodeURIComponent(root)}&path=${encodeURIComponent(path)}`;

    it('answers the commits of the file', async () => {
        const answer = await ask(query(repo, 'kept.txt'));
        expect(answer.status).toBe(200);
        expect(subjects(answer.body.commits ?? [])).toEqual(['first']);
        expect(git(repo, 'rev-parse', 'HEAD').trim()).toBe(answer.body.commits?.[0].hash);
    });

    it('answers an empty list for a file outside every repository', async () => {
        const plain = join(dir, 'plain');
        mkdirSync(plain);
        const answer = await ask(query(plain, 'kept.txt'), [plain]);
        expect(answer.status).toBe(200);
        expect(answer.body.commits).toEqual([]);
    });

    it('refuses a repository the server was not told to serve', async () => {
        const answer = await ask(query(repo, 'kept.txt'), [join(dir, 'elsewhere')]);
        expect(answer.status).toBe(400);
    });
});
