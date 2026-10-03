<script lang="ts">
    // Layer 3, view partial. The icon actions in the Terminal view's header: New terminal, which
    // starts a shell at once in the tab's folder, the kinds dropdown beside it, which starts Shell,
    // Claude or Codex the same way, shows the composer (With a Prompt) in the shown terminal's
    // kind, or, under Attach to Session, joins a running terminal no Terminal tab owns to the end
    // of the tab, and Split, which splits the shown terminal. A task terminal also has Rerun (once
    // its line ended) and Restart. The words of each are its tooltip and its accessible name. The
    // title, the font buttons and what the tab said are on the view's bar.

    import Menu from '$lib/ui/menu/Menu.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { TerminalKind } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import {
        MENU_PROMPT,
        attachedOf,
        kindsMenu,
        profileOf,
        type Attachable,
        type TaskState
    } from '../terminal-list';

    type Props = {
        /** The Terminal tab's instance id, which every start and attach is made for. */
        instance: string;
        /** The terminal the tab shows, or null while it shows none. */
        shown: string | null;
        /** The kind of the shown terminal, which With a Prompt opens the composer in. */
        kind: TerminalKind | undefined;
        /** The running terminals no Terminal tab owns, offered under Attach to Session. */
        attachables: Attachable[];
        /** Split a terminal of this tab. */
        onsplit: (terminal: string) => void;
        /** Where the shown terminal's line is, or null when it is no task terminal. */
        task: TaskState;
        /** Rerun and Restart the shown task terminal. */
        onrerun: (terminal: string) => void;
        onrestart: (terminal: string) => void;
    };

    let { instance, shown, kind, attachables, onsplit, task, onrerun, onrestart }: Props = $props();

    const {
        terminals: { attachTerminal, composeInTab, startInTab }
    } = useState();

    /**
     * The kinds dropdown: a kind starts at once, With a Prompt shows the composer, and a terminal
     * under Attach to Session joins this tab.
     */
    function kindPicked(pick: string): void {
        const profile = profileOf(pick);
        const attaching = attachedOf(pick);
        if (pick === MENU_PROMPT) composeInTab(instance, kind);
        else if (profile !== null) void startInTab(instance, profile);
        else if (attaching !== null) attachTerminal(instance, attaching);
    }
</script>

<ToolButton
    bare
    label={t('sessions.new_terminal')}
    title={t('sessions.new_terminal_title')}
    glyph={t('sessions.terminal_glyph')}
    onclick={() => void startInTab(instance, 'shell')}
/>
<Menu
    label={t('sessions.new_kinds')}
    items={kindsMenu(t, attachables)}
    glyph="disclosure"
    compact
    bare
    placement="down"
    align="right"
    onpick={kindPicked}
/>
{#if shown !== null}
    <ToolButton
        bare
        label={t('sessions.terminal_split')}
        title={t('sessions.terminal_split_tip')}
        glyph="split_right"
        onclick={() => onsplit(shown)}
    />
{/if}
{#if shown !== null && task === 'ended'}
    <ToolButton
        bare
        label={t('commands.rerun')}
        title={t('commands.rerun_tip')}
        glyph="refresh"
        onclick={() => onrerun(shown)}
    />
{/if}
{#if shown !== null && task !== null}
    <ToolButton
        bare
        label={t('commands.restart')}
        title={t('commands.restart_tip')}
        glyph="refresh_live"
        onclick={() => onrestart(shown)}
    />
{/if}
