<script module lang="ts">
    // Layer 3, view registration. Recover opens from a dataset card and is not listed in the view
    // catalogue.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'recover',
        label: 'views.recover',
        glyph: 'views.recover_glyph',
        group: '',
        order: 0,
        listed: false
    };
</script>

<script lang="ts">
    // Layer 3, view. Recover of one dataset, by the hub and the key its instance state carries, on
    // the target the tab holds (this Mac or the cluster): the dataset's folder there with the free
    // space of its disk, the access of each credentialed service with the setup steps of one that
    // is missing, the actions, the progress, the plan of every file the sources list, and the log.
    //
    // The run belongs to the server: closing the view leaves it going, and the view opened again
    // shows where it is. The view asks the route when it opens, after a press and on the refresh
    // control; while a run goes it follows the run by the server's pushes (the `recover` channel):
    // the run's state, the bytes each file grew to, the rates and the log. An action is a POST
    // with the write token, answered with the run started or the reason it was refused, which is
    // worded here from the catalog. Fetch waits for access: it is disabled while a service the
    // sources need has no row the service accepts.
    import { untrack } from 'svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Segment from '$lib/ui/controls/segment/Segment.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RecoverAccess from './RecoverAccess.svelte';
    import RecoverLog from './RecoverLog.svelte';
    import RecoverPlan from './RecoverPlan.svelte';
    import RecoverProgress from './RecoverProgress.svelte';
    import {
        grownState,
        listingWords,
        NO_RATES,
        refusalWords,
        sizeWords,
        type Rates,
        type RecoverState
    } from '$lib/state/system/machine/recover-words';
    import type { RecoverAction, RecoverTarget } from '$lib/state/system/machine/recover.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { instanceChoice, instanceText } from '$lib/state/workbench/layout/instance';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        recover: { dataset, reload, act, pushed },
        ui: { instanceState, setInstanceState }
    } = useState();

    let { instance }: ViewProps = $props();

    const TARGETS: RecoverTarget[] = ['mac', 'cluster'];

    const key = $derived(instanceText(instance.state, 'id'));
    const hub = $derived(instanceText(instance.state, 'hub'));
    const target = $derived(
        instanceChoice(instanceState(instance.id), 'target', TARGETS) as RecoverTarget
    );
    const held = $derived(dataset(hub, key, target));
    // Named `now` rather than `state`: a variable called `state` in a component is read as the
    // store prefix of `$state`, which svelte-check refuses.
    const now = $derived(held.state);
    /** The server's newest reading of the run, when it came after the answer. */
    const live = $derived(now === null ? null : pushed(hub, key, target, now.live));
    const run = $derived(live === null ? (now?.run ?? null) : live.run);
    const running = $derived(run !== null);

    /** The bytes each file grew to by the readings after the answer, by name. */
    let grown: Record<string, number> = $state({});
    /** The answer `grown` counts from; a new answer starts it again. */
    let grownFrom: RecoverState | null = null;

    $effect(() => {
        const answer = now;
        const reading = live;
        untrack(() => {
            const base = answer === grownFrom ? grown : {};
            grownFrom = answer;
            const next = Object.fromEntries(
                (reading?.growing ?? []).map((one) => [one.name, one.have])
            );
            grown = { ...base, ...next };
        });
    });

    const rows = $derived(
        (now?.plan?.rows ?? []).map((row) => {
            const have = grown[row.name] as number | undefined;
            return have === undefined ? row : { ...row, have, state: grownState(row, have) };
        })
    );
    /** Bytes free on the target's disk, or null when the plan could not read them. */
    const free = $derived(now?.plan?.totals.free ?? null);
    /** The rates of the newest reading of a run that goes, which the plan and the progress draw. */
    const rates: Rates = $derived(
        live?.state === 'running'
            ? {
                  files: new Map(live.growing.map((one) => [one.name, one.rate])),
                  total: live.rate ?? 0
              }
            : NO_RATES
    );

    /** The last thing an action answered, shown under the controls. */
    let outcome = $state('');
    /** Set while an action is in flight, so a second press cannot send a second one. */
    let busy = $state(false);

    const segments = $derived([
        { id: 'mac', label: t('recover.target_mac') },
        { id: 'cluster', label: t('recover.target_cluster') }
    ]);

    /** Why an action that starts a run cannot be pressed now, or the empty text when it can. */
    const why = $derived(
        busy ? t('recover.why_busy') : running ? t('recover.refused_running') : ''
    );
    const toFetch = $derived(
        rows.some(
            (row) => row.state === 'missing' || row.state === 'partial' || row.state === 'different'
        )
    );
    /** Why the Fetch of one file of the plan cannot be pressed now. */
    const whyOne = $derived(
        why !== '' ? why : now?.granted === false ? t('recover.refused_access') : ''
    );
    /** Why the Fetch of every file a Fetch takes cannot be pressed now. */
    const whyFetch = $derived(whyOne !== '' ? whyOne : toFetch ? '' : t('recover.refused_nothing'));

    function chooseTarget(next: string): void {
        setInstanceState(instance.id, { target: next });
    }

    async function press(action: RecoverAction, file?: string): Promise<void> {
        if (busy) return;
        busy = true;
        outcome = '';
        const answer = await act(hub, key, target, action, file);
        busy = false;
        if (answer.ok) outcome = '';
        else outcome = answer.refused === '' ? answer.error : refusalWords(answer.refused);
    }
