<script lang="ts">
    // Layer 3, view partial. The three buttons on a Terminal tab's bar that set the font size of
    // what the tab shows. Smaller and larger move it by one CSS pixel from the size in force. The
    // reset takes out the key of what the tab shows, so a grid returns to the size configured under
    // it and a transcript to `--fs-sm`. The grids and the transcripts keep a size each, both
    // settings of the ui store, so a press on a tab showing a grid leaves every transcript alone
    // and the other way around, and every grid shares its size as every transcript body shares its
    // own.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { gridFontSize, transcriptFontSize } from '../terminal-list';

    type Props = {
        /** Whether the tab shows its transcript, whose size the buttons then set. */
        reading: boolean;
    };

    let { reading }: Props = $props();

    const {
        ui: { setTerminalFont, setTranscriptFont, terminalFont, textScale, transcriptFont }
    } = useState();

    const setFont = $derived(reading ? setTranscriptFont : setTerminalFont);

    /** Move the chosen size by one CSS pixel from the value currently in force. */
    function stepFont(by: number): void {
        const scale = textScale() ?? 1;
        const current = reading
            ? transcriptFontSize(transcriptFont(), scale)
            : gridFontSize(terminalFont(), scale);
        if (current !== undefined) setFont(current + by);
    }
</script>

<ToolButton
    label={reading ? t('sessions.transcript_smaller') : t('sessions.terminal_smaller')}
    glyph="collapse"
    compact
    onclick={() => stepFont(-1)}
/>
<ToolButton
    label={reading ? t('sessions.transcript_larger') : t('sessions.terminal_larger')}
    glyph="expand"
    compact
    onclick={() => stepFont(1)}
/>
<ToolButton
    label={reading ? t('sessions.transcript_reset') : t('sessions.terminal_reset')}
    glyph="refresh"
    compact
    onclick={() => setFont(null)}
/>
