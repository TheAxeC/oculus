<script lang="ts">
    // Layer 3, shell. One notification as the centre lists it and as a toast shows it: its tone's
    // glyph, its words, the time it came, the actions it offers and the control that puts it away.
    // The two differ only in what that control does, which the caller says.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { Notice } from '$lib/state/workbench/navigation/notices.svelte';
    import { clockOf } from './status-items';

    type Props = {
        notice: Notice;
        /** The words of the control that puts it away: Clear in the centre, Close on a toast. */
        dismiss: string;
        ondismiss: () => void;
    };

    let { notice, dismiss, ondismiss }: Props = $props();

    /** Each tone's glyph, as VS Code marks a notification's severity. */
    const INFO_GLYPH = 'info';
    const WARNING_GLYPH = 'warn';
    const ERROR_GLYPH = 'cross';

    const toneGlyph = $derived(
        notice.tone === 'error'
            ? ERROR_GLYPH
            : notice.tone === 'warning'
              ? WARNING_GLYPH
              : INFO_GLYPH
    );
</script>

<div class="entry" data-notice={notice.id} data-tone={notice.tone}>
    <span class="tone">
        <Glyph name={toneGlyph} />
    </span>
    <p class="message">{notice.message}</p>
    <time class="when" datetime={new Date(notice.at).toISOString()}>{clockOf(notice.at)}</time>
    <span class="dismiss">
        <ToolButton label={dismiss} glyph="dismiss" compact bare onclick={ondismiss} />
    </span>
    {#if notice.actions.length > 0}
        <div class="actions">
            {#each notice.actions as action, at (at)}
                <ToolButton label={action.label} onclick={action.run} />
            {/each}
        </div>
    {/if}
</div>

<style>
    .entry {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        align-items: start;
        gap: 4px 8px;
        padding: 8px 10px;
        color: var(--ink-txt, var(--ink));
        font-size: var(--status-text);
    }

    .tone {
        color: var(--accent-txt, var(--accent));
    }

    .entry[data-tone='error'] .tone {
        color: var(--c-red-txt);
    }

    .entry[data-tone='warning'] .tone {
        color: var(--c-amber-txt);
    }

    .message {
        margin: 0;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }

    .when {
        color: var(--muted-txt, var(--muted));
        white-space: nowrap;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
        grid-column: 2 / -1;
    }
</style>
