<script lang="ts">
    // Layer 3, view partial of Source.svelte. The Submit box of a .slurm tab: the one confirm
    // (ui/controls/confirm/Confirm.svelte) drawn while the Submit flow (submit-job.svelte.ts) holds
    // a box, with the clusters of `slurm.resource` as the confirm's pick, one select
    // (ui/forms/choice/Select.svelte) above Cancel and Submit, whose change picks a cluster and
    // asks for that cluster's plan. While no cluster is picked the select holds an empty choice and
    // shows it, so no cluster reads as chosen; once one is, the empty choice is gone, so the select
    // always shows the cluster the box asks about. Submit is off while no cluster is picked, while
    // the picked cluster's plan is read, and when that plan is refused. A box that opens with no
    // cluster picked puts the keyboard on the select; one that opens with a cluster picked puts it
    // where Confirm does, on Cancel while that cluster's plan is read. A yes closes the box first
    // and then runs the plan.

    import Confirm from '$lib/ui/controls/confirm/Confirm.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { SubmitJob } from './submit-job.svelte';

    let { submit }: { submit: SubmitJob } = $props();

    const box = $derived(submit.box);

    /** Pick the cluster the select changed to; the empty choice picks nothing. */
    function picked(resource: string): void {
        if (resource !== '') void submit.pick(resource);
    }
</script>

{#if box !== null}
    <Confirm
        message={box.message}
        detail={box.detail}
        confirm={box.confirm}
        cancel={t('ui.confirm_cancel')}
        refused={box.off}
        focus={box.picked === null ? 'pick' : 'confirm'}
        onconfirm={() => submit.confirm()}
        oncancel={() => submit.release()}
    >
        {#snippet pick()}
            <Select
                label={t('source.submit_cluster')}
                value={box.picked ?? ''}
                choices={box.clusters.map((one) => ({ id: one.resource, label: one.name }))}
                empty={box.picked === null ? '' : undefined}
                onchange={picked}
            />
        {/snippet}
    </Confirm>
{/if}
