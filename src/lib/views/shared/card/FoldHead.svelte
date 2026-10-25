<script lang="ts">
    // Layer 3, view partial shared by the Focus board and the project boards. The heading row of a
    // section that folds: the fold control, a bare button named "Fold <name>" or "Unfold <name>"
    // with the fold glyph of the state, then the section's glyph, where it has one, and its title
    // in bold, drawn in the section's hue where it has one, then its count as a badge, where it
    // has one, then whatever the section puts at the end of the row. On Focus, the career banner
    // (views/boards/focus/career/CareerPanel.svelte), the command center
    // (views/boards/focus/CommandCenterView.svelte, its HPC pill at the end) and the tasks section
    // (views/boards/focus/Tasks.svelte) draw their headings with it; on a project board each
    // category's section of the cards and of the list does, in the category's colour with its
    // count (views/boards/projects/Projects.svelte). So the fold controls, glyphs and titles stand
    // at the same places and the same height, and their markup and their spacing are written here
    // once.
    //
    // The fold control, the glyph, the title and the count are one group that does not wrap: a
    // title longer than the pane is cut with an ellipsis on the fold control's line, so the row
    // stays one line. The end of the row follows the group at the right and wraps to a second line
    // in a pane narrower than the two.

    import type { Snippet } from 'svelte';
    import Chip from '$lib/ui/controls/Chip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The glyph name drawn before the title, or nothing for a title with none. */
        glyph?: string;
        /** The words of the title; empty draws the glyph alone. */
        title: string;
        /** The words the fold control is named with, after "Fold" or "Unfold". */
        name: string;
        /** Whether the section is open, and the press of the fold control. */
        open: boolean;
        ontoggle: () => void;
        /** A hue name the title and the count are drawn in, or nothing for the text colour. */
        tone?: string;
        /** How many the section holds, drawn as a badge after the title, or nothing. */
        count?: number;
        /** What the section draws at the end of the row, if anything. */
        end?: Snippet;
    };

    let { glyph, title, name, open, ontoggle, tone, count, end }: Props = $props();
</script>

<div class="head">
    <span class="lead">
        <ToolButton
            bare
            label={open ? t('focus.fold', name) : t('focus.unfold', name)}
            glyph={open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph')}
            expanded={open}
            onclick={ontoggle}
        />
        <b
            class:toned={tone !== undefined}
            style={tone === undefined ? undefined : `--title: var(--c-${tone}-txt)`}
        >
            {#if glyph !== undefined}
                <Glyph name={glyph} />
            {/if}
            <span class="words">{title}</span>
        </b>
        {#if count !== undefined}
            <Chip label={String(count)} {tone} />
        {/if}
    </span>
    {#if end !== undefined}
        <span class="end">
            {@render end()}
        </span>
    {/if}
</div>

<style>
    /* The row spans both columns of a two-column section. Its gap is the space between the group
       and the end of the row, and between the two lines when the end wraps. */
    .head {
        display: flex;
        column-span: all;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    /* The fold control, the glyph, the title and the count: one line that shrinks to the pane and
       pushes the end of the row to the right. */
    .lead {
        display: flex;
        flex: 0 1 auto;
        align-items: center;
        gap: 8px;
        min-width: 0;
        margin-right: auto;
    }

    .lead > b {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-md);
        font-weight: 600;
    }

    .lead > b.toned {
        color: var(--title);
    }

    .words {
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    /* The end of the row is a flex row too, so a control in it stands on the row's centre line and
       the row stays as high as its tallest control, with no line box of text around it. */
    .end {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
    }
</style>
