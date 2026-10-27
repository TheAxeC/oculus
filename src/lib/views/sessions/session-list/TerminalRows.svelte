<script lang="ts">
    // Layer 3, sessions view partial. Terminal rows live here because their stop and own-pane
    // controls change independently of transcript-backed session rows. Every terminal oculus runs
    // is a row, those no Terminal tab owns among them; a press selects it and shows it in the tab
    // that owns it, or takes it into the Terminal tab of the page on screen (the terminals store's
    // `showTerminal`). The rows are the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte), headed Terminals with their count, and fold under the
    // key `terminals` in the list's pane state (views/shared/card/pane-fold.ts); a workspace
    // group's key is its folder's path, so the two never meet.

    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import RowButton from '$lib/ui/controls/RowButton.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import { nameOf } from '$lib/state/sources/explorer/file-type';
    import {
        terminalLabel,
        type Terminal,
        type TerminalKind
    } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { terminalRowItems } from './session-list';
    import { usePaneFold } from '$lib/views/shared/card/pane-fold';
    import { useState } from '$lib/state/client/use';

    const {
        selection: { select, selected },
        terminals: { showTerminal }
    } = useState();
    const fold = usePaneFold();

    /** The key the Terminals group folds under. */
    const TERMINALS_FOLD = 'terminals';

    type Props = {
        entries: Terminal[];
        now: number;
        arming: string;
        onstop: (entry: Terminal) => void | Promise<void>;
        onpinned: (entry: Terminal) => void;
    };

    let { entries, now, arming, onstop, onpinned }: Props = $props();

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
    <div class="row" class:on={entry.id === selected()} class:armed>
        <RowButton
            title={t('sessions.select_tip')}
            selected={entry.id === selected()}
            onclick={() => {
                select(entry.id);
                showTerminal(entry.id);
            }}
        >
            <span class="top"
                ><Glyph name={kindGlyph(entry.kind)} />
                <Tag label={entry.kind} />
                <span class="nm">{terminalLabel(entry)}</span></span
            >
            <span class="meta"
                ><span class="act">{nameOf(entry.cwd)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="ts">{stamp(entry.created, now)}</span></span
            >
        </RowButton>
        <div class="actions">
            <Menu
                label={t('ui.row_menu')}
                items={terminalRowItems()}
                glyph={t('ui.pane_menu_glyph')}
                compact
                bare
                inherit={entry.id === selected()}
                placement="down"
                align="right"
                onpick={(picked) => {
                    if (picked === 'pinned') onpinned(entry);
                }}
            />
            <!-- One button whose words follow the arming, so the element focused at the first press
                 is the one the second press confirms. -->
            <ToolButton
                bare
                compact={!armed}
                label={armed ? t('ui.confirm_stop') : t('sessions.stop_terminal')}
                glyph={armed ? undefined : t('sessions.dismiss_glyph')}
                title={armed ? t('sessions.confirm_stop') : t('sessions.stop_terminal')}
                onclick={() => void onstop(entry)}
            >
                {#if armed}
                    <span class="confirm">{t('ui.confirm_stop')}</span>
                {/if}
            </ToolButton>
        </div>
    </div>
{/snippet}

{#if entries.length > 0}
    <GroupHead
        data-terminal-group
        label={t('sessions.terminals')}
        count={entries.length}
        open={fold.open(TERMINALS_FOLD)}
        ontoggle={() => fold.toggle(TERMINALS_FOLD)}
    >
        <div class="rows">
            {#each entries as entry (entry.id)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render row(entry)}{/each}
        </div>
    </GroupHead>
{/if}

<style>
    .rows {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* The row's controls are drawn while the pointer is on the row, the focus is inside it, it is
       the selected row or its Stop is armed, and always on a screen that does not hover. */
    .row {
        --row-reveal: 0;
        display: flex;
        align-items: stretch;
        min-width: 0;
        border-left: 2px solid transparent;
    }

    .row:hover,
    .row:focus-within,
    .row.on,
    .row.armed {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .row {
            --row-reveal: 1;
        }
    }

    .actions {
        display: flex;
        align-items: flex-start;
        padding-top: 1px;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }

    .confirm {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .row:hover {
        background: var(--chip);
    }

    .row.on {
        background: var(--accent-bg);
        color: var(--on-accent-bg, var(--ink));
    }

    .row.on .meta {
        color: inherit;
    }

    .top,
    .meta {
        min-width: 0;
        white-space: nowrap;
    }

    /* The title line of VS Code's agent session item, as the session rows draw it: 18 px, 3px
       below the row's top edge. */
    .top {
        display: flex;
        align-items: center;
        gap: 4px;
        height: calc(18px * var(--text-scale, 1));
        margin-top: 3px;
    }

    .top .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--fs-sm);
    }

    /* The details line: 16 px, 3px above the row's bottom edge, cut with one ellipsis where the
       pane ends. */
    .meta {
        display: block;
        height: calc(16px * var(--text-scale, 1));
        margin-bottom: 3px;
        padding-left: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: calc(16px * var(--text-scale, 1));
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }

    .sep {
        opacity: 0.5;
    }
</style>
