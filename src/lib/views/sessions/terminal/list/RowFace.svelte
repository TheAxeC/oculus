<script lang="ts">
    // Layer 3, view partial. What one row of the Terminal tab's list (TerminalList.svelte) draws:
    // the terminal's mark in its colour, its title (a double click on it opens Rename), its
    // description, and the bell while it rings. A row whose Kill is armed draws, in place of the
    // description and in red, the words that a second press kills the terminal, so the darker bin
    // is not the only sign of it. A narrow list draws the mark alone, with the bell. While the row
    // is renamed, the field the list hands in (`children`) is drawn after the mark in place of the
    // words.

    import type { Snippet } from 'svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { markOf } from '$lib/state/sessions/terminal/terminal-marks';
    import { t } from '$lib/state/shared/words/text';
    import { tokenStyle } from '../terminal-list';

    type Props = {
        row: TerminalChoice;
        /** The row's Kill waits for its second press. */
        armed: boolean;
        /** The row's bell is ringing. */
        ringing: boolean;
        /** The list is narrow and draws the mark alone. */
        narrow: boolean;
        /** A double click on the title. */
        onrename: () => void;
        /** The rename field, drawn after the mark in place of the words. */
        children?: Snippet;
    };

    let { row, armed, ringing, narrow, onrename, children }: Props = $props();

    const mark = $derived(markOf(row));
</script>

<span class="face" class:narrow>
    <span class="markglyph" style={tokenStyle(mark.token)}>
        <Glyph name={mark.glyph} />
    </span>
    {#if children}
        {@render children()}
    {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="title" data-row-title ondblclick={onrename}>{row.title}</span>
        <span class="description" class:armed data-row-description
            >{armed ? t('sessions.terminal_kill_armed') : row.description}</span
        >
        {#if ringing}
            <span class="bell" data-bell title={t('sessions.terminal_bell')}>
                <Glyph name="bell" />
            </span>
        {/if}
    {/if}
</span>

<style>
    .face {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 100%;
        min-width: 0;
        cursor: pointer;
    }

    .title,
    .description {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .narrow .title,
    .narrow .description {
        display: none;
    }

    .title {
        flex: 0 1 auto;
        font-size: var(--fs-md);
    }

    .description {
        flex: 1 1 0;
        min-width: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .description.armed {
        color: var(--c-red-txt);
    }

    .markglyph {
        display: inline-flex;
        flex: 0 0 auto;
    }

    .bell {
        flex: 0 0 auto;
        color: var(--accent-txt, var(--accent));
    }
</style>
