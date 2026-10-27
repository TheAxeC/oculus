<script lang="ts">
    // Layer 3, shared view partial of the project boards (views/boards/projects/Projects.svelte),
    // the collection views (views/boards/collection/Collection.svelte) and the Map
    // (views/structure/map/Map.svelte). Line 1 of their bar: the search; the caller's toggles
    // (`toggles`: a board's stale, deadline and waiting toggles, the Map's Show button and nothing
    // on a collection); Mine only, drawn while a person is marked as the user (`named`) and drawn
    // disabled, its tip saying every project here is the user's, where it would change nothing
    // (`mine`); then one group button per group `line` names, in that order, each reading its picks
    // ("Form: journal article +1") and opening its values (PickMenu.svelte); then More, which holds
    // the groups `line` does not name as headed sections. A group button carries the red badge and
    // the amber mark the caller gives it by its id (`badges`: a board's Situation and Venue). A
    // caller's `section` names a run of the groups More holds, which More lists last under one
    // heading over their own (a collection's Projects section).
    //
    // The line is one line at any pane width: the group buttons that do not fit beside the
    // controls before them go into More, last in, first out, the search keeping `SEARCH_MIN`;
    // More then holds their sections first, and carries the badge and the mark of a group it
    // holds. The folding is ui/frame/toolbar/FoldRun.svelte's, which line 2 (SliceLine.svelte)
    // folds by too; a render with no layout draws every group button.
    //
    // It holds no state of its caller and works nothing out: the search, the groups and the counts
    // are the caller's, computed by pure functions of state/boards/, and every press is handed back
    // through `onsearch`, `onmine` or `ontoggle`, which write the caller's instance state.

    import type { Snippet } from 'svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import Search from '$lib/ui/controls/text/Search.svelte';
    import FoldRun from '$lib/ui/frame/toolbar/FoldRun.svelte';
    import PickMenu from './PickMenu.svelte';
    import { groupWords, moreWords, type FilterGroup } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';

    /** The red badge and the amber mark of one group button, each the empty string for none. */
    type Badge = { badge?: string; warning?: string };

    type Props = {
        /** The line's accessible name, already translated. */
        label: string;
        /** What is typed in the search box, and its placeholder, already translated. */
        search: string;
        placeholder: string;
        onsearch: (value: string) => void;
        /** The caller's toggles, drawn after the search and never folded. */
        toggles?: Snippet;
        /** Whether a person is marked as the user, which draws Mine only. */
        named: boolean;
        /** Whether Mine only changes what is shown, which is where it is pressable and applied. */
        mine: boolean;
        /** Whether Mine only is on. */
        pressed: boolean;
        onmine: () => void;
        /** Every group of the bar, one per facet with its counts. */
        groups: FilterGroup[];
        /** The ids of the groups line 1 draws as buttons, in their order. */
        line: readonly string[];
        /** The badge and the mark of a group button, by its group's id. */
        badges?: Partial<Record<string, Badge>>;
        /** Adds or takes out one value of one group, as a pick in a group's list does. */
        ontoggle: (group: string, value: string) => void;
        /** One heading More draws over the groups `ids` names, which it lists last. */
        section?: { heading: string; ids: readonly string[] };
    };

    let {
        label,
        search,
        placeholder,
        onsearch,
        toggles: callerToggles,
        named,
        mine,
        pressed,
        onmine,
        groups,
        line: lineIds,
        badges = {},
        ontoggle,
        section
    }: Props = $props();

    /** The narrowest the search box is drawn while group buttons are folded into More. */
    const SEARCH_MIN = 120;

    /** How wide More is taken to be before it is first drawn. */
    const MORE_GUESS = 64;

    const lineGroups = $derived(lineIds.flatMap((id) => groups.find((one) => one.id === id) ?? []));
    const ownGroups = $derived(groups.filter((one) => !lineIds.includes(one.id)));

    /** How many group buttons line 1 draws, and null while it draws all of them. */
    let shown: number | null = $state(null);

    let line = $state<HTMLElement | null>(null);
    let toggles = $state<HTMLElement | null>(null);
    let moreBox = $state<HTMLElement | null>(null);
    /** The width More was last drawn at. */
    let moreWidth = MORE_GUESS;

    const folded = $derived(shown === null ? [] : lineGroups.slice(shown));
    /** Whether a group is of the section's run, which More lists after the rest. */
    const inSection = (group: FilterGroup): boolean => section?.ids.includes(group.id) ?? false;
    const moreGroups = $derived([
        ...folded,
        ...ownGroups.filter((group) => !inSection(group)),
        ...ownGroups.filter(inSection)
    ]);

    /** The first badge, or the first mark, of the folded groups that carry one, for More. */
    function foldedMark(kind: keyof Badge): string {
        return folded.map((one) => badges[one.id]?.[kind] ?? '').find((one) => one !== '') ?? '';
    }

    /**
     * The room the group buttons have: the line less the search at its narrowest, the toggles and,
     * where More holds groups of its own, More, each with a gap before the next; More is the
     * opener only while it holds nothing else.
     */
    function room(gap: number): { room: number; opener: number } | null {
        if (line === null || toggles === null) return null;
        if (moreBox !== null) moreWidth = moreBox.getBoundingClientRect().width;
        const always = ownGroups.length > 0;
        return {
            room:
                line.getBoundingClientRect().width -
                SEARCH_MIN -
                toggles.getBoundingClientRect().width -
                gap * (always ? 3 : 2) -
                (always ? moreWidth : 0),
            opener: always ? 0 : moreWidth
        };
    }
</script>

{#snippet button(group: FilterGroup)}
    <PickMenu
        label={groupWords(group)}
        groups={[group]}
        onpick={ontoggle}
        badge={badges[group.id]?.badge ?? ''}
        warning={badges[group.id]?.warning ?? ''}
    />
{/snippet}

<div class="line" role="toolbar" aria-label={label} bind:this={line}>
    <span class="search">
        <Search fill value={search} {placeholder} oninput={onsearch} />
    </span>
    <span class="toggles" bind:this={toggles}>
        {@render callerToggles?.()}
        {#if named}
            <Chip
                label={t('roles.mine')}
                title={mine ? t('roles.mine_tip') : t('board.mine_all')}
                {pressed}
                disabled={!mine}
                onclick={onmine}
            />
        {/if}
    </span>
    <FoldRun
        items={lineGroups}
        key={(group: FilterGroup) => group.id}
        item={button}
        box={line}
        {room}
        bind:shown
    />
    {#if moreGroups.length > 0}
        <span class="more" bind:this={moreBox}>
            <PickMenu
                label={moreWords(moreGroups)}
                groups={moreGroups}
                headed
                {section}
                onpick={ontoggle}
                badge={foldedMark('badge')}
                warning={foldedMark('warning')}
            />
        </span>
    {/if}
</div>

<style>
    /* One line that never wraps: the search takes what the controls leave, down to its minimum,
       and the group buttons past the line's room are folded into More. Until the first measure
       the line clips what passes its width rather than scrolling the bar sideways. */
    .line {
        display: flex;
        flex: 1 0 100%;
        align-items: center;
        gap: 6px;
        min-width: 0;
        overflow: hidden;
    }

    .search {
        display: flex;
        flex: 1 1 0;
        min-width: 120px;
    }

    .toggles {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 6px;
    }

    .more {
        display: inline-flex;
        flex: none;
    }
</style>
