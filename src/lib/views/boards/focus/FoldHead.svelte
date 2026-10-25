<script lang="ts">
    // Layer 3, view partial of views/boards/focus/. The heading row of a Focus section that folds:
    // the fold control, a bare button named "Fold <name>" or "Unfold <name>" with the fold glyph of
    // the state, then the section's glyph and its title in bold, then whatever the section puts at
    // the end of the row. The career banner (career/CareerPanel.svelte), the command center
    // (CommandCenterView.svelte, its HPC pill at the end) and the tasks section (Tasks.svelte) draw
    // their headings with it, so the three fold controls, glyphs and titles stand at the same
    // places and the same height, and their markup and their spacing are written here once.
    //
    // The fold control, the glyph and the title are one group that does not wrap: a title longer
    // than the pane is cut with an ellipsis on the fold control's line, so the row stays one line.
    // The end of the row follows the group at the right and wraps to a second line in a pane
    // narrower than the two.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The glyph name drawn before the title. */
        glyph: string;
        /** The words of the title; empty draws the glyph alone. */
        title: string;
        /** The words the fold control is named with, after "Fold" or "Unfold". */
        name: string;
        /** Whether the section is open, and the press of the fold control. */
        open: boolean;
        ontoggle: () => void;
        /** What the section draws at the end of the row, if anything. */
        end?: Snippet;
    };

    let { glyph, title, name, open, ontoggle, end }: Props = $props();
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
        <b>
            <Glyph name={glyph} />
            <span class="words">{title}</span>
        </b>
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

    /* The fold control, the glyph and the title: one line that shrinks to the pane and pushes the
       end of the row to the right. */
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
