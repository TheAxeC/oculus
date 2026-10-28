// Layer 3, view partial of Source.svelte. Submit on a .slurm tab: the press that saves the unsaved
// text, asks the server which clusters the script may go to, and opens the Submit box
// (SubmitBox.svelte): a pick of the clusters of `slurm.resource`, the plan of the picked one put to
// the reader as one confirm, and on a yes the plan sent back to run. The cluster the project's
// `compute:` names, when it names exactly one of them, is picked at the start and its plan asked
// for at once; with none picked the box says so and its Submit stays off until the reader picks
// one. The plan names the code folder and where it is copied to on the picked cluster, how many
// files and their total size, the exact command run there and that the job then shows in Live
// HPC; a script that never names the cluster's scratch folder gets the warning first and its yes
// reads "Submit Anyway". A refusal and the outcome are said under the editor, through `said`; a
// refusal of the picked cluster's plan is said in the box, so another cluster can be picked.
//
// One flow runs at a time: the press does nothing while one is planning or running, and the control
// waits meanwhile (drawn disabled and kept focusable, ToolButton's `waiting`), so the keyboard is
// on it again when the box closes or a refusal is said. The flow says which of the two runs, as
// the words the control's turning glyph carries: "Preparing the job..." from the press to the box
// or the refusal, and "Copying the code and submitting the job..." from the yes to the outcome. A
// plan asked for a pick that another pick has replaced is dropped. The server computes the plan
// again at the press of the yes and refuses a plan that differs, so the page never decides what
// runs.

import { humanSize } from '$lib/state/boards/board/stats';
import { t } from '$lib/state/shared/words/text';
import type { HpcStore } from '$lib/state/system/machine/hpc/hpc.svelte';
import {
    refusalSentence,
    type SubmitCluster,
    type SubmitPlan
} from '$lib/state/system/machine/hpc/submit';
import { servedFile } from '$lib/views/shared/links/file-bar';
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
    hpc: Pick<HpcStore, 'submitChoices' | 'planSubmit' | 'submitJob'>;
    openView: (id: string) => void;
};

/** The Submit box as the flow holds it. */
type SubmitBox = {
    clusters: SubmitCluster[];
    /** The key of the cluster picked, or null while none is. */
    picked: string | null;
    /** The question the box asks: the pick, or the plan of the picked cluster. */
    message: string;
    /** The plan's detail, a refusal of the picked cluster's plan, or the empty string. */
    detail: string;
    /** The words of the yes. */
    confirm: string;
    /** Whether the yes is off: no cluster picked, its plan not yet read, or its plan refused. */
    off: boolean;
};

/** The flow of one tab. */
export type SubmitJob = {
    /**
     * What runs now, as the words the control says while it waits: the planning of a press, or
     * the run after a yes; the empty string while nothing runs.
     */
    readonly running: string;
    /** The Submit box held, or null while none is. */
    readonly box: SubmitBox | null;
    /** Whether the tab is a .slurm job script on disk under a served root, which Submit acts on. */
    readonly submittable: boolean;
    press: () => Promise<void>;
    /** Pick the cluster `resource` in the box, which asks for its plan. */
    pick: (resource: string) => Promise<void>;
    /** The yes of the box: run the plan of the picked cluster. */
    confirm: () => void;
    /** Let the box go, which a yes and a cancel both do. */
    release: () => void;
};

/** Whether a path names a Slurm job script, by its extension in any letter case. */
function isJobScript(path: string): boolean {
    return path.toLowerCase().endsWith('.slurm');
}

/** The question and the detail of a plan: the warning first when the scratch folder is unnamed. */
function planWords(plan: SubmitPlan, cluster: string): Omit<SubmitBox, 'clusters' | 'picked'> {
    const warned = !plan.scratch.named;
    const unread = plan.scratch.unread.join(', ');
    const message = [
        warned ? t('source.submit_warning') : '',
        warned && unread !== '' ? t('source.submit_unread', unread) : '',
        t('source.submit_ask', plan.project, cluster, plan.path)
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
        confirm: warned ? t('source.submit_confirm_anyway') : t('source.submit_confirm'),
        off: false
    };
}

/** Create the flow of one tab. */
export function createSubmitJob(deps: SubmitJobDeps): SubmitJob {
    let running = $state('');
    let box: SubmitBox | null = $state(null);
    /** The box as it stands now, read afresh after a wait, since Cancel may have closed it. */
    const current = (): SubmitBox | null => box;
    /** The plan of the picked cluster, which the yes runs. */
    let plan: SubmitPlan | null = null;
    /** Counts the picks, so a plan asked for an earlier pick is dropped. */
    let picks = 0;

    /** The yes: send the plan back, say what happened, and show the job in Live HPC. */
    async function run(confirmed: SubmitPlan): Promise<void> {
        running = t('source.submit_running');
        deps.said(running, 'status');
        try {
            const done = await deps.hpc.submitJob(confirmed);
            if ('refused' in done) {
                deps.said(refusalSentence(done.refused), 'refusal');
                return;
            }
            deps.said(t('source.submit_done', done.job), 'status');
            deps.openView('hpc');
        } finally {
            running = '';
        }
    }

    /** The name of a cluster of the box, its key when the box does not hold it. */
    function nameOf(resource: string): string {
        return box?.clusters.find((one) => one.resource === resource)?.name ?? resource;
    }

    async function pick(resource: string): Promise<void> {
        if (box === null) return;
        picks += 1;
        const asked = picks;
        plan = null;
        box = {
            ...box,
            picked: resource,
            message: t('source.submit_planning_on', nameOf(resource)),
            detail: '',
            confirm: t('source.submit_confirm'),
            off: true
        };
        const planned = await deps.hpc.planSubmit(deps.root(), deps.path(), resource);
        const open = current();
        if (open === null || asked !== picks) return;
        if ('refused' in planned) {
            box = {
                ...open,
                message: t('source.submit_refused_on', nameOf(resource)),
                detail: refusalSentence(planned.refused)
            };
            return;
        }
        plan = planned.plan;
        box = { ...open, ...planWords(planned.plan, nameOf(resource)) };
    }

    async function press(): Promise<void> {
        if (running !== '') return;
        running = t('source.submit_planning');
        try {
            if (deps.unsaved()) {
                await deps.save();
                if (deps.unsaved()) return;
            }
            deps.said('', 'status');
            const choices = await deps.hpc.submitChoices(deps.root(), deps.path());
            if ('refused' in choices) {
                deps.said(refusalSentence(choices.refused), 'refusal');
                return;
            }
            if (choices.clusters.length === 0) {
                deps.said(t('source.submit_no_clusters'), 'refusal');
                return;
            }
            plan = null;
            box = {
                clusters: choices.clusters,
                picked: null,
                message: t('source.submit_pick', deps.path()),
                detail: '',
                confirm: t('source.submit_confirm'),
                off: true
            };
            if (choices.picked !== null) await pick(choices.picked);
        } finally {
            running = '';
        }
    }

    return {
        get running() {
            return running;
        },
        get box() {
            return box;
        },
        get submittable() {
            return (
                isJobScript(deps.path()) &&
                servedFile(deps.roots(), deps.root(), deps.path(), deps.onDisk())
            );
        },
        press,
        pick,
        confirm: () => {
            const held = plan;
            box = null;
            plan = null;
            if (held !== null) void run(held);
        },
        release: () => {
            box = null;
            plan = null;
            picks += 1;
        }
    };
}
