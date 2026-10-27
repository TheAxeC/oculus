<script lang="ts">
    // Layer 3, view part. The deck's `order:` as one list, one row for each entry: a slide file by
    // its name and the title of its first slide, a group's slides by the group's name, a summary or
    // a grid by its kind, its group and its title. A row is dragged to another place in the list or
    // stepped one place with the controls; the list's own state is the Slides view's, which writes
    // the order at Save with the lists of the groups. It is the group every grouping of a view is
    // drawn as (ui/controls/heads/GroupHead.svelte), headed Order, and folds by its control; the
    // Slides view keeps the fold.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Steps from './Steps.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { DeckOrderEntry } from '$lib/state/life/slides';

    let {
        rows,
        busy,
        onmove,
        open,
        ontoggle
    }: {
        /** The entries in the order the reader arranged them. */
        rows: DeckOrderEntry[];
        /** True while a save is in flight, which holds every row still. */
        busy: boolean;
        /** Move the entry with this token to a place in the list. */
        onmove: (token: string, to: number) => void;
        /** Whether the order is open, and the press of its fold control. */
        open: boolean;
        ontoggle: () => void;
    } = $props();

    /** The row being dragged, and the row whose grip was pressed, by token. */
    let dragged = $state('');
    let armed = $state('');

    /** The words an entry is shown by. */
    function wordsOf(row: DeckOrderEntry): string {
        if (row.kind === 'file') return t('slides.order_file', row.name, row.title);
        if (row.kind === 'group') return t('slides.order_group', row.name);
        const kind = row.kind === 'grid' ? t('slides.order_grid') : t('slides.order_summary');
        return t('slides.order_of', kind, row.name, row.title);
    }

    function drop(onto: string): void {
        const from = dragged;
        dragged = '';
        armed = '';
        const to = rows.findIndex((row) => row.token === onto);
        if (from !== '' && from !== onto && to >= 0) onmove(from, to);
    }
</script>

<GroupHead data-order aria-label={t('slides.order')} label={t('slides.order')} {open} {ontoggle}>
    <div class="rows" role="list" inert={busy}>
        {#each rows as row, at (row.token)}
            <div
                class="row"
                class:dragging={dragged === row.token}
                data-order-row={row.token}
                draggable={armed === row.token}
                ondragstart={() => (dragged = row.token)}
                ondragover={(event: DragEvent) => event.preventDefault()}
                ondrop={(event: DragEvent) => {
                    event.preventDefault();
                    drop(row.token);
                }}
                ondragend={() => {
                    dragged = '';
                    armed = '';
                }}
                role="listitem"
            >
                <span
                    class="grip"
                    title={t('slides.order_drag_tip', wordsOf(row))}
                    onmousedown={() => (armed = row.token)}
                    role="presentation"
                >
                    <Glyph name={t('slides.drag_glyph')} />
                </span>
                <span class="at">{t('slides.position', String(at + 1))}</span>
                <span class="words">{wordsOf(row)}</span>
                <Steps
                    {at}
                    count={rows.length}
                    title={wordsOf(row)}
                    onstep={(to: number) => onmove(row.token, to)}
                />
            </div>
        {/each}
    </div>
</GroupHead>

<style>
    .rows {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .row {
        display: flex;
        align-items: center;
        gap: 6px;
        box-sizing: border-box;
        min-width: 0;
        max-width: 100%;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        border-radius: var(--radius-sm);
        padding: 0 6px;
    }

    .row:hover {
        background: var(--chip);
    }

    .row.dragging {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    .grip {
        flex: none;
        color: var(--muted-txt, var(--muted));
        cursor: grab;
    }

    .at {
        flex: none;
        min-width: 2ch;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-sm);
        text-align: right;
    }

    .words {
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
