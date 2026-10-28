<script lang="ts">
    // Layer 3, view partial of Source.svelte. The Submit box of a .slurm tab: the one confirm
    // (ui/controls/confirm/Confirm.svelte) drawn while the Submit flow (submit-job.svelte.ts) holds
    // a box, with one button per cluster of `slurm.resource` between Cancel and Submit, each of
    // which picks its cluster and asks for that cluster's plan. Submit is off while no cluster is
    // picked, while the picked cluster's plan is read, and when that plan is refused. A yes closes
    // the box first and then runs the plan.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { SubmitJob } from './submit-job.svelte';

    let { submit }: { submit: SubmitJob } = $props();

    const box = $derived(submit.box);
</script>

{#if box !== null}
    <Confirm
        message={box.message}
        detail={box.detail}
        confirm={box.confirm}
        cancel={t('ui.confirm_cancel')}
        others={box.clusters.map((one) =>
            one.resource === box.picked ? t('source.submit_picked', one.name) : one.name
        )}
        onother={(index: number) => void submit.pick(box.clusters[index].resource)}
        refused={box.off}
        onconfirm={() => submit.confirm()}
        oncancel={() => submit.release()}
    />
{/if}
