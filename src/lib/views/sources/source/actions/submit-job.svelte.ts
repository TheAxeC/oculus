// Layer 3, view partial of Source.svelte. Submit on a .slurm tab: the press that saves the unsaved
// text, asks the server for the plan, puts the plan to the reader as one confirm, and on a yes
// sends the plan back to run. The confirm names the code folder and where it is copied to, how many
// files and their total size, the exact command run on the cluster and that the job then shows in
// Live HPC; a script that never names the cluster's scratch folder gets the warning first and its
// yes reads "Submit Anyway". A refusal and the outcome are said under the editor, through `said`.
//
// One flow runs at a time: the press does nothing while one is planning or running, and the
// control is drawn disabled meanwhile. The confirm is an Ask drawn by views/shared/writes/
// AskConfirm.svelte in the tab. The server computes the plan again at the press of the yes and
// refuses a plan that differs, so the page never decides what runs.

import { humanSize } from '$lib/state/boards/board/stats';
import { t } from '$lib/state/shared/words/text';
import type { HpcStore } from '$lib/state/system/machine/hpc/hpc.svelte';
import { refusalSentence, type SubmitPlan } from '$lib/state/system/machine/hpc/submit';
import { servedFile } from '$lib/views/shared/links/file-bar';
import type { Ask } from '$lib/views/shared/writes/ask';
import type { SaidTone } from '../save/said-tone';

/** What the flow reads of the tab and calls on it. */
export type SubmitJobDeps = {
    root: () => string;
    path: () => string;
    /** The served roots, and whether the tab's file is on disk, which say where Submit applies. */
    roots: () => readonly { key: string }[];
    onDisk: () => boolean;
    /** Whether the tab holds text the file on disk does not. */
    unsaved: () => boolean;
    /** The tab's Save, which leaves the text unsaved when it is refused. */
    save: () => Promise<void>;
    /** Show a sentence under the editor, as a refusal or as a status. */
    said: (words: string, tone: SaidTone) => void;
    hpc: Pick<HpcStore, 'planSubmit' | 'submitJob'>;
    openView: (id: string) => void;
};

/** The flow of one tab. */
export type SubmitJob = {
    /** Whether a press is planning or running, which disables the control. */
    readonly busy: boolean;
    /** The confirm held, or null while none is. */
    readonly asking: Ask | null;
    /** Whether the tab is a .slurm job script on disk under a served root, which Submit acts on. */
    readonly submittable: boolean;
    press: () => Promise<void>;
    /** Let the confirm go, which a yes and a cancel both do. */
    release: () => void;
};

/** Whether a path names a Slurm job script, by its extension in any letter case. */
function isJobScript(path: string): boolean {
    return path.toLowerCase().endsWith('.slurm');
}

/** The confirm for a plan: the warning first when the scratch folder is never named. */
function confirmFor(plan: SubmitPlan, run: () => void): Ask {
    const warned = !plan.scratch.named;
    const unread = plan.scratch.unread.join(', ');
    const message = [
        warned ? t('source.submit_warning') : '',
        warned && unread !== '' ? t('source.submit_unread', unread) : '',
        t('source.submit_ask', plan.project, plan.host, plan.path)
    ]
        .filter((part) => part !== '')
        .join(' ');
    const size = humanSize(plan.bytes);
    const detail = [
        t('source.submit_detail_copy', plan.source, plan.target, plan.rsync.join(' ')),
        plan.files === 1
            ? t('source.submit_detail_file_one', size)
            : t('source.submit_detail_files', plan.files, size),
        t('source.submit_detail_remote', plan.host, plan.remote),
        t('source.submit_detail_view')
    ].join('\n');
    return {
        message,
        detail,
        act: run,
        confirm: warned ? t('source.submit_confirm_anyway') : t('source.submit_confirm')
    };
}

/** Create the flow of one tab. */
export function createSubmitJob(deps: SubmitJobDeps): SubmitJob {
    let busy = $state(false);
    let asking: Ask | null = $state(null);

    /** The yes: send the plan back, say what happened, and show the job in Live HPC. */
    async function run(plan: SubmitPlan): Promise<void> {
        busy = true;
        deps.said(t('source.submit_running'), 'status');
        try {
            const done = await deps.hpc.submitJob(plan);
            if ('refused' in done) {
                deps.said(refusalSentence(done.refused), 'refusal');
                return;
            }
            deps.said(t('source.submit_done', done.job), 'status');
            deps.openView('hpc');
        } finally {
            busy = false;
        }
    }

    async function press(): Promise<void> {
        if (busy) return;
        busy = true;
        try {
            if (deps.unsaved()) {
                await deps.save();
                if (deps.unsaved()) return;
            }
            deps.said('', 'status');
            const planned = await deps.hpc.planSubmit(deps.root(), deps.path());
            if ('refused' in planned) {
                deps.said(refusalSentence(planned.refused), 'refusal');
                return;
            }
            asking = confirmFor(planned.plan, () => void run(planned.plan));
        } finally {
            busy = false;
        }
    }

    return {
        get busy() {
            return busy;
        },
        get asking() {
            return asking;
        },
        get submittable() {
            return (
                isJobScript(deps.path()) &&
                servedFile(deps.roots(), deps.root(), deps.path(), deps.onDisk())
            );
        },
        press,
        release: () => (asking = null)
    };
}
