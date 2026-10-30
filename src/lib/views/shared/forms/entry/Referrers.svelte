<script lang="ts">
    // Layer 3, shared view partial. What refers to a record, each as a link that opens it: the
    // projects whose manifest names a pillar, a domain, a venue, a dataset, a funding scheme or a
    // resource, the people and funding schemes that name an organisation, the projects that name a
    // person, and the setting that names a resource. The page of such a record draws it below the
    // card, and the question that asks before the record is deleted names the same things
    // (state/forms/referrers.ts is the one answer to what they are). The list is the group every
    // grouping of a view is drawn as (ui/controls/heads/GroupHead.svelte), folded under the key
    // `referrers` in the tab's state (views/shared/card/pane-fold.ts), its body read off a
    // `Surface` over a wallpaper.

    import Empty from '$lib/ui/frame/Empty.svelte';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { pageView } from '$lib/state/forms/page-entry';
    import type { Referrer } from '$lib/state/forms/referrers';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { recordState } from '$lib/state/shared/page/records';
    import { addressOfId } from '$lib/state/shared/page/hubs';
    import { usePaneFold } from '../../card/pane-fold';

    const {
        layout: { openView },
        selectors: { registryKey }
    } = useState();

    let { referrers }: { referrers: Referrer[] } = $props();

    /** Whether the list is open, kept in the tab's state. */
    const fold = usePaneFold();

    /** Open a referrer as the tab its kind has; a setting is a name and opens nothing. */
    function open(one: Referrer): void {
        if (one.kind === 'project') openView('project', recordState(one.id, one.label));
        else if (one.kind === 'person') openView('person', recordState(one.id, one.label));
        else if (one.kind === 'funding') {
            const page = pageView(
                registryKey('funding', addressOfId(one.id).hub),
                one.id,
                one.label
            );
            openView(page.view, page.state);
        }
    }
</script>

<GroupHead
    data-block="referrers"
    label={t('entry_form.referrers')}
    open={fold.open('referrers')}
    ontoggle={() => fold.toggle('referrers')}
>
    <Surface>
        {#if referrers.length === 0}
            <Empty message={t('entry_form.no_referrers')} />
        {:else}
            <ul class="rows">
                {#each referrers as one (`${one.kind}:${one.id}`)}
                    <li>
                        {#if one.kind === 'setting'}
                            <span class="what">{t('entry_form.referrer_setting', one.label)}</span>
                        {:else}
                            <span class="link">
                                <ToolButton
                                    plain
                                    cut
                                    label={one.label}
                                    title={t('entry_form.referrer_open', one.label)}
                                    onclick={() => open(one)}
                                />
                            </span>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </Surface>
</GroupHead>

<style>
    .rows {
        display: flex;
        flex-direction: column;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .rows li {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    .what {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .link {
        display: inline-flex;
        min-width: 0;
        color: var(--accent-txt, var(--accent));
    }

    .link:hover,
    .link:focus-within {
        text-decoration: underline;
    }
</style>
