<script lang="ts">
    // Layer 3, view partial. The name of a terminal on the Terminal view's bar
    // (bar/TerminalBar.svelte), which names the terminal the tab shows while no list of terminals
    // is drawn, as VS Code's panel names its one terminal in the view's header, and the one being
    // renamed while the list is narrow: the title after what runs in it (or the title the reader
    // gave it), the description muted after it, its mark in the icon and colour it was given, and
    // the bell mark while it rings. A double click on the title opens the rename field in its
    // place. A right-click on it opens the menu of a list row on this terminal (`menu`), whose pick
    // the tab routes as it routes a row's (terminal-list.ts, `routePick`); the menu is its own, so
    // the rename field's text box keeps the text box menu. The name carries the terminal's id, so a
    // right press on it keeps that terminal's armed Kill (list/kill-arm.svelte.ts).

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ContextMenu from '$lib/ui/menu/ContextMenu.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import type { TerminalChoice } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import RenameField from './RenameField.svelte';
    import { markOf } from '$lib/state/sessions/terminal/terminal-marks';
    import { tokenStyle } from './terminal-list';

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
        /** The items of the terminal's menu, read when the right-click arrives. */
        menu: () => MenuItem[];
        /** A pick of that menu. */
        onpick: (pick: string) => void;
        /** The rename field saved a value (an empty one clears the title). */
        onsave: (value: string) => void;
        /** The rename field was cancelled. */
        oncancel: () => void;
    };

    let { shown, tip, ringing, renaming, onrename, menu, onpick, onsave, oncancel }: Props =
        $props();
</script>

<ContextMenu label={shown.title} read={menu} own {onpick}>
    <span class="shown" title={tip} data-terminal-shown={shown.terminal}>
        <span class="mark" style={tokenStyle(markOf(shown).token)}>
            <Glyph name={markOf(shown).glyph} />
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
</ContextMenu>

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

    /* The description gives up its room first, down to nothing, so a narrow bar keeps the title
       whole as long as it can, and a title cut further keeps its first characters readable. */
    .title {
        flex: 0 1 auto;
        min-width: 4ch;
        font-size: var(--fs-md);
    }

    .description {
        flex: 0 1000 auto;
        min-width: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .mark {
        display: inline-flex;
        align-self: center;
    }

    .bell {
        color: var(--accent-txt, var(--accent));
    }
</style>
