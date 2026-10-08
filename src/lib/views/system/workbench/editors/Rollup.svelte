<script lang="ts">
    // Layer 3, view partial. The draft of a map of lists of records, which is the board tabs'
    // roll-up buckets: one group per key, each with its key field, the controls that move it and
    // take it away, and the list of its records (Cards.svelte); and Add a key at the end. The key
    // is drawn by the control of the catalog's `key` field.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { Draft, Edit } from '$lib/state/system/config/editors/draft';
    import {
        textOf,
        type CatalogEntry,
        type FieldSpec,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import Cards from './Cards.svelte';
    import FieldControl from './FieldControl.svelte';

    type Props = {
        draft: Extract<Draft, { form: 'rollup' }>;
        /** The specs of the fields of a record, without the key. */
        specs: Record<string, FieldSpec>;
        /** The spec of the key of a group: a choice of the names the catalog lists, else a text. */
        keySpec: CatalogEntry;
        lists: Lists;
        /** The instance the cards are drawn in, and the file and key of the setting. */
        instance: string;
        base: string;
        onedit: (edit: Edit) => void;
    };

    let { draft, specs, keySpec, lists, instance, base, onedit }: Props = $props();
</script>

<div class="groups">
    {#each draft.groups as group, at (at)}
        <section class="group" data-group={at}>
            <div class="head">
                <FieldControl
                    spec={keySpec}
                    value={group.key}
                    label={t('settings.editor_group_key', at + 1)}
                    {lists}
                    ontext={(key: string) => onedit({ do: 'setGroup', group: at, key })}
                    onpick={(key: FieldValue | undefined) =>
                        onedit({ do: 'setGroup', group: at, key: textOf(key) })}
                />
                <ToolButton
                    label={t('settings.editor_group_up', at + 1)}
                    glyph="collapse"
                    compact
                    disabled={at === 0}
                    onclick={() => onedit({ do: 'moveGroup', group: at, by: -1 })}
                />
                <ToolButton
                    label={t('settings.editor_group_down', at + 1)}
                    glyph="expand"
                    compact
                    disabled={at === draft.groups.length - 1}
                    onclick={() => onedit({ do: 'moveGroup', group: at, by: 1 })}
                />
                <ToolButton
                    label={t('settings.editor_remove_group', at + 1)}
                    glyph="trash"
                    compact
                    onclick={() => onedit({ do: 'removeGroup', group: at })}
                />
            </div>
            <Cards
                cards={group.cards}
                fields={draft.fields}
                {specs}
                form="rollup"
                {lists}
                {instance}
                {base}
                group={at}
                {onedit}
            />
        </section>
    {/each}
    <ToolButton
        label={t('settings.editor_add_group')}
        glyph="add"
        onclick={() => onedit({ do: 'addGroup' })}
    />
</div>

<style>
    .groups {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
        max-width: 720px;
    }

    .head {
        display: flex;
        align-items: center;
        gap: 6px;
    }
</style>
