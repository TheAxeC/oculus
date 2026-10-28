// Layer 4, server test. Submit's two guarantees, each a table with one row per input that gives a
// different outcome: the run of a confirmed plan (the plan the reader confirmed, equal to the plan
// the server computes at the press, is what runs, and nothing else does), and the scratch rule
// (a job script whose code and sourced files never name /local/$SLURM_JOB_ID gets the warning
// before Submit). The code folder is a real folder under the temporary directory whose files are
// listed from disk; the copy and the ssh runner record their calls and start no process, and no row
// starts git (the rows about which files git keeps are in submit-files.test.ts).

import { realpathSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    planSubmit,
    runSubmit,
    type RunAnswer
} from '../../../../src/lib/server/machine/hpc/submit.ts';
import type { SubmitPlan } from '../../../../src/lib/data/model/index.ts';
import { it, plantScratch } from '../../../fixtures/scratch.ts';
import { OK, SCRIPT, planned, world } from './submit-world.ts';
import { put } from '../../git/refs/repo.ts';

type RunRow = {
    name: string;
    /** What happens to the plan, or the folder, between the plan and the press. */
    change?: (plan: SubmitPlan, code: string) => SubmitPlan;
    /**
     * The row's change is made before the plan is asked for again, and the plan sent is the one
     * that ask answers when it answers one, else the one asked for before the change.
     */
    replan?: boolean;
    /** The submit state is closed before the press, or while the press computes its plan. */
    close?: 'before' | 'during';
    confirm?: unknown;
    copy?: { stdout: string; stderr: string; code: number };
    ssh?: { stdout: string; stderr: string; code: number };
    /** A first run of the plan is held at its copy while this row's run is pressed. */
    held?: boolean;
    answer: RunAnswer;
    copies: number;
    sshes: number;
};

const MKDIR =
    'rsync: [Receiver] mkdir "/home/u/projects/q/code" failed: No such file or directory (2)';

