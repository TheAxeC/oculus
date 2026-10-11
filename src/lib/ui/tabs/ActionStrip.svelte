<script lang="ts">
    // Layer 3, primitive. A row of actions a menu gave a surface, as VS Code draws a title menu:
    // the actions of the bar are buttons with their icon, and every other action is a choice of the
    // More Actions list at the row's end, which is drawn only when it has a choice. An action with
    // no icon is a button of its words. What an action is and what pressing it does are the
    // caller's; the press is handed the event so a caller can read the Alt key.

    import Menu from '../menu/Menu.svelte';
    import type { MenuItem } from '../menu/menu-items';
    import ToolButton from '../controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    /**
     * One action: its words, its icon as a glyph name or a picture's address, and where it sits.
     */
    export type StripAction = {
        id: string;
        label: string;
        glyph?: string;
        picture?: string;
        /** A button of the bar, else a choice of the More Actions list. */
        bar: boolean;
        /** Draw a rule above the choice of the list, between two menu groups. */
        rule?: boolean;
        disabled?: boolean;
    };

    type Props = {
        /** The row's accessible name. */
        label: string;
        actions: StripAction[];
        onpick: (id: string, event: MouseEvent) => void;
    };

    let { label, actions, onpick }: Props = $props();

    const buttons = $derived(actions.filter((one) => one.bar));
    const items = $derived<MenuItem[]>(
        actions
            .filter((one) => !one.bar)
            .map((one) => ({
                id: one.id,
                label: one.label,
                glyph: one.glyph,
                disabled: one.disabled,
                rule: one.rule
            }))
    );
</script>

{#if buttons.length > 0 || items.length > 0}
    <div class="strip" role="toolbar" aria-label={label}>
        {#each buttons as action (action.id)}
            <ToolButton
                label={action.label}
                glyph={action.glyph}
                picture={action.picture}
                compact={action.glyph !== undefined || action.picture !== undefined}
                bare={action.glyph !== undefined || action.picture !== undefined}
                small={action.glyph === undefined && action.picture === undefined}
                disabled={action.disabled}
                onclick={(event: MouseEvent) => onpick(action.id, event)}
            />
        {/each}
        {#if items.length > 0}
            <Menu
                label={t('ui.actions_more')}
                glyph={t('ui.pane_more_glyph')}
                compact
                bare
                placement="down"
                align="right"
                {items}
                onpick={(id: string, event: MouseEvent) => onpick(id, event)}
            />
        {/if}
    </div>
{/if}

<style>
    .strip {
        display: flex;
        align-items: center;
        gap: var(--tab-action-gap);
    }
</style>
