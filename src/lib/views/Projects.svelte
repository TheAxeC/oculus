<script lang="ts">
    // Layer 3, view. The project board: cards or a table, a search, a facet menu per way the board
    // can be split, and a short or full title. It is registered three times, as `projects`,
    // `archive` and `coauthor`, and reads which board it is from the instance it was mounted as, so
    // the three cockpit tabs that were one board over three tier sets are one component here.
    //
    // It joins nothing and counts nothing itself: the projects come from the board selector already
    // joined, and the facets, the filters and the sentence cut are the pure functions of
    // state/board.ts. What is left in this file is the markup and the words, and the words are keys.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Search from '$lib/ui/Search.svelte';
    import Segment, { type SegmentItem } from '$lib/ui/Segment.svelte';
    import Table from '$lib/ui/Table.svelte';
    import Toolbar from '$lib/ui/Toolbar.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import {
        DEADLINE_SOON,
        NONE,
        applyFilters,
        daysUntil,
        facets,
        firstSentence,
        parseBoardState,
        type BoardItem,
        type BoardState,
        type FacetValue
    } from '$lib/state/board';
    import { board, boardPreset } from '$lib/state/selectors.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { lookup, t } from '$lib/state/text';
    import { chipGlyph, chipLabel, statusTone } from '$lib/state/tones';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    /** How much of `next` a card shows, and how much a list row does. */
    const CARD_NEXT = 130;
    const ROW_NEXT = 110;

    const preset = $derived(boardPreset(instance.view));
    const state = $derived(parseBoardState(instanceState(instance.id), preset.labels));
    const items = $derived(board(preset));
    const groups = $derived(facets(items, preset));
    const shown = $derived(applyFilters(items, state.filters, state.search));
    const rows = $derived(shown.map(row));

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
        setInstanceState(instance.id, { ...state, ...next });
    }

    /** Add or remove one value of one facet, which is what a click in a facet menu means. */
    function toggleFilter(facet: string, value: string): void {
        const selected = state.filters[facet] ?? [];
        const next = selected.includes(value)
            ? selected.filter((held) => held !== value)
            : [...selected, value];
        const filters = { ...state.filters };
        if (next.length === 0) delete filters[facet];
        else filters[facet] = next;
        write({ filters });
    }

    function toggleCard(id: string): void {
        const open = state.expanded.includes(id);
        write({
            expanded: open ? state.expanded.filter((held) => held !== id) : [...state.expanded, id]
        });
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
        return value.label;
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

    /** One facet's menu: every value with its count, and a mark on the ones in force. */
    function menuItems(facet: string, values: FacetValue[]): MenuItem[] {
        const selected = state.filters[facet] ?? [];
        return values.map((value) => ({
            id: value.value,
            label: `${valueLabel(facet, value)} ${value.count}`,
            active: selected.includes(value.value)
        }));
    }

    /** The label a card and a row carry: the short handle in short mode, else the full title. */
    function label(item: BoardItem): string {
        const short = item.project.short;
        if (state.labels === 'full' || short === undefined || short === '') {
            return item.project.title;
        }
        return short;
    }

    /** What the project's own tab is called in the strip: the short handle whenever there is one. */
    function tabLabel(item: BoardItem): string {
        const short = item.project.short;
        return short === undefined || short === '' ? item.project.title : short;
    }

    /** The deadline badge: the date once submitted, how overdue it is, or how long is left. */
    function deadline(item: BoardItem): { label: string; tone?: string } | null {
        const date = item.project.deadline;
        if (date === undefined || date === '') return null;
        const days = daysUntil(date, now);
        if (days === null || item.chips.includes('submitted')) return { label: date };
        if (days < 0) return { label: t('cards.overdue', -days), tone: 'red' };
        if (days <= DEADLINE_SOON) return { label: t('cards.due_days', days), tone: 'amber' };
        return { label: date };
    }

    /** Whether a card has a tag row at all: four lists, and a card with none skips the row. */
    function tagged(item: BoardItem): boolean {
        return (
            item.funding.length +
                item.programs.length +
                item.datasets.length +
                item.collaborators.length >
            0
        );
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

{#snippet tags(item: BoardItem)}
    <div class="tags">
        {#each item.funding as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.funding_glyph')} />
        {/each}
        {#each item.programs as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.program_glyph')} />
        {/each}
        {#each item.datasets as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.dataset_glyph')} />
        {/each}
        {#each item.collaborators as tag (tag.id)}
            <Chip label={tag.label} glyph={t('cards.collaborator_glyph')} />
        {/each}
    </div>
{/snippet}

{#snippet field(name: string, value: string)}
    <div class="field">
        <span class="label">{name}</span>
        <p class="value">{value}</p>
    </div>
{/snippet}

{#snippet listField(name: string, values: string[])}
    <div class="field">
        <span class="label">{name}</span>
        <ul class="value">
            {#each values as value, at (`${at}:${value}`)}
                <li>{value}</li>
            {/each}
        </ul>
    </div>
{/snippet}

{#snippet more(item: BoardItem)}
    <div class="more">
        {#if item.project.statusLine}
            <p class="statusline">{item.project.statusLine}</p>
        {/if}
        {#if item.project.latest}
            {@render field(t('cards.latest'), item.project.latest)}
        {/if}
        {#if item.project.results.length > 0}
            {@render listField(t('cards.results'), item.project.results)}
        {/if}
        {#if item.project.outcome}
            {@render field(t('cards.outcome'), item.project.outcome)}
        {/if}
        {#if item.project.next}
            {@render field(t('cards.next'), item.project.next)}
        {/if}
        {#if item.project.ideas.length > 0}
            {@render listField(t('cards.ideas'), item.project.ideas)}
        {/if}
        {#if item.project.reproduced}
            {@render field(
                t('cards.reproduced'),
                [item.project.reproduced.date, item.project.reproduced.note]
                    .filter((part) => part !== undefined && part !== '')
                    .join(' | ')
            )}
        {/if}
        {#if item.project.docs.length > 0}
            <div class="field">
                <span class="label">{t('cards.documents')}</span>
                <div class="docs">
                    {#each item.project.docs as doc (doc.name)}
                        <Chip label={doc.name} tone={doc.present ? 'green' : undefined} />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet cardFor(item: BoardItem)}
    {@const open = state.expanded.includes(item.id)}
    {@const due = deadline(item)}
    {@const short = label(item) !== item.project.title}
    <div class="slot" title={short ? item.project.title : undefined}>
        <Card
            title={label(item)}
            tone={item.tone}
            pinned={item.project.pin === true}
            ontitle={() => openView('project', 'main', { id: item.id, label: tabLabel(item) })}
        >
            {#snippet meta()}
                {#if item.project.type}
                    <Chip label={item.project.type} tone={item.tone} filled />
                {/if}
                {#if item.domain}
                    <Chip label={item.domain.label} tone={item.domain.tone} />
                {/if}
                {#if due}
                    <Chip label={due.label} tone={due.tone} glyph={t('cards.deadline_glyph')} />
                {/if}
                {#if item.project.pin === true}
                    <Chip label={t('cards.pinned')} glyph={t('cards.pin_glyph')} />
                {/if}
                <ToolButton
                    label={t('cards.toggle_tip')}
                    glyph={open ? t('cards.collapse_glyph') : t('cards.expand_glyph')}
                    active={open}
                    onclick={() => toggleCard(item.id)}
                />
                <ToolButton
                    label={t('cards.edit_manifest')}
                    glyph={t('cards.edit_glyph')}
                    onclick={() => openView('editor', 'panel', { id: item.id })}
                />
            {/snippet}

            <div class="folder">{item.project.folder}</div>
            <div class="row">
                {#if item.project.focus}
                    <Chip label={item.project.focus} />
                {/if}
                {#each item.chips as chip (chip)}
                    <Chip label={chipLabel(chip)} icon={chipGlyph(chip)} tone={statusTone(chip)} />
                {/each}
                {#if item.code !== ''}
                    <Chip label={codeLabel(item.code)} glyph={t('cards.code_glyph')} />
                {/if}
                {#if item.reproduced}
                    <Chip label={t('board.repro_yes')} glyph={t('cards.repro_glyph')} />
                {/if}
                {#if item.compute === 'hpc'}
                    <Chip label={t('cards.hpc_label')} glyph={t('cards.hpc_glyph')} />
                {:else if item.compute === 'local'}
                    <Chip label={t('cards.local_label')} />
                {/if}
                {#if item.venue}
                    <span class="venue">{item.venue.text}</span>
                {/if}
                {#if item.authors !== ''}
                    <span class="authors">
                        <Glyph name={t('cards.author_glyph')} />
                        {item.authors}
                    </span>
                {/if}
            </div>
            {#if tagged(item)}
                {@render tags(item)}
            {/if}
            {#if item.project.eli5}
                <div class="eli5">
                    <span class="label">{t('cards.eli5')}</span>
                    <p>{item.project.eli5}</p>
                </div>
            {/if}
            {#if item.project.next}
                <p class="next">{firstSentence(item.project.next, CARD_NEXT)}</p>
            {/if}
            {#if open}
                {@render more(item)}
            {/if}
        </Card>
    </div>
{/snippet}

{#snippet tools()}
    <Toolbar label={t('board.toolbar')}>
        <Search
            value={state.search}
            placeholder={preset.search === '' ? t('board.search_default') : preset.search}
            oninput={(value) => write({ search: value })}
        />
        <Segment
            label={t('board.view')}
            items={modes}
            value={state.mode}
            onchange={(id) => write({ mode: id === 'list' ? 'list' : 'cards' })}
        />
        <Segment
            label={t('board.labels')}
            items={labelModes}
            value={state.labels}
            onchange={(id) => write({ labels: id === 'full' ? 'full' : 'short' })}
        />
        {#each groups as group (group.key)}
            <Menu
                label={t('board.filter_by', heading(group.key))}
                items={menuItems(group.key, group.values)}
                onpick={(value) => toggleFilter(group.key, value)}
                placement="down"
            />
        {/each}
    </Toolbar>
{/snippet}

<Pane title={title()} toolbar={tools}>
    <div class="board" data-instance={instance.id} data-board={preset.id}>
        {#if shown.length === 0}
            <Empty message={t('board.empty')} glyph={t('board.empty_glyph')} />
        {:else if state.mode === 'list'}
            <Table columns={preset.columns} {rows} rowKey="id" sortable />
        {:else}
            <div class="cards">
                {#each shown as item (item.id)}
                    {@render cardFor(item)}
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

    .folder {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
        word-break: break-all;
    }

    .row,
    .tags,
    .docs {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .venue,
    .authors {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .eli5 {
        margin-top: 8px;
    }

    .eli5 p,
    .next {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
    }

    .next {
        color: var(--muted-txt, var(--muted));
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .more {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .statusline {
        margin: 0 0 6px;
        font-size: var(--fs-sm);
    }

    .field {
        margin-top: 6px;
    }

    .field .value {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
    }

    ul.value {
        padding-left: 18px;
    }

    /* The terminal shape: the folder is the only monospace line in a card by default, so under the
       rice themes the whole card follows it rather than mixing two faces. */
    :global(body.rice) .board {
        font-family: var(--font-mono);
    }
</style>
