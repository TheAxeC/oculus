<script lang="ts">
    // Layer 3, view. The project board: cards or a table, a search, quick filters, type toggles, a
    // facet menu per way the board can be split, and a short or full title. It is registered three
    // times, as `projects`, `archive` and `coauthor`, and reads which board it is from the instance
    // it was mounted as, so the three cockpit tabs that were one board over three tier sets are one
    // component here.
    //
    // It joins nothing and counts nothing itself: the projects come from the board selector already
    // joined, and the facets, the filters, the counts and the sentence cut are the pure functions of
    // state/board.ts. The strip is views/projects/Stats.svelte and the new-idea form
    // views/projects/NewIdea.svelte, which is the partials rule of DESIGN.md's boundary table: a
    // view too large for one file is split into its own folder. The card is
    // views/shared/ProjectCard.svelte, since views/Project.svelte draws the same one.

    import Empty from '$lib/ui/Empty.svelte';
    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Segment, { type SegmentItem } from '$lib/ui/Segment.svelte';
    import Table from '$lib/ui/Table.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import Card from './shared/ProjectCard.svelte';
    import NewIdea from './projects/NewIdea.svelte';
    import Stats from './projects/Stats.svelte';
    import {
        NONE,
        SESSIONS_LIVE,
        SESSIONS_RECENT,
        applyFilters,
        facets,
        firstSentence,
        parseBoardState,
        typeCounts,
        type BoardItem,
        type BoardState,
        type FacetValue
    } from '$lib/state/board';
    import { board, boardPreset, boardStats, staleLag } from '$lib/state/selectors.svelte';
    import { lookup, t } from '$lib/state/text';
    import { chipGlyph, toneOf } from '$lib/state/tones';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    /** How much of `next` a list row shows. */
    const ROW_NEXT = 110;

    /** The board the stats strip and the two quick filters belong to. */
    const STATS_BOARD = 'projects';

    const preset = $derived(boardPreset(instance.view));
    const held = $derived(parseBoardState(instanceState(instance.id), preset.labels));
    const items = $derived(board(preset));
    const groups = $derived(facets(items, preset));
    const types = $derived(typeCounts(items, preset.typeOrder));
    const lag = $derived(staleLag());
    const shown = $derived(
        applyFilters(items, held.filters, held.search, {
            stale: held.stale,
            dated: held.dated,
            hiddenTypes: held.hiddenTypes,
            staleLag: lag
        })
    );
    const rows = $derived(shown.map(row));
    const strip = $derived(boardStats(items));

    /** What the last write on this board answered, shown under the toolbar until the next one. */
    let said = $state('');

    /** True while the new-idea form is open under the toolbar. */
    let adding = $state(false);

    /**
     * Today, for the deadline badge. It is read when the board is opened and not again, so a page
     * left open across midnight counts the day it was opened on until it is reloaded.
     */
    const now = Date.now();

    const modes: SegmentItem[] = [
        { id: 'cards', label: t('board.view_cards'), glyph: t('board.view_cards_glyph') },
        { id: 'list', label: t('board.view_list'), glyph: t('board.view_list_glyph') }
    ];

    const labelModes: SegmentItem[] = [
        { id: 'short', label: t('helpers.short') },
        { id: 'full', label: t('helpers.full') }
    ];

    function write(next: Partial<BoardState>): void {
        setInstanceState(instance.id, { ...held, ...next });
    }

    /** Add or remove one value of one facet, which is what a click in a facet menu means. */
    function toggleFilter(facet: string, value: string): void {
        const selected = held.filters[facet] ?? [];
        const next = selected.includes(value)
            ? selected.filter((one) => one !== value)
            : [...selected, value];
        const filters = { ...held.filters };
        if (next.length === 0) delete filters[facet];
        else filters[facet] = next;
        write({ filters });
    }

    function toggleCard(id: string): void {
        const open = held.expanded.includes(id);
        write({
            expanded: open ? held.expanded.filter((one) => one !== id) : [...held.expanded, id]
        });
    }

    /** Every type is on until it is clicked off, so the state holds the ones that are off. */
    function toggleType(type: string): void {
        const off = held.hiddenTypes.includes(type);
        write({
            hiddenTypes: off
                ? held.hiddenTypes.filter((one) => one !== type)
                : [...held.hiddenTypes, type]
        });
    }

    /** Open or close every card of the board at once, which is what the two bulk controls do. */
    function bulk(expand: boolean): void {
        write({ expanded: expand ? shown.map((item) => item.id) : [] });
    }

    /** The board's own name, the key the registry names it by. */
    function title(): string {
        return lookup(`views.${preset.id}`);
    }

    /** A facet's heading. The keys are literal so tests/keys.test.ts can see every one of them. */
    function heading(facet: string): string {
        if (facet === 'category') return t('board.facet_category');
        if (facet === 'year') return t('board.facet_year');
        if (facet === 'domain') return t('board.facet_domain');
        if (facet === 'program') return t('board.facet_program');
        if (facet === 'funding') return t('board.facet_funding');
        if (facet === 'dataset') return t('board.facet_dataset');
        if (facet === 'status') return t('board.facet_status');
        if (facet === 'compute') return t('board.facet_compute');
        if (facet === 'reproduced') return t('board.facet_reproduced');
        if (facet === 'sessions') return t('board.facet_sessions');
        return t('board.facet_code');
    }

    /** The words of a facet value that is vocabulary rather than data. */
    function valueLabel(facet: string, value: FacetValue): string {
        if (facet === 'year' && value.value === NONE) return t('board.no_year');
        if (facet === 'funding' && value.value === NONE) return t('board.no_funding');
        if (facet === 'compute') return computeLabel(value.value);
        if (facet === 'code') return codeLabel(value.value);
        if (facet === 'reproduced') {
            return value.value === '1' ? t('board.repro_yes') : t('board.repro_no');
        }
        if (facet === 'sessions') return sessionsLabel(value.value);
        return value.label;
    }

    function sessionsLabel(value: string): string {
        if (value === SESSIONS_LIVE) return t('board.sessions_live');
        if (value === SESSIONS_RECENT) return t('board.sessions_recent');
        return t('board.sessions_none');
    }

    function computeLabel(value: string): string {
        if (value === 'hpc') return t('board.compute_hpc');
        if (value === 'local') return t('board.compute_local');
        return t('board.compute_none');
    }

    function codeLabel(value: string): string {
        if (value === 'deposited') return t('board.code_deposited');
        if (value === 'review-anon') return t('board.code_anon');
        if (value === 'none') return t('board.code_pending');
        return t('board.code_none');
    }

    /**
     * One facet's menu: every value with its count, and a mark on the ones in force. The category
     * facet carries its bucket's own hue as a dot, which is the one facet whose values the config
     * gives a colour to (`tab_rollup`), and no other facet is given one.
     */
    function menuItems(facet: string, values: FacetValue[]): MenuItem[] {
        const selected = held.filters[facet] ?? [];
        return values.map((value) => ({
            id: value.value,
            label: `${valueLabel(facet, value)} ${value.count}`,
            active: selected.includes(value.value),
            tone: facet === 'category' ? bucketTone(value.value) : undefined
        }));
    }

    /** The hue of one lifecycle bucket, through the palette, and nothing when it has none. */
    function bucketTone(id: string): string | undefined {
        const colour = preset.rollup.find((bucket) => bucket.id === id)?.color ?? '';
        return colour === '' ? undefined : toneOf(colour);
    }

    /** The label a card and a row carry: the short handle in short mode, else the full title. */
    function label(item: BoardItem): string {
        const short = item.project.short;
        if (held.labels === 'full' || short === undefined || short === '') {
            return item.project.title;
        }
        return short;
    }

    /** What the project's own tab is called in the strip: the short handle whenever there is one. */
    function tabLabel(item: BoardItem): string {
        const short = item.project.short;
        return short === undefined || short === '' ? item.project.title : short;
    }

    /** One row of the list mode. Every column key of both presets is filled here. */
    function row(item: BoardItem): Record<string, unknown> {
        const next = item.project.next;
        return {
            id: item.id,
            title: label(item),
            authors: item.authors,
            venue: item.venue?.short ?? '',
            status: item.chips.map((chip) => chipGlyph(chip)).join(''),
            focus: item.project.focus ?? '',
            next: next === undefined ? '' : firstSentence(next, ROW_NEXT),
            domain: item.domain?.label ?? '',
            program: item.programs.map((tag) => tag.label).join(' | '),
            funding: item.funding.map((tag) => tag.label).join(' | ')
        };
    }
