<script lang="ts">
    // Layer 3, view partial. The Terminal view's session picker, the one control on its bar that
    // picks what the tab shows, as SessionPicker is on the other session views' bars. A tab
    // shows a terminal oculus runs, so it offers those, each under the session running in it. A tab
    // that follows the selection picks by selecting, so the other session views move with it; a tab
    // that owns its terminal, or was opened for a new one, is pinned to the one picked.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import { followsSelection } from '$lib/state/sessions/terminals.svelte';
    import { sessionRows, terminalChoices } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    type Props = {
        /** The Terminal tab that picks. */
        instance: string;
        /** The terminal the tab shows now, or null. */
        current: string | null;
    };

    let { instance, current }: Props = $props();

    const {
        layout: { instanceLayoutState, pinInstance },
        selection: { select },
        selectors: { sessionsByWorkspace },
        terminals: { terminals }
    } = useState();

    const choices = $derived(terminalChoices(terminals(), sessionRows(sessionsByWorkspace(true))));
    const shown = $derived(choices.find((one) => one.terminal === current) ?? null);

    function picked(id: string): void {
        const choice = choices.find((one) => one.terminal === id);
        if (choice === undefined) return;
        if (followsSelection(instanceLayoutState(instance))) select(choice.id);
        else pinInstance(instance, choice.terminal, choice.label);
    }
</script>

<span class="picker" data-session-picker>
    <Menu
        label={shown === null ? t('sessions.pick_terminal') : shown.label}
        title={t('sessions.pick_terminal_tip')}
        glyph={t('sessions.terminal_glyph')}
        placement="down"
        items={choices.map((one) => ({
            id: one.terminal,
            label: one.label,
            active: one.terminal === current
        }))}
        onpick={picked}
    />
</span>

<style>
    .picker {
        display: inline-flex;
        min-width: 0;
        max-width: 50%;
    }
</style>
