<script lang="ts">
    // Layer 3, Present partial. The toolbar of the Present pane: the deck menu, the two step
    // buttons, the overview control, the full-screen and presenter controls, the Export to PDF
    // button, the Project facts toggle while the slide on screen comes from a project's deck, drawn
    // last of the buttons so none of them moves when it comes and goes, the status line of the last
    // act on a slide or on the deck's arrangement, and the place in the deck, drawn only once the
    // deck has loaded ("0 / 0" for a loaded deck of no slide). Under it, for a deck whose groups
    // hold project decks, the Projects board's bar over the projects whose decks those groups hold
    // (views/shared/forms/bar/BoardBar.svelte): the search, the stale, deadline and waiting
    // toggles, Mine only, the groups and More, then the slices, the shown count and Clear all; a
    // deck with no such group draws no bar and keeps no room for one. It holds no state of its own;
    // Present.svelte owns the deck and the position, and acts/filter.svelte.ts the filter, and each
    // action is handed in.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import BoardBar from '$lib/views/shared/forms/bar/BoardBar.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { DeckChoice } from '$lib/state/life/present';
    import type { PaneBar } from './acts/filter.svelte';

    type Props = {
        choices: DeckChoice[];
        /** The menu id of the deck on screen. */
        chosen: string;
        onchoose: (id: string) => void;
        /**
         * How many slides the deck holds, null while it loads or after it failed to load, when no
         * place in the deck is drawn; and the 1-based place of the one shown (0 for none).
         */
        count: number | null;
        at: number;
        overview: boolean;
        /**
         * The pane's Project facts toggle, null while the slide on screen carries no project, when
         * the toggle is not drawn.
         */
        facts: boolean | null;
        onfacts: () => void;
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
        filter: PaneBar | null;
    };

    let {
        choices,
        chosen,
        onchoose,
        count,
        at,
        overview,
        facts,
        onfacts,
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

    /** Whether no slide can be moved to, shown or exported: the deck loads, failed or is empty. */
    const slideless = $derived(count === null || count === 0);
</script>

<Toolbar label={t('present.toolbar')}>
    <Select value={chosen} label={t('present.deck_menu')} {choices} onchange={onchoose} />
    <ToolButton label={t('present.previous')} onclick={() => onstep(-1)} disabled={slideless} />
    <ToolButton label={t('present.next')} onclick={() => onstep(1)} disabled={slideless} />
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
        disabled={slideless}
    />
    <ToolButton
        label={t('present.presenter')}
        title={t('present.presenter_tip')}
        pressed={presenting}
        active={presenting}
        onclick={onpresenter}
        disabled={slideless}
    />
    <ToolButton
        label={t('present.export')}
        title={t('present.export_tip')}
        onclick={onexport}
        disabled={slideless}
    />
    {#if facts !== null}
        <Chip
            label={t('present.facts')}
            title={t('present.facts_tip')}
            pressed={facts}
            onclick={onfacts}
        />
    {/if}
    <span class="said" role="status">{said}</span>
    {#if count !== null}
        <span class="counter">{t('present.counter', String(at), String(count))}</span>
    {/if}
</Toolbar>
{#if filter !== null}
    <BoardBar
        filter={filter.filter}
        stats={filter.stats}
        placeholder={filter.placeholder}
        write={filter.write}
    />
{/if}

<style>
    /* The status line takes the room between the controls and the place in the deck. A line that
       does not fit there goes to its own row of the toolbar, whole, and is cut with an ellipsis
       only where it is wider than the pane. */
    .said {
        flex: 1 1 auto;
        max-width: 100%;
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