</script>

{#snippet tools()}
    <Toolbar label={t('board.toolbar')}>
        <Search
            value={held.search}
            placeholder={preset.search === '' ? t('board.search_default') : preset.search}
            oninput={(value) => write({ search: value })}
        />
        <ToolButton
            label={t('board.new_idea')}
            title={t('board.new_idea_tip')}
            active={adding}
            onclick={() => (adding = !adding)}
        />
        {#if preset.id === STATS_BOARD}
            <ToolButton
                label={t('board.quick_stale')}
                title={t('board.quick_stale_tip')}
                glyph={t('board.stale_glyph')}
                active={held.stale}
                onclick={() => write({ stale: !held.stale })}
            />
            <ToolButton
                label={t('board.quick_deadline')}
                title={t('board.quick_deadline_tip')}
                glyph={t('cards.deadline_glyph')}
                active={held.dated}
                onclick={() => write({ dated: !held.dated })}
            />
        {/if}
        {#each types as one (one.type)}
            <ToolButton
                label={`${one.type} ${one.count}`}
                title={t('board.type_toggle_tip', one.type)}
                active={!held.hiddenTypes.includes(one.type)}
                onclick={() => toggleType(one.type)}
            />
        {/each}
        <Segment
            label={t('board.view')}
            items={modes}
            value={held.mode}
            onchange={(id) => write({ mode: id === 'list' ? 'list' : 'cards' })}
        />
        <Segment
            label={t('board.labels')}
            items={labelModes}
            value={held.labels}
            onchange={(id) => write({ labels: id === 'full' ? 'full' : 'short' })}
        />
        <ToolButton
            label={t('board.expand_all')}
            glyph={t('cards.expand_glyph')}
            onclick={() => bulk(true)}
        />
        <ToolButton
            label={t('board.collapse')}
            glyph={t('cards.collapse_glyph')}
            onclick={() => bulk(false)}
        />
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools}>
    <div class="board" data-instance={instance.id} data-board={preset.id}>
        <!-- The facets are a row of their own under the header, so the header keeps to one line
             and the title stays readable whatever the board's width. -->
        <div class="filters">
            {#each groups as group (group.key)}
                <Menu
                    label={t('board.filter_by', heading(group.key))}
                    items={menuItems(group.key, group.values)}
                    onpick={(value) => toggleFilter(group.key, value)}
                    placement="down"
                />
            {/each}
        </div>
        {#if adding}
            <NewIdea onclose={() => (adding = false)} onsaid={(answer) => (said = answer)} />
        {/if}
        {#if preset.id === STATS_BOARD}
            <Stats stats={strip} />
        {/if}
        {#if said !== ''}
            <p class="said">{said}</p>
        {/if}
        {#if shown.length === 0}
            <Empty message={t('board.empty')} glyph={t('board.empty_glyph')} />
        {:else if held.mode === 'list'}
            <Table columns={preset.columns} {rows} rowKey="id" sortable />
        {:else}
            <div class="cards">
                {#each shown as item (item.id)}
                    <Card
                        {item}
                        {now}
                        open={held.expanded.includes(item.id)}
                        label={label(item)}
                        tab={tabLabel(item)}
                        staleLag={lag}
                        ontoggle={() => toggleCard(item.id)}
                        onsaid={(answer) => (said = answer)}
                    />
                {/each}
            </div>
        {/if}
    </div>
</Pane>

<style>
    .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 10px;
        align-items: start;
    }

    .filters {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
    }

    .said {
        margin: 0 0 8px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    /* The terminal shape: the folder is the only monospace line in a card by default, so under the
       rice themes the whole card follows it rather than mixing two faces. */
    :global(body.rice) .board {
        font-family: var(--font-mono);
    }
</style>
