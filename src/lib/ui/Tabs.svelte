<script module lang="ts">
    /** One tab: what it is called, what it is drawn with, and the id the callbacks name it by. */
    export type Tab = {
        id: string;
        label: string;
        /** A glyph name, or nothing for a tab that is drawn with its label alone. */
        glyph?: string;
    };
</script>

<script lang="ts">
    // Layer 3, primitive. A strip of tabs over one pane. It knows nothing about views, instances or
    // the layout tree: the caller passes labels and ids and is called back with an id, which is why
    // the same strip serves a pane of views and anything else with tabs.
    //
    // A tab is a button and its close control is a second button beside it, since a button inside a
    // button is not valid HTML. The pair sits in a presentation wrapper so the tab list still has
    // its tabs as its only meaningful children.

    import Glyph from './Glyph.svelte';
    import { t } from '$lib/state/text';

    type Props = {
        tabs: Tab[];
        /** The id of the tab that is showing. */
        active: string;
        onselect: (id: string) => void;
        onclose: (id: string) => void;
    };

    let { tabs, active, onselect, onclose }: Props = $props();
</script>

<div class="tabs" role="tablist">
    {#each tabs as tab (tab.id)}
        <div class="tab" class:current={tab.id === active} role="presentation">
            <button
                type="button"
                class="face"
                role="tab"
                aria-selected={tab.id === active}
                onclick={() => onselect(tab.id)}
            >
                {#if tab.glyph !== undefined}
                    <Glyph name={tab.glyph} />
                {/if}
                <span class="label">{tab.label}</span>
            </button>
            <button
                type="button"
                class="close"
                title={t('ui.close_tab')}
                aria-label={t('ui.close_tab')}
                onclick={() => onclose(tab.id)}
            >
                <Glyph name={t('ui.close_glyph')} />
            </button>
        </div>
    {/each}
</div>

<style>
    .tabs {
        display: flex;
        align-items: stretch;
        gap: 2px;
        overflow-x: auto;
        background: var(--bg);
        border-bottom: 1px solid var(--line);
    }

    .tab {
        display: flex;
        align-items: center;
        border: 1px solid transparent;
        border-bottom: none;
        border-radius: var(--radius) var(--radius) 0 0;
        white-space: nowrap;
    }

    .tab.current {
        background: var(--panel);
        border-color: var(--line);
    }

    .face,
    .close {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-md);
        padding: 4px 6px;
        cursor: pointer;
    }

    .tab.current .face {
        color: var(--ink-txt, var(--ink));
    }

    .face:hover,
    .close:hover {
        color: var(--accent-txt, var(--accent));
    }

    .face:focus-visible,
    .close:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
</style>
