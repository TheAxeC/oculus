<script lang="ts">
    // Layer 3, view partial. The Terminal view's bar names the terminal the tab shows while no list
    // of terminals is drawn, as VS Code's panel names its one terminal in the view's header: the
    // title after what runs in it (or the title the reader gave it), the description muted after
    // it, its mark in the icon and colour it was given, and the bell mark while it rings. A double
    // click on the title opens the rename field in its place.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import RenameField from './RenameField.svelte';
    import { markGlyph } from '$lib/state/sessions/terminal/terminal-marks';
    import { markStyle } from './terminal-list';

    type Props = {
        /** The row of the terminal shown. */
        shown: TerminalChoice;
        /** Its tooltip: the terminal's name, command, folder and start time. */
        tip: string;
        /** Whether its bell is ringing. */
        ringing: boolean;
        /** Whether the rename field is open in place of the title. */
        renaming: boolean;
        /** A double click on the title asks for the rename field. */
        onrename: () => void;
        /** The rename field saved a value (an empty one clears the title). */
        onsave: (value: string) => void;
        /** The rename field was cancelled. */
        oncancel: () => void;
    };

    let { shown, tip, ringing, renaming, onrename, onsave, oncancel }: Props = $props();
</script>

<span class="shown" title={tip} data-terminal-shown>
    <span class="mark" style={markStyle(shown.color)}>
        <Glyph name={markGlyph(shown.kind, shown.icon)} />
    </span>
    {#if renaming}
        <RenameField
            value={shown.title}
            label={t('sessions.terminal_rename_field')}
            {onsave}
            {oncancel}
        />
    {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span class="title" data-terminal-title ondblclick={onrename}>{shown.title}</span>
    {/if}
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

    .mark {
        display: inline-flex;
        align-self: center;
    }

    .bell {
        color: var(--accent-txt, var(--accent));
    }
</style>
