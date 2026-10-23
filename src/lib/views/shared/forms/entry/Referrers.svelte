<script lang="ts">
    // Layer 3, shared view partial. What refers to a record, each as a link that opens it: the
    // projects whose manifest names a pillar, a domain, a venue, a dataset, a funding scheme or a
    // resource, the people and funding schemes that name an organisation, the projects and joint
    // work that name a person, and the setting that names a resource. The page of such a record
    // draws it below the editor, and the question that asks before the record is deleted names the
    // same things (state/forms/referrers.ts is the one answer to what they are).

    import Empty from '$lib/ui/frame/Empty.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { pageView } from '$lib/state/forms/page-entry';
    import type { Referrer } from '$lib/state/forms/referrers';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { recordState } from '$lib/state/shared/page/records';

    const {
        layout: { openView }
    } = useState();

    let { referrers }: { referrers: Referrer[] } = $props();

    /** Open a referrer as the tab its kind has; a setting is a name and opens nothing. */
    function open(one: Referrer): void {
        if (one.kind === 'project') openView('project', recordState(one.id, one.label));
        else if (one.kind === 'person') openView('person', recordState(one.id, one.label));
        else if (one.kind === 'funding') openPage('funding', one);
        else if (one.collection !== undefined) openPage(one.collection, one);
    }

    function openPage(collection: string, one: Referrer): void {
        const page = pageView(collection, one.id, one.label);
        openView(page.view, page.state);
    }
</script>

<section class="block" data-block="referrers">
    <h3>{t('entry_form.referrers')}</h3>
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
</section>

<style>
    .block h3 {
        margin: 0 0 4px;
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

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
