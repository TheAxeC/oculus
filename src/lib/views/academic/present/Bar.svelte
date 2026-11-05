<script lang="ts">
    // Layer 3, Present partial. The toolbar of the Present pane: the deck menu, the two step
    // buttons, the overview, full-screen and presenter controls, the Export to PDF button, while a
    // filter is in force the line that says how many of the deck's decks it keeps and Clear, the
    // status line of the last act on a slide or on the deck's arrangement, and the place in the
    // deck. Under it, for a deck whose groups hold project decks, the filter's line: one group
    // button per group that has a value (views/shared/forms/bar/FilterBar.svelte), with no search
    // and no Mine only; a deck with no such group draws no line and keeps no room for one. It
    // holds no state of its own; Present.svelte owns the deck and the position, and
    // acts/filter.svelte.ts the filter, and each action is handed in.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import FilterBar from '$lib/views/shared/forms/bar/FilterBar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { DeckChoice } from '$lib/state/life/present';
    import type { FilterLine } from './acts/filter.svelte';

    type Props = {
        choices: DeckChoice[];
        /** The menu id of the deck on screen. */
        chosen: string;
        onchoose: (id: string) => void;
        /** How many slides the deck holds, and the 1-based place of the one shown (0 for none). */
        count: number;
        at: number;
        overview: boolean;
        full: boolean;
        /** Whether the pane shows the presenter screen. */
        presenting: boolean;
        onstep: (by: number) => void;
        onoverview: () => void;
        onpresent: () => void;
        onpresenter: () => void;
        onexport: () => void;
        /** What the last act on a slide or on the deck's arrangement came to, empty for none. */
        said: string;
        /** The pane's filter, null for a deck with no group of project decks. */
        filter: FilterLine | null;
    };

    let {
        choices,
        chosen,
        onchoose,
        count,
        at,
        overview,
        full,
        presenting,
        onstep,
        onoverview,
        onpresent,
        onpresenter,
        onexport,
        said,
        filter
    }: Props = $props();
</script>

<Toolbar label={t('present.toolbar')}>
    <Select value={chosen} label={t('present.deck_menu')} {choices} onchange={onchoose} />
    <ToolButton label={t('present.previous')} onclick={() => onstep(-1)} disabled={count === 0} />
    <ToolButton label={t('present.next')} onclick={() => onstep(1)} disabled={count === 0} />
    <Chip
        label={t('present.overview')}
        glyph={t('present.overview_glyph')}
        pressed={overview}
        onclick={onoverview}
    />
    <ToolButton
        label={t('present.present')}
        title={t('present.present_tip')}
        pressed={full}
        active={full}
        onclick={onpresent}
        disabled={count === 0}
    />
    <ToolButton
        label={t('present.presenter')}
        title={t('present.presenter_tip')}
        pressed={presenting}
        active={presenting}
        onclick={onpresenter}
        disabled={count === 0}
    />
    <ToolButton
        label={t('present.export')}
        title={t('present.export_tip')}
        onclick={onexport}
        disabled={count === 0}
    />
    {#if filter !== null && filter.said !== ''}
        <span class="filtered">{filter.said}</span>
        <ToolButton
            label={t('present.filter_clear')}
            title={t('present.filter_clear_tip')}
            onclick={filter.onclear}
        />
    {/if}
    <span class="said" role="status">{said}</span>
    <span class="counter">{t('present.counter', String(at), String(count))}</span>
</Toolbar>
{#if filter !== null}
    <FilterBar
        label={t('present.filter')}
        groups={filter.groups}
        line={filter.line}
        ontoggle={filter.ontoggle}
    />
{/if}

<style>
    /* The filter's line reads as the status line does, beside the control that clears it. */
    .filtered {
        flex: none;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
        white-space: nowrap;
    }

    /* The status line takes the room between the controls and the place in the deck. */
    .said {
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* The place in the deck closes the bar. */
    .counter {
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
    }
</style>
