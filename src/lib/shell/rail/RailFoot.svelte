<script lang="ts">
    // Layer 3, shell. The rail's foot, where VS Code's activity bar keeps Accounts and Manage:
    // Workbenches and Update, each an icon with its name as the tooltip. Workbenches opens the menu
    // of the open workbenches (WorkbenchMenu.svelte), which switches to one, closes one and shows
    // the Workbenches view. The reader's bookmarks are in the Files view's Bookmarks section, and
    // the search is Cmd-K and the title bar's Command Center.
    //
    // The keyboard ring is the rail's, so each control is handed its place in the focus order and
    // its key handler.

    import WorkbenchMenu from './WorkbenchMenu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        stopIndex: (id: string) => number;
        ringKeys: (id: string) => (event: KeyboardEvent) => void;
        onupdate: () => void;
        /** Show the Workbenches view. */
        onworkbenches: () => void;
    };

    let { stopIndex, ringKeys, onupdate, onworkbenches }: Props = $props();
</script>

<div class="foot" data-foot>
    <div data-action="workbenches">
        <WorkbenchMenu {stopIndex} {ringKeys} onmanage={onworkbenches} />
    </div>
    <div data-action="update">
        <ToolButton
            label={t('app.update')}
            title={t('app.update_tip')}
            glyph="refresh"
            compact
            rail
            stop="update"
            tabindex={stopIndex('update')}
            onkeydown={ringKeys('update')}
            onclick={onupdate}
        />
    </div>
</div>

<style>
    /* On a short window the list above is what gives way, and it scrolls. Without the flex-shrink
       the foot shrinks with it and its buttons pile over each other. */
    .foot {
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex-shrink: 0;
    }
</style>
