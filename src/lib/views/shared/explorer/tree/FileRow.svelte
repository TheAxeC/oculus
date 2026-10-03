<script lang="ts">
    // Layer 3, partial of tree/Tree.svelte. One row of the explorer tree as VS Code's Explorer
    // draws it: a folder (or a file with other files nested under it) with its twistie, a file with
    // its Seti icon, the name in the colour git gives the file and the status letter at the row's
    // right, the name of a folder chain as its segments joined by slashes, and the letters a fuzzy
    // filter matched marked. A row's star and its new-tab control show on hover.
    //
    // A press on the row is handed up with the event, so the tree reads the modifiers, and with the
    // path of the segment it landed on when the row is a chain of folders: each segment is a target
    // of its own, marked `data-fs-seg`, for a press, the menu and a drop.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { namePartsOf, rowKey, type Decoration, type TreeRow } from '$lib/state/sources/fs';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        row: TreeRow;
        nav: TreeNav;
        selected: boolean;
        /** Whether a bookmark of the reader's own names the row. */
        marked: boolean;
        /** What git says of the row, or null. */
        decoration: Decoration | null;
        /**
         * A press on the row, with the segment of a folder chain it landed on (or null) and whether
         * it landed on the twistie.
         */
        onpress: (
            row: TreeRow,
            event: MouseEvent,
            hit: { segment: string | null; twisty: boolean }
        ) => void;
        /** The row opened as a tab that stays. */
        onkeep: (row: TreeRow) => void;
        onbookmark: (row: TreeRow) => void;
    };

    let { row, nav, selected, marked, decoration, onpress, onkeep, onbookmark }: Props = $props();

    const opens = $derived((row.kind === 'dir' && row.up !== true) || row.nests === true);
    const parts = $derived(namePartsOf(row.name, row.hits));
    const lettered = $derived(decoration !== null && decoration.mark !== '');

    /** The inline colour of the name and the letter: the decoration's token. */
    const tone = $derived(
        decoration === null ? undefined : `--tone-txt: var(--c-scm-${decoration.tone}-txt)`
    );

    function titleOf(): string {
        if (row.kind !== 'dir') return t('files.open_title', row.name);
        return row.open ? t('files.collapse_title', row.name) : t('files.expand_title', row.name);
    }

    /** What a press landed on: a segment of a folder chain, and the twistie. */
    function hitOf(event: MouseEvent): { segment: string | null; twisty: boolean } {
        const at = event.target instanceof Element ? event.target : null;
        return {
            segment: at?.closest<HTMLElement>('[data-fs-seg]')?.dataset.fsSeg ?? null,
            twisty: at?.closest('.twisty') != null
        };
    }
</script>

{#snippet words()}
    {#if row.chain !== undefined}
        {#each row.chain as step, at (step.path)}
            {#if at > 0}<span class="sep" aria-hidden="true"> / </span>{/if}<span
                class="seg"
                data-fs-seg={step.path}>{step.name}</span
            >
        {/each}
    {:else}
        {#each parts as part, at (at)}
            {#if part.hit}<mark>{part.text}</mark>{:else}{part.text}{/if}
        {/each}
    {/if}
{/snippet}

{#snippet end()}
    {#if decoration !== null && lettered}
        <span class="letter" style={tone}>{decoration.mark}</span>
    {/if}
{/snippet}

{#snippet actions(reach: number)}
    {#if row.up !== true && row.path !== ''}
        <ToolButton
            label={t('files.row_bookmark')}
            title={marked
                ? t('files.row_unbookmark_title', row.name)
                : t('files.row_bookmark_title', row.name)}
            glyph={t('files.bookmark_glyph')}
            compact
            pressed={marked}
            active={marked}
            tabindex={reach}
            onclick={() => onbookmark(row)}
        />
    {/if}
    {#if row.kind === 'file'}
        <ToolButton
            label={t('files.row_open_tab')}
            title={t('files.row_open_tab_title', row.name)}
            glyph="launch"
            compact
            tabindex={reach}
            onclick={() => onkeep(row)}
        />
    {/if}
{/snippet}

<TreeItem
    label={row.name}
    id={rowKey(row)}
    {nav}
    level={row.depth + 1}
    file={row.kind === 'file' ? row.name : undefined}
    glyph={row.kind === 'dir' ? t('files.folder_glyph') : undefined}
    depth={row.depth}
    expanded={opens ? row.open : undefined}
    {selected}
    title={titleOf()}
    tone={row.ignored === true ? 'muted' : undefined}
    nameStyle={tone}
    words={row.chain !== undefined || row.hits !== undefined ? words : undefined}
    end={lettered ? end : undefined}
    onclick={(event: MouseEvent) => onpress(row, event, hitOf(event))}
    ondblclick={row.kind === 'file' ? () => onkeep(row) : undefined}
    {actions}
/>

<style>
    /* The status letter: 90% of the row's size, weight 600, a little faded, in the colour of the
       name. */
    .letter {
        display: inline-block;
        margin-left: 5px;
        color: var(--tone-txt, var(--muted-txt));
        font-family: var(--font-ui);
        font-size: 90%;
        font-weight: 600;
        opacity: 0.75;
        text-align: center;
    }

    .sep {
        color: var(--muted-txt, var(--muted));
    }

    mark {
        background: transparent;
        color: var(--accent-txt, var(--accent));
        font-weight: 700;
    }
</style>
