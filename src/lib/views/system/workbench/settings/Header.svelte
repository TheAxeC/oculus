<script lang="ts">
    // Layer 3, view partial. The head of the Settings view: the search box, the count of the
    // settings found on its right, the control that clears the search, and the filter menu, which
    // offers Modified by putting `@modified` in the query. Down in the search moves the focus to
    // the first setting listed; the wrapper catches the key, since the search box passes its own
    // keys on only for Escape and Enter. Under 700 px the table of contents is not beside the list,
    // and the header offers the toggle that shows it over the list.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { hasModifiedFilter, withModifiedFilter } from '$lib/state/system/config/search';

    type Props = {
        query: string;
        /** How many settings the query keeps. */
        count: number;
        onquery: (query: string) => void;
        /** Down was pressed in the search. */
        ondown: () => void;
        /** Whether the toggle of the table of contents is offered. */
        toggle: boolean;
        /** Whether the table of contents is shown over the list. */
        showing: boolean;
        ontoggle: () => void;
    };

    let { query, count, onquery, ondown, toggle, showing, ontoggle }: Props = $props();

    const modified = $derived(hasModifiedFilter(query));

    /** The count worded: one setting found, none, or N. */
    const found = $derived(
        count === 0
            ? t('workbench.settings_found_none')
            : count === 1
              ? t('workbench.settings_found_one')
              : t('workbench.settings_found', count)
    );

    function down(event: KeyboardEvent): void {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        ondown();
    }
</script>

<div class="header" role="presentation" onkeydown={down}>
    {#if toggle}
        <ToolButton
            label={showing ? t('settings.contents_hide') : t('settings.contents_show')}
            glyph="view_tree"
            compact
            bare
            pressed={showing}
            expanded={showing}
            onclick={ontoggle}
        />
    {/if}
    <div class="field">
        <Search value={query} placeholder={t('workbench.settings_search')} oninput={onquery} fill />
    </div>
    <span class="count" role="status">{found}</span>
    {#if query !== ''}
        <ToolButton
            label={t('workbench.settings_clear')}
            glyph="dismiss"
            compact
            bare
            onclick={() => onquery('')}
        />
    {/if}
    <Menu
        label={t('workbench.settings_filter')}
        glyph="sliders"
        compact
        bare
        placement="down"
        align="right"
        items={[
            { id: 'modified', label: t('workbench.settings_filter_modified'), active: modified }
        ]}
        onpick={() => onquery(withModifiedFilter(query, !modified))}
    />
</div>

<style>
    .header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 3px 24px 0;
        margin-top: 11px;
    }

    .field {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
    }

    .count {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
