<script lang="ts">
    // Layer 3, sessions view partial. Terminal rows live here because their stop and pin controls
    // change independently of transcript-backed session rows.

    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Menu from '$lib/ui/Menu.svelte';
    import { stamp } from '$lib/state/format';
    import { select, selected } from '$lib/state/selection.svelte';
    import type { Terminal, TerminalKind } from '$lib/state/terminals.svelte';
    import { t } from '$lib/state/text';
    import { terminalRowItems } from './session-list';

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
        return t('sessions.kind_shell_glyph');
    }

    /** The last segment of a terminal working directory. */
    function basename(path: string): string {
        const at = path.lastIndexOf('/');
        return at < 0 ? path : path.slice(at + 1);
    }
</script>

{#snippet row(entry: Terminal)}
    <div class="row" class:on={entry.id === selected()}>
        <button
            type="button"
            class="pick"
            title={t('sessions.select_tip')}
            onclick={() => select(entry.id)}
        >
            <span class="top"
                ><Glyph name={kindGlyph(entry.kind)} />
                <Chip label={entry.kind} />
                <span class="nm">{entry.name}</span></span
            >
            <span class="meta"
                ><span class="act">{basename(entry.cwd)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="ts">{stamp(entry.created, now)}</span></span
            >
        </button>
        <div class="menu">
            <Menu
                label={t('ui.row_menu')}
                items={terminalRowItems()}
                glyph={t('ui.pane_menu_glyph')}
                compact
                placement="down"
                align="right"
                onpick={(picked) => {
                    if (picked === 'pinned') onpinned(entry);
                }}
            />
        </div>
        <button
            type="button"
            class="hide"
            title={arming === entry.id ? t('sessions.confirm_stop') : t('sessions.stop_terminal')}
            aria-label={arming === entry.id ? t('ui.confirm_stop') : t('sessions.stop_terminal')}
            onclick={() => void onstop(entry)}
        >
            {#if arming === entry.id}
                <span class="confirm">{t('ui.confirm_stop')}</span>
            {:else}
                <Glyph name={t('sessions.dismiss_glyph')} />
            {/if}
        </button>
    </div>
{/snippet}

{#if entries.length > 0}
    <div class="ws">
        <div class="ws-h">
            <span class="nm">{t('sessions.terminals')}</span>
            <span class="n">{entries.length}</span>
        </div>
        <div class="area">
            {#each entries as entry (entry.id)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render row(entry)}{/each}
        </div>
    </div>
{/if}

<style>
    .row .menu {
        display: flex;
        align-items: center;
    }
    .ws-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--line);
        padding-bottom: 2px;
    }
    .ws-h .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .ws-h .n {
        margin-left: auto;
        font-family: var(--font-num);
    }
    .area {
        margin-top: 6px;
        padding-left: 6px;
    }
    .hide .confirm {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .row {
        display: flex;
        align-items: stretch;
        gap: 2px;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
    }
    .row.on {
        border-color: var(--accent);
    }
    .pick {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1 1 auto;
        min-width: 0;
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        text-align: left;
        padding: 4px 6px;
        cursor: pointer;
    }
    .pick:hover,
    .hide:hover {
        background: var(--chip);
    }
    .pick:focus-visible,
    .hide:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
    }
    .top,
    .meta {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
    }
    .top .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
    }
    .meta {
        flex-wrap: wrap;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .meta .act {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .meta .ts {
        font-size: var(--fs-xs);
    }
    .sep {
        opacity: 0.5;
    }
    .hide {
        flex: 0 0 auto;
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        padding: 0 4px;
        cursor: pointer;
    }
</style>
