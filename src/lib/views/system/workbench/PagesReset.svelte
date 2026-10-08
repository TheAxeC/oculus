<script lang="ts">
    // Layer 3, view partial. Reset all pages, as the `arrangements` row of the Settings view
    // (settings/Item.svelte) offers it, with no heading of its own: every saved page a rail button
    // carries the key of is made again from that button's arrangement, and every saved page of a
    // button the rail no longer has is removed, and the floats held are replaced by the ones the
    // config ships, after a confirm naming each page it rebuilds and each it removes, and then the
    // question closing each of the tabs of those pages and floats holding unsaved text asks, one at
    // a time; a no to any leaves every page as it was. A page of the reader's own, which no button
    // made, is left alone. What the reset does is the layout store's resetPages over
    // state/workbench/navigation/pages.ts's plan, so the confirm names the pages the store then
    // acts on.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import CloseQuestion from '$lib/ui/controls/CloseQuestion.svelte';
    import { parseFloats } from '$lib/state/workbench/navigation/arrangement';
    import { railPages } from '$lib/state/workbench/navigation/rail';
    import {
        floatHosts,
        questionFor,
        instancesOfPages,
        resetAfterAsking,
        resetAsk,
        resetPlan,
        tabNameOf,
        type Question
    } from '$lib/state/workbench/navigation/pages';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        entities: { config },
        layout: { floats, pages, resetPages },
        registry: { viewFor },
        ui: { unsaved, busyTerminals, saveBeforeClose }
    } = useState();

    const rail = $derived(railPages(config()?.config));
    const plan = $derived(resetPlan(pages(), rail));
    const shipped = $derived(parseFloats(config()?.config.floats));
    const nothing = $derived(
        plan.rebuilt.length === 0 &&
            plan.removed.length === 0 &&
            floats().length === 0 &&
            shipped.length === 0
    );

    /** The question the reset is waiting on, or null while none is. */
    let question: Question | null = $state(null);
    const asker = questionFor((held) => (question = held));

    /** Ask before every rail page is reset, and then about each tab holding unsaved text. */
    function ask(): void {
        const all = pages();
        const words = resetAsk(all, plan.rebuilt, plan.removed, undefined, true);
        const rebuilt = plan.rebuilt;
        const removed = plan.removed;
        const replaced = floatHosts(floats());
        void resetAfterAsking(
            all,
            words,
            [...rebuilt, ...removed, ...replaced],
            unsaved,
            saveBeforeClose,
            (instance) => tabNameOf(instance, viewFor),
            asker,
            () => {
                resetPages(rail, shipped);
            },
            () => busyTerminals(instancesOfPages([...rebuilt, ...removed, ...replaced]))
        );
    }
</script>

<div class="reset" data-settings="reset">
    <div class="actions">
        <ToolButton
            label={t('workbench.reset_all')}
            title={t('workbench.reset_all_tip')}
            glyph="refresh"
            disabled={nothing}
            onclick={ask}
        />
    </div>
    {#if nothing}
        <p class="empty">{t('workbench.reset_all_none')}</p>
    {/if}
</div>

<CloseQuestion
    message={question?.message ?? null}
    detail={question?.detail}
    onconfirm={() => question?.answer(true)}
    oncancel={() => question?.answer(false)}
/>

<style>
    .reset {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .empty {
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }
</style>
