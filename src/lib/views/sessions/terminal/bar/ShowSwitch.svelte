<script lang="ts">
    // Layer 3, view partial. The Live and Transcript buttons on a Terminal tab's bar, drawn while
    // the tab has a session to read. Each is a ToolButton of its own rather than a Segment, since
    // Live is disabled while the session has no terminal and a Segment has no disabled item.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TerminalTabState } from '$lib/state/sessions/terminal/terminal-tabs';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** Whether the transcript body is drawn. */
        reading: boolean;
        /** Whether Live has a terminal to show. */
        live: boolean;
        /** A press on one of the two. */
        onchoose: (showing: TerminalTabState['showing']) => void;
    };

    let { reading, live, onchoose }: Props = $props();
</script>

<ToolButton
    label={t('sessions.terminal_show_live')}
    title={live ? t('sessions.terminal_show_live_tip') : t('sessions.terminal_show_live_none')}
    glyph={t('sessions.terminal_glyph')}
    active={!reading}
    pressed={!reading}
    disabled={!live}
    onclick={() => onchoose('live')}
/>
<ToolButton
    label={t('sessions.view_transcript')}
    title={t('sessions.terminal_show_transcript_tip')}
    glyph={t('sessions.transcript_glyph')}
    active={reading}
    pressed={reading}
    onclick={() => onchoose('transcript')}
/>
