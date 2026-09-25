<script lang="ts">
    // Layer 3, sessions view partial. Workspace, area and session rows live here because their
    // selection, resume and dismissal controls change independently of the session-list frame.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Menu from '$lib/ui/menu/Menu.svelte';
    import { clock, modelShort, stamp } from '$lib/state/shared/words/format';
    import type { Area, GroupedSession, Workspace } from '$lib/state/client/selectors.svelte';
    import { asText } from '$lib/state/forms/schema';
    import { sessionCount } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { sessionRowItems } from './session-list';
    import { useState } from '$lib/state/client/use';

    const {
        selection: { select, selected }
    } = useState();

    type Props = {
        workspace: Workspace;
        now: number;
        armedResume: string;
        isHidden: (row: GroupedSession) => boolean;
        onresume: (row: GroupedSession) => void | Promise<void>;
        ondismiss: (row: GroupedSession) => void | Promise<void>;
        ontranscript: (row: GroupedSession) => void;
        onpinned: (row: GroupedSession) => void;
    };

    let {
        workspace,
        now,
        armedResume,
        isHidden,
        onresume,
        ondismiss,
        ontranscript,
        onpinned
    }: Props = $props();

    /** How many session rows the workspace's areas hold. */
    function count(): number {
        return sessionCount(workspace);
    }

    /** The hue of one session state dot. */
    function dotTone(row: GroupedSession): string {
        if (row.state === 'working') return 'green';
        if (row.state === 'idle') return 'amber';
        if (row.state === 'ended') return 'grey';
        return 'slate';
    }

    /** The custom property that colors one session state dot. */
    function dotStyle(row: GroupedSession): string {
        return `--tone: var(--c-${dotTone(row)})`;
    }

    /** What the registry says a live process is doing. */
    function liveLabel(row: GroupedSession): string {
        if (row.liveStatus === 'busy') return t('sessions.live_busy');
        if (row.liveStatus === 'idle') return t('sessions.live_idle');
        return row.liveStatus ?? '';
    }

    /** The newest timeline event, or the last prompt when there is no event. */
    function activity(row: GroupedSession): string {
        const event = row.timeline.length > 0 ? row.timeline[row.timeline.length - 1] : null;
        if (event === null) return row.lastPrompt;
        if (event.kind === 'turn') {
            return t(
                'sessions.activity_turn',
                String(Math.round((Number(event.text) || 0) / 1000))
            );
        }
        const text = asText(event.text);
        const at = text.lastIndexOf('/');
        return at < 0 ? text : text.slice(at + 1);
    }
</script>

{#snippet row(entry: GroupedSession)}
    {@const away = isHidden(entry)}
    <div class="row" class:on={entry.id === selected()} class:away>
        <button
            type="button"
            class="pick"
            title={t('sessions.select_tip')}
            onclick={() => select(entry.id)}
        >
            <span class="top">
                <span class="dot" class:observed={entry.kind === 'observed'} style={dotStyle(entry)}
                ></span>
                <Tag label={entry.tool} />
                <span class="nm">{entry.title}</span>
                {#if entry.pinned}
                    <span class="pin" title={t('sessions.pin_mark')}
                        ><Glyph name={t('project.card.pin_glyph')} /></span
                    >
                {/if}
                {#if entry.hook?.event === 'notification' && entry.hook.kind === 'permission_prompt'}
                    <span class="hook" title={entry.hook.message ?? ''}
                        ><Tag label={t('notify.permission_chip')} tone="amber" /></span
                    >
                {:else if entry.hook?.event === 'notification' && entry.hook.kind === 'idle_prompt'}
                    <Tag label={t('notify.idle_chip')} />
                {/if}
            </span>
            <span class="meta">
                {#if entry.live}
                    <span class="live">{liveLabel(entry)}</span>
                    <span class="sep">{t('sessions.meta_sep')}</span>
                {/if}
                <span class="mo">{modelShort(entry.model)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="ts">{stamp(entry.started, now)}</span>
                <span class="sep">{t('sessions.meta_sep')}</span>
                <span class="act">{activity(entry)}</span>
                {#if entry.hook?.event === 'stop'}
                    <span class="sep">{t('sessions.meta_sep')}</span>
                    <span class="stopped">{t('sessions.stopped_at', clock(entry.hook.at))}</span>
                {/if}
                {#each entry.secondaryAreas as area (area.key)}
                    <Tag label={area.short === '' ? area.key : area.short} />
                {/each}
            </span>
        </button>
        <div class="menu">
            <Menu
                label={t('ui.row_menu')}
                items={sessionRowItems(entry, armedResume)}
                glyph={t('ui.pane_menu_glyph')}
                compact
                placement="down"
                align="right"
                onpick={(id) => {
                    if (id === 'pinned') onpinned(entry);
                    if (id === 'resume') void onresume(entry);
                    if (id === 'transcript') ontranscript(entry);
                }}
            />
        </div>
        {#if !entry.live}
            <button
                type="button"
                class="hide"
                title={away ? t('sessions.restore_tip') : t('sessions.close_tip')}
                aria-label={away ? t('sessions.restore_tip') : t('sessions.close_tip')}
                onclick={() => ondismiss(entry)}
            >
                {#if away}
                    <Glyph name={t('sessions.restore_glyph')} />
                {:else}
                    <Glyph name={t('sessions.dismiss_glyph')} />
                {/if}
            </button>
        {/if}
    </div>
{/snippet}

{#snippet areaOf(area: Area)}
    <div class="area">
        <div class="area-h" title={area.full}>
            <span class="short">{area.short === '' ? area.key : area.short}</span>
            {#if !area.known}
                <span class="unknown">{t('sessions.area_unknown')}</span>
            {/if}
        </div>
        {#each area.sessions as entry (entry.id)}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render row(entry)}{/each}
    </div>
{/snippet}

<div class="ws">
    <div class="ws-h">
        <span class="nm">{workspace.name === '' ? workspace.key : workspace.name}</span>
        <span class="n">{count()}</span>
    </div>
    {#each workspace.areas as area (area.key)}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render areaOf(area)}{/each}
</div>

<style>
    .row .menu {
        display: flex;
        align-items: center;
    }
    .ws-h,
    .area-h {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .ws-h {
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
    .area-h .unknown {
        text-transform: none;
        letter-spacing: 0;
        opacity: 0.7;
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
    .row.away {
        opacity: 0.55;
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
    .top .pin,
    .top .hook {
        flex: none;
        font-size: var(--fs-3xs);
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
    .dot {
        flex: 0 0 auto;
        width: 8px;
        height: 8px;
        border-radius: var(--radius-pill);
        background: var(--tone);
    }
    .dot.observed {
        opacity: 0.45;
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
