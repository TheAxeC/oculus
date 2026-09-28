<script lang="ts">
    // Layer 3, view partial. The Terminal view's bar names the terminal the tab shows while no list
    // of terminals is drawn, as VS Code's panel names its one terminal in the view's header: the
    // title after what runs in it, the description muted after it, and the bell mark while it
    // rings.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The row of the terminal shown. */
        shown: TerminalChoice;
        /** Its tooltip: the terminal's name, command, folder and start time. */
        tip: string;
        /** Whether its bell is ringing. */
        ringing: boolean;
    };

    let { shown, tip, ringing }: Props = $props();
</script>

<span class="shown" title={tip} data-terminal-shown>
    <span class="title" data-terminal-title>{shown.title}</span>
    <span class="description" data-terminal-description>{shown.description}</span>
    {#if ringing}
        <span class="bell" data-bell title={t('sessions.terminal_bell')}>
            <Glyph name="bell" />
        </span>
    {/if}
</span>

<style>
    .shown {
        display: inline-flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        max-width: 50%;
        white-space: nowrap;
    }

    .title,
    .description {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .title {
        font-size: var(--fs-sm);
    }

    .description {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .bell {
        color: var(--accent-txt, var(--accent));
    }
</style>
