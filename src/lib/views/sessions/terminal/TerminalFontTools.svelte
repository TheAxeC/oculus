<script lang="ts">
    // Layer 3, view partial. The three buttons on a Terminal tab's bar that set the grids' font
    // size: smaller and larger by one CSS pixel from the size in force, and back to the configured
    // size. The size is a setting of the ui store, shared by every grid.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { gridFontSize } from './terminal-list';

    const {
        ui: { setTerminalFont, terminalFont, textScale }
    } = useState();

    /** Move the chosen size by one CSS pixel from the value currently in force. */
    function stepFont(by: number): void {
        const current = gridFontSize(terminalFont(), textScale() ?? 1);
        if (current !== undefined) setTerminalFont(current + by);
    }
</script>

<ToolButton
    label={t('sessions.terminal_smaller')}
    glyph="collapse"
    compact
    onclick={() => stepFont(-1)}
/>
<ToolButton
    label={t('sessions.terminal_larger')}
    glyph="expand"
    compact
    onclick={() => stepFont(1)}
/>
<ToolButton
    label={t('sessions.terminal_reset')}
    glyph="refresh"
    compact
    onclick={() => setTerminalFont(null)}
/>
