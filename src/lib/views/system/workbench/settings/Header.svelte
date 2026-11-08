<script lang="ts">
    // Layer 3, view partial. The head of the Settings view: the search box, the count of the
    // settings found on its right, the control that clears the search, and the filter menu, which
    // offers Modified by putting `@modified` in the query. Down in the search moves the focus to
    // the first setting listed; the wrapper catches the key, since the search box passes its own
    // keys on only for Escape and Enter. The search keeps at least 12em, and the count goes under
    // it when both do not fit on one line; the controls keep their size and go onto the next line
    // when they do not fit beside the search. Under 700 px the table of contents is not beside the
    // list, and the header offers the toggle that shows it over the list.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { plural, t } from '$lib/state/shared/words/text';
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
            : plural('workbench.settings_found', count, count)
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
    <div class="found">
        <div class="field">
            <Search
                value={query}
                placeholder={t('workbench.settings_search')}
                oninput={onquery}
                fill
            />
        </div>
        <span class="count" role="status">{found}</span>
    </div>
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
    /*
     * The controls beside the search keep their size; when the search's 12em and the controls do
     * not fit on one line, as in a narrow pane at a large text size, the controls after the search
     * go onto the next line rather than under the field.
     */
    .header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 3px 24px 0;
        margin-top: 11px;
    }

    .header > :global(:not(.found)) {
        flex: none;
    }

    /*
     * The search and its count share a line while both fit; in a narrower pane the count goes onto
     * its own line under the field, which never shrinks under 12em.
     */
    .found {
        display: flex;
        flex: 1 1 12em;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px 6px;
        min-width: 12em;
    }

    .field {
        display: flex;
        flex: 1 1 12em;
        min-width: 12em;
    }

    /* The control after the count clears the search, so the field's own cancel button is hidden. */
    .field :global(input::-webkit-search-cancel-button) {
        display: none;
    }

    .count {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
