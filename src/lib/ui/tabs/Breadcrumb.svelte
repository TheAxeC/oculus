<script lang="ts">
    // Layer 3, primitive. A path read as its segments, each one a control that picks it, with an
    // arrow between two segments. The segments and what picking one means are the caller's; this
    // draws them in order and names the last as the current one. The row is VS Code's breadcrumb
    // row: 22px high, the arrow in a box 16px wide, the words at 12px, the step of the type scale
    // nearest VS Code's 0.9em of 13px (themes/tokens.css, `--crumb-row` and `--crumb-icon`). Every
    // item keeps its whole name; the row takes the room its neighbours leave, and a path longer
    // than that room is cut from the left, so the file's name stays in view.

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
    /* The box is read right to left so that a path wider than it overflows on its left; the list
       inside is read left to right and sits at the left edge while it fits (the auto margin). */
    .crumbs {
        box-sizing: border-box;
        flex: 1 1 0;
        direction: rtl;
        height: var(--crumb-row);
        min-width: 0;
        margin-left: 0.45em;
        overflow: hidden;
    }

    .list {
        display: flex;
        direction: ltr;
        align-items: center;
        flex-wrap: nowrap;
        width: max-content;
        height: 100%;
        margin: 0 auto 0 0;
        padding: 0;
        list-style: none;
    }

    .segment {
        display: flex;
        align-items: center;
        flex: none;
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