</script>

{#snippet actions()}
    <div class="acts">
        <ToolButton
            label={t('recover.fetch')}
            title={whyFetch === '' ? t('recover.fetch_title') : whyFetch}
            disabled={whyFetch !== ''}
            onclick={() => void press('fetch')}
        />
        <ToolButton
            label={t('recover.verify')}
            title={why === '' ? t('recover.verify_title') : why}
            disabled={why !== ''}
            onclick={() => void press('verify')}
        />
        <ToolButton
            label={t('recover.unpack')}
            title={why === '' ? t('recover.unpack_title') : why}
            disabled={why !== ''}
            onclick={() => void press('unpack')}
        />
        <ToolButton
            label={t('recover.stop')}
            title={running ? t('recover.stop_title') : t('recover.stop_none')}
            disabled={busy || !running}
            onclick={() => void press('stop')}
        />
        <ToolButton
            label={t('recover.relist')}
            title={t('recover.relist_title')}
            disabled={busy}
            onclick={() => reload(hub, key, target, true)}
        />
    </div>
    {#if outcome !== ''}
        <p class="outcome">{outcome}</p>
    {/if}
{/snippet}

<Pane title={key === '' ? t('views.recover') : t('recover.title', key)} tinted>
    <div class="recover" data-instance={instance.id}>
        {#if key === '' || hub === ''}
            <Empty message={t('recover.none')} />
        {:else}
            <div class="line">
                <Segment
                    items={segments}
                    value={target}
                    label={t('recover.target')}
                    onchange={chooseTarget}
                />
                {#if now !== null}
                    <span class="folder">{now.folder}</span>
                    <span class="free">
                        {free === null
                            ? t('recover.free_unknown')
                            : t('recover.free', sizeWords(free))}
                    </span>
                {/if}
            </div>
            {#if held.error !== '' || held.refused === 'unreachable'}
                <Empty error message={held.error !== '' ? held.error : refusalWords(held.refused)}>
                    {#snippet action()}
                        <ToolButton
                            small
                            label={t('recover.retry')}
                            onclick={() => reload(hub, key, target)}
                        />
                    {/snippet}
                </Empty>
            {:else if held.refused !== ''}
                <Empty message={refusalWords(held.refused, held.hint)} />
            {:else if now === null && held.loading}
                <Empty message={t('recover.loading', key)} />
            {:else if now !== null}
                {#if now.access.length > 0}
                    <RecoverAccess access={now.access} />
                {/if}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render actions()}
                {#if now.refusal !== null}
                    <p class="warn">{listingWords(now.refusal)}</p>
                {/if}
                {#if now.plan !== null}
                    <RecoverProgress {rows} {run} {rates} bytes={live?.bytes ?? null} />
                    <RecoverPlan
                        {rows}
                        totals={now.plan.totals}
                        {rates}
                        why={whyOne}
                        onfetch={(name: string) => void press('fetch', name)}
                    />
                {/if}
                <RecoverLog lines={live?.log ?? now.log} />
            {/if}
        {/if}
    </div>
</Pane>

<style>
    .recover {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
    }

    .line,
    .acts {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .folder {
        color: var(--ink-txt);
        font-family: var(--font-mono);
    }

    .free {
        color: var(--muted-txt);
        font-size: var(--fs-sm);
    }

    .outcome,
    .warn {
        font-size: var(--fs-md);
        margin: 0;
    }

    .outcome {
        color: var(--ink-txt);
    }

    .warn {
        color: var(--c-amber-txt);
    }
</style>
