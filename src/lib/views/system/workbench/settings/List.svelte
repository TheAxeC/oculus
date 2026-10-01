<script lang="ts">
    // Layer 3, view partial. The list of the Settings view: a group per file with the control that
    // opens the file in a source tab, the tag the Config view puts on the machine's own file, a
    // heading per section, and one item per setting. A group whose file is being read, could not be
    // read, is cut or does not parse says so in one line and draws no setting. Each heading carries
    // the id the table of contents scrolls to.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { ENGINE_ROOT } from '$lib/state/sources/fs';
    import { sourceTabState } from '$lib/state/sessions/source.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { Group } from '$lib/state/system/config/groups';
    import type { RowWriter } from '$lib/state/system/config/write';
    import { useState } from '$lib/state/client/use';
    import Item from './Item.svelte';
    import { said } from './said';

    const {
        layout: { openView }
    } = useState();

    type Props = { groups: Group[]; id: string; writer: RowWriter };

    let { groups, id, writer }: Props = $props();
</script>

{#each groups as group (group.id)}
    <section class="group" data-settings-group={group.id} data-toc-target={group.id}>
        <div class="group-head">
            <h2 class="group-title">{group.title}</h2>
            {#if group.local}
                <Tag label={t('config.local_tag')} />
            {/if}
            {#if group.file !== null}
                {@const file = group.file}
                <ToolButton
                    label={t('views.open_source')}
                    glyph="edit"
                    title={t('views.open_source_tip', file)}
                    compact
                    onclick={() => openView('source', sourceTabState(ENGINE_ROOT, file))}
                />
            {/if}
        </div>
        {#if group.said !== null}
            <p class="note">{said(group.said)}</p>
        {/if}
        {#each group.sections as section (section.id)}
            <div class="section" data-toc-target={section.id}>
                {#if section.heading !== ''}
                    <h3 class="section-title">{section.heading}</h3>
                {/if}
                {#each section.rows as row (row.id)}
                    <Item {row} {id} {writer} />
                {/each}
            </div>
        {/each}
    </section>
{/each}

<style>
    .group {
        padding: 0 0 12px;
    }

    .group-head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px 4px;
    }

    .group-title {
        margin: 0;
        font-size: var(--fs-xl);
        font-weight: 600;
    }

    .section-title {
        margin: 8px 0 0;
        padding: 0 14px;
        font-size: var(--fs-md);
        font-weight: 600;
    }

    .note {
        margin: 4px 14px 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
