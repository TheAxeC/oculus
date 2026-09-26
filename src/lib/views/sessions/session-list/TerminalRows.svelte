<script lang="ts">
    // Layer 3, sessions view partial. Terminal rows live here because their stop and pin controls
    // change independently of transcript-backed session rows.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { stamp } from '$lib/state/shared/words/format';
    import type { Terminal, TerminalKind } from '$lib/state/sessions/terminals.svelte';
    import { t } from '$lib/state/shared/words/text';
    import { terminalRowItems } from './session-list';
    import { useState } from '$lib/state/client/use';

    const {
        selection: { select, selected }
    } = useState();

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
                <Tag label={entry.kind} />
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
    <section class="group" data-terminal-group>
        <h3 class="head">
            <span class="nm">{t('sessions.terminals')}</span>
            <span class="n">{entries.length}</span>
        </h3>
        {#each entries as entry (entry.id)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render row(entry)}{/each}
    </section>
{/if}

<style>
    .group {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* A side-bar section header, as the session groups above draw theirs. */
    .head {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 22px;
        margin: 0;
        padding: 0 8px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .head .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .head .n {
        margin-left: auto;
        font-family: var(--font-num);
        font-weight: 400;
    }

    .row .menu {
        display: flex;
        align-items: flex-start;
    }

    .hide .confirm {
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .row {
        display: flex;
        align-items: stretch;
        min-width: 0;
        border-left: 2px solid transparent;
    }

    .row:hover {
        background: var(--chip);
    }

    .row.on {
        background: var(--accent-bg);
    }

    .row.on .pick {
        color: var(--on-accent-bg, var(--ink));
    }

    .pick {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        min-width: 0;
        border: 0;
        background: none;
        color: var(--ink-txt, var(--ink));
        font: inherit;
        text-align: left;
        padding: 0 6px;
        cursor: pointer;
    }

    .pick:focus-visible,
    .hide:focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
    }

    /* Each line is one list row of VS Code's, 22 pixels. */
    .top,
    .meta {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 22px;
        min-width: 0;
        white-space: nowrap;
    }

    .top .nm {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: var(--fs-md);
    }

    .meta {
        overflow: hidden;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
        padding-left: 12px;
    }

    .meta .act {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .sep {
        opacity: 0.5;
    }

    .hide {
        flex: 0 0 auto;
        height: 22px;
        border: 0;
        background: none;
        color: var(--muted-txt, var(--muted));
        font: inherit;
        padding: 0 4px;
        cursor: pointer;
    }
</style>
