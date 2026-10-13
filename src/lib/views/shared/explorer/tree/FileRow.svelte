<script lang="ts">
    // Layer 3, partial of tree/Tree.svelte. One row of the explorer tree as VS Code's Explorer
    // draws it: a folder (or a file with other files nested under it) with its twistie, a file with
    // its Seti icon, the name in the colour git gives the file and the status letter at the row's
    // right, the name of a folder chain as its segments joined by slashes, and the letters a fuzzy
    // filter matched marked. A file holding errors or warnings draws their count before the letter,
    // as `9+` from ten and in the colour of the worst, and the name takes that colour in place of
    // git's; a folder holding some draws a dot in the worst colour at 40% opacity. A row's star and
    // its new-tab control show on hover.
    //
    // The apps' file decorations join git's: their badges follow git's letter, the two together at
    // most two characters, their tooltips are the row's hover words one to a line, and the colour
    // of the name is git's when git gives one and the apps' otherwise. A folder an app's decoration
    // propagates to takes the colour alone.
    //
    // A press on the row is handed up with the event, so the tree reads the modifiers, and with the
    // path of the segment it landed on when the row is a chain of folders: each segment is a target
    // of its own, marked `data-fs-seg`, for a press, the menu and a drop.

    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import {
        namePartsOf,
        rowKey,
        type Decoration,
        problemWords,
        type ProblemMark,
        type TreeRow
    } from '$lib/state/sources/fs';
    import type { RowDecoration } from '$lib/state/system/apps/tools/decorations.svelte';
    import { t } from '$lib/state/shared/words/text';

    /** The colour token a problem mark of each hue is drawn in. */
    const PROBLEM_TOKEN = { error: '--c-red-txt', warning: '--c-amber-txt' } as const;

    type Props = {
        row: TreeRow;
        nav: TreeNav;
        selected: boolean;
        /** Whether a bookmark of the reader's own names the row. */
        marked: boolean;
        /** What git says of the row, or null. */
        decoration: Decoration | null;
        /** What the Problems view counts for the row, or null. */
        problem: ProblemMark | null;
        /** What the apps' decoration providers say of the row, or null. */
        apps: RowDecoration | null;
        /**
         * A press on the row, with the segment of a folder chain it landed on (or null) and whether
         * it landed on the twistie.
         */
        onpress: (
            row: TreeRow,
            event: MouseEvent,
            hit: { segment: string | null; twisty: boolean }
        ) => void;
        /**
         * The row opened as a tab that stays. A pointer press passes its time, and the tab then
         * takes the keyboard.
         */
        onkeep: (row: TreeRow, pressedAt?: number) => void;
        onbookmark: (row: TreeRow) => void;
    };

    let {
        row,
        nav,
        selected,
        marked,
        decoration,
        problem,
        apps,
        onpress,
        onkeep,
        onbookmark
    }: Props = $props();

    const opens = $derived((row.kind === 'dir' && row.up !== true) || row.nests === true);
    const parts = $derived(namePartsOf(row.name, row.hits));
    /** The letters git and the apps give, two at most. */
    const letters = $derived(`${decoration?.mark ?? ''}${apps?.badge ?? ''}`.slice(0, 2));
    const lettered = $derived(letters !== '');

    /** The inline colour of the status letter: the decoration's token. */
    const letterTone = $derived(
        decoration === null ? undefined : `--tone-txt: var(--c-scm-${decoration.tone}-txt)`
    );
    /** The colour of a problem mark, which is also the name's: the problem wins over git's. */
    const problemTone = $derived(
        problem === null ? undefined : `--tone-txt: var(${PROBLEM_TOKEN[problem.tone]})`
    );
    /** The colour the apps give, used where git gives none. */
    const appTone = $derived(
        apps?.property == null ? undefined : `--tone-txt: var(${apps.property})`
    );
    const tone = $derived(problemTone ?? letterTone ?? appTone);
    const counted = $derived(problem === null || problem.dot ? null : problemWords(problem));

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
    {#if problem?.dot === true}
        <span class="dot" style={problemTone} data-problem-dot></span>
    {:else if problem !== null}
        <span class="letter" style={problemTone} title={counted?.title} data-problem-count>
            {counted?.count}
        </span>
    {/if}
    {#if lettered}
        {#if problem !== null && !problem.dot}<span class="letter joint" aria-hidden="true"
                >{t('files.problem_join')}</span
            >{/if}
        <span class="letter" style={letterTone ?? appTone}>{letters}</span>
    {/if}
{/snippet}

{#snippet actions(reach: number)}
    {#if row.up !== true}
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
            onclick={(event: MouseEvent) => onkeep(row, event.timeStamp)}
        />
    {/if}
{/snippet}

<TreeItem
    label={row.name}
    id={rowKey(row)}
    {nav}
    level={row.depth + 1}
    file={row.kind === 'file' ? row.name : undefined}
    folder={row.kind === 'dir' ? row.name : undefined}
    glyph={row.kind === 'dir' ? t('files.folder_glyph') : undefined}
    depth={row.depth}
    expanded={opens ? row.open : undefined}
    {selected}
    title={apps?.tooltip ? `${titleOf()}\n${apps.tooltip}` : titleOf()}
    tone={row.ignored === true ? 'muted' : undefined}
    nameStyle={tone}
    words={row.chain !== undefined || row.hits !== undefined ? words : undefined}
    end={lettered || problem !== null ? end : undefined}
    onclick={(event: MouseEvent) => onpress(row, event, hitOf(event))}
    onpressagain={row.kind === 'file'
        ? (event: MouseEvent) => onkeep(row, event.timeStamp)
        : undefined}
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

    /* The comma between a problem count and the status letter takes the letter's own margin away,
       so the two read as one run. */
    .joint {
        margin-left: 0;
        margin-right: 3px;
        color: var(--muted-txt, var(--muted));
    }

    /* The mark of a folder holding a problem: a dot in the worst colour, drawn faint. */
    .dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-left: 5px;
        border-radius: 50%;
        background: var(--tone-txt, var(--muted-txt));
        opacity: 0.4;
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