const RUNS: RunRow[] = [
    {
        name: 'runs the copy and the remote command of the confirmed plan and answers the job id',
        answer: { status: 'ok', job: '12345' },
        copies: 1,
        sshes: 1
    },
    {
        name: 'refuses a plan whose host differs',
        change: (plan) => ({ ...plan, host: 'elsewhere' }),
        answer: { status: 'refused', reason: 'changed' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses a plan whose target differs',
        change: (plan) => ({ ...plan, target: 'utwente:~/projects/other/' }),
        answer: { status: 'refused', reason: 'changed' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses a plan whose remote command differs',
        change: (plan) => ({ ...plan, remote: `${plan.remote}; rm -rf ~` }),
        answer: { status: 'refused', reason: 'changed' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses a plan whose files differ, a file having been added after the plan',
        change: (plan, code) => {
            put(code, 'added.py', 'x = 1\n');
            return plan;
        },
        answer: { status: 'refused', reason: 'changed' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses a press with no confirm',
        confirm: undefined,
        answer: { status: 'refused', reason: 'unconfirmed' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses a confirm that is the string "true"',
        confirm: 'true',
        answer: { status: 'refused', reason: 'unconfirmed' },
        copies: 0,
        sshes: 0
    },
    {
        name: "answers copy-failed with rsync's last line when rsync exits 23, and runs no sbatch",
        copy: {
            stdout: '',
            stderr: 'rsync: some files vanished\nrsync error: code 23\n',
            code: 23
        },
        answer: { status: 'refused', reason: 'copy-failed', detail: 'rsync error: code 23' },
        copies: 1,
        sshes: 0
    },
    {
        name: "answers copy-failed with the receiver's line when a deeper cluster folder is missing",
        copy: { stdout: '', stderr: `${MKDIR}\n`, code: 23 },
        answer: { status: 'refused', reason: 'copy-failed', detail: MKDIR },
        copies: 1,
        sshes: 0
    },
    {
        name: 'answers copy-failed with the line ssh wrote when the host does not answer',
        copy: {
            stdout: '',
            stderr: 'ssh: connect to host utwente port 22: Operation timed out\nrsync(55985): error: unexpected end of file\n',
            code: 255
        },
        answer: {
            status: 'refused',
            reason: 'copy-failed',
            detail: 'ssh: connect to host utwente port 22: Operation timed out'
        },
        copies: 1,
        sshes: 0
    },
    {
        name: 'refuses outside-code when the code folder links to the code folder of another project',
        replan: true,
        change: (plan, code) => {
            rmSync(code, { recursive: true });
            symlinkSync(join(code, '..', '..', 'q', 'code'), code);
            return plan;
        },
        answer: { status: 'refused', reason: 'outside-code' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses outside-code when the code folder links to a hub folder in no project',
        replan: true,
        change: (plan, code) => {
            rmSync(code, { recursive: true });
            symlinkSync(join(code, '..', '..', '..', 'loose', 'code'), code);
            return plan;
        },
        answer: { status: 'refused', reason: 'outside-code' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses outside when the script links to a file outside every served root',
        replan: true,
        change: (plan, code) => {
            const elsewhere = plantScratch('oculus-elsewhere-', { 'x.slurm': SCRIPT });
            rmSync(join(code, 'hpc', 'a.slurm'));
            symlinkSync(join(elsewhere, 'x.slurm'), join(code, 'hpc', 'a.slurm'));
            return plan;
        },
        answer: { status: 'refused', reason: 'outside' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses closed when the state closes while the press computes its plan',
        close: 'during',
        answer: { status: 'refused', reason: 'closed' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses closed for a press that comes after the state closed',
        close: 'before',
        answer: { status: 'refused', reason: 'closed' },
        copies: 0,
        sshes: 0
    },
    {
        name: 'refuses a second run of the same host and folder as busy and calls nothing for it',
        held: true,
        answer: { status: 'refused', reason: 'busy' },
        copies: 1,
        sshes: 1
    },
    {
        name: 'answers submit-failed with the last line of sbatch when it exits 1',
        ssh: {
            stdout: '',
            stderr: 'sbatch: error: Batch job submission failed: Invalid partition name specified\n',
            code: 1
        },
        answer: {
            status: 'refused',
            reason: 'submit-failed',
            detail: 'sbatch: error: Batch job submission failed: Invalid partition name specified'
        },
        copies: 1,
        sshes: 1
    }
];

describe('the run of a confirmed plan', () => {
    it.each(RUNS)('$name', async (row) => {
        const { code, deps, copy, ssh } = world({ 'hpc/a.slurm': SCRIPT, 'main.py': 'x = 0\n' });
        const plan = await planned(deps);
        let sent = row.change === undefined ? plan : row.change(plan, code);
        if (row.replan === true) {
            const again = await planSubmit(
                { root: 'hub', path: 'projects/p/code/hpc/a.slurm', resource: 'utwente' },
                deps
            );
            sent = again.status === 'ok' ? again.plan : plan;
        }
        if (row.copy !== undefined) copy.mockResolvedValue(row.copy);
        if (row.ssh !== undefined) ssh.mockResolvedValue(row.ssh);
        const confirm = 'confirm' in row ? row.confirm : true;
        let release: (value: typeof OK) => void = () => undefined;
        let first: Promise<RunAnswer> | null = null;
        if (row.held === true) {
            copy.mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
            first = runSubmit({ plan, confirm: true }, deps);
            await vi.waitFor(() => expect(copy).toHaveBeenCalledTimes(1));
        }
        const listing = vi.fn(deps.kept);
        deps.kept = listing;
        if (row.close === 'before') deps.submits.close();
        if (row.close === 'during') {
            const reached = deps.connection;
            deps.connection = (resource) => {
                deps.submits.close();
                return reached(resource);
            };
        }
        const answer = await runSubmit({ plan: sent, confirm }, deps);
        release(OK);
        if (first !== null) expect(await first).toEqual({ status: 'ok', job: '12345' });
        expect(deps.submits.running.size).toBe(0);
        expect(answer).toEqual(row.answer);
        if (row.close === 'before') expect(listing).not.toHaveBeenCalled();
        expect(copy).toHaveBeenCalledTimes(row.copies);
        expect(ssh).toHaveBeenCalledTimes(row.sshes);
        if (row.name.startsWith('runs the copy')) {
            expect(copy.mock.calls[0][0]).toMatchObject({
                cwd: plan.source,
                vector: plan.rsync,
                files: ['hpc/a.slurm', 'main.py']
            });
            expect(ssh.mock.calls[0].slice(0, 3)).toEqual([
                { resource: 'utwente', name: 'utwente', host: 'utwente' },
                "cd ~/'projects/p' && sbatch --parsable 'hpc/a.slurm'",
                30000
            ]);
        }
    });
});

describe('the cluster a confirmed plan runs on', () => {
    it('copies to and runs on the cluster the plan names, the second of two, and runs nothing for a key slurm.resource does not list (G43)', async () => {
        const { deps, copy, ssh } = world({ 'hpc/a.slurm': SCRIPT });
        const plan = await planned(deps, 'projects/p/code/hpc/a.slurm', 'b');
        expect(plan.resource).toBe('b');
        expect(await runSubmit({ plan, confirm: true }, deps)).toEqual({
            status: 'ok',
            job: '12345'
        });
        const sent = copy.mock.calls[0][0] as { vector: string[] };
        expect(sent.vector.at(-1)).toBe('b:~/projects/p/');
        expect(ssh.mock.calls.map((call) => call[0])).toEqual([
            { resource: 'b', name: 'b', host: 'b' }
        ]);
        const elsewhere = await planSubmit(
            { root: 'hub', path: 'projects/p/code/hpc/a.slurm', resource: 'c' },
            deps
        );
        expect(elsewhere).toMatchObject({ status: 'refused', reason: 'unknown-cluster' });
        const moved = await runSubmit({ plan: { ...plan, resource: 'c' }, confirm: true }, deps);
        expect(moved).toMatchObject({ status: 'refused', reason: 'unknown-cluster' });
        expect(copy).toHaveBeenCalledTimes(1);
        expect(ssh).toHaveBeenCalledTimes(1);
    });
});

type ScratchRow = {
    name: string;
    script: string;
    files?: Record<string, string>;
    manifest?: string;
    named: boolean;
    unread: string[];
};

const NAMING = 'ScratchDir="/local/${SLURM_JOB_ID}"\n';

const SCRATCH: ScratchRow[] = [
    {
        name: 'names it as /local/$SLURM_JOB_ID',
        script: 'D=/local/$SLURM_JOB_ID\n',
        named: true,
        unread: []
    },
    {
        name: 'names it as /local/${SLURM_JOB_ID}',
        script: 'D="/local/${SLURM_JOB_ID}"\n',
        named: true,
        unread: []
    },
    {
        name: 'names it as /local/${SLURM_JOB_ID:-$$}',
        script: 'D="/local/${SLURM_JOB_ID:-$$}"\n',
        named: true,
        unread: []
    },
    {
        name: 'does not count a comment that names it',
        script: '# D=/local/$SLURM_JOB_ID\necho hello\n',
        named: false,
        unread: []
    },
    {
        name: 'does not count /local/$USER/x_$SLURM_JOB_ID',
        script: 'D=/local/$USER/x_$SLURM_JOB_ID\n',
        named: false,
        unread: []
    },
    {
        name: 'does not count /local/$SLURM_JOB_IDX',
        script: 'D=/local/$SLURM_JOB_IDX\n',
        named: false,
        unread: []
    },
    {
        name: 'follows a source of a relative path',
        script: 'source hpc/scratch.sh\n',
        files: { 'hpc/scratch.sh': NAMING },
        named: true,
        unread: []
    },
    {
        name: 'follows a source through the submit folder with a default',
        script: 'source "${SLURM_SUBMIT_DIR:-$HOME/projects/p}/hpc/scratch.sh"\n',
        files: { 'hpc/scratch.sh': NAMING },
        named: true,
        unread: []
    },
    {
        name: 'follows a source through the cluster folder written from the home folder',
        script: 'source ~/projects/p/hpc/scratch.sh\n',
        files: { 'hpc/scratch.sh': NAMING },
        named: true,
        unread: []
    },
    {
        name: 'ends when two files source each other',
        script: 'source hpc/one.sh\n',
        files: { 'hpc/one.sh': 'source hpc/a.slurm\n' },
        named: false,
        unread: []
    },
    {
        name: 'lists a source it cannot resolve and warns',
        script: 'source "$X/env.sh"\n',
        named: false,
        unread: ['"$X/env.sh"']
    },
    {
        name: 'lists a script that does not parse and warns',
        script: 'if then fi (\n',
        named: false,
        unread: ['hpc/a.slurm']
    }
];

describe('the scratch rule', () => {
    it.each(SCRATCH)('$name', async (row) => {
        const { deps, hub } = world({ 'hpc/a.slurm': row.script, ...row.files }, row.manifest);
        const plan = await planned(deps);
        expect(plan.scratch).toEqual({ named: row.named, unread: row.unread });
        expect(plan.source).toBe(`${realpathSync(hub)}/projects/p/code/`);
    });
});
