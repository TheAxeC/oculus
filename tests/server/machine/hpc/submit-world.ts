// Layer 4, test helper. A hub under the temporary directory with projects `p` and `q`, `p` holding
// the files a case gives in its code folder, and the deps Submit's planner and runner are given:
// the copy and the ssh runner record their calls and start no process. The code folder's files are
// listed from disk unless a case hands in `keptFiles`, which runs git.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';
import {
    planSubmit,
    submitState,
    type SubmitDeps
} from '../../../../src/lib/server/machine/hpc/submit.ts';
import type { SubmitPlan } from '../../../../src/lib/data/model/index.ts';
import { fixtureProject } from '../../../fixtures/entities-fixture.ts';
import { plantScratch } from '../../../fixtures/scratch.ts';

export const SCRIPT = '#!/bin/bash\n#SBATCH --job-name=a\nScratchDir="/local/${SLURM_JOB_ID}"\n';
export const OK = { stdout: '', stderr: '', code: 0 };

/** The files under a folder, relative to it, as a `kept` list reads them: every file, no git. */
export function listed(code: string): Promise<{ ok: true; value: string[] }> {
    const found: string[] = [];
    const walk = (dir: string): void => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) walk(path);
            else found.push(path.slice(code.length + 1));
        }
    };
    walk(code);
    return Promise.resolve({ ok: true, value: found });
}

/** A hub with projects `p` and `q`, `p` holding the given files in its code folder, and deps. */
export function world(
    files: Record<string, string>,
    manifest = 'id: p\n',
    kept: SubmitDeps['kept'] = listed
) {
    const planted: Record<string, string> = {
        'projects/p/project.yml': manifest,
        'projects/q/project.yml': 'id: q\n',
        'projects/q/code/hpc/a.slurm': SCRIPT,
        'loose/code/hpc/a.slurm': SCRIPT
    };
    for (const [path, text] of Object.entries(files)) planted[`projects/p/code/${path}`] = text;
    const hub = plantScratch('oculus-submit-', planted);
    const code = join(hub, 'projects', 'p', 'code');
    const copy = vi.fn((_input: unknown) => Promise.resolve(OK));
    const ssh = vi.fn((_host: string, _remote: string, _timeout: number, _signal?: AbortSignal) =>
        Promise.resolve({ stdout: '12345;utwente\n', stderr: '', code: 0 })
    );
    const deps: SubmitDeps = {
        roots: () => [{ key: 'hub', dir: hub, hub: true }],
        projects: () => [
            fixtureProject({
                id: 'hub:p',
                root: 'hub',
                folder: 'projects/p',
                file: join(hub, 'projects', 'p', 'project.yml')
            }),
            fixtureProject({
                id: 'hub:q',
                root: 'hub',
                folder: 'projects/q',
                file: join(hub, 'projects', 'q', 'project.yml')
            })
        ],
        catalog: () => ({}),
        where: () => ({ host: 'utwente' }),
        kept,
        copy,
        ssh,
        submits: submitState(),
        refresh: vi.fn(() => Promise.resolve()),
        say: vi.fn()
    };
    return { hub, code, deps, copy, ssh };
}

/** The plan of the script, which the table rows then send back to run. */
export async function planned(
    deps: SubmitDeps,
    path = 'projects/p/code/hpc/a.slurm'
): Promise<SubmitPlan> {
    const answer = await planSubmit({ root: 'hub', path }, deps);
    if (answer.status !== 'ok') throw new Error(`no plan: ${answer.reason}`);
    return answer.plan;
}
