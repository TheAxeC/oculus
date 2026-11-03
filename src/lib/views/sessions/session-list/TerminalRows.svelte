<script lang="ts">
    // Layer 3, sessions view partial. Terminal rows live here because their stop and own-pane
    // controls change independently of transcript-backed session rows. Every terminal oculus runs
    // is a row, those no Terminal tab owns among them; a press selects it and shows it in the tab
    // that owns it, or takes it into the Terminal tab of the page on screen (the terminals store's
    // `showTerminal`). The rows are one group of the list's tree, drawn as the Repositories view
    // draws a change group: a group row headed Terminals with the fold's chevron and their number
    // as a badge at the right edge, then, while it is open, the rows one step further in. A press
    // on the group row folds it, and Left and Right do from the keyboard; the group folds under the
    // key `terminals` in the list's pane state (views/shared/card/pane-fold.ts). A folded group's
    // rows are not drawn.
    //
    // A row has the height of a session row: the kind's glyph, the title, its stamp at the right
    // and Stop, with the terminal's folder as its hover words.

    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import TreeItem from '$lib/ui/tree/TreeItem.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { stamp } from '$lib/state/shared/words/format';
    import {
        terminalLabel,
        type Terminal,
        type TerminalKind
    } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { TERMINALS_FOLD, groupRow, terminalRowId, terminalRowItems } from './session-list';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { useState } from '$lib/state/client/use';

    const {
        selection: { select, selected },
        terminals: { showTerminal }
    } = useState();
    const fold = usePaneFold();

    type Props = {
        entries: Terminal[];
        /** The tree the group's head and rows are rows of. */
        nav: TreeNav;
        now: number;
        arming: string;
        onstop: (entry: Terminal) => void | Promise<void>;
        onpinned: (entry: Terminal) => void;
    };

    let { entries, nav, now, arming, onstop, onpinned }: Props = $props();

    const open = $derived(fold.open(TERMINALS_FOLD));

    /** The glyph for one terminal kind. */
    function kindGlyph(kind: TerminalKind): string {
        if (kind === 'claude') return t('sessions.kind_claude_glyph');
        if (kind === 'codex') return t('sessions.kind_codex_glyph');
        if (kind === 'app') return t('sessions.kind_app_glyph');
        return t('sessions.kind_shell_glyph');
    }
</script>

{#snippet row(entry: Terminal)}
    {@const armed = arming === entry.id}
    {@const on = entry.id === selected()}
    <div class="row">
        <TreeItem
            label={terminalLabel(entry)}
            glyph={kindGlyph(entry.kind)}
            id={terminalRowId(entry.id)}
            {nav}
            level={3}
            depth={2}
            selected={on}
            title={entry.cwd}
            showActions={armed}
            onclick={() => {
                select(entry.id);
                showTerminal(entry.id);
            }}
        >
            {#snippet actions(reach: number)}
                <Menu
                    label={t('ui.row_menu')}
                    items={terminalRowItems()}
                    glyph={t('ui.pane_menu_glyph')}
                    compact
                    bare
                    inherit={on}
                    tabindex={reach}
                    placement="down"
                    align="right"
                    onpick={(picked) => {
                        if (picked === 'pinned') onpinned(entry);
                    }}
                />
                <!-- One button whose words follow the arming, so the element focused at the first
                     press is the one the second press confirms. A by-hand terminal has no Stop. -->
                {#if entry.byHand === undefined}
                    <ToolButton
                        bare
                        compact={!armed}
                        label={armed ? t('ui.confirm_stop') : t('sessions.stop_terminal')}
                        glyph={armed ? undefined : t('sessions.dismiss_glyph')}
                        title={armed ? t('sessions.confirm_stop') : t('sessions.stop_terminal')}
                        tabindex={reach}
                        onclick={() => void onstop(entry)}
                    >
                        {#if armed}
                            <span class="confirm">{t('ui.confirm_stop')}</span>
                        {/if}
                    </ToolButton>
                {/if}
            {/snippet}
            {#snippet end()}
                {stamp(entry.created, now)}
            {/snippet}
        </TreeItem>
    </div>
{/snippet}

{#if entries.length > 0}
    <div class="rows" data-terminal-group>
        <TreeItem
            label={t('sessions.terminals')}
            id={groupRow(TERMINALS_FOLD)}
            {nav}
            level={2}
            depth={1}
            expanded={open}
            count={entries.length}
            badge
            onclick={() => fold.toggle(TERMINALS_FOLD)}
        />
        {#if open}
            {#each entries as entry (entry.id)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render row(entry)}{/each}
        {/if}
    </div>
{/if}

<style>
    .rows {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* The same left edge as a session row, so the two kinds of row line up. */
    .row {
        min-width: 0;
        border-left: 2px solid transparent;
    }

    .confirm {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
</style>
