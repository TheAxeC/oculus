<script lang="ts">
    // Layer 3, primitive. A path read as its segments, each one a control that picks it, with an
    // arrow between two segments. The segments and what picking one means are the caller's; this
    // draws them in order and names the last as the current one. The row is VS Code's breadcrumb
    // row: 22px high, the arrow in a box 16px wide, an item at most 80% of the row, the words at
    // 12px, the step of the type scale nearest VS Code's 0.9em of 13px (themes/tokens.css,
    // `--crumb-row` and `--crumb-icon`).

    import Glyph from '../display/Glyph.svelte';

    type Props = {
        /** The strip's accessible name, already translated. */
        label: string;
        /** The segments from the outermost in, each with the id picking it hands back. */
        segments: { id: string; label: string }[];
        onselect: (id: string) => void;
    };

    let { label, segments, onselect }: Props = $props();
</script>

<nav class="crumbs" aria-label={label}>
    <ol class="list">
        {#each segments as segment, at (segment.id)}
            <li class="segment">
                {#if at > 0}
                    <span class="sep" aria-hidden="true">
                        <Glyph name="chevron" />
                    </span>
                {/if}
                <button
                    type="button"
                    class="crumb"
                    aria-current={at === segments.length - 1 ? 'location' : undefined}
                    onclick={() => onselect(segment.id)}
                >
                    {segment.label}
                </button>
            </li>
        {/each}
    </ol>
</nav>

<style>
    .crumbs {
        box-sizing: border-box;
        height: var(--crumb-row);
        min-width: 0;
        margin-left: 0.45em;
        overflow: hidden;
    }

    .list {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        height: 100%;
        min-width: 0;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .segment {
        display: flex;
        align-items: center;
        flex: 0 1 auto;
        max-width: 80%;
        min-width: 0;
        height: 100%;
        white-space: nowrap;
    }

    .sep {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: var(--crumb-icon);
        height: 100%;
        color: var(--muted-txt, var(--muted));
        font-size: 0.9em;
    }

    .crumb {
        min-width: 0;
        height: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 1px;
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        font-size: var(--fs-sm);
        cursor: pointer;
    }

    .segment:last-child {
        padding-right: 4px;
    }

    .crumb:hover {
        background: var(--chip);
        color: var(--ink-txt, var(--ink));
    }

    .crumb[aria-current='location'] {
        color: var(--ink-txt, var(--ink));
    }

    .crumb:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }
</style>
