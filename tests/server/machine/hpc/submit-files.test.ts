// Layer 4, server test. Which files of a project's code folder Submit sends, on real git: the files
// git keeps (tracked, and untracked but not ignored) without caches, results, logs, links that lead
// nowhere or files git ignores, and the total size the confirm states.
//
// What this does NOT cover: the copy itself, which the table in submit.test.ts records without
// starting rsync.
// @module-tag slow: its cases start real git processes, so npm test leaves it out.

import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { keptFiles } from '../../../../src/lib/server/core/git/files.ts';
import { planSubmit } from '../../../../src/lib/server/machine/hpc/submit.ts';
import { it } from '../../../fixtures/scratch.ts';
import { git, isolateGit } from '../../git/refs/repo.ts';
import { SCRIPT, world } from './submit-world.ts';

isolateGit();

const PATH = 'projects/p/code/hpc/a.slurm';

type Row = {
    row: string;
    files: Record<string, string>;
    after: (code: string) => void;
    answer: { files: number; bytes: number } | { refused: string };
};

const ROWS: Row[] = [
    {
        row: 'results, logs, caches, .npy files and what git ignores',
        files: {
            'hpc/a.slurm': SCRIPT,
            'results/r.csv': 'x',
            'logs/l.out': 'x',
            'pkg/__pycache__/m.pyc': 'x',
            'a.npy': 'x',
            'sub/b.npy': 'x',
            'venv/bin/python': 'x',
            'w.pt': 'x',
            '.gitignore': 'venv/\n*.pt\n',
            'keep.py': 'x'
        },
        after: () => undefined,
        answer: { files: 3, bytes: SCRIPT.length + 'venv/\n*.pt\n'.length + 1 }
    },
    {
        row: 'a tracked file deleted on disk',
        files: { 'hpc/a.slurm': SCRIPT, 'gone.py': 'x', 'main.py': 'x' },
        after: (code: string) => {
            git(code, 'add', 'gone.py');
            rmSync(join(code, 'gone.py'));
        },
        answer: { files: 2, bytes: SCRIPT.length + 1 }
    },
    {
        row: 'an untracked file git does not ignore, 5 MB in size',
        files: { 'hpc/a.slurm': SCRIPT, 'data.csv': 'y'.repeat(5 * 1024 * 1024) },
        after: () => undefined,
        answer: { files: 2, bytes: SCRIPT.length + 5 * 1024 * 1024 }
    },
    {
        row: 'a job script that git ignores',
        files: { 'hpc/a.slurm': SCRIPT, '.gitignore': 'hpc/a.slurm\n' },
        after: () => undefined,
        answer: { refused: 'not-sent' }
    }
];

describe('the files Submit sends from a code folder', () => {
    it.each(ROWS)('keeps, for $row, what the confirm counts', async ({ files, after, answer }) => {
        const { code, deps } = world(files, 'id: p\n', keptFiles);
        git(code, 'init', '-q');
        after(code);
        const planned = await planSubmit({ root: 'hub', path: PATH }, deps);
        if ('refused' in answer) {
            expect(planned).toEqual({ status: 'refused', reason: answer.refused });
        } else {
            if (planned.status !== 'ok') throw new Error(`no plan: ${planned.reason}`);
            expect({ files: planned.plan.files, bytes: planned.plan.bytes }).toEqual(answer);
        }
    });
});
