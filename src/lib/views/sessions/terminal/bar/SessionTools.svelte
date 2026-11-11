<script lang="ts">
    // Layer 3, view partial. The tools a Terminal tab's header holds for its session, right of
    // TerminalActions.svelte: Lock, drawn while a terminal with a session shows, which leaves the
    // box and every grid of the tab read-only, and Jump to the last turn while Transcript shows.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Whether Lock is drawn. */
        lockable: boolean;
        /** Whether the tab is locked. */
        locked: boolean;
        /** Turn the tab's lock over. */
        onlock: () => void;
        /** Whether the transcript body is drawn. */
        reading: boolean;
        /** Scroll the transcript body to its newest turn. */
        onend: () => void;
    };

    let { lockable, locked, onlock, reading, onend }: Props = $props();
</script>

{#if lockable}
    <ToolButton
        bare
        label={locked ? t('sessions.terminal_unlock') : t('sessions.terminal_lock')}
        title={locked ? t('sessions.terminal_unlock') : t('sessions.terminal_lock_tip')}
        glyph="lock"
        active={locked}
        pressed={locked}
        onclick={onlock}
    />
{/if}
{#if reading}
    <ToolButton
        bare
        label={t('sessions.turn_end')}
        glyph={t('sessions.turn_end_glyph')}
        onclick={onend}
    />
{/if}
