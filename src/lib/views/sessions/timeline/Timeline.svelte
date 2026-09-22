<script module lang="ts">
    // Layer 3, view registration. Timeline follows Transcript in the sessions flyout.
    import type { ViewRegistration } from '$lib/views/registry';
    export const registration: ViewRegistration = {
        id: 'timeline',
        label: 'sessions.view_timeline',
        glyph: 'sessions.timeline_glyph',
        group: 'sessions',
        order: 4
    };
</script>

<script lang="ts">
    // Layer 3, view. What the session did, newest last: a clock, what kind of thing it was, and the
    // thing itself. A path is shown as its basename with the whole of it in the tooltip; a prompt
    // keeps its words, because a slash in a prompt is not a path.
    //
    // Where it is scrolled to is the one piece of behaviour here. A fresh session, or a view just
    // opened, starts at the newest event, since that is what a timeline is read for. After that the
    // reader is left where they are: a push arriving while somebody is reading upwards must not
    // yank the column back down.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import Toolbar from '$lib/ui/frame/Toolbar.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { basename, clock, compactCount } from '$lib/state/words/format';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';
    import type { SessionEvent } from '$lib/state/client/selectors.svelte';
    import { asText } from '$lib/state/forms/schema';
    import { t } from '$lib/state/words/text';
    import type { ViewProps } from '$lib/views/registry';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { instanceLayoutState, pinInstance, unpinInstance },
        selectors: { sessionFor }
    } = useState();

    let { instance }: ViewProps = $props();

    /** The kinds with a hue of their own; anything else prints itself muted. */
    const TONES: Record<string, string> = {
        prompt: 'blue',
        tool: 'teal',
        edit: 'amber',
        turn: 'green',
        bust: 'red'
    };

    const record = $derived(sessionFor(instance.id));
    const panePin = $derived(pinnedSession(instanceLayoutState(instance.id)));
    const events = $derived(record?.timeline ?? []);

    let column: HTMLDivElement | undefined = $state();

    /** The session on screen. A change to it is what makes the column fresh and sends it to the foot. */
    let shown = '';

    $effect(() => {
        const id = record?.id ?? '';
        // The count is read here as well as the id, so a push on the session already shown re-runs
        // this too; then the column follows the newest event only if the reader was at the foot.
        const count = events.length;
        const box = column;
        if (box === undefined) return;
        const fresh = id !== shown;
        shown = id;
        if (fresh || (count > 0 && atFoot(box))) box.scrollTop = box.scrollHeight;
    });

    /** Pixels from the foot that still count as reading the newest event. */
    const SLACK = 24;

    function atFoot(box: HTMLDivElement): boolean {
        return box.scrollTop + box.clientHeight >= box.scrollHeight - SLACK;
    }

    /** The tag's word. The five known kinds have one; anything else says what it calls itself. */
    function kindLabel(kind: string): string {
        if (kind === 'prompt') return t('sessions.ev_k_prompt');
        if (kind === 'tool') return t('sessions.ev_k_tool');
        if (kind === 'edit') return t('sessions.ev_k_edit');
        if (kind === 'turn') return t('sessions.ev_k_turn');
        if (kind === 'bust') return t('sessions.ev_k_bust');
        return kind;
    }

    /** What the row reads: a turn as its length, a bust as its size, a path as its basename. */
    function text(event: SessionEvent): string {
        const held = asText(event.text);
        if (event.kind === 'turn') {
            return t('sessions.ev_turn', String(Math.round((Number(held) || 0) / 1000)));
        }
        if (event.kind === 'bust') {
            return t('sessions.ev_bust', compactCount(Number(held) || 0));
        }
        if (event.kind === 'tool' || event.kind === 'edit') return basename(held);
        return held;
    }

    /** The tooltip: the whole path, and nothing where the row already says everything it has. */
    function tip(event: SessionEvent): string | undefined {
        const held = asText(event.text);
        if (event.kind === 'turn' || event.kind === 'bust') return undefined;
        if (event.kind === 'tool' || event.kind === 'edit') {
            return basename(held) === held ? undefined : held;
        }
        return held;
    }

    /** Pin this timeline to what it shows, or return it to following the selection. */
    function togglePanePin(): void {
        if (panePin !== null) {
            unpinInstance(instance.id);
            return;
        }
        if (record !== null) {
            pinInstance(instance.id, record.id, record.title);
        }
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.view_timeline')}>
        {#if record !== null || panePin !== null}
            <ToolButton
                label={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                title={panePin === null ? t('sessions.pin_pane') : t('sessions.unpin_pane')}
                pressed={panePin !== null}
                onclick={togglePanePin}
            />
        {/if}
    </Toolbar>
{/snippet}

<Pane title={t('sessions.view_timeline')} toolbar={tools} tinted>
    <div class="timeline" bind:this={column} data-instance={instance.id}>
        {#if record === null}
            <Empty message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else if events.length === 0}
            <Empty message={t('sessions.tl_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            {#each events as event, at (`${at}:${event.ts ?? ''}`)}
                <div class="event">
                    <span class="ts">{clock(event.ts)}</span>
                    <Tag label={kindLabel(event.kind)} tone={TONES[event.kind]} />
                    <span class="tx" title={tip(event)}>{text(event)}</span>
                </div>
            {/each}
        {/if}
    </div>
</Pane>

<style>
    .timeline {
        display: flex;
        flex-direction: column;
        gap: 2px;
        height: 100%;
        overflow: auto;
    }

    .event {
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-width: 0;
        font-size: var(--fs-sm);
    }

    .ts {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }

    .tx {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* The terminal shape: a log, in the face a log is read in. */
    :global(body.rice) .timeline {
        font-family: var(--font-mono);
    }
</style>
