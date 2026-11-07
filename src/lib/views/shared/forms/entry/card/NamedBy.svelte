<script lang="ts">
    // Layer 3, view partial of EntryCard.svelte. The records other than projects that name an
    // entry, drawn on the entry's page as one line of tags under a small label
    // (views/shared/card/record/RecordField.svelte): the people affiliated to an organisation, the
    // funding schemes it funds, and the `slurm.resource` setting where it lists a resource
    // (state/forms/referrers.ts `referrersOf`, the projects among them being counted in the row
    // under the card). Each tag is a plain press in the box PressBox.svelte draws: a person opens
    // their page, a funding scheme its entry's page, and the setting opens Settings at its row
    // (`reveal`, views/system/workbench/reveal.svelte.ts). A funding scheme with no key has no page
    // and is drawn as its words.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import PressBox from '../../../card/project/PressBox.svelte';
    import RecordField from '../../../card/record/RecordField.svelte';
    import { pageView } from '$lib/state/forms/page-entry';
    import type { Referrer } from '$lib/state/forms/referrers';
    import { hubRowId, revealState } from '$lib/state/system/config/typed';
    import { SETTINGS_VIEW } from '$lib/state/workbench/navigation/rail';
    import { addressOfId } from '$lib/state/shared/page/hubs';
    import { recordState } from '$lib/state/shared/page/records';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView },
        pages: { pageOf },
        selectors: { registryKey }
    } = useState();

    let { named }: { named: Referrer[] } = $props();

    /** The words of a tag: a setting's are the words naming it as a setting. */
    function words(one: Referrer): string {
        return one.kind === 'setting' ? t('entry_form.referrer_setting', one.label) : one.label;
    }

    /** The key of the funding registry of the scheme's hub. */
    function fundingKey(one: Referrer): string {
        return registryKey('funding', addressOfId(one.id).hub);
    }

    /**
     * Whether a tag opens nothing: a funding scheme with no key, held under its title, and a
     * setting Settings has no row for.
     */
    function inert(one: Referrer): boolean {
        if (one.kind === 'setting') return hubRowId(one.id) === undefined;
        if (one.kind !== 'funding') return false;
        return pageOf(fundingKey(one), one.id) === null;
    }

    /** Open what a tag names, as the tab its kind has. */
    function open(one: Referrer): void {
        if (one.kind === 'person') openView('person', recordState(one.id, one.label));
        else if (one.kind === 'funding') {
            const page = pageView(fundingKey(one), one.id, one.label);
            openView(page.view, page.state);
        } else if (one.kind === 'setting') {
            const row = hubRowId(one.id);
            if (row !== undefined) openView(SETTINGS_VIEW, revealState(row));
        }
    }
</script>

{#if named.length > 0}
    <RecordField data-block="named-by" label={t('entry_form.named_by')}>
        <div class="tags">
            {#each named as one (`${one.kind}:${one.id}`)}
                {#if inert(one)}
                    <Tag label={words(one)} />
                {:else}
                    <PressBox>
                        <ToolButton plain label={words(one)} onclick={() => open(one)}>
                            <Tag label={words(one)} />
                        </ToolButton>
                    </PressBox>
                {/if}
            {/each}
        </div>
    </RecordField>
{/if}

<style>
    .tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }
</style>
