// Layer 2, client state. What the page reads of Submit's two answers (api/hpc `plan` and `submit`):
// the plan of what the job script would copy and run, the job id, or the refusal with its word. A
// word the page does not know reads as `failed`, so a word only the server has says that Submit
// failed. Each refusal's sentence is a catalog key read here as a literal.
import { z } from 'zod';
import type { SubmitPlan } from '../../../data/model/index.ts';
import { readAs } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';

export type { SubmitPlan };

/** A refusal: the word the page knows it by and the line the server carried, or none. */
export type SubmitRefusal = { reason: string; detail: string };

/** What a plan request comes to, and what a submit request comes to. */
export type PlanResult = { plan: SubmitPlan } | { refused: SubmitRefusal };
export type JobResult = { job: string } | { refused: SubmitRefusal };

const planShape: z.ZodType<SubmitPlan> = z.object({
    root: z.string(),
    path: z.string(),
    project: z.string(),
    host: z.string(),
    source: z.string(),
    target: z.string(),
    files: z.number(),
    bytes: z.number(),
    digest: z.string(),
    rsync: z.array(z.string()),
    remote: z.string(),
    scratch: z.object({ named: z.boolean(), unread: z.array(z.string()) })
});

const refusedShape = z.object({
    status: z.literal('refused'),
    reason: z.string(),
    detail: z.string().optional()
});

const planAnswerShape = z.object({ status: z.literal('ok'), plan: planShape });
const jobAnswerShape = z.object({ status: z.literal('ok'), job: z.string() });

/** The sentence of each refusal the page knows, with the server's line where it has one. */
const SENTENCES: Record<string, (detail: string) => string> = {
    outside: () => t('source.submit_outside'),
    closed: () => t('source.submit_failed'),
    'not-slurm': () => t('source.submit_not_slurm'),
    'no-project': () => t('source.submit_no_project'),
    'outside-code': () => t('source.submit_outside_code'),
    'bad-cluster': (detail) => t('source.submit_bad_cluster', detail),
    'no-host': (detail) => t('source.submit_no_host', detail),
    'no-files': (detail) => t('source.submit_no_files', detail),
    'not-sent': () => t('source.submit_not_sent'),
    unconfirmed: () => t('source.submit_unconfirmed'),
    changed: () => t('source.submit_changed'),
    busy: () => t('source.submit_busy'),
    'copy-failed': (detail) => t('source.submit_copy_failed', detail),
    'submit-failed': (detail) => t('source.submit_submit_failed', detail),
    'no-job-id': (detail) => t('source.submit_no_job_id', detail)
};

/** The refusal of an answer, or the refusal for an answer that is none of the shapes. */
function refusalOf(answer: unknown): { refused: SubmitRefusal } {
    const refused = readAs(refusedShape, answer);
    if (refused === null || !Object.hasOwn(SENTENCES, refused.reason)) {
        return { refused: { reason: 'failed', detail: refused?.detail ?? '' } };
    }
    return { refused: { reason: refused.reason, detail: refused.detail ?? '' } };
}

/** The plan an answer carries, or its refusal. */
export function planOf(answer: unknown): PlanResult {
    const plan = readAs(planAnswerShape, answer);
    return plan === null ? refusalOf(answer) : { plan: plan.plan };
}

/** The job an answer carries, or its refusal. */
export function jobOf(answer: unknown): JobResult {
    const job = readAs(jobAnswerShape, answer);
    return job === null ? refusalOf(answer) : { job: job.job };
}

/** The sentence a refusal is said as under the editor. */
export function refusalSentence(refusal: SubmitRefusal): string {
    const render = Object.hasOwn(SENTENCES, refusal.reason) ? SENTENCES[refusal.reason] : null;
    return render === null ? t('source.submit_failed') : render(refusal.detail);
}
